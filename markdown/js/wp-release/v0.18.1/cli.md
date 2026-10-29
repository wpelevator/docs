# CLI (/js/wp-release/v0.18.1/cli)

## CLI [#cli]

```bash
npx wp-release --help
```

| Command | Description |
|---|---|
| `wp-release build [<source-dir>] --output <dir> [options]` | Copy selected release files into a directory. |
| `wp-release zip [<source-dir>] [options]` | Create a ZIP archive with a `{slug}/` root folder, respecting `.distignore`. |
| `wp-release checksums [<source-dir>] [options]` | Write the MD5 and SHA-256 hashes of every distributed file to a checksums manifest. |
| `wp-release sign <file>... [options]` | Sign files with Ed25519, writing a detached `<file>.sig` next to each, or minisign and SSH signatures with `--format`. |
| `wp-release keygen` | Generate a base64 Ed25519 private seed and its public key, also as minisign and SSH public keys. |
| `wp-release verify [<source-dir>] --checksums <file> [options]` | Check a plugin or theme directory, or a ZIP, against a checksums manifest. |
| `wp-release version-check [<source-dir>] [options]` | Check that the `Version` header, readme `Stable tag`, PHP constants and git tag agree. |
| `wp-release deploy-svn [<source-dir>] [options]` | Deploy a plugin to the WordPress.org plugin SVN repository. |
| `wp-release deploy-git [<source-dir>] --git-url <url> [options]` | Deploy the files of a plugin, theme or package to a Git repository as a release commit. |
| `wp-release deploy-git --release-ref <ref> [--package <name>] [--list]` | Deploy the configured packages of a release tag or branch to their Git targets. |
| `wp-release deploy-svn --release-ref <ref> [--package <name>] [--list]` | Deploy the configured plugin of a release tag to WordPress.org. |
| `wp-release i18n-pot [<source-dir>] [options]` | Extract translatable strings into a reproducible POT file. |
| `wp-release i18n-audit [<source-dir>] [options]` | Report translation string problems without writing files. |
| `wp-release i18n-mo <file.po> [options]` | Compile a translated PO file into MO. |
| `wp-release i18n-json <file.po> --domain <domain> [options]` | Compile the JavaScript strings of a translated PO file into WordPress script JSON files. |
| `wp-release i18n-php <file.po> [options]` | Compile a translated PO file into a WordPress `.l10n.php` file. |
| `wp-release changeset-add [options]` | Record the release impact of a pull request. |
| `wp-release changeset-status [options]` | List pending releases and check changed packages for changesets. |
| `wp-release changeset-version [options]` | Apply version bumps and changelog entries. |
| `wp-release changeset-tag [options]` | Create missing package release tags. |

Run `npx wp-release <command> --help` for the options of each command. Directory-based commands accept a first `<source-dir>` argument or `--source-dir`, defaulting to the current directory. `sign` and the `i18n-mo`, `i18n-json` and `i18n-php` compilers take file arguments, `keygen` generates keys, and changeset commands operate on the configured repository. Every command prints its result as JSON with `--json`. Commands that take no positional arguments, like the changeset commands, reject bare arguments with the usage instead of ignoring them.

In GitHub Actions, `--github-output` writes the complete result as JSON to `steps.<id>.outputs.result` and exposes each top-level string, number or boolean as a plain output. Use `steps.zip.outputs.zipPath` for a ZIP path, for example. Arrays and objects remain in `result`: tag metadata is read with `fromJSON( steps.tag.outputs.result ).tags[0].tag`, even when only one package is selected. There is no plain `steps.tag.outputs.tag` output.

Prefer plain outputs in steps that run conditionally, since a skipped step has empty outputs. When reading JSON from a step that may be skipped, use a fallback such as `fromJSON( steps.tag.outputs.result || '{"tags":[]}' ).tags[0].tag`. For several tags or deploys, read the arrays in `result` to build a job matrix or process each item.

### GitHub Actions annotations and job summaries [#github-actions-annotations-and-job-summaries]

With the `github` log format, the CLI uses current GitHub Actions features to report problems where you look for them, instead of only in the log. `--log-format <name>` picks how the CLI logs, separately from the result that `--json` prints:

| Log format | Output |
|---|---|
| `text` | Plain text. The default outside GitHub Actions. |
| `github` | GitHub Actions annotations and job summaries. The default when `GITHUB_ACTIONS=true`. `--ci` is a shorthand for it. |

Pass `--log-format text` for plain text in GitHub Actions. The GitHub Actions always use the `github` log format. Only the CLI checks `GITHUB_ACTIONS`: the library classes don't read the environment, and choose the format by the [writer](library.md#logging) they get.

Errors, warnings and notices are printed as [workflow commands](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands), so they show up as annotations on the run and on the files of a pull request:

- `version-check` and `deploy-svn` annotate each version mismatch on the file and line of the version: the `Version` header, the readme `Stable tag` or the PHP constant.
- `verify` annotates each changed file and each file that isn't in the checksums.

Each command also adds a section to the [job summary](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands#adding-a-job-summary) of the run, when `GITHUB_STEP_SUMMARY` is set:

| Command | Summary |
|---|---|
| `deploy-svn` | Plugin, linked to its WordPress.org page, version, written SVN paths, the commit linked to its WordPress.org changeset (or the dry run or no-op result), and the SVN changes in a collapsed table. |
| `deploy-git` | Repository, release commit and the pushed branch and tag. |
| `build` | Output directory, number of copied files and optional manifest; requested signatures and public keys. |
| `zip` | ZIP, number of files and checksums manifest; with `--sign`, signature files and the public key of each written format. |
| `checksums` | Manifest and number of files. |
| `sign` | Signature files and the public key of each written format. |
| `verify` | That all files match, or the counts and a table of the changed, missing and extra files. |
| `version-check` | The matching version, or a table of the mismatches with their files and lines. |
| `changeset-status` | Each changed package with whether it has a changeset. |
| `changeset-version` | A table of the package releases with their version changes and bumps. |
| `changeset-tag` | Each tag with its previous tag and status, and its release notes in a collapsed section. |

A failed command adds its error to the summary, or a table of its problems with their files and lines, listing up to 100 and counting the rest. The Markdown of the summaries isn't part of the library API. File paths are relative to `GITHUB_WORKSPACE`, or the current directory without it. Files outside it, like those of an extracted ZIP, get an annotation without a file. Multi-line messages stay one annotation.

Use global `--config <path>` to select a config; relative paths resolve from the current directory. Otherwise, commands using the config discover `wp-release.config.js`, `.mjs` or `.cjs` at the repository root. Global `--tag-format <format>` replaces the `tagFormat` of the config for one command, see [Packages and tags](changesets.md#packages-and-tags).
