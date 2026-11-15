# Quickstart

Go from a WordPress plugin directory to a release ZIP, a version check and a verified checksums manifest in about a minute.

Turn a plugin directory into a release ZIP you can trust. You need Node.js 22.12 or later and a plugin with a `Version` header. There is nothing to install or configure.

## 1. Build the ZIP

From the plugin directory:

```sh
npx @wpelevator/wp-release zip
```

```text
/home/me/my-plugin/my-plugin.1.4.2.zip
```

The ZIP has the `my-plugin/` root folder that WordPress.org, plugin updates and WordPress Playground require. Everything in `.distignore` is left out:

```text
my-plugin/.distignore
my-plugin/includes/class-thing.php
my-plugin/my-plugin.php
my-plugin/readme.txt
```

`node_modules/` and `tests/` were listed in `.distignore`, so they aren't there. The same files give the same ZIP, so a rebuild creates no diff.

## 2. Catch version mismatches before WordPress.org does

```sh
npx @wpelevator/wp-release version-check
```

```text
Error: Stable tag in readme.txt is 1.4.1, expected 1.4.2.
```

The command exits with `2`, so it stops a CI job. In `readme.txt`, change `Stable tag: 1.4.1` to `Stable tag: 1.4.2`, then run it again:

```text
All versions match 1.4.2.
```

It compares the `Version` header with the readme `Stable tag`. [Check versions](version-check.md) adds PHP constants and the git tag.

## 3. Prove the ZIP wasn't changed

Write a checksums manifest while building, then check any ZIP against it, for example the one a user downloaded. The ZIP from step 1 already exists, so replace it with `--force`:

```sh
npx @wpelevator/wp-release zip --checksums --force
```

```text
/home/me/my-plugin/my-plugin.1.4.2.zip
/home/me/my-plugin/my-plugin.1.4.2.checksums.json
```

```sh
npx @wpelevator/wp-release verify --zip my-plugin.1.4.2.zip --checksums my-plugin.1.4.2.checksums.json
```

```text
4 files match, 0 changed, 0 missing and 0 extra.
```

If someone adds or edits a file, the check fails and names it. To try it, add a file and build a second ZIP from the changed plugin, leaving out the ZIP from step 1:

```sh
touch evil.php
npx @wpelevator/wp-release zip --exclude '*.zip' --output ../tampered.zip
npx @wpelevator/wp-release verify --zip ../tampered.zip --checksums my-plugin.1.4.2.checksums.json
```

```text
Error: Not in the checksums: evil.php
4 files match, 0 changed, 0 missing and 1 extra.
```

Delete `evil.php` and `../tampered.zip` when you're done.

## What next

- **Automate versions, changelogs and tags.** [Changesets](changesets.md) record the release impact of each pull request, and [Release from GitHub Actions](release-workflow.md) turns them into a release pull request and a tag.
- **Publish to WordPress.org.** [Deploy to WordPress.org](deploy-svn.md) syncs trunk and creates the tag; add `--dry-run` to see everything except the commit.
- **Sign the release.** [Sign releases](signing.md) covers Ed25519, minisign and SSH signatures.
- **Choose which files ship.** [Choose which files ship](file-selection.md) explains `.distignore` and `--exclude`.
