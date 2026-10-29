# Development (/js/wp-release/v0.18.1/development)

## Development [#development]

The source is TypeScript in `src/`, with tests next to the files they test (`*.test.ts`). The published package contains only the compiled `dist/` with JavaScript and `.d.ts` files; tests and translation fixtures stay in the repository.

```bash
npm run build --workspace @wpelevator/wp-release
npm test --workspace @wpelevator/wp-release
npm run lint --workspace @wpelevator/wp-release
```

- `build` compiles `src/` to `dist/` with `tsc`, leaving out the tests.
- `test` runs the `.ts` tests directly with `node --test`, using Node.js type stripping, so it needs Node.js 22.18 or later but no build. The SVN integration tests in `svn-deploy.integration.test.ts` create repositories with `svnadmin` and deploy to their `file://` URLs; they're skipped when `svn` or `svnadmin` isn't installed.
- `lint` runs ESLint and a `tsc` type check.

The i18n tests validate gettext round trips, script catalogs and generated PHP data without launching PHP, WP-CLI or WordPress, covering contexts, plural forms, comments, flags, Unicode, escaping and PHP-looking input as data.

The `wpelevator-source` export condition points at `src/index.ts`. The wp-release tests and monorepo CLI scripts use it to work with the source instead of a `dist/` build. Action builds use the declared dependency's default export, which resolves to `dist/` for the workspace copy and the published package. Build wp-release before building the actions.

`execute( 'deploy-svn', args, { cwd, logger, svnRunner } )` runs a single-plugin deployment or a configured plan or deployment. The optional `svnRunner` replaces the external command runner in both modes; without it, the command uses its normal runner.

### Architecture [#architecture]

wp-release has two layers, so that it fits any repository layout:

- **Primitives** work on the directory, file or values they're given and know nothing about the repository: `build <dir>`, `zip <dir>`, `checksums`, `sign`, `verify`, `version-check`, `deploy-git <dir>`, `deploy-svn <dir>`, `i18n-pot <dir>`, `i18n-audit <dir>` and the `i18n-mo`, `i18n-json` and `i18n-php` compilers.
- **The config layer** reads `wp-release.config.js` for everything about the repository: where packages are (`root` and the package globs), how their versions and tags are named (`version`, `tagFormat`), which files they ship (`files`), how their translations are extracted (`i18n`), where they deploy (`deploy`) and the git `remote`. The changeset commands (with a single-project fallback when no config exists), `deploy-git` and `deploy-svn --release-ref`, `build --package` and `zip --package`, and `i18n-pot` and `i18n-audit` with `--package` or `--all` belong to it, and the global `--config` and `--tag-format` options select or adjust the config. `zip` and `checksums` also read caller configuration for integrity settings even without `--package`; verification reads it only when explicitly selected. Only `--release-ref` reads which package and version a ref releases. A primitive with a config mode, like `deploy-git --release-ref` beside `deploy-git <dir>` or `zip --package` beside `zip <dir>`, only takes the package directory, its files and its targets from the config there, and otherwise works the same.

Configured repositories use the layout and naming conventions their config sets. Config-free changeset releases use the root-only detection and defaults described above.

The GitHub Actions are adapters to these commands: they use the same flag names and `execute()` entry point, with secrets supplied through environment variables. The SVN action injects a command runner that checks or installs SVN only when a deployment runs its first SVN command; config planning and deployment behavior remain in `wp-release`.

The package uses ES modules as its unit of encapsulation, like most Node.js CLI tools: a module exports a few functions and keeps its helpers private, so there's no class to wrap them in. A class is used only when it holds state across steps or binds dependencies, so that callers and tests can replace them:

