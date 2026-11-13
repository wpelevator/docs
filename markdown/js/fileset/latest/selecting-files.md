# Selecting files

```js
import { loadFileRules, resolveFileSelection, selectFiles } from '@wpelevator/fileset';

const rules = await loadFileRules(
	resolveFileSelection( {
		cwd: process.cwd(),
		sourceDir: 'dist',
		exclude: 'tests/,*.md',
	} )
);

await selectFiles( 'dist', rules ); // [ 'includes/class-plugin.php', 'my-plugin.php' ]
```

`selectFiles()` returns sorted relative paths with forward slashes. The rules come from the ignore file in the source directory and the extra `exclude` patterns, which are a string separated by commas or newlines, or a list of them. A rule can't re-include a file from an ignored directory, as in Git.

- The default ignore file is `.distignore` in the source directory, and it's optional. Pass `ignoreFilename` to use another name, `distignore` with a path to use a file that must exist, or `distignore: false` to not read one.
- `.git`, `.svn` and `.hg` (`ALWAYS_EXCLUDED`) are never selected, at any depth, and no rule can re-include them.
- Selected symbolic links throw an error, since ZIP archives and WordPress.org SVN don't support them. Exclude them or replace them with the files.

`ignoreOwnFile( rules, sourceDir, path )` and `ignoreOwnSignature( rules, sourceDir, path, extensions )` add rules for the files that a command writes inside the directory, such as a manifest and the signature files next to it.

## Exclude more files

The package doesn't depend on Git, but it takes a function as `listExcluded` that returns more files to exclude, from the candidates that the other rules keep. This is how to exclude the paths that Git marks with `export-ignore`:

```js
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify( execFile );

const listExcluded = async ( { sourceDir, files } ) => {
	const { stdout } = await run(
		'git',
		[ 'check-attr', '-z', 'export-ignore', '--', ...files ],
		{ cwd: sourceDir }
	);
	const fields = stdout.split( '\0' );

	return files.filter( ( file, index ) => 'set' === fields[ index * 3 + 2 ] );
};

const rules = await loadFileRules( {
	...resolveFileSelection( { cwd: process.cwd(), sourceDir: 'dist' } ),
	listExcluded,
} );
```
