# FatiHomes upgrade brief

Paste this entire file into your coding agent at the repository root. It is the complete specification for the next iteration. Treat it as the source of truth.

You are a senior product designer and full-stack engineer. You have write access to this repository. Your job is to turn the existing prototype into a small, finished, honest product that looks like a person designed it and works end to end. Do not produce a plan only. Implement the changes, verify them, and report evidence.

---

## 1. Mission

The current app is a working prototype with a generic visual language and a set of real correctness bugs. The redesign has three goals, in this order:

1. **Make it work properly.** Fix the API contract, validation, pricing, availability, reservation state machine, error handling, rate limiting and security issues listed in Section 3.
2. **Make it look designed.** Replace the Airbnb-red, emoji-driven, gradient-and-confetti aesthetic with a restrained editorial identity built on photography, typography and space. No AI slop, no template feel, no borrowed brand.
3. **Make it easy to explain.** A professor must be able to open the README and find any file, route, header, model or calculation in under a minute. Every change must be documented.

The target is a demo that survives a live walkthrough: fresh browser, no network beyond localhost, keyboard only, mobile width, dark mode, reduced motion, and a reviewer who asks "where is that code".

---

## 2. Ground truth

Read these before changing anything.

| Fact | Value |
| :--- | :--- |
| Framework | .NET 10, ASP.NET Core controllers, Swashbuckle 10.2.3 |
| Build status | `dotnet build` succeeds with 0 warnings on SDK 10.0.302 |
| Run command | `dotnet run`, dev profile, `http://localhost:5047` |
| Prod profile | `dotnet run --launch-profile prod`, `http://localhost:5000` |
| Routes | 18 paths, 24 operations, all under `/v1` except static files and `/swagger` |
| Seed data | 18 listings, 4 hosts, 1 reservation, 3 reviews, 2 messages, 0 favorites |
| Front end | 1 HTML file (608 lines), 1 CSS file (2118 lines), 1 JS file (987 lines) |
| Styling | Vanilla CSS with custom properties, plus a 215-line inline `<style>` block that overrides them |
| JS | Single global script, inline `onclick` attributes, `innerHTML` rendering |
| Data | In-memory singleton, seeded on construction, reset on restart |
| Tests | None |
| Docs | `README.md` with a verified code map, `docs/openapi.yaml` with 7 of 18 paths |
| Repo | No `.gitignore`, `bin/` and `obj/` committed |

Files to read first, with the reason:

- `Program.cs` for the pipeline and CORS.
- `Controllers/ListingsController.cs` for search, availability and reviews.
- `Controllers/ReservationsController.cs` for the booking and pricing logic.
- `Services/MockDataStore.cs` for the data and seed shapes.
- `Models/RentalModels.cs` for every contract.
- `Middleware/*.cs` for headers, rate limiting and errors.
- `wwwroot/index.html`, `wwwroot/app.css`, `wwwroot/app.js` for the current UI.
- `README.md` for the existing code map. Keep its structure and update it at the end.
- `docs/openapi.yaml` to see how far the hand-written spec has drifted.

Do not trust line numbers in this brief after you edit. Use the symbol names.

---

## 3. Verified defects to fix

These were reproduced against the running app. Fix every one.

### API

1. **Past bookings are accepted.** `POST /v1/reservations` with check-in `2025-01-10` returns 201. Reject check-in before today (UTC).
2. **Minimum stay is advertised but not enforced.** Availability returns `minimumStayNights: 2` on every day, and a 1-night booking succeeds. Store a real minimum on the listing and enforce it in quote and create.
3. **Status transitions are unrestricted.** Cancel a reservation, then `PATCH /status` with `confirmed`, and it becomes confirmed again. Implement a state machine.
4. **Availability without dates returns 200 and `0001-01-01`.** `GET /v1/listings/{id}/availability` with no query parameters returns a default `DateOnly` instead of a validation error.
5. **Two error envelopes.** Manual errors return `{code, message}`. Model-binding errors return RFC 9110 `ProblemDetails`. Unify them.
6. **Eight search fields are ignored.** `adultsCount`, `childrenCount`, `infantsCount`, `petsCount`, `currency`, `neighborhoodId`, `circleSearch`, `polygonSearch`. Either implement or remove every one. No advertised field may be a no-op.
7. **The seeded reservation totals are wrong.** Its line items sum to 865.50, `totalAmount` is 1015.50, and a 50.00 discount is recorded but not applied. Recompute seeds with the pricing calculator.
8. **Review counts are fictional.** `ReviewCount` says 87 while only 2 review records exist. Seed enough reviews to make counts and averages true, or set counts to the real number.
9. **Mixed currencies are summed.** Bookings add USD and EUR totals into one "Total trip value". Normalise the catalogue to EUR and group any remaining totals by currency.
10. **Host rating math is wrong.** It averages listing averages instead of weighting by review count.
11. **Hosts view bypasses the host API.** The UI derives hosts from the current search results, and the verification button prints a fixed success sentence. Add `GET /v1/hosts` and use real values.
12. **Favorites toggle is a read-then-write race.** Move the existence check and mutation inside a single `Modify` call.
13. **Review ratings and comments have no length or content limits.** Add validation. The UI also offers only 3, 4 and 5 stars while the API accepts 1 to 5.
14. **`CreateListing` accepts a client-supplied `HostDetails`.** A caller can impersonate any host. Accept a `HostId` and look the host up.
15. **`DeleteListing` orphans reservations and messages.** Either block deletion with 409 when active reservations exist or cascade cleanly. Choose one and document it.
16. **Rate limiting blocks static assets and Swagger.** Loading the page consumes the API budget. Reproduced: ordinary browsing returned 429 on `/app.css` and `/swagger`. Exempt static paths and Swagger, add `Retry-After`, and evict stale entries.
17. **CORS production origin is hard-coded.** Move allowed origins to configuration.
18. **`UseAuthorization` is a no-op.** Remove it until authentication exists.
19. **`GET /v1/system/health` is not a real health check.** Include a store check, version, uptime in seconds and environment.
20. **`/v1/system/stage` is a minimal API route in `Program.cs`.** Move it into `SystemController` so every endpoint is discoverable in one place.
21. **Swagger has almost no descriptions.** Only two actions have XML summaries, and `NoWarn 1591` hides the rest. Document every action and every response code.

### Front end

22. **Stored XSS.** Listing titles, descriptions, review author names and comments are interpolated into `innerHTML` without escaping. A review comment containing an `<img onerror>` payload executes because the CSP allows inline script. Escape all untrusted text.
23. **Wishlist is filtered by the current search.** A saved stay disappears from `#wishlist` when filters change. Fetch and store favorites independently of search results.
24. **Detail lookup only searches the current results.** Opening a stay from a filtered list or stale cache can silently do nothing. Look in a full cache by ID and fetch on miss.
25. **Empty dates produce `NaN`.** `startBookingFlow` computes nights from empty inputs and renders `$NaN`. Validate and default the date range.
26. **The booking total disagrees with the server.** The client computes fees without the 7-night or 30-night discount. For stays of 7+ nights the receipt and the created reservation differ. Use a server quote endpoint.
27. **Dark mode contrast fails.** The inline `<style>` in `index.html` redefines `:root` variables after `app.css`, so `--text-muted` keeps the light value (`#64748b`) on a dark background. Muted text is roughly 3.4:1. Remove the inline block and define tokens once.
28. **Inline handlers and styles make a strict CSP impossible.** `onclick`, `onsubmit` and `style=` appear throughout `index.html` and in every JS template. Remove all of them.
29. **External dependencies break offline demos.** Google Fonts and Unsplash are loaded over the internet and require CSP allowances. Vendor fonts and images locally.
30. **The PHP page leaks a comment.** `php/index.php` ends with `//artik test branch` outside the PHP tags, so it renders as text below the page.
31. **`README.md` and `read.md` described files that do not exist and the wrong port.** Partially corrected already. Keep the new structure accurate.
32. **`StayHubApi.http` points at `/weatherforecast/`.** Replace it with real requests.
33. **Build output is committed.** Add `.gitignore` and stop tracking `bin/` and `obj/`.

---

## 4. Non-negotiable constraints

- Keep .NET 10, ASP.NET Core controllers and Swashbuckle. Do not migrate to Minimal APIs, FastEndpoints or a different framework.
- Keep the front end as static HTML, CSS and JavaScript. No React, Vue, Svelte, Tailwind, Bootstrap, GSAP, Motion, jQuery or bundler. No build step. The app must run with `dotnet run` only.
- No runtime network requests. Fonts, images and icons are local files served from `wwwroot`.
- No database server. The store stays in memory. Do not add EF Core.
- No authentication, no real payments, no email or SMS.
- Preserve every existing public route and JSON field name unless this brief explicitly changes it. Additive changes are preferred.
- Breaking changes allowed only where listed: unify errors, add quote, add `GET /v1/hosts`, add `HostId` to create listing, normalise currency, extend availability validation, change stats fields.
- Keep the existing stable GUIDs for listing 1 (`e14c1d68-0fa4-44bc-b17b-4b248a31e8fd`), host 1 (`9a78cd9c-c9c7-43cf-bc82-01967fa7e93b`) and reservation 1 (`3f7bf08e-1678-43d9-959c-6e6ad9d20c5b`), because they are referenced in `README.md` and the demo script.
- Keep `MockDataStore` as the class name. Add interfaces and services around it, do not rename it.
- All UI copy is English. Rewrite `read.md` in Albanian and keep it accurate.
- No em dashes in visible UI copy. No emoji as icons. No exclamation marks in system messages.
- Zero build warnings. `Nullable` stays enabled.
- Every new behaviour needs a test or a documented manual check.
- Update `README.md` in the same change set. A code change with no documentation is unfinished.
- Do not delete the PHP folder or the course notes. Document them as course artefacts.

---

## 5. Design direction

### 5.1 Design read

State this at the top of your final summary and then follow it:

> Reading this as a boutique stays catalogue for design-literate travellers and a university review panel, with an editorial Adriatic-modernism language, leaning toward native CSS, self-hosted Schibsted Grotesk and Geist, photography-led layouts and restrained scroll motion.

