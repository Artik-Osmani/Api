import { el, icon, initials } from "../dom.js";
import { api } from "../api.js";
import { stayCard } from "../cards.js";
import { cacheListings } from "../store.js";
import { number, rating } from "../format.js";
import { errorPanel } from "../ui.js";

export async function renderHost({ params }) {
  const main = document.getElementById("main");
  main.replaceChildren();

  const view = el("div", { class: "view view-host" });
  const shell = el("div", { class: "shell" });
  const back = el(
    "div",
    { class: "stay-topbar" },
    el("a", { class: "back-link", href: "#/hosts" }, icon("caret-left", "icon icon-16"), "All hosts")
  );
  const body = el("div", { "data-role": "host-body" });
  shell.append(back, body);
  view.append(shell);
  main.append(view);

  body.append(el("div", { class: "skeleton skeleton-text skeleton-text-wide u-mt-8" }));

  let host;
  let verification;
  let listings;

  try {
    [host, verification, listings] = await Promise.all([
      api.host(params.id),
      api.verification(params.id),
      api.hostListings(params.id)
    ]);
  } catch (error) {
    if (error.status === 404) {
      body.replaceChildren(
        el(
          "div",
          { class: "notfound" },
          el("h1", { text: "This host is not in the directory." }),
          el("p", { class: "muted", text: "The link may be wrong. All four hosts are on the Hosts page." }),
          el("a", { class: "btn btn-primary", href: "#/hosts", text: "Back to hosts" })
        )
      );
      return { title: "Host not found | FatiHomes", name: "Host", announce: "Host not found" };
    }

    body.replaceChildren(
      errorPanel({
        title: "We could not load this host.",
        message: error.message,
        onRetry: () => renderHost({ params })
      })
    );
    return { title: "Host | FatiHomes", name: "Host", announce: "Host could not load" };
  }

  cacheListings(listings);
  body.replaceChildren();

  const head = el(
    "div",
    { class: "host-detail-head" },
    el("span", { class: "avatar avatar-lg", "aria-hidden": "true", text: initials(host.name) }),
    el(
      "div",
      {},
      el("h1", { text: host.name }),
      el(
        "p",
        { class: "stay-meta-line" },
        host.superhostStatus ? el("span", { class: "superhost-label", text: "Superhost" }) : null,
        el("span", { text: `Host since ${host.joinedYear}` }),
        el("span", { class: "dot", text: `Responds in about ${host.responseTimeMinutes} minutes` })
      ),
      el("p", { class: "u-mt-4", text: host.bio })
    )
  );

  const metrics = el(
    "dl",
    { class: "summary-stats" },
    stat("Rating", rating(host.aggregateRating)),
    stat("Reviews", number(host.totalReviewsReceived)),
    stat("Stays", number(host.totalProperties)),
    stat("Response rate", `${host.responseRate}%`)
  );

  const verificationSection = el("section", { class: "section" });
  verificationSection.append(
    el(
      "div",
      { class: "section-head" },
      el("h2", { text: "Verification" }),
      el("span", {
        class: "status",
        text: verification.identityStatus === "verified" ? "Identity verified" : "Verification pending"
      })
    ),
    el(
      "div",
      { class: "verification-list" },
      verificationRow("shield-check", "Government ID", verification.governmentIdVerified),
      verificationRow("chat-circle", "Phone number", verification.phoneVerified),
      verificationRow("arrow-square-out", "Email address", verification.emailVerified),
      verificationRow("check-circle", "Background check", verification.backgroundCheckCleared)
    )
  );

  const listingsSection = el("section", { class: "section" });
  listingsSection.append(el("h2", { class: "section-head", text: `Stays by ${host.name}` }));

  if (listings.length === 0) {
    listingsSection.append(
      el("p", { class: "muted", text: "This host has no published stays at the moment." })
    );
  } else {
    const grid = el("div", { class: "host-listings" });
    for (const listing of listings) {
      grid.append(stayCard(listing, { ratio: "3-2" }));
    }
    listingsSection.append(grid);
  }

  body.append(head, metrics, verificationSection, listingsSection);

  return {
    title: `${host.name} | FatiHomes`,
    name: "Host",
    announce: `Host detail, ${host.name}`
  };
}

function stat(label, value) {
  return el(
    "div",
    { class: "summary-stat" },
    el("dt", { text: label }),
    el("dd", { text: value })
  );
}

function verificationRow(iconName, label, verified) {
  return el(
    "div",
    { class: `verification-item${verified ? "" : " is-missing"}` },
    icon(iconName, "icon icon-16"),
    el("span", { text: label }),
    el("span", { text: verified ? "Verified" : "Not verified" })
  );
}
