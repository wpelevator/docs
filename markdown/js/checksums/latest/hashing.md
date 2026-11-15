# Hashing

```js
import { hashBytes, hashFile, hashFiles, hashStream } from '@wpelevator/checksums';

hashBytes( 'abc' ); // { md5: '9001…', sha256: 'ba78…' }
await hashStream( createReadStream( 'my-plugin.php' ) );
await hashFile( 'my-plugin.php' );
await hashFiles( 'dist', [ 'my-plugin.php', 'readme.txt' ] ); // { 'my-plugin.php': { md5, sha256 }, … }
```

Every function gives the MD5 and the SHA-256 hex digests in a single pass. MD5 is there for compatibility with the WordPress.org format. `hashFiles()` reads one file at a time, so that a large plugin doesn't run out of file descriptors.
