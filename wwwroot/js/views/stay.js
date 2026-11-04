import { el, icon, initials, setChildren } from "../dom.js";
import { api } from "../api.js";
import { stayCard, avatar, heartButton } from "../cards.js";
import { createCalendar } from "../calendar.js";
import { createQuoteController, quoteTable, quoteErrorMessage } from "../quote.js";
import { openBookingSheet } from "../booking.js";
import { openChat } from "../chat.js";
import { openDialog, messageDialog } from "../dialog.js";
import {
  addDays,
  formatDate,
  guestsLabel,
  money,
  nightsLabel,
  parseDate,
  rating,
  reviewsLabel,
  toIso,
  today
} from "../format.js";
import { amenityGroups, amenityIcon, amenityLabel, categoryLabel, placeLabel } from "../icons.js";
import { cacheListing, getState, setReservations } from "../store.js";
import { shareImage, changeFeedback, reducedMotion } from "../motion.js";
import { errorPanel, toast } from "../ui.js";

export async function renderStay({ params }) {
  const main = document.getElementById("main");
  main.replaceChildren();

  const view = el("div", { class: "view stay-view" });
  main.append(view);
  paintSkeleton(view);

  let listing;
  try {
    listing = getState().listingCache.get(params.id) ?? await api.listing(params.id);
  } catch (error) {
    if (error.status === 404) {
      paintMissing(view, params.id);
      return {
        title: "Stay not found | FatiHomes",
        name: "Stay",
        announce: "Stay not found"
      };
    }

    view.replaceChildren(
      errorPanel({
        title: "We could not load this stay.",
        message: error.message,
        onRetry: () => renderStay({ params })
      })
    );
    return { title: "Stay | FatiHomes", name: "Stay", announce: "Stay could not load" };
  }

  cacheListing(listing);
  view.replaceChildren();
  const cleanup = buildStay(view, listing);

  return {
    title: `${listing.title} | FatiHomes`,
    name: "Stay",
    announce: `Stay detail, ${listing.title}`,
    cleanup
  };
}

function paintSkeleton(view) {
  const skeleton = el(
    "div",
    { class: "shell" },
    el("div", { class: "skeleton skeleton-image", "aria-hidden": "true" }),
    el(
      "div",
      { class: "stack u-mt-8" },
      el("div", { class: "skeleton skeleton-text skeleton-text-wide" }),
      el("div", { class: "skeleton skeleton-text skeleton-text-short" })
    )
  );
  skeleton.querySelector(".skeleton-image").classList.add("gallery-main");
  view.append(skeleton);
}

function paintMissing(view, id) {
  view.append(
    el(
      "div",
      { class: "shell" },
      el(
        "div",
        { class: "notfound" },
        el("h1", { text: "This stay is not available." }),
        el("p", {
          class: "muted",
          text: "It may have been removed, or the link may be wrong. The rest of the collection is still here."
        }),
        el("a", { class: "btn btn-primary", href: "#/explore", text: "Back to stays" }),
        el("p", { class: "mono muted", text: `Reference ${id}` })
      )
    )
  );
}

