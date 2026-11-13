# Names across the CLI, Actions and library

How options, results and inputs are named in the CLI, the GitHub Actions and the library API.

`@wpelevator/wp-release` is the suite of release tools and `wp-release` is its CLI. "Release" is the whole workflow; each command is one operation in it. Commands are one word, or a group followed by one word: `changeset`, `deploy` and `i18n` have commands such as `changeset add`, `deploy svn` and `i18n pot`. The earlier dashed names, like `changeset-add`, `deploy-svn` and `i18n-pot`, still run the same commands as aliases. Each GitHub Action is named `wp-release-` followed by the command name, so the CLI command and the `uses:` name match.

| Capability | CLI command | GitHub Action |
|---|---|---|
| Build a directory | `wp-release build` | |
| Build a ZIP | `wp-release zip` | [`wpelevator/wp-release-zip`](https://github.com/wpelevator/wp-release-zip) |
| Create a checksums manifest | `wp-release checksums` | [`wpelevator/wp-release-checksums`](https://github.com/wpelevator/wp-release-checksums) |
| Sign files | `wp-release sign` | [`wpelevator/wp-release-sign`](https://github.com/wpelevator/wp-release-sign) |
| Verify files against a manifest | `wp-release verify` | |
| Check that the versions agree | `wp-release version-check` | |
| Deploy to WordPress.org SVN | `wp-release deploy svn` | [`wpelevator/wp-release-deploy-svn`](https://github.com/wpelevator/wp-release-deploy-svn) |
| Deploy to a Git repository | `wp-release deploy git` | |

The names below are scoped to their commands. `--output` selects the primary artifact of each command; ZIP packaging uses `--checksums-file` for its accompanying manifest:

| Concept | CLI | GitHub Action | Library | Meaning |
|---|---|---|---|---|
| Plugin or theme directory | `<source-dir>` argument or `--source-dir` | `source-dir` | `sourceDir` | Directory that a command reads, whether it's the repository or a build directory. |
| Build directory | `build --output <dir>` | None | `outputDir` | Directory written by `build`; files go directly inside it. |
| ZIP file | `zip --output <file>` | `output` in ZIP action | `zipPath` | Destination passed to `zipPackage()`; also returned as `zipPath`. |
| Standalone checksums file | `checksums --output <file>` | `output` in checksums action | first argument of `writeChecksums()` | Manifest destination relative to the working directory; the CLI returns its absolute path as `checksumsPath`. |
| Checksums filename when zipping | `zip --checksums-file <file>` | `checksums-file` in ZIP action | `checksumsFile` | Relative manifest filename beside the ZIP or inside its package root when embedded. |
| ZIP to deploy | `--from-zip <file>` | `from-zip` | `fromZip` | Existing ZIP read as the deploy source. |
| Git tag to compare | `--git-tag <tag>` | | `gitTag` | Git tag checked by `version-check`. |
| SVN tag to create | `--svn-tag <version>` | `svn-tag` | `svnTag` | Tag written by `deploy svn`, distinct from a git tag. |
| SVN repository | `--svn-url <url>` | `svn-url` | `svnUrl` | Deploy destination. |
| Git repository | `--git-url <url>` | | `gitUrl` | Destination of `deploy git`. Credentials come from git, like a token in the URL or an SSH key, and are never printed. |
| Branch and tag to release to | `--branch <name>`, `--tag <name>` | | `branch`, `tag` | Refs written by `deploy git` in the Git repository, distinct from the git tag that `version-check` compares. |
| Source history | `--split-prefix <dir>` | | `splitPrefix` | Directory of a monorepo package whose history, split into its own commits like `git subtree split` does, becomes the source history of `deploy git` releases. |
| SVN credentials | `--svn-username <name>`, `SVN_USERNAME` and `SVN_PASSWORD` env vars | `svn-username`, `svn-password` | `svnUsername`, `svnPassword` | Needed only to commit. There's no password flag, since it would show in the process list; the action inputs and library options fall back to the env vars. |
| Log format | `--log-format <text\|github>`, `--ci` for `github` | always `github` | `writer: new TextWriter()` or `new GitHubActionsWriter()` | How the log is printed: plain text, or GitHub Actions annotations and job summaries. Each name matches the start of its writer class. |
| Release config | `--config <path>` | `config` in ZIP, checksums and SVN actions | `configFile` | Explicit JavaScript config path for package selection, integrity settings or deployment. |
| Release tag format | `--tag-format <format>` | `tag-format` in SVN action | `tagFormat` | How `release-ref` identifies a package and its version. |
| Release ref to deploy | `--release-ref <ref>` | `release-ref` in SVN action | `ref` | Read configured packages and deployment targets from a release ref. |
| Assets sync | `--no-assets` to skip | `assets: false` to skip | `assets` | Booleans are positive in the library and the action; `--no-assets` is only the CLI negation, never `noAssets` or a `no-assets` input. |

CLI JSON results use camelCase keys like `zipPath`, and GitHub Action outputs use kebab-case like `zip-path`. The ZIP action supports `package` and `config`, the checksums action supports `config` for codec selection, and the SVN action supports `release-ref`, repeated `package` values as newline-separated input, `list`, `config` and `tag-format`.

The ZIP CLI result uses `checksumsEmbedded` for the package-relative embedded manifest path. Its `signatures` array includes external absolute paths and embedded package-relative paths, while `checksumsSignatures` contains only manifest signatures. The ZIP action exposes those locations as `checksums-embedded`, `signatures` for external signatures, and `signatures-embedded` for embedded signatures, so asset uploads receive local files. With CLI `--github-output`, signature arrays remain in the JSON `result` output.

Library classes are named after the capability (`SvnDeploy`, `Svn`, `GitDeploy`) without repeating "release".
