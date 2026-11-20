# Choose where originals come from

Choose between a data directory, one HTTPS origin, an S3 bucket and URL sources for the originals chop serves.

chop reads originals from a directory, from one HTTPS origin, from an S3 bucket, or from hosts that you list. Every request reads exactly one of them. The first, a directory, is the default and makes no network requests:

```sh
npx @wpelevator/chop --data ./uploads
```

```text
chop listening on http://0.0.0.0:8080, serving /home/me/uploads
```

A plain path like `/2026/05/photo.jpg` is the file `uploads/2026/05/photo.jpg`. The real path, with symbolic links resolved, must be inside the data directory, and a missing file, a directory and an escape are all the same `404`. A file over `maxInputBytes` is a `413`.

| Originals are in | Setting | Page |
| --- | --- | --- |
| A directory on the server | `CHOP_DATA_DIR` or `--data` | This page |
| One HTTPS site | `CHOP_ORIGIN=https://host/base` | [Serve images from an HTTPS origin](https-origin.md) |
| An S3 bucket, R2, MinIO or SeaweedFS | `CHOP_ORIGIN=s3://bucket/prefix` | [Serve images from S3](s3.md) |
| Any of several hosts, chosen by the request | `CHOP_ALLOWED_HOSTS` | [Let requests name the image URL](url-sources.md) |

An origin and an explicitly set data directory together are an invalid setting. The flag `--origin` replaces `CHOP_DATA_DIR`, and `--data` replaces `CHOP_ORIGIN`, so a flag works in an environment that sets the other one.

## Reference

Whatever the source, the original is downloaded or read into memory, up to `maxInputBytes`, before it is processed. `X-Bytes-Saved` is measured against that size, the `ETag` is still a hash of the output, and when re-encoding doesn't make the image smaller, the original bytes are sent as they are. The type of the image is found from its content, and the `Content-Type` that an origin states is ignored. chop doesn't cache originals.

Read [Secure remote origins](security.md) before you use any remote source.
