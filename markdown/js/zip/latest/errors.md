# Errors

Invalid input throws a `ZipError` with a Node-style `code`: `ERR_INVALID_ROOT_FOLDER`, `ERR_INVALID_SOURCE_DATE_EPOCH`, `ERR_ZIP_EXISTS`, `ERR_INVALID_ZIP` or `ERR_UNSAFE_ZIP`. Use `isZipError( error )` to check for one, which also works when two copies of the package are installed, unlike `instanceof`. Other errors, like a missing source file, are the original errors of Node.js.
