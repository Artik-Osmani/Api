import { el } from "../dom.js";
import { api } from "../api.js";
import { stayCard } from "../cards.js";
import { cacheListings } from "../store.js";

export async function renderNotFound() {
  const main = document.getElementById("main");
  main.replaceChildren();

  const view = el("div", { class: "view" });
  const shell = el("div", { class: "shell" });

  const panel = el(
    "div",
    { class: "notfound" },
    el("p", { class: "eyebrow", text: "404" }),
    el("h1", { text: "This page does not exist." }),
    el("p", { class: "muted", text: "The stays are this way." }),
    el("a", { class: "btn btn-primary", href: "#/explore", text: "Back to stays" })
  );

  const suggestions = el("section", { class: "suggestions", "aria-label": "Suggested stays" });

  shell.append(panel, suggestions);
  view.append(shell);
  main.append(view);

  try {
    const response = await api.search({ pageSize: 3, guestsCount: 1 });
    cacheListings(response.results);
    for (const listing of response.results.slice(0, 3)) {
      suggestions.append(stayCard(listing, { ratio: "3-2", sizes: "30vw" }));
    }
  } catch {
    // Suggestions are optional.
  }

  return {
    title: "Page not found | FatiHomes",
    name: "Not found",
    announce: "Page not found"
  };
}
