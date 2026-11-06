# FatiHomes

A stays catalogue for Kosovo and Albania. Built with .NET 10 and plain HTML, CSS and JavaScript. Demo data is stored in memory; payments are simulated.

## Open the project

Install the .NET 10 SDK, then run from this folder:

```powershell
dotnet run
```

[Website](http://localhost:5047/) · [Swagger API](http://localhost:5047/swagger) · [GitHub repository](https://github.com/Artik-Osmani/Api)

Checks: `dotnet build -warnaserror` and `dotnet test`.

Latest verification: **78 tests passed, 0 build warnings**. [Logs and walkthrough](docs/CODE_WALKTHROUGH.md#3-explain-the-checks).

## Explain the project

The browser calls the controllers through `api.js`. Controllers delegate to services for search, pricing and booking rules; `MockDataStore` holds the demo data. The server calculates the booking total and checks availability again before creating a reservation.

[Three-minute code walkthrough](docs/CODE_WALKTHROUGH.md) · [Tests and examples](tests/StayHubApi.Tests) · [Interactive API](http://localhost:5047/swagger)

For a presentation, show search → stay details → a demo booking → the matching service and test. Data resets when the server restarts. There is no authentication or real payment processing.

## Team contributions

These credits follow the actual Git history of [Scrum-18](https://github.com/Artik-Osmani/Api/tree/Scrum-18). Original work has since been refactored into the linked files; these are historical contributions, not claims that every current line has the same author.

| Contributor | Recorded contribution | Evidence / code today |
| --- | --- | --- |
| Dalmat | API starter, reservations and messaging, favorites, FatiHomes logo, Contact page and code-navigation README | [API starter](https://github.com/Artik-Osmani/Api/commit/f2e226a), [logo](https://github.com/Artik-Osmani/Api/commit/f573f56), [Contact](https://github.com/Artik-Osmani/Api/commit/2c2ac53) · [Controllers](Controllers), [contact.js](wwwroot/js/views/contact.js) |
| arber_miftari | Navbar redesign, development documentation and the classroom Git/Jira exercise | [Navbar commit](https://github.com/Artik-Osmani/Api/commit/b6ccdb6), [exercise](https://github.com/Artik-Osmani/Api/commit/dc59faf) · [header](wwwroot/index.html#L43), [layout.css](wwwroot/css/layout.css) |
| arberbeqiri | Bookings-page redesign/restoration, twelve additional regional listings, mobile/dark-mode fixes and keeping cards visible when saving | [Bookings](https://github.com/Artik-Osmani/Api/commit/8f08b22), [listings](https://github.com/Artik-Osmani/Api/commit/f50fcc9), [wishlist fix](https://github.com/Artik-Osmani/Api/commit/1cc3338) · [trips.js](wwwroot/js/views/trips.js), [SeedData.cs](Services/SeedData.cs), [cards.js](wwwroot/js/cards.js) |
| Etnik Haziri | Albanian project documentation and correction of the OpenAPI documentation link; branch integration | [Documentation](https://github.com/Artik-Osmani/Api/commit/6c880c8), [OpenAPI link](https://github.com/Artik-Osmani/Api/commit/d349019) · [read.md](read.md), [OpenAPI](docs/openapi.yaml) |
| Artik Osmani | PHP practice-page and README edits; merged the Contact and exercise pull requests | [PHP edit](https://github.com/Artik-Osmani/Api/commit/380348f), [README edit](https://github.com/Artik-Osmani/Api/commit/646d420), [Contact PR](https://github.com/Artik-Osmani/Api/pull/3) · [php/index.php](php/index.php) |
| shefkidallku4-bit / Shefki Dallku | Merged the classroom exercise contribution through PR #5; the exercise includes his name | [Recorded merge](https://github.com/Artik-Osmani/Api/commit/31fa568), [original exercise](https://github.com/Artik-Osmani/Api/blob/3349589/UshtrimiAdili.md) |
| Jon Dallku | Classroom Git/Jira exercise work alongside Shefki Dallku | [Original exercise](https://github.com/Artik-Osmani/Api/blob/3349589/UshtrimiAdili.md) |
| Jon Ferizi | Merged the logo, SCRUM-14 and practice-page pull requests | [Logo PR](https://github.com/Artik-Osmani/Api/pull/2), [SCRUM-14 PR](https://github.com/Artik-Osmani/Api/pull/1), [practice PR](https://github.com/Artik-Osmani/Api/pull/6) |

Jon Ferizi's display name is confirmed by the team. PR integration is credited separately from implementation. The current visual refresh builds on the team's Scrum-18 design while retaining the tested modular API/client.

## Where is the code?

Click a file to open it at the relevant code. On GitHub, `#L` jumps to the line. If lines move, search for the symbol shown in the link.

### Page and navigation

| Part | Code |
| --- | --- |
| Page structure | [index.html](wwwroot/index.html#L1) |
| Logo and header | [index.html · site-header](wwwroot/index.html#L43) |
| Navbar links | [index.html · primary-nav](wwwroot/index.html#L52) |
| API button in the navbar | [index.html · api-link](wwwroot/index.html#L61) |
| Mobile bottom navigation | [index.html · tab-bar](wwwroot/index.html#L111) |
| Footer | [index.html · site-footer](wwwroot/index.html#L71) |
| Light / dark / system buttons | [index.html · appearance](wwwroot/index.html#L99) |
| Theme behaviour | [main.js · initAppearance](wwwroot/js/main.js#L44) |
| Page links, routing and back button | [router.js · render](wwwroot/js/router.js#L100) |
| App startup and route registration | [main.js · register](wwwroot/js/main.js#L2) |

### Views and interactions

| Part | Code |
| --- | --- |
| Hero: heading, description and photos | [explore.js · buildHero](wwwroot/js/views/explore.js#L117) |
| Destination shortcuts and real rates | [destinations.js · destinationNavigator](wwwroot/js/destinations.js#L14) |
| Advanced filters and active chips | [filters.js · openFilters](wwwroot/js/filters.js#L36) |
| Search: place, dates and guests | [explore.js · buildSearchConsole](wwwroot/js/views/explore.js#L154) |
| Category filters and sorting | [explore.js · buildToolbar](wwwroot/js/views/explore.js#L474) |
| Stay cards and prices | [cards.js · stayCard](wwwroot/js/cards.js#L15) |
| Heart / save button | [cards.js · heartButton](wwwroot/js/cards.js#L76) |
| Stay detail page | [stay.js · renderStay](wwwroot/js/views/stay.js#L26) |
| Photo gallery and lightbox | [stay.js · buildGallery](wwwroot/js/views/stay.js#L236) |
| Amenities and house rules | [stay.js · buildAmenities / buildRules](wwwroot/js/views/stay.js#L412) |
| Availability calendar | [calendar.js · createCalendar](wwwroot/js/calendar.js#L23) |
| Reviews and star ratings | [stay.js · buildReviewsShell](wwwroot/js/views/stay.js#L530) |
| Reserve panel and live quote | [stay.js · buildRail](wwwroot/js/views/stay.js#L772) |
| Booking: dates, guest details, confirmation | [booking.js · openBookingSheet](wwwroot/js/booking.js#L30) |
| Booking dialog HTML | [index.html · tpl-booking](wwwroot/index.html#L184) |
| Trips and cancellation | [trips.js · renderTrips](wwwroot/js/views/trips.js#L28) |
| Saved stays | [saved.js · renderSaved](wwwroot/js/views/saved.js#L8) |
| Host directory | [hosts.js · renderHosts](wwwroot/js/views/hosts.js#L7) |
| Host details and verification | [host.js · renderHost](wwwroot/js/views/host.js#L8) |
| Contact page | [contact.js · renderContact](wwwroot/js/views/contact.js#L5) |
| Message host / chat | [chat.js · openChat](wwwroot/js/chat.js#L11) |
| 404 page | [notfound.js · renderNotFound](wwwroot/js/views/notfound.js#L6) |
| Dialogs, focus and close confirmation | [dialog.js · openDialog](wwwroot/js/dialog.js#L10) |
| Notifications and error messages | [ui.js · toast / errorPanel](wwwroot/js/ui.js#L6) |

### API and data

| Part | Code |
| --- | --- |
| Frontend requests to the API | [api.js · api](wwwroot/js/api.js#L86) |
| Backend startup, services and pipeline | [Program.cs](Program.cs#L12) |
| Swagger API documentation setup | [Program.cs · AddSwaggerGen](Program.cs#L44) |
| Listings, search, availability and reviews | [ListingsController.cs](Controllers/ListingsController.cs#L14) |
| Quotes, bookings, status and messages | [ReservationsController.cs](Controllers/ReservationsController.cs#L13) |
| Hosts and verification endpoints | [HostsController.cs](Controllers/HostsController.cs#L14) |
| Saved / favorites endpoints | [FavoritesController.cs](Controllers/FavoritesController.cs#L14) |
| Health, stats, stage and demo reset | [SystemController.cs](Controllers/SystemController.cs#L14) |
| JSON request and response models | [RentalModels.cs](Models/RentalModels.cs) |
| Search filtering and sorting rules | [ListingSearchService.cs · Search](Services/ListingSearchService.cs#L6) |
| Price calculation and discounts | [PricingCalculator.cs · BuildQuote](Services/PricingCalculator.cs#L8) |
| Double-booking and status rules | [ReservationRules.cs · Overlaps / ValidateTransition](Services/ReservationRules.cs#L45) |
| Demo listings, hosts and bookings | [SeedData.cs · Build](Services/SeedData.cs#L6) |
| In-memory storage and locking | [MockDataStore.cs](Services/MockDataStore.cs#L10) |
| Shared frontend state and cache | [store.js · state](wwwroot/js/store.js#L8) |
| Error response format | [ApiError.cs](Models/ApiError.cs#L11) |
| Security headers and CSP | [SecurityHeadersMiddleware.cs](Middleware/SecurityHeadersMiddleware.cs#L9) |
| API request limits | [RateLimitMiddleware.cs](Middleware/RateLimitMiddleware.cs#L14) |
| CORS allowed origins | [Program.cs · allowedOrigins](Program.cs#L87) |

### Design and assets

| Part | Code |
| --- | --- |
| Colours, dark mode, fonts and spacing | [tokens.css](wwwroot/css/tokens.css) |
| Base typography and keyboard focus | [base.css](wwwroot/css/base.css) |
| Navbar, mobile tabs and footer layout | [layout.css](wwwroot/css/layout.css) |
| Buttons, cards, inputs and dialogs | [components.css](wwwroot/css/components.css) |
| Hero, rounded catalogue grid and individual page layouts | [pages.css](wwwroot/css/pages.css) |
| Animations and reduced motion | [motion.css](wwwroot/css/motion.css) |
| Native animation behaviour | [motion.js · reveal](wwwroot/js/motion.js#L25) |
| Prices, dates and booking references | [format.js · money / bookingCode](wwwroot/js/format.js#L28) |
| Safe text rendering | [dom.js · el](wwwroot/js/dom.js#L8) |
| Photos | [images/stays/](wwwroot/images/stays) |
| Fonts | [fonts/](wwwroot/fonts) |
| Icons | [icons.svg](wwwroot/images/icons.svg) |

### Run, test and supporting files

| Part | Code |
| --- | --- |
| Ports and launch profiles | [launchSettings.json](Properties/launchSettings.json) |
| App settings, CORS and rate limits | [appsettings.json](appsettings.json) |
| Tests | [StayHubApi.Tests/](tests/StayHubApi.Tests) |
| CI build and test workflow | [ci.yml](.github/workflows/ci.yml) |
| Example API requests | [StayHubApi.http](StayHubApi.http) |
| Full technical reference | [Technical reference](docs/TECHNICAL_REFERENCE.md) |
| Test, Lighthouse and browser evidence | [Verification report](docs/VERIFICATION.md) |
| Code review and improvement plan | [UI / UX review](docs/UI_UX_REVIEW.md) |
| Detailed implementation prompt | [Upgrade prompt v2](docs/UPGRADE_PROMPT_V2.md) |
| Current UI verification and recording | [UI / UX v2 results](docs/UI_UX_V2_RESULTS.md) |
| Albanian project guide | [read.md](read.md) |
| Photo and font licences | [Image credits](docs/IMAGE_CREDITS.md) · [Font licences](docs/FONT_LICENSES.md) |
| Code licence | [MIT licence](LICENSE) |

Current design: the original Scrum-18 house logo and rose identity, a photographic hero, pill navigation, rounded cards and working search/booking interactions. [Current verification](docs/SCRUM18_REFRESH.md).
