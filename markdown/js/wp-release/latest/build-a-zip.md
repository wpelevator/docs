# Build a release ZIP

Create the reproducible plugin or theme ZIP that WordPress.org, plugin updates and WordPress Playground expect.

`zip` packs the files of a plugin or theme directory into `{slug}.{version}.zip`, with every file inside a `{slug}/` root folder.

```sh
npx @wpelevator/wp-release zip
```

```text
/home/me/my-plugin/my-plugin.1.4.2.zip
```

The slug is the directory name, and the version is the `Version` header of the plugin. The command prints the path of the ZIP and nothing else, so a script can read it. The ZIP of the example plugin holds these files, without `node_modules/` and `tests/`, which `.distignore` lists:

```text
my-plugin/.distignore
my-plugin/includes/class-thing.php
my-plugin/my-plugin.php
my-plugin/readme.txt
```

The same files give the same ZIP: entries are sorted and use a fixed mode and timestamp. [Choose which files ship](file-selection.md) explains how files are selected.

## Common tasks

Write a checksums manifest next to the ZIP, and replace the earlier ZIP of the same version:

```sh
npx @wpelevator/wp-release zip --checksums --force
```

```text
/home/me/my-plugin/my-plugin.1.4.2.zip
/home/me/my-plugin/my-plugin.1.4.2.checksums.json
```

Zip a build directory under another slug:

```sh
npx @wpelevator/wp-release zip dist --slug my-plugin
```

Name the file `my-plugin.zip`, without the version:

```sh
npx @wpelevator/wp-release zip --filename-format {slug}
```

Sign the ZIP and its manifest while building: see [Sign releases](signing.md#sign-builds-and-zips).

## Build a directory instead of a ZIP

`build` copies the selected files into a directory, with the same file selection as `zip` and no ZIP:

```sh
npx @wpelevator/wp-release build --output dist/my-plugin
```

```text
/home/me/my-plugin/dist/my-plugin
```

```sh
wp-release build --output dist/code-prettify
wp-release build --package plugins/alpha --output dist/alpha
```

The destination is required and automatically excluded when it is inside the source. It cannot be the source directory or an ancestor, including through symlinked parents. Existing destinations require `--force`, which replaces the directory and removes stale files; existing files and symbolic links are rejected. Files are copied to a temporary directory before the existing build is replaced. Selected symbolic links are rejected as with ZIP packaging. `--json` returns `outputDir`, `files` and, for configured builds, `package`; it also returns `checksumsPath` when a manifest is generated, and `signatures` and `publicKey` when signing is requested. `--github-output` exposes these results too.

`--checksums` writes `<output-dir>.checksums.json` beside the directory and hashes the copied build files. `--sign-checksums` generates and signs that manifest, implying `--checksums`. Use `--slug` and `--version` to override its metadata. The manifest and its signatures are excluded from the source selection, so rebuilding with `--force` does not package previous sidecars. Existing manifests and requested signature files also require `--force`; signing keys, formats and signature destinations are validated before creating or replacing the build. `--sign` is unsupported because a directory has no single file to sign.

```sh
wp-release build --output dist/code-prettify --sign-checksums
```

In the Deploy workflow, a directory build can be deployed with `wp-release deploy svn dist/code-prettify --slug code-prettify --trunk --svn-tag "$GITHUB_REF_NAME" --no-distignore`. Keep `--from-zip` when the SVN deployment must match the attached ZIP exactly. Run dependency installation and compilation before `build`; it only selects and copies files.

## ZIP options

`zip` writes `{slug}.{version}.zip` to the current directory, or to `--output <file>`, with the selected files in a `{slug}/` root folder:

```bash
wp-release zip dist --slug my-plugin --checksums
```

- `--root-folder <name>` changes the root folder and `--no-root-folder` puts the files at the root of the ZIP.
- `--filename-format` changes the name, like `--filename-format {slug}` for `my-plugin.zip`.
- Entries are sorted and use a fixed file mode and a fixed timestamp (1980-01-01), or the `SOURCE_DATE_EPOCH` Unix time when that environment variable is set, so the same files give the same ZIP. Built-in metadata is deterministic except for embedded minisign signatures, which include their signing timestamp; custom codec callbacks control their own encoded bytes.
- `--checksums` also writes the [checksums manifest](checksums.md) of the archived files next to the ZIP, with `.checksums.json` instead of `.zip`.
- `--sign` signs only the ZIP with `WP_RELEASE_SIGNING_KEY`. `--sign-checksums` generates and signs only the checksums manifest, implying `--checksums`. Use both flags to sign both files. External signatures are written alongside their files; embedded manifest signatures are written inside the package. The default format is WordPress `.sig`, unless integrity configuration selects another format.
- `--sign-format` selects formats for requested signatures, such as `--sign-format wordpress,minisign,ssh`. It requires `--sign` or `--sign-checksums` and never enables signing by itself. Signing keys, formats and existing signature destinations are validated before writing the ZIP or manifest. `--force` also overwrites requested signatures. Job summaries include signatures and public keys; JSON results include `signatures` and `publicKey`.
- An existing ZIP or manifest isn't overwritten without `--force`. A ZIP or manifest written inside the source directory is never archived.
- `--package <name>` zips a package of the [configured packages](deploy-packages.md), by identifier or path under the configured root like `plugins/alpha`, instead of a source directory: its directory with the `files` config of its package group, the same files that its deploys select. The slug defaults to the directory name and the version to the `Version` header, and `--slug` and `--version` still set them. Any package of the config works, with or without a version or deploy targets. To zip what a deploy just released, pass the `package` and `version` of the `deploy git --release-ref` result, in the same job and from the same build, so the ZIP has exactly the files of the release tag in the release repository. It can't be combined with `<source-dir>` or the file selection options. The `--json` result has the `package`, `slug` and `version`. `zipPackage()` builds the same ZIP from a script, with `getPackageFiles()` for the directory and the files of a package.

To embed a signed manifest with a stable filename, use:

```bash
wp-release zip dist --checksums-file checksums.json --embed-checksums --sign-checksums
```

See [Checksums](checksums.md) for filenames, placement, formats and configuration.
