---
name: multi-agent-review
description: Run an opt-in adaptive, read-only review swarm with a retained coordinator and fresh native specialists.
---

# Multi-Agent Review

This skill is loaded only when `$review` explicitly selects swarm mode. Load
`code-review`, `agent-swarm`, and `subagent-routing` before proceeding. The native
`review-worker` remains the coordinator and owns synthesis.

## Review contract

The goal is the supplied review goal and persisted plan, if one exists. Review the complete
current working-tree change, including staged, unstaged, and untracked files. Specialists
may inspect surrounding code as evidence but may report findings only against the reviewed
change. The entire workflow is read-only: no edits, fixes, coder or fixer calls, accepted
findings, commits, pushes, or publication. Only the coordinator launches the selected
specialists; specialists never delegate further.

Use the configured native reviewer agents as the default roster. A native model override
has already been parsed by `$review`; pass it unchanged to each selected specialist.

## Adaptive selection

Always select `reviewer-quick` and `reviewer-reasoning`. Add `reviewer-arch` only when the
change crosses or introduces boundaries, abstractions, dependency direction, ownership,
or module structure. Add `reviewer-e2e` only when the change touches public contracts,
APIs, schemas, migrations, configuration, environment contracts, workers, external
integrations, security or data boundaries, roles, locales, or side effects. Keep the set
between two and four specialists.

The coordinator itself performs complete-diff inspection and does not outsource the
selection decision. It uses the smallest justified set and reports missing coverage when
a justified specialist cannot run.

## Shared specialist packet

Give every selected specialist the same packet, changing only its lens:

```text
Goal: the observable review outcome
Scope: the complete current diff and these changed files: <list>
Diff basis: staged, unstaged, and untracked changes in the current worktree
Context: persisted plan path and supplied review context
Exclusions: unrelated files, pre-existing defects, fixes, publication, and delegation
Allowed actions: read-only inspection and bounded repository-defined verification
Models/lifecycle: fresh unkeyed task with this specialist's exact models chain
Lens: the specialist's assigned review dimension
Deliverable: findings only against the reviewed change, with path:line evidence and confidence
Stop: return after the assigned lens is covered or state the concrete blocker
```

## Launch and recovery

Launch all independent selected specialists in the same turn with a fresh `spawn_agent`
call for each. Set each agent to its specialist name and pass the exact model selected by
the roster. Do not reuse a session, pass a task key, or silently choose a fallback model.
Use `wait_agent` for all selected specialists before synthesis. Use `send_message` only
for a bounded clarification and `interrupt_agent` for cancellation. A failed worker is
reported as missing coverage; do not replay its prompt or substitute an implicit model.
Do not treat a model failure as a finding.

## Coordinator synthesis

After the parallel results return, the coordinator owns complete-diff inspection,
untracked-file handling, source re-reading, adversarial refutation, deduplication, severity,
verdict, and bounded repository-defined verification. Treat specialist reports as
hypotheses: refute claims that do not survive source evidence, drop them, and deduplicate
issues that describe the same failure. Assign only the existing `code-review` severity
labels and output contract.

Return findings first with `path:line`, followed by the `code-review` verdict, the
problem-solution check, observed bounded verification, and unresolved live-validation
gaps. Include missing specialist coverage when applicable, but never forward raw reviewer
claims. Stop before live validation and wait for explicit user approval.
