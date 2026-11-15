# checksums

Hash bytes and files, and write, read and verify checksum manifests in the sha256sum and WordPress.org formats.

Hash bytes and files, write and read checksum manifests in the `sha256sum` text format or the JSON format of the WordPress.org plugin checksums API, and compare them with the files. It uses only `node:crypto` and `node:fs`, with no runtime dependencies.

## Install

```bash
npm install @wpelevator/checksums
```

Requires Node.js 22.12 or later.

## Guides

- [Hashing](./hashing.md)
- [Manifests](./manifests.md)
- [Formats](./formats.md)
- [Comparing and verifying](./verifying.md)
- [Errors](./errors.md)