Dials for this project:

| Dial | Value | Why |
| :--- | :--- | :--- |
| `DESIGN_VARIANCE` | 8 | Editorial asymmetry, varied card spans, no centred hero |
| `MOTION_INTENSITY` | 6 | One signature shared-element transition, quiet micro-interactions |
| `VISUAL_DENSITY` | 3 | Gallery-like spacing, few elements per screen, no dashboards |

This is a product interface with five views, not a marketing landing page. Apply landing-page craft to Explore and Stay detail. Apply quiet, efficient product patterns to Trips, Saved and Hosts.

### 5.2 Brand and voice

FatiHomes is a small collection of places to stay in Kosovo, Albania and the surrounding region. The brand is a host, not a marketplace. It is quiet, grounded and specific. It does not sell "luxury", "unforgettable experiences" or "seamless journeys".

Voice rules:

- Write like a good travel editor, not a growth marketer.
- Prefer concrete nouns and numbers: "18 stays", "a 12-minute walk to the bazaar", "from €35 a night".
- Sentence case for headings and buttons. No Title Case Everywhere.
- No "elevate", "seamless", "unleash", "curated", "handpicked", "game-changer", "delve", "tapestry", "in the world of".
- No "Oops", "Whoops", "Uh oh". Say what happened and what to do.
- No exclamation marks.
- No em dashes. Use a comma, a colon or a full stop.
- Microcopy is short. A button is a verb. An empty state says how to fill it.

Copy deck to use verbatim unless a string is clearly wrong:

| Location | String |
| :--- | :--- |
| Document title | `FatiHomes | Stays in Kosovo and Albania` |
| Meta description | `Eighteen homes across Kosovo, Albania and the coast, chosen for their location and their hosts.` |
| Nav | `Explore`, `Trips`, `Saved`, `Hosts`, `Contact` |
| Hero H1 | `Places with a sense of place.` |
| Hero sub | `Eighteen homes across Kosovo, Albania and the coast, chosen for their location and their hosts.` |
| Hero meta | `18 stays · 9 places · from €35 a night` |
| Search labels | `Where`, `Check in`, `Check out`, `Guests` |
| Search button | `Search stays` |
| Sort | `Recommended`, `Lowest price`, `Highest rating`, `Most reviewed`, `Closest` |
| Card price suffix | `night` |
| Rating fallback | `New` |
| Detail primary CTA | `Reserve` |
| Detail secondary CTA | `Check availability` |
| Booking steps | `Dates`, `Guest details`, `Review and pay` |
| Payment note | `You will not be charged. This is a demo payment.` |
| Confirm button | `Confirm and pay` |
| Success heading | `Booking confirmed` |
| Success reference | `Reference FH-7K2P` |
| Trips heading | `Your trips` |
| Trips filters | `All`, `Upcoming`, `Staying now`, `Past`, `Cancelled` |
| Empty trips | `No trips here yet. When you book a stay it will appear in this list.` |
| Empty saved | `Nothing saved yet. Use the heart on any stay to keep it here.` |
| Review heading | `Write a review` |
| Review helper | `Tell future guests what stood out.` |
| Review submit | `Publish review` |
| Chat empty | `No messages yet. Say hello.` |
| Load error | `We could not load stays. Check your connection and try again.` |
| Conflict error | `Those dates are no longer available. Choose another range.` |
| Min stay error | `This stay needs at least 2 nights.` |
| 404 | `This page does not exist. The stays are this way.` |
| Footer | `FatiHomes, a course project. Built with .NET 10 and vanilla web.` |
| Appearance control | `Appearance`, `System`, `Light`, `Dark` |

### 5.3 Banned patterns

Remove every one of these. They are the current AI/template tells.

| Banned | Current location |
| :--- | :--- |
| Airbnb red `#ff385c` as the brand colour | `app.css:7`, `index.html:14` |
| Emoji as navigation and card icons | `index.html:250-265`, `app.js:26-33` |
| Confetti burst on booking | `app.js:55-71`, `app.css:1349-1366` |
| Scroll progress bar | `index.html:231`, `app.js:74-84` |
| 3D tilt or scale on card hover | `app.css:512-516` |
| Gradient buttons and glows | `app.css:10-11`, `app.css:353` |
| Centred hero over a dark stock photo | `index.html:287-325` |
| Three equal cards in a row | `app.css:485-489` |
| Sun and moon theme toggle | `app.js:104-116` |
| Infinite floating icon animation | `app.css:2046` |
| Glassmorphism navigation | `app.css:89-97` |
| Generic pink gradient banner | `app.css:1462-1474` |
| `confirm()` and `alert()` for destructive actions | `app.js:827` |
| Fake verification toast | `app.js:959-967` |
| Hard-coded guest sender ID | `app.js:914` |
| Google Fonts `<link>` | `index.html:8-10` |
| Hotlinked Unsplash images | `MockDataStore.cs:57` onward |
| "Enterprise-grade" and similar claims | old `README.md` |
| All-caps eyebrow labels on every section | Throughout |
| Stat ribbon in the header | `index.html:242-246` |

Also banned: animated blobs, mesh gradients, neon glows, purple anywhere, drop shadows on cards, border plus shadow plus white background on every card, `height: 100vh`, carousels with dots, "Trusted by" logo walls, fake avatars from stock photos of models, testimonial sections, accordions for FAQs.

### 5.4 Colour system

One accent. Warm amber is the only accent and it appears sparingly: stars, active filter underline, focus rings, small status dots. Primary actions are ink on light and paper on dark. Forest green is a surface and brand tint, not a second accent.

Light theme:

| Token | Hex | Use |
| :--- | :--- | :--- |
| `--canvas` | `#F2F3EE` | Page background |
| `--surface` | `#FBFBF7` | Panels, sheets, inputs |
| `--surface-2` | `#E9EBE3` | Sunken areas, skeletons, image placeholders |
| `--ink` | `#101713` | Headings, primary text |
| `--ink-2` | `#344139` | Secondary text |
| `--muted` | `#5B6860` | Captions, helper text, 5.2:1 on canvas |
| `--line` | `#D7DAD0` | Hairlines, dividers |
| `--line-strong` | `#B9BFB3` | Input borders, focus-adjacent rules |
| `--brand` | `#1E3D30` | Brand mark, selected states, host accents |
| `--brand-soft` | `#DDE6DE` | Subtle brand tint |
| `--accent` | `#A86A2E` | Stars, active indicators, focus ring |
| `--accent-text` | `#8A5522` | Small text that must hit 4.5:1 |
| `--accent-soft` | `#F0E3D2` | Badge backgrounds |
| `--success` | `#2C6A4C` | Confirmed, available |
| `--danger` | `#9E3B32` | Cancelled, booked, errors |
| `--danger-soft` | `#F6E3E0` | Error surfaces |
| `--action-bg` | `#101713` | Primary button background |
| `--action-fg` | `#F7F8F2` | Primary button text |
| `--action-bg-hover` | `#1E3D30` | Primary button hover |

Dark theme:

| Token | Hex |
| :--- | :--- |
| `--canvas` | `#0B110E` |
| `--surface` | `#121A16` |
| `--surface-2` | `#18221D` |
| `--ink` | `#E9EDE6` |
| `--ink-2` | `#C0C8BF` |
| `--muted` | `#9AA69D` |
| `--line` | `#26322B` |
| `--line-strong` | `#3A4A40` |
| `--brand` | `#9AC5AC` |
| `--brand-soft` | `#1B2A22` |
| `--accent` | `#D6A165` |
| `--accent-text` | `#D6A165` |
| `--accent-soft` | `#2A2118` |
| `--success` | `#6FBF95` |
| `--danger` | `#E08C83` |
| `--danger-soft` | `#2A1A18` |
| `--action-bg` | `#E9EDE6` |
| `--action-fg` | `#0B110E` |
| `--action-bg-hover` | `#FFFFFF` |

Rules:

- Never use pure `#000000` or `#FFFFFF` as a page background.
- Never introduce a second accent. Availability, status and errors use the semantic tokens above.
- Do not encode availability with colour alone. Add a hatch pattern and text.
- Keep all shadows tinted green-black, never neutral black.
- Test every text and background pair at 4.5:1 for body and 3:1 for large text. `--muted` is the floor, not a suggestion.
- Set `color-scheme: light dark` and drive dark mode from `prefers-color-scheme` by default, with an explicit `data-theme` override stored in `localStorage`.

### 5.5 Typography

Self-host these fonts as WOFF2 with `font-display: swap`, subset to Latin and Latin Extended for `ë` and `ç`:

| Role | Family | Weights | Fallback |
| :--- | :--- | :--- | :--- |
| Display | Schibsted Grotesk | 500, 700 | `Archivo`, system sans |
| UI and body | Geist | 400, 500, 600 | `Segoe UI Variable`, system sans |
| Data | Geist Mono | 500 | `ui-monospace`, monospace |

Remove both Google Fonts families and the `<link>` tags. Do not use Inter, Fraunces or Instrument Serif.

Scale:

| Token | Size / line height / tracking | Use |
| :--- | :--- | :--- |
| `--text-xs` | `0.75rem / 1.4 / 0.04em` | Labels, meta, uppercase only here |
| `--text-sm` | `0.875rem / 1.5 / 0` | Captions, table cells |
| `--text-base` | `1rem / 1.65 / 0` | Body, max 68ch |
| `--text-lg` | `1.125rem / 1.55 / 0` | Lead paragraphs |
| `--text-xl` | `1.375rem / 1.3 / -0.01em` | Card titles, section subheads |
| `--text-2xl` | `1.75rem / 1.2 / -0.015em` | Page headings |
| `--text-3xl` | `2.25rem / 1.1 / -0.02em` | Section headings |
| `--display-1` | `clamp(2.75rem, 6vw, 4.75rem) / 0.95 / -0.035em` | Hero only |
| `--display-2` | `clamp(2rem, 4vw, 3rem) / 1.02 / -0.03em` | Stay title, page hero |

Rules:

