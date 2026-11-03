#!/usr/bin/env node
/** Optional real-browser recording. Requires Playwright's FFmpeg QA helper. */
import { mkdirSync, writeFileSync } from "node:fs";
const { chromium } = await import(process.env.FH_PLAYWRIGHT_MODULE ?? "playwright");
const output = "output/upgrade-v2";
mkdirSync(`${output}/video`, { recursive: true });
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const context = await browser.newContext({ viewport: { width: 1440, height: 900 },
  recordVideo: { dir: `${output}/video`, size: { width: 1440, height: 900 } } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);
const video = page.video();
const steps = [];
let failure = null;
try {
  await context.request.post("http://localhost:5047/v1/system/reset");
  await page.goto("http://localhost:5047/?record=v2#/explore");
  await page.waitForFunction(() => document.documentElement.dataset.route === "/explore");
  await page.waitForTimeout(900); steps.push("Hero entrance and local destination imagery");
  await page.locator('[data-destination="Prizren"]').click();
  await page.waitForFunction(() => !document.querySelector('.results-grid[aria-busy="true"]'));
  await page.waitForTimeout(650); steps.push("Destination result update");
  await page.locator('[data-action="open-filters"]').click();
  await page.locator("#filter-maxPrice").fill("100");
  await page.locator('input[name="amenities"][value="wifi"]').check();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Apply filters", exact: true }).click();
  await page.waitForFunction(() => !document.querySelector("dialog[open]"));
  await page.waitForTimeout(500); steps.push("Filter sheet entrance, selection and animated exit");
  await page.locator(".results-grid .heart-btn").first().click();
  await page.waitForTimeout(500); steps.push("Save acknowledgement");
  await page.locator(".results-grid .stay-card").first().click();
  await page.waitForFunction(() => document.documentElement.dataset.route?.startsWith("/stay/"));
  await page.waitForTimeout(700); steps.push("Shared image transition into Stay");
  await page.locator('.stay-gallery [data-photo="1"]').click();
  await page.waitForTimeout(500);
  await page.keyboard.press("ArrowRight"); await page.waitForTimeout(400);
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("dialog[open]")); steps.push("Gallery image selection and keyboard navigation");
  await page.locator('[data-action="reserve"]:visible').click();
  await page.waitForFunction(() => !document.querySelector('[data-action="booking-next"]').disabled);
  await page.waitForTimeout(500);
  await page.locator('[data-action="booking-next"]').click();
  for (const [selector, value] of Object.entries({ "#booking-first": "Lena", "#booking-last": "Hoffmann", "#booking-email": "recording@example.com", "#booking-phone": "+38344123456" })) await page.locator(selector).fill(value);
  await page.waitForTimeout(350);
  await page.locator('[data-action="booking-next"]').click();
  await page.locator("#booking-rules").check();
  await page.waitForTimeout(500);
  await page.locator('[data-action="booking-next"]').click();
  await page.locator('[data-panel="4"]:visible').waitFor();
  await page.waitForTimeout(1000); steps.push("Booking step motion, server quote and confirmed reservation");
} catch (error) {
  failure = error.stack; throw error;
} finally {
  await context.request.post("http://localhost:5047/v1/system/reset").catch(() => {});
  await context.close();
  await video.saveAs(`${output}/native-motion-and-booking.webm`);
  writeFileSync(`${output}/recording.json`, JSON.stringify({ recordedAt: new Date().toISOString(), steps, failure }, null, 2));
  console.log(JSON.stringify({ video: `${output}/native-motion-and-booking.webm`, steps, failure }, null, 2));
  await browser.close();
}
