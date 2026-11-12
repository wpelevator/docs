# php-changesets (/php/php-changesets/v2.0.1/index.html)

`wpelevator/php-changesets` releases WordPress plugins, themes and Composer packages from changeset Markdown files, with PHP and Git and without Node.js. It's for projects that don't use Node.js or JavaScript tooling: a Composer dependency replaces an npm one, and nothing needs installing in CI beyond PHP. It follows the release model of [`wp-release`](../../../js/wp-release/docs/index.html.md), the Node.js release tool of WP Elevator, so both tools read the same changesets, take the same command options and produce the same release plans.

If your project already builds with Node.js, or you also want ZIPs, checksums, translations or WordPress.org deploys, use the [`wp-release` changeset commands](../../../js/wp-release/docs/changesets.html.md) instead. The [comparison](comparison.html.md) lists the differences.

Contributors describe each change in a small Markdown file. When you release, the `changeset` command bumps the versions of every changed package, writes the changelogs and creates the release tags. It never commits or publishes: those steps belong to your workflow, like the [GitHub Actions workflow](github-actions.html.md).

## Requirements [#requirements]

- PHP 7.4 or later.
- Git for tag-based versions, changed-package checks, release tags and dry-run diffs.
- Composer to install the CLI. Node.js is not required.

## Install [#install]

```sh
composer require --dev wpelevator/php-changesets
vendor/bin/changeset --help
```

## Quickstart [#quickstart]

For a WordPress plugin or a Composer package at the repository root:

```sh
vendor/bin/changeset init                  # Infer and write changesets.config.php
vendor/bin/changeset add                   # Describe a change; commit the file with it
vendor/bin/changeset status --since origin/main  # Check that changed packages have changesets
vendor/bin/changeset version --dry-run     # Preview the versions, changelog and diff
vendor/bin/changeset version               # Apply them; review and commit
vendor/bin/changeset tag                   # After merging: create the release tags, like v1.3.0
```

## Guides [#guides]

- [Command line](cli.html.md): the commands, changesets, the status check, releases, pre-releases, output formats and exit codes.
- [Configuration](configuration.html.md): `changesets.config.php`, package groups, version descriptors and hooks.
- [GitHub Actions](github-actions.html.md): check pull requests for changesets, open release pull requests and create the tags and GitHub releases.
- [Comparison with wp-release](comparison.html.md): the command mapping and the deliberate differences.
- [Development](development.html.md): the architecture and tests of the package.
