# Caching

## Caching with nginx

Put an nginx cache in front of chop. Responses depend on the `Accept` header, and `Vary: Accept` alone makes nginx cache a separate copy for every distinct `Accept` string. Browsers send dozens of them, but chop only produces three variants of an image: AVIF, WebP and the source format. Collapse the header into those three buckets, use the bucket in the cache key, and send the same bucket upstream, so that the body in the cache always matches its key:

```nginx
# A listed image/avif or image/webp (without q=0) selects the bucket. The first match wins, so AVIF goes first.
map $http_accept $chop_bucket {
	default                         original;
	"~*image/avif(?!\s*;\s*q=0)"    avif;
	"~*image/webp(?!\s*;\s*q=0)"    webp;
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
		proxy_cache_valid 200 30d;
		proxy_cache_valid 404 1m;
		# Not "any": a 502 or 504 from a slow origin must not be cached.
		proxy_set_header Accept $chop_accept;

		# The bucket is the cache key, so don't add a second key from the raw Accept header.
		proxy_ignore_headers Vary;

		# chop's Vary: Accept still reaches clients and CDNs in front of nginx.
		add_header X-Cache-Status $upstream_cache_status;
	}
}
```

How it works:

- A request without `image/avif` or `image/webp`, or with `q=0` for them, is the `original` bucket, and chop answers in the source format, as it would for any client without `Accept`.
- `image/*` and `*/*` don't select a bucket, the same as in chop, so a client that only accepts wildcards gets a format that it can display.
- A cached response always has the format that its bucket gets from chop, since the key and the upstream header come from the same variable.
- Only the `Accept` header and the URL select a variant, so a purge needs three keys per URL, one for each bucket, like `$host$uri$is_args$args|avif`.
- chop's strong `ETag` and `If-None-Match` handling work through the cache, and the `ETag` of an image is the same for every `Accept` that gets the same bytes.
- Cache only `200` and `404`, as the recipe does, and not `any`. A `502` or `504` means that the origin failed for a moment, and caching it would keep a broken image for as long as the `proxy_cache_valid` time. chop sends `Cache-Control: no-store` with every error, which nginx respects unless you ignore that header.
- For remote originals, `proxy_cache_lock on` makes concurrent requests for the same variant wait for one fetch, and `proxy_cache_min_uses 2` keeps one-off requests for unusual sizes out of the cache. See [Securing remote origins](security.md).
- If you disable AVIF in chop (`CHOP_AVIF=false`), the `avif` bucket holds WebP, which is correct but caches the same image twice. Remove the AVIF line from the first `map` then.

Pass the `Accept` buckets on to any CDN in front of nginx in the same way, with a custom cache key built from a normalized header, and see [CDN and caching](caching.md#cdn-and-caching).

## CDN and caching

The [nginx recipe](caching.md#caching-with-nginx) covers the cache next to chop. Responses depend on the `Accept` header, so the CDN must use it in the cache key, or at least whether it lists `image/avif` and `image/webp`. Every response has `Vary: Accept`, but many CDNs ignore `Vary` unless configured, and without it a cached AVIF can be sent to a browser that can't display it. Normalizing `Accept` at the edge to a small set of values (`image/avif,image/webp`, `image/webp` and none) keeps the number of cached variants low.

The responses are immutable by design (`Cache-Control: public, max-age=31536000` by default and a strong `ETag`), so change the URL, for example with `?ver=3`, when an original changes, which also holds for a remote origin, since chop doesn't cache originals and doesn't look at the cache headers of the origin. Set `allowedWidths` to the widths of your `srcset` so that the server can't be used to generate unbounded variants, and put the server behind the CDN only. Use `/healthz` for health checks.
