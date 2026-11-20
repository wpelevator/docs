# Cache images

What chop sends so caches can keep each image variant, and how to cache it at a CDN or with nginx next to chop.

Every variant of an image is built once and then served from a cache. chop sends what a cache needs: a strong `ETag`, a one year `Cache-Control` and `Vary: Accept`. A request that repeats the `ETag` in `If-None-Match` gets a `304` with no body:

```sh
url='http://localhost:8080/2026/05/photo.jpg?w=300'
etag=$(curl -fsS -D - -o /dev/null "$url" | sed -n 's/^etag: //p' | tr -d '\r')
curl -fsS -D - -o /dev/null -H "If-None-Match: $etag" "$url"
```

```text
HTTP/1.1 304 Not Modified
etag: "<etag>"
cache-control: public, max-age=31536000
vary: Accept
chop-status: transformed
x-content-type-options: nosniff
```

Chop builds the `ETag` from the output bytes, `Chop-Status` and `Chop-Bytes-Saved`. A change to any of them makes the previous `ETag` stale. When a cache sends that stale tag as its only `If-None-Match` value, Chop returns `200` with fresh headers.

chop doesn't cache anything itself. `Vary: Accept` makes a plain cache keep one copy per distinct `Accept` string, so the cache has to reduce that to the variants chop makes.

| Where the cache runs | Where to read |
| --- | --- |
| Next to chop, on your own server | [Cache with nginx](nginx-cache.md) |
| At a CDN in front of your server | [At a CDN](#at-a-cdn) below |

## At a CDN

Responses depend on the `Accept` header, so the CDN must use it in the cache key, or at least whether it lists `image/avif` and `image/webp`. Every response has `Vary: Accept`, but many CDNs ignore `Vary` unless configured, and without it a cached AVIF can be sent to a browser that can't display it. Normalizing `Accept` at the edge to a small set of values (`image/avif,image/webp`, `image/webp` and none) keeps the number of cached variants low.

The responses are immutable by design (`Cache-Control: public, max-age=31536000` by default and a strong `ETag`), so change the URL, for example with `?ver=3`, when an original changes, which also holds for a remote origin, since chop doesn't cache originals and doesn't look at the cache headers of the origin. Set `allowedWidths` to the widths of your `srcset` so that the server can't be used to generate unbounded variants, and put the server behind the CDN only. Use `/healthz` for health checks.

The [nginx recipe](nginx-cache.md) shows the same normalization for a cache that runs next to chop.

### Avoid stampedes at a CDN

Many requests for a variant that isn't cached yet each make chop build it, unless the cache collapses them. If your CDN has request collapsing (also called a cache lock or request coalescing), turn it on, and use a tiered cache or an origin shield if it has one, so that misses from different locations reach chop once. Check that the collapsed requests wait as long as chop may take, because a lock that gives up early sends them all to chop. Warm the variants after a purge. [Avoid stampedes](nginx-cache.md#avoid-stampedes) lists the same measures for nginx.

## Upgrade from `X-Bytes-Saved`

Switch clients to `Chop-Bytes-Saved`. ETags issued before the rename become stale after the upgrade. Caches can still serve fresh entries with `X-Bytes-Saved` until they expire. If clients need the new header immediately, purge the cached image variants or change the image URLs to bypass caches you cannot purge.

## Reference

- Only the `Accept` header and the URL select a variant. A cache can key on the URL and one of three buckets: `image/avif`, `image/webp` or neither.
- Errors have `Cache-Control: no-store`. Don't cache a `502` or a `504`, because they mean the origin failed for a moment.
- `/healthz` answers `ok` for health checks and has `Cache-Control: no-store`.
- A `HEAD` request is processed like a `GET`, because its headers include `Content-Length`. Don't forward `HEAD` requests for remote originals from a proxy unless you need them.
