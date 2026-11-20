# Quickstart

Serve a folder of images as resized AVIF, WebP or JPEG copies from one command, and see the response headers that make them cacheable.

Point chop at a folder of images and get resized copies in the best format each browser accepts. You need Node.js 22.12 or later and a folder with a JPEG in it. There is nothing to configure. The sizes below come from a 2400 by 1600 synthetic test image, so yours will differ.

The examples run the published package with `npx @wpelevator/chop`. Use the scoped name until you install it, because bare `npx chop` doesn't run this package. After `npm install @wpelevator/chop` the bare `chop` command works.

## 1. Start the server

Create the folder and copy any JPEG into it, then start the server from the folder that holds `uploads`:

```sh
mkdir -p uploads/2026/05
cp ~/Pictures/photo.jpg uploads/2026/05/photo.jpg
```

The server:

```sh
npx @wpelevator/chop --data ./uploads --port 8080
```

```text
chop listening on http://0.0.0.0:8080, serving /home/me/uploads
```

The path of a request selects the file, so `/2026/05/photo.jpg` is `uploads/2026/05/photo.jpg`. chop only reads that folder.

## 2. Request a smaller copy

In a second terminal, ask for the image 300 pixels wide as a browser that supports AVIF does:

```sh
curl -s -D - -o photo.avif -H 'Accept: image/avif,image/webp' 'http://localhost:8080/2026/05/photo.jpg?w=300' | grep -iE '^(HTTP|content-|vary|x-bytes)'
```

```text
HTTP/1.1 200 OK
content-type: image/avif
content-length: 2364
vary: Accept
x-bytes-saved: 1350587
```

The `Accept` header listed AVIF, so the body is an AVIF image 300 pixels wide. `x-bytes-saved` is the difference to the size of the original, which was 1352951 bytes here. `vary: Accept` tells caches that the answer depends on the header.

Send the same request without `Accept`, or with `image/webp` only, and the format changes with it:

```sh
curl -s -D - -o photo.jpg 'http://localhost:8080/2026/05/photo.jpg?w=300' | grep -iE '^(HTTP|content-|vary|x-bytes)'
```

```text
HTTP/1.1 200 OK
content-type: image/jpeg
content-length: 4548
vary: Accept
x-bytes-saved: 1348403
```

## 3. Crop to a square

`resize` covers the box and crops the overflow, and `gravity` picks the part to keep:

```sh
curl -s -o card.jpg 'http://localhost:8080/2026/05/photo.jpg?resize=400,400&gravity=north'
file card.jpg
```

```text
card.jpg: JPEG image data, progressive, precision 8, 400x400, components 3
```

A bad argument is a `400` that names it, and a missing file is a plain `404`. Take the first as an example:

```sh
curl -s 'http://localhost:8080/2026/05/photo.jpg?w=abc'
```

```text
Invalid "w" argument: expected a whole number.
```

```sh
curl -s 'http://localhost:8080/missing.jpg'
```

```text
Not found.
```

## Where next

- Write a `srcset` and limit the widths: [Serve responsive images](responsive-images.md).
- Read originals from another host or a bucket: [Choose where originals come from](sources.md).
- Run it in a container: [Run chop in Docker](docker.md).
- Put a cache in front so each variant is made once: [Cache images](caching.md).
- Get ready for real traffic: [Prepare chop for production](production-checklist.md).
