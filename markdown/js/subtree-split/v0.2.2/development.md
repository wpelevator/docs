# Development

```bash
npm test
npm run lint
npm run bench -- --prefix packages/js/fileset --prefix apps/docs
```

`npm run bench` clones a repository to a temporary directory and times `git subtree split` and this package, cold, from the cache and after one new commit.

## License

MIT
