# chop

An HTTP image server that resizes images on request and picks AVIF, WebP or the original format from the Accept header.

Serve one original image as many sizes and formats, from a URL, with no build step. chop reads originals from a folder, an HTTPS origin or an S3 bucket, resizes them with [sharp](https://sharp.pixelplumbing.com/), and picks AVIF, WebP or the source format from the `Accept` header of each request.

```sh
npx @wpelevator/chop --data /var/www/wp-content/uploads --port 8080
```

```text
chop listening on http://0.0.0.0:8080, serving /var/www/wp-content/uploads
```

A browser that accepts AVIF and requests `/2026/05/photo.jpg?w=300` gets a 300 pixel wide AVIF of the original. The [quickstart](quickstart.md) shows the request and the response headers.

## What you get

- Resizing, cropping and padding from query arguments such as `w`, `resize` and `lb`, or from Cloudflare-style `/cdn-cgi/image/` URLs. See [Resize, crop and pad images](resize-and-crop.md) and [Migrate from Cloudflare Image Resizing](from-cloudflare.md).
- AVIF or WebP when the client lists them in `Accept`, with `Vary: Accept`, a strong `ETag` and a one year `Cache-Control`. See [Serve AVIF and WebP](formats.md).
- Read-only access. chop never writes to the data directory or any other directory, and with a data directory, the default, it makes no network requests.
- Opt-in remote originals with [safeguards](security.md): no redirects, checked addresses, a size cap and timeouts.
- A command line server and a [library](library.md) with a request handler that doesn't depend on an HTTP framework. sharp is the only runtime dependency.

Authentication, URL signing and per-client rate limits belong to a CDN or a reverse proxy in front of chop.

## Install

```sh
npm install @wpelevator/chop
```

Requires Node.js 22.12 or later. The examples use the bare `chop` command, which exists after the install. Before it, use `npx @wpelevator/chop`, because bare `npx chop` doesn't run this package. The container image is `ghcr.io/wpelevator/chop`, described in [Run chop in Docker](docker.md).

## Pick a task

| You want to | Page |
| --- | --- |
| Try it in a minute | [Quickstart](quickstart.md) |
| Resize, crop or pad an image | [Resize, crop and pad images](resize-and-crop.md) |
| Write a `srcset` and limit the widths | [Serve responsive images](responsive-images.md) |
| Serve AVIF and WebP | [Serve AVIF and WebP](formats.md) |
| Set quality or remove metadata | [Set quality and strip metadata](quality-and-metadata.md) |
| Serve transparent PNGs and animated GIFs | [Serve transparent and animated images](animated-and-transparent.md) |
| Read originals from a folder, a site, S3 or named hosts | [Choose where originals come from](sources.md), [Serve images from S3](s3.md) |
| Expose a remote origin safely | [Secure remote origins](security.md) |
| Run it in a container | [Run chop in Docker](docker.md) |
| Get ready for real traffic | [Prepare chop for production](production-checklist.md) |
| Cache each variant once, with nginx or at a CDN | [Cache images](caching.md), [Cache with nginx](nginx-cache.md) |
| Fix an error | [Troubleshoot chop](troubleshooting.md) |
| Move from Photon or Cloudflare Image Resizing | [Migrate from Photon](from-photon.md), [Migrate from Cloudflare Image Resizing](from-cloudflare.md) |
| Run the server and read its logs | [Run the server](cli.md) |
| Look up a setting or a status code | [Configuration](configuration.md), [Responses and errors](responses.md) |
| Embed the handler in your own server | [Library API](library.md) |
| See what changed in each release | [Changelog](https://wpelevator.github.io/docs/js/chop/latest/changelog.html) |
| Work on chop itself | [Development](development.md) |
