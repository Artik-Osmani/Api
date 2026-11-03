import { el, icon, setChildren, stayImage, attachImageFallback } from "../dom.js";
import { api } from "../api.js";
import { stayCard } from "../cards.js";
import { cacheListings, getState, resetFilters, setFilters, setState } from "../store.js";
import {
  addDays,
  formatDateRange,
  guestsLabel,
  number,
  parseDate,
  toIso,
  today
} from "../format.js";
import { openDialog, closeDialog } from "../dialog.js";
import { once, reducedMotion, reveal } from "../motion.js";
import { errorPanel, toast } from "../ui.js";

const PAGE_SIZE = 24;

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "entire_home", label: "Homes" },
  { value: "apartment", label: "Apartments" },
  { value: "cabin", label: "Cabins" },
  { value: "villa", label: "Villas" },
  { value: "private_room", label: "Rooms" }
];

const SORTS = [
  ["recommended", "Recommended"],
  ["price_asc", "Lowest price"],
  ["rating_desc", "Highest rating"],
  ["reviews_desc", "Most reviewed"],
  ["distance_asc", "Closest"]
];

let searchController = null;

export async function renderExplore() {
  const main = document.getElementById("main");
  main.replaceChildren();

  const state = getState();
  const view = el("div", { class: "view view-explore" });

  const hero = buildHero();
  // Suggested future dates are displayed, but only applied after submitting the search.
  const console_ = buildSearchConsole({
    ...state.filters,
    checkIn: state.filters.checkIn || toIso(addDays(today(), 7)),
    checkOut: state.filters.checkOut || toIso(addDays(today(), 10))
  });
  const results = el("section", { class: "explore-results", id: "stays", "aria-labelledby": "results-heading" });

  const toolbar = buildToolbar(state.filters);
  const resultsLine = el("div", { class: "results-line" });
  const grid = el("div", { class: "results-grid" });
  const footer = el("div", { class: "show-more" });

  results.append(
    el("h2", { id: "results-heading", class: "visually-hidden", text: "Stays" }),
    toolbar.element,
    resultsLine,
    grid,
    footer
  );

  view.append(
    el("div", { class: "shell" }, hero, console_.desktop, console_.compact, results)
  );
  main.append(view);

  const context = {
    grid,
    resultsLine,
    footer,
    toolbar,
    filters: { ...state.filters },
    lastResponse: null,
    loading: false,
    page: 1
  };

  wireHero(view);
  wireSearchConsole(console_, context);
  wireToolbar(toolbar, context);
  wireFooter(footer, context);

  if (state.lastSearch) {
    paint(state.lastSearch, context, { announce: false });
  } else {
    paintSkeleton(grid);
  }

  await runSearch(context, { page: 1, replace: true, initial: true });

  return {
    title: "FatiHomes | Stays in Kosovo and Albania",
    name: "Explore",
    announce: `Explore, ${context.lastResponse?.totalRecords ?? 0} stays`
  };
}

