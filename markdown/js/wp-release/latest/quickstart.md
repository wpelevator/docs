# Quickstart

Build and inspect a disposable plugin ZIP, check its version and verify its checksums.

Build a disposable plugin release without touching an existing project. You need Node.js 22.12 or later, npm and `unzip`.

## 1. Create a fixture and build

Create a temporary workspace and run the commands there. The explicit `.distignore` excludes development directories and release outputs from subsequent builds.

```sh
workspace=$(mktemp -d)
cd "$workspace"
mkdir my-plugin && cd my-plugin
printf '<?php\n/*\nPlugin Name: My Plugin\nVersion: 1.4.2\n*/\n' > my-plugin.php
printf '=== My Plugin ===\nStable tag: 1.4.1\n' > readme.txt
printf 'node_modules/\ntests/\n*.zip\n*.checksums.json\n' > .distignore
npx @wpelevator/wp-release zip
```

```text
/home/me/my-plugin/my-plugin.1.4.2.zip
```

Inspect the archive before treating it as a release:

```sh
unzip -l my-plugin.1.4.2.zip
```

```text
Archive:  my-plugin.1.4.2.zip
  Length      Date    Time    Name
---------  ---------- -----   ----
       44  1980-01-01 00:00   my-plugin/.distignore
       50  1980-01-01 00:00   my-plugin/my-plugin.php
       36  1980-01-01 00:00   my-plugin/readme.txt
---------                     -------
      130                     3 files
```

The paths are normalized from a run in a temporary directory. The `my-plugin/` root folder is required by WordPress.

## 2. Catch and fix a mismatch

The fixture deliberately has different versions in its header and readme:

```sh
npx @wpelevator/wp-release version-check
```

```text
Error: Stable tag in readme.txt is 1.4.1, expected 1.4.2.
```

The command exits with `2`. Replace the fixture readme and check again:

```sh
printf '=== My Plugin ===\nStable tag: 1.4.2\n' > readme.txt
npx @wpelevator/wp-release version-check
```

```text
All versions match 1.4.2.
```

## 3. Build and verify checksums

Rebuild after fixing the readme, replacing the first ZIP and generating the manifest:

```sh
npx @wpelevator/wp-release zip --checksums --force
npx @wpelevator/wp-release verify --zip my-plugin.1.4.2.zip --checksums my-plugin.1.4.2.checksums.json
```

```text
/home/me/my-plugin/my-plugin.1.4.2.zip
/home/me/my-plugin/my-plugin.1.4.2.checksums.json
3 files match, 0 changed, 0 missing and 0 extra.
```

## Use an existing plugin

Run the commands from a plugin directory with a `Version` header and a readme `Stable tag`. First review [file selection](file-selection.md) and create a `.distignore` appropriate to your project, including development dependencies, tests, secrets and generated release artifacts. Inspect the ZIP before distributing it. The slug, version, files and counts depend on your plugin; `--force` replaces an existing output, so review paths before using it.

## What next

- [Choose which files ship](file-selection.md) and [check versions](version-check.md).
- [Verify](verify.md) and [sign releases](signing.md).
- [Release from GitHub Actions](release-workflow.md) or [deploy to WordPress.org](deploy-svn.md).
