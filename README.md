# FatiHomes

A small, finished stays catalogue for Kosovo, Albania and the coast, with a booking API served from the same .NET process. The web client is static HTML, CSS and JavaScript with no build step. The data layer is an in-memory singleton seeded on start.

**Status:** working end to end. `dotnet build -warnaserror` reports 0 warnings, `dotnet test` passes 73 tests, the final browser audit reports zero axe violations across 60 captures, and the app runs with `dotnet run` alone. Lighthouse desktop scores 100 in all four requested categories. See [verification evidence](docs/VERIFICATION.md).

- **Stack:** .NET 10, ASP.NET Core controllers, Swashbuckle 10.2.3, native CSS, ES modules
- **Catalogue:** 18 stays in 9 places, 4 hosts, 4 reservations, 15 reviews, 5 messages, 2 favorites
- **Data:** `MockDataStore`, a locked in-memory database seeded by `SeedData`; reset with `POST /v1/system/reset`
- **Design:** editorial Adriatic modernism, self-hosted Schibsted Grotesk and Geist, local WebP photography, no external runtime requests
- **Course artefacts:** [read.md](read.md) (Albanian), [docs/openapi.yaml](docs/openapi.yaml), [php/index.php](php/index.php), [docs/course/UshtrimiAdili.md](docs/course/UshtrimiAdili.md)
- **Brief:** [UPGRADE_PROMPT.md](UPGRADE_PROMPT.md) is the specification this iteration implements

Line numbers verified at commit b95d3d0 on 2026-11-03; search for the symbol if they drift. They will drift. Every row includes a searchable symbol, so use `Ctrl+F` on the symbol when a line is stale.

---

## Quick start

Prerequisite: the .NET 10 SDK. Check with `dotnet --list-sdks`; the project targets `net10.0`.

```powershell
dotnet run
```

