# Release a monorepo

Configure packages, tags, dependents and separate release pull requests for repositories with several plugins, themes or libraries.

A monorepo needs a config file, `wp-release.config.mjs`, that describes its packages. This one finds every directory under `js/`, `plugins/` and `php/` and says where each package keeps its version:

```js
import { composerJsonVersion, defineConfig, gitTagVersion, packageJsonVersion, wordpressPluginVersion, wordpressStableTag } from '@wpelevator/wp-release';

export default defineConfig( {
	baseBranch: 'main',
	changesets: '.changeset',
	readmeChangelog: true,
	changelogInsertAfter: '<!-- changelog -->',
	root: 'packages',
	tagFormat: '{path}/{version}',
	packages: [
		{ glob: 'js/*', idFrom: 'package.json#name', version: { from: packageJsonVersion(), to: [ packageJsonVersion() ] } },
		{ glob: 'plugins/*', idFrom: 'package.json#name', version: { from: wordpressPluginVersion(), to: [ wordpressPluginVersion(), wordpressStableTag( { ifPresent: true } ), composerJsonVersion( { ifPresent: true } ) ] } },
		{ glob: 'php/*', idFrom: 'composer.json#name', version: { from: gitTagVersion( { pattern: '{path}/{version}' } ), to: [] } },
	],
} );
```

`version.from` selects the current version; `version.to` lists release targets. Use `phpConstantVersion( { file, constant } )` to sync a PHP constant.

Every changeset command reads it. `changeset status` lists a release for each package that has a changeset, and `changeset tag` creates a tag for each, like `plugins/alpha/1.2.0`. The [release workflow](release-workflow.md) shows how the commands run in CI, and this repository's own `Prepare Release` and `Tag Release` workflows release all of its packages in one pull request.

## Packages and tags

The config describes the repository, so wp-release assumes no directory structure or naming convention of its own:

- **Packages** are the directories that the `glob` of a `packages` entry matches under `root`, with `*`, `?` and `**`, like `plugins/*`, or `.` for a repository with one package at its root. The settings of an entry apply to each of its packages. Discovery never looks inside `.git`, `node_modules`, `vendor` or `dist` directories. A package is identified by its path, or with `idFrom` by the name in its `package.json` or `composer.json`, or with a literal `id` when the group matches exactly one package, and commands that take a package accept a path or identifier.
- **Templates** name the tags and the deploy targets of a package with these placeholders:

  | Placeholder | Value | `plugins/alpha` | Root package |
  |---|---|---|---|
  | `{path}` | Package directory relative to `root`, empty for a package at the root | `plugins/alpha` | (empty) |
  | `{name}` | Package identifier | `plugins/alpha`, or its manifest name with `idFrom` | the manifest name, or the directory name |
  | `{version}` | Released version | `1.2.0` | `1.2.0` |

  Deploy templates also have `{branch}`, `{ref}` and `{revision}` (see [Deploy configured packages](deploy-packages.md)), and any template can be a callback that receives the package, for names that the placeholders don't cover, like the last directory of the path.
- **`tagFormat`** names the release tags, `{path}/{version}` by default, like `plugins/alpha/1.2.0`. Empty placeholders leave no leading or repeated slashes in a tag, so a package at the root gets plain version tags, like `1.2.0`, from the same default. Deploy templates, like repository URLs, are filled in as they are. A `gitTagVersion()` version source reads the tags with its own `pattern`, also `{path}/{version}` by default, so set both when you change the format.
- **`releaseTitle`** titles the release, like the `title` that `changeset tag` reports for creating a GitHub Release. The default is `name@version`, like `plugins/alpha@1.2.0`, without the prefix for a package at the repository root, which is titled `1.2.0` like its tag. Like `tagFormat`, it supports `{name}`, `{path}`, `{version}` and `{tag}` placeholders: `releaseTitle: '{version} (beta)'`, or a callback that receives `{ package, version, tag }` like the release notes callback. A template without a placeholder fails at load time, since it would name every release alike. `changeset tag --release-title <template>` replaces the `releaseTitle` of the config for one command, like `--tag-format` replaces `tagFormat`.
- **`--tag-format <format>`** replaces the `tagFormat` of the config for one command, for a workflow or job that names its tags differently, like `--tag-format '{name}@{version}'`. Every command that creates or reads the same tags needs the same format: `changeset tag`, which creates them and finds the previous tag for the release notes, `changeset version --prerelease`, which numbers pre-releases from them, and `deploy git` and `deploy svn --release-ref`, which read the package and version of a tag.
- **Slugs** are a WordPress concept: the folder of a plugin or theme. Only the commands that produce something for WordPress use one: the `{slug}/` root folder and name of a `zip`, the `checksums` manifest, the WordPress.org slug of `deploy svn`, and `version-check`. Each takes `--slug`, which defaults to the name of the working directory, or of the package directory with `zip --package`, and an SVN deploy target takes `slug`, which defaults to the name of the package directory. Tags and Git deploy targets don't have a slug.
- **`remote`** is the git remote that `changeset tag --push` pushes tags to and that the base branch is compared on, `origin` by default.

