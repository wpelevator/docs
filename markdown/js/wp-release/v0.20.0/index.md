# WP Release (/js/wp-release/v0.20.0/index.html)

`@wpelevator/wp-release` provides a CLI and library for building release directories and ZIPs, creating checksums and signatures, checking versions, extracting and compiling translations, and deploying to WordPress.org SVN or Git repositories.

The [`wp-release-zip`](https://github.com/wpelevator/wp-release-zip), [`wp-release-checksums`](https://github.com/wpelevator/wp-release-checksums), [`wp-release-sign`](https://github.com/wpelevator/wp-release-sign), and [`wp-release-deploy-svn`](https://github.com/wpelevator/wp-release-deploy-svn) GitHub Actions expose the same commands in workflows.

For projects that don't use Node.js or JavaScript tooling, [PHP Changesets](../../../php/php-changesets/docs/index.html.md) (`wpelevator/php-changesets`) runs the same changeset release workflow with PHP and Git alone: `changeset add`, `status`, `version` and `tag` read the same changeset files and match the options of the `changeset-*` commands described in [Changesets support](changesets.html.md).

WordPress.org themes are released by uploading a ZIP, so `deploy-svn` is for plugins only. Use `zip` to build a theme upload. Packaging and deployment options follow familiar community tools to ease migration; the [comparison](./comparison.html.md) explains the differences.

## Install [#install]

```bash
npm install --save-dev @wpelevator/wp-release
```

Node.js 22.12 or later is required. SVN deployments also require the `svn` command line client. Git deployments and changeset commands require Git.

The package is an ES module with TypeScript declarations. CommonJS projects can load it with `require( '@wpelevator/wp-release' )` on Node.js 22.12 or later.

## Start with the CLI [#start-with-the-cli]

```bash
npx wp-release --help
npx wp-release zip --help
```

## Guides [#guides]

- [CLI and automation](./cli.html.md)
- [Changeset releases](./changesets.html.md)
- [Configuration and file selection](./configuration.html.md)
- [Packaging, checksums, signatures, and verification](./packaging.html.md)
- [Git and WordPress.org deployment](./deployment.html.md)
- [WordPress internationalization](./internationalization.html.md)
- [Library API](./library.html.md)
- [Development and architecture](./development.html.md)
- [Comparison with existing tools](./comparison.html.md)
