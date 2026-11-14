# Changelog

What changed in each release.

## 0.21.0 (2026-11-11)

- Group the wp-release commands as `changeset add|status|version|tag`, `deploy svn|git` and `i18n pot|audit|mo|json|php`, and run `changeset add` for a bare `wp-release changeset`, so that a `"changeset": "wp-release changeset"` script runs `npm run changeset`. The dashed names like `changeset-add` keep working as aliases, and `execute()` and `CommandResults` use the grouped names. ([`0bb0b18`](https://github.com/wpelevator/basement/commit/0bb0b187cc93d3dd1ea9378764e00ef0a7a32f87))
- Document complete release workflows for single-package repositories, with the `--github-output` result shapes of `changeset version` and `changeset tag`, the push-triggered `changeset tag --since HEAD^1` idiom and the distribution setups that decide what a release tag must contain. ([`0bb0b18`](https://github.com/wpelevator/basement/commit/0bb0b187cc93d3dd1ea9378764e00ef0a7a32f87))
- Bundle subtree-split 0.2.2.
- Bundle wp-gettext 0.2.1.

## 0.20.2 (2026-11-07)

- Publish the `docs/` directory in the npm package, so that agents and editors can read the documentation of the installed version. ([`da8652c`](https://github.com/wpelevator/basement/commit/da8652c9da98ef8962c0f7dce9c398bb814c8620))
- Bundle subtree-split 0.2.1.

## 0.20.1 (2026-11-04)

- Bundle subtree-split 0.2.0.

## 0.20.0 (2026-11-03)

- Split the history of a package for `deploy-git --split-prefix` with `@wpelevator/subtree-split` instead of running `git subtree split`, which makes the same commits in about a tenth of a second instead of several seconds for each package. The full history is needed, so a shallow clone fails. ([`1498645`](https://github.com/wpelevator/basement/commit/1498645ea54ddecbb8bdd4b76ea8b8d9cc9cc91e))
- Bundle subtree-split 0.1.0.

## 0.19.0 (2026-10-31)

- Choose how POT entries name their source with `--add-location <full|file|never>` and `--no-location`, or `location` in the i18n configuration. `file` writes `#: path/to/file.php` without the line number, so that editing a source file does not change the POT unless its strings change. `--no-references` and `references: false` keep working and mean `never`. ([`9a7a89b`](https://github.com/wpelevator/basement/commit/9a7a89b6b7988818a0fa82ac9e7aa15ee2e816a2))
- Release the 0.18.2 changes to npm. The 0.18.2 publish failed because building wp-release needed the `dist/` of the workspace packages it depends on; it now type-checks their source instead. ([`621c656`](https://github.com/wpelevator/basement/commit/621c656a4678562c287521d165f805bee206e544))
- Bundle wp-gettext 0.2.0.

## 0.18.2 (2026-10-29)

- Use the new @wpelevator/fileset and @wpelevator/checksums packages for file selection, directory syncing and checksums manifests. The library API, CLI flags, output and manifest bytes are unchanged. Git `export-ignore` paths that contain glob characters like `*`, `?` or `[` are now matched literally instead of as patterns. ([`16bf135`](https://github.com/wpelevator/basement/commit/16bf135248f281d24e6ec41d6848e546e70dff9e))
- Use the new @wpelevator/wp-gettext package for string extraction, POT files and translation compilers. The library API, the `i18n-*` command flags and output and the generated POT, MO, JSON and `.l10n.php` bytes are unchanged. ([`16bf135`](https://github.com/wpelevator/basement/commit/16bf135248f281d24e6ec41d6848e546e70dff9e))
- Use the new @wpelevator/zip package for ZIP archives. The library API, the `zip` command flags and output are unchanged, except that `SOURCE_DATE_EPOCH` now sets the modification time of the archive entries when it's set. ([`16bf135`](https://github.com/wpelevator/basement/commit/16bf135248f281d24e6ec41d6848e546e70dff9e))
- Use the new @wpelevator/signatures package for signing. The library API, CLI flags and output, and the WP_RELEASE_SIGNING_KEY variable are unchanged. ([`16bf135`](https://github.com/wpelevator/basement/commit/16bf135248f281d24e6ec41d6848e546e70dff9e))
- Bundle checksums 0.1.0.
- Bundle fileset 0.1.0.
- Bundle signatures 0.1.0.
- Bundle wp-gettext 0.1.0.
- Bundle zip 0.1.0.

## 0.18.1 (2026-10-29)

- Expose configured package metadata and tag formatting for the documentation build. ([`033c5c2`](https://github.com/wpelevator/basement/commit/033c5c2e7ba1585f94de69e9af59f3dee11a78a0))

## 0.18.0 (2026-10-29)

- Explain a git-tag version source that finds no tags: name the pattern, an example tag, the checked-out history, and the tagFormat that names release tags. ([`a6f60dc`](https://github.com/wpelevator/basement/commit/a6f60dcca78ed83ea80d3569eec7317edf4c51b2))
- Add --project-name to name a config-free root package instead of using its manifest name or checkout directory, and an id config to name the package of a group with a literal identifier. ([`a6f60dc`](https://github.com/wpelevator/basement/commit/a6f60dcca78ed83ea80d3569eec7317edf4c51b2))
- Add changeset-tag --release-title to fill the release titles of one run, replacing the releaseTitle of the config. ([`a6f60dc`](https://github.com/wpelevator/basement/commit/a6f60dcca78ed83ea80d3569eec7317edf4c51b2))
- Add a releaseTitle config for release titles, a template or callback with the name, path, version and tag of a release. A package at the repository root is titled with its version like its tag, without a name or path prefix, and an empty path leaves no leading or repeated slashes. ([`a6f60dc`](https://github.com/wpelevator/basement/commit/a6f60dcca78ed83ea80d3569eec7317edf4c51b2))
- Release the sole package of a repository without --package options, with a single changeset-add --bump and with changeset-tag --version. ([`a6f60dc`](https://github.com/wpelevator/basement/commit/a6f60dcca78ed83ea80d3569eec7317edf4c51b2))
- Reject positional arguments that the command doesn't accept instead of ignoring them, so a stray word fails with the usage instead of running another command flow. ([`a6f60dc`](https://github.com/wpelevator/basement/commit/a6f60dcca78ed83ea80d3569eec7317edf4c51b2))

## 0.17.0 (2026-10-13)

- Add native WordPress POT extraction and auditing, with the POT layout of `wp i18n make-pot`, plus translated PO compilation into MO, script JSON and .l10n.php with reproducible atomic outputs. ([`6cd4598`](https://github.com/wpelevator/basement/commit/6cd4598fd6f44c04355ca5da027572b1fd15d86f))

## 0.16.0 (2026-10-13)

- Make ZIP and manifest signing independent: --sign signs only ZIPs, --sign-checksums generates and signs manifests for ZIPs and directory builds, and --sign-format requires an explicit signing target. Update the ZIP Action and release examples. ([`e515a53`](https://github.com/wpelevator/basement/commit/e515a537ddb1b08a5b5839e81eb492f47f55911e))
- Add a build command that copies selected release files into an output directory using the same ignore and configured package rules as ZIP packaging. ([`e515a53`](https://github.com/wpelevator/basement/commit/e515a537ddb1b08a5b5839e81eb492f47f55911e))
- Expose checksum filenames, formats, embedding and configured signing overrides in the release actions. Separate embedded metadata outputs from uploadable files and align action examples, verification and CI instructions with the coordinated release. ([`4b3e411`](https://github.com/wpelevator/basement/commit/4b3e41112cb4c432f322441c72e87af11dd6a779))
- Add independent checksum filenames, embedded signed manifests, GNU SHA256SUMS and custom manifest codecs with configuration and verification support. ([`fd95713`](https://github.com/wpelevator/basement/commit/fd95713c244d45965c0919bdd2f12da398818f84))
- Release single-project repositories without a config file, with shared changeset CLI options for version files, PHP constants, Git tag sources and changelog settings. ([`9c3d34b`](https://github.com/wpelevator/basement/commit/9c3d34b24e180f0b4056534c8b30e358b2e28a0b))

## 0.15.0 (2026-10-13)

- Add ZIP signing inputs and signature outputs, expose WordPress, minisign and SSH formats in the sign action, and update action documentation to match wp-release.
  
  Support configured SVN deployment with release-ref, package, list, config and tag-format inputs, preserve single-plugin deployment outputs, and expose configured plans and outcomes as JSON. Add the ZIP config input. Run the SVN action through the shared command with an injected runner that installs SVN only when needed. ([`ff25f51`](https://github.com/wpelevator/basement/commit/ff25f5188bcbfa03f98e8ce4dadf3324b79c1b84))
- Set each top-level string, number or boolean of a result as its own GitHub Actions step output with `--github-output`, next to the `result` JSON, so that a workflow reads values like `steps.<id>.outputs.zipPath` without `fromJSON()`, also in steps that are skipped. Add `zip --sign` to sign the ZIP and the checksums manifest as they're written, with `--sign-format` for the signature formats of `sign --format`, and `signFiles()` to sign files from a script.
  
  Validate the signing key, formats and existing signature destinations before writing a signed ZIP or manifest, so invalid signing inputs leave no new artifacts and can be corrected without forcing an overwrite. Include the signature files and public keys in the job summary of `zip --sign`. ([`afd7d94`](https://github.com/wpelevator/basement/commit/afd7d9470e70551cb81218da19d1729c54fc9fbd))

## 0.14.0 (2026-10-13)

- Report the `target`, `targetRef` and, for remote repositories, the `targetHost` and `targetPath` of each deploy in the `deploy-git` and `deploy-svn --release-ref` results, and the `host` and `path` of the targets of `--list`, so that a workflow can create the release of the deployed tag with the API of the forge that hosts the repository. `parseRepositoryUrl()` reads the host and path of a repository URL. ([`f8b330e`](https://github.com/wpelevator/basement/commit/f8b330e4d5c0a7c8dce8fd390d68f033121e4cf3))
- Make the config layer independent of the repository layout. Remove the `{type}` placeholder and the `tagType` package group setting, which guessed a type from the first directory of the package path, and the `{slug}` placeholder of the tag format, version source patterns and deploy templates; use `{path}`, like `{path}/{version}` for `plugins/alpha/1.2.0`, or a callback. A package at the repository root has an empty `{path}`, and tags have no leading or repeated slashes, so the default `{path}/{version}` tag format gives it tags like `1.2.0`. The WordPress.org slug of an SVN deploy target defaults to the name of the package directory. Add the global `--tag-format <format>` option to replace the `tagFormat` of the config for one command, and the `remote` setting for the git remote that `changeset-tag --push` pushes to and that the base branch is compared on, `origin` by default. ([`f8b330e`](https://github.com/wpelevator/basement/commit/f8b330e4d5c0a7c8dce8fd390d68f033121e4cf3))
- Sign files as minisign (`.minisig`) and SSH (`.sshsig`) signatures with `sign --format`, using the same Ed25519 key as the WordPress `.sig`. `verify --signature-format` checks the manifest signature of those formats, `verify --public-key` also accepts minisign and `ssh-ed25519` public keys, and `keygen` prints the public key in both forms. ([`7d641fd`](https://github.com/wpelevator/basement/commit/7d641fd19cd6d8f02f9305e4854dc16a0e4f438e))
- Add `zip --package <name>` to zip a package of the config with the `files` config of its package group, the same files that its deploys ship, and `zipPackage()` and `getPackageFiles()` to build the same ZIP from a script. The `zip` result also has the `slug` and `version`. ([`f8b330e`](https://github.com/wpelevator/basement/commit/f8b330e4d5c0a7c8dce8fd390d68f033121e4cf3))

## 0.13.0 (2026-10-12)

- Ask for the packages, bumps and release note of `changeset-add` in a terminal, preselecting the changed packages; add the changed packages with a single `--bump`; and accept package paths in `changeset-add`, `changeset-version` and `changeset-tag`. ([`9359398`](https://github.com/wpelevator/basement/commit/93593980ab11b5897f6ece2c5aeebbb0afc7e04a))
- Add `deploy-git --release-ref <ref>` and `deploy-svn --release-ref <ref>` to deploy the configured packages of a release tag or branch to the Git and WordPress.org targets in the new `deploy` config of their package groups, with `--package` to deploy one package and `--list` to list the deploys. Targets take templates or callbacks with the package, its release and the source commit, also for the commit message, and a list of them deploys to several repositories. The new `files` config sets the files that the deploys ship, and package groups without `version` only deploy branches, without changesets. ([`0f520f8`](https://github.com/wpelevator/basement/commit/0f520f8feceb05db8682d5e30da58600af3d5fb0))
- Require a changeset for a dependent whose package manifest changes beyond the pin of a source that the pull request releases. ([`1fa3644`](https://github.com/wpelevator/basement/commit/1fa364414520c2ab7e0f19a036cac8f2eb616990))
- Add `changeset-version --prerelease <id>` and the `prerelease` option of `versionChangesets()` to release pre-releases like `1.3.0-rc.1`, numbered from the package tags, and `--snapshot <id>` for test builds like `1.3.0-pr-251.20261012183005`. The readme `Stable tag` keeps the last stable version for a pre-release, and the release notes of a stable release compare with the previous stable release instead of its pre-releases. ([`40c4283`](https://github.com/wpelevator/basement/commit/40c4283516c4ae8ad1c468ff2c84299aa530b542))
- Bump the `x.y` and `x.y.z.w` versions common in WordPress plugins without a custom `nextVersion` strategy. A version keeps its number of parts, so a minor bump of `2.1` is `2.2` and of `1.2.3.4` is `1.3.0.0`, while a patch bump of `2.1` is `2.1.1`. Tags with these versions are now sorted and found as the previous release, comparing every part. ([`e64fc2f`](https://github.com/wpelevator/basement/commit/e64fc2f4ad478c3395f45c6c53b5a790a7c2f414))

## 0.12.0 (2026-10-12)

- Remove the `getGitHubPullRequest()` export, so wp-release no longer needs the `gh` CLI. A `changelogEntry` callback can link each entry to the commit that added its changeset with the `commit` it receives. ([`f463fc7`](https://github.com/wpelevator/basement/commit/f463fc74e4cf6c35c1b130a7e9c8319eea7e7584))

## 0.11.0 (2026-10-12)

- Add the `ChangesetRelease` class, which runs the changeset release operations with an injectable git runner. The changeset release code is split into focused modules, and the README documents the package architecture. ([#242](https://github.com/wpelevator/basement/pull/242) by @kasparsd, [`bf1279d`](https://github.com/wpelevator/basement/commit/bf1279de74d70223a62f26fc7266d05379973618))
- Remove the `--github-release` flag of `changeset-tag` and the `githubRelease` option of `tagChangesets()`; create GitHub Releases with a workflow step like `softprops/action-gh-release` instead. Each tag in the `changeset-tag` result now has a `title`, like `plugins/alpha@1.2.0`, for that step. ([#242](https://github.com/wpelevator/basement/pull/242) by @kasparsd, [`bf1279d`](https://github.com/wpelevator/basement/commit/bf1279de74d70223a62f26fc7266d05379973618))
- Detect the changes of a package at the repository root, so that `changeset-status` reports its missing changesets and `changeset-tag --since` tags it. ([#242](https://github.com/wpelevator/basement/pull/242) by @kasparsd, [`bf1279d`](https://github.com/wpelevator/basement/commit/bf1279de74d70223a62f26fc7266d05379973618))

## 0.10.0 (2026-10-12)

- Add a `dependents` changeset configuration, which re-releases packages that bundle another configured package whenever it releases, so that bundled dependencies like the `wp-release-*` GitHub Actions ship the new version at the same time. The dependents come from the dependencies that each package declares in `package.json`: a dependent releases when the next version of the source falls outside its declared range, or always with `when: 'always'`, and versioning rewrites its declared specs of the source to the released version, keeping their range prefixes. Dependents release with a `bump` bump (default `patch`) and a "Bundle <source> <version>." changelog entry unless they have their own changeset, `--package` selections pull in the dependents of the selected sources, and `dependents.exclude` leaves packages out of the automatic re-releases, while they still release with their own changesets, and versioning a dependent while a dependency it declares has pending changesets fails, so a release can't bundle unreleased source code; `--no-dependents` skips the dependents and the check. The `dependents.dependency` hooks add specs of couplings that other manifests declare to the built-in npm scan, and replace its spec rewrite, so that the same range rule and rewrite apply to them. ([#238](https://github.com/wpelevator/basement/pull/238) by @kasparsd, [`04fa1be`](https://github.com/wpelevator/basement/commit/04fa1be25aeef5e39e018d874d9a8dde54a5179a))

## 0.9.0 (2026-10-12)

- Add `keygen` and opt-in Git `export-ignore` support to release file selection. ([#234](https://github.com/wpelevator/basement/pull/234) by @kasparsd, [`1eb51e4`](https://github.com/wpelevator/basement/commit/1eb51e47f159d895abd15e3f26823b17e0be0038))

## 0.8.0 (2026-10-11)

- New `changelogEntry` config callback, which formats the changelog entry of each changeset with the commit that added it, for example to credit its pull request and author. The formatted entries go into `CHANGELOG.md`, the `changeset-version` result and the release notes. New library exports: `getGitHubPullRequest()`, which finds the pull request and author of a commit with the `gh` CLI, and `formatChangelogList()`. ([#228](https://github.com/wpelevator/basement/pull/228) by @kasparsd, [`7fce8f7`](https://github.com/wpelevator/basement/commit/7fce8f7b09a1b8e59b1d934b033eaac1d4cc47c6))

## 0.7.0 (2026-10-11)

- New library exports: `GitDeploy`, `resolveGitDeployOptions()`, `isValidRefName()`, `createGitRunner()`, `GitError`, `redactUrls()` and `getGitDeployInputFromArgs()`, with the `GitDeployInput`, `GitDeployOptions`, `GitDeployResult`, `GitRunner`, `GitCommandInput` and `GitCommandOutput` types.
- New `deploy-git` command, which deploys the files of a plugin, theme or package to a Git repository as a release commit, selected like `zip` with `.distignore` and `--exclude`. The release commit's parents are the previous release and the source history, the source commit or with `--split-prefix` the history of a monorepo package from `git subtree split`, so the repository keeps the history. Pushes are never forced: the branch only moves forward, releases without changes aren't pushed, an older build that runs again doesn't move the branch back to older files, a tag that already has the same files is reused without pushing, and a tag with other files fails with exit code 2 before anything is pushed.
- `changeset-tag` can release a single package with `--package <name>` and check its version with `--version <version>`. It checks that every configured version target matches before it creates a tag, marks the GitHub Releases of pre-release versions like `1.0.0-rc.1` as pre-releases, falls back to the commits since the previous tag for the release notes when the version has no `CHANGELOG.md` section, prints the release notes in dry runs and adds the tags to the job summary. The new `releaseNotes` config callback formats the release notes, for example to add links. The `changeset-version` result has the changelog entries of each release, and its job summary lists the package releases. `changeset-version --package <name>` versions only the named packages: a changeset that also names other packages keeps only their entries, so it still applies to their releases. New library exports: `getChangesetPackages()` and `formatChangelogEntries()`.

## 0.6.1 (2026-10-11)

- Push release tags one at a time with `changeset-tag --push`, so that GitHub triggers tag workflows for each of them, add `changeset-tag --untagged` to list the releases that don't have a tag yet, and add the global `--github-output` option to set the command result as a GitHub Actions step output.

## 0.6.0 (2026-10-11)

- Keep the release actions pinned to a stable wp-release version while the monorepo root resolves them to its local workspace; support explicit changelog insertion markers before the first version heading.
- Add experimental Changesets-compatible release commands and JavaScript configuration for WordPress plugins, themes, PHP packages, and JavaScript packages.

## 0.5.0 (2026-10-11)

- With the `github` log format, `version-check` and `deploy-svn` annotate each version mismatch on the file and line of the `Version` header, readme `Stable tag` or PHP constant, and `verify` reports changed files and files that aren't in the checksums as problems on their files.
- Workflow command messages are escaped, so a multi-line error stays one annotation.
- `ValidationError` can list `problems` with a file and line, and `logError()` reports each one on its own file and line. `deploy-svn` throws a `VersionMismatchError`, a `ValidationError` with the `mismatches` and their problems, when the versions don't agree. The message is unchanged.
- `VersionMismatch` has the `line` of the version.
- With the `github` log format, `deploy-svn`, `zip`, `checksums`, `sign`, `verify` and `version-check` add a section to the job summary of the run when `GITHUB_STEP_SUMMARY` is set. A deploy summary links the plugin to its WordPress.org page and the commit to its changeset, and lists the SVN changes. Failed commands add their error, and version mismatches add a table with their files and lines.
- `Logger` passes messages to a writer instead of formatting them: `new Logger( { writer: new GitHubActionsWriter() } )` replaces `new Logger( { ci: true } )`, and `TextWriter` is the default. The `ci`, `stdout` and `stderr` options moved to the writers, and `Logger` no longer reads `GITHUB_ACTIONS`. `error()`, `warning()` and `notice()` take an annotation with a `file`, `line` and `title`, and `summary()` takes a function that builds the summary Markdown.
- New `--log-format <text|github>` option that picks how the CLI logs. It defaults to `github` when `GITHUB_ACTIONS=true`, as `--ci` documented, and to `text` elsewhere. `--ci` is a shorthand for `--log-format github`, and `--log-format text` prints plain text in GitHub Actions. Before, annotations needed `--ci`.
- New library exports: `TextWriter`, `GitHubActionsWriter`, `logError()`, `logProblems()`, `VersionMismatchError`, `getVersionMismatchProblems()`, `findConstantDefinitions()`, `findFileHeaderLine()`, `findReadmeHeaderLine()`, and the `LogWriter`, `LogEntry`, `SummaryBuilder`, `SummaryContext`, `Annotation` and `Problem` types. The Markdown helpers that build the summaries stay internal.

## 0.4.1 (2026-10-10)

- `verify --embedded <path>` now requires both the `--checksums` file and its `.sig` next to it, and both shipped copies, instead of passing when the signature is absent on both sides. It fails when the manifest lists the embedded path.
- `verify` without `--embedded` skips a manifest or `.sig` copy at the root only when the copy exists, the matching original exists and the manifest doesn't list it. Before, a file with the name of the manifest was ignored in both the directory and the manifest, so a listed file like `checksums.json` could be deleted without being noticed, and a shipped `.sig` without an original was skipped instead of reported as not in the checksums.

## 0.4.0 (2026-10-10)

- `deploy-svn --svn-tag` without `--trunk` now builds the tag from the source files instead of copying the repository's trunk, so a pre-release like `1.5.1-rc.1` can be tagged without touching trunk. The tag run checks that the `Version` header matches the tag, but not the readme `Stable tag`. With `--force`, an existing tag is updated to match the build. `--trunk --svn-tag` still copies the synced trunk.
- `checksums`, `zip` and `verify` skip the `.sig` next to the manifest or ZIP they write, so a signed manifest can be shipped inside the plugin.
- New `verify --zip <file|url>` and `--root-folder` options check the files of a ZIP, including one downloaded from a URL such as the ZIP that WordPress.org builds for a release.
- `verify` skips a copy of the manifest and its `.sig` at the root of the checked files, and fails when the copy differs from the `--checksums` file.
- New `verify --embedded <path>` option for a manifest and signature shipped at another path than the root. The copies must exist and match the `--checksums` file and its `.sig`.
- `checksums --output` creates missing folders.
- `verify` fails when the version in the manifest differs from the `Version` header of the checked files.
- New `sign` command, which writes a detached Ed25519 `<file>.sig` of the SHA-384 digest in the format that WordPress core's `verify_file_signature()` checks. The key comes from the `WP_RELEASE_SIGNING_KEY` environment variable.
- New `verify --public-key` option, which checks the signature of the checksums manifest before comparing any file.
- New library exports for signing (`signFile()`, `writeSignature()`, `verifyFileSignature()`, `parseSigningKey()`, `parsePublicKey()`, `getPublicKey()`) and `execute()` to run a command by name and get its result, which the GitHub Actions use.

## 0.3.0 (2026-10-10)

- Pre-release versions like `1.5.1-rc.1` can now be used as an SVN tag. Syncing a pre-release version to `trunk/` still warns.
- Restored `deploy-svn --readme-only`, which 0.2.0 removed. It syncs only the readme to `trunk/` for updates between releases, and can't be combined with `--svn-tag`. The `gitRef` deploy option stays removed.

## 0.2.0 (2026-10-09)

- `deploy-svn --svn-tag` no longer requires `--trunk`. Without `--trunk`, the tag is copied from the current `trunk/` in the repository, without checking out trunk. With `--trunk` the tag is copied from the working copy, so it includes the changes of the run.
- Removed `deploy-svn --readme-only`: a deploy writes the whole trunk or nothing to it. Assets can still be updated alone with `--assets-dir`.
- Removed the `gitRef` deploy option, which only guarded `--readme-only`.

## 0.1.1 (2026-10-09)

- First release published by the release workflow with npm trusted publishing. No changes to the package.

## 0.1.0 (2026-10-09)

- First release with the `zip`, `checksums`, `verify`, `version-check` and `deploy-svn` commands.
