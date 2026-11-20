# Serve AVIF and WebP

Serve AVIF or WebP to browsers that accept them and the original format to the rest, from one URL, with chop's format negotiation.

chop picks the output format from the `Accept` header, so one URL gives each browser the smallest format it can display. No argument is needed, because `format=auto` is the default.

The same URL, `/2026/05/photo.jpg?w=300`, requested with three different headers:

| `Accept` header | `content-type` | `content-length` |
| --- | --- | --- |
| `image/avif,image/webp` | `image/avif` | 2364 |
| `image/webp` | `image/webp` | 2144 |
| none | `image/jpeg` | 4548 |

The test image is a synthetic gradient, so the sizes are small and the ranking depends on the image. Every one of these responses has `vary: Accept`, so a cache keeps one copy per header. See [Cache images](caching.md).

## Common tasks

### Force a format

`?format=webp` is used even when `Accept` doesn't list it. `jpeg`, `png`, `webp`, `avif` and `gif` work the same way, and the choice isn't limited by `CHOP_AUTO_FORMATS`.

### Turn AVIF off

AVIF costs more CPU to encode than WebP. `CHOP_AUTO_FORMATS` (chop 0.2.0 or later) set to `webp` stops `auto` from choosing it, and `CHOP_AVIF=false` does the same, also when `CHOP_AUTO_FORMATS` lists `avif`. An explicit `format=avif` still works. `CHOP_AUTO_FORMATS=none` turns all upgrades off, so `auto` always gives the fallback format.

### Accept only some source formats

`CHOP_ALLOWED_INPUT_FORMATS=jpeg,png,webp` makes any other source a `415` before a pixel is decoded. `jpg` is accepted as an alias of `jpeg`, and the format is detected from the content of the file, never the extension. The `415` message is the same as for any unsupported file, so it doesn't reveal which formats are allowed.

### Set the quality or keep the original bytes

See [Set quality and strip metadata](quality-and-metadata.md).

### Serve transparent PNGs and animated GIFs

See [Serve transparent and animated images](animated-and-transparent.md).

## Reference

### How `auto` chooses

For a still image, `auto` chooses among the formats of `autoFormats` (`avif,webp` by default). It picks AVIF if it's listed and the output is lossy, or WebP if it's listed and the output fits the 16383 pixel limit of WebP, and otherwise the fallback format. The fallback is GIF for a GIF source, PNG for lossless or transparent output, and JPEG otherwise.

When the client lists both, the format with the highest `q` is used, and the earlier format of `autoFormats` wins a tie. Browsers send no `q` for image types, so they get the first format of `autoFormats` that they accept, and a header like `image/avif;q=0.5,image/webp` gives WebP.

The header is parsed per RFC 9110, ignoring whitespace and case, and a type with `q=0` is not accepted. Entries with an invalid `q` are ignored, and a listed type counts only if every entry of it has `q` above 0. `image/*` and `*/*` never make AVIF or WebP acceptable. Only a listed `image/avif` or `image/webp` does, so clients that don't list them get a format that they can display.

| Source | `Accept` lists `image/avif` and `image/webp` | `Accept` lists `image/webp` | No `Accept`, or `image/*` |
| --- | --- | --- | --- |
| JPEG, lossy WebP, AVIF | AVIF | WebP | JPEG (PNG with transparency) |
| PNG, lossless WebP | Lossless WebP | Lossless WebP | PNG |
| GIF | Lossless WebP | Lossless WebP | GIF |
| Animated GIF or WebP | Animated WebP | Animated WebP | GIF |

Every successful response has `Vary: Accept`, also when it ends up in the source format. JPEG, PNG, GIF, WebP and AVIF are read. Other content is a `415`, and an unreadable or corrupt file is a `422`. The encoders use the sharp defaults, except for progressive JPEG, WebP `effort` 4 and PNG `compressionLevel` 9.
