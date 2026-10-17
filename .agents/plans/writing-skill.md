# One `writing` skill

## Goal

Replace `miquel-voice` and `objective-scholar` with a single `writing` skill whose
`references/` hold the merged natural-writing ruleset, the personal voice profile, and the
academic/LaTeX material. Every agent is instructed to read `natural-writing` and
`voice-profile` for any prose task; the academic references are opt-in. Remove `core` and
every reference to it.

## Files touched

Created

- `agent-home/skills/writing/SKILL.md`
- `agent-home/skills/writing/references/natural-writing.md`
- `agent-home/skills/writing/references/voice-profile.md`
- `agent-home/skills/writing/references/academic.md`
- `agent-home/skills/writing/references/latex.md`

Removed

- `agent-home/skills/miquel-voice/` (profile moves into `writing`)
- `agent-home/skills/objective-scholar/` (split into `academic.md` and `latex.md`)

Modified

- `config/AGENTS.md` (the `core` line, plus the writing instruction)
- `bootstrap.sh`, `bootstrap_pi.sh`
- `tests/codex-config.test.mjs`, `tests/bootstrap.test.sh`
- `README.md`
- `.agents/requirements.md`, `.agents/architecture.md` if they name a removed skill,
  `.agents/decisions.md`
- `docs/decisions/index.md`, `docs/decisions/agent-tooling/writing.md` (new)

Not touched

- `codex/config.toml:25` `inherit = "core"` — a shell environment policy value, unrelated to
  the deleted skill.
- `agent-home/skills/agent-prompt-writing/` — separate concern, system prompts for agents.

## Locked decisions

1. One skill named `writing`, with four references. `miquel-voice` and `objective-scholar`
   are removed, not kept as aliases.
2. **No evals are carried over.** Do not create an `evals/` directory and do not import
   `miquel-voice/evals/evals.json` or the upstream `eval.md`. Only the voice profile
   survives.
3. **Every agent is instructed to read `natural-writing` and `voice-profile` for any prose
   task.** The academic and LaTeX references are explicitly opt-in and are not part of that
   instruction.
4. Attribution for imported material goes in `README.md`, not inside the skill files.
5. `core` is deleted; every reference to it must be removed.
6. `$miquel-voice` and `$objective-scholar` no longer exist as triggers; both become
   `$writing`.

## Output shape

```
agent-home/skills/writing/
├── SKILL.md
└── references/
    ├── natural-writing.md     # read for every prose task
    ├── voice-profile.md       # read for every prose task
    ├── academic.md            # opt-in
    └── latex.md               # opt-in
```

## Steps

### 1. Remove every `core` reference

- `bootstrap.sh:101` — drop `"core"` from the required tuple; add `"writing"`.
- `bootstrap_pi.sh:93-100` — remove `"core"` from all eight skill lists.
- `bootstrap_pi.sh:125` — the fallback `skills.get(name, ['core'])` becomes
  `skills.get(name, ['writing'])`, because `writing` is the one skill every agent receives.
- `config/AGENTS.md:23` — `load \`core\` and its smallest relevant focused skill` becomes
  `load the smallest relevant focused skill`.
- `tests/codex-config.test.mjs:30` — drop `"core"` from the required list; add `"writing"`.
- `.agents/requirements.md:30` — the stale sentence that names `core` must be rewritten.
- Do not touch `codex/config.toml`.

### 2. `writing/SKILL.md`

Frontmatter:

```yaml
---
name: writing
description: Write and edit prose for a reader — messages, docs, explainers, posts, and academic text. Read the natural-writing and voice-profile references for any writing or editing task; use the academic and LaTeX references only for papers and theses.
---
```

Sections, in order:

1. `# Writing` — one-line ownership statement.
2. `## Read these two first` — for **any** writing, editing, rewriting, or review-of-prose
   task, read `references/natural-writing.md` and `references/voice-profile.md`. Do not
   substitute a summary of them. The academic and LaTeX references are read only when the
   request is a paper, thesis, or formal report.
3. `## Pick the register` — academic or thesis → `references/academic.md` and, when LaTeX is
   involved, `references/latex.md`; professional (colleagues, docs, client messages) is the
   default; casual or explainer (chat, quick explanations, teaching) allows short sentences,
   plain words, contractions, and analogies. If the register is unclear, ask one question:
   who is this for and where will it be published.
