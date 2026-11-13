# Errors

Invalid input throws a `ChecksumsError` with a Node-style `code`: `ERR_INVALID_CHECKSUMS`, `ERR_MISSING_DIGEST`, `ERR_CHECKSUMS_EXISTS` or `ERR_CHECKSUMS_NOT_FOUND`. Use `isChecksumsError( error )` to check for one, which also works when two copies of the package are installed, unlike `instanceof`. Other errors, like an unreadable file, are the original errors of Node.js.
