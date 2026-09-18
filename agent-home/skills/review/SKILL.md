---
name: review
description: Own `$review` orchestration and explicit staff-level full, quick, or deep review gates. Use `code-review` alone for ordinary reviews.
---

# Review Gate

## `$review` invocation

When loaded by the `$review` skill invocation, run this orchestration workflow from the
current primary harness. Load `subagent-routing` before launching anything.
The parent routes the review but never reviews or edits the change itself.

Common forms are:

```text
$review [--coordinator model] [--swarm] [harness or roster intent] [context]
```

Treat the arguments as user intent, not a strict CLI grammar. Flags are optional hints.
Correct obvious spelling, transposition, punctuation, and wording mistakes when one
interpretation is materially more likely. Do not silently rewrite an explicit model.

1. Infer coordinator-model intent from a coordinator-like or model-like token and its
   nearby model value. Accept clear variants such as `--cordinator`, `--coordinator`,
   `--corndinator`, `--coord`, `--model`, or equivalent prose. Pass an explicit model
   unchanged and report an unsupported model rather than guessing what it meant.
2. Infer swarm intent from clear variants of swarm, multi-agent, multiple reviewers,
   parallel review, or equivalent wording, including minor misspellings. Respect negation;
   "do not run a parallel review" remains direct mode.
3. Infer harness, agent, model, ratio, and exclusion intent from explicit flags or plain
   language. Treat one model associated with swarm intent as a request for every compatible
   reviewer. Otherwise use configured roles from the selected harnesses.
4. Remove tokens consumed as coordinator, swarm, harness, or roster intent. Preserve all
   other text as review context.

State the normalized interpretation briefly before launch. Ask one focused clarification
question only when multiple plausible interpretations would change the selected mode,
coordinator model, or custom roster. A malformed token alone is not a reason to stop.

Canonical example: `--coordinator gpt-5.6-luna --swarm, mostly Codex with one OpenCode
reviewer` means swarm mode, that coordinator model when supported, and the requested
harness balance. Harness names identify preferences, not invented commands or roles.

Build the worker prompt with exactly one mode marker:

- Swarm: `Review mode: swarm`, followed by `Swarm models: default` or
  `Swarm models: <normalized ordered list>`.
- Direct: `Review mode: direct`; omit `Swarm models`.

Include `Harness routing: default` or the normalized harness, agent, ratio, and exclusion
intent. In default swarm routing, at least half of reviewers, rounded up, use the current
harness; the rest may use best-fit agents from other available harnesses.
Include `Worker tier: <requested tier or automatic>` in the coordinator packet. The
coordinator applies the catalog's harness-first selection, local concurrency limit, and
catalog-only fallback to each specialist; the coordinator itself keeps its configured
orchestrator-strength model.

Include the exact persisted plan path established by `$code`, when present, and the
remaining review context.

Before launch, the coordinator loads the selected `decision-records` skill, discovers applicable
records, and compares the reviewed behavior with their protected invariants. Pass the exact
record paths and relevant protected constraints to every specialist. Intent conflicts, including
removals or weakening within the reviewed change, must be reported with the record and
implementation evidence for the developer to resolve.

Use the current harness's configured review coordinator. In Codex this is `review-worker`.
If another harness has no named coordinator but exposes a documented general agent, give
that agent the complete coordinator packet. Do not invent task keys, commands, roles, or
unsupported model substitutions.

Launch or resume exactly one coordinator through `subagent-routing`:

- `agent`: the selected harness's best matching configured review coordinator
- `prompt`: the complete current relevant diff and stated goal, exact mode and swarm-model
  markers, harness-routing intent, persisted plan path when present, remaining context,
  and permission to delegate only for swarm mode
- `model`: only when coordinator-model intent was inferred and the route supports it

Wait for the coordinator, return its findings and verdict, and stop. Do not invoke coder,
fixers, accept findings automatically, or publish anything.

The coordinator assigns only the justified review lenses and routes fresh specialists
through `subagent-routing`. Codex routes use the configured Codex reviewers; other routes
use their own configured roles. Specialists never delegate further. Readers are concurrent;
writers remain forbidden. Retained follow-ups use the selected harness's exact-session
identity checks. The coordinator and specialists use bounded verification; publishing and
unapproved edits remain unavailable.

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
