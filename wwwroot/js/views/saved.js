import { el } from "../dom.js";
import { api } from "../api.js";
import { stayCard } from "../cards.js";
import { getState, setFavorites, subscribe } from "../store.js";
import { number } from "../format.js";
import { errorPanel } from "../ui.js";

export async function renderSaved() {
  const main = document.getElementById("main");
  main.replaceChildren();

  const view = el("div", { class: "view view-saved" });
  const shell = el("div", { class: "shell" });
  const head = el(
    "header",
    { class: "view-head" },
    el("h1", { text: "Saved stays" }),
    el("p", { class: "lede", "data-role": "saved-lede", text: "Loading your saved stays" })
  );
  const grid = el("div", { class: "saved-grid" });
  shell.append(head, grid);
  view.append(shell);
  main.append(view);

  paintSkeleton(grid);

  try {
    const favorites = await api.favorites();
    setFavorites(favorites);
    paint(favorites);
  } catch (error) {
    grid.replaceChildren(
      errorPanel({
        title: "We could not load your saved stays.",
        message: error.message,
        onRetry: () => renderSaved()
      })
    );
    return { title: "Saved stays | FatiHomes", name: "Saved", announce: "Saved stays could not load" };
  }

  const unsubscribe = subscribe(() => {
    if (!grid.isConnected) {
      unsubscribe();
      return;
    }

    paint(getState().favoriteListings);
  });

  window.addEventListener("hashchange", unsubscribe, { once: true });

  function paint(listings) {
    grid.replaceChildren();
    head.querySelector('[data-role="saved-lede"]').textContent = listings.length === 0
      ? "Nothing saved yet."
      : `${number(listings.length)} ${listings.length === 1 ? "stay" : "stays"} kept for later.`;

    if (listings.length === 0) {
      grid.append(emptyState());
      return;
    }

    for (const listing of listings) {
      grid.append(
        stayCard(listing, {
          ratio: "4-3",
          sizes: "(max-width: 699px) 100vw, (max-width: 1099px) 50vw, 33vw"
        })
      );
    }
  }

  return {
    title: "Saved stays | FatiHomes",
    name: "Saved",
    announce: `Saved stays, ${getState().favoriteListings.length}`
  };
}

function emptyState() {
  return el(
    "div",
    { class: "empty-state" },
    el("h2", { text: "Nothing saved yet" }),
    el("p", { text: "Nothing saved yet. Use the heart on any stay to keep it here." }),
    el("a", { class: "btn btn-primary", href: "#/explore", text: "Browse stays" })
  );
}

function paintSkeleton(grid) {
  for (let index = 0; index < 3; index += 1) {
    grid.append(
      el(
        "div",
        { class: "card-skeleton", "aria-hidden": "true" },
        el("div", { class: "skeleton skeleton-image" }),
        el(
          "div",
          { class: "skeleton-body" },
          el("div", { class: "skeleton skeleton-text skeleton-text-wide" }),
          el("div", { class: "skeleton skeleton-text skeleton-text-short" })
        )
      )
    );
  }
}
