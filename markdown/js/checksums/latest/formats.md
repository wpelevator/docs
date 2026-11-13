# Formats

A codec converts a manifest to the bytes of a file format and back:

| Codec | File | Format |
|---|---|---|
| `wordpressCodec` | `checksums.json` | The JSON of the WordPress.org plugin checksums API. |
| `sha256sumCodec` | `SHA256SUMS` | One `<sha256>  <path>` line per file, with the GNU escapes for backslashes and newlines in paths. It has no metadata and needs a SHA-256 digest for every file. |

```js
import { sha256sumCodec } from '@wpelevator/checksums';

await writeFile( 'SHA256SUMS', await sha256sumCodec.encode( manifest ) );
// $ sha256sum -c SHA256SUMS   (or shasum -a 256 -c SHA256SUMS on macOS)
```

The tests check that a `sha256sum` manifest passes `sha256sum -c`, or `shasum -a 256 -c` when that's what the system has, and are skipped when neither is installed. Fixed vectors always run. Your own format is an object with `id`, `filename`, `encode( manifest )` and `decode( bytes )`, which may be asynchronous.
