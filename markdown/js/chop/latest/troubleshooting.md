# Troubleshoot chop

Find the cause of a chop error by its status code or startup message, with the exact output and the setting that fixes it.

Match the message you see to a cause. Errors are plain text with `Cache-Control: no-store`, and they never include file system paths. These are real responses from a data directory with a text file named `notimage.jpg` and a truncated JPEG.

| You see | Cause | Fix |
| --- | --- | --- |
| `404` `Not found.` | A missing file, a directory, a path outside the data directory, or an origin that answered `404`, `401`, `403` or `410` | For an origin that refused or failed the request, read the standard error of chop, which has the reason. An ordinary `404` from the origin, and a `413`, print nothing. For a data directory chop prints nothing, so check that the path is relative to the data directory (`/2026/05/photo.jpg`, not `/wp-content/uploads/2026/05/photo.jpg`), the case of the file name, and that the scheme of the URL is enabled. |
| `400` `Invalid "w" argument: expected a whole number.` | A malformed value of a known argument, named in the message | Fix the argument. See [Resize, crop and pad images](resize-and-crop.md). |
| `400` `Invalid path.` | A segment that is `.` or `..`, is empty, or contains `/`, `\` or a NUL byte | Fix the URL. |
| `400` for a width | The output width isn't in `CHOP_ALLOWED_WIDTHS`, or is above `CHOP_MAX_OUTPUT_DIMENSION`. A URL with no `w`, or a `w` above a small original, has the width of the original | Add `w` to the URL, use a listed width, add `upscale=1` for small originals, or add the width to the list. |
| `405` `Method not allowed.` | A method other than `GET` and `HEAD` | Send a `GET`. |
| `413` `The original image is too large.` | The original is over `CHOP_MAX_INPUT_BYTES` | Raise the limit or shrink the original. |
| `415` `This file is not a supported image.` | The content isn't a JPEG, PNG, GIF, WebP or AVIF, or the format isn't in `CHOP_ALLOWED_INPUT_FORMATS` | Check the file. The extension isn't used. |
| `422` `The image can not be processed.` or `The image can not be read.` | A corrupt or truncated image. An image over `CHOP_MAX_INPUT_PIXELS` gives `can not be read` | Replace the original or raise the limit. |
| `502` | The origin couldn't be reached, answered `5xx`, redirected, or sent a compressed or incomplete body | Read the standard error. A redirect needs the final URL in `CHOP_ORIGIN`. |
| `503` with `Retry-After: 1` | The queue of images or of downloads is full | Raise `CHOP_MAX_QUEUE` or the concurrency, or add servers. |
| `504` | The origin was too slow to connect or to send the image | Raise `CHOP_ORIGIN_CONNECT_TIMEOUT` or `CHOP_ORIGIN_TIMEOUT`, or fix the origin. |

The `415` and `422` responses for those two test files:

```text
HTTP/1.1 415 Unsupported Media Type
content-type: text/plain; charset=utf-8
cache-control: no-store

This file is not a supported image.
```

```text
HTTP/1.1 422 Unprocessable Entity
content-type: text/plain; charset=utf-8
cache-control: no-store

The image can not be processed.
```

## Images are missing from a remote origin

The client only gets a plain `404`, `502` or `504`. When chop refuses or can't complete the request, the reason goes to the standard error as `origin <code>: <reason>`, such as `origin ERR_NOT_FOUND: 127.0.0.1 is a blocked address`. An ordinary `404` from the origin prints nothing, so check that URL by hand. For an S3 bucket, the error code is in the next section.

## S3 error codes

chop writes the code from the XML body of an S3 error to the standard error, for example `origin ERR_NOT_FOUND: s3.example.com answered 403 SignatureDoesNotMatch`. The client only gets a plain `404`.

| Code | Usual cause | Fix |
| --- | --- | --- |
| `SignatureDoesNotMatch` | The signature was rejected | Check the secret key, the region and `CHOP_S3_PATH_STYLE` |
| `InvalidAccessKeyId` | The access key doesn't exist for this endpoint | Check the key and the endpoint |
| `AccessDenied` | The key can't read the object or the bucket | Allow `s3:GetObject` for the prefix |
| `ExpiredToken` | A session token expired. chop doesn't refresh credentials | Restart chop with new credentials, or use static keys |
| `RequestTimeTooSkewed` | The clock of the server is more than 15 minutes off | Fix the time of the server or container. A `403` can mean the same |
| `NoSuchBucket` | The bucket name or endpoint is wrong | Check `CHOP_ORIGIN` and `CHOP_S3_ENDPOINT` |
| `AuthorizationHeaderMalformed` | The region is wrong | Set `CHOP_S3_REGION` |
| `301` or `307` | The bucket is in another region. chop reports `bucket is in another region (check CHOP_S3_REGION)` and doesn't follow | Set `CHOP_S3_REGION` |

`NoSuchKey` is an ordinary missing image, and chop doesn't report it.

## A browser gets the wrong format

A cache in front of chop must key on `Accept`. Every response has `Vary: Accept`, but many CDNs ignore `Vary` unless configured, and a cached AVIF can reach a browser that can't display it. See [Cache at a CDN](caching.md#at-a-cdn). A client that sends only `image/*` or `*/*` gets the source format, because only a listed `image/avif` or `image/webp` makes those formats acceptable.

## A replaced image still shows the old one

Responses are cached for a year by default. Change the URL, for example with `?ver=3`. See [Serve responsive images](responsive-images.md).

## The server doesn't start

| Exit code | Message | Cause |
| --- | --- | --- |
| `1` | `The data directory "/home/me/nope" doesn't exist.` | A missing data directory |
| `1` | `listen EADDRINUSE: address already in use 0.0.0.0:8080` | The port is in use. Use `--port`. |
| `2` | `CHOP_MAX_QUEUE must be a whole number, got "abc".` | A number or boolean that can't be parsed, named with the variable |
| `2` | `The setting autoFormats must be list of unique formats (avif, webp), got "gif".` | A value that can't be used, named with the setting |
| `2` | `The setting schemes must be a list of scheme names (query, cloudflare), got "nope".` | An unknown scheme |
| `2` | `Set either dataDir (CHOP_DATA_DIR, --data) or origin (CHOP_ORIGIN, --origin), not both.` | Both a data directory and an origin |
| `2` | `An S3 origin on AWS needs a region: set s3Region (CHOP_S3_REGION or AWS_REGION).` | A missing region on AWS |
