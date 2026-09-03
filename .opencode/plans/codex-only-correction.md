# Goal

Create a Codex-only configuration repository that preserves the existing OpenCode capabilities as native Codex skills and agents, while leaving `my-opencode-config` unchanged as the owner of OpenCode’s skills and commands.

# Context

`my-codex-config` currently contains a mostly complete Codex migration plus an unnecessary Codex-to-OpenCode worker bridge. The bridge caused the reviewed integration problems and is no longer required.

OpenCode already retains its 46 skills and 11 command wrappers in `my-opencode-config`. Codex officially discovers personal skills through `~/.agents/skills`, invokes them with `$skill-name`, and discovers custom agents from `~/.codex/agents/`.

Codex custom prompts are deprecated, so command capabilities will be represented as same-named Codex skills rather than `/prompts:*` files.

# Files Touched

- `bootstrap.sh`
- `bootstrap-v2.sh` (delete)
- `README.md`
- `.opencode/plans/migrate-codex-config.md` (delete after the corrected plan is persisted)
- `opencode-worker/` (delete)
- `config/bin/opencode-go-worker.mjs` (delete)
- `codex/agents/opencode-go-runner.toml` (delete)
- `agent-home/skills/opencode-go-worker/` (delete)
- `agent-home/skills/subagent-routing/SKILL.md`
- `agent-home/skills/code/SKILL.md`
- `agent-home/skills/cleanup/SKILL.md`
- `agent-home/skills/review/SKILL.md`
- `agent-home/skills/agent-swarm/SKILL.md`
- `agent-home/skills/multi-agent-review/SKILL.md`
- `agent-home/skills/core/SKILL.md`
- `agent-home/skills/customize-opencode/SKILL.md`
- `agent-home/skills/commit/SKILL.md` (new)
- `agent-home/skills/review-findings/SKILL.md` (new)
- `agent-home/skills/index/SKILL.md` (new)
- `agent-home/skills/init/SKILL.md` (new)
- `agent-home/skills/plan-implementation/SKILL.md` (new)
- `tests/opencode-go-worker.test.mjs` (delete)
- `tests/codex-config.test.mjs`
- `tests/bootstrap.test.sh`

# Requirements

- `my-opencode-config` and the live OpenCode configuration remain untouched.
- OpenCode continues owning its existing `config/skills/` and `config/commands/`.
- `my-codex-config` contains no OpenCode executable integration, worker configuration, authentication instructions, session ownership, provider routing, or `opencode-go/*` behavior.
- The app-managed Codex binary remains untouched and is never upgraded by bootstrap.
- Existing Codex configuration, hooks, rules, MCP definitions, explicit Vault adapter, Workmux integration, Ponytail behavior, and nine useful custom agents remain.
- All applicable OpenCode skill capabilities remain available as Codex-native skills.
- OpenCode-specific lifecycle behavior such as `task_key` and `task-model-recovery` is translated to native Codex subagent operations rather than copied literally.
- `subagent-routing` handles only native Codex agents and retained Codex threads.
- The eleven OpenCode command capabilities have Codex equivalents:
  - `/cleanup` becomes `$cleanup`
  - `/review` becomes `$review`
  - `/code` becomes `$code`
  - `/commit` becomes `$commit`
  - `/review-findings` becomes `$review-findings`
  - `/index` becomes `$index`
  - `/init` becomes `$init`
  - `/plan-implementation` becomes `$plan-implementation`
  - `/review-plan` becomes `$review-plan`
  - `/review-pr-comments` becomes `$review-pr-comments`
  - `/bro` becomes `$bro`
- Codex’s built-in `/review` and `/init` remain unchanged; the migrated workflows use their explicit `$review` and `$init` skill names.
- Bootstrap manages only durable Codex files and the documented `~/.agents/skills` user skill location.
- Authentication, sessions, histories, databases, logs, caches, memories, installation IDs, plugin-manager state, and credentials remain outside Git.
- No branches, worktrees, commits, pushes, remotes, or live installations are created.

# Steps

