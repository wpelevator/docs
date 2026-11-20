# Errors

Invalid input throws a `GettextError` with a Node-style `code` like `ERR_INVALID_I18N_OPTIONS`, `ERR_INVALID_PO` or `ERR_INVALID_OUTPUT`. Use `isGettextError( error )` to check it, which also works when two copies of the package are installed. Problems in the sources are returned as diagnostics instead.
