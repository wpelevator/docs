# Library API (/js/wp-release/v0.18.1/library)

### Exit codes [#exit-codes]

| Code | Meaning |
|---|---|
| `0` | Success, dry run, no changes, or help |
| `1` | Unexpected failure, such as a failed svn or git command |
| `2` | Invalid options, failed release checks, an existing SVN tag, a Git tag that exists with another release, or files that don't match the checksums |
| `3` | Missing SVN credentials, or credentials that SVN rejected |

## Library [#library]

```js
import { Logger, SvnDeploy, resolveDeployOptions } from '@wpelevator/wp-release';

const options = resolveDeployOptions( {
	slug: 'my-plugin',
	sourceDir: 'dist',
	trunk: true,
	svnTag: '1.2.0',
	dryRun: true,
} );

const { committed, revision, version, changes } = await new SvnDeploy(
	options,
	new Logger()
).run();
```

`resolveDeployOptions()` applies the defaults and throws a `ValidationError` (with `exitCode` `2`) for invalid combinations. `SvnDeploy` exposes each step (`prepare()`, `checkVersions()`, `checkout()`, `sync()`, `commit()` and `cleanup()`) separately so CI wrappers can run and report them one by one; `run()` runs all of them, or nothing when there's nothing to write. `getPlan()` lists the planned SVN changes. The `Svn` class wraps the svn command line, and takes the command runner as a dependency so that tests can replace it.

Git deploys:

```js
import { GitDeploy, resolveGitDeployOptions } from '@wpelevator/wp-release';

const { revision, created, pushed } = await new GitDeploy(
	resolveGitDeployOptions( {
		sourceDir: 'packages/my-plugin',
		gitUrl: 'git@github.com:me/my-plugin.git',
		branch: 'main',
		tag: '1.2.0',
		splitPrefix: 'packages/my-plugin',
	} )
).run();
```

`resolveGitDeployOptions()` throws a `ValidationError` without a repository URL or with an invalid branch or tag. `GitDeploy` exposes `createTree()`, `fetchPrevious()`, `createRelease()`, `isOutdated()`, `checkTag()`, `getRefsToPush()` and `push()` separately, like `SvnDeploy`, and takes a git command runner from `createGitRunner()` as a dependency. The result has `outdated` when the branch wasn't moved for older source history, the refs to write in `planned` and the refs that were pushed in `pushed`, which is empty in a dry run. `redactUrls()` hides the credentials in URLs.

Changeset releases:

```js
import { ChangesetRelease } from '@wpelevator/wp-release';

const release = new ChangesetRelease( { cwd: process.cwd() } );

const { missingChangesets } = await release.getStatus( { since: 'origin/main' } );
const { releases } = await release.version( { dryRun: true } );
const { tags } = await release.tag( { dryRun: true } );
```

`ChangesetRelease` runs the `changeset-*` commands: `add()`, `getStatus()`, `version()` and `tag()`, plus `getPlan()`, `getPackages()` and `getConfiguredPackages()`. Each call reads the configuration, packages and pending changesets again, so one instance can version and then tag. `getConfiguredPackages()` returns package directories with their resolved release group metadata; `formatTag()` and `formatTemplate()` apply the same placeholders as the release workflows. It takes a git runner from `createGitRunner()` as `git`, so that tests can replace it. Without a config file, it detects a single root project. Its optional `singleProject` settings accept `versions` (the existing version descriptors), `versionFrom` (the same selector as `--version-from`), `baseBranch`, `remote`, `changesets`, `readmeChangelog` and `changelogInsertAfter`; `tagFormat` remains a repository option. The functions `addChangeset()`, `getChangesetStatus()`, `versionChangesets()`, `tagChangesets()`, `getChangesetReleasePlan()`, `getChangesetPackages()` and `getConfiguredPackages()` do the same with the default runners, in one call.

### Logging [#logging]

`Logger` filters messages by level and passes them to a writer, like the transports of other Node.js loggers. The writer decides how messages look:

