# FatiHomes UI/UX v2: delivered work and verification

Scope: codebase review and website improvement only. The detailed prompt was saved and executed in this repository. Existing short-README work was preserved. No remote publication was performed.

[Code review](UI_UX_REVIEW.md) · [Detailed implementation prompt](UPGRADE_PROMPT_V2.md) · [Short code guide](../README.md)

## What changed

- A tighter editorial hero, larger wordmark, collection heading, consistent image rows and a more readable card rhythm. Prices sit with the card facts rather than at the end of large blank stretched rows.
- Nine photographic destination shortcuts with actual catalogue-derived starting rates, selected state and horizontal navigation controls. Their local thumbnails total 19,928 bytes.
- A native advanced-filter sheet with a nightly budget, bedrooms, pets, amenities, guest rating, instant booking and Superhost controls. Draft edits can be cancelled; invalid ranges stay open with an error; corrected fields clear their error. Active chips remove only their corresponding constraints.
- Eight stays initially, then eight more, then the remaining two. The visible-count label updates and repeated pages do not duplicate stays.
- Matching search results and appended pages restore on Back for 30 seconds. A booking/cancellation invalidates that cache. Failed refreshes preserve successful results and show a working retry.
- Search dates and guest count carry through Stay and booking. Mobile Reserve and the displayed price now follow loading, invalid and unavailable quote states together.
- Correct gallery indices, labelled mobile gallery arrows, a Save action on detail, serialized favorite writes and synchronized visible hearts.
- Route revisions prevent older asynchronous views from replacing newer navigation metadata. Calendar work, gallery observers, search controllers, quote work and reveal observers have cleanup paths.
- Native shared-image continuity, result feedback, save acknowledgement, animated sheet exits, gallery feedback and booking-step motion. Reduced motion disables movement and closes sheets immediately.
- The README remains a short code-link guide and now includes the new modules. The earlier full reference stays archived in `TECHNICAL_REFERENCE.md`.

## Requirement-by-requirement evidence

| Requirement | Result | Authoritative evidence |
| --- | --- | --- |
| Review source rather than external workflows | Complete | `UI_UX_REVIEW.md`, with source symbols and concrete defects |
| Write a detailed plan and prompt for self-execution | Complete | `UPGRADE_PROMPT_V2.md`, phases, constraints and exit checks |
| Material UI improvement | Implemented and visually inspected | Before/after captures linked below, revised hero/cards/navigation/filter sheet |
| Useful discovery controls | Pass | Destination and real advanced-request journeys in `ux-journeys.json` |
| Working pagination and Back | Pass | 8 → 16 → 18 unique stays and restoration of appended results |
| Correct gallery and Saved behavior | Pass | All three desktop tiles, keyboard arrows, mobile arrows, double Save and server reconciliation |
| Reliable route/quote behavior | Pass | Delayed Stay versus Saved race, date/guest carry-through and partial mobile calendar selection |
| Actual animation | Pass | Native animation timing assertions, immediate reduced-motion exit and real WebM recording |
| Booking and existing views preserved | Pass | 60-state regression and full seven-night booking, discount, double-confirmation, messaging, cancellation and literal XSS review journeys |
| Mobile, tablet, themes and keyboard | Pass in tested matrix | 320/375/768/1024/1440 widths, both themes; separate keyboard, dirty-close, zoom-equivalent and 4x CPU checks |
| Build and API tests | Pass | `build.txt`: 0 warnings/errors; `tests.txt` / `tests.trx`: 73 passed |
| OpenAPI | Pass | 21 paths and 27 operations match; public routes/contracts preserved |
| Accessibility and browser runtime | Pass in tested states | Zero axe violations, horizontal overflows or page exceptions in the 60-state regression and 24 new UX audit states |
| Performance | Pass against the ≥95 target | Lighthouse desktop: 99 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 0.8s, CLS 0.022 |
| Concise documentation | Complete | README file and line links validated against the current working tree |

## Reports and media

- [New UX journeys](../output/upgrade-v2/ux-journeys.json): 16 passed, zero violations or page exceptions.
- [Full view and booking regression](../output/upgrade-v2/regression/browser-audit.json): 60 captures, zero axe violations, zero overflow, zero page exceptions, zero external requests.
- [Additional interaction checks](../output/upgrade-v2/interactions/interaction-check.json): six passed, including keyboard, dirty-close confirmation, zoom-equivalent layout, CPU throttle and Swagger execution.
- [Lighthouse HTML](../output/upgrade-v2/lighthouse-desktop.report.html) and [JSON](../output/upgrade-v2/lighthouse-desktop.report.json).
- [Build output](../output/upgrade-v2/build.txt), [test output](../output/upgrade-v2/tests.txt), [TRX](../output/upgrade-v2/tests.trx).
- [Real native-motion and booking recording](../output/upgrade-v2/native-motion-and-booking.webm), 9.84 seconds, 1440×900 at 25fps. [Recording steps](../output/upgrade-v2/recording.json).
- [All v2 evidence](../output/upgrade-v2/). Earlier evidence under `output/playwright/` was preserved.

