# Let requests name the image URL

Let a request name the full URL of an image and have chop fetch it from hosts on an allow-list.

A request can carry the full URL of the original, and chop fetches it when the host is on `CHOP_ALLOWED_HOSTS`. Use it only when a client has to choose the host. Without the setting, which is the default, these URLs are a plain `404`. URL sources need chop 0.2.0 or later.

```sh
CHOP_ALLOWED_HOSTS=uploads.example.com npx @wpelevator/chop --data ./uploads
```

```text
chop listening on http://0.0.0.0:8080, serving /home/me/uploads
```

A request for `/https://uploads.example.com/2026/05/photo.jpg?w=300` is then fetched from that host and resized. This needs a public host, because `CHOP_ORIGIN_ALLOW_PRIVATE` never applies to a URL source, so a local test with a loopback server returns a `404`. Plain paths keep their meaning, and only a path that starts with `http://` or `https://` is a URL source.

A host that isn't on the list, a name that can't be resolved and an address in a blocked range all give the same plain `404`, so a client can't tell which hosts exist. The reason goes to the standard error, such as `origin ERR_NOT_FOUND: 127.0.0.1 is a blocked address`.

URL sources work in both URL schemes. In the `query` scheme the URL is the path and the query string is chop's arguments, and in the `cloudflare` scheme the URL comes after the options:

```text
/https://uploads.example.com/2026/05/photo.jpg?w=300
/cdn-cgi/image/width=300,format=auto/https://uploads.example.com/2026/05/photo.jpg
```

A proxy that merges slashes turns `https://` into `https:/`, and some clients escape it as `https%3A//`. chop understands all three forms, with any number of slashes after the colon. A URL source can't have user information, a fragment or a query string of its own: the query string of the `query` scheme is chop's arguments, so the source can't have one, and in the `cloudflare` scheme a query string on a URL source is a `400` rather than a guess about which part it belongs to. User information and fragments are a `400` too. Ports other than 80 and 443 must be named in the allow-list.

Each entry of `CHOP_ALLOWED_HOSTS` is a comma separated list item:

| Entry | Matches |
| --- | --- |
| `uploads.example.com` | That host, on the default port of the scheme. |
| `*.example.com` | Any subdomain at any depth, on a dot boundary, so `a.example.com` and `a.b.example.com` match, but `example.com` and `evilexample.com` don't. List the apex too if you need it. |
| `uploads.example.com:8443` | That host on that port, and not on the default port. |
| `*` | Every host, on the default ports. It can't be mixed with other entries, and it prints a warning on startup. See [Secure remote origins](security.md). |

Hosts are compared in lower case and without a trailing dot. International names must be written in punycode (`xn--...`). An empty list means no URL sources.

Whatever the source, the original is downloaded into memory, up to `maxInputBytes`, before it is processed. `X-Bytes-Saved` is measured against the downloaded size, the `ETag` is still a hash of the output, and when re-encoding doesn't make the image smaller, the downloaded bytes are sent as they are. The type of the image is found from its content, and the `Content-Type` that the origin states is ignored.

## Reference

- A URL source with user information, a fragment or a query string of its own is a `400`, and dot segments are a `400`, as for any path. A port other than the default of the scheme must be in the entry.
- `*` can't be mixed with other entries, and it prints a warning at startup. An entry is a name or an IPv4 address, so only `*` allows an IPv6 literal, and the address checks still apply to it. `originAllowPrivate` never applies to a URL source.
- An empty segment inside a URL source (`//` in its path) is sent to the origin as written, while it's a `400` in a plain path.
- A first path segment of `http:` or `https:` always starts a URL source, so a directory with that name can't be addressed by a plain path.
- Size limits, timeouts and the original-in-memory rule are the same as for any source. See [Choose where originals come from](sources.md#reference).
- Read [Secure remote origins](security.md) before you list more than a few hosts, and never use `*` without the protections described there.
