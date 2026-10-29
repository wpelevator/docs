# Internationalization (/js/wp-release/latest/internationalization)

### WordPress internationalization [#wordpress-internationalization]

`i18n-pot` extracts plugin/theme strings and writes a reproducible UTF-8 POT. `i18n-audit` reads the same source and returns findings without writing files. Both run with Node alone: no PHP, WordPress installation, database, WP-CLI or network requests. Extraction is independent of `files`, `.distignore` and Git `export-ignore` distribution rules.

```sh
wp-release i18n-pot .
wp-release i18n-pot --package plugins/agent-pilot
wp-release i18n-pot --all
wp-release i18n-pot --package plugins/agent-pilot --check
wp-release i18n-audit --package plugins/agent-pilot --json
wp-release i18n-audit . --strict --suppress conflicting-comments
```

Config-free source directories must have plugin/theme headers. The actual main file is discovered using the package metadata reader, including plugins whose main filename differs from their slug. The selected domain defaults to `Text Domain`, then the directory name. Calls with omitted domains belong to WordPress's `default` domain; block metadata without a domain inherits the package domain. `--all-domains` explicitly combines domains. A block's explicit `textdomain` always controls its messages.

`--package` selects one configured package and permits extraction-specific overrides; `--all` requires configuration and selects enabled WordPress packages only. Source directories, package selectors and `--all` are mutually exclusive. Config-free directory mode reads only its explicit options and metadata; it does not import repository config implicitly. A disabled package fails when explicitly selected. Configuration uses `i18n` at the root and on package entries, including an exact `glob` for an individual package, following the existing group model. Package entries remain non-overlapping; there is no additional package manifest configuration source.

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

Precedence is defaults, root configuration, package group/individual entry, then explicit command options. Scalars override, lists replace inherited lists, and gettext headers merge by key, case-insensitively, preserving intentionally empty values. A header set to `false` is removed, like `'Project-Id-Version': false` to keep the plugin version out of the POT so that it changes only when strings change; a later layer can set it again. `Content-Type` can't be removed, since it declares the UTF-8 charset. Options include `enabled`, `domain`, `allDomains`, `include`, `exclude`, `destination`, `headers`, `fileComment`, `references`, `strict`, `legacyGlobals` and audit `suppress`. `fileComment` adds static text above the POT header; each line is emitted as a gettext comment, and no copyright year is generated. The CLI accepts the same setting with `--file-comment`. Repeat `--include` or `--exclude` for multiple globs; these use case-sensitive [minimatch](https://github.com/isaacs/minimatch) semantics with `/` paths, `**`, brace expansion and dotfile matching, without gitignore negation or comma splitting. Default excludes cover dependency directories, dot directories, tests, minified files and generated translations. Source/build exclusions are a repository choice; this repository excludes `build`, `tools` and isolated vendors in its config.

The default output is `<Domain Path>/<text-domain>.pot`, or `languages/<text-domain>.pot`. A leading `/` in `Domain Path` is package-relative, and configured destinations cannot escape the package. `--destination` changes the package-relative directory. An explicit `--output <file.pot>` resolves against the command's working directory and requires one package. All multi-package destinations are validated before writing; each completed package replaces its file atomically, independently of other packages. `--check` compares bytes without writing and fails if the POT is absent or stale. Source references are preserved by default; `--no-references` omits them. `POT-Creation-Date` and `PO-Revision-Date` default to empty values; no current date or year is inserted. Name/version headers come from metadata, and `--header NAME=VALUE` overrides any default, including with an empty value, and `--header NAME` removes the header. The POT lists the plugin or theme header strings first, then the strings of PHP, JavaScript, `block.json` and other metadata files in source order, so related strings stay together for translators. Each entry has its extracted comments, references and flags before the strings, in the usual gettext layout. The default headers come in a fixed order, and custom headers follow them. No generator header or generated copyright comment is added; set `fileComment` for a static one.

#### Supported extraction syntax [#supported-extraction-syntax]

PHP extraction uses `php-parser` in PHP 8.3 mode, tested with attributes, enums, match expressions, promoted properties and readonly classes. Supported WordPress functions are `__`, `_e`, `_x`, `_ex`, `_n`, `_nx`, `_n_noop`, `_nx_noop`, `esc_attr__`, `esc_attr_e`, `esc_attr_x`, `esc_html__`, `esc_html_e` and `esc_html_x`. Global and explicitly global calls, namespace fallback and explicit function imports/aliases are supported. Known file-local declarations and unrelated namespaced imports are excluded; methods and static methods are never translation calls. Named arguments resolve by PHP parameter name. Literal strings, static concatenation and non-interpolated heredoc/nowdoc preserve decoded escapes, Unicode and newlines. Counts may be dynamic; IDs, contexts and selected domains must be static.

