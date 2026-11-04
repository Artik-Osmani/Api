import { el, icon, setChildren } from "./dom.js";
import { api } from "./api.js";
import {
  addDays,
  endOfMonth,
  formatDate,
  monthKey,
  monthLabel,
  parseDate,
  sameDay,
  startOfMonth,
  toIso,
  today
} from "./format.js";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Month calendar with real availability. Fetches one month at a time, caches by month, supports
 * keyboard navigation (arrows, Page Up/Down, Enter) and never relies on colour alone: booked days
 * carry a hatch and a text label in their accessible name.
 */
export function createCalendar(options) {
  const {
    listingId,
    minimumStayNights = 2,
    maxDate = addDays(today(), 365),
    onChange = null
  } = options;

  const availability = new Map();
  let checkIn = parseDate(options.checkIn);
  let checkOut = parseDate(options.checkOut);
  let viewMonth = startOfMonth(checkIn ?? today());
  let focusIso = checkIn ? toIso(checkIn) : toIso(today());
  let controller = null;
  let destroyed = false;

  const title = el("h3", { text: monthLabel(viewMonth), "aria-live": "polite" });
  const previous = el("button", {
    type: "button",
    class: "icon-btn icon-btn-plain",
    "aria-label": "Previous month"
  }, icon("caret-left"));
  const next = el("button", {
    type: "button",
    class: "icon-btn icon-btn-plain",
    "aria-label": "Next month"
  }, icon("caret-right"));

  const weekdays = el("div", { class: "calendar-weekdays", "aria-hidden": "true" });
  for (const day of WEEKDAYS) {
    weekdays.append(el("span", { text: day }));
  }

  const grid = el("div", {
    class: "calendar-grid",
    role: "group",
    "aria-label": "Availability calendar"
  });

  const status = el("p", { class: "field-hint", "aria-live": "polite" });
  const root = el(
    "div",
    { class: "calendar" },
    el("div", { class: "calendar-head" }, previous, title, next),
    weekdays,
    grid,
    status,
    el(
      "div",
      { class: "calendar-legend" },
      el(
        "span",
        { class: "legend-item" },
        el("span", { class: "legend-swatch", "aria-hidden": "true" }),
        "Available"
      ),
      el(
        "span",
        { class: "legend-item" },
        el("span", { class: "legend-swatch legend-booked", "aria-hidden": "true" }),
        "Booked"
      ),
      el(
        "span",
        { class: "legend-item" },
        el("span", { class: "legend-swatch", "aria-hidden": "true" }),
        `${minimumStayNights} night minimum`
      )
    )
  );

  previous.addEventListener("click", () => changeMonth(-1));
  next.addEventListener("click", () => changeMonth(1));
  grid.addEventListener("click", onGridClick);
  grid.addEventListener("keydown", onGridKeydown);

  async function load(month) {
    const key = monthKey(month);
    if (availability.has(key)) {
      return availability.get(key);
    }

    controller?.abort();
    controller = new AbortController();

    const days = await api.availability(
      listingId,
      toIso(startOfMonth(month)),
      toIso(endOfMonth(month)),
      controller.signal
    );

    const map = new Map(days.days.map((day) => [day.date, day]));
    availability.set(key, map);
    return map;
  }

  async function draw(direction = "", restoreFocus = false) {
    if (destroyed) {
      return;
    }

    title.textContent = monthLabel(viewMonth);
    previous.disabled = startOfMonth(viewMonth) <= startOfMonth(today());
    next.disabled = startOfMonth(viewMonth) >= startOfMonth(maxDate);

    const key = monthKey(viewMonth);
    if (!availability.has(key)) {
      drawSkeleton();
      try {
        await load(viewMonth);
      } catch (error) {
        if (error.code === "REQUEST_ABORTED") {
          return;
        }

        setChildren(
          grid,
          el("p", { class: "field-error", text: error.message }),
          el("button", {
            type: "button",
            class: "btn btn-secondary btn-sm",
            text: "Try again",
            onClick: () => draw()
          })
        );
        status.textContent = "";
        return;
      }
    }

    if (destroyed) {
      return;
    }

    if (monthKey(viewMonth) !== key) {
      return;
    }

    renderDays(availability.get(key), direction);
    if (restoreFocus) {
      const target = grid.querySelector(`[data-date="${focusIso}"]:not(:disabled)`)
        ?? grid.querySelector("button:not(:disabled)");
      target?.focus({ preventScroll: true });
    }
  }

  function drawSkeleton() {
    const cells = [];
    for (let index = 0; index < 35; index += 1) {
      cells.push(el("div", { class: "skeleton", "aria-hidden": "true" }));
    }
    grid.replaceChildren();
    for (const cell of cells) {
      const wrapper = el("div", { class: "cal-day", "aria-hidden": "true" });
      wrapper.append(cell);
      grid.append(wrapper);
    }
    status.textContent = "Checking availability";
  }

  function renderDays(days, direction) {
    const restoreFocus = grid.contains(document.activeElement);
    const first = startOfMonth(viewMonth);
    const offset = (first.getDay() + 6) % 7;
    const total = endOfMonth(viewMonth).getDate();
    const todayDate = today();
    const cells = [];

    for (let index = 0; index < offset; index += 1) {
      cells.push(el("span", { class: "cal-day is-empty", "aria-hidden": "true" }));
    }

    for (let dayNumber = 1; dayNumber <= total; dayNumber += 1) {
      const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), dayNumber);
      const iso = toIso(date);
      const day = days.get(iso);
      const isPast = date < todayDate;
      const isBooked = day?.blockReason === "booked";
      const disabled = isPast || isBooked || date > maxDate;
      const inRange = checkIn && date >= checkIn && (!checkOut || date <= checkOut);
      const isEdge = sameDay(date, checkIn) || sameDay(date, checkOut);

      const button = el("button", {
        type: "button",
        class: `cal-day${isBooked ? " is-booked" : ""}${sameDay(date, todayDate) ? " is-today" : ""}${inRange ? " is-selected" : ""}${isEdge ? " is-edge" : ""}`,
        dataset: { date: iso },
        disabled: disabled || undefined,
        "aria-pressed": String(Boolean(inRange)),
        "aria-label": accessibleLabel(date, day, isPast, isBooked, inRange)
      });

      button.append(
        el("span", { text: String(dayNumber) }),
        el("small", { text: day ? `€${Math.round(day.nightlyPrice)}` : "" })
      );

      cells.push(button);
    }

    grid.classList.remove("is-sliding-next", "is-sliding-prev");
    grid.replaceChildren(...cells);

    if (direction === "next") {
      grid.classList.add("is-sliding-next");
    } else if (direction === "prev") {
      grid.classList.add("is-sliding-prev");
    }

    status.textContent = `Showing ${monthLabel(viewMonth)}. ${minimumStayNights} night minimum stay.`;

    const focusTarget = grid.querySelector(`[data-date="${focusIso}"]`);
    if (focusTarget && restoreFocus) {
      focusTarget.focus({ preventScroll: true });
    }

    if (typeof onChange === "function" && checkIn && checkOut) {
      // Selection is reported by click handlers, not by rendering.
    }
  }

  function accessibleLabel(date, day, isPast, isBooked, inRange) {
    const parts = [formatDate(date)];
    if (day && Number.isFinite(day.nightlyPrice)) {
      parts.push(`€${Math.round(day.nightlyPrice)} per night`);
    }
    if (isPast) {
      parts.push("past");
    } else if (isBooked) {
      parts.push("booked");
    } else {
      parts.push("available");
    }
    if (inRange) {
      parts.push("selected");
    }
    return parts.join(", ");
  }

  function onChangeSelection() {
    onChange?.({
      checkIn: checkIn ? toIso(checkIn) : "",
      checkOut: checkOut ? toIso(checkOut) : ""
    });
  }

  function onGridClick(event) {
    const button = event.target.closest(".cal-day");
    if (!button || button.disabled || !button.dataset.date) {
      return;
    }

    const date = parseDate(button.dataset.date);
    if (!date) {
      return;
    }

    if (!checkIn || checkOut || date <= checkIn) {
      checkIn = date;
      checkOut = null;
    } else {
      checkOut = date;
    }

    focusIso = toIso(date);
    onChangeSelection();
    renderDays(availability.get(monthKey(viewMonth)) ?? new Map());
  }

  function onGridKeydown(event) {
    const button = event.target.closest(".cal-day");
    if (!button) {
      return;
    }

    const date = parseDate(button.dataset.date);
    if (!date) {
      return;
    }

    let target = null;

    switch (event.key) {
      case "ArrowRight":
        target = addDays(date, 1);
        break;
      case "ArrowLeft":
        target = addDays(date, -1);
        break;
      case "ArrowDown":
        target = addDays(date, 7);
        break;
      case "ArrowUp":
        target = addDays(date, -7);
        break;
      case "PageDown":
        target = adjacentMonth(date, 1);
        break;
      case "PageUp":
        target = adjacentMonth(date, -1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        button.click();
        return;
      default:
        return;
    }

    event.preventDefault();
    if (target < today() || target > maxDate) {
      return;
    }
    focusIso = toIso(target);

    const before = startOfMonth(viewMonth);
    const after = endOfMonth(viewMonth);

    if (target < before || target > after) {
      const direction = target < before ? "prev" : "next";
      viewMonth = startOfMonth(target);
      draw(direction, true);
      return;
    }

    grid.querySelector(`[data-date="${focusIso}"]`)?.focus({ preventScroll: true });
  }

  function adjacentMonth(date, delta) {
    const first = new Date(date.getFullYear(), date.getMonth() + delta, 1);
    return new Date(first.getFullYear(), first.getMonth(), Math.min(date.getDate(), endOfMonth(first).getDate()));
  }

  function changeMonth(delta) {
    const target = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1);
    if (target < startOfMonth(today()) || target > startOfMonth(maxDate)) {
      return;
    }

    viewMonth = target;
    draw(delta > 0 ? "next" : "prev");
  }

  draw();

  return {
    element: root,
    setDates(nextCheckIn, nextCheckOut) {
      checkIn = parseDate(nextCheckIn);
      checkOut = parseDate(nextCheckOut);
      if (checkIn) {
        focusIso = toIso(checkIn);
        viewMonth = startOfMonth(checkIn);
      }
      draw();
    },
    destroy() {
      destroyed = true;
      controller?.abort();
    }
  };
}