function buildHero() {
  const section = el("section", { class: "explore-hero", "aria-labelledby": "hero-title" });
  if (once("fh-hero-revealed") && !reducedMotion()) {
    section.classList.add("hero-reveal");
  }

  const portrait = el("img", {
    src: "/images/stays/hero-p1200.webp",
    srcset: "/images/stays/hero-p800.webp 800w, /images/stays/hero-p1200.webp 1200w",
    sizes: "(max-width: 899px) 100vw, 36vw",
    width: 1200,
    height: 1500,
    alt: "Illustrative modern villa with a pool and timber balcony",
    fetchpriority: "high",
    decoding: "async"
  });
  attachImageFallback(portrait, "Dhërmi, Albania");

  const landscape = el("img", {
    src: "/images/stays/prizren-stone-house-1200.webp",
    srcset: "/images/stays/prizren-stone-house-800.webp 800w, /images/stays/prizren-stone-house-1200.webp 1200w, /images/stays/prizren-stone-house-1600.webp 1600w",
    sizes: "(max-width: 899px) 100vw, 26vw",
    width: 1200,
    height: 800,
    alt: "Illustrative stone house with a covered porch and lawn",
    decoding: "async",
    loading: "lazy"
  });
  attachImageFallback(landscape, "Prizren, Kosovo");

  const copy = el(
    "div",
    { class: "hero-copy" },
    el("p", { class: "hero-meta", text: "18 stays · 9 places · from €35 a night" }),
    el("h1", { class: "hero-title", id: "hero-title", text: "Places with a sense of place." }),
    el("p", {
      class: "hero-sub",
      text: "Eighteen homes across Kosovo, Albania and the coast, chosen for their location and their hosts."
    }),
    el(
      "button",
      { type: "button", class: "text-link", "data-action": "browse" },
      "Browse the collection",
      icon("arrow-right", "icon icon-16")
    )
  );

  const mainFrame = el("div", { class: "media-frame hero-stack-main" });
  mainFrame.append(
    portrait,
    el("p", { class: "hero-caption hero-caption-main", text: "Dhërmi, Albania" })
  );

  const secondFrame = el("div", { class: "media-frame hero-stack-secondary" });
  secondFrame.append(
    landscape,
    el("p", { class: "hero-caption hero-caption-secondary", text: "Prizren, Kosovo" })
  );

  section.append(copy, el("div", { class: "hero-stack" }, mainFrame, secondFrame));

  return section;
}

function wireHero(view) {
  view.querySelector('[data-action="browse"]')?.addEventListener("click", () => {
    document.getElementById("stays")?.scrollIntoView({
      behavior: reducedMotion() ? "auto" : "smooth",
      block: "start"
    });
  });
}

function buildSearchConsole(filters) {
  const minDate = toIso(today());
  const maxDate = toIso(addDays(today(), 548));

  const desktop = el(
    "form",
    { class: "search-console", "data-role": "desktop-search", novalidate: true },
    searchCell("search-where", "Where", el("input", {
      class: "input",
      id: "search-where",
      name: "query",
      type: "search",
      maxlength: "120",
      placeholder: "Prizren, Tirana, the coast",
      value: filters.query
    })),
    searchCell("search-checkin", "Check in", el("input", {
      class: "input",
      id: "search-checkin",
      name: "checkIn",
      type: "date",
      min: minDate,
      max: maxDate,
      value: filters.checkIn
    })),
    searchCell("search-checkout", "Check out", el("input", {
      class: "input",
      id: "search-checkout",
      name: "checkOut",
      type: "date",
      min: minDate,
      max: maxDate,
      value: filters.checkOut
    })),
    el(
      "div",
      { class: "search-cell" },
      el("span", { class: "label", id: "search-guests-label", text: "Guests" }),
      el(
        "div",
        { class: "stepper", role: "group", "aria-labelledby": "search-guests-label" },
        el(
          "button",
          { type: "button", "data-action": "desktop-guests-minus", "aria-label": "One guest fewer" },
          icon("minus", "icon icon-16")
        ),
        el("output", { "data-role": "desktop-guests", text: String(filters.guests) }),
        el(
          "button",
          { type: "button", "data-action": "desktop-guests-plus", "aria-label": "One guest more" },
          icon("plus", "icon icon-16")
        )
      )
    ),
    el(
      "div",
      { class: "search-submit" },
      el("button", { type: "submit", class: "btn btn-primary", text: "Search stays" })
    ),
    el("p", { class: "field-error", "data-role": "desktop-search-error" })
  );

  const compact = el(
    "div",
    { class: "search-compact" },
    el(
      "button",
      { type: "button", class: "search-compact-trigger", "data-action": "open-search" },
      el("strong", { text: "Where to?" }),
      el("span", { "data-role": "compact-summary", text: compactSummary(filters) })
    ),
    el(
      "button",
      { type: "button", class: "btn btn-primary", "data-action": "open-search", text: "Search stays" }
    )
  );

  return { desktop, compact };
}

function searchCell(id, label, input) {
  return el(
    "div",
    { class: "search-cell" },
    el("label", { for: id, text: label }),
    input
  );
}

