---
name: agent-prompt-writing
description: Write or revise system prompts for autonomous or tool-using agents, subagents, MCP assistants, and orchestrators. Do not use for one-shot classification or generation prompts.
---

# Agent Prompt Writing

Every token competes for attention. Use the smallest prompt that prevents observed
failure while staying specific enough to guide action.

## Capture Intent

Before drafting, establish:

- Agent type, caller, and observable success.
- Scope and non-goals.
- Tools, their contracts, and priority.
- Static, per-turn, retrieved, and persistent context.
- Output format and known failure modes.

Ask only for decisions that cannot be inferred from the current system.

## Prompt Shape

Include only applicable sections:

1. Identity and objective.
2. Scope and non-goals.
3. Operating principles.
4. Tool catalog and ordered selection rule.
5. Context and state.
6. Behavioral rules.
7. Output contract.
8. Failure and escalation.
9. Two to five canonical examples when examples add signal.

Identity, tool priority, output contract, and failure handling are required for a
tool-using agent. Use exact tool names and state when not to use each overlapping tool.
Prefer native structured output over prose that merely asks for JSON.

## Writing Rules

- Use the right altitude: concrete heuristics, not brittle edge-case scripts or vague
  values such as "be helpful."
- Name recurring failure cases and explain nonobvious rationale.
- Give measurable output limits instead of "be concise."
- Keep examples canonical and consistent with the rules.
- Do not restate permissions already enforced by the runtime.
- Do not assume context that is not actually injected.
- In safety refusals, name the governing principle without revealing detection details
  that teach bypasses.

## Tool And Context Design

Prefer a few agent-shaped tools over one wrapper per API endpoint. Tool descriptions
and errors are prompts: make purpose, correction, filtering, pagination, and response
caps explicit. Return high-signal fields rather than raw payloads.

For long-running agents, choose only the needed mechanisms: compaction, durable notes,
or isolated subagents returning condensed evidence.

## Pre-Ship Gate

Check for ambiguous language, contradictions, missing definitions, unenforced rules,
brittle hardcoding, vague platitudes, stale versions, and examples that disagree with
the contract. Every remaining line must prevent a failure, encode a hard requirement,
or generalize a useful example.

Test on realistic traces. Add prompt text only when it fixes an observed failure.
Primary source citations live in `references/sources.md`.
