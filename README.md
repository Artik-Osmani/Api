# FatiHomes

A stays catalogue for Kosovo and Albania. Built with .NET 10 and plain HTML, CSS and JavaScript. Demo data is stored in memory; payments are simulated.

## Open the project

Install the .NET 10 SDK, then run from this folder:

```powershell
dotnet run
```

[Website](http://localhost:5047/) · [Swagger API](http://localhost:5047/swagger) · [GitHub repository](https://github.com/Artik-Osmani/Api)

Checks: `dotnet build -warnaserror`.

## Where is the code?

Click a file to open it at the relevant code. On GitHub, `#L` jumps to the line. If lines move, search for the symbol shown in the link.

### Page and navigation

| Part | Code |
| --- | --- |
| Page structure | [index.html](wwwroot/index.html#L1) |
| Logo, stage and platform stats | [index.html · navbar-inner](wwwroot/index.html#L24) |
| Navbar navigation links | [index.html · primaryNavigation](wwwroot/index.html#L38) |
| Swagger API docs button | [index.html · swagger-pill](wwwroot/index.html#L58) |
| Dark / light mode toggle button | [index.html · themeToggle](wwwroot/index.html#L61) |
| Mobile hamburger menu toggle | [index.html · navMenuToggle](wwwroot/index.html#L62) |
| Theme toggle behaviour | [app.js · initDarkMode / toggleDarkMode](wwwroot/app.js#L104) |
| Navigation view switching | [app.js · switchView](wwwroot/app.js#L119) |
| App startup and initialisation | [app.js · initApp](wwwroot/app.js#L1012) |

### Views and interactions

| Part | Code |
| --- | --- |
| Hero banner and heading | [index.html · hero-section](wwwroot/index.html#L76) |
| Search console: destination, dates, guests | [index.html · search-console](wwwroot/index.html#L83) |
| Search execution & query logic | [app.js · executeSearch](wwwroot/app.js#L216) |
| Category filter strip | [app.js · renderCategories / selectCategory](wwwroot/app.js#L198) |
| Sorting and superhost / instant book filters | [app.js · toggleSuperhostFilter / toggleInstantBookFilter](wwwroot/app.js#L254) |
| Stay cards rendering | [app.js · renderListingsGrid](wwwroot/app.js#L266) |
| Wishlist / save toggle & badge count | [app.js · toggleWishlist / loadFavorites](wwwroot/app.js#L313) |
| Wishlist view | [app.js · renderWishlist](wwwroot/app.js#L347) |
| Stay detail modal & availability check | [app.js · openPropertyDetail](wwwroot/app.js#L354) |
| Multi-step checkout & booking flow | [app.js · startBookingFlow / submitReservation](wwwroot/app.js#L474) |
| Booking modal HTML structure | [index.html · bookingModal](wwwroot/index.html#L264) |
| Bookings & itinerary view | [app.js · renderReservations / loadReservations](wwwroot/app.js#L660) |
| Booking cards, receipts and cancellation | [app.js · renderBookingCard / cancelReservation](wwwroot/app.js#L726) |
| Review submission modal & star rating | [app.js · openReviewModal / submitReview](wwwroot/app.js#L852) |
| Host and guest messaging drawer | [app.js · openChatModal / sendChatMessage](wwwroot/app.js#L886) |
| Verified hosts directory | [app.js · renderHosts](wwwroot/app.js#L939) |
| Contact view | [index.html · view-contact](wwwroot/index.html#L234) |
| Toast notifications & confetti animation | [app.js · toast / fireConfetti](wwwroot/app.js#L39) |

### API and data

| Part | Code |
| --- | --- |
| Backend startup, services and pipeline | [Program.cs](Program.cs#L4) |
| Swagger API documentation setup | [Program.cs · AddSwaggerGen](Program.cs#L11) |
| CORS policies (dev & prod) | [Program.cs · AddCors](Program.cs#L22) |
| Listings, search, availability and reviews | [ListingsController.cs](Controllers/ListingsController.cs#L10) |
| Bookings, statuses, quotes and chat messages | [ReservationsController.cs](Controllers/ReservationsController.cs#L10) |
| Hosts and verification endpoints | [HostsController.cs](Controllers/HostsController.cs#L10) |
| Saved / favorites endpoints | [FavoritesController.cs](Controllers/FavoritesController.cs#L10) |
| Health, platform stats and stage | [SystemController.cs](Controllers/SystemController.cs#L10) |
| Strongly-typed domain models and DTOs | [RentalModels.cs](Models/RentalModels.cs) |
| Thread-safe in-memory database & mock data | [MockDataStore.cs](Services/MockDataStore.cs#L5) |
| RFC 7807 standardized error handling | [ExceptionHandlingMiddleware.cs](Middleware/ExceptionHandlingMiddleware.cs) |
| Sliding window rate limiting | [RateLimitMiddleware.cs](Middleware/RateLimitMiddleware.cs) |
| OWASP security headers (CSP, HSTS) | [SecurityHeadersMiddleware.cs](Middleware/SecurityHeadersMiddleware.cs) |

### Design and assets

| Part | Code |
| --- | --- |
| Complete styling, dark mode, components & layouts | [app.css](wwwroot/app.css) |
| Custom Swagger UI theme | [swagger-custom.css](wwwroot/swagger-custom.css) |
| Brand logo | [logo.svg](wwwroot/images/logo.svg) |

### Run, configuration and supporting files

| Part | Code |
| --- | --- |
| Project definition (.NET 10) | [StayHubApi.csproj](StayHubApi.csproj) |
| Ports and launch profiles | [launchSettings.json](Properties/launchSettings.json) |
| Application configuration | [appsettings.json](appsettings.json) |
| Example HTTP requests | [StayHubApi.http](StayHubApi.http) |
| Development run script | [run-dev.ps1](run-dev.ps1) |
| Production run script | [run-prod.ps1](run-prod.ps1) |
| Albanian project guide | [read.md](read.md) |
| Student exercise note | [UshtrimiAdili.md](UshtrimiAdili.md) |
