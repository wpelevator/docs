# chop (/js/chop/v0.2.1/index.html)

`@wpelevator/chop` is an HTTP image server for responsive images. It serves resized, converted and optimized copies of originals from a local data directory, from an HTTP(S) origin or from an S3 bucket, and chooses AVIF, WebP or the original format from the `Accept` header of each request. It's built on [sharp](https://sharp.pixelplumbing.com/), which is its only runtime dependency, and works as a command line server or as a library with a request handler that doesn't depend on an HTTP framework.

It's read-only: it never writes to the data directory or any other directory. With a data directory, which is the default, it makes no network requests. Remote originals are opt-in, are fetched with strict [safeguards](security.html.md), and only from the configured origin or from hosts that you list. Authentication, URL signing and per-client rate limits are left to a CDN or a reverse proxy. The behavior is summarized in the [reference](reference.html.md).

## Install [#install]

```bash
npm install @wpelevator/chop
```

Requires Node.js 22.12 or later. There is also a container image, `ghcr.io/wpelevator/chop`, described in the [chop Docker README](https://github.com/wpelevator/basement/tree/main/packages/docker/chop).

## Start the server [#start-the-server]

```bash
chop --data /var/www/wp-content/uploads --port 8080
```

Then request `http://localhost:8080/2026/05/photo.jpg?w=300` to get `<data>/2026/05/photo.jpg` at 300 pixels wide, as AVIF or WebP when the `Accept` header of the client lists them. The [CLI](cli.html.md) page lists the options and exit codes.

## Guides [#guides]

- [CLI](./cli.html.md)
- [Requests and query arguments](./requests.html.md)
- [URL schemes](./url-schemes.html.md)
- [Sources: data directory, HTTP origin and URL sources](./sources.html.md)
- [S3 and S3-compatible storage](./s3.html.md)
- [Securing remote origins](./security.html.md)
- [Formats and quality](./formats.html.md)
- [Responses and errors](./responses.html.md)
- [Caching with nginx and a CDN](./caching.html.md)
- [Configuration](./configuration.html.md)
- [Library API](./library.html.md)
- [Development](./development.html.md)
- [Reference](./reference.html.md)
