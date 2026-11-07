# Development (/js/chop/latest/development.html)

Run these from the repository root:

```bash
npm run test --workspace @wpelevator/chop
npm run lint --workspace @wpelevator/chop
npm run build --workspace @wpelevator/chop
npm run format --workspace @wpelevator/chop
docker compose run --rm --no-deps wordpress npm run test --workspace=@wpelevator/chop
```

The source runs directly with Node's type stripping through the `wpelevator-source` export condition, and `dist` is only for publishing. Tests are co-located `*.test.ts` files that use `node:test`, and each test name starts with the requirement ID of the specification that it covers, like `R-FMT-3`. `src/test-fixtures.ts` creates temporary data directories and generates the images with sharp, so there are no binary fixtures.

## License [#license]

MIT. chop was implemented from a written behavior specification and the repository conventions, without reference to the source code of any other image server. The [reference](reference.html.md) summarizes that behavior.
