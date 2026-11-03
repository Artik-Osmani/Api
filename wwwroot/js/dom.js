/**
 * DOM helpers. Structure is always built with createElement; server strings are only ever assigned
 * through textContent, never parsed as markup.
 */

const SVG_NS = "http://www.w3.org/2000/svg";

export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === null || value === undefined || value === false) {
      continue;
    }

    if (key === "class") {
      node.className = value;
    } else if (key === "text") {
      node.textContent = String(value);
    } else if (key === "dataset") {
      Object.assign(node.dataset, value);
    } else if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === "href") {
      node.setAttribute("href", safeHref(value));
    } else if (key === "src") {
      node.setAttribute("src", safeUrl(value));
    } else if (value === true) {
      node.setAttribute(key, "");
    } else {
      node.setAttribute(key, String(value));
    }
  }

  append(node, children);
  return node;
}

export function append(parent, children) {
  for (const child of flatten(children)) {
    if (child === null || child === undefined || child === false) {
      continue;
    }

    parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }

  return parent;
}

export function clear(node) {
  if (node) {
    node.replaceChildren();
  }
}

export function frag(...children) {
  return append(document.createDocumentFragment(), children);
}

function flatten(children) {
  return children.flat(Infinity);
}

export function icon(name, className = "icon") {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", className);
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  const use = document.createElementNS(SVG_NS, "use");
  use.setAttribute("href", `/images/icons.svg#icon-${name}`);
  svg.append(use);
  return svg;
}

export function safeHref(value) {
  const href = String(value ?? "").trim();
  if (href.startsWith("/") && !href.startsWith("//")) {
    return href;
  }

  if (href.startsWith("#")) {
    return href;
  }

  if (/^https:\/\//i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href)) {
    return href;
  }

  return "#";
}

export function safeUrl(value) {
  const url = String(value ?? "").trim();
  if (url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }

  return "";
}

/**
 * Builds an image element with a responsive srcset derived from the listing image path. The API
 * stores one path such as /images/stays/pristina-loft-1200.webp and the variants share the base.
 */
export function stayImage(listing, options = {}) {
  const {
    ratio = "3-2",
    sizes = "(max-width: 699px) 100vw, 33vw",
    eager = false,
    className = ""
  } = options;

  const base = String(listing.imageUrl ?? "").replace(/-\d+\.webp$/, "");
  const portrait = ratio === "4-5";
  const widths = portrait ? [800] : [800, 1200];
  const suffix = portrait ? "p" : "";
  const dimensions = {
    "16-10": [1600, 1000],
    "4-5": [1200, 1500],
    "3-2": [1200, 800],
    "1-1": [1200, 1200],
    "4-3": [1200, 900]
  }[ratio] ?? [1200, 800];

  const srcset = base
    ? widths.map((width) => `${base}-${suffix}${width}.webp ${width}w`).join(", ")
    : "";

  const img = el("img", {
    src: base ? `${base}-${suffix}1200.webp` : "",
    srcset: srcset || null,
    sizes: srcset ? sizes : null,
    alt: `${listing.title}, ${listing.address?.city ?? ""}`.trim(),
    width: dimensions[0],
    height: dimensions[1],
    loading: eager ? "eager" : "lazy",
    decoding: "async",
    fetchpriority: eager ? "high" : null,
    class: className
  });

  attachImageFallback(img, listing.address?.city ?? listing.title ?? "Photo unavailable");
  return img;
}

export function attachImageFallback(img, label) {
  img.addEventListener(
    "error",
    () => {
      const frame = img.closest(".media-frame") ?? img.parentElement;
      if (!frame) {
        return;
      }

      frame.replaceChildren(el("div", { class: "img-fallback", text: label }));
    },
    { once: true }
  );
}

export function mediaFrame(listing, options = {}) {
  const frame = el("div", { class: `media-frame ratio-${options.ratio ?? "3-2"}` });
  frame.append(stayImage(listing, options));
  return frame;
}

export function delegate(root, type, selector, handler) {
  const listener = (event) => {
    const target = event.target instanceof Element ? event.target.closest(selector) : null;
    if (target && root.contains(target)) {
      handler(event, target);
    }
  };

  root.addEventListener(type, listener);
  return () => root.removeEventListener(type, listener);
}

export function on(root, type, handler, options) {
  root.addEventListener(type, handler, options);
  return () => root.removeEventListener(type, handler, options);
}

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

export function setChildren(node, ...children) {
  node.replaceChildren();
  append(node, children);
  return node;
}

export function initials(name) {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