function compactSummary(filters) {
  const parts = [];
  if (filters.query) {
    parts.push(filters.query);
  }
  if (filters.checkIn && filters.checkOut) {
    const from = parseDate(filters.checkIn);
    const to = parseDate(filters.checkOut);
    if (from && to) {
      parts.push(formatDateRange(from, to));
    }
  }
  parts.push(guestsLabel(filters.guests));
  return parts.join(" · ");
}

function wireSearchConsole(console_, context) {
  const desktop = console_.desktop;
  const desktopGuests = desktop.querySelector('[data-role="desktop-guests"]');

  desktop.querySelector('[data-action="desktop-guests-minus"]').addEventListener("click", () => {
    context.filters.guests = Math.max(1, context.filters.guests - 1);
    desktopGuests.textContent = String(context.filters.guests);
    syncCompact(console_, context.filters);
  });

  desktop.querySelector('[data-action="desktop-guests-plus"]').addEventListener("click", () => {
    context.filters.guests = Math.min(20, context.filters.guests + 1);
    desktopGuests.textContent = String(context.filters.guests);
    syncCompact(console_, context.filters);
  });

  desktop.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(desktop);
    const next = {
      query: String(form.get("query") ?? "").trim(),
      checkIn: String(form.get("checkIn") ?? ""),
      checkOut: String(form.get("checkOut") ?? ""),
      guests: context.filters.guests
    };

    const error = validateDates(next.checkIn, next.checkOut);
    desktop.querySelector('[data-role="desktop-search-error"]').textContent = error;
    if (error) {
      return;
    }

    applyFilters(context, next);
  });

  for (const field of desktop.querySelectorAll("input")) {
    field.addEventListener("change", () => {
      syncCompact(console_, {
        ...context.filters,
        query: desktop.querySelector("#search-where").value.trim(),
        checkIn: desktop.querySelector("#search-checkin").value,
        checkOut: desktop.querySelector("#search-checkout").value
      });
    });
  }

  for (const trigger of console_.compact.querySelectorAll('[data-action="open-search"]')) {
    trigger.addEventListener("click", () => openSearchSheet(console_, context));
  }
}

function syncCompact(console_, filters) {
  const summary = console_.compact.querySelector('[data-role="compact-summary"]');
  if (summary) {
    summary.textContent = compactSummary(filters);
  }
}

function openSearchSheet(console_, context) {
  const template = document.getElementById("tpl-search-sheet");
  if (!template) {
    return;
  }

  const dialog = template.content.firstElementChild.cloneNode(true);
  const form = dialog.querySelector('[data-role="search-form"]');
  const where = dialog.querySelector("#mobile-where");
  const checkIn = dialog.querySelector("#mobile-checkin");
  const checkOut = dialog.querySelector("#mobile-checkout");
  const guestsOutput = dialog.querySelector('[data-role="search-guests"]');
  const error = dialog.querySelector('[data-role="search-error"]');

  const minDate = toIso(today());
  const maxDate = toIso(addDays(today(), 548));
  checkIn.min = minDate;
  checkIn.max = maxDate;
  checkOut.min = minDate;
  checkOut.max = maxDate;

  where.value = context.filters.query;
  checkIn.value = context.filters.checkIn;
  checkOut.value = context.filters.checkOut;

  let guests = context.filters.guests;
  guestsOutput.textContent = String(guests);

  dialog.querySelector('[data-action="close-search"]').addEventListener("click", () => dialog.close());

  dialog.querySelector('[data-action="search-guests-minus"]').addEventListener("click", () => {
    guests = Math.max(1, guests - 1);
    guestsOutput.textContent = String(guests);
  });

  dialog.querySelector('[data-action="search-guests-plus"]').addEventListener("click", () => {
    guests = Math.min(20, guests + 1);
    guestsOutput.textContent = String(guests);
  });

  dialog.querySelector('[data-action="clear-search"]').addEventListener("click", () => {
    where.value = "";
    checkIn.value = "";
    checkOut.value = "";
    guests = 2;
    guestsOutput.textContent = "2";
    error.textContent = "";
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const next = {
      query: where.value.trim(),
      checkIn: checkIn.value,
      checkOut: checkOut.value,
      guests
    };

    const problem = validateDates(next.checkIn, next.checkOut);
    error.textContent = problem;
    if (problem) {
      return;
    }

    dialog.close();
    document.getElementById("search-where").value = next.query;
    document.getElementById("search-checkin").value = next.checkIn;
    document.getElementById("search-checkout").value = next.checkOut;
    console_.desktop.querySelector('[data-role="desktop-guests"]').textContent = String(guests);
    applyFilters(context, next);
  });

  document.body.append(dialog);
  openDialog(dialog, { initialFocus: where, onClose: () => dialog.remove() });
}

