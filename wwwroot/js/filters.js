import { el, icon } from "./dom.js";
import { openDialog } from "./dialog.js";

export const advancedDefaults = {
  minPrice: "", maxPrice: "", minBedrooms: "", minRating: "", petsCount: 0,
  instantBookOnly: false, superhostOnly: false, requiredAmenities: []
};
const amenities = [
  ["wifi", "Wi-Fi"], ["kitchen", "Kitchen"], ["parking", "Parking"],
  ["workspace", "Workspace"], ["air_conditioning", "Air conditioning"],
  ["pool", "Pool"], ["garden", "Garden"], ["fireplace", "Fireplace"]
];

/** Each chip describes a real API constraint and carries its precise reset operation. */
export function advancedChips(filters) {
  const chips = [];
  if (filters.minPrice !== "" || filters.maxPrice !== "") {
    const label = filters.minPrice !== "" && filters.maxPrice !== ""
      ? `€${filters.minPrice}–€${filters.maxPrice} / night`
      : filters.minPrice !== "" ? `From €${filters.minPrice} / night` : `Up to €${filters.maxPrice} / night`;
    chips.push({ label, patch: { minPrice: "", maxPrice: "" } });
  }
  if (filters.minBedrooms !== "") chips.push({ label: `${filters.minBedrooms}+ bedrooms`, patch: { minBedrooms: "" } });
  if (filters.minRating !== "") chips.push({ label: `${filters.minRating}+ rating`, patch: { minRating: "" } });
  if (filters.petsCount > 0) chips.push({ label: `${filters.petsCount} ${filters.petsCount === 1 ? "pet" : "pets"}`, patch: { petsCount: 0 } });
  if (filters.instantBookOnly) chips.push({ label: "Instant booking", patch: { instantBookOnly: false } });
  if (filters.superhostOnly) chips.push({ label: "Superhosts", patch: { superhostOnly: false } });
  for (const key of filters.requiredAmenities ?? []) {
    chips.push({ label: amenities.find(([value]) => value === key)?.[1] ?? key,
      patch: { requiredAmenities: filters.requiredAmenities.filter(value => value !== key) } });
  }
  return chips;
}

/** Draft state stays inside the native sheet until the guest presses Apply filters. */
export function openFilters(filters, onApply) {
  const controls = {};
  const summary = el("p", { class: "field-error", role: "alert", id: "filter-error", hidden: true });
  const field = (key, label, props) => {
    const input = el("input", { class: "input", id: `filter-${key}`, name: key, type: "number", inputmode: "numeric",
      value: filters[key] ?? "", "aria-describedby": "filter-error", ...props });
    controls[key] = input;
    return el("div", { class: "field" }, el("label", { for: input.id, text: label }), input);
  };
  const check = (key, label) => {
    const input = el("input", { type: "checkbox", name: key, checked: Boolean(filters[key]) });
    controls[key] = input;
    return el("label", { class: "filter-check" }, input, el("span", { text: label }));
  };
  const close = el("button", { type: "button", class: "icon-btn", "aria-label": "Close filters" }, icon("x"));
  const clear = el("button", { type: "button", class: "btn btn-quiet", text: "Clear filters" });
  const amenityInputs = amenities.map(([value, label]) => {
    const input = el("input", { type: "checkbox", name: "amenities", value, checked: filters.requiredAmenities?.includes(value) });
    return el("label", { class: "filter-check" }, input, el("span", { text: label }));
  });
  const rating = el("select", { class: "select", id: "filter-minRating", name: "minRating" },
    ...[["", "Any rating"], ["4", "4.0 and above"], ["4.5", "4.5 and above"], ["5", "5.0"]].map(([value, label]) =>
      el("option", { value, selected: String(filters.minRating) === value, text: label })));
  controls.minRating = rating;
  const form = el("form", { class: "filter-form", novalidate: true },
    el("header", { class: "dialog-head" }, el("div", {}, el("h2", { id: "filters-title", text: "Filter stays" }),
      el("p", { class: "muted", text: "Set a budget and choose a few essentials." })), close),
    el("div", { class: "filter-body" }, summary,
      el("section", { class: "filter-section" }, el("h3", { text: "Nightly budget" }),
        el("p", { class: "field-hint", text: "In EUR, before booking fees. Leave blank for any price." }),
        el("div", { class: "filter-fields" }, field("minPrice", "Minimum (€)", { min: 1, max: 100000 }), field("maxPrice", "Maximum (€)", { min: 1, max: 100000 }))),
      el("section", { class: "filter-section" }, el("h3", { text: "Space and guests" }),
        el("div", { class: "filter-fields" }, field("minBedrooms", "Bedrooms, at least", { min: 1, max: 30 }), field("petsCount", "Pets coming along", { min: 0, max: 10 }))),
      el("fieldset", { class: "filter-section" }, el("legend", { text: "A few essentials" }), el("div", { class: "filter-checks" }, ...amenityInputs)),
      el("section", { class: "filter-section" }, el("h3", { text: "Booking preferences" }),
        el("div", { class: "field" }, el("label", { for: "filter-minRating", text: "Guest rating" }), rating),
        check("instantBookOnly", "Book instantly, without waiting for approval"), check("superhostOnly", "Stay with a Superhost"))),
    el("footer", { class: "filter-foot" }, clear, el("button", { type: "submit", class: "btn btn-primary", text: "Apply filters" })));
  const dialog = el("dialog", { class: "filter-sheet sheet", "aria-labelledby": "filters-title" }, form);
  close.addEventListener("click", () => dialog.close());
  clear.addEventListener("click", () => {
    for (const [key, input] of Object.entries(controls)) {
      if (input.type === "checkbox") input.checked = false;
      else input.value = advancedDefaults[key];
      input.removeAttribute("aria-invalid");
    }
    for (const input of form.querySelectorAll('[name="amenities"]')) input.checked = false;
    summary.hidden = true;
  });
  function validateDraft() {
    let firstInvalid = null;
    for (const input of Object.values(controls)) {
      const invalid = !input.checkValidity();
      input.setAttribute("aria-invalid", String(invalid));
      if (invalid && !firstInvalid) firstInvalid = input;
    }
    if (firstInvalid) {
      summary.textContent = "Use whole, positive prices and valid room or pet counts.";
    } else if (controls.minPrice.value && controls.maxPrice.value && Number(controls.minPrice.value) > Number(controls.maxPrice.value)) {
      firstInvalid = controls.maxPrice;
      firstInvalid.setAttribute("aria-invalid", "true");
      summary.textContent = "Maximum price must be at least the minimum price.";
    }
    summary.hidden = !firstInvalid;
    return firstInvalid;
  }
  for (const input of Object.values(controls)) {
    input.addEventListener("blur", validateDraft);
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") validateDraft();
    });
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    const firstInvalid = validateDraft();
    if (firstInvalid) { firstInvalid.focus(); return; }
    const values = Object.fromEntries(Object.entries(controls).map(([key, input]) => [key, input.type === "checkbox" ? input.checked : input.value]));
    values.petsCount = Number(values.petsCount || 0);
    values.requiredAmenities = [...form.querySelectorAll('[name="amenities"]:checked')].map(input => input.value);
    dialog.close();
    onApply(values);
  });
  document.body.append(dialog);
  openDialog(dialog, { initialFocus: controls.minPrice, onClose: () => dialog.remove() });
  return dialog;
}