function buildStay(view, listing) {
  const filters = getState().filters;
  const requestedIn = parseDate(filters.checkIn);
  const requestedOut = parseDate(filters.checkOut);
  const hasRequestedDates = requestedIn && requestedOut && requestedIn >= today() && requestedOut > requestedIn;
  const state = {
    checkIn: hasRequestedDates ? filters.checkIn : toIso(addDays(today(), 7)),
    checkOut: hasRequestedDates ? filters.checkOut : toIso(addDays(today(), 7 + Math.max(3, listing.pricing.minNights ?? 2))),
    guests: Math.max(1, Math.min(filters.guests || 2, listing.capacity.maxGuests)),
    quote: null,
    quoteStatus: "idle",
    quoteError: null
  };

  const reviewsState = { all: [], visible: 5 };

  const photos = photoSet(listing);

  const topbar = el(
    "div",
    { class: "shell" },
    el(
      "div",
      { class: "stay-topbar" },
      el(
        "a",
        { class: "back-link", href: "#/explore" },
        icon("caret-left", "icon icon-16"),
        "All stays"
      )
    )
  );

  const gallery = buildGallery(listing, photos);

  const header = el("header", { class: "stay-header" });
  header.append(
    el("h1", { class: "stay-title", text: listing.title }),
    el(
      "div",
      { class: "stay-meta-line" },
      el("span", { text: placeLabel(listing) }),
      el("span", { class: "dot", text: categoryLabel(listing.category) }),
      listing.reviewCount > 0
        ? el(
          "span",
          { class: "stay-rating" },
          icon("star", "icon"),
          el("span", { text: rating(listing.starRating) }),
          el("span", { class: "muted", text: ` · ${reviewsLabel(listing.reviewCount)}` })
        )
        : el("span", { class: "muted", text: "New" }),
      listing.host.superhostStatus ? el("span", { class: "superhost-label", text: "Superhost" }) : null
    )
  );
  header.append(heartButton(listing, "heart-btn stay-save"));

  const hostRow = el(
    "div",
    { class: "host-row" },
    el(
      "div",
      { class: "avatar-row" },
      avatar(listing.host.name),
      el(
        "div",
        { class: "avatar-row-text" },
        el("strong", { text: `Hosted by ${listing.host.name}` }),
        el("span", {
          text: `Responds in about ${listing.host.responseTimeMinutes} minutes`
        })
      )
    )
  );

  const messageButton = el("button", {
    type: "button",
    class: "btn-quiet",
    text: "Message host"
  });
  messageButton.addEventListener("click", () => messageHost(listing));
  hostRow.append(messageButton);

  const content = el("div", { class: "stay-content" });
  content.append(
    buildDescription(listing),
    buildAmenities(listing),
    buildAvailability(listing, state),
    buildRules(listing),
    buildReviewsShell(listing, reviewsState)
  );

  const rail = buildRail(listing, state);
  const layout = el(
    "div",
    { class: "stay-layout" },
    content,
    rail.element
  );

  const shell = el("div", { class: "shell" }, gallery.desktop, gallery.mobile, gallery.controls, header, hostRow, layout);
  const similar = el("div", { class: "shell" });
  const mobileReserve = buildMobileReserve(listing, state);

  view.append(topbar, shell, similar, mobileReserve, gallery.lightbox);

  const stopGallery = wireGallery(gallery, photos);
  wireRail(listing, state, rail);
  wireCalendar(listing, state, rail, content);
  loadReviews(listing, reviewsState, content);

  loadSimilar(listing, similar);
  requestQuote(listing, state, rail);

  shareImage(gallery.desktop.querySelector(".gallery-main img"), listing.id);
  return () => {
    stopGallery();
    content.querySelector("[aria-labelledby='availability-heading']")?._calendar?.destroy();
    rail.quoteController?.cancel();
  };
}

function photoSet(listing) {
  const base = String(listing.imageUrl ?? "").replace(/-\d+\.webp$/, "");
  return [
    { src: `${base}-1200.webp`, alt: `${listing.title}, illustrative photograph` },
    { src: `${base}-d1.webp`, alt: `${listing.title}, closer crop` },
    { src: `${base}-d2.webp`, alt: `${listing.title}, alternate crop` }
  ];
}

function buildGallery(listing, photos) {
  const mainImage = imageFrame(photos[0], "gallery-main", listing, true);
  const sideOne = imageFrame(photos[1], "gallery-side", listing, false, 1);
  const sideTwo = imageFrame(photos[2], "gallery-side", listing, false, 2);

  const viewAll = el(
    "button",
    { type: "button", class: "view-all-photos", "data-photo": "0", text: "View all photos" },
    icon("image-square", "icon icon-16")
  );

  const desktop = el(
    "div",
    { class: "stay-gallery" },
    mainImage,
    sideOne,
    sideTwo,
    viewAll
  );

  const mobile = el("div", { class: "gallery-mobile" });
  const counter = el("span", { class: "gallery-counter", text: `1 / 3` });

  photos.forEach((photo, index) => {
    const button = el("button", {
      type: "button",
      class: "media-frame",
      "data-photo": String(index),
      "aria-label": `Open photo ${index + 1} of ${photos.length}`
    });
    button.append(
      el("img", {
        src: photo.src,
        alt: photo.alt,
        loading: index === 0 ? "eager" : "lazy",
        decoding: "async",
        width: 1200,
        height: 900
      })
    );
    mobile.append(button);
  });

  mobile.append(counter);
  const controls = el("div", { class: "gallery-controls" },
    el("span", { text: "Swipe to explore" }),
    el("div", { class: "row-actions" },
      el("button", { type: "button", class: "icon-btn", "data-action": "gallery-prev", "aria-label": "Previous gallery image", disabled: true }, icon("caret-left")),
      el("button", { type: "button", class: "icon-btn", "data-action": "gallery-next", "aria-label": "Next gallery image" }, icon("caret-right"))));

  const template = document.getElementById("tpl-lightbox");
  const lightbox = template.content.firstElementChild.cloneNode(true);

  return { desktop, mobile, controls, lightbox, counter };
}

