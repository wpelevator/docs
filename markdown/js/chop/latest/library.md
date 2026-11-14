# Library API

Embed chop in your own server with createHandler, and look up its exports and error codes.

Call chop from your own code: pass a request object to the handler and get a response object back, with no HTTP framework in between. That runs in a `node:http` server, a serverless function or a test. Install the package as described in the [overview](index.md#install).

```js
import { createHandler, createServer } from '@wpelevator/chop';

const handle = createHandler( {
	dataDir: '/var/www/uploads',
	onError: ( error ) => console.error( error ),
} );

const response = await handle( {
	method: 'GET',
	url: '/2026/05/photo.jpg?w=800',
	headers: { accept: 'image/avif,image/webp' },
} );
// { status: 200, headers: { 'content-type': 'image/avif', ... }, body: Buffer }

createServer( { dataDir: '/var/www/uploads' } ).listen( 8080 );
```

## Reference

### Exports

| Export | Description |
| --- | --- |
| `createHandler( settings? )` | Returns `( request ) => Promise< Response >`. The request is `{ method, url, headers }`, where `url` is the path and query string and `headers` is a plain object with lower-case names. The response is `{ status, headers, body }` with a `Buffer` body. It doesn't depend on `node:http`, never throws for a request (errors become responses) and takes optional callbacks, because the library never logs: `onError( error )` for unexpected errors, `onWarning( message )` for each risky setting (like `allowedHosts: [ '*' ]`) when the handler is created, and `onOriginError( error )` for a refused or failed origin, where `error.detail` says why and has no credentials. Pass the settings that you want to change, such as `{ origin: 'https://uploads.example.com' }`. Don't pass the result of `createConfig()` together with an `origin`, because `createConfig()` fills in the default `dataDir`, and a data directory together with an origin is an invalid setting. |
| `createConfig( overrides? )`, `configWarnings( settings )` | Settings with defaults, checked, and the list of warnings for the risky settings in them. Throws a `ChopError` with `ERR_INVALID_SETTING` for a value that can't be used. |
| `configFromEnv( env )` | The settings that the `CHOP_*` variables in an environment object set. It doesn't read `process`. |
| `parseQuery( searchParams )` | Parses a `URLSearchParams` into typed operations. |
| `queryScheme`, `cloudflareScheme`, `SCHEMES`, `SCHEME_NAMES` | The built-in [URL schemes](from-cloudflare.md), the registry of them by name, and the list of names. The `UrlScheme` type describes a scheme: `{ name, parse( url, options ) }`, where `url` is a `URL` object and not a string, and `parse` returns `{ segments, ops }`, with `url` set instead of `segments` for a [URL source](sources.md), or `null` for a URL that it doesn't recognize. `options.urlSources` tells whether URL sources are enabled. |
| `createOrigin( settings )`, `createLocalOrigin()`, `createHttpOrigin()`, `createS3Origin()` | The sources of originals. `createOrigin()` takes the full settings that `createConfig()` returns, and partial settings throw a `TypeError`. The `Origin` type has `open( reference )`, which finds an original and returns its size and a `read()` for its bytes. The HTTP origin does the downloads and their checks. |
| `isBlockedAddress( address )`, `createBlockList()`, `parseAllowedHosts()`, `parseSourceUrl()` | The building blocks of the safeguards, for code that wants to apply the same checks. |
| `DEFAULT_SETTINGS`, `INPUT_FORMATS`, `AUTO_FORMATS` | The default settings, the readable input formats and the formats that `auto` can negotiate. |
| `parseAccept( header )`, `acceptsType( header, type )` | Parse an `Accept` header per RFC 9110, and check that a media type is listed the way chop does. Wildcards don't count. |
| `planGeometry()`, `estimateJpegQuality()`, `createLimiter()` | Lower-level parts of the pipeline: the size plan for a request, the quality estimate of a JPEG, and the queue that limits concurrent work. |
| `createServer( settings? )` | A `node:http` server around the handler, with an `onResponse( summary )` callback for access logs. |
| `run( args, io )` | The command, which returns an exit code. `io` has `stdout`, `stderr`, `env`, `cwd` and `signals`, all replaceable in tests. |
| `ChopError`, `isChopError( value )`, `statusOf( error )`, `CHOP_ERROR_CODES`, `CHOP_ERROR_STATUS` | Errors with a `code`. `isChopError` checks the code instead of `instanceof`, and `statusOf` returns the HTTP status of any error. |

### Error codes

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