function validateDates(checkInValue, checkOutValue) {
  const checkIn = parseDate(checkInValue);
  const checkOut = parseDate(checkOutValue);

  if (!checkIn && !checkOut) {
    return "";
  }

  if (!checkIn || !checkOut) {
    return "Choose both dates, or neither.";
  }

  if (checkIn < today()) {
    return "Check-in cannot be in the past.";
  }

  if (checkOut <= checkIn) {
    return "Check-out must be after check-in.";
  }

  if (Math.round((checkOut - checkIn) / 86_400_000) > 365) {
    return "Choose a stay of at most 365 nights.";
  }

  return "";
}

function applyFilters(context, patch) {
  context.filters = { ...context.filters, ...patch };
  setFilters(patch);
  syncCompactElements(context);
  runSearch(context, { page: 1, replace: true });
}

function syncCompactElements(context) {
  const desktop = document.querySelector('[data-role="desktop-search"]');
  if (desktop) {
    desktop.querySelector("#search-where").value = context.filters.query;
    desktop.querySelector("#search-checkin").value = context.filters.checkIn;
    desktop.querySelector("#search-checkout").value = context.filters.checkOut;
    const output = desktop.querySelector('[data-role="desktop-guests"]');
    if (output) {
      output.textContent = String(context.filters.guests);
    }
  }

  const summary = document.querySelector('[data-role="compact-summary"]');
  if (summary) {
    summary.textContent = compactSummary(context.filters);
  }
}

function buildToolbar(filters) {
  const chips = el("div", { class: "category-filters", role: "group", "aria-label": "Stay type" });

  for (const category of CATEGORIES) {
    chips.append(
      el("button", {
        type: "button",
        class: "filter-chip",
        "data-category": category.value,
        "aria-pressed": String(filters.category === category.value),
        text: category.label
      })
    );
  }

  const select = el(
    "select",
    { class: "select", id: "sort-select", "aria-label": "Sort stays" },
    ...SORTS.map(([value, label]) =>
      el("option", { value, text: label, selected: filters.sort === value || undefined })
    )
  );

  const element = el(
    "div",
    { class: "explore-toolbar" },
    chips,
    el(
      "label",
      { class: "sort-control", for: "sort-select" },
      el("span", { text: "Sort" }),
      select
    )
  );

  return { element, chips, select };
}

function wireToolbar(toolbar, context) {
  toolbar.chips.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) {
      return;
    }

    if (context.filters.category === button.dataset.category) {
      return;
    }

    for (const chip of toolbar.chips.querySelectorAll("[data-category]")) {
      chip.setAttribute("aria-pressed", String(chip === button));
    }

    applyFilters(context, { category: button.dataset.category });
  });

  toolbar.select.addEventListener("change", () => {
    const sort = toolbar.select.value;

    if (sort === "distance_asc" && !cityCentre(context.filters.query)) {
      toast("Choose a place first, then sort by distance.");
      toolbar.select.value = context.filters.sort;
      return;
    }

    applyFilters(context, { sort });
  });
}

function wireFooter(footer, context) {
  footer.addEventListener("click", async (event) => {
    if (!event.target.closest('[data-action="show-more"]')) {
      return;
    }

    await runSearch(context, { page: context.page + 1, append: true });
  });
}

function cityCentre(query) {
  if (!query) {
    return null;
  }

  const needle = query.toLowerCase();
  const candidates = [...getState().listingCache.values()].filter((listing) =>
    listing.address?.city?.toLowerCase().includes(needle)
  );

  if (candidates.length === 0) {
    return null;
  }

  const latitude = candidates.reduce((sum, item) => sum + item.coordinates.latitude, 0) / candidates.length;
  const longitude = candidates.reduce((sum, item) => sum + item.coordinates.longitude, 0) / candidates.length;
  return { latitude, longitude };
}