function imageFrame(photo, className, listing, eager, index = 0) {
  const button = el("button", {
    type: "button",
    class: `media-frame ${className}`,
    "aria-label": `Open photos of ${listing.title}`
  });

  const img = el("img", {
    src: photo.src,
    alt: photo.alt,
    loading: eager ? "eager" : "lazy",
    decoding: "async",
    width: 1200,
    height: 800
  });

  img.addEventListener(
    "error",
    () => button.replaceChildren(el("div", { class: "img-fallback", text: listing.address.city })),
    { once: true }
  );

  button.append(img);
  button.dataset.photo = String(index);
  return button;
}

function wireGallery(gallery, photos) {
  const dialog = gallery.lightbox;
  const image = dialog.querySelector('[data-role="lightbox-image"]');
  const counter = dialog.querySelector('[data-role="lightbox-counter"]');
  let index = 0;

  const show = (next) => {
    index = (next + photos.length) % photos.length;
    image.src = photos[index].src;
    image.alt = photos[index].alt;
    counter.textContent = `${index + 1} / ${photos.length}`;
    changeFeedback(image);
  };

  const open = (start) => {
    show(start);
    document.body.append(dialog);
    openDialog(dialog, { onClose: () => dialog.remove() });
  };

  for (const trigger of [...gallery.desktop.querySelectorAll("[data-photo]"), ...gallery.mobile.querySelectorAll("[data-photo]")]) {
    trigger.addEventListener("click", () => open(Number(trigger.dataset.photo) || 0));
  }

  dialog.querySelector('[data-action="close-lightbox"]').addEventListener("click", () => dialog.close());
  dialog.querySelector('[data-action="prev-photo"]').addEventListener("click", () => show(index - 1));
  dialog.querySelector('[data-action="next-photo"]').addEventListener("click", () => show(index + 1));

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      show(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      show(index + 1);
    }
  });

  let frame = 1;
  const mobileFrames = [...gallery.mobile.querySelectorAll(".media-frame")];
  const previous = gallery.controls.querySelector('[data-action="gallery-prev"]');
  const next = gallery.controls.querySelector('[data-action="gallery-next"]');
  const move = delta => {
    const target = Math.max(0, Math.min(mobileFrames.length - 1, frame - 1 + delta));
    mobileFrames[target].scrollIntoView({ behavior: reducedMotion() ? "instant" : "smooth", block: "nearest", inline: "center" });
  };
  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const position = [...gallery.mobile.querySelectorAll(".media-frame")].indexOf(entry.target);
          if (position >= 0) {
            frame = position + 1;
            gallery.counter.textContent = `${frame} / ${photos.length}`;
            previous.disabled = frame === 1;
            next.disabled = frame === photos.length;
          }
        }
      }
    },
    { threshold: 0.6, root: gallery.mobile }
  );

  for (const item of gallery.mobile.querySelectorAll(".media-frame")) {
    observer.observe(item);
  }
  return () => observer.disconnect();
}

function buildDescription(listing) {
  const section = el("section", { "aria-labelledby": "about-heading" });
  const long = listing.description.length > 320;
  const paragraph = el("p", {
    class: long ? "is-clamped" : "",
    text: listing.description
  });

  section.append(el("h2", { id: "about-heading", text: "About this stay" }), paragraph);

  if (long) {
    const toggle = el("button", { type: "button", class: "btn-quiet", text: "Show more" });
    toggle.addEventListener("click", () => {
      const clamped = paragraph.classList.toggle("is-clamped");
      toggle.textContent = clamped ? "Show more" : "Show less";
    });
    section.append(toggle);
  }

  return section;
}

