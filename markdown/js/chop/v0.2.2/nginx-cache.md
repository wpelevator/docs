# Cache with nginx

An nginx cache for chop that keeps three variants of each image, AVIF, WebP and the original format.

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
		proxy_cache_lock on;
		# Cache 200 only. Errors have Cache-Control: no-store, which nginx respects.
		proxy_cache_valid 200 30d;
		# For remote originals, keep one-off requests for unusual sizes out of the cache.
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
- chop's strong `ETag` and `If-None-Match` handling work through the cache, and the `ETag` of an image is the same for every `Accept` that gets the same bytes.
- The recipe caches `200` only. A `502` or `504` means that the origin failed for a moment, and caching it would keep a broken image for as long as the `proxy_cache_valid` time. chop sends `Cache-Control: no-store` with every error, so nginx doesn't cache a `404` either. To cache `404` responses for a short time, add `proxy_ignore_headers Cache-Control` with `proxy_cache_valid 404 1m`, and don't use `any`.
- For remote originals, `proxy_cache_lock on` makes concurrent requests for the same variant wait for one fetch, and `proxy_cache_min_uses 2` (commented out in the recipe) keeps one-off requests for unusual sizes out of the cache. See [Secure remote origins](security.md).
- If you turn AVIF off in chop (`CHOP_AVIF=false`), the `avif` bucket holds WebP, which is correct but caches the same image twice. Remove the AVIF line from the first `map` then.

A CDN in front of nginx needs the same buckets: see [Cache at a CDN](caching.md#at-a-cdn).
