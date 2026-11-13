# Check versions before you release

Stop a release when the plugin header, readme Stable tag, PHP constants and git tag disagree.

`version-check` compares the versions that have to agree before a release. WordPress.org shows the readme `Stable tag`, installs read the `Version` header, and a mismatch ships the wrong version.

```sh
npx @wpelevator/wp-release version-check
```

```text
Error: Stable tag in readme.txt is 1.4.1, expected 1.4.2.
```

The command exits with `2`, so it stops a CI job. After fixing the readme:

```text
All versions match 1.4.2.
```

Name the PHP constants that hold the version too:

```sh
npx @wpelevator/wp-release version-check --constant MY_PLUGIN_VERSION
```

```text
All versions match 1.4.2.
```

In GitHub Actions, each mismatch is also an annotation on the file and line of the version: see [annotations and job summaries](github-actions.md#annotations-and-job-summaries).

## What it checks

`version-check` compares the versions that have to agree before a release, and reports every mismatch with exit code `2`:

```bash
wp-release version-check --constant MY_PLUGIN_VERSION --git-tag v1.2.0
```

- The expected version is `--version`, or the `Version` header.
- The readme `Stable tag` must match for plugins; `--no-stable-tag` skips it, and themes have no Stable tag.
- `--constant NAME` (repeatable) checks `define( 'NAME', '1.2.0' )` or `const NAME = '1.2.0'` in every PHP file outside `vendor/`, `node_modules/` and dot directories. A constant that isn't defined is a mismatch.
- `--git-tag` defaults to `GITHUB_REF` when it's a tag. `--git-tag-format` (default `{version}`) can have a prefix or the slug, like `v{version}` or `{slug}-{version}`; a leading `v` in the version is ignored, like for SVN tags.
