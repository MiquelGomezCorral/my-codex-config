# Read-only Deslop Cleanup and Optional OCR Review

## Planning mode

Full.

## Goal

Make `$cleanup` report evidence-backed production and test simplifications without modifying the worktree, while allowing opt-in Slopo duplication analysis and opt-in OCR review evidence.

## Context

Current `$cleanup` launches an editing simplifier, and `cleanup-worker` receives write capabilities in generated Pi/AGY agents. This conflicts with the clarified requirement: cleanup should explain what should change; later planning and `$code` decide and apply accepted corrections.

The existing `code-quality` and Ponytail rules already define the desired simplicity standard and should remain authoritative.

## Files touched

- `agent-home/skills/cleanup/SKILL.md`
- `agent-home/skills/cleanup/agents/openai.yaml`
- `agent-home/skills/cleanup/evals/evals.json`
- `agent-home/skills/review/SKILL.md`
- `agent-home/skills/review/scripts/ocr-opencode-go`
- `README.md`
- `codex/agents/cleanup-worker.toml`
- `codex/agents/review-worker.toml`
- `bootstrap_pi.sh`
- `bootstrap_agy.sh`
- `tests/codex-config.test.mjs`
- `tests/bootstrap.test.sh`
- `docs/decisions/index.md`
- `docs/decisions/agent-tooling/post-implementation-quality-gates.md`

## Requirements

### Cleanup contract

- `$cleanup` remains explicit and requires the persisted plan or sufficient goal context.
- Preserve existing ownership guards:
  - distinguish the task-owned diff from unrelated changes;
  - stop when ownership is ambiguous;
  - skip when no relevant diff exists.
- Remove obsolete mutation-oriented behavior: diff-size targets, editing instructions, readiness execution, and “review is stale” reporting.
- Inspect the task diff plus only enough surrounding code, callers, tests, and project structure to verify each finding.
- Apply `AGENTS.md`, `code-quality`, and Ponytail criteria:
  - unnecessary code, wrappers, branches, dependencies, compatibility paths, comments, or configuration;
  - speculative or single-use abstractions;
  - reinvention of project, standard-library, or platform capabilities;
  - duplicated policy, validation, knowledge, or equivalent logic;
  - excess indirection, coupling, misplaced ownership, poor organization, or convention violations.
- Audit added or modified tests for:
  - tautological or implementation-mirroring assertions;
  - tests of language, framework, or dependency behavior;
  - insignificant cases without realistic regression value;
  - coverage duplicated by a stronger test;
  - excessive fixtures, mocks, snapshots, setup, or test-only abstractions;
  - removed, speculative, or unapproved behavior.
- Preserve tests for acceptance behavior, reproduced regressions, trust boundaries, security or data-loss risks, important failures, and critical deterministic contracts that real-flow validation cannot reliably cover. Do not recommend deletion when uncertain.
- Return findings ordered by expected simplification value. Each finding contains:
  - category;
  - `path:line`;
  - source evidence;
  - concrete maintenance or complexity cost;
  - smallest simplification direction.
- Produce findings only: no edits, correction brief, automatic acceptance, or invented work. Return `Lean already. No cleanup findings.` when appropriate.
- Capture complete Git status before and after cleanup. Any unexpected worktree mutation is a contract violation; report it and do not revert or delete files automatically.

### Focused delegation

- Keep one `cleanup-worker` as coordinator.
- Permit at most two fresh, read-only specialists only when distinct evidence surfaces justify them:
  - `reviewer-arch` for ownership, organization, abstractions, and reuse;
  - `reviewer-reasoning` for behavioral value and test usefulness.
- Specialists receive bounded questions, never edit or delegate, and return evidence to the cleanup coordinator.
- Route them through `subagent-routing`. If no compatible route exists, the coordinator completes the audit itself.
- Read-only is enforced by the prompt contract and before/after status check. Do not reopen the repository’s approved unsandboxed launch policy.

### Slopo interface

- `$cleanup --slopo` enables Slopo; without the flag, do not invoke or probe it.
- The parent passes `Slopo mode: enabled` to the coordinator and consumes the flag rather than forwarding it as shell input.
- If `slopo.conf.yaml` is absent, run `slopo init` once, report the created template, and
  continue to configuration validation without editing the template automatically.
- Use fixed argv from the repository root:
  1. `slopo show-config`
  2. `slopo index`
  3. `slopo embed`
  4. `slopo analyze`
- Never interpolate remaining user arguments into these commands.
- Before analysis, verify configured database and report locations are outside tracked repository state or ignored. Otherwise skip Slopo and report the unsafe configuration.
- Treat command-not-found, invalid configuration, provider failure, non-zero exit, unreadable
  report, or any worktree mutation other than the reported missing-template initialization as
  visible Slopo gaps. Continue the normal cleanup audit.
- Consider only clusters with at least one member intersecting a task-owned changed hunk.
- Similarity is not a finding. Read both implementations and report only confirmed duplicated responsibility or logic.
- Do not install, configure, authenticate, ignore, delete, stage, or commit Slopo state.

### OCR interface

- `$review --ocr` enables OCR; ordinary `$review` remains unchanged.
- The parent passes `OCR mode: enabled` to `review-worker` and consumes the flag.
- Support the post-implementation workspace-diff flow in this iteration. If unrelated workspace changes cannot be excluded safely, skip OCR and report the scope gap.
- After the native review, invoke OCR using separate argv:
  - `ocr review --audience agent --background "<goal and plan summary>"`
