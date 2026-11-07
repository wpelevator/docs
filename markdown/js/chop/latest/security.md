# Securing remote origins (/js/chop/latest/security.html)

Putting chop behind a trusted proxy or a CDN limits who can send requests to it, and that's worth having. It doesn't decide where chop connects: the proxy still passes the path of the request to chop, so the protection against reaching internal hosts has to be in chop, and it is. Don't assume that a proxy rule is the only thing between a client and an internal address.

Prefer the configured origin. The host is fixed by you, so a client can only choose a path under it, and there is nothing to allow-list. Use `CHOP_ALLOWED_HOSTS` only when a client has to choose the host, and list the hosts that you mean. Every host on the list is reachable by every client that can reach chop.

`CHOP_ALLOWED_HOSTS=*` makes chop an open image proxy: anyone who can send a request to chop can make it fetch and process images from any public host. The address checks, https, the size and time limits and the fetch limit still apply, but they can't stop someone from using your server and your bandwidth to fetch from the public internet, or from reaching a service that only accepts connections from your server's network, at a public address. The protection that matters then is outside of chop. If you use `*`:

- Run chop with an egress firewall that only allows what it needs, so that a mistake in an address range can't reach your network.
- Set `allowedWidths` to the widths of your `srcset`, so that the output sizes are bounded, and keep `maxInputBytes`, `maxInputPixels` and the `CHOP_ORIGIN_*` limits low.
- Cache in front: `proxy_cache_min_uses 2` in the [nginx recipe](caching.html.md#caching-with-nginx) keeps one-off URLs out of the cache, and `proxy_cache_lock on` limits the fetches to one for each variant.
- Let only the proxy reach chop, and authenticate or sign the URLs there.

More to know about remote originals:

- chop doesn't cache originals. The proxy caches the output, and a request that isn't cached downloads the original again. An original that changes at the same URL stays stale until the cached outputs expire or are purged, so use new URLs for new versions (WordPress uploads do), or a short `CHOP_MAX_AGE`. The upstream `Cache-Control`, `ETag` and `Last-Modified` headers are ignored, and the output headers are the same as for local files.
- A `502` and a `504` have `Cache-Control: no-store`, and the proxy must not cache them. The nginx recipe only caches `200` and `404`.
- Redirects are not followed, so an origin that redirects (a CDN that moves an object, a trailing slash redirect) needs the final URL in `CHOP_ORIGIN`.
- Only HTTP/1.1 is used and TLS certificates are always verified. A private CA is added to Node.js with `NODE_EXTRA_CA_CERTS`.
- An alternative that keeps chop local-only is to let nginx `proxy_pass` to the origin and store the files in a directory that chop serves, or to mount the bucket with rclone or s3fs (or to use the [S3 origin](s3.html.md), which needs no mount). That needs a second hop and a shared directory, but chop makes no network requests then.
