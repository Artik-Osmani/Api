# Kontributet e Dalmat Ademit

**Projekti:** FatiHomes — API për rezervime (ASP.NET Core 10 + HTML/CSS/JavaScript)
**Ekipi:** Lowland Team — Jira projekt `SCRUM`
**Autori:** Dalmat Ademi ([@lowlandrepair](https://github.com/lowlandrepair))
**Repo:** [Artik-Osmani/Api](https://github.com/Artik-Osmani/Api)
**Periudha:** 16.09.2026 – 04.11.2026

Ky dokument lidh tiketat në Jira me commit-et, Pull Request-et dhe skedarët përkatës në GitHub. Është përgatitur për prezantim te profesori.

---

## 1. Përmbledhje e tiketave

| Tiketa | Titulli | Roli | Statusi | Commit | Pull Request |
| --- | --- | --- | --- | --- | --- |
| [SCRUM-8](https://lowland.atlassian.net/browse/SCRUM-8) | Dizajno logon e webfaqes | Reporter + autor i kodit | Done, 14.10.2026 | [`f573f562`](https://github.com/Artik-Osmani/Api/commit/f573f562) | [#2](https://github.com/Artik-Osmani/Api/pull/2) |
| [SCRUM-10](https://lowland.atlassian.net/browse/SCRUM-10) | Krijo faqen e kontaktit | Reporter + autor i kodit | Done, 14.10.2026 | [`2c2ac53f`](https://github.com/Artik-Osmani/Api/commit/2c2ac53f) | [#3](https://github.com/Artik-Osmani/Api/pull/3) |
| [SCRUM-9](https://lowland.atlassian.net/browse/SCRUM-9) | Krijo faqen kryesore | Assignee + reporter | Done, 14.10.2026 | [`f2e226aa`](https://github.com/Artik-Osmani/Api/commit/f2e226aa), [`4d0b88d2`](https://github.com/Artik-Osmani/Api/commit/4d0b88d2), [`c1761940`](https://github.com/Artik-Osmani/Api/commit/c1761940) | — |
| [SCRUM-17](https://lowland.atlassian.net/browse/SCRUM-17) | Krijo menynë e navigimit | Assignee | Done, 14.10.2026 | [`f2e226aa`](https://github.com/Artik-Osmani/Api/commit/f2e226aa), [`4d0b88d2`](https://github.com/Artik-Osmani/Api/commit/4d0b88d2) | — |
| [SCRUM-7](https://lowland.atlassian.net/browse/SCRUM-7) | Krijo logo | Assignee | To Do | [`f573f562`](https://github.com/Artik-Osmani/Api/commit/f573f562) | [#2](https://github.com/Artik-Osmani/Api/pull/2) |
| [SCRUM-11](https://lowland.atlassian.net/browse/SCRUM-11) | Testo webfaqen në pajisje të ndryshme | Reporter | Done, 21.10.2026 | — (testim manual) | — |

---

## 2. Detaje sipas tiketave

### SCRUM-8 — Dizajno logon e webfaqes

- **Jira:** [SCRUM-8](https://lowland.atlassian.net/browse/SCRUM-8)
- **Branch:** `feature/SCRUM-8-logo`
- **Pull Request:** [#2](https://github.com/Artik-Osmani/Api/pull/2) — merge-uar në `main` më 14.10.2026 (merge commit `56667bc2`)
- **Commit:** [`f573f562`](https://github.com/Artik-Osmani/Api/commit/f573f562)

**Çfarë u bë**

- U krijua [`wwwroot/images/logo.svg`](https://github.com/Artik-Osmani/Api/blob/f573f562/wwwroot/images/logo.svg): shtëpi me pin lokacioni, `viewBox` 64×64, ngjyra primare `#ff385c`, pin i bardhë dhe qendër `#0284c7`. SVG me `role="img"` dhe `aria-label` për aksesueshmëri.
- Në [`wwwroot/index.html`](https://github.com/Artik-Osmani/Api/blob/f573f562/wwwroot/index.html) emoji 🏠 në header u zëvendësua me logon (34×34 px).
- U shtua favicon-i me `<link rel="icon" type="image/svg+xml" href="images/logo.svg">`.
- U shtua rregulla CSS `.brand img { display: block; width: 34px; height: 34px; }` për qendërzim të saktë.

**Skedarët:** 2 skedarë, `+8 / −1` rreshta.

**Testimi:** faqja hapet lokalisht, logoja shfaqet në header me 34 px, favicon-i shfaqet në tab, pamjet e tjera nuk preken.

---

### SCRUM-10 — Krijo faqen e kontaktit

- **Jira:** [SCRUM-10](https://lowland.atlassian.net/browse/SCRUM-10)
- **Branch:** `feature/SCRUM-10-contact`
- **Pull Request:** [#3](https://github.com/Artik-Osmani/Api/pull/3) — aprovuar nga Artik Osmani, merge-uar në `main` më 14.10.2026 (merge commit `6fc122e8`)
- **Commit:** [`2c2ac53f`](https://github.com/Artik-Osmani/Api/commit/2c2ac53f)

**Çfarë u bë**

- U shtua butoni i katërt në menu: `id="btnTabContact"`, `onclick="switchView('contact')"`, etiketa “📞 4. Contact”.
- U krijua pamja e re `<div id="viewContact" class="view-section">` me titull “📞 Contact FatiHomes” dhe tekst hyrës.
- Përmbajtja u organizua në grid responsiv `repeat(auto-fit, minmax(260px, 1fr))` me tri karta:
  - **Email:** support@fatihomes.com — përgjigje brenda 24 orëve
  - **Phone:** +383 38 000 000 — Mon–Sun, 08:00–20:00
  - **Office:** Rr. Dëshmorët e Kombit, Prishtinë — vizita me takim
- `switchView(tab)` u zgjerua me degën `else if (tab === 'contact')`, që aktivizon pamjen dhe butonin përkatës.

**Skedarët:** 1 skedar (`wwwroot/index.html`), `+35 / −0` rreshta.

**Testimi:** klikimi i butonit Contact aktivizon pamjen pa rifreskim faqe; tri kartat shfaqen pa mbivendosje; pamjet Listings, Hosts dhe Reservations vazhdojnë të punojnë.

---

### SCRUM-9 — Krijo faqen kryesore

- **Jira:** [SCRUM-9](https://lowland.atlassian.net/browse/SCRUM-9)
- **Statusi:** Done, 14.10.2026

**Çfarë u bë**

- Faqja kryesore dhe struktura e pamjeve (listings, wishlist, reservations, hosts) në [`wwwroot/index.html`](https://github.com/Artik-Osmani/Api/blob/4d0b88d2/wwwroot/index.html).
- Skela fillestare e projektit në [`f2e226aa`](https://github.com/Artik-Osmani/Api/commit/f2e226aa): API ASP.NET Core, modelet, shërbimet, Swagger dhe `wwwroot/index.html` (+569 rreshta).
- Rindërtim i UI-së në [`4d0b88d2`](https://github.com/Artik-Osmani/Api/commit/4d0b88d2): `index.html` `+425 / −322` rreshta — hero, kartat e listimeve, banneri i stazhit DEV/PROD dhe mesazhet e rezervimeve.
- Rifreskim final i stilit në [`c1761940`](https://github.com/Artik-Osmani/Api/commit/c1761940): `tokens.css`, `layout.css`, `components.css`, `pages.css`, `motion.css` dhe tema dark e Swagger.

**Skedarët kryesorë:** `wwwroot/index.html`, `wwwroot/css/*`, `wwwroot/app.css`, `wwwroot/app.js`.

**Shënim:** commit-et nuk e përmendin `SCRUM-9` në mesazh; lidhja me tiketën bëhet përmes skedarit `wwwroot/index.html`.

---

### SCRUM-17 — Krijo menynë e navigimit

- **Jira:** [SCRUM-17](https://lowland.atlassian.net/browse/SCRUM-17)
- **Statusi:** Done, 14.10.2026

**Çfarë u bë**

- Header me `class="navbar"` i ndarë në tri zona: brand + statistikat, `.nav-tabs` dhe `.nav-right`.
- Butonat `.nav-pill` për Explore, Wishlist (me badge), Bookings dhe Trust & Hosts, plus butoni Contact.
- Funksioni `switchView(tab)` aktivizon pamjen përkatëse, vendos `.active` te butoni dhe pastron gjendjen e mëparshme me `querySelectorAll('.nav-pill, .nav-btn')`.
- Butoni i temës dark/light dhe lidhja për në Swagger në anën e djathtë.

**Kodi:** [`wwwroot/index.html` @ 62c03fb9, rreshtat 278–318](https://github.com/Artik-Osmani/Api/blob/62c03fb9/wwwroot/index.html#L278-L318)

**Shënim:** commit-et nuk e përmendin `SCRUM-17` në mesazh; kodi ndodhet në `wwwroot/index.html`.

---

### SCRUM-7 — Krijo logo

- **Jira:** [SCRUM-7](https://lowland.atlassian.net/browse/SCRUM-7)
- **Statusi:** To Do — dublikatë e `SCRUM-8`

Puna e logos u realizua dhe u dorëzua te **SCRUM-8** me commit [`f573f562`](https://github.com/Artik-Osmani/Api/commit/f573f562) dhe [PR #2](https://github.com/Artik-Osmani/Api/pull/2). Tiketa mund të lidhet me SCRUM-8 ose të mbyllet si dublikatë.

### SCRUM-11 — Testo webfaqen në pajisje të ndryshme

- **Jira:** [SCRUM-11](https://lowland.atlassian.net/browse/SCRUM-11)
- **Statusi:** Done, 21.10.2026

Tiketë testimi pa ndryshime kodi. Testimi u krye dhe u mbyll nga Adil Jusufi.

---

## 3. Punë teknike shtesë (pa tiketë)

| Fusha | Commit | Çfarë përfshin |
| --- | --- | --- |
| API fillestare | [`f2e226aa`](https://github.com/Artik-Osmani/Api/commit/f2e226aa) | ASP.NET Core, `Controllers/`, `Models/RentalModels.cs`, `Services/MockDataStore.cs`, Swagger, `docs/openapi.yaml` |
| Brandimi i Swagger | [`26e2e1bb`](https://github.com/Artik-Osmani/Api/commit/26e2e1bb) | `wwwroot/swagger-custom.css`, titulli dhe pamja e dokumentacionit |
| Staging DEV/PROD | [`4d0b88d2`](https://github.com/Artik-Osmani/Api/commit/4d0b88d2) | `appsettings.Production.json`, endpoint `/v1/system/stage`, `run-dev.ps1`, `run-prod.ps1` |
| Wishlist + siguria | [`7d294e86`](https://github.com/Artik-Osmani/Api/commit/7d294e86) | `FavoritesController.cs`, `RateLimitMiddleware.cs`, `SecurityHeadersMiddleware.cs`, `wwwroot/app.css`, `wwwroot/app.js` |
| Zgjerim i API-së | [`91b54124`](https://github.com/Artik-Osmani/Api/commit/91b54124) | `ListingsController`, `ReservationsController`, `SystemController`, `ExceptionHandlingMiddleware`, modele |
| Rifreskim UI | [`c1761940`](https://github.com/Artik-Osmani/Api/commit/c1761940) | CSS (`tokens`, `layout`, `components`, `pages`, `motion`) dhe Swagger dark theme |

---

## 4. Si ta verifikojë profesori

1. Hap bordin Jira të projektit `SCRUM`: [të gjitha tiketat](https://lowland.atlassian.net/issues/?jql=project%3DSCRUM%20ORDER%20BY%20created%20ASC).
2. Hap [SCRUM-8](https://lowland.atlassian.net/browse/SCRUM-8) dhe [SCRUM-10](https://lowland.atlassian.net/browse/SCRUM-10) — secila përmban koment me përshkrimin, testimin dhe linket GitHub.
3. Hap commit-et [`f573f562`](https://github.com/Artik-Osmani/Api/commit/f573f562) dhe [`2c2ac53f`](https://github.com/Artik-Osmani/Api/commit/2c2ac53f) — shih skedarët dhe diffs.
4. Hap [PR #2](https://github.com/Artik-Osmani/Api/pull/2) dhe [PR #3](https://github.com/Artik-Osmani/Api/pull/3) — shih përshkrimin, commit-et dhe merge-in në `main`.
5. Hap [`wwwroot/index.html`](https://github.com/Artik-Osmani/Api/blob/main/wwwroot/index.html) — faqja kryesore, navigimi dhe pamja e kontaktit.
6. Për punën shtesë, hap commit-et në tabelën e seksionit 3.

---

## 5. Shënime për gjurmueshmërinë

- Commit-et e listuara në këtë dokument janë autoruar nga **Dalmat** (`dalmat.repair@gmail.com`) dhe lidhen me punën e përshkruar.
- `SCRUM-9` dhe `SCRUM-17` u shënuan Done nga anëtarë të ekipit dhe commit-et nuk e përmendin ID-në e tiketës; prova është kodi në `wwwroot/index.html`.
- `SCRUM-7` është dublikatë e `SCRUM-8` dhe mbetet e hapur.
