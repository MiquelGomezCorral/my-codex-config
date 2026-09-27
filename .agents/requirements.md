# Requirements

The user's own stated wants for this repository, kept as intent rather than as design.
Quotes are the user's words. Read this before planning or executing changes here, and
update it whenever the user states a new want or changes one.

Status values: `done`, `partial`, `open`, `deferred`, `rejected`.

## Working style

1. **Answer briefly.** "answer more briefly I wont read all that wall of text." Status:
   `open` — keep chat replies short and put detail in files.
2. **Do not commit, push, publish, create branches, or create worktrees in this
   repository.** Status: `done` — enforced by every delegated task prompt.
3. **Persist what the user actually wants, in a durable list, not only inside a plan.**
   "recall to persist all the decisions and things I want, not what you understand, but
   what I really want on a list of things." Status: `done` — this file, linked from
   `AGENTS.md`.
4. **Prefer few skills with one owner per rule.** "I have too many skills about git. I
   only want one." Status: `done` — applies repo-wide, not only to git.
5. **Repetition across repositories is acceptable.** "I dont care that they repeat info we
   already add, bc some repos wont have those skills." Status: `done` — shared references
   stay self-contained instead of pointing at repository-local files.

## Agent management

6. **One delegation skill, named `super-agent`.** Status: `done` —
   `agent-home/skills/super-agent/`.
7. **It holds all delegation insights; other skills only refer to it.** Status: `done` —
   `core`, `code`, `cleanup`, `review`, `git`, and the rest point at `super-agent`.
8. **It must not be bloated.** Policy in `SKILL.md`, procedures in `references/`. Status:
   `done`.
9. **The cheap-model catalog lives inside `super-agent`, and every agent that can handle
   subagents has access to it.** Status: `done` — `references/model-catalog.yaml`;
   `cleanup-worker`, `coder`, and `review-worker` receive `super-agent` in
   `bootstrap_pi.sh`.
10. **Two agent classes, with the root declaring the class to the child.** The root is the
    agent talking to the user; it decides whether to send a subagent or a swarm, and tells
    the child which class it is. A delegated agent may itself run a swarm. Status: `done` —
    `## Classes` in `super-agent/SKILL.md` plus the `Class`/`Depth`/`Delegation` packet
    fields.
11. **The root does not care how the inner swarm is handled.** Status: `done` — the root
    consumes one synthesized result from the delegate.
12. **Never name a vendor in the delegation policy.** "make the skill already teach the
    agent to understand if... I have other things that are not [mine], if I'm better than
    my harness use them." The policy must say to use the environment's own native skills
    generically, so a future change of environment needs no skill change. Status: `done` —
    `## Active wrapper first`; `super-agent/SKILL.md` contains no vendor name.
13. **Keep the Orca bridge skills untouched.** `orchestration`, `orca-cli`, and
    `computer-use` stay as version-matched discovery stubs. Status: `done`.
14. **Delete `handoff`.** "I think it's useless." Status: `done`.
15. **Keep learned failures as known errors, not as policy.** The AGY readiness-timeout
    fact lives in `.agents/known-errors.md`. Status: `done`.

## Git

16. **One git skill with references for: commit, push, craft a PR, merge, review PR
    comments.** Status: `done` — `agent-home/skills/git/` with those five references.
17. **Repository-specific git guidelines win over the general ones.** "if we are working on
    repo, and that repo has specific guidelines for git management, those are the ones to
    follow." Status: `done` — `## Repository rules win` is the first section of
    `git/SKILL.md`.
18. **Easy commands like the commit one: merge, commit, and commit also able to push or
    open a PR.** Status: `done` — `/commands/commit` with `--push` and `--pr`,
    `/commands/merge`, `/commands/review-pr-comments`.
19. **Push and PR are escalations of a commit, never standalone.** "I will rarely (never)
    ask to push or craft a PR alone, always when commits are needed and then the push and
    pr." Status: `done`.