function buildAmenities(listing) {
  const section = el("section", { "aria-labelledby": "amenities-heading" });
  section.append(el("h2", { id: "amenities-heading", text: "What this place offers" }));

  const groups = amenityGroups(listing.amenities ?? []);
  const container = el("div", { class: "amenity-groups" });
  const allItems = groups.flatMap((group) => group.items);
  const visible = new Set(allItems.slice(0, 8));
  let expanded = false;

  const draw = () => {
    container.replaceChildren();

    for (const group of groups) {
      const items = group.items.filter((name) => expanded || visible.has(name));
      if (items.length === 0) {
        continue;
      }

      const list = el("ul", { class: "amenity-list" });
      for (const name of items) {
        list.append(
          el(
            "li",
            { class: "amenity" },
            icon(amenityIcon(name), "icon icon-20"),
            el("span", { text: amenityLabel(name) })
          )
        );
      }

      container.append(
        el(
          "div",
          { class: "amenity-group" },
          el("h3", { text: group.title }),
          list
        )
      );
    }
  };

  draw();
  section.append(container);

  if (allItems.length > 8) {
    const toggle = el("button", {
      type: "button",
      class: "btn btn-secondary",
      text: `Show all ${allItems.length}`
    });
    toggle.addEventListener("click", () => {
      expanded = !expanded;
      toggle.textContent = expanded ? "Show fewer" : `Show all ${allItems.length}`;
      draw();
    });
    section.append(toggle);
  }

  return section;
}

function buildAvailability(listing, state) {
  const section = el("section", { "aria-labelledby": "availability-heading" });
  section.append(
    el("h2", { id: "availability-heading", text: "Availability" }),
    el("p", {
      class: "field-hint",
      text: "Prices are per night. A booked night is shown with a hatch and is not selectable."
    })
  );

  const calendar = createCalendar({
    listingId: listing.id,
    checkIn: state.checkIn,
    checkOut: state.checkOut,
    minimumStayNights: listing.pricing.minNights,
    onChange: ({ checkIn, checkOut }) => {
      state.checkIn = checkIn;
      state.checkOut = checkOut;
      const rail = document.querySelector(".stay-rail");
      if (rail) {
        rail.querySelector("#rail-checkin").value = checkIn;
        rail.querySelector("#rail-checkout").value = checkOut;
      }
      section.dispatchEvent(new CustomEvent("stay:dates", { bubbles: true }));
    }
  });

  section.append(calendar.element);
  section._calendar = calendar;
  return section;
}

function buildRules(listing) {
  const rules = listing.houseRules ?? {};
  const section = el("section", { "aria-labelledby": "rules-heading" });
  section.append(el("h2", { id: "rules-heading", text: "House rules" }));

  const list = el("dl", { class: "rules-list" });
  list.append(
    ruleRow("Check-in", "From 15:00"),
    ruleRow("Check-out", "Before 11:00"),
    ruleRow("Quiet hours", `${rules.quietHoursStart ?? "22:00"} to ${rules.quietHoursEnd ?? "08:00"}`),
    ruleRow("Smoking", rules.smokingAllowed ? "Allowed" : "Not allowed"),
    ruleRow("Parties", rules.partiesAllowed ? "Allowed" : "Not allowed"),
    ruleRow("Pets", rules.maxPets > 0 ? `Up to ${rules.maxPets}` : "Not allowed"),
    ruleRow("Minimum stay", nightsLabel(listing.pricing.minNights ?? 2))
  );

  section.append(list);
  return section;
}

function ruleRow(term, value) {
  return el("div", {}, el("dt", { text: term }), el("dd", { text: value }));
}

function buildReviewsShell(listing, reviewsState) {
  const section = el("section", { "aria-labelledby": "reviews-heading" });
  section.append(
    el(
      "div",
      { class: "u-between" },
      el("h2", { id: "reviews-heading", text: "Reviews" }),
      el("button", { type: "button", class: "btn btn-secondary", "data-action": "write-review", text: "Write a review" })
    ),
    el("div", { "data-role": "reviews-body" })
  );

  section.querySelector('[data-action="write-review"]').addEventListener("click", () => {
    openReviewDialog(listing, section);
  });

  return section;
}