- `text-wrap: balance` on headings, `text-wrap: pretty` on paragraphs.
- `font-variant-numeric: tabular-nums` on prices, dates, counts and booking codes.
- Body copy max 68ch. Do not stretch paragraphs across a 1400px container.
- Use weight and size for hierarchy, not colour alone.
- Uppercase labels appear at most once per section. Count them. If a page has five sections, no more than two uppercase micro-labels.
- No orphaned last words in display headings. Adjust the copy or the measure, do not shrink the font below the scale.

### 5.6 Layout, spacing, shape, elevation

- Container: `max-width: 1360px`, gutters `clamp(1rem, 4vw, 3rem)`.
- Grid: 12 columns, `gap: clamp(1rem, 2.5vw, 2rem)`.
- Spacing scale: 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 128. No arbitrary pixel values.
- Section rhythm: `padding-block: clamp(3.5rem, 7vw, 7rem)`, bottom slightly larger than top.
- Header: 72px desktop, 60px mobile, single line, no wrapping. Sticky with a hairline border, solid surface, no blur.
- Mobile navigation: bottom tab bar, 5 items, 56px plus `env(safe-area-inset-bottom)`. Hide the desktop nav below 900px. Do not use a hamburger for five primary destinations.
- Full-height sections use `min-height: 100dvh`, never `100vh`.
- Radii: `--r-xs: 2px`, `--r-sm: 4px` for images and panels, `--r-md: 6px` for buttons and inputs, `--r-pill: 999px` for chips and avatars only. Follow this rule everywhere.
- No card borders plus shadows. Cards are image plus text on the canvas. Elevation is reserved for sheets, dialogs and the sticky rail.
- Sheet shadow: `0 24px 64px -24px rgb(10 22 15 / 0.55)`. Scrim: `rgb(8 14 11 / 0.55)`.
- Z-index scale: `--z-base: 0`, `--z-rail: 10`, `--z-header: 20`, `--z-bottom-bar: 30`, `--z-sheet: 40`, `--z-toast: 50`, `--z-skip: 100`. No `9999`.
- Asymmetry: the Explore hero is a 7/5 split. The stay detail is 8/4. The results grid mixes 7/5, 5/7, 8/4 and 4/8 spans in a repeating pattern. Never three equal cards.
- Align shared elements across side-by-side cards: title baselines, price lines, button rows.
- Buttons and inputs are 44px minimum height. Touch targets 44x44.

### 5.7 Iconography and imagery

- Use **Phosphor Icons** at 1.5 stroke weight, 16, 20 and 24px. Vendor a single `icons.svg` sprite from the official package into `wwwroot/images/`. Record the source and licence in `docs/IMAGE_CREDITS.md`. Do not hand-draw icon paths.
- Required icons: `heart`, `magnifying-glass`, `map-pin`, `calendar-blank`, `users`, `star`, `check`, `caret-left`, `caret-right`, `arrow-right`, `x`, `chat-circle`, `receipt`, `shield-check`, `wifi-high`, `snowflake`, `car`, `paw-print`, `fire`, `waves`, `sliders-horizontal`, `sun`, `moon`, `desktop`.
- No emoji anywhere in the UI. Not in buttons, headings, toasts, statuses, categories or empty states.
- Logo: keep `wwwroot/images/logo.svg` as the favicon path, but redraw it as a two-letter `FH` monogram plus a separate wordmark component. No generic house-with-pin icon. Add `favicon.ico`, `apple-touch-icon.png` (180px) and `og.webp` (1200x630).
- Photography carries the design. Vendor 18 listing photos plus one hero image under `wwwroot/images/stays/`. WebP, 3:2 and 4:5 crops at 800, 1200 and 1600 widths, quality 72 to 78, each under 180KB, total under 4MB. Add a `docs/IMAGE_CREDITS.md` with photographer, source URL and licence. If a download fails, fall back to `https://picsum.photos/seed/fatihomes-<slug>/1600/1067`, download it locally, and label it as a placeholder in the credits file. Never hotlink.
- Images need `width`, `height`, `decoding="async"`, `loading="lazy"` except the hero, which gets `fetchpriority="high"` and no lazy loading. Use `srcset` and `sizes`.
- Write real alt text. `alt=""` only for decorative separators.

### 5.8 Motion system

Motion tokens:

| Token | Value | Use |
| :--- | :--- | :--- |
| `--dur-1` | 120ms | Hover, press, focus |
| `--dur-2` | 220ms | State changes, disclosure |
| `--dur-3` | 340ms | Sheets, dialogs, view transitions |
| `--dur-4` | 560ms | Image reveals, hero entrance |
| `--ease-out` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Entrances, most UI |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Movement between two states |
| `--ease-spring` | `cubic-bezier(0.34, 1.35, 0.64, 1)` | Success check only, once |

Signature moments, no more than these:

1. **Hero image reveal.** On first load, clip-path from `inset(0 0 100% 0)` to `inset(0)`, 640ms, `--ease-out`. The headline follows with 40ms per line, opacity and 12px rise. Runs once per session.
2. **Card to detail transition.** Use the View Transitions API. Set `view-transition-name: stay-<id>` on the card image and the detail hero, call `document.startViewTransition`, and clean up names on `transition.finished`. Fallback: 320ms crossfade of the detail panel with no movement. Under reduced motion, skip entirely.
3. **Search results update.** Crossfade the grid, 220ms. Stagger the first 8 cards by 30ms with an 8px rise. Do not animate on every keystroke, only on submit or filter change.
4. **Calendar month change.** 16px horizontal slide plus fade, 220ms, direction follows the arrow. Disable under reduced motion.
5. **Booking success.** A single check icon draws over 300ms. No confetti, no particles, no bounce.
6. **Scroll reveal.** Sections and cards rise 12px with opacity over 480ms, once, at 15% intersection, stagger capped at 6 items and 60ms. Use IntersectionObserver or CSS `animation-timeline: view()` with a fallback. Never use a `scroll` event listener.

Forbidden motion:

- Tilt, 3D rotation, scale above 1.02 on hover.
- Parallax on text.
- Infinite loops, pulsing dots, floating icons.
- Marquees.
- Autoplaying carousels.
- Animating `width`, `height`, `top` or `left`.
- Scroll hijacking or smooth-scroll libraries.
- Motion on form typing.
- Any motion over 700ms on a repeated interaction.

Performance rules:

- Animate `transform`, `opacity` and `clip-path` only.
- Add `will-change` immediately before an animation and remove it on `transitionend` or after the animation finishes.
- Use `content-visibility: auto` with `contain-intrinsic-size` for below-fold sections.
- Cap concurrent animations. Do not animate off-screen cards.
- Test at 4x CPU throttle and confirm the main thread stays responsive.
- Respect `prefers-reduced-motion: reduce`: set durations to 0.01ms, disable view transitions, reveal content immediately, keep focus and state changes instant.

### 5.9 Accessibility baseline

Target WCAG 2.2 AA.

- One `<h1>` per view. Logical heading order. Landmarks: `header`, `nav`, `main`, `footer`.
- Skip link as the first focusable element, visible on focus.
- Visible `:focus-visible` ring: 2px `--accent`, 2px offset, on every interactive element.
- Real buttons for actions, real links for navigation. Cards are links to `#/stay/<id>`; the heart is a sibling button with `aria-pressed`.
- Use `<dialog>` with `showModal()` for sheets and dialogs. Native focus trapping, Escape handling and `::backdrop`. Return focus to the trigger on close.
- Lock body scroll while a dialog is open with `overflow: hidden` and `scrollbar-gutter: stable`.
- Every icon-only button has an accessible name. Every input has a `<label for>`.
- Errors use `aria-invalid` and `aria-describedby`. Show an error summary at the top of long forms with links to fields.
- Availability cannot rely on colour alone: booked days get a diagonal hatch, a muted style and a text label in the accessible name.
- Announce route changes with a polite live region: "Explore, 18 stays" or "Stay detail, Modern Sunlit Loft".
- Minimum 44x44 touch targets. No hover-only information.
- Support 200% zoom, 320px width and text spacing overrides without clipping.
- Test keyboard-only: Tab, Shift+Tab, Enter, Space, Escape, arrow keys in the calendar and gallery.

---

## 6. Page specification

Routes use hash navigation so deep links work on a static host with no server rewrite. Keep aliases for the old hashes.

| Route | View | Aliases |
| :--- | :--- | :--- |
| `#/explore` | Explore | `#listings`, `#` |
| `#/stay/{id}` | Stay detail | none |
| `#/trips` | Trips | `#reservations` |
| `#/saved` | Saved | `#wishlist` |
| `#/hosts` | Hosts | `#hosts` |
| `#/hosts/{id}` | Host detail | none |
| `#/contact` | Contact | `#contact` |

Unknown routes render the 404 view. On route change: close open dialogs, update `document.title`, focus the view's `<h1 tabindex="-1">`, announce the route, and restore scroll only for back and forward navigation.

### 6.1 Global shell

**Header, 72px.** Wordmark left. Five text links centre. On the right, a single quiet link to Swagger (icon plus `API`) and the account placeholder removed. No stats ribbon, no theme toggle in the header. Hairline bottom border. On scroll past 8px, add a solid surface and keep the border. No blur.

**Mobile, below 900px.** Wordmark left, current view name centre, a compact `API` link right. Bottom tab bar with 5 items, icon plus label, active state in `--ink` with an amber 2px top indicator. Pad for the safe area. Hide the tab bar while a dialog is open.

**Footer.** Wordmark, one sentence, three link groups at most: Product (Explore, Trips, Saved), Project (README, API docs, Source), and a line with the course credit. The appearance control lives here as a labelled segmented control: System, Light, Dark. No link farm, no newsletter, no social icons, no dead links.

**Toast.** Bottom left on desktop, above the tab bar on mobile. Surface, hairline, icon, message, close button. 4 seconds, pause on hover, `role="status"`. No emoji, no exclamation marks.

### 6.2 Explore

This is the one marketing-grade surface. It must fit in the first viewport at 1440x900: headline, subtext, search and the top of the first card.

