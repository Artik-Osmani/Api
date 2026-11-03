# Font licences

All fonts are self-hosted under `wwwroot/fonts/` as WOFF2 and are licensed under the **SIL Open Font License 1.1** (OFL-1.1). The OFL permits self-hosting, embedding and subsetting; the fonts may not be sold on their own, and modified versions must not use the reserved font names.

| Family | Weights | Files | Source | Licence |
| --- | --- | --- | --- | --- |
| Schibsted Grotesk | 500, 700 | `schibsted-grotesk-500.woff2`, `schibsted-grotesk-700.woff2` | https://cdn.jsdelivr.net/npm/@fontsource/schibsted-grotesk@5.3.0/files/schibsted-grotesk-latin-500-normal.woff2 and `...-latin-700-normal.woff2` | SIL Open Font License 1.1 |
| Geist | 400, 500, 600 | `geist-400.woff2`, `geist-500.woff2`, `geist-600.woff2` | https://cdn.jsdelivr.net/npm/@fontsource/geist@5.3.0/files/geist-latin-400-normal.woff2 (and `-500`, `-600`) | SIL Open Font License 1.1 |
| Geist Mono | 500 | `geist-mono-500.woff2` | https://cdn.jsdelivr.net/npm/@fontsource/geist-mono@5.3.0/files/geist-mono-latin-500-normal.woff2 | SIL Open Font License 1.1 |

## Subset note

Each file is the Fontsource **latin** subset (package version 5.3.0), not the full family. The subset was checked at the glyph level: the WOFF2 `cmap` tables map U+00EB (ë), U+00E7 (ç), U+00CB (Ë) and U+00C7 (Ç), along with the basic Latin letters. No latin-ext, Cyrillic, Greek or Vietnamese subsets are included, so text outside this range falls back to the system stack.

## Licence text

- SIL Open Font License 1.1: https://openfontlicense.org/open-font-license-official-text/
- Fontsource package metadata and upstream copyright notices: https://www.npmjs.com/package/@fontsource/schibsted-grotesk/v/5.3.0, https://www.npmjs.com/package/@fontsource/geist/v/5.3.0, https://www.npmjs.com/package/@fontsource/geist-mono/v/5.3.0

The fonts are redistributed here unmodified, in WOFF2 form, as required by the OFL for web embedding.
