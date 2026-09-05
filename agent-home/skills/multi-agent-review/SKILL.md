---
name: multi-agent-review
description: Run an opt-in adaptive, read-only review swarm with a retained coordinator and fresh specialists from available agent harnesses.
---

# Multi-Agent Review

This skill is loaded only when `$review` explicitly selects swarm mode. Load
`code-review`, `agent-swarm`, and `subagent-routing` before proceeding. The selected
review coordinator owns synthesis; in Codex this is `review-worker`.

## Review contract

The goal is the supplied review goal and persisted plan, if one exists. Review the complete
current working-tree change, including staged, unstaged, and untracked files. Specialists
may inspect surrounding code as evidence but may report findings only against the reviewed
change. The entire workflow is read-only: no edits, fixes, coder or fixer calls, accepted
findings, commits, pushes, or publication. Only the coordinator launches the selected
specialists; specialists never delegate further.

Assign review lenses before choosing harnesses. Route each lens to a suitable configured
reviewer in that harness; never reuse a Codex role name as an external role. A compatible
model override and normalized harness intent have already been parsed by `$review`; pass
them unchanged to routing.

## Adaptive selection

Always select quick and reasoning lenses. Add architecture only when the
change crosses or introduces boundaries, abstractions, dependency direction, ownership,
or module structure. Add integration only when the change touches public contracts,
APIs, schemas, migrations, configuration, environment contracts, workers, external
integrations, security or data boundaries, roles, locales, or side effects. Keep the set
between two and four specialists by default. When the user requests five, add an
independent adversarial pass over the highest-risk selected lens.

When Codex is selected, map these lenses to `reviewer-quick`, `reviewer-reasoning`,
`reviewer-arch`, and `reviewer-e2e`. For another harness, select its actual configured
reviewer whose description best matches the lens. Without an explicit roster, allocate at
least half of the specialists, rounded up, to the current harness and use other available
harnesses for the remainder.

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
Harness/model/lifecycle: selected route, fresh task, and allowed quota substitution
Lens: the specialist's assigned review dimension
Deliverable: findings only against the reviewed change, with path:line evidence and confidence
Stop: return after the assigned lens is covered or state the concrete blocker
```

## Launch and recovery

Route all independent selected specialists before launching them, then launch them in the
same turn when their harness mechanisms support it. Use each selected harness's fresh-task,
wait, bounded-message, and cancellation operations. Do not reuse a session or pass a task
key. On explicit quota exhaustion, use `subagent-routing` to replace only that lens and
report the final route. Other failed workers are missing coverage; do not replay prompts
or treat a model failure as a finding.

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