**Hero.** Asymmetric 7/5 split on a canvas background, not a full-bleed stock photo with a dark overlay. Left: meta label `18 stays · 9 places`, H1, 17-word subtext, and a text link `Browse the collection` that scrolls to results. Right: a composed image stack, one tall 4:5 image and one smaller 3:2 image offset down and left by 32px, overlapping by 24px, each with a small place caption set in `--text-xs` (`Rugova Valley, Peja`). The image stack bleeds to the right edge of the container. On mobile, the stack becomes a single 4:3 image below the copy, and the hero is at most 80dvh.

Do not use a background image with a dark gradient overlay. Do not centre the hero. Do not put a search card on top of a photo.

**Search console.** Directly below the hero or overlapping its bottom edge by 32px, a single surface panel with a hairline border, 64px tall on desktop. Four cells separated by 1px vertical rules: Where, Check in, Check out, Guests. Native date inputs with `min` set to today and `max` set to 18 months ahead. Guest control is a stepper (minus, count, plus), not a select. Primary button `Search stays` in `--action-bg`. On mobile, the panel becomes a single `Where` row plus a `Search stays` button; tapping opens a full-screen `<dialog>` with the four fields, a clear action and a sticky apply button. Show validation inline: check-out after check-in, at least 1 night, at most 365.

Defaults: check-in is today plus 7 days, check-out is today plus 10. Never default to a date in the past. Seed the initial results with no date filter so all stays are visible, and apply dates only when the user searches.

**Filters.** A single row under the search: category chips with text only, `All`, `Homes`, `Apartments`, `Cabins`, `Villas`, `Rooms`; active chip is a filled ink pill, inactive is a text button with a hairline underline. Then a sort control on the right, rendered as a native `<select>` styled to match, labelled `Sort`. Below, a results line: `18 stays in Kosovo, Albania and North Macedonia`. If filters are active, render removable filter chips and a `Clear all` text button. Do not stack two filter bars.

**Results grid.** 12 columns with the span pattern `7,5 / 5,7 / 8,4 / 4,8` repeating. Image aspect alternates 16:10, 4:5, 3:2, 1:1. Gap 32px. Each card:

- Image with `--r-sm`, a subtle inner hairline via a pseudo-element, and the heart button in the top right.
- Two lines of text below: title in `--text-xl`, place and category in `--text-sm` muted.
- A meta row: rating with one decimal and review count, or `New`; price `€150` in tabular figures plus `night` in muted.
- Up to three amenity labels as plain text separated by middots, not pills with emoji.
- Whole card is a link. Hover: image scales to 1.02 over 180ms, title gets an underline with 4px offset, no lift, no shadow.
- Heart: 40px button, surface background, hairline, `aria-pressed`, optimistic update, rollback on failure.

**States.**

- Loading: six skeleton cards that match the pattern, `--surface-2`, a 1.6s shimmer, disabled under reduced motion.
- Empty: a hairline-bounded panel with a short heading, one sentence, `Clear filters` and `Reset dates` actions. No emoji, no floating icon.
- Error: inline panel above the grid, `We could not load stays. Check your connection and try again.` and a `Try again` button. Keep the last good results visible if any.
- Image error: swap to a `--surface-2` block with the place name in small mono text. Never show a broken image icon.

**Pagination.** Load 24 per page with a `Show more stays` button that appends. Show `18 of 18` when done. Do not use infinite scroll that traps keyboard focus.

**Motion.** Hero reveal once, grid crossfade on filter change, card stagger capped at 8. No scroll-jacking.

### 6.3 Stay detail (`#/stay/{id}`)

Fetch by ID on direct load. Show a skeleton that matches the layout, not a spinner. If 404, show the not-found panel with `Back to stays`.

**Gallery.** Desktop: 8-column main image at 3:2 and two stacked 4-column images at 3:2, 8px gap, `--r-sm`. Mobile: horizontal scroll-snap carousel with 8px gaps, no dots, a counter in the corner (`1 / 3`) and a `View all photos` button. Clicking any image opens a full-screen `<dialog>` with the image, previous and next buttons, arrow key support and Escape. No autoplay.

**Header block.** Title at `--display-2`, max 2 lines. Below: place, category, rating and review count, and a `Superhost` text label when true. No badge pills. A hairline rule, then host row: 40px squircle avatar, `Hosted by <name>`, `Responds in about 15 minutes`. A `Message host` text button. Do not claim verification unless the API says so.

**Left column, 8 columns.**

- Description, max 68ch, collapsed to 3 lines with `Show more` if long.
- Amenities: 2-column list with Phosphor icons, grouped into Essentials, Comfort, Outside, Rules. Max 8 visible, then `Show all 12` as a disclosure.
- Availability: a real month calendar. Weekday header starting Monday, 44px cells, month navigation limited to today through 12 months ahead. Each day shows the date and, in small text, the price. Booked days use a hatch and muted text, past days are disabled, today has a ring. Selecting a range updates the booking rail. Keyboard: arrow keys move the focused day, Enter selects, Page Up and Page Down change month. Fetch `GET /v1/listings/{id}/availability` for the visible month and cache by month. Include a legend and a note about minimum stay.
- House rules: plain definition list, not cards.
- Reviews: average, total, distribution bars for 5 to 1, then a list of 5 with `Show more`. Each review shows initials avatar, name, date, rating and comment. `Write a review` opens a dialog with a 5-radio star group, 20 to 1200 character counter, and server errors inline.

**Right rail, 4 columns.** Sticky at 88px from the top. Price `€150` plus `night`, rating. A bordered surface with check-in and check-out fields, guest stepper, the server quote summary (nights, subtotal, discount, cleaning, service, tax, total, deposit note) and a full-width `Reserve` button. The quote is fetched on date or guest change, debounced 250ms, with an `AbortController`. Show `Checking availability` while loading. On mobile, replace the rail with a fixed bottom bar: price plus `Reserve`, padded for the safe area, hidden while a dialog is open.

**Similar stays.** Three cards from the same city, excluding the current stay, using cached listings or a search by city. Same card component, smaller. Title: `More in {city}`.

**Motion.** Shared image transition from the card, gallery fade-in 240ms, calendar slide 220ms, reviews reveal once. No parallax.

### 6.4 Booking flow

Use a side sheet on desktop, 480px wide, full height, and a full-screen sheet on mobile. Built on `<dialog>`. Header shows the stay name and dates, plus a close button. A three-step indicator with text labels, not dots. Back and forward preserve state.

**Step 1, Dates.** Check-in, check-out, guests. Inline validation. A server quote panel. If the dates are unavailable, show the conflict message inline and offer `Search other dates`, which returns to Explore with the same place filter. If the stay is below the minimum, show `This stay needs at least N nights.` Disable `Continue` until a valid quote exists. Do not let the user proceed with a quote that failed.

**Step 2, Guest details.** First name, last name, email, phone, optional special requests with a 500 character counter, and a `Request to book` toggle only when the listing does not support instant book. Validate on blur and on submit. Label above input, helper below, error below. No placeholder-as-label. `Continue` focuses the first invalid field.

**Step 3, Review and pay.** Itemised quote from the server, exactly the same numbers that will be stored. A checkbox `I agree to the house rules` with a link that opens the rules in a small dialog. Demo payment note. `Confirm and pay` is disabled until the checkbox is checked. On submit: disable the button, show an inline progress state, prevent double submission. On success, replace the panel with the confirmation state: check draw, `Booking confirmed`, reference, dates, total, `View trip`. Do not fire confetti. On 409, return the user to step 1 with the conflict message and a fresh quote. On network error, keep the data, show a retry, never clear the form.

Closing a dirty sheet asks for confirmation in a small dialog, not `window.confirm`. Escape closes cleanly when not submitting.

**Focus.** On open, focus the first field. Trap focus. On close, return to the `Reserve` button that opened it. On step change, move focus to the step heading.

### 6.5 Trips (`#/trips`)

**Header.** `Your trips` and a count. No loud gradient banner. A hairline rule, then four compact stats in a row, plain text with tabular figures: `Nights booked`, `Stays`, `Next check-in`, `Total paid`. Values are computed from reservations in EUR. Do not sum mixed currencies. If a currency other than EUR ever appears, group by currency instead of adding.

**Filters.** Segmented text control: All, Upcoming, Staying now, Past, Cancelled, each with a count. Active state is ink fill. Empty per filter has its own sentence and a reset action.

**Booking card.** Grid: 320px image left, content right. Image 4:3 with `--r-sm`. Status as a small text label with a dot, not a candy pill: Confirmed, Pending approval, Checked in, Completed, Cancelled. Title, place, reference in mono, check-in and check-out timeline with a dashed rule and a `N nights` label in the middle, guest count, booking flow, host row, total with `avg / night`, and actions:

- `Message host` opens the thread drawer.
- `Price details` is a disclosure that expands inside the card, not a modal.
- `Cancel booking` opens a small dialog with a reason select, a warning about the demo, and confirm. Disabled for past or completed stays.

Cancelled cards are dimmed with a hairline and keep full text contrast. Do not grayscale the image to the point of disappearing.

**Thread drawer.** Right-side `<dialog>`, 420px. Message groups by date, sender labels, timestamps, an `aria-live="polite"` feed, auto-scroll only when the user is at the bottom. Composer: input, `Send`, Enter to send, Shift+Enter for a newline if multiline, disabled while sending, optimistic bubble with a retry on failure. Poll every 10 seconds only while open and the tab is visible. Stop on close. Empty state uses the copy deck.

**Loading.** Skeleton cards that match the layout. No layout shift when data arrives.

### 6.6 Saved (`#/saved`)

Fetch `GET /v1/favorites` and keep the returned listings in `state.favoriteListings`, independent of search. Render the same card grid. Removing a heart updates the grid optimistically and toasts quietly. Empty state per the copy deck with a `Browse stays` button. The nav badge shows the saved count and is hidden at zero.

### 6.7 Hosts (`#/hosts` and `#/hosts/{id}`)

**Roster.** A vertical list, not a card grid of three. Each row: 64px squircle avatar, name, `Superhost` as text, response rate and time, weighted aggregate rating, property count, and `View stays`. Hairline dividers, generous spacing. Fetch `GET /v1/hosts`.

