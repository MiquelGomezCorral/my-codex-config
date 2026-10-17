# Merge delegation skills into `super-agent`

## Goal

Replace `subagent-routing`, `agent-swarm`, and `coordinator` with one authoritative
delegation skill, `super-agent`, that owns policy for every agent which launches, resumes,
or nests workers, while the environment's own lifecycle tooling (loaded generically, never
named) owns launch mechanics. Reduce repeated rules to one owner and remove all vendor
coupling from the delegation policy.

## Files touched

Created

- `agent-home/skills/super-agent/SKILL.md`
- `agent-home/skills/super-agent/references/model-catalog.yaml`
- `agent-home/skills/super-agent/references/routing.md`
- `agent-home/skills/super-agent/references/lifecycle.md`
- `agent-home/skills/super-agent/references/swarm.md`
- `agent-home/skills/super-agent/evals/evals.json`

Removed

- `agent-home/skills/subagent-routing/` (contents moved)
- `agent-home/skills/agent-swarm/` (contents moved)
- `agent-home/skills/coordinator/` (dead; nothing loads it)

Modified

- `agent-home/skills/core/SKILL.md`
- `agent-home/skills/worktree/SKILL.md`
- `agent-home/skills/code/SKILL.md`
- `agent-home/skills/cleanup/SKILL.md`
- `agent-home/skills/commit/SKILL.md`
- `agent-home/skills/review/SKILL.md`
- `agent-home/skills/multi-agent-review/SKILL.md`
- `agent-home/skills/review-plan/SKILL.md`
- `agent-home/skills/plan-implementation/SKILL.md`
- `agent-home/skills/skill-creator/SKILL.md`
- `config/AGENTS.md`
- `bootstrap.sh`, `bootstrap_pi.sh`
- `tests/codex-config.test.mjs`, `tests/bootstrap.test.sh`
- `README.md`
- `.agents/architecture.md`, `.agents/decisions.md`, `.agents/workflow.md`, `.agents/glossary.md`, `.agents/known-errors.md`
- `codex/agents/cleanup-worker.toml`, `codex/agents/review-worker.toml`
- `docs/decisions/agent-tooling/delegation-routing.md`, `docs/decisions/agent-tooling/post-implementation-quality-gates.md`

Untouched by design

- `agent-home/skills/orchestration/`, `agent-home/skills/orca-cli/`, `agent-home/skills/computer-use/` — version-matched discovery stubs served by the installed binary.
- `bootstrap_agy.sh` — AGY carries no skill frontmatter, so only the directory name changes.

## Locked decisions

1. One delegation skill named `super-agent`. `delegation` was rejected because
   `docs/decisions/agent-tooling/delegation-routing.md` already uses that word for the
   concern, and `orchestration` was rejected because it is a lookup key in the installed
   binary's skill registry.
2. All shared policy lives in `super-agent/SKILL.md`; procedures live in `references/`.
   Every safety invariant stays in `SKILL.md` so a missed reference pointer cannot cause a
   safety failure.
3. Class is relative: every agent is a delegate toward its parent and a root over its own
   children. Only the human-facing root has no parent.
4. The delegation policy never names a vendor. Environment-provided orchestration is
   resolved generically as the "active wrapper". Orca names appear only in the three bridge
   stubs, `bootstrap*.sh`, the catalog's harness keys, and documentation.
5. The model catalog moves intact to `super-agent/references/model-catalog.yaml` and stays
   the single owner of cheap worker model identifiers.
6. `coordinator` is deleted. No unique content is lost.
7. The learned AGY readiness-timeout fact moves to `.agents/known-errors.md` without
   version-pinned flags.

## Open decisions (block execution)

- **D1 `index` / `init`.** Both skill directories are deleted in the working tree, but
  `bootstrap.sh:101`, `bootstrap.sh:114`, `codex/commands/index.md`,
  `codex/commands/init.md`, and `tests/codex-config.test.mjs:30-31` still reference them.
  The repository is red. Plan assumes the recommended resolution in Step 9.
