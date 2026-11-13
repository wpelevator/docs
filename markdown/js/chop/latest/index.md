# chop

An HTTP image server for responsive images, with AVIF and WebP chosen from the Accept header.

`@wpelevator/chop` is an HTTP image server for responsive images. It serves resized, converted and optimized copies of originals from a local data directory, from an HTTP(S) origin or from an S3 bucket, and chooses AVIF, WebP or the original format from the `Accept` header of each request. It's built on [sharp](https://sharp.pixelplumbing.com/), which is its only runtime dependency, and works as a command line server or as a library with a request handler that doesn't depend on an HTTP framework.

It's read-only: it never writes to the data directory or any other directory. With a data directory, which is the default, it makes no network requests. Remote originals are opt-in, are fetched with strict [safeguards](security.md), and only from the configured origin or from hosts that you list. Authentication, URL signing and per-client rate limits are left to a CDN or a reverse proxy. The behavior is summarized in the [reference](reference.md).

## Install

```bash
npm install @wpelevator/chop
```

Requires Node.js 22.12 or later. There is also a container image, `ghcr.io/wpelevator/chop`, described in the [chop Docker README](https://github.com/wpelevator/basement/tree/main/packages/docker/chop).

## Start the server

```bash
chop --data /var/www/wp-content/uploads --port 8080
```

Then request `http://localhost:8080/2026/05/photo.jpg?w=300` to get `<data>/2026/05/photo.jpg` at 300 pixels wide, as AVIF or WebP when the `Accept` header of the client lists them. The [CLI](cli.md) page lists the options and exit codes.

## Guides

- [CLI](./cli.md)
- [Requests and query arguments](./requests.md)
- [URL schemes](./url-schemes.md)
- [Sources: data directory, HTTP origin and URL sources](./sources.md)
- [S3 and S3-compatible storage](./s3.md)
- [Securing remote origins](./security.md)
- [Formats and quality](./formats.md)
- [Responses and errors](./responses.md)
- [Caching with nginx and a CDN](./caching.md)
- [Configuration](./configuration.md)
- [Library API](./library.md)
- [Development](./development.md)
- [Reference](./reference.md)
