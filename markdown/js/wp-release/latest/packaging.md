# Build, verify and sign

Choose the command that turns a plugin or theme directory into a release you can trust.

Everything between your source directory and a published release is one command. Pick the task:

| I want to | Command | Page |
|---|---|---|
| Get the ZIP WordPress.org accepts | `zip` | [Build a release ZIP](build-a-zip.md) |
| Leave out `node_modules/`, tests and other dev files | `--exclude`, `.distignore` | [Choose which files ship](file-selection.md) |
| Stop a release when the versions disagree | `version-check` | [Check versions](version-check.md) |
| List every shipped file with its hash | `checksums`, `zip --checksums` | [Write a checksums manifest](checksums.md) |
| Prove a ZIP or an installed plugin is unchanged | `verify` | [Verify a ZIP or directory](verify.md) |
| Sign the ZIP and the manifest | `keygen`, `sign` | [Sign releases](signing.md) |

Each command exits with `2` when a check fails, so any of them can stop a CI job. The [quickstart](quickstart.md) runs the first four in a minute.
