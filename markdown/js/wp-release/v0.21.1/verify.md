# Verify a ZIP or directory

Check a ZIP, a build directory or an installed plugin against a checksums manifest, and name every changed, missing and extra file.

`verify` compares the files of a ZIP or a directory with a [checksums manifest](checksums.md). It works on a ZIP that you built, one that you downloaded and the one that WordPress.org builds for a release.

```sh
npx @wpelevator/wp-release verify --zip my-plugin.1.4.2.zip --checksums my-plugin.1.4.2.checksums.json
```

```text
4 files match, 0 changed, 0 missing and 0 extra.
```

If someone adds or edits a file, the command exits with `2` and names it:

```text
Error: Not in the checksums: evil.php
4 files match, 0 changed, 0 missing and 1 extra.
```

A manifest proves only that the files match the manifest. Add `--public-key` to check its [signature](signing.md) first.

## How it checks

`verify` checks a directory against a manifest from `checksums` or from the WordPress.org checksums API, and reports every changed, missing and extra file. It exits with `2` unless all files match:

```bash
wp-release verify wp-content/plugins/my-plugin --checksums my-plugin.1.2.0.checksums.json
```

- A file matches when its SHA-256 equals the manifest. Manifests without SHA-256 fall back to MD5, and a hash can also be a list of accepted values.
- `verify` doesn't read `.distignore`, so that an ignore file inside the checked directory can't hide added files. `--exclude <patterns>` skips paths in both the directory and the manifest, for files that aren't part of the release, such as caches.
- Manifest paths outside the package folder (absolute or with `..`) are rejected.
- `--zip <file|url>` checks the files of a ZIP instead of a directory. The ZIP can be a URL, such as the one that WordPress.org builds for a release, and its single root folder is found automatically (or set `--root-folder`). The ZIP is extracted to a temporary directory after the same safety checks as `deploy svn --from-zip`.
- The version in the manifest must match the `Version` header of the checked files, so that an older release with its own valid manifest can't pass as a newer one.
- A manifest can't list itself. A copy of the manifest and of its signature inside the checked files, at the root with the same names as the `--checksums` file or at the path of `--embedded`, is skipped when comparing files, but it must be identical to the `--checksums` file and its signature. The signature is the `.sig` file, or the file of `--signature-format`. A path that the manifest lists is never skipped, and a file that isn't a matching copy is reported as not in the checksums. See [Manifest inside the plugin](checksums.md#manifest-inside-the-plugin).

A checksums manifest proves only that the files match the manifest. With `--public-key <key>`, `verify` first checks `<checksums>.sig` against the Ed25519 public key and fails with exit code `2` before comparing any file when the signature is missing or invalid, so that the manifest itself can be trusted. `--signature-format minisign` or `ssh` checks `<checksums>.minisig` or `<checksums>.sshsig` instead. The key can be the base64 key, the minisign public key or the `ssh-ed25519` public key, since they're forms of the same key. See [Sign](signing.md).

Verification never executes configuration from inside a downloaded package. Without `--checksums`, `verify` reads the embedded filename selected by `--checksums-file`, explicit configuration, or the codec default. For a versioned embedded filename, pass that filename explicitly. With a public key, signatures are checked before decoding; the selected signature format must exist (WordPress `.sig` by default; pass `--signature-format minisign` or `ssh` for those formats), and all other present supported signature formats are also authenticated when verifying the embedded manifest. Without a public key, checksums detect changes but do not authenticate the publisher. Trusted public keys must come from outside the package.
