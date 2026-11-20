# Responses and errors

The headers of a chop response and what each status code and error message means.

Every success is a `200` with the headers a cache needs, and every error is plain text that is never cached. A successful request for the test image at 300 pixels wide with `Accept: image/avif`, then a request for a file that doesn't exist:

```text
HTTP/1.1 200 OK
content-type: image/avif
content-length: 2364
etag: "K2I_n1NeFESPeswIg97fQI_m5l2EXCOn5F2-2AcJ5iQ"
cache-control: public, max-age=31536000
vary: Accept
x-content-type-options: nosniff
x-bytes-saved: 1350587
```

```text
HTTP/1.1 404 Not Found
content-type: text/plain; charset=utf-8
cache-control: no-store
x-content-type-options: nosniff

Not found.
```

A path that tries to leave the data directory is refused before any file is read:

```sh
curl --path-as-is -i 'http://localhost:8080/../etc/passwd'
```

```text
HTTP/1.1 400 Bad Request
content-type: text/plain; charset=utf-8
cache-control: no-store
x-content-type-options: nosniff

Invalid path.
```

## Reference

A success is `200` with the `Content-Type` of the output, `Content-Length`, `Cache-Control: public, max-age=<maxAge>`, `Vary: Accept`, `X-Content-Type-Options: nosniff` and a strong `ETag` that is a SHA-256 of the body. An `If-None-Match` that matches the `ETag` (weak comparison, lists and `*`) gets `304` with the same `ETag`, `Cache-Control` and `Vary` and no body. A `HEAD` response has the headers of the `GET` response, including `Content-Length`, and no body.

Errors are plain text with a short message that doesn't reveal file system paths, `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.

### Status codes

| Status | Message | Meaning |
| --- | --- | --- |
| `400` | `Invalid "w" argument: expected a whole number.`, `Invalid path.` | Invalid request: an unsafe path, a malformed argument, a size over `maxOutputDimension` or a width that isn't in `allowedWidths`. |
| `404` | `Not found.` | Not found: a missing file, a directory, or a path that resolves outside the data directory, which all look the same. For a remote origin also an upstream `404`, `410`, `401`, `403` or `407`, a URL source that isn't allowed and a destination at a blocked address. |
| `405` | `Method not allowed.` | A method other than `GET` and `HEAD`, with `Allow: GET, HEAD`. |
| `413` | `The original image is too large.` | The original is over `maxInputBytes`, which is checked before the file is read. |
| `415` | `This file is not a supported image.` | The file is not a JPEG, PNG, GIF, WebP or AVIF image. |
| `422` | `The image can not be processed.`, `The image can not be read.` | The image is corrupt, or has more than `maxInputPixels` pixels. |
| `500` | Plain text | An unexpected error. |
| `502` | Plain text | The origin failed: it couldn't be reached, it answered with a `5xx` or another unexpected status, it redirected, or it sent a compressed or incomplete body. |
| `503` | Plain text | The queue of images or of downloads is full, with `Retry-After: 1`. |
| `504` | Plain text | The origin was too slow to connect or to send the whole image. |

The error statuses `502` and `504` also have `Cache-Control: no-store`, as every error does. Each path segment is percent-decoded once, and a segment that is `.` or `..`, is empty, or contains `/`, `\` or a NUL byte after decoding is a `400`. The real path of the file, with symbolic links resolved, must be inside the real path of the data directory.