20. **`rebase` and `make-pr-easy-to-review` fold in, not kept as separate skills — and the
    user does not want rebases at all, so no rebase step survives in the merge workflow.**
    Status: `done`.
21. **A merge must not lose or break history, and each branch keeps its own commit history
    of the work done only on that branch.** The current branch's history wins. Status:
    `done` — `## History integrity` in `git/references/merge.md`: merge directly with
    `--no-ff` so the branch's commits keep their original identities, never rebase, squash,
    drop, or rewrite branch commits, never rebase/amend/force-push a pushed branch, never
    delete an unmerged branch, plus the three post-merge verification commands.
22. **A commit delegates to a subagent by default; `--no-delegation` makes the receiving
    agent do it inline with no subagent.** Status: `done` — `## Delegation` in
    `git/SKILL.md`.
23. **`merge` and `review-pr-comments` run inline, not delegated.** Status: `done`.

## Removed, do not reintroduce

24. **Workmux.** "forget about anything about Wormuks, don't even add it back and if you
    see any other reference to it, remove it." Status: `done` — removed from
    `codex/hooks.json`, `merge`, `rebase`, `config/AGENTS.md`, `README.md`, and memory.
25. **The `worktree` skill.** It was too narrow; its rule now lives in
    `super-agent/references/swarm.md` under `## Isolated tasks`. Status: `done`.
26. **`index` and `init` skills.** Their commands now point at `codegraph-setup` and
    `agents-memory`. Status: `done`.
27. **`commit-push-pr/assets/maintainers.json`.** Dead asset, nothing read it. Status:
    `done`.

## Deferred

28. **The caveman family, including `caveman-commit`.** "we manage caveman after, leave
    alone." Status: `deferred`.

## Open questions the user still owns

29. **`pi.high` model identifier** in `super-agent/references/model-catalog.yaml`. It
    currently duplicates `pi.medium`, which fails one test assertion. Needs a real unique
    identifier, or revert `pi.medium` to `opencode-go/deepseek-v4-flash`. Status: `open`.
30. **The hardcoded Orca hook path** in `codex/hooks.json`
    (`/home/turbotowerlnx/.orca/agent-hooks/codex-hook.sh`, 8 occurrences). It violates the
    repository's no-machine-paths rule and makes `./bootstrap.sh --check` fail. Status:
    `open` — not authorized to change yet.
31. **Live validation** of `super-agent` and `git` in a real harness session. Status:
    `open` — needs explicit approval because it launches real agent sessions and writes
    commit/push/merge state.
32. **Whether the unified `git` skill should stay model-invocable.** The old `merge` and
    `rebase` skills were explicit-only (`disable-model-invocation: true`). Status: `open`.

## Stated preferences observed during work

33. Delegated execution ran on the Pi harness with `opencode-go/deepseek-v4.1-flash`.
    Status: recorded, not a standing rule — confirm before assuming it again.
34. **In another repository, that repository's git instructions, hooks, and tests govern.**
    "when they are mirroring other work repositories, git history, push, commit, merge,
    there may be hooks, there may be tests. It must follow the instructions of that
    repository." Status: `done` — `## Repository rules win` in `git/SKILL.md` names
    `pre-commit`/`commit-msg`/`pre-push` hooks, required checks and tests, CI gates,
    protected branches, and review requirements as hard gates that must never be bypassed;
    `push.md` and `merge.md` repeat the requirement for their own action.
35. **Persist the full 100-question voice interview as a repo skill usable by any
    agent.** "persist all this on a skill on this repo"; use agent-neutral wording
    throughout. Status: `done` —
    `agent-home/skills/miquel-voice/` contains the skill and full interview profile.
36. **Test the voice skill with a few subagents writing paired samples.** "then
    making a few sub agents write something would go?" and "do it". Status: `done` —
    three with-skill/baseline pairs ran on the same model and their drafts were compared.
