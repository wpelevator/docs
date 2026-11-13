# Sub-path exports

Every feature has its own entry, so that you only load the parsers you use. The main entry never imports the PHP or JavaScript parsers, or the PO parser.

| Entry | Exports |
|---|---|
| `@wpelevator/wp-gettext` | `GettextError`, `isGettextError()`, the catalog model and `aggregateCatalog()`, `resolveI18nOptions()` and the other option helpers, `discoverI18nFiles()`, `extractHeaderTranslations()`, `parseMetadataTranslations()` and the output path checks. |
| `@wpelevator/wp-gettext/php` | `parsePhpTranslations()`, which uses `php-parser`. |
| `@wpelevator/wp-gettext/javascript` | `parseJavascriptTranslations()`, which uses Babel. |
| `@wpelevator/wp-gettext/pot` | `serializePot()`. |
| `@wpelevator/wp-gettext/po` | `parseTranslatedPo()` and `compileMo()`. |
| `@wpelevator/wp-gettext/json` | `compileScriptTranslations()`, the JED JSON files of WordPress scripts. |
| `@wpelevator/wp-gettext/l10n-php` | `compilePhpTranslations()`, the `.l10n.php` files of WordPress 6.5 and later. |
| `@wpelevator/wp-gettext/audit` | `auditCatalog()`. |
| `@wpelevator/wp-gettext/generate` | `extractCatalog()`, `generatePackagePot()`, `resolvePotPath()` and `validatePotDestinations()`, which read a plugin or theme directory with both parsers. |
| `@wpelevator/wp-gettext/compile` | `compileTranslations()`, which compiles a PO file and writes or checks the MO, JSON or `.l10n.php` outputs. |
