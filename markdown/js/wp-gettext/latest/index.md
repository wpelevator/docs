# wp-gettext

Extract translatable strings from WordPress sources, write POT files, compile PO files to MO, JSON and PHP, and audit catalogs.

Extract translatable strings from WordPress PHP, JavaScript and `block.json` sources, build catalogs, write POT files, compile translated PO files to MO, JED JSON and `.l10n.php`, and audit catalogs. It is a JavaScript alternative to `wp i18n make-pot`, `make-mo`, `make-json` and `make-php`, with no PHP, WordPress or WP-CLI needed.

## Install

```bash
npm install @wpelevator/wp-gettext
```

Requires Node.js 22.12 or later.

## Extract your first message

Save this as `example.mjs`:

```js
import { parsePhpTranslations } from '@wpelevator/wp-gettext/php';

const { messages, diagnostics } = parsePhpTranslations( {
	contents: '<?php __( "Hello", "my-plugin" );',
	file: 'my-plugin.php',
	domain: 'my-plugin',
} );
console.log( messages[ 0 ].id );
console.log( `Diagnostics: ${ diagnostics.length }` );
```

Run `node example.mjs`:

```text
Hello
Diagnostics: 0
```

## Guides

- [Sub-path exports](./entries.md)
- [Parsing a source](./parsing.md)
- [Generating a POT](./generating-pot.md)
- [Compiling translations](./compiling.md)
- [Errors](./errors.md)
- [Command line](./command-line.md)
