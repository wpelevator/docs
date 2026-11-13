# Pre-releases and snapshots

Release candidates from a branch and unique snapshot builds for pull requests, without touching the stable version.

Use a pre-release to publish a release candidate of the next version, like `1.3.0-rc.1`, and a snapshot for a test build of a pull request, like `1.3.0-pr-251.20261012183005`. Both run `changeset version` with an identifier, and both leave the readme `Stable tag` on the last stable version. The examples use `npx wp-release`, so install the package in your project first.

## Pre-releases

`changeset version --prerelease <id>` (the `prerelease` option of `versionChangesets()`) releases pre-releases of the next versions, like `1.3.0-rc.1` for a minor bump of `1.2.0`. The identifier, like `alpha`, `beta` or `rc`, can have a number, like `rc.2`, which is used as is and fails when the version is already tagged. Without a number, the number is one above the highest existing tag of that identifier and next stable version, read with the `tagFormat` of the package, so the first one is `rc.1`, and the numbering starts again at `.1` when later changesets raise the next version. The dependents of a source become pre-releases too, so that they bundle its pre-release, unless they're left out with `--no-dependents`.

A pre-release writes every version target except the readme `Stable tag`, which keeps the last stable version since WordPress.org offers it to every site, and `changeset tag` skips the `Stable tag` when it verifies a pre-release. The changelog gets a section for the pre-release, like `## 1.3.0-rc.1 (2026-10-12)`, so that `changeset tag` finds its release notes, and the changesets are consumed like in any release.

Since a pre-release consumes the changesets that the stable release needs, run it on a branch that isn't merged, and tag that branch commit:

```sh
git switch --force-create prerelease/plugins/alpha
npx wp-release changeset version --package plugins/alpha --prerelease rc
git add --all
git commit --message "Prerelease plugins/alpha"
npx wp-release changeset tag --package plugins/alpha --version 1.3.0-rc.1 --push
```

The base branch keeps its stable versions and pending changesets, so the stable release later versions them as usual, in one changelog section. The tag keeps the pre-release commit reachable after the branch is reset or deleted. The release notes of a stable release compare with the previous stable release, skipping the pre-releases before it, and the `git-tag` version source ignores pre-release tags, so packages versioned by git tags keep building on their last stable version.

## Snapshots

`changeset version --snapshot <id>` (the `snapshot` option of `versionChangesets()`) releases snapshots of the next versions for test builds, like `1.3.0-pr-251.20261012183005` for a pull request: the next version with the identifier, like `pr-251` or `pr-251.0abc123` with a commit hash, and the UTC time, so that every snapshot is unique and they sort by time. Snapshots aren't numbered from tags and can't be combined with `--prerelease`. Like a pre-release, a snapshot writes every version target except the readme `Stable tag`. Build and publish the versioned files without committing them, for example under an npm dist-tag like `pr-251`, since a snapshot consumes the changesets:

```sh
npx wp-release changeset version --package @vendor/library --snapshot pr-251
npm publish --workspace packages/library --tag pr-251
```