- **D2 `pi.high`.** `model-catalog.yaml` has `pi.medium` and `pi.high` both set to
  `opencode-go/deepseek-v4.1-flash`. The duplicate fails
  `strictEqual(new Set(modelIds).size, modelIds.length)`. A unique, stronger identifier
  must be supplied; it cannot be invented.
- **D3 Session handoff.** `handoff` is already deleted. Step 5 optionally keeps a 6-line
  `## Session handoff` block in `swarm.md`. Drop it entirely if not wanted.

## Steps

### 1. Create `super-agent/SKILL.md`

Frontmatter:

```yaml
---
name: super-agent
description: Own delegation for any agent that launches, resumes, or nests workers — resolve the environment's lifecycle, select the harness, role, and cataloged model, grant nesting budgets, and preserve permissions, read-only limits, and the reporting contract.
---
```

The description must not claim `orchestration` or `handoff` triggers; those belong to the
bridge stubs. Sections, in order:

1. `# Super Agent` — ownership statement: owns whether to delegate, which harness and role
   run the work, which cataloged model is used, how much nesting is allowed, and what the
   caller reports; does not own the environment's tooling; calling workflows own task shape
   and acceptance. One line: do not restate this policy elsewhere, point to it.
2. `## Classes` — relative class rule; root identified by holding the user's turn with no
   `Class:` field; delegate identified by `Class: D`; fail-closed defaults (missing
   `Class:` means delegate, missing `Delegation:` means forbidden, missing `Depth:` means
   `1`); only a parent writes budget fields; nesting requires both the parent's grant and
   the role's capability (`allowNestedSubagents` where supported).
3. `## Active wrapper first` — generic resolution: session context, environment variables
   identifying a managed runtime, or an installed skill documenting a worker lifecycle;
   when present, load that environment's own skills and guides and follow them for launch,
   status, wait, message, cancellation, resume, and release; never restate, reimplement, or
   guess those operations; when a managed runtime is identified without an installed guide,
   use its documented help or discovery path; otherwise use the current harness's native
   subagent tooling; another harness only through an explicitly requested documented
   one-shot adapter. No vendor named.
4. `## Delegate or not` — condensed gate: independent scopes only; prefer one worker for a
   small task, a dependency chain, one slow external operation, or repeated mutation of the
   same state; never delegate to satisfy a roster.
5. `## Select the route` — decision order (wrapper then current harness; explicit user
   harness/role/model/ratio/exclusion stays exact; restrictions declared by the current
   harness's own skills filter candidates before generic preference and never license
   substituting another provider or harness; then the catalog). Catalog rules: tiers are
   exactly `low`, `medium`, `high`, `local`; list order is preference order; identifiers are
   a closed allowlist for automatic selection; only a user-named model may run outside it;
   prefer the cheapest adequate tier and an adequate local route first;
   `max_local_concurrency` is shared across the whole tree and includes a cataloged local
   orchestrator; when compatible entries are exhausted report the blocker and never accept
   an uncataloged harness or wrapper default; `$code` and `$cleanup` keep their configured
   orchestrator-strength workers; keep at least `ceil(N / 2)` workers on the current harness
   when no roster was requested; select each harness's real configured role by description
   and never translate a role name across harnesses; use a general agent only when that
   harness exposes no role catalog. Must contain the verbatim sentence
   `Read \`references/model-catalog.yaml\` for every delegation.`

   **Removed from this section:** the Pi/SearXNG sentence. It is harness-specific and
   already owned by `agent-home/skills/web-search/SKILL.md:9,15,41`.
6. `## Invariants` — preserve scope, exclusions, permissions, directory, read-only limits,
   and stop conditions across every route; do not broaden authority to make a route work;
   read-only work must not create a branch or worktree, edit, commit, push, publish, or
   change shared infrastructure without explicit authorization for that exact action; pass
   model identifiers and prompts as separate arguments and never evaluate a catalog value as
   shell code; resume only an exact retained session whose parent, harness, role, model, and
   directory still match, otherwise launch fresh and report the ownership mismatch.
7. `## Report` — harness, role, tier, and exact effective model for every slot, plus every
   fallback, local serialization, missing coverage, and verification gap; distinguish
   unattempted from failed work; no hidden fallback chains or queues.
