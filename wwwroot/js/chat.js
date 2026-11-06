import { el, icon, setChildren } from "./dom.js";
import { api } from "./api.js";
import { formatDate, formatDateTime } from "./format.js";
import { openDialog } from "./dialog.js";
import { toast } from "./ui.js";

/**
 * Right-side message drawer. Polls only while it is open and the tab is visible, keeps an
 * optimistic bubble with a retry on failure and never scrolls away from a reader who has scrolled up.
 */
export function openChat({ reservation, listing, hostName }) {
  const template = document.getElementById("tpl-chat");
  if (!template) {
    return null;
  }

  const dialog = template.content.firstElementChild.cloneNode(true);
  const thread = dialog.querySelector('[data-role="thread"]');
  const form = dialog.querySelector('[data-role="chat-form"]');
  const input = dialog.querySelector("#chat-input");
  const title = dialog.querySelector('[data-role="chat-title"]');
  const closeButton = dialog.querySelector('[data-action="close-chat"]');

  title.textContent = `${listing?.title ?? "Your stay"} with ${hostName ?? "your host"}`;
  document.body.append(dialog);
  openDialog(dialog, { onClose: () => stop(), initialFocus: input });

  let poller = null;
  let stopped = false;
  let messages = [];

  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("cancel", () => dialog.close());
  document.addEventListener("visibilitychange", onVisibility);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = input.value.trim();
    if (!body) {
      return;
    }

    input.value = "";
    input.disabled = true;
    const pending = bubble(
      { senderRole: "guest", messageBody: body, sentAt: new Date().toISOString() },
      { pending: true }
    );
    const atBottom = isAtBottom();
    thread.append(pending);
    if (atBottom) {
      scrollToBottom();
    }

    try {
      const saved = await api.sendMessage(reservation.id, body);
      messages = [...messages, saved];
      pending.replaceWith(bubble(saved));
      if (atBottom) {
        scrollToBottom();
      }
    } catch (error) {
      pending.classList.remove("bubble-pending");
      pending.append(
        el("button", {
          type: "button",
          class: "btn-quiet",
          text: "Retry",
          onClick: () => {
            input.value = body;
            pending.remove();
            form.requestSubmit();
          }
        })
      );
      toast(error.message ?? "The message did not send.", { tone: "error" });
    } finally {
      input.disabled = false;
      input.focus({ preventScroll: true });
    }
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  load({ scroll: true });
  poller = window.setInterval(refresh, 10_000);

  function onVisibility() {
    if (document.visibilityState === "visible") {
      refresh();
    }
  }

  async function load({ scroll = false } = {}) {
    try {
      messages = await api.messages(reservation.id);
      render();
      if (scroll) {
        scrollToBottom();
      }
    } catch (error) {
      setChildren(
        thread,
        el("p", { class: "field-error", text: error.message ?? "Messages could not load." })
      );
    }
  }

  async function refresh() {
    if (stopped || !dialog.open || document.visibilityState !== "visible") {
      return;
    }

    const atBottom = isAtBottom();
    try {
      const fresh = await api.messages(reservation.id);
      if (fresh.length !== messages.length) {
        messages = fresh;
        render();
        if (atBottom) {
          scrollToBottom();
        }
      }
    } catch {
      // A failed poll is not worth interrupting the conversation.
    }
  }

  function render() {
    if (messages.length === 0) {
      setChildren(
        thread,
        el(
          "div",
          { class: "chat-empty" },
          icon("chat-circle", "icon icon-32"),
          el("p", { text: "No messages yet. Say hello." })
        )
      );
      return;
    }

    const nodes = [];
    let currentDay = "";

    for (const message of messages) {
      const sentAt = new Date(message.sentAt);
      const day = formatDate(sentAt);
      if (day !== currentDay) {
        nodes.push(el("p", { class: "thread-day", text: day }));
        currentDay = day;
      }
      nodes.push(bubble(message));
    }

    thread.replaceChildren(...nodes);
  }

  function bubble(message, options = {}) {
    const isGuest = message.senderRole === "guest";
    const sentAt = new Date(message.sentAt);
    const validDate = !Number.isNaN(sentAt.getTime());
    const node = el(
      "div",
      { class: `bubble${isGuest ? " bubble-guest" : ""}${options.pending ? " bubble-pending" : ""}` },
      el("p", { text: message.messageBody }),
      el(
        "span",
        { class: "bubble-meta" },
        el("span", { text: isGuest ? "You" : hostName ?? "Host" }),
        el("span", { text: validDate ? formatDateTime(sentAt) : "" })
      )
    );

    return node;
  }

  function isAtBottom() {
    return thread.scrollHeight - thread.scrollTop - thread.clientHeight < 40;
  }

  function scrollToBottom() {
    thread.scrollTop = thread.scrollHeight;
  }

  function stop() {
    stopped = true;
    window.clearInterval(poller);
    document.removeEventListener("visibilitychange", onVisibility);
    dialog.remove();
  }

  return dialog;
}
