# fileset

Select the files of a directory with gitignore-style rules and sync another directory to match, copying only what changed.

Select the files of a directory with gitignore-style rules and an ignore file like `.distignore`, and make another directory match the selected files, copying only what changed. It uses the [ignore](https://github.com/kaelzhang/node-ignore) package for the rules, and doesn't run Git or any other program.

## Install

```bash
npm install @wpelevator/fileset
```

Requires Node.js 22.12 or later.

## Select your first files

Save this as `example.mjs`. It creates and removes its own temporary fixture:

```js
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadFileRules, resolveFileSelection, selectFiles } from '@wpelevator/fileset';

const dir = await mkdtemp( join( tmpdir(), 'fileset-example-' ) );
try {
	await mkdir( join( dir, 'tests' ) );
	await writeFile( join( dir, 'plugin.php' ), '<?php' );
	await writeFile( join( dir, 'tests', 'test.php' ), '<?php' );
	const rules = await loadFileRules( resolveFileSelection( { cwd: dir, sourceDir: dir, exclude: 'tests/' } ) );
	console.log( await selectFiles( dir, rules ) );
} finally {
	await rm( dir, { recursive: true, force: true } );
}
```

Run `node example.mjs`:

```text
[ 'plugin.php' ]
```

## Guides

- [Selecting files](./selecting-files.md)
- [Syncing a directory](./syncing.md)
- [Errors](./errors.md)
