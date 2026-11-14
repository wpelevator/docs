# Serve images from an HTTPS origin

Serve images from one fixed HTTPS origin, such as a WordPress uploads URL, with optional authorization, and no host chosen by clients.

Point chop at one origin and clients can only choose a path under it. This is the recommended way to use a remote origin, because you fix the host and there is no allow-list to maintain.

```sh
CHOP_ORIGIN=https://uploads.example.com/base npx @wpelevator/chop
```

```text
chop listening on http://0.0.0.0:8080, serving https://uploads.example.com/base
```

With the origin set, `/2026/05/photo.jpg` is fetched from `https://uploads.example.com/base/2026/05/photo.jpg`. Plain paths go to the origin instead of the data directory, so `CHOP_ORIGIN` can't be combined with an explicit `CHOP_DATA_DIR` or `--data`. chop makes no other network requests. The configured origin needs chop 0.2.0 or later.

The origin must be an `https://` URL without user information, a query string or a fragment. An origin that uses plain `http://` or a private address needs two more settings, and chop prints a warning for each at startup:

```sh
CHOP_ORIGIN=http://127.0.0.1:9000 CHOP_ORIGIN_ALLOW_HTTP=1 CHOP_ORIGIN_ALLOW_PRIVATE=1 npx @wpelevator/chop
```

```text
warning: originAllowPrivate is on: the origin may be at a loopback, private or link local address.
warning: originAllowHttp is on: images are fetched over plain http, which anyone on the network path can read or change.
chop listening on http://0.0.0.0:8080, serving http://127.0.0.1:9000
```

Without those settings the same command stops with exit code `2`:

```text
The setting origin must be an http(s) URL like https://uploads.example.com/base: http is only used when originAllowHttp (CHOP_ORIGIN_ALLOW_HTTP) is set.
```

An origin at a loopback address such as `127.0.0.1` needs `CHOP_ORIGIN_ALLOW_PRIVATE` as well, so setting only `CHOP_ORIGIN_ALLOW_HTTP` stops with a second error that asks for it.

## Common tasks

### Send credentials to a private origin

`CHOP_ORIGIN_AUTH` is the value of an `Authorization` header, like `Bearer <token>`. It is only sent to the configured origin and never to URL sources, it is read from the environment only, and it is never logged. A value with a line break or a control character is an invalid setting.

### Use another container as the origin

An origin that is another container or a private address needs `CHOP_ORIGIN_ALLOW_PRIVATE=1`, and plain `http://` needs `CHOP_ORIGIN_ALLOW_HTTP=1`. It applies only to the configured origin, never to a URL that a client supplied. Without it, an origin whose address is an IP literal in a blocked range is an invalid setting, and one whose name resolves to a blocked range is a `404`.

### Follow a redirect

chop doesn't follow redirects, and a `3xx` from the origin is a `502`. Put the final URL in `CHOP_ORIGIN`.

### Serve a bucket

Use [an S3 origin](s3.md) for a bucket with access keys.

## Reference

How a plain path becomes a URL: the base URL, its path without a trailing slash, and the path segments, each percent-encoded again, so a segment can't change the host, the port, the query string or the path of the base. The checks, limits and error statuses of every remote fetch are in [Secure remote origins](security.md#what-chop-checks-on-every-remote-fetch).
