import { el, icon, setChildren } from "./dom.js";
import { api, ApiError } from "./api.js";
import { createQuoteController, quoteTable, quoteErrorMessage } from "./quote.js";
import { openDialog, confirmDialog, messageDialog } from "./dialog.js";
import {
  addDays,
  bookingCode,
  counterLabel,
  daysBetween,
  formatDateRange,
  guestsLabel,
  money,
  nightsLabel,
  parseDate,
  toIso,
  today
} from "./format.js";
import { setFilters, upsertReservation } from "./store.js";
import { navigate } from "./router.js";
import { toast } from "./ui.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Three-step booking sheet built on <dialog>. Step 1 uses the server quote, step 2 validates guest
 * details, step 3 submits exactly the quote the server produced. A conflict returns the guest to
 * step 1 with a fresh quote; a network failure keeps the form intact.
 */
export function openBookingSheet(options) {
  const { listing } = options;
  const template = document.getElementById("tpl-booking");
  if (!template) {
    return null;
  }

  const dialog = template.content.firstElementChild.cloneNode(true);
  document.body.append(dialog);

  const q = (selector) => dialog.querySelector(selector);
  const qa = (selector) => [...dialog.querySelectorAll(selector)];

  const maxGuests = Math.max(1, listing.capacity?.maxGuests ?? 1);
  const minimumStay = Math.max(1, listing.pricing?.minNights ?? 2);

  const firstDate = options.checkIn ? parseDate(options.checkIn) : addDays(today(), 7);
  const secondDate = options.checkOut
    ? parseDate(options.checkOut)
    : addDays(firstDate ?? today(), Math.max(3, minimumStay));

  const state = {
    step: 1,
    checkIn: firstDate ? toIso(firstDate) : "",
    checkOut: secondDate ? toIso(secondDate) : "",
    guests: clamp(options.guests ?? 2, 1, maxGuests),
    quote: null,
    quoteStatus: "idle",
    quoteError: null,
    dirty: false,
    submitting: false,
    reservation: null
  };

  const elements = {
    title: q('[data-role="booking-title"]'),
    dates: q('[data-role="booking-dates"]'),
    steps: qa('[data-role="booking-steps"] li'),
    panels: qa("[data-panel]"),
    checkIn: q("#booking-checkin"),
    checkOut: q("#booking-checkout"),
    checkInError: q('[data-error-for="checkIn"]'),
    checkOutError: q('[data-error-for="checkOut"]'),
    guestsCount: q('[data-role="guests-count"]'),
    guestsHint: q('[data-role="guests-hint"]'),
    guestsMinus: q('[data-action="guests-minus"]'),
    guestsPlus: q('[data-action="guests-plus"]'),
    quotePanel: q('[data-role="quote-panel"]'),
    bookingError: q('[data-role="booking-error"]'),
    formSummary: q('[data-role="form-summary"]'),
    requests: q("#booking-requests"),
    requestsCount: q('[data-role="requests-count"]'),
    requestToggle: q('[data-role="request-toggle"]'),
    requestCheckbox: q("#booking-request"),
    reviewQuote: q('[data-role="review-quote"]'),
    rules: q("#booking-rules"),
    submitError: q('[data-role="submit-error"]'),
    successText: q('[data-role="success-text"]'),
    successReference: q('[data-role="success-reference"]'),
    successDetails: q('[data-role="success-details"]'),
    footer: q('[data-role="booking-foot"]'),
    back: q('[data-action="booking-back"]'),
    next: q('[data-action="booking-next"]'),
    close: q('[data-action="close-booking"]'),
    showRules: q('[data-action="show-rules"]')
  };

  const guestFields = {
    firstName: { input: q("#booking-first"), error: q('[data-error-for="firstName"]') },
    lastName: { input: q("#booking-last"), error: q('[data-error-for="lastName"]') },
    email: { input: q("#booking-email"), error: q('[data-error-for="email"]') },
    phone: { input: q("#booking-phone"), error: q('[data-error-for="phone"]') },
    requests: { input: elements.requests, error: q('[data-error-for="requests"]') }
  };

  for (const [name, field] of Object.entries(guestFields)) {
    const id = `booking-${name}-error`;
    field.error.id = id;
    field.input.setAttribute("aria-describedby", id);
  }

  for (const [name, input] of [["checkIn", elements.checkIn], ["checkOut", elements.checkOut]]) {
    const error = name === "checkIn" ? elements.checkInError : elements.checkOutError;
    error.id = `booking-${name}-error`;
    input.setAttribute("aria-describedby", error.id);
  }

  elements.title.textContent = listing.title;
  elements.checkIn.min = toIso(today());
  elements.checkIn.max = toIso(addDays(today(), 548));
  elements.checkOut.min = toIso(today());
  elements.checkOut.max = toIso(addDays(today(), 548));
  elements.checkIn.value = state.checkIn;
  elements.checkOut.value = state.checkOut;
  elements.guestsHint.textContent = `This stay sleeps up to ${maxGuests}.`;
  elements.requestToggle.hidden = Boolean(listing.instantBookEnabled);

  const quotes = createQuoteController({
    onUpdate: onQuoteUpdate,
    debounce: 250
  });

  updateDatesLine();
  updateGuests();
  renderQuote(elements.quotePanel);
  updateFooter();
  renderSteps();

  openDialog(dialog, {
    initialFocus: elements.checkIn,
    onClose: () => {
      quotes.cancel();
      dialog.remove();
    }
  });

  elements.checkIn.addEventListener("change", onDateChange);
  elements.checkOut.addEventListener("change", onDateChange);
  elements.guestsMinus.addEventListener("click", () => changeGuests(-1));
  elements.guestsPlus.addEventListener("click", () => changeGuests(1));
  elements.requests.addEventListener("input", () => {
    state.dirty = true;
    elements.requestsCount.textContent = counterLabel(elements.requests.value, 500);
    elements.requestsCount.classList.toggle("is-over", elements.requests.value.length > 500);
  });
  elements.rules.addEventListener("change", updateFooter);
  elements.requestCheckbox.addEventListener("change", () => {
    state.dirty = true;
  });

  for (const field of Object.values(guestFields)) {
    field.input.addEventListener(
      "blur",
      () => validateField(field.input.name),
      true
    );
    field.input.addEventListener("input", () => {
      state.dirty = true;
      if (field.input.getAttribute("aria-invalid") === "true") {
        validateField(field.input.name);
      }
    });
  }

  elements.back.addEventListener("click", () => {
    if (state.step > 1 && state.step < 4) {
      goTo(state.step - 1);
    }
  });

  elements.next.addEventListener("click", onNext);
  elements.close.addEventListener("click", requestClose);
  elements.showRules.addEventListener("click", showRules);

  // Escape is handled here so the sheet stays mounted while the leave confirmation is open.
  let escaping = false;
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      escaping = true;
      requestClose();
      window.setTimeout(() => {
        escaping = false;
      }, 400);
    }
  });

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    if (!escaping) {
      requestClose();
    }
  });

  if (state.checkIn && state.checkOut) {
    requestQuote();
  }

  function onNext() {
    if (state.step === 1) {
      if (!canContinueStepOne()) {
        return;
      }
      clearDateErrors();
      goTo(2);
      return;
    }

    if (state.step === 2) {
      if (!validateGuestForm(true)) {
        return;
      }
      renderReview();
      goTo(3);
      return;
    }

    if (state.step === 3) {
      submit();
    }
  }

  function goTo(step) {
    state.step = step;
    renderSteps();
    updateFooter();

    const panel = elements.panels.find((item) => Number(item.dataset.panel) === step);
    panel?.querySelector("h3")?.focus({ preventScroll: true });

    if (step === 3) {
      renderReview();
    }

    if (step === 1) {
      requestQuote();
    }
  }

  function renderSteps() {
    for (const item of elements.steps) {
      const step = Number(item.dataset.step);
      if (step === state.step) {
        item.setAttribute("aria-current", "step");
      } else {
        item.removeAttribute("aria-current");
      }
      item.dataset.complete = String(step < state.step);
    }

    for (const panel of elements.panels) {
      panel.hidden = Number(panel.dataset.panel) !== state.step;
    }
  }

  function updateFooter() {
    if (state.step === 4) {
      elements.footer.hidden = true;
      return;
    }

    elements.footer.hidden = false;
    elements.back.hidden = state.step === 1;
    elements.next.textContent = state.step === 3 ? "Confirm and pay" : "Continue";

    const needsQuote = state.step === 1 && !canContinueStepOne();
    const needsAgreement = state.step === 3 && !elements.rules.checked;
    elements.next.disabled = state.submitting || needsQuote || needsAgreement;
  }

  function canContinueStepOne() {
    return state.quoteStatus === "success" && Boolean(state.quote?.isAvailable);
  }

  function onDateChange() {
    state.dirty = true;
    state.checkIn = elements.checkIn.value;
    state.checkOut = elements.checkOut.value;
    updateDatesLine();

    if (!validateDates()) {
      state.quote = null;
      state.quoteStatus = "idle";
      renderQuote(elements.quotePanel);
      updateFooter();
      return;
    }

    requestQuote();
  }

  function validateDates() {
    clearDateErrors();
    const checkIn = parseDate(state.checkIn);
    const checkOut = parseDate(state.checkOut);
    let valid = true;
    let firstMessage = "";

    const fail = (input, errorNode, message) => {
      setError(input, errorNode, message);
      if (!firstMessage) {
        firstMessage = message;
      }
      valid = false;
    };

    if (!checkIn) {
      fail(elements.checkIn, elements.checkInError, "Choose a check-in date.");
    } else if (checkIn < today()) {
      fail(elements.checkIn, elements.checkInError, "Check-in cannot be in the past.");
    }

    if (!checkOut) {
      fail(elements.checkOut, elements.checkOutError, "Choose a check-out date.");
    } else if (checkIn && checkOut <= checkIn) {
      fail(elements.checkOut, elements.checkOutError, "Check-out must be after check-in.");
    }

    if (checkIn && checkOut && checkOut > checkIn) {
      const nights = daysBetween(checkIn, checkOut);
      if (nights < minimumStay) {
        fail(
          elements.checkOut,
          elements.checkOutError,
          `This stay needs at least ${minimumStay} nights.`
        );
      } else if (nights > 365) {
        fail(elements.checkOut, elements.checkOutError, "A stay can be at most 365 nights.");
      }
    }

    elements.bookingError.textContent = firstMessage;
    return valid;
  }

  function clearDateErrors() {
    setError(elements.checkIn, elements.checkInError, "");
    setError(elements.checkOut, elements.checkOutError, "");
  }

  function requestQuote() {
    quotes.request({
      listingId: listing.id,
      checkInDate: state.checkIn,
      checkOutDate: state.checkOut,
      guestsCount: state.guests
    });
  }

  function onQuoteUpdate(update) {
    state.quoteStatus = update.status;
    state.quote = update.quote;
    state.quoteError = update.error;
    renderQuote(elements.quotePanel);
    if (state.step === 3) {
      renderReview();
    }
    updateFooter();
  }

  function renderQuote(container) {
    if (!container) {
      return;
    }

    if (state.quoteStatus === "loading") {
      setChildren(
        container,
        el(
          "div",
          { class: "quote-loading" },
          icon("spinner-gap", "icon icon-16"),
          el("span", { text: "Checking availability" })
        )
      );
      return;
    }

    if (state.quoteStatus === "error") {
      setChildren(
        container,
        el("p", {
          class: "quote-alert",
          text: quoteErrorMessage(state.quoteError, minimumStay)
        })
      );
      container.append(
        el("button", {
          type: "button",
          class: "btn btn-secondary btn-sm",
          text: "Try again",
          onClick: requestQuote
        })
      );
      return;
    }

    if (!state.quote) {
      setChildren(
        container,
        el("p", { class: "quote-note", text: "Choose dates to see the price." })
      );
      return;
    }

    if (!state.quote.isAvailable) {
      setChildren(
        container,
        el("p", {
          class: "quote-alert",
          text: state.quote.unavailableReason ?? "Those dates are no longer available."
        }),
        el("button", {
          type: "button",
          class: "btn btn-secondary btn-sm",
          text: "Search other dates",
          onClick: searchOtherDates
        })
      );
      return;
    }

    setChildren(container, quoteTable(state.quote));
  }

  function renderReview() {
    if (!elements.reviewQuote) {
      return;
    }

    if (!state.quote?.isAvailable) {
      setChildren(
        elements.reviewQuote,
        el("p", { class: "quote-alert", text: "Check the dates again before confirming." })
      );
      return;
    }

    setChildren(elements.reviewQuote, quoteTable(state.quote));
  }

  function updateDatesLine() {
    const checkIn = parseDate(state.checkIn);
    const checkOut = parseDate(state.checkOut);
    elements.dates.textContent = checkIn && checkOut
      ? `${formatDateRange(checkIn, checkOut)} · ${guestsLabel(state.guests)}`
      : "Choose your dates";
  }

  function updateGuests() {
    elements.guestsCount.textContent = String(state.guests);
    elements.guestsMinus.disabled = state.guests <= 1;
    elements.guestsPlus.disabled = state.guests >= maxGuests;
    updateDatesLine();
  }

  function changeGuests(delta) {
    const next = clamp(state.guests + delta, 1, maxGuests);
    if (next === state.guests) {
      return;
    }

    state.guests = next;
    state.dirty = true;
    updateGuests();
    if (validateDates()) {
      requestQuote();
    }
  }

  function validateField(name) {
    const field = guestFields[name];
    if (!field) {
      return true;
    }

    const value = field.input.value.trim();
    let message = "";

    switch (name) {
      case "firstName":
        message = value.length < 2 || value.length > 80 ? "Enter a first name of 2 to 80 characters." : "";
        break;
      case "lastName":
        message = value.length < 2 || value.length > 80 ? "Enter a last name of 2 to 80 characters." : "";
        break;
      case "email":
        message = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 254
          ? ""
          : "Enter an email address such as you@example.com.";
        break;
      case "phone":
        message = value.replace(/\D/g, "").length >= 7 && value.length <= 20
          ? ""
          : "Enter a phone number of 7 to 20 characters.";
        break;
      case "requests":
        message = value.length > 500 ? "Keep requests under 500 characters." : "";
        break;
      default:
        break;
    }

    setError(field.input, field.error, message);
    return message === "";
  }

  function validateGuestForm(focusFirst) {
    const names = ["firstName", "lastName", "email", "phone", "requests"];
    const invalid = [];

    for (const name of names) {
      if (!validateField(name)) {
        invalid.push(name);
      }
    }

    if (invalid.length === 0) {
      elements.formSummary.hidden = true;
      elements.formSummary.replaceChildren();
      return true;
    }

    const summary = el("div", { class: "stack" });
    summary.append(el("p", { text: "Check these fields before continuing." }));
    const list = el("ul", { class: "stack-6" });

    for (const name of invalid) {
      const field = guestFields[name];
      list.append(
        el(
          "li",
          {},
          el("button", {
            type: "button",
            class: "btn-quiet",
            text: field.error.textContent,
            onClick: () => field.input.focus()
          })
        )
      );
    }

    summary.append(list);
    elements.formSummary.hidden = false;
    elements.formSummary.replaceChildren(summary);

    if (focusFirst) {
      guestFields[invalid[0]].input.focus();
    }

    return false;
  }

  function setError(input, errorNode, message) {
    if (errorNode) {
      errorNode.textContent = message;
    }

    if (message) {
      input.setAttribute("aria-invalid", "true");
    } else {
      input.removeAttribute("aria-invalid");
    }
  }

  async function submit() {
    if (state.submitting) {
      return;
    }

    elements.submitError.textContent = "";

    if (!elements.rules.checked) {
      elements.submitError.textContent = "Agree to the house rules before confirming.";
      elements.rules.focus();
      return;
    }

    if (!listing.instantBookEnabled && !elements.requestCheckbox.checked) {
      elements.submitError.textContent = "Confirm that you are sending a booking request.";
      elements.requestCheckbox.focus();
      return;
    }

    if (!state.quote?.isAvailable) {
      elements.submitError.textContent = "Check the dates again before confirming.";
      goTo(1);
      return;
    }

    state.submitting = true;
    elements.next.disabled = true;
    elements.next.textContent = "Confirming";

    try {
      const created = await api.createReservation({
        listingId: listing.id,
        checkInDate: state.checkIn,
        checkOutDate: state.checkOut,
        guestsCount: state.guests,
        primaryGuest: {
          firstName: guestFields.firstName.input.value.trim(),
          lastName: guestFields.lastName.input.value.trim(),
          email: guestFields.email.input.value.trim(),
          phoneNumber: guestFields.phone.input.value.trim()
        },
        bookingFlow: listing.instantBookEnabled ? "instant_book" : "request_to_book",
        paymentAuthorizationToken: "demo-simulated-payment",
        specialRequests: elements.requests.value.trim() || null
      });

      state.reservation = created;
      state.dirty = false;
      upsertReservation(created);
      showSuccess(created);
      options.onCreated?.(created);
    } catch (error) {
      if (error.code === "BOOKING_CONFLICT") {
        state.quote = null;
        state.quoteStatus = "idle";
        elements.bookingError.textContent = "Those dates are no longer available. Choose another range.";
        goTo(1);
        return;
      }

      if (error instanceof ApiError && error.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
        applyServerErrors(error);
        return;
      }

      elements.submitError.textContent = error.message ?? "The booking did not go through. Try again.";
      toast("The booking did not go through.", { tone: "error" });
    } finally {
      state.submitting = false;
      if (state.step !== 4) {
        updateFooter();
      }
    }
  }

  function applyServerErrors(error) {
    const map = {
      "primaryGuest.firstName": "firstName",
      "primaryGuest.lastName": "lastName",
      "primaryGuest.email": "email",
      "primaryGuest.phoneNumber": "phone",
      "primaryGuest": "firstName",
      "specialRequests": "requests"
    };

    let wentToStepTwo = false;

    for (const [key, messages] of Object.entries(error.fieldErrors)) {
      const name = map[key];
      if (!name) {
        continue;
      }

      const field = guestFields[name];
      setError(field.input, field.error, messages?.[0] ?? "Check this field.");
      wentToStepTwo = true;
    }

    if (wentToStepTwo) {
      goTo(2);
      validateGuestForm(true);
      return;
    }

    elements.submitError.textContent = error.message;
  }

  function showSuccess(reservation) {
    const checkIn = parseDate(reservation.checkInDate);
    const checkOut = parseDate(reservation.checkOutDate);
    const nights = checkIn && checkOut ? daysBetween(checkIn, checkOut) : 0;

    state.step = 4;
    renderSteps();
    elements.footer.hidden = true;

    elements.successText.textContent = `${nightsLabel(nights)} in ${listing.address?.city ?? "your stay"}, ${formatDateRange(checkIn, checkOut)}.`;
    elements.successReference.textContent = `Reference ${bookingCode(reservation.id)}`;

    const rows = el("div", { class: "quote-list" });
    rows.append(
      el("div", { class: "quote-row" }, el("span", { text: "Guests" }), el("span", { text: guestsLabel(reservation.guestsCount) })),
      el("div", { class: "quote-row" }, el("span", { text: "Total" }), el("span", { text: money(reservation.pricingSummary.totalAmount) })),
      el("div", { class: "quote-row" }, el("span", { text: "Payment" }), el("span", { text: "Demo only, not charged" }))
    );
    elements.successDetails.replaceChildren(rows);

    dialog.querySelector('[data-panel="4"] h3')?.focus({ preventScroll: true });
    toast("Your trip is confirmed.");
  }

  async function requestClose() {
    if (state.submitting) {
      return;
    }

    if (state.step === 4 || !state.dirty) {
      dialog.close();
      return;
    }

    const leave = await confirmDialog({
      title: "Leave this booking?",
      message: "Your dates and guest details will not be saved.",
      confirmLabel: "Leave",
      cancelLabel: "Keep editing",
      danger: true
    });

    if (leave) {
      dialog.close();
    }
  }

  function searchOtherDates() {
    setFilters({
      query: listing.address?.city ?? "",
      checkIn: "",
      checkOut: "",
      category: ""
    });
    state.dirty = false;
    dialog.close();
    navigate("/explore");
  }

  function showRules() {
    const rules = listing.houseRules ?? {};
    messageDialog({
      title: "House rules",
      message: `Quiet hours ${rules.quietHoursStart ?? "22:00"} to ${rules.quietHoursEnd ?? "08:00"}. Smoking ${rules.smokingAllowed ? "allowed" : "not allowed"}. Parties ${rules.partiesAllowed ? "allowed" : "not allowed"}. Pets: ${rules.maxPets > 0 ? `up to ${rules.maxPets}` : "not allowed"}.`,
      actionLabel: "Close"
    });
  }

  return dialog;
}


