# Configuration

What wp-release detects without a config file, and where the config file is needed.

Most commands need no config file. They read the headers that WordPress reads and use the working directory as the plugin or theme.

## What is detected

The commands read the same headers as WordPress. The main plugin file is the top-level `.php` file with a `Plugin Name:` header in its first 8 KB, preferring `{slug}.php` when several files have one. A directory without a plugin file and with `Theme Name:` in `style.css` is a theme. The readme headers (`Stable tag`, `Tested up to`, …) come from `readme.txt`, or `readme.md` when there's no `readme.txt`.

`--version` defaults to the `Version` header in `zip`, `checksums` and `version-check`, and `checksums --type` defaults to the detected package type.

## The config file

A config file is needed for monorepos, deploy targets, translation settings and [integrity settings](checksums.md#configuration-and-custom-codecs). Select it with the global `--config <path>`, where relative paths resolve from the current directory. Otherwise, commands that use the config discover `wp-release.config.js`, `.mjs` or `.cjs` at the repository root. Use ESM (`export default`) or CommonJS (`module.exports`).

| To configure | See |
|---|---|
| Packages, tags, release titles and dependents | [Release a monorepo](monorepo-releases.md) |
| Deploy targets | [Deploy configured packages](deploy-packages.md) |
| Checksums, signatures and custom codecs | [Write a checksums manifest](checksums.md#configuration-and-custom-codecs) |
| POT extraction | [Extract a POT file](internationalization.md#configure-extraction) |
| File selection | [Choose which files ship](file-selection.md) |

## Config reference

`defineConfig()` takes these top-level keys. Only `packages` is required.

| Key | What it sets | Details |
|---|---|---|
| `packages` | The package groups to discover and release. | [Configure packages](monorepo-releases.md) |
| `root` | The directory that package paths and `{path}` in tag formats are relative to. | [Packages and tags](monorepo-releases.md#packages-and-tags) |
| `tagFormat` | The release tag template with `{name}`, `{path}` and `{version}`. | [Packages and tags](monorepo-releases.md#packages-and-tags) |
| `releaseTitle` | The title of a release, a template or a callback. | [Packages and tags](monorepo-releases.md#packages-and-tags) |
| `releaseNotes` | A callback that formats the release notes of a tag. | [Tag a release](changesets.md#tag-a-release) |
| `changelogEntry` | A callback that formats the `CHANGELOG.md` entry of a changeset. | [Version a release](changesets.md#version-a-release) |
| `nextVersion` | A callback that replaces the SemVer bump, for example to raise only the fourth part of a four-part version. | [Packages and tags](monorepo-releases.md#packages-and-tags) |
| `readmeChangelog`, `changelogInsertAfter` | Whether the plugin readme gets the changelog too, and where entries are inserted. | [Version a release](changesets.md#version-a-release) |
| `baseBranch`, `remote` | The branch that `changeset status` compares against and the remote that tags are pushed to. | [Single-project repositories](changesets.md#single-project-repositories) |
| `changesets` | The changeset directory, `.changeset` by default. | [Single-project repositories](changesets.md#single-project-repositories) |
| `dependents` | Packages that are re-released when a package that they bundle releases. | [Re-release packages that bundle a package](monorepo-releases.md#re-release-packages-that-bundle-a-package) |
| `files` | The ignore file and patterns that every package's deploys use. | [Deploy configured packages](deploy-packages.md#target-options) |
| `integrity` | The checksums format, placement and signing for ZIPs. | [Write a checksums manifest](checksums.md#configuration-and-custom-codecs) |
| `i18n` | Defaults for POT extraction. | [Extract a POT file](internationalization.md#configure-extraction) |

Each entry of `packages` is a group of directories with shared behavior:

| Key | What it sets |
|---|---|
| `glob` | The package directories to discover, such as `plugins/*`, or `.` for a package at the repository root. |
| `exclude` | Package paths to leave out of the group. |
| `id`, `idFrom` | The changeset name of the package: a literal for a single package, or the name in `package.json` or `composer.json`. |
| `version` | Where the version is read from (`from`) and which files are updated (`to`). Without it, the package isn't released with changesets and only deploys branches. |
| `files` | The ignore file and patterns of the package's deploys. |
| `deploy` | The Git and SVN targets of the package. |
| `i18n` | POT extraction settings for the package. |

`version.from` and `version.to` take these helpers, which match the `--version-*` flags of the [single-project commands](changesets.md#single-project-repositories):

| Helper | Version in |
|---|---|
| `packageJsonVersion()` | `package.json` |
| `composerJsonVersion()` | `composer.json`. `ifPresent: true` skips a manifest without a `version`. |
| `wordpressPluginVersion()` | The `Version` header of the plugin file. |
| `wordpressThemeVersion()` | The `Version` header of the theme `style.css`. |
| `wordpressStableTag()` | The readme `Stable tag`. `ifPresent: true` skips a missing readme. |
| `phpConstantVersion( { file, constant } )` | A PHP `define()` or `const`. |
| `gitTagVersion( { pattern } )` | Existing stable Git tags, as a source only. |
