# Run chop in Docker

Run chop from the ghcr.io/wpelevator/chop container image with a read-only mount, environment settings, a health check and an nginx cache.

Run the published image with the originals mounted read-only and the port published. The image installs the published npm package, so the documentation of that version applies.

```sh
docker run --rm --read-only --cap-drop ALL \
	--volume "$PWD/uploads:/data:ro" \
	--publish 8080:8080 \
	ghcr.io/wpelevator/chop:latest
```

Then request `http://localhost:8080/2026/05/photo.jpg?w=300`, which serves `/data/2026/05/photo.jpg`. Pin a version tag like `ghcr.io/wpelevator/chop:0.1.0` in production. The image has its own version, independent of the npm package, and each image release installs the chop version that its `package.json` pins, so a `0.1.x` image can contain a newer chop. The tags are on the [GitHub Container Registry page](https://github.com/wpelevator/basement/pkgs/container/chop). The image is built for AMD64 and ARM64.

## Common tasks

### Configure it

Use the `CHOP_*` variables of [Configuration](configuration.md), such as `-e CHOP_ACCESS_LOG=1` or `-e CHOP_AUTO_FORMATS=webp`, or put arguments after the image name, such as `--scheme cloudflare --scheme query`. `PORT` overrides the port `8080`. The image sets `NODE_ENV=production`, and the data directory is chop's default, `/data`.

### Read originals from an origin or a bucket

Don't mount `/data`, and set the origin. An explicitly set data directory together with an origin is an invalid setting.

```sh
docker run --rm --read-only --cap-drop ALL \
	-e CHOP_ORIGIN=https://uploads.example.com/wp-content/uploads \
	--publish 8080:8080 \
	ghcr.io/wpelevator/chop:latest
```

For another container, add `CHOP_ORIGIN_ALLOW_HTTP` and `CHOP_ORIGIN_ALLOW_PRIVATE`:

```yaml
services:
  chop:
    image: ghcr.io/wpelevator/chop:latest
    read_only: true
    cap_drop:
      - ALL
    environment:
      CHOP_ORIGIN: http://uploads:80
      CHOP_ORIGIN_ALLOW_HTTP: "1"
      CHOP_ORIGIN_ALLOW_PRIVATE: "1"
      CHOP_ALLOWED_WIDTHS: 320,640,960,1280
    depends_on:
      - uploads

  uploads:
    image: nginx:1.28-alpine
    volumes:
      - ./uploads:/usr/share/nginx/html:ro
```

For S3, set `CHOP_ORIGIN=s3://my-bucket/uploads` and `AWS_REGION` with the keys in `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. See [Serve images from S3](s3.md). The container needs outbound network access to a remote origin, so restrict its egress to it.

### Check its health

The `HEALTHCHECK` requests `/healthz` with Node, since the image has no `curl`, and follows `PORT`:

```sh
docker inspect --format '{{.State.Health.Status}}' <container>
```

### Put nginx in front

```yaml
services:
  chop:
    image: ghcr.io/wpelevator/chop:0.1.0
    read_only: true
    cap_drop:
      - ALL
    volumes:
      - ./uploads:/data:ro

  nginx:
    image: nginx:1.28-alpine
    depends_on:
      chop:
        condition: service_healthy
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - chop_cache:/var/cache/nginx/chop

volumes:
  chop_cache:
```

Use the recipe of [Cache with nginx](nginx-cache.md) as `nginx.conf`. It already points `proxy_pass` at `http://chop:8080`, the service name above. Its `map` and `proxy_cache_path` directives are valid in the `http` context, which is where files in `/etc/nginx/conf.d` are included.

## Reference

- The process runs as the unprivileged `node` user (UID 1000), which only needs read access to the files in `/data`. Use `--user` for another UID that can read them.
- chop never writes to disk, so the container runs with `--read-only` and `--cap-drop ALL`, and doesn't need a writable `/tmp`.
- `chop` is the entrypoint, so it is PID 1 and receives `SIGTERM` from `docker stop`, stops accepting connections, finishes running requests and exits with `0`.
- The image is based on `node:24-trixie-slim`. Building and releasing the image are described in the [chop Docker README](https://github.com/wpelevator/basement/tree/main/packages/docker/chop).
