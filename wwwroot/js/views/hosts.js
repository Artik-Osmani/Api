import { el, icon, initials } from "../dom.js";
import { api } from "../api.js";
import { getState, setHosts } from "../store.js";
import { number, rating } from "../format.js";
import { errorPanel } from "../ui.js";

export async function renderHosts() {
  const main = document.getElementById("main");
  main.replaceChildren();

  const view = el("div", { class: "view view-hosts" });
  const shell = el("div", { class: "shell" });
  const head = el(
    "header",
    { class: "view-head" },
    el("h1", { text: "Hosts" }),
    el("p", {
      class: "lede",
      text: "Four people look after the eighteen homes. Their ratings are weighted by review count, not averaged per listing."
    })
  );
  const roster = el("div", { class: "host-roster" });
  shell.append(head, roster);
  view.append(shell);
  main.append(view);

  paintSkeleton(roster);

  try {
    const hosts = await api.hosts();
    setHosts(hosts);
    roster.replaceChildren();

    for (const host of hosts) {
      roster.append(hostRow(host));
    }
  } catch (error) {
    roster.replaceChildren(
      errorPanel({
        title: "We could not load the hosts.",
        message: error.message,
        onRetry: () => renderHosts()
      })
    );
    return { title: "Hosts | FatiHomes", name: "Hosts", announce: "Hosts could not load" };
  }

  return {
    title: "Hosts | FatiHomes",
    name: "Hosts",
    announce: `Hosts, ${getState().hosts.length} people`
  };
}

function hostRow(host) {
  const row = el("article", { class: "host-row-item" });
  const initialsNode = el("span", {
    class: "avatar avatar-lg",
    "aria-hidden": "true",
    text: initials(host.name)
  });

  const identity = el(
    "div",
    { class: "host-identity" },
    el("h2", {}, el("a", { class: "trip-title", href: `#/hosts/${host.hostId}`, text: host.name })),
    host.superhostStatus ? el("span", { class: "superhost-label", text: "Superhost" }) : el("span", { class: "muted u-text-sm", text: "Host" }),
    el("p", {
      class: "muted u-text-sm",
      text: host.bio
    })
  );

  const stats = el(
    "div",
    { class: "host-stats" },
    el(
      "span",
      {},
      el("strong", { text: rating(host.aggregateRating) }),
      ` from ${number(host.totalReviewsReceived)} ${host.totalReviewsReceived === 1 ? "review" : "reviews"}`
    ),
    el(
      "span",
      {},
      el("strong", { text: String(host.totalProperties) }),
      ` ${host.totalProperties === 1 ? "stay" : "stays"}`
    ),
    el("span", { text: `Responds to ${host.responseRate}% of messages in about ${host.responseTimeMinutes} minutes` })
  );

  const action = el(
    "a",
    { class: "btn btn-secondary", href: `#/hosts/${host.hostId}` },
    "View stays",
    icon("arrow-right", "icon icon-16")
  );

  row.append(initialsNode, identity, stats, action);
  return row;
}

function paintSkeleton(roster) {
  for (let index = 0; index < 4; index += 1) {
    roster.append(
      el(
        "div",
        { class: "host-row-item", "aria-hidden": "true" },
        el("div", { class: "skeleton avatar avatar-lg" }),
        el(
          "div",
          { class: "stack" },
          el("div", { class: "skeleton skeleton-text skeleton-text-wide" }),
          el("div", { class: "skeleton skeleton-text skeleton-text-short" })
        ),
        el("div", { class: "skeleton skeleton-text" }),
        el("div", { class: "skeleton skeleton-text skeleton-text-short" })
      )
    );
  }
}
