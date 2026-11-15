# fileset

Select the files of a directory with gitignore-style rules and sync another directory to match, copying only what changed.

Select the files of a directory with gitignore-style rules and an ignore file like `.distignore`, and make another directory match the selected files, copying only what changed. It uses the [ignore](https://github.com/kaelzhang/node-ignore) package for the rules, and doesn't run Git or any other program.

## Install

```bash
npm install @wpelevator/fileset
```

Requires Node.js 22.12 or later.

## Guides

- [Selecting files](./selecting-files.md)
- [Syncing a directory](./syncing.md)
- [Errors](./errors.md)