**Host detail.** Name, avatar, bio (add a short seeded bio), response metrics, verification checklist with real booleans from `GET /v1/hosts/{id}/verification`: government ID, phone, email, background check. Each item uses a check or minus icon and a text label, never colour alone. Then the host's listings from `GET /v1/hosts/{id}/listings` using the standard card.

**Verification button is gone.** No `Run Real-Time Trust Verification` toast. Show the data.

### 6.8 Contact (`#/contact`)

Two columns. Left: `Contact FatiHomes`, one paragraph, and a mailto link with a real address, a phone number and an office address with a map link that opens in a new tab. Right: three short rows: Booking help, Hosting, Press, each with an email link and a response time. Include a `Read the API documentation` link to `/swagger` and a `Project README` link. No fake contact form that does nothing. No office-hours emoji.

### 6.9 System states

- **404 view:** headline, one sentence, `Back to stays`, and three suggested stays.
- **Offline:** a small banner when `navigator.onLine` is false: `You are offline. Showing the last loaded stays.` Dismissible, no auto-hide.
- **Global error:** a boundary that catches render errors, shows a composed panel with a reload action, and logs to the console once.
- **Empty images and missing data:** never render `undefined`, `null`, `NaN` or `Invalid Date`. Format helpers must return a fallback like `Price on request` instead of throwing.

---

## 7. API work

### 7.1 Contract and error envelope

Create one error type:

```csharp
public sealed record ApiError(
    string Code,
    string Message,
    string TraceId,
    IReadOnlyDictionary<string, string[]>? FieldErrors = null,
    object? Details = null);
```

Rules:

- Every 4xx and 5xx response uses this shape, including model-binding failures and exceptions.
- `traceId` comes from `HttpContext.TraceIdentifier`.
- `fieldErrors` uses camelCase field names that match the JSON request.
- Configure `ApiBehaviorOptions.InvalidModelStateResponseFactory` to return `ApiError` with code `VALIDATION_FAILED`.
- Use stable codes: `VALIDATION_FAILED`, `RESOURCE_NOT_FOUND`, `BOOKING_CONFLICT`, `INVALID_STATUS_TRANSITION`, `MIN_STAY_NOT_MET`, `DATE_ORDER`, `DATE_IN_PAST`, `STAY_TOO_LONG`, `CAPACITY_EXCEEDED`, `CANCELLATION_NOT_ALLOWED`, `LISTING_HAS_ACTIVE_RESERVATIONS`, `RATE_LIMIT_EXCEEDED`, `INVALID_SORT`, `INTERNAL_SERVER_ERROR`.
- Controllers never return anonymous error objects.
- In production, `message` is safe to show to a user. The exception middleware adds a generic sentence, never a stack trace. In development, include `details.exception` only when `StageConfig:EnableDetailedErrors` is true.

Validation:

- Add DataAnnotations to request models where they fit and keep manual checks for cross-field rules.
- Add `[MaxLength]` to every string. Title 5 to 120, description 20 to 2000, review comment 20 to 1200, name 2 to 80, email `[EmailAddress]`, phone 7 to 20 characters, special requests 0 to 500, cancellation reason 0 to 240.
- Reject unknown enum values and unknown categories with 422.
- Trim all strings before validation and storage.
- Reject NaN and infinite numbers in coordinates, prices and ratings.

### 7.2 Pricing service and quote endpoint

Extract pricing into `Services/PricingCalculator.cs`. Both quote and create must call it. No pricing arithmetic in controllers.

```csharp
public sealed record ReservationQuote(
    Guid ListingId,
    string Currency,
    int Nights,
    decimal NightlyRate,
    decimal BasePrice,
    decimal DiscountPercent,
    decimal DiscountAmount,
    decimal CleaningFee,
    decimal ServiceFee,
    decimal OccupancyTax,
    decimal SecurityDeposit,
    decimal TotalAmount,
    int MinimumStayNights,
    bool IsAvailable,
    string? UnavailableReason,
    IReadOnlyList<PriceBreakdownItem> Items);
```

Add `POST /v1/reservations/quote`:

```json
{
  "listingId": "e14c1d68-0fa4-44bc-b17b-4b248a31e8fd",
  "checkInDate": "2027-03-01",
  "checkOutDate": "2027-03-07",
  "guestsCount": 2
}
```

Response 200:

```json
{
  "listingId": "e14c1d68-0fa4-44bc-b17b-4b248a31e8fd",
  "currency": "EUR",
  "nights": 6,
  "nightlyRate": 95,
  "basePrice": 570,
  "discountPercent": 0,
  "discountAmount": 0,
  "cleaningFee": 30,
  "serviceFee": 14.25,
  "occupancyTax": 4,
  "securityDeposit": 100,
  "totalAmount": 618.25,
  "minimumStayNights": 2,
  "isAvailable": true,
  "unavailableReason": null,
  "items": [
    { "description": "6 nights at 95.00", "amount": 570 },
    { "description": "Cleaning fee", "amount": 30 },
    { "description": "Service fee", "amount": 14.25 },
    { "description": "Occupancy tax", "amount": 4 }
  ]
}
```

Rules:

- Weekly discount applies at 7 or more nights, monthly at 30 or more. Monthly wins.
- Round every monetary value to 2 decimals with `MidpointRounding.AwayFromZero`.
- `total = base - discount + cleaning + service + tax`. Deposit is never added to total.
- Quote returns 200 with `isAvailable: false` and a reason for unavailable dates, so the UI can explain instead of failing. It returns 404 for an unknown listing and 422 for invalid dates, guests or minimum stay.
- Create uses the same calculator and must produce exactly the same total for the same input. Add a test that asserts parity.
- Remove `EarlyBirdDiscountPercent` if it stays unused. Do not keep dead pricing fields.

### 7.3 Reservation rules

Validate in this order and return the first failure:

1. Listing exists, else 404 `RESOURCE_NOT_FOUND`.
2. Both dates present, else 422 with field errors.
3. Check-out after check-in, else 422 `DATE_ORDER`.
4. Check-in not before `DateOnly.FromDateTime(DateTime.UtcNow)`, else 422 `DATE_IN_PAST`.
5. Nights between the listing minimum and 365, else 422 `MIN_STAY_NOT_MET` or `STAY_TOO_LONG`.
6. Guests between 1 and `Capacity.MaxGuests`, else 422 `CAPACITY_EXCEEDED`.
7. Booking flow in `instant_book` or `request_to_book`, else 422.
8. No overlapping active reservation, else 409 `BOOKING_CONFLICT` with `details: { checkInDate, checkOutDate }`.
9. Payment token at most 128 characters. Never log, store or echo it. Document it as simulated.

Status machine:

| From | Allowed to |
| :--- | :--- |
| `pending_approval` | `confirmed`, `cancelled` |
| `confirmed` | `checked_in`, `cancelled` |
| `checked_in` | `completed` |
| `completed` | none |
| `cancelled` | none |

- Reject anything else with 409 `INVALID_STATUS_TRANSITION` and `details: { from, to, allowed }`.
- `checked_in` only on or after the check-in date. `completed` only on or after the check-out date.
- Cancellation allowed only from `pending_approval` or `confirmed`, and only before check-in. Otherwise 409 `CANCELLATION_NOT_ALLOWED`.
- Add `CancelledAt` to the reservation when it is cancelled, if you can do it without breaking the JSON contract. If not, use `UpdatedAt` and document.

Create `Services/ReservationRules.cs` for overlap, minimum stay and transitions. Both controllers and tests use it.

### 7.4 Availability

