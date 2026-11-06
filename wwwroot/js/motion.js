/** Motion helpers. Everything here is opt-out under prefers-reduced-motion. */

export function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** A single acknowledgement, never a loop or a permanent inline style. */
export function saveFeedback(element) {
  if (!element?.isConnected || reducedMotion() || !element.animate) return;
  element.animate([
    { transform: "scale(1)" },
    { transform: "scale(0.88)", offset: 0.35 },
    { transform: "scale(1)" }
  ], { duration: 260, easing: "cubic-bezier(.22,.61,.36,1)" });
}

export function changeFeedback(element, direction = 1) {
  if (!element?.isConnected || reducedMotion() || !element.animate) return;
  element.animate([
    { opacity: 0.35, transform: `translateY(${direction * 8}px)` },
    { opacity: 1, transform: "translateY(0)" }
  ], { duration: 240, easing: "cubic-bezier(.22,.61,.36,1)" });
}

export function reveal(root = document) {
  const nodes = [...root.querySelectorAll(".reveal:not(.is-visible)")];
  if (nodes.length === 0) {
    return () => {};
  }

  if (reducedMotion() || !("IntersectionObserver" in window)) {
    for (const node of nodes) {
      node.classList.add("is-visible");
    }
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -5% 0px" }
  );

  for (const node of nodes) {
    observer.observe(node);
  }

  return () => observer.disconnect();
}

/**
 * Runs a DOM update inside a View Transition when the browser supports it. The shared image name is
 * applied by the caller and cleaned up when the transition finishes.
 */
export async function withViewTransition(update) {
  if (reducedMotion() || typeof document.startViewTransition !== "function") {
    await update();
    return;
  }

  const transition = document.startViewTransition(() => update());
  try {
    await transition.finished;
  } catch {
    // A skipped transition is not an error.
  }
}

const sharedNames = new Set();

export function shareImage(element, id) {
  if (!element || !id || reducedMotion()) {
    return () => {};
  }

  element.dataset.sharedImage = "true";
  sharedNames.add(element);

  return () => {
    delete element.dataset.sharedImage;
    sharedNames.delete(element);
  };
}

export function clearSharedImages() {
  for (const element of sharedNames) {
    delete element.dataset.sharedImage;
  }
  sharedNames.clear();
}

export function once(key) {
  try {
    if (window.sessionStorage.getItem(key) === "1") {
      return false;
    }
    window.sessionStorage.setItem(key, "1");
    return true;
  } catch {
    return true;
  }
}