4. `## Non-negotiables` — the always-loaded rules, short: preserve the writer's meaning,
   factual claims, and intent; preserve coverage and never drop list items, options, or
   qualifiers; never invent facts, dates, quotes, citations, or sources; keep genre and
   audience intact; do not introduce new AI patterns — the rewrite must pass the same rules
   it applies; never flatten a distinctive line merely for consistency.
5. `## Route` — a table: natural-writing and voice-profile for every prose task; academic and
   latex for academic work.
6. `## Output` — return the edited text plus a short **What changed** section. For a detect
   request, return findings only and do not rewrite.

### 3. `references/natural-writing.md`

Merge two upstream sources into one owner per rule. The spine and prose come from
`petergyang/no-ai-slop`; the rule identifiers, impact weights, scoring, and three safeguards
come from the mcpmarket `natural-writing-humanizer` ruleset (which derives from Wikipedia's
"Signs of AI writing").

Do not add an attribution block to this file; attribution goes in `README.md` (Step 8).

Sections:

1. `## Two jobs` — **Edit** is the default: minimum effective edit, return the draft plus
   `What changed`. **Detect**: name each pattern found, quote the line, give the fix in a few
   words, do not rewrite, do not score, do not guess whether AI wrote it.
2. `## Constraints` — non-negotiable, from the mcpmarket ruleset: preserve meaning, factual
   claims, and intent; preserve coverage and do not drop list items, options, or qualifiers
   unless truly redundant; do not add facts, dates, quotes, or citations that are not already
   present or user-provided; do not imply a source you cannot name from the input; keep genre
   and audience intact; do not rewrite quoted material unless asked; avoid em dashes; do not
   introduce new AI patterns.
3. `## Editing principles` — carry the no-ai-slop list forward intact, because it holds the
   anti-over-compression guards this repository needs: preserve the writer's real voice;
   make the minimum effective edit; lead with the point when the setup adds nothing;
   front-load only when it improves clarity and never force every paragraph into the same
   point-detail-background shape; keep the meaning; open it up without dumbing it down; use
   active voice; make every sentence earn its place while keeping honest "I think" and
   "maybe"; untangle sentences without flattening the cadence; be concrete and specific; use
   the portability test; show rather than tell; protect the specific fact; make verbs do the
   work; preserve useful edge and character; keep structure unless it hurts the piece.
4. `## Words to cut` — three tiers, not a flat ban: banned outright; often-empty adverbs;
   often-empty phrases. Each tier keeps the "cut when it adds nothing, keep it when it
   carries emphasis, uncertainty, contrast, or the writer's rhythm" rule.
