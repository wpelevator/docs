# Development

Run the tests, lint and build of the chop package from the monorepo.

Run these from the repository root:

```bash
npm run test --workspace @wpelevator/chop
npm run lint --workspace @wpelevator/chop
npm run build --workspace @wpelevator/chop
npm run format --workspace @wpelevator/chop
docker compose run --rm --no-deps wordpress npm run test --workspace=@wpelevator/chop
```

To run the server from a checkout, use `npm start --workspace @wpelevator/chop -- --data ./uploads`.

The source runs directly with Node's type stripping through the `wpelevator-source` export condition, and `dist` is only for publishing. Tests are co-located `*.test.ts` files that use `node:test`. `src/test-fixtures.ts` creates temporary data directories and generates the images with sharp, so there are no binary fixtures.
