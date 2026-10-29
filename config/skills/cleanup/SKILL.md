---
name: cleanup
description: Run the explicit `$cleanup` findings-only deslop audit with one fresh read-only coordinator, optionally using bounded Slopo duplication evidence.
---

# Cleanup Gate

Cleanup remains findings-only. Claude `/simplify`, `/batch`, and other mutating or paid
cloud routes do not replace this gate; see
[`workflow/references/native-capabilities.md`](../workflow/references/native-capabilities.md)
for native route limits.

Run only for an explicit `$cleanup` invocation or an approved complete workflow's cleanup
stage. Never trigger this workflow from `$code`, `$review`, or ordinary implementation.
Load `super-agent` before
launching the configured `cleanup-worker`; the parent owns scope and orchestration,
and the worker returns findings without changing the repository.

An approved workflow may invoke this skill at its cleanup stage with the exact plan,
scope, exclusions, progress path, and authorization summary. Context does not change this
skill's read-only, findings-only contract: the workflow parent verifies findings before
it decides whether to route a correction. Standalone `$cleanup` keeps its read-only,
findings-only contract.

```text
$cleanup [--slopo] [goal or persisted-plan context]
```

## Establish scope

1. Use the exact persisted plan path established by `$code` when one exists.
   Otherwise require enough explicit goal context in `$ARGUMENTS` to identify the
   approved behavior that must remain unchanged. Stop rather than infer a missing goal.
2. Capture complete Git status, staged and unstaged diffs, and untracked files. Identify
   task-owned changes from the plan, goal, and accepted corrections while preserving
   pre-existing and unrelated worktree changes. In approved workflow context, compare from
   the recorded slice base through the current head so committed checkpoint changes are
   included, then add later task-owned staged, unstaged, and untracked changes. When the
   workflow supplies a comparison basis, such as a later round's previous cleanup checkpoint,
   audit from that basis and use the slice base comparison as context. Stop if
   ownership is ambiguous.
3. Skip cleanup only when the complete task-owned comparison is empty. In workflow context,
   a clean post-checkpoint status alone does not establish that; report the base and
   checkpoint revisions used.
4. Inspect only the task diff and enough surrounding code, callers, tests, and project
   structure to verify a finding. Do not use diff size as a target.

## Launch

Launch exactly one fresh `cleanup-worker` through `super-agent`, with
`Catalog role: sub_orchestrator` and the `Size:` from the workflow context (`medium` for a
`small` slice, as the catalog has no small entry; a standalone run proposes the size in one
line and waits for the user's OK), and with the plan or goal, task-owned paths and
exclusions, the complete status snapshot, and the workflow comparison basis when supplied.
Grant it delegation for the cleanup swarm: maximum depth
one, at most six read-only descendants, none of which may delegate. A workflow may pass
`Audit depth: light`; pass it on. Without it, the audit is full. The packet must contain
exactly one `Slopo mode` marker: `Slopo mode: enabled` when `$cleanup --slopo` was
supplied, otherwise `Slopo mode: disabled`. Consume the flag in the parent; never forward
it as shell input or user arguments.

When present, pass the exact workflow context and current slice scope in a separate field;
it does not expand the worker's read-only audit or Slopo opt-in.

The coordinator audits production and tests and runs the read-only checks
`code-quality` requires, reporting each failure as a finding. It always runs the cleanup
swarm that the `cleanup-worker` role defines: `swarms` lens specialists, using reviewers
such as `reviewer-arch` and `reviewer-reasoning`, plus `reviewer-high` simplest-design
reviewers: one, or two under the risk condition of the review swarm (security, data,
public contracts, migrations, or a large or multi-module change; see
[swarm coordination](../review/references/swarm-coordination.md), which also owns the
`pi` entry rule of three workers per listed pi model). With `Audit depth: light`, the role's
one-agent swarm replaces the list above. Its return ends with the roster of launched and
self-covered lenses.

## Optional Slopo evidence

Without `--slopo`, do not invoke or probe Slopo. When enabled, run from the repository
root using these fixed argv vectors only, with no remaining user arguments. If
`slopo.conf.yaml` does not exist, first run `["slopo", "init"]`, report the created
template, then continue with validation:

- `["slopo", "show-config"]`
- `["slopo", "index"]`
- `["slopo", "embed"]`
- `["slopo", "analyze"]`

Before analysis, verify configured database and report locations are outside tracked
repository state or ignored. The new `slopo.conf.yaml` template is the only expected
worktree mutation; never edit it automatically, and report incomplete required fields as a
Slopo gap. If configuration is unsafe, or a command is unavailable, fails, returns an
unreadable report or output, or causes any other worktree mutation, report the Slopo gap and
continue the native audit. Consider only clusters intersecting a task-owned changed
hunk; similarity alone is not a finding, and both implementations must confirm duplicated
responsibility or logic. Never install, configure, authenticate, ignore, delete, stage,
or commit other Slopo state; never edit the generated template automatically.

## Return

Return findings only, ordered by expected simplification value. Each finding includes a
category, `path:line`, source evidence, concrete maintenance or complexity cost, the
smallest simplification direction, and confidence. A production element with no
demonstrated need is a finding even when it looks harmless. Audit every added or modified
test with `test-audit`'s junk patterns, value bar, and retention bar, as findings only.
Do not produce edits, a correction brief, automatic acceptance, or invented work. Return
`Lean already. No cleanup findings.` when appropriate.

Capture complete Git status again after the worker returns. Apart from a reported
`slopo.conf.yaml` created by the explicit `--slopo` flow, any unexpected mutation is a
contract violation: report it and do not revert or delete files automatically.
