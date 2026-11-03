import { el, icon } from "./dom.js";

const toastRegion = () => document.getElementById("toast-region");
const liveRegion = () => document.getElementById("live-region");

export function toast(message, options = {}) {
  const { tone = "neutral", duration = 4_000 } = options;
  const region = toastRegion();
  if (!region) {
    return;
  }

  let timer = null;
  const node = el(
    "div",
    { class: "toast" },
    icon(tone === "error" ? "warning-circle" : "check-circle", "icon"),
    el("p", { text: message }),
    el(
      "button",
      { type: "button", "aria-label": "Dismiss message" },
      icon("x", "icon icon-16")
    )
  );

  const remove = () => {
    window.clearTimeout(timer);
    node.remove();
  };

  const start = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(remove, duration);
  };

  node.querySelector("button").addEventListener("click", remove);
  node.addEventListener("mouseenter", () => window.clearTimeout(timer));
  node.addEventListener("mouseleave", start);

  region.append(node);
  start();
}

export function announce(message) {
  const region = liveRegion();
  if (!region) {
    return;
  }

  region.textContent = "";
  window.requestAnimationFrame(() => {
    region.textContent = message;
  });
}

export function errorPanel({ title = "Something went wrong", message, retryLabel = "Try again", onRetry = null }) {
  const panel = el(
    "div",
    { class: "panel panel-error", role: "alert" },
    el("h2", { class: "u-text-xl", text: title }),
    el("p", { text: message })
  );

  if (onRetry) {
    panel.append(
      el("button", { type: "button", class: "btn btn-secondary u-mt-4", text: retryLabel, onClick: onRetry })
    );
  }

  return panel;
}

export function emptyState({ title, message, actions = [] }) {
  const panel = el(
    "div",
    { class: "empty-state" },
    el("h2", { text: title }),
    el("p", { text: message })
  );

  if (actions.length > 0) {
    const row = el("div", { class: "row-actions" });
    for (const action of actions) {
      row.append(
        action.href
          ? el("a", { class: "btn btn-secondary", href: action.href, text: action.label })
          : el("button", { type: "button", class: "btn btn-secondary", text: action.label, onClick: action.onClick })
      );
    }
    panel.append(row);
  }

  return panel;
}

export function skeletonLines(count = 3) {
  const wrapper = el("div", { class: "stack" });
  for (let index = 0; index < count; index += 1) {
    wrapper.append(el("div", { class: "skeleton skeleton-text" }));
  }
  return wrapper;
}

export function busy(node, isBusy) {
  if (!node) {
    return;
  }

  if (isBusy) {
    node.setAttribute("aria-busy", "true");
  } else {
    node.removeAttribute("aria-busy");
  }
}
