# FatiHomes / StayHub API

## Përshkrimi

FatiHomes është një katalog i vogël i shtëpive për qira afatshkurtër në Kosovë, Shqipëri dhe bregdet, me një API REST në .NET 10 dhe një klient web statik në HTML, CSS dhe JavaScript. Klienti shërbehet nga i njëjti proces, prandaj hapet vetëm një server.

Projekti është punë kursi. Të dhënat mbahen në memorie dhe rivendosen në çdo nisje. Nuk ka bazë të dhënash, autentikim, pagesa reale, email ose SMS. Këto janë vendime të qëllimshme për fushën e kursit, jo mangësi të fshehura.

## Çfarë përmban

Për kodin e menusë, hero-s, footer-it dhe API-së, përdor [hartën e shkurtër në README](README.md). Përmirësimi i fundit shton filtra të avancuar, zgjedhje sipas destinacionit, shfaqje graduale të rezultateve dhe animacione që respektojnë preferencën për lëvizje të reduktuar. [Rezultatet dhe provat e testimit](docs/UI_UX_V2_RESULTS.md).

- 18 shtëpi në 9 vende: Prishtinë, Prizren, Pejë, Gjakovë, Brezovicë, Tiranë, Berat, Sarandë dhe Dhërmi.
- 4 hostë me biografi, vite pritjeje dhe flamuj verifikimi.
- Kërkim me tekst, data, numër mysafirësh, kafshë, çmim, dhoma, komoditete, vlerësim, lagje, host, rreth gjeografik dhe poligon.
- Kuotim çmimi nga serveri, krijim rezervimi, makinë statusesh, anulim dhe fije mesazhesh.
- Listë e hostëve, verifikimi i tyre dhe shtëpitë e secilit host.
- Të preferuarat, vlerësimet dhe statistikat me totalet e grupuara sipas monedhës.
- Klient me pesë pamje kryesore, faqe detaji, faqe hosti, faqe 404, modalitet të errët dhe mbështetje për tastierë.

## Teknologjitë

| Shtresa | Teknologjia |
| :--- | :--- |
| Backend | .NET 10, ASP.NET Core, controllers |
| Dokumentacioni | Swashbuckle 10.2.3, Swagger UI, komente XML |
| Frontend | HTML, CSS dhe JavaScript me module ES, pa framework dhe pa build |
| Të dhënat | `MockDataStore`, lista në memorie me `lock` |
| Testet | xUnit, `WebApplicationFactory`, 73 teste |
| Fontet | Schibsted Grotesk, Geist dhe Geist Mono, të vetëhostuara |
| Fotot | WebP lokale në `wwwroot/images/stays`, pa lidhje të jashtme |

## Si të ekzekutohet

Kërkohet .NET 10 SDK. Kontrollo me `dotnet --list-sdks`.

```powershell
dotnet run
```

Profili i parë në `Properties/launchSettings.json` është `dev`, prandaj aplikacioni hapet në:

- Web: <http://localhost:5047/>
- Swagger: <http://localhost:5047/swagger>
- Shëndeti i API-t: <http://localhost:5047/v1/system/health>

Për profilin `prod`, me portin 5000:

```powershell
.\run-prod.ps1
```

Të dhënat rivendosen me `POST /v1/system/reset`, vetëm në Development ose kur `DemoMode:ResetOnStart` është `true`.

## Struktura

```text
Controllers/        Listings, Reservations, Hosts, Favorites, System
Middleware/         gabimet, header-at e sigurisë, kufizimi i kërkesave
Models/             ApiError dhe të gjitha kontratat JSON
Services/           çmimet, rregullat, kërkimi, seed data dhe magazina
wwwroot/            index.html, css/, js/, fonts/, images/
tests/              73 teste integrimi dhe njësi
scripts/            verifikimi i OpenAPI, generatori, kontrollet e browserit
docs/               openapi.yaml, SEED_IDS.md, IMAGE_CREDITS.md, screenshots/
php/                punë e vjetër e modulit PHP, nuk përdoret nga aplikacioni
```

## API

Të gjitha rrugët janë nën `/v1` dhe kthejnë JSON. Janë 21 rrugë dhe 27 operacione. Dokumenti i plotë është në [docs/openapi.yaml](docs/openapi.yaml) dhe në `/swagger`.

