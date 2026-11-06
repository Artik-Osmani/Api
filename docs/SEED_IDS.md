# Seed identifiers

Every seeded record uses a deterministic GUID, so deep links, screenshots and the demo script keep working across restarts. Dates are relative to `DateTime.UtcNow`; the identifiers are not.

Seeding lives in [SeedData.cs](../Services/SeedData.cs). The store is rebuilt by `POST /v1/system/reset` in Development.

## Listings

| # | Slug | Place | Category | Min nights | Nightly | ID |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | pristina-loft | Pristina | apartment | 2 | €95 | `e14c1d68-0fa4-44bc-b17b-4b248a31e8fd` |
| 2 | pristina-studio | Pristina | apartment | 3 | €62 | `d026d4f6-d073-5c03-b1f9-27d89ea8e094` |
| 3 | prizren-stone-house | Prizren | entire_home | 2 | €78 | `9e6a0619-a3d8-536b-a869-cd205a948d7b` |
| 4 | prizren-courtyard-room | Prizren | private_room | 2 | €45 | `8ca68aa1-f475-5794-bd82-21fac849e4a8` |
| 5 | rugova-cabin | Peja | cabin | 3 | €88 | `dcf8b3de-f101-5abd-9077-8f79cd5ce83d` |
| 6 | peja-river-house | Peja | entire_home | 2 | €70 | `f395add4-3e2d-5190-a841-eca977f3ffa3` |
| 7 | gjakova-bazaar-house | Gjakova | entire_home | 2 | €65 | `4ac9e0cf-1aa6-5460-a17d-cf5c96c8723f` |
| 8 | gjakova-guesthouse-room | Gjakova | private_room | 2 | €35 | `e2ae2bac-d511-52b2-a894-918d9946ad88` |
| 9 | brezovica-chalet | Brezovica | cabin | 3 | €120 | `a44f2f51-5a93-51f7-b507-99d6582d45c7` |
| 10 | brezovica-lodge | Brezovica | cabin | 5 | €140 | `2dbd5a22-5da4-5d79-8e28-1cc4fbd0c0ea` |
| 11 | tirana-blloku-apartment | Tirana | apartment | 2 | €68 | `3686c1bd-e109-5069-8d01-f74f19fda33e` |
| 12 | tirana-garden-suite | Tirana | entire_home | 2 | €110 | `fdcc614d-5475-595c-b823-8157f44ee9fc` |
| 13 | berat-castle-room | Berat | private_room | 2 | €42 | `d2dd4abb-c3ae-5721-98d3-67faddc8668a` |
| 14 | berat-osum-house | Berat | entire_home | 2 | €85 | `028f2395-f895-5a6a-9b28-5c9d2ff5d525` |
| 15 | saranda-villa | Sarandë | villa | 3 | €165 | `8023abec-14c7-54fd-8dd3-dcf787522e61` |
| 16 | saranda-studio | Sarandë | apartment | 2 | €75 | `7c88c175-689d-59b3-b3b0-865c771bfe90` |
| 17 | dhermi-cliff-villa | Dhërmi | villa | 3 | €180 | `349bde06-a4b0-5def-96be-43125db7a653` |
| 18 | dhermi-olive-house | Dhërmi | entire_home | 2 | €95 | `2528d8ee-6af7-5b9c-bd60-d7560a6a7fa9` |

## Hosts

| # | Name | Base | ID |
| --- | --- | --- | --- |
| 1 | Elira Krasniqi | Pristina | `9a78cd9c-c9c7-43cf-bc82-01967fa7e93b` |
| 2 | Arben Gashi | Prizren | `b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7` |
| 3 | Mira Hoxha | Tirana | `c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8` |
| 4 | Dritan Beqiri | Sarandë | `d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9` |

## Reservations

| # | Status | Listing | Dates | ID |
| --- | --- | --- | --- | --- |
| 1 | confirmed | 1, Pristina loft | today + 14 to + 19 | `3f7bf08e-1678-43d9-959c-6e6ad9d20c5b` |
| 2 | pending_approval | 12, Tirana garden suite | today + 30 to + 33 | `cb0fe11b-9030-5818-acd2-d822f61f0424` |
| 3 | completed | 5, Rugova cabin | today - 45 to - 40 | `0b06a930-6c59-5c47-95c1-35fb6127b8a5` |
| 4 | cancelled | 13, Berat castle room | today - 20 to - 17 | `47d225cc-7224-5b11-a775-2aeb0c2ee218` |

Guest identities: `f4c8ac19-942a-5b70-a90d-b07d174db403` (Lena Hoffmann), `b61bf6ca-707c-5f62-87b2-9edb3e55f93b` (Marco Rossi), `12ed4aef-aa93-57dc-9274-6ae9e7604ad5` (Anna Keller), `84f0dff7-2335-5e05-86e8-7cbe165d44a1` (Peter Novak).

## Messages on reservation 1

| # | Sender | ID |
| --- | --- | --- |
| 1 | guest | `59284474-a77c-59fa-85f1-1a50372bd32d` |
| 2 | host | `dfad8e28-ed59-5578-8726-2c31cbe288e2` |
| 3 | guest | `a277b58d-6dd9-5a5e-a24d-6fc25776c807` |
| 4 | host | `6fe96448-b77c-55d2-a454-7da236a3bb23` |
| 5 | guest | `9fcc7d14-6ff7-50bd-a479-89af12ace4a6` |

## Reviews

Fifteen reviews are seeded across six listings: 1, 3, 5, 9, 15 and 17. The other twelve listings have `reviewCount: 0` and render as `New`.

| Listing | Reviews | Ratings | Average |
| --- | --- | --- | --- |
| 1 | 3 | 5, 5, 4 | 4.67 |
| 3 | 2 | 5, 5 | 5.00 |
| 5 | 3 | 4, 5, 3 | 4.00 |
| 9 | 2 | 5, 4 | 4.50 |
| 15 | 3 | 5, 5, 4 | 4.67 |
| 17 | 2 | 5, 5 | 5.00 |

## Favorites

Two stays are saved at startup: listing 3 (`9e6a0619-...`) and listing 17 (`349bde06-...`).

## Determinism check

```powershell
Invoke-RestMethod -Method Post http://localhost:5047/v1/system/reset
(Invoke-RestMethod http://localhost:5047/v1/listings/9e6a0619-a3d8-536b-a869-cd205a948d7b).title
```
