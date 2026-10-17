# Implemented agent workflow: source map

This map follows the repository's current operational instructions. It describes policy, not
observed execution; the disposable live workflow remains unverified.

## Entry and planning

- `/commands/workflow` dispatches the `workflow` skill, which owns the complete planning-to-shipping flow: `codex/commands/workflow.md:1-9`, `agent-home/skills/workflow/SKILL.md:8-25`.
- Planning requires approval of the complete wave before coding and records each slice's base revision: `agent-home/skills/workflow/SKILL.md:58-83`.
- One read-only high-tier critic challenges the plan using a cataloged model from a different family than the planner when available. Explicit user routes stay in force; unmet family conditions are reported: `agent-home/skills/workflow/references/adversarial.md:3-13`, `agent-home/skills/review-plan/SKILL.md:16-23`.

## Review and correction

- Workflow review reads the full approved plan and amendments, then inspects the recorded base through the current head plus task-owned staged, unstaged, and untracked changes. Reviewers report the revisions and worktree changes inspected: `agent-home/skills/review/references/orchestration.md:82-93`.
- Standalone `$review` retains staged-first selection: `agent-home/skills/review/SKILL.md:12-16`.
- Verified in-scope findings at P0-P3 return through coding; false positives are rejected, out-of-scope findings stay recorded, and repeated unresolved problems escalate: `agent-home/skills/workflow/SKILL.md:84-95`.

## Checkpoint, cleanup, and shipping

- Cleanup compares the recorded slice base through the checkpoint and later task-owned worktree changes. It skips only when that complete comparison is empty, while the cleanup worker remains read-only: `agent-home/skills/cleanup/SKILL.md:28-45`, `agent-home/skills/workflow/references/cleanup.md:3-16`.
- The human sees the result after cleanup corrections pass affected checks and review. After acceptance, the Git worker stages explicit accepted deliverables, commits only when needed, excludes private memory/progress/temp/unrelated files, verifies the accepted tree, and performs only the plan-authorized push: `agent-home/skills/workflow/SKILL.md:96-117`, `agent-home/skills/workflow/references/ship-pr.md:3-14`, `agent-home/skills/git/SKILL.md:39-48`, `agent-home/skills/git/references/commit.md:60-68`, `agent-home/skills/git/references/push.md:16-21`.
- Progress records the slice base and checkpoint/final commit hashes per slice: `agent-home/skills/workflow/templates/progress.md:28-42`.

## Review and delegation boundaries

- PR-comment triage assesses actionable human and bot findings. Approved workflow findings return to the existing coding gate; standalone triage remains read-only and proposes a brief: `agent-home/skills/git/references/review-pr-comments.md:14-45`.
- `super-agent` owns harness/model selection and resolves worker models from the catalog: `agent-home/skills/super-agent/SKILL.md:33-39`, `agent-home/skills/super-agent/references/model-catalog.yaml:1-22`.

## Evidence limit

- Static policy and diagram checks do not establish that checkpoint cleanup, human acceptance, final commit, and push work together in a live repository. The workflow still needs an explicitly authorized disposable flow before that can be claimed.
