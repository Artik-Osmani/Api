import { el, icon } from "../dom.js";

const MAP_URL = "https://www.openstreetmap.org/search?query=Rruga%20Garibaldi%2012%2C%20Prishtina";

export async function renderContact() {
  const main = document.getElementById("main");
  main.replaceChildren();

  const view = el("div", { class: "view view-contact" });
  const shell = el("div", { class: "shell" });
  const head = el(
    "header",
    { class: "view-head" },
    el("h1", { text: "Contact FatiHomes" }),
    el("p", {
      class: "lede",
      text: "A small team in Prishtina looks after the collection, the hosts and the bookings. Write to the address that fits and we will answer within a working day."
    })
  );

  const grid = el("div", { class: "contact-grid" });

  const left = el(
    "div",
    {},
    el("p", {
      class: "contact-lede",
      text: "For a booking already made, the fastest route is the message thread in Trips. For everything else, use the details below."
    }),
    el(
      "dl",
      { class: "contact-list" },
      contactItem("Email", el("a", { href: "mailto:hello@fatihomes.example", text: "hello@fatihomes.example" })),
      contactItem("Phone", el("a", { href: "tel:+38338000000", text: "+383 38 000 000" })),
      contactItem(
        "Office",
        el(
          "a",
          { href: MAP_URL, target: "_blank", rel: "noopener" },
          "Rruga Garibaldi 12, Prishtina 10000, Kosovo",
          icon("arrow-square-out", "icon icon-16")
        )
      )
    ),
    el("p", {
      class: "field-hint u-mt-8",
      text: "This is a course project. The addresses and the phone number are illustrative and do not belong to a real business."
    })
  );

  const right = el(
    "div",
    { class: "contact-rows" },
    contactRow("Booking help", "Changes, cancellations and anything about a stay you have booked.", "stay@fatihomes.example", "Replies within one working day"),
    contactRow("Hosting", "Adding a home to the collection or a question about a listing.", "hosts@fatihomes.example", "Replies within two working days"),
    contactRow("Press", "Images, the API and background on the project.", "press@fatihomes.example", "Replies within three working days"),
    el(
      "div",
      { class: "contact-row" },
      el("h2", { text: "Project" }),
      el("p", { text: "The README explains the code map, and the API documentation is generated from the running app." }),
      el(
        "div",
        { class: "u-row u-mt-4" },
        el("a", { class: "btn btn-secondary btn-sm", href: "/swagger", target: "_blank", rel: "noopener", text: "Read the API documentation" }),
        el("a", { class: "btn btn-secondary btn-sm", href: "https://github.com/Artik-Osmani/Api#readme", target: "_blank", rel: "noopener", text: "Project README" })
      )
    )
  );

  grid.append(left, right);
  shell.append(head, grid);
  view.append(shell);
  main.append(view);

  return {
    title: "Contact | FatiHomes",
    name: "Contact",
    announce: "Contact FatiHomes"
  };
}

function contactItem(term, value) {
  return el("div", { class: "contact-item" }, el("dt", { text: term }), el("dd", {}, value));
}

function contactRow(title, copy, email, response) {
  return el(
    "div",
    { class: "contact-row" },
    el("h2", { text: title }),
    el("p", { text: copy }),
    el("a", { href: `mailto:${email}`, text: email }),
    el("p", { class: "u-text-xs", text: response })
  );
}
