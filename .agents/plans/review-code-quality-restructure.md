# Review restructure, code-quality umbrella, mandatory wiring

## Goal

Fold `code-review` into a restructured `review` skill. Move `python-coding` into
`code-quality/references/python.md` unchanged. Make `code-quality` plus the matching
language reference mandatory for anyone writing or reviewing code, and grant it to the
roles that need it.

## Files touched

Created

- `agent-home/skills/review/references/code-review.md`
- `agent-home/skills/review/references/orchestration.md`
- `agent-home/skills/review/references/ocr-evidence.md`
- `agent-home/skills/review/references/convention-audit.md`
- `agent-home/skills/code-quality/references/python.md`

Removed

- `agent-home/skills/code-review/`
- `agent-home/skills/python-coding/`

Rewritten

- `agent-home/skills/review/SKILL.md` (186 lines, becomes a thin router)
- `agent-home/skills/code-quality/SKILL.md` (gains the language-reference section and a
  description update; the existing universal rules stay as they are)

Modified

- `config/AGENTS.md`
- `bootstrap.sh`, `bootstrap_pi.sh`
- `tests/codex-config.test.mjs`, `tests/bootstrap.test.sh`
- `agent-home/skills/review-findings/SKILL.md`
- `agent-home/skills/review/references/presets/flash.md`,
  `agent-home/skills/review/references/presets/swarm-smart.md`,
  `agent-home/skills/review/references/swarm-coordination.md`
- `docs/decisions/agent-tooling/post-implementation-quality-gates.md`
- `.agents/requirements.md`

## Locked decisions

1. `code-review` is folded into `review`, and `review` is restructured at the same time.
2. `python-coding` is moved into `code-quality/references/python.md` **with its content
   untouched**. Only the frontmatter is dropped, because a reference is not a skill. The
   file name may change; the content may not.
3. The language reference keeps the name `python`.
4. `code-quality` becomes mandatory for code work. Keep the four engineering principles in
   `config/AGENTS.md` (they are always loaded and cheap) and let `code-quality` own the
   detailed standard. Do not move them out of `AGENTS.md`.

## Step 1 - restructure `review`

Current `review/SKILL.md` is 186 lines. Split by section boundary:

| Current range | Destination |
| --- | --- |
| 1-4 frontmatter | rewritten |
| 6-7 title | rewritten |
| 8-141 `## $review invocation` (134 lines) | `references/orchestration.md` |
| 142-162 `## Optional OCR evidence` (21 lines) | `references/ocr-evidence.md` |
| 163-172 `## Review modes` (10 lines) | **stays in `SKILL.md`** (it is the router) |
| 173-186 `## Convention Audit` (14 lines) | `references/convention-audit.md` |

`references/code-review.md` is the current `agent-home/skills/code-review/SKILL.md` body
with its frontmatter dropped and nothing else changed: the intro line, `## Workflow`,
`## Findings` (P0-P3 plus blocked/unverified and scope classification), and `## Output`.

New `review/SKILL.md` frontmatter:

```yaml
---
name: review
description: Own review — the shared review standard (workflow, findings, P0-P3 severity, output contract) and `$review` orchestration for ordinary, staff-level, and swarm review gates. Use for any code review; the standard is in references/code-review.md.
---
```

New `review/SKILL.md` body, kept short:

1. `# Review Gate` — one-line ownership statement.
2. `## Read the standard first` — any review, including one a specialist performs, reads
   `references/code-review.md`. Findings, severity, scope classification, and the output
   contract come from there and are not restated here.
3. `## Review modes` — moved verbatim from the current lines 163-172.
4. `## Route` — table: the review standard; `$review` orchestration and presets;
   OCR evidence when `--ocr` is requested; convention audit; swarm coordination when swarm
   mode is selected.
5. A line stating that a specialist reviewer performs the review and must not launch or
   orchestrate further reviewers; only the coordinator routes.

Delete `agent-home/skills/code-review/`.

## Step 2 - re-point every `code-review` consumer

- `bootstrap_pi.sh:97` and `:100-103` — replace `"code-review"` with `"review"` in
  `live-validator` and the four `reviewer-*` entries.
- `tests/bootstrap.test.sh:117` — the rendered assertion becomes
  `^skills: code-quality, computer-use, review, test-audit, workflow, writing$` for
  `live-validator` (see Step 4 for the full role lists).
- `tests/codex-config.test.mjs:500` — read
  `agent-home/skills/review/references/code-review.md`.
- `review/SKILL.md` — the description no longer says "Use `code-review` alone for ordinary
  reviews"; the body no longer loads `code-review` at lines 165 and 183.
- `review/references/presets/flash.md:7` and `swarm-smart.md:11` — point at
  `references/code-review.md`.
- `review/references/swarm-coordination.md:4`, `:89`, `:92` — point at
  `references/code-review.md`.
- `review-findings/SKILL.md:8` — `Load \`code-review\`` becomes
  `Load the \`review\` skill and read its \`references/code-review.md\``.

Do **not** change `README.md:96`, `README.md:166` (`@alibaba-group/open-code-review`, a
different product), or `.agents/decisions.md:13` (a historical OpenCode role name).

## Step 3 - move `python-coding` into `code-quality`

- Create `agent-home/skills/code-quality/references/python.md` from
  `agent-home/skills/python-coding/SKILL.md`: drop only the 4-line YAML frontmatter and
  keep every remaining line byte-for-byte, starting at `# Python Project Setup`.