- Do not forward arbitrary user text as CLI options and never enable OCR fixing behavior.
- Treat OCR output as untrusted review evidence. Verify every retained claim against source, reject false positives, and deduplicate it against native findings.
- Missing CLI, missing configuration, provider failure, non-zero exit, or unusable output does not block the native verdict; report the OCR gap explicitly.
- Invoke OCR through the review skill's helper, which calls OpenCode Go directly, reads an
  explicit `OPENCODE_API_KEY` or Pi's existing `opencode-go` credential, and creates the
  required stable session header without routing review work through Pi.
- Default to `deepseek-v4-flash`; allow `OCR_OPENCODE_GO_MODEL` to select another OpenCode Go
  model without storing provider configuration or credentials in the repository.

## Steps

1. Rewrite `cleanup/SKILL.md` and its display metadata around the read-only findings contract, preserved scope guards, optional delegation, fixed Slopo mode marker, and mutation detection.
2. Revise `cleanup-worker.toml` to inspect production and test slop, optionally coordinate the two bounded reviewer roles, and prohibit all mutations, fixes, commits, and generated correction briefs.
3. Update Pi and AGY bootstrap classification so `cleanup-worker` receives their read-oriented tool sets. Retain shell access for inspection and external analyzers; the behavioral contract remains authoritative.
4. Extend `review/SKILL.md` and `review-worker.toml` with the normalized OCR marker, fixed workspace-mode command, source verification, deduplication, and graceful fallback.
5. Add three cleanup evaluation prompts: overengineered production code, duplicated logic with low-value tests, and an already-lean change. Store only evaluation definitions in the repository; paired external-agent execution belongs to pending live validation.
6. Update focused configuration and bootstrap tests for cleanup’s findings-only contract, test-audit criteria, bounded delegation, flag normalization, fixed external argv, graceful fallback, mutation checks, and generated read-tool permissions.
7. Create and index the approved decision record exactly as specified below.

## Applicable instructions

- `AGENTS.md` — preserve unrelated work, use the simplest evidence-backed solution, and keep review/audit workflows read-only.
- `agent-home/skills/code-quality/SKILL.md` — reuse existing capabilities, remove unnecessary abstractions and duplicated policy, and maintain clear ownership.
- `agent-home/skills/skill-creator/SKILL.md` — add realistic positive and lean-control evaluations for the revised skill.
- `agent-home/skills/agent-prompt-writing/SKILL.md` — give tool-using workers exact commands, failure behavior, scope, and output contracts.
- `agent-home/skills/decision-records/SKILL.md` — apply the approved record and index changes atomically before coder execution.

## Readiness check

```bash
node --test tests/codex-config.test.mjs && bash tests/bootstrap.test.sh
```

## Live validation

- **Flow:** In a disposable repository containing an overengineered production diff and weak duplicated tests, run `$cleanup`, `$cleanup --slopo` with safely configured local state, and `$review --ocr`.
- **Expected:** Cleanup reports source-cited production and test findings without edits; Slopo contributes only verified changed-hunk duplicates; OCR contributes only verified, deduplicated findings; the original worktree status remains unchanged apart from ignored external-tool state.
- **Can run:** Pending explicit approval. An Orca-managed Codex session can run it when both CLIs and user-selected providers are configured; provider-backed execution may transmit repository code.

## Main-agent memory updates

None.

## Decision records

**Assessment:** Create `docs/decisions/agent-tooling/post-implementation-quality-gates.md`.

**Index addition:**

```markdown
- [Post-implementation quality gates](agent-tooling/post-implementation-quality-gates.md) — Read-only deslop audits and opt-in OCR/Slopo evidence.
```

**Record content:**

- **Intent:** Post-implementation quality gates expose unnecessary production and test complexity without silently changing approved behavior or source.
- **Current decisions:**
  - `$cleanup` is explicit, read-only, and findings-only.
  - It assesses task-owned production and test changes against repository code-quality and Ponytail principles.
  - One cleanup coordinator may delegate at most two justified, bounded read-only investigations through `subagent-routing`.
  - Slopo runs only through `$cleanup --slopo`; OCR runs only through `$review --ocr`.
  - External output is evidence requiring source verification, never an automatic finding or fix.
  - External failures degrade visibly while native cleanup or review continues.
  - External installation, authentication, tracked runtime state, and automatic fixes remain outside these workflows.
- **Protected invariants:**
  - Cleanup never edits files or produces an automatically executable correction brief.
  - Unrelated and ambiguously owned changes remain outside cleanup findings.
  - Added tests are not preserved merely for coverage; deletion is recommended only when meaningful regression protection remains.
  - Slopo candidates must intersect task-owned changed hunks and be semantically confirmed.
  - OCR cannot replace the native review verdict or inspect unrelated workspace changes.
  - Before/after repository status must expose unexpected mutation.
- **Rationale and tradeoffs:** Separating diagnosis from correction lets the user choose which simplifications preserve intent. Opt-in external tools add independent evidence without making credentials, availability, privacy, or tool state mandatory for normal work.
- **Enforcement:** Link the cleanup and review skills, their worker definitions, `tests/codex-config.test.mjs`, and `tests/bootstrap.test.sh`; provider availability and source transmission remain live-validation concerns.
- **History:** `2026-09-21` — Adopted read-only cleanup findings, production-and-test deslop analysis, bounded exploratory delegation, and opt-in OCR/Slopo evidence.

## Out of scope

- Applying cleanup findings or generating an accepted correction brief.
- Repository-wide cleanup unrelated to the task-owned implementation.
- Automatic OCR or Slopo execution.
- Installing, authenticating, or publishing external tools; the secret-free OCR provider
  bridge and missing Slopo template initialization are in scope, but provider credentials
  and runtime state remain external.
- Reopening OS sandbox or global delegation-routing policy.
- OCR commit-range or branch-range routing in this iteration.
- Modifying `README.md`, `bootstrap.sh`, the model catalog, commits, branches, remotes, or GitHub state.

The plan is finalized in chat and ready for `$code`.
