# WP Release (/js/wp-release/v0.18.1)

`@wpelevator/wp-release` provides a CLI and library for building release directories and ZIPs, creating checksums and signatures, checking versions, extracting and compiling translations, and deploying to WordPress.org SVN or Git repositories.

The [`wp-release-zip`](https://github.com/wpelevator/wp-release-zip), [`wp-release-checksums`](https://github.com/wpelevator/wp-release-checksums), [`wp-release-sign`](https://github.com/wpelevator/wp-release-sign), and [`wp-release-deploy-svn`](https://github.com/wpelevator/wp-release-deploy-svn) GitHub Actions expose the same commands in workflows.

For projects that don't use Node.js or JavaScript tooling, [PHP Changesets](../../../php/php-changesets/docs/index.md) (`wpelevator/php-changesets`) runs the same changeset release workflow with PHP and Git alone: `changeset add`, `status`, `version` and `tag` read the same changeset files and match the options of the `changeset-*` commands described in [Changesets support](changesets.md).

WordPress.org themes are released by uploading a ZIP, so `deploy-svn` is for plugins only. Use `zip` to build a theme upload. Packaging and deployment options follow familiar community tools to ease migration; the [comparison](./comparison.md) explains the differences.

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

- [CLI and automation](./cli.md)
- [Changeset releases](./changesets.md)
- [Configuration and file selection](./configuration.md)
- [Packaging, checksums, signatures, and verification](./packaging.md)
- [Git and WordPress.org deployment](./deployment.md)
- [WordPress internationalization](./internationalization.md)
- [Library API](./library.md)
- [Development and architecture](./development.md)
- [Comparison with existing tools](./comparison.md)
