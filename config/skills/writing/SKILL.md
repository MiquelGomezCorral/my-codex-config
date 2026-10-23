---
name: writing
description: Shape ideas, outline, draft, edit, and review prose for a reader — messages, docs, explainers, posts, academic text, and agent system prompts. Read the natural-writing and voice-profile references at every writing stage; use the academic and LaTeX references only for papers and theses.
---

# Writing

One skill owns prose: the natural-writing rules, Miquel's voice profile, Caveman
concision, and the academic, LaTeX, and agent-prompt material.

## Read these two first

For **any** prose task, from shaping an idea or outline through drafting, editing, and review, read
[references/natural-writing.md](references/natural-writing.md) and
[references/voice-profile.md](references/voice-profile.md). Do not substitute a summary of
them; the rules and the examples are the value. Read them in bounded chunks if tool output
would otherwise truncate them.

Read [references/academic.md](references/academic.md) and, when LaTeX is involved,
[references/latex.md](references/latex.md) only when the request is a paper, thesis, or
formal report.

`references/voice-profile.md` is the compressed voice profile and is enough for almost
every task. Read [references/voice-interview.md](references/voice-interview.md) only when
the compressed profile does not cover the format you are writing for, or when you need the
actual answer behind a preference. Do not read the full interview by default; it is the
source material, not the operating profile.

## Pick the register

- **Academic or thesis:** read `references/academic.md`, and `references/latex.md` when the
  request involves LaTeX, figures, tables, plots, or a bibliography.
- **Professional** (colleagues, documentation, client messages): the default. Direct,
  concrete, skimmable, with contractions where the setting allows.
- **Casual or explainer** (chat, quick explanations, teaching): shorter sentences, plain
  words, contractions, and analogies are all fair game.

Infer the reader and register from the request and context. Ask who this is for and where
it will be published only when the answer would materially change the result.

## Caveman concision

Use Caveman for assistant-written prose: cut filler, pleasantries, repeated points, and
words that do no work. Prefer short, direct sentences and fragments when they stay clear.
Drop articles only where meaning remains obvious. Keep technical terms, code, quotes,
errors, uncertainty, and necessary detail intact. Use full sentences when compressed
wording could obscure order, risk, or meaning. Follow the requested register and preserve
the original author's voice when editing; do not turn their writing into Caveman prose.

## Work at the requested stage

Use the rules while preparing an outline, drafting from notes or facts, editing existing
text, or reviewing prose. A draft is needed only to edit or detect patterns in that draft.
Return the requested stage's result; do not force every task through an editing workflow.

Follow explicit task and publication requirements. Use the voice profile when writing as
Miquel; preserve another author's voice when editing their work. In assistant replies, adapt
to Miquel's preferences without claiming his experiences or speaking under his name.

## Non-negotiables

- Preserve the writer's meaning, supported factual claims, and intent; flag suspected errors.
- Preserve coverage: do not drop meaningful list items, options, exclusions, or qualifiers.
- Never invent facts, dates, quotes, citations, or sources.
- Keep genre and audience intact.
- Do not introduce new AI patterns: apply the same contextual checks to your own output.
- Never flatten a distinctive line merely for consistency.

`references/natural-writing.md` holds the full constraints, the editing principles, the
patterns, and the optional score report.

## Route

| Task | Read |
| --- | --- |
| Any prose preparation, outline, draft, edit, or review | `references/natural-writing.md`, `references/voice-profile.md` |
| The reason behind a voice preference, or a format the compressed profile does not cover | `references/voice-interview.md` |
| Paper, thesis, or formal report | `references/academic.md` (plus the two above) |
| LaTeX figures, tables, plots, or bibliography | `references/latex.md` |
| System prompt for an autonomous or tool-using agent, subagent, MCP assistant, or orchestrator; not a one-shot classification or generation prompt | `references/agent-prompts.md` (plus the two above); its sources are in `references/agent-prompt-sources.md` |

## Output

For preparation or drafting, return the requested ideas, outline, or text. For an edit,
return the edited text plus a short **What changed** section when useful or requested;
omit it for copy-only requests. For a detect request, return findings only, each naming
the pattern with a quoted line and a short fix; do not rewrite or add an unsolicited score.
