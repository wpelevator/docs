# Deploy to a Git repository

Release the built files of a plugin, theme or package to a Git repository as a release commit, with a branch and a tag.

`deploy git` releases files to a Git repository as a release commit, with a branch and a tag. It prints what it created and what it pushed:

```sh
npx @wpelevator/wp-release deploy git --git-url /home/me/distrepo --branch main --tag 1.5.0 --dry-run
```

```text
Deploying /home/me/my-plugin to /home/me/distrepo
Created release <commit>.
Dry run, skipped pushing refs/heads/main, refs/tags/1.5.0.
```

Without `--dry-run`, it pushes the branch and the tag in one atomic push:

```text
Deploying /home/me/my-plugin to /home/me/distrepo
Created release <commit>.
Pushed <commit> to refs/heads/main, refs/tags/1.5.0.
```

`deploy git` deploys the selected files of a plugin, theme or package to a Git repository, like a distribution repository that ships the built files and `vendor/` for Composer installs or GitHub-hosted updates, or the release repository of a monorepo package. It selects files like `zip`, with `.distignore` and `--exclude`, so built files that git ignores in the source repository, like `build/` or `vendor/`, are released too. The source directory must be inside a Git repository, which provides the source history and stores the release objects before they're pushed.

Pushes are never forced, so the branch only moves forward and a tag is never replaced.

## Options

| Flag | Default | Writes |
|---|---|---|
| `--branch <name>` | off | Push the release to this branch |
| `--tag <name>` | off | Create this tag for the release |

```bash
# Release a build to a distribution repository and tag it
wp-release deploy git build --git-url git@github.com:me/my-plugin-dist.git --branch main --tag 1.2.0

# Release a monorepo package with its own history
wp-release deploy git packages/my-plugin --split-prefix packages/my-plugin --git-url … --branch main
```

## How a deploy works

How a deploy works:

1. The selected files are written to the object database of the source repository and become a tree, with a temporary index, so the working tree and the index of the repository are left alone. Executable files stay executable.
2. The previous release is fetched: the tip of `--branch`, or for a tag-only deploy the tip of the repository's default branch (its `HEAD`), whatever that branch holds. Release a tag together with `--branch` to choose the branch it builds on.
3. When the files are the same as in the previous release, that release is reused. Otherwise a release commit is created with the files, whose parents are the previous release and the source history: the source commit (`--source-ref`, default `HEAD`), or with `--split-prefix` the history of that directory, split with [`@wpelevator/subtree-split`](https://www.npmjs.com/package/@wpelevator/subtree-split) into the same commits as `git subtree split` makes. The repository keeps the source history, and `git log --first-parent` lists the releases.
4. When the previous release on `--branch` already has newer source history, the branch isn't moved, so running an older build again, like a re-run of an earlier CI job, can't release older files. The source history is outdated when it's an older commit of the source history that the previous release was made from, its last parent. The split makes this reliable for `--split-prefix` too, since it creates the same commits for the same history. It needs the full history, so a shallow clone, like a checkout without `fetch-depth: 0`, fails. A revert is a new commit, so it's released, and with `--tag` the tag of an older build is still released, without moving the branch.
5. The tag is checked in the repository first. A tag that already has the same files is the release: it's reused and nothing is pushed, so running a tag release again is a no-op. A tag with other files fails with exit code `2` before anything is pushed.
6. The release is pushed to the branch, unless it didn't change or is outdated, and to the tag, in one atomic push. Pushes are never forced, so the branch only moves forward and a tag is never replaced, also when it was created in the meantime.

To release a tag again, for example after a release with the wrong files, delete the tag in the repository (`git push <url> :refs/tags/<tag>`) and run the deploy again. There's no flag for replacing a tag, since installs, Composer and GitHub Actions pins trust that a published tag doesn't change.

## Messages and credentials

`--dry-run` runs everything except the push. `--message` sets the commit message, which defaults to `Release <tag or branch> from <source commit>`. Credentials come from git, like a credential helper or an SSH key, and credentials in URLs are never printed. For an HTTPS repository on `github.com`, or on the host of `GITHUB_SERVER_URL` like GitHub Enterprise Server, the `GITHUB_TOKEN` environment variable is sent as an authorization header, like `actions/checkout` does, so the token stays out of the URL, the git arguments and the repository config, and it replaces the header that `actions/checkout` persists. Pass `token` to `resolveGitDeployOptions()` for another HTTPS host. The commit needs a git identity (`user.name` and `user.email`).
