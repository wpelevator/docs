# Compiling translations

```js
import { compileTranslations } from '@wpelevator/wp-gettext/compile';

await compileTranslations( { sourcePath: 'languages/my-plugin-lv.po', format: 'mo' } );
await compileTranslations( { sourcePath: 'languages/my-plugin-lv.po', format: 'php' } );
await compileTranslations( {
	sourcePath: 'languages/my-plugin-lv.po',
	format: 'json',
	domain: 'my-plugin',
	scriptMap: { 'src/editor.js': [ 'build/editor.js' ] },
} );
```

Runtime formats need a translated PO file. Fuzzy, obsolete and untranslated entries are left out, contexts and plural forms are kept, and the source PO is never changed. The in-memory functions `parseTranslatedPo()`, `compileMo()`, `compileScriptTranslations()` and `compilePhpTranslations()` work with bytes and return the file contents.
