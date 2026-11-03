# Upgrade verification

Verified on 2026-11-03, Windows, .NET SDK 10.0.302, Node 24.15.0, Chrome headless, Lighthouse 13.6.0. The supplied brief remains [UPGRADE_PROMPT.md](../UPGRADE_PROMPT.md). No deployment was performed.

## Results

| Check | Measured result |
| --- | --- |
| Build with warnings as errors | 0 warnings, 0 errors |
| xUnit unit and integration tests | 73 passed, 0 failed, 0 skipped |
| OpenAPI | 21 paths, 27 operations, 38 schemas; path/operation verifier passes |
| Lighthouse desktop | Performance 100, Accessibility 100, Best Practices 100, SEO 100 |
| axe WCAG 2 A/AA, 2.1 AA, 2.2 AA | 60 captures, 0 violations, including 0 critical and serious |
| Browser exceptions | 0 |
| External HTTP requests | 0 |
| Horizontal overflow | 0 across the 60 captured states |
| Seven-night booking | Base 665.00, discount 66.50, fees/tax 48.25, total EUR 646.75 |
| Double confirmation | Exactly one additional reservation |

The Lighthouse result is one measured desktop run, not a guarantee for every device. Axe checks do not substitute for a full assistive-technology audit. Keyboard checks cover the skip link, calendar, native dialog, message composer and focus restoration.

## Evidence

- [Supplemental interactions](../output/playwright/interaction-check.json): empty Saved, Tab navigation, dirty-close confirmation, zoom, CPU throttle and Swagger execution.
- [Browser report](../output/playwright/browser-audit.json): each capture's axe findings, overflow result and journey assertions.
- [Lighthouse HTML](../output/playwright/lighthouse-desktop.report.html), [Lighthouse JSON](../output/playwright/lighthouse-desktop.report.json).
- [Screenshot directory](../output/playwright): Explore, Stay, Booking, Trips, Saved and Hosts at 1440, 1024, 768 and 375 widths, both light and dark. Eight routes also captured at 320px with reduced motion, plus booking details, review, confirmation and chat.
- [Booking GIF](../output/playwright/booking-flow.gif): four actual captured steps, displayed as an animation. This is a sequence of still captures, not a continuous screen recording.
- [Default rate-limit check](../output/playwright/rate-limit.json): 120 successful reads, 429 on read 121, Retry-After present, CSS still 200.
- Final test TRX: `tests/StayHubApi.Tests/TestResults/verification-final.trx` (ignored build evidence, recreated by the command below).
- [File-by-file change list](CHANGELOG_FILES.md).

## Commands and output tails

```powershell
dotnet restore
dotnet build -warnaserror
dotnet test --no-build --logger 'trx;LogFileName=verification-final.trx'
dotnet run --launch-profile dev --no-build
python scripts/generate-openapi.py
.\scripts\verify-openapi.ps1
```

```text
Build succeeded.
    0 Warning(s)
    0 Error(s)
Passed! - Failed: 0, Passed: 73, Skipped: 0, Total: 73
Now listening on: http://localhost:5047
Wrote docs/openapi.yaml: 21 paths, 27 operations, 38 schemas
Runtime: 21 paths, 27 operations
Spec:    21 paths, 27 operations
PASS: the spec matches the running API.
```

Lighthouse is an optional QA tool. It is never imported by the app:

```powershell
New-Item -ItemType Directory -Force output/playwright
npx --yes --package lighthouse lighthouse http://localhost:5047/ --preset=desktop `
  --chrome-flags='--headless=new' --output=json --output=html `
  --output-path=./output/playwright/lighthouse-desktop --quiet
```

The browser audit uses optional Playwright and axe packages installed outside the repository. The app still requires only `dotnet run`, with no JavaScript build or package installation:

```powershell
$qaTools = Join-Path $env:TEMP 'fatihomes-qa-tools'
npm install --prefix $qaTools --no-save playwright axe-core
$modulePath = Join-Path $qaTools 'node_modules/playwright/index.mjs'
$env:FH_PLAYWRIGHT_MODULE = ([Uri]$modulePath).AbsoluteUri
$env:FH_AXE_SOURCE = Join-Path $qaTools 'node_modules/axe-core/axe.min.js'
Start-Process 'C:/Program Files/Google/Chrome/Application/chrome.exe' -WindowStyle Hidden `
  -ArgumentList '--headless=new','--remote-debugging-port=9222',"--user-data-dir=$env:TEMP/fatihomes-qa"

# Use a fresh dev process with raised limits for the large screenshot batch only:
dotnet run --launch-profile dev --no-build -- `
  --RateLimiting:ApiRequestsPerMinute=100000 `
  --RateLimiting:WriteRequestsPerMinute=100000 `
  --RateLimiting:ReviewRequestsPerMinute=100000

# In another terminal:
node scripts/browser-audit.mjs
node scripts/interaction-check.mjs
```

The audit resets demo data before and after its journeys. The final run used the same packages already present in the local npm cache. Its summary was:

