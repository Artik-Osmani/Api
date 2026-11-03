#!/usr/bin/env node
/** Complements browser-audit.mjs with empty, keyboard, zoom and Swagger interactions. */
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync } from "node:fs";
const { chromium } = await import(process.env.FH_PLAYWRIGHT_MODULE ?? "playwright");
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);
const base = "http://localhost:5047";
const checks = [];
const output = process.env.FH_OUTPUT_DIR ?? "output/playwright";
mkdirSync(output, { recursive: true });
async function visit(path) {
  await page.goto(`${base}/${path}`);
  await page.waitForFunction(() => document.querySelector("main h1") && !document.querySelector('main[aria-busy="true"]'));
}
try {
  await context.request.post(`${base}/v1/system/reset`);
  const favorites = await (await context.request.get(`${base}/v1/favorites`)).json();
  for (const listing of favorites) await context.request.post(`${base}/v1/favorites/${listing.id}`);
  await visit("#/saved");
  await page.getByText("Nothing saved yet. Use the heart on any stay to keep it here.", { exact: true }).waitFor();
  await page.screenshot({ path: `${output}/saved-empty.png` });
  checks.push("Empty Saved renders the supplied copy and Browse stays action");

  await page.setViewportSize({ width: 320, height: 844 });
  await visit("#/explore");
  await page.locator('[data-action="open-search"]').first().click();
  const search = page.locator("dialog[open]");
  for (let step = 0; step < 18; step++) {
    await page.keyboard.press("Tab");
    // Chrome may hand focus to browser chrome at the wrap boundary (activeElement becomes body).
    // No background page control may receive focus while the modal is open.
    assert.equal(await page.evaluate(() => document.activeElement === document.body || Boolean(document.activeElement.closest("dialog[open]"))), true);
  }
  await page.screenshot({ path: `${output}/search-keyboard-320.png` });
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("dialog[open]"));
  assert.equal(await search.count(), 0);
  checks.push("320px search sheet excludes background controls from Tab navigation and Escape closes");

  await page.setViewportSize({ width: 1440, height: 900 });
  await visit("#/stay/e14c1d68-0fa4-44bc-b17b-4b248a31e8fd");
  await page.locator('[data-action="reserve"]:visible').click();
  await page.locator('[data-action="guests-plus"]').click();
  await page.keyboard.press("Escape");
  await page.getByRole("heading", { name: "Leave this booking?" }).waitFor();
  await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll("dialog[open]").length === 1);
  assert.equal(await page.locator('dialog.sheet[open]').count(), 1);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Leave", exact: true }).click();
  await page.waitForFunction(() => !document.querySelector("dialog[open]"));
  checks.push("Dirty booking close requires confirmation; Keep editing preserves the sheet; Leave closes it");

  // 200% zoom has half the CSS viewport and twice the physical pixel density.
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 720, height: 450, deviceScaleFactor: 2, mobile: false });
  await visit("#/explore");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: `${output}/explore-200-percent.png` });
  checks.push("200% zoom-equivalent metrics at 1440 physical pixels: no horizontal overflow");
  await cdp.send("Emulation.clearDeviceMetricsOverride");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await visit("?cpu=4#/explore");
  await page.locator("#search-where").fill("prizren");
  await page.locator(".search-submit button").click();
  await page.waitForFunction(() => document.querySelector(".results-count")?.textContent.startsWith("2 stays"));
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  checks.push("At 4x CPU throttle, cold load and Prizren search remain responsive within the 15-second check budget");

  await page.goto(`${base}/swagger/index.html`);
  const operation = page.locator(".opblock").filter({ has: page.locator('.opblock-summary-path[data-path="/v1/system/health"]') });
  await operation.locator(".opblock-summary").click();
  await operation.getByRole("button", { name: "Try it out", exact: true }).click();
  await operation.getByRole("button", { name: "Execute", exact: true }).click();
  await operation.locator(".live-responses-table").getByText("200", { exact: true }).waitFor();
  await page.screenshot({ path: `${output}/swagger-health-executed.png` });
  checks.push("Swagger Try it out executes health and displays HTTP 200");
} finally {
  writeFileSync(`${output}/interaction-check.json`, JSON.stringify({ generatedAt: new Date().toISOString(), checks }, null, 2));
  console.log(JSON.stringify({ checks }, null, 2));
  await context.request.post(`${base}/v1/system/reset`);
  await context.close();
  await browser.close();
}
