## `$review` invocation

When loaded by the `$review` skill invocation, run this orchestration workflow from the
current primary harness. Load `super-agent` before launching anything.
The parent routes the review but never reviews or edits the change itself.

`$review --ocr` is an explicit opt-in for additional OCR evidence. Consume the flag in
the parent and normalize it to exactly one worker-packet marker, `OCR mode: enabled`;
ordinary `$review` uses `OCR mode: disabled`. The `flash` preset has no OCR runner and
ignores `--ocr`: send `OCR mode: disabled` and tell the user. Never forward `--ocr` or arbitrary user
text as an external command option.

Common forms are:

```text
$review [--preset flash|swarm|full] [--ocr] [--coordinator model] [--swarm] [harness or roster intent] [context]
```

Treat the arguments as user intent, not a strict CLI grammar. Flags are optional hints.
Correct obvious spelling, transposition, punctuation, and wording mistakes when one
interpretation is materially more likely. Do not silently rewrite an explicit model.

When `--preset` is present, load its matching [flash](presets/flash.md),
[swarm](presets/swarm.md), or [full](presets/full.md) reference. Ask once if the value is missing,
unknown, or conflicts with an explicit `direct` or `swarm` mode. Without a preset or an
explicit mode, use the `full` preset, including for a bare `$review` (an audit uses `swarm`:
it has no live test set); outside an approved wave, its live round reports
blocked/unverified unless bounded authorization exists. With an explicit mode and no preset,
preserve that mode and its stopping behavior. Then apply the normalized harness intent
below. Presets never enable OCR or Slopo; `--ocr` remains an independent, explicit choice.

The active wrapper's adapter guide owns launch mechanics; role selection precedes it.
Keep any explicit user roster, harness, or model choice. Otherwise `super-agent` resolves
the catalog role and pins its harness, exact model, and thinking. Report a missing
compatible route rather than silently substituting a harness or lowering effort.

Native findings-only routes and their limits are in
[`workflow/references/native-capabilities.md`](../../workflow/references/native-capabilities.md).
Apply the shared standard to project constraints and finding assessment; do not copy
vendor review instructions into this orchestration guide.

1. Infer coordinator-model intent from a coordinator-like or model-like token and its
   nearby model value. Accept clear variants such as `--cordinator`, `--coordinator`,
   `--corndinator`, `--coord`, `--model`, or equivalent prose. Pass an explicit model
   unchanged and report an unsupported model rather than guessing what it meant.
2. Infer swarm intent from clear variants of swarm, multi-agent, multiple reviewers,
   parallel review, or equivalent wording, including minor misspellings. Respect negation;
   "do not run a parallel review" remains direct mode.
3. Infer harness, agent, model, ratio, and exclusion intent from explicit flags or plain
   language. Treat one model associated with swarm intent as a request for every compatible
   reviewer. Otherwise use configured roles from the selected harnesses. Resolve the
   default harness, model, and thinking from the catalog role; outside Orca, follow the
   current-harness route when the role leaves the harness open.
   Preserve an explicit AGY/Pi roster exactly, without adding or substituting reviewers.
4. Remove tokens consumed as preset, coordinator, swarm, harness, or roster intent. Preserve
   all other text as review context. Treat `audit [path]`, or wording such as "audit this
   codebase", as an audit: the review basis is that tree (the path, or the whole repo)
   instead of a diff, so skip staged-first selection.

State the normalized interpretation briefly before launch. Ask one focused clarification
question only when multiple plausible interpretations would change the selected mode,
coordinator model, or custom roster. A malformed token alone is not a reason to stop.

Canonical example: `--coordinator <exact-model> --swarm, mostly Codex with one OpenCode
reviewer` means swarm mode, that coordinator model when supported, and the requested
harness balance. Harness names identify preferences, not invented commands or roles.

Build the worker prompt with exactly one review mode marker and exactly one OCR marker.
When a preset applies, include `Review preset: <preset>` and the matching reference's
instructions. Omit the preset marker only for an explicit mode without a preset.

- Swarm: `Review mode: swarm`, followed by `Swarm models: default` or
  `Swarm models: <normalized ordered list>`.
- Direct: `Review mode: direct`; omit `Swarm models`.

- OCR enabled: `OCR mode: enabled` when `--ocr` was supplied.
- OCR disabled: `OCR mode: disabled` otherwise.

