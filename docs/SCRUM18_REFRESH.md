# Scrum-18 visual refresh

The user's preferred reference is `origin/Scrum-18` at `3349589`. This refresh restores that branch's recognizable FatiHomes identity on the current modular client and tested API.

## Delivered

- Restored the original house-and-location-pin SVG from Scrum-18.
- Rose action colours, white/slate surfaces and a complete navy dark theme. The action colour is darker than the decorative logo pink so white button labels remain readable.
- A full-width photographic hero with a shorter headline, local responsive imagery and an overlapping search console. Mobile keeps the same composition with a compact search sheet.
- Pill navigation and category controls, rounded destination shortcuts and a consistent three-column desktop catalogue, two columns on tablet and one on mobile.
- Rounded property cards with aligned photo proportions, clear prices, visible save controls and restrained hover movement. Images and content stay visible independently of reveal timing; reduced motion remains supported.
- Improved selected-calendar-price contrast and corrected the 404 suggestions section's accessible name.
- A concise, source-backed team contribution table in [README](../README.md#team-contributions). It credits implementation, documentation and PR integration separately, linking original commits and current code. The original exercise is linked at its historical revision because it is not part of the current application.

## What was retained

Real API-backed search and advanced filters, independent saved stays, 8/16/18 pagination, gallery controls, server quotes and discounts, calendar validation, cancellation and messaging. The app remains .NET 10 plus static HTML/CSS/JS, with local assets and no frontend build step.

## Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Strict build | 0 warnings, 0 errors | [Build log](../output/scrum18-refresh/build.txt) |
| API tests | 73 passed | [Test log](../output/scrum18-refresh/tests.txt) |
| OpenAPI parity | 21 paths, 27 operations | [OpenAPI check](../output/scrum18-refresh/openapi.txt) |
| Focused discovery/booking UX | 16 journeys passed | [Journey report](../output/scrum18-refresh/discovery/ux-journeys.json) |
| Focused responsive accessibility | 24 states; zero reported violations | Same journey report; 320/375/768/1024/1440 widths, both themes and filter/gallery states |
| Broad browser regression | 60 states; zero reported accessibility violations, overflows, page errors or external requests | [Browser report](../output/scrum18-refresh/regression/browser-audit.json) |
| Supplementary interactions | 6 checks passed: empty Saved, keyboard containment/Escape, dirty-booking close, zoom-equivalent layout, CPU-throttled search and Swagger | [Interaction report](../output/scrum18-refresh/interactions/interaction-check.json) |

The broad regression includes a complete seven-night booking: a single reservation after double-clicking confirmation, a €66.50 discount and €646.75 total. It also checks messaging, cancellation, literal rendering of an XSS review payload and a cold reload with external networking blocked.

High-volume browser suites use process-only rate-limit overrides so repeated cold loads do not exhaust the demo's normal API budget. Production/default configuration was not changed. Suites reset the in-memory demo store. Optional Playwright/axe packages are QA tools, not runtime dependencies.

The Creative Studio wrapper also ran 73 tests successfully, but rejected its own snapshot attestation with “Project inputs changed during verification.” The direct build and test logs above are the evidence; no wrapper attestation is claimed.

## Screenshots

- [Desktop, light](../output/scrum18-refresh/regression/explore-light-1440.png) · [Desktop, dark](../output/scrum18-refresh/regression/explore-dark-1440.png)
- [Mobile, light](../output/scrum18-refresh/regression/explore-light-375.png) · [Mobile, dark](../output/scrum18-refresh/regression/explore-dark-375.png)
- [Catalogue cards](../output/scrum18-refresh/cards-desktop.png)
- [Stay detail](../output/scrum18-refresh/regression/stay-light-1440.png) · [Mobile booking](../output/scrum18-refresh/regression/booking-light-375.png)

These are bounded browser and automated accessibility checks, not an exhaustive device/assistive-technology certification. The app remains an unauthenticated in-memory course demo with simulated payments and clearly labelled illustrative photography. Earlier editorial-theme reports remain archived and describe their own revisions.
