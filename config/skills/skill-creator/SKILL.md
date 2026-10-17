---
name: skill-creator
description: Create, revise, evaluate, and optimize agent skills. Use for new skills, skill-body changes, trigger descriptions, eval design, benchmarking, iteration, or packaging.
---

# Skill Creator

Build the smallest skill that measurably improves realistic tasks.

## 1. Capture Intent

Infer from the conversation before asking:

- Observable job and output.
- Trigger and near-miss boundaries.
- Tools, dependencies, and safety constraints.
- Existing failure modes.
- Whether outputs support objective evals or need human judgment.

Ask only for missing decisions that change the artifact or evaluation.

## 2. Write The Skill

```text
skill-name/
  SKILL.md
  scripts/       # deterministic repeated work
  references/    # details loaded only when needed
  assets/        # output resources
```

`SKILL.md` needs valid `name` and `description` frontmatter. Put all trigger signal
in the description. Keep the body imperative, explain nonobvious rationale, and
move long examples, schemas, platform variants, and background into references.
Names must match their directories and use lowercase hyphenated identifiers.

## 3. Evaluate

Create 2-3 realistic prompts in `evals/evals.json`. For each prompt, load
`super-agent` and launch the with-skill run and its baseline together through fresh
workers. Use the same harness, configured agent, model, and reasoning effort for both sides
so the comparison is fair. If quota requires another route, move the whole pair and report
the substitution. Baseline is no skill for a new skill, or a snapshot of the old skill for
a revision.

Store outputs under a sibling workspace:

```text
<skill>-workspace/iteration-N/<eval-name>/
  eval_metadata.json
  with_skill/outputs/
  with_skill/grading.json
  without_skill/outputs/   # or old_skill/outputs/
  without_skill/grading.json
```

Repeated runs of one configuration go in `with_skill/run-N/outputs/` with `grading.json`
beside each `outputs/`.

After runs start, write objective assertions where possible. Never invent timing or
token data absent from the runner. Use `references/schemas.md` for exact JSON shapes;
`grading.json` expectations require `text`, `passed`, and `evidence` fields.

Grade with `agents/grader.md`. Run every `python3 -m scripts.<name>` command from this
skill's directory, and aggregate with:

```bash
python3 -m scripts.aggregate_benchmark <iteration-dir> --skill-name <name>
```

It exits 1 when it finds no graded run. The skill under test must be `with_skill` (or
`new_skill`) so the delta reads skill minus baseline.

Then run the analyst guidance in `agents/analyzer.md` and generate the review UI with
`eval-viewer/generate_review.py <workspace> --static <dir>/index.html`, where `<dir>` comes
from `hub.py dir <name>` in the [artifacts skill](../artifacts/SKILL.md#page-hub). Publish it
as that skill's steps say and give the user the URL. Never run the script's server mode: it
kills whatever holds its port. The page has no server to save to, so the user presses
**Copy feedback** and pastes the text back; save it as `feedback.json` in the workspace.
Present outputs to the user before revising the skill.

## 4. Iterate

Read qualitative feedback, grades, and transcripts. Fix general causes, not individual
examples. Remove instructions that cause wasted work; bundle deterministic repeated
work as scripts. Rerun the same evals and baseline until results stop improving or the
user is satisfied.

For rigorous comparison, follow `agents/comparator.md` without revealing which output
used which skill.

## 5. Optimize Triggering

After behavior is stable, build realistic positive and near-miss negative trigger
queries. Review them with the user, then run `scripts.run_loop`. Select the best
description by held-out score, not training score.

This step works only in Claude Code: the trigger runs and the description rewrites call the
`claude` CLI. In another harness, skip it and review the description by hand. Pass
`--model <model>`, `--results-dir` under the repository's `agent-memory/`, and
`--report <dir>/index.html` with `<dir>` from `hub.py dir <name>` as in step 3. Publish it
once the loop has started, and the page refreshes itself while the loop runs. The script
never opens a browser or writes to `/tmp`.

## 6. Ship Safely

- Validate with `python3 scripts/quick_validate.py <skill-dir>` where applicable.
- Load `skill-scout` and investigate matched lines before treating scores as verdicts.
- Preserve an existing skill's public name when updating it.
- When explicitly requested, package with `python3 -m scripts.package_skill <skill-dir>`.
- Do not package, publish, install, commit, or push unless explicitly requested.
