# Set quality and strip metadata

Set the quality of AVIF, WebP and JPEG output, remove metadata, and know when chop sends the original bytes instead of a re-encoded copy.

`quality` trades file size for fidelity per request, and chop never returns a file larger than the original when a request changes nothing about the pixels. The same 800 pixel wide JPEG at three qualities:

```sh
for q in 40 70 90; do curl -s -o /dev/null -w "quality=$q %{size_download}\n" "http://localhost:8080/2026/05/photo.jpg?w=800&quality=$q"; done
```

```text
quality=40 7453
quality=70 18365
quality=90 58154
```

The numbers are bytes of a synthetic test image. Without `quality`, the defaults are JPEG 82, WebP 80 and AVIF 55.

## Common tasks

### Change the defaults

`CHOP_JPEG_QUALITY`, `CHOP_WEBP_QUALITY` and `CHOP_AVIF_QUALITY` set them for every request. `CHOP_AVIF_EFFORT` sets the AVIF encoder effort from 0 (fast) to 9 (small), and defaults to 4.

### Remove metadata

`strip=metadata` is the default. It removes EXIF, XMP and IPTC and keeps the ICC profile. `strip=all` removes everything, and `strip=none` keeps everything the encoder can write. `strip` never converts pixel values to another color space: it keeps or drops the profile only.

### Get a lossy copy of a PNG or GIF

PNG, GIF and lossless WebP sources stay lossless unless the request has `lossy=1` or a `quality` below 100. The lossy output is AVIF, WebP or a palette PNG.

## Reference

- `quality` is an integer from 1 to 100. Values below 20 are raised to 20 for lossy encoders, and `quality=100` on WebP is lossless WebP.
- A palette PNG uses `quality`, or 80 without it. PNG output of a lossless source is lossless with maximum compression.
- A JPEG source isn't re-encoded with a higher quality than it has. chop estimates the quality of the source from its luminance quantization table, and lowers the default to it when it's lower. An explicit `quality` is used as given, with the floor of 20.
- When a request changes nothing about the pixels (no `crop`, size or `lb`, and no orientation to apply), the output format equals the source format and the source has no metadata that `strip` would remove, chop sends the original bytes if the re-encoded image isn't smaller. With `strip=none`, an untouched request in the source format always sends the original bytes. An explicit `quality` or `lossy=1` turns that shortcut off, because the client asked for a re-encoding, but the check that the output isn't larger still applies.
- An explicit `format=png` is lossless unless `lossy=1` or a `quality` below 100 is given, also for a JPEG source. An explicit `format=avif` or `format=jpeg` is always lossy.
- With `strip=none`, EXIF, XMP, IPTC and the profile are kept when the encoder can write them. CMYK sources only keep EXIF and XMP, and are always converted to sRGB.
- Responses have `X-Bytes-Saved` when the output is smaller than the original.
