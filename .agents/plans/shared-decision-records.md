# Shared decision records for Codex planning

## Goal and reviewed context

**Planning mode: full.** Make the main orchestrator discover, understand, propose, and maintain shared project decisions, then pass their protected constraints to implementation and review workers.

Use [PR #6408 at commit `1081dde`](https://github.com/vidext/vidext/tree/1081dde576f1685fb7dcd9871284d92b861e6466/.agents/skills/decision-records) as the behavioral baseline, excluding Vidext-specific integrations.

The configuration already has personal memory and a `$code` reference to `decision-records`, but the referenced skill is missing. An independent Orca-managed `gpt-5.6-sol` reviewer identified gaps in first execution, document ownership, swarm propagation, and skill selection. This replacement plan resolves them. Review changed no files.

## Files touched

Create:

```text
agent-home/skills/decision-records/SKILL.md
agent-home/skills/decision-records/assets/record-template.md
agent-home/skills/decision-records/agents/openai.yaml
```

Modify only the necessary sections of:

```text
agent-home/skills/implementation-planning/SKILL.md
agent-home/skills/review-plan/SKILL.md
agent-home/skills/code/SKILL.md
agent-home/skills/review/SKILL.md
agent-home/skills/code-review/SKILL.md
agent-home/skills/multi-agent-review/SKILL.md
config/AGENTS.md
README.md
bootstrap.sh
tests/codex-config.test.mjs
```

Preserve all existing unrelated changes, including changes within these files.

## Requirements and implementation steps

### 1. Add the portable skill

Adapt the PR’s skill, template, and Codex metadata. Remove Greptile registration and other repository-specific steps.

Preserve these contracts:

- One living record per stable concern at `docs/decisions/<capability>/<stable-concern>.md`.
- Discovery through `docs/decisions/index.md`, containing links and brief descriptions.
- Record sections: `Intent`, `Current decisions`, `Protected invariants`, `Rationale and tradeoffs`, `Enforcement`, and dated `History`.
- Record significant non-derivable intent: success semantics, cross-boundary behavior, security or operational constraints, costly reversals, recurring rejected alternatives, reusable approaches, and constraints that cannot be mechanically enforced.
- Exclude routine fixes, mechanical refactors, progress notes, and facts fully owned by code or checks.
- Prefer updating an existing concern. Create an index or capability folder only alongside an approved first record.
- Link enforcement to authoritative code or checks; otherwise state `Review-only` and explain why.

Use this output contract:

```text
Decision records: <create|update|no change> — <reason or link>
Record changes: <exact record and index changes, or none>
Enforcement: <authoritative guard or Review-only>
```

When recorded intent conflicts with planned or implemented behavior, show the requirement and evidence. Let the user choose whether to revise behavior, revise the record, or reopen planning. Never silently rewrite a record to match code, including when a change removes or weakens an invariant.

### 2. Integrate discovery and approval

In `config/AGENTS.md`, require assessment after planning and before implementation. Tasks that skip planning acquire no mandatory assessment solely from this change.

Define skill selection once there: use the applicable repository-scoped `decision-records` skill when present; otherwise use the shared portable skill. Load the selected file explicitly rather than merging same-name skill bodies. Repository-specific requirements remain applicable.

In `implementation-planning`:

- Read applicable records during discovery.
- Include the assessment and exact proposed record/index changes in scope approval.
- Preserve them in a separate `Decision records` section of the finalized plan.
- Keep all planning read-only.

In `review-plan`, pass that section to the critic and preserve it in the finalized result. Newly proposed material changes or unresolved intent conflicts return to the user; unchanged approved content needs no repeated approval.

### 3. Make execution ownership explicit

In `code`, replace the dangling instruction with the following flow:

1. Load the selected skill and compare the approved assessment with current applicable records.
2. Resolve a missing assessment, material drift, or intent conflict before dispatch.
3. The main orchestrator applies only the exact approved record/index changes.
4. Persist the finalized plan unchanged using the existing mechanism.
5. Dispatch the coder with record paths, protected constraints, and an explicit statement identifying document changes already applied by the main orchestrator.

The coder must not repeat or reinterpret those document edits. It implements within the constraints and reports conflicts.

Keep the original saved plan immutable. Later approved record changes travel through the existing correction brief and remain main-orchestrator-owned. Do not add unconditional reassessment to every correction turn.

If implementation fails after records were written, report the failure and those written paths accurately. Do not claim implementation or enforcement succeeded, or silently roll back approved intent.

**First execution of this task:** the missing skill is the artifact being created. Use the assessment below directly to permit this installation task to proceed through `$code`. This is a task-specific bootstrap instruction; do not add a permanent missing-skill bypass.

```text
Decision records: no change — this task installs the workflow and approves no repository decision records.
Record changes: none; do not create docs/decisions/index.md.
Enforcement: Review-only — no existing shared record applies.
```

### 4. Carry constraints through review

- In `review`, require the coordinator to discover applicable records and pass relevant paths and invariants to any specialists.
- In `code-review`, compare the reviewed behavior with those invariants, including their removal or weakening within the same change.
- In `multi-agent-review`, add applicable record paths and protected constraints to the existing shared specialist packet.

Keep review read-only. Add no agent roles, model changes, or additional review stages.

### 5. Integrate with existing configuration

Add `decision-records` to the existing required-skill inventories in `bootstrap.sh` and `tests/codex-config.test.mjs`. Reuse the current skill installation mechanism.

Add a short README explanation of shared records, personal-memory separation, approval, and the planning-to-execution handoff. Do not modify unrelated README inconsistencies.

## Verification

Run the existing focused checks after implementation:

```bash
./bootstrap.sh --check
node --test tests/codex-config.test.mjs
```

Both passed during discovery; rerun them against the implementation. Inspect the scoped diff and verify metadata, template links, skill selection, approval ownership, and reviewer propagation. These checks validate source and inventory, not model behavior.

**Flow:** Pending separate user approval, use Orca-managed Codex sessions in a disposable repository to plan a significant first decision, implement it after approval, update the same concern, handle a routine fix, and propose an invariant violation. Exercise review with the applicable constraints.

**Expected:** Planning writes nothing; the main orchestrator applies approved records once; the coder receives them as constraints; routine work returns `no change`; conflicts require user resolution; reviewers receive and check protected intent.

**Can run:** Orca-managed Codex sessions, subject to route availability and approval for live validation.

## Applicable instructions and boundaries

- `AGENTS.md`: preserve unrelated work; use focused edits; do not commit, publish, or create branches/worktrees.
- `config/security-rules.md`: exclude credentials and sensitive runtime state.
- `implementation-planning/SKILL.md`: keep discovery read-only and preserve approved scope.
- `code/SKILL.md`: retain the existing worker workflow and immutable execution-plan artifact.
- User clarification: shared `docs/decisions/` and personal `.agents/` memory remain separate.

**Main-agent memory updates: none.** Leave `.agents/*.md`, `agents-memory`, and its templates unchanged. Preserve the existing `$code` behavior of creating `.agents/plans/shared-decision-records.md` as an execution artifact; this is not a personal-memory migration.

Do not create `docs/decisions/**` in this configuration repository, change `.gitignore`, backfill historical decisions, add Greptile integration, restore removed lifecycle gates, alter publishing workflows, or install into a live home.

The plan is finalized in chat and ready for `$code`.
