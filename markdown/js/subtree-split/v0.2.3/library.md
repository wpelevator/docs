# Library API

```js
import { splitHistory } from '@wpelevator/subtree-split';

const tip = await splitHistory( {
	cwd: '/path/to/repository',
	prefix: 'packages/my-library',
	cache: true,
} );
```

`splitHistory()` returns the hash of the split commit, or `null` when the directory doesn't exist at the ref. Like the command, it writes the commits to the repository and doesn't change a branch.

| Option | Description |
| --- | --- |
| `prefix` | Directory to split, relative to the root of the repository. A trailing slash is removed. |
| `ref` | Commit to split the history of, `HEAD` by default. |
| `cwd` | Directory in the repository, the current directory by default. |
| `cache` | `true` for the file in the Git directory, like `--git-dir-cache`, or the path of a cache file, like `--cache`. Without it, every call splits the whole history. |

Invalid input and history that can't be split throw a `SubtreeSplitError` with a Node-style `code`: `ERR_INVALID_PREFIX`, `ERR_UNSUPPORTED_GIT`, `ERR_SHALLOW_REPOSITORY`, `ERR_GIT_FAILED`, `ERR_INVALID_COMMIT`, `ERR_INVALID_TREE_ENTRY` or `ERR_COMMIT_MISMATCH`. `isSubtreeSplitError( error )` checks for one, which also works when two copies of the package are installed, unlike `instanceof`. A directory that doesn't exist at the ref isn't an error, but a file at the prefix in any commit is, like in `git subtree split`. Other errors, like Git not being installed, are the original errors of Node.js.
