---
name: skill-scout
description: Find, vet, and install agent skills for a repository, and keep a catalog of the project-agnostic ones worth reusing. Use when the user asks to find a skill for something ("is there a skill that...", "how do I do X" when a skill may exist), wants a capability that may already exist as a skill, or brings a skill, repository, archive, or SKILL.md to add or audit. Verifies security, real usefulness, and real usage evidence before anything is installed.
---

# Skill Scout

Two jobs: find skills worth installing, and vet a skill before it is installed. Every
installed skill costs context and can change behavior, so the default answer to a candidate
is no.

## Read first

| Reference | Read it |
| --- | --- |
| `references/evidence.md` | Before judging whether skills help at all |
| `references/sources.md` | Before searching |
| `references/discovery.md` | When turning a request into queries, and when a search finds nothing |
| `references/vetting.md` | Before installing anything |
| `references/catalog.md` | Before searching, and when a skill proves useful |

## Start from the base rate

`references/evidence.md` holds the measured results. In short: most published skills do not
improve outcomes, curated skills help inconsistently, self-authored skills showed no benefit,
and Claude loaded a skill in only about one run in six in the hardest retrieval setting
of one study. So:

- Prefer a skill that already exists and has been used by outsiders over writing a new one.
- Assume a random candidate will do nothing until the usefulness gate says otherwise.
- Treat a skill that is never loaded as worthless. Reachability is part of vetting.
- Cost context, not just benefit. Overhead has been measured from modest savings to +451%.

## Search

Use `references/sources.md` for where to look and `references/discovery.md` for how to
query. Search the user's catalog first, then the registries, then the awesome lists, then
GitHub. A listing is a lead, not evidence, and a ranking by installs or stars is a
discovery aid only.

## The usefulness gate

Run this before pulling anything, and write the answers down. A candidate that fails any
question is skipped, not installed.

1. **Novelty.** Read the `SKILL.md` and answer: what does this tell the agent that it does
   not already know, or already do? If the answer is nothing, skip it. A skill that restates
   general good practice, or this repository's own rules, earns nothing.
2. **Maintainer and repository health.** Look at the repository, not the badge. Recent
   commits, real issues with real answers, and a named maintainer matter more than star
   count.
3. **Evidence of real use.** Find independent discussion of that exact skill: X/Twitter,
   Reddit, Stack Overflow, blog or newsletter write-ups, issue threads where users rather
   than the author report outcomes, and other repositories that vendor it. Absence of
   outside evidence is a reason to skip, not a reason to install and see.
4. **Cost.** Estimate the lines and tokens it adds to context, and say whether the expected
   benefit is worth that.
5. **Replaceability.** Say whether one of the skills already in the catalog covers the same
   ground. If it does, name it. Do not resolve the overlap here; report it.

Stars alone never pass the gate. A good skill can be badly marketed and a poor one can trend.

## Pull the promising ones

Pull every candidate that passes the gate, even when two of them overlap. Do not craft,
rewrite, trim, or merge a skill at this stage, and do not pick a winner. Cloning is cheap;
judging overlap is the user's decision.

Install location:

- **Repo-local by default**: `.agents/skills/<name>/` inside the repository being worked on.
- **The shared library** (`config/skills/`, installed into each harness's skill root) only when
  the user says the skill should apply in every repository. That is the catalog's job.

Clone or copy, but do not install into an active location, execute, or trust a candidate
until it is vetted in the next step and the user approves.

## Vet every pulled skill

Run `references/vetting.md` on each one: the security pass, the manual review of matched
lines, and the reachability check. Report real concerns and false positives separately with
`file:line` evidence. A high static score is a request for investigation, not a verdict.

## Report overlaps and let the user decide

After vetting, present:

- what was pulled, with source, install command, and registry page link;
- what was skipped and why — the gate answer, not just a name;
- **the overlap list**: which pulled skills overlap, which specific rules or behaviors
  collide, and the options (keep both, keep one, combine them).

Then stop and ask. Never merge, combine, craft, or delete skills on your own initiative.

## Catalog

After a skill is actually used and proves useful, ask the user whether it should be kept as
**project-agnostic** for future, similar repositories. Only on their yes, add it to
`references/catalog.md` with its source, the exact install command, its scope, and what was
vetted. Ask; do not assume, and do not catalog anything unproven.

## Non-negotiables

- Never install into an active location, execute, package, or publish a candidate before it
  is vetted and the user approves.
- Never recommend a skill on stars, install counts, or a marketplace ranking alone.
- Never merge, rewrite, or craft a skill; report overlap and let the user decide.
- Never install a skill just in case.
- Report what was skipped, and why, not only what was installed.