```text
reports: 60
violations: 0
overflows: 0
errors: []
externalRequests: []
Weekly booking: one reservation from double click, discount 66.5, total 646.75
```

No-inline audit (no matches):

```powershell
Get-ChildItem wwwroot -Recurse -File -Include *.html,*.css,*.js |
  Select-String -Pattern 'onclick=|onsubmit=|onchange=|oninput=|style=|googleapis|unsplash|confirm\(|alert\(|prompt\(|innerHTML|\.style\.'
git ls-files bin obj
```

## QA matrix

| # | Brief check | Result and evidence |
| --- | --- | --- |
| 1 | Cold desktop load | Pass: Explore capture, CLS 0.002 in Lighthouse |
| 2 | 320px | Pass: eight routes, no overflow; native mobile booking captured at 375px |
| 3 | Keyboard | Pass for skip link, calendar PageDown/Enter, message Enter, Escape and focus return; native dialog excludes background controls from Tab navigation; dirty-close Keep editing/Leave verified |
| 4 | Reduced motion | Eight 320px captures; zoom-equivalent 720px CSS viewport at 2x density also has no overflow; reduced-motion CSS disables view transitions, shimmer and reveals |
| 5 | Dark mode | Pass: 24 dark captures with axe contrast checks |
| 6 | Offline external network | Pass: fresh load while non-localhost networking is blocked; no external requests. Localhost remains available |
| 7 | Search prizren | Pass: two results |
| 8 | Date filters | Pass: `Search_DateRange_ExcludesBookedListing`, future suggestions in search form |
| 9 | Deep link | Pass: cold Stay and Host routes throughout matrix |
| 10 | Calendar month navigation | Pass: asynchronously loaded next month retains focus; arrows and previous/next controls implemented |
| 11 | One-night booking | Pass: inline two-night minimum error, Continue disabled |
| 12 | Booked range | Pass: inline conflict, Continue disabled |
| 13 | Seven nights | Pass: EUR 66.50 discount, EUR 646.75 stored total; quote parity covered by integration test |
| 14 | Double click | Pass: two clicks produce exactly one reservation |
| 15 | Cancellation | Pass: reason dialog updates Trips; past cancellation rejected in integration test |
| 16 | Illegal status | Pass: `Status_IllegalTransition_Returns409`, allowed transitions included |
| 17 | Empty Saved | Pass: supplied empty copy and Browse stays action verified and captured |
| 18 | Saved after filtering | Pass: newly saved Prizren stay survives a cabin filter excluding it |
| 19 | One-star review | Pass: API accepts it and the Stay view displays it |
| 20 | XSS review | Pass: image/onerror payload appears as literal text, no script execution |
| 21 | Rate limit | Pass: 120 reads, read 121 returns 429 with Retry-After, CSS remains 200; separate integration test also covers static exemptions |
| 22 | Headers | Pass: strict app CSP, Swagger policy separate; errors retain security headers |
| 23 | Swagger | Pass: runtime document, 27 operations, Try it out on health executes and displays HTTP 200 |
| 24 | Lighthouse desktop | Pass: 100 / 100 / 100 / 100 |
| 25 | axe | Pass: zero violations across 60 captured states |

## Failures encountered and resolved

- First Lighthouse run: performance 84, CLS 0.325. Reserving the main viewport space and preloading the hero reduced CLS to 0.002 and produced performance 100.
- Initial axe matrix: serious `link-name` on the footer brand when mobile CSS hides the wordmark. Added an explicit accessible name. Final matrix has zero violations.
- Host detail overflowed at 320px. Its header now stacks vertically; final matrix has no overflow.
- Initial browser harness selected only the desktop Reserve control and reused same-hash state. It now handles mobile Reserve, cold-loads each capture and uses bounded waits. Supplemental repeated runs hit the normal write budget until the documented raised-limit QA process was used; the final run passed.
- `playwright-cli open`: `ENOENT` creating the daemon directory under `ms-playwright/daemon`. Browser QA used the installed Playwright library over Chrome DevTools Protocol instead.
- An old dev process held the executable and port 5047. The attempted launch reported `Failed to bind ... address already in use`; the attempted rebuild reported `MSB3027` / `MSB3021`. Stopping only the verified project process fixed both; final build has zero warnings.
- The Creative Studio quality wrapper ran passing build/tests but reported `Project inputs changed during verification`. Direct final commands and their artifacts are the verification authority; no wrapper proof gate is claimed.

## Environment limitation

`dotnet run --launch-profile prod --no-build` could not bind port 5000: `Failed to bind to address http://127.0.0.1:5000: address already in use`. `netstat` and process inspection identify Logitech G HUB's `CS_GO_Arx_Applet.exe`, PID 2888, as the listener. It was left running. No ports were changed. `Production_DisablesResetAndKeepsHealthAndHeaders` verifies production behavior in an isolated in-process host. No GitHub Actions run or deployment is claimed.