- `TextWriter` prints plain text to `stdout` and `stderr`. It's the default.
- `GitHubActionsWriter` prints [workflow commands](cli.md#github-actions-annotations-and-job-summaries), so that notices, warnings and errors with a file are annotations, and appends summaries to `GITHUB_STEP_SUMMARY`. It's the CLI's `github` log format, and the GitHub Actions pass it to their logger. Its `workspace` and `summaryPath` options default to `GITHUB_WORKSPACE` and `GITHUB_STEP_SUMMARY`.

```js
import { GitHubActionsWriter, Logger, logError } from '@wpelevator/wp-release';

const logger = new Logger( { writer: new GitHubActionsWriter(), verbose: true } );

logger.error( 'Version header is 1.2.0, expected 1.3.0.', {
	file: 'my-plugin.php',
	line: 4,
	title: 'Version mismatch',
} );
logger.summary( ( { workspace } ) => `### Checked ${ workspace }` );
```

A writer implements `LogWriter` with `write()`, `startGroup()`, `endGroup()` and `summary()`, so other CI systems can have their own format. `summary()` takes a function that builds the Markdown, which only writers with a summary call.

A `ValidationError` can list `problems`, each with a `message` and an optional `file`, `line` and `title`. `logError( logger, error, title )` logs each problem as an error on its file and line and lists them in the summary under the title, or logs the message when there are none. `VersionMismatchError` and `version-check` report the version mismatches this way.

ZIP files and metadata:

```js
import {
	createZip,
	findVersionMismatches,
	loadFileRules,
	readPackageMeta,
	resolveFileSelection,
	selectFiles,
} from '@wpelevator/wp-release';

const rules = await loadFileRules(
	resolveFileSelection( { cwd: process.cwd(), sourceDir: 'dist' } )
);
const meta = await readPackageMeta( { dir: 'dist', slug: 'my-plugin' } );

await createZip( {
	sourceDir: 'dist',
	files: await selectFiles( 'dist', rules ),
	zipPath: `my-plugin.${ meta.version }.zip`,
	rootFolder: 'my-plugin',
} );

const { mismatches } = await findVersionMismatches( {
	sourceDir: 'dist',
	meta,
	slug: 'my-plugin',
	constants: [ 'MY_PLUGIN_VERSION' ],
} );
```

Checksums:

```js
import {
	createChecksums,
	loadFileRules,
	readChecksums,
	resolveFileSelection,
	verifyChecksums,
	writeChecksums,
} from '@wpelevator/wp-release';

const rules = await loadFileRules(
	resolveFileSelection( { cwd: process.cwd(), sourceDir: 'dist' } )
);
const manifest = await createChecksums( {
	sourceDir: 'dist',
	rules,
	slug: 'my-plugin',
	version: '1.2.0',
} );

await writeChecksums( 'my-plugin.1.2.0.checksums.json', manifest );

const { valid, changed, missing, extra } = await verifyChecksums( {
	sourceDir: 'wp-content/plugins/my-plugin',
	manifest: await readChecksums( 'my-plugin.1.2.0.checksums.json' ),
	rules: await loadFileRules( {} ),
} );
```

`loadFileRules()` reads the ignore file and `--exclude` patterns into a gitignore matcher, optionally adds Git `export-ignore` paths, and `selectFiles()` lists the files it doesn't ignore. `compareChecksums()` compares two hash maps without reading any files, and `parseChecksums()` validates manifest JSON. `extractZip()` extracts a ZIP after the same checks as `deploy-svn --from-zip`.

Translations:
```js
import { extractCatalog, auditCatalog, serializePot, generatePackagePot } from '@wpelevator/wp-release';

const { catalog, diagnostics, files } = await extractCatalog( {
	sourceDir: '/project/plugin',
	options: { domain: 'my-plugin' },
} );
const findings = auditCatalog( catalog );
const pot = serializePot( catalog );
const result = await generatePackagePot( { sourceDir: '/project/plugin', check: true } );
```

Parsers return messages and structured diagnostics with stable codes, severity and source-relative locations. Catalog messages retain IDs, contexts, plurals, translations, translator comments, flags and structured references. `aggregateCatalog()` selects/merges a domain, unions references/comments and diagnoses plural conflicts. `resolveI18nPackages()` is the separate config adapter; extraction and serialization primitives know nothing about the repository. Library functions do not log, parse process arguments or set exit codes. Extraction results report unique files consulted, including the main plugin/theme file used for headers and header strings even when source globs exclude it. `parseTranslatedPo()`, `compileMo()`, `compileScriptTranslations()`, `compilePhpTranslations()` and `compileTranslations()` expose the same typed operations to library callers.
