import { el, icon, initials, setChildren, stayImage } from "../dom.js";
import { api } from "../api.js";
import { openChat } from "../chat.js";
import { openDialog } from "../dialog.js";
import {
  bookingCode,
  daysBetween,
  formatDate,
  guestsLabel,
  money,
  nightsLabel,
  parseDate,
  statusClass,
  statusLabel,
  today
} from "../format.js";
import { cacheListing, getState, upsertReservation } from "../store.js";
import { errorPanel, toast } from "../ui.js";

const FILTERS = [
  ["all", "All"],
  ["upcoming", "Upcoming"],
  ["now", "Staying now"],
  ["past", "Past"],
  ["cancelled", "Cancelled"]
];

export async function renderTrips() {
  const main = document.getElementById("main");
  main.replaceChildren();

  const view = el("div", { class: "view view-trips" });
  main.append(view);

  const shell = el("div", { class: "shell" });
  const head = el(
    "header",
    { class: "trips-head" },
    el(
      "div",
      {},
      el("h1", { text: "Your trips" }),
      el("p", { class: "muted", "data-role": "trips-lede", text: "Loading your bookings" })
    )
  );
  const stats = el("dl", { class: "summary-stats", "data-role": "trip-stats" });
  const filters = el("div", { class: "trips-filters", role: "group", "aria-label": "Filter trips" });
  const list = el("div", { class: "trip-list" });
  const state = { filter: "all", reservations: [], listings: new Map() };

  shell.append(head, stats, filters, list);
  view.append(shell);
  paintSkeleton(list);

  try {
    const reservations = await api.reservations();
    const uniqueIds = [...new Set(reservations.map((item) => item.listingId))];
    const listings = await Promise.all(uniqueIds.map((id) => api.listing(id).catch(() => null)));

    for (const listing of listings) {
      if (listing) {
        cacheListing(listing);
        state.listings.set(listing.id, listing);
      }
    }

    state.reservations = reservations;
    paintAll();
  } catch (error) {
    list.replaceChildren(
      errorPanel({
        title: "We could not load your trips.",
        message: error.message,
        onRetry: () => renderTrips()
      })
    );
    return { title: "Your trips | FatiHomes", name: "Trips", announce: "Trips could not load" };
  }

  function paintAll() {
    paintStats(state, stats);
    paintFilters(state, filters, () => paintList(state, list, paintAll));
    paintList(state, list, paintAll);
    head.querySelector('[data-role="trips-lede"]').textContent = `${state.reservations.length} ${state.reservations.length === 1 ? "booking" : "bookings"} in your history.`;
  }

  return {
    title: "Your trips | FatiHomes",
    name: "Trips",
    announce: `Your trips, ${state.reservations.length} bookings`
  };
}

function paintSkeleton(list) {
  for (let index = 0; index < 2; index += 1) {
    list.append(
      el(
        "div",
        { class: "trip-card" },
        el("div", { class: "skeleton trip-media" }),
        el(
          "div",
          { class: "stack" },
          el("div", { class: "skeleton skeleton-text skeleton-text-wide" }),
          el("div", { class: "skeleton skeleton-text skeleton-text-short" })
        )
      )
    );
  }
}

function paintStats(state, container) {
  const reservations = state.reservations;
  const counted = reservations.filter((item) => item.status !== "cancelled");
  const nights = counted.reduce((sum, item) => sum + nightsOf(item), 0);
  const totals = new Map();

  for (const item of counted) {
    const currency = item.pricingSummary.currency;
    totals.set(currency, (totals.get(currency) ?? 0) + item.pricingSummary.totalAmount);
  }

  const next = reservations
    .filter((item) => ["confirmed", "pending_approval"].includes(item.status))
    .map((item) => parseDate(item.checkInDate))
    .filter((date) => date && date >= today())
    .sort((a, b) => a - b)[0];

  const totalText = totals.size === 1
    ? money([...totals.values()][0], { decimals: 0 })
    : [...totals.entries()].map(([currency, value]) => `${money(value, { decimals: 0 })} ${currency}`).join(" · ");

  container.replaceChildren(
    stat("Nights booked", String(nights)),
    stat("Stays", String(counted.length)),
    stat("Next check-in", next ? formatDate(next) : "None"),
    stat("Total paid", totalText || money(0, { decimals: 0 }))
  );
}

function stat(label, value) {
  return el(
    "div",
    { class: "summary-stat" },
    el("dt", { text: label }),
    el("dd", { text: value })
  );
}

