#!/usr/bin/env node
/** Optional QA tools only, never loaded by the app. See docs/VERIFICATION.md for setup. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";

const { chromium } = await import(process.env.FH_PLAYWRIGHT_MODULE ?? "playwright");
const axeSource = readFileSync(process.env.FH_AXE_SOURCE, "utf8");
const base = process.env.FH_BASE_URL ?? "http://localhost:5047";
const output = process.env.FH_OUTPUT_DIR ?? "output/playwright";
mkdirSync(output, { recursive: true });
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const context = await browser.newContext();
const page = await context.newPage();
page.setDefaultTimeout(15_000);
page.setDefaultNavigationTimeout(15_000);
const errors = [];
const externalRequests = [];
page.on("pageerror", error => errors.push(error.message));
page.on("request", request => {
  if (!request.url().startsWith(base) && /^https?:/.test(request.url())) externalRequests.push(request.url());
});
const id = "e14c1d68-0fa4-44bc-b17b-4b248a31e8fd";
const host = "9a78cd9c-c9c7-43cf-bc82-01967fa7e93b";
const routes = { explore: "/explore", stay: `/stay/${id}`, trips: "/trips", saved: "/saved", hosts: "/hosts", host: `/hosts/${host}`, contact: "/contact", notfound: "/missing" };
const reports = [];
const checks = [];
let visits = 0;
const wait = ms => page.waitForTimeout(ms);
async function visit(route) {
  await page.goto(`${base}/?audit=${++visits}#${route}`);
  await page.locator("main h1").waitFor();
  await page.waitForFunction(() => !document.querySelector('main[aria-busy="true"]'));
  await page.evaluate(() => document.fonts.ready);
  await wait(700);
}
async function audit(name) {
  await page.evaluate(axeSource);
  const result = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } }));
  const violations = result.violations.map(item => ({ id: item.id, impact: item.impact, help: item.help, nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) }));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  reports.push({ name, violations, overflow, passes: result.passes.length });
  await page.screenshot({ path: `${output}/${name}.png` });
}
async function openBooking() {
  const reserve = page.locator('[data-action="reserve"]:visible, [data-action="mobile-reserve"]:visible').first();
  await reserve.click();
  await page.locator('dialog[open] #booking-checkin').waitFor();
  await page.waitForFunction(() => !document.querySelector('dialog[open] [data-action="booking-next"]').disabled);
}
async function setDates(offset, nights) {
  const dates = await page.evaluate(({ offset, nights }) => {
    const first = new Date(); first.setUTCDate(first.getUTCDate() + offset);
    const last = new Date(first); last.setUTCDate(last.getUTCDate() + nights);
    return [first.toISOString().slice(0, 10), last.toISOString().slice(0, 10)];
  }, { offset, nights });
  await page.locator("#booking-checkin").fill(dates[0]);
  await page.locator("#booking-checkout").fill(dates[1]);
  await page.locator("#booking-checkout").blur();
  await wait(650);
  return dates;
}

try {
  await context.request.post(`${base}/v1/system/reset`);
  for (const theme of process.argv.includes("--journeys-only") ? [] : ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: theme });
    for (const width of [1440, 1024, 768, 375]) {
      await page.setViewportSize({ width, height: 900 });
      for (const name of ["explore", "stay", "trips", "saved", "hosts"]) {
        await visit(routes[name]);
        await audit(`${name}-${theme}-${width}`);
        if (name === "stay") {
          await openBooking();
          await audit(`booking-${theme}-${width}`);
          await page.keyboard.press("Escape");
        }
      }
    }
  }
  await page.setViewportSize({ width: 320, height: 844 });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  for (const [name, route] of Object.entries(routes)) {
    await visit(route);
    await audit(`${name}-reduced-320`);
  }
  checks.push("Eight routes at 320px with reduced motion");

  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(routes.stay);
  const day = page.locator('.calendar-grid button:not(:disabled)').first();
  await day.focus();
  const original = await day.getAttribute("data-date");
  await page.keyboard.press("PageDown");
  await wait(800);
  const focused = await page.evaluate(() => document.activeElement.dataset.date);
  assert.ok(focused && focused.slice(0, 7) !== original.slice(0, 7), "Calendar must retain focus in the next month");
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement.dataset.date), focused, "Selecting a day must retain focus");
  checks.push("Calendar PageDown and Enter retain focus after asynchronous month rendering");

  await visit(routes.explore);
  await page.locator(".skip-link").focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement.id), "main");
  assert.match(page.url(), /#\/explore$/);
  checks.push("Skip link moves focus without changing the route");
  await page.locator("#search-where").fill("prizren");
  await page.locator('.search-submit button').click();
  await page.waitForFunction(() => document.querySelector(".results-count")?.textContent.startsWith("2 stays"));
  const heart = page.locator('.heart-btn[aria-pressed="false"]').first();
  const savedId = await heart.getAttribute("data-listing");
  await heart.click();
  await page.locator('[data-category="cabin"]').click();
  await page.locator(".empty-state").waitFor();
  await page.locator('.primary-nav [data-nav="saved"]').click();
  await page.locator(`main .heart-btn[data-listing="${savedId}"]`).waitFor();
  checks.push("Search Prizren returns two stays; saved stay survives a filter excluding it");

  await visit(routes.trips);
  const message = page.getByRole("button", { name: "Message host", exact: true }).first();
  await message.click();
  await page.locator("#chat-input").fill("A message from the browser verification.");
  await page.locator("#chat-input").press("Enter");
  await page.getByText("A message from the browser verification.", { exact: true }).waitFor();
  await audit("chat-keyboard");
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("dialog[open]").count(), 0);
  assert.equal(await message.evaluate(node => node === document.activeElement), true);
  checks.push("Message host sends with Enter; Escape closes and restores focus");
  await page.getByRole("button", { name: "Cancel booking", exact: true }).first().click();
  await page.locator("#cancel-reason").selectOption("Plans changed");
  await page.locator("dialog[open]").getByRole("button", { name: "Cancel booking", exact: true }).click();
  await page.waitForFunction(() => !document.querySelector("dialog[open]"));
  checks.push("Cancellation dialog submits a reason and refreshes Trips");

  await visit(routes.stay);
  await openBooking();
  await setDates(60, 1);
  assert.equal(await page.locator('[data-action="booking-next"]').isDisabled(), true);
  assert.match(await page.locator('dialog[open]').innerText(), /at least 2 nights/);
  checks.push("One-night booking blocked with inline minimum stay error");
  await setDates(14, 3);
  assert.equal(await page.locator('[data-action="booking-next"]').isDisabled(), true);
  assert.match(await page.locator('dialog[open]').innerText(), /no longer available/);
  checks.push("Booked range blocked with inline conflict error");
  await setDates(60, 7);
  await page.waitForFunction(() => !document.querySelector('[data-action="booking-next"]').disabled);
  await page.locator('[data-action="booking-next"]').click();
  for (const [selector, value] of Object.entries({ "#booking-first": "Lena", "#booking-last": "Hoffmann", "#booking-email": "lena@example.com", "#booking-phone": "+38344123456" })) await page.locator(selector).fill(value);
  await audit("booking-guest-details");
  await page.locator('[data-action="booking-next"]').click();
  await page.locator("#booking-rules").check();
  await audit("booking-review-weekly");
  const before = await (await context.request.get(`${base}/v1/reservations`)).json();
  const createdPromise = page.waitForResponse(response => response.url() === `${base}/v1/reservations` && response.request().method() === "POST");
  await page.locator('[data-action="booking-next"]').evaluate(button => { button.click(); button.click(); });
  const created = await (await createdPromise).json();
  await page.locator('[data-panel="4"]:visible').waitFor();
  const after = await (await context.request.get(`${base}/v1/reservations`)).json();
  assert.equal(after.length, before.length + 1);
  assert.ok(created.pricingSummary.discountAmount > 0);
  await audit("booking-confirmed-weekly");
  checks.push(`Weekly booking: one reservation from double click, discount ${created.pricingSummary.discountAmount}, total ${created.pricingSummary.totalAmount}`);

  await visit(routes.stay);
  const payload = '<img src=x onerror="window.__xss=true"> A literal review for future guests.';
  const reviewResponse = await context.request.post(`${base}/v1/listings/${id}/reviews`, { data: { authorName: "QA Reviewer", rating: 1, comment: payload } });
  assert.equal(reviewResponse.status(), 201);
  await visit(routes.stay);
  assert.ok(await page.getByText(payload, { exact: true }).count());
  assert.equal(await page.evaluate(() => Boolean(window.__xss)), false);
  checks.push("One-star review accepted, XSS payload rendered as literal text");

  // External network is blocked while localhost remains available, matching the offline demo brief.
  await context.route(/^https?:\/\//, route => route.request().url().startsWith(base) ? route.continue() : route.abort());
  await visit(routes.explore);
  assert.equal(externalRequests.length, 0);
  checks.push("Cold reload with external networking blocked: shell, fonts and local imagery load");
  assert.equal(errors.length, 0, errors.join("\n"));
} finally {
  const result = { generatedAt: new Date().toISOString(), reports, checks, errors, externalRequests };
  writeFileSync(`${output}/browser-audit.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ reports: reports.length, violations: reports.reduce((sum, report) => sum + report.violations.length, 0), overflows: reports.filter(report => report.overflow).length, checks, errors, externalRequests }, null, 2));
  await context.request.post(`${base}/v1/system/reset`);
  await context.close();
  await browser.close();
}
assert.equal(reports.filter(report => report.overflow).length, 0, "Viewport overflow");
assert.equal(reports.reduce((sum, report) => sum + report.violations.length, 0), 0, "Accessibility violations");
