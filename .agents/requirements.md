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
   `code`, `cleanup`, `review`, `git`, `writing`, and the rest point at `super-agent`.
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
    of the work done only on that branch.** Sync the base into the current feature branch;
    never merge a feature into `main` or `staging`. Status: `done` — `## History integrity`
    in `git/references/merge.md` preserves commit identities, uses `--no-ff`, never
    rebases/squashes/rewrites or force-pushes, and checks that the base is included while
    the feature-only diff remains visible.
22. **A commit delegates by default; `--no-delegation` makes the receiving agent do it
    inline with no subagent.** Status: `done` — `## Delegation` in `git/SKILL.md`.
23. **Route commit, push, PR, merge, and PR-comment review through one `git-worker` by
    default.** Status: `done` — `## Delegation` in `git/SKILL.md`; the role loads the skill
    and matching reference without copying Git policy.

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
    `agent-home/skills/writing/references/voice-profile.md` holds the full interview
    profile inside the `writing` skill.
36. **Test the voice skill with a few subagents writing paired samples.** "then
    making a few sub agents write something would go?" and "do it". Status: `done` —
    three with-skill/baseline pairs ran on the same model and their drafts were compared.
37. **Calibrate the voice skill from sample feedback.** Keep the accepted content,
    split it into shorter paragraphs, and allow less formal messages for some
    teammates. Status: `done` — the profile's post-interview calibration, quick
    reference card, and the `## How to apply this profile` and `## Anti-overfitting`
    sections at the top of `writing/references/voice-profile.md`.

## Writing

38. **One `writing` skill owns prose, with four references.** `natural-writing.md`,
    `voice-profile.md`, `academic.md`, and `latex.md`. Status: `done` —
    `miquel-voice` and `objective-scholar` are removed, not kept as aliases;
    `objective-scholar`'s rules are folded in as the two academic references.
39. **No evals are carried over.** Only the voice profile survives from `miquel-voice`.
    Status: `done` — no `evals/` directory exists under
    `agent-home/skills/writing/`, and neither the upstream `eval.md` nor
    `miquel-voice/evals/evals.json` was imported.
40. **Every agent is instructed to read `natural-writing` and `voice-profile` for any
    prose task; the academic and LaTeX references are opt-in.** Status: `done` — one
    bullet in `config/AGENTS.md`, `writing` in all eight `bootstrap_pi.sh` skill lists
    with `['writing']` as the fallback, and `## Read these two first` in
    `writing/SKILL.md`.
41. **Attribution for imported rules lives in `README.md` only, never inside a skill
    file.** Status: `done` — the `### Attribution` subsection of the README's skills
    section.
42. **`core` is deleted and every remaining reference to it is removed.** Status:
    `done` — `bootstrap.sh`, `bootstrap_pi.sh`, `config/AGENTS.md`, and the tests.
    `codex/config.toml`'s `inherit = "core"` stays: it is a shell-environment-policy
    value, not the deleted skill.
43. **The `$miquel-voice` and `$objective-scholar` triggers disappear; both become
    `$writing`.** Status: `done`.
44. **The merged natural-writing rules keep the upstream impact weights and the
    optional before/after score report, and keep both sources' safeguards.** Status:
    `done` — coverage, no-new-patterns, and genre safeguards beside the
    anti-over-compression guards; individual rule-reference impacts are retained, and the
    optional score is a documented editorial heuristic with consistent arithmetic.

## Diagram artifacts

45. **Create an editable map of the daily agent workflow article, with its main
    diagram linked to surrounding detail diagrams.** "the main diagram and the other
    diagrams around it and each node pointing to those sub diagrams"; Excalidraw or
    tldraw is acceptable. Status: `done` —
    `docs/diagrams/daily-agent-workflow/daily-agent-workflow.excalidraw` and its local
    zoomable `preview.html`; source: <https://cgaravito.dev/en/blog/my-daily-agent-workflow>.

## Writing refinement

46. **Use `writing` throughout the process, not only after a draft exists.** "it would be
    nice if the skill could be used not only afet things are already written, rather on
    any step of the process." Status: `done` — preparation, outlines, drafting, editing,
    and detection have distinct routes and outputs; a draft is required only to inspect
    or edit that draft.
47. **Fix the adversarial writing-review findings.** "keep that in mind but solve the
    finding"; the goal remains better, less sloppy, realistic writing that knows how the
    user would write. Status: `done` — contextual rules and the final checklist preserve
    meaning, evidence, precise terms, and the writer's voice; source exceptions, individual
    rule impacts, score arithmetic, and the publication-review boundary are corrected.

## Agentic planning and delivery workflow

48. **Land the goal with the human before coding.** Record the current and desired behavior,
    scope and exclusions, evidence and sources, environment and test method, and useful
    diagrams or mockups. Verify facts; ask the human to decide preferences and tradeoffs.
    Status: `done` — authored in `agent-home/skills/workflow/` and the planning references;
    live use is pending.
49. **Get an independent proposal without code or the preferred solution, then challenge
    the plan adversarially.** Check source claims and bug evidence, allow one rebuttal, and
    let the human settle remaining disputes. Status: `done` — authored; live use is pending.
50. **Build one narrow slice at a time.** Ask before parallel slices, even if independent.
    One worktree and PR per slice; after the prior PR and its review/CI/human gates are
    accepted, start the next worktree from that PR head without waiting for merge. Target
    each unmerged parent PR and verify that the child PR contains only its own slice; stop
    if ancestry or squash merge breaks that check. Use separate agent sessions across
    stages and serialize writers. Status: `done` — authored; stacked live execution is
    pending.
