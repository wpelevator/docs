# Cache with nginx

An nginx cache for chop that keeps three variants of each image, AVIF, WebP and the original format, and builds each one once when many requests arrive together.

Run an nginx cache in front of chop so each variant of an image is built once. Responses depend on the `Accept` header, and `Vary: Accept` alone makes nginx cache a separate copy for every distinct `Accept` string. Browsers send dozens of them, but chop only produces three variants of an image: AVIF, WebP and the source format. Collapse the header into those three buckets, use the bucket in the cache key, and send the same bucket upstream, so that the body in the cache always matches its key.

Save this as an nginx configuration for the `http` context (in `/etc/nginx/conf.d` it already is) and point `proxy_pass` at chop:

```nginx
# A listed image/avif or image/webp, unless its q is 0, selects the bucket. The first match wins, so AVIF goes first.
map $http_accept $chop_bucket {
	default                         original;
	"~*image/avif(?!\s*;\s*q=0(\.0{0,3})?\s*(,|;|$))"    avif;
	"~*image/webp(?!\s*;\s*q=0(\.0{0,3})?\s*(,|;|$))"    webp;
}

# The Accept header that chop gets for each bucket. An empty value removes the header.
map $chop_bucket $chop_accept {
	default  "";
	avif     "image/avif,image/webp";
	webp     "image/webp";
}

proxy_cache_path /var/cache/nginx/chop levels=1:2 keys_zone=chop:50m max_size=10g inactive=30d use_temp_path=off;

server {
	listen 80;

	location / {
		proxy_pass http://chop:8080;
		proxy_cache chop;
		proxy_cache_key "$host$uri$is_args$args|$chop_bucket";
		# Make concurrent requests for the same variant wait for one build.
		proxy_cache_lock on;
		# The defaults of 5s send waiting requests to chop uncached when a build takes longer, so wait as long as nginx waits for chop.
		proxy_cache_lock_timeout 60s;
		proxy_cache_lock_age 60s;
		proxy_read_timeout 60s;
		# Don't retry a slow request on another address of chop, which doubles the work.
		proxy_next_upstream off;
		# Cache 200 only. Errors have Cache-Control: no-store, which nginx respects.
		# The max-age of chop takes precedence, so this only applies to responses without one.
		proxy_cache_valid 200 30d;
		# Send the old copy while one request builds the new one, and when chop fails.
		proxy_cache_use_stale error timeout updating http_502 http_503 http_504;
		proxy_cache_background_update on;
		# For remote originals, keep one-off requests for unusual sizes out of the cache. This costs one more request to chop per variant.
		# proxy_cache_min_uses 2;

		# Send chop the bucket, so the body in the cache always matches its key.
		proxy_set_header Accept $chop_accept;

		# The bucket is the cache key, so don't add a second key from the raw Accept header.
		proxy_ignore_headers Vary;

		# chop's Vary: Accept still reaches clients and CDNs in front of nginx.
		add_header X-Cache-Status $upstream_cache_status always;
	}
}
```

## How it works

