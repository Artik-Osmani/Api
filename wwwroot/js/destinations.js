import { el, icon } from "./dom.js";
import { api } from "./api.js";
import { cacheListings, getState, setState } from "./store.js";
import { reducedMotion } from "./motion.js";

const places = [
  ["Prizren", "Old town", "prizren-stone-house"], ["Peja", "Mountain air", "rugova-cabin"],
  ["Dhërmi", "The coast", "dhermi-cliff-villa"], ["Pristina", "City life", "pristina-loft"],
  ["Tirana", "City gardens", "tirana-garden-suite"], ["Berat", "By the river", "berat-osum-house"],
  ["Brezovica", "In the pines", "brezovica-chalet"], ["Sarandë", "Sea views", "saranda-villa"],
  ["Gjakova", "The bazaar", "gjakova-bazaar-house"]
];

export function destinationNavigator(query, onSelect) {
  const root = el("nav", { class: "destination-nav", "aria-label": "Explore by destination" });
  const controller = new AbortController();
  const controls = el("div", { class: "destination-controls" },
    ...[[-1, "Previous destinations", "caret-left"], [1, "Next destinations", "caret-right"]].map(([direction, label, glyph]) =>
      el("button", { type: "button", class: "icon-btn icon-btn-plain", "aria-label": label,
        onClick: () => root.scrollBy({ left: direction * Math.max(240, root.clientWidth * .65), behavior: reducedMotion() ? "instant" : "smooth" }) }, icon(glyph))));
  for (const [city, subtitle, slug] of places) {
    const button = el("button", { class: "destination", type: "button", "data-destination": city,
      "aria-pressed": String(query.toLowerCase() === city.toLowerCase()),
      onClick: () => onSelect(city) },
      el("img", { src: `/images/places/${slug}.webp`, alt: "", width: 56, height: 44, loading: "lazy", decoding: "async" }),
      el("span", { class: "destination-copy" }, el("strong", { text: city }), el("small", { text: subtitle })));
    root.append(button);
  }
  function update(nextQuery) {
    for (const button of root.querySelectorAll("[data-destination]")) {
      button.setAttribute("aria-pressed", String(nextQuery.toLowerCase() === button.dataset.destination.toLowerCase()));
    }
  }
  // A separate complete catalogue supplies honest rates and distance sorting, independent of results.
  const catalog = getState().catalog;
  const loaded = catalog?.length ? Promise.resolve(catalog) : api.listings(controller.signal);
  loaded.then(listings => {
    if (controller.signal.aborted) return;
    setState({ catalog: listings });
    cacheListings(listings);
    for (const button of root.querySelectorAll("[data-destination]")) {
      const stays = listings.filter(listing => listing.address.city === button.dataset.destination);
      if (stays.length) button.querySelector("small").textContent = `From €${Math.min(...stays.map(stay => stay.pricing.baseNightlyRate))} / night`;
    }
  }).catch(() => { /* Place names remain usable when catalogue metadata cannot load. */ });
  return { element: root, controls, update, destroy: () => controller.abort() };
}
