# Use it in GitHub Actions

Run wp-release commands in workflows, read their results in later steps and see problems as annotations and job summaries.

Every command runs in a workflow after `npm ci`, with `--github-output` to pass the result to later steps:

```yaml
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - run: npm ci
      - id: zip
        run: npx --no-install wp-release zip --github-output
      - run: echo "${{ steps.zip.outputs.zipPath }}"
```

Four commands also have GitHub Actions, which install nothing and run on Node.js 24 runners:

| Command | Action |
|---|---|
| `zip` | [`wpelevator/wp-release-zip`](https://github.com/wpelevator/wp-release-zip) |
| `checksums` | [`wpelevator/wp-release-checksums`](https://github.com/wpelevator/wp-release-checksums) |
| `sign` | [`wpelevator/wp-release-sign`](https://github.com/wpelevator/wp-release-sign) |
| `deploy svn` | [`wpelevator/wp-release-deploy-svn`](https://github.com/wpelevator/wp-release-deploy-svn) |

Pin `uses:` to a released version from the releases page of each action. For the whole release flow, see [Release from GitHub Actions](release-workflow.md).

## Read results in a workflow

In GitHub Actions, `--github-output` writes the complete result as JSON to `steps.<id>.outputs.result` and exposes each top-level string, number or boolean as a plain output. Use `steps.zip.outputs.zipPath` for a ZIP path, for example. Arrays and objects remain in `result`: tag metadata is read with `fromJSON( steps.tag.outputs.result ).tags[0].tag`, even when only one package is selected. There is no plain `steps.tag.outputs.tag` output.

Prefer plain outputs in steps that run conditionally, since a skipped step has empty outputs. When reading JSON from a step that may be skipped, use a fallback such as `fromJSON( steps.tag.outputs.result || '{"tags":[]}' ).tags[0].tag`. For several tags or deploys, read the arrays in `result` to build a job matrix or process each item.

## Annotations and job summaries

With the `github` log format, the CLI uses current GitHub Actions features to report problems where you look for them, instead of only in the log. `--log-format <name>` picks how the CLI logs, separately from the result that `--json` prints:

| Log format | Output |
|---|---|
| `text` | Plain text. The default outside GitHub Actions. |
| `github` | GitHub Actions annotations and job summaries. The default when `GITHUB_ACTIONS=true`. `--ci` is a shorthand for it. |

Pass `--log-format text` for plain text in GitHub Actions. The GitHub Actions always use the `github` log format. Only the CLI checks `GITHUB_ACTIONS`: the library classes don't read the environment, and choose the format by the [writer](library.md#logging) they get.

Errors, warnings and notices are printed as [workflow commands](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands), so they show up as annotations on the run and on the files of a pull request:

- `version-check` and `deploy svn` annotate each version mismatch on the file and line of the version: the `Version` header, the readme `Stable tag` or the PHP constant.
- `verify` annotates each changed file and each file that isn't in the checksums.

Each command also adds a section to the [job summary](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands#adding-a-job-summary) of the run, when `GITHUB_STEP_SUMMARY` is set:

| Command | Summary |
|---|---|
| `deploy svn` | Plugin, linked to its WordPress.org page, version, written SVN paths, the commit linked to its WordPress.org changeset (or the dry run or no-op result), and the SVN changes in a collapsed table. |
| `deploy git` | Repository, release commit and the pushed branch and tag. |
| `build` | Output directory, number of copied files and optional manifest; requested signatures and public keys. |
| `zip` | ZIP, number of files and checksums manifest; with `--sign`, signature files and the public key of each written format. |
| `checksums` | Manifest and number of files. |
| `sign` | Signature files and the public key of each written format. |
| `verify` | That all files match, or the counts and a table of the changed, missing and extra files. |
| `version-check` | The matching version, or a table of the mismatches with their files and lines. |
| `changeset status` | Each changed package with whether it has a changeset. |
| `changeset version` | A table of the package releases with their version changes and bumps. |
| `changeset tag` | Each tag with its previous tag and status, and its release notes in a collapsed section. |

A failed command adds its error to the summary, or a table of its problems with their files and lines, listing up to 100 and counting the rest. The Markdown of the summaries isn't part of the library API. File paths are relative to `GITHUB_WORKSPACE`, or the current directory without it. Files outside it, like those of an extracted ZIP, get an annotation without a file. Multi-line messages stay one annotation.
