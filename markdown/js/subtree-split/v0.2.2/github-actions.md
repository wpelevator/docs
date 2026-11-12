# GitHub Actions (/js/subtree-split/v0.2.2/github-actions.html)

`--github-output` sets the `hash`, `prefix`, `ref` and `result` outputs of the step. `result` has all of them as JSON.

```yaml
- uses: actions/checkout@v7
  with:
    fetch-depth: 0

- id: split
  run: npx @wpelevator/subtree-split@0.2.0 --prefix packages/my-library --github-output

- run: git push git@github.com:acme/my-library.git "${{ steps.split.outputs.hash }}:refs/heads/main"
```
