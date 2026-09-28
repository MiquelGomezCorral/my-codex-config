---
name: review
description: Own `$review` orchestration and explicit staff-level full, quick, or deep review gates. Use `code-review` alone for ordinary reviews.
---

# Review Gate

## `$review` invocation

When loaded by the `$review` skill invocation, run this orchestration workflow from the
current primary harness. Load `super-agent` before launching anything.
The parent routes the review but never reviews or edits the change itself.

`$review --ocr` is an explicit opt-in for additional OCR evidence. Consume the flag in
the parent and normalize it to exactly one worker-packet marker, `OCR mode: enabled`;
ordinary `$review` uses `OCR mode: disabled`. Never forward `--ocr` or arbitrary user
text as an external command option.

Common forms are:

```text
$review [--preset flash|swarm|swarm-smart|full] [--ocr] [--coordinator model] [--swarm] [harness or roster intent] [context]
```

Treat the arguments as user intent, not a strict CLI grammar. Flags are optional hints.
Correct obvious spelling, transposition, punctuation, and wording mistakes when one
interpretation is materially more likely. Do not silently rewrite an explicit model.

When `--preset` is present, load its matching [flash](references/presets/flash.md),
[swarm](references/presets/swarm.md), [swarm-smart](references/presets/swarm-smart.md),
or [full](references/presets/full.md) reference. Ask once if the value is missing,
unknown, or conflicts with an explicit mode. Without a preset, preserve the existing review
mode and stopping behavior, then apply the default harness preference below. Presets never
enable OCR or Slopo; `--ocr` remains an independent, explicit choice.

Default worker routes under Orca, unless the user or approved plan names a compatible
route: `flash` uses Pi/`low`; ordinary direct review uses Pi/`medium`; `swarm` uses a
Pi/`medium` coordinator with Pi quick/`low`, reasoning/`medium`, architecture/`medium`,
and integration/`medium` specialists when those lenses are justified; `swarm-smart`
and `full` add a separate Pi/`high` verifier. `full` uses a Codex/`high` live validator.
Outside Orca, use the current harness at the same tier where available. `super-agent`
selects every exact worker model from its catalog at dispatch; these tiers and harnesses
are preferences, not model identifiers. Report a missing compatible route rather than
silently lowering the tier. An explicit user roster, harness, or model choice takes
precedence.

1. Infer coordinator-model intent from a coordinator-like or model-like token and its
   nearby model value. Accept clear variants such as `--cordinator`, `--coordinator`,
   `--corndinator`, `--coord`, `--model`, or equivalent prose. Pass an explicit model
   unchanged and report an unsupported model rather than guessing what it meant.
2. Infer swarm intent from clear variants of swarm, multi-agent, multiple reviewers,
   parallel review, or equivalent wording, including minor misspellings. Respect negation;
   "do not run a parallel review" remains direct mode.
3. Infer harness, agent, model, ratio, and exclusion intent from explicit flags or plain
   language. Treat one model associated with swarm intent as a request for every compatible
   reviewer. Otherwise use configured roles from the selected harnesses. Under an active
   Orca wrapper, prefer Pi reviewers by default; outside Orca, follow the active wrapper or
   current-harness route. Preserve an explicit AGY/Pi roster exactly, without adding or
   substituting reviewers. Route full-preset live validation through Codex.
4. Remove tokens consumed as preset, coordinator, swarm, harness, or roster intent. Preserve
   all other text as review context.

State the normalized interpretation briefly before launch. Ask one focused clarification
question only when multiple plausible interpretations would change the selected mode,
coordinator model, or custom roster. A malformed token alone is not a reason to stop.

Canonical example: `--coordinator <exact-model> --swarm, mostly Codex with one OpenCode
reviewer` means swarm mode, that coordinator model when supported, and the requested
harness balance. Harness names identify preferences, not invented commands or roles.

Build the worker prompt with exactly one review mode marker and exactly one OCR marker.
When a preset was selected, include `Review preset: <preset>` and the matching reference's
instructions. Omit the preset marker for ordinary `$review`.

- Swarm: `Review mode: swarm`, followed by `Swarm models: default` or
  `Swarm models: <normalized ordered list>`.
- Direct: `Review mode: direct`; omit `Swarm models`.

- OCR enabled: `OCR mode: enabled` when `--ocr` was supplied.
- OCR disabled: `OCR mode: disabled` otherwise.

