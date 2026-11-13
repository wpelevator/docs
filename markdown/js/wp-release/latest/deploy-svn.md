# Deploy to WordPress.org

Sync a plugin to the WordPress.org SVN repository, create the version tag and update the readme and assets in one commit.

`deploy svn` syncs a plugin to its WordPress.org SVN repository. Run it with `--dry-run` first: it checks out the repository, plans the changes and lists them, without committing. The example uses a local test repository; leave out `--svn-url` and `--slug` to use `https://plugins.svn.wordpress.org/{slug}/`.

```sh
npx @wpelevator/wp-release deploy svn --svn-url file:///home/me/svnrepo --slug my-plugin --trunk --svn-tag 1.5.0 --dry-run
```

```text
== Planned changes
Check out file:///home/me/svnrepo with trunk, tags
Stop if tags/1.5.0 already exists
Sync /home/me/my-plugin (rules from /home/me/my-plugin/.distignore) to trunk/
Copy trunk/ to tags/1.5.0
Skip the commit "Release version 1.5.0" (dry run)
Deploying version 1.5.0.
== SVN status
added       tags/1.5.0
added       tags/1.5.0/.distignore
added       tags/1.5.0/CHANGELOG.md
added       tags/1.5.0/includes
added       tags/1.5.0/includes/class-thing.php
added       tags/1.5.0/my-plugin.php
added       tags/1.5.0/readme.txt
added       trunk/.distignore
added       trunk/CHANGELOG.md
added       trunk/includes
added       trunk/includes/class-thing.php
added       trunk/my-plugin.php
added       trunk/readme.txt
Dry run, skipped committing 13 changes.
```

Without `--dry-run`, the same command commits the changes:

```text
== Planned changes
Check out file:///home/me/svnrepo with trunk, tags
Stop if tags/1.5.0 already exists
Sync /home/me/my-plugin (rules from /home/me/my-plugin/.distignore) to trunk/
Copy trunk/ to tags/1.5.0
Commit "Release version 1.5.0"
Deploying version 1.5.0.
== SVN status
added       tags/1.5.0
added       tags/1.5.0/.distignore
added       tags/1.5.0/CHANGELOG.md
added       tags/1.5.0/includes
added       tags/1.5.0/includes/class-thing.php
added       tags/1.5.0/my-plugin.php
added       tags/1.5.0/readme.txt
added       trunk/.distignore
added       trunk/CHANGELOG.md
added       trunk/includes
added       trunk/includes/class-thing.php
added       trunk/my-plugin.php
added       trunk/readme.txt
Committed revision 4.
```

Running it again stops, since a published tag never changes unless you pass `--force`:

```text
Error: tags/1.5.0 already exists in file:///home/me/svnrepo. Pass --force to replace it.
== Planned changes
Check out file:///home/me/svnrepo with trunk, tags
Stop if tags/1.5.0 already exists
Sync /home/me/my-plugin (rules from /home/me/my-plugin/.distignore) to trunk/
Copy trunk/ to tags/1.5.0
Commit "Release version 1.5.0"
Deploying version 1.5.0.
```

The [`wp-release-deploy-svn`](https://github.com/wpelevator/wp-release-deploy-svn) GitHub Action runs this command.

## Choose what to write

`deploy svn` syncs a plugin to the WordPress.org plugin SVN repository. Each SVN write is a separate flag and nothing is written unless requested. All writes go into one commit.

| Flag | Default | Writes |
|---|---|---|
| `--trunk` | off | Sync the full source directory to `trunk/` |
| `--readme-only` | off | Sync only the readme to `trunk/`, for updates between releases such as bumping `Tested up to`. Can't be combined with `--svn-tag`. |
| `--svn-tag <version>` | off | Create `tags/<version>`. With `--trunk`, the tag is a copy of the synced `trunk/`. Without it, the tag is built directly from the source files and `trunk/` is left alone, for pre-release tags. A leading `v` is stripped, so `v1.2.0` creates `tags/1.2.0`. |
| `--assets-dir <dir>` | not set | Sync this directory with banners, icons and screenshots to the SVN `assets/` directory. There's no default directory, so assets are only deployed when this is set, and it must exist. |
| `--no-assets` | | Skip the `--assets-dir` sync for one run, for example when a config always passes `--assets-dir`. |

## Typical runs

Typical runs:

```bash
# Deploy 1.2.0 to trunk and the tag, and update the assets
wp-release deploy svn dist --trunk --svn-tag 1.2.0 --assets-dir .wordpress-org

# Tag a pre-release build without touching trunk
wp-release deploy svn dist --svn-tag 1.2.0-rc.1

# Update only the readme between releases
wp-release deploy svn dist --readme-only

# Update only the assets
wp-release deploy svn --assets-dir .wordpress-org

# Deploy exactly the files of a ZIP built earlier
wp-release deploy svn --from-zip my-plugin.1.2.0.zip --trunk --svn-tag 1.2.0
```

## How a deploy works

How a deploy works:

1. The options are validated, including the slug, version and readme name, before they're used in URLs or paths.
2. With `--trunk` or `--svn-tag`, the files must be a plugin whose `Version` header matches the version. When `--trunk` and `--svn-tag` are combined, the readme `Stable tag` must match too; a tag-only run skips that, since a pre-release tag doesn't change the stable tag. `--readme-only` needs the readme. Nothing is checked out when a check fails.
3. The repository is checked out sparsely into a new temporary directory, with only the directories that the flags write to. A missing `assets/` (or `trunk/`, `tags/`) directory is created. The deploy stops when `tags/<version>` exists, unless `--force` replaces it.
4. The files are synced in Node.js, without `rsync`: new and changed files are copied, files that are no longer selected are deleted, and `svn add` and `svn delete` stage them, including files that svn ignores by default. With `--trunk`, `trunk/` is then copied to the tag with `svn copy`. Without it, the same selected files are synced into `tags/<version>` instead, and with `--force` an existing tag is updated to match, deleting files that are no longer in the build.
5. Asset images get `svn:mime-type` set for PNG, JPEG, GIF and SVG, the formats that WordPress.org documents for plugin assets. Other formats keep the type that svn assigns.
6. When `svn status` is empty, the deploy ends without a commit. A dry run logs the status and stops before the commit. Otherwise the changes are committed, and the temporary directory is always removed.

`--from-zip` reads the files from a ZIP instead of `<source-dir>`. The ZIP is checked before it's extracted: entries with absolute paths, `..` segments or symbolic links, and entries outside a single `{slug}/` root folder, are rejected.

Credentials are only needed for the commit, not for dry runs, no-op runs or `file://` repositories. Pass the username with `--svn-username` or `SVN_USERNAME` and the password in `SVN_PASSWORD`. svn always runs non-interactively without caching credentials, and the password is passed on the standard input with `--password-from-stdin`, never on the command line or in the logs.

## Validation

Validation:

- `--readme-only` can't be combined with `--svn-tag`, since a tag is a release snapshot that a readme update never changes.
- `--version` defaults to `--svn-tag`, then the `Version` header of the deployed files; when `--version` and `--svn-tag` are both set they must match.
- Pre-release versions like `1.0.0-rc.1` can be tagged, but syncing one to `trunk/` warns, since trunk is for the development version.
- `--trunk` without `--svn-tag` works but warns, to remind you that updating trunk alone doesn't create a version tag for stable downloads.
- A version mismatch throws a `VersionMismatchError`, a `ValidationError` with the `mismatches` and a problem for each, with its file and line. See [Logging](library.md#logging).