async function loadReviews(listing, reviewsState, content) {
  const body = content.querySelector('[data-role="reviews-body"]');
  if (!body) {
    return;
  }

  setChildren(
    body,
    el(
      "div",
      { class: "stack" },
      el("div", { class: "skeleton skeleton-text skeleton-text-wide" }),
      el("div", { class: "skeleton skeleton-text skeleton-text-short" })
    )
  );

  try {
    const response = await api.reviews(listing.id, 1, 50);
    reviewsState.all = response.reviews;
    reviewsState.visible = 5;
    renderReviews(listing, reviewsState, body);
  } catch (error) {
    setChildren(body, el("p", { class: "field-error", text: error.message }));
  }
}

function renderReviews(listing, reviewsState, body) {
  const reviews = reviewsState.all;
  const total = reviews.length;

  if (total === 0) {
    setChildren(
      body,
      el(
        "div",
        { class: "empty-state" },
        el("p", { text: "No reviews yet. Be the first to write one." })
      )
    );
    return;
  }

  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / total;
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((review) => review.rating === stars).length
  }));

  const summary = el(
    "div",
    { class: "review-summary" },
    el(
      "div",
      { class: "review-score" },
      el("strong", { text: rating(average) }),
      el("span", { class: "muted", text: reviewsLabel(total) })
    ),
    el(
      "div",
      { class: "distribution" },
      ...distribution.map((row) =>
        el(
          "div",
          { class: "distribution-row" },
          el("span", { text: `${row.stars} star` }),
          el(
            "progress",
            { class: "distribution-bar", value: row.count, max: total || 1, "aria-label": `${row.stars} star reviews` }
          ),
          el("span", { text: String(row.count) })
        )
      )
    )
  );

  const list = el("div", { class: "reviews-list" });
  for (const review of reviews.slice(0, reviewsState.visible)) {
    list.append(reviewItem(review));
  }

  const nodes = [summary, list];

  if (reviewsState.visible < total) {
    const more = el("button", {
      type: "button",
      class: "btn btn-secondary",
      text: `Show ${Math.min(5, total - reviewsState.visible)} more`
    });
    more.addEventListener("click", () => {
      reviewsState.visible = Math.min(total, reviewsState.visible + 5);
      renderReviews(listing, reviewsState, body);
    });
    nodes.push(more);
  }

  setChildren(body, ...nodes);
}

function reviewItem(review) {
  return el(
    "article",
    { class: "review-item" },
    el(
      "div",
      { class: "review-head" },
      el("span", { class: "avatar", "aria-hidden": "true", text: initials(review.authorName) }),
      el(
        "div",
        { class: "review-meta" },
        el("strong", { text: review.authorName }),
        el("span", { text: formatDate(review.createdAt) })
      ),
      el(
        "span",
        { class: "stay-rating" },
        icon("star", "icon"),
        el("span", { text: String(review.rating) })
      )
    ),
    el("p", { class: "review-comment", text: review.comment })
  );
}

