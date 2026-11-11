# CLI (/js/subtree-split/v0.2.1/cli.html)

```bash
subtree-split --prefix packages/my-library --ref main --git-dir-cache
```

| Option | Description |
| --- | --- |
| `-P`, `--prefix <dir>` | Directory to split, relative to the root of the repository. Required. |
| `-r`, `--ref <commit>` | Commit to split the history of, `HEAD` by default. |
| `--cwd <dir>` | Directory in the repository, the current directory by default. |
| `--git-dir-cache` | Remember the split commits in a file named after the prefix in the Git directory, like `.git/subtree-split-cache/packages-my-library.json`. |
| `--cache <file>` | Remember the split commits in this file instead. Defaults to the path in the `SUBTREE_SPLIT_CACHE` environment variable. |
| `--github-output` | Set the outputs of a GitHub Actions step. Needs the `GITHUB_OUTPUT` variable that GitHub Actions sets, and fails before splitting without it. |
| `-h`, `--help` | Show the usage. |

The exit code is 0 for a split and 1 when it fails or the directory doesn't exist at the ref, like for `git subtree split`. It's 2 for invalid options. Errors go to the standard error output.