- A request without `image/avif` or `image/webp`, or with `q=0` for them, is the `original` bucket. A type with any other `q`, such as `image/avif;q=0.5`, counts as listed, and chop answers in the source format, as it would for any client without `Accept`.
- `image/*` and `*/*` don't select a bucket, the same as in chop, so a client that only accepts wildcards gets a format that it can display.
- A cached response always has the format that its bucket gets from chop, since the key and the upstream header come from the same variable.
- Only the `Accept` header and the URL select a variant, so a purge needs three keys per URL, one for each bucket, like `$host$uri$is_args$args|avif`.
- chop's strong `ETag` and `If-None-Match` handling work through the cache, and requests with different `Accept` values share an `ETag` when the output bytes and Chop header values match.
- The recipe caches `200` only. A `502` or `504` means that the origin failed for a moment, and caching it would keep a broken image for as long as the `proxy_cache_valid` time. chop sends `Cache-Control: no-store` with every error, so nginx doesn't cache a `404` either. To cache `404` responses for a short time, add `proxy_ignore_headers Cache-Control` with `proxy_cache_valid 404 1m`, and don't use `any`.
- For remote originals, `proxy_cache_lock on` makes concurrent requests for the same variant wait for one fetch, and `proxy_cache_min_uses 2` (commented out in the recipe) keeps one-off requests for unusual sizes out of the cache. See [Secure remote origins](security.md) and [Avoid stampedes](#avoid-stampedes).
- If you turn AVIF off in chop (`CHOP_AVIF=false`), the `avif` bucket holds WebP, which is correct but caches the same image twice. Remove the AVIF line from the first `map` then.

## Avoid stampedes

A stampede is many requests for a variant that isn't cached yet. Without a cache lock, each of them makes chop decode the original and encode the image, and the work queues behind `CHOP_MAX_CONCURRENCY`. Once `CHOP_MAX_QUEUE` requests wait, chop answers `503` with `Retry-After: 1`, and those images fail to load. The recipe above prevents the common cases:

| Directive | What it prevents |
| --- | --- |
| `proxy_cache_lock on` | Concurrent misses for one variant all reaching chop. One request builds the image and the others wait for it. |
| `proxy_cache_lock_timeout 60s` and `proxy_cache_lock_age 60s` | The lock giving up. With the default `5s`, a request that waits longer goes to chop and its response isn't cached, and after `5s` the lock lets another request through. Keep both at least as long as `proxy_read_timeout`. |
| `proxy_cache_use_stale ... updating` and `proxy_cache_background_update on` | A refresh of an expired copy making every visitor wait. nginx sends the old copy at once and refreshes it with one request. Without them, each concurrent request for an expired copy reaches chop. |
| `http_502 http_503 http_504` in `proxy_cache_use_stale` | A restart or a busy chop breaking images that nginx still has an old copy of. |
| `proxy_next_upstream off` | A request that timed out being sent to another address of chop, when the name `chop` resolves to several containers. That doubles the work on an already busy server. |

In a test with an upstream that took 7 seconds to answer, six simultaneous requests for one uncached variant reached it six times with the default lock timeouts and once with `60s`. After the copy expired, four simultaneous requests reached it four times without `proxy_cache_use_stale ... updating` and once with it, and the visitors got an answer in about a millisecond.

These parts need more than the recipe:

- **Different variants don't share a lock.** A page with 20 images in `srcset` on an empty cache makes 20 builds at once, one per URL. Keep `CHOP_MAX_QUEUE` above the number of images that one page requests from a cold cache, and limit the variants with `CHOP_ALLOWED_WIDTHS`.
- **`proxy_cache_min_uses 2` costs a request.** The first request isn't cached and the second one is, so chop builds each variant twice. Use it for remote originals, where one-off URLs fill the cache, and not for a library of uploads that you serve.
- **Expiry follows chop.** nginx takes the lifetime from the `Cache-Control: max-age` of chop, one year by default, and uses `proxy_cache_valid` only for responses without one. A short `CHOP_MAX_AGE` makes every variant expire often, so keep it long and change the URL of an image that changes.
- **Size the cache for the images that you serve.** nginx removes the least recently used copies once `max_size` is reached, and chop builds them again on the next request. Set `max_size` to the total size of all variants, and check the `MISS` count in `X-Cache-Status` after a few days.
- **Warm the cache after you clear it.** A new cache, a purge or a changed `proxy_cache_key` starts empty, and the first visitors build every variant. Request the variants through nginx before you send traffic to it, once for each bucket and one at a time, which is about the rate that chop builds them:

  ```sh
  for accept in 'image/avif,image/webp' 'image/webp' 'image/jpeg'; do
  	for width in 320 640 1280; do
  		curl -fsS -o /dev/null -H "Accept: $accept" "http://localhost/2026/05/photo.jpg?w=$width"
  	done
  done
  ```

  The last value is the `original` bucket, since any `Accept` without a usable `image/avif` or `image/webp` selects it.

A CDN in front of nginx needs the same buckets: see [Cache at a CDN](caching.md#at-a-cdn).
