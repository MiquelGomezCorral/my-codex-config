---
name: review
description: Own `$review` orchestration and explicit staff-level full, quick, or deep review gates. Use `code-review` alone for ordinary reviews.
---

# Review Gate

## `$review` invocation

When loaded by the `$review` skill invocation, run this orchestration workflow from the
Codex primary harness. Load `subagent-routing` before launching anything.
The parent routes the review but never reviews or edits the change itself.

Common forms are:

```text
$review [--coordinator native-model] [--swarm] [context]
```

Treat the arguments as user intent, not a strict CLI grammar. Flags are optional hints.
Correct obvious spelling, transposition, punctuation, and wording mistakes when one
interpretation is materially more likely. Do not silently rewrite an explicit model.

1. Infer coordinator-model intent from a coordinator-like or model-like token and its
   nearby model value. Accept clear variants such as `--cordinator`, `--coordinator`,
   `--corndinator`, `--coord`, `--model`, or equivalent prose. Pass an explicit native
   model unchanged and report an unsupported model rather than selecting another one.
2. Infer swarm intent from clear variants of swarm, multi-agent, multiple reviewers,
   parallel review, or equivalent wording, including minor misspellings. Respect negation;
   "do not run a parallel review" remains direct mode.
3. Treat one explicit native model associated with swarm intent as a request to use that
   model for every reviewer. Otherwise swarm mode uses the configured native roster.
4. Remove the tokens consumed as coordinator, swarm, or roster intent. Preserve all other
   text as review context.

State the normalized interpretation briefly before launch. Ask one focused clarification
question only when multiple plausible interpretations would change the selected mode,
coordinator model, or custom roster. A malformed token alone is not a reason to stop.

Canonical example: `--coordinator gpt-5.6-luna --swarm` means the native
`gpt-5.6-luna` coordinator, swarm mode, and the default roster.

Build the worker prompt with exactly one mode marker:

- Swarm: `Review mode: swarm`, followed by `Swarm models: default` or
  `Swarm models: <normalized ordered list>`.
- Direct: `Review mode: direct`; omit `Swarm models`.

Include the exact persisted plan path established by `$code`, when present, and the
remaining review context.

Use `review-worker` as the native coordinator. Do not invent task keys or silently change a
selected model.

Launch or resume exactly one coordinator with `spawn_agent` or `followup_task`:

- `agent`: `review-worker`
- `prompt`: the complete current relevant diff and stated goal, exact mode and swarm-model
  markers, persisted plan path when present, and remaining context
- `model`: only when coordinator-model intent was inferred

Wait for the coordinator, return its findings and verdict, and stop. Do not invoke coder,
fixers, accept findings automatically, or publish anything.

The coordinator keeps a narrow specialist allowlist and launches swarm specialists as
fresh native agents. Nested delegation is denied by the worker role. Readers are
concurrent; writers are serialized per worktree. Follow-ups use `followup_task` only for
the exact owned session, and an ownership mismatch starts a fresh worker rather than
reusing a foreign session. The coordinator and specialists use bounded verification;
publishing and unapproved edits remain unavailable.

## Review modes

When loaded to perform a review rather than orchestrate `$review`, load `code-review` for
evidence standards and correctness. Inspect the staged diff first; use the unstaged diff
when nothing is staged.

- `full`: correctness review plus convention audit.
- `quick`: convention audit only.
- `deep`: correctness review only, with all justified specialist coverage.

## Convention Audit

Inspect only changed files. Check type inference, legacy paths, unnecessary
abstractions, framework-specific conventions, naming, documentation drift, and dead
code. Load a reference only when the diff touches its domain:

- [Type inference](references/type-inference-checks.md)
- [Legacy cleanup](references/legacy-checks.md)
- [Effect](references/effect-checks.md)

Report findings first by severity, then the `code-review` verdict, open questions, and
observed verification. Label convention findings by category. Do not edit in
review-only mode; during an authorized implementation, fix only blocking in-scope
findings and reverify.
