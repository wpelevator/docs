# wp-release

Build, verify, version and deploy WordPress plugin and theme releases from one CLI, a library or GitHub Actions.

Releasing a WordPress plugin means a ZIP with the right root folder, the same version in several places, a changelog and, for WordPress.org, an SVN commit. `wp-release` does each of them with one command.

```sh
npx @wpelevator/wp-release zip
npx @wpelevator/wp-release version-check
npx @wpelevator/wp-release verify --zip my-plugin.1.4.2.zip --checksums my-plugin.1.4.2.checksums.json
```

```text
/home/me/my-plugin/my-plugin.1.4.2.zip
All versions match 1.4.2.
4 files match, 0 changed, 0 missing and 0 extra.
```

That is the output for a plugin whose readme `Stable tag` matches its `Version` header, and a checksums manifest built with `zip --checksums`. The [quickstart](quickstart.md) runs each step and shows what a mismatch looks like.

No config file is needed to start. [Try it on your plugin in a minute](quickstart.md).

## What you get

- **A ZIP that WordPress.org accepts.** It has the `{slug}/` root folder, leaves out what `.distignore` lists, and the same files give the same ZIP. It is built in Node.js, with no `zip` binary. [Build a release ZIP](build-a-zip.md).
- **Version mismatches caught before release.** `version-check` compares the `Version` header with the readme `Stable tag`, and with PHP constants and the git tag when you ask. [Check versions](version-check.md).
- **Proof that a release wasn't tampered with.** Checksums list every file, and `verify` names each file that was added or changed. Ed25519, minisign and SSH signatures cover the ZIP and the manifest. [Verify](verify.md) and [sign](signing.md).
- **Releases from pull requests.** Changesets turn notes in each pull request into version bumps, changelogs and tags, for one plugin or a monorepo. [Release from GitHub Actions](release-workflow.md).
- **One-command deploys.** [Deploy to WordPress.org](deploy-svn.md) or to a [Git repository](deploy-git.md), with `--dry-run` to see the changes first.
- **Translations.** [Extract a POT file](internationalization.md) and [compile PO files](compile-translations.md) to MO, JSON and PHP.

## Pick your path

| I want to | Start here |
|---|---|
| Build a release ZIP and check it | [Quickstart](quickstart.md) |
| Automate versions, changelogs and tags | [Release from GitHub Actions](release-workflow.md) |
| Publish to WordPress.org | [Deploy to WordPress.org](deploy-svn.md) |
| Prove a release is unchanged | [Build, verify and sign](packaging.md) |
| Release many packages from one repository | [Release a monorepo](monorepo-releases.md) |
| Run commands in a workflow | [Use it in GitHub Actions](github-actions.md) |
| Call it from Node.js | [Library API](library.md) |

WordPress.org themes are released by uploading a ZIP, so `deploy svn` is for plugins only. Use [`zip`](build-a-zip.md) to build a theme upload.

Projects without Node.js can use [PHP Changesets](../../../php/php-changesets/docs/index.md) (`wpelevator/php-changesets`), which runs the same changeset workflow with PHP and Git alone.

## Install

Run commands with `npx` as above, or add the package to your project:

```bash
npm install --save-dev @wpelevator/wp-release
```

Node.js 22.12 or later is required. SVN deployments also need the `svn` command line client. Git deployments and changeset commands need Git.

The package is an ES module with TypeScript declarations. CommonJS projects can load it with `require( '@wpelevator/wp-release' )` on Node.js 22.12 or later.

Zero-install examples in these docs use `npx @wpelevator/wp-release`, because `npx wp-release` alone runs an unrelated npm package until this one is installed. After `npm install`, `npx wp-release` and `wp-release` in npm scripts are the same command.

## Reference

- [CLI reference](cli.md)
- [Use it in GitHub Actions](github-actions.md)
- [Configuration](configuration.md)
- [Names across the CLI, Actions and library](naming.md)
- [Library API](library.md)
- [Development and architecture](development.md)
- [Comparison with existing tools](comparison.md)
