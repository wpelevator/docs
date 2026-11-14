# Migrate from Photon

Map the query arguments of the Photon image service to chop's, and see which Photon arguments chop ignores.

chop has its own small set of arguments and isn't a drop-in replacement for the Photon image service. Most resizing URLs keep working, because `w`, `h`, `resize`, `fit`, `crop`, `lb`, `zoom`, `quality` and `strip` have the same names. Arguments that chop doesn't support are ignored like any unknown argument, so an old URL still returns an image. The exception is `strip`, because chop knows it and checks its value.

| Photon argument | In chop | What to change |
| --- | --- | --- |
| `w`, `h`, `fit`, `resize`, `crop`, `lb`, `zoom`, `quality` | Same name | Check one URL of each shape. [Resize, crop and pad images](resize-and-crop.md) has the exact meaning in chop. |
| `strip` | `strip=metadata`, `all` or `none` | Use one of these three values. A value that chop doesn't know, such as `info` or `color`, is a `400` that names the argument. |
| `webp` | `format` or the `Accept` header | Drop it. chop gives WebP or AVIF to clients that list them, and `?format=webp` forces WebP. |
| `ssl` | None | Drop it. chop is not a proxy for other hosts. To fetch from another host, see [Let requests name the image URL](url-sources.md). |
| `brightness`, `contrast` | None | Ignored. Adjust the original or do it in CSS. |
| `filter` (`grayscale`, `sepia`, `negate`, `blur`, `sharpen`) | None | Ignored. |
| `colorize`, `smooth` | None | Ignored. |
| `ulb` | None | Ignored. `lb` pads but doesn't scale the background color. |

## Steps

1. Point the host that served Photon URLs at chop, with the data directory or [origin](sources.md) that holds the originals.
2. Check one URL of each shape that your site uses, and compare the sizes. A request for an unsupported argument still returns an image, so look at the result and not the status code.
3. Set `CHOP_ALLOWED_WIDTHS` to the widths of your `srcset`, so that the output sizes are bounded. See [Serve responsive images](responsive-images.md).
