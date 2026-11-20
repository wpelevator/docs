# Changelog

What changed in each release.

## 0.3.0 (2026-11-20)

- Add the versionless `Chop-Status` response header and rename `X-Bytes-Saved` to `Chop-Bytes-Saved`. Image ETags now account for the Chop headers so revalidation refreshes stale metadata. Update clients that read the old header and purge cached image variants or change their URLs if clients need the new header immediately. ([`7f8fbfc`](https://github.com/wpelevator/basement/commit/7f8fbfc729f8a27a2fe45f80318d9c67dcf90a53))
- Document how to avoid stampedes with the nginx cache: longer lock timeouts, stale copies while one request refreshes, no retries on a slow request, cache sizing and a warm-up. The recipe now sets them, and `proxy_cache_valid` is documented as a fallback to the `max-age` of chop. ([`3388be7`](https://github.com/wpelevator/basement/commit/3388be7b1c501c0158e3fa78e821c46da1d80972))

## 0.2.2 (2026-11-15)

- Reorganize the documentation by task, with real command output at the top of each page: a quickstart, pages to resize images, serve responsive images, serve AVIF and WebP, set quality, serve transparent and animated images, choose a source, serve from an HTTPS origin, S3 and named hosts, run in Docker, prepare for production, cache with nginx or a CDN, troubleshoot errors, and migrate from Photon or Cloudflare Image Resizing. The long reference page is gone, and its rules live in the pages that own them. ([`d447886`](https://github.com/wpelevator/basement/commit/d447886acf93e5d85236d796bdd2116b62f13da3))
- Start each documentation page with a `# Title` heading instead of a `title` in the front matter, so that the Markdown pages read well on GitHub and in `node_modules`. ([`ca287e4`](https://github.com/wpelevator/basement/commit/ca287e459833429482d3e033eb3eab81eaea3757))
- Point the package homepage to the documentation site, so that the Homepage link on the npm package page works without access to the private repository. ([`ca287e4`](https://github.com/wpelevator/basement/commit/ca287e459833429482d3e033eb3eab81eaea3757))

## 0.2.1 (2026-11-07)

- Make the exported DEFAULT_SETTINGS report the real maxConcurrency default of the number of CPUs, which createConfig used to compute separately after overriding the placeholder value. ([`c075de5`](https://github.com/wpelevator/basement/commit/c075de501e64fa95b0966a9b525e9fecaec3a6cb))
- Move the detailed usage documentation from the README into topic pages of the `docs/` directory, so that the docs site has a guide for each area besides the reference. ([`da8652c`](https://github.com/wpelevator/basement/commit/da8652c9da98ef8962c0f7dce9c398bb814c8620))
- Publish the `docs/` directory in the npm package, so that agents and editors can read the documentation of the installed version. ([`da8652c`](https://github.com/wpelevator/basement/commit/da8652c9da98ef8962c0f7dce9c398bb814c8620))

## 0.2.0 (2026-11-04)

- Add the allowedInputFormats and autoFormats settings (CHOP_ALLOWED_INPUT_FORMATS and CHOP_AUTO_FORMATS), and pick the negotiated format by the q-values of the Accept header. ([`496d04d`](https://github.com/wpelevator/basement/commit/496d04d2fa6f12c41c7e622140540e5f14b6e7da))
- Add an internal AWS Signature Version 4 signer for S3 and a per-request header hook on the HTTP origin, as groundwork for an S3 origin. ([`a038143`](https://github.com/wpelevator/basement/commit/a03814347a2cf6746352a67e1bef247685f2ee3c))
- Load originals from an HTTP(S) origin with CHOP_ORIGIN, or from allow-listed hosts named in URLs with CHOP_ALLOWED_HOSTS, through a pluggable origin interface, with pinned and blocked-address-checked connections, no redirects, a streaming size cap, timeouts and a separate fetch limit, in both the query and cloudflare schemes. ([`971a1cf`](https://github.com/wpelevator/basement/commit/971a1cf73e46e94c1042fbd45f66c565f4d7e62a))
- Add an S3 origin: CHOP_ORIGIN=s3://bucket[/prefix] reads originals from AWS S3 or an S3-compatible service (SeaweedFS, MinIO, R2) with AWS Signature Version 4 requests, configured with CHOP_S3_ENDPOINT, CHOP_S3_REGION, CHOP_S3_PATH_STYLE and the CHOP_S3_* or AWS_* credentials, with the S3 error codes in the operator log. ([`2099b59`](https://github.com/wpelevator/basement/commit/2099b591d7cfacedaa3a888beda6f15f4cdc737d))

## 0.1.1 (2026-11-04)

- Fix the README, which still said that the package is not published. ([`aaa907b`](https://github.com/wpelevator/basement/commit/aaa907b61665e7988c9cf8286f232f396ab6ecf6))

## 0.1.0 (2026-11-04)

- Add Chop, an HTTP image server with AVIF and WebP negotiation from the Accept header, resize, crop and letterbox, Cloudflare-style URLs through pluggable URL schemes, and a library and CLI. ([`2a83fd3`](https://github.com/wpelevator/basement/commit/2a83fd32f30eca1cd48bc711b3b3d00b95431a56))
- Publish the package to npm. ([`93cd789`](https://github.com/wpelevator/basement/commit/93cd78980c723b2f1cc81b1abaf02f2573d7c87c))