Include `Harness routing: <normalized explicit request, or catalog role when none>`,
including agent, ratio, and exclusion intent. An explicit AGY/Pi roster remains exact.
Include `Worker tier: <requested tier>` only when the user explicitly requested one.
The coordinator routes each specialist through `super-agent`, which reads the catalog role
entry, applies the local concurrency limit, and falls back only through that role's
candidate list.

In approved workflow context, require the exact complete approved plan and amendments;
each reviewer reads them in full and checks the current slice's intended result and
exclusions. A plan summary alone is insufficient. Use the recorded slice base and inspect
all changes from that base through the current head, plus task-owned staged, unstaged, and
untracked worktree changes. When the workflow passes a fix round's `Review focus` range,
review the changes in that range and the code they reach, with the slice comparison as
context. Do not let staged-first selection omit committed checkpoint
changes or task-owned untracked files. Pass the base revision, inspected head, the
`Review focus` when the workflow passes one, and explicit task-owned path list in the
reviewer packet; reviewers report those revisions and the worktree changes they inspected.
Outside workflow context, retain staged-first selection
and include the exact persisted plan path established by `$code` when present. The packet
must preserve the normalized OCR marker.
When supplied, also pass the exact workflow context, current slice scope, exclusions, and
authorization bounds; the context alone cannot enable live testing or publication.

Before launch, the coordinating or direct review agent loads the selected `decision-records`
skill, discovers applicable records, and compares the reviewed behavior with their protected
invariants. Pass the exact record paths and relevant protected constraints to every
specialist. Intent conflicts, including removals or weakening within the reviewed change,
must be reported with the record and implementation evidence for the developer to resolve.

Use the selected harness's configured review coordinator. In Codex this is `review-worker`.
If another harness has no named coordinator but exposes a documented general agent, give
that agent the complete coordinator packet. Do not invent task keys, commands, roles, or
unsupported model substitutions.

For `flash`, resolve the catalog role `reviewer-fast` through `super-agent` and route
directly to one reviewer; do not add a coordinator. The harness's native agent role for it
is `reviewer-quick`. For ordinary direct and swarm review, use the selected harness's configured
review coordinator through `super-agent`. A coordinator that delegates (swarm mode, the
`full` primary review included) launches with `Catalog role: sub_orchestrator` and the
`Size:` from the workflow context, `medium` for a `small` slice (the catalog has no small
entry). Direct review and the `full` verifier keep `reviewer-fast`. For
`full`, route the primary report to the separate fresh verifier specified in the preset
reference; the parent routes reports and does not review or edit them. For `full`, the
parent also starts, resets, and
stops the app for the live round as its preset reference defines, and routes the testers
only after that reference's authorization check. Testers resolve the catalog role
`computer-controller`; the harness's native agent role for them is
`computer-controller`, and their packet says the job is a live test.

- `agent`: the native role of catalog `reviewer-fast` (`reviewer-quick`) for `flash`,
  otherwise the selected harness's best matching configured review coordinator
- `prompt`: the complete relevant diff basis (in audit mode, the audit tree) and stated goal, exact mode, swarm-model,
  and OCR markers, harness-routing intent, complete approved plan and amendments when in
  workflow context, remaining context, and permission to delegate only for swarm mode
- `model`: the exact catalog model selected for the route, unless the user explicitly
  named a compatible model

For the separate `full` verifier, dispatch a fresh configured review coordinator in direct
mode through `super-agent` using catalog `reviewer-fast`, or the explicit human override.
Record the primary coordinator's route as provenance; do not inherit its model. Verify the
verifier's effective model and thinking when the runtime exposes them.

Wait for the required workers, return findings and verdict, and stop. Do not invoke coder,
fixers, accept findings automatically, or publish anything.

The coordinator assigns only the justified review lenses and routes fresh specialists
through `super-agent`. Codex routes use the configured Codex reviewers; other routes
use their own configured roles. Specialists never delegate further. Readers are concurrent;
writers remain forbidden. Retained follow-ups use the selected harness's exact-session
identity checks. The coordinator and specialists use bounded verification; publishing and
unapproved edits remain unavailable.

For swarm modes, follow [swarm coordination](swarm-coordination.md) within
this `$review` run. It is not a separate skill or user entry point.