function openReviewDialog(listing, section) {
  const template = document.getElementById("tpl-review");
  const dialog = template.content.firstElementChild.cloneNode(true);
  const form = dialog.querySelector('[data-role="review-form"]');
  const picker = dialog.querySelector('[data-role="star-picker"]');
  const stars = [...dialog.querySelectorAll(".star-option")];
  const name = dialog.querySelector("#review-name");
  const comment = dialog.querySelector("#review-comment");
  const count = dialog.querySelector('[data-role="review-count"]');
  const summary = dialog.querySelector('[data-role="review-error"]');
  const submit = dialog.querySelector('button[type="submit"]');

  const paintStars = (value) => {
    for (const star of stars) {
      star.classList.toggle("is-on", Number(star.dataset.star) <= value);
    }
  };

  paintStars(5);

  for (const star of stars) {
    star.querySelector("input").addEventListener("change", () => paintStars(Number(star.dataset.star)));
  }

  comment.addEventListener("input", () => {
    count.textContent = `${comment.value.length} / 1200`;
    count.classList.toggle("is-over", comment.value.length > 1200);
  });

  dialog.querySelector('[data-action="close-review"]').addEventListener("click", () => dialog.close());
  dialog.querySelectorAll('[data-action="close-review"]').forEach((button) => {
    if (button.type !== "button") {
      return;
    }
    button.addEventListener("click", () => dialog.close());
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    summary.hidden = true;

    const ratingValue = Number(dialog.querySelector('input[name="rating"]:checked')?.value ?? 0);
    const authorName = name.value.trim();
    const body = comment.value.trim();
    let invalid = false;

    setField(name, dialog.querySelector('[data-error-for="authorName"]'), authorName.length >= 2 && authorName.length <= 80 ? "" : "Enter your name, 2 to 80 characters.");
    setField(comment, dialog.querySelector('[data-error-for="comment"]'), body.length >= 20 && body.length <= 1200 ? "" : "Write at least 20 characters.");

    invalid = authorName.length < 2 || body.length < 20;
    if (invalid) {
      return;
    }

    submit.disabled = true;
    submit.textContent = "Publishing";

    try {
      await api.addReview(listing.id, { authorName, rating: ratingValue, comment: body });
      dialog.close();
      toast("Your review is published.");
      const body_ = section.querySelector('[data-role="reviews-body"]');
      const refreshed = await api.reviews(listing.id, 1, 50);
      const state = { all: refreshed.reviews, visible: 5 };
      renderReviews(listing, state, body_);
      const detail = await api.listing(listing.id);
      cacheListing(detail);
    } catch (error) {
      if (error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          const input = field === "authorName" ? name : field === "comment" ? comment : null;
          if (input) {
            setField(input, dialog.querySelector(`[data-error-for="${field}"]`), messages[0]);
          }
        }
      }

      summary.hidden = false;
      summary.replaceChildren(el("p", { text: error.message }));
    } finally {
      submit.disabled = false;
      submit.textContent = "Publish review";
    }
  });

  document.body.append(dialog);
  openDialog(dialog, { initialFocus: name, onClose: () => dialog.remove() });
}

function setField(input, errorNode, message) {
  if (errorNode) {
    errorNode.textContent = message;
  }
  if (message) {
    input.setAttribute("aria-invalid", "true");
  } else {
    input.removeAttribute("aria-invalid");
  }
}

function buildRail(listing, state) {
  const element = el("aside", { class: "stay-rail", "aria-label": "Booking" });

  const checkIn = el("input", {
    class: "input",
    id: "rail-checkin",
    type: "date",
    min: toIso(today()),
    max: toIso(addDays(today(), 548)),
    value: state.checkIn
  });
  const checkOut = el("input", {
    class: "input",
    id: "rail-checkout",
    type: "date",
    min: toIso(today()),
    max: toIso(addDays(today(), 548)),
    value: state.checkOut
  });

  const guestsOutput = el("strong", { "data-role": "rail-guests", text: guestsLabel(state.guests) });

  const quotePanel = el("div", { class: "quote-panel", "data-role": "rail-quote" });
  const reserve = el("button", {
    type: "button",
    class: "btn btn-primary btn-block",
    "data-action": "reserve",
    text: "Reserve"
  });

  element.append(
    el(
      "div",
      { class: "rail-price" },
      el(
        "span",
        { class: "price" },
        el("span", { class: "price-amount", text: money(listing.pricing.baseNightlyRate, { decimals: 0 }) }),
        el("span", { class: "price-suffix", text: "night" })
      ),
      listing.reviewCount > 0
        ? el(
          "span",
          { class: "stay-rating" },
          icon("star", "icon"),
          el("span", { text: rating(listing.starRating) })
        )
        : el("span", { class: "muted", text: "New" })
    ),
    el(
      "div",
      { class: "rail-dates" },
      el("div", { class: "rail-cell" }, el("label", { for: "rail-checkin", text: "Check in" }), checkIn),
      el("div", { class: "rail-cell" }, el("label", { for: "rail-checkout", text: "Check out" }), checkOut)
    ),
    el(
      "div",
      { class: "rail-guests" },
      el(
        "div",
        { class: "rail-guests-label" },
        el("span", { text: "Guests" }),
        guestsOutput
      ),
      el(
        "div",
        { class: "stepper" },
        el(
          "button",
          { type: "button", "data-action": "rail-guests-minus", "aria-label": "One guest fewer" },
          icon("minus", "icon icon-16")
        ),
        el("output", { "data-role": "rail-guests-count", text: String(state.guests) }),
        el(
          "button",
          { type: "button", "data-action": "rail-guests-plus", "aria-label": "One guest more" },
          icon("plus", "icon icon-16")
        )
      )
    ),
    quotePanel,
    reserve,
    el("button", {
      type: "button",
      class: "btn btn-quiet btn-block",
      text: "Check availability",
      onClick: () => document.getElementById("availability-heading")?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      })
    }),
    el("p", { class: "deposit-note", text: "You will not be charged. This is a demo payment." })
  );

  return { element, checkIn, checkOut, guestsOutput, quotePanel, reserve };
}

