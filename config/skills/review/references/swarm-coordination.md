# Swarm coordination inside `$review`

Use this reference when `$review` explicitly selects a swarm-based preset. Load the
review skill's `references/code-review.md` and `super-agent` before proceeding. The
selected review coordinator owns synthesis; in Codex this is `review-worker`.

## Review contract

The goal is the supplied review goal and persisted plan, if one exists. In approved workflow
context, every reviewer reads the complete plan and amendments; a summary is insufficient.
Review the complete
current working-tree change, including staged, unstaged, and untracked files. In approved
workflow context, also review everything from the recorded slice base through the current
head, so committed checkpoint changes are not missed. A `Review focus` range narrows what to
review; the slice diff stays context. With a `Review focus`, a finding counts when the
`Review focus` change causes it, including breaks in code it reaches. Specialists may
inspect surrounding code as evidence but may report findings only against the reviewed
change. In audit mode the reviewed change is the named tree: `Scope` and `Diff basis` name
it, and findings may cite any file in it. The entire workflow is read-only: no edits, fixes, coder or fixer calls, accepted
findings, commits, pushes, or publication. Only the coordinator launches the selected
specialists; specialists never delegate further.

Assign review lenses before choosing harnesses. Route each lens to a suitable configured
reviewer in that harness; never reuse a Codex role name as an external role. A compatible
model override and normalized harness intent have already been parsed by `$review`; pass
them unchanged to routing.
Route every lens and the coordinator through `super-agent`'s catalog role entries unless
the user or approved plan supplied a compatible explicit route. Count a cataloged local
coordinator against `max_local_concurrency`, and report every fallback and local
serialization in the final roster.

## Adaptive selection

Always select quick and reasoning lenses. Add architecture only when the
change crosses or introduces boundaries, abstractions, dependency direction, ownership,
or module structure. Add integration only when the change touches public contracts,
APIs, schemas, migrations, configuration, environment contracts, workers, external
integrations, security or data boundaries, roles, locales, or side effects. Keep the set
between two and four specialists by default. When the user requests five, add an
independent adversarial pass over the highest-risk selected lens. Lens specialists use the
catalog `swarms` role.

Every swarm also launches strong reviewers from the catalog `reviewer-high` role: one by
default, two when the change touches security, data, public contracts, or migrations, or
is large or spans several modules. The first takes the first entry that can run and the
second the next one (the same entry when only one can run), each asked for a slightly
different angle so they do not return the same answer. When the selected entry is a `pi`
entry, it launches three workers per listed pi model instead of one, each asked for a
slightly different angle so they do not all give the same answer; they count as that one
strong reviewer. They are not lens specialists: each
reviews the complete change on its own against the goal and plan, covering correctness,
design, and whether the change is simpler than it needs to be. They run concurrently with the lens specialists,
receive the same packet with `Lens: complete change`, and their findings go through the
same synthesis. When a strong reviewer cannot run, the review continues and its report
tells the user about the reduced coverage. An explicit user roster wins: do not add strong
reviewers to it, and report the skipped strong review as missing coverage.

When Codex is selected, map these lenses to `reviewer-quick`, `reviewer-reasoning`,
`reviewer-arch`, and `reviewer-e2e`. For another harness, select its actual configured
reviewer whose description best matches the lens. When no catalog role, roster, or harness
preference fixes a worker's harness, allocate at least half of the specialists,
rounded up, to the current harness and
use other available harnesses for the remainder. Preserve any explicit or review-preset
preference, including an exact AGY/Pi roster.

The coordinator itself performs complete-diff inspection and does not outsource the
selection decision. It uses the smallest justified lens set, adds the strong reviewers
unless an explicit roster applies, and reports missing coverage when a justified specialist cannot run.
Before dispatch, it discovers applicable decision records and includes their exact paths and
protected constraints in the shared specialist packet.

## Shared specialist packet

Give every selected specialist the same packet, changing only its lens:

```text
Goal: the observable review outcome
Scope: the complete current diff and these changed files: <list> (with a `Review focus`: its changes and the code they reach) (audit mode: the named tree)
Diff basis: slice base..head plus task-owned worktree changes in workflow context; otherwise staged, unstaged, and untracked changes in the current worktree (audit mode: the named tree)
Base/head: the recorded slice base revision and inspected head (workflow context only)
Review focus: <tree>..<tree> (only when the workflow passes one)
Task-owned paths: the explicit path list to review (workflow context only)
Context: complete approved plan and amendments when in workflow; otherwise persisted plan path when available
Workflow context: slice, stage, local progress path, scope, exclusions, and named authorizations
Decision records: applicable record paths and protected constraints
Exclusions: unrelated files, pre-existing defects (audit mode: none, the named tree is in scope), fixes, publication, and delegation
Allowed actions: read-only inspection and bounded repository-defined verification
Catalog role: the role the coordinator routed through `super-agent`
Harness/model/thinking: the resolved harness, exact model, and thinking level
Lifecycle: fresh task through the active wrapper or current-harness equivalent
Lens: the specialist's assigned review dimension
Deliverable: findings only against the reviewed change, with path:line, scope, source evidence, and confidence
Stop: return after the assigned lens is covered or state the concrete blocker
```

## Launch and recovery

Route all independent selected specialists before launching them, then launch them in the
same turn when the active wrapper supports it. Use the wrapper through `super-agent`
for fresh-task, wait, bounded-message, and cancellation operations; without a wrapper,
use the current harness's native equivalents. Do not reuse a session or pass a task key.
Outside a wrapper, cross-harness execution requires the explicitly requested documented
one-shot adapter. On explicit quota exhaustion, use `super-agent` to replace only
that lens and report the final route. Other failed workers are missing coverage; do not
replay prompts or treat a model failure as a finding.

## Coordinator synthesis

After the parallel results return, the coordinator owns complete-diff inspection,
untracked-file handling, source re-reading, adversarial refutation, deduplication, severity,
verdict, and bounded repository-defined verification. Treat specialist reports as
hypotheses: refute claims that do not survive source evidence, drop them, and deduplicate
issues that describe the same failure. Apply the P0-P3, scope, evidence, and
blocked/unverified contract from `references/code-review.md`. A workflow context does not
authorize fixes, live testing, or publication.

Return the report in the output contract of `references/code-review.md`: findings with
`path:line`, the verdict, the inspected head and relevant base, the problem-solution check,
observed bounded verification, and blocked/unverified evidence. Include missing
specialist coverage when applicable, but never forward raw reviewer claims. Stop before
live validation and wait for explicit bounded authorization.
