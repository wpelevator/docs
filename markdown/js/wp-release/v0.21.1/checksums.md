# Write a checksums manifest

List every shipped file with its MD5 and SHA-256 hash, in the format of the WordPress.org checksums API.

A checksums manifest lists every file of a release with its hash. [`verify`](verify.md) uses it to prove that a ZIP, a directory or an installed plugin is unchanged. The easiest way to write one is to build it with the ZIP:

```sh
npx @wpelevator/wp-release zip --checksums
```

```text
/home/me/my-plugin/my-plugin.1.4.2.zip
/home/me/my-plugin/my-plugin.1.4.2.checksums.json
```

The manifest has the format of the WordPress.org plugin checksums API:

```json
{
	"plugin": "my-plugin",
	"version": "1.4.2",
	"files": {
		".distignore": {
			"md5": "<md5>",
			"sha256": "<sha256>"
		},
		"includes/class-thing.php": {
			"md5": "<md5>",
			"sha256": "<sha256>"
		},
		"my-plugin.php": {
			"md5": "<md5>",
			"sha256": "<sha256>"
		},
		"readme.txt": {
			"md5": "<md5>",
			"sha256": "<sha256>"
		}
	}
}
```

The standalone `checksums` command writes the same manifest for a directory without building a ZIP. The [`wp-release-checksums`](https://github.com/wpelevator/wp-release-checksums) GitHub Action runs it.

## The manifest

`checksums` writes a manifest with the MD5 and SHA-256 hash of every selected file, in the format of the WordPress.org plugin checksums API (`https://downloads.wordpress.org/plugin-checksums/{slug}/{version}.json`). Paths are relative to the plugin or theme folder, sorted, and use forward slashes:

```json
{
	"plugin": "my-plugin",
	"version": "1.2.0",
	"files": {
		"my-plugin.php": {
			"md5": "…",
			"sha256": "…"
		}
	}
}
```

Themes use a `theme` key instead of `plugin`, and the version is left out when it's unknown. The manifest is named `{slug}.{version}.checksums.json` after `--filename-format`, the same name as the ZIP with `.checksums.json` instead of `.zip`, so the two are published side by side; `--output <file>` writes it elsewhere. A manifest written inside `<source-dir>` is never listed in itself.

```bash
# Hash the build that is zipped and deployed
wp-release checksums dist --version 1.2.0
```

Because the manifest lists the files and not the ZIP, it stays valid for any copy of the same files: the GitHub release ZIP, the ZIP that WordPress.org builds from SVN, or an installed plugin on a site.

## Filenames, embedding and signing

`--checksums-file <file>` enables checksums and sets a relative filename independently of the ZIP name. Without `--embed-checksums`, it resolves against the ZIP output directory; with embedding, it resolves against the package root inside the ZIP (the archive root with `--no-root-folder`). Nested paths are supported, but absolute paths, backslashes, drive letters, control characters and dot segments are rejected. Embedding emits no external manifest and never modifies the source directory. Embedded minisign signatures contain a signing timestamp, so ZIP bytes can differ across signing times; unsigned metadata and WordPress/SSH signatures remain deterministic. Selected source files must not collide with generated manifest or signature entries.

```bash
# External manifest beside releases/my-plugin.1.5.1.zip.
wp-release zip dist --output releases/my-plugin.1.5.1.zip --checksums-file checksums.json --sign-checksums

# Signed manifest inside the package, with a stable filename.
wp-release zip dist --output releases/my-plugin.1.5.1.zip --checksums-file checksums.json --embed-checksums --sign-checksums

# Sign the completed downloadable archive separately.
wp-release sign releases/my-plugin.1.5.1.zip

# Verify installed files or an archive using its embedded manifest.
wp-release verify installed-plugin --public-key "$PUBLIC_KEY"
wp-release verify --zip releases/my-plugin.1.5.1.zip --public-key "$PUBLIC_KEY"
```

`--sign-checksums` enables checksums and signs only the manifest, before embedding when requested. It reads `WP_RELEASE_SIGNING_KEY` and uses `--sign-format wordpress,minisign,ssh` to select formats; each signature travels with the manifest. `--sign-format` selects formats for explicitly requested signing targets and never enables signing. `--sign` signs only the final ZIP; `--sign-checksums` controls the manifest in either placement mode. Use both flags to sign both targets. `--force` permits replacing external output files and signatures. `--json` reports external manifests in `checksumsPath`, embedded package-relative paths in `checksumsEmbedded`, and manifest signatures in `checksumsSignatures`.

The default WordPress filename remains the ZIP basename with `.checksums.json` instead of `.zip`, in either placement mode. Choose `--checksums-file checksums.json` for a stable name. The version remains in the JSON content.

## Formats

`--checksums-format` chooses the manifest format. `wordpress-json` (default) uses the WordPress-compatible structure shown above. `sha256sum` uses GNU-compatible SHA-256 lines and escaping, with `SHA256SUMS` as its default filename. It carries no package identity or version, and standard `sha256sum --check` checks listed files without rejecting additional files; `wp-release verify` also checks for extra files.

```bash
wp-release zip dist --embed-checksums --checksums-format sha256sum --sign-checksums --sign-format minisign
wp-release verify --zip my-plugin.1.5.1.zip --checksums-format sha256sum --public-key "$MINISIGN_PUBLIC_KEY" --signature-format minisign
# From the extracted package directory:
minisign -Vm SHA256SUMS -P "$MINISIGN_PUBLIC_KEY"
sha256sum --check SHA256SUMS
```

`--checksums-algorithms md5,sha256` selects JSON digest fields; lists replace configured lists. Supported algorithms are MD5 (for compatibility) and SHA-256. The `sha256sum` codec requires SHA-256. The standalone `checksums` command also accepts `--checksums-format`, keeping `--output` relative to the working directory.

## Configuration and custom codecs

The optional top-level `integrity` configuration maps to these flags. Explicit CLI values override configuration; `--no-embed-checksums` and `--no-sign-checksums` disable their configured behaviors. Existing release configurations retain their `packages` array; use `packages: []` for a configuration containing only integrity settings.

```js
export default {
  packages: [],
  integrity: {
    codec: 'wordpress-json', // --checksums-format
    algorithms: ['md5', 'sha256'], // --checksums-algorithms
    file: 'checksums.json', // --checksums-file
    embed: true, // --embed-checksums
    sign: { formats: ['wordpress'] }, // --sign-checksums and --sign-format
  },
};
```

Use `codec: 'sha256sum'`, `algorithms: ['sha256']`, `file: 'SHA256SUMS'` and `sign: { formats: ['minisign'] }` for the GNU setup. Custom codecs provide `id`, a default `filename`, and `encode`/`decode` callbacks, which may be asynchronous. Generation validates the round trip before writing artifacts: codecs must preserve all selected file paths, represented digests and any represented package identity. They receive and return the existing WordPress-compatible `ChecksumsManifest` model (`plugin` or `theme`, optional `version`, and a `files` map of relative paths to digest fields), keeping format customization separate from selection, hashing and signing.

```js
export default {
  packages: [],
  integrity: {
    file: 'metadata/integrity.json',
    embed: true,
    sign: { formats: ['wordpress'] },
    codec: {
      id: 'custom-v1',
      filename: 'integrity.json',
      encode(manifest) {
        return Buffer.from(JSON.stringify({ schema: 'custom-v1', payload: manifest }) + '\n');
      },
      decode(bytes) {
        const document = JSON.parse(Buffer.from(bytes).toString('utf8'));
        if (document.schema !== 'custom-v1') {
          throw new Error('Unknown integrity schema.');
        }
        return document.payload;
      },
    },
  },
};
```

`zip` and `checksums` read the caller's release configuration. For verification of custom codecs or configured filenames, pass `--config wp-release.config.mjs` explicitly. See [Verify](verify.md).

## Manifest inside the plugin

For a manifest that is also published as a separate release asset or deployed directly from a source directory, write and sign it in that directory before packaging. Use `zip --embed-checksums` as described [above](#filenames-embedding-and-signing) when only the archive should contain the generated metadata. The source-directory workflow uses the same manifest for installed copies and release assets:

```bash
wp-release checksums build --slug my-plugin --output build/checksums.json
wp-release sign build/checksums.json
wp-release zip build --slug my-plugin
wp-release deploy svn build --trunk --svn-tag 1.2.0
```

- Write the manifest into the directory that is zipped and deployed. The `checksums` command leaves its output manifest and its signatures (`<name>.sig`, `<name>.minisig` and `<name>.sshsig`) out of the hashes, so running it again with the same output path and `--force` gives the same manifest. `verify` checks matching copies as described below. Sign it last, since the signature covers the exact bytes of the manifest.
- `zip` and `deploy svn` carry the pair like any other file. Don't use `zip --checksums` here, since it would write a second manifest that lists the first one. Attach `build/checksums.json` and `build/checksums.json.sig` to the GitHub release as they are.
- The signature covers file hashes and not a ZIP, so it stays valid for the ZIP that WordPress.org builds from SVN. Check what WordPress.org serves after a deploy, with the manifest and public key from your build:

  ```bash
  wp-release verify --zip https://downloads.wordpress.org/plugin/my-plugin.1.2.0.zip \
    --checksums build/checksums.json --public-key "$PUBLIC_KEY"
  ```

- The manifest can have any name and location, for example `--output build/includes/signatures/checksums.json`, and missing folders are created. Tell `verify` where the shipped copy is with `--embedded <path>`, like `--embedded includes/signatures/checksums.json`. Both the `--checksums` file and its signature must then exist, both copies must be shipped, and they're skipped when comparing files and must be identical to the originals. The manifest can't list the embedded path. Without `--embedded`, `verify` looks for the manifest name at the root, and skips a file only when it exists, the matching original exists and the manifest doesn't list it. Otherwise it's checked like any other file, so a listed file that has the name of the manifest can't be deleted unnoticed, and a shipped `.sig` without an original is reported as not in the checksums.

The public key has to come from somewhere other than the plugin that it checks, because someone who can overwrite the plugin files can also replace a key and a signature inside them. A copy of the manifest also doesn't prevent a downgrade to an older release that was signed too, so the installing side has to enforce a minimum version.