8. `## References` — a table naming when to read each of `routing.md`, `lifecycle.md`,
   `swarm.md`, and `model-catalog.yaml`.

Target ~110 lines. Vendor names: none.

### 2. Move `references/model-catalog.yaml`

Move unchanged from `agent-home/skills/subagent-routing/references/` except D2. Keep the
`max_local_concurrency: 1` line, the `codex` / `pi` / `agy` harness keys, and the nested
`pi.local.medium` / `pi.local.low` tiers exactly as they are. The `docs/decisions`
invariant that identifiers have one authoritative owner is preserved by the path move.

### 3. Create `super-agent/references/routing.md`

Moved out of `subagent-routing/SKILL.md`, minus vendor coupling:

- Harness inventory: build the available set from the active wrapper when present,
  otherwise only the current harness; verify capability and authentication rather than
  assuming an installed name is usable; exclude a route already known to lack required
  authentication or capability.
- Role selection: a wrapper's agent selector names the harness, not a worker role; carry
  the selected role's instructions in the worker task and preserve its model, reasoning
  effort, and permissions through documented launch options; report the limitation instead
  of dropping required configuration.
- Concrete launch permissions, moved here so `SKILL.md` stays vendor-neutral: the approved
  policy is no permission prompts and no OS sandbox, including reviewers. Codex uses
  `--sandbox danger-full-access` and `--ask-for-approval never`; AGY uses
  `--dangerously-skip-permissions` without `--sandbox`. These override role-file sandbox
  settings and are not re-approved. Pass them through the active wrapper's documented
  launch path; if that path cannot express them, report the limitation. Read-only review
  remains a task constraint: preserve no-edit, no-commit, and no-deployment instructions
  and any restricted tool lists. Do not describe these workers as OS-sandboxed.
- Explicit one-shot adapters: keep the verified argument-vector templates exactly as they
  are today, with the surrounding rules that prompt and catalog model are separate
  arguments, that catalog values are never concatenated into shell code, and that `eval`
  is never used. Change only the framing sentence from "Orca" to "active wrapper".
- Model pinning: confirm the selected identifier is in the catalog unless the user named
  that exact model; pass it through the launcher's explicit model option; if the launcher
  cannot pin it, the route is unavailable; when the runtime reports an effective model,
  verify it matches and stop a mismatched worker without using its output.

### 4. Create `super-agent/references/lifecycle.md`

Moved out of `subagent-routing/SKILL.md`, vendor-neutral:

- Launch, status, wait, message, cancellation, resume, and release follow the
  environment-provided lifecycle when present, otherwise the harness's native operations.
- Preserve the worker packet's scope, exclusions, permissions, directory, delegation
  allowance, deliverable, and stop conditions across every route.
- Tell each worker to load `super-agent` before any authorized nested delegation and to
  follow the environment's dispatch preamble when one is provided.
- Retention: keep a worker only when the calling workflow explicitly requires retention;
  otherwise release settled workers as the environment's guide requires. Reuse requires a
  fresh dispatch, never replaying a prompt into an unknown terminal.
- Recovery: on a quota or rate-limit failure, replace only that slot with the next
  compatible catalog entry available through the active wrapper, keeping the same scope,
  lens, permissions, and evidence contract; never retry the exhausted route; if the active
  wrapper or a required guide, capability, or runtime is unavailable, report the exact
  blocker while native current-harness routing remains valid; never silently reinterpret an
  unsupported role or model as quota exhaustion.
- Do not create hidden fallback chains, task keys, or queues. A failure from an earlier task
  is context, not evidence that a new launch failed.

**Removed:** the AGY readiness-recovery paragraph, including the `--inject` and
`--return-preamble` sequence, and the "through Orca" / "available inside Orca" phrases.
That fact moves to Step 8.

### 5. Create `super-agent/references/swarm.md`

Moved from `agent-home/skills/agent-swarm/SKILL.md`, with these exact removals:

- Delete the `## Routing` section (lines 11-25). Replace with one line: route, launch, wait,
  resume, and recover only through `super-agent`; do not restate its policy here.
- Delete the third bullet of `## Lifecycle` (line 58), which restates wrapper-native
  operations. Keep the "launch independent workers in the same turn" bullet and the resume
  identity check.
