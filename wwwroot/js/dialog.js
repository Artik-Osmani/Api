import { el, icon } from "./dom.js";
import { reducedMotion } from "./motion.js";

const openStack = [];

/**
 * Opens a native <dialog> with showModal so focus trapping and Escape come from the platform.
 * Body scroll is locked while any dialog is open and focus returns to the trigger on close.
 */
export function openDialog(dialog, options = {}) {
  const { onClose = null, initialFocus = null } = options;
  const trigger = document.activeElement;

  if (!dialog.open) {
    dialog.showModal();
  }

  document.body.classList.add("dialog-open");
  // A lightbox may reopen the same element; never chain a previous animated close wrapper.
  const nativeClose = HTMLDialogElement.prototype.close.bind(dialog);
  let closing = false;
  let exitAnimation = null;
  const entry = { dialog, trigger, onClose, closeImmediately: () => {
    exitAnimation?.cancel();
    if (dialog.open) nativeClose();
  } };
  dialog.close = (returnValue) => {
    if (!dialog.open || closing) return;
    if (reducedMotion() || !dialog.animate) { nativeClose(returnValue); return; }
    closing = true;
    dialog.classList.add("is-closing");
    const sheet = dialog.classList.contains("sheet");
    exitAnimation = dialog.animate([
      { opacity: 1, transform: "translate(0, 0)" },
      { opacity: 0, transform: sheet ? "translateX(20px)" : "translateY(8px)" }
    ], { duration: 160, easing: "ease-in", fill: "forwards" });
    exitAnimation.finished.then(() => { if (dialog.open) nativeClose(returnValue); }).catch(() => {});
  };
  openStack.push(entry);

  // Register after the caller's cancel logic, so dirty booking guards retain control over Escape.
  const onCancel = event => {
    if (event.defaultPrevented) return;
    event.preventDefault();
    dialog.close();
  };
  queueMicrotask(() => dialog.addEventListener("cancel", onCancel));

  dialog.addEventListener(
    "close",
    () => {
      exitAnimation?.cancel();
      dialog.removeEventListener("cancel", onCancel);
      dialog.classList.remove("is-closing");
      dialog.close = nativeClose;
      const index = openStack.findIndex((item) => item.dialog === dialog);
      if (index >= 0) {
        openStack.splice(index, 1);
      }

      if (openStack.length === 0) {
        document.body.classList.remove("dialog-open");
      }

      onClose?.();

      if (trigger instanceof HTMLElement && trigger.isConnected) {
        trigger.focus({ preventScroll: true });
      }
    },
    { once: true }
  );

  if (initialFocus instanceof HTMLElement) {
    initialFocus.focus({ preventScroll: true });
  }

  return entry;
}

export function closeDialog(dialog) {
  if (dialog?.open) {
    dialog.close();
  }
}

export function closeAllDialogs() {
  for (const entry of [...openStack]) {
    entry.closeImmediately();
  }
}

export function anyDialogOpen() {
  return openStack.length > 0;
}

/**
 * A small confirmation dialog built on <dialog>, replacing window.confirm. Resolves to true when
 * the confirm button is pressed.
 */
export function confirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false
}) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(value);
      dialog.close();
    };

    const cancelButton = el("button", { type: "button", class: "btn btn-secondary", text: cancelLabel });
    const confirmButton = el("button", {
      type: "button",
      class: `btn ${danger ? "btn-danger" : "btn-primary"}`,
      text: confirmLabel
    });

    const dialog = el(
      "dialog",
      { class: "dialog-center", "aria-labelledby": "confirm-title" },
      el(
        "div",
        { class: "dialog-body" },
        el("div", { class: "dialog-head" }, el("h2", { id: "confirm-title", text: title })),
        el("p", { text: message, class: "muted" }),
        el("div", { class: "row-actions" }, cancelButton, confirmButton)
      )
    );

    cancelButton.addEventListener("click", () => finish(false));
    confirmButton.addEventListener("click", () => finish(true));
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      finish(false);
    });

    document.body.append(dialog);
    openDialog(dialog, {
      initialFocus: confirmButton,
      onClose: () => {
        if (!settled) {
          settled = true;
          resolve(false);
        }
        dialog.remove();
      }
    });
  });
}

/** Small informational dialog with a close action. */
export function messageDialog({ title, message, actionLabel = "Close", actionHref = null }) {
  const closeButton = el("button", { type: "button", class: "btn btn-secondary", text: actionLabel });

  const actions = el("div", { class: "row-actions" });
  if (actionHref) {
    actions.append(el("a", { class: "btn btn-primary", href: actionHref, text: "Contact FatiHomes" }));
  }
  actions.append(closeButton);

  const dialog = el(
    "dialog",
    { class: "dialog-center", "aria-labelledby": "message-title" },
    el(
      "div",
      { class: "dialog-body" },
      el(
        "div",
        { class: "dialog-head" },
        el("h2", { id: "message-title", text: title }),
        el(
          "button",
          { type: "button", class: "icon-btn", "aria-label": "Close" },
          icon("x")
        )
      ),
      el("p", { class: "muted", text: message }),
      actions
    )
  );

  const iconClose = dialog.querySelector(".icon-btn");
  iconClose.addEventListener("click", () => dialog.close());
  closeButton.addEventListener("click", () => dialog.close());

  document.body.append(dialog);
  openDialog(dialog, { onClose: () => dialog.remove() });
  return dialog;
}
