# Compile translations

Compile a translated PO file into MO, script JSON and WordPress .l10n.php files, without WP-CLI or PHP.

WordPress loads compiled catalogs, not PO files. `i18n mo`, `i18n php` and `i18n json` compile a translated PO file and never change it:

```sh
npx @wpelevator/wp-release i18n mo languages/my-plugin-lv.po
```

```text
/home/me/my-plugin/languages/my-plugin-lv.mo
```

```sh
npx @wpelevator/wp-release i18n php languages/my-plugin-lv.po
```

```text
/home/me/my-plugin/languages/my-plugin-lv.l10n.php
```

Each command prints the path that it wrote. Add `--check` to compare the outputs without writing, which exits with `2` on a missing or stale file. To produce the POT that translators start from, see [Extract a POT file](internationalization.md).

## Details

Runtime formats require a translated PO, not an untranslated POT. PO updating, fuzzy matching and automatic translation are not provided. Compilation validates `Language` and `Plural-Forms`, excludes fuzzy, obsolete and untranslated entries, preserves contexts and plural forms, and never changes the input PO. An incompletely translated plural entry is excluded as a unit. Gettext parsing handles source encoding; runtime outputs use UTF-8. Each output is replaced atomically; JSON outputs are independent writes, and obsolete output files are not deleted automatically.

```sh
wp-release i18n mo languages/my-plugin-lv.po
wp-release i18n php languages/my-plugin-lv.po
wp-release i18n json languages/my-plugin-lv.po --domain my-plugin --map scripts.json --output languages
wp-release i18n mo languages/my-plugin-lv.po --check
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
