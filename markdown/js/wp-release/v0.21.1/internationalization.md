# Extract a POT file

Extract the translatable strings of a plugin or theme into a reproducible POT file, and audit them, with Node.js alone.

`i18n pot` reads the PHP, JavaScript, `block.json` and `theme.json` files of a plugin or theme and writes a POT file. It needs no PHP, WordPress installation, WP-CLI or network.

```sh
npx @wpelevator/wp-release i18n pot .
```

```text
/home/me/my-plugin: 3 messages, 2 files.
```

The POT lists the plugin header strings first, then the strings of the source files in order. There are no dates, so the file changes only when the strings change:

```text
msgid ""
msgstr ""
"Project-Id-Version: My Plugin 1.5.0\n"
"Report-Msgid-Bugs-To: \n"
"Last-Translator: \n"
"Language-Team: \n"
"MIME-Version: 1.0\n"
"Content-Type: text/plain; charset=UTF-8\n"
"Content-Transfer-Encoding: 8bit\n"
"POT-Creation-Date: \n"
"PO-Revision-Date: \n"
"X-Domain: my-plugin\n"

#. Plugin Name of the plugin
#: my-plugin.php:3
msgid "My Plugin"
msgstr ""

#: my-plugin.php:11
msgid "Save changes"
msgstr ""

#: my-plugin.php:12
#, php-format
msgid "%d item"
msgid_plural "%d items"
msgstr[0] ""
msgstr[1] ""
```

`--check` fails when the POT is missing or stale, so CI can enforce it:

```sh
npx @wpelevator/wp-release i18n pot . --check
```

`i18n audit` reads the same source and reports problems without writing files:

```sh
npx @wpelevator/wp-release i18n audit .
```

```text
Warning: Add a translators: comment explaining the placeholders. Message: "%d item"
/home/me/my-plugin: 3 messages, 2 files.
```

To turn a translated PO file into the files WordPress loads, see [Compile translations](compile-translations.md).

## Choose what to extract

`i18n pot` extracts plugin/theme strings and writes a reproducible UTF-8 POT. `i18n audit` reads the same source and returns findings without writing files. Both run with Node alone: no PHP, WordPress installation, database, WP-CLI or network requests. Extraction is independent of `files`, `.distignore` and Git `export-ignore` distribution rules.

```sh
wp-release i18n pot .
wp-release i18n pot --package plugins/agent-pilot
wp-release i18n pot --all
wp-release i18n pot --package plugins/agent-pilot --check
wp-release i18n audit --package plugins/agent-pilot --json
wp-release i18n audit . --strict --suppress conflicting-comments
```

Config-free source directories must have plugin/theme headers. The actual main file is discovered using the package metadata reader, including plugins whose main filename differs from their slug. The selected domain defaults to `Text Domain`, then the directory name. Calls with omitted domains belong to WordPress's `default` domain; block metadata without a domain inherits the package domain. `--all-domains` explicitly combines domains. A block's explicit `textdomain` always controls its messages.

`--package` selects one configured package and permits extraction-specific overrides; `--all` requires configuration and selects enabled WordPress packages only. Source directories, package selectors and `--all` are mutually exclusive. Config-free directory mode reads only its explicit options and metadata; it does not import repository config implicitly. A disabled package fails when explicitly selected. Configuration uses `i18n` at the root and on package entries, including an exact `glob` for an individual package, following the existing group model. Package entries remain non-overlapping; there is no additional package manifest configuration source.

## Configure extraction

```js
export default defineConfig( {
	root: 'packages',
	i18n: {
		headers: { 'Report-Msgid-Bugs-To': 'https://example.org/issues' },
		fileComment: `Copyright (C) Example Company
This file is distributed under the same license as the Example plugin.`,
	},
	packages: [ {
		glob: 'plugins/*',
		i18n: {
			include: [ '**/*.{php,js,jsx,ts,tsx,mjs,cjs}', '**/block.json', '**/theme.json' ],
			exclude: [ '**/node_modules/**', '**/vendor/**', '**/tests/**', '**/build/**' ],
			destination: 'languages',
			strict: false,
		},
	} ],
} );
```

Precedence is defaults, root configuration, package group/individual entry, then explicit command options. Scalars override, lists replace inherited lists, and gettext headers merge by key, case-insensitively, preserving intentionally empty values. A header set to `false` is removed, like `'Project-Id-Version': false` to keep the plugin version out of the POT so that it changes only when strings change; a later layer can set it again. `Content-Type` can't be removed, since it declares the UTF-8 charset. Options include `enabled`, `domain`, `allDomains`, `include`, `exclude`, `destination`, `headers`, `fileComment`, `location`, `strict`, `legacyGlobals` and audit `suppress`. `fileComment` adds static text above the POT header; each line is emitted as a gettext comment, and no copyright year is generated. The CLI accepts the same setting with `--file-comment`. Repeat `--include` or `--exclude` for multiple globs; these use case-sensitive [minimatch](https://github.com/isaacs/minimatch) semantics with `/` paths, `**`, brace expansion and dotfile matching, without gitignore negation or comma splitting. Default excludes cover dependency directories, dot directories, tests, minified files and generated translations. Source/build exclusions are a repository choice; this repository excludes `build`, `tools` and isolated vendors in its config.