- **Workflows with steps** are classes, so that their steps share state and dependencies on the instance: `SvnDeploy` shares the temporary working copy across `prepare()`, `checkout()`, `sync()` and `commit()`, `GitDeploy` binds the options and the git runner to its steps, and `ChangesetRelease` binds the repository and the runners to `add()`, `version()` and `tag()`.
- **External commands** run through injectable runners: `createSvnRunner()` and `createGitRunner()` return functions that spawn the binary without a shell. The classes take a runner as an option and create the default one when it's missing, so tests pass a fake runner, or one that wraps the real runner and records some commands, instead of putting fake binaries on the `PATH`. The `Svn` and `ReleaseRepository` classes wrap a runner with the commands of their domain.
- **Domain logic** is plain functions that take their dependencies as arguments, like `discoverPackages( repository, config )`, so that each one can be tested on its own.
- **Commands** in `src/commands/` parse the CLI options and call the library, and `cli.ts` handles the global options, logging and exit codes. Errors carry their exit code, like `ValidationError` with `2`.
- Constructors only store their options. Work starts in a method call.

The changeset release modules, from the entry point down:

| Module | Responsibility |
|---|---|
| `changeset-release.ts` | `ChangesetRelease`, which plans releases and runs `add()`, `getStatus()`, `version()` and `tag()`, and the function form of each operation. |
| `single-project.ts` | Resolving the config-free root project, its version source and targets, and shared release settings. |
| `changeset-config.ts` | Loading and validating `wp-release.config.js`, and the version source and target helpers. |
| `changeset-packages.ts` | Discovering the packages of the configured globs, with or without a version, and finding the changed ones. |
| `changeset-files.ts` | Reading, writing and consuming changeset files. |
| `changeset-dependents.ts` | The dependents policy: which packages re-release with their sources, and rewriting their dependency specs. |
| `changesets.ts` | Parsing and formatting changesets, and the release types. |
| `version-files.ts` | Reading and writing versions in manifests, headers, readmes and PHP constants. |
| `changelog.ts` | Changelog entries, and the `CHANGELOG.md` and readme changelog sections. |
| `release-tags.ts` | Choosing the version and previous tag of a release, and building its release notes. |
| `tag-format.ts` | Formatting tag names from the tag format. |
| `package-deploy.ts` | Resolving the configured deploys of a ref: the released packages, their targets and file selections, for `deploy-git` and `deploy-svn`, and the file selection of a package for `zip --package`. |
| `package-zip.ts` | `zipPackage()`, the ZIP and checksums manifest of the selected files of a package, for `zip` and the snapshot builds of a monorepo. |
| `release-repository.ts` | `ReleaseRepository`, the git commands of a release: tags, commits and changed files. |
| `file-journal.ts` | `FileJournal`, which restores every file a failed `changeset-version` run changed. |
| `versions.ts` | Version checks and SemVer precedence. |

The internationalization modules in `src/i18n/`, from the entry points down:

| Module | Responsibility |
|---|---|
| `packages.ts` | `resolveI18nPackages()`, the config adapter that selects a directory, one package or all packages and resolves their options and POT paths. |
| `options.ts` | Validating and merging the `i18n` options of the config layers and the CLI. |
| `generate.ts` | `extractCatalog()` and `generatePackagePot()`, which read the selected files of a package and write or check its POT. |
| `compile.ts` | `compileTranslations()`, which compiles a translated PO into MO, script JSON or `.l10n.php` and writes or checks the outputs. |
| `files.ts` | Selecting source files with the include and exclude globs, independently of the distribution file rules. |
| `php.ts`, `javascript.ts` and `metadata.ts` | Parsers for PHP, JavaScript and TypeScript, and `block.json`, `theme.json` and plugin and theme headers. |
| `extraction.ts` | The translation functions and their arguments, shared by the parsers. |
| `catalog.ts` | Catalog types, merging messages of a domain and the diagnostics. |
| `audit.ts` and `placeholders.ts` | Audit findings and the sprintf placeholders that they check. |
| `pot.ts` | Serializing a catalog as a POT. |
| `po.ts`, `translation-json.ts` and `translation-php.ts` | Parsing translated PO files and compiling MO, script JSON and `.l10n.php`. |
| `atomic-output.ts` | Validating output paths and replacing output files atomically. |