51. **Scale coding supervision by the approved plan size.** The root directs one retained
    coder for `small`; a read-only coding supervisor directs one retained coder under an
    explicit bounded grant for `large`. The human may override the plan's size; escalate
    after two unsuccessful rounds on the same problem. Status: `done` — workflow and roles
    authored; paired agent trial is pending.
52. **Define scope, evidence, observability, and validation before each slice.** Preflight
    live applications and test tools only with bounded authorization; ask when needed, but
    do not ask again for an exact existing authorization. Record nonblocking out-of-scope
    findings without attacking them; escalate real blockers. Status: `done` — authored;
    live validation is pending.
53. **Use flash, swarm, swarm-smart, or full review as the scope warrants.** Verify
    findings and classify P0–P3 plus blocked/unverified; correct all verified in-scope
    findings, including non-blocking cleanup, in priority order. Full live end-to-end checks
    require an authorized target. Status: `done` — authored; live review runs are pending.
54. **Take a plan-authorized local checkpoint before cleanup and ship only after result
    acceptance.** The accepted plan authorizes only named Git actions and bounds; final
    human acceptance is the result gate, not a second authorization request. Repository
    rules and destructive-recovery approvals still apply. Status: `done` — authored; no Git
    action was taken in this repository.
55. **Persist plans and implementation choices separately from lasting project decisions.**
    Keep a local progress record for stage and slice, authorization, evidence, deferrals,
    and next action. Use decision records for enduring product or architecture intent.
    Status: `done` — authored; live progress replay is pending.
56. **Scale the flow down for small fixes.** A single fast slice should use proportionate
    research, adversarial challenge, coding, and review so it can ship quickly. Status:
    `done` — authored; timed live trial is pending.
57. **Install OpenClaw's `test-audit` skill for coders, reviewers, and cleanup.** "It works
    for the coders and the reviewrs, for the clean up." Status: `done` —
    `agent-home/skills/test-audit/` holds the adapted skill plus
    `references/campaign.md`. Its value bar, junk patterns, retention bar, candidate
    evidence, edit shape, and eight campaign phases are kept; its OpenClaw-specific skill
    names (`$openclaw-testing`, `$crabbox`, `$autoreview`, `$openclaw-pr-maintainer`),
    Vitest scripts, and PR flow are replaced with this repository's own test commands and
    the `git` skill. `test-audit` is wired into `coder`, `cleanup-worker`,
    `coding-supervisor`, `live-validator`, `review-worker`, and all four `reviewer-*` roles;
    `git-worker` is deliberately excluded. Provenance is recorded in the README
    attribution block (MIT, OpenClaw Foundation).
58. **Prefer catalog-selected Pi reviewers under Orca, keep full-preset live validation on
    Codex, and honor explicit AGY/Pi reviewer rosters exactly.** Pin Pi through Orca's
    supervised custom-terminal route and report the effective model when the runtime exposes
    it. Status: `partial` — policy and contract checks are authored; a supervised live Pi
    smoke test remains pending.
59. **Let the human-facing super-agent advance routine stages.** "The things that are just
    one after the other ... is the super agent who does that." The progress template must
    show the current gate and next action; pause for human decisions or blockers. Status:
    `done` — workflow and progress instructions updated; live use pending.
60. **Provide a reusable, structured critic agent.** It should challenge plans and other
    proposals with source-grounded findings, rather than exist only as a one-off planning
    brief. Status: `done` — `critic` role registered for Codex, Pi, and AGY; live use pending.
61. **Require a complete grounded plan before coding and review.** The plan must establish
    verified current behavior, goal, scope, exclusions, evidence, and a usable validation
    method; reviewers read the full approved plan and amendments. Status: `done` — workflow
    and review contracts updated; live use pending.
62. **State default reviewer harness and model tier, then select the exact model from the
    catalog.** Preserve explicit user routes; Pi is the default reviewer harness under
    Orca and Codex owns full-preset live validation. Status: `done` — review routing now
    names tiers and consults the catalog; live Pi routing remains unverified.
63. **For small slices, the super-agent babysits the coder; for large slices, a read-only
    sub-orchestrator babysits one coder and coordinates review.** Status: `done` — routing
    and supervisor instructions updated; live use pending.
64. **Use one `$workflow` command from intake through the last slice.** Start progress
    before a plan exists; run the draft, improvement, adversarial, and visual wave-plan
    phases; show the full wave and obtain explicit delivery approval before coding. After
    each result gate, advance routine stages until a human decision or blocker is needed.
    Status: `done` — command and skill consolidated; live use pending.
65. **Refine each approved slice just before coding without silently changing its goal.**
    Small slices use the root; large slices use the read-only coding supervisor. Changes
    to behavior, scope, dependencies, validation, or authority return to the human.
    Status: `done` — workflow and supervisor contract updated; live use pending.
66. **Keep the wave plan readable and its diagrams editable.** Migrate the deterministic
    HTML renderer into `$workflow`, link editable diagram files and SVG previews, and
    keep native Markdown authoritative. Status: `done` — local SVG preview and editable
    links covered by renderer tests; live Lavish view pending.
67. **Make swarm an internal `$review` route.** Remove the separate
    `multi-agent-review` entry point while preserving its read-only specialist contracts;
    keep `review-plan`, `review-findings`, and `refine-plan` usable alone. Status: `done`
    — review reference and bootstrap inventory updated; live review pending.
