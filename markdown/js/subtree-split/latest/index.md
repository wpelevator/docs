# subtree-split (/js/subtree-split/latest/index.html)

Split a directory of a monorepo into its own history, with the same commit hashes as `git subtree split`, in about a tenth of a second instead of several seconds.

In a monorepo with 477 commits, `git subtree split` takes 6 to 8 seconds for one package and `subtree-split` takes 0.1 seconds. On [WordPress/gutenberg](https://github.com/WordPress/gutenberg) (43,568 commits) it splits `packages/components` in 1.7 seconds. The hashes are the same as `git subtree split` makes, so a repository that you already split that way keeps its history when you switch.

[`@wpelevator/wp-release`](https://www.npmjs.com/package/@wpelevator/wp-release) uses it for `deploy-git --split-prefix`.

## Install [#install]

```bash
npm install --save-dev @wpelevator/subtree-split
```

It needs Node.js 22.12 or later, Git 2.29 or later, and the full history of the repository. It works in a bare clone, and it fails with a message on a shallow one, so in CI check out with `fetch-depth: 0`.

## Quick start [#quick-start]

Run it in the monorepo, with the directory that you want to split:

```bash
npx @wpelevator/subtree-split --prefix packages/my-library
```

It prints the hash of the split commit and writes the commits to the repository. It doesn't change a branch, so you decide what to do with the hash. To publish it to the repository of the package:

```bash
tip=$(npx @wpelevator/subtree-split --prefix packages/my-library)
git push git@github.com:acme/my-library.git "$tip:refs/heads/main"
```

To keep it in a local branch instead, run `git update-ref refs/heads/split/my-library "$tip"`.

## Guides [#guides]

- [CLI](./cli.html.md)
- [GitHub Actions](./github-actions.html.md)
- [Caching split results](./caching.html.md)
- [Library API](./library.html.md)
- [Compatibility with git subtree split](./compatibility.html.md)
- [Development](./development.html.md)
