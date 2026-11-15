# Configuration

Every chop setting and its CHOP_ environment variable, with defaults, for the command and the library.

Every setting is a `CHOP_*` environment variable, so a container or a service file configures chop without flags. This run limits the output widths, lowers the JPEG quality and turns AVIF off:

```sh
CHOP_ALLOWED_WIDTHS=320,640,1280 CHOP_JPEG_QUALITY=75 CHOP_AVIF=false chop --data ./uploads
```

```text
chop listening on http://0.0.0.0:8080, serving /home/me/uploads
```

A value that can't be used stops the server with exit code `2` and names the variable or setting, so a typo shows up at startup and not in production:

```sh
CHOP_MAX_QUEUE=abc chop --data ./uploads
```

```text
CHOP_MAX_QUEUE must be a whole number, got "abc".
```

## Reference

Settings come from the `CHOP_*` environment variables of the command, from the options of [`createConfig()`](library.md), or from a few [command line flags](cli.md). A number or boolean that can't be parsed is reported with the name of the variable, and a value that can't be used is an invalid setting.

### Source and URLs

Where originals come from and how URLs are read. See [Choose where originals come from](sources.md).

| Setting | Environment variable | Default | Description |
| --- | --- | --- | --- |
| `dataDir` | `CHOP_DATA_DIR` | `/data` | Directory with the originals, when there is no `origin`. |
| `schemes` | `CHOP_SCHEMES` (comma separated) | `query` | Names of the URL schemes, tried in order. An unknown name is an invalid setting. |

### Limits

What one request can cost. See [Prepare chop for production](production-checklist.md).

| Setting | Environment variable | Default | Description |
| --- | --- | --- | --- |
| `maxConcurrency` | `CHOP_MAX_CONCURRENCY` | number of CPUs | Images processed at the same time. |
| `maxQueue` | `CHOP_MAX_QUEUE` | `64` | Requests that wait for a slot, in arrival order. More are a `503`. |
| `maxInputBytes` | `CHOP_MAX_INPUT_BYTES` | `52428800` | Largest original in bytes. |
| `maxInputPixels` | `CHOP_MAX_INPUT_PIXELS` | `120000000` | Largest original in pixels, which stops decompression bombs. |
| `maxOutputDimension` | `CHOP_MAX_OUTPUT_DIMENSION` | `8192` | Largest output width or height. |
| `maxUpscaleDimension` | `CHOP_MAX_UPSCALE_DIMENSION` | `4096` | Largest long side of an enlarged image with `upscale=1`. |
| `allowedWidths` | `CHOP_ALLOWED_WIDTHS` (comma separated) | unset | When set, the output width of every request must be in the list, after clamping to the size of the original. A request without `w` is a `400` unless the original's width is listed. |

### Formats and quality

See [Serve AVIF and WebP](formats.md) and [Set quality and strip metadata](quality-and-metadata.md).

| Setting | Environment variable | Default | Description |
| --- | --- | --- | --- |
| `jpegQuality` | `CHOP_JPEG_QUALITY` | `82` | Default JPEG quality. |
| `webpQuality` | `CHOP_WEBP_QUALITY` | `80` | Default lossy WebP quality. |
| `avifQuality` | `CHOP_AVIF_QUALITY` | `55` | Default AVIF quality. |
| `avif` | `CHOP_AVIF` | `true` | Whether AVIF output is enabled. `false` removes `avif` from `autoFormats`, and doesn't affect an explicit `format=avif`. |
| `avifEffort` | `CHOP_AVIF_EFFORT` | `4` | AVIF encoder effort from 0 (fast) to 9 (small). |
| `allowedInputFormats` | `CHOP_ALLOWED_INPUT_FORMATS` (comma separated) | `jpeg,png,gif,webp,avif` | The formats of the originals that are processed (`jpeg` or `jpg`, `png`, `gif`, `webp`, `avif`). Others are a `415`. An empty list or an unknown name is an invalid setting. Added in 0.2.0. |
| `autoFormats` | `CHOP_AUTO_FORMATS` (comma separated, or `none`) | `avif,webp` | The formats that `format=auto` can negotiate, in order of preference (`avif`, `webp`). An empty list (`none` in the environment) disables the upgrades. Unknown or repeated names are an invalid setting. Added in 0.2.0. |

