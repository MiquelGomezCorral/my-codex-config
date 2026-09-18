# Opt-in Pi and AGY bootstrap adapters

## Goal

Install the nine existing Codex roles and shared skills into Pi and/or AGY only when explicitly requested, without changing existing Codex configuration, documentation, or `.agents` memory.

## Files touched

- `bootstrap.sh`
- `bootstrap_pi.sh` (new)
- `bootstrap_agy.sh` (new)
- `tests/bootstrap.test.sh`

## Requirements

- Add `--pi` and `--agy` options to `bootstrap.sh`; both default to disabled.
- If an option is absent, its harness script is never called.
- If an option is present but the matching CLI is unavailable, print a concise skip message and continue installing the rest.
- Preserve `codex/agents/*.toml` as the sole agent/prompt source. No copied agent definitions are committed.
- Each harness script reads those TOMLs with standard-library Python, renders all nine native Markdown roles, and links the existing shared skills.
- Pi uses its active model; AGY uses `inherit`. Read-only roles receive only read/search tools.
- Do not alter README, `.agents/`, Codex config, OpenCode config, authentication, or existing shared skills.

## Steps

1. Update `bootstrap.sh` argument parsing and help text with `--pi` and `--agy`, both initialized to `false`.
2. After the existing Codex installation, conditionally execute:
   - `bootstrap_pi.sh --install-extension` only for `--pi` when `pi` is on `PATH`.
   - `bootstrap_agy.sh` only for `--agy` when `agy` is on `PATH`.
   Missing requested CLIs produce a skip message, not a failed bootstrap.
3. Add `bootstrap_pi.sh` as a standalone installer:
   - Render nine Pi subagent Markdown files into `~/.pi/agent/agents/` from the Codex TOMLs.
   - Link `~/.pi/agent/skills` to `~/.agents/skills`.
   - When passed `--install-extension`, run `pi install npm:pi-subagents`; no extension install occurs otherwise.
4. Add `bootstrap_agy.sh` as a standalone installer:
   - Create the generated `my-codex-config` plugin under `~/.gemini/config/plugins/`.
   - Render nine AGY custom-agent Markdown files in its `agents/` directory, with `subagent: true`, `mainAgent: false`, and AGY-native tool lists.
   - Generate its minimal `plugin.json` and link its `skills/` directory to `~/.agents/skills`.
5. In both scripts, preserve conflicting target files through the same private backup convention as the main bootstrap; do not overwrite unrelated harness state.
6. Extend `tests/bootstrap.test.sh` to run both helper scripts against its temporary home and verify the nine generated roles, skill links, AGY manifest, role names, and read-only/write tool separation. Do not invoke Pi package installation in tests.

## Applicable instructions

- `AGENTS.md`: narrow implementation; preserve unrelated work and runtime state.
- `.agents/conventions.md`: portable paths only; no committed user-home paths or credentials.
- `agent-home/skills/subagent-routing/SKILL.md`: use native harness role definitions.
- `agent-home/skills/python-coding/SKILL.md`: use `tomllib` and no Python dependency.
- Ponytail: generate adapters from existing TOMLs instead of duplicating role configuration.

## Readiness check

`bash tests/bootstrap.test.sh`

## Live validation

Flow: Run `./bootstrap.sh --pi --agy`, restart both harnesses, then perform one harmless `reviewer-quick` inspection in each.

Expected: Both harnesses discover the role and shared skills; no repository file changes occur.

Can run: User-only, pending approval because it invokes authenticated external agent sessions.

## Main-agent memory updates

None.

## Out of scope

README and `.agents` updates, generic cross-harness launch adapters, model mapping, external-harness authentication, and any changes to existing Codex role TOMLs.
