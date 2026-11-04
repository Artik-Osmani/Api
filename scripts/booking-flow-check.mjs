#!/usr/bin/env node
/**
 * Drives the booking flow in a real browser against the running app and captures the confirmation.
 * Requires Chrome with --remote-debugging-port=9222.
 *
 *   node scripts/booking-flow-check.mjs [listingId] [out.png]
 */
import { writeFileSync } from "node:fs";

const listingId = process.argv[2] ?? "e14c1d68-0fa4-44bc-b17b-4b248a31e8fd";
const out = process.argv[3] ?? "docs/screenshots/booking-confirmed.png";
const width = Number(process.argv[4] ?? 1440);
const height = Number(process.argv[5] ?? 900);
const url = `http://localhost:5047/?ts=${Date.now()}#/stay/${listingId}`;

const list = await (await fetch("http://127.0.0.1:9222/json/list")).json();
const page = list.find((target) => target.type === "page");
if (!page) {
  console.error("Start Chrome with --remote-debugging-port=9222 first.");
  process.exit(2);
}

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
let sequence = 0;
const problems = [];

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
    return;
  }

  if (message.method === "Runtime.exceptionThrown") {
    problems.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
  }

  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
    problems.push(message.params.args.map((arg) => arg.value ?? arg.description ?? "").join(" "));
  }
});

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setDeviceMetricsOverride", {
  width,
  height,
  deviceScaleFactor: 1,
  mobile: width < 700
});
await send("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-color-scheme", value: "light" }]
});

await send("Page.navigate", { url: "about:blank" });
await new Promise((resolve) => setTimeout(resolve, 200));
await send("Page.navigate", { url });
await new Promise((resolve) => setTimeout(resolve, 3000));

const driver = `(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const reserve = document.querySelector('.stay-rail [data-action="reserve"]')
    ?? document.querySelector('[data-action="mobile-reserve"]');
  if (!reserve) return { ok: false, reason: 'Reserve button missing' };
  if (reserve.disabled) return { ok: false, reason: 'Reserve disabled before opening' };
  reserve.click();
  await sleep(1500);

  const dialog = document.querySelector('dialog.sheet[open]');
  if (!dialog) return { ok: false, reason: 'Booking sheet did not open' };
  const pick = (selector) => dialog.querySelector(selector);

  const quote = pick('[data-role="quote-panel"]').innerText.replace(/\\s+/g, ' ').trim();
  const continueButton = pick('[data-action="booking-next"]');
  if (continueButton.disabled) return { ok: false, reason: 'Continue disabled at step 1', quote };

  continueButton.click();
  await sleep(100);

  const set = (selector, value) => {
    const field = pick(selector);
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  };

  set('#booking-first', 'Lena');
  set('#booking-last', 'Hoffmann');
  set('#booking-email', 'lena.hoffmann@example.com');
  set('#booking-phone', '+383 44 123 456');
  set('#booking-requests', 'We arrive on the evening bus and would like to leave bags early.');

  pick('[data-action="booking-next"]').click();
  await sleep(150);

  const reviewVisible = !pick('[data-panel="3"]').hidden;
  const rules = pick('#booking-rules');
  rules.checked = true;
  rules.dispatchEvent(new Event('change', { bubbles: true }));
  await sleep(50);

  const confirm = pick('[data-action="booking-next"]');
  const confirmEnabled = !confirm.disabled;
  confirm.click();
  await sleep(2000);

  const successVisible = !pick('[data-panel="4"]').hidden;
  return {
    ok: successVisible,
    quote,
    reviewVisible,
    confirmEnabled,
    successVisible,
    successText: pick('[data-role="success-text"]').textContent,
    reference: pick('[data-role="success-reference"]').textContent,
    submitError: pick('[data-role="submit-error"]').textContent,
    bodyLocked: document.body.classList.contains('dialog-open')
  };
})()`;

const evaluation = await send("Runtime.evaluate", {
  expression: driver,
  awaitPromise: true,
  returnByValue: true
});

if (evaluation.exceptionDetails) {
  console.error(JSON.stringify(evaluation.exceptionDetails, null, 2));
  process.exit(1);
}

const screenshot = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
writeFileSync(out, Buffer.from(screenshot.data, "base64"));

const result = { ...evaluation.result.value, problems, screenshot: out };
console.log(JSON.stringify(result, null, 2));
socket.close();

if (!result.ok || problems.length > 0) {
  process.exit(1);
}
