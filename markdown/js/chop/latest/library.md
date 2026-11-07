# Library API (/js/chop/latest/library.html)

The request handler doesn't depend on an HTTP framework, so it can run in a `node:http` server, a serverless function or a test. Install the package as described in the [overview](index.html.md#install).

```js
import { createHandler, createServer } from '@wpelevator/chop';

const handle = createHandler( {
	dataDir: '/var/www/uploads',
	onError: ( error ) => reportError( error ),
} );

const response = await handle( {
	method: 'GET',
	url: '/2026/05/photo.jpg?w=800',
	headers: { accept: 'image/avif,image/webp' },
} );
// { status: 200, headers: { 'content-type': 'image/avif', ... }, body: Buffer }

createServer( { dataDir: '/var/www/uploads' } ).listen( 8080 );
```

| Export | Description |
| --- | --- |
| `createHandler( settings? )` | Returns `( request ) => Promise< Response >`. The request is `{ method, url, headers }`, where `url` is the path and query string and `headers` is a plain object with lower-case names. The response is `{ status, headers, body }` with a `Buffer` body. It doesn't depend on `node:http`, never throws for a request (errors become responses) and takes optional callbacks, because the library never logs: `onError( error )` for unexpected errors, `onWarning( message )` for each risky setting (like `allowedHosts: [ '*' ]`) when the handler is created, and `onOriginError( error )` for a refused or failed origin, where `error.detail` says why and has no credentials. Give it the same settings that you give `createConfig()`: a settings object that `createConfig()` returned has a `dataDir`, which counts as set. |
| `createConfig( overrides? )`, `configWarnings( settings )` | Settings with defaults, checked, and the list of warnings for the risky settings in them. Throws a `ChopError` with `ERR_INVALID_SETTING` for a value that can't be used. |
| `configFromEnv( env )` | The settings that the `CHOP_*` variables in an environment object set. It doesn't read `process`. |
| `parseQuery( searchParams )` | Parses a `URLSearchParams` into typed operations. |
| `queryScheme`, `cloudflareScheme`, `SCHEMES`, `UrlScheme` | The built-in [URL schemes](url-schemes.html.md), the registry of them by name, and the type of a scheme: `{ name, parse( url, options ) }`, where `parse` returns `{ segments, ops }`, with `url` set instead of `segments` for a [URL source](sources.html.md), or `null` for a URL that it doesn't recognize. `options.urlSources` tells whether URL sources are enabled. |
| `createOrigin( settings )`, `createLocalOrigin()`, `createHttpOrigin()`, `Origin` | The sources of originals: an `Origin` has `open( reference )`, which finds an original and returns its size and a `read()` for its bytes. The HTTP origin does the downloads and their checks. |
| `isBlockedAddress( address )`, `createBlockList()`, `parseAllowedHosts()`, `parseSourceUrl()` | The building blocks of the safeguards, for code that wants to apply the same checks. |
| `createServer( settings? )` | A `node:http` server around the handler, with an `onResponse( summary )` callback for access logs. |
| `run( args, io )` | The command, which returns an exit code. `io` has `stdout`, `stderr`, `env`, `cwd` and `signals`, all replaceable in tests. |
| `ChopError`, `isChopError( value )`, `CHOP_ERROR_CODES`, `CHOP_ERROR_STATUS` | Errors with a `code`. `isChopError` checks the code instead of `instanceof`. |

| Error code | HTTP status |
| --- | --- |
| `ERR_INVALID_REQUEST` | 400 |
| `ERR_NOT_FOUND` | 404 |
| `ERR_METHOD_NOT_ALLOWED` | 405 |
| `ERR_INPUT_TOO_LARGE` | 413 |
| `ERR_UNSUPPORTED_TYPE` | 415 |
| `ERR_UNREADABLE_IMAGE` | 422 |
| `ERR_UPSTREAM` | 502 |
| `ERR_UPSTREAM_TIMEOUT` | 504 |
| `ERR_BUSY` | 503 |
| `ERR_INVALID_SETTING` | 500 (reported by the CLI at startup, exit code 2) |
| `ERR_INTERNAL` | 500 |