function buildPayload(context, page) {
  const filters = context.filters;
  const payload = {
    guestsCount: filters.guests,
    page,
    pageSize: PAGE_SIZE,
    sortBy: filters.sort || "recommended"
  };

  if (filters.query) {
    payload.query = filters.query;
  }

  if (filters.checkIn && filters.checkOut) {
    payload.checkInDate = filters.checkIn;
    payload.checkOutDate = filters.checkOut;
  }

  if (filters.category) {
    payload.categories = [filters.category];
  }

  if (filters.sort === "distance_asc") {
    const centre = cityCentre(filters.query);
    if (!centre) {
      return null;
    }
    payload.circleSearch = { center: centre, radiusMeters: 50_000 };
  }

  return payload;
}

async function runSearch(context, options = {}) {
  const { page = 1, replace = false, append = false, initial = false } = options;
  const payload = buildPayload(context, page);

  if (!payload) {
    return;
  }

  searchController?.abort();
  searchController = new AbortController();
  context.loading = true;

  if (!append) {
    if ((initial || !context.lastResponse) && !context.grid.children.length) {
      paintSkeleton(context.grid);
    }
  } else {
    context.footer.querySelector("button")?.setAttribute("disabled", "disabled");
  }

  try {
    const response = await api.search(payload, searchController.signal);
    cacheListings(response.results);
    setState({ listings: response.results });
    context.lastResponse = response;

    if (append) {
      appendCards(context, response.results);
      context.page = response.page;
      paintPagination(context);
    } else {
      context.page = response.page;
      paint(response, context);
      context.grid.classList.add("is-updating");
      window.setTimeout(() => context.grid.classList.remove("is-updating"), 220);
    }
  } catch (error) {
    if (error.code === "REQUEST_ABORTED") {
      return;
    }

    if (replace || !context.lastResponse) {
      context.grid.replaceChildren();
      context.resultsLine.replaceChildren();
      context.resultsLine.append(
        errorPanel({
          title: "We could not load stays.",
          message: "Check your connection and try again.",
          onRetry: () => runSearch(context, { page: 1, replace: true })
        })
      );
    } else {
      toast("The results could not be refreshed. Showing the last loaded stays.", { tone: "error" });
    }
  } finally {
    context.loading = false;
  }
}

function paint(response, context, options = {}) {
  const { announce = true } = options;
  context.grid.replaceChildren();
  paintCards(context.grid, response.results);
  paintResultsLine(response, context);
  paintPagination(context);

  if (announce) {
    const live = document.getElementById("live-region");
    if (live) {
      live.textContent = `${number(response.totalRecords)} ${response.totalRecords === 1 ? "stay" : "stays"} found.`;
    }
  }
}

function paintCards(grid, listings) {
  const ratios = ["16-10", "4-5", "3-2", "1-1"];
  listings.forEach((listing, index) => {
    const ratio = ratios[index % ratios.length];
    const card = stayCard(listing, {
      ratio: ratio === "4-5" ? "4-5" : "3-2",
      eager: index < 2,
      sizes: "(max-width: 699px) 100vw, (max-width: 1099px) 50vw, 45vw"
    });
    card.classList.add("reveal");
    grid.append(card);
  });

  reveal(grid);
}

function appendCards(context, listings) {
  const start = context.grid.children.length;
  const ratios = ["16-10", "4-5", "3-2", "1-1"];

  listings.forEach((listing, index) => {
    const ratio = ratios[(start + index) % ratios.length];
    const card = stayCard(listing, {
      ratio: ratio === "4-5" ? "4-5" : "3-2",
      sizes: "(max-width: 699px) 100vw, (max-width: 1099px) 50vw, 45vw"
    });
    card.classList.add("reveal", "is-visible");
    context.grid.append(card);
  });
}

