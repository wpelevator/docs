# Choose which files ship

Select the files of a release with .distignore, exclude patterns and Git export-ignore attributes.

`build`, `zip`, `checksums`, `deploy svn` and `deploy git` read a `.distignore` file in the plugin directory and leave out what it lists. The syntax is the one of `.gitignore`:

```text
node_modules
tests
```

With that file, the ZIP of the example plugin has no `node_modules/` and no `tests/`:

```text
my-plugin/.distignore
my-plugin/includes/class-thing.php
my-plugin/my-plugin.php
my-plugin/readme.txt
```

Add patterns for one run with `--exclude`, skip the file with `--no-distignore`, or point to another ignore file with `--distignore <file>`.

## Options

`build`, `zip`, `checksums`, `deploy svn` and `deploy git` select files the same way:

| Option | Description |
|---|---|
| `--distignore <file>` | Path to the ignore file. Defaults to `.distignore` in the source directory when present; an explicitly passed file must exist. |
| `--no-distignore` | Don't read any ignore file. |
| `--exclude <patterns>` | Extra gitignore-style patterns, comma-separated or repeated, like `--exclude build/,assets/*,images/**/*`. They're applied after the ignore file, so a `!` pattern can also re-include a file. |
| `--exclude-gitattributes` | Also exclude paths marked `export-ignore` by Git attributes. This is opt-in and requires the source directory to be inside a Git repository. |

## Details

`.distignore` and `--exclude` use full gitignore syntax, including `!` negation. `--exclude-gitattributes` asks Git to evaluate `export-ignore` attributes, including nested `.gitattributes` files, then adds those paths to the exclusions. It is off by default, so releases don't unexpectedly depend on Git or change selection when a repository adds attributes. Git must be installed and the source directory must be inside a working tree; the flag is ignored by `deploy svn --from-zip`, since the ZIP is already filtered. Version control metadata (`.git`, `.svn` and `.hg`, at any depth, including the `.git` files of worktrees and submodules) is always left out, also without an ignore file and when deploying from a ZIP, and no `!` pattern can re-include it. This keeps a repository's history out of ZIPs and deploys when the source directory is the repository root. The comma-separated `--exclude` list works like `--exclude` in `wp i18n make-pot`. Selected symbolic links are an error, since ZIP archives and WordPress.org SVN don't support them.
