# Release from GitHub Actions

Turn changesets in pull requests into a release pull request, a version tag and a GitHub Release with two workflows.

A release takes three moves, and a workflow does the last two:

1. A contributor runs `changeset add` in the pull request. It asks for the bump and the release note, and writes a small Markdown file that is committed with the pull request.
2. When it merges, a workflow versions the plugin and opens a release pull request.
3. When the release pull request merges, a workflow tags the commit and creates the GitHub Release.

Nobody writes that file by hand. In a terminal, `changeset add` asks for the packages, the bump of each and the release note. The same run with options, which is what a script or an AI agent uses:

```sh
npx @wpelevator/wp-release changeset add --bump minor --summary "Add a settings page."
```

```text
Created /home/me/my-plugin/.changeset/a1b2c3d4.md.
```

The file that it wrote:

```text
---
"my-plugin": minor
---

Add a settings page.
```

After the pull request merges, `changeset version` applies it. This is what the workflow puts in the release pull request:

```text
my-plugin: 1.4.2 → 1.5.0 (minor)
```

It also changes the `Version` header and the readme `Stable tag`, and adds the entry to `CHANGELOG.md`. After the merge, `changeset tag` creates the tag. Without a config file, tags are named `v{version}`; the config in the first workflow below names them `1.5.0`:

```text
Created v1.5.0
```

The sections below have the workflows, the data they pass between steps and what to do when the tag must contain built files. Install the CLI in your project first:

```sh
npm install --save-dev @wpelevator/wp-release
```

Projects without Node.js can run the same flow with [PHP Changesets](../../../php/php-changesets/docs/index.md).

## Check pull requests

There are no dedicated build or changeset wrapper actions. Install the CLI in your project and run it directly. A root npm package can check a pull request with:

```yaml
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - run: npm ci
      - run: npx --no-install wp-release changeset status --since origin/main
```

For a plugin with several version targets, put the same descriptor flags in npm scripts for all four changeset commands. Full Git history and tags are needed for comparisons, Git version sources and release notes. Keep the checkout directory name consistent when it supplies the changeset identifier. Directory artifacts use `npx --no-install wp-release build --output dist/my-plugin --github-output`; upload that directory with your artifact action. `build` writes manifest sidecars outside the directory and does not accept the ZIP-only embedding, codec or manifest-filename flags.

## Open the release pull request and tag the release

A repository with one package needs two workflows after the pull request check above: one that opens the release pull request when changesets reach the base branch, and one that tags the release when the versioned files do. This example is for a plugin at the repository root with this config, where the plugin header is the only version source and target, and tags are plain versions like `1.2.0`:

```js
import { defineConfig, wordpressPluginVersion } from '@wpelevator/wp-release';

export default defineConfig( {
	baseBranch: 'main',
	packages: [
		{
			glob: '.',
			id: 'my-plugin', // Pins the identifier, which falls back to the checkout directory name.
			version: {
				from: wordpressPluginVersion(),
				to: [ wordpressPluginVersion() ],
			},
		},
	],
} );
```

`prepare-release.yml` versions the pending changesets on every push to `main` that touches `.changeset/`, and opens or updates a release pull request with the result. The step that opens the pull request is skipped when no release is pending, since `releases` is an empty list then and `releases[0]` reads as `null`. The version step always runs, so `fromJSON()` never reads the empty output of a skipped step:

```yaml
name: Prepare Release

on:
  push:
    branches: [ main ]
    paths: [ '.changeset/**' ]

permissions:
  contents: write
  pull-requests: write

jobs:
  version:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - run: npm ci

      - name: Version the pending changesets
        id: version
        run: npx --no-install wp-release changeset version --github-output

      - name: Open or update the release pull request
        if: ${{ fromJSON( steps.version.outputs.result ).releases[0] != null }}
        uses: peter-evans/create-pull-request@v7
        with:
          branch: release/${{ fromJSON( steps.version.outputs.result ).releases[0].nextVersion }}
          delete-branch: true
          commit-message: 'Release ${{ fromJSON( steps.version.outputs.result ).releases[0].nextVersion }}'
          title: 'Release ${{ fromJSON( steps.version.outputs.result ).releases[0].nextVersion }}'
          body: ${{ fromJSON( steps.version.outputs.result ).releases[0].changelog }}
```

Pull requests opened with the default `GITHUB_TOKEN` don't trigger the pull request workflows, like the changeset check. Pass a personal access token or a GitHub App token as `token` to `create-pull-request` when the release pull request needs its checks.

