---
name: core
description: Route non-trivial implementation, configuration, and refactoring to the smallest relevant focused skills. Load before such work; skip for pure Q&A, search, or already-specialized review agents.
---

# Core Router

`AGENTS.md` owns the engineering principles. This skill only selects extra
workflow instructions. Load no skill speculatively and do not restate its body.

## Routes

- Unclear, intermittent, or repeatedly misdiagnosed bug -> `diagnosing-bugs`.
- Post-implementation simplification -> `cleanup`.
- Ordinary code review -> `code-review`; explicit staff/deep gate -> `review`.
- External SDK or framework behavior -> `btca-first`; BTCA setup -> `btca-cli`.
- Web research or current external facts -> `web-search`.
- Project memory initialization or maintenance -> `agents-memory`.
- CodeGraph installation or indexing -> `codegraph-setup`.
- Multiple independent agent scopes -> `agent-swarm`; any agent launch or resume
  decision -> `subagent-routing`.
- Skill creation or revision -> `skill-creator`; agent system prompts ->
  `agent-prompt-writing`.
- Python template/environment work -> `python-project-setup`.
- Local commit grouping -> `commit-manager`; shipping a branch and PR ->
  `commit-push-pr`.
- Host-specific facts -> `computer`.

If no route matches, proceed using `AGENTS.md` and project instructions only.
