# Changelog

What changed in each release.

## 0.2.1 (2026-11-11)

- Group the wp-release commands as `changeset add|status|version|tag`, `deploy svn|git` and `i18n pot|audit|mo|json|php`, and run `changeset add` for a bare `wp-release changeset`, so that a `"changeset": "wp-release changeset"` script runs `npm run changeset`. The dashed names like `changeset-add` keep working as aliases, and `execute()` and `CommandResults` use the grouped names. ([`0bb0b18`](https://github.com/wpelevator/basement/commit/0bb0b187cc93d3dd1ea9378764e00ef0a7a32f87))

## 0.2.0 (2026-10-31)

- Choose how POT entries name their source with `--add-location <full|file|never>` and `--no-location`, or `location` in the i18n configuration. `file` writes `#: path/to/file.php` without the line number, so that editing a source file does not change the POT unless its strings change. `--no-references` and `references: false` keep working and mean `never`. ([`9a7a89b`](https://github.com/wpelevator/basement/commit/9a7a89b6b7988818a0fa82ac9e7aa15ee2e816a2))

## 0.1.0 (2026-10-29)

- Add the gettext library extracted from wp-release: extract translatable strings from PHP, JavaScript and block.json sources into POT catalogs, compile PO files to MO, JED JSON and `.l10n.php`, and audit catalogs, with a sub-path export per feature and plugin or theme headers passed in as input. ([`16bf135`](https://github.com/wpelevator/basement/commit/16bf135248f281d24e6ec41d6848e546e70dff9e))