| View | Desktop | Mobile |
| --- | --- | --- |
| Explore | [Light](../output/upgrade-v2/explore-light-1440.png), [dark](../output/upgrade-v2/explore-dark-1440.png) | [Light](../output/upgrade-v2/explore-light-375.png), [dark](../output/upgrade-v2/explore-dark-375.png) |
| Filters | [Light](../output/upgrade-v2/filters-light-1440.png), [dark](../output/upgrade-v2/filters-dark-1440.png) | [Light](../output/upgrade-v2/filters-light-375.png), [dark](../output/upgrade-v2/filters-dark-375.png) |
| Stay | [Light](../output/upgrade-v2/regression/stay-light-1440.png), [dark](../output/upgrade-v2/regression/stay-dark-1440.png) | [Light](../output/upgrade-v2/regression/stay-light-375.png), [dark](../output/upgrade-v2/regression/stay-dark-375.png) |
| Booking | [Dates](../output/upgrade-v2/regression/booking-light-1440.png), [weekly confirmation](../output/upgrade-v2/regression/booking-confirmed-weekly.png) | [Mobile](../output/upgrade-v2/regression/booking-light-375.png) |

The full-page baseline includes below-fold lazy images that had not been scrolled into view. It is retained to inspect layout, not to claim missing assets. Main comparisons use viewport captures and actual journeys.

## Repeat the checks

The application itself still needs only the .NET 10 SDK:

```powershell
dotnet build -warnaserror
dotnet test
dotnet run --launch-profile dev
.\scripts\verify-openapi.ps1
```

Browser verification uses optional Playwright and axe tools, as documented in [the initial verification setup](VERIFICATION.md). Start the QA Chrome instance on port 9222 and use the raised API limits only for the large automated batch. The scripts reset demo data before and after mutation journeys.

```powershell
# Set these to your QA package installation, not runtime application dependencies.
$env:FH_PLAYWRIGHT_MODULE = 'file:///C:/path/to/node_modules/playwright/index.mjs'
$env:FH_AXE_SOURCE = 'C:/path/to/node_modules/axe-core/axe.min.js'

node scripts/upgrade-v2-check.mjs
$env:FH_OUTPUT_DIR = 'output/upgrade-v2/regression'
node scripts/browser-audit.mjs
$env:FH_OUTPUT_DIR = 'output/upgrade-v2/interactions'
node scripts/interaction-check.mjs

npx --yes --package lighthouse lighthouse http://localhost:5047/ --preset=desktop `
  --chrome-flags='--headless=new' --output=json --output=html `
  --output-path=./output/upgrade-v2/lighthouse-desktop --quiet
```

Optional real recording: install Playwright's `ffmpeg` helper into a valid local `PLAYWRIGHT_BROWSERS_PATH`, then run `node scripts/record-upgrade-v2.mjs`. The helper and QA packages are not website dependencies. Optional thumbnail maintenance is `python scripts/prepare-destinations.py`; generated thumbnails are checked in with the source changes.

## Findings resolved during verification

- Reopening a lightbox exposed a close-wrapper chain: animated close captured its previous wrapper. It now calls the native prototype method and releases animation/cancel listeners on close. The repeated-open journey passes.
- The zoom-equivalent 720×450 check exposed the hero image's intrinsic width. Tablet columns now use `minmax(0, 1fr)` and the frame has no forced aspect width. The check passes with no horizontal overflow.
- The recording helper's default cache path failed with `ENOENT`. A valid explicit local cache path allowed the official FFmpeg helper to install; the real recording succeeded.
- The Creative Studio test wrapper ran all 73 tests successfully but rejected its own snapshot attestation with “Project inputs changed during verification.” Direct final build/test logs and TRX are retained as the test evidence; no wrapper attestation is claimed.

## Scope and limitations

- This remains an in-memory, unauthenticated course demo with simulated payment and illustrative licensed stock photography.
- The 30-second Explore cache can show an externally modified listing until refresh/expiry. Booking availability and totals are always rechecked by the server. The cache is invalidated after local booking changes.
- The gallery shows alternate crops of the credited photos, now labelled accurately; no additional property photographs were invented.
- Desktop Lighthouse is one measured run. The responsive browser/axe matrix and keyboard checks provide bounded evidence, not a claim of exhaustive testing on every device or assistive technology.
- No deployment, remote publication or workflow-management work was performed.