`dotnet run` reads [Properties/launchSettings.json](Properties/launchSettings.json#L4) and uses the first profile, `dev`, so the app listens on **http://localhost:5047**. The `prod` profile uses port 5000.

| URL | What it is |
| :--- | :--- |
| <http://localhost:5047/> | Explore, the stays catalogue |
| <http://localhost:5047/#/stay/e14c1d68-0fa4-44bc-b17b-4b248a31e8fd> | A stay detail page, deep link |
| <http://localhost:5047/#/trips> | Your trips |
| <http://localhost:5047/#/saved> | Saved stays |
| <http://localhost:5047/#/hosts> | Host directory |
| <http://localhost:5047/#/contact> | Contact |
| <http://localhost:5047/swagger> | Swagger UI with try-it-out |
| <http://localhost:5047/swagger/v1/swagger.json> | Generated OpenAPI document |
| <http://localhost:5047/v1/system/health> | Health check with a store probe |
| <http://localhost:5047/v1/system/stats> | Counters, version, uptime, paid totals |

Other ways to start it:

```powershell
.\run-dev.ps1      # dotnet run --launch-profile dev  -> http://localhost:5047
.\run-prod.ps1     # dotnet run --launch-profile prod -> http://localhost:5000
dotnet test        # 73 unit and integration tests
```

All data resets when the process restarts. In Development, `POST /v1/system/reset` restores the seed without restarting.

### Smoke test

```powershell
$base = 'http://localhost:5047'
Invoke-RestMethod "$base/v1/system/health"
$search = Invoke-RestMethod "$base/v1/listings/search" -Method Post `
  -ContentType 'application/json' -Body '{"guestsCount":2,"pageSize":5}'
$search.totalRecords
$id = $search.results[0].id
Invoke-RestMethod "$base/v1/listings/$id"
Invoke-RestMethod "$base/v1/listings/$id/availability?start_date=2027-03-01&end_date=2027-03-07"
Invoke-RestMethod "$base/v1/reservations/quote" -Method Post -ContentType 'application/json' `
  -Body '{"listingId":"e14c1d68-0fa4-44bc-b17b-4b248a31e8fd","checkInDate":"2027-03-01","checkOutDate":"2027-03-07","guestsCount":2}'
```

[StayHubApi.http](StayHubApi.http) contains ready requests for health, search, quote, create, conflict, cancel, reviews, favorites, hosts and reset.

---

## Project structure

```text
Api/
â”œâ”€â”€ Controllers/                       HTTP surface, one controller per resource
â”‚   â”œâ”€â”€ ListingsController.cs          9 actions: search, CRUD, availability, reviews
â”‚   â”œâ”€â”€ ReservationsController.cs      8 actions: quote, create, status, cancel, messages
â”‚   â”œâ”€â”€ HostsController.cs             4 actions: directory, profile, listings, verification
â”‚   â”œâ”€â”€ FavoritesController.cs         2 actions: list and atomic toggle
â”‚   â””â”€â”€ SystemController.cs            4 actions: health, stats, stage, reset
â”œâ”€â”€ Middleware/
â”‚   â”œâ”€â”€ ExceptionHandlingMiddleware.cs ApiException mapping, 400/415/500 fallbacks
â”‚   â”œâ”€â”€ SecurityHeadersMiddleware.cs   CSP per path, COOP/CORP, HSTS, permissions
â”‚   â”œâ”€â”€ RateLimitMiddleware.cs         per-IP API, write and review windows
â”‚   â””â”€â”€ UnifiedErrorResultFilter.cs    rewrites MVC ProblemDetails into ApiError
â”œâ”€â”€ Models/
â”‚   â”œâ”€â”€ ApiError.cs                    the single error envelope and stable codes
â”‚   â””â”€â”€ RentalModels.cs                domain records and every request/response DTO
â”œâ”€â”€ Services/
â”‚   â”œâ”€â”€ MockDataStore.cs               locked in-memory database, Reset()
â”‚   â”œâ”€â”€ SeedData.cs                    18 listings, 4 hosts, 4 reservations, reviews
â”‚   â”œâ”€â”€ PricingCalculator.cs           the only place money is calculated
â”‚   â”œâ”€â”€ ReservationRules.cs            overlap, state machine, cancellation rules
â”‚   â”œâ”€â”€ CatalogService.cs              listing CRUD, availability, reviews
â”‚   â”œâ”€â”€ ListingSearchService.cs        filters, geo, sorting, pagination
â”‚   â”œâ”€â”€ ReservationService.cs          quote, create, status, cancel, messages
â”‚   â”œâ”€â”€ HostService.cs                 weighted host aggregates, verification
â”‚   â”œâ”€â”€ FavoriteService.cs             atomic favorite toggle
â”‚   â”œâ”€â”€ ApiException.cs                mapped, intentional failures
â”‚   â”œâ”€â”€ CatalogRules.cs                category, coordinate, pricing validation
â”‚   â”œâ”€â”€ ValidationFormatter.cs         camelCase model-state field map
â”‚   â”œâ”€â”€ RateLimitOptions.cs            bound RateLimiting configuration
â”‚   â””â”€â”€ AppInfo.cs                     assembly informational version
â”œâ”€â”€ Properties/launchSettings.json     dev = 5047, prod = 5000
â”œâ”€â”€ wwwroot/
â”‚   â”œâ”€â”€ index.html                     shell, navigation, six <template> elements
â”‚   â”œâ”€â”€ css/
â”‚   â”‚   â”œâ”€â”€ tokens.css                 colour, type, space, motion tokens, @font-face
â”‚   â”‚   â”œâ”€â”€ base.css                   reset, elements, focus, skip link
â”‚   â”‚   â”œâ”€â”€ layout.css                 shell, header, tab bar, footer, grids
â”‚   â”‚   â”œâ”€â”€ components.css             buttons, fields, cards, dialogs, calendar
â”‚   â”‚   â”œâ”€â”€ pages.css                  Explore, stay, booking, trips, hosts, contact
â”‚   â”‚   â””â”€â”€ motion.css                 hero reveal, reveals, reduced-motion overrides
â”‚   â”œâ”€â”€ js/
â”‚   â”‚   â”œâ”€â”€ main.js                    boot, appearance, routes, global error boundary
â”‚   â”‚   â”œâ”€â”€ router.js                  hash routes, aliases, focus, title, transitions
â”‚   â”‚   â”œâ”€â”€ api.js                     fetch wrapper, 10s timeout, ApiError
â”‚   â”‚   â”œâ”€â”€ store.js                   shared state, listing cache, favorites
â”‚   â”‚   â”œâ”€â”€ cards.js                   the stay card and heart button
â”‚   â”‚   â”œâ”€â”€ calendar.js                month grid, keyboard, availability cache
â”‚   â”‚   â”œâ”€â”€ booking.js                 three-step sheet, validation, submit
â”‚   â”‚   â”œâ”€â”€ quote.js                   debounced quote controller, price table
â”‚   â”‚   â”œâ”€â”€ chat.js                    thread drawer and polling
â”‚   â”‚   â”œâ”€â”€ dialog.js                  <dialog> helpers, scroll lock, confirm
â”‚   â”‚   â”œâ”€â”€ dom.js                     el(), text-only nodes, image helpers
â”‚   â”‚   â”œâ”€â”€ format.js                  EUR, dates, nights, booking reference
â”‚   â”‚   â”œâ”€â”€ icons.js                   amenity labels, groups, category names
â”‚   â”‚   â”œâ”€â”€ motion.js                  reveal, view transitions, reduced motion
â”‚   â”‚   â”œâ”€â”€ ui.js                      toasts, live region, error and empty panels
â”‚   â”‚   â””â”€â”€ views/                     explore, stay, trips, saved, hosts, host,
â”‚   â”‚                                  contact, notfound
â”‚   â”œâ”€â”€ fonts/                         6 self-hosted WOFF2 files, Latin subset
â”‚   â”œâ”€â”€ images/
â”‚   â”‚   â”œâ”€â”€ stays/                     92 WebP files: 5 per listing plus the hero
â”‚   â”‚   â”œâ”€â”€ icons.svg                  45 Phosphor symbols
â”‚   â”‚   â”œâ”€â”€ logo.svg                   FH monogram
â”‚   â”‚   â”œâ”€â”€ logo-mark-512.png          manifest icon
â”‚   â”‚   â””â”€â”€ og.webp                    1200x630 social preview
â”‚   â”œâ”€â”€ favicon.ico / apple-touch-icon.png
â”‚   â”œâ”€â”€ manifest.webmanifest           name, icons, theme colours
â”‚   â”œâ”€â”€ robots.txt                     disallows /v1/
â”‚   â””â”€â”€ swagger-custom.css             restrained Swagger theme
â”œâ”€â”€ tests/StayHubApi.Tests/            73 xUnit tests, WebApplicationFactory
â”œâ”€â”€ scripts/
â”‚   â”œâ”€â”€ verify-openapi.ps1             runtime vs docs/openapi.yaml
â”‚   â”œâ”€â”€ generate-openapi.py            exports the runtime document to YAML
â”‚   â”œâ”€â”€ ui-check.mjs                   CDP screenshot and console checker
â”‚   â””â”€â”€ booking-flow-check.mjs         drives the booking flow in Chrome
â”œâ”€â”€ docs/
â”‚   â”œâ”€â”€ openapi.yaml                   generated, 21 paths, 27 operations, 38 schemas
â”‚   â”œâ”€â”€ SEED_IDS.md                    every deterministic GUID
â”‚   â”œâ”€â”€ IMAGE_CREDITS.md               photo, icon and brand licences
â”‚   â”œâ”€â”€ FONT_LICENSES.md               font sources and OFL
â”‚   â”œâ”€â”€ screenshots/                   evidence at 1440, 1024, 768, 375, 320
â”‚   â””â”€â”€ course/UshtrimiAdili.md        Jira and GitHub course note
â”œâ”€â”€ appsettings.json                   rate limits, CORS, demo mode, HTTPS
â”œâ”€â”€ appsettings.{Development,Production,Testing}.json
â”œâ”€â”€ Program.cs                         service registration and middleware pipeline
â”œâ”€â”€ StayHubApi.csproj                  net10.0, nullable, XML docs, version 2.0.0
â”œâ”€â”€ StayHubApi.sln                     API plus test project
â”œâ”€â”€ .github/workflows/ci.yml           restore, build with warnings as errors, test
â”œâ”€â”€ .gitignore / .editorconfig / LICENSE
â”œâ”€â”€ php/index.php                      course artefact, not used by the .NET app
â”œâ”€â”€ read.md                            Albanian project description
â””â”€â”€ README.md                          this file
```

`bin/` and `obj/` are ignored and no longer tracked.

---

## Where is the code for ...?

### Backend: pipeline, errors and security

| What you are looking for | Where it is | Search for |
| :--- | :--- | :--- |
| Application entry point | [Program.cs](Program.cs#L12) | `var builder = WebApplication.CreateBuilder` |
| Controller registration and error filter | [Program.cs](Program.cs#L18) | `AddControllers(options` |
| Unified model-binding error body | [Program.cs](Program.cs#L27) | `InvalidModelStateResponseFactory` |
| Swagger document, XML comments, contact | [Program.cs](Program.cs#L44) | `AddSwaggerGen` |
| Service registration | [Program.cs](Program.cs#L75) | `AddSingleton<MockDataStore>` |
| CORS from configuration | [Program.cs](Program.cs#L86) | `Cors:AllowedOrigins` |
| Response compression | [Program.cs](Program.cs#L101) | `AddResponseCompression` |
| Middleware order | [Program.cs](Program.cs#L122) | `UseMiddleware<ExceptionHandlingMiddleware>` |
| Static files and cache headers | [Program.cs](Program.cs#L146) | `UseDefaultFiles` |
| Routing error envelopes | [Program.cs](Program.cs#L168) | `UseStatusCodePages` |
| Rate limiter placement | [Program.cs](Program.cs#L164) | `UseMiddleware<RateLimitMiddleware>` |
| Swagger UI and custom theme | [Program.cs](Program.cs#L185) | `UseSwaggerUI` |
| Endpoint mapping and test entry marker | [Program.cs](Program.cs#L195) | `MapControllers`, `partial class Program` |
| Error envelope | [ApiError.cs](Models/ApiError.cs#L11) | `public sealed record ApiError` |
| Stable error codes | [ApiError.cs](Models/ApiError.cs#L28) | `public const string DateOrder` |
| Deliberate failure type | [ApiException.cs](Services/ApiException.cs#L9) | `public sealed class ApiException` |
| Exception mapping and 500 body | [ExceptionHandlingMiddleware.cs](Middleware/ExceptionHandlingMiddleware.cs#L40) | `catch (ApiException` |
| ProblemDetails rewrite (415) | [UnifiedErrorResultFilter.cs](Middleware/UnifiedErrorResultFilter.cs#L14) | `OnResultExecuting` |
| CSP strings per path | [SecurityHeadersMiddleware.cs](Middleware/SecurityHeadersMiddleware.cs#L11) | `ApplicationPolicy`, `SwaggerPolicy` |
| Rate limit logic and 429 headers | [RateLimitMiddleware.cs](Middleware/RateLimitMiddleware.cs#L30) | `public async Task InvokeAsync` |
| Rate limit values | [appsettings.json](appsettings.json#L13) | `"RateLimiting"` |
| Model-state key formatting | [ValidationFormatter.cs](Services/ValidationFormatter.cs#L11) | `ToFieldErrors` |
| Assembly version | [AppInfo.cs](Services/AppInfo.cs#L11) | `public static string Version` |

Additional verification files: `scripts/browser-audit.mjs`, `scripts/interaction-check.mjs`, `docs/VERIFICATION.md`, `docs/CHANGELOG_FILES.md` and `output/playwright/` (audit reports, 64 screenshots and the booking GIF).

### Backend: pricing, rules and data

| What you are looking for | Where it is | Search for |
| :--- | :--- | :--- |
| The pricing formula | [PricingCalculator.cs](Services/PricingCalculator.cs#L26) | `public ReservationQuote BuildQuote` |
| Discount thresholds and rounding | [PricingCalculator.cs](Services/PricingCalculator.cs#L14) | `MaxNights`, `WeeklyDiscountThreshold` |
| Overlap, state machine, cancellation | [ReservationRules.cs](Services/ReservationRules.cs#L68) | `ValidateTransition` |
| Transition table | [ReservationRules.cs](Services/ReservationRules.cs#L20) | `Transitions =` |
| Booking validation order | [ReservationService.cs](Services/ReservationService.cs#L57) | `ValidateStay` |
| Quote endpoint logic | [ReservationService.cs](Services/ReservationService.cs#L47) | `public ReservationQuote Quote` |
| Atomic create and conflict check | [ReservationService.cs](Services/ReservationService.cs#L70) | `public Reservation Create` |
| Status update | [ReservationService.cs](Services/ReservationService.cs#L131) | `public Reservation UpdateStatus` |
| Message sender derivation | [ReservationService.cs](Services/ReservationService.cs#L224) | `public Message SendMessage` |
| Search filters and sorting | [ListingSearchService.cs](Services/ListingSearchService.cs#L29) | `public ListingSearchResponse Search` |
| Weighted recommended score | [ListingSearchService.cs](Services/ListingSearchService.cs#L188) | `BayesianScore` |
| Haversine and point in polygon | [CatalogRules.cs](Services/CatalogRules.cs#L55) | `HaversineMeters` |
| Availability day calculation | [CatalogService.cs](Services/CatalogService.cs#L198) | `public ListingAvailabilityResponse GetAvailability` |
| Trim JSON before validation | [TrimmedStringConverter.cs](Services/TrimmedStringConverter.cs#L7) | `public sealed class TrimmedStringConverter` |
| Review recomputation | [CatalogService.cs](Services/CatalogService.cs#L289) | `public Review AddReview` |
| Listing create and host lookup | [CatalogService.cs](Services/CatalogService.cs#L29) | `public ListingDetail Create` |
| Delete conflict rule | [CatalogService.cs](Services/CatalogService.cs#L180) | `ListingHasActiveReservations` |
| Host weighted aggregate | [HostService.cs](Services/HostService.cs#L43) | `Aggregate(listings)` |
| Favorite toggle in one lock | [FavoriteService.cs](Services/FavoriteService.cs#L25) | `public FavoriteToggleResponse Toggle` |
| Store lock and Reset | [MockDataStore.cs](Services/MockDataStore.cs#L37) | `public void Reset` |
| Seed catalogue | [SeedData.cs](Services/SeedData.cs#L58) | `public static Snapshot Build` |
| Deterministic IDs | [docs/SEED_IDS.md](docs/SEED_IDS.md) | `e14c1d68` |

### API controllers

| What you are looking for | Where it is | Search for |
| :--- | :--- | :--- |
| Search action | [ListingsController.cs](Controllers/ListingsController.cs#L42) | `Search([FromBody]` |
| Availability action | [ListingsController.cs](Controllers/ListingsController.cs#L118) | `GetAvailability(` |
| Review write action | [ListingsController.cs](Controllers/ListingsController.cs#L154) | `AddReview(` |
| Listing delete action | [ListingsController.cs](Controllers/ListingsController.cs#L98) | `public IActionResult Delete` |
| Quote action | [ReservationsController.cs](Controllers/ReservationsController.cs#L43) | `public ActionResult<ReservationQuote> Quote` |
| Create action | [ReservationsController.cs](Controllers/ReservationsController.cs#L61) | `public ActionResult<Reservation> Create` |
| Cancel action | [ReservationsController.cs](Controllers/ReservationsController.cs#L106) | `public ActionResult<Reservation> Cancel` |
| Message write action | [ReservationsController.cs](Controllers/ReservationsController.cs#L134) | `public ActionResult<Message> SendMessage` |
| Host directory action | [HostsController.cs](Controllers/HostsController.cs#L27) | `public ActionResult<List<HostProfileResponse>> GetAll` |
| Favorite toggle action | [FavoritesController.cs](Controllers/FavoritesController.cs#L37) | `public ActionResult<FavoriteToggleResponse> Toggle` |
| Health check | [SystemController.cs](Controllers/SystemController.cs#L37) | `public ActionResult<HealthResponse> Health` |
| Stats and currency grouping | [SystemController.cs](Controllers/SystemController.cs#L98) | `TotalPaidByCurrency` |
| Stage endpoint moved from Program | [SystemController.cs](Controllers/SystemController.cs#L110) | `public ActionResult<StageResponse> Stage` |
| Reset endpoint | [SystemController.cs](Controllers/SystemController.cs#L133) | `public ActionResult<ResetResponse> Reset` |

### Front end: shell, routing and data

| What you are looking for | Where it is | Search for |
| :--- | :--- | :--- |
| Document head, fonts, social meta | [index.html](wwwroot/index.html#L15) | `og:image` |
| Header, navigation, mobile tab bar | [index.html](wwwroot/index.html#L43) | `<header class="site-header"` |
| Booking sheet template | [index.html](wwwroot/index.html#L184) | `tpl-booking` |
| Review dialog template | [index.html](wwwroot/index.html#L316) | `tpl-review` |
| Photo lightbox template | [index.html](wwwroot/index.html#L378) | `tpl-lightbox` |
| Message drawer template | [index.html](wwwroot/index.html#L396) | `tpl-chat` |
| Module entry | [index.html](wwwroot/index.html#L418) | `<script type="module"` |
| Boot, route table, saved badge | [main.js](wwwroot/js/main.js#L26) | `register("/explore"` |
| Appearance control | [main.js](wwwroot/js/main.js#L19) | `initAppearance` |
| Shared-element transition name | [main.js](wwwroot/js/main.js#L24) | `initSharedTransitions` |
| Hash router, aliases, focus, title | [router.js](wwwroot/js/router.js#L98) | `export async function render` |
| Route aliases | [router.js](wwwroot/js/router.js#L8) | `new Map([` |
| Fetch wrapper and timeout | [api.js](wwwroot/js/api.js#L23) | `export async function request` |
| Endpoint functions | [api.js](wwwroot/js/api.js#L86) | `export const api` |
| Shared state and cache | [store.js](wwwroot/js/store.js#L6) | `const state =` |
| Favorites state | [store.js](wwwroot/js/store.js#L72) | `setFavorites` |
| Safe DOM builder | [dom.js](wwwroot/js/dom.js#L8) | `export function el` |
| Responsive image helper | [dom.js](wwwroot/js/dom.js#L110) | `export function stayImage` |
| Stay card and heart | [cards.js](wwwroot/js/cards.js#L12) | `export function stayCard` |
| Money, dates and booking reference | [format.js](wwwroot/js/format.js#L193) | `bookingCode` |
| Amenity labels and groups | [icons.js](wwwroot/js/icons.js#L20) | `AMENITY_LABELS` |
| Toast and live region | [ui.js](wwwroot/js/ui.js#L6) | `export function toast` |
| Dialog helpers | [dialog.js](wwwroot/js/dialog.js#L9) | `export function openDialog` |
| Reveal and reduced motion | [motion.js](wwwroot/js/motion.js#L7) | `export function reveal` |
| Repeatable browser and axe audit | [browser-audit.mjs](scripts/browser-audit.mjs#L36) | `async function audit` |
| Empty, keyboard, zoom and Swagger checks | [interaction-check.mjs](scripts/interaction-check.mjs#L12) | `async function visit` |
| Quote controller | [quote.js](wwwroot/js/quote.js#L70) | `createQuoteController` |
| Calendar component | [calendar.js](wwwroot/js/calendar.js#L23) | `createCalendar` |
| Booking sheet logic | [booking.js](wwwroot/js/booking.js#L29) | `openBookingSheet` |
| Message drawer | [chat.js](wwwroot/js/chat.js#L11) | `openChat` |
| Explore view | [explore.js](wwwroot/js/views/explore.js#L39) | `renderExplore` |
| Stay view | [stay.js](wwwroot/js/views/stay.js#L26) | `renderStay` |
| Trips view | [trips.js](wwwroot/js/views/trips.js#L28) | `renderTrips` |
| Saved view | [saved.js](wwwroot/js/views/saved.js#L8) | `renderSaved` |
| Hosts view | [hosts.js](wwwroot/js/views/hosts.js#L7) | `renderHosts` |
| Host detail view | [host.js](wwwroot/js/views/host.js#L8) | `renderHost` |
| Contact view | [contact.js](wwwroot/js/views/contact.js#L5) | `renderContact` |
| 404 view | [notfound.js](wwwroot/js/views/notfound.js#L6) | `renderNotFound` |

### Front end: design system

| What you are looking for | Where it is | Search for |
| :--- | :--- | :--- |
| Colour and type tokens | [tokens.css](wwwroot/css/tokens.css#L57) | `--canvas:` |
| Dark theme overrides | [tokens.css](wwwroot/css/tokens.css#L150) | `prefers-color-scheme: dark` |
| Self-hosted fonts | [tokens.css](wwwroot/css/tokens.css#L4) | `@font-face` |
| Reset and focus ring | [base.css](wwwroot/css/base.css#L131) | `:focus-visible` |
| Header, tab bar, footer | [layout.css](wwwroot/css/layout.css#L18) | `.site-header` |
| Explore hero | [pages.css](wwwroot/css/pages.css#L3) | `.explore-hero` |
| Hero image stack | [pages.css](wwwroot/css/pages.css#L43) | `.hero-stack` |
| Search console | [pages.css](wwwroot/css/pages.css#L86) | `.search-console` |
| Asymmetric results grid | [pages.css](wwwroot/css/pages.css#L262) | `.results-grid` |
| Stay gallery and rail | [pages.css](wwwroot/css/pages.css#L627) | `.stay-rail` |
| Booking sheet and steps | [components.css](wwwroot/css/components.css#L772) | `.booking-steps` |
| Calendar day states | [components.css](wwwroot/css/components.css#L1058) | `.cal-day` |
| Hero and reveal motion | [motion.css](wwwroot/css/motion.css#L109) | `.hero-reveal` |
| Reduced motion overrides | [motion.css](wwwroot/css/motion.css#L189) | `prefers-reduced-motion: reduce` |

### Tests, scripts and configuration

| What you are looking for | Where it is | Search for |
| :--- | :--- | :--- |
| Test host with Testing environment | [ApiFactory.cs](tests/StayHubApi.Tests/ApiFactory.cs#L11) | `WebApplicationFactory<Program>` |
| Reset per test | [ApiTestBase.cs](tests/StayHubApi.Tests/ApiTestBase.cs#L34) | `PostAsync("/v1/system/reset"` |
| Pricing rounding and discounts | [PricingCalculatorTests.cs](tests/StayHubApi.Tests/PricingCalculatorTests.cs#L38) | `Round_UsesAwayFromZero` |
| Quote and create parity | [ReservationTests.cs](tests/StayHubApi.Tests/ReservationTests.cs#L22) | `Quote_TotalMatchesCreatedReservation` |
| Circle and polygon search | [SearchTests.cs](tests/StayHubApi.Tests/SearchTests.cs#L93) | `Search_CircleFilter_ReturnsOnlyNearby` |
| Availability validation | [AvailabilityTests.cs](tests/StayHubApi.Tests/AvailabilityTests.cs#L22) | `Availability_MissingDates_Returns422` |
| Weighted host rating | [HostTests.cs](tests/StayHubApi.Tests/HostTests.cs#L30) | `Hosts_AggregateRating_IsWeighted` |
| One error envelope everywhere | [SystemTests.cs](tests/StayHubApi.Tests/SystemTests.cs#L77) | `Errors_AllFailuresUseApiErrorShape` |
| CSP assertions | [SecurityHeaderTests.cs](tests/StayHubApi.Tests/SecurityHeaderTests.cs#L13) | `AppCspHasNoUnsafeInline` |
| 429 with Retry-After | [RateLimitTests.cs](tests/StayHubApi.Tests/RateLimitTests.cs#L17) | `RateLimit_Returns429` |
| OpenAPI drift check | [verify-openapi.ps1](scripts/verify-openapi.ps1#L1) | `Compare` |
| OpenAPI export | [generate-openapi.py](scripts/generate-openapi.py#L80) | `swagger/v1/swagger.json` |
| Browser screenshot and console check | [ui-check.mjs](scripts/ui-check.mjs#L98) | `Runtime.evaluate` |
| End-to-end booking in Chrome | [booking-flow-check.mjs](scripts/booking-flow-check.mjs#L81) | `Reserve` |
| Rate limits and exemptions | [appsettings.json](appsettings.json#L14) | `ApiRequestsPerMinute` |
| CORS origins | [appsettings.Development.json](appsettings.Development.json#L14) | `AllowedOrigins` |
| Ports and profiles | [launchSettings.json](Properties/launchSettings.json#L8) | `5047`, `5000` |
| CI build and test | [ci.yml](.github/workflows/ci.yml#L26) | `dotnet test` |
| Seed identifiers | [SEED_IDS.md](docs/SEED_IDS.md) | `3f7bf08e` |
| Photo and font licences | [IMAGE_CREDITS.md](docs/IMAGE_CREDITS.md), [FONT_LICENSES.md](docs/FONT_LICENSES.md) | `Unsplash`, `OFL` |

---

## API reference

Base path `/v1`. All responses are JSON. Every endpoint is a controller action; there are no minimal APIs.

### Listings

| Method | Path | Action | Request body | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| GET | `/v1/listings` | [GetAll](Controllers/ListingsController.cs#L30) | none | 200, `limit` clamped 1..100 | none |
| POST | `/v1/listings/search` | [Search](Controllers/ListingsController.cs#L42) | `ListingSearchRequest` | 200 page plus `appliedFilters` | 422 |
| GET | `/v1/listings/{id}` | [GetById](Controllers/ListingsController.cs#L52) | none | 200 | 404 |
| POST | `/v1/listings` | [Create](Controllers/ListingsController.cs#L65) | `CreateListingRequest` | 201, Location | 400, 422 |
| PUT | `/v1/listings/{id}` | [Update](Controllers/ListingsController.cs#L83) | `UpdateListingRequest` | 200 | 400, 404, 422 |
| DELETE | `/v1/listings/{id}` | [Delete](Controllers/ListingsController.cs#L98) | none | 204 | 404, 409 |
| GET | `/v1/listings/{id}/availability` | [GetAvailability](Controllers/ListingsController.cs#L118) | none | 200 | 404, 422 |
| GET | `/v1/listings/{id}/reviews` | [GetReviews](Controllers/ListingsController.cs#L133) | none | 200 | 404 |
| POST | `/v1/listings/{id}/reviews` | [AddReview](Controllers/ListingsController.cs#L154) | `CreateReviewRequest` | 201 | 400, 404, 429 |

### Reservations

| Method | Path | Action | Request body | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| GET | `/v1/reservations` | [GetAll](Controllers/ReservationsController.cs#L29) | none | 200, optional `?status=` | 422 |
| POST | `/v1/reservations/quote` | [Quote](Controllers/ReservationsController.cs#L43) | `QuoteRequest` | 200, `isAvailable` may be false | 404, 422 |
| POST | `/v1/reservations` | [Create](Controllers/ReservationsController.cs#L61) | `CreateReservationRequest` | 201, Location | 400, 404, 409, 422 |
| GET | `/v1/reservations/{id}` | [GetById](Controllers/ReservationsController.cs#L74) | none | 200 | 404 |
| PATCH | `/v1/reservations/{id}/status` | [UpdateStatus](Controllers/ReservationsController.cs#L92) | `UpdateReservationStatusRequest` | 200 | 404, 409, 422 |
| POST | `/v1/reservations/{id}/cancel` | [Cancel](Controllers/ReservationsController.cs#L106) | none; optional `reason` query | 200 | 404, 409, 422 |
| GET | `/v1/reservations/{id}/messages` | [GetMessages](Controllers/ReservationsController.cs#L116) | none | 200 | 404 |
| POST | `/v1/reservations/{id}/messages` | [SendMessage](Controllers/ReservationsController.cs#L134) | `CreateMessageRequest` | 201 | 400, 404, 422 |

### Hosts

| Method | Path | Action | Request body | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| GET | `/v1/hosts` | [GetAll](Controllers/HostsController.cs#L27) | none | 200, sorted by name | none |
| GET | `/v1/hosts/{id}` | [GetById](Controllers/HostsController.cs#L37) | none | 200 | 404 |
| GET | `/v1/hosts/{id}/listings` | [GetListings](Controllers/HostsController.cs#L47) | none | 200 | 404 |
| GET | `/v1/hosts/{id}/verification` | [GetVerification](Controllers/HostsController.cs#L57) | none | 200 | 404 |
### Favorites

| Method | Path | Action | Request body | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| GET | `/v1/favorites` | [GetAll](Controllers/FavoritesController.cs#L27) | none | 200, ordered by title | none |
| POST | `/v1/favorites/{listingId}` | [Toggle](Controllers/FavoritesController.cs#L37) | none | 200, `{ listingId, favorited }` | 404 |

### System

| Method | Path | Action | Request body | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| GET | `/v1/system/health` | [Health](Controllers/SystemController.cs#L37) | none | 200, store probe, version, uptime | none |
| GET | `/v1/system/stats` | [Stats](Controllers/SystemController.cs#L69) | none | 200 | none |
| GET | `/v1/system/stage` | [Stage](Controllers/SystemController.cs#L110) | none | 200 | none |
| POST | `/v1/system/reset` | [Reset](Controllers/SystemController.cs#L133) | none | 200 | 404 outside Development unless enabled |

Copy-paste examples, one per controller:

```powershell
# Listings
Invoke-RestMethod 'http://localhost:5047/v1/listings?limit=3'
# Reservations
Invoke-RestMethod 'http://localhost:5047/v1/reservations'
# Hosts
Invoke-RestMethod 'http://localhost:5047/v1/hosts'
# Favorites
Invoke-RestMethod 'http://localhost:5047/v1/favorites'
# System
Invoke-RestMethod 'http://localhost:5047/v1/system/health'
```

All operations can additionally return 429 with ApiError when the API/write budget is exhausted, 400 for malformed binding values, and 500 for an unexpected server failure. Body endpoints can return 415 for an unsupported content type. Success and domain error statuses are listed above; DTO fields are defined in RentalModels.cs and the complete generated OpenAPI schemas.

`POST /v1/hosts` does not exist by design. Host data is seeded; there is no host write API.

---

## Search request

```json
{
  "query": "prizren",
  "checkInDate": "2027-03-01",
  "checkOutDate": "2027-03-07",
  "guestsCount": 2,
  "petsCount": 0,
  "minPrice": 40,
  "maxPrice": 180,
  "categories": ["apartment", "entire_home"],
  "requiredAmenities": ["wifi", "workspace"],
  "minBedrooms": 1,
  "minBeds": 1,
  "minBathrooms": 1,
  "superhostOnly": true,
  "instantBookOnly": false,
  "minRating": 4.5,
  "neighborhoodId": "neigh_oldtown",
  "hostId": "9a78cd9c-c9c7-43cf-bc82-01967fa7e93b",
  "circleSearch": {
    "center": { "latitude": 42.6629, "longitude": 21.1655 },
    "radiusMeters": 40000
  },
  "polygonSearch": {
    "boundaryPoints": [
      { "latitude": 42.0, "longitude": 20.0 },
      { "latitude": 42.9, "longitude": 20.0 },
      { "latitude": 42.9, "longitude": 21.5 }
    ]
  },
  "sortBy": "distance_asc",
  "page": 1,
  "pageSize": 24
}
```

Every field is implemented. The removed fields are `adultsCount`, `childrenCount`, `infantsCount` and `currency`. Validation: both dates or neither, checkout after checkin, at most 366 nights, guests 1 to 20, prices positive with min <= max, `minRating` 0 to 5, page >= 1, pageSize 1 to 48, radius 100 to 100000 metres, polygon with at least 3 valid points, known category and known sort. `distance_asc` requires `circleSearch`.

Sort options: `recommended` (Bayesian weighted rating, then review count, then newest), `price_asc`, `price_desc`, `rating_desc`, `reviews_desc`, `distance_asc`.

The response carries `page`, `pageSize`, `totalRecords`, `totalPages`, `appliedFilters` and `results`, so the client renders active filter chips without guessing.

---

## Error reference

Every failure, including model binding, uses:

```json
{
  "code": "BOOKING_CONFLICT",
  "message": "Those dates are no longer available. Choose another range.",
  "traceId": "0HN7...:00000001",
  "fieldErrors": null,
  "details": { "checkInDate": "2026-11-17", "checkOutDate": "2026-11-22" }
}
```

| HTTP | Code | Meaning |
| :--- | :--- | :--- |
| 400 | `VALIDATION_FAILED` | DataAnnotations or model binding failure; `fieldErrors` is populated |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Body was not JSON; the result filter preserves HTTP 415 in ApiError |
| 404 | `RESOURCE_NOT_FOUND` | Missing stay, reservation, host or disabled reset |
| 409 | `BOOKING_CONFLICT` | Dates overlap an active reservation; `details` has the blocking range |
| 409 | `INVALID_STATUS_TRANSITION` | State machine rejection; `details` has `from`, `to`, `allowed` |
| 409 | `CANCELLATION_NOT_ALLOWED` | Past, completed, checked in or already cancelled |
| 409 | `LISTING_HAS_ACTIVE_RESERVATIONS` | Delete blocked by active bookings |
| 422 | `DATE_ORDER` | Check-out is not after check-in |
| 422 | `DATE_IN_PAST` | Check-in before today (UTC) |
| 422 | `MIN_STAY_NOT_MET` | Below the listing minimum |
| 422 | `STAY_TOO_LONG` | Over 365 nights, or availability window over 92 days |
| 422 | `CAPACITY_EXCEEDED` | Guests above `capacity.maxGuests` |
| 422 | `INVALID_SORT` | Unknown `sortBy`; `details.allowed` lists the six values |
| 422 | `VALIDATION_FAILED` | Semantic validation: ranges, geo, amenities, paging |
| 429 | `RATE_LIMIT_EXCEEDED` | Window exhausted; `Retry-After` in seconds |
| 500 | `INTERNAL_SERVER_ERROR` | Unhandled exception; generic sentence plus trace id |

Validation order for a reservation: listing exists, both dates present, order, past, minimum and maximum nights, capacity, booking flow, overlap, then payment token length (DataAnnotations). The first failure wins.

---

## Reservation state machine

| From | Allowed to |
| :--- | :--- |
| `pending_approval` | `confirmed`, `cancelled` |
| `confirmed` | `checked_in`, `cancelled` |
| `checked_in` | `completed` |
| `completed` | none |
| `cancelled` | none |

`checked_in` is only allowed on or after the arrival date. `completed` is only allowed on or after the departure date. Cancellation is allowed only from `pending_approval` or `confirmed`, and only before arrival. Everything else returns 409 with `details.allowed`.

---

## Request pipeline

```text
Request
  -> ExceptionHandlingMiddleware      ApiException, 400/415/500 fallbacks, ApiError
  -> ForwardedHeaders                only when ReverseProxy:Enabled is true
  -> HSTS                            production only
  -> HttpsRedirection                production only, opt-in because no certificate
  -> SecurityHeadersMiddleware       CSP per path, COOP, CORP, permissions, HSTS
  -> ResponseCompression             Brotli and Gzip for JSON, HTML, CSS, JS, SVG
  -> UseDefaultFiles                 serves index.html for /
  -> UseStaticFiles                  cache headers, before the limiter
  -> RateLimitMiddleware             /v1 only, API, write and review windows
  -> CORS                            origins from configuration
  -> StatusCodePages                 ApiError for unmatched routes and unsupported methods
  -> Swagger and Swagger UI          /swagger
  -> MapControllers                  /v1/...
```

Two consequences worth knowing:

1. Static files are served before the limiter, so loading a page never consumes API budget. Only `/v1` paths are counted, except the configured exempt paths.
2. There is no authentication, so `UseAuthorization` was removed rather than left as a no-op.

---

## Data model

All types are in [RentalModels.cs](Models/RentalModels.cs).

| Type | Key fields |
| :--- | :--- |
| `ListingDetail` | `Id`, `Title`, `Category`, `Address`, `Capacity`, `Amenities`, `Host`, `Pricing`, `HouseRules`, `StarRating`, `ReviewCount`, `CreatedAt` |
| `PricingMatrix` | `Currency` (always EUR), `BaseNightlyRate`, `CleaningFee`, `ServiceFee`, `LocalOccupancyTax`, `SecurityDeposit`, `Discounts`, `MinNights` |
| `ListingSearchRequest` | Text, dates, guests, pets, price, rooms, amenities, rating, neighbourhood, host, circle, polygon, sort, paging |
| `ReservationQuote` | Nights, rate, base, discount, fees, tax, deposit, total, minimum stay, availability, itemised lines |
| `Reservation` | Status, flow, dates, guest identity, `PrimaryGuest`, `PricingSummary`, `CancellationReason`, `CancelledAt` |
| `HostRecord` | `Details`, 160 character `Bio`, `JoinedYear`, `HostVerification` flags |
| `Review` | `AuthorName`, `Rating` 1 to 5, `Comment`, `CreatedAt`; the avatar URL is always stored as null |
| `DailyAvailability` | Date, availability, nightly price, minimum stay, `blockReason` in `available`, `booked`, `past` |

Seeded identifiers are listed in [docs/SEED_IDS.md](docs/SEED_IDS.md). The three the demo depends on:

- Listing 1, "Sunlit loft above Prishtina's old town": `e14c1d68-0fa4-44bc-b17b-4b248a31e8fd`
- Host 1, Elira Krasniqi: `9a78cd9c-c9c7-43cf-bc82-01967fa7e93b`
- Reservation 1, confirmed, today + 14 to + 19: `3f7bf08e-1678-43d9-959c-6e6ad9d20c5b`

---

## Pricing rules

Implemented once in [PricingCalculator.cs](Services/PricingCalculator.cs#L26), called by the quote endpoint, the create endpoint and the seed builder.

```text
nights          = checkOut - checkIn
base            = nightlyRate * nights
discountPercent = 30 or more nights -> monthly percent (wins)
                  7 or more nights  -> weekly percent
                  otherwise         -> 0
discount        = round(base * discountPercent / 100)
total           = base - discount + cleaningFee + serviceFee + occupancyTax
securityDeposit is reported, never added to the total
every value is rounded to 2 decimals, MidpointRounding.AwayFromZero
```

`CleaningFee` and `ServiceFee` are flat per booking. `LocalOccupancyTax` is flat per stay. That is the decision that keeps the stored contract simple and is recorded again under [Decisions](#decisions).

### Worked example, listing 1

| Line | Amount |
| :--- | ---: |
| 6 nights at 95.00 | 570.00 |
| Cleaning fee | 30.00 |
| Service fee | 14.25 |
| Occupancy tax | 4.00 |
| **Total** | **618.25** |
| Refundable deposit, not charged | 100.00 |

Seven nights: base 665.00, weekly discount 10% = 66.50, total 646.75. Thirty nights: base 2850.00, monthly discount 25% = 712.50, total 2185.75. A test asserts that the quote total equals the total stored by create for the same input.

---

## Configuration

| Key | File | Used | Meaning |
| :--- | :--- | :--- | :--- |
| `RateLimiting:ApiRequestsPerMinute` | `appsettings.json` | Yes | Reads per minute per IP, default 120 |
| `RateLimiting:WriteRequestsPerMinute` | `appsettings.json` | Yes | POST/PUT/PATCH/DELETE per minute, default 20 |
| `RateLimiting:ReviewRequestsPerMinute` | `appsettings.json` | Yes | Review writes per minute, default 5 |
| `RateLimiting:ExemptPaths` | `appsettings.json` | Yes | Static paths and health check |
| `Cors:AllowedOrigins` | all environments | Yes | Empty means any origin, used in Development; Production lists one origin |
| `DemoMode:ResetOnStart` | `appsettings.json`, Production | Yes | Allows reset outside Development when true; false in Production |
| `ReverseProxy:Enabled` | `appsettings.json` | Yes | Enables forwarded headers for a reverse proxy |
| `Https:Redirect` | `appsettings.json` | Yes | Opt-in because no certificate is provisioned |
| `StageConfig:StageName` | all environments | Yes | `DEV`, `PROD`, `TEST`; returned by `/v1/system/stage` |
| `StageConfig:EnableDetailedErrors` | Development | Yes | Adds `details.exception` to a 500 in Development only |
| `Logging:LogLevel` | all | Yes | Console logging |
| `AllowedHosts` | all | Yes | Host filtering |

Ports come from [launchSettings.json](Properties/launchSettings.json), not from `appsettings`. The version, `2.0.0`, comes from [StayHubApi.csproj](StayHubApi.csproj#L10) and the assembly informational version.

---

## Security notes

The application policy, served on every path except `/swagger`, is:

```text
default-src 'none'; script-src 'self'; style-src 'self'; style-src-attr 'none';
img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self';
base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'
```

Swagger gets a separate policy with `unsafe-inline` for its own bundled UI. The application policy never gets it. Additional headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy`, `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, and HSTS outside Development. `X-XSS-Protection` was removed.

- The client builds every node with `createElement` and sets user text with `textContent`. There is no `innerHTML` in the application code. A review comment containing `<img onerror>` renders as text.
- Images accept only same-origin paths, so the API cannot be used to make the browser fetch a remote tracker.
- Review writes are limited to 5 per minute per IP; all writes to 20 per minute; reads to 120 per minute.
- No authentication, roles, real payments, email or SMS. Payment tokens are length-checked, never stored, never logged and never echoed. This is a course prototype, not a production service.
- The in-memory store is per process and resets on restart. Rate limit windows are also per process.

---

## Testing

Final evidence: [verification report](docs/VERIFICATION.md), [file-by-file changes](docs/CHANGELOG_FILES.md), [Lighthouse report](output/playwright/lighthouse-desktop.report.html), [browser results](output/playwright/browser-audit.json), [interaction checks](output/playwright/interaction-check.json), and [booking GIF](output/playwright/booking-flow.gif).

```powershell
dotnet restore
dotnet build -warnaserror
dotnet test
```

`dotnet test` runs 73 tests in `tests/StayHubApi.Tests`, all passing on SDK 10.0.302. The suite uses `WebApplicationFactory<Program>`, the `Testing` environment, high rate limits and a store reset before each test.

| Area | Tests |
| :--- | :--- |
| Search | No filters, reversed dates, single date, category plus amenities, booked dates excluded, circle, polygon, pets, unknown sort, distance sort without a circle, page size cap |
| Reservations | Six-night quote, weekly discount, monthly discount, quote and create parity, past check-in, minimum stay, overlap, capacity, missing dates, illegal transition, pending to confirmed, early check-in, past cancellation |
| Availability | Missing dates, 92-day window, past days, seeded booked days, last representable date |
| Regression contracts | Routing errors, trimming before validation, atomic rejected update, eight concurrent bookings, security headers on errors, image path validation, fee bounds |
| Production | Health, HSTS, reset disabled |
| Reviews | Out-of-range rating, short comment, recomputation, unknown listing |
| Favorites | Seeded list independent of search, toggle twice, unknown listing |
| Hosts | Full directory, weighted aggregate, stored verification flags, unknown host, hostId filter |
| System | Health probe, no-store, stats grouped by currency, stage, reset, one error envelope |
| Security | App CSP, Swagger CSP, static assets not rate limited, 429 with Retry-After |
| Pricing unit | Rounding away from zero, no discount, weekly, monthly wins, deposit excluded, items sum to total, availability pass-through |

### Browser and API checks used for evidence

```powershell
# start the app first
dotnet run --launch-profile dev

# Chrome with a debugging port
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless --remote-debugging-port=9222 `
  --remote-allow-origins=* --user-data-dir="$env:TEMP\fh-cdp" about:blank

node scripts/ui-check.mjs "http://localhost:5047/#/explore" "docs/screenshots/explore-1440.png" 1440 900
node scripts/booking-flow-check.mjs
.\scripts\verify-openapi.ps1
```

`ui-check.mjs` writes a screenshot and fails on a console error, an exception or the global error panel. `booking-flow-check.mjs` opens the sheet, fills the guest form, confirms the booking and fails unless the confirmation panel appears. Both were used for the initial QA. The final repeatable audit is `scripts/browser-audit.mjs`; its 60 captures and axe results are in [output/playwright](output/playwright). Setup, command tails, all 25 QA rows, and tooling failures are recorded in [docs/VERIFICATION.md](docs/VERIFICATION.md).

### Manual QA matrix result

| Check | Result |
| :--- | :--- |
| Cold load at 1440x900 | Pass, hero, search, filters and the top of the first card visible |
| 1024, 768, 375 and 320 widths | Pass, no horizontal scroll on Explore, Stay, Trips, Hosts, Saved, Contact |
| Keyboard only | Pass: skip link first, native dialog focus trap, Escape closes, calendar arrows and Page Up/Down |
| Reduced motion | Pass: transitions and reveals collapse to 0.01ms, no shimmer |
| Dark mode | Pass: tokens swap, muted text at or above 5:1, images and hairlines visible |
| Deep link to a stay | Pass, cold load fetches by id |
| Search "prizren" | Pass, 2 stays, count updates |
| Category and sort | Pass, 3 cabins, prices ascending |
| Save a stay, filter Explore, open Saved | Pass, saved list is independent of search |
| Booking 3 nights | Pass, total matches quote at 333.25 |
| Booking a booked range | Pass, inline conflict, Continue disabled, no reservation created |
| Double submit | Pass, button disabled while in flight and a submitting guard |
| Cancel booking | Pass, reason dialog, status updates, dates free |
| Reviews | Pass, 1 star accepted and displayed, XSS payload remains literal text, count and average recomputed |
| Lighthouse desktop | Pass: Performance 100, Accessibility 100, Best Practices 100, SEO 100 |
| axe WCAG checks | Pass: 60 captures, zero violations, including zero critical and serious |
| Message thread | Pass, 5 seeded messages, send adds a bubble |
| CSS and JS no-inline policy | Pass: no `onclick`, `onsubmit`, `style=` or `innerHTML` in `wwwroot` |
| External runtime requests | Pass: no `googleapis` or `unsplash` references |

Screenshots are in [docs/screenshots](docs/screenshots): Explore at 1440, 1024, 768 and 375, dark mode, stay detail and its full page, mobile stay, booking confirmation at desktop and mobile, Trips, Saved, Hosts, Host detail, Contact, 404, chat drawer, filtered and sorted results.

---

## Demo script for the professor

1. `dotnet run`, open <http://localhost:5047/>. Point out the hero, `18 stays · 9 places`, and that the top of the first card is already in the first viewport. The grid came from `POST /v1/listings/search`, called in [explore.js](wwwroot/js/views/explore.js#L39).
2. Type `prizren`, submit. Two stays remain. Pick `Cabins`; three cabins appear with the count and a removable chip. Change sort to `Lowest price`; prices ascend. Explain `appliedFilters` and [ListingSearchService.cs](Services/ListingSearchService.cs#L29).
3. Save a stay with the heart, filter Explore to a category that excludes it, then open Saved. The stay is still there because `GET /v1/favorites` is independent of search.
4. Open listing 1 directly: <http://localhost:5047/#/stay/e14c1d68-0fa4-44bc-b17b-4b248a31e8fd>. Move the calendar forward with Page Down, select a range, and watch the rail quote. Show the minimum stay note and the booked hatch.
5. Press Reserve, walk the three steps. The total, 333.25 for three nights, comes from the server quote. Confirm, show the reference and `View trip`. The booking exists once; double-clicking the confirm button cannot duplicate it.
6. In Trips, expand `Price details`, open `Message host`, send a message, then cancel another booking with a reason. Point out that the cancelled card keeps full text contrast and the dates are free again.
7. Open Hosts, choose Elira Krasniqi, and show the weighted rating and the four stored verification flags. The old fake verification toast is gone.
8. Open `/swagger`. Try `POST /v1/reservations/quote` with the sample body, then `PATCH` a cancelled reservation to `confirmed` and show 409 with `allowed: []`. Finish in DevTools: the response headers show the strict CSP, `X-RateLimit-Remaining` and `Cache-Control` on the document.

If the demo stalls on 429, the per-IP window was exhausted. Wait a minute, or restart with the default limits. Static assets keep loading because they are outside the limiter.

---

## Known limitations

These are true of the current tree.

- The store is in memory. Restarting the process reseeds it; the reset endpoint exists so a demo can recover without a restart.
- There is no authentication or authorization. Any caller can create a booking, cancel a seeded one or post a review as any name. That is deliberate for the course scope.
- Payment is simulated. The token is verified for length, then discarded.
- The photography is illustrative stock, not photographs of the fictional properties. See [IMAGE_CREDITS.md](docs/IMAGE_CREDITS.md). Listing photos have local 800, 1200 and 1600 pixel landscape variants, plus portraits and detail crops. The complete photo set is 5.37 MB.
- Each place has exactly two stays, so `More in {city}` usually shows one card and sometimes two. It never invents a third.
- The circle and polygon filters are fully implemented in the API but the UI only uses the circle through the `Closest` sort, which needs a place query. There is no map drawing surface.
- `systemVersion` is `2.0.0` from the assembly. The generated OpenAPI document inherits that version.
- Warnings 1591 are suppressed for public XML documentation. All controller actions and response codes are documented; not every public DTO member has a `<summary>`.
- The rate limiter is per process and per IP. Restarting clears it.
- HTTPS redirection and HSTS are production settings. The demo has no certificate, so the redirect is opt-in and off.
- Production port 5000 is occupied on this machine by Logitech G HUB (`CS_GO_Arx_Applet.exe`). The production integration test passes; a live production launch needs that port freed. The dev app uses 5047.
- There is no CI run in this workspace. The workflow is checked in and the same three commands pass locally.

---

## Decisions

- **Strings are trimmed during JSON deserialization.** Nested fields are validated after trimming, so spaces cannot satisfy minimum lengths.
- **Routing failures use ApiError too.** Unmatched `/v1` routes and unsupported methods retain their HTTP status and return the common error envelope.
- **Shared images use one CSS transition name per snapshot.** Data attributes identify the selected image without creating inline styles; review distributions use native progress elements.
- **Photo variants include 1600px.** The photo budget is 5.37 MB so wide cards can load the requested resolution. All variants are local and individually below 180 KB.

- **Flat service fee.** `PricingMatrix.ServiceFee` stays a flat amount per booking, like the cleaning fee. It preserves the existing JSON contract and is easy to explain. A percentage would need a new field and a migration.
- **Delete listing returns 409 while active reservations exist.** Cascading would silently destroy a guest's booking. Cancelled and completed reservations are removed with the stay.
- **EUR only.** The catalogue was normalised to EUR, and totals are still grouped by currency in stats and in the client so a future currency cannot be summed by accident.
- **Cancellation sets `CancelledAt` and keeps `CancellationReason`.** Both are additive fields on `Reservation`; nothing was removed.
- **Reset is a POST and returns 200, not 204.** It returns the new counts, which is useful in a live demo.
- **`docs/openapi.yaml` is generated.** `scripts/generate-openapi.py` exports the runtime document, so the spec cannot drift silently; `scripts/verify-openapi.ps1` fails when it does.
- **`content-visibility` was removed from the similar-stays container.** It reserved 640px of empty space when the API returned no neighbours, and it hid content from full-page screenshots.
- **The chat is 420px, the booking sheet 480px.** The brief asks for both widths; they are separate classes rather than one compromise.
- **Message sender ids are derived from the reservation.** The client sends a role only, so a caller cannot post as an arbitrary user.
- **`Closest` requires a place.** The API rejects `distance_asc` without a circle; the UI explains this with a toast and reverts the select.
- **No image upload or admin panel.** Out of scope, and both would need authentication.

---

## Questions the professor may ask

**Where is CORS?** [Program.cs](Program.cs#L85) reads `Cors:AllowedOrigins` and registers `AppPolicy`. Development lists the two localhost origins; Production lists the placeholder origin in [appsettings.Production.json](appsettings.Production.json#L16).

**Where is the API header set?** HTTP security headers are in [SecurityHeadersMiddleware.cs](Middleware/SecurityHeadersMiddleware.cs#L11). The on-screen header is marked up in [index.html](wwwroot/index.html#L42) and styled in [layout.css](wwwroot/css/layout.css#L18).

**How is double booking prevented?** The conflict check and the insert happen inside one `MockDataStore.Modify` lock in [ReservationService.cs](Services/ReservationService.cs#L70). A second request sees the first reservation and gets 409 with the blocking dates.

**Why is there no database?** The course scope is API design and a working client. EF Core and migrations would add setup cost without changing what is demonstrated. The store is behind a class, so it could be replaced.

**How are prices calculated?** [PricingCalculator.cs](Services/PricingCalculator.cs#L26). Base rate times nights, one length-of-stay discount, flat fees, tax, two decimal rounding away from zero. The deposit is excluded.

**What happens on 409?** The booking sheet returns to step 1, shows `Those dates are no longer available. Choose another range.`, requests a fresh quote and keeps the guest details. The API returns `BOOKING_CONFLICT` plus the conflicting range in `details`.

**How do I add an endpoint?** Add a controller under `Controllers/`, put the logic in a service under `Services/`, register it in [Program.cs](Program.cs#L74), add XML comments and `ProducesResponseType`, then a test in `tests/StayHubApi.Tests`. Swagger picks it up automatically; regenerate the YAML with `scripts/generate-openapi.py`.

**How do I change a colour?** Edit the tokens in [tokens.css](wwwroot/css/tokens.css#L57). Light and dark blocks must both change. Do not add a second accent.

**How do I change the port?** Edit [launchSettings.json](Properties/launchSettings.json#L4) or pass `--urls`. The README and `StayHubApi.http` also mention 5047.

**Why is there no authentication?** It is out of scope, and the brief says not to add it. Consequences are documented under [Known limitations](#known-limitations); no endpoint pretends to be protected.

**What is the difference between `docs/openapi.yaml` and `/swagger/v1/swagger.json`?** They contain the same paths and schemas. The JSON is generated at runtime by Swashbuckle; the YAML is an export of that document with a `servers` entry, checked in so the repository has a reviewable spec. The verify script compares them.

**How do I run the tests?** `dotnet test`. 73 tests, no external services. `dotnet build -warnaserror` must pass first.

**Where is the state machine?** [ReservationRules.cs](Services/ReservationRules.cs#L28) has the transition table; `ValidateTransition` enforces dates. The controller and create path both call it.

**Where are the seeded IDs?** [docs/SEED_IDS.md](docs/SEED_IDS.md), generated from [SeedData.cs](Services/SeedData.cs#L58). Listing 1, host 1 and reservation 1 are stable and referenced by the demo.

**What is not finished?** Real authentication, real payments, HTTPS in the demo, a map drawing UI for polygons, and production deployment are outside the course scope. Live production launch is blocked here by the port 5000 conflict. See the verification report for the measured QA scope.

---

## Course artefacts

- [read.md](read.md) is the short Albanian description. It is accurate for this iteration.
- [php/index.php](php/index.php) is the older PHP front end kept from the PHP module. It is not used by the .NET app and no longer leaks a comment below the page.
- [docs/course/UshtrimiAdili.md](docs/course/UshtrimiAdili.md) is the Jira and GitHub course note, moved under `docs/course/` but kept.

---

## Team and credits

Course project by Artik Osmani, Arber Miftari, Dalmat Ademi, Arber Beqiri and Jon Ferizi.

- [.NET](https://dotnet.microsoft.com/) and ASP.NET Core, MIT
- [Swashbuckle.AspNetCore](https://github.com/domaindrivendev/Swashbuckle.AspNetCore), BSD-3-Clause
- Photography from [Unsplash](https://unsplash.com/), Unsplash License. Credits and sources in [IMAGE_CREDITS.md](docs/IMAGE_CREDITS.md).
- Fonts: Schibsted Grotesk, Geist and Geist Mono, SIL Open Font License 1.1. Sources in [FONT_LICENSES.md](docs/FONT_LICENSES.md).
- Icons: [Phosphor Icons](https://phosphoricons.com/), MIT, 45 symbols in `wwwroot/images/icons.svg`.

Code is MIT licensed; see [LICENSE](LICENSE). Photography and fonts keep their own licences.

## Upgrade plan

The specification for this iteration is [UPGRADE_PROMPT.md](UPGRADE_PROMPT.md). The execution order and the definition of done are in sections 12 and 13 of that file. Anything still open is listed under [Known limitations](#known-limitations).
