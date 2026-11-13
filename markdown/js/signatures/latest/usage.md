# Usage

```js
import {
	generateSigningKeyPair,
	parsePublicKey,
	parseSigningKey,
	signBytes,
	signFiles,
	verifyBytes,
} from '@wpelevator/signatures';

const { privateKey, publicKey, publicKeys } = generateSigningKeyPair();

// Bytes first: no files are read.
const data = Buffer.from( 'hello' );
const signature = signBytes( data, parseSigningKey( privateKey ) );
verifyBytes( data, signature, parsePublicKey( publicKey ) ); // true

// Files: writes <file>.sig, <file>.minisig and <file>.sshsig next to each file.
await signFiles( {
	paths: [ '/path/to/plugin.zip' ],
	formats: [ 'wordpress', 'minisign', 'ssh' ],
	key: privateKey,
} );
```

The core functions take bytes and strings: `signBytes()`, `verifyBytes()`, `signMinisignBytes()`, `verifyMinisignBytes()`, `signSshBytes()` and `verifySshBytes()`. `signFile()`, `writeSignature()`, `signFiles()`, `verifyFileSignature()` and the other functions with paths are wrappers that read and write files.

`signFiles()` reads the key from `input.key`, or from the environment variable named by `input.keyEnv`, which is `SIGNING_KEY` by default. Pass `keyEnv` to use another variable. The key is a base64 32-byte seed or a 64-byte libsodium secret key.

Verification returns `false` for a signature that doesn't match. Invalid input throws a `SigningError` with a Node.js style `code`: `ERR_INVALID_SIGNING_KEY`, `ERR_INVALID_PUBLIC_KEY`, `ERR_MISSING_SIGNING_KEY`, `ERR_SIGNATURE_EXISTS`, `ERR_NOT_A_FILE` or `ERR_KEY_EXPORT`. Use `isSignatureError( error )` instead of `instanceof`, which fails when two copies of the package are installed.
