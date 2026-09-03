---
name: skillspector
description: Scan an agent skill, repository, directory, archive, or SKILL.md for security risks before installation or sharing. Use for skill-security audits and manual verification of findings.
---

# SkillSpector

Run a static pass first:

```bash
skillspector scan <path-or-url> --no-llm
```

Use `--format json|markdown|sarif --output <file>` only when the task needs an artifact.

## Review Findings

Static matching is intentionally aggressive. A high or critical score is a request for
manual investigation, not a verdict.

1. Read every flagged executable line before concluding.
2. Separate executable behavior from documentation, license text, tests, fixtures,
   generated files, binary noise, and legitimate plugin/config infrastructure.
3. Prioritize credential access, persistence, prompt injection, shell execution,
   downloads, data exfiltration, destructive behavior, and hidden side effects.
4. Check whether behavior matches the skill's advertised purpose and source reputation.
5. Report real concerns and false positives separately with file:line evidence.
6. When static evidence remains ambiguous, run semantic analysis if an approved provider
   is already configured; never write credentials merely to enable it.

Do not install, execute, package, or publish the target unless explicitly authorized.
