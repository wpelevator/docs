# Manifests

## Create a manifest

```js
import { createChecksums, writeChecksums } from '@wpelevator/checksums';

const manifest = await createChecksums( {
	sourceDir: 'dist',
	files: [ 'includes/class-plugin.php', 'my-plugin.php' ],
	metadata: { plugin: 'my-plugin', version: '1.2.0' },
} );

await writeChecksums( 'my-plugin.1.2.0.checksums.json', manifest );
```

It takes a plain list of relative paths with forward slashes, so it works with any way of selecting files, like [`@wpelevator/fileset`](https://www.npmjs.com/package/@wpelevator/fileset). The `metadata` is written before the `files` in the order it's given, as in the WordPress.org format:

```json
{
	"plugin": "my-plugin",
	"version": "1.2.0",
	"files": {
		"my-plugin.php": { "md5": "…", "sha256": "…" }
	}
}
```

`createManifest( files, metadata )` does the same from hashes that you already have. `writeChecksums()` refuses to overwrite a file without `force`.

## Read a manifest

`readChecksums( path )` and `parseChecksums( json )` validate a manifest: it needs a `files` object with relative paths that have no `.`, `..` or backslash segments, and an MD5 or SHA-256 hash for every file. A hash can also be a list of accepted values, as in the WordPress.org API.