`GET /v1/listings/{id}/availability?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

- Both parameters required. Missing one returns 422 with a field error, not a default date.
- `end_date` must not be before `start_date`.
- Window capped at 92 days.
- Day object: `date`, `isAvailable`, `nightlyPrice`, `minimumStayNights`, `blockReason` in `available`, `booked`, `past`.
- Days before today are `isAvailable: false`, `blockReason: "past"`.
- Overlap uses half-open intervals: a checkout day is available for a new check-in.
- Minimum stay comes from the listing. Add `MinNights` to `PricingMatrix` or `ListingDetail`, default 2, and use it everywhere. Do not hard-code 2.

### 7.5 Search correctness

Keep `POST /v1/listings/search`. Implement or remove every field.

Implement:

- `hostId`: exact match, used by host detail.
- `neighborhoodId`: exact match, case-insensitive.
- `petsCount`: require `petsCount <= listing.HouseRules.MaxPets`.
- `circleSearch`: haversine distance in metres, filter `<= radiusMeters`. Validate radius 100 to 100000.
- `polygonSearch`: ray casting, at least 3 points, validate coordinates.
- `sortBy`: add `distance_asc` when a circle is present.

Remove from the request model, code and docs:

- `adultsCount`, `childrenCount`, `infantsCount`. One `guestsCount` is enough.
- `currency`. The catalogue is EUR.

Validation:

- `query` max 120 characters, trimmed.
- Both dates or neither. One date returns 422.
- Check-out after check-in, max 366 nights.
- Guests 1 to 20.
- Price min and max positive, min <= max.
- `minRating` 0 to 5.
- `page` >= 1, `pageSize` 1 to 48, clamped. Do not silently accept 9999.
- Unknown `sortBy` returns 422 `INVALID_SORT` with the allowed list.
- Unknown category returns 422.

Sorting:

- `recommended`: weighted rating, then review count, then newest.
- `price_asc`, `price_desc`, `rating_desc`, `reviews_desc`, `distance_asc`.
- Return `page`, `pageSize`, `totalRecords`, `totalPages`, `results`. Include `appliedFilters` so the UI can render active chips without guessing.

### 7.6 Hosts

- Add `GET /v1/hosts` returning `HostProfileResponse[]`, sorted by name.
- Build a host directory from distinct hosts in listings so a host exists even with zero listings.
- Aggregate rating is weighted: `sum(star * reviewCount) / sum(reviewCount)`, rounded to 2 decimals. Zero reviews gives 0.
- `TotalReviewsReceived` is the sum of actual review counts.
- Unknown host ID returns 404.
- Add a `HostVerification` record stored per host with phone, email, government ID and background check booleans. Seed realistic values. `GET /verification` returns those flags, not values derived from unrelated fields.
- Add a 160 character bio and a `JoinedYear` to the host profile, seeded.

### 7.7 Reviews

- `GET` returns `averageRating`, `totalReviews`, `page`, `pageSize`, `reviews`.
- Validate rating 1 to 5, comment 20 to 1200 after trim, name 2 to 80.
- Recompute `StarRating` and `ReviewCount` from actual review records on every add.
- Seed reviews so every count is true. For listings with no reviews, `ReviewCount` is 0 and `StarRating` is 0; the UI shows `New`.
- Rate limit review writes to 5 per minute per IP.
- Do not trust `authorAvatarUrl`. The UI uses initials avatars and ignores it.

### 7.8 Favorites and concurrency

- Move the existence check and the toggle into one `Modify` call.
- Return `{ listingId, favorited }`.
- Keep the response 200 for both add and remove.
- Seed two favorites so the Saved view is not empty in a fresh demo.
- `GET /v1/favorites` returns full listings, ordered by title.

### 7.9 Stats and currency

- Normalise every seeded listing to EUR. Use plausible regional prices: €35 to €180 per night.
- `SystemStatsResponse`: keep `totalListings`, `totalReservations`, `totalReviews`, `totalFavorites`, `systemVersion`, `serverTimeUtc`. Add `uptimeSeconds` (int), `totalPaidByCurrency` (dictionary), `upcomingReservations` (int) and `averageNightlyRate` (decimal). Remove `uptime` as a `TimeSpan` if it complicates the UI, or keep it as a formatted string and document it.
- `systemVersion` comes from the assembly informational version, not a hard-coded `2.0.0`.
- Health returns 200 with `status`, `checks.store`, `version`, `uptimeSeconds`, `environment`. Set `Cache-Control: no-store`.

### 7.10 Seed data

Move seeding out of `MockDataStore` into `Services/SeedData.cs`. Keep the store responsible for concurrency.

Requirements:

- 18 listings across 9 places: Pristina, Prizren, Peja, Gjakova, Brezovica, Tirana, Berat, Sarandë, Dhermi. A few can be outside the region if the copy justifies it, but the default demo is regional.
- All prices in EUR, realistic for the region.
- 4 hosts with bios, joined years, response times and verification flags.
- Deterministic GUIDs for every listing, host and seeded reservation. Put the IDs in `docs/SEED_IDS.md` and link them from the README.
- Some listings have `MinNights: 3`, one has 5, the rest 2.
- 4 seeded reservations relative to today so every Trips filter has content:
  - `confirmed`, upcoming, check-in today + 14, for listing 1.
  - `pending_approval`, upcoming, today + 30.
  - `completed`, past, today - 45.
  - `cancelled`, past, today - 20, with a reason.
- Seed messages on the upcoming reservation, guest and host, 4 to 6 messages.
- Seed 2 favorites.
- Seed 2 to 3 reviews for 6 highlighted listings, with varied ratings that produce the displayed averages. For the other 12, `ReviewCount` is 0.
- Recompute every reservation total with `PricingCalculator`. The numbers in the seed must match the line items exactly.
- Make seed dates depend on `DateTime.UtcNow` so the demo is always current, but keep IDs stable.
- Add `DemoMode:ResetOnStart` (default true) and `POST /v1/system/reset` enabled only when the environment is Development or the flag is true. It resets data to seed. Return 404 in production. Document it.

### 7.11 Rate limiting

Add `RateLimitOptions` bound from configuration:

```json
"RateLimiting": {
  "ApiRequestsPerMinute": 120,
  "WriteRequestsPerMinute": 20,
  "ExemptPaths": ["/swagger", "/css", "/js", "/fonts", "/images", "/favicon.ico", "/robots.txt", "/v1/system/health"]
}
```

- Apply the API limit to `/v1` paths except exempt ones.
- Apply the write limit to `POST`, `PUT`, `PATCH`, `DELETE` under `/v1`.
- Do not count static files. Put `UseStaticFiles` before the rate limiter.
- Return 429 with `ApiError`, `Retry-After` in seconds, `X-RateLimit-Limit`, `X-RateLimit-Remaining` and `X-RateLimit-Reset` as a Unix timestamp.
- Evict entries older than two windows. Use a `PeriodicTimer` or a sweep every 500 requests, and cap the dictionary at 20,000 entries.
- In the `Testing` environment, use limits high enough that tests do not collide, and add one dedicated test with a low limit.
- If `ReverseProxy:Enabled` is true, call `UseForwardedHeaders` so the IP is correct. Document the setting.

### 7.12 Security headers and CSP

Rewrite `SecurityHeadersMiddleware`.

Application paths:

```text
default-src 'none';
script-src 'self';
style-src 'self';
style-src-attr 'none';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
manifest-src 'self';
base-uri 'none';
form-action 'self';
frame-ancestors 'none';
object-src 'none'
```

Swagger paths (`/swagger`):

```text
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
frame-ancestors 'none'
```

Other headers:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY` for compatibility, plus `frame-ancestors 'none'`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` only outside Development
- Remove `X-XSS-Protection`. It is deprecated and can introduce vulnerabilities.

The strict policy only works after the front end removes all inline scripts, handlers and style attributes. Do not enable `style-src-attr 'none'` until a search of `wwwroot` for `style=` returns nothing.

### 7.13 Pipeline

Target order:

```text
ExceptionHandlingMiddleware
ForwardedHeaders          only when enabled
HSTS                      production only
HttpsRedirection          production only
SecurityHeadersMiddleware
ResponseCompression
DefaultFiles + StaticFiles
RateLimitMiddleware
CORS
Swagger + SwaggerUI
MapControllers
```

- Add `AddResponseCompression` for JSON, HTML, CSS, JavaScript and SVG, with Brotli and Gzip.
- Set cache headers: fonts and images long-lived, CSS and JS one hour, HTML no-cache. Documents the lack of hashed filenames.
- Remove `AddAuthorization` and `UseAuthorization` until authentication exists.
- Move `/v1/system/stage` into `SystemController`.
- Register services: `MockDataStore`, `PricingCalculator`, `ReservationRules` (static is fine), `SeedData`, `IOptions<RateLimitOptions>`.
- Add `public partial class Program { }` at the end of `Program.cs` for integration tests.

### 7.14 OpenAPI and XML documentation

- Add XML comments to every controller action: summary, params, response codes, example body where useful.
- Add `[ProducesResponseType(typeof(ApiError), ...)]` for every error code an action can return.
- Configure `SwaggerDoc` with title, version from the assembly, description, contact and licence.
- Add `IncludeXmlComments` with `includeControllerXmlComments: true`.
- Rewrite `docs/openapi.yaml` so it matches the runtime exactly: 18 paths plus quote, hosts list and reset, all schemas, all error responses, EUR, and `servers: http://localhost:5047`.
- Add `scripts/verify-openapi.ps1` that calls the running app's `/swagger/v1/swagger.json`, compares the path sets with the YAML, and prints missing and extra paths. Exit non-zero on drift. Document it in the README.
- Keep the Swagger UI custom stylesheet, but update its colours to the new palette. No red gradient topbar.

---

## 8. Front-end architecture

### 8.1 File tree

Split the single script and stylesheet. No build step, ES modules loaded with `<script type="module" src="/js/main.js">`.

```text
wwwroot/
├── index.html
├── css/
│   ├── tokens.css        Custom properties, themes, type scale
│   ├── base.css          Reset, elements, focus, typography
│   ├── layout.css        Container, grid, header, footer, views
│   ├── components.css    Buttons, inputs, cards, chips, dialogs, toasts
│   ├── pages.css         Explore, detail, booking, trips, saved, hosts, contact
│   └── motion.css        Keyframes, reveals, reduced-motion overrides
├── js/
│   ├── main.js           Boot, route registration
│   ├── api.js            fetch wrapper, ApiError, timeout, abort
│   ├── store.js          Small state container with subscribe
│   ├── router.js         Hash routing, aliases, focus and title
│   ├── format.js         EUR, dates, nights, plurals, booking code
│   ├── dom.js            el(), clear(), delegate(), safe text
│   ├── motion.js         reveal(), transition(), reduced motion
│   ├── dialog.js         <dialog> helpers, scroll lock, focus return
│   ├── calendar.js       Month grid, keyboard, availability fetch
│   ├── quote.js          Debounced quote requests
│   ├── booking.js        Steps, validation, submit
│   ├── chat.js           Thread drawer and polling
│   ├── views/
│   │   ├── explore.js
│   │   ├── stay.js
│   │   ├── trips.js
│   │   ├── saved.js
│   │   ├── hosts.js
│   │   ├── host.js
│   │   ├── contact.js
│   │   └── notfound.js
│   └── icons.js          Inline sprite helper
├── images/
│   ├── stays/            18 WebP photos, 3 sizes
│   ├── icons.svg         Phosphor sprite
│   ├── logo.svg
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   └── og.webp
└── fonts/
    ├── schibsted-grotesk-*.woff2
    ├── geist-*.woff2
    └── geist-mono-*.woff2
```

CSS uses `@layer reset, tokens, base, layout, components, pages, utilities;`. Total CSS under 70KB uncompressed, JS under 70KB uncompressed.

### 8.2 Coding rules