`tag-release.yml` runs on every push to `main` and tags the commit when it releases a new version. `changeset tag` creates a tag only when it doesn't exist, and `--since HEAD^1` limits it to the packages that the pushed commit changed. A push that doesn't change the package has nothing to tag, and one that changes it without a version bump finds its tag already there. So the workflow needs no trigger on the merged release pull request or its merge commit. Tags pushed with the default `GITHUB_TOKEN` don't trigger other workflows, so check out with a personal access token or a GitHub App token when a workflow listens for the tag or the GitHub Release, like a deploy. Both a squash merge and a merge commit work, since `HEAD^1` is the previous commit on the base branch in both:

```yaml
name: Tag Release

on:
  push:
    branches: [ main ]

permissions:
  contents: write

jobs:
  tag:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - run: npm ci

      - name: Tag and push the release
        id: tag
        run: npx --no-install wp-release changeset tag --since HEAD^1 --push --github-output

      # Skipped when the push didn't change the package, since tags is empty then.
      - name: Create the GitHub Release
        if: ${{ fromJSON( steps.tag.outputs.result ).tags[0] != null }}
        uses: softprops/action-gh-release@v3
        with:
          tag_name: ${{ fromJSON( steps.tag.outputs.result ).tags[0].tag }}
          name: ${{ fromJSON( steps.tag.outputs.result ).tags[0].title }}
          body: ${{ fromJSON( steps.tag.outputs.result ).tags[0].notes }}
          prerelease: ${{ fromJSON( steps.tag.outputs.result ).tags[0].prerelease }}
```

The `--github-output` result of each command is the JSON that these expressions read. `changeset version` reports the `date`, whether it `changed` any file, and the `releases`:

```json
{
	"date": "2026-10-12",
	"changed": true,
	"releases": [
		{
			"package": "my-plugin",
			"bump": "minor",
			"currentVersion": "1.2.0",
			"nextVersion": "1.3.0",
			"changelog": "- Add a new feature."
		}
	]
}
```

`changeset tag` reports the `tags` that it created or found, with `exists` and `created` telling the two apart:

```json
{
	"tags": [
		{
			"package": "my-plugin",
			"version": "1.3.0",
			"tag": "1.3.0",
			"title": "1.3.0",
			"notes": "- Add a new feature.",
			"prerelease": false,
			"exists": false,
			"created": true
		}
	]
}
```

A repository with several packages reads the same lists, but needs a job for each release or tag, since `releases[0]` and `tags[0]` are only the first one. See the `Prepare Release` and `Tag Release` workflows of this repository for a monorepo that releases all packages in one pull request and tags each of them in its own workflow run.

## Built files in the release

What the release commit and the tag must contain depends on how the package is distributed:

- **WordPress.org** builds the ZIP contents from the tag, then runs [`deploy svn`](deploy-svn.md) from a workflow that is triggered by the tag, or by the GitHub Release that the workflow above creates. Nothing but the version files needs to be committed to the release branch.
- **GitHub Releases only** has the tag workflow create the release as a draft, and a second workflow that listens for `release: published` builds the ZIP with [`zip`](build-a-zip.md) and attaches it to the release.
- **Anything that reads the tag as it is**, like a ZIP built from the tag or an install from the repository, needs the built files that the repository ignores, like `vendor/` and `build/`, in the tag. Build them in the release workflow after `changeset version` and force-add them to the release branch commit. `create-pull-request` can't add ignored files, so the workflow pushes the branch and opens the pull request with `git` and `gh`. The files reach the base branch with the merge, so the tag points at a commit that has them:

  ```yaml
        - name: Version the pending changesets
          id: version
          run: npx --no-install wp-release changeset version --github-output

        - name: Build and push the release branch
          if: ${{ fromJSON( steps.version.outputs.result ).releases[0] != null }}
          env:
            VERSION: ${{ fromJSON( steps.version.outputs.result ).releases[0].nextVersion }}
            CHANGELOG: ${{ fromJSON( steps.version.outputs.result ).releases[0].changelog }}
            GH_TOKEN: ${{ github.token }}
          run: |
            composer install --no-dev --optimize-autoloader
            npm run build
            git config user.name "github-actions[bot]"
            git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
            git checkout -B "release/$VERSION"
            git add --all
            git add --force vendor build
            git commit --message "Release $VERSION"
            git push --force origin "release/$VERSION"
            gh pr create --base main --head "release/$VERSION" --title "Release $VERSION" --body "$CHANGELOG" || gh pr edit "release/$VERSION" --title "Release $VERSION"
  ```
