# Reference (/js/chop/latest/reference.html)

How chop behaves, in short. The guides describe each area in more detail: [requests](requests.html.md), [sources](sources.html.md), [URL schemes](url-schemes.html.md), [formats and quality](formats.html.md), [responses](responses.html.md) and [configuration](configuration.html.md). The IDs in parentheses, like `R-OP-8`, are what the tests refer to in their names. chop is MIT licensed and was implemented from a written behavior specification and the repository conventions, without reference to the source code of any other image server.

## Requests [#requests]

- `GET` and `HEAD` are answered, other methods get `405` with `Allow: GET, HEAD` (R-REQ-1).
- The path selects the original under the data directory or the configured origin, and a URL scheme selects the operations (R-REQ-2, S-1). Unknown arguments are ignored, so cache busters like `ver=3` are harmless.
- `/healthz` answers `200 ok` without touching the data directory or the origin (R-REQ-3).
- The same URL and `Accept` header give the same bytes (R-REQ-4).
- Path segments are percent-decoded once. `.`, `..`, empty segments and segments with `/`, `\` or a NUL byte are a `400`, and a broken escape is a `400` (R-PATH-1). This is for plain paths: in a URL source the embedded URL path is sent to the origin as written, so `//` in it is allowed, but dot segments and broken escapes are still a `400` (R-SRC-14).
- The real path, with symbolic links resolved, must be inside the real data directory. A missing file, a directory and an escape are all the same `404` (R-PATH-2).
- A file over `maxInputBytes` is a `413`, checked before the read and again after it (R-PATH-3). These checks are for the local data directory.

## Sources [#sources]

Where the original comes from. The data directory is the default and its behavior is the one above.

