# Sign releases

Generate an Ed25519 key, sign a ZIP and its checksums manifest, and verify the signatures with WordPress, minisign or OpenSSH.

A signature proves who published a file. Create a key once, sign the ZIP and its [checksums manifest](checksums.md) with it, and give verifiers the public key.

```sh
npx @wpelevator/wp-release keygen
```

```text
WP_RELEASE_SIGNING_KEY=<private seed>
Public key: <public key>
Minisign public key: <minisign public key>
SSH public key: <ssh public key>
Store the private seed securely; it cannot be recovered from the public key.
```

Copy the two values that you need into your shell: the private seed after `WP_RELEASE_SIGNING_KEY=`, and the line after `Public key:`. In CI, keep the seed in your secret manager or CI secrets.

```sh
export WP_RELEASE_SIGNING_KEY='<private seed>'
export PUBLIC_KEY='<public key>'
```

The ZIP and the manifest must come from the same build, so rebuild them after any change to the plugin, with `zip --checksums --force`. Then sign:

```sh
npx @wpelevator/wp-release sign my-plugin.1.4.2.zip my-plugin.1.4.2.checksums.json
```

```text
/home/me/my-plugin/my-plugin.1.4.2.zip.sig
/home/me/my-plugin/my-plugin.1.4.2.checksums.json.sig
```

`verify` checks the signature of the manifest before it compares any file:

```sh
npx @wpelevator/wp-release verify --zip my-plugin.1.4.2.zip --checksums my-plugin.1.4.2.checksums.json --public-key "$PUBLIC_KEY"
```

```text
Signature of /home/me/my-plugin/my-plugin.1.4.2.checksums.json is valid.
4 files match, 0 changed, 0 missing and 0 extra.
```

If the manifest changes after signing, even by one added space, the check fails before any file is compared:

```text
Error: /home/me/my-plugin/my-plugin.1.4.2.checksums.json.sig isn't a valid signature of /home/me/my-plugin/my-plugin.1.4.2.checksums.json for the public key.
```

## Which format do I need?

| If the signature is checked by | Use | File |
|---|---|---|
| WordPress core, an update client or `wp-release verify` | `wordpress` (default) | `<file>.sig` |
| A person who downloads the ZIP and uses minisign | `minisign` | `<file>.minisig` |
| OpenSSH 8.1 or later, for example in a CI pipeline | `ssh` | `<file>.sshsig` |

One key and one secret cover all formats. Write more than one by passing `--format`, with `--force` to replace the existing signature:

```sh
npx @wpelevator/wp-release sign my-plugin.1.4.2.zip --format wordpress,minisign,ssh --force
```

```text
/home/me/my-plugin/my-plugin.1.4.2.zip.sig
/home/me/my-plugin/my-plugin.1.4.2.zip.minisig
/home/me/my-plugin/my-plugin.1.4.2.zip.sshsig
```

## About the key

`wp-release keygen` generates the key pair. It prints the private seed once as `WP_RELEASE_SIGNING_KEY=…` and the matching public key, also as a minisign public key and an `ssh-ed25519` public key. Generate keys locally and store the private seed in your secret manager or CI secrets. Distribute the public key to verifiers. `keygen --github-output` is rejected to keep the private seed out of workflow outputs; regular and `--json` output both include the seed.

## Sign files

The [`wp-release-sign`](https://github.com/wpelevator/wp-release-sign) GitHub Action runs `sign`.

`sign` writes a detached signature next to each file, `<file>.sig`, so that downloads and installed copies can be trusted. Sign both the ZIP and the checksums manifest: the ZIP signature covers installs and updates, and the manifest signature covers the contents after unpacking and copies that weren't built by you.

```bash
WP_RELEASE_SIGNING_KEY=… wp-release sign my-plugin.1.2.0.zip my-plugin.1.2.0.checksums.json
```

- The signature is the one WordPress core's `verify_file_signature()` checks: a base64 Ed25519 signature of the raw SHA-384 digest of the file. The tests check it against `sodium_crypto_sign_verify_detached()` in PHP. A `.sig` file can hold several signatures, one per line, and a file is valid when any of them match, which allows a key rotation window.
- The key is read from the `WP_RELEASE_SIGNING_KEY` environment variable only, as a base64 32-byte Ed25519 seed or a 64-byte libsodium secret key, the formats that `sodium_crypto_sign_seed_keypair()` and the update-pilot-server package signing key take. There's no flag for it, since it would show in the process list, and it's never logged.
- `--verbose` prints the public key of the signing key in the form of each written format. `--json` returns it as `publicKey`, and in every form as `publicKeys`. Pass it to `verify --public-key` and to the plugin that checks the signatures.
- An existing signature file isn't overwritten without `--force`.
- `zip --sign` signs only the ZIP; add `--sign-checksums` to sign its manifest too. `signFiles()` signs files from a script.

## Format details

- `minisign` signs the BLAKE2b-512 digest of the file, like `minisign -S` does by default, and adds a trusted comment with the signing time and file name that a second signature covers. minisign generates a random key ID for its keys, but the key here is a plain Ed25519 seed, so wp-release derives the key ID from the public key. `wp-release verify` doesn't compare key IDs, so signatures of keys that minisign generated verify too.
- `ssh` is the armored `SSHSIG` format that `ssh-keygen -Y sign` writes, with a SHA-512 digest and the `file` namespace, so that the signature can't pass as one for commits or another namespace. It's written to `.sshsig` instead of the `.sig` of `ssh-keygen`, which the `wordpress` format uses. Put the SSH public key in an `allowed_signers` file as `<identity> ssh-ed25519 AAAA…`.
- All formats are Ed25519 signatures by the same key, so one key and one secret cover all of them. The tests check each format with `minisign`, `ssh-keygen` and libsodium, and check the signatures that `minisign` and `ssh-keygen` write with `wp-release verify`.

## Sign builds and ZIPs

| Flag | `zip` | `build` |
|---|---|---|
| `--checksums` | Generate an unsigned manifest beside the ZIP. | Generate an unsigned manifest beside the directory. |
| `--sign` | Sign only the ZIP. | Unsupported. |
| `--sign-checksums` | Generate and sign the manifest. | Generate and sign the manifest. |
| `--sign-format` | Choose formats for explicitly requested signatures. | Same; requires `--sign-checksums`. |

```sh
wp-release zip --slug code-prettify --sign --sign-checksums
wp-release build --output dist/code-prettify --sign-checksums --sign-format minisign
```

These flags deliberately replace the former implicit signing behavior: `zip --checksums --sign` now leaves the manifest unsigned, and `--sign-format` alone is rejected. Add `--sign-checksums` to sign a manifest and `--sign` to sign a ZIP. The standalone `checksums` and `sign` commands remain available for workflows that write and sign a manifest inside the source before packaging it.
