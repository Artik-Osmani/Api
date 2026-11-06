# Codebase review and UI/UX direction

Scope: source code and the running website only. No Jira, Classroom, team grading or external workflow audit. Reviewed against working tree based on `2f0b4f8`, 2026-11-03.

## What is already sound

- Controllers delegate pricing, search, reservations and hosts to services.
- Quote and create share the same decimal calculator; reservation mutation and overlap checks share a lock.
- The client builds DOM nodes with textContent, keeps assets local and supports a strict CSP.
- Views, shared components and CSS layers are already split into explainable files.
- Existing unit/integration tests and browser scripts provide a useful regression baseline. Old results must not be presented as verification of new changes.

## Findings that drive this upgrade

| Priority | Source / symbol | Finding | Planned resolution |
| --- | --- | --- | --- |
| High | `views/stay.js` / `imageFrame` | Every desktop photo trigger receives `data-photo=0`, so the second and third images open the first photo. | Assign the actual photo index; test each trigger and keyboard controls. |
| High | `router.js` / `render` | Awaited view handlers can finish out of order and overwrite route metadata, navigation and focus after a newer navigation. | Guard commits with a navigation revision, skip obsolete transitions and clean up abandoned views. |
| High | `cards.js` / `heartButton` | Repeated presses launch overlapping toggles and can leave the rendered heart out of sync with server state. | Serialize per-listing favorite writes, retain optimistic feedback and reconcile all visible hearts. |
| High | `views/stay.js` / `buildStay` | Detail always defaults to its own dates and two guests, discarding the user's search choices. | Carry valid search dates and guest count through detail and booking. |
| High | `views/stay.js` / `requestQuote`, `renderRailQuote` | Invalid or loading quotes disable the desktop Reserve control but can leave the mobile action and old total active. | Synchronize both actions, invalidate pending quote responses and show explicit mobile date feedback. |
| Medium | `views/explore.js` / `runSearch` | `lastSearch` is read for cached rendering but never stored; revisiting Explore always rebuilds loading content. | Store a successful response with its filter signature, restore matching results immediately and refresh safely. |
| Medium | `views/stay.js` / `buildAvailability`, `wireGallery`, `requestQuote` | Calendar destruction, gallery observers and pending rail quotes are not released by routing. | Return and call explicit view cleanup functions. |
| Medium | `views/explore.js` / `buildPayload` | The API supports price, amenities, rooms, pets, rating and instant booking, but the UI exposes only category, dates and guests. | Add a native filter sheet with validated values, visible active chips and reset/apply behavior. |
| Medium | `views/explore.js` / `PAGE_SIZE` | All 18 stays load into a very long gallery; Show more has no effect in the seeded demo. | Use a useful page size and verify append pagination against real results. |
| Medium | `pages.css` / `.results-grid`, `components.css` / `.stay-card` | Different image heights combined with a stretching grid create large empty card interiors and a slow scanning rhythm. | Compose consistent image rows with controlled asymmetry and keep title, facts, rating and price together. |
| Medium | `router.js` / view transition callback | Network work is awaited inside a visual transition; slow responses can freeze the old snapshot. | Use cached detail data where available, bound transition waiting and retain an immediate loading fallback. |
| Medium | `views/stay.js` / `photoSet` | Alternate crops are labelled as different room views even though the credit file describes crops of the same photograph. | Use accurate image labels and correct photo navigation. |
| Visual | Explore hero, results and footer | The page has a reasonable palette but little regional discovery, weak collection hierarchy and too much repetitive vertical space. | Tighten the hero, add nine destination shortcuts, a collection heading, stronger card metadata and a quieter, more useful footer. |
| Motion | `motion.js`, `dialog.js` | Entrances exist, but dialogs disappear abruptly, save feedback is minimal and cleanup is inconsistent. | Add a small native motion vocabulary with reduced-motion behavior and cleanup. |

The full-page baseline capture includes unloaded below-fold lazy images; those blank image frames are a capture limitation, not proof that their assets are missing. Verification must scroll content before taking after captures.

## Design direction

A regional stays journal with warm paper, forest green, large ink typography and photography. The hero, search and start of the collection should be discoverable in the first desktop viewport. Destination selection and filters should shorten the route to a suitable stay. Motion should explain state changes, acknowledge actions and connect views.

Execution specification: [UPGRADE_PROMPT_V2.md](UPGRADE_PROMPT_V2.md). Evidence and completion status will be recorded after implementation.