### Caching headers

See [Cache images](caching.md).

| Setting | Environment variable | Default | Description |
| --- | --- | --- | --- |
| `maxAge` | `CHOP_MAX_AGE` | `31536000` | Seconds in `Cache-Control: max-age`. |

### Remote origins and URL sources

See [Serve images from an HTTPS origin](https-origin.md), [Let requests name the image URL](url-sources.md) and [Secure remote origins](security.md).

| Setting | Environment variable | Default | Description |
| --- | --- | --- | --- |
| `origin` | `CHOP_ORIGIN` | unset | Base URL that plain paths are appended to, instead of the data directory, or `s3://bucket[/prefix]` for an [S3 bucket](s3.md). Can't be combined with an explicit `dataDir`. Added in 0.2.0. |
| `originAllowHttp` | `CHOP_ORIGIN_ALLOW_HTTP` | `false` | Allow `http://` for the origin and for URL sources. Added in 0.2.0. |
| `originAllowPrivate` | `CHOP_ORIGIN_ALLOW_PRIVATE` | `false` | Allow the configured origin at a loopback, private or link-local address. Never applies to URL sources. Added in 0.2.0. |
| `originAuth` | `CHOP_ORIGIN_AUTH` | unset | `Authorization` header value for the configured origin only. Added in 0.2.0. |
| `originConnectTimeout` | `CHOP_ORIGIN_CONNECT_TIMEOUT` | `3000` | Milliseconds to connect, including TLS, before a `504`. Added in 0.2.0. |
| `originTimeout` | `CHOP_ORIGIN_TIMEOUT` | `10000` | Milliseconds for the whole download before a `504`. Added in 0.2.0. |
| `originConcurrency` | `CHOP_ORIGIN_CONCURRENCY` | `4` | Downloads at the same time, outside of the processing slots. Added in 0.2.0. |
| `originQueue` | `CHOP_ORIGIN_QUEUE` | `32` | Downloads that wait for a slot. More are a `503`. Added in 0.2.0. |
| `allowedHosts` | `CHOP_ALLOWED_HOSTS` (comma separated) | unset | Hosts that URL sources may name: `host`, `*.example.com`, `host:port` or `*`. Unset means no URL sources. Added in 0.2.0. |

### S3

See [Serve images from S3](s3.md).

| Setting | Environment variable | Default | Description |
| --- | --- | --- | --- |
| `s3Endpoint` | `CHOP_S3_ENDPOINT` | unset | Base URL of an S3-compatible service for an `s3://` origin. Unset means AWS. Added in 0.2.0. |
| `s3Region` | `CHOP_S3_REGION`, `AWS_REGION` | unset | Region to sign for. Required on AWS, `us-east-1` with an endpoint, `auto` for R2. Added in 0.2.0. |
| `s3PathStyle` | `CHOP_S3_PATH_STYLE` | `true` with an endpoint, `false` on AWS | Put the bucket in the path instead of the host. Buckets with dots on AWS are always path-style. Added in 0.2.0. |
| `s3AccessKeyId` | `CHOP_S3_ACCESS_KEY_ID`, `AWS_ACCESS_KEY_ID` | unset | Access key. Without a key and a secret requests are unsigned. Added in 0.2.0. |
| `s3SecretAccessKey` | `CHOP_S3_SECRET_ACCESS_KEY`, `AWS_SECRET_ACCESS_KEY` | unset | Secret of the access key. Environment only, never logged. Added in 0.2.0. |
| `s3SessionToken` | `CHOP_S3_SESSION_TOKEN`, `AWS_SESSION_TOKEN` | unset | Token of temporary credentials, which isn't refreshed. Environment only, never logged. Added in 0.2.0. |

### Variables of the command only

These are read by the `chop` command, and not by `createConfig()` or `createHandler()`.

| Variable | Flag | Default | Description |
| --- | --- | --- | --- |
| `PORT`, then `CHOP_PORT` | `--port` | `8080` | Port to listen on. `0` picks a free port. |
| `CHOP_HOST` | `--host` | `0.0.0.0` | Address to listen on. |
| `CHOP_ACCESS_LOG` | none | unset | `1` prints one JSON line per request to the standard output. |

`maxConcurrency` defaults to the number of CPUs.
