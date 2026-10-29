# Deployment (/js/wp-release/latest/deployment)

### Deploy to SVN [#deploy-to-svn]

The [`wp-release-deploy-svn`](https://github.com/wpelevator/wp-release-deploy-svn) GitHub Action runs this command.

`deploy-svn` syncs a plugin to the WordPress.org plugin SVN repository. Each SVN write is a separate flag and nothing is written unless requested. All writes go into one commit.

| Flag | Default | Writes |
|---|---|---|
| `--trunk` | off | Sync the full source directory to `trunk/` |
| `--readme-only` | off | Sync only the readme to `trunk/`, for updates between releases such as bumping `Tested up to`. Can't be combined with `--svn-tag`. |
| `--svn-tag <version>` | off | Create `tags/<version>`. With `--trunk`, the tag is a copy of the synced `trunk/`. Without it, the tag is built directly from the source files and `trunk/` is left alone, for pre-release tags. A leading `v` is stripped, so `v1.2.0` creates `tags/1.2.0`. |
| `--assets-dir <dir>` | not set | Sync this directory with banners, icons and screenshots to the SVN `assets/` directory. There's no default directory, so assets are only deployed when this is set, and it must exist. |
| `--no-assets` | | Skip the `--assets-dir` sync for one run, for example when a config always passes `--assets-dir`. |

Typical runs:

```bash
# Deploy 1.2.0 to trunk and the tag, and update the assets
wp-release deploy-svn dist --trunk --svn-tag 1.2.0 --assets-dir .wordpress-org

# Tag a pre-release build without touching trunk
wp-release deploy-svn dist --svn-tag 1.2.0-rc.1

# Update only the readme between releases
wp-release deploy-svn dist --readme-only

# Update only the assets
wp-release deploy-svn --assets-dir .wordpress-org

# Deploy exactly the files of a ZIP built earlier
wp-release deploy-svn --from-zip my-plugin.1.2.0.zip --trunk --svn-tag 1.2.0
```

How a deploy works:

1. The options are validated, including the slug, version and readme name, before they're used in URLs or paths.
2. With `--trunk` or `--svn-tag`, the files must be a plugin whose `Version` header matches the version. When `--trunk` and `--svn-tag` are combined, the readme `Stable tag` must match too; a tag-only run skips that, since a pre-release tag doesn't change the stable tag. `--readme-only` needs the readme. Nothing is checked out when a check fails.
3. The repository is checked out sparsely into a new temporary directory, with only the directories that the flags write to. A missing `assets/` (or `trunk/`, `tags/`) directory is created. The deploy stops when `tags/<version>` exists, unless `--force` replaces it.
4. The files are synced in Node.js, without `rsync`: new and changed files are copied, files that are no longer selected are deleted, and `svn add` and `svn delete` stage them, including files that svn ignores by default. With `--trunk`, `trunk/` is then copied to the tag with `svn copy`. Without it, the same selected files are synced into `tags/<version>` instead, and with `--force` an existing tag is updated to match, deleting files that are no longer in the build.
5. Asset images get `svn:mime-type` set for PNG, JPEG, GIF and SVG, the formats that WordPress.org documents for plugin assets. Other formats keep the type that svn assigns.
6. When `svn status` is empty, the deploy ends without a commit. A dry run logs the status and stops before the commit. Otherwise the changes are committed, and the temporary directory is always removed.

`--from-zip` reads the files from a ZIP instead of `<source-dir>`. The ZIP is checked before it's extracted: entries with absolute paths, `..` segments or symbolic links, and entries outside a single `{slug}/` root folder, are rejected.

Credentials are only needed for the commit, not for dry runs, no-op runs or `file://` repositories. Pass the username with `--svn-username` or `SVN_USERNAME` and the password in `SVN_PASSWORD`. svn always runs non-interactively without caching credentials, and the password is passed on the standard input with `--password-from-stdin`, never on the command line or in the logs.

Validation:

- `--readme-only` can't be combined with `--svn-tag`, since a tag is a release snapshot that a readme update never changes.
- `--version` defaults to `--svn-tag`, then the `Version` header of the deployed files; when `--version` and `--svn-tag` are both set they must match.
- Pre-release versions like `1.0.0-rc.1` can be tagged, but syncing one to `trunk/` warns, since trunk is for the development version.
- `--trunk` without `--svn-tag` works but warns, to remind you that updating trunk alone doesn't create a version tag for stable downloads.
- A version mismatch throws a `VersionMismatchError`, a `ValidationError` with the `mismatches` and a problem for each, with its file and line. See [Logging](library.md#logging).

### Deploy to Git [#deploy-to-git]

`deploy-git` deploys the selected files of a plugin, theme or package to a Git repository, like a distribution repository that ships the built files and `vendor/` for Composer installs or GitHub-hosted updates, or the release repository of a monorepo package. It selects files like `zip`, with `.distignore` and `--exclude`, so built files that git ignores in the source repository, like `build/` or `vendor/`, are released too. The source directory must be inside a Git repository, which provides the source history and stores the release objects before they're pushed.

| Flag | Default | Writes |
|---|---|---|
| `--branch <name>` | off | Push the release to this branch |
| `--tag <name>` | off | Create this tag for the release |

```bash
# Release a build to a distribution repository and tag it
wp-release deploy-git build --git-url git@github.com:me/my-plugin-dist.git --branch main --tag 1.2.0

# Release a monorepo package with its own history
wp-release deploy-git packages/my-plugin --split-prefix packages/my-plugin --git-url … --branch main
```

How a deploy works:

1. The selected files are written to the object database of the source repository and become a tree, with a temporary index, so the working tree and the index of the repository are left alone. Executable files stay executable.
2. The previous release is fetched: the tip of `--branch`, or for a tag-only deploy the tip of the repository's default branch (its `HEAD`), whatever that branch holds. Release a tag together with `--branch` to choose the branch it builds on.
3. When the files are the same as in the previous release, that release is reused. Otherwise a release commit is created with the files, whose parents are the previous release and the source history: the source commit (`--source-ref`, default `HEAD`), or with `--split-prefix` the history of that directory from `git subtree split`. The repository keeps the source history, and `git log --first-parent` lists the releases.
4. When the previous release on `--branch` already has newer source history, the branch isn't moved, so running an older build again, like a re-run of an earlier CI job, can't release older files. The source history is outdated when it's an older commit of the source history that the previous release was made from, its last parent. `git subtree split` makes this reliable for `--split-prefix` too, since it creates the same commits for the same history. A revert is a new commit, so it's released, and with `--tag` the tag of an older build is still released, without moving the branch.
5. The tag is checked in the repository first. A tag that already has the same files is the release: it's reused and nothing is pushed, so running a tag release again is a no-op. A tag with other files fails with exit code `2` before anything is pushed.
6. The release is pushed to the branch, unless it didn't change or is outdated, and to the tag, in one atomic push. Pushes are never forced, so the branch only moves forward and a tag is never replaced, also when it was created in the meantime.

To release a tag again, for example after a release with the wrong files, delete the tag in the repository (`git push <url> :refs/tags/<tag>`) and run the deploy again. There's no flag for replacing a tag, since installs, Composer and GitHub Actions pins trust that a published tag doesn't change.

`--dry-run` runs everything except the push. `--message` sets the commit message, which defaults to `Release <tag or branch> from <source commit>`. Credentials come from git, like a credential helper or an SSH key, and credentials in URLs are never printed. For an HTTPS repository on `github.com`, or on the host of `GITHUB_SERVER_URL` like GitHub Enterprise Server, the `GITHUB_TOKEN` environment variable is sent as an authorization header, like `actions/checkout` does, so the token stays out of the URL, the git arguments and the repository config, and it replaces the header that `actions/checkout` persists. Pass `token` to `resolveGitDeployOptions()` for another HTTPS host. The commit needs a git identity (`user.name` and `user.email`).

### Deploy configured packages [#deploy-configured-packages]

`deploy-git --release-ref <ref>` and `deploy-svn --release-ref <ref>` deploy the packages of a monorepo, or of a single-package repository, to the targets in the `deploy` config of their package groups, like the release repository of each package or its WordPress.org plugin. The ref decides what's deployed: a release tag of a package, like `refs/tags/plugins/alpha/1.2.0` read with the `tagFormat`, deploys that package and version, and a branch, like `refs/heads/main`, deploys every package with a target for that branch. A name without `refs/` is a release tag when it matches the tag format of a package, otherwise a branch, and in GitHub Actions `$GITHUB_REF` is the pushed ref.

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

| Mode | Command | Use |
|---|---|---|
| All | `deploy-git --release-ref <ref>` | Deploy every package of the ref to each of its targets, one at a time, in one log group for each package. A failed deploy doesn't stop the others, and the command exits with `1` at the end. |
| One package | `deploy-git --release-ref <ref> --package <name>` | Deploy only that package (repeatable), by identifier or path, for example to retry a failed one or in a CI job for each package with its own credentials. |
| Plan | `deploy-git --release-ref <ref> --list` | List the deploys without running them, with each package, its version or branch and the targets with the tag or branch they get. With `--json` or `--github-output` the result is `{ packages: [ … ] }`, for a CI matrix with `include: ${{ fromJSON( steps.plan.outputs.result ).packages }}`. |
| Single directory | `deploy-git <dir> --git-url <url> [options]` | Deploy one directory without a config, as described above. |

`deploy-svn` has the same modes. `--release-ref` can't be combined with the options of a single target, like `--git-url`, `--tag` or `--svn-tag`, which come from the config.

- **Git targets** take a `repository` and release both branches and tags by default. `branches` limits the branches, like `[ 'main' ]`, or turns them off with `false`, and `tag` is the tag template in the repository, `{version}` by default, or `false` to not release tags. A release tag is created on top of the default branch of the repository, and a branch is released to the same branch. `history: false` uses the source commit instead of the package history from `git subtree split`, and `message` sets the release commit message, `Release {ref} from {revision}` by default.
- **SVN targets** only deploy release tags: a stable release syncs `trunk/`, creates its tag and syncs the `assetsDir`, and a pre-release only creates its tag. `slug`, the WordPress.org plugin slug, defaults to the name of the package directory, `url` to the WordPress.org plugin repository, and `message` sets the commit message. Credentials come from `SVN_USERNAME` and `SVN_PASSWORD`, or `--svn-username`.
- **Several targets**: `git` and `svn` each take one target or a list, like a release repository and a mirror on another host. Each target is a separate deploy.
- **Credentials**: a GitHub repository URL needs no token in it, since `GITHUB_TOKEN` is sent as an authorization header (see above). A callback can still add credentials for other hosts.
- **Templates and callbacks**: `repository`, `slug` and `message` are templates with `{name}` and `{path}`, like the `tagFormat`, and `{version}`, `{branch}`, `{ref}` (the tag or branch that the deploy writes in the target) and `{revision}` (the source commit), or callbacks that receive `{ package, version, branch, ref, revision }`, where `package` has the `name`, `directory`, `path` and `type`. A callback can name a target after the package directory, choose another host for some packages, read the environment, or return nothing to skip the target for that package or ref; an empty `message` uses the default one. Credentials in URLs are never printed or listed.
- **Results**: with `--json` or `--github-output`, the result lists each deploy in `deploys` with its `package`, `label`, `target` (the repository or WordPress.org plugin, with credentials redacted), `targetRef` (the tag or branch written there), `version` or `branch`, and its `result` or `error`. A remote target repository also has its `targetHost`, like `github.com`, and `targetPath`, like `me/my-plugin`, without credentials, for a workflow step that calls the API of the forge that hosts it, such as to create the release of the deployed tag. The targets of `--list` have the same `host` and `path`, and `parseRepositoryUrl()` reads them from an HTTP(S), SSH or scp-like URL. `wp-release` doesn't call forge APIs itself.
- **Packages without a version**: a package entry without `version`, like a single directory with a `glob` of its path, isn't released with changesets, so changes to it don't need one, and it only deploys branches, since it has no release tags.
- **Files**: `files.exclude` adds gitignore-style patterns relative to the package directory, and `files.distignore` sets the ignore file relative to it or turns it off with `false`. A `files` at the root of the config applies to every package group, for the rules that all packages share, and the `files` of a group add their patterns after it and can replace its ignore file. Without `files`, each package's `.distignore` applies, like for `zip`; there's no repository-wide `.distignore`, since each one is relative to its package. `zip --package <name>` zips a package with the same files, `getPackageFiles()` returns the directory and the file selection of any configured package, and `getDeployPackages()` lists the packages with deploy targets and their file selection.

A deploy releases the files of the working tree, so build the packages first. One job that builds once and runs `deploy-git --release-ref "$GITHUB_REF"` is the simplest setup, also for a branch that releases every package. A matrix with a job for each package from `--list` would build every package in every job, so build once and pass the built tree to the jobs as an artifact if you need one, for example for separate credentials.

Other monorepo tools split the same way with less of the release in the config: [splitsh-lite](https://github.com/splitsh/lite), [Symplify MonorepoBuilder](https://github.com/symplify/monorepo-builder) and [`danharrin/monorepo-split-github-action`](https://github.com/danharrin/monorepo-split-github-action) push the source history of each package directory, with the packages and repositories listed in the workflow or a matrix, while `deploy-git` releases the built files on top of that history, so `vendor/` and `build/` reach Composer and WordPress installs. Like the publishers of [GoReleaser](https://goreleaser.com/), targets are lists with templates, and pre-releases skip the targets where they would replace the stable version.