function wireRail(listing, state, rail) {
  const maxGuests = listing.capacity.maxGuests;

  rail.checkIn.addEventListener("change", () => {
    state.checkIn = rail.checkIn.value;
    syncCalendar(listing, state);
    requestQuote(listing, state, rail);
  });

  rail.checkOut.addEventListener("change", () => {
    state.checkOut = rail.checkOut.value;
    syncCalendar(listing, state);
    requestQuote(listing, state, rail);
  });

  rail.element.querySelector('[data-action="rail-guests-minus"]').addEventListener("click", () => {
    state.guests = Math.max(1, state.guests - 1);
    updateGuests();
    requestQuote(listing, state, rail);
  });

  rail.element.querySelector('[data-action="rail-guests-plus"]').addEventListener("click", () => {
    state.guests = Math.min(maxGuests, state.guests + 1);
    updateGuests();
    requestQuote(listing, state, rail);
  });

  function updateGuests() {
    rail.element.querySelector('[data-role="rail-guests"]').textContent = guestsLabel(state.guests);
    rail.element.querySelector('[data-role="rail-guests-count"]').textContent = String(state.guests);
    rail.element.querySelector('[data-action="rail-guests-minus"]').disabled = state.guests <= 1;
    rail.element.querySelector('[data-action="rail-guests-plus"]').disabled = state.guests >= maxGuests;
    const mobileGuests = document.querySelector('[data-role="mobile-guests"]');
    if (mobileGuests) {
      mobileGuests.textContent = guestsLabel(state.guests);
    }
  }

  updateGuests();

  rail.reserve.addEventListener("click", () => {
    openBookingSheet({
      listing,
      checkIn: state.checkIn,
      checkOut: state.checkOut,
      guests: state.guests
    });
  });
}

function syncCalendar(listing, state) {
  const section = document.querySelector('[aria-labelledby="availability-heading"]');
  section?._calendar?.setDates(state.checkIn, state.checkOut);
}

function wireCalendar(listing, state, rail, content) {
  content.addEventListener("stay:dates", () => {
    requestQuote(listing, state, rail);
  });
}

function requestQuote(listing, state, rail) {
  const checkIn = parseDate(state.checkIn);
  const checkOut = parseDate(state.checkOut);

  if (!checkIn || !checkOut || checkOut <= checkIn) {
    rail.quoteController?.cancel();
    state.quote = null;
    setChildren(rail.quotePanel, el("p", { class: "quote-note", text: "Choose dates to see the total." }));
    rail.reserve.disabled = true;
    const mobileButton = document.querySelector('[data-action="mobile-reserve"]');
    if (mobileButton) mobileButton.disabled = true;
    const total = document.querySelector('[data-role="mobile-total"]');
    const suffix = document.querySelector('[data-role="mobile-suffix"]');
    if (total) total.textContent = "Choose dates";
    if (suffix) suffix.textContent = "";
    return;
  }

  const controller = rail.quoteController ?? createQuoteController({
    onUpdate: (update) => renderRailQuote(listing, state, rail, update)
  });
  rail.quoteController = controller;

  controller.request({
    listingId: listing.id,
    checkInDate: state.checkIn,
    checkOutDate: state.checkOut,
    guestsCount: state.guests
  });
}