| Grupi | Rrugët kryesore |
| :--- | :--- |
| Shtëpitë | `GET /v1/listings`, `POST /v1/listings/search`, `GET/POST/PUT/DELETE /v1/listings/{id}`, availability, reviews |
| Rezervimet | `GET /v1/reservations`, `POST /v1/reservations/quote`, `POST /v1/reservations`, statusi, anulimi, mesazhet |
| Hostët | `GET /v1/hosts`, `GET /v1/hosts/{id}`, listings dhe verification |
| Të preferuarat | `GET /v1/favorites`, `POST /v1/favorites/{listingId}` |
| Sistemi | `GET /v1/system/health`, stats, stage, `POST /v1/system/reset` |

Çdo gabim kthen të njëjtin format:

```json
{
  "code": "MIN_STAY_NOT_MET",
  "message": "This stay needs at least 3 nights.",
  "traceId": "0HN7...:00000001",
  "fieldErrors": { "checkOutDate": ["This stay needs at least 3 nights."] },
  "details": null
}
```

Kodet kryesore: `VALIDATION_FAILED`, `RESOURCE_NOT_FOUND`, `BOOKING_CONFLICT`, `INVALID_STATUS_TRANSITION`, `MIN_STAY_NOT_MET`, `DATE_ORDER`, `DATE_IN_PAST`, `STAY_TOO_LONG`, `CAPACITY_EXCEEDED`, `CANCELLATION_NOT_ALLOWED`, `LISTING_HAS_ACTIVE_RESERVATIONS`, `RATE_LIMIT_EXCEEDED`, `INVALID_SORT`, `INTERNAL_SERVER_ERROR`.

## Çmimet

Llogaritja bëhet vetëm në `Services/PricingCalculator.cs` dhe përdoret nga kuotimi, krijimi dhe seed data.

```text
nëse netët >= 30, zbritja mujore fiton
nëse netët >= 7, zbritja javore
totali = baza - zbritja + pastrimi + shërbimi + taksa
depozita raportohet, nuk i shtohet totalit
```

Shembull për shtëpinë 1: 6 netë me 95.00 = 570.00, pastrim 30.00, shërbim 14.25, taksë 4.00, total 618.25. Depozita prej 100.00 mbahet dhe nuk faturohet.

## Testet dhe verifikimi

```powershell
dotnet build -warnaserror
dotnet test
.\scripts\verify-openapi.ps1
```

Testet mbulojnë kërkimin, kuotimin dhe barazinë me krijimin, datat e kaluara, qëndrimin minimal, mbivendosjen, makinën e statuseve, availability, vlerësimet, të preferuarat, hostët, statistikat, CSP-në dhe kufizimin e kërkesave. Të gjitha kalojnë.

Kontrolli i browserit ruhet në `docs/screenshots/` dhe përdor `scripts/ui-check.mjs` për pamje dhe gabime në konsolë, si dhe `scripts/booking-flow-check.mjs` për rezervimin nga fillimi në fund.

Rezultatet, komandat dhe matrica e plotë: [docs/VERIFICATION.md](docs/VERIFICATION.md). Pamjet dhe GIF-i: [output/playwright](output/playwright). Vargjet JSON shkurtohen para validimit, gabimet 404/405 përdorin ApiError, dhe kalendari ruan fokusin pas ndërrimit të muajit.

## Kufizimet

- Të dhënat janë në memorie dhe humbin në rinisje.
- Nuk ka autentikim ose autorizim. Secili mund të krijojë ose anulojë rezervime në këtë demo.
- Pagesa është e simuluar; tokeni kontrollohet vetëm për gjatësi dhe nuk ruhet.
- Fotot janë ilustruese dhe nuk përfaqësojnë pronat e trilluara.
- Harta interaktive dhe vizatimi i poligoneve nuk janë në klient, ndonëse API-ja i mbështet.
- Lighthouse desktop: 100 Performance, 100 Accessibility, 100 Best Practices, 100 SEO. Axe: zero shkelje në 60 pamje, pa tejkalim horizontal dhe pa kërkesa të jashtme.
- Porta 5000 është e zënë nga Logitech G HUB në këtë kompjuter; profili dev punon në 5047. Testi i integrimit për Production kalon.

## Ekipi

Projekt kursi nga Artik Osmani, Arber Miftari, Dalmat Ademi, Arber Beqiri dhe Jon Ferizi.

- Përshkrimi i plotë, harta e kodit dhe udhëzimet: [README.md](README.md)
- Identifikuesit e seed data: [docs/SEED_IDS.md](docs/SEED_IDS.md)
- Licencat e fotove dhe fonteve: [docs/IMAGE_CREDITS.md](docs/IMAGE_CREDITS.md), [docs/FONT_LICENSES.md](docs/FONT_LICENSES.md)
- Specifikimi i këtij iteracioni: [UPGRADE_PROMPT.md](UPGRADE_PROMPT.md)