5. `## Patterns to cut` — merge both sources, tagging each with the upstream rule id where
   one exists, and grouping by category with its impact weight:
   - Content (HIGH): `content-significance` (importance puffery: "pivotal moment",
     "testament to"), `content-notability` (media name-dropping without a specific claim),
     `content-ing-endings` (superficial `-ing` clauses: highlighting, underscoring,
     reflecting, showcasing), `content-promotional` (nestled, vibrant, breathtaking),
     `content-vague-attribution` (weasel attribution: "experts agree", "studies show"),
     `content-challenges` (formulaic "Despite challenges…" sections).
   - Language (HIGH): `language-ai-vocabulary`, `language-dual-adjectives` ("innovative and
     comprehensive" padding), `language-copula` (fake-strong verbs; prefer is/has),
     `language-contractions` (prefer contractions when the genre allows),
     `language-negative-parallelism` (binary contrasts, "it's not just X, it's Y",
     negative listing), `language-rule-of-three`, `language-synonym-cycling`,
     `language-false-ranges` (fake "from X to Y").
   - Style (MEDIUM): `style-em-dash`, `style-boldface`, `style-inline-headers`,
     `style-title-case` (sentence case in headings), `style-emojis`, `style-curly-quotes`
     (straight quotes), `style-rhythm` (vary cadence; avoid robotic symmetry and stacked
     fragments).
   - Communication (HIGH): `comm-artifacts` ("I hope this helps", "Let me know if"),
     `comm-cutoff` ("as of my last update"), `comm-sycophantic` ("Great question!").
   - Filler (MEDIUM): `filler-openings` (throat-clearing and faux-insight setups),
     `filler-phrases`, `filler-hedging`, `filler-transitions` (moreover/furthermore
     signposting), `filler-conclusions` (summary-recap endings).
   - Voice (HIGH): `voice-soul` (add personality, opinions, varied rhythm).
   Also keep the no-ai-slop patterns that have no upstream id: colon reveals, interpretive
   metadiscourse, dramatic fragmentation, rhetorical setups, fake-profound kickers.
6. `## Scoring` — keep the impact-weighted before/after score as an optional report:
   start at 100; subtract 3 per HIGH violation and 1 per MEDIUM violation; minimum 0; print
   the per-category table and the overall before/after. Include the interpretation bands
   (95-100 clean, 85-94 minor, 70-84 noticeable, below 70 needs work).
7. `## Workflow` — read the full draft; identify the core point and the voice traits worth
   preserving; for detect, report and stop; for edit, make the minimum effective changes,
   then re-scan the rewrite for the same patterns before returning; output the edited draft
   and `What changed`.

### 4. `references/voice-profile.md`

Move `agent-home/skills/miquel-voice/references/voice-profile.md` unchanged in substance,
then add two things at the top:

1. `## How to apply this profile` — label every preference as one of:
   - `HARD RULE` — never violate; these are rare and usually live in the profile's "Never"
     section;
   - `STRONG TENDENCY` — follow 70-80 percent of the time; breaking it occasionally is fine;
   - `LIGHT PREFERENCE` — context decides. **When no label exists, assume `LIGHT
     PREFERENCE`.**
   Do not attempt to relabel all existing lines; the default rule covers them. Label only
   the profile's explicit "Never" items as `HARD RULE` when that section exists.
2. `## Anti-overfitting` — a litmus test to run before returning any text written in this
   voice: does this sound like a specific person writing to this specific reader, or could it
   be pasted unchanged into a message about anything? Did the draft reproduce the profile's
   real habits, or mechanically copy signature phrases and rough-note mistakes? Use the
   profile's examples to calibrate rhythm, not to be quoted back.

Keep the existing warnings intact: keep claims grounded in real evidence, state meaningful
limitations, never invent experiences, results, or certainty, and Miquel reviews the final
version before publication or delivery in his name.

### 5. `references/academic.md` and `references/latex.md`

Split `agent-home/skills/objective-scholar/SKILL.md` without changing its rules:

- `academic.md` — the `Technical Writing: "The Objective Scholar"` half: non-persona
  atemporal voice, no personal pronouns unless asked; formal academic rigor in natural
  modern English; the six-part scientific narrative (Introduction, State of the Art,
  Proposed Approach, Development/Implementation, Evaluation/Testing, Conclusion);
  structural integrity and one purpose per paragraph; consistent terminology.
- `latex.md` — the `LaTeX Formatting` half: the figure, table, and bibliography examples
  verbatim, and the plots note (`pgfplots` with `groupplot`, proper labels, legends,
  captions).

Add one line at the top of `academic.md`: read `natural-writing.md` too, since the shared
non-negotiables still apply; the academic register changes tone and structure, not the facts
or the coverage rules.

### 6. Delete the two old skill directories

`agent-home/skills/miquel-voice/` and `agent-home/skills/objective-scholar/`. Nothing else.

### 7. Instruct every agent

- `bootstrap_pi.sh` — add `"writing"` to all eight skill lists, so every rendered role
  receives it, and set the fallback to `['writing']`.
- `config/AGENTS.md` — add one bullet after the `core` fix:

  ```
  - Before writing or editing any prose — messages, documentation, explainers, posts, or
    academic text — load `writing` and read its `natural-writing` and `voice-profile`
    references.
  ```

  Do not extend this instruction to the academic or LaTeX references; those are read only
  for academic work.

### 8. Attribution in `README.md`

Add a short section, near the skills explanation, recording where the imported rules came
from. Do not put attribution inside the skill files.

```
The `writing` skill's natural-writing rules merge two upstream sources:
- `petergyang/no-ai-slop` (MIT) — editing principles, voice preservation, pattern list.
- `natural-writing-humanizer` by richtabor (MCP Market), whose rule catalogue derives from
  Wikipedia's "Signs of AI writing" (WikiProject AI Cleanup, CC BY-SA) — rule identifiers,
  impact weights, scoring, and the coverage, no-new-patterns, and genre safeguards.
The personal voice profile is built from Miquel's own 100-question interview.
```

Also fix the stale example in the same section: `README.md:92` still advertises
`$obsidian-vault`, which no longer exists. Replace it with `$writing` or another live skill.

### 9. Tests

`tests/codex-config.test.mjs`:

- required-skill list: remove `"core"`, add `"writing"`.
- retarget the `bootstrapPi` assertion at line 328:
  `"cleanup-worker": ["cleanup", "super-agent", "writing"]` (adjust to the final ordering the
  generator produces, and assert it exactly).
- add a focused test asserting: `writing/SKILL.md` contains the two-reference instruction and
  the opt-in academic line; `writing/references/natural-writing.md` contains the three
  safeguards (`preserve coverage`, the no-new-patterns rule, genre and audience) and at least
  one rule id from each category prefix (`content-`, `language-`, `style-`, `comm-`, `filler-`,
  `voice-`); `writing/references/voice-profile.md` contains the three tier labels and the
  anti-overfitting litmus test; all four reference files exist; and no `evals` directory
  exists under `writing/`.
- assert `!names.includes("core")`, `!names.includes("miquel-voice")`, and
  `!names.includes("objective-scholar")`.

`tests/bootstrap.test.sh`:

- update the two `skills:` greps at lines 113-114 to the new lists.

### 10. Memory and records

- `.agents/requirements.md` — rewrite the `core` sentence; add the new wants: one `writing`
  skill containing the merged rules, the voice profile, and academic material as opt-in; no
  evals; every agent instructed to read `natural-writing` and `voice-profile`; attribution in
  the README only; and note that `core` was deleted.
- `.agents/architecture.md` — if it names a removed skill, update the owner to `writing`.
- `.agents/decisions.md` — one bullet: `writing` owns prose, with the natural-writing rules,
  the voice profile, and opt-in academic material; imported upstream rules keep attribution in
  the README.
- `docs/decisions/agent-tooling/writing.md` — new record from the template:
  - `Intent`: one skill owns prose so any agent can find the writing register, the slop rules,
    and Miquel's voice without duplicating them.
  - `Current decisions`: the single `writing` skill and four references; the two always-read
    references versus the two opt-in academic references; no evals; attribution lives in the
    README.
  - `Protected invariants`: the natural-writing non-negotiables (meaning, coverage, no invented
    facts or sources, genre and audience, no new AI patterns); a rewrite must pass the rules it
    applies; voice guidance never overrides evidence or invents experience; imported rule
    provenance stays recorded.
  - `Enforcement`: `tests/codex-config.test.mjs` and `bootstrap.sh`; voice fidelity is
    Review-only because it needs a human judgement.
  - `History`: one dated entry.
- `docs/decisions/index.md` — add the new record link and a one-line description.

## Applicable instructions

- `AGENTS.md` — narrow changes, preserve unrelated worktree changes, no commits or branches.
- `config/AGENTS.md` — "Give Each Fact One Owner"; "Make Every Element Earn Its Cost".
- `.agents/requirements.md` — the user's own answers: no evals, attribution in the README,
  academic not always-read, `$miquel-voice` trigger accepted as removed.
- `agent-home/skills/decision-records/SKILL.md` — create the new concern and update the index
  in the same change.

## Readiness check

```bash
node --test tests/*.mjs config/plugins/vault-context/test/plugin.test.mjs
bash tests/bootstrap.test.sh
./bootstrap.sh --check
grep -rn '"core"\|`core`\|miquel-voice\|objective-scholar' --include="*.md" --include="*.sh" --include="*.mjs" --include="*.toml" . | grep -v '^./.agents/plans' | grep -v '^./.opencode/plans'
```

The final grep must return nothing except `README.md` attribution lines that intentionally
name an upstream source, and historical plan files.

Known pre-existing failures, do not fix:
1. `./bootstrap.sh --check` fails at the machine-specific-path check for `codex/hooks.json`.
   It runs after the skill and command inventories, so confirm those passed.
2. `bash tests/bootstrap.test.sh` fails at `codex mcp-server --strict-config` with
   `stdin is not a terminal`.
3. `node --test` has exactly one pre-existing failure: the `pi.high` catalog duplicate in
   `cheap model catalog is harness-first and keeps identifiers centralized`. That must remain
   the only failure.

## Live validation

Flow: ask for a short professional message, then an academic paragraph, then a detect
request on a pasted AI-sounding draft.

Expected: the first two read naturally and sound like Miquel, the detect request names
specific patterns with quoted lines and rewrites nothing, and the academic one uses the
academic register without LaTeX unless the request mentions it.

Can run: user-only.

## Out of scope

`agent-prompt-writing`, the caveman family, `objective-scholar`'s rules themselves (moved, not
edited), the `pi.high` catalog duplicate, the Orca path in `codex/hooks.json`, and the
`codex/config.toml` `inherit = "core"` setting.
