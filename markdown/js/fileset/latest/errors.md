# Errors

Invalid input throws a `FilesetError` with a Node-style `code`: `ERR_IGNORE_FILE_NOT_FOUND`, `ERR_MISSING_SOURCE_DIR` or `ERR_SYMLINK_SELECTED`. Use `isFilesetError( error )` to check for one, which also works when two copies of the package are installed, unlike `instanceof`. Other errors, like an unreadable directory, are the original errors of Node.js.
