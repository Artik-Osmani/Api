# Image credits

All photography is downloaded and self-hosted under `wwwroot/images/stays/`. Nothing is hotlinked. Every listing slug has six WebP files: `-800`, `-1200`, `-1600`, `-p800`, `-d1` and `-d2`. The hero has `hero-p800` and `hero-p1200`.

The photographs are illustrative stock images, not photographs of the fictional properties described in the seed data. Photographer names could not be resolved without an Unsplash API key, so only the stable Unsplash photo IDs are recorded. Attribution can be completed later through the Unsplash API.

## Listing photography

| Slug | File base | What it shows | Source | Licence |
| --- | --- | --- | --- | --- |
| pristina-loft | `pristina-loft` | Plant-filled loft living room with pale walls and a grey sofa | https://images.unsplash.com/photo-1502672260266-1c1ef2d93688 | Unsplash License |
| pristina-studio | `pristina-studio` | Compact white studio interior with a yellow armchair | https://images.unsplash.com/photo-1586023492125-27b2c045efd7 | Unsplash License |
| prizren-stone-house | `prizren-stone-house` | Stone-based house with a covered porch and lawn | https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83 | Unsplash License |
| prizren-courtyard-room | `prizren-courtyard-room` | Classic guest bedroom with draped windows and a seating area | https://images.unsplash.com/photo-1590490360182-c33d57733427 | Unsplash License |
| rugova-cabin | `rugova-cabin` | Dark timber cabin in a dense forest clearing | https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8 | Unsplash License |
| peja-river-house | `peja-river-house` | Timber house on a lake shore below steep mountains | https://images.unsplash.com/photo-1470770841072-f978cf4d019e | Unsplash License |
| gjakova-bazaar-house | `gjakova-bazaar-house` | Town-house facade at dusk with warm exterior lighting | https://images.unsplash.com/photo-1494526585095-c41746248156 | Unsplash License |
| gjakova-guesthouse-room | `gjakova-guesthouse-room` | White guesthouse bedroom with rattan headboard and woven rug | https://images.unsplash.com/photo-1583845112203-29329902332e | Unsplash License |
| brezovica-chalet | `brezovica-chalet` | Wooden alpine chalet glowing at dusk among trees | https://images.unsplash.com/photo-1568605114967-8130f3a36994 | Unsplash License |
| brezovica-lodge | `brezovica-lodge` | Warm timber-panelled lodge room with mountain-facing glazing | https://images.unsplash.com/photo-1611892440504-42a792e24d32 | Unsplash License |
| tirana-blloku-apartment | `tirana-blloku-apartment` | Modern apartment living room with pale sofa and timber wall | https://images.unsplash.com/photo-1600607687939-ce8a6c25118c | Unsplash License |
| tirana-garden-suite | `tirana-garden-suite` | Period villa living room with gallery wall and garden light | https://images.unsplash.com/photo-1600210492486-724fe5c67fb0 | Unsplash License |
| berat-castle-room | `berat-castle-room` | Whitewashed room with tall bay windows and soft seating | https://images.unsplash.com/photo-1505691938895-1758d7feb511 | Unsplash License |
| berat-osum-house | `berat-osum-house` | White house and garden under a clear sky | https://images.unsplash.com/photo-1523217582562-09d0def993a6 | Unsplash License |
| saranda-villa | `saranda-villa` | Clifftop villa terrace and pool above the sea | https://images.unsplash.com/photo-1540541338287-41700207dee6 | Unsplash License |
| saranda-studio | `saranda-studio` | Bright open-plan studio with white walls and timber floor | https://images.unsplash.com/photo-1493809842364-78817add7ffb | Unsplash License |
| dhermi-cliff-villa | `dhermi-cliff-villa` | Modern clifftop villa with infinity pool facing the sea | https://images.unsplash.com/photo-1613490493576-7fde63acd811 | Unsplash License |
| dhermi-olive-house | `dhermi-olive-house` | White cottage among mature trees and a picket fence | https://images.unsplash.com/photo-1480074568708-e7b720bb3f09 | Unsplash License |

## Hero and social preview

| Files | What it shows | Source | Licence |
| --- | --- | --- | --- |
| `hero-p800.webp`, `hero-p1200.webp` | Modern clifftop villa with infinity pool facing the sea (same photograph as `dhermi-cliff-villa`) | https://images.unsplash.com/photo-1613490493576-7fde63acd811 | Unsplash License |
| `wwwroot/images/og.webp` | 1200x630 crop of the `saranda-villa` photograph, with a solid `#101713` band and locally rendered type | https://images.unsplash.com/photo-1540541338287-41700207dee6 | Unsplash License |

## Processing and totals

- Cover-cropped with Pillow, no distortion. Landscape at 800x533, 1200x800 and 1600x1067; portrait at 800x1000. Metadata stripped.
- `-d1` and `-d2` are alternate 3:2 framings cropped from the same 1600px master so the stay gallery shows three different compositions instead of one repeated frame.
- Every file is below 180 KB. The complete photo set is 5.37 MB.
- To reach the budget, the photos were lightly denoised and encoded with adaptive quality (roughly 25-42) rather than a flat quality 74, which produced 9.3 MB at these dimensions. The initial 1600px landscape variants were restored from the credited sources at adaptive WebP quality 15-45 for wide displays. Portrait cards use the existing 800px variant.
- **Total: 110 files, 5,374,482 bytes (5.13 MiB / 5.37 MB).** Run `Get-ChildItem wwwroot/images/stays | Measure-Object Length -Sum` to confirm on disk.
- Placeholders: 0. Every slug has a real Unsplash photograph.

## Icons

`wwwroot/images/icons.svg` is generated from Phosphor Icons core 2.1.1, regular weight, 45 symbols. Source: https://cdn.jsdelivr.net/npm/@phosphor-icons/core@2.1.1/assets/regular/ — MIT License. Paths are copied unchanged from the package; the source `fill="currentColor"` is preserved on each symbol.

## Brand marks

`wwwroot/images/logo.svg` is the hand-drawn FH monogram in brand green, used as the site mark and favicon source. `favicon.ico`, `apple-touch-icon.png` and `images/logo-mark-512.png` were rendered locally with Pillow and Segoe UI Bold. No third-party image licence applies to these marks.