function nightsOf(reservation) {
  const checkIn = parseDate(reservation.checkInDate);
  const checkOut = parseDate(reservation.checkOutDate);
  return checkIn && checkOut ? daysBetween(checkIn, checkOut) : 0;
}

function paintFilters(state, container, onChange) {
  container.replaceChildren();

  for (const [value, label] of FILTERS) {
    const count = state.reservations.filter((item) => matchesFilter(item, value)).length;
    container.append(
      el(
        "button",
        {
          type: "button",
          class: "filter-chip",
          "aria-pressed": String(state.filter === value),
          onClick: () => {
            state.filter = value;
            paintFilters(state, container, onChange);
            onChange();
          }
        },
        label,
        el("span", { class: "count", text: String(count) })
      )
    );
  }
}

function matchesFilter(reservation, filter) {
  const checkIn = parseDate(reservation.checkInDate);
  const checkOut = parseDate(reservation.checkOutDate);
  const now = today();

  switch (filter) {
    case "upcoming":
      return ["confirmed", "pending_approval"].includes(reservation.status) && checkIn && checkIn > now;
    case "now":
      return reservation.status === "checked_in"
        || (reservation.status === "confirmed" && checkIn && checkIn <= now && checkOut && checkOut > now);
    case "past":
      return reservation.status === "completed"
        || (reservation.status !== "cancelled" && checkOut && checkOut <= now);
    case "cancelled":
      return reservation.status === "cancelled";
    default:
      return true;
  }
}

function paintList(state, container, refresh) {
  container.replaceChildren();
  const reservations = state.reservations.filter((item) => matchesFilter(item, state.filter));

  if (reservations.length === 0) {
    container.append(emptyForFilter(state.filter, () => {
      state.filter = "all";
      refresh();
    }));
    return;
  }

  for (const reservation of reservations) {
    container.append(
      tripCard(reservation, state.listings.get(reservation.listingId), refresh)
    );
  }
}

function emptyForFilter(filter, onReset) {
  const copy = {
    all: "No trips here yet. When you book a stay it will appear in this list.",
    upcoming: "No upcoming trips. Your next stay will appear here once it is booked.",
    now: "No one is staying now. Upcoming trips are listed under Upcoming.",
    past: "No past trips yet.",
    cancelled: "No cancelled trips."
  }[filter] ?? "Nothing here.";

  return el(
    "div",
    { class: "empty-state" },
    el("h2", { text: "Nothing in this view" }),
    el("p", { text: copy }),
    el(
      "button",
      { type: "button", class: "btn btn-secondary", text: "Show all trips", onClick: onReset }
    )
  );
}

function tripCard(reservation, listing, refresh) {
  if (!listing) {
    return el("div", { class: "trip-card" }, el("p", { class: "muted", text: "This stay is no longer listed." }));
  }

  const checkIn = parseDate(reservation.checkInDate);
  const checkOut = parseDate(reservation.checkOutDate);
  const nights = checkIn && checkOut ? daysBetween(checkIn, checkOut) : 0;
  const cancelled = reservation.status === "cancelled";
  const canCancel = ["confirmed", "pending_approval"].includes(reservation.status)
    && checkIn
    && checkIn > today();

  const media = el("div", { class: "media-frame trip-media" });
  media.append(stayImage(listing, { ratio: "3-2", sizes: "(max-width: 899px) 100vw, 320px" }));

  const status = el(
    "span",
    { class: statusClass(reservation.status) },
    el("span", { class: "status-dot", "aria-hidden": "true" }),
    statusLabel(reservation.status)
  );

  const actions = el("div", { class: "trip-actions" });
  const message = el("button", { type: "button", class: "btn btn-secondary btn-sm", text: "Message host" });
  message.addEventListener("click", () => openChat({ reservation, listing, hostName: listing.host.name }));
  actions.append(message);

  const priceDetails = el(
    "details",
    { class: "disclosure" },
    el("summary", { text: "Price details" }),
    el("div", { class: "trip-price-details" }, quoteRows(reservation))
  );
  actions.append(priceDetails);

  if (canCancel) {
    const cancel = el("button", { type: "button", class: "btn-quiet", text: "Cancel booking" });
    cancel.addEventListener("click", () => openCancel(reservation, refresh));
    actions.append(cancel);
  }

  const body = el(
    "div",
    { class: "trip-body" },
    el("div", { class: "trip-top" }, status, el("span", { class: "trip-reference", text: `Reference ${bookingCode(reservation.id)}` })),
    el(
      "div",
      {},
      el("a", { class: "trip-title", href: `#/stay/${listing.id}`, text: listing.title }),
      el("p", { class: "muted u-text-sm", text: `${listing.address.city}, ${listing.address.countryCode === "XK" ? "Kosovo" : listing.address.state}` })
    ),
    el(
      "div",
      { class: "trip-timeline" },
      el(
        "span",
        { class: "trip-dates" },
        el("span", { text: "Check in" }),
        formatDate(checkIn)
      ),
      el("span", { class: "trip-dashed", "aria-hidden": "true" }),
      el("span", { class: "nights-pill", text: nightsLabel(nights) }),
      el("span", { class: "trip-dashed", "aria-hidden": "true" }),
      el(
        "span",
        { class: "trip-dates" },
        el("span", { text: "Check out" }),
        formatDate(checkOut)
      )
    ),
    el(
      "div",
      { class: "trip-meta" },
      el("span", { text: guestsLabel(reservation.guestsCount) }),
      el("span", { text: reservation.bookingFlow === "instant_book" ? "Instant book" : "Request to book" }),
      el(
        "span",
        { class: "avatar-row" },
        el("span", { class: "avatar", "aria-hidden": "true", text: initials(listing.host.name) }),
        el("span", { text: listing.host.name })
      )
    ),
    el(
      "div",
      { class: "trip-total" },
      el("span", { text: money(reservation.pricingSummary.totalAmount) }),
      el("span", {
        class: "muted u-text-sm",
        text: nights > 0 ? `${money(reservation.pricingSummary.totalAmount / nights, { decimals: 0 })} average a night` : ""
      })
    ),
    actions
  );

  return el(
    "article",
    { class: `trip-card${cancelled ? " is-cancelled" : ""}` },
    media,
    body
  );
}

