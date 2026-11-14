# Serve responsive images

Write a srcset and sizes for chop, choose a ladder of widths, limit the widths that can be requested, and bust the cache when an image changes.

Point every candidate of a `srcset` at the same original with a different `w`, and let chop pick the format. The browser chooses a width, and chop answers with AVIF, WebP or the original format that its `Accept` header lists, so the markup needs no `<picture>` element.

```html
<img
	src="/2026/05/photo.jpg?w=640"
	srcset="
		/2026/05/photo.jpg?w=320 320w,
		/2026/05/photo.jpg?w=640 640w,
		/2026/05/photo.jpg?w=960 960w
	"
	sizes="(min-width: 60rem) 640px, 100vw"
	alt="A gradient"
	width="960"
	height="640"
>
```

Each candidate is a separate, cacheable URL. Sizes in bytes of an AVIF response for the test image at each width:

```text
w=320 2694
w=640 15702
w=960 38919
```

## Choose the widths

Pick a short ladder and use it everywhere. Each width is a separate variant to build and cache, so fewer widths mean a better cache hit rate. A ladder that grows by about 1.5 to 2 times per step keeps each step visibly smaller than the next. For a content column up to 960 pixels wide, `320,640,960,1280` covers 1x and 2x screens. Add `1920` only for full-width hero images.

`sizes` tells the browser how wide the image will be on the page, and the browser picks a candidate that covers that width at the screen density. Without `sizes`, the browser assumes `100vw` and picks a candidate for the full window width, which downloads more than a narrow column needs. Describe the layout, as in `(min-width: 60rem) 640px, 100vw`: the image is 640 pixels wide on wide screens and full width below that.

## Common tasks

### Allow only the widths of your markup

Anyone who can reach chop can request any width up to `maxOutputDimension`, which is `8192` by default, so every new width is another variant to build and cache. List the widths that your markup uses, and any other width is a `400`:

```sh
CHOP_ALLOWED_WIDTHS=320,640,960,1280 chop --data ./uploads
```

The check is on the width of the output after clamping, so a `zoom` that doubles `w=320` to 640 passes when 640 is on the list. A bare path with no `w` has the width of the original, such as 2400, which is a `400` unless that width is on the list, so every URL needs a size that gives a listed width, such as `w`, `h` or `resize`. A `w` above a small original clamps to the original width, which is also a `400`. Add `upscale=1` to the URL to enlarge a small original to a listed width, and see [`upscale`](resize-and-crop.md#upscale).

### Serve square thumbnails at fixed sizes

Add `resize=400,400` to crop to exactly that size, and put 400 in `CHOP_ALLOWED_WIDTHS` too. See [Resize, crop and pad images](resize-and-crop.md).

### Serve high-density screens

`zoom=2` multiplies the sizes, so `?w=320&zoom=2` is 640 pixels wide, a width on the list above. Write the doubled widths in `srcset` with `w` descriptors, as above, and let the browser choose.

### Replace an image at the same path

Responses are cached for a year, and chop doesn't cache originals. Change the URL, for example with `?ver=3`, so every cache fetches the new one. chop ignores unknown arguments, so `ver` only changes the cache key.

### Serve a WordPress uploads directory

WordPress writes each image and its generated sizes under `wp-content/uploads`. Mount or point chop at that directory, and chop serves any file in it at any width. chop gets paths relative to the uploads directory, so `/wp-content/uploads/2026/05/photo.jpg` on your site is `/2026/05/photo.jpg` in chop. Use `CHOP_DATA_DIR` for a local directory, or `CHOP_ORIGIN=https://example.com/wp-content/uploads` for a remote site. See [Choose where originals come from](sources.md).

chop doesn't change the markup that WordPress generates. Point the URLs at chop with your server or CDN rules, and keep `CHOP_ALLOWED_WIDTHS` equal to the widths in your `srcset`.

## Next steps

Put a cache in front, so each width is built once: [Cache images](caching.md).
