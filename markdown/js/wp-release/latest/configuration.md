# Configuration (/js/wp-release/latest/configuration)

### Naming convention [#naming-convention]

`@wpelevator/wp-release` is the suite of release tools and `wp-release` is its CLI. "Release" is the whole workflow; each command is one operation in it. Commands are flat: a single word or dashed words like `version-check` and `deploy-svn`, without command groups or aliases. Each GitHub Action is named `wp-release-` followed by the command name, so the CLI command and the `uses:` name always match:

| Capability | CLI command | GitHub Action |
|---|---|---|
| Build a directory | `wp-release build` | |
| Build a ZIP | `wp-release zip` | [`wpelevator/wp-release-zip`](https://github.com/wpelevator/wp-release-zip) |
| Create a checksums manifest | `wp-release checksums` | [`wpelevator/wp-release-checksums`](https://github.com/wpelevator/wp-release-checksums) |
| Sign files | `wp-release sign` | [`wpelevator/wp-release-sign`](https://github.com/wpelevator/wp-release-sign) |
| Verify files against a manifest | `wp-release verify` | |
| Check that the versions agree | `wp-release version-check` | |
| Deploy to WordPress.org SVN | `wp-release deploy-svn` | [`wpelevator/wp-release-deploy-svn`](https://github.com/wpelevator/wp-release-deploy-svn) |
| Deploy to a Git repository | `wp-release deploy-git` | |

The names below are scoped to their commands. `--output` selects the primary artifact of each command; ZIP packaging uses `--checksums-file` for its accompanying manifest:

| Concept | CLI | GitHub Action | Library | Meaning |
|---|---|---|---|---|
| Plugin or theme directory | `<source-dir>` argument or `--source-dir` | `source-dir` | `sourceDir` | Directory that a command reads, whether it's the repository or a build directory. |
| Build directory | `build --output <dir>` | — | `outputDir` | Directory written by `build`; files go directly inside it. |
| ZIP file | `zip --output <file>` | `output` in ZIP action | `zipPath` | Destination passed to `zipPackage()`; also returned as `zipPath`. |
| Standalone checksums file | `checksums --output <file>` | `output` in checksums action | first argument of `writeChecksums()` | Manifest destination relative to the working directory; the CLI returns its absolute path as `checksumsPath`. |
| Checksums filename when zipping | `zip --checksums-file <file>` | `checksums-file` in ZIP action | `checksumsFile` | Relative manifest filename beside the ZIP or inside its package root when embedded. |
| ZIP to deploy | `--from-zip <file>` | `from-zip` | `fromZip` | Existing ZIP read as the deploy source. |
| Git tag to compare | `--git-tag <tag>` | | `gitTag` | Git tag checked by `version-check`. |
| SVN tag to create | `--svn-tag <version>` | `svn-tag` | `svnTag` | Tag written by `deploy-svn`, distinct from a git tag. |
| SVN repository | `--svn-url <url>` | `svn-url` | `svnUrl` | Deploy destination. |
| Git repository | `--git-url <url>` | | `gitUrl` | Destination of `deploy-git`. Credentials come from git, like a token in the URL or an SSH key, and are never printed. |
| Branch and tag to release to | `--branch <name>`, `--tag <name>` | | `branch`, `tag` | Refs written by `deploy-git` in the Git repository, distinct from the git tag that `version-check` compares. |
| Source history | `--split-prefix <dir>` | | `splitPrefix` | Directory of a monorepo package whose history, from `git subtree split`, becomes the source history of `deploy-git` releases. |
| SVN credentials | `--svn-username <name>`, `SVN_USERNAME` and `SVN_PASSWORD` env vars | `svn-username`, `svn-password` | `svnUsername`, `svnPassword` | Needed only to commit. There's no password flag, since it would show in the process list; the action inputs and library options fall back to the env vars. |
| Log format | `--log-format <text\|github>`, `--ci` for `github` | always `github` | `writer: new TextWriter()` or `new GitHubActionsWriter()` | How the log is printed: plain text, or GitHub Actions annotations and job summaries. Each name matches the start of its writer class. |
| Release config | `--config <path>` | `config` in ZIP, checksums and SVN actions | `configFile` | Explicit JavaScript config path for package selection, integrity settings or deployment. |
| Release tag format | `--tag-format <format>` | `tag-format` in SVN action | `tagFormat` | How `release-ref` identifies a package and its version. |
| Release ref to deploy | `--release-ref <ref>` | `release-ref` in SVN action | `ref` | Read configured packages and deployment targets from a release ref. |
| Assets sync | `--no-assets` to skip | `assets: false` to skip | `assets` | Booleans are positive in the library and the action; `--no-assets` is only the CLI negation, never `noAssets` or a `no-assets` input. |

CLI JSON results use camelCase keys like `zipPath`, and GitHub Action outputs use kebab-case like `zip-path`. The ZIP action supports `package` and `config`, the checksums action supports `config` for codec selection, and the SVN action supports `release-ref`, repeated `package` values as newline-separated input, `list`, `config` and `tag-format`.

The ZIP CLI result uses `checksumsEmbedded` for the package-relative embedded manifest path. Its `signatures` array includes external absolute paths and embedded package-relative paths, while `checksumsSignatures` contains only manifest signatures. The ZIP action exposes those locations as `checksums-embedded`, `signatures` for external signatures, and `signatures-embedded` for embedded signatures, so asset uploads receive local files. With CLI `--github-output`, signature arrays remain in the JSON `result` output.

Library classes are named after the capability (`SvnDeploy`, `Svn`, `GitDeploy`) without repeating "release".

### File selection [#file-selection]

`build`, `zip`, `checksums`, `deploy-svn` and `deploy-git` select files the same way:

| Option | Description |
|---|---|
| `--distignore <file>` | Path to the ignore file. Defaults to `.distignore` in the source directory when present; an explicitly passed file must exist. |
| `--no-distignore` | Don't read any ignore file. |
| `--exclude <patterns>` | Extra gitignore-style patterns, comma-separated or repeated, like `--exclude build/,assets/*,images/**/*`. They're applied after the ignore file, so a `!` pattern can also re-include a file. |
| `--exclude-gitattributes` | Also exclude paths marked `export-ignore` by Git attributes. This is opt-in and requires the source directory to be inside a Git repository. |

`.distignore` and `--exclude` use full gitignore syntax, including `!` negation. `--exclude-gitattributes` asks Git to evaluate `export-ignore` attributes, including nested `.gitattributes` files, then adds those paths to the exclusions. It is off by default, so releases don't unexpectedly depend on Git or change selection when a repository adds attributes. Git must be installed and the source directory must be inside a working tree; the flag is ignored by `deploy-svn --from-zip`, since the ZIP is already filtered. Version control metadata (`.git`, `.svn` and `.hg`, at any depth, including the `.git` files of worktrees and submodules) is always left out, also without an ignore file and when deploying from a ZIP, and no `!` pattern can re-include it. This keeps a repository's history out of ZIPs and deploys when the source directory is the repository root. The comma-separated `--exclude` list works like `--exclude` in `wp i18n make-pot`. Selected symbolic links are an error, since ZIP archives and WordPress.org SVN don't support them.

### Plugin and theme headers [#plugin-and-theme-headers]

The commands read the same headers as WordPress. The main plugin file is the top-level `.php` file with a `Plugin Name:` header in its first 8 KB, preferring `{slug}.php` when several files have one. A directory without a plugin file and with `Theme Name:` in `style.css` is a theme. The readme headers (`Stable tag`, `Tested up to`, …) come from `readme.txt`, or `readme.md` when there's no `readme.txt`.

`--version` defaults to the `Version` header in `zip`, `checksums` and `version-check`, and `checksums --type` defaults to the detected package type.
