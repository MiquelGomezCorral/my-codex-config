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

Create 2-3 realistic prompts in `evals/evals.json`. For each prompt, launch the
with-skill run and its baseline together through fresh native `spawn_agent` workers. Baseline is
no skill for a new skill, or a snapshot of the old skill for a revision.

Store outputs under a sibling workspace:

```text
<skill>-workspace/iteration-N/<eval-name>/
  eval_metadata.json
  with_skill/outputs/
  without_skill/outputs/   # or old_skill/outputs/
```

After runs start, write objective assertions where possible. Never invent timing or
token data absent from the runner. Use `references/schemas.md` for exact JSON shapes;
`grading.json` expectations require `text`, `passed`, and `evidence` fields.

Grade with `agents/grader.md`, aggregate with:

```bash
python3 -m scripts.aggregate_benchmark <iteration-dir> --skill-name <name>
```

Then run the analyst guidance in `agents/analyzer.md` and generate the review UI with
`eval-viewer/generate_review.py`. Use its static mode in headless environments.
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
queries. Review them with the user, then run `scripts.run_loop` with the current
session model. Select the best description by held-out score, not training score.

## 6. Ship Safely

- Validate with `python3 scripts/quick_validate.py <skill-dir>` where applicable.
- Load `skillspector` and investigate matched lines before treating scores as verdicts.
- Preserve an existing skill's public name when updating it.
- When explicitly requested, package with `python3 -m scripts.package_skill <skill-dir>`.
- Do not package, publish, install, commit, or push unless explicitly requested.
