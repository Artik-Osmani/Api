#!/usr/bin/env node
/** New UX regression journeys. Optional QA packages, never imported by the website. */
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
const { chromium } = await import(process.env.FH_PLAYWRIGHT_MODULE ?? "playwright");
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);
const base = process.env.FH_BASE_URL ?? "http://localhost:5047";
const output = process.env.FH_OUTPUT_DIR ?? "output/upgrade-v2";
mkdirSync(output, { recursive: true });
const checks = [], errors = [], violations = [], motion = [];
const axe = readFileSync(process.env.FH_AXE_SOURCE, "utf8");
let visits = 0, failure = null;
const id = "e14c1d68-0fa4-44bc-b17b-4b248a31e8fd";
page.on("pageerror", error => errors.push(error.message));
async function check(name, work) {
  await work(); checks.push(name); console.log(`PASS ${name}`);
}
async function visit(route = "/explore") {
  await page.goto(`${base}/?v2=${++visits}#${route}`);
  await page.waitForFunction(() => document.querySelector("main h1") && !document.querySelector('main[aria-busy="true"]'));
  await page.evaluate(() => document.fonts.ready);
}
async function settled() {
  await page.waitForFunction(() => !document.querySelector('.results-grid[aria-busy="true"]'));
}
async function closed() { await page.waitForFunction(() => !document.querySelector("dialog[open]")); }
async function audit(name) {
  await page.waitForTimeout(400);
  await page.evaluate(axe);
  const found = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } }));
  for (const item of found.violations) violations.push({ name, id: item.id, impact: item.impact, nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name}: overflow`);
  await page.screenshot({ path: `${output}/${name}.png` });
}

try {
  await context.request.post(`${base}/v1/system/reset`);
  await visit();
  await check("Eight initial stays and collection starts in the desktop viewport", async () => {
    assert.equal(await page.locator(".results-grid .stay-card-item").count(), 8);
    assert.ok(await page.locator(".results-grid").evaluate(node => node.getBoundingClientRect().top < innerHeight));
  });
  await check("Show more appends 8, then 2 without duplicate stays", async () => {
    await page.locator('[data-action="show-more"]').click(); await settled();
    assert.equal(await page.locator(".results-grid .stay-card-item").count(), 16);
    await page.locator('[data-action="show-more"]').click(); await settled();
    const ids = await page.locator(".results-grid .heart-btn").evaluateAll(nodes => nodes.map(node => node.dataset.listing));
    assert.equal(ids.length, 18); assert.equal(new Set(ids).size, 18);
  });
  await check("Back navigation restores all appended cards from matching cached search", async () => {
    await page.locator(".results-grid .stay-card").first().click();
    await page.waitForFunction(() => document.documentElement.dataset.route?.startsWith("/stay/"));
    await page.goBack();
    await page.waitForFunction(() => document.documentElement.dataset.route === "/explore");
    assert.equal(await page.locator(".results-grid .stay-card-item").count(), 18);
  });
  await check("Destination shortcut performs a real Prizren search and updates selected state", async () => {
    const response = page.waitForResponse(response => response.url().endsWith("/v1/listings/search") && response.status() === 200);
    await page.locator('[data-destination="Prizren"]').click();
    const result = await (await response).json(); await settled();
    assert.equal(result.appliedFilters.query, "Prizren"); assert.equal(result.totalRecords, 2);
    assert.equal(await page.locator('[data-destination="Prizren"]').getAttribute("aria-pressed"), "true");
    await audit("destination-filtered");
    await page.locator('[data-destination="Prizren"]').click(); await settled();
  });
  await check("Invalid budget stays in the sheet with a readable field error", async () => {
    await page.locator('[data-action="open-filters"]').click();
    await page.locator("#filter-minPrice").fill("120");
    await page.locator("#filter-maxPrice").fill("50");
    await page.getByRole("button", { name: "Apply filters", exact: true }).click();
    assert.equal(await page.locator("dialog[open]").count(), 1);
    assert.match(await page.locator("#filter-error").innerText(), /Maximum price/);
  });
  await check("Advanced filters send actual price, amenity, room, rating and instant-book fields", async () => {
    await page.locator("#filter-minPrice").fill("40");
    await page.locator("#filter-maxPrice").fill("90");
    await page.locator("#filter-maxPrice").blur();
    assert.equal(await page.locator("#filter-maxPrice").getAttribute("aria-invalid"), "false");
    await page.locator("#filter-minBedrooms").fill("1");
    await page.locator("#filter-minRating").selectOption("4");
    await page.locator('input[name="amenities"][value="wifi"]').check();
    await page.locator('input[name="instantBookOnly"]').check();
    await audit("advanced-filters-sheet");
    const response = page.waitForResponse(response => response.url().endsWith("/v1/listings/search") && response.status() === 200);
    await page.getByRole("button", { name: "Apply filters", exact: true }).click();
    const actual = await response;
    const request = actual.request().postDataJSON();
    assert.equal(request.minPrice, 40); assert.equal(request.maxPrice, 90);
    assert.equal(request.minBedrooms, 1); assert.equal(request.minRating, 4);
    assert.equal(request.instantBookOnly, true); assert.deepEqual(request.requiredAmenities, ["wifi"]);
    await closed(); await settled();
    const result = await actual.json(); assert.ok(result.results.length > 0);
    assert.ok(result.results.every(stay => stay.pricing.baseNightlyRate >= 40 && stay.pricing.baseNightlyRate <= 90 && stay.instantBookEnabled && stay.starRating >= 4 && stay.amenities.includes("wifi")));
    await audit("advanced-filter-results");
  });
  await check("Removing one active chip preserves other API constraints", async () => {
    const response = page.waitForResponse(response => response.url().endsWith("/v1/listings/search") && response.status() === 200);
    await page.getByRole("button", { name: "Remove Wi-Fi filter", exact: true }).click();
    const body = (await response).request().postDataJSON();
    assert.deepEqual(body.requiredAmenities, []); assert.equal(body.maxPrice, 90); assert.equal(body.instantBookOnly, true);
    await settled();
  });
  await check("Cancelled filter draft does not change results; Clear all resets both controls and state", async () => {
    await page.locator('[data-action="open-filters"]').click();
    await page.locator("#filter-maxPrice").fill("200");
    await page.keyboard.press("Escape"); await closed();
    assert.ok((await page.locator(".active-filters").innerText()).includes("90"));
    await page.getByRole("button", { name: "Clear all", exact: true }).click(); await settled();
    assert.equal(await page.locator('[data-action="open-filters"]').innerText(), "Filters");
    assert.equal(await page.locator(".results-grid .stay-card-item").count(), 8);
    assert.equal(await page.locator('[data-category=""]').getAttribute("aria-pressed"), "true");
  });
  await check("Search dates and guests survive advanced filtering, Stay and the booking sheet", async () => {
    const dates = await page.evaluate(() => {
      const start = new Date(); start.setUTCDate(start.getUTCDate() + 70);
      const end = new Date(start); end.setUTCDate(end.getUTCDate() + 7);
      return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
    });
    await page.locator("#search-checkin").fill(dates[0]); await page.locator("#search-checkout").fill(dates[1]);
    await page.locator('[data-action="desktop-guests-plus"]').click();
    await page.locator('[data-action="desktop-guests-plus"]').click();
    await page.locator(".search-submit button").click(); await settled();
    await page.locator('[data-action="open-filters"]').click(); await page.locator("#filter-maxPrice").fill("160");
    await page.getByRole("button", { name: "Apply filters", exact: true }).click(); await closed(); await settled();
    assert.equal(await page.locator("#search-checkin").inputValue(), dates[0]);
    await page.locator(".results-grid .stay-card").first().click();
    await page.waitForFunction(() => document.documentElement.dataset.route?.startsWith("/stay/"));
    assert.equal(await page.locator("#rail-checkin").inputValue(), dates[0]); assert.equal(await page.locator("#rail-checkout").inputValue(), dates[1]);
    await page.locator('[data-action="reserve"]:visible').click();
    assert.equal(await page.locator("#booking-checkin").inputValue(), dates[0]); assert.equal(await page.locator('[data-role="guests-count"]').innerText(), "3");
    await page.keyboard.press("Escape"); await closed();
    await page.locator('.primary-nav [data-nav="explore"]').click();
    await page.waitForFunction(() => document.documentElement.dataset.route === "/explore");
    await page.getByRole("button", { name: "Clear all", exact: true }).click(); await settled();
  });
  await check("Failed refresh preserves successful cards and offers a working retry", async () => {
    const before = await page.locator(".results-grid .stay-card-item").count();
    await page.route("**/v1/listings/search", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ code: "INTERNAL_SERVER_ERROR", message: "Test failure", traceId: "qa" }) }));
    await page.locator('[data-category="cabin"]').click(); await settled();
    await page.getByText("Showing the last loaded stays. Try again to apply these filters.", { exact: true }).waitFor();
    assert.equal(await page.locator(".results-grid .stay-card-item").count(), before);
    await page.unroute("**/v1/listings/search");
    await page.getByRole("button", { name: "Try again", exact: true }).click(); await settled();
    assert.equal(await page.locator(".results-grid .stay-card-item").count(), 3);
    assert.equal(await page.locator(".panel-error").count(), 0);
  });
  await check("Each desktop gallery tile opens its own image and arrow keys advance correctly", async () => {
    await visit(`/stay/${id}`);
    for (const index of [0, 1, 2]) {
      await page.locator(`.stay-gallery [data-photo="${index}"]`).first().click();
      assert.equal(await page.locator('[data-role="lightbox-counter"]').innerText(), `${index + 1} / 3`);
      if (index === 2) {
        assert.match(await page.locator('[data-role="lightbox-image"]').getAttribute("src"), /-d2.webp$/);
        await page.keyboard.press("ArrowLeft");
        assert.equal(await page.locator('[data-role="lightbox-counter"]').innerText(), "2 / 3");
      }
      await page.keyboard.press("Escape"); await closed();
    }
  });
  await check("Double Save serializes one mutation and reconciles the visible heart with the server", async () => {
    let writes = 0;
    const listener = request => { if (request.url().endsWith(`/v1/favorites/${id}`) && request.method() === "POST") writes++; };
    page.on("request", listener);
    const button = page.locator(`.stay-save[data-listing="${id}"]`);
    const before = await button.getAttribute("aria-pressed");
    await button.evaluate(node => { node.click(); node.click(); });
    await page.waitForFunction(id => !document.querySelector(`.stay-save[data-listing="${id}"]`)?.disabled, id);
    assert.equal(writes, 1);
    const favorites = await (await context.request.get(`${base}/v1/favorites`)).json();
    assert.equal(await button.getAttribute("aria-pressed"), String(favorites.some(stay => stay.id === id)));
    assert.notEqual(await button.getAttribute("aria-pressed"), before);
    page.off("request", listener);
  });
  await check("An obsolete slow Stay request cannot overwrite a later Saved navigation", async () => {
    const target = "d026d4f6-d073-5c03-b1f9-27d89ea8e094";
    await visit("/hosts");
    await page.route(`**/v1/listings/${target}`, async route => {
      await new Promise(resolve => setTimeout(resolve, 850)); await route.continue();
    });
    await page.evaluate(target => { location.hash = `/stay/${target}`; }, target);
    await page.waitForTimeout(80);
    await page.locator('.primary-nav [data-nav="saved"]').click();
    await page.waitForFunction(() => document.documentElement.dataset.route === "/saved");
    await page.waitForTimeout(1000);
    assert.equal(await page.locator("main h1").innerText(), "Saved stays");
    assert.match(await page.title(), /Saved/);
    assert.equal(await page.locator('.primary-nav [data-nav="saved"]').getAttribute("aria-current"), "page");
    await page.unroute(`**/v1/listings/${target}`);
  });
  await check("Dialog exit has a real native animation and reduced motion closes immediately", async () => {
    await visit();
    await page.locator('[data-action="open-filters"]').click();
    await page.waitForTimeout(350);
    const exit = await page.locator('[aria-label="Close filters"]').evaluate(node => {
      const dialog = node.closest("dialog"); node.click();
      return { open: dialog.open, animations: dialog.getAnimations().map(animation => animation.effect.getTiming().duration) };
    });
    assert.equal(exit.open, true); assert.ok(exit.animations.includes(160)); motion.push({ kind: "dialog-exit", ...exit });
    await closed();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator('[data-action="open-filters"]').click();
    const immediate = await page.locator('[aria-label="Close filters"]').evaluate(node => { const dialog = node.closest("dialog"); node.click(); return dialog.open; });
    assert.equal(immediate, false); motion.push({ kind: "reduced-motion-exit", open: immediate });
    await page.emulateMedia({ reducedMotion: "no-preference" });
  });
  await check("Mobile gallery arrows update the visible photo count", async () => {
    await page.setViewportSize({ width: 375, height: 844 });
    await visit(`/stay/${id}`);
    await page.locator('[data-action="gallery-next"]').click();
    await page.waitForFunction(() => document.querySelector(".gallery-counter")?.textContent === "2 / 3");
    await audit("mobile-gallery-second-photo");
  });
  await check("A partial mobile calendar selection clears the old total and disables Reserve", async () => {
    await page.waitForFunction(() => !document.querySelector('[data-action="mobile-reserve"]').disabled);
    await page.locator(".calendar-grid button:not(:disabled)").first().click();
    assert.equal(await page.locator('[data-action="mobile-reserve"]').isDisabled(), true);
    assert.equal(await page.locator('[data-role="mobile-total"]').innerText(), "Choose dates");
    await page.waitForTimeout(500);
    assert.equal(await page.locator('[data-action="mobile-reserve"]').isDisabled(), true);
  });
  for (const width of [1440, 1024, 768, 375, 320]) {
    for (const theme of ["light", "dark"]) {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: width === 320 ? "reduce" : "no-preference" });
      await visit(); await audit(`explore-${theme}-${width}`);
      await page.locator('[data-action="open-filters"]').click(); await audit(`filters-${theme}-${width}`);
      await page.keyboard.press("Escape"); await closed();
    }
  }
  assert.equal(errors.length, 0, errors.join("\n"));
  assert.equal(violations.length, 0, JSON.stringify(violations));
} catch (error) {
  failure = error.stack; await page.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  throw error;
} finally {
  const report = { generatedAt: new Date().toISOString(), passed: checks.length, checks, errors, violations, motion, failure };
  writeFileSync(`${output}/ux-journeys.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: checks.length, errors, violations, failure }, null, 2));
  await context.request.post(`${base}/v1/system/reset`).catch(() => {});
  await context.close(); await browser.close();
}