function paintSkeleton(grid) {
  grid.replaceChildren();
  for (let index = 0; index < 6; index += 1) {
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

function paintResultsLine(response, context) {
  context.resultsLine.replaceChildren();

  const filters = context.filters;
  const isFiltered = Boolean(
    filters.query
    || filters.category
    || (filters.checkIn && filters.checkOut)
    || filters.guests > 1
  );

  const suffix = filters.query
    ? ` matching “${filters.query}”`
    : isFiltered
      ? ""
      : " in Kosovo, Albania and the coast";

  const count = el("p", {
    class: "results-count",
    text: `${number(response.totalRecords)} ${response.totalRecords === 1 ? "stay" : "stays"}${suffix}`
  });

  const active = el("div", { class: "active-filters" });

  if (filters.query) {
    active.append(removableChip(`“${filters.query}”`, () => applyFilters(context, { query: "" })));
  }

  if (filters.category) {
    const label = CATEGORIES.find((category) => category.value === filters.category)?.label ?? filters.category;
    active.append(removableChip(label, () => applyFilters(context, { category: "" })));
  }

  if (filters.checkIn && filters.checkOut) {
    const from = parseDate(filters.checkIn);
    const to = parseDate(filters.checkOut);
    if (from && to) {
      active.append(
        removableChip(formatDateRange(from, to), () => applyFilters(context, { checkIn: "", checkOut: "" }))
      );
    }
  }

  if (filters.guests > 1) {
    active.append(removableChip(guestsLabel(filters.guests), () => applyFilters(context, { guests: 1 })));
  }

  if (filters.sort !== "recommended") {
    const label = SORTS.find(([value]) => value === filters.sort)?.[1] ?? filters.sort;
    active.append(removableChip(label, () => applyFilters(context, { sort: "recommended" })));
  }

  if (active.children.length > 0) {
    active.append(
      el("button", {
        type: "button",
        class: "btn-quiet",
        text: "Clear all",
        onClick: () => {
          resetFilters();
          context.filters = { ...getState().filters };
          syncCompactElements(context);
          context.toolbar.select.value = "recommended";
          for (const chip of context.toolbar.chips.querySelectorAll("[data-category]")) {
            chip.setAttribute("aria-pressed", String(chip.dataset.category === ""));
          }
          runSearch(context, { page: 1, replace: true });
        }
      })
    );
  }

  context.resultsLine.append(count, active);

  if (response.totalRecords === 0) {
    context.grid.replaceChildren();
    context.grid.append(
      buildEmptyState(context)
    );
  }
}

function removableChip(label, onRemove) {
  return el(
    "span",
    { class: "chip" },
    el("span", { text: label }),
    el(
      "button",
      { type: "button", "aria-label": `Remove ${label} filter`, onClick: onRemove },
      icon("x", "icon icon-16")
    )
  );
}

function buildEmptyState(context) {
  const panel = el(
    "div",
    { class: "empty-state" },
    el("h2", { text: "No stays match these filters." }),
    el("p", {
      text: "Widen the dates, lower the guest count, or try another place. The full collection is eighteen stays."
    })
  );

  const actions = el("div", { class: "row-actions" });
  actions.append(
    el("button", {
      type: "button",
      class: "btn btn-primary",
      text: "Clear filters",
      onClick: () => {
        resetFilters();
        context.filters = { ...getState().filters };
        syncCompactElements(context);
        runSearch(context, { page: 1, replace: true });
      }
    }),
    el("button", {
      type: "button",
      class: "btn btn-secondary",
      text: "Reset dates",
      onClick: () => applyFilters(context, { checkIn: "", checkOut: "" })
    })
  );

  panel.append(actions);
  return panel;
}

function paintPagination(context) {
  const response = context.lastResponse;
  context.footer.replaceChildren();

  if (!response) {
    return;
  }

  if (response.page < response.totalPages) {
    context.footer.append(
      el("button", {
        type: "button",
        class: "btn btn-secondary",
        "data-action": "show-more",
        text: "Show more stays"
      })
    );
    return;
  }

  if (response.totalRecords > 0) {
    context.footer.append(
      el("p", {
        class: "results-count",
        text: `${number(Math.min(context.grid.children.length, response.totalRecords))} of ${number(response.totalRecords)}`
      })
    );
  }
}
