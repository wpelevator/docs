# Prepare chop for production

The settings and surroundings to check before chop serves real traffic, limits, allowed widths, a cache, a read-only container and the startup warnings.

Set the limits, allow the widths you use, and put a cache in front. A server with the defaults accepts originals up to 50 MiB and any output width up to 8192, which is more than a typical site needs. This run lowers the limits, allows four widths and prints an access log:

```sh
CHOP_ALLOWED_WIDTHS=320,640,960,1280 \
CHOP_MAX_INPUT_BYTES=10485760 \
CHOP_MAX_INPUT_PIXELS=50000000 \
CHOP_AUTO_FORMATS=webp \
CHOP_ACCESS_LOG=1 \
chop --data /var/www/uploads
```

An original over the limit is then a `413` with a plain message, and the client learns nothing about your files:

```text
HTTP/1.1 413 Payload Too Large
content-type: text/plain; charset=utf-8
content-length: 32
cache-control: no-store
x-content-type-options: nosniff

The original image is too large.
```

That output came from `CHOP_MAX_INPUT_BYTES=1000` and a 1.3 MB test image.

## Checklist

- **Cache in front.** Responses are built on request and are not stored. Run [nginx](nginx-cache.md) or a [CDN](caching.md#at-a-cdn) so each variant is built once, and let only the cache reach chop.
- **Limit the widths.** `CHOP_ALLOWED_WIDTHS` bounds the number of variants that anyone can make. See [Serve responsive images](responsive-images.md).
- **Lower the input limits.** `CHOP_MAX_INPUT_BYTES` (default `52428800`) and `CHOP_MAX_INPUT_PIXELS` (default `120000000`) bound what one request can make chop decode. Set them to the largest original that you serve.
- **Size the concurrency.** `CHOP_MAX_CONCURRENCY` images are processed at once, by default the number of CPUs, and `CHOP_MAX_QUEUE` (default `64`) more wait. A full queue is a `503` with `Retry-After: 1`. For a remote origin, the memory in use can reach `CHOP_ORIGIN_CONCURRENCY` (default `4`) times `CHOP_MAX_INPUT_BYTES`, so lower one of them on a small machine.
- **Decide on AVIF.** AVIF takes more CPU to encode than WebP. `CHOP_AUTO_FORMATS=webp` avoids it, and an explicit `format=avif` still works. See [Serve AVIF and WebP](formats.md).
- **Run read-only.** chop never writes to disk, so a container can run with `--read-only --cap-drop ALL`. See [Run chop in Docker](docker.md).
- **Pin the version.** Use a version tag of the image or of the npm package, and not `latest`.
- **Check the startup warnings.** Each risky setting prints a `warning:` line on the standard error: `CHOP_ALLOWED_HOSTS=*`, `CHOP_ORIGIN_ALLOW_HTTP`, `CHOP_ORIGIN_ALLOW_PRIVATE` and an S3 origin without credentials. Fix them or accept them on purpose.
- **Watch the origin failures.** The reason for a refused or failed origin request goes to the standard error as `origin <code>: <reason>`, and never to the client. See [Troubleshoot chop](troubleshooting.md).
- **Know that it works.** `CHOP_ACCESS_LOG=1` prints one JSON line per request with the status and duration, and the `X-Cache-Status` header of the [nginx recipe](nginx-cache.md) shows hits and misses, including on errors. Watch the `502`, `503` and `504` counts.
- **Health checks.** Use `/healthz`. It answers `ok` without touching the data directory or the origin.
- **Authentication and rate limits.** chop has neither. Put them in the proxy in front.
