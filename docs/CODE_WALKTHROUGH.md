# FatiHomes: a three-minute code walkthrough

[Code map](../README.md#where-is-the-code) · [Team contributions](../README.md#team-contributions)

Run `dotnet run` from the repository root and open [the website](http://localhost:5047/). Use [Swagger](http://localhost:5047/swagger) to inspect the same API the website uses.

## 1. Explain the structure

“FatiHomes is a course project for browsing and booking fictional stays in Kosovo and Albania. ASP.NET Core serves both the REST API and a plain JavaScript frontend. Data is stored in memory, and payment is simulated.”

| Layer | Responsibility | Show this code |
| --- | --- | --- |
| Page and navigation | Shared header/footer and the active page | [index.html](../wwwroot/index.html), [router.js](../wwwroot/js/router.js) |
| Browser API client | Sends requests and handles API errors | [api.js](../wwwroot/js/api.js) |
| Controllers | HTTP routes, request validation and response codes | [ListingsController](../Controllers/ListingsController.cs), [ReservationsController](../Controllers/ReservationsController.cs) |
| Services | Search, price calculations and booking rules | [ListingSearchService](../Services/ListingSearchService.cs), [PricingCalculator](../Services/PricingCalculator.cs), [ReservationRules](../Services/ReservationRules.cs) |
| Data | Creates seed data and protects shared mutations with a lock | [SeedData](../Services/SeedData.cs), [MockDataStore](../Services/MockDataStore.cs) |

## 2. Demonstrate a real flow

1. Show the navbar, hero and footer, then open their links in the README.
2. Search for **Prizren** and open a stay. Trace the request from `explore.js` through `api.js` to the search controller/service.
3. Select an available future range of seven nights and open booking. Show the server quote, discount and total before confirming the simulated payment.
4. Open Trips and explain that a booking is stored on the server, with rules for cancellation and overlapping dates. The frontend does not decide the final price or availability.
5. Show one test and explain what incorrect behavior it prevents. Finish with your own contribution and its linked commit or PR.

The seeded calendar contains existing reservations. If a selected range is unavailable, choose another future range. Restart the server to restore the initial demo data.

## 3. Explain the checks

Run `dotnet build -warnaserror` and `dotnet test`. Tests cover API validation, pricing, state transitions, search, headers and other contracts. Browser evidence is in [the visual refresh report](SCRUM18_REFRESH.md); those reports describe the revision at which they were captured.

This review passed **78 tests** and built with **0 warnings and 0 errors**. [Build log](../output/professor-review/build.txt) · [Test log](../output/professor-review/tests.txt). Five new cases cover revalidation/HTTP 304 for CSS, JavaScript and SVG, clock changes, and reset-safe uptime. No frontend behavior or API JSON contract was changed in this review.

Two small reliability improvements are easy to explain:

- **Updates appear correctly:** CSS, JavaScript and SVG filenames are not content-hashed, so browsers revalidate them rather than keeping an older version for an hour. Unchanged files still use ETags and HTTP 304. [Implementation](../Program.cs) · [conditional-request tests](../tests/StayHubApi.Tests/SecurityHeaderTests.cs).
- **Uptime stays accurate:** the store uses `TimeProvider` elapsed timestamps instead of subtracting wall-clock dates. Tests move the clock backwards and reset the demo without sleeping. [Implementation](../Services/MockDataStore.cs) · [clock tests](../tests/StayHubApi.Tests/StoreClockTests.cs).

## Questions to be ready for

| Question | Answer |
| --- | --- |
| Why services instead of putting everything in controllers? | Business rules can be reused and tested separately from HTTP handling. |
| What prevents double booking? | Availability is checked again while creating the reservation under the store's shared lock. |
| Why calculate the total on the server? | The browser can display a quote, but the server owns the pricing rules and accepted reservation total. |
| Is this production-ready? | It is a tested course demo. Persistent storage, authentication and a real payment provider are outside its scope. |
| What did each person contribute? | Show the README table and the original commit/PR evidence. Distinguish implementation from documentation and merging. |
