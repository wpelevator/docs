# Reproducible archives

The same entries always give the same archive bytes: entries are sorted by name, every entry has the file mode `0o100644` (`ZIP_FILE_MODE`) and the same modification time, so the archive doesn't depend on the umask, file system, clock or the order of the input.

The modification time is the Unix time in the `SOURCE_DATE_EPOCH` environment variable when it's set, as in [reproducible-builds.org](https://reproducible-builds.org/docs/source-date-epoch/), and otherwise the fixed `ZIP_MTIME`, 1980-01-01, the first day that ZIP supports. ZIP stores local time without a time zone, so the UTC time is written as it is, to give the same bytes in every time zone. A time before 1980 gives `ZIP_MTIME`, and a value that isn't a whole number of seconds throws a `ZipError` with the code `ERR_INVALID_SOURCE_DATE_EPOCH`. Pass `mtime` to override both.
