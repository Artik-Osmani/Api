import { api, ApiError } from "./api.js";
import { register, registerNotFound, start } from "./router.js";
import { getState, setFavorites, subscribe } from "./store.js";
import { shareImage } from "./motion.js";
import { renderExplore } from "./views/explore.js";
import { renderStay } from "./views/stay.js";
import { renderTrips } from "./views/trips.js";
import { renderSaved } from "./views/saved.js";
import { renderHosts } from "./views/hosts.js";
import { renderHost } from "./views/host.js";
import { renderContact } from "./views/contact.js";
import { renderNotFound } from "./views/notfound.js";
import { toast } from "./ui.js";

const APPEARANCE_KEY = "fatihomes:appearance";

/** Boot: appearance, shell behaviour, routes, then the first render. */

initAppearance();
initHeaderScroll();
initOffline();
initSavedBadge();
initGlobalErrors();
initSharedTransitions();

register("/explore", renderExplore);
register("/stay/:id", renderStay);
register("/trips", renderTrips);
register("/saved", renderSaved);
register("/hosts", renderHosts);
register("/hosts/:id", renderHost);
register("/contact", renderContact);
registerNotFound(renderNotFound);

start();

api
  .favorites()
  .then((favorites) => setFavorites(favorites))
  .catch(() => {
    // The badge stays hidden and the Saved view will report the real error.
  });

function initAppearance() {
  let stored = "system";
  try {
    stored = window.localStorage.getItem(APPEARANCE_KEY) ?? "system";
  } catch {
    stored = "system";
  }

  apply(stored);

  for (const button of document.querySelectorAll("[data-appearance]")) {
    button.addEventListener("click", () => {
      apply(button.dataset.appearance);
    });
  }

  function apply(mode) {
    const root = document.documentElement;
    if (mode === "light" || mode === "dark") {
      root.dataset.theme = mode;
    } else {
      root.removeAttribute("data-theme");
    }

    for (const button of document.querySelectorAll("[data-appearance]")) {
      button.setAttribute("aria-pressed", String(button.dataset.appearance === mode));
    }

    try {
      window.localStorage.setItem(APPEARANCE_KEY, mode);
    } catch {
      // Private mode can refuse storage; the theme still applies for this session.
    }
  }
}

function initHeaderScroll() {
  const sentinel = document.querySelector(".scroll-sentinel");
  const header = document.getElementById("site-header");
  if (!sentinel || !header || !("IntersectionObserver" in window)) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      header.dataset.scrolled = String(!entry.isIntersecting);
    },
    { threshold: 0 }
  );

  observer.observe(sentinel);
}

function initOffline() {
  const banner = document.getElementById("offline-banner");
  if (!banner) {
    return;
  }

  const show = () => {
    banner.hidden = false;
  };

  window.addEventListener("offline", show);
  document.addEventListener("click", (event) => {
    if (event.target.closest('[data-action="dismiss-offline"]')) {
      banner.hidden = true;
    }
  });

  if (!navigator.onLine) {
    show();
  }
}

function initSavedBadge() {
  const update = () => {
    const count = getState().favoriteIds.size;
    for (const node of document.querySelectorAll("[data-saved-count]")) {
      node.textContent = String(count);
      node.hidden = count === 0;
    }
  };

  subscribe(update);
  update();
}

/**
 * Marks the card image with the stay's view-transition name just before the hash changes. The
 * router runs the render inside document.startViewTransition and clears the names afterwards.
 */
function initSharedTransitions() {
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.stay-card");
    if (
      !link
      || event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) {
      return;
    }

    const match = link.getAttribute("href")?.match(/\/stay\/([^/?]+)/);
    const image = link.querySelector(".stay-card-media img");
    if (match && image) {
      shareImage(image, decodeURIComponent(match[1]));
    }
  });
}

function initGlobalErrors() {
  let reported = false;

  const report = (error) => {
    if (error instanceof ApiError) {
      toast(error.message, { tone: "error" });
      return;
    }

    if (reported) {
      return;
    }

    reported = true;
    console.error("Unexpected application error", error);

    const main = document.getElementById("main");
    if (!main) {
      return;
    }

    main.replaceChildren();
    const shell = document.createElement("div");
    shell.className = "shell";
    const panel = document.createElement("div");
    panel.className = "app-error";
    panel.setAttribute("role", "alert");

    const heading = document.createElement("h1");
    heading.textContent = "This page could not be shown";

    const copy = document.createElement("p");
    copy.textContent = "Something failed while drawing the page. Reload to start again; your saved stays and bookings are kept by the server.";

    const reload = document.createElement("button");
    reload.type = "button";
    reload.className = "btn btn-primary";
    reload.textContent = "Reload";
    reload.addEventListener("click", () => window.location.reload());

    panel.append(heading, copy, reload);
    shell.append(panel);
    main.append(shell);
  };

  window.addEventListener("error", (event) => {
    if (event.target instanceof Element) {
      return;
    }

    report(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    report(event.reason);
  });
}
