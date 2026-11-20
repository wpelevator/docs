# Secure remote origins

Protect a chop server that fetches remote originals, and see what it checks on every fetch.

Remote originals are off by default, and chop checks every connection it makes. A URL source that names a loopback address is refused even when its host is on `CHOP_ALLOWED_HOSTS`, and the reason goes to the standard error while the client gets a plain `404`:

```sh
CHOP_ORIGIN_ALLOW_HTTP=1 CHOP_ALLOWED_HOSTS=127.0.0.1:9000 npx @wpelevator/chop --data ./uploads
```

```text
warning: originAllowHttp is on: images are fetched over plain http, which anyone on the network path can read or change.
chop listening on http://0.0.0.0:8080, serving /home/me/uploads
origin ERR_NOT_FOUND: 127.0.0.1 is a blocked address
```

The last line appeared when a client requested `/http://127.0.0.1:9000/2026/05/photo.jpg?w=300`. The same request without `CHOP_ALLOWED_HOSTS` is a `404` and prints nothing.

Opening the server to every host prints a warning at startup:

```sh
CHOP_ALLOWED_HOSTS='*' npx @wpelevator/chop --data ./uploads
```

```text
warning: allowedHosts is "*": any client can make chop fetch images from any public host, which makes it an open image proxy. Only the address checks (no loopback, private, link local or metadata addresses), the size and time limits and the fetch limit still apply. Put an egress firewall in front of this server, and pair it with allowedWidths, maxInputBytes and a proxy cache.
chop listening on http://0.0.0.0:8080, serving /home/me/uploads
```

## Recommendations

A trusted proxy or a CDN limits who can send requests to chop. It doesn't decide where chop connects, because the proxy passes the path of the request through. The protection against reaching internal hosts is in chop, and a proxy rule shouldn't be the only thing between a client and an internal address.

Prefer the configured origin. You fix the host, so a client can only choose a path under it, and there is no allow-list to maintain. Use `CHOP_ALLOWED_HOSTS` only when a client has to choose the host, and list the hosts that you mean. Every client that can reach chop can reach every host on the list.

`CHOP_ALLOWED_HOSTS=*` makes chop an open image proxy. Anyone who can send a request to chop can make it fetch and process images from any public host. The address checks, https, the size and time limits and the fetch limit still apply. They can't stop someone from spending your server and your bandwidth on the public internet, or from reaching a service at a public address that only accepts connections from your network. The protection that matters then is outside chop. If you use `*`:

- Run chop with an egress firewall that allows only what it needs, so that a gap in the address checks can't reach your network.
- Set `allowedWidths` to the widths of your `srcset`, and keep `maxInputBytes`, `maxInputPixels` and the `CHOP_ORIGIN_*` limits low.
- Cache in front, with `proxy_cache_min_uses 2` and `proxy_cache_lock on` as in the [nginx recipe](nginx-cache.md).
- Let only the proxy reach chop, and authenticate or sign the URLs there.

## Reference

### Remote originals in practice

- chop doesn't cache originals. The proxy caches the output, and a request that isn't cached downloads the original again.
- An original that changes at the same URL stays stale until the cached outputs expire or are purged. Use new URLs for new versions, as WordPress uploads do, or a short `CHOP_MAX_AGE`. chop ignores the upstream `Cache-Control`, `ETag` and `Last-Modified`.
- A `502` and a `504` have `Cache-Control: no-store`, and the proxy must not cache them. The [nginx recipe](nginx-cache.md) caches only `200`.
- Redirects aren't followed. An origin that redirects, such as a CDN that moves an object or adds a trailing slash, needs the final URL in `CHOP_ORIGIN`.
- chop uses HTTP/1.1 and always verifies TLS certificates. Add a private CA to Node.js with `NODE_EXTRA_CA_CERTS`.
- The credentials of `CHOP_ORIGIN_AUTH` go only to the configured origin, not even to a URL source on the same host. The `Accept` header of the client is never forwarded, so the bytes of an original don't depend on who asked.
- To keep chop local-only, let nginx `proxy_pass` to the origin and store the files in a directory that chop serves, or mount the bucket with rclone or s3fs. The [S3 origin](s3.md) needs no mount. Both options add a hop or a shared directory.

### What chop checks on every remote fetch

These checks apply to the configured origin and to URL sources, with any allow-list, including `*`.

Request:

- Only `https` is used, unless `CHOP_ORIGIN_ALLOW_HTTP` is set.
- The request is a `GET` with fresh headers: `Accept: image/*`, `Accept-Encoding: identity` and `User-Agent: chop`. chop forwards no cookie, `Authorization`, `Referer` or other header of the client.
- Redirects aren't followed. A `3xx` from the origin is a `502`, and so is a compressed response.

Addresses:

- chop resolves the host name once, checks every address, and connects to one of the addresses that it checked. DNS rebinding can't swap the address between the check and the connection.
- An address literal in a URL is checked in any notation, such as `2130706433`, `0x7f.1` or `[::ffff:7f00:1]`.
- chop never connects to loopback, private, link-local (including the cloud metadata address `169.254.169.254`), carrier-grade NAT, documentation, multicast or reserved ranges, for IPv4 and IPv6, including IPv4-mapped and NAT64 forms.
- If a name resolves to several addresses and any of them is blocked, chop makes no request.

Limits:

- chop cuts the body off at `maxInputBytes` while it reads it, whether or not the origin sends `Content-Length`. A larger `Content-Length` is a `413` before the body is read.
- Connecting, including the TLS handshake, must finish within `CHOP_ORIGIN_CONNECT_TIMEOUT` (3000 ms), and the whole download within `CHOP_ORIGIN_TIMEOUT` (10000 ms), or the answer is a `504`.
- At most `CHOP_ORIGIN_CONCURRENCY` downloads (4) run at the same time, and `CHOP_ORIGIN_QUEUE` (32) wait. More are a `503` with `Retry-After: 1`.
- Downloads don't use a processing slot, so a slow origin doesn't stop images from being processed. The memory in use can reach `CHOP_ORIGIN_CONCURRENCY` times `maxInputBytes`, so lower one of them on a small machine.

What the client learns:

- The body of a response that isn't a `200` is dropped without being read. The exception is an S3 bucket, where chop reads the first 2048 bytes of an error to find the error code for the operator.
- Upstream `404` and `410` are a `404`. A `401`, `403` or `407` and a destination that isn't allowed are the same plain `404`, so a client can't tell which hosts exist, which are blocked or whether the origin needs credentials.
- A host name that can't be resolved is a `502` for the configured origin and a plain `404` for a URL source.
- The reason goes only to the standard error, as a host and a short reason such as `127.0.0.1 is a blocked address`, and never to the client. An origin that fails or answers with another status is a `502`.
