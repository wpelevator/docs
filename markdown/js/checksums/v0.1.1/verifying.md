# Comparing and verifying

```js
import { compareChecksums, verifyChecksums } from '@wpelevator/checksums';

// Two maps of hashes, without reading files.
compareChecksums( manifest.files, await hashFiles( 'dist', files ) );

// Or the files of a directory against a manifest.
const { valid, matched, changed, missing, extra } = await verifyChecksums( {
	sourceDir: 'wp-content/plugins/my-plugin',
	files: [ 'my-plugin.php', 'readme.txt' ],
	manifest,
	isIgnored: ( path ) => path.startsWith( 'cache/' ),
} );
```

A file matches when its SHA-256 is one of the expected values, or its MD5 for entries without a SHA-256. `verifyChecksums()` hashes the given `files` and skips the paths that `isIgnored` returns true for in the manifest, so that files created after the install, like caches, can be left out on both sides.