## Where the POT is written

The default output is `<Domain Path>/<text-domain>.pot`, or `languages/<text-domain>.pot`. A leading `/` in `Domain Path` is package-relative, and configured destinations cannot escape the package. `--destination` changes the package-relative directory. An explicit `--output <file.pot>` resolves against the command's working directory and requires one package. All multi-package destinations are validated before writing; each completed package replaces its file atomically, independently of other packages. `--check` compares bytes without writing and fails if the POT is absent or stale. Source references are preserved by default as `file:line`. `--add-location file` keeps only the file name, so that editing a source file doesn't change the POT unless its strings change, and `--no-location` (the same as `--add-location never`) omits them; `--add-location full` is the default. In configuration, set `location` to `'full'`, `'file'` or `'never'`. The older `--no-references` flag and `references: false` option still work as `--no-location`, and an explicit `location` wins over `references` in the same layer. Asking for locations and for none in the same command is an error. `POT-Creation-Date` and `PO-Revision-Date` default to empty values; no current date or year is inserted. Name/version headers come from metadata, and `--header NAME=VALUE` overrides any default, including with an empty value, and `--header NAME` removes the header. The POT lists the plugin or theme header strings first, then the strings of PHP, JavaScript, `block.json` and other metadata files in source order, so related strings stay together for translators. Each entry has its extracted comments, references and flags before the strings, in the usual gettext layout. The default headers come in a fixed order, and custom headers follow them. No generator header or generated copyright comment is added; set `fileComment` for a static one.

## Supported syntax

PHP extraction uses `php-parser` in PHP 8.3 mode, tested with attributes, enums, match expressions, promoted properties and readonly classes. Supported WordPress functions are `__`, `_e`, `_x`, `_ex`, `_n`, `_nx`, `_n_noop`, `_nx_noop`, `esc_attr__`, `esc_attr_e`, `esc_attr_x`, `esc_html__`, `esc_html_e` and `esc_html_x`. Global and explicitly global calls, namespace fallback and explicit function imports/aliases are supported. Known file-local declarations and unrelated namespaced imports are excluded; methods and static methods are never translation calls. Named arguments resolve by PHP parameter name. Literal strings, static concatenation and non-interpolated heredoc/nowdoc preserve decoded escapes, Unicode and newlines. Counts may be dynamic; IDs, contexts and selected domains must be static.

JavaScript extraction uses Babel's parser and lexical scope traversal, without transforms or project Babel config. JS, JSX, TS, TSX, MJS, CJS, MTS and CTS are supported. Named imports/aliases and namespace imports from `@wordpress/i18n`, unshadowed `wp.i18n` calls and unbound canonical legacy `__`, `_x`, `_n` and `_nx` calls extract strings. `--no-legacy-globals` requires imported or `wp.i18n` bindings. Locally shadowed/reassigned imports are excluded. Static literals, templates without substitutions, concatenation and TypeScript assertions are supported. Destructured CommonJS imports, transpiled `(0, i18n.__)` forms and arbitrary minified bundles are outside the supported syntax; scan source and use explicit source/build mapping for compiled JSON.

A `translators:` comment attaches to the first translation call whose containing expression or nearest statement immediately follows it. Whitespace, parsed comments and ternary branch punctuation may intervene, but unrelated statements or argument expressions may not. Comments before outer wrappers reach nested translation calls; a comment is consumed once, so unrelated sibling calls do not inherit it. Multiline comment content is preserved. WordPress plugin/theme header labels serialize as extracted comments. Bundled metadata tables follow [WordPress 6.8 block fields](https://github.com/WordPress/wordpress-develop/blob/6.8/src/wp-includes/block-i18n.json) and [theme fields](https://github.com/WordPress/wordpress-develop/blob/6.8/src/wp-includes/theme-i18n.json), including styles, variations, presets, template names and nested block settings. Their upstream data license is GPL-2.0-or-later; tables are maintained intentionally with fixtures and never fetched during generation.

## Errors and audit findings

Invalid syntax, unreadable selected files, selected source symlinks, empty/reserved message IDs, conflicting plural definitions and output errors fail generation. Unsupported dynamic arguments warn and are fatal with `--strict`. Audit adds `placeholder-comment`, `unordered-placeholders`, `plural-placeholders`, `empty-message` and `conflicting-comments` findings; suppress these explicitly by code where justified. Placeholders support `%%`, positional indexes, numeric width/precision, padding/flags and PHP/JS sprintf conversion types. Audit checks extraction and message quality, not every untranslated user-facing string. Audit fails on errors; strict audit also fails on warnings. Failed checks return exit code `2`; unexpected I/O/option-loading errors follow the existing CLI error handling. `--json`, GitHub annotations, summaries and step outputs use the existing CLI reporting facilities.
