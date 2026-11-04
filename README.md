# FatiHomes

A stays catalogue for Kosovo and Albania. Built with .NET 10 and plain HTML, CSS and JavaScript. Demo data is stored in memory; payments are simulated.

## Open the project

Install the .NET 10 SDK, then run from this folder:

```powershell
dotnet run
```

[Website](http://localhost:5047/) · [Swagger API](http://localhost:5047/swagger) · [GitHub repository](https://github.com/Artik-Osmani/Api)

Checks: `dotnet build -warnaserror` and `dotnet test`.

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
| Search: place, dates and guests | [explore.js · buildSearchConsole](wwwroot/js/views/explore.js#L194) |
| Category filters and sorting | [explore.js · buildToolbar](wwwroot/js/views/explore.js#L514) |
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
| CORS allowed origins | [Program.cs · allowedOrigins](Program.cs#L86) |

### Design and assets

| Part | Code |
| --- | --- |
| Colours, dark mode, fonts and spacing | [tokens.css](wwwroot/css/tokens.css) |
| Base typography and keyboard focus | [base.css](wwwroot/css/base.css) |
| Navbar, mobile tabs and footer layout | [layout.css](wwwroot/css/layout.css) |
| Buttons, cards, inputs and dialogs | [components.css](wwwroot/css/components.css) |
| Hero and individual page layouts | [pages.css](wwwroot/css/pages.css) |
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

Current UI upgrade: destination shortcuts, real advanced filters, eight-stay pagination, shared-image transitions, animated sheets and preserved search choices through booking. [Review and results](docs/UI_UX_V2_RESULTS.md).
