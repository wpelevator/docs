# Run the server

Run the chop server, read its access log and startup warnings, and look up its flags, environment variables and exit codes.

The `chop` command runs the server. Give it a data directory or an origin, and a port:

```sh
chop --data /var/www/wp-content/uploads --port 8080
```

```text
chop listening on http://0.0.0.0:8080, serving /var/www/wp-content/uploads
```

Add `CHOP_ACCESS_LOG=1` to print one JSON line per request to the standard output, and use `/healthz` for health checks. This run also sets `CHOP_ALLOWED_WIDTHS=320,640`, and the log shows requests for `?w=300`, `?w=320` and `/healthz`:

```sh
CHOP_ALLOWED_WIDTHS=320,640 CHOP_ACCESS_LOG=1 chop --data ./uploads
```

```text
chop listening on http://0.0.0.0:8080, serving /home/me/uploads
{"method":"GET","path":"/2026/05/photo.jpg","status":400,"duration":5,"bytes":54}
{"method":"GET","path":"/2026/05/photo.jpg","status":200,"duration":19,"bytes":4130}
{"method":"GET","path":"/healthz","status":200,"duration":0,"bytes":2}
```

The width of 300 is not in the list, so it is a `400`. The `path` has no query string, and `duration` is in milliseconds.

## Common tasks

### Listen on one interface

`chop --host 127.0.0.1 --port 3000` accepts connections from the same machine only.

### Switch between a directory and an origin

`--origin` replaces `CHOP_DATA_DIR`, and `--data` replaces `CHOP_ORIGIN`, so a flag works in an environment that sets the other one. Passing both flags is an invalid setting.

### Stop it cleanly

`SIGINT` and `SIGTERM` stop it from accepting connections, close idle ones, wait for running requests and exit with `0`.

### Read the errors

An invalid combination exits with `2` and says what to change:

```text
Set either dataDir (CHOP_DATA_DIR, --data) or origin (CHOP_ORIGIN, --origin), not both.
```

A data directory that doesn't exist exits with `1`:

```text
The data directory "/home/me/nope" doesn't exist.
```

## Reference

| Argument | Description | Example |
| --- | --- | --- |
| `-d`, `--data <dir>` | Directory with the original images. Defaults to `CHOP_DATA_DIR`, then `/data`. Can't be combined with `--origin`. | `chop --data /srv/images` |
| `-o`, `--origin <url>` | Serve the images of this `https://` origin (`http://` with `CHOP_ORIGIN_ALLOW_HTTP`), like `https://uploads.example.com/base`, or of an S3 bucket, like `s3://my-bucket/uploads`, instead of a directory. Defaults to `CHOP_ORIGIN`. See [Sources](sources.md) and [Serve images from S3](s3.md). | `chop --origin https://uploads.example.com` |
| `-p`, `--port <n>` | Port to listen on. Defaults to `PORT`, then `CHOP_PORT`, then `8080`. Use `0` for a free port. | `chop -p 3000` |
| `--host <address>` | Address to listen on. Defaults to `CHOP_HOST`, then `0.0.0.0`. | `chop --host 127.0.0.1` |
| `--scheme <name>` | URL scheme, `query` or `cloudflare`. Repeat it to enable several, tried in order, and list `query` last. Overrides `CHOP_SCHEMES`. See [URL schemes](from-cloudflare.md). | `chop --scheme cloudflare --scheme query` |
| `-h`, `--help` | Show the usage. | `chop --help` |

Flags override environment variables, and `--origin` replaces `CHOP_DATA_DIR` while `--data` replaces `CHOP_ORIGIN`, so the flag works in an environment that sets the other one. Setting both a data directory and an origin is an invalid setting. The other settings are read from `CHOP_*` environment variables (see [Settings](configuration.md)), and a number or boolean that can't be parsed is reported with the name of the variable. Startup prints one line with the address and the data directory or origin, and a warning line on the standard error for each risky setting (`CHOP_ALLOWED_HOSTS=*`, `CHOP_ORIGIN_ALLOW_HTTP`, `CHOP_ORIGIN_ALLOW_PRIVATE` and an S3 origin without credentials). When an origin refuses a request or fails, the reason is written to the standard error as `origin <code>: <reason>`, since the client only gets a plain `404`, `502` or `504`. `CHOP_ACCESS_LOG=1` prints one JSON line per request to the standard output, with `method`, `path`, `status`, `duration` (milliseconds) and `bytes`.

The exit code is `0` after a clean shutdown, `1` when the server can't start (a missing data directory or a port that is in use), and `2` for invalid options or settings. On `SIGINT` and `SIGTERM` the server stops accepting connections, closes idle ones, waits for running requests and exits with `0`.
