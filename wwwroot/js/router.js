import { closeAllDialogs } from "./dialog.js";
import { clearSharedImages, reducedMotion, reveal } from "./motion.js";
import { announce } from "./ui.js";

const routes = [];
const scrollMemory = new Map();

const aliases = new Map([
  ["/", "/explore"],
  ["/listings", "/explore"],
  ["/wishlist", "/saved"],
  ["/reservations", "/trips"]
]);

const NAV_FOR_VIEW = {
  Explore: "explore",
  Stay: "explore",
  Trips: "trips",
  Saved: "saved",
  Hosts: "hosts",
  Host: "hosts",
  Contact: "contact"
};

let notFoundHandler = null;
let current = null;
let navigating = false;

export function register(pattern, handler) {
  const keys = [];
  const source = pattern.replace(/:[^/]+/g, (match) => {
    keys.push(match.slice(1));
    return "([^/]+)";
  });

  routes.push({ regex: new RegExp(`^${source}$`), keys, handler });
}

export function registerNotFound(handler) {
  notFoundHandler = handler;
}

export function navigate(path, options = {}) {
  const target = path.startsWith("/") ? path : `/${path}`;

  if (options.replace) {
    window.history.replaceState(null, "", `#${target}`);
    render({ restoreScroll: false });
    return;
  }

  if (currentPath() === target) {
    render({ restoreScroll: false });
    return;
  }

  navigating = true;
  window.location.hash = target;
}

export function currentPath() {
  return normalise(readHash());
}

function readHash() {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) {
    return "/";
  }

  return hash.startsWith("/") ? hash : `/${hash}`;
}

function normalise(path) {
  const trimmed = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return aliases.get(trimmed) ?? trimmed;
}

function match(path) {
  for (const route of routes) {
    const result = route.regex.exec(path);
    if (result) {
      const params = {};
      route.keys.forEach((key, index) => {
        try {
          params[key] = decodeURIComponent(result[index + 1]);
        } catch {
          params[key] = result[index + 1];
        }
      });
      return { route, params };
    }
  }

  return null;
}

export async function render(options = {}) {
  const { restoreScroll = false } = options;
  const rawPath = readHash();
  const path = normalise(rawPath);

  if (path !== rawPath) {
    window.history.replaceState(null, "", `#${path}`);
  }

  if (current) {
    scrollMemory.set(current.path, window.scrollY);
  }

  const update = async () => {
    closeAllDialogs();

    const main = document.getElementById("main");
    if (!main) {
      return;
    }

    main.setAttribute("aria-busy", "true");

    const found = match(path);
    let result = null;

    try {
      result = found
        ? await found.route.handler({ params: found.params, path })
        : await notFoundHandler?.({ params: { path }, path });
    } catch (error) {
      console.error("Route render failed", error);
      result = renderFatal(main);
    }

    main.removeAttribute("aria-busy");

    const meta = result ?? { title: "FatiHomes", name: "FatiHomes", announce: "" };
    document.title = meta.title;
    document.documentElement.dataset.route = path;
    updateNavigation(meta.name);

    const heading = main.querySelector("h1");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }

    if (meta.announce) {
      announce(meta.announce);
    }

    reveal(main);

    if (restoreScroll) {
      const saved = scrollMemory.get(path) ?? 0;
      window.scrollTo({ top: saved, behavior: "instant" });
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }

    current = { path, name: meta.name };
  };

  if (!reducedMotion() && typeof document.startViewTransition === "function") {
    const transition = document.startViewTransition(() => update());
    try {
      await transition.finished;
    } catch {
      // A skipped transition is not an error.
    }
    clearSharedImages();
    return;
  }

  await update();
  clearSharedImages();
}

function renderFatal(main) {
  main.replaceChildren();
  const shell = document.createElement("div");
  shell.className = "shell";

  const panel = document.createElement("div");
  panel.className = "app-error";
  panel.setAttribute("role", "alert");

  const heading = document.createElement("h1");
  heading.textContent = "This page could not be shown";

  const copy = document.createElement("p");
  copy.textContent = "Reload the page. If it keeps happening, the API may be restarting.";

  const reload = document.createElement("button");
  reload.type = "button";
  reload.className = "btn btn-primary";
  reload.textContent = "Reload";
  reload.addEventListener("click", () => window.location.reload());

  panel.append(heading, copy, reload);
  shell.append(panel);
  main.append(shell);

  return {
    title: "Something went wrong | FatiHomes",
    name: "Error",
    announce: "Something went wrong"
  };
}

function updateNavigation(name) {
  const activeKey = NAV_FOR_VIEW[name] ?? "";

  for (const link of document.querySelectorAll("[data-nav]")) {
    if (link.dataset.nav === activeKey) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  }

  const viewName = document.getElementById("view-name");
  if (viewName) {
    viewName.textContent = name;
  }

  document.documentElement.dataset.view = activeKey || "other";
}

export function start() {
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href^='#']");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    if (link.getAttribute("href") === "#main") {
      event.preventDefault();
      const main = document.getElementById("main");
      main?.focus({ preventScroll: true });
      main?.scrollIntoView({ behavior: "instant" });
      return;
    }
    navigating = true;
  });
  window.addEventListener("hashchange", () => {
    const wasNavigating = navigating;
    navigating = false;
    render({ restoreScroll: !wasNavigating });
  });

  render({ restoreScroll: false });
}