- Plain paths go to the configured origin (`origin`, `CHOP_ORIGIN`) when there is one, and to the data directory when there isn't. A URL source goes to the HTTP fetcher with the allow-list (R-SRC-1).
- The URL of a plain path is the origin base URL, its path without a trailing slash and the path segments, each percent-encoded again, so a segment can't change the host, the port, the query string or the path of the base (R-SRC-2).
- The origin is `https://`, or `http://` with `originAllowHttp`, without user information, a query string or a fragment, and not an IP literal in a blocked range unless `originAllowPrivate` is set. The same scheme rule applies to URL sources, and a bad origin is an invalid setting at startup (R-SRC-3).
- Before connecting, the address literal in the URL is checked, or the name is resolved, every address is checked and the socket only gets the addresses that were checked. If any address is blocked nothing is connected, and the connection is made to one of the addresses that were checked and not to a second DNS answer, so DNS rebinding can't swap the address. Blocked addresses are loopback, unspecified, private, link-local (including `169.254.169.254`), carrier-grade NAT, documentation, multicast and reserved ranges for IPv4 and IPv6, with IPv4-mapped and NAT64 addresses checked as the IPv4 address that they contain, 6to4 and Teredo blocked, and anything that can't be parsed blocked (R-SRC-4).
- Redirects are not followed, and a `3xx` is a `502` (R-SRC-5).
- The request is a `GET` with `Accept: image/*`, `Accept-Encoding: identity` and `User-Agent: chop`, and without any header of the client. `originAuth` is sent as `Authorization` to the configured origin only. A response with a `Content-Encoding` is a `502` (R-SRC-6).
- The body is limited to `maxInputBytes` while it is read, whether or not there is a `Content-Length`, and a `Content-Length` over the limit is a `413` before the body is read (R-SRC-7).
- Connecting must finish within `originConnectTimeout` and the whole download within `originTimeout`, or the answer is a `504`. Upstream failures, a `5xx` or other unexpected status, a redirect and a body that ends early are a `502`, and the body of a response that is not a `200` is dropped without being read. A name that can't be resolved is a `502` for the configured origin, so the operator sees a broken origin, and a plain `404` for a URL source, so that a client can't tell which names exist (R-SRC-8).
- An upstream `404` or `410`, an upstream `401`, `403` or `407`, a URL source that is not allowed and a blocked destination are all the same plain `404`. The reason is only given to the `onOriginError` callback, which the command writes to the standard error, and it is made of the host, a status code or an error code and never an error message (R-SRC-9).
- The type is found from the content, and the `Content-Type` of the origin is not used (R-SRC-10).
- The headers of the origin, like `Cache-Control` and `ETag`, don't change the response, and the original is not cached (R-SRC-11).
- A `HEAD` request downloads and processes the original like a `GET`, since it must have the same headers, including `Content-Length` (R-REQ-1), so a proxy should not forward `HEAD` requests for remote originals unless it needs them (R-SRC-12).
- At most `originConcurrency` downloads run at once and `originQueue` more wait, outside of the processing slots, and a full queue is a `503` with `Retry-After: 1` (R-SRC-12).
- A URL source is a URL after `/` in the `query` scheme or after the options in the `cloudflare` scheme, written `https://host/path`, `https:/host/path` or `https%3A//host/path`. It is a `404` unless `allowedHosts` is not empty and names its host, and the match is on the lower case host without a trailing dot, and the port (R-SRC-13).
- A URL source with user information, a fragment, or a query string of its own (a `400` in the `cloudflare` scheme, and not possible in the `query` scheme where the query is chop's arguments) is a `400`, and dot segments are a `400` as for any path. A port other than the default of the scheme must be in the entry (R-SRC-14).
- `allowedHosts` entries are `host`, `*.example.com` (subdomains on a dot boundary, not the apex), either with `:port`, or `*` for every host on the default ports. `*` can't be mixed with other entries, and it is a warning at startup. Even with `*` everything else of this section applies, and `originAllowPrivate` never applies to a URL source (R-SRC-15).
- A data directory that is set explicitly and an origin together are an invalid setting (R-SRC-16).

### S3 origin [#s3-origin]

`origin` set to `s3://bucket[/prefix]` reads the originals from an S3 bucket or an S3-compatible service. It is the HTTP origin of the section above for requests of the bucket, with signed requests, and every rule of that section applies unless it is changed here.

- `origin` is parsed into a bucket and a prefix: the bucket has 3 to 63 lower case letters, digits, dots and hyphens and isn't an IP address, and the prefix can't have empty, `.` or `..` segments, a query string or a fragment. `http://` and `https://` origins are unchanged, and a data directory that is set explicitly together with an `s3://` origin is an invalid setting (R-S3-1).
- The region is `s3Region` (`CHOP_S3_REGION`, then `AWS_REGION`). On AWS, which is without `s3Endpoint`, it is required and a missing one is an invalid setting at startup. With an endpoint it defaults to `us-east-1`, and `auto` is allowed for R2 (R-S3-2).
- On AWS the bucket is in the host, `bucket.s3.<region>.amazonaws.com`, unless `s3PathStyle` is true or the bucket name has dots, which use `s3.<region>.amazonaws.com/bucket/key`. A custom endpoint is `endpoint/bucket/key` unless `s3PathStyle` is false, which uses `bucket.endpoint-host`. The endpoint is checked like the origin: https, or http with `originAllowHttp`, no user information, query string or fragment, and no blocked address without `originAllowPrivate` (R-S3-3).
- With `s3AccessKeyId` and `s3SecretAccessKey` every request to the bucket is signed with AWS Signature Version 4 with a fresh date, and the signed host is the `Host` header that is sent, with its port. A session token is sent and signed as `x-amz-security-token`. Without a key and a secret requests are unsigned and there is a warning at startup, and a key without a secret, a secret without a key and a token alone are invalid settings (R-S3-4).
- The key is the prefix and the validated segments of the path, and each segment is percent-encoded once, keeping only `A-Z a-z 0-9 - . _ ~`, and sent exactly as it is signed. The path is not normalized (R-S3-5).
- The errors are those of the HTTP origin: `404` and `403` from the bucket are a plain `404`, a `5xx`, a network or TLS error and a redirect are a `502`, a timeout is a `504`, and an object over `maxInputBytes` is a `413` (R-S3-6).
- For the operator only, the first 2048 bytes of the body of an error from the bucket are read (for at most two seconds), and the `<Code>` of the XML, like `SignatureDoesNotMatch`, `AccessDenied`, `RequestTimeTooSkewed`, `ExpiredToken` or `InvalidAccessKeyId`, is given to `onOriginError` in the detail of the error. `NoSuchKey` is not reported, since it is an ordinary miss. A `301` or `307` is a `502` with the detail `bucket is in another region (check CHOP_S3_REGION)` and isn't followed. The body of an error of any other origin is still dropped without being read (R-S3-7).
- Requests for URL sources are never signed and never get the credentials, and the URL sources of `allowedHosts` keep working (R-S3-8).
- The secret key and the session token are only read from the environment by the command, and are not in any error message, warning or log line (R-S3-9).
- `CHOP_S3_ENDPOINT`, `CHOP_S3_REGION`, `CHOP_S3_PATH_STYLE`, `CHOP_S3_ACCESS_KEY_ID`, `CHOP_S3_SECRET_ACCESS_KEY` and `CHOP_S3_SESSION_TOKEN` are read, with `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_SESSION_TOKEN` as the fallbacks, and `--origin s3://bucket` works. Credentials are read once at startup and aren't refreshed (R-S3-10).

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

Other Cloudflare options, like `trim`, `rotate`, `blur`, `sharpen` and `onerror`, are ignored. A source that starts with `http://` or `https://` is a URL source (see [Sources](sources.html.md)) and is a `404` without `allowedHosts`.

## Output format [#output-format]

- `Accept` is parsed per RFC 9110. Only a listed `image/avif` or `image/webp` makes those formats acceptable, so `image/*` and `*/*` don't (R-FMT-1).
- An explicit `format` is used even when `Accept` doesn't list it. Transparency is flattened onto white for formats that can't hold it (R-FMT-2).
- With `auto`, a still image is the negotiated format from `autoFormats` (R-FMT-10): AVIF if the output is lossy, or WebP if the output is within its size limit. Without an accepted candidate it is the fallback format: GIF for GIF sources, PNG for lossless or transparent output, and JPEG otherwise (R-FMT-3).
- An animated source becomes an animated WebP if accepted and in `autoFormats`, otherwise a GIF, and never AVIF (R-FMT-4).
- PNG, GIF and lossless WebP sources stay lossless unless `lossy=1` or a `quality` below 100 is given (R-FMT-5). JPEG, lossy WebP and AVIF sources produce lossy output (R-FMT-6).
- Every response that depends on `Accept` has `Vary: Accept` (R-FMT-7).
- JPEG, PNG, GIF, WebP and AVIF are read, detected from the content. Other content is a `415`, and unreadable or corrupt files are a `422` (R-FMT-8).
- A source whose detected format isn't in `allowedInputFormats` is a `415` with the same message as other unsupported content, which doesn't tell which formats are allowed. The check follows the header detection and comes before any pixel decoding or processing (R-FMT-9).
- `autoFormats` lists the formats (`avif`, `webp`) that `auto` can negotiate, in order of preference. Among the listed formats that `Accept` lists with `q` above 0 (and that pass the checks of R-FMT-3), the one with the highest `q` is used, and the earlier entry of `autoFormats` wins a tie. An empty list disables the upgrades. An explicit `format` is not restricted by `autoFormats`, and `avif: false` removes AVIF from the list (R-FMT-10).

## Quality and size [#quality-and-size]

- The defaults are JPEG 82, WebP 80 and AVIF 55, lowered to the estimated quality of a JPEG source, so that a recompressed JPEG never gets a higher quality than it has. The estimate compares the file's luminance quantization table with the standard table scaled for each quality. An explicit `quality` is used as given (R-QLT-2, R-QLT-3).
- A request that changes nothing about the pixels and keeps the source format sends the original bytes when the re-encoded image isn't smaller, and with `strip=none` it always sends them (R-QLT-4).

## Responses [#responses]

- `200` has the output `Content-Type`, `Content-Length`, `Cache-Control: public, max-age=<maxAge>`, `Vary: Accept`, `X-Content-Type-Options: nosniff` and a strong SHA-256 `ETag` (R-RES-1). `X-Bytes-Saved` appears when the output is smaller than the original (R-RES-3).
- `If-None-Match` that matches, including weak comparison, lists and `*`, gets a `304` without a body (R-RES-2).
- Errors are plain text with `Cache-Control: no-store` and no file system paths: `400` invalid request, `404` not found, `405` method, `413` original too large, `415` unsupported type, `422` unreadable image, `500` unexpected, `502` the origin failed, `503` busy and `504` the origin was too slow (R-RES-4).

## Caching [#caching]

- Responses depend on `Accept` and the URL only, so a cache can key on the URL and a bucket of `Accept`: `image/avif`, `image/webp` or neither. Send the bucket as `Accept` upstream so that the body matches the key. The [caching guide](caching.html.md) has an nginx recipe.

## Limits [#limits]

- At most `maxConcurrency` images are processed at once and `maxQueue` more wait in order. A request that finds the queue full gets `503` with `Retry-After: 1`, and a failing request frees its slot (R-LIM-1, R-LIM-2).
- Decoding is limited by `maxInputPixels` (R-LIM-3).
- `allowedWidths` optionally restricts the output widths to a list (R-LIM-4).
- chop never writes to disk, and makes no network requests unless an origin or `allowedHosts` is configured, and then only to those hosts (R-LIM-5).

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
| `origin` | `CHOP_ORIGIN` (an `https://` URL or `s3://bucket[/prefix]`) | unset |
| `originAllowHttp`, `originAllowPrivate` | `CHOP_ORIGIN_ALLOW_HTTP`, `CHOP_ORIGIN_ALLOW_PRIVATE` | `false`, `false` |
| `s3Endpoint` | `CHOP_S3_ENDPOINT` | unset (AWS) |
| `s3Region` | `CHOP_S3_REGION`, `AWS_REGION` | unset (required on AWS), `us-east-1` with an endpoint |
| `s3PathStyle` | `CHOP_S3_PATH_STYLE` | `true` with an endpoint, `false` on AWS |
| `s3AccessKeyId`, `s3SecretAccessKey`, `s3SessionToken` | `CHOP_S3_ACCESS_KEY_ID`, `CHOP_S3_SECRET_ACCESS_KEY`, `CHOP_S3_SESSION_TOKEN`, with the `AWS_*` fallbacks | unset |
| `originAuth` | `CHOP_ORIGIN_AUTH` | unset |
| `originConnectTimeout`, `originTimeout` | `CHOP_ORIGIN_CONNECT_TIMEOUT`, `CHOP_ORIGIN_TIMEOUT` | `3000`, `10000` |
| `originConcurrency`, `originQueue` | `CHOP_ORIGIN_CONCURRENCY`, `CHOP_ORIGIN_QUEUE` | `4`, `32` |
| `allowedHosts` | `CHOP_ALLOWED_HOSTS` (comma separated) | unset |
| `allowedInputFormats` | `CHOP_ALLOWED_INPUT_FORMATS` (comma separated) | `jpeg,png,gif,webp,avif` |
| `autoFormats` | `CHOP_AUTO_FORMATS` (comma separated, or `none`) | `avif,webp` |

## Interfaces [#interfaces]

- `createHandler( settings? )` returns `( request ) => Promise< Response >` with `{ method, url, headers }` in and `{ status, headers, body }` out. It never throws for a request, never uses `node:http` and reports unexpected errors to an optional `onError`, risky settings to `onWarning` and the failures of an origin to `onOriginError` (R-API-1).
- `createConfig()`, `configFromEnv( env )`, `configWarnings()`, the `Origin` interface with `createOrigin()`, `createLocalOrigin()` and `createHttpOrigin()`, `createS3Origin()`, `isBlockedAddress()`, `parseQuery()`, `createServer()`, the URL schemes `queryScheme` and `cloudflareScheme` with their `SCHEMES` registry and the `UrlScheme` type (`{ name, parse( url, options ) }`, where `parse` returns `{ segments, ops }`, with `url` set for a URL source, or `null`), and the other types are exported too (R-API-2, S-1).
- Errors are `ChopError` with a `code` from `CHOP_ERROR_CODES`, checked with `isChopError()` (R-API-3).
- The CLI is `chop [--data <dir> | --origin <url or s3://bucket>] [--port <n>] [--host <address>] [--scheme <name>] [--help]`, with flags overriding `CHOP_*` variables. A flag replaces the other source from the environment (`--origin` over `CHOP_DATA_DIR`, `--data` over `CHOP_ORIGIN`). Warnings about risky settings and the reasons for refused origin requests go to the standard error. Exit codes are `0`, `1` for a failure and `2` for invalid options. `SIGINT` and `SIGTERM` stop it gracefully, and `CHOP_ACCESS_LOG=1` prints one JSON line per request (R-CLI-1 to R-CLI-4).
