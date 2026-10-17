# Implemented agent workflow: evidence map

This diagram summarizes current operational instructions, not observed executions. Static
checks do not prove that the live workflow has completed successfully.

- **E1 — Workflow entry.** `/commands/workflow` dispatches the `workflow` skill; the skill owns planning through shipping: `codex/commands/workflow.md:1-9`, `agent-home/skills/workflow/SKILL.md:8-25`.
- **E2 — Codex dispatch.** `UserPromptSubmit` invokes the command dispatcher, which resolves `/commands/<name>.md` and injects its skill and arguments: `codex/hooks.json:1-20`, `config/bin/codex-command-dispatch.mjs:37-65`.
- **E3 — Plan and approval.** Planning establishes scope and evidence, resolves material choices, and gets approval for the complete wave before coding: `agent-home/skills/workflow/SKILL.md:40-83`.
- **E4 — Cross-family critic.** `$review-plan` routes one read-only high-tier critic through the catalog; it prefers a different model family from the planner, preserves explicit routes, and reports when that condition cannot be met: `agent-home/skills/workflow/references/adversarial.md:3-13`, `agent-home/skills/review-plan/SKILL.md:16-23`.
- **E5 — Coding and checks.** Small slices use one retained coder; large slices use a read-only coding supervisor with one coder. Verified in-scope P0-P3 findings return through coding, with affected checks and review repeated: `agent-home/skills/workflow/SKILL.md:84-95`.
- **E6 — Complete review basis.** Workflow review reads the full plan and amendments, the recorded base-to-head changes, and task-owned staged, unstaged, and untracked worktree changes; reviewers report inspected revisions. Standalone `$review` remains staged-first: `agent-home/skills/review/references/orchestration.md:82-93`, `agent-home/skills/review/SKILL.md:12-16`.
- **E7 — Checkpoint and cleanup.** The read-only cleanup audit includes the committed checkpoint and later task-owned changes, and skips only when the complete comparison is empty: `agent-home/skills/cleanup/SKILL.md:28-45`, `agent-home/skills/workflow/references/cleanup.md:3-16`.
- **E8 — Human result gate.** Present the result after cleanup corrections pass affected checks and review. Human acceptance gates the named shipping actions: `agent-home/skills/workflow/SKILL.md:104-117`.
- **E9 — Final Git handoff.** After acceptance, the Git worker stages explicit accepted paths, commits only when needed, excludes private memory/progress/temp/unrelated files, verifies the accepted tree, records hashes, and performs only the plan-authorized push: `agent-home/skills/workflow/references/ship-pr.md:3-14`, `agent-home/skills/git/SKILL.md:39-48`, `agent-home/skills/git/references/commit.md:60-68`, `agent-home/skills/git/references/push.md:16-21`. PR triage covers actionable human and bot comments and returns workflow fixes to the coding gate: `agent-home/skills/git/references/review-pr-comments.md:14-45`.
- **E10 — Delegation.** `super-agent` owns route, role, catalog model, nesting bounds, and worker reporting: `agent-home/skills/super-agent/SKILL.md:33-39`.

## Evidence limit

The disposable live flow that joins checkpoint, cleanup, human acceptance, final commit, and
push remains unverified. Run it only with explicit bounded authorization.
