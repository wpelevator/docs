# Changelog

What changed in each release.

## 0.2.2 (2026-11-11)

- Update the docs for the grouped `wp-release` command names, like `deploy git`. ([`0bb0b18`](https://github.com/wpelevator/basement/commit/0bb0b187cc93d3dd1ea9378764e00ef0a7a32f87))

## 0.2.1 (2026-11-07)

- Publish the `docs/` directory in the npm package, so that agents and editors can read the documentation of the installed version. ([`da8652c`](https://github.com/wpelevator/basement/commit/da8652c9da98ef8962c0f7dce9c398bb814c8620))
- Move the detailed usage documentation from the README into topic pages of the `docs/` directory, which the docs site publishes. ([`da8652c`](https://github.com/wpelevator/basement/commit/da8652c9da98ef8962c0f7dce9c398bb814c8620))

## 0.2.0 (2026-11-04)

- Add `--github-output` to the `subtree-split` command, which sets the `hash`, `prefix`, `ref` and `result` outputs of a GitHub Actions step, like the option of `wp-release`. ([`bb9d196`](https://github.com/wpelevator/basement/commit/bb9d196dc42beed7dcaa5004265148351f930ca2))

## 0.1.0 (2026-11-03)

- Publish the package to npm, so that `@wpelevator/wp-release` can depend on it. ([`1498645`](https://github.com/wpelevator/basement/commit/1498645ea54ddecbb8bdd4b76ea8b8d9cc9cc91e))
- Add the `subtree-split` command and `splitHistory()`, which split the history of a directory into the same commits, with the same hashes, as `git subtree split --prefix=<dir> <ref>` from Git 2.20 and later, in about a tenth of a second for a package of this repository instead of six to eight seconds. ([`6fb7103`](https://github.com/wpelevator/basement/commit/6fb71034cb7a799bc05228873849236e4f0a608b))
- Add a cache file, as a path or in the Git directory with `cache: true`, so that splitting again only processes the new commits. A cache that is missing, for another prefix, or with commits that no longer exist is ignored. ([`6fb7103`](https://github.com/wpelevator/basement/commit/6fb71034cb7a799bc05228873849236e4f0a608b))
- Require Git 2.29 or later, and fail on a shallow clone. A directory that doesn't exist at the ref returns `null`. ([`6fb7103`](https://github.com/wpelevator/basement/commit/6fb71034cb7a799bc05228873849236e4f0a608b))