1. Remove the complete OpenCode worker boundary: `opencode-worker/`, the launcher, runner agent, worker skill, worker tests, authentication documentation, and bootstrap dependencies.

2. Simplify `subagent-routing` to native Codex operations only. Preserve native agent selection, spawning, waiting, steering, cancellation, and retained-thread ownership without OpenCode models or fallback providers.

3. Remove OpenCode-Go branches from `code`, `cleanup`, `review`, `agent-swarm`, `multi-agent-review`, `core`, and `customize-opencode`. Keep their existing behavior using only native Codex agents and tools.

4. Add the five missing command-equivalent skills: `commit`, `review-findings`, `index`, `init`, and `plan-implementation`. Each should remain a thin native wrapper around the existing authoritative skill or custom agent rather than duplicate the underlying workflow.

5. Simplify `bootstrap.sh`. Remove OpenCode dependency checks and worker installation, retain per-entry Codex linking and conflict backups, install the combined Codex skill tree at `~/.agents/skills`, and never write under `~/.config/opencode`.

6. Remove `bootstrap-v2.sh` because rollback and OpenCode installation remain entirely owned by `my-opencode-config`.

7. Update `README.md` to describe a Codex-only repository, the `$skill-name` command mapping, the unchanged OpenCode repository, installation, readiness, live validation, and rollback.

8. Update the focused tests. Assert the required skill and command-equivalent inventory, absence of OpenCode worker artifacts and references, valid Codex TOML/JSON/frontmatter, nine custom agents, safe bootstrap behavior, and preservation of runtime files.

9. Extend the isolated bootstrap test to invoke the installed Codex configuration with `codex --strict-config` without using the live home, authentication, or a running agent session.

10. Inspect the final status and complete untracked diff. Confirm the original OpenCode repository has not changed and no credential-shaped or runtime files were introduced.

# Applicable Instructions

- `AGENTS.md:18`: Treat old OpenCode repositories and live homes as read-only sources.
- `AGENTS.md:20`: Never add credentials, runtime state, caches, databases, or machine-specific paths.
- `config/AGENTS.md:20`: Apply focused patches instead of rewriting whole files.
- `config/AGENTS.md:43`: Add only mechanisms required by demonstrated needs.
- `config/security-rules.md:3`: Never persist credentials, tokens, authentication state, or private connection data.

# Readiness Check

```bash
./bootstrap.sh --check
```

This must include static repository validation and an isolated `codex --strict-config` parse without changing the live Codex or OpenCode homes.

# Live Validation

`Flow`: Pending user approval. Run bootstrap against the real user configuration, restart Codex, open a disposable Git repository, confirm the nine custom agents and migrated skills are discoverable, invoke one migrated command-equivalent skill, run one native reviewer, invoke explicit Vault search, and observe the Workmux lifecycle hook.

`Expected`: Codex loads the managed configuration, rules, hooks, MCPs, agents, and skills; the migrated `$skill-name` workflow runs through native Codex agents; Vault context remains explicit-only; no OpenCode process starts; existing OpenCode skills and slash commands remain available from `my-opencode-config`.

`Can run`: User-only because it modifies the live Codex skill/configuration links and requires restarting an authenticated Codex session.

# Main-Agent Memory Updates

- Update `.agents/architecture.md` to describe a Codex-only repository with no OpenCode worker backend.
- Update `.agents/decisions.md` to record separate repository ownership and native Codex-only subagent routing.
- Update `.agents/workflow.md` to remove OpenCode authentication and worker validation.
- Update `.agents/conventions.md` to remove OpenCode worker permission-profile references.
- Update `.agents/known-errors.md` to remove OpenCode-Go worker errors.

# Out of Scope

- Modifying `my-opencode-config` or its live links.
- Fixing the discarded OpenCode worker implementation.
- Running `opencode` from Codex.
- Supporting `opencode-go/*` models.
- Replacing Codex skills with deprecated custom prompts.
- Persisting Codex plugin marketplace or installation state.
- Installing or upgrading Codex or OpenCode.
- Running live validation without approval.
- Creating commits, branches, worktrees, remotes, or pull requests.