JavaScript extraction uses Babel's parser and lexical scope traversal, without transforms or project Babel config. JS, JSX, TS, TSX, MJS, CJS, MTS and CTS are supported. Named imports/aliases and namespace imports from `@wordpress/i18n`, unshadowed `wp.i18n` calls and unbound canonical legacy `__`, `_x`, `_n` and `_nx` calls extract strings. `--no-legacy-globals` requires imported or `wp.i18n` bindings. Locally shadowed/reassigned imports are excluded. Static literals, templates without substitutions, concatenation and TypeScript assertions are supported. Destructured CommonJS imports, transpiled `(0, i18n.__)` forms and arbitrary minified bundles are outside the supported syntax; scan source and use explicit source/build mapping for compiled JSON.

A `translators:` comment attaches to the first translation call whose containing expression or nearest statement immediately follows it. Whitespace, parsed comments and ternary branch punctuation may intervene, but unrelated statements or argument expressions may not. Comments before outer wrappers reach nested translation calls; a comment is consumed once, so unrelated sibling calls do not inherit it. Multiline comment content is preserved. WordPress plugin/theme header labels serialize as extracted comments. Bundled metadata tables follow [WordPress 6.8 block fields](https://github.com/WordPress/wordpress-develop/blob/6.8/src/wp-includes/block-i18n.json) and [theme fields](https://github.com/WordPress/wordpress-develop/blob/6.8/src/wp-includes/theme-i18n.json), including styles, variations, presets, template names and nested block settings. Their upstream data license is GPL-2.0-or-later; tables are maintained intentionally with fixtures and never fetched during generation.

Invalid syntax, unreadable selected files, selected source symlinks, empty/reserved message IDs, conflicting plural definitions and output errors fail generation. Unsupported dynamic arguments warn and are fatal with `--strict`. Audit adds `placeholder-comment`, `unordered-placeholders`, `plural-placeholders`, `empty-message` and `conflicting-comments` findings; suppress these explicitly by code where justified. Placeholders support `%%`, positional indexes, numeric width/precision, padding/flags and PHP/JS sprintf conversion types. Audit checks extraction and message quality, not every untranslated user-facing string. Audit fails on errors; strict audit also fails on warnings. Failed checks return exit code `2`; unexpected I/O/option-loading errors follow the existing CLI error handling. `--json`, GitHub annotations, summaries and step outputs use the existing CLI reporting facilities.

#### Compile translated catalogs [#compile-translated-catalogs]

Runtime formats require a translated PO, not an untranslated POT. PO updating, fuzzy matching and automatic translation are not provided. Compilation validates `Language` and `Plural-Forms`, excludes fuzzy, obsolete and untranslated entries, preserves contexts and plural forms, and never changes the input PO. An incompletely translated plural entry is excluded as a unit. Gettext parsing handles source encoding; runtime outputs use UTF-8. Each output is replaced atomically; JSON outputs are independent writes, and obsolete output files are not deleted automatically.

```sh
wp-release i18n-mo languages/my-plugin-lv.po
wp-release i18n-php languages/my-plugin-lv.po
wp-release i18n-json languages/my-plugin-lv.po --domain my-plugin --map scripts.json --output languages
wp-release i18n-mo languages/my-plugin-lv.po --check
```

MO and `.l10n.php` default beside the PO, with `.mo` and `.l10n.php` extensions; `--output` selects an explicit file relative to cwd. WordPress PHP catalogs require WordPress 6.5 or later. JSON requires an explicit domain; `--output` is a directory, defaulting to the PO directory. `--check` compares proposed bytes without writing and exits `2` on absent/stale outputs. Compiler commands are primitives and do not select configured packages.

A script map is a JSON object from normalized package-relative source references to arrays of normalized runtime script paths. Many source files can feed one bundle, and one source can feed several scripts. An explicit map selects only listed references; an empty target array excludes that source. Without a map, JS/MJS/CJS references use identity paths, while JSX/TypeScript references require mapping. PHP-only references do not enter JSON catalogs.

```json
{
  "src/blocks/editor.tsx": [ "build/editor.js", "build/shared.js" ],
  "src/components/panel.js": [ "build/editor.js" ]
}
```

JSON filenames are `<domain>-<Language>-<md5(runtime-path)>.json`; the WordPress `default` domain uses `<Language>-<md5(runtime-path)>.json`. WordPress's `.min.js` normalization applies consistently to grouping, hashing and the JSON `source`. Jed keys preserve context through `\u0004`, plural arrays contain all translated forms, and revision dates come from the PO metadata. `.l10n.php` writes safely escaped data arrays with NUL-separated plural translations; catalog text is never treated as executable PHP.

The extraction and compilation primitives are in the standalone [`@wpelevator/wp-gettext`](https://www.npmjs.com/package/@wpelevator/wp-gettext) package, without the repository and release tooling, and `wp-release` depends on it. See its README to use them in your own scripts.

The package can be installed and used in any WordPress plugin or theme project; repository package selection is optional, and directory mode works without a wp-release config.
