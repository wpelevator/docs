# Configuration (/js/chop/latest/configuration.html)

Settings come from the `CHOP_*` environment variables of the command, from the options of [`createConfig()`](library.html.md), or from a few [command line flags](cli.html.md). A number or boolean that can't be parsed is reported with the name of the variable, and a value that can't be used is an invalid setting.

| Setting | Environment variable | Default | Description |
| --- | --- | --- | --- |
| `dataDir` | `CHOP_DATA_DIR` | `/data` | Directory with the originals, when there is no `origin`. |
| `schemes` | `CHOP_SCHEMES` (comma separated) | `query` | Names of the URL schemes, tried in order. An unknown name is an invalid setting. |
| `maxAge` | `CHOP_MAX_AGE` | `31536000` | Seconds in `Cache-Control: max-age`. |
| `maxConcurrency` | `CHOP_MAX_CONCURRENCY` | number of CPUs | Images processed at the same time. |
| `maxQueue` | `CHOP_MAX_QUEUE` | `64` | Requests that wait for a slot, in arrival order. More are a `503`. |
| `maxInputBytes` | `CHOP_MAX_INPUT_BYTES` | `52428800` | Largest original in bytes. |
| `maxInputPixels` | `CHOP_MAX_INPUT_PIXELS` | `120000000` | Largest original in pixels, which stops decompression bombs. |
| `maxOutputDimension` | `CHOP_MAX_OUTPUT_DIMENSION` | `8192` | Largest output width or height. |
| `maxUpscaleDimension` | `CHOP_MAX_UPSCALE_DIMENSION` | `4096` | Largest long side of an enlarged image with `upscale=1`. |
| `jpegQuality` | `CHOP_JPEG_QUALITY` | `82` | Default JPEG quality. |
| `webpQuality` | `CHOP_WEBP_QUALITY` | `80` | Default lossy WebP quality. |
| `avifQuality` | `CHOP_AVIF_QUALITY` | `55` | Default AVIF quality. |
| `avif` | `CHOP_AVIF` | `true` | Whether AVIF output is enabled. `false` removes `avif` from `autoFormats`, and doesn't affect an explicit `format=avif`. |
| `avifEffort` | `CHOP_AVIF_EFFORT` | `4` | AVIF encoder effort from 0 (fast) to 9 (small). |
| `allowedWidths` | `CHOP_ALLOWED_WIDTHS` (comma separated) | unset | When set, the output width of every request must be in the list. |
| `origin` | `CHOP_ORIGIN` | unset | Base URL that plain paths are appended to, instead of the data directory, or `s3://bucket[/prefix]` for an [S3 bucket](s3.html.md). Can't be combined with an explicit `dataDir`. |
| `originAllowHttp` | `CHOP_ORIGIN_ALLOW_HTTP` | `false` | Allow `http://` for the origin and for URL sources. |
| `originAllowPrivate` | `CHOP_ORIGIN_ALLOW_PRIVATE` | `false` | Allow the configured origin at a loopback, private or link-local address. Never applies to URL sources. |
| `originAuth` | `CHOP_ORIGIN_AUTH` | unset | `Authorization` header value for the configured origin only. |
| `s3Endpoint` | `CHOP_S3_ENDPOINT` | unset | Base URL of an S3-compatible service for an `s3://` origin. Unset means AWS. |
| `s3Region` | `CHOP_S3_REGION`, `AWS_REGION` | unset | Region to sign for. Required on AWS, `us-east-1` with an endpoint, `auto` for R2. |
| `s3PathStyle` | `CHOP_S3_PATH_STYLE` | `true` with an endpoint, `false` on AWS | Put the bucket in the path instead of the host. Buckets with dots on AWS are always path-style. |
| `s3AccessKeyId` | `CHOP_S3_ACCESS_KEY_ID`, `AWS_ACCESS_KEY_ID` | unset | Access key. Without a key and a secret requests are unsigned. |
| `s3SecretAccessKey` | `CHOP_S3_SECRET_ACCESS_KEY`, `AWS_SECRET_ACCESS_KEY` | unset | Secret of the access key. Environment only, never logged. |
| `s3SessionToken` | `CHOP_S3_SESSION_TOKEN`, `AWS_SESSION_TOKEN` | unset | Token of temporary credentials, which isn't refreshed. Environment only, never logged. |
| `originConnectTimeout` | `CHOP_ORIGIN_CONNECT_TIMEOUT` | `3000` | Milliseconds to connect, including TLS, before a `504`. |
| `originTimeout` | `CHOP_ORIGIN_TIMEOUT` | `10000` | Milliseconds for the whole download before a `504`. |
| `originConcurrency` | `CHOP_ORIGIN_CONCURRENCY` | `4` | Downloads at the same time, outside of the processing slots. |
| `originQueue` | `CHOP_ORIGIN_QUEUE` | `32` | Downloads that wait for a slot. More are a `503`. |
| `allowedHosts` | `CHOP_ALLOWED_HOSTS` (comma separated) | unset | Hosts that URL sources may name: `host`, `*.example.com`, `host:port` or `*`. Unset means no URL sources. |
| `allowedInputFormats` | `CHOP_ALLOWED_INPUT_FORMATS` (comma separated) | `jpeg,png,gif,webp,avif` | The formats of the originals that are processed (`jpeg` or `jpg`, `png`, `gif`, `webp`, `avif`). Others are a `415`. An empty list or an unknown name is an invalid setting. |
| `autoFormats` | `CHOP_AUTO_FORMATS` (comma separated, or `none`) | `avif,webp` | The formats that `format=auto` can negotiate, in order of preference (`avif`, `webp`). An empty list (`none` in the environment) disables the upgrades. Unknown or repeated names are an invalid setting. |
