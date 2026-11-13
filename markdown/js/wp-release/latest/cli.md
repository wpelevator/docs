# CLI reference

Every wp-release command, grouped by task, with the global options and conventions.

Run the CLI with `npx @wpelevator/wp-release <command>`, or `wp-release <command>` after it's installed in your project. `--help` lists the commands and `--help` after a command lists its options:

```sh
npx @wpelevator/wp-release --help
npx @wpelevator/wp-release zip --help
```

## Commands

| Task | Command | Page |
|---|---|---|
| Build | `wp-release zip [<source-dir>] [options]` | [Build a release ZIP](build-a-zip.md) |
| Build | `wp-release build [<source-dir>] --output <dir> [options]` | [Build a release ZIP](build-a-zip.md#build-a-directory-instead-of-a-zip) |
| Check | `wp-release version-check [<source-dir>] [options]` | [Check versions](version-check.md) |
| Verify | `wp-release checksums [<source-dir>] [options]` | [Write a checksums manifest](checksums.md) |
| Verify | `wp-release verify [<source-dir>] --checksums <file> [options]` | [Verify a ZIP or directory](verify.md) |
| Sign | `wp-release keygen` | [Sign releases](signing.md) |
| Sign | `wp-release sign <file>... [options]` | [Sign releases](signing.md) |
| Release | `wp-release changeset add [options]` | [Changesets](changesets.md) |
| Release | `wp-release changeset status [options]` | [Changesets](changesets.md) |
| Release | `wp-release changeset version [options]` | [Changesets](changesets.md) |
| Release | `wp-release changeset tag [options]` | [Changesets](changesets.md) |
| Deploy | `wp-release deploy svn [<source-dir>] [options]` | [Deploy to WordPress.org](deploy-svn.md) |
| Deploy | `wp-release deploy git [<source-dir>] --git-url <url> [options]` | [Deploy to a Git repository](deploy-git.md) |
| Deploy | `wp-release deploy git --release-ref <ref> [--package <name>] [--list]` | [Deploy configured packages](deploy-packages.md) |
| Deploy | `wp-release deploy svn --release-ref <ref> [--package <name>] [--list]` | [Deploy configured packages](deploy-packages.md) |
| Translate | `wp-release i18n pot [<source-dir>] [options]` | [Extract a POT file](internationalization.md) |
| Translate | `wp-release i18n audit [<source-dir>] [options]` | [Extract a POT file](internationalization.md) |
| Translate | `wp-release i18n mo <file.po> [options]` | [Compile translations](compile-translations.md) |
| Translate | `wp-release i18n json <file.po> --domain <domain> [options]` | [Compile translations](compile-translations.md) |
| Translate | `wp-release i18n php <file.po> [options]` | [Compile translations](compile-translations.md) |

Commands of a group are one word each after the group: `changeset`, `deploy` and `i18n`. Run `npx wp-release <group> --help` to list the commands of a group and `npx wp-release <group> <command> --help` for their options. The earlier dashed names, like `changeset-add`, `deploy-svn` and `i18n-pot`, still run the same commands as aliases, but the docs, help and the library results use the grouped names.

## Global options

| Option | Effect |
|---|---|
| `-h`, `--help` | Show help for the command. |
| `-v`, `--verbose` | Print more output. |
| `-q`, `--quiet` | Print errors only. |
| `--json` | Print the result as JSON. |
| `--github-output` | Set the result as JSON to the `result` output of the GitHub Actions step. See [Use it in GitHub Actions](github-actions.md). |
| `--log-format <name>` | `text`, or `github` for annotations and job summaries. The default is `github` when `GITHUB_ACTIONS=true`. |
| `--ci` | The same as `--log-format github`. |
| `--config <path>` | Path to a JavaScript release config file. See [Configuration](configuration.md). |
| `--tag-format <format>` | Tag format with `{name}`, `{path}` and `{version}` that replaces the `tagFormat` of the config, like `{path}/{version}`. See [Packages and tags](monorepo-releases.md#packages-and-tags). |

## Conventions

`wp-release changeset` without a command runs `changeset add`, with its options, so that a package.json script can map `changeset` to it:

```json
{
	"scripts": {
		"changeset": "wp-release changeset"
	}
}
```

`npm run changeset` then adds a changeset, and `npm run changeset -- status --since origin/main` runs the other changeset commands. The `deploy` and `i18n` groups need a command.

Run `npx wp-release <command> --help` for the options of each command. Directory-based commands accept a first `<source-dir>` argument or `--source-dir`, defaulting to the current directory. `sign` and the `i18n mo`, `i18n json` and `i18n php` compilers take file arguments, `keygen` generates keys, and changeset commands operate on the configured repository. Every command prints its result as JSON with `--json`. Commands that take no positional arguments, like the changeset commands, reject bare arguments with the usage instead of ignoring them.
