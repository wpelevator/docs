# URL schemes (/js/chop/v0.2.1/url-schemes.html)

A URL scheme turns the URL of a request into the path of the original and the operations to run on it. All the schemes produce the same operations, so every scheme gets the same format negotiation, limits and path safety, and different schemes that give the same operations give the same bytes and `ETag`. Enable them with `schemes` in the settings, `CHOP_SCHEMES` or `--scheme`, which can be repeated.

The schemes are tried in the configured order, and the first one that recognizes the URL wins. A URL that none of them recognizes is a `404`. `/healthz` doesn't depend on the schemes. The `query` scheme recognizes every URL, so when it's enabled together with other schemes, list it last. The path of a scheme goes through the same checks as any path: dot segments, empty segments, slashes, backslashes and NUL bytes in a decoded segment are a `400`, and the real path must stay inside the data directory. A scheme can also find a [URL source](sources.html.md) in the URL.

```bash
chop --data ./uploads --scheme cloudflare --scheme query
```

```text
/cdn-cgi/image/width=300,format=auto/2026/05/photo.jpg
/2026/05/photo.jpg?w=300
```

With `Accept: image/avif`, both of these URLs give the same AVIF bytes.

## `query` [#query]

The default scheme. The path is the path of the original and the arguments in [Requests](requests.html.md) are in the query string. A path that starts with `http://` or `https://` (also `https:/` and `https%3A//`) is a [URL source](sources.html.md), like `/https://uploads.example.com/photo.jpg?w=300`, and the query string is still chop's arguments, so the source URL can't have its own.

## `cloudflare` [#cloudflare]

The `/cdn-cgi/image/<options>/<path>` form of [Cloudflare Image Resizing](https://developers.cloudflare.com/images/transform-images/transform-via-url/), with comma separated `name=value` options. It only recognizes URLs that start with `/cdn-cgi/image/`. Options that chop doesn't support, like `trim`, `rotate`, `blur`, `sharpen` and `onerror`, are ignored, and a malformed value of a supported option is a `400` that names the option. The first value wins when an option repeats. A source after the options that starts with `http://` or `https://` (also `https:/` and `https%3A//`) is a [URL source](sources.html.md), which is a `404` unless `CHOP_ALLOWED_HOSTS` is set. A query string on a URL source is a `400`, and on a path under the origin it is ignored.

| Option | Maps to |
| --- | --- |
| `width`, `height` | `w`, `h`. |
| `fit` | `scale-down` (default) is `w` and `h` that never enlarge, `contain` is the same with `upscale=1`, `cover` is `resize` with `upscale=1`, `crop` is `resize`, and `pad` is `lb` with `upscale=1`. `cover`, `crop` and `pad` need both `width` and `height`, and with one of them they scale like `scale-down` (`crop`) or `contain` (`cover` and `pad`). |
| `gravity` | `left`, `right`, `top` and `bottom` are `west`, `east`, `north` and `south`, `auto` and `face` are `attention`, and `center` and coordinates like `0.5x0.3` are the center. |
| `quality` | `quality`, as a number from 1 to 100. |
| `format` | `auto`, `avif`, `webp`, `jpeg`, `png` and `gif` are `format`, and `baseline-jpeg` is `jpeg`. `json` is a `400`. |
| `dpr` | `zoom`, from 1 to 10. |
| `metadata` | `keep` is `strip=none`, `copyright` is `strip=metadata` and `none` is `strip=all`. |
| `background` | The `lb` color for `fit=pad`, as 3 or 6 hex digits with an optional `#` (encoded as `%23` in a URL). |
