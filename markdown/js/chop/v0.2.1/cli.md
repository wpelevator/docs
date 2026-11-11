# CLI (/js/chop/v0.2.1/cli.html)

The `chop` command runs the server. Give it a data directory or an origin, and a port:

```bash
chop --data /var/www/wp-content/uploads --port 8080
```

```bash
npm start --workspace @wpelevator/chop -- --data ./uploads
```

| Argument | Description | Example |
| --- | --- | --- |
| `-d`, `--data <dir>` | Directory with the original images. Defaults to `CHOP_DATA_DIR`, then `/data`. Can't be combined with `--origin`. | `chop --data /srv/images` |
| `-o`, `--origin <url>` | Serve the images of this `https://` origin, like `https://uploads.example.com/base`, or of an S3 bucket, like `s3://my-bucket/uploads`, instead of a directory. Defaults to `CHOP_ORIGIN`. See [Sources](sources.html.md) and [S3 and S3-compatible storage](s3.html.md). | `chop --origin https://uploads.example.com` |
| `-p`, `--port <n>` | Port to listen on. Defaults to `PORT`, then `CHOP_PORT`, then `8080`. Use `0` for a free port. | `chop -p 3000` |
| `--host <address>` | Address to listen on. Defaults to `CHOP_HOST`, then `0.0.0.0`. | `chop --host 127.0.0.1` |
| `--scheme <name>` | URL scheme, `query` or `cloudflare`. Repeat it to enable several, tried in order, and list `query` last. Overrides `CHOP_SCHEMES`. See [URL schemes](url-schemes.html.md). | `chop --scheme cloudflare --scheme query` |
| `-h`, `--help` | Show the usage. | `chop --help` |

Flags override environment variables, and `--origin` replaces `CHOP_DATA_DIR` while `--data` replaces `CHOP_ORIGIN`, so the flag works in an environment that sets the other one. Setting both a data directory and an origin is an invalid setting. The other settings are read from `CHOP_*` environment variables (see [Settings](configuration.html.md)), and a number or boolean that can't be parsed is reported with the name of the variable. Startup prints one line with the address and the data directory or origin, and a warning line on the standard error for each risky setting (`CHOP_ALLOWED_HOSTS=*`, `CHOP_ORIGIN_ALLOW_HTTP`, `CHOP_ORIGIN_ALLOW_PRIVATE` and an S3 origin without credentials). When an origin refuses a request or fails, the reason is written to the standard error as `origin <code>: <reason>`, since the client only gets a plain `404`, `502` or `504`. `CHOP_ACCESS_LOG=1` prints one JSON line per request to the standard output, with `method`, `path`, `status`, `duration` (milliseconds) and `bytes`.

The exit code is `0` after a clean shutdown, `1` when the server can't start (a missing data directory or a port that is in use), and `2` for invalid options or settings. On `SIGINT` and `SIGTERM` the server stops accepting connections, closes idle ones, waits for running requests and exits with `0`.
