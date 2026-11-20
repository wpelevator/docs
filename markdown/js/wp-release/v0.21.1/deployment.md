# Deploy

Choose between WordPress.org SVN, a Git repository and the configured packages of a monorepo.

Deploys publish the files of a release. Pick the target:

| I want to | Command | Page |
|---|---|---|
| Publish a plugin to WordPress.org | `deploy svn` | [Deploy to WordPress.org](deploy-svn.md) |
| Release built files to a distribution repository | `deploy git` | [Deploy to a Git repository](deploy-git.md) |
| Release every package of a monorepo to its own targets | `deploy git --release-ref`, `deploy svn --release-ref` | [Deploy configured packages](deploy-packages.md) |

All three read files like `zip` does: with [`.distignore` and `--exclude`](file-selection.md), so build first and deploy what you built. Each supports `--dry-run`, which runs everything except the write, and a failed check exits with `2`. WordPress.org themes are released by uploading a ZIP, so `deploy svn` is for plugins only: use [`zip`](build-a-zip.md) for a theme.