- Delete `agent-home/skills/python-coding/`.
- In `code-quality/SKILL.md`, add a `## Language references` section after the Purpose
  section: read `references/<language>.md` for the language of the file you are about to
  touch, and list Python as `references/python.md`. State that the universal rules apply
  first and the language reference narrows them for that language.
- Update the `code-quality` description to mention the language reference, for example:
  `Apply the shared code-quality standard when writing or reviewing code, plus the language reference for the files you touch.`

## Step 4 - make it mandatory

`config/AGENTS.md` — add one bullet in `## Authority and scope`, next to the writing
bullet:

```
- Before writing or editing code, load `code-quality` and read the reference for the
  language of the files you touch. The standard is mandatory, not advisory.
```

`bootstrap_pi.sh` — final role lists, alphabetical:

```python
    "cleanup-worker": ["cleanup", "code-quality", "super-agent", "test-audit", "writing"],
    "coder": ["code", "code-quality", "super-agent", "test-audit", "writing"],
    "git-worker": ["git", "writing"],
    "coding-supervisor": ["code-quality", "review", "review-findings", "super-agent", "test-audit", "workflow", "writing"],
    "live-validator": ["code-quality", "computer-use", "review", "test-audit", "workflow", "writing"],
    "critic": ["decision-records", "web-search", "writing"],
    "review-worker": ["code-quality", "review", "review-findings", "super-agent", "test-audit", "writing"],
    "reviewer-arch": ["code-quality", "review", "test-audit", "writing"],
    "reviewer-e2e": ["code-quality", "review", "test-audit", "writing"],
    "reviewer-quick": ["code-quality", "review", "test-audit", "writing"],
    "reviewer-reasoning": ["code-quality", "review", "test-audit", "writing"],
```

`bootstrap.sh` — add `"code-quality"` to the required-skill tuple. `python-coding` is not
in that tuple, so nothing is removed.

This is the part that fixes the current bug: `code-quality`, `python-coding`, and (for Pi)
`code-review` were granted to no role, so `cleanup-worker.toml`'s instruction to apply
`code-quality` pointed at a skill the rendered Pi worker could not load.

Do **not** add a PreToolUse hook in this change. The policy bullet plus the role grants are
the fix; a hook is a separate decision.

## Step 5 - tests

`tests/codex-config.test.mjs`:

- required-skill list: add `"code-quality"`; assert the removals with the existing removed-
  list pattern: `code-review` and `python-coding` must be absent.
- add a focused test asserting:
  - `review/SKILL.md` is a router: it contains `## Review modes` and a reference table with
    `references/code-review.md`, `references/orchestration.md`, `references/ocr-evidence.md`,
    and `references/convention-audit.md`;
  - those four reference files exist;
  - `review/references/code-review.md` contains `P0`, `P1`, `P2`, `P3`, `Blocked/unverified`,
    `Approve with non-blocking comments`, and the scope classifications;
  - `review/SKILL.md` is shorter than 100 lines, proving the split;
  - `code-quality/SKILL.md` contains the language-reference instruction and names
    `references/python.md`;
  - `code-quality/references/python.md` exists and starts with `# Python Project Setup`;
  - `config/AGENTS.md` contains the mandatory sentence
    `The standard is mandatory, not advisory`;
  - every one of the nine roles in Step 4 carries `"code-quality"` in `bootstrap_pi.sh`, and
    no role carries `"code-review"` or `"python-coding"`.

`tests/bootstrap.test.sh:117` — update the `live-validator` skills assertion to the Step 4
list.

`.agents/requirements.md` — add items recording: the review restructure with the exact
section mapping, the unchanged Python move, the mandatory standard, the decision to keep the
engineering principles in `AGENTS.md`, and the note that a PreToolUse hook was deliberately
not added.

`docs/decisions/agent-tooling/post-implementation-quality-gates.md` — update the pointer at
line 13 from `code-quality` to the new shape (`code-quality` plus its language references),
and append a History entry.

## Applicable instructions

- `AGENTS.md` — narrow changes, preserve unrelated worktree changes, no commits or branches.
- `config/AGENTS.md` — "Give Each Fact One Owner"; "Make Every Element Earn Its Cost".
- `.agents/requirements.md` — the resolved answers above.

## Readiness check

```bash
node --test tests/*.mjs config/plugins/vault-context/test/plugin.test.mjs
bash tests/bootstrap.test.sh
./bootstrap.sh --check
grep -rn '"code-review"\|skills/code-review\|python-coding' --include="*.md" --include="*.sh" --include="*.mjs" --include="*.toml" . | grep -v '^./.agents/plans' | grep -v '^./.opencode/plans'
```

The final grep must return nothing outside historical plan directories.

Known pre-existing failures, do not fix:
1. `./bootstrap.sh --check` fails at the machine-specific-path check for `codex/hooks.json`.
   It runs after the skill and command inventories; confirm those passed.
2. `bash tests/bootstrap.test.sh` fails at `codex mcp-server --strict-config` with
   `stdin is not a terminal`.
3. `node --test` currently reports 22 passing tests and no failures. Any failure is yours.

## Out of scope

The four engineering principles in `config/AGENTS.md` (they stay), a PreToolUse
enforcement hook, `test-audit` content, the caveman family, the `pi.high` catalog state, and
the Orca machine path in `codex/hooks.json`.

## Live validation

Flow: ask for a small Python change, then a review of it.

Expected: the coder loads `code-quality` and `references/python.md`; the reviewer loads
`review` and `references/code-review.md`; findings come back with P0-P3, scope, and the
verdict.

Can run: user-only.