function quoteRows(reservation) {
  const summary = reservation.pricingSummary;
  const list = el("div", { class: "quote-list" });

  for (const item of summary.items ?? []) {
    list.append(
      el(
        "div",
        { class: `quote-row${item.amount < 0 ? " is-discount" : ""}` },
        el("span", { text: item.description }),
        el("span", { text: money(item.amount) })
      )
    );
  }

  list.append(
    el(
      "div",
      { class: "quote-total" },
      el("span", { text: "Total" }),
      el("span", { text: money(summary.totalAmount) })
    )
  );

  if (summary.securityDeposit > 0) {
    list.append(
      el("p", {
        class: "quote-note",
        text: `${money(summary.securityDeposit, { decimals: 0 })} refundable deposit, not charged.`
      })
    );
  }

  return list;
}

function openCancel(reservation, refresh) {
  const reasons = [
    "Plans changed",
    "Found another place",
    "Work or family matter",
    "Booked the wrong dates",
    "Other"
  ];

  const select = el(
    "select",
    { class: "select", id: "cancel-reason" },
    ...reasons.map((reason) => el("option", { value: reason, text: reason }))
  );

  const confirm = el("button", { type: "button", class: "btn btn-danger", text: "Cancel booking" });
  const keep = el("button", { type: "button", class: "btn btn-secondary", text: "Keep booking" });

  const dialog = el(
    "dialog",
    { class: "dialog-center", "aria-labelledby": "cancel-title" },
    el(
      "div",
      { class: "dialog-body" },
      el(
        "div",
        { class: "dialog-head" },
        el("h2", { id: "cancel-title", text: "Cancel this booking?" }),
        el(
          "button",
          { type: "button", class: "icon-btn", "aria-label": "Close" },
          icon("x")
        )
      ),
      el("p", {
        class: "muted",
        text: "This is a demo. Cancelling here updates the booking in memory and the dates become available again."
      }),
      el(
        "div",
        { class: "field" },
        el("label", { class: "label", for: "cancel-reason", text: "Reason" }),
        select
      ),
      el("p", { class: "field-error", "data-role": "cancel-error" }),
      el("div", { class: "row-actions" }, keep, confirm)
    )
  );

  document.body.append(dialog);
  openDialog(dialog, { initialFocus: keep, onClose: () => dialog.remove() });

  keep.addEventListener("click", () => dialog.close());
  dialog.querySelector(".icon-btn").addEventListener("click", () => dialog.close());

  confirm.addEventListener("click", async () => {
    confirm.disabled = true;
    confirm.textContent = "Cancelling";
    try {
      const updated = await api.cancelReservation(reservation.id, select.value);
      upsertReservation(updated);
      dialog.close();
      toast("Booking cancelled. The dates are available again.");
      refresh();
    } catch (error) {
      dialog.querySelector('[data-role="cancel-error"]').textContent = error.message;
      confirm.disabled = false;
      confirm.textContent = "Cancel booking";
    }
  });
}
