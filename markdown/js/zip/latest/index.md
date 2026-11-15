# zip

Create reproducible ZIP archives from files and buffers, and safely list and extract them.

Create reproducible ZIP archives from files and buffers, and safely list and extract them, on [yazl](https://github.com/thejoshwolfe/yazl) and [yauzl](https://github.com/thejoshwolfe/yauzl).

## Install

```bash
npm install @wpelevator/zip
```

Requires Node.js 22.12 or later.

## Build and inspect an archive

Save this as `example.mjs`. It creates and removes its own temporary input file, and keeps the ZIP in memory:

```js
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createZipBuffer, readZipEntries } from '@wpelevator/zip';

const dir = await mkdtemp( join( tmpdir(), 'zip-example-' ) );
try {
	const file = join( dir, 'plugin.php' );
	await writeFile( file, '<?php' );
	const zip = await createZipBuffer( [ { name: 'plugin.php', source: file } ], { rootFolder: 'my-plugin' } );
	const entries = await readZipEntries( zip );
	console.log( entries.map( ( entry ) => entry.path ) );
} finally {
	await rm( dir, { recursive: true, force: true } );
}
```

Run `node example.mjs`:

```text
[ 'my-plugin/plugin.php' ]
```

## Guides

- [Reproducible archives](./reproducible-archives.md)
- [Usage](./usage.md)
- [Safe extraction](./safe-extraction.md)
- [Errors](./errors.md)
