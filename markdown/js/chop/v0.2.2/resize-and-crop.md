# Resize, crop and pad images

Resize, crop, pad and scale images with chop query arguments such as w, resize, crop and lb.

Add query arguments to the path of an image to get a resized, cropped or padded copy. The path selects the original, so `/2026/05/photo.jpg` is `<data>/2026/05/photo.jpg`, or `<origin>/2026/05/photo.jpg` when an [origin](sources.md) is configured.

Each row is a request for the same 2400 by 1600 JPEG, and the size of the image that came back:

| URL | Result |
| --- | --- |
| `/2026/05/photo.jpg?w=300` | 300 by 200, the aspect ratio kept |
| `/2026/05/photo.jpg?resize=400,400&gravity=north` | 400 by 400, covering the box and keeping the top |
| `/2026/05/photo.jpg?w=300&lb=400,400,f5f5f5` | 400 by 400, the 300 pixel image centered on a `f5f5f5` background |
| `/2026/05/photo.jpg?crop=10,10,50,50&w=400` | 400 by 267, a region that starts 10% in from the top left and covers 50% of each side |
| `/2026/05/photo.jpg?w=300&zoom=2` | 600 by 400, for a 2x display |
| `/2026/05/photo.jpg?w=5000` | 2400 by 1600, because nothing enlarges the image |
| `/2026/05/photo.jpg?w=3000&upscale=1` | 3000 by 2000 |
| `/2026/05/photo.jpg?w=300&format=png` | A 300 by 200 PNG |

The same 400 by 400 box applied to the 2400 by 1600 original:

```text
w=400 or fit=400,400     resize=400,400         lb=400,400

+------------+           +----------+           +----------+
|   image    |           |  image,  |           |   pad    |
|  400x267   |           |  cropped |           +----------+
+------------+           |          |           |  image   |
                         |          |           |  400x267 |
                         +----------+           +----------+
                           400x400              |   pad    |
                                                +----------+
                                                  400x400
```

`w` and `fit` shrink the image inside the box and keep the whole image. `resize` fills the box and crops the overflow. `lb` shrinks the image inside the box and pads the rest, so the result is exactly the box.

A malformed value of a known argument is a `400` that names it, such as `Invalid "w" argument: expected a whole number.` for `?w=abc`. Unknown arguments are ignored, so cache-busting arguments like `ver=3` change the URL and nothing else.

## Common tasks

### Limit the widths that can be requested

Set `CHOP_ALLOWED_WIDTHS` to the widths of your markup. See [Serve responsive images](responsive-images.md).

### Make square thumbnails

Use `resize=400,400`. Add `gravity=attention` to keep the busiest part, or `north`, `south`, `east` or `west` to keep an edge.

### Keep the whole image in a fixed box

Use `lb=400,400` to pad, or `fit=400,400` to scale inside the box and leave the other dimension shorter.

### Remove metadata or change quality

See [Set quality and strip metadata](quality-and-metadata.md).

## Reference

Only `GET` and `HEAD` are allowed, and `GET /healthz` answers `ok` without touching the data directory or the origin. The default `query` scheme reads the operations from the query string. [Migrate from Cloudflare Image Resizing](from-cloudflare.md) covers the other scheme.

Operations run in a fixed order, whatever the order in the URL: orientation, `crop`, size, `lb`, then encoding. The EXIF orientation is applied to the pixels first, so every size and offset refers to the displayed image, and the output has no orientation tag.

| Argument | Does | Default |
| --- | --- | --- |
| [`w`, `h`](#w-and-h) | Scale to a width or height, or inside a box | Original size |
| [`fit`](#fit) | The same as `w` and `h` together | Unset |
| [`resize`](#resize-and-gravity) | Fill a box and crop the overflow | Unset |
| [`gravity`](#resize-and-gravity) | Which part `resize` keeps | `center` |
| [`crop`](#crop) | Take a region of the original first | Unset |
| [`lb`](#lb) | Pad to an exact box | Unset |
| [`upscale`](#upscale) | Allow enlarging | Off |
| [`zoom`](#zoom) | Multiply sizes for dense screens | `1` |
| `format`, `quality`, `lossy` | See [Serve AVIF and WebP](formats.md) and [Set quality and strip metadata](quality-and-metadata.md) | `auto` |
| `strip` | See [Set quality and strip metadata](quality-and-metadata.md) | `metadata` |

### `w` and `h`

`?w=800` scales to 800 pixels wide and keeps the aspect ratio. `?h=600` does the same for height. With both, as in `?w=800&h=600`, the image fits inside the box without cropping or padding, so one dimension can end up shorter. Default: the original size.

### `fit`

`?fit=800,600` is the same as `w=800&h=600`, and wins over them.

### `resize` and `gravity`

`?resize=400,400` covers the box and crops the overflow, so the result is exactly 400 by 400. It wins over `fit`, `w` and `h`. `gravity` picks the part to keep: `center`, `north`, `south`, `east`, `west` or `attention`. Default: `center`.

```text
/2026/05/photo.jpg?resize=400,400&gravity=north
```

### `crop`

`?crop=x,y,w,h` takes a region of the oriented original before any scaling. Numbers are percentages of the width (`x`, `w`) or the height (`y`, `h`), with decimals allowed, or pixels with a `px` suffix, as in `?crop=0px,0px,600px,400px`. A region past the edge is clipped, and a region with no area is a `400`. `crop` numbers can't be negative.

### `lb`

`?lb=w,h[,color]` is a letterbox. It fits the image inside the box, then pads it with `color` to exactly `w` by `h`, centered. `color` is 3 or 6 hex digits with an optional `#`. Default: `ffffff`. `lb` runs after the size operation, so `?w=300&lb=400,400,f5f5f5` scales to 300 wide, then pads to 400 by 400.

### `upscale`

`?w=1200&upscale=1` allows enlarging, up to `maxUpscaleDimension` on the long side, which is `4096` by default and never less than the long side of the image. Without it, nothing enlarges the image. A requested size above the image clamps to the original size for `w`, `h` and `fit`, `resize` crops to the requested aspect ratio at the largest size that fits, and `lb` pads without enlarging the image inside.

### `zoom`

`?w=300&zoom=2` multiplies `w`, `h`, `fit`, `resize` and `lb` sizes before the limits apply, so the result is 600 pixels wide. Values are from 1 to 10 and can have up to three decimals. Default: `1`.

### Limits and animated sources

The output may not exceed `maxOutputDimension` in either dimension, which is checked after clamping and is a `400` when a request asks for more. When `allowedWidths` is set, the width of the output must be in the list, or the request is a `400`. The check runs on the width of the output after clamping. A request without `w`, and a `w` larger than a small original, can produce a width that isn't on the list, and that request is a `400`. Add `upscale=1` to enlarge small originals to a listed width, or add the original widths to the list. For an animated source, `crop`, `w`, `h`, `fit` and `resize` apply to every frame and keep their timing, while `lb` and `gravity=attention` are ignored. See [Serve transparent and animated images](animated-and-transparent.md).

### Other details

- Repeated arguments use the first value.
- An empty segment in the path, such as `//` or a trailing slash, is a `400`.
- chop ignores arguments it doesn't know, such as `brightness`, `contrast`, `filter` and `webp`, and doesn't parse them, so a malformed value of one is not an error. If you are moving from Photon, see [Migrate from Photon](from-photon.md).
