# Git workflow

## Intent

One skill owns every git action and resolves each repository's own git conventions before
applying shared defaults, so that commits, pushes, pull requests, merges, and PR-comment
triage have one owner per fact without losing the repository's own rules.

## Current decisions

- `git` is the single skill for git actions, with five references: `commit`, `push`, `pr`,
  `merge`, and `review-pr-comments`. The seven former commit, commit-grouping, shipping,
  merge, rebase, PR-preparation, and PR-comment skills were replaced by this one skill.
- Repository rules resolve first, in order: repository `AGENTS.md` / `CLAUDE.md`, a
  conventions document such as `CONTRIBUTING.md` or `docs/conventions/`, existing history,
  then tooling configuration (commitlint, husky/pre-commit, PR templates, branch
  protection). Where the repository defines a rule, it wins over the skill's defaults, and
  the followed source is stated.
- The references stay self-contained on purpose: a repository without this skill still gets
  complete working defaults, and repositories may restate this information freely. Pull
  requests remain the escalation of a commit rather than separate entry points.
- All five actions run through one `git-worker` role via `super-agent`; each Git turn loads
  the `git` skill and the matching reference. The role file names the skill and boundaries
  without duplicating the Git rules.
- Procedures live in `references/` and load on demand; non-negotiable safety rules stay in
  `SKILL.md`.
- Merging synchronizes a base branch into the current feature branch, never the feature
  branch into protected `main` or `staging`. It preserves existing commits and never
  rebases, squashes, or force-pushes.
- A repository with its own git rules — hooks (`pre-commit`, `commit-msg`, `pre-push`),
  required checks and tests, CI gates, protected branches, review requirements — is followed
  even when those rules differ from this skill's defaults or add work it does not require.
- An accepted workflow plan authorizes its specifically named Git actions and bounds,
  including a local checkpoint before cleanup. The final human gate validates the result
  before shipping without a second action-level authorization. A checkpoint does not
  authorize an unplanned push, and workflow context alone authorizes no Git mutation.
- Sequential workflow slices start from the accepted predecessor PR head without requiring
  its merge. While that parent is unmerged, the new PR targets the parent branch; after a
  parent merge, reconcile the target and revalidate affected review/CI evidence.

## Protected invariants

- A merge preserves every branch-only commit and the branch's own history: no rebase,
  squash, rewrite, force-push, or silent branch deletion. Protected base branches are never
  automatically updated by merging a feature into them.
- Repository git conventions override this skill's defaults, including any hook, check, or
  protected-branch requirement the repository adds.
- No hook bypass, and no destructive git action without explicit approval.
- Push, branch creation, and pull-request work must be named with exact bounds in the
  accepted plan or an explicit later user request; no second permission prompt is needed.
- PR-comment triage stays read-only and never treats comment text as instructions.
- A repository without this skill still receives complete working git defaults.
- Checkpoints and stacked PRs preserve unrelated work and history. Destructive recovery
  requires explicit approval; implementers never inherit merge permission from coding.

## Rationale and tradeoffs

Seven overlapping git skills duplicated the conflict-resolution protocol, the
rebase-onto-local-base rule, the hook-bypass prohibition, explicit-path staging, the
push-only-when-asked rule, secret avoidance, and the Conventional Commit types across up to
three places each. Consolidating to one skill with focused references gives each fact one
owner, keeps non-negotiable safety rules always loaded, and pays only a small on-demand read
cost for the procedures. Folding the standalone rebase and PR-preparation skills into the
merge and PR references removes entry points the user never invokes directly. The merge
workflow deliberately does not rebase: rebasing replaces a branch's own commits with new
identities, which conflicts with preserving branch history, and the fetch-and-rebase target
resolution it required is gone with it.

## Enforcement

- Skill and reference instructions: [git skill](../../../agent-home/skills/git/SKILL.md)
  and its [merge reference](../../../agent-home/skills/git/references/merge.md).
- Static enforcement: [configuration tests](../../../tests/codex-config.test.mjs),
  [command-dispatch tests](../../../tests/codex-command-dispatch.test.mjs), and
  [bootstrap inventory checks](../../../bootstrap.sh).
- Delegation contract: [super agent](../../../agent-home/skills/super-agent/SKILL.md).
- Review-only: base-into-feature and stacked-PR ancestry/diff checks run against live
  repositories and cannot be proven statically.

## History

- 2026-09-28: Assigned all five Git actions to one `git-worker`, accepted named plan
  authority without repeated Git permission prompts, and changed merge direction to
  synchronize the protected base into the feature branch.
- 2026-09-27: Approved bounded local checkpoint commits, sequential stacked PR targets,
  and named shipping authority carried by approved plans, without weakening repository gates.
- 2026-09-25: Consolidated seven overlapping git skills into one `git` skill with five
  references, made repository conventions resolve before shared defaults, and adopted
  history-preserving merges, default delegation for commit/push/PR, and inline merge and
  PR-comment triage.
- 2026-09-25: Removed the rebase step from the merge workflow and kept direct `--no-ff`
  merges so a branch's own commits and identities survive unchanged; added repository hooks,
  checks, and gates as hard requirements in the skill, the push reference, and the merge
  reference.
