# Formats and quality

With `format=auto` (the default), the format is chosen from the `Accept` header for a still image among the formats of `autoFormats` (`avif,webp` by default): AVIF if it's listed and the output is lossy, or WebP if it's listed and the output fits the 16383 pixel limit of WebP, otherwise the fallback format. When the client lists both, the format with the highest `q` is used, and the earlier format of `autoFormats` wins a tie. Browsers send no `q` for image types, so they get the first format of `autoFormats` that they accept, as before, while a header like `image/avif;q=0.5,image/webp` now gives WebP. The fallback is GIF for a GIF source, PNG for lossless or transparent output, and JPEG otherwise.

The header is parsed per RFC 9110, ignoring whitespace and case, and a type with `q=0` is not accepted. `image/*` and `*/*` never make AVIF or WebP acceptable: only a listed `image/avif` or `image/webp` does, so clients that don't list them get a format that they can display. An explicit `format` is used even if `Accept` doesn't list it, and it isn't restricted by `autoFormats`, which only governs the negotiation.

| Source | `Accept` lists `image/avif` and `image/webp` | `Accept` lists `image/webp` | No `Accept`, or `image/*` |
| --- | --- | --- | --- |
| JPEG, lossy WebP, AVIF | AVIF | WebP | JPEG (PNG with transparency) |
| PNG, lossless WebP | Lossless WebP | Lossless WebP | PNG |
| GIF | Lossless WebP | Lossless WebP | GIF |
| Animated GIF or WebP | Animated WebP | Animated WebP | GIF |

PNG, GIF and lossless WebP sources stay lossless unless `lossy=1` or a `quality` below 100 is given. Lossy output of a lossless source is AVIF, WebP or a palette PNG. A JPEG, lossy WebP or AVIF source always gives lossy output. An animated source is never AVIF. With an explicit format that can't hold the image (JPEG for an image with transparency, or any format other than WebP and GIF for an animation), transparency is flattened onto white and only the first frame is kept. Sources are detected from the content, not the extension. Other content is a `415` and an unreadable or corrupt file is a `422`.

Every successful response has `Vary: Accept`, also when it ends up in the source format.

## Restricting formats

- `CHOP_AUTO_FORMATS=webp` never negotiates AVIF, which avoids its encode cost. `CHOP_AUTO_FORMATS=none` disables all upgrades, so `auto` always gives the fallback format. `CHOP_AVIF=false` is a shorthand that removes `avif` from the list, also when `autoFormats` lists it. An explicit `format=avif` still works with either.
- `CHOP_ALLOWED_INPUT_FORMATS=jpeg,png,webp` is for a site that only serves those. The format is detected from the content of the file, never the extension, and `jpg` is accepted as an alias of `jpeg`. A source in another format is a `415` with the message of any unsupported file, which doesn't tell which formats are allowed. It's rejected after the header is read and before any pixel is decoded or processed.

## Quality and size

- `quality` is raised to 20 when it's lower, for lossy encoders. `quality=100` on WebP is lossless WebP.
- Without `quality` the defaults are JPEG 82, WebP 80 and AVIF 55 (configurable). A palette PNG uses `quality` or 80. PNG output of a lossless source is lossless with maximum compression.
- A JPEG source isn't re-encoded with a higher quality than it has: the quality of the source is estimated from its luminance quantization table, and the default is lowered to it when it's lower.
- When a request changes nothing about the pixels (no `crop`, size or `lb`, and no orientation to apply), the output format equals the source format and the source has no metadata that `strip` would remove, the original bytes are sent if the re-encoded image isn't smaller. With `strip=none` an untouched request in the source format sends the original bytes without re-encoding.
- Pixel values are never converted to another color space because of `strip`: the ICC profile is kept or dropped, and the pixels stay as they are. CMYK sources are always converted to sRGB.
- Responses have `X-Bytes-Saved` when the output is smaller than the original.

## Choices where the specification is silent

- An explicit `quality` or `lossy=1` turns off the `strip=none` shortcut that sends the original bytes, because the client asked for a re-encoding. The "never larger" check still applies.
- The source quality cap of a JPEG applies when `quality` is absent. An explicit `quality` is used as given (with the floor of 20).
- Transparency means that the source has an alpha channel, even if every pixel is opaque.
- An explicit `format=png` is lossless unless `lossy=1` or a `quality` below 100 is given, also for a JPEG source. An explicit `format=avif` or `format=jpeg` is always lossy.
- `contrast`, `brightness` and `filter` arguments are not parsed at all, so a malformed value of one of them is not an error.
- Repeated arguments use the first value. Crop numbers are non-negative and `zoom` may have up to three decimals.
- An empty segment in the path (`//` or a trailing slash) is a `400`.
- With `strip=none`, EXIF, XMP, IPTC and the profile are kept when the encoder can write them. CMYK sources only keep EXIF and XMP.
- The `Accept` entries that have an invalid `q` are ignored. A listed type counts as accepted only if every entry of it has `q` above 0.
- The encoders use the sharp defaults, except for progressive JPEG, WebP `effort` 4 and PNG `compressionLevel` 9.
- `maxConcurrency` defaults to the number of CPUs and `CHOP_PORT`, `CHOP_HOST` and `CHOP_ACCESS_LOG` are CLI-only variables.
- A first path segment of `http:` or `https:` always starts a [URL source](sources.md), so a directory with that name can't be addressed by a plain path, and with an empty allow-list it is a `404`.
- The credentials of `CHOP_ORIGIN_AUTH` are never sent to a URL source, not even to the host of the configured origin. A URL source of that host is fetched like any other, with the address checks.
- `*` allows every host on the default ports, and a custom port needs its own entry. An allow-list entry is a name or an IPv4 address and not an IPv6 literal, so only `*` allows an IPv6 literal, and the address checks still apply to it.
- An empty segment inside a URL source (`//` in its path) is sent to the origin as it is, while it's a `400` in a plain path.
- The `Accept` header of the client is not forwarded to the origin, so the origin can't vary its answer, and the bytes of an original don't depend on who asked.
- A `HEAD` request downloads and processes the original like a `GET`, since it has the same headers, including `Content-Length`, which depend on the output bytes. Don't forward `HEAD` requests for remote originals or URL sources from a proxy unless you need them, since each one costs a download and a conversion.
