# Safe extraction

`extractZip()` checks every entry with `getZipEntryErrors()` before writing anything, and refuses an archive with an absolute path, a `..` segment, a backslash, a symbolic link or an entry outside the `rootFolder`. Only regular files are extracted, never over an existing file, and the root folder is stripped from the paths. It returns the sorted relative paths of the extracted files.
