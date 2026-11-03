#!/usr/bin/env node
/**
 * Small Chrome DevTools Protocol harness used for the manual QA pass.
 *
 *   chrome --headless --remote-debugging-port=9222 --remote-allow-origins=* about:blank
 *   node scripts/ui-check.mjs <url> <out.png> [width] [height] [--dark] [--full]
 *
 * It prints a JSON report (title, card count, computed fonts, overflow, errors) and exits non-zero
 * when the page logs a console error or throws.
 */
import { writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const positional = args.filter((arg) => !arg.startsWith("--"));
const url = positional[0] ?? "http://localhost:5047/";
const out = positional[1] ?? "screenshot.png";
const width = Number(positional[2] ?? 1440);
const height = Number(positional[3] ?? 900);
const dark = flags.has("--dark");
const full = flags.has("--full");
const exprArg = args.find((arg) => arg.startsWith("--expr="));

const list = await (await fetch("http://127.0.0.1:9222/json/list")).json();
const page = list.find((target) => target.type === "page");
if (!page) {
  console.error("No page target. Start Chrome with --remote-debugging-port=9222.");
  process.exit(2);
}

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
const problems = [];
let sequence = 0;

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) {
      reject(new Error(JSON.stringify(message.error)));
    } else {
      resolve(message.result);
    }
    return;
  }

  if (message.method === "Runtime.exceptionThrown") {
    problems.push(`exception: ${message.params.exceptionDetails.text} ${message.params.exceptionDetails.exception?.description ?? ""}`);
  }

  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
    problems.push(`console.error: ${message.params.args.map((arg) => arg.value ?? arg.description ?? "").join(" ")}`);
  }

  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
    problems.push(`log: ${message.params.entry.text} ${message.params.entry.url ?? ""}`);
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
await send("Log.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setDeviceMetricsOverride", {
  width,
  height,
  deviceScaleFactor: 1,
  mobile: width < 700
});
await send("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-color-scheme", value: dark ? "dark" : "light" }]
});

await send("Page.navigate", { url: "about:blank" });
await new Promise((resolve) => setTimeout(resolve, 200));
problems.length = 0;
const cacheBusted = url.includes("?")
  ? url.replace("#", `&ts=${Date.now()}#`)
  : url.replace("#", `?ts=${Date.now()}#`);
await send("Page.navigate", { url: cacheBusted });
await new Promise((resolve) => setTimeout(resolve, 3500));

const report = await send("Runtime.evaluate", {
  expression: `(() => {
    const style = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const computed = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      return {
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        color: computed.color,
        background: computed.backgroundColor,
        x: Math.round(box.x),
        width: Math.round(box.width)
      };
    };
    return {
      title: document.title,
      view: document.documentElement.dataset.view,
      cards: document.querySelectorAll(".stay-card-item").length,
      headings: [...document.querySelectorAll("h1")].map((h) => h.textContent),
      fontLoaded: document.fonts ? [...document.fonts].map((f) => f.family + ":" + f.status) : [],
      body: style("body"),
      hero: style(".hero-title"),
      shell: style(".shell"),
      input: style("#search-where"),
      headerBrand: style(".brand-name"),
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      errorPanel: Boolean(document.querySelector(".app-error")),
      emptyState: Boolean(document.querySelector(".empty-state")),
      navCurrent: [...document.querySelectorAll("[aria-current=page]")].map((n) => n.textContent.trim())
    };
  })()`,
  returnByValue: true
});

const screenshotOptions = {
  format: "png",
  fromSurface: true,
  captureBeyondViewport: full
};

const extraResult = {};
if (exprArg) {
  const extra = await send("Runtime.evaluate", {
    expression: exprArg.slice("--expr=".length),
    returnByValue: true,
    awaitPromise: true
  });
  extraResult.expression = extra.result.value;
}

if (full) {
  const metrics = await send("Page.getLayoutMetrics");
  const size = metrics.cssContentSize ?? metrics.contentSize;
  screenshotOptions.clip = {
    x: 0,
    y: 0,
    width: Math.ceil(size.width),
    height: Math.min(Math.ceil(size.height), 12_000),
    scale: 1
  };
}

const screenshot = await send("Page.captureScreenshot", screenshotOptions);
writeFileSync(out, Buffer.from(screenshot.data, "base64"));

const result = {
  url,
  viewport: `${width}x${height}`,
  theme: dark ? "dark" : "light",
  ...report.result.value,
  ...extraResult,
  problems
};

console.log(JSON.stringify(result, null, 2));
socket.close();

if (problems.length > 0 || result.errorPanel) {
  process.exit(1);
}
