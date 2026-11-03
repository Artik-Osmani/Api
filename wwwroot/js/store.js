/**
 * Small observable store. Views own their render, the store owns the data they share: the listing
 * cache, favorites and reservations. Nothing reads another view's DOM.
 */

const state = {
  listings: [],
  listingCache: new Map(),
  favoriteListings: [],
  favoriteIds: new Set(),
  favoritesLoaded: false,
  reservations: [],
  hosts: [],
  filters: {
    query: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    category: "",
    sort: "recommended"
  },
  lastSearch: null
};

const subscribers = new Set();

export function getState() {
  return state;
}

export function setState(patch) {
  Object.assign(state, patch);
  emit();
}

export function subscribe(listener) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

function emit() {
  for (const listener of subscribers) {
    listener(state);
  }
}

export function cacheListings(listings = []) {
  let changed = false;
  for (const listing of listings) {
    if (listing?.id) {
      state.listingCache.set(listing.id, listing);
      changed = true;
    }
  }

  if (changed) {
    emit();
  }
}

export function cacheListing(listing) {
  if (listing?.id) {
    state.listingCache.set(listing.id, listing);
    emit();
  }
}

export function cachedListing(id) {
  return state.listingCache.get(id) ?? null;
}

export function setFavorites(listings = []) {
  state.favoriteListings = [...listings].sort((a, b) => a.title.localeCompare(b.title));
  state.favoriteIds = new Set(state.favoriteListings.map((listing) => listing.id));
  state.favoritesLoaded = true;
  cacheListings(state.favoriteListings);
  emit();
}

export function isFavorite(id) {
  return state.favoriteIds.has(id);
}

export function setFavorite(id, favorited, listing = null) {
  if (favorited) {
    state.favoriteIds.add(id);
    if (listing && !state.favoriteListings.some((item) => item.id === id)) {
      state.favoriteListings = [...state.favoriteListings, listing].sort((a, b) => a.title.localeCompare(b.title));
    }
  } else {
    state.favoriteIds.delete(id);
    state.favoriteListings = state.favoriteListings.filter((item) => item.id !== id);
  }

  emit();
}

export function setReservations(reservations = []) {
  state.reservations = [...reservations].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  emit();
}

export function setHosts(hosts = []) {
  state.hosts = [...hosts];
  emit();
}

export function setFilters(patch) {
  state.filters = { ...state.filters, ...patch };
  emit();
}

export function resetFilters() {
  state.filters = {
    query: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    category: "",
    sort: "recommended"
  };
  emit();
}

/** Merge one reservation returned by the API into the cached list. */
export function upsertReservation(reservation) {
  if (!reservation?.id) {
    return;
  }

  const index = state.reservations.findIndex((item) => item.id === reservation.id);
  if (index >= 0) {
    state.reservations[index] = reservation;
  } else {
    state.reservations = [reservation, ...state.reservations];
  }

  emit();
}

