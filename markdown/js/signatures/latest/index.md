# signatures

Generate Ed25519 keys, sign files and verify signatures in the WordPress, minisign and OpenSSH formats.

Generate Ed25519 keys, sign files and verify signatures in three formats that share one key: the detached signature that WordPress core's `verify_file_signature()` checks, [minisign](https://jedisct1.github.io/minisign/) and OpenSSH (`ssh-keygen -Y sign`). It uses only `node:crypto`, with no runtime dependencies.

## Install

```bash
npm install @wpelevator/signatures
```

Requires Node.js 22.12 or later.

## Sign and verify bytes

Save this as `example.mjs`:

```js
import { generateSigningKeyPair, parsePublicKey, parseSigningKey, signBytes, verifyBytes } from '@wpelevator/signatures';

const { privateKey, publicKey } = generateSigningKeyPair();
const data = Buffer.from( 'hello' );
const signature = signBytes( data, parseSigningKey( privateKey ) );
console.log( verifyBytes( data, signature, parsePublicKey( publicKey ) ) );
```

Run `node example.mjs`:

```text
true
```

This generates a disposable key for the example. Keep a release signing key secret and store it securely instead of generating a new one for each verification.

## Guides

- [Formats](./formats.md)
- [Usage](./usage.md)
- [Command line](./command-line.md)
