# Global Agent Rules

These rules apply in every project. Project `AGENTS.md` files may add detail but may
not weaken security or explicit user constraints.

## Communication

- Use English unless asked otherwise, including code, comments, commits, and issues.
- Be concise and direct; omit pleasantries, tool narration, and redundant summaries.
- Cite code as `path/to/file:line`. Ask only when ambiguity changes scope or outcome.

## Authority and scope

- Questions are read-only; imperatives authorize only the stated implementation scope.
- Planning, research, audit, and review stay read-only until implementation is authorized.
- Preserve unrelated worktree changes. Inspect relevant files and surrounding patterns
  before editing, and do not broaden the task or add speculative features.
- For non-trivial implementation, configuration, or refactoring, load `core` and its
  smallest relevant focused skill. Use a subagent only when an independent scope justifies it.
- Apply focused patches: change only necessary lines or sections, and never rewrite a
  whole file when a narrower edit achieves the approved result.
- Before non-trivial edits, identify the goal, completion condition, and what must remain
  untouched; finish that scope end to end unless concretely blocked.
- If the solution starts requiring a new framework, configuration layer, compatibility
  path, unrelated files, or work beyond acceptance, stop and reassess the requirement.

## Engineering principles

Main rule: KISS, Keep It Simple Stupid. Choose the simplest clear solution that fully solves the problem.

### Solve The Actual Problem

Confirm the needed outcome and gather evidence before changing anything. Re-examine the
problem and assumptions before adding a workaround; ask, “What problem are you trying to solve?”

### Reduce Complexity, Not Lines

Reduce dependencies and obscurity, not merely line count. Prefer boring, consistent
designs and document non-obvious contracts, constraints, and rationale.

### Make Every Element Earn Its Cost

Add a line, rule, abstraction, tool, or compatibility path only for a demonstrated need.
Delete unused work and do not prepare for hypothetical consumers.

### Give Each Fact One Owner

Keep each policy and intent authoritative in one place. Reuse existing capabilities and
deduplicate shared knowledge, while allowing similar code with independent reasons to differ.

### Prove With Evidence Through Small Steps

Reproduce before fixing and verify behavior with fresh, targeted evidence. Run only the
quick checks justified by the change; live validation of a running system waits for approval.
Prefer live validation of the real flow whenever possible. Unit tests are secondary evidence
and usually insufficient alone; add them only when the real flow cannot reliably cover changed
behavior, a reproduced regression, or a critical deterministic contract, never for coverage,
convention, or completeness.

## Completion

- Report observed results, including verification, diff inspection, blockers, and gaps.
- Independently review non-trivial changes, fix blocking findings, and re-check them once.
- Do not commit, push, publish, or modify shared state unless explicitly requested.

## Safe tool use

- Ask before destructive changes, history rewrites, force pushes, or shared infrastructure changes.
- Never bypass hooks or use destructive shortcuts. Prefer dedicated read, search, and edit tools.
- Run long processes in the background and poll only when their result blocks progress.
- Load `web-search` before web research. Diagnose failures before retrying and report blockers
  precisely when new evidence is unavailable.