- No global functions. No `onclick` attributes. All events use `addEventListener` or delegated `data-action` handlers.
- No `innerHTML` with untrusted data. Build nodes with `el()` and `textContent`, or use `<template>` and fill text nodes. If you must use `innerHTML` for static markup, never interpolate a server string into it.
- Every fetch goes through `api.js`. It sets a 10 second timeout with `AbortController`, parses JSON, throws `ApiError` with `status`, `code`, `message`, `fieldErrors`, and never uses `alert`.
- State lives in `store.js`: `listings`, `listingCache`, `favoriteListings`, `reservations`, `filters`, `quote`, `session`. Subscribe to changes, render only the affected view.
- No `window.addEventListener('scroll')`. Use IntersectionObserver, CSS scroll-driven animations with `@supports`, or ResizeObserver.
- Dates are local `Date` objects built from `YYYY-MM-DD` parts, never `new Date('YYYY-MM-DD')` which parses as UTC. Use one helper.
- Money uses `Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' })`. Receipts show 2 decimals, headline prices show 0 decimals. All numbers use tabular figures.
- Pluralise explicitly: `1 night`, `2 nights`.
- Booking codes are `FH-` plus 5 characters from a deterministic hash of the reservation ID. Display only, never used for lookup.
- Every async render has loading, empty and error states. No view may render `undefined`.
- No `console.log` in production paths. Errors log once with context.

### 8.3 Routing

- `router.js` maps hash to a view module. Unknown routes render `notfound`.
- On navigation: close dialogs, set `document.title`, render into `<main>`, focus the `<h1 tabindex="-1">`, update `aria-current` on nav links, announce via the live region, and scroll to top except on back/forward.
- Support direct links to `#/stay/<guid>` and `#/hosts/<guid>` on a cold load.
- Keep `#listings`, `#wishlist`, `#reservations` as aliases that redirect with `replaceState`.
- Use the History API only for hash changes, no server rewrite needed.

### 8.4 Rendering and escaping

- Never inject a title, description, name, comment, city, amenity or error message with `innerHTML`.
- Add a test or a lint-style grep that fails if `innerHTML` appears with a template literal containing a server field. At minimum, document the rule and review every occurrence.
- Use `textContent` for all user data and `document.createElement` for structure.
- URLs used in `href` or `src` must be validated: allow only same-origin paths or `https:` and never `javascript:`.

### 8.5 Forms

- Label above, input, helper below, error below, all connected with `aria-describedby`.
- Validate on blur and on submit, not on every keystroke. Clear an error when the field becomes valid.
- Show the error summary at the top of the booking sheet when submit fails.
- Disable the submit button only while a request is in flight, not as a substitute for validation.
- Never use `placeholder` as a label. Placeholders are examples only.
- Numeric inputs use `inputmode` and `autocomplete` where appropriate. Email uses `autocomplete="email"`, phone `autocomplete="tel"`, names `autocomplete="given-name"` and `family-name"`.

### 8.6 Assets and performance

- Preload the two font files used above the fold, not all of them.
- Preload the hero image with `fetchpriority="high"`. Lazy-load everything else.
- Use `srcset` with 800, 1200 and 1600 widths and `sizes` that match the grid spans.
- Reserve image dimensions to prevent CLS. Skeletons must match the final height exactly.
- Inline critical CSS? No. Keep it simple: six small stylesheets load fast enough locally.
- Remove the Google Fonts link, the Unsplash hotlinks and the inline `<style>` block entirely.
- Add `<meta name="theme-color">`, `<meta name="description">`, Open Graph tags, `lang="en"`, and a canonical link.
- Add `robots.txt` and a `manifest.webmanifest` with the new icons. No service worker, to avoid stale-cache confusion during the demo.

### 8.7 No-inline policy

After the refactor, these commands must return nothing:

```powershell
Get-ChildItem wwwroot -Recurse -File -Include *.html,*.css,*.js |
    Select-String -Pattern 'onclick=|onsubmit=|onchange=|oninput=|style='

Get-ChildItem wwwroot -Recurse -File -Include *.html,*.css,*.js |
    Select-String -Pattern 'googleapis|unsplash|confirm\(|alert\(|prompt\('
```

Also review every `innerHTML` occurrence by hand:

```powershell
Get-ChildItem wwwroot/js -Recurse -File | Select-String -Pattern 'innerHTML'
```

There may be static `innerHTML` used for SVG sprites. Document any exception in a comment and keep server data out of it.

---

## 9. Testing and verification

### 9.1 Test project

Create `tests/StayHubApi.Tests/StayHubApi.Tests.csproj` targeting `net10.0`, with:

- `Microsoft.NET.Test.Sdk`
- `xunit` and `xunit.runner.visualstudio`
- `Microsoft.AspNetCore.Mvc.Testing`
- a project reference to `StayHubApi.csproj`

Add `StayHubApi.sln` at the root containing both projects. Keep `dotnet run` working.

Use `WebApplicationFactory<Program>` and a fixture per test class. Set `ASPNETCORE_ENVIRONMENT=Testing` and high rate limits so tests do not interfere. Each test gets a clean store; prefer constructing a new factory per class and resetting through the test hook or a fresh app.

### 9.2 Required tests

At minimum:

1. `Search_NoFilters_ReturnsAllSeededListings`
2. `Search_ReversedDates_Returns422WithFieldErrors`
3. `Search_SingleDate_Returns422`
4. `Search_CategoryAndAmenities_FilterCorrectly`
5. `Search_DateRange_ExcludesBookedListing`
6. `Search_CircleFilter_ReturnsOnlyNearby`
7. `Search_PolygonFilter_ReturnsOnlyInside`
8. `Search_UnknownSort_Returns422`
9. `Quote_TotalMatchesCreatedReservation`
10. `Quote_WeeklyDiscountAtSevenNights`
11. `Quote_MonthlyDiscountAtThirtyNights`
12. `CreateReservation_PastCheckIn_Returns422`
13. `CreateReservation_BelowMinimumStay_Returns422`
14. `CreateReservation_Overlap_Returns409`
15. `CreateReservation_GuestsAboveCapacity_Returns422`
16. `Status_IllegalTransition_Returns409`
17. `Status_PendingToConfirmed_Succeeds`
18. `Availability_MissingDates_Returns422`
19. `Availability_WindowOver92Days_Returns422`
20. `Availability_PastDaysMarkedUnavailable`
21. `Reviews_RatingOutOfRange_Returns400`
22. `Reviews_AddRecalculatesAverageAndCount`
23. `Favorites_ToggleTwice_ReturnsFalse`
24. `Hosts_ListReturnsEveryHost`
25. `Hosts_AggregateRating_IsWeighted`
26. `Stats_GroupsPaidTotalsByCurrency`
27. `Errors_AllFailuresUseApiErrorShape`
28. `SecurityHeaders_AppCspHasNoUnsafeInline`
29. `SecurityHeaders_SwaggerCspAllowsInline`
30. `StaticAssets_AreNotRateLimited`

Add a pricing unit test class for integer and decimal rounding edge cases.

### 9.3 Manual QA matrix

Run every row and record pass or fail:

| # | Check | Expected |
| :--- | :--- | :--- |
| 1 | Cold load at 1440x900 | Hero, search and first card visible, no layout shift |
| 2 | 320px width | No horizontal scroll, bottom nav visible, search sheet usable |
| 3 | Keyboard only | Skip link, all controls reachable, dialogs trap focus, Escape closes |
| 4 | Reduced motion | No reveals, no view transitions, no shimmer |
| 5 | Dark mode | All text passes contrast, images and borders visible |
| 6 | Offline reload | App shell, fonts and images load from localhost, no external requests |
| 7 | Search "prizren" | Matching stays only, count updates |
| 8 | Date filters | Booked stay excluded, past defaults avoided |
| 9 | Deep link `#/stay/<id>` | Detail loads directly, title correct |
| 10 | Availability month nav | 3 months switch, prices and booked days correct |
| 11 | Booking 1 night on a 2-night minimum | Inline error, cannot continue |
| 12 | Booking a booked range | Conflict inline, no reservation created |
| 13 | Booking 7 nights | Discount shown, total matches API |
| 14 | Double click Confirm | Exactly one reservation |
| 15 | Cancel booking | Dialog, reason, status updates, cannot cancel past |
| 16 | Illegal status via Swagger | 409 with allowed transitions |
| 17 | Saved view with no favorites | Empty state, no errors |
| 18 | Save, filter, open Saved | Stay still listed |
| 19 | Review 1 star | Accepted by API and displayed |
| 20 | Review with `<img onerror>` | Rendered as text, no script execution |
| 21 | 120 requests in a minute | 429 on the 121st, static assets still load |
| 22 | Response headers | CSP has no `unsafe-inline` on `/`, Swagger policy separate |
| 23 | Swagger | All operations documented, Try it out works |
| 24 | Lighthouse desktop | Performance >= 95, Accessibility 100, Best Practices 100, SEO 100 |
| 25 | axe DevTools | Zero critical and serious issues |

### 9.4 Commands

```powershell
dotnet restore
dotnet build -warnaserror
dotnet test
dotnet run --launch-profile dev
```

Then:

```powershell
# smoke
Invoke-RestMethod http://localhost:5047/v1/system/health
Invoke-RestMethod http://localhost:5047/v1/system/stats
Invoke-RestMethod http://localhost:5047/v1/hosts

# CSP and headers
(Invoke-WebRequest http://localhost:5047/ -UseBasicParsing).Headers['Content-Security-Policy']

# no inline handlers or styles
Get-ChildItem wwwroot -Recurse -File -Include *.html,*.css,*.js |
    Select-String -Pattern 'onclick=|onsubmit=|style='

# no external assets
Get-ChildItem wwwroot -Recurse -File -Include *.html,*.css,*.js |
    Select-String -Pattern 'googleapis|unsplash'
```

`scripts/verify-openapi.ps1` must pass.

### 9.5 Evidence

Collect and report:

- `dotnet build` output with 0 warnings.
- `dotnet test` summary with the number of passing tests.
- Lighthouse scores per category.
- axe results.
- Screenshots at 1440, 1024, 768 and 375 widths, light and dark, of Explore, Stay, Booking, Trips, Saved, Hosts.
- A short screen recording or a GIF of the booking flow if the tooling allows it.
- The exact commands you ran and their output tails.

---

## 10. README deliverable

A README already exists and was verified against the current code on 2026-11-03. Keep its structure. Update it after the implementation so it stays true.

It must contain:

