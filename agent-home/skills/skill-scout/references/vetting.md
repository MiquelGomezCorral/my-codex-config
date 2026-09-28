# Vetting a skill

Three passes. Security and usefulness decide whether the skill may be installed;
reachability decides whether installing it accomplishes anything.

## 1. Usefulness

The gate in `SKILL.md` is the source of truth. Confirm you wrote answers down rather than
judging silently, and that you checked all five: novelty against what the agent already
knows, repository health, independent evidence of real use, context cost, and overlap with
the catalog.

Two failure modes to name explicitly when you report:

- **Restates what we already have.** A skill that repeats this repository's own rules, its
  `AGENTS.md`, or general good practice adds tokens and nothing else.
- **Well marketed, never used.** Install counts and stars move with launch timing. Look for
  a user, not a badge.

## 2. Security

Static pass first:

```bash
skillspector scan <path-or-url> --no-llm
```

Use `--format json|markdown|sarif --output <file>` only when the task needs an artifact.

Static matching is intentionally aggressive. A high or critical score is a request for
manual investigation, not a verdict.

1. Read every flagged executable line before concluding.
2. Separate executable behavior from documentation, license text, tests, fixtures, generated
   files, binary noise, and legitimate plugin or config infrastructure.
3. Prioritize credential access, persistence, prompt injection, shell execution, downloads,
   data exfiltration, destructive behavior, and hidden side effects.
4. Check whether the behavior matches the skill's advertised purpose and source reputation.
5. Report real concerns and false positives separately, with `file:line` evidence.
6. When static evidence stays ambiguous, run semantic analysis only if an approved provider
   is already configured; never write credentials merely to enable it.

Do not install into an active location, execute, package, or publish the target unless
explicitly authorized.

## 3. Reachability

A skill that is never loaded is worthless. Check all four:

1. **Location and name.** `<skill-dir>/SKILL.md` exists and the frontmatter `name` matches
   the directory name.
2. **Frontmatter.** The description is present and its trigger phrasing matches how the user
   actually asks for the task, not just how the author phrased it.
3. **Grant.** In a harness that renders a `skills:` allowlist, confirm the skill is granted
   to the role that needs it. In this repository that means `bootstrap_pi.sh`; a skill in the
   library that no role lists will never load there.
4. **Cost.** State the lines it adds to context, and whether it is worth them.
