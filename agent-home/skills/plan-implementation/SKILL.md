---
name: plan-implementation
description: Turn a non-trivial implementation idea into an approved native Codex plan.
---

# Plan Implementation

Load `implementation-planning` and run its planning workflow for the user's request.
Keep discovery read-only, ask only decisions that change scope or behavior, and require
explicit approval before producing the finalized plan.

## Lavish View

After approval, keep the complete native plan in the final response as the authoritative
input for `$review-plan` and `$code`. Write that plan verbatim to temporary Markdown, then
render it with `node "$HOME/.agents/skills/plan-implementation/scripts/render-plan.mjs" --input <temporary-plan.md>`.
Open the resulting absolute HTML path with `npx -y lavish-axi <artifact.html>`. Return the
absolute artifact path as the primary clickable `[Open Lavish plan](<target>)` link; if
Lavish reports only a local session URL, use that URL instead.

This fast path ends after opening the artifact and returning its link. Do not run
`lavish-axi poll` unless the user explicitly asks to enter an interactive Lavish feedback
session.

The normal path is deterministic and does not launch an agent or delegate to a model. If
the user explicitly requests a custom diagram, load `super-agent`, read its
`references/model-catalog.yaml`, and use Pi's cataloged `medium` model at `low` thinking;
the prompt must require the `luxury` palette. Custom-diagram delegation is opt-in and may
be slower. Rendering and Lavish failures are non-blocking: report the failure briefly and
always return the native plan.