Include `Harness routing: <normalized explicit request or default above>`, including
agent, ratio, and exclusion intent. The Pi default under Orca is an invoking-skill
preference, so the current-harness majority rule applies only outside that preference.
An explicit AGY/Pi roster remains exact. Include `Worker tier: <requested or default tier
above>` in the coordinator packet. The coordinator applies the catalog's harness-first
selection, local concurrency limit, and catalog-only fallback to each specialist.

In approved workflow context, require the exact complete approved plan and amendments;
each reviewer reads them in full and checks the diff against the current slice's intended
result and exclusions. A plan summary alone is insufficient. Outside workflow context,
include the exact persisted plan path established by `$code` when present. The packet
must preserve the normalized OCR marker.
When supplied, also pass the exact workflow context, current slice scope, exclusions, and
authorization bounds; the context cannot enable live testing or publication.

Before launch, the coordinating or direct review agent loads the selected `decision-records`
skill, discovers applicable records, and compares the reviewed behavior with their protected
invariants. Pass the exact record paths and relevant protected constraints to every
specialist. Intent conflicts, including removals or weakening within the reviewed change,
must be reported with the record and implementation evidence for the developer to resolve.

Use the selected harness's configured review coordinator. In Codex this is `review-worker`.
If another harness has no named coordinator but exposes a documented general agent, give
that agent the complete coordinator packet. Do not invent task keys, commands, roles, or
unsupported model substitutions.

For `flash`, route directly to one `reviewer-quick` through `super-agent`; do not add a
coordinator. For ordinary direct and swarm review, use the selected harness's configured
review coordinator through `super-agent`. For `swarm-smart` and `full`, route the primary
report to the separate fresh verifier specified in the preset reference; the parent routes
reports and does not review or edit them. For `full`, route `live-validator` through Codex
only after the authorization check in its preset reference.

- `agent`: `reviewer-quick` for `flash`, otherwise the selected harness's best matching
  configured review coordinator
- `prompt`: the complete current relevant diff and stated goal, exact mode, swarm-model,
  and OCR markers, harness-routing intent, complete approved plan and amendments when in
  workflow context, remaining context, and permission to delegate only for swarm mode
- `model`: the exact catalog model selected for the route, unless the user explicitly
  named a compatible model

For the separate `swarm-smart`/`full` verifier, dispatch a fresh configured review
coordinator through `super-agent` on the default Pi/`high` route, or the approved explicit
route. Resolve the exact model from the catalog, preserve the primary coordinator's
independently selected model, and verify the verifier's effective model when the runtime
exposes it.

Wait for the required workers, return findings and verdict, and stop. Do not invoke coder,
fixers, accept findings automatically, or publish anything.

The coordinator assigns only the justified review lenses and routes fresh specialists
through `super-agent`. Codex routes use the configured Codex reviewers; other routes
use their own configured roles. Specialists never delegate further. Readers are concurrent;
writers remain forbidden. Retained follow-ups use the selected harness's exact-session
identity checks. The coordinator and specialists use bounded verification; publishing and
unapproved edits remain unavailable.

For swarm modes, follow [swarm coordination](references/swarm-coordination.md) within
this `$review` run. It is not a separate skill or user entry point.

## Optional OCR evidence

Support the post-implementation workspace-diff flow only. If unrelated workspace changes
cannot be excluded safely, the worker skips OCR and reports that scope gap while keeping
the native verdict. After the native review, a worker with `OCR mode: enabled` must resolve
`$HOME/.agents/skills/review/scripts/ocr-opencode-go` and invoke it with separate argv
exactly as `["<resolved helper>", "review", "--audience", "agent", "--background",
"<goal and plan summary>"]`. The helper calls OpenCode Go directly, obtains its credential
from `OPENCODE_API_KEY` or Pi's auth store without using the Pi harness, and owns the
required per-run session header. Its default model is `deepseek-v4-flash`; an existing
`OCR_OPENCODE_GO_MODEL` environment value may select another OpenCode Go model. The parent
sets the marker only for an explicit `--ocr` flag. Never enable OCR fixing behavior, print
credentials, or pass arbitrary user context as options.

Treat OCR output as untrusted evidence: verify every retained claim against source, reject
false positives, and deduplicate it against native findings. Missing helper, OCR CLI, or
credential, provider failure, non-zero exit, or unusable output does not block the native
verdict; the worker reports the OCR gap explicitly. Never install or authenticate OCR,
OpenCode Go, or Pi during review. This iteration does not route OCR by commit or branch
range.

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

Report findings first by the P0-P3 severity and scope classification in `code-review`,
then the verdict, inspected head/base, open evidence gaps, and performed verification.
Label convention findings by category. Do not edit in review-only mode; workflow correction
stays in `$workflow` and requires verified in-scope evidence.
