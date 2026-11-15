# Changelog

What changed in each release.

## 0.1.1 (2026-11-15)

- Start each documentation page with a `# Title` heading instead of a `title` in the front matter, so that the Markdown pages read well on GitHub and in `node_modules`. ([`ca287e4`](https://github.com/wpelevator/basement/commit/ca287e459833429482d3e033eb3eab81eaea3757))
- Move the detailed usage documentation from the README into topic pages of the `docs/` directory, and publish it in the npm package, so that the docs site has a guide for each area and agents and editors can read the documentation of the installed version. ([`ca287e4`](https://github.com/wpelevator/basement/commit/ca287e459833429482d3e033eb3eab81eaea3757))
- Point the package homepage to the documentation site, so that the Homepage link on the npm package page works without access to the private repository. ([`ca287e4`](https://github.com/wpelevator/basement/commit/ca287e459833429482d3e033eb3eab81eaea3757))

## 0.1.0 (2026-10-29)

- Add the Ed25519 signing library extracted from wp-release: key generation and parsing, and signing and verification of bytes and files in the WordPress, minisign and OpenSSH formats, with the signing key environment variable configurable. ([`16bf135`](https://github.com/wpelevator/basement/commit/16bf135248f281d24e6ec41d6848e546e70dff9e))

