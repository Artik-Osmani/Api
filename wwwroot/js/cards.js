import { el, icon, stayImage, initials } from "./dom.js";
import { api, ApiError } from "./api.js";
import { getState, isFavorite, setFavorite } from "./store.js";
import { money, rating, reviewsLabel } from "./format.js";
import { amenityLabel, categoryLabel, placeLabel } from "./icons.js";
import { toast } from "./ui.js";
import { saveFeedback } from "./motion.js";

const favoriteWrites = new Set();

/**
 * The one stay card used by Explore, Saved, Hosts and Similar stays. The card is a link; the heart
 * is a sibling button because a button cannot live inside a link.
 */
export function stayCard(listing, options = {}) {
  const {
    ratio = "3-2",
    sizes = "(max-width: 699px) 100vw, (max-width: 1099px) 50vw, 33vw",
    eager = false,
    showAmenities = true
  } = options;

  const media = el("div", { class: `media-frame stay-card-media ratio-${ratio}` });
  media.append(stayImage(listing, { ratio, sizes, eager }));

  const meta = el("p", { class: "stay-card-place" });
  meta.append(
    placeLabel(listing),
    el("span", { text: ` · ${categoryLabel(listing.category)}` })
  );

  const body = [
    media,
    el("h3", { class: "stay-card-title", text: listing.title }),
    meta
  ];

  if (showAmenities && listing.amenities?.length) {
    body.push(
      el("p", {
        class: "stay-card-amenities",
        text: listing.amenities.slice(0, 3).map(amenityLabel).join(" · ")
      })
    );
  } else {
    body.push(el("p", { class: "stay-card-amenities", text: "" }));
  }

  const ratingNode = el("span", { class: "stay-rating" });
  if (listing.reviewCount > 0) {
    ratingNode.append(
      icon("star", "icon"),
      el("span", { text: rating(listing.starRating) }),
      el("span", { class: "muted", text: `(${listing.reviewCount})` })
    );
  } else {
    ratingNode.append(el("span", { class: "muted", text: "New" }));
  }

  const priceNode = el(
    "span",
    { class: "price" },
    el("span", { class: "price-amount", text: money(listing.pricing.baseNightlyRate, { decimals: 0 }) }),
    el("span", { class: "price-suffix", text: "/ night" })
  );

  body.push(el("div", { class: "stay-card-foot" }, ratingNode, priceNode));

  const link = el("a", { class: "stay-card", href: `#/stay/${listing.id}` }, ...body);
  const heart = heartButton(listing);
  const wrapper = el("article", { class: "stay-card-item" });
  wrapper.append(link, heart);
  return wrapper;
}

export function heartButton(listing, className = "heart-btn") {
  const button = el("button", {
    type: "button",
    class: className,
    "data-listing": listing.id,
    disabled: favoriteWrites.has(listing.id),
    "aria-pressed": String(isFavorite(listing.id)),
    "aria-label": isFavorite(listing.id) ? `Remove ${listing.title} from saved` : `Save ${listing.title}`
  });

  button.append(icon("heart"));

  button.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (favoriteWrites.has(listing.id)) return;
    favoriteWrites.add(listing.id);
    button.disabled = true;
    button.setAttribute("aria-busy", "true");

    const wasFavorite = isFavorite(listing.id);
    applyHeart(button, listing, !wasFavorite);

    try {
      const result = await api.toggleFavorite(listing.id);
      applyHeart(button, listing, result.favorited);
      saveFeedback(document.querySelector(`[data-listing="${listing.id}"]`));
      toast(result.favorited ? "Saved to your list." : "Removed from saved.");
    } catch (error) {
      applyHeart(button, listing, wasFavorite);
      toast(error instanceof ApiError ? error.message : "That did not save. Try again.", { tone: "error" });
    } finally {
      favoriteWrites.delete(listing.id);
      for (const heart of document.querySelectorAll(`[data-listing="${listing.id}"]`)) {
        heart.disabled = false;
        heart.removeAttribute("aria-busy");
      }
    }
  });

  return button;
}

export function applyHeart(button, listing, favorited) {
  setFavorite(listing.id, favorited, listing);
  const instances = new Set([button, ...document.querySelectorAll(`[data-listing="${listing.id}"]`)]);
  for (const heart of instances) {
    heart.setAttribute("aria-pressed", String(favorited));
    heart.setAttribute(
      "aria-label",
      favorited ? `Remove ${listing.title} from saved` : `Save ${listing.title}`
    );
  }
}

export function ratingLine(listing) {
  if (!listing.reviewCount) {
    return el("span", { class: "stay-rating" }, el("span", { class: "muted", text: "New" }));
  }

  return el(
    "span",
    { class: "stay-rating" },
    icon("star", "icon"),
    el("span", { text: rating(listing.starRating) }),
    el("span", { class: "muted", text: ` · ${reviewsLabel(listing.reviewCount)}` })
  );
}

export function avatar(name, className = "avatar") {
  return el("span", { class: className, "aria-hidden": "true", text: initials(name) });
}

export function avatarRow(name, detail) {
  return el(
    "div",
    { class: "avatar-row" },
    avatar(name),
    el(
      "div",
      { class: "avatar-row-text" },
      el("strong", { text: name }),
      detail ? el("span", { text: detail }) : null
    )
  );
}

export function savedCount() {
  return getState().favoriteIds.size;
}