- Delete the `- Use only the routing policy's explicit, reported catalog fallback.` clause,
  already owned by `super-agent`.

Keep and adapt:

- `## Gate` — unchanged, including the "Prefer one agent for a small task" list.
- `## Workflow` — the 7 numbered steps, unchanged.
- `## Worker Packet` — add three fields ahead of the existing ones:
  `Class: D`, `Depth: 1`, `Delegation: forbidden | allowed (max depth N, total N, active N)`.
  Keep the surrounding guidance and the field list.
- `## Nested Swarms` — unchanged, including the root-only grant rule, the budget fields,
  the canonical nested instruction, and the requirement that the spawning worker synthesizes
  instead of forwarding raw transcripts.
- `## Shared Workspace` — unchanged. This is where `coordinator`'s one unique line already
  lives ("concurrent writers need disjoint files or isolated worktrees; otherwise serialize
  them").
- `## Failure And Boundaries` — unchanged except the deleted fallback clause.
- `## Examples` — unchanged.
- Optional `## Session handoff` (D3): write the continuation document to the operating
  system's temporary directory, not the workspace, and return its absolute path; reference
  existing plans, diffs, and commits instead of copying them; redact credentials and
  private data; state that the handoff is context, not authority and the next agent must
  verify current files and runtime state before acting.

### 6. Move `evals` to `super-agent/evals/evals.json`

- `skill_name`: `agent-swarm` to `super-agent`.
- Replace `subagent-routing` with `super-agent` in the expectation strings on lines 14, 49,
  and 61.
- Keep all 9 evaluations and every other expectation string. The assertions on
  `quota-exhausted`, `catalog tier`, `local-search protection`, and `closed allowlist`
  depend on this file.

### 7. Delete the three skill directories

`agent-home/skills/subagent-routing/`, `agent-home/skills/agent-swarm/`, and
`agent-home/skills/coordinator/`. `handoff/` is already deleted and stays deleted. Nothing
else may be removed in this step.

### 8. Rewrite pointer lines repo-wide

Every `subagent-routing` pointer becomes `super-agent`:

- `agent-home/skills/core/SKILL.md:20-21` — collapse both routes into one:
  `- Any agent launch, resume, swarm, or nesting decision -> \`super-agent\`.`
- `worktree/SKILL.md:3` and `:8` — pointer rename; `:11` becomes "Create an isolated
  worktree only when the user explicitly requests one, through the active wrapper's
  documented mechanism"; replace the `:15-19` policy restatement paragraph with a single
  pointer line.
- `code/SKILL.md:8,40,45,58`
- `cleanup/SKILL.md:9,32`
- `commit/SKILL.md:8,12`
- `review/SKILL.md:11,81,93`
- `multi-agent-review/SKILL.md:9` — `\`code-review\` and \`super-agent\``; `:73,77`
- `review-plan/SKILL.md:12`
- `plan-implementation/SKILL.md:26`
- `skill-creator/SKILL.md:40`
- `codex/agents/cleanup-worker.toml:35`, `codex/agents/review-worker.toml:11`
- `config/AGENTS.md:25` — `must load \`super-agent\` before delegating`. The remainder of
  that bullet is already vendor-neutral; leave it.
- `docs/decisions/agent-tooling/post-implementation-quality-gates.md:11`
- `README.md:105,113,119` — rename the owner, update the catalog path, and add one
  paragraph: `orchestration`, `orca-cli`, and `computer-use` are version-matched discovery
  stubs that fetch their guide from the installed binary, and their content is
  intentionally not duplicated here.
- `.agents/architecture.md:20`, `.agents/decisions.md:15`, `.agents/workflow.md:21`
- `docs/decisions/agent-tooling/delegation-routing.md` — see Step 11.
- `.agents/plans/*` and `.opencode/plans/*` are historical records: **do not edit them.**

### 9. Resolve D1 in `bootstrap.sh`, commands, and tests

Recommended resolution, because `codegraph-setup` and `agents-memory` already own the
capability and describe it more fully than the deleted one-line dispatchers:

- `codex/commands/index.md` — `skill: index` becomes `skill: codegraph-setup`.
- `codex/commands/init.md` — `skill: init` becomes `skill: agents-memory`.
- `bootstrap.sh:101` — drop `"index"` and `"init"`; add `"codegraph-setup"` and
  `"agents-memory"`.
- `bootstrap.sh:114` — the `expected` command set keeps `index` and `init`, because the
  command names do not change; only their target skills do.
- `tests/codex-config.test.mjs:30-31` — drop `"index"`, `"init"`; add `"codegraph-setup"`,
  `"agents-memory"`.
- `README.md` command table — the `index` and `init` rows stay; the `Skill` column becomes
  `codegraph-setup` and `agents-memory`.

Alternative if the commands are meant to disappear: delete both command files, remove
`index` and `init` from `bootstrap.sh:114` and the README table, and drop the test rows.
Pick one; do not leave the tree red.

### 10. Update `bootstrap.sh` and `bootstrap_pi.sh` paths

- `bootstrap.sh:101` — required-skill tuple: `"subagent-routing"` becomes `"super-agent"`;
  keep `"orca-cli"`, `"orchestration"`, `"computer-use"`; apply D1.
- `bootstrap.sh:200` — check path becomes
  `agent-home/skills/super-agent/references/model-catalog.yaml`.
- `bootstrap_pi.sh:93,94,96` — `subagent-routing` becomes `super-agent` in the
  `cleanup-worker`, `coder`, and `review-worker` entries. Those roles gain catalog access;
  `commit-worker` and `reviewer-*` deliberately do not, since they never delegate.
  `allowNestedSubagents` stays on `cleanup-worker` and `review-worker` only, which is the
  capability half of the nesting rule.
- `bootstrap_agy.sh` — no change.

### 11. Decision records

Update the existing concern rather than creating a new file, per the skill's preference.

`docs/decisions/agent-tooling/delegation-routing.md`:

- `Intent` — add that delegation policy lives in one skill and that environment-provided
  orchestration is resolved generically without naming a vendor.
- `Current decisions` — change the catalog path to
  `agent-home/skills/super-agent/references/model-catalog.yaml`; add that `super-agent` is
  the single owner of delegation policy and class grants; restate wrapper ownership without
  naming a product.
- `Protected invariants` — add: class is relative and only a parent grants nesting; every
  delegating role has catalog access; delegation policy contains no vendor names.
- `Rationale and tradeoffs` — add that a single skill removes duplicated rules and that
  deferring lifecycle mechanics to the environment keeps the policy correct when the
  environment changes.
- `Enforcement` — update the two links to the new skill and reference paths.
- `History` — append one dated entry for the merge.
- `docs/decisions/index.md` — the `Delegation routing` link and path are unchanged; no index
  edit is required. If the concern is later renamed, update the index in the same change.
- `docs/decisions/agent-tooling/post-implementation-quality-gates.md:11` — pointer rename
  only.

### 12. Update tests

`tests/codex-config.test.mjs`:

- `:30` — `"subagent-routing"` becomes `"super-agent"`; apply D1 for `index` / `init`.
- `:141,142` — read the catalog and `SKILL.md` from `agent-home/skills/super-agent/`.
- `:172` — `agent-home/skills/agent-swarm/SKILL.md` becomes
  `agent-home/skills/super-agent/references/swarm.md`.
- `:185` — `routing` reads `super-agent/SKILL.md`; add a `routingReference` read of
  `super-agent/references/routing.md` and a `lifecycle` read of
  `super-agent/references/lifecycle.md`.
- `:186,190` — swarm and evals paths move to `super-agent/`.
- `:199-200` — **remove** the two AGY-readyness assertions
  (`After an AGY readiness timeout…`, `dispatch without \`--inject\`…`). They now assert
  vendor mechanics that the policy no longer owns.
- Assertions that move from `routing` to `routingReference`: the four argument-vector
  patterns and `argument vector`.
- Assertions that move from `routing` to `lifecycle`: `quota or rate limit is exhausted`,
  the AGY recovery assertions (deleted, not moved).
- `:207` — `must load \`super-agent\``.
- `:209` — `code/SKILL.md` must match `active wrapper through \`super-agent\``.
- `:210-212` — the loop over `["coordinator", "worktree"]` drops `coordinator`; only
  `worktree` remains, matching `Load \`super-agent\``.
- `:216,218,219,220` — pointer renames.
- `:231-232` — path list becomes the two `super-agent` files plus `review` and
  `multi-agent-review`.
- Add one new assertion: `doesNotMatch(read("agent-home/skills/super-agent/SKILL.md"),
  /Orca|ORCA/)`, enforcing the vendor-neutrality requirement.
- `:301` — `bootstrapPi` must match
  `"cleanup-worker": \["core", "cleanup", "super-agent"\]`.

`tests/bootstrap.test.sh`:

- `:38` — `must load \`super-agent\``.
- `:113` — `skills: core, cleanup, super-agent`.
- `:114` — `skills: core, code, super-agent`.

### 13. Update memory

- `.agents/known-errors.md` — add:
  `- \`AGY readiness timeout\`: inspect the terminal before retrying; the timeout can be an`
  `  unsubmitted prompt rather than a launch failure. Follow the loaded environment guide for`
  `  the recovery sequence.` No version-pinned flags.
- `.agents/glossary.md` — add `Super agent: the root or delegated agent that owns delegation`
  `for its subtree and loads \`super-agent\`.` Keep the existing `Wrapper` and `Harness`
  entries, which are already vendor-neutral.
- `.agents/architecture.md` — rename the owner in the boundaries paragraph and add one line
  stating that delegation policy is vendor-neutral and environment-provided orchestration is
  used generically.
- `.agents/decisions.md` — rename the owner and add the single-skill and vendor-neutrality
  decisions.
- `.agents/workflow.md:21` — the catalog path.

## Applicable instructions

- `AGENTS.md` — narrow, preserve unrelated changes, no commits or branches.
- `config/AGENTS.md` — "Give Each Fact One Owner"; "Make Every Element Earn Its Cost";
  planning and record assessment before implementation.
- `agent-home/skills/decision-records/SKILL.md` — update the existing concern, do not
  create a parallel one; index edit only if the concern is renamed.
- `agent-home/skills/code-quality/SKILL.md` — remove duplication rather than adding
  indirection.
- `docs/decisions/agent-tooling/delegation-routing.md` — the protected invariants that
  Step 11 must preserve.

## Readiness check

```bash
./bootstrap.sh --check
node --test tests/*.mjs config/plugins/vault-context/test/plugin.test.mjs
bash tests/bootstrap.test.sh
```

Plus two guards:

```bash
grep -rn "subagent-routing\|agent-swarm\|skills/coordinator" --include="*.md" --include="*.sh" --include="*.toml" --include="*.mjs" . | grep -v '^./.agents/plans' | grep -v '^./.opencode/plans'
grep -rniE "\borca\b" agent-home/skills/super-agent/ || true
```

The first must return nothing outside the historical plan directories. The second must
return nothing.

## Live validation

Flow: with `--pi --agy`, confirm both harnesses discover `super-agent` and that a
`cleanup-worker` can read the catalog and launch one bounded read-only child.

Expected: the role loads, the catalog path resolves, nesting is refused unless the packet
grants it, and the final report names harness, role, tier, and effective model.

Can run: user-only, pending approval; it launches authenticated external agent sessions.

## Unrelated findings (do not fix in this change)

- `agent-home/skills/core/SKILL.md` routes "Python template/environment work" to
  `python-project-setup`, which does not exist. The installed skill is `python-coding`.
- `agent-home/skills/review-plan/SKILL.md:12` pins `gpt-5.6-sol`, stale against the
  renamed `gpt-6-sol` agent models. Pointer rename only in this change.
- `bootstrap.sh:101` and `tests/codex-config.test.mjs:30` are red until D1 is answered.
- `agent-home/skills/agent-swarm/evals/evals.json` expectation strings duplicate routing
  policy; the move keeps them as evaluation text, not policy.

## Out of scope

Vendor bridges, `bootstrap_agy.sh`, `computer-use`, the OpenCode rollback path, historical
plan files, agent model identifiers beyond the `pi.high` fix, and any change to the
non-delegation skills' behavior.
