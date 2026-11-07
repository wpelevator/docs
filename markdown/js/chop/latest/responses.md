# Responses (/js/chop/latest/responses.html)

A success is `200` with the `Content-Type` of the output, `Content-Length`, `Cache-Control: public, max-age=<maxAge>`, `Vary: Accept`, `X-Content-Type-Options: nosniff` and a strong `ETag` that is a SHA-256 of the body. An `If-None-Match` that matches the `ETag` (weak comparison, lists and `*`) gets `304` with the same `ETag`, `Cache-Control` and `Vary` and no body. A `HEAD` response has the headers of the `GET` response, including `Content-Length`, and no body.

Errors are plain text with a short message that doesn't reveal file system paths, `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.

| Status | Meaning |
| --- | --- |
| `400` | Invalid request: an unsafe path, a malformed argument, a size over `maxOutputDimension` or a width that isn't in `allowedWidths`. |
| `404` | Not found: a missing file, a directory, or a path that resolves outside the data directory, which all look the same. For a remote origin also an upstream `404`, `410`, `401`, `403` or `407`, a URL source that isn't allowed and a destination at a blocked address. |
| `405` | A method other than `GET` and `HEAD`, with `Allow: GET, HEAD`. |
| `413` | The original is over `maxInputBytes`, which is checked before the file is read. |
| `415` | The file is not a JPEG, PNG, GIF, WebP or AVIF image. |
| `422` | The image is corrupt, or has more than `maxInputPixels` pixels. |
| `502` | The origin failed: it couldn't be reached, it answered with a `5xx` or another unexpected status, it redirected, or it sent a compressed or incomplete body. |
| `504` | The origin was too slow to connect or to send the whole image. |
| `500` | An unexpected error. |
| `503` | The queue of images or of downloads is full, with `Retry-After: 1`. |

The error statuses `502` and `504` also have `Cache-Control: no-store`, as every error does. Each path segment is percent-decoded once, and a segment that is `.` or `..`, is empty, or contains `/`, `\` or a NUL byte after decoding is a `400`. The real path of the file, with symbolic links resolved, must be inside the real path of the data directory.
