# Commit

Group changes by purpose, not by file. One commit is one logical change.

## Grouping rules

1. Group by purpose, not by file — multiple files may belong to the same commit.
2. Never mix unrelated changes in the same commit.
3. Prefer many small coherent commits over one large commit.
4. Each commit must be independently understandable and reversible.
5. Stage explicit paths non-interactively. Never blanket-stage; use `git add -A` only when
   the entire worktree is intended. If one file mixes unrelated changes that cannot be
   split safely, ask one focused question instead of using interactive `git add -p`.
6. Strip all Jupyter notebook outputs before staging `.ipynb` files — run
   `jupyter nbconvert --ClearOutputPreprocessor.enabled=True --inplace <file>` or
   `nbstripout <file>` on each notebook.
7. Present the grouping plan only when there are multiple groups or genuine ambiguity; ask
   only when the correct grouping cannot be inferred safely.

## Commit order

1. `style` — formatting / whitespace
2. Renames / moves
3. `refactor` — code changes without behavior change
4. `fix` — bug fixes
5. `perf` — performance improvements
6. `feat` — new features
7. `test` — adding or modifying tests
8. `docs` — documentation
9. `chore` — maintenance, config, build

## Commit message format

```
<type>: <short description>
```

Types:

| Type | Purpose |
|------|---------|
| `feat` | New functionality |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting / whitespace (no logic change) |
| `refactor` | Code change without behavior change |
| `test` | Add or modify tests |
| `chore` | Maintenance, config, build tasks |

Use a lowercase, imperative description. Do not add scopes, breaking-change markers, or
other Conventional-Commit decorations beyond the type. A repository convention overrides
this format.

## Safety

- Never commit secrets, environment files, or large binaries.
- Never bypass hooks; fix the reported source or report the blocker.
- Do not push. Pushing needs the explicit authorization described in `push.md`.
