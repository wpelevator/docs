# Requests

The URL path selects the original, like `/2026/05/photo.jpg` for `<data>/2026/05/photo.jpg` or for `<origin>/2026/05/photo.jpg` when an [origin](sources.md) is configured, and a [URL scheme](url-schemes.md) selects the operations. The default `query` scheme reads them from the query string. Unknown arguments are ignored, so cache-busting arguments like `ver=3` are harmless. A malformed value of a known argument is a `400` with a message that names the argument. `GET /healthz` answers `ok` without touching the data directory or the origin. Only `GET` and `HEAD` are allowed.

Operations run in a fixed order, whatever the order in the URL: orientation, `crop`, size, `lb`, then encoding. The EXIF orientation is always applied to the pixels first, so every size and offset refers to the displayed image, and the output has no orientation tag.

| Argument | Description | Example |
| --- | --- | --- |
| `w`, `h` | Width and height in pixels. One keeps the aspect ratio, both fit inside the box without cropping or padding. | `?w=800`, `?w=800&h=600` |
| `fit=w,h` | The same as `w` and `h` together, and wins over them. | `?fit=800,600` |
| `resize=w,h` | Cover `w` by `h` and crop the overflow, so the result is exactly that size. Wins over `fit`, `w` and `h`. | `?resize=400,400` |
| `gravity` | Where `resize` keeps the image: `center` (default), `north`, `south`, `east`, `west` or `attention`. | `?resize=400,400&gravity=north` |
| `crop=x,y,w,h` | A region of the oriented original, applied before scaling. Numbers are percentages of the width (`x`, `w`) or the height (`y`, `h`), with decimals allowed, or pixels with a `px` suffix. A region past the edge is clipped, and one with no area is a `400`. | `?crop=10,10,50,50`, `?crop=0px,0px,600px,400px` |
| `lb=w,h[,color]` | Letterbox: fit the image in the box, then pad it with `color` (3 or 6 hex digits, optional `#`, default `ffffff`) to exactly `w` by `h`, centered. Runs after the size operation. | `?w=300&lb=400,400,f5f5f5` |
| `upscale=1` | Allow enlarging, up to `maxUpscaleDimension` on the long side. | `?w=1200&upscale=1` |
| `zoom=N` | Device pixel ratio from 1 to 10, which multiplies `w`, `h`, `fit`, `resize` and `lb` sizes before the limits apply. | `?w=300&zoom=2` |
| `format` | `auto` (default), `jpeg`, `png`, `webp`, `avif` or `gif`. | `?format=webp` |
| `quality` | Integer from 1 to 100. | `?quality=70` |
| `lossy=1` | Allow lossy output of a lossless source (PNG, GIF, lossless WebP). | `?lossy=1` |
| `strip` | `metadata` (default) removes EXIF, XMP and IPTC and keeps the ICC profile, `all` removes everything, `none` keeps everything the encoder can write. | `?strip=all` |

Nothing enlarges the image unless `upscale=1`. When a requested size is larger than the image, `w`, `h` and `fit` clamp to the original size, `resize` crops to the requested aspect ratio at the largest size that fits, and `lb` pads without enlarging the image inside. With `upscale=1` the long side of a result may be as large as `maxUpscaleDimension`, but never less than the long side of the image itself. The output may not exceed `maxOutputDimension` in either dimension, which is checked after clamping and is a `400` when a request asks for more. When `allowedWidths` is set, the width of the output must be in the list or the request is a `400`.

For an animated source (GIF or animated WebP), `crop`, `w`, `h`, `fit` and `resize` apply to every frame and keep all frames and their timing, while `lb` and `gravity=attention` are ignored.

## Differences from Photon query arguments

chop has its own small set of arguments, and it isn't a drop-in replacement for the Photon image service. These arguments are not supported, are not an error and are ignored like any unknown argument:

- `brightness` and `contrast` (no image adjustments).
- `filter`, with its `grayscale`, `sepia`, `negate`, `blur` and `sharpen` names (no image filters).
- `colorize` and `smooth`, and `ulb` (a letterbox with a color that is also scaled), which the specification doesn't have.
- `webp` and `ssl`: the output format follows the `Accept` header, or `format`, and the server is not a proxy for other hosts.

Originals are only read from the data directory, the configured origin and the hosts that you allow, and `strip` has the values `metadata`, `all` and `none`.
