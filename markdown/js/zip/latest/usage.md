# Usage

```js
import { createZip, createZipBuffer, extractZip, readZipEntries } from '@wpelevator/zip';

// An entry is a file path or the bytes of the contents.
const entries = [
	{ name: 'my-plugin.php', source: '/path/to/my-plugin.php' },
	{ name: 'checksums.json', source: Buffer.from( '{}' ) },
];

// Write to a file, which refuses to overwrite an existing one without `force`.
await createZip( { entries, zipPath: 'my-plugin.zip', rootFolder: 'my-plugin' } );

// Or get the bytes, or a readable stream with `createZipStream()`.
const bytes = await createZipBuffer( entries, { rootFolder: 'my-plugin' } );

// Read from a path or from bytes.
await readZipEntries( bytes ); // [ { path: 'my-plugin/checksums.json', type: 'file' }, ... ]
await extractZip( { zip: bytes, targetDir: 'out', rootFolder: 'my-plugin' } ); // [ 'checksums.json', 'my-plugin.php' ]
```
