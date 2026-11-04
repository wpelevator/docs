# Reference (/js/chop/latest/reference)

How chop behaves, in short. The IDs in parentheses, like `R-OP-8`, are what the tests refer to in their names. chop is MIT licensed and was implemented from a written behavior specification and the repository conventions, without reference to the source code of any other image server.

## Requests [#requests]

- `GET` and `HEAD` are answered, other methods get `405` with `Allow: GET, HEAD` (R-REQ-1).
- The path selects the original under the data directory, and a URL scheme selects the operations (R-REQ-2, S-1). Unknown arguments are ignored, so cache busters like `ver=3` are harmless.
- `/healthz` answers `200 ok` without touching the data directory (R-REQ-3).
- The same URL and `Accept` header give the same bytes (R-REQ-4).
- Path segments are percent-decoded once. `.`, `..`, empty segments and segments with `/`, `\` or a NUL byte are a `400`, and a broken escape is a `400` (R-PATH-1).
- The real path, with symbolic links resolved, must be inside the real data directory. A missing file, a directory and an escape are all the same `404` (R-PATH-2).
- A file over `maxInputBytes` is a `413`, checked before the read and again after it (R-PATH-3).

## Query scheme arguments [#query-scheme-arguments]

This is the default scheme, named `query`. All arguments are optional, and a malformed value of a known argument is a `400` that names it.

| Argument | Meaning |
| --- | --- |
| `w`, `h` | Width or height in pixels. With one, scale to it. With both, fit inside the box without cropping or padding (R-OP-2). |
| `fit=w,h` | The same as `w` and `h` together, and it wins over them (R-OP-3). |
| `resize=w,h` | Cover the box and crop to exactly `w` by `h`. It wins over `fit` (R-OP-4). |
| `gravity` | Where `resize` crops: `center` (default), `north`, `south`, `east`, `west` or `attention` (R-OP-5). |
| `crop=x,y,w,h` | A region of the oriented original, before scaling. Numbers are percentages, or pixels with a `px` suffix. The region is clipped to the image (R-OP-6). |
| `lb=w,h[,color]` | Fit inside the box and pad to exactly `w` by `h`. `color` is 3 or 6 hex digits, default `ffffff` (R-OP-7). |
| `zoom` | Device pixel ratio from 1 to 10, which multiplies the sizes (R-OP-9). |
| `upscale=1` | Allow enlarging, up to `maxUpscaleDimension` (R-OP-8). |
| `quality` | 1 to 100, with values below 20 raised to 20 for lossy encoders (R-QLT-1). |
| `format` | `auto` (default), `jpeg`, `png`, `webp`, `avif` or `gif` (R-FMT-2). |
| `lossy=1` | Allow lossy output for lossless sources (R-QLT-5). |
| `strip` | `metadata` (default, keeps the ICC profile), `all` or `none` (R-QLT-6). |

Operations run in a fixed order, whatever the order in the URL: orientation, `crop`, size, `lb`, then encoding. Sizes always refer to the displayed (oriented) image (R-OP-1).

Without `upscale=1` nothing is enlarged: sizes clamp to the original, `resize` crops at the largest size with the requested aspect ratio, and `lb` pads without enlarging (R-OP-8). The output can't exceed `maxOutputDimension` (R-OP-12).

Animated sources keep all frames for `crop` and sizes. `lb` and `gravity=attention` are ignored for them (R-OP-13). Image adjustments (R-OP-10) and filters (R-OP-11) aren't supported, and their arguments are ignored.

## URL schemes [#url-schemes]

A scheme turns a URL into the path of the original and the operations. All the schemes produce the same operations, so every scheme gets the same negotiation, limits and path safety.

- Schemes are tried in the configured order, and the first one that recognizes the URL wins. The default is `query` only (S-1). The `query` scheme recognizes every URL, so it has to be listed last when it's enabled with others. The `cloudflare` scheme only recognizes URLs that start with `/cdn-cgi/image/`.
- A scheme's path segments go through the same checks as any other path, so no scheme can read outside the data directory (S-2).
- A URL that no enabled scheme recognizes is a `404` (S-3).
- A scheme ignores the options that chop doesn't support, and a malformed value of one that it supports is a `400` (S-4).
- Different schemes that give the same operations give the same bytes and `ETag` (S-5).

### `cloudflare` [#cloudflare]

The `/cdn-cgi/image/<options>/<path>` form of Cloudflare Image Resizing, with comma separated `name=value` options.

| Option | Maps to |
| --- | --- |
| `width`, `height` | `w`, `h` (S-6). |
| `fit` | `scale-down` (default) is `w`/`h` that never enlarges, `contain` is the same with `upscale`, `cover` is `resize` with `upscale`, `crop` is `resize`, and `pad` is `lb` with `upscale` (S-7). |
| `gravity` | `left`, `right`, `top`, `bottom` are `west`, `east`, `north`, `south`, and `auto` and `face` are `attention`. Coordinates like `0.5x0.3` are ignored (S-8). |
| `quality` | `quality` (S-9). |
| `format` | `auto`, `avif`, `webp`, `jpeg`, `png`, `gif`, and `baseline-jpeg` as `jpeg`. `json` is a `400` (S-10). |
| `dpr` | `zoom` (S-11). |
| `metadata` | `keep` is `strip=none`, `copyright` is `strip=metadata`, `none` is `strip=all` (S-12). |
| `background` | The `lb` color for `fit=pad`, as hex digits (S-13). |

Other Cloudflare options, like `trim`, `rotate`, `blur`, `sharpen` and `onerror`, are ignored. Remote source URLs aren't supported and are a `404`.

## Output format [#output-format]

- `Accept` is parsed per RFC 9110. Only a listed `image/avif` or `image/webp` makes those formats acceptable, so `image/*` and `*/*` don't (R-FMT-1).
- An explicit `format` is used even when `Accept` doesn't list it. Transparency is flattened onto white for formats that can't hold it (R-FMT-2).
- With `auto`, a still image is AVIF if enabled and accepted and the output is lossy, else WebP if accepted and within its size limit, else the fallback format: GIF for GIF sources, PNG for lossless or transparent output, and JPEG otherwise (R-FMT-3).
- An animated source becomes an animated WebP if accepted, otherwise a GIF, and never AVIF (R-FMT-4).
- PNG, GIF and lossless WebP sources stay lossless unless `lossy=1` or a `quality` below 100 is given (R-FMT-5). JPEG, lossy WebP and AVIF sources produce lossy output (R-FMT-6).
- Every response that depends on `Accept` has `Vary: Accept` (R-FMT-7).
- JPEG, PNG, GIF, WebP and AVIF are read, detected from the content. Other content is a `415`, and unreadable or corrupt files are a `422` (R-FMT-8).

## Quality and size [#quality-and-size]

- The defaults are JPEG 82, WebP 80 and AVIF 55, lowered to the estimated quality of a JPEG source, so that a recompressed JPEG never gets a higher quality than it has. The estimate compares the file's luminance quantization table with the standard table scaled for each quality. An explicit `quality` is used as given (R-QLT-2, R-QLT-3).
- A request that changes nothing about the pixels and keeps the source format sends the original bytes when the re-encoded image isn't smaller, and with `strip=none` it always sends them (R-QLT-4).

## Responses [#responses]

- `200` has the output `Content-Type`, `Content-Length`, `Cache-Control: public, max-age=<maxAge>`, `Vary: Accept`, `X-Content-Type-Options: nosniff` and a strong SHA-256 `ETag` (R-RES-1). `X-Bytes-Saved` appears when the output is smaller than the original (R-RES-3).
- `If-None-Match` that matches, including weak comparison, lists and `*`, gets a `304` without a body (R-RES-2).
- Errors are plain text with `Cache-Control: no-store` and no file system paths: `400` invalid request, `404` not found, `405` method, `413` original too large, `415` unsupported type, `422` unreadable image, `500` unexpected, `503` busy (R-RES-4).

## Caching [#caching]

- Responses depend on `Accept` and the URL only, so a cache can key on the URL and a bucket of `Accept`: `image/avif`, `image/webp` or neither. Send the bucket as `Accept` upstream so that the body matches the key. The README has an nginx recipe.

## Limits [#limits]

- At most `maxConcurrency` images are processed at once and `maxQueue` more wait in order. A request that finds the queue full gets `503` with `Retry-After: 1`, and a failing request frees its slot (R-LIM-1, R-LIM-2).
- Decoding is limited by `maxInputPixels` (R-LIM-3).
- `allowedWidths` optionally restricts the output widths to a list (R-LIM-4).
- chop never writes to disk and makes no network requests (R-LIM-5).

## Settings [#settings]

| Setting | Environment variable | Default |
| --- | --- | --- |
| `dataDir` | `CHOP_DATA_DIR` | `/data` |
| `schemes` | `CHOP_SCHEMES` (comma separated) | `query` |
| `maxAge` | `CHOP_MAX_AGE` | `31536000` |
| `maxConcurrency` | `CHOP_MAX_CONCURRENCY` | number of CPUs |
| `maxQueue` | `CHOP_MAX_QUEUE` | `64` |
| `maxInputBytes` | `CHOP_MAX_INPUT_BYTES` | `52428800` |
| `maxInputPixels` | `CHOP_MAX_INPUT_PIXELS` | `120000000` |
| `maxOutputDimension` | `CHOP_MAX_OUTPUT_DIMENSION` | `8192` |
| `maxUpscaleDimension` | `CHOP_MAX_UPSCALE_DIMENSION` | `4096` |
| `jpegQuality`, `webpQuality`, `avifQuality` | `CHOP_JPEG_QUALITY`, `CHOP_WEBP_QUALITY`, `CHOP_AVIF_QUALITY` | `82`, `80`, `55` |
| `avif` | `CHOP_AVIF` | `true` |
| `avifEffort` | `CHOP_AVIF_EFFORT` | `4` |
| `allowedWidths` | `CHOP_ALLOWED_WIDTHS` (comma separated) | unset |

## Interfaces [#interfaces]

- `createHandler( settings? )` returns `( request ) => Promise< Response >` with `{ method, url, headers }` in and `{ status, headers, body }` out. It never throws for a request, never uses `node:http` and reports unexpected errors to an optional `onError` (R-API-1).
- `createConfig()`, `configFromEnv( env )`, `parseQuery()`, `createServer()`, the URL schemes `queryScheme` and `cloudflareScheme` with their `SCHEMES` registry and the `UrlScheme` type (`{ name, parse( url ) }`, where `parse` returns `{ segments, ops }` or `null`), and the other types are exported too (R-API-2, S-1).
- Errors are `ChopError` with a `code` from `CHOP_ERROR_CODES`, checked with `isChopError()` (R-API-3).
- The CLI is `chop [--data <dir>] [--port <n>] [--host <address>] [--scheme <name>] [--help]`, with flags overriding `CHOP_*` variables. Exit codes are `0`, `1` for a failure and `2` for invalid options. `SIGINT` and `SIGTERM` stop it gracefully, and `CHOP_ACCESS_LOG=1` prints one JSON line per request (R-CLI-1 to R-CLI-4).