The default strategy bumps stable `x.y.z` versions with SemVer rules, and the `x.y` and `x.y.z.w` versions common in WordPress plugins the same way: the bumped part is raised, the parts after it reset to `0`, and the version keeps its number of parts. A minor bump of `2.1` is `2.2` and a major bump is `3.0`, while a patch bump adds the third part, `2.1.1`. A patch bump of `1.2.3.4` is `1.2.4.0`, so raising only the fourth part needs a custom strategy. Configure `nextVersion( { package, bump, currentVersion, changesets } )` for other formats; changeset bumps remain `patch`, `minor` or `major`. Pre-releases are added to the next version with `--prerelease`, described below.

Without `--since`, `changeset status` compares against `<remote>/<baseBranch>`, where `remote` in the config defaults to `origin` and is also the remote that `changeset tag --push` pushes tags to; fetch that ref or pass `--since` when using a fork or different upstream. `loadChangesetConfig()` discovers a conventional config at the repository root, unless `--config <path>` selects one explicitly.

## Release packages separately

To release packages separately, for example with a release pull request for each, pass `--package <name>`, repeatable, to version only those packages. A changeset that also names other packages keeps only their entries and its summary, so it still applies to their releases with the same bump. Changesets without packages are left for a run without `--package`.

## Re-release packages that bundle a package

Configure `dependents` to re-release packages that bundle a package when it releases. The dependents come from what the packages declare: a package is a dependent of a source when the spec that it declares in its npm `dependencies` or `optionalDependencies` (or the sections that the policy adds) resolves the current version of the source or points at the workspace, and it re-releases when the next version of the source falls outside the declared range, or always with `when: 'always'`. A pin to an older version selects a registry release instead and `changeset status` warns about the drift until the pin resolves the package again. Versioning a dependent rewrites its declared specs of the source to the released version, keeping their range prefixes, so an exact pin matches the released workspace again and the built bundle matches the changelog. Wildcards and unpinned ranges accept the release without one, like the `devDependencies` of a package. The derived dependents appear in `changeset status`, `changeset version` and `changeset tag` like any other release, and a dependent that releases for its own reasons keeps its own bump and appends the bundle note:

```js
dependents: {
	bump: 'patch', // Default
	exclude: [ 'actions/wp-release-sign' ], // Package paths under root, or globs over them
},
```

Excluded packages still release with their own changesets and stay out of the automatic re-releases.

When the changesets of a pull request release a source, `changeset status` requires no changeset for a dependent whose only change is the spec of that source in its `package.json`, since versioning rewrites the spec and the bundle note announces it. Any other change to the dependent, like another manifest field or dependency, documentation or code, needs its own changeset.

The bundle changelog entry defaults to `Bundle <source> <version>.` and is formatted with `dependents.changelog( { package, source } )`:

```js
dependents: {
	changelog: ( { source } ) => `Bundle ${ source.package.name } ${ source.version }.`,
},
```

`dependents.sections` lists the npm dependency sections that declare a source, defaulting to `dependencies` and `optionalDependencies`; add `devDependencies` for dependencies that end up in the dependent's build, or `peerDependencies` to scan them.

The `dependents.dependency` hooks extend the built-in npm scan instead of replacing it, so that both work behind the same range rule and rewrite:

```js
dependents: {
	dependency: {
		// Specs that declare the source outside package.json, like a Composer
		// require in a vendor-isolated directory.
		find: async ( { package: dependent, source } ) => {
			return [ { file: 'vendor-isolated/composer.json', name: '…', spec: '^0.3' } ];
		},
		// Update the declaration to the released version. Call `remember( file )`
		// before writing a file, so failed versioning rolls it back.
		update: async ( { package: dependent, source, specs, version, remember } ) => { /* … */ },
	},
},
```

After versioning, run `npm install --package-lock-only` so that the root lockfile resolves the rewritten pins to the workspace links again; the `Prepare Release` workflow (`prepare-release.yml` in this monorepo) does it with its release pull request.

## Run locally and in workflows

For local development, run the TypeScript source with `npm run wp-release -- <command>` (for example, `npm run wp-release -- changeset status --since origin/main`). GitHub workflows use the same CLI for versioning and tagging. `SUBTREE_DEPLOY_TOKEN` lets them update the release PR and push tags, and the `Tag Release` workflow passes it to `softprops/action-gh-release` to create the GitHub Releases.
