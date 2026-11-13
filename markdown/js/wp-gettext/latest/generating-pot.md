# Generating a POT

```js
import { generatePackagePot } from '@wpelevator/wp-gettext/generate';

const result = await generatePackagePot( {
	sourceDir: '/project/my-plugin',
	meta: {
		type: 'plugin',
		mainFile: 'my-plugin.php',
		headers: {
			'Plugin Name': 'My Plugin',
			'Text Domain': 'my-plugin',
			'Domain Path': '/languages',
		},
		version: '1.2.0',
	},
	check: true,
} );
```

The package doesn't read plugin and theme headers. Pass the headers of the main file as `meta`, read with your own parser or with the package metadata reader of [`@wpelevator/wp-release`](https://www.npmjs.com/package/@wpelevator/wp-release). They set the text domain (`Text Domain`, then the directory name), the default destination (`Domain Path`, then `languages`), the `Project-Id-Version` header, and the header strings of the main file that are added to the POT first. Without `meta` the directory has no header strings.

The POT is replaced atomically, only after a successful extraction. With `check: true` it's compared with the existing file and not written.
