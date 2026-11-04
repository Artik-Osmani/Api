# FatiHomes UI/UX v2: implementation prompt

This is the detailed prompt prepared by the coding agent for its own execution. Continue in the existing repository and active goal. Implement, verify and document the work; do not stop after writing this prompt.

## Objective

Make FatiHomes visibly more polished and easier to use, with stronger composition, useful discovery tools and native animation. Review the codebase only. Do not review or modify Jira, Classroom, assignments, team contributions, external tickets or PR workflows.

Use [UI_UX_REVIEW.md](UI_UX_REVIEW.md) as the source-backed starting point. Existing green test reports are a baseline, not proof for this revision.

## Preserve

- .NET 10 controllers, Swashbuckle, the in-memory MockDataStore and existing public API fields/routes.
- Static HTML, CSS and ES modules, served with `dotnet run`. No React, bundler, GSAP, animation dependency or runtime CDN.
- Local fonts, images and icons. Strict application CSP; no inline HTML event handlers, style attributes, unsafe innerHTML or untrusted URLs.
- The regional FatiHomes identity, existing light/dark themes, stable seed IDs, simulated payments and course scope.
- The shortened README and its code-link purpose. Preserve existing local documentation edits.
- Keyboard navigation, native dialog semantics, readable errors, reduced motion, mobile layouts and honest content.

## Creative direction

Visual thesis: a regional stays journal, warm paper and forest surfaces, confident ink typography, tightly framed imagery, generous but purposeful space.

Content hierarchy: brand/navigation; compact asymmetric hero; search; regional destination shortcuts; collection title and count; filters/sort; a readable card collection; show more; footer. Stay detail should present the gallery, place/host facts, availability and booking without competing panels.

Interaction thesis: selecting a place is immediate, search state is visible, a selected card carries into detail, saving gives clear feedback, sheets arrive and leave deliberately, and changing dates never hides pricing errors.

Avoid generic dashboards, gradient buttons, looping decoration, excessive pills, huge blank rows, 3D tilt, cursor effects, scroll hijacking, external assets and fake travel claims. Keep motion brief, normally 160–360ms, with an immediate reduced-motion path.

## Phase 1: correctness and interaction foundation

1. Guard asynchronous route completion so stale requests cannot change a newer route's title, active nav or focus.
2. Add a view cleanup contract. Release calendar work, gallery observers and quote timers when leaving detail. Avoid obsolete shared-transition names.
3. Use complete cached listing data for immediate detail rendering where possible; fetch by ID on cold links. Bound transition waiting rather than holding a frozen snapshot through a slow network request.
4. Fix gallery photo indices and use accurate crop labels. Keep desktop clicks, keyboard arrows and mobile navigation consistent.
5. Serialize favorite writes per listing. Keep all visible instances consistent, announce outcomes and restore the optimistic state on failure.
6. Store successful Explore responses with the filters that produced them; never display a response for different filters as if it were current.

Exit: reproducible browser checks demonstrate correct gallery selection, rapid navigation and favorite behavior.

## Phase 2: Explore composition and discovery

1. Recompose the hero to reduce unused space while preserving the clear headline, lead, browse action and a strong photograph composition. Keep a meaningful first desktop viewport.
2. Add a compact horizontal destination navigator for the nine seeded places, with local thumbnails and real catalogue-derived counts or rates. Each shortcut must update the real query, active state and results, not only scroll the page.
3. Add a collection heading and clear live result count. Place search, destination, filter and sort controls in a coherent hierarchy.
4. Improve card composition: consistent image heights within rows, intentional column spans, compact facts, readable prices and a clear Save control. Avoid empty stretching card interiors.
5. Reduce initial page size so Show more works with 18 seeds. Append without duplicate records and retain existing results while loading.
6. Add a real native filter sheet: minimum/maximum nightly price, amenities, minimum bedrooms, minimum rating, pets and instant-book preference. Validate before applying. Support draft editing, cancel, clear and apply; expose active chips and a count.
7. Send every control to its actual API request field. Clear all must reset controls and request state together. Preserve search dates, guest count and sort when applying unrelated filters.
8. Preserve successful content during refresh, set aria-busy and show a small loading indication. Give failures an honest retry state.

Exit: destination, category, advanced filters, reset, sort and pagination all work against the running API at desktop and mobile widths.

## Phase 3: detail and shared product polish

1. Refine detail hierarchy, host facts, gallery controls and booking rail while keeping the server quote authoritative.
2. Add visible, labelled mobile gallery navigation and correct image counts; keyboard arrows must work.
3. Improve reusable controls, focus rings, touch targets, loading and disabled states. Let headings receive route focus without turning the entire heading into a decorative outlined box on every pointer navigation.
4. Add clear nav feedback, consistent section spacing and a refined footer; keep Trips, Saved, Hosts and Contact usable with the shared style changes.
5. Keep booking dates, minimum-stay errors, conflicts, guest validation, dirty-close confirmation, double-submit protection, success and trip updates intact.

Exit: cold Stay links, gallery, review, quote and booking journeys pass in both themes and on mobile.

## Phase 4: native motion

1. Hero: one coordinated image/text entrance that preserves final geometry and runs once per session.
2. Cards/results: purposeful reveal and short result-change motion. Never hide content if observers or animation APIs are unavailable.
3. Navigation: shared image continuity when supported, otherwise a fast crossfade. Rapid navigation must remain responsive.
4. Save: one small acknowledgement tied to the completed action; no particles or endless pulse.
5. Dialogs: coordinated sheet/backdrop entrance and exit, while preserving focus trapping, Escape, dirty-close logic and return focus.
6. Calendar/gallery: short directional changes with no animation of layout dimensions.
7. Under prefers-reduced-motion, remove movement, delayed reveals and shared transitions. Changes remain immediate and fully functional.

Exit: inspect actual animations and reduced-motion behavior in a real browser; screenshots alone do not prove motion.

## Phase 5: verification and documentation

- Run `dotnet build -warnaserror`, `dotnet test` and `scripts/verify-openapi.ps1` when the relevant app is running. Preserve existing API behavior.
- Add focused repeatable browser journeys for new filters, destination controls, pagination, correct gallery photo, rapid route changes, favorite serialization and cleanup.
- Verify Explore, Stay, Booking, Trips, Saved, Hosts and Contact at desktop and mobile widths, light and dark. Include 320px and keyboard usage. Require no horizontal overflow or unexpected page exceptions.
- Run axe for relevant changed states and collect Lighthouse desktop results. Investigate regressions rather than changing or hiding audit criteria.
- Capture before/after views and a short motion/booking artifact when supported. Scroll lazy content before full-page screenshots.
- Keep evidence under `output/upgrade-v2/`, preserving earlier evidence.
- Keep README concise; refresh line links after edits. Add links to the new filters/destinations and the new review, prompt and verification files.
- Write a final requirement-by-requirement results report with actual commands, numbers, screenshot paths, verified journeys and any limits.

## Completion rule

Do not mark the goal complete after the plan, after a CSS-only reskin or after one passing screenshot. Completion requires a saved review and prompt, implemented visible improvements, functioning new UX, actual motion, preserved booking/API behavior, fresh checks and accurate documentation. Report uncertainties as uncertainties.
