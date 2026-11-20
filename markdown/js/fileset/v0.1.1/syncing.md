# Syncing a directory

```js
import { syncDirectory } from '@wpelevator/fileset';

const { copied, deleted } = await syncDirectory( {
	sourceDir: 'dist',
	files: await selectFiles( 'dist', rules ),
	targetDir: 'svn/trunk',
} );
```

`syncDirectory()` makes the target contain exactly the selected files, like `rsync --delete`: it deletes the files that aren't selected and the directories they leave empty, and copies the files that are new or changed. Files that didn't change are left alone, so that Subversion sees only real changes. The directories named in `preserve`, `.svn` by default (`DEFAULT_PRESERVED`), are never copied into, deleted or listed, at any depth. `copyFileIfChanged( source, target )` copies a single file and returns whether it did.
