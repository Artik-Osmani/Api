/** Human labels for API enums and amenities. No emoji anywhere. */

export const CATEGORY_LABELS = {
  entire_home: "Home",
  apartment: "Apartment",
  cabin: "Cabin",
  villa: "Villa",
  private_room: "Room",
  shared_room: "Shared room"
};

export const COUNTRY_NAMES = {
  XK: "Kosovo",
  AL: "Albania",
  MK: "North Macedonia",
  ME: "Montenegro",
  HR: "Croatia"
};

export const AMENITY_LABELS = {
  wifi: "Wi-Fi",
  workspace: "Workspace",
  kitchen: "Kitchen",
  air_conditioning: "Air conditioning",
  heating: "Heating",
  hot_water: "Hot water",
  self_check_in: "Self check-in",
  balcony: "Balcony",
  terrace: "Terrace",
  garden: "Garden",
  parking: "Parking",
  pet_friendly: "Pets allowed",
  fireplace: "Fireplace",
  sauna: "Sauna",
  hot_tub: "Hot tub",
  pool: "Pool",
  breakfast: "Breakfast",
  washing_machine: "Washing machine",
  family_friendly: "Family friendly",
  beach_access: "Beach access",
  tv: "Television",
  ev_charger: "EV charger"
};

const AMENITY_ICONS = {
  wifi: "wifi-high",
  workspace: "desktop",
  kitchen: "cooking-pot",
  air_conditioning: "snowflake",
  heating: "fire",
  hot_water: "coffee",
  self_check_in: "key",
  balcony: "sun",
  terrace: "sun",
  garden: "tree",
  parking: "car",
  pet_friendly: "paw-print",
  fireplace: "fire",
  sauna: "fire",
  hot_tub: "waves",
  pool: "waves",
  breakfast: "coffee",
  washing_machine: "washing-machine",
  family_friendly: "users",
  beach_access: "umbrella",
  tv: "television",
  ev_charger: "car"
};

const GROUPS = [
  {
    title: "Essentials",
    names: ["wifi", "kitchen", "washing_machine", "heating", "air_conditioning", "hot_water"]
  },
  {
    title: "Comfort",
    names: ["workspace", "tv", "fireplace", "sauna", "hot_tub", "pool", "breakfast"]
  },
  {
    title: "Outside",
    names: ["balcony", "terrace", "garden", "parking", "ev_charger", "beach_access"]
  },
  {
    title: "Good to know",
    names: ["self_check_in", "pet_friendly", "family_friendly"]
  }
];

export function categoryLabel(category) {
  return CATEGORY_LABELS[category] ?? "Stay";
}

export function countryName(code) {
  return COUNTRY_NAMES[code] ?? code ?? "";
}

export function amenityLabel(name) {
  return AMENITY_LABELS[name] ?? name.replaceAll("_", " ");
}

export function amenityIcon(name) {
  return AMENITY_ICONS[name] ?? "check";
}

export function amenityGroups(amenities = []) {
  const known = new Set(GROUPS.flatMap((group) => group.names));
  const groups = GROUPS.map((group) => ({
    title: group.title,
    items: group.names.filter((name) => amenities.includes(name))
  })).filter((group) => group.items.length > 0);

  const unknown = amenities.filter((name) => !known.has(name));
  if (unknown.length > 0) {
    groups.push({ title: "Also here", items: unknown });
  }

  return groups;
}

export function placeLabel(listing) {
  const city = listing?.address?.city ?? "";
  const country = countryName(listing?.address?.countryCode);
  if (city && country) {
    return `${city}, ${country}`;
  }

  return city || country || "Location to be confirmed";
}
