# Cache images

What chop sends so caches can keep each image variant, and how to cache it at a CDN or with nginx next to chop.

Every variant of an image is built once and then served from a cache. chop sends what a cache needs: a strong `ETag`, a one year `Cache-Control` and `Vary: Accept`. A request that repeats the `ETag` in `If-None-Match` gets a `304` with no body:

```sh
curl -s -D - -o /dev/null -H 'If-None-Match: "n-Yo3BGjnbvonRM2dNUyTQCA3dloKdxSNJ2CqjeBGDs"' 'http://localhost:8080/2026/05/photo.jpg?w=300'
```

```text
HTTP/1.1 304 Not Modified
etag: "n-Yo3BGjnbvonRM2dNUyTQCA3dloKdxSNJ2CqjeBGDs"
cache-control: public, max-age=31536000
vary: Accept
x-content-type-options: nosniff
```

The `ETag` is a SHA-256 of the output, so it changes only when the bytes change, and it is the same for every `Accept` header that gets the same bytes. Take the value from the response to your own first request, because it depends on the image. The same URL and `Accept` header always give the same bytes.

chop doesn't cache anything itself. `Vary: Accept` makes a plain cache keep one copy per distinct `Accept` string, so the cache has to reduce that to the variants chop makes.

| Where the cache runs | Where to read |
| --- | --- |
| Next to chop, on your own server | [Cache with nginx](nginx-cache.md) |
| At a CDN in front of your server | [At a CDN](#at-a-cdn) below |

## At a CDN

Responses depend on the `Accept` header, so the CDN must use it in the cache key, or at least whether it lists `image/avif` and `image/webp`. Every response has `Vary: Accept`, but many CDNs ignore `Vary` unless configured, and without it a cached AVIF can be sent to a browser that can't display it. Normalizing `Accept` at the edge to a small set of values (`image/avif,image/webp`, `image/webp` and none) keeps the number of cached variants low.

The responses are immutable by design (`Cache-Control: public, max-age=31536000` by default and a strong `ETag`), so change the URL, for example with `?ver=3`, when an original changes, which also holds for a remote origin, since chop doesn't cache originals and doesn't look at the cache headers of the origin. Set `allowedWidths` to the widths of your `srcset` so that the server can't be used to generate unbounded variants, and put the server behind the CDN only. Use `/healthz` for health checks.

The [nginx recipe](nginx-cache.md) shows the same normalization for a cache that runs next to chop.

## Reference

- Only the `Accept` header and the URL select a variant. A cache can key on the URL and one of three buckets: `image/avif`, `image/webp` or neither.
- Errors have `Cache-Control: no-store`. Don't cache a `502` or a `504`, because they mean the origin failed for a moment.
- `/healthz` answers `ok` for health checks and has `Cache-Control: no-store`.
- A `HEAD` request is processed like a `GET`, because its headers include `Content-Length`. Don't forward `HEAD` requests for remote originals from a proxy unless you need them.
