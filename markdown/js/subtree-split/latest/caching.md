# Caching (/js/subtree-split/latest/caching.html)

Every run splits the whole history again. `--git-dir-cache` remembers the results in `.git/subtree-split-cache/`, so the next run only processes the commits that are new. On gutenberg that takes `packages/components` from 1.7 seconds to 0.3. On a small repository it makes no difference.

A fresh CI checkout has no cache. Give `--cache` a file that you save and restore between runs, or set it once with `SUBTREE_SPLIT_CACHE`.

A cache that is missing, belongs to another prefix, or has commits that were garbage collected is ignored and the history is split again, so it only costs time. To start over, delete the file.
