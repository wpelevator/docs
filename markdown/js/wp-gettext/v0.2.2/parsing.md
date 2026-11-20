# Parsing a source

```js
import { aggregateCatalog } from '@wpelevator/wp-gettext';
import { parsePhpTranslations } from '@wpelevator/wp-gettext/php';
import { serializePot } from '@wpelevator/wp-gettext/pot';

const { messages, diagnostics } = parsePhpTranslations( {
	contents: '<?php __( "Hello", "my-plugin" );',
	file: 'my-plugin.php',
	domain: 'my-plugin',
} );

const { catalog } = aggregateCatalog( messages, 'my-plugin' );
const pot = serializePot( catalog ); // A Buffer.
```

Parsers return the messages and structured diagnostics with a code, severity and source location, and never print or throw for invalid syntax.
