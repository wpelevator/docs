# Sources

An original comes from one of four places, and every request reads exactly one of them:

- **The data directory.** The default. A plain path like `/2026/05/photo.jpg` is a file under `dataDir`, with the path checks of [Responses](responses.md).
- **The configured origin.** With `CHOP_ORIGIN=https://uploads.example.com/base`, the same plain path is appended to the base URL: `/2026/05/photo.jpg` is fetched from `https://uploads.example.com/base/2026/05/photo.jpg`. Clients never supply a host. This is the recommended way to use a remote origin, and plain paths go to the origin instead of the data directory, so `CHOP_ORIGIN` can't be combined with an explicitly set `CHOP_DATA_DIR` or `--data`. The origin must be an `https://` URL without user information, a query string or a fragment, or `http://` with `CHOP_ORIGIN_ALLOW_HTTP=1`.
- **An S3 bucket.** With `CHOP_ORIGIN=s3://my-bucket/uploads`, the plain path `/2026/05/photo.jpg` is the object `uploads/2026/05/photo.jpg` of the bucket, which chop reads with signed `GET` requests. It works with AWS S3 and with services that have an S3 API, like SeaweedFS, MinIO and Cloudflare R2, and it follows all the rules of the configured origin. See [S3 and S3-compatible storage](s3.md).
- **URL sources.** With `CHOP_ALLOWED_HOSTS` set, a request can name the full URL of the original, and chop fetches it if the host is on the list. Plain paths keep their meaning, and only a path that starts with `http://` or `https://` is a URL source. Without the setting, which is the default, these URLs are a `404`.

URL sources work in both schemes. In the `query` scheme the URL is the path and the query string is chop's arguments, and in the `cloudflare` scheme the URL comes after the options:

```text
/https://uploads.example.com/2026/05/photo.jpg?w=300
/cdn-cgi/image/width=300,format=auto/https://uploads.example.com/2026/05/photo.jpg
```

A proxy that merges slashes turns `https://` into `https:/`, and some clients escape it as `https%3A//`. chop understands all three forms, with any number of slashes after the colon. A URL source can't have user information, a fragment or a query string of its own: the query string of the `query` scheme is chop's arguments, so the source can't have one, and in the `cloudflare` scheme a query string on a URL source is a `400` rather than a guess about which part it belongs to. User information and fragments are a `400` too. Ports other than 80 and 443 must be named in the allow-list.

Each entry of `CHOP_ALLOWED_HOSTS` is a comma separated list item:

| Entry | Matches |
| --- | --- |
| `uploads.example.com` | That host, on the default port of the scheme. |
| `*.example.com` | Any subdomain at any depth, on a dot boundary, so `a.example.com` and `a.b.example.com` match, but `example.com` and `evilexample.com` don't. List the apex too if you need it. |
| `uploads.example.com:8443` | That host on that port, and not on the default port. |
| `*` | Every host, on the default ports. It can't be mixed with other entries, and it prints a warning on startup. See [Securing remote origins](security.md). |

Hosts are compared in lower case and without a trailing dot. International names must be written in punycode (`xn--...`). An empty list means no URL sources.

Whatever the source, the original is downloaded into memory, up to `maxInputBytes`, before it is processed. `X-Bytes-Saved` is measured against the downloaded size, the `ETag` is still a hash of the output, and when re-encoding doesn't make the image smaller, the downloaded bytes are sent as they are. The type of the image is found from its content, and the `Content-Type` that the origin states is ignored.

## What chop does for every remote fetch

These apply to the configured origin and to URL sources, with any allow-list, including `*`:

- Only `https` is used, unless `CHOP_ORIGIN_ALLOW_HTTP` is set.
- The request is a `GET` with fresh headers: `Accept: image/*`, `Accept-Encoding: identity` and `User-Agent: chop`. No cookie, `Authorization`, `Referer` or other header of the client is forwarded. A compressed response is a `502`.
- Redirects are not followed. A `3xx` from the origin is a `502`.
- The host name is resolved once, every address is checked, and the connection is made to one of the addresses that were checked, so DNS rebinding can't swap the address between the check and the connection. An address literal in a URL is checked too, in any notation (`2130706433`, `0x7f.1`, `[::ffff:7f00:1]`). Loopback, private, link-local (including the cloud metadata address `169.254.169.254`), carrier-grade NAT, documentation, multicast and reserved ranges are never connected to, for IPv4 and IPv6, including IPv4-mapped and NAT64 forms. If a name resolves to several addresses and any of them is blocked, the request is not made.
- The body is cut off at `maxInputBytes` while it is read, whether or not the origin sends `Content-Length`, and a larger `Content-Length` is a `413` before the body is read.
- Connecting, including the TLS handshake, must finish within `CHOP_ORIGIN_CONNECT_TIMEOUT` (3000 ms) and the whole download within `CHOP_ORIGIN_TIMEOUT` (10000 ms), or the answer is a `504`.
- At most `CHOP_ORIGIN_CONCURRENCY` downloads (4) run at the same time and `CHOP_ORIGIN_QUEUE` (32) wait. More are a `503` with `Retry-After: 1`. Downloads don't use a processing slot, so a slow origin doesn't stop images from being processed, but the memory in use can reach `CHOP_ORIGIN_CONCURRENCY` times `maxInputBytes`, so lower one of them on a small machine.
- The body of a response that isn't a `200` is dropped without being read. The only exception is an S3 bucket, where chop reads the first 2048 bytes of the body of an error, for at most two seconds, to find the error code for the operator.
- A host name that can't be resolved is a `502` for the configured origin and the same plain `404` for a URL source, so that a client can't tell which names exist. The reason is only written to the standard error, as a host and an error code, never an error message.
- Upstream `404` and `410` are a `404`. A `401`, `403` or `407` from the origin and a destination that isn't allowed are the same plain `404`, so that a client can't tell which hosts exist, which are blocked or whether the origin needs credentials. The reason is only written to the standard error. An origin that fails or answers with another status is a `502`.

`CHOP_ORIGIN_AUTH` is the value of an `Authorization` header, like `Bearer <token>`, for a private origin. It is only sent to the configured origin and never to URL sources, it is read from the environment only, and it is never logged. A value with a line break or a control character is an invalid setting.

`CHOP_ORIGIN_ALLOW_PRIVATE=1` lets the configured origin be at a loopback, private or link-local address, like another container or a service on your private network. It applies only to the configured origin, never to a URL that a client supplied, and chop prints a warning on startup. Without it, an origin whose address is an IP literal in a blocked range is an invalid setting, and one whose name resolves to a blocked range is a `404`.