1. **Overview** with stack, scope and an honest status line.
2. **Quick start** with prerequisites, the exact dev and prod ports, and the URLs table.
3. **Project structure** as an annotated tree that matches the new `css/`, `js/`, `tests/`, `scripts/` and `docs/` folders.
4. **Where is the code for ...?** A table of at least 35 rows mapping a concept to a file and line, with a searchable symbol in each row. Cover:
   - routes and controllers
   - middleware order and each middleware
   - CORS, CSP, HSTS, rate limiting
   - error envelope and validation
   - pricing calculator and quote endpoint
   - overlap and state machine
   - availability and minimum stay
   - search filters, sorting, geo
   - seed data and deterministic IDs
   - every front-end view, component, router, store, API wrapper, dialog helper, calendar and formatter
   - CSS tokens, typography, motion
   - fonts, images, icons
   - Swagger config, OpenAPI file, verification script
   - launch profiles, settings, run scripts, tests, CI
5. **API reference** with one table per controller: method, path, action name, file and line, request body, success, error codes. All 25+ operations, including quote, hosts list and reset. Add one copy-paste `curl` or PowerShell example per controller.
6. **Error reference** with every code, HTTP status and meaning.
7. **Request pipeline** diagram and the reason for the order.
8. **Data model** table with key fields and the seed ID list or a link to `docs/SEED_IDS.md`.
9. **Pricing rules** with the formula and one worked example whose numbers match the seed.
10. **Configuration** table, marking keys that are actually used and removing dead keys.
11. **Demo script** for the professor, 8 steps, with the expected result at each step.
12. **Testing** with commands, the test list and the manual matrix summary.
13. **Known limitations** updated to remove fixed items and keep only true ones.
14. **Security notes** with the current CSP, auth status and demo warnings.
15. **Credits and licence**, including font and photo licences.
16. **"Questions the professor may ask"** with 15 short answers, for example: Where is CORS, where is the API header, how is double booking prevented, why is there no database, how are prices calculated, what happens on 409, how do I add an endpoint, how do I change a colour, how do I change the port, why is there no authentication, what is the difference between `docs/openapi.yaml` and `/swagger/v1/swagger.json`, how do I run the tests, where is the state machine, where are the seeded IDs, what is not finished.
17. **Upgrade plan** link to this file.

Also update `read.md` in Albanian with the same structure, shortened.

Line references will move. In the table, put the line and the symbol, and add a note at the top: "Line numbers verified at commit X; search for the symbol if they drift."

---

## 11. Repository hygiene

- Add `.gitignore`: `bin/`, `obj/`, `.vs/`, `*.user`, `TestResults/`, `*.log`, `.DS_Store`, `node_modules/`.
- Stop tracking build output: `git rm -r --cached bin obj`, then commit. Do not rewrite history.
- Add `.editorconfig` for C#, JSON, CSS, JS and Markdown. 4 spaces for C#, 2 for JSON/CSS/JS, LF, UTF-8.
- Replace `StayHubApi.http` with real requests for health, search, quote, create, conflict, cancel, reviews, favorites and hosts. Use variables for the host and one listing ID.
- Remove `//artik test branch` from `php/index.php` and add a `README` note that the PHP page is a course artefact.
- Add `LICENSE` (MIT for code) with a note that photos and fonts keep their own licences.
- Add `.github/workflows/ci.yml` running restore, build with warnings as errors, and test on `ubuntu-latest` with .NET 10. If GitHub Actions is out of scope, document the local commands instead.
- Keep `UshtrimiAdili.md` but move it under `docs/course/` and link it from the README. Do not delete course artefacts.

---

## 12. Execution plan

Work in this order. Each phase ends with a build, tests where they exist, a manual check and a commit. Do not start the next phase with a broken build.

**Phase 0, baseline.** Create a branch `upgrade/ui`. Add `.gitignore`, untrack `bin/` and `obj/`, fix `StayHubApi.http`, add the solution and test project skeleton, and commit. Exit: clean `git status`, `dotnet build` passes.

**Phase 1, API core.** Add `ApiError`, unified validation, `PricingCalculator`, `ReservationQuote`, quote endpoint, reservation rules and state machine, availability validation, rate limit options, seed data in EUR with deterministic IDs, hosts list and verification records, stats changes. Write the pricing and reservation tests now. Exit: `dotnet test` green for the API core, Swagger shows the new endpoints, no 500s in the smoke test.

**Phase 2, design foundation.** Add fonts, tokens, CSS layers, the new shell, mobile tab bar, dialogs, router, store, API wrapper, formatters, motion helpers. Delete the inline `<style>`, all inline handlers and all inline styles. Exit: a blank but styled shell at all widths, strict CSP works, dark mode passes contrast, no console errors.

**Phase 3, Explore.** Hero, search sheet, filters, sort, asymmetric grid, cards, skeletons, empty and error states, show more. Exit: search, filters and sorting work against the API; deep links to a stay still work once Phase 4 lands.

**Phase 4, Stay detail.** Gallery and lightbox, header, amenities, rules, calendar with month navigation and keyboard, reviews with distribution and write dialog, sticky rail with quote, similar stays, skeleton and 404. Exit: direct link, calendar and reviews verified.

**Phase 5, Booking.** Sheet, three steps, quote debounce, validation, conflict and minimum-stay states, dirty-close confirm, success panel, double-submit guard. Exit: total parity test passes, conflict path verified, keyboard and focus verified.

**Phase 6, Trips, Saved, Hosts, Contact, footer.** All views and states, thread drawer, cancellation dialog, favorites cache, host routes, appearance control. Exit: every route renders with real data and has an empty state.

**Phase 7, hardening.** Strict CSP, security headers, rate limit, response compression, cache headers, exception mapping, XSS audit, offline check, reduced motion, 320px pass, Lighthouse. Exit: matrix rows 1 to 6 and 21 to 25 pass.

**Phase 8, documentation and QA.** Update README, `read.md`, OpenAPI, seed IDs, image credits, demo script, viva questions, CI. Run the full matrix and collect evidence. Exit: definition of done complete.

If time runs short, protect this order: Explore, Stay, Booking, Trips. Hosts and Contact can be simpler, but must not be broken or fake.

---

## 13. Definition of done

- [ ] `dotnet build -warnaserror` passes with zero warnings.
- [ ] `dotnet test` passes all required tests.
- [ ] `dotnet run` starts on 5047 and the app loads with no console errors.
- [ ] Every route in Section 6 works on a cold load and via deep link.
- [ ] Past check-in is rejected, minimum stay is enforced, illegal status transitions return 409.
- [ ] Quote and create return identical totals, including discounts.
- [ ] Availability requires both dates, caps the window and marks past days.
- [ ] All errors use one envelope with `code`, `message` and `traceId`.
- [ ] The catalogue is EUR-only and totals are never summed across currencies.
- [ ] Reviews, ratings and counts are consistent with the data.
- [ ] `GET /v1/hosts` exists and the Hosts view uses it.
- [ ] Static assets are not rate limited; 429 includes `Retry-After`.
- [ ] The app CSP has no `unsafe-inline`; Swagger has its own policy.
- [ ] No `onclick`, `onsubmit`, `style=` or server string in `innerHTML`.
- [ ] No external runtime requests; fonts, images and icons are local.
- [ ] No emoji, no confetti, no 3D hover, no gradient buttons, no red brand.
- [ ] All copy follows Section 5.2 and the copy deck.
- [ ] All five views plus detail, host detail and 404 have loading, empty and error states.
- [ ] Keyboard-only pass, focus visible, dialogs trap focus, Escape works.
- [ ] Reduced motion, 320px, 200% zoom and dark mode pass.
- [ ] Lighthouse desktop >= 95 performance, 100 accessibility, 100 best practices, 100 SEO.
- [ ] axe reports zero critical and serious issues.
- [ ] `README.md` and `read.md` match the code, with a complete code map and endpoint matrix.
- [ ] `docs/openapi.yaml` matches the runtime and the verification script passes.
- [ ] `bin/` and `obj/` are no longer tracked and `.gitignore` exists.
- [ ] Evidence collected: build output, test summary, Lighthouse, axe, screenshots.

---

## 14. Out of scope

Do not add: authentication, roles, JWT, OAuth, real payments, a database, EF Core, migrations, email, SMS, file uploads, an admin panel, a map, i18n, a PWA service worker, server-side rendering, Docker, Kubernetes, or a React rewrite.

Do not redesign the brand name. Do not remove the course artefacts. Do not delete the PHP page. Do not change the ports. Do not rename `MockDataStore` or the existing routes.

Optional only if everything else is done: an interactive map, a comparison view, a support message endpoint, a CI badge.

---

## 15. Final response format

Reply with:

1. The design read sentence.
2. A short summary of what changed, grouped by Design, API, Front end, Security, Tests, Docs.
3. A file-by-file change list with one line per file.
4. The commands you ran and the result tails.
5. Test and Lighthouse numbers.
6. Screenshot and recording paths.
7. Known gaps that remain, with the reason.
8. A five-step demo script for the professor.

No emojis. No exclamation marks. No claims you did not verify. If something failed, say so and include the error.

---

## 16. Fallbacks and decisions

- **No network for fonts or photos.** Download is preferred. If it fails, use the system font stack and a local placeholder system based on `--surface-2` with the place name in mono, and record the fallback in `docs/IMAGE_CREDITS.md`. Do not add Google Fonts or Unsplash back.
- **No network for Phosphor.** Use a checked-in sprite of the 12 most needed glyphs, record the source, and keep stroke weight consistent. Do not draw new icons.
- **Test packages cannot restore.** Keep the test project and the tests, document the restore failure with the exact error, and verify by hand. Do not delete the tests.
- **Swagger styling conflicts with the strict CSP.** Keep the separate Swagger policy. Never weaken the app policy for `/`.
- **A library seems necessary.** Prefer 30 lines of native code. If you still add one, it must be local, licensed, documented and loaded without a build step. No CDN.
- **The brief conflicts with the code.** The brief wins for behaviour and design. Preserve route names and the stable IDs.
- **A requirement is ambiguous.** Choose the interpretation that is simplest to explain to a professor, implement it, and write the decision in the README under "Decisions".

Record every decision that a reviewer might question in a short "Decisions" section at the end of the README, with one sentence and the reason.
