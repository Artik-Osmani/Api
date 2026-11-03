# File-by-file upgrade changes

Compared with pre-upgrade commit `5080a85`. The initial implementation is commit `d057351`; final verification repairs are commit `b95d3d0` on `upgrade/ui`. Each row describes one added, modified or removed file. Build artefacts appear only as removed entries.

| Change | File | Purpose |
| --- | --- | --- |
| A | [.editorconfig](../.editorconfig) | Project configuration, documentation or repository hygiene for the upgrade. |
| A | [.gitattributes](../.gitattributes) | Keeps source files LF and binary assets unmodified. |
| A | [.github/workflows/ci.yml](../.github/workflows/ci.yml) | Project configuration, documentation or repository hygiene for the upgrade. |
| A | [.gitignore](../.gitignore) | Project configuration, documentation or repository hygiene for the upgrade. |
| M | [Controllers/FavoritesController.cs](../Controllers/FavoritesController.cs) | Documented controller routes and typed success/error responses. |
| M | [Controllers/HostsController.cs](../Controllers/HostsController.cs) | Documented controller routes and typed success/error responses. |
| M | [Controllers/ListingsController.cs](../Controllers/ListingsController.cs) | Documented controller routes and typed success/error responses. |
| M | [Controllers/ReservationsController.cs](../Controllers/ReservationsController.cs) | Documented controller routes and typed success/error responses. |
| M | [Controllers/SystemController.cs](../Controllers/SystemController.cs) | Documented controller routes and typed success/error responses. |
| A | [LICENSE](../LICENSE) | Project configuration, documentation or repository hygiene for the upgrade. |
| M | [Middleware/ExceptionHandlingMiddleware.cs](../Middleware/ExceptionHandlingMiddleware.cs) | Maps intentional exceptions and safe generic failures. |
| M | [Middleware/RateLimitMiddleware.cs](../Middleware/RateLimitMiddleware.cs) | API-only windows, write/review budgets, Retry-After and stale entry eviction. |
| M | [Middleware/SecurityHeadersMiddleware.cs](../Middleware/SecurityHeadersMiddleware.cs) | Strict app CSP, separate Swagger CSP and headers retained on errors. |
| A | [Middleware/UnifiedErrorResultFilter.cs](../Middleware/UnifiedErrorResultFilter.cs) | Maps MVC ProblemDetails to ApiError. |
| A | [Models/ApiError.cs](../Models/ApiError.cs) | One traceable error envelope and stable codes. |
| M | [Models/RentalModels.cs](../Models/RentalModels.cs) | Public requests/responses, bounded validation, pricing, hosts, availability and reservation state. |
| M | [Program.cs](../Program.cs) | Registers services, trimmed JSON validation, unified errors, configured CORS, compression and pipeline. |
| M | [README.md](../README.md) | Updated quick start, code map, endpoint matrix, evidence and review guidance. |
| A | [Services/ApiException.cs](../Services/ApiException.cs) | Project configuration, documentation or repository hygiene for the upgrade. |
| A | [Services/AppInfo.cs](../Services/AppInfo.cs) | Project configuration, documentation or repository hygiene for the upgrade. |
| A | [Services/CatalogRules.cs](../Services/CatalogRules.cs) | Catalogue validation, finite coordinates, geography, fee bounds and local image paths. |
| A | [Services/CatalogService.cs](../Services/CatalogService.cs) | Validated listing CRUD, atomic rejected updates, safe availability and review recomputation. |
| A | [Services/FavoriteService.cs](../Services/FavoriteService.cs) | Project configuration, documentation or repository hygiene for the upgrade. |
| A | [Services/HostService.cs](../Services/HostService.cs) | Project configuration, documentation or repository hygiene for the upgrade. |
| A | [Services/ListingSearchService.cs](../Services/ListingSearchService.cs) | All advertised filters, geography, sorting and pagination. |
| M | [Services/MockDataStore.cs](../Services/MockDataStore.cs) | Retains the required store name and serializes access under one lock. |
| A | [Services/PricingCalculator.cs](../Services/PricingCalculator.cs) | Shared rounded EUR quote calculation and discounts. |
| A | [Services/RateLimitOptions.cs](../Services/RateLimitOptions.cs) | Project configuration, documentation or repository hygiene for the upgrade. |
| A | [Services/ReservationRules.cs](../Services/ReservationRules.cs) | Overlap, transition and cancellation rules. |
| A | [Services/ReservationService.cs](../Services/ReservationService.cs) | Atomic booking creation, quote, status, cancellation and messages. |
| A | [Services/SeedData.cs](../Services/SeedData.cs) | Deterministic regional catalogue, relative-date reservations and honest ratings. |
| A | [Services/TrimmedStringConverter.cs](../Services/TrimmedStringConverter.cs) | Trims JSON strings before nested model validation. |
| A | [Services/ValidationFormatter.cs](../Services/ValidationFormatter.cs) | Project configuration, documentation or repository hygiene for the upgrade. |
| M | [StayHubApi.csproj](../StayHubApi.csproj) | Project configuration, documentation or repository hygiene for the upgrade. |
| M | [StayHubApi.http](../StayHubApi.http) | Project configuration, documentation or repository hygiene for the upgrade. |
| A | [StayHubApi.sln](../StayHubApi.sln) | Project configuration, documentation or repository hygiene for the upgrade. |
| A | [UPGRADE_PROMPT.md](../UPGRADE_PROMPT.md) | Project configuration, documentation or repository hygiene for the upgrade. |
| M | [appsettings.Development.json](../appsettings.Development.json) | Project configuration, documentation or repository hygiene for the upgrade. |
| M | [appsettings.Production.json](../appsettings.Production.json) | Project configuration, documentation or repository hygiene for the upgrade. |
| A | [appsettings.Testing.json](../appsettings.Testing.json) | Project configuration, documentation or repository hygiene for the upgrade. |
| M | [appsettings.json](../appsettings.json) | Project configuration, documentation or repository hygiene for the upgrade. |
| D | `bin/Debug/net10.0/Microsoft.OpenApi.dll` | Removes generated build output from version control. |
| D | `bin/Debug/net10.0/StayHubApi.deps.json` | Removes generated build output from version control. |
| D | `bin/Debug/net10.0/StayHubApi.dll` | Removes generated build output from version control. |
| D | `bin/Debug/net10.0/StayHubApi.exe` | Removes generated build output from version control. |
| D | `bin/Debug/net10.0/StayHubApi.pdb` | Removes generated build output from version control. |
| D | `bin/Debug/net10.0/StayHubApi.runtimeconfig.json` | Removes generated build output from version control. |
| D | `bin/Debug/net10.0/StayHubApi.staticwebassets.endpoints.json` | Removes generated build output from version control. |
| D | `bin/Debug/net10.0/StayHubApi.staticwebassets.runtime.json` | Removes generated build output from version control. |
| D | `bin/Debug/net10.0/StayHubApi.xml` | Removes generated build output from version control. |
| D | `bin/Debug/net10.0/Swashbuckle.AspNetCore.Swagger.dll` | Removes generated build output from version control. |
| D | `bin/Debug/net10.0/Swashbuckle.AspNetCore.SwaggerGen.dll` | Removes generated build output from version control. |
| D | `bin/Debug/net10.0/Swashbuckle.AspNetCore.SwaggerUI.dll` | Removes generated build output from version control. |
| D | `bin/Debug/net10.0/appsettings.Development.json` | Removes generated build output from version control. |
| D | `bin/Debug/net10.0/appsettings.Production.json` | Removes generated build output from version control. |
| D | `bin/Debug/net10.0/appsettings.json` | Removes generated build output from version control. |
| A | [docs/CHANGELOG_FILES.md](../docs/CHANGELOG_FILES.md) | This file-by-file change index. |
| A | [docs/FONT_LICENSES.md](../docs/FONT_LICENSES.md) | Course, contract, seed, credit or verification documentation. |
| A | [docs/IMAGE_CREDITS.md](../docs/IMAGE_CREDITS.md) | Course, contract, seed, credit or verification documentation. |
| A | [docs/SEED_IDS.md](../docs/SEED_IDS.md) | Course, contract, seed, credit or verification documentation. |
| A | [docs/VERIFICATION.md](../docs/VERIFICATION.md) | Measured outcomes, commands, all 25 QA rows and environment limitations. |
| R100 | [docs/course/UshtrimiAdili.md](../docs/course/UshtrimiAdili.md) | Course, contract, seed, credit or verification documentation. |
| M | [docs/openapi.yaml](../docs/openapi.yaml) | Course, contract, seed, credit or verification documentation. |
| A | [docs/screenshots/booking-confirmed.png](../docs/screenshots/booking-confirmed.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/booking-conflict.png](../docs/screenshots/booking-conflict.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/booking-mobile.png](../docs/screenshots/booking-mobile.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/booking-step1.png](../docs/screenshots/booking-step1.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/chat-1440.png](../docs/screenshots/chat-1440.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/contact-1440.png](../docs/screenshots/contact-1440.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/contact-375.png](../docs/screenshots/contact-375.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/explore-1024.png](../docs/screenshots/explore-1024.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/explore-1440.png](../docs/screenshots/explore-1440.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/explore-320.png](../docs/screenshots/explore-320.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/explore-375.png](../docs/screenshots/explore-375.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/explore-768.png](../docs/screenshots/explore-768.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/explore-dark-1440.png](../docs/screenshots/explore-dark-1440.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/explore-filtered-1440.png](../docs/screenshots/explore-filtered-1440.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/explore-sorted-1440.png](../docs/screenshots/explore-sorted-1440.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/host-detail-1440.png](../docs/screenshots/host-detail-1440.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/hosts-1440.png](../docs/screenshots/hosts-1440.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/hosts-375.png](../docs/screenshots/hosts-375.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/notfound-1440.png](../docs/screenshots/notfound-1440.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/saved-1440.png](../docs/screenshots/saved-1440.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/saved-375.png](../docs/screenshots/saved-375.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/search-mobile.png](../docs/screenshots/search-mobile.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/stay-320.png](../docs/screenshots/stay-320.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/stay-375.png](../docs/screenshots/stay-375.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/stay-dark-1440.png](../docs/screenshots/stay-dark-1440.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/stay-full-1440.png](../docs/screenshots/stay-full-1440.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/trips-1440.png](../docs/screenshots/trips-1440.png) | Initial upgrade screenshot evidence, retained for comparison. |
| A | [docs/screenshots/trips-375.png](../docs/screenshots/trips-375.png) | Initial upgrade screenshot evidence, retained for comparison. |
| D | `obj/Debug/net10.0/.NETCoreApp,Version=v10.0.AssemblyAttributes.cs` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/StayHubApi.AssemblyInfo.cs` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/StayHubApi.AssemblyInfoInputs.cache` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/StayHubApi.GeneratedMSBuildEditorConfig.editorconfig` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/StayHubApi.GlobalUsings.g.cs` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/StayHubApi.MvcApplicationPartsAssemblyInfo.cache` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/StayHubApi.MvcApplicationPartsAssemblyInfo.cs` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/StayHubApi.assets.cache` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/StayHubApi.csproj.AssemblyReference.cache` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/StayHubApi.csproj.CoreCompileInputs.cache` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/StayHubApi.csproj.FileListAbsolute.txt` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/StayHubApi.csproj.Up2Date` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/StayHubApi.dll` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/StayHubApi.genruntimeconfig.cache` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/StayHubApi.pdb` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/StayHubApi.sourcelink.json` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/StayHubApi.xml` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/apphost.exe` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/compressed/ailjtxhd45-{0}-ywbun7zm7o-ywbun7zm7o.gz` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/compressed/i05tib9chz-{0}-h1ubvzhgzn-h1ubvzhgzn.gz` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/compressed/i05tib9chz-{0}-z91y9gv8vd-z91y9gv8vd.gz` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/compressed/mwid9xciob-{0}-04qiza6u0l-04qiza6u0l.gz` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/compressed/mwid9xciob-{0}-3zlp10nw5a-3zlp10nw5a.gz` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/compressed/srg99foq37-{0}-5ojdtirekn-5ojdtirekn.gz` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/compressed/srg99foq37-{0}-uesp1jmp4i-uesp1jmp4i.gz` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/compressed/tv4lcr1yhu-{0}-9gqn24whlb-9gqn24whlb.gz` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/compressed/tv4lcr1yhu-{0}-s2e6pdqk8u-s2e6pdqk8u.gz` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/rbcswa.dswa.cache.json` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/ref/StayHubApi.dll` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/refint/StayHubApi.dll` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/rjimswa.dswa.cache.json` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/rjsmcshtml.dswa.cache.json` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/rjsmrazor.dswa.cache.json` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/rpswa.dswa.cache.json` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/staticwebassets.build.endpoints.json` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/staticwebassets.build.json` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/staticwebassets.build.json.cache` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/staticwebassets.development.json` | Removes generated build output from version control. |
| D | `obj/Debug/net10.0/swae.build.ex.cache` | Removes generated build output from version control. |
| D | `obj/StayHubApi.csproj.nuget.dgspec.json` | Removes generated build output from version control. |
| D | `obj/StayHubApi.csproj.nuget.g.props` | Removes generated build output from version control. |
| D | `obj/StayHubApi.csproj.nuget.g.targets` | Removes generated build output from version control. |
| D | `obj/project.assets.json` | Removes generated build output from version control. |
| D | `obj/project.nuget.cache` | Removes generated build output from version control. |
| A | [output/playwright/booking-confirmed-weekly.png](../output/playwright/booking-confirmed-weekly.png) | Captured browser state for the final verification. |
| A | [output/playwright/booking-dark-1024.png](../output/playwright/booking-dark-1024.png) | Captured browser state for the final verification. |
| A | [output/playwright/booking-dark-1440.png](../output/playwright/booking-dark-1440.png) | Captured browser state for the final verification. |
| A | [output/playwright/booking-dark-375.png](../output/playwright/booking-dark-375.png) | Captured browser state for the final verification. |
| A | [output/playwright/booking-dark-768.png](../output/playwright/booking-dark-768.png) | Captured browser state for the final verification. |
| A | [output/playwright/booking-flow.gif](../output/playwright/booking-flow.gif) | Animated walkthrough assembled from captured booking steps. |
| A | [output/playwright/booking-guest-details.png](../output/playwright/booking-guest-details.png) | Captured browser state for the final verification. |
| A | [output/playwright/booking-light-1024.png](../output/playwright/booking-light-1024.png) | Captured browser state for the final verification. |
| A | [output/playwright/booking-light-1440.png](../output/playwright/booking-light-1440.png) | Captured browser state for the final verification. |
| A | [output/playwright/booking-light-375.png](../output/playwright/booking-light-375.png) | Captured browser state for the final verification. |
| A | [output/playwright/booking-light-768.png](../output/playwright/booking-light-768.png) | Captured browser state for the final verification. |
| A | [output/playwright/booking-review-weekly.png](../output/playwright/booking-review-weekly.png) | Captured browser state for the final verification. |
| A | [output/playwright/browser-audit.json](../output/playwright/browser-audit.json) | Machine-readable verification evidence or rendered audit report. |
| A | [output/playwright/chat-keyboard.png](../output/playwright/chat-keyboard.png) | Captured browser state for the final verification. |
| A | [output/playwright/contact-reduced-320.png](../output/playwright/contact-reduced-320.png) | Captured browser state for the final verification. |
| A | [output/playwright/explore-200-percent.png](../output/playwright/explore-200-percent.png) | Captured browser state for the final verification. |
| A | [output/playwright/explore-dark-1024.png](../output/playwright/explore-dark-1024.png) | Captured browser state for the final verification. |
| A | [output/playwright/explore-dark-1440.png](../output/playwright/explore-dark-1440.png) | Captured browser state for the final verification. |
| A | [output/playwright/explore-dark-375.png](../output/playwright/explore-dark-375.png) | Captured browser state for the final verification. |
| A | [output/playwright/explore-dark-768.png](../output/playwright/explore-dark-768.png) | Captured browser state for the final verification. |
| A | [output/playwright/explore-light-1024.png](../output/playwright/explore-light-1024.png) | Captured browser state for the final verification. |
| A | [output/playwright/explore-light-1440.png](../output/playwright/explore-light-1440.png) | Captured browser state for the final verification. |
| A | [output/playwright/explore-light-375.png](../output/playwright/explore-light-375.png) | Captured browser state for the final verification. |
| A | [output/playwright/explore-light-768.png](../output/playwright/explore-light-768.png) | Captured browser state for the final verification. |
| A | [output/playwright/explore-reduced-320.png](../output/playwright/explore-reduced-320.png) | Captured browser state for the final verification. |
| A | [output/playwright/host-reduced-320.png](../output/playwright/host-reduced-320.png) | Captured browser state for the final verification. |
| A | [output/playwright/hosts-dark-1024.png](../output/playwright/hosts-dark-1024.png) | Captured browser state for the final verification. |
| A | [output/playwright/hosts-dark-1440.png](../output/playwright/hosts-dark-1440.png) | Captured browser state for the final verification. |
| A | [output/playwright/hosts-dark-375.png](../output/playwright/hosts-dark-375.png) | Captured browser state for the final verification. |
| A | [output/playwright/hosts-dark-768.png](../output/playwright/hosts-dark-768.png) | Captured browser state for the final verification. |
| A | [output/playwright/hosts-light-1024.png](../output/playwright/hosts-light-1024.png) | Captured browser state for the final verification. |
| A | [output/playwright/hosts-light-1440.png](../output/playwright/hosts-light-1440.png) | Captured browser state for the final verification. |
| A | [output/playwright/hosts-light-375.png](../output/playwright/hosts-light-375.png) | Captured browser state for the final verification. |
| A | [output/playwright/hosts-light-768.png](../output/playwright/hosts-light-768.png) | Captured browser state for the final verification. |
| A | [output/playwright/hosts-reduced-320.png](../output/playwright/hosts-reduced-320.png) | Captured browser state for the final verification. |
| A | [output/playwright/interaction-check.json](../output/playwright/interaction-check.json) | Machine-readable verification evidence or rendered audit report. |
| A | [output/playwright/lighthouse-desktop.report.html](../output/playwright/lighthouse-desktop.report.html) | Machine-readable verification evidence or rendered audit report. |
| A | [output/playwright/lighthouse-desktop.report.json](../output/playwright/lighthouse-desktop.report.json) | Machine-readable verification evidence or rendered audit report. |
| A | [output/playwright/notfound-reduced-320.png](../output/playwright/notfound-reduced-320.png) | Captured browser state for the final verification. |
| A | [output/playwright/rate-limit.json](../output/playwright/rate-limit.json) | Machine-readable verification evidence or rendered audit report. |
| A | [output/playwright/saved-dark-1024.png](../output/playwright/saved-dark-1024.png) | Captured browser state for the final verification. |
| A | [output/playwright/saved-dark-1440.png](../output/playwright/saved-dark-1440.png) | Captured browser state for the final verification. |
| A | [output/playwright/saved-dark-375.png](../output/playwright/saved-dark-375.png) | Captured browser state for the final verification. |
| A | [output/playwright/saved-dark-768.png](../output/playwright/saved-dark-768.png) | Captured browser state for the final verification. |
| A | [output/playwright/saved-empty.png](../output/playwright/saved-empty.png) | Captured browser state for the final verification. |
| A | [output/playwright/saved-light-1024.png](../output/playwright/saved-light-1024.png) | Captured browser state for the final verification. |
| A | [output/playwright/saved-light-1440.png](../output/playwright/saved-light-1440.png) | Captured browser state for the final verification. |
| A | [output/playwright/saved-light-375.png](../output/playwright/saved-light-375.png) | Captured browser state for the final verification. |
| A | [output/playwright/saved-light-768.png](../output/playwright/saved-light-768.png) | Captured browser state for the final verification. |
| A | [output/playwright/saved-reduced-320.png](../output/playwright/saved-reduced-320.png) | Captured browser state for the final verification. |
| A | [output/playwright/search-keyboard-320.png](../output/playwright/search-keyboard-320.png) | Captured browser state for the final verification. |
| A | [output/playwright/stay-dark-1024.png](../output/playwright/stay-dark-1024.png) | Captured browser state for the final verification. |
| A | [output/playwright/stay-dark-1440.png](../output/playwright/stay-dark-1440.png) | Captured browser state for the final verification. |
| A | [output/playwright/stay-dark-375.png](../output/playwright/stay-dark-375.png) | Captured browser state for the final verification. |
| A | [output/playwright/stay-dark-768.png](../output/playwright/stay-dark-768.png) | Captured browser state for the final verification. |
| A | [output/playwright/stay-light-1024.png](../output/playwright/stay-light-1024.png) | Captured browser state for the final verification. |
| A | [output/playwright/stay-light-1440.png](../output/playwright/stay-light-1440.png) | Captured browser state for the final verification. |
| A | [output/playwright/stay-light-375.png](../output/playwright/stay-light-375.png) | Captured browser state for the final verification. |
| A | [output/playwright/stay-light-768.png](../output/playwright/stay-light-768.png) | Captured browser state for the final verification. |
| A | [output/playwright/stay-reduced-320.png](../output/playwright/stay-reduced-320.png) | Captured browser state for the final verification. |
| A | [output/playwright/swagger-health-executed.png](../output/playwright/swagger-health-executed.png) | Captured browser state for the final verification. |
| A | [output/playwright/trips-dark-1024.png](../output/playwright/trips-dark-1024.png) | Captured browser state for the final verification. |
| A | [output/playwright/trips-dark-1440.png](../output/playwright/trips-dark-1440.png) | Captured browser state for the final verification. |
| A | [output/playwright/trips-dark-375.png](../output/playwright/trips-dark-375.png) | Captured browser state for the final verification. |
| A | [output/playwright/trips-dark-768.png](../output/playwright/trips-dark-768.png) | Captured browser state for the final verification. |
| A | [output/playwright/trips-light-1024.png](../output/playwright/trips-light-1024.png) | Captured browser state for the final verification. |
| A | [output/playwright/trips-light-1440.png](../output/playwright/trips-light-1440.png) | Captured browser state for the final verification. |
| A | [output/playwright/trips-light-375.png](../output/playwright/trips-light-375.png) | Captured browser state for the final verification. |
| A | [output/playwright/trips-light-768.png](../output/playwright/trips-light-768.png) | Captured browser state for the final verification. |
| A | [output/playwright/trips-reduced-320.png](../output/playwright/trips-reduced-320.png) | Captured browser state for the final verification. |
| M | [php/index.php](../php/index.php) | Project configuration, documentation or repository hygiene for the upgrade. |
| M | [read.md](../read.md) | Accurate shortened Albanian guide. |
| A | [scripts/booking-flow-check.mjs](../scripts/booking-flow-check.mjs) | Local development or verification helper. |
| A | [scripts/browser-audit.mjs](../scripts/browser-audit.mjs) | Repeatable 60-state axe, viewport, keyboard and booking journey audit. |
| A | [scripts/generate-openapi.py](../scripts/generate-openapi.py) | Local development or verification helper. |
| A | [scripts/interaction-check.mjs](../scripts/interaction-check.mjs) | Supplemental empty-state, modal, zoom, CPU and Swagger checks. |
| A | [scripts/ui-check.mjs](../scripts/ui-check.mjs) | Local development or verification helper. |
| A | [scripts/verify-openapi.ps1](../scripts/verify-openapi.ps1) | Local development or verification helper. |
| A | [tests/StayHubApi.Tests/ApiFactory.cs](../tests/StayHubApi.Tests/ApiFactory.cs) | Unit or WebApplicationFactory coverage for the corresponding contract. |
| A | [tests/StayHubApi.Tests/ApiTestBase.cs](../tests/StayHubApi.Tests/ApiTestBase.cs) | Unit or WebApplicationFactory coverage for the corresponding contract. |
| A | [tests/StayHubApi.Tests/AvailabilityTests.cs](../tests/StayHubApi.Tests/AvailabilityTests.cs) | Unit or WebApplicationFactory coverage for the corresponding contract. |
| A | [tests/StayHubApi.Tests/ContractRegressionTests.cs](../tests/StayHubApi.Tests/ContractRegressionTests.cs) | Unit or WebApplicationFactory coverage for the corresponding contract. |
| A | [tests/StayHubApi.Tests/FavoriteTests.cs](../tests/StayHubApi.Tests/FavoriteTests.cs) | Unit or WebApplicationFactory coverage for the corresponding contract. |
| A | [tests/StayHubApi.Tests/HostTests.cs](../tests/StayHubApi.Tests/HostTests.cs) | Unit or WebApplicationFactory coverage for the corresponding contract. |
| A | [tests/StayHubApi.Tests/PricingCalculatorTests.cs](../tests/StayHubApi.Tests/PricingCalculatorTests.cs) | Unit or WebApplicationFactory coverage for the corresponding contract. |
| A | [tests/StayHubApi.Tests/ProductionTests.cs](../tests/StayHubApi.Tests/ProductionTests.cs) | Unit or WebApplicationFactory coverage for the corresponding contract. |
| A | [tests/StayHubApi.Tests/RateLimitTests.cs](../tests/StayHubApi.Tests/RateLimitTests.cs) | Unit or WebApplicationFactory coverage for the corresponding contract. |
| A | [tests/StayHubApi.Tests/ReservationTests.cs](../tests/StayHubApi.Tests/ReservationTests.cs) | Unit or WebApplicationFactory coverage for the corresponding contract. |
| A | [tests/StayHubApi.Tests/ReviewTests.cs](../tests/StayHubApi.Tests/ReviewTests.cs) | Unit or WebApplicationFactory coverage for the corresponding contract. |
| A | [tests/StayHubApi.Tests/SearchTests.cs](../tests/StayHubApi.Tests/SearchTests.cs) | Unit or WebApplicationFactory coverage for the corresponding contract. |
| A | [tests/StayHubApi.Tests/SecurityHeaderTests.cs](../tests/StayHubApi.Tests/SecurityHeaderTests.cs) | Unit or WebApplicationFactory coverage for the corresponding contract. |
| A | [tests/StayHubApi.Tests/StayHubApi.Tests.csproj](../tests/StayHubApi.Tests/StayHubApi.Tests.csproj) | Unit or WebApplicationFactory coverage for the corresponding contract. |
| A | [tests/StayHubApi.Tests/SystemTests.cs](../tests/StayHubApi.Tests/SystemTests.cs) | Unit or WebApplicationFactory coverage for the corresponding contract. |
| D | `wwwroot/app.css` | Replaced by the modular implementation or retained under docs/course. |
| D | `wwwroot/app.js` | Replaced by the modular implementation or retained under docs/course. |
| A | [wwwroot/apple-touch-icon.png](../wwwroot/apple-touch-icon.png) | Project configuration, documentation or repository hygiene for the upgrade. |
| A | [wwwroot/css/base.css](../wwwroot/css/base.css) | Native layered CSS for the editorial interface, responsive layouts and themes. |
| A | [wwwroot/css/components.css](../wwwroot/css/components.css) | Native layered CSS for the editorial interface, responsive layouts and themes. |
| A | [wwwroot/css/layout.css](../wwwroot/css/layout.css) | Native layered CSS for the editorial interface, responsive layouts and themes. |
| A | [wwwroot/css/motion.css](../wwwroot/css/motion.css) | Native layered CSS for the editorial interface, responsive layouts and themes. |
| A | [wwwroot/css/pages.css](../wwwroot/css/pages.css) | Native layered CSS for the editorial interface, responsive layouts and themes. |
| A | [wwwroot/css/tokens.css](../wwwroot/css/tokens.css) | Native layered CSS for the editorial interface, responsive layouts and themes. |
| A | [wwwroot/favicon.ico](../wwwroot/favicon.ico) | Project configuration, documentation or repository hygiene for the upgrade. |
| A | [wwwroot/fonts/geist-400.woff2](../wwwroot/fonts/geist-400.woff2) | Self-hosted WOFF2 font for offline typography. |
| A | [wwwroot/fonts/geist-500.woff2](../wwwroot/fonts/geist-500.woff2) | Self-hosted WOFF2 font for offline typography. |
| A | [wwwroot/fonts/geist-600.woff2](../wwwroot/fonts/geist-600.woff2) | Self-hosted WOFF2 font for offline typography. |
| A | [wwwroot/fonts/geist-mono-500.woff2](../wwwroot/fonts/geist-mono-500.woff2) | Self-hosted WOFF2 font for offline typography. |
| A | [wwwroot/fonts/schibsted-grotesk-500.woff2](../wwwroot/fonts/schibsted-grotesk-500.woff2) | Self-hosted WOFF2 font for offline typography. |
| A | [wwwroot/fonts/schibsted-grotesk-700.woff2](../wwwroot/fonts/schibsted-grotesk-700.woff2) | Self-hosted WOFF2 font for offline typography. |
| A | [wwwroot/images/icons.svg](../wwwroot/images/icons.svg) | Local icon, brand or social-preview asset. |
| A | [wwwroot/images/logo-mark-512.png](../wwwroot/images/logo-mark-512.png) | Local icon, brand or social-preview asset. |
| M | [wwwroot/images/logo.svg](../wwwroot/images/logo.svg) | Local icon, brand or social-preview asset. |
| A | [wwwroot/images/og.webp](../wwwroot/images/og.webp) | Local icon, brand or social-preview asset. |
| A | [wwwroot/images/stays/berat-castle-room-1200.webp](../wwwroot/images/stays/berat-castle-room-1200.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/berat-castle-room-1600.webp](../wwwroot/images/stays/berat-castle-room-1600.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/berat-castle-room-800.webp](../wwwroot/images/stays/berat-castle-room-800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/berat-castle-room-d1.webp](../wwwroot/images/stays/berat-castle-room-d1.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/berat-castle-room-d2.webp](../wwwroot/images/stays/berat-castle-room-d2.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/berat-castle-room-p800.webp](../wwwroot/images/stays/berat-castle-room-p800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/berat-osum-house-1200.webp](../wwwroot/images/stays/berat-osum-house-1200.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/berat-osum-house-1600.webp](../wwwroot/images/stays/berat-osum-house-1600.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/berat-osum-house-800.webp](../wwwroot/images/stays/berat-osum-house-800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/berat-osum-house-d1.webp](../wwwroot/images/stays/berat-osum-house-d1.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/berat-osum-house-d2.webp](../wwwroot/images/stays/berat-osum-house-d2.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/berat-osum-house-p800.webp](../wwwroot/images/stays/berat-osum-house-p800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/brezovica-chalet-1200.webp](../wwwroot/images/stays/brezovica-chalet-1200.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/brezovica-chalet-1600.webp](../wwwroot/images/stays/brezovica-chalet-1600.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/brezovica-chalet-800.webp](../wwwroot/images/stays/brezovica-chalet-800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/brezovica-chalet-d1.webp](../wwwroot/images/stays/brezovica-chalet-d1.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/brezovica-chalet-d2.webp](../wwwroot/images/stays/brezovica-chalet-d2.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/brezovica-chalet-p800.webp](../wwwroot/images/stays/brezovica-chalet-p800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/brezovica-lodge-1200.webp](../wwwroot/images/stays/brezovica-lodge-1200.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/brezovica-lodge-1600.webp](../wwwroot/images/stays/brezovica-lodge-1600.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/brezovica-lodge-800.webp](../wwwroot/images/stays/brezovica-lodge-800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/brezovica-lodge-d1.webp](../wwwroot/images/stays/brezovica-lodge-d1.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/brezovica-lodge-d2.webp](../wwwroot/images/stays/brezovica-lodge-d2.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/brezovica-lodge-p800.webp](../wwwroot/images/stays/brezovica-lodge-p800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/dhermi-cliff-villa-1200.webp](../wwwroot/images/stays/dhermi-cliff-villa-1200.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/dhermi-cliff-villa-1600.webp](../wwwroot/images/stays/dhermi-cliff-villa-1600.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/dhermi-cliff-villa-800.webp](../wwwroot/images/stays/dhermi-cliff-villa-800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/dhermi-cliff-villa-d1.webp](../wwwroot/images/stays/dhermi-cliff-villa-d1.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/dhermi-cliff-villa-d2.webp](../wwwroot/images/stays/dhermi-cliff-villa-d2.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/dhermi-cliff-villa-p800.webp](../wwwroot/images/stays/dhermi-cliff-villa-p800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/dhermi-olive-house-1200.webp](../wwwroot/images/stays/dhermi-olive-house-1200.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/dhermi-olive-house-1600.webp](../wwwroot/images/stays/dhermi-olive-house-1600.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/dhermi-olive-house-800.webp](../wwwroot/images/stays/dhermi-olive-house-800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/dhermi-olive-house-d1.webp](../wwwroot/images/stays/dhermi-olive-house-d1.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/dhermi-olive-house-d2.webp](../wwwroot/images/stays/dhermi-olive-house-d2.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/dhermi-olive-house-p800.webp](../wwwroot/images/stays/dhermi-olive-house-p800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/gjakova-bazaar-house-1200.webp](../wwwroot/images/stays/gjakova-bazaar-house-1200.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/gjakova-bazaar-house-1600.webp](../wwwroot/images/stays/gjakova-bazaar-house-1600.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/gjakova-bazaar-house-800.webp](../wwwroot/images/stays/gjakova-bazaar-house-800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/gjakova-bazaar-house-d1.webp](../wwwroot/images/stays/gjakova-bazaar-house-d1.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/gjakova-bazaar-house-d2.webp](../wwwroot/images/stays/gjakova-bazaar-house-d2.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/gjakova-bazaar-house-p800.webp](../wwwroot/images/stays/gjakova-bazaar-house-p800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/gjakova-guesthouse-room-1200.webp](../wwwroot/images/stays/gjakova-guesthouse-room-1200.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/gjakova-guesthouse-room-1600.webp](../wwwroot/images/stays/gjakova-guesthouse-room-1600.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/gjakova-guesthouse-room-800.webp](../wwwroot/images/stays/gjakova-guesthouse-room-800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/gjakova-guesthouse-room-d1.webp](../wwwroot/images/stays/gjakova-guesthouse-room-d1.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/gjakova-guesthouse-room-d2.webp](../wwwroot/images/stays/gjakova-guesthouse-room-d2.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/gjakova-guesthouse-room-p800.webp](../wwwroot/images/stays/gjakova-guesthouse-room-p800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/hero-p1200.webp](../wwwroot/images/stays/hero-p1200.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/hero-p800.webp](../wwwroot/images/stays/hero-p800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/peja-river-house-1200.webp](../wwwroot/images/stays/peja-river-house-1200.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/peja-river-house-1600.webp](../wwwroot/images/stays/peja-river-house-1600.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/peja-river-house-800.webp](../wwwroot/images/stays/peja-river-house-800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/peja-river-house-d1.webp](../wwwroot/images/stays/peja-river-house-d1.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/peja-river-house-d2.webp](../wwwroot/images/stays/peja-river-house-d2.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/peja-river-house-p800.webp](../wwwroot/images/stays/peja-river-house-p800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/pristina-loft-1200.webp](../wwwroot/images/stays/pristina-loft-1200.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/pristina-loft-1600.webp](../wwwroot/images/stays/pristina-loft-1600.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/pristina-loft-800.webp](../wwwroot/images/stays/pristina-loft-800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/pristina-loft-d1.webp](../wwwroot/images/stays/pristina-loft-d1.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/pristina-loft-d2.webp](../wwwroot/images/stays/pristina-loft-d2.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/pristina-loft-p800.webp](../wwwroot/images/stays/pristina-loft-p800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/pristina-studio-1200.webp](../wwwroot/images/stays/pristina-studio-1200.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/pristina-studio-1600.webp](../wwwroot/images/stays/pristina-studio-1600.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/pristina-studio-800.webp](../wwwroot/images/stays/pristina-studio-800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/pristina-studio-d1.webp](../wwwroot/images/stays/pristina-studio-d1.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/pristina-studio-d2.webp](../wwwroot/images/stays/pristina-studio-d2.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/pristina-studio-p800.webp](../wwwroot/images/stays/pristina-studio-p800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/prizren-courtyard-room-1200.webp](../wwwroot/images/stays/prizren-courtyard-room-1200.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/prizren-courtyard-room-1600.webp](../wwwroot/images/stays/prizren-courtyard-room-1600.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/prizren-courtyard-room-800.webp](../wwwroot/images/stays/prizren-courtyard-room-800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/prizren-courtyard-room-d1.webp](../wwwroot/images/stays/prizren-courtyard-room-d1.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/prizren-courtyard-room-d2.webp](../wwwroot/images/stays/prizren-courtyard-room-d2.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/prizren-courtyard-room-p800.webp](../wwwroot/images/stays/prizren-courtyard-room-p800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/prizren-stone-house-1200.webp](../wwwroot/images/stays/prizren-stone-house-1200.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/prizren-stone-house-1600.webp](../wwwroot/images/stays/prizren-stone-house-1600.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/prizren-stone-house-800.webp](../wwwroot/images/stays/prizren-stone-house-800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/prizren-stone-house-d1.webp](../wwwroot/images/stays/prizren-stone-house-d1.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/prizren-stone-house-d2.webp](../wwwroot/images/stays/prizren-stone-house-d2.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/prizren-stone-house-p800.webp](../wwwroot/images/stays/prizren-stone-house-p800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/rugova-cabin-1200.webp](../wwwroot/images/stays/rugova-cabin-1200.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/rugova-cabin-1600.webp](../wwwroot/images/stays/rugova-cabin-1600.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/rugova-cabin-800.webp](../wwwroot/images/stays/rugova-cabin-800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/rugova-cabin-d1.webp](../wwwroot/images/stays/rugova-cabin-d1.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/rugova-cabin-d2.webp](../wwwroot/images/stays/rugova-cabin-d2.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/rugova-cabin-p800.webp](../wwwroot/images/stays/rugova-cabin-p800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/saranda-studio-1200.webp](../wwwroot/images/stays/saranda-studio-1200.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/saranda-studio-1600.webp](../wwwroot/images/stays/saranda-studio-1600.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/saranda-studio-800.webp](../wwwroot/images/stays/saranda-studio-800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/saranda-studio-d1.webp](../wwwroot/images/stays/saranda-studio-d1.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/saranda-studio-d2.webp](../wwwroot/images/stays/saranda-studio-d2.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/saranda-studio-p800.webp](../wwwroot/images/stays/saranda-studio-p800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/saranda-villa-1200.webp](../wwwroot/images/stays/saranda-villa-1200.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/saranda-villa-1600.webp](../wwwroot/images/stays/saranda-villa-1600.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/saranda-villa-800.webp](../wwwroot/images/stays/saranda-villa-800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/saranda-villa-d1.webp](../wwwroot/images/stays/saranda-villa-d1.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/saranda-villa-d2.webp](../wwwroot/images/stays/saranda-villa-d2.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/saranda-villa-p800.webp](../wwwroot/images/stays/saranda-villa-p800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/tirana-blloku-apartment-1200.webp](../wwwroot/images/stays/tirana-blloku-apartment-1200.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/tirana-blloku-apartment-1600.webp](../wwwroot/images/stays/tirana-blloku-apartment-1600.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/tirana-blloku-apartment-800.webp](../wwwroot/images/stays/tirana-blloku-apartment-800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/tirana-blloku-apartment-d1.webp](../wwwroot/images/stays/tirana-blloku-apartment-d1.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/tirana-blloku-apartment-d2.webp](../wwwroot/images/stays/tirana-blloku-apartment-d2.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/tirana-blloku-apartment-p800.webp](../wwwroot/images/stays/tirana-blloku-apartment-p800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/tirana-garden-suite-1200.webp](../wwwroot/images/stays/tirana-garden-suite-1200.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/tirana-garden-suite-1600.webp](../wwwroot/images/stays/tirana-garden-suite-1600.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/tirana-garden-suite-800.webp](../wwwroot/images/stays/tirana-garden-suite-800.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/tirana-garden-suite-d1.webp](../wwwroot/images/stays/tirana-garden-suite-d1.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/tirana-garden-suite-d2.webp](../wwwroot/images/stays/tirana-garden-suite-d2.webp) | Self-hosted licensed photo variant for offline rendering. |
| A | [wwwroot/images/stays/tirana-garden-suite-p800.webp](../wwwroot/images/stays/tirana-garden-suite-p800.webp) | Self-hosted licensed photo variant for offline rendering. |
| M | [wwwroot/index.html](../wwwroot/index.html) | Accessible native shell, local font/hero preloads and dialog templates. |
| A | [wwwroot/js/api.js](../wwwroot/js/api.js) | Native ES module for the named view or shared component. |
| A | [wwwroot/js/booking.js](../wwwroot/js/booking.js) | Native ES module for the named view or shared component. |
| A | [wwwroot/js/calendar.js](../wwwroot/js/calendar.js) | Availability calendar with asynchronous keyboard focus and bounded month navigation. |
| A | [wwwroot/js/cards.js](../wwwroot/js/cards.js) | Native ES module for the named view or shared component. |
| A | [wwwroot/js/chat.js](../wwwroot/js/chat.js) | Native ES module for the named view or shared component. |
| A | [wwwroot/js/dialog.js](../wwwroot/js/dialog.js) | Native ES module for the named view or shared component. |
| A | [wwwroot/js/dom.js](../wwwroot/js/dom.js) | Safe text/URL construction and local responsive images. |
| A | [wwwroot/js/format.js](../wwwroot/js/format.js) | Native ES module for the named view or shared component. |
| A | [wwwroot/js/icons.js](../wwwroot/js/icons.js) | Native ES module for the named view or shared component. |
| A | [wwwroot/js/main.js](../wwwroot/js/main.js) | Native ES module for the named view or shared component. |
| A | [wwwroot/js/motion.js](../wwwroot/js/motion.js) | Native reveal and shared-image transitions without inline styles. |
| A | [wwwroot/js/quote.js](../wwwroot/js/quote.js) | Native ES module for the named view or shared component. |
| A | [wwwroot/js/router.js](../wwwroot/js/router.js) | Hash routes, aliases, deep links, skip link, titles, focus and scroll restoration. |
| A | [wwwroot/js/store.js](../wwwroot/js/store.js) | Native ES module for the named view or shared component. |
| A | [wwwroot/js/ui.js](../wwwroot/js/ui.js) | Native ES module for the named view or shared component. |
| A | [wwwroot/js/views/contact.js](../wwwroot/js/views/contact.js) | Native ES module for the named view or shared component. |
| A | [wwwroot/js/views/explore.js](../wwwroot/js/views/explore.js) | Editorial hero, future date suggestions, search, category filters, sort and results. |
| A | [wwwroot/js/views/host.js](../wwwroot/js/views/host.js) | Native ES module for the named view or shared component. |
| A | [wwwroot/js/views/hosts.js](../wwwroot/js/views/hosts.js) | Native ES module for the named view or shared component. |
| A | [wwwroot/js/views/notfound.js](../wwwroot/js/views/notfound.js) | Native ES module for the named view or shared component. |
| A | [wwwroot/js/views/saved.js](../wwwroot/js/views/saved.js) | Native ES module for the named view or shared component. |
| A | [wwwroot/js/views/stay.js](../wwwroot/js/views/stay.js) | Gallery, server quote, minimum stay, calendar, reviews and native distribution bars. |
| A | [wwwroot/js/views/trips.js](../wwwroot/js/views/trips.js) | Native ES module for the named view or shared component. |
| A | [wwwroot/manifest.webmanifest](../wwwroot/manifest.webmanifest) | Project configuration, documentation or repository hygiene for the upgrade. |
| A | [wwwroot/robots.txt](../wwwroot/robots.txt) | Project configuration, documentation or repository hygiene for the upgrade. |
| M | [wwwroot/swagger-custom.css](../wwwroot/swagger-custom.css) | Project configuration, documentation or repository hygiene for the upgrade. |
| A | [output/playwright/restore.txt](../output/playwright/restore.txt) | Final command output or xUnit result evidence. |
| A | [output/playwright/build.txt](../output/playwright/build.txt) | Final command output or xUnit result evidence. |
| A | [output/playwright/tests.txt](../output/playwright/tests.txt) | Final command output or xUnit result evidence. |
| A | [output/playwright/verification-final.trx](../output/playwright/verification-final.trx) | Final command output or xUnit result evidence. |
