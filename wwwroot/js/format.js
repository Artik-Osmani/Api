/**
 * Formatting. Dates are always built from YYYY-MM-DD parts in local time, never with
 * new Date("YYYY-MM-DD"), which would parse as UTC and shift the day.
 */

const currencyWhole = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
});

const currencyExact = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const dateFormatNoYear = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit"
});

export function money(value, options = {}) {
  const { decimals = 2 } = options;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Price on request";
  }

  return decimals === 0 ? currencyWhole.format(value) : currencyExact.format(value);
}

export function number(value) {
  return new Intl.NumberFormat("en-GB").format(Number(value) || 0);
}

export function rating(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "New";
  }

  return value.toFixed(1);
}

export function reviewsLabel(count) {
  if (!count) {
    return "No reviews yet";
  }

  return count === 1 ? "1 review" : `${count} reviews`;
}

export function nightsLabel(count) {
  return count === 1 ? "1 night" : `${count} nights`;
}

export function guestsLabel(count) {
  return count === 1 ? "1 guest" : `${count} guests`;
}

export function parseDate(value) {
  if (!value) {
    return null;
  }

  const parts = String(value).slice(0, 10).split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) {
    return null;
  }

  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toIso(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function today() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(date, count) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + count);
  return copy;
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function sameDay(a, b) {
  return Boolean(a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate());
}

export function daysBetween(a, b) {
  const first = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const second = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((second - first) / 86_400_000);
}

export function formatDate(value, options = {}) {
  const date = value instanceof Date ? value : parseDate(value);
  if (!date) {
    return "Dates to be confirmed";
  }

  return options.year === false ? dateFormatNoYear.format(date) : dateFormat.format(date);
}

export function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return dateTimeFormat.format(date);
}

export function formatDateRange(from, to) {
  const start = from instanceof Date ? from : parseDate(from);
  const end = to instanceof Date ? to : parseDate(to);

  if (!start || !end) {
    return "Dates to be confirmed";
  }

  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${start.getDate()}–${dateFormat.format(end)}`;
  }

  return `${dateFormat.format(start)} – ${dateFormat.format(end)}`;
}

export function monthLabel(date) {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(date);
}

export function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function weekdayShort(date) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date);
}

export function statusLabel(status) {
  const labels = {
    pending_approval: "Pending approval",
    confirmed: "Confirmed",
    checked_in: "Checked in",
    completed: "Completed",
    cancelled: "Cancelled"
  };

  return labels[status] ?? "Unknown status";
}

export function statusClass(status) {
  return {
    pending_approval: "status status-pending",
    confirmed: "status status-confirmed",
    checked_in: "status status-checked",
    completed: "status status-completed",
    cancelled: "status status-cancelled"
  }[status] ?? "status";
}

/** Display-only booking reference. It is derived from the reservation id and never used for lookup. */
export function bookingCode(id) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const text = String(id ?? "").replace(/-/g, "");
  let hash = 2_166_136_261;

  for (const character of text) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }

  let value = hash >>> 0;
  let code = "";
  for (let index = 0; index < 5; index += 1) {
    code += alphabet[value % alphabet.length];
    value = Math.floor(value / alphabet.length);
  }

  return `FH-${code}`;
}

export function plural(count, one, many) {
  return count === 1 ? one : many;
}

export function truncate(value, max) {
  const text = String(value ?? "");
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export function counterLabel(value, max) {
  return `${String(value ?? "").length} / ${max}`;
}