function renderRailQuote(listing, state, rail, update) {
  state.quoteStatus = update.status;
  state.quote = update.quote ?? null;
  if (update.status !== "success" || !update.quote?.isAvailable) {
    const button = document.querySelector('[data-action="mobile-reserve"]');
    const total = document.querySelector('[data-role="mobile-total"]');
    const suffix = document.querySelector('[data-role="mobile-suffix"]');
    if (button) button.disabled = true;
    if (total) total.textContent = update.status === "loading" ? "Checking dates" : "Check dates";
    if (suffix) suffix.textContent = "";
  }
  if (update.status === "loading") {
    setChildren(
      rail.quotePanel,
      el(
        "div",
        { class: "quote-loading" },
        icon("spinner-gap", "icon icon-16"),
        el("span", { text: "Checking availability" })
      )
    );
    rail.reserve.disabled = true;
    return;
  }

  if (update.status === "error") {
    setChildren(
      rail.quotePanel,
      el("p", { class: "quote-alert", text: quoteErrorMessage(update.error, listing.pricing.minNights) })
    );
    rail.reserve.disabled = true;
    return;
  }

  const quote = update.quote;
  if (!quote?.isAvailable) {
    setChildren(
      rail.quotePanel,
      el("p", {
        class: "quote-alert",
        text: quote?.unavailableReason ?? "Those dates are no longer available."
      }),
      el("button", {
        type: "button",
        class: "btn btn-secondary btn-sm",
        text: "Check the calendar",
        onClick: () => document.getElementById("availability-heading")?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        })
      })
    );
    rail.reserve.disabled = true;
    const mobileButton = document.querySelector('[data-action="mobile-reserve"]');
    if (mobileButton) {
      mobileButton.disabled = true;
    }
    return;
  }

  setChildren(rail.quotePanel, quoteTable(quote));
  rail.reserve.disabled = false;

  const mobileTotal = document.querySelector('[data-role="mobile-total"]');
  const mobileSuffix = document.querySelector('[data-role="mobile-suffix"]');
  const mobileButton = document.querySelector('[data-action="mobile-reserve"]');
  if (mobileTotal) {
    mobileTotal.textContent = money(quote.totalAmount, { decimals: 0 });
  }
  if (mobileSuffix) {
    mobileSuffix.textContent = "total";
  }
  if (mobileButton) {
    mobileButton.disabled = false;
  }
}

function buildMobileReserve(listing, state) {
  const button = el("button", {
    type: "button",
    class: "btn btn-primary",
    "data-action": "mobile-reserve",
    disabled: true,
    text: "Reserve"
  });

  button.addEventListener("click", () => {
    openBookingSheet({
      listing,
      checkIn: state.checkIn,
      checkOut: state.checkOut,
      guests: state.guests
    });
  });

  return el(
    "div",
    { class: "mobile-reserve" },
    el(
      "div",
      {},
      el(
        "span",
        { class: "price" },
        el("span", { class: "price-amount", "data-role": "mobile-total", text: money(listing.pricing.baseNightlyRate, { decimals: 0 }) }),
        el("span", { class: "price-suffix", "data-role": "mobile-suffix", text: "night" })
      ),
      el("span", { class: "u-text-xs muted", "data-role": "mobile-guests", text: guestsLabel(state.guests) })
    ),
    button
  );
}

async function loadSimilar(listing, container) {
  try {
    const response = await api.search({
      query: listing.address.city,
      pageSize: 8,
      guestsCount: 1
    });

    const similar = response.results.filter((item) => item.id !== listing.id).slice(0, 3);
    if (similar.length === 0) {
      return;
    }

    const grid = el("div", { class: "similar-grid" });
    for (const item of similar) {
      grid.append(stayCard(item, { ratio: "3-2", sizes: "(max-width: 699px) 100vw, 30vw" }));
    }

    container.append(
      el(
        "section",
        { class: "similar-section" },
        el("h2", { class: "u-mt-6", text: `More in ${listing.address.city}` }),
        grid
      )
    );
  } catch {
    // Similar stays are a bonus; a failure should not disturb the page.
  }
}

async function messageHost(listing) {
  let reservation = getState().reservations.find((item) => item.listingId === listing.id);

  if (!reservation) {
    try {
      const reservations = await api.reservations();
      setReservations(reservations);
      reservation = reservations.find((item) => item.listingId === listing.id);
    } catch {
      // Fall through to the honest explanation.
    }
  }

  if (reservation) {
    openChat({ reservation, listing, hostName: listing.host.name });
    return;
  }

  messageDialog({
    title: "Messaging opens after you book",
    message: "Message threads belong to a booking, so there is nothing to reply to yet. For a question before you book, write to hello@fatihomes.example and the host will answer.",
    actionHref: "mailto:hello@fatihomes.example"
  });
}
