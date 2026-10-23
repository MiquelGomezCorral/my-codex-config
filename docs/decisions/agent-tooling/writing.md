# Writing

## Intent

One skill owns prose so any agent can find the writing register, the slop rules, and Miquel's
voice from a single entry point, without duplicating them across skills or leaving the
academic material stranded in a skill that nothing else references.

## Current decisions

- `writing` is the single skill for preparation, outlining, drafting, editing, and review,
  with five prose references:
  `natural-writing.md`, `voice-profile.md`, `voice-interview.md`, `academic.md`, and `latex.md`.
- `writing` also owns system prompts for autonomous or tool-using agents, subagents, MCP
  assistants, and orchestrators, through `references/agent-prompts.md` and its sources in
  `references/agent-prompt-sources.md`. One-shot classification or generation prompts are out of
  scope. The standalone `agent-prompt-writing` skill is removed, not aliased.
- `natural-writing.md` and `voice-profile.md` are read at every prose stage. `voice-profile.md`
  is the compressed profile; `voice-interview.md` holds the full 100-question interview and is
  read only when the profile does not cover a format or the reason behind a preference is
  needed. `academic.md` and `latex.md` are explicitly opt-in and are read only for a paper,
  thesis, or formal report.
- `natural-writing.md` merges two upstream rulesets into one owner per pattern: the editing
  principles, voice-preservation rules, and pattern list of `petergyang/no-ai-slop` (MIT),
  and the rule identifiers, individual rule-reference impacts, coverage/no-new-patterns/genre
  safeguards, and optional before/after score report of the `natural-writing-humanizer` ruleset by richtabor,
  whose catalogue derives from Wikipedia's "Signs of AI writing" (WikiProject AI Cleanup,
  CC BY-SA). Both sources' anti-over-compression guards survive.
- Patterns are contextual heuristics. Truth and meaning, explicit requirements, the reader,
  genre, and the writer's established voice take precedence over generic style defaults.
  A precise term, meaningful contrast, useful recap, or house style is not a violation.
- Preparation and drafting do not require an existing draft. Editing uses the minimum
  effective change; detection returns findings without rewriting. Change reports accompany
  edits when useful or requested, and copy-only requests receive only the finished text.
- The optional score uses individual HIGH/MEDIUM impacts at 3/1 points; LOW findings are
  advisory with no deduction. Count overlapping findings once per passage. The score is a
  local editorial heuristic, not a calibrated measure of authorship, quality, or voice.
- `miquel-voice` and `objective-scholar` are removed, not aliased. The voice profile moves
  into `writing/references/voice-profile.md`; the academic rules move into `academic.md` and
  `latex.md` unchanged. `$miquel-voice` and `$objective-scholar` are no longer triggers;
  `$writing` replaces both.
- No evals are carried over from `miquel-voice`. Voice fidelity is judged by a human reading
  the draft, not by an eval file.
- Imported rule provenance is recorded in `README.md` only, never inside a skill file.
- Every rendered agent can discover `writing` through the shared skills. `config/AGENTS.md`
  instructs every agent to load it before writing or editing prose.
- `core` is deleted. `config/codex.toml`'s `inherit = "core"` is a shell-environment-policy
  value and is unrelated to the removed skill.

## Protected invariants

- The natural-writing non-negotiables hold at every stage: preserve meaning, supported
  claims, and intent; preserve meaningful coverage, exclusions, qualifiers, attribution,
  quotations, and literal strings. Never invent evidence, and flag suspected factual errors.
  When research is part of the task, verified sources may support new material; an edit
  adds new factual claims only when that work is in scope. Keep genre and audience intact.
- An output must pass the same contextual checks it applies. The final checklist preserves
  the rules' exceptions rather than turning them into surface-pattern bans.
- Voice guidance never overrides evidence: it never invents experience, results, or
  certainty, and Miquel reviews the final version before publication or delivery in his name.
  Returning drafts or assistant replies for his review does not require separate approval.
- A distinctive line is never flattened merely for consistency, and a rough draft keeps its
  own voice after editing.
- Imported rule provenance stays recorded in the README.
- The academic references stay opt-in. They are never added to the always-read instruction.
- No `evals/` directory exists under the `writing` skill.

## Rationale and tradeoffs

Two skills owned overlapping prose concerns: `miquel-voice` held the voice profile, and
`objective-scholar` held academic and LaTeX rules as a separate trigger. They were separate
owners of one concern, they duplicated tone and clarity advice, and neither owned the
general slop rules. Merging them gives each fact one owner, makes the always-read pair explicit
and explicit, and keeps the academic material available without loading it for every message.
The rejected alternative was keeping both skills and adding a third for the general rules,
which would have preserved the duplication and forced every agent to choose among three. The
cost paid is a slightly longer read for a paper request, since the academic register now
arrives as a second reference.

## Enforcement

- Static enforcement: [configuration tests](../../../tests/codex-config.test.mjs) assert the
  four references, the always-read instruction, the opt-in academic line, the three
  safeguards, one rule id per category prefix, the three tier labels, and the absence of an
  `evals` directory; the score example's counts and arithmetic are checked as well.
- Skill inventory and rendered skill lists: [bootstrap checks](../../../bootstrap_codex.sh) and
  [bootstrap tests](../../../tests/bootstrap.test.sh).
- Global instruction: [global agent rules](../../../config/AGENTS.md).
- Review-only: whether a draft actually sounds like Miquel, and whether an edit flattened a
  distinctive line, need a human judgement that no check can make.

## History

- 2026-10-22: Folded the standalone `agent-prompt-writing` skill into `writing` as
  `references/agent-prompts.md` plus `references/agent-prompt-sources.md`, to give agent-prompt
  guidance one entry point beside the other writing rules instead of a second skill to choose.
- 2026-10-16: Recorded the fifth reference: the full interview split out of the profile on
  2026-09-28 (`voice-interview.md`), read only on demand.
- 2026-09-27: Replaced `miquel-voice` and `objective-scholar` with one `writing` skill holding
  four references, made `natural-writing` and `voice-profile` always-read and the academic
  references opt-in, merged the two upstream natural-writing rulesets under one owner per
  pattern, dropped the evals, and removed every remaining `core` reference.
- 2026-09-27: Applied the adversarial review findings, extended the skill to every writing
  stage, restored contextual source exceptions, aligned individual impacts, corrected score
  arithmetic, and scoped Miquel's review gate to publication or delivery under his name.
