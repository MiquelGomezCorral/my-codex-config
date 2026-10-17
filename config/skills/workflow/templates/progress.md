# Workflow progress

Keep this file in the run's folder under the repository's `agent-memory/workflow-runs/<run-id>/`,
associated with the active wrapper run. Use a unique local run identifier
when no wrapper exists. Keep it out of the tracked tree. It is a reconciliation aid,
not proof of approval or completion.

## Run

- Orca run: `<run id>`
- Repository: `<repository path or identifier>`
- Current stage: `<stage>`
- Planning mode: `<brief|full>`
- Last completed gate and evidence: `<gate and evidence reference>`
- Next action: `<stage/action and owner>`
- Human decision pending: `<decision and reason, or none>`
- Current slice: `<slice id or name, or none during planning>`
- Wave plan: `<pending until finalized, then absolute private agent-memory/plans/ path>`
- Wave approval: `<pending|approval reference and bounds>`
- Planning evidence and artifacts: `<source/diagram/HTML references or pending>`
- Approved amendments: `<plan references or none>`
- Scope and exclusions: `<short summary>`

## Approvals

| Action | Approved bounds | Approval reference | State |
| --- | --- | --- | --- |
| `<action or none>` | `<target, limits, and side effects>` | `<human approval>` | `<pending/done>` |

## Slices

| Slice | Depends on | Slice base revision | Worktree | Checkpoint hash | Final commit hash | Checks/reviews | State |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `<id>` | `<accepted predecessor or none>` | `<revision>` | `<workspace>` | `<hash or none>` | `<hash or none>` | `<evidence refs>` | `<state>` |

## Delivery

- PR and target: `<link/branch or none>`
- CI and review: `<state and evidence>`
- Human presentation: `<state and evidence>`
- Named shipping actions: `<approved actions and state>`
- Completion: `<done/partial/blocked>`

## Evidence and open work

- Evidence links: `<references; no raw logs>`
- Deferred findings: `<scope and reason, or none>`
- Unresolved blockers: `<owner and next decision, or none>`
- Lessons: `<reusable facts, or none>`
