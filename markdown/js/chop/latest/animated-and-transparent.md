# Serve transparent and animated images

What chop returns for transparent PNGs and animated GIFs, and what happens when you force a format that can't hold them.

Transparent PNGs and GIFs stay lossless and keep their alpha channel or frames in the formats that can hold them. A 600 by 400 PNG with 50% transparent pixels, requested three ways:

| Request | `content-type` | `content-length` |
| --- | --- | --- |
| `/logo.png` with `Accept: image/avif,image/webp` | `image/webp` | 52 |
| `/logo.png` with no `Accept` | `image/png` | 1593 |
| `/logo.png?format=jpeg` | `image/jpeg` | 2649 |

The first row is lossless WebP, because a lossless source stays lossless. The last row is a JPEG with the transparency flattened onto white, since JPEG can't hold it.

A three-frame GIF behaves the same way for animation:

| Request | `content-type` | `content-length` |
| --- | --- | --- |
| `/anim.gif` with `Accept: image/webp` | `image/webp` | 206 |
| `/anim.gif` with no `Accept` | `image/gif` | 459 |

The first row is an animated WebP with every frame and its timing.

## Common tasks

### Keep animation

Let `auto` choose. An animated source becomes an animated WebP when the client accepts WebP and `autoFormats` lists it, and a GIF otherwise. It is never AVIF.

### Resize an animation

`crop`, `w`, `h`, `fit` and `resize` apply to every frame. `lb` and `gravity=attention` are ignored for animated sources.

### Force a format that can't hold the image

An explicit format wins. Transparency is flattened onto white for JPEG, and only the first frame is kept for any format of an animation other than WebP and GIF.

## Reference

- Transparency means that the source has an alpha channel, even if every pixel is opaque.
- Lossy output of a lossless source needs `lossy=1` or a `quality` below 100. See [Set quality and strip metadata](quality-and-metadata.md).
- GIF sources become lossless WebP when `Accept` lists WebP, and stay GIF otherwise. The table of [how `auto` chooses](formats.md#how-auto-chooses) lists every combination.
