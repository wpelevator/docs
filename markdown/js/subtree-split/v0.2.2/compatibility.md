# Compatibility with git subtree split (/js/subtree-split/v0.2.2/compatibility.html)

## Limits [#limits]

- Git 2.29 or later. The rules of `git subtree split` for merges changed in Git 2.20, and older versions make other commits that this package doesn't reproduce.
- One prefix per call. There is no `--rejoin`, `--squash`, `--onto` or `--annotate`, and the `git-subtree-*` trailers of earlier `git subtree add` and `split --rejoin` commands aren't read.
- A name with a backslash, or a commit in an encoding that `TextDecoder` doesn't know, may differ from what the shell script writes.

## How it matches git subtree split [#how-it-matches-git-subtree-split]

The package is a port of the rules of `process_split_commit` and `copy_or_skip` in `git-subtree.sh`, including its oddities. A commit that doesn't have the directory but whose parents do maps to itself, and a commit is only dropped in favor of a parent with the same tree when no history of another branch would be lost. Commits are written with the author, committer, dates and message of the original, without signatures and other extra headers, and with the names cleaned like `git commit-tree` does. The hashes are calculated in Node and written with one `git fast-import` process, which checks that Git wrote the same hash.

The tests in `src` run both implementations on the same repositories and compare the tips and the commit objects. They cover linear history, merges where one or both sides touch the directory, branches that make the same change, octopus merges, a directory that is added late, removed and added back or renamed, empty commits, authors that differ from committers, time zones, names with punctuation, messages without a trailing newline, a commit in another encoding, signed commits, and random histories of branches and merges built to often end up with the same tree.

```bash
npm test
SUBTREE_SPLIT_SEEDS=200 npm test
npm run test:monorepo
```

The default run has 10 random histories, and the variable sets how many there are. The monorepo check splits every package of this repository with both implementations. It takes a few minutes because of `git subtree split`, so it runs on demand.
