import { api } from "./api.js";
import { el } from "./dom.js";
import { money } from "./format.js";

/**
 * The itemised price block shared by the booking sheet and the stay rail. The numbers always come
 * from the server quote, never from arithmetic in the browser.
 */
export function quoteTable(quote, options = {}) {
  const { depositNote = true } = options;
  const list = el("div", { class: "quote-list" });

  for (const item of quote.items ?? []) {
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
      el("span", { text: money(quote.totalAmount) })
    )
  );

  if (depositNote && quote.securityDeposit > 0) {
    list.append(
      el("p", {
        class: "quote-note",
        text: `${money(quote.securityDeposit, { decimals: 0 })} refundable deposit is held, not charged now.`
      })
    );
  }

  return list;
}

/** Maps the server's stable error codes to the sentences the interface uses. */
export function quoteErrorMessage(error, minimumStayNights = 2) {
  switch (error?.code) {
    case "MIN_STAY_NOT_MET":
      return `This stay needs at least ${minimumStayNights} nights.`;
    case "DATE_ORDER":
      return "Check-out must be after check-in.";
    case "DATE_IN_PAST":
      return "Check-in cannot be in the past.";
    case "STAY_TOO_LONG":
      return "A stay can be at most 365 nights.";
    case "CAPACITY_EXCEEDED":
      return error.message;
    case "REQUEST_TIMEOUT":
    case "NETWORK_ERROR":
      return "The price could not be checked. Check your connection and try again.";
    default:
      return error?.message ?? "The price could not be checked.";
  }
}

/**
 * Debounced quote requests. A new request aborts the previous one, which keeps the rail calm while
 * the guest edits dates and stops an older response overwriting a newer one.
 */
export function createQuoteController({ onUpdate, debounce = 250 }) {
  let timer = null;
  let controller = null;
  let sequence = 0;

  function stopTimer() {
    if (timer) {
      window.clearTimeout(timer);
      timer = null;
    }
  }

  function request(payload) {
    stopTimer();
    controller?.abort();
    controller = new AbortController();

    const id = ++sequence;
    onUpdate({ status: "loading", quote: null, error: null });

    timer = window.setTimeout(async () => {
      try {
        const quote = await api.quote(payload, controller.signal);
        if (id === sequence) {
          onUpdate({ status: "success", quote, error: null });
        }
      } catch (error) {
        if (error.code === "REQUEST_ABORTED") {
          return;
        }

        if (id === sequence) {
          onUpdate({ status: "error", quote: null, error });
        }
      }
    }, debounce);
  }

  return {
    request,
    cancel() {
      stopTimer();
      controller?.abort();
    }
  };
}
