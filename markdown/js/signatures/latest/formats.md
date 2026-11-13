# Formats

| Format | Signature file | Checked by |
|---|---|---|
| `wordpress` | `<file>.sig` | WordPress core `verify_file_signature()` and libsodium |
| `minisign` | `<file>.minisig` | `minisign -V` |
| `ssh` | `<file>.sshsig` | `ssh-keygen -Y verify` with the `file` namespace |

The WordPress format is the base64 signature of the raw SHA-384 digest of the file, one signature per line, and a file is valid when any line matches so that a key rotation window can carry two signatures. The minisign format signs the BLAKE2b-512 digest and also signs the trusted comment. The SSH format uses a SHA-512 digest. A 32-byte seed, the base64 public key, the minisign public key and the `ssh-ed25519` public key are forms of the same key, and any of them verifies every format.
