# Deploy configured packages

Deploy the packages of a monorepo to the Git repositories and WordPress.org plugins that the config names, from a release tag or a branch.

`deploy git --release-ref <ref>` and `deploy svn --release-ref <ref>` deploy the packages of a monorepo, or of a single-package repository, to the targets in the `deploy` config of their package groups. The ref decides what ships: a release tag deploys that package and version, and a branch deploys every package with a target for that branch. In GitHub Actions, `$GITHUB_REF` is the pushed ref, so one job can run `deploy git --release-ref "$GITHUB_REF"`.

`deploy git --release-ref <ref>` and `deploy svn --release-ref <ref>` deploy the packages of a monorepo, or of a single-package repository, to the targets in the `deploy` config of their package groups, like the release repository of each package or its WordPress.org plugin. The ref decides what's deployed: a release tag of a package, like `refs/tags/plugins/alpha/1.2.0` read with the `tagFormat`, deploys that package and version, and a branch, like `refs/heads/main`, deploys every package with a target for that branch. A name without `refs/` is a release tag when it matches the tag format of a package, otherwise a branch, and in GitHub Actions `$GITHUB_REF` is the pushed ref.

## Configure targets

```js
packages: [
	{
		glob: 'plugins/*',
		version: { from: wordpressPluginVersion(), to: [ wordpressPluginVersion(), wordpressStableTag() ] },
		// Files that the deploys ship, instead of each package's .distignore.
		files: { distignore: false, exclude: [ '.*', 'node_modules/', '/tests/' ] },
		deploy: {
			git: [
				// The release repository of each plugin, with its history.
				{ repository: ( { package: pkg } ) => `https://github.com/me/${ pkg.path.split( '/' ).pop() }.git`, message: 'Release {path} {ref} from {revision}' },
				// A mirror that only gets release tags, named v1.2.0.
				{ repository: ( { package: pkg } ) => `https://gitlab.com/me/${ pkg.path }.git`, branches: false, tag: 'v{version}' },
			],
			svn: { slug: ( { package: pkg } ) => `me-${ pkg.path.split( '/' ).pop() }`, assetsDir: '.wordpress-org' },
		},
	},
	// A package that isn't versioned, like a Docker image, only deploys branches.
	{ glob: 'docker/php-fpm', deploy: { git: { repository: 'https://github.com/me/php-fpm.git' } } },
],
```

## Choose a mode

| Mode | Command | Use |
|---|---|---|
| All | `deploy git --release-ref <ref>` | Deploy every package of the ref to each of its targets, one at a time, in one log group for each package. A failed deploy doesn't stop the others, and the command exits with `1` at the end. |
| One package | `deploy git --release-ref <ref> --package <name>` | Deploy only that package (repeatable), by identifier or path, for example to retry a failed one or in a CI job for each package with its own credentials. |
| Plan | `deploy git --release-ref <ref> --list` | List the deploys without running them, with each package, its version or branch and the targets with the tag or branch they get. With `--json` or `--github-output` the result is `{ packages: [ … ] }`, for a CI matrix with `include: ${{ fromJSON( steps.plan.outputs.result ).packages }}`. |
| Single directory | `deploy git <dir> --git-url <url> [options]` | Deploy one directory without a config, as described above. |

`deploy svn` has the same modes. `--release-ref` can't be combined with the options of a single target, like `--git-url`, `--tag` or `--svn-tag`, which come from the config.

## Target options

- **Git targets** take a `repository` and release both branches and tags by default. `branches` limits the branches, like `[ 'main' ]`, or turns them off with `false`, and `tag` is the tag template in the repository, `{version}` by default, or `false` to not release tags. A release tag is created on top of the default branch of the repository, and a branch is released to the same branch. `history: false` uses the source commit instead of the package history, and `message` sets the release commit message, `Release {ref} from {revision}` by default.
- **SVN targets** only deploy release tags: a stable release syncs `trunk/`, creates its tag and syncs the `assetsDir`, and a pre-release only creates its tag. `slug`, the WordPress.org plugin slug, defaults to the name of the package directory, `url` to the WordPress.org plugin repository, and `message` sets the commit message. Credentials come from `SVN_USERNAME` and `SVN_PASSWORD`, or `--svn-username`.
- **Several targets**: `git` and `svn` each take one target or a list, like a release repository and a mirror on another host. Each target is a separate deploy.
- **Credentials**: a GitHub repository URL needs no token in it, since `GITHUB_TOKEN` is sent as an authorization header (see above). A callback can still add credentials for other hosts.
- **Templates and callbacks**: `repository`, `slug` and `message` are templates with `{name}` and `{path}`, like the `tagFormat`, and `{version}`, `{branch}`, `{ref}` (the tag or branch that the deploy writes in the target) and `{revision}` (the source commit), or callbacks that receive `{ package, version, branch, ref, revision }`, where `package` has the `name`, `directory`, `path` and `type`. A callback can name a target after the package directory, choose another host for some packages, read the environment, or return nothing to skip the target for that package or ref; an empty `message` uses the default one. Credentials in URLs are never printed or listed.
- **Results**: with `--json` or `--github-output`, the result lists each deploy in `deploys` with its `package`, `label`, `target` (the repository or WordPress.org plugin, with credentials redacted), `targetRef` (the tag or branch written there), `version` or `branch`, and its `result` or `error`. A remote target repository also has its `targetHost`, like `github.com`, and `targetPath`, like `me/my-plugin`, without credentials, for a workflow step that calls the API of the forge that hosts it, such as to create the release of the deployed tag. The targets of `--list` have the same `host` and `path`, and `parseRepositoryUrl()` reads them from an HTTP(S), SSH or scp-like URL. `wp-release` doesn't call forge APIs itself.
- **Packages without a version**: a package entry without `version`, like a single directory with a `glob` of its path, isn't released with changesets, so changes to it don't need one, and it only deploys branches, since it has no release tags.
- **Files**: `files.exclude` adds gitignore-style patterns relative to the package directory, and `files.distignore` sets the ignore file relative to it or turns it off with `false`. A `files` at the root of the config applies to every package group, for the rules that all packages share, and the `files` of a group add their patterns after it and can replace its ignore file. Without `files`, each package's `.distignore` applies, like for `zip`; there's no repository-wide `.distignore`, since each one is relative to its package. `zip --package <name>` zips a package with the same files, `getPackageFiles()` returns the directory and the file selection of any configured package, and `getDeployPackages()` lists the packages with deploy targets and their file selection.

## Build before you deploy

A deploy releases the files of the working tree, so build the packages first. One job that builds once and runs `deploy git --release-ref "$GITHUB_REF"` is the simplest setup, also for a branch that releases every package. A matrix with a job for each package from `--list` would build every package in every job, so build once and pass the built tree to the jobs as an artifact if you need one, for example for separate credentials.

Other monorepo tools split the same way with less of the release in the config: [Symplify MonorepoBuilder](https://github.com/symplify/monorepo-builder) and [`danharrin/monorepo-split-github-action`](https://github.com/danharrin/monorepo-split-github-action) push the source history of each package directory, with the packages and repositories listed in the workflow or a matrix, while `deploy git` releases the built files on top of that history, so `vendor/` and `build/` reach Composer and WordPress installs. Like the publishers of [GoReleaser](https://goreleaser.com/), targets are lists with templates, and pre-releases skip the targets where they would replace the stable version.
