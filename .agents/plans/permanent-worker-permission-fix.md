# Permanent worker permission fix

## Goal and context

Make new Codex and AGY workers run without permission prompts or OS sandbox failures, with the same behavior after reinstall.

The root Codex configuration already permits this, but all eight worker roles still select a sandbox. Installed global instructions also lack the canonical Orca routing rule. AGY and Pi currently derive reviewer tool restrictions from Codex’s sandbox setting, so changing that setting alone would accidentally grant editing tools.

Reviewed by one fresh GPT-5.6 Sol critic with high reasoning. Its findings are incorporated below; no unresolved user decisions remain.

## Files touched

- `codex/agents/coder.toml`
- `codex/agents/cleanup-worker.toml`
- `codex/agents/commit-worker.toml`
- `codex/agents/review-worker.toml`
- `codex/agents/reviewer-quick.toml`
- `codex/agents/reviewer-reasoning.toml`
- `codex/agents/reviewer-arch.toml`
- `codex/agents/reviewer-e2e.toml`
- `bootstrap_agy.sh`
- `bootstrap_pi.sh`
- `agent-home/skills/subagent-routing/SKILL.md`
- `tests/codex-config.test.mjs`
- `tests/bootstrap.test.sh`

Installation also refreshes the corresponding installed role files and `~/.codex/AGENTS.md`. No new configuration format or CLI interface is needed.

## Requirements and steps

1. **Correct all eight Codex roles.** Set `sandbox_mode = "danger-full-access"` and `approval_policy = "never"`. Preserve models, reasoning levels, descriptions, and task restrictions. Reviewers must still prohibit edits, commits, pushes, and deployments.

2. **Separate reviewer tools from sandbox settings.** In both adapter generators, classify reviewers using:
   `name == "review-worker" or name.startswith("reviewer-")`.
   Preserve existing tool lists: five reviewers remain restricted; three implementation workers retain their existing command and editing tools. Add no metadata layer.

3. **Document the observed AGY readiness recovery.** In `subagent-routing`, require inspecting the terminal after a readiness timeout. For an authenticated, idle AGY prompt, use the loaded Orca guide and command help to confirm the supported manual path: tracked task, dispatch without `--inject`, `--return-preamble`, and delivery of that exact preamble. Send another Enter only when inspection shows the prompt remains unsubmitted. Preserve completion reporting and close only the test-owned terminal when release reports no owned resource. Authentication failures remain distinct blockers.

4. **Add focused regression assertions.** Check both permission fields for every Codex role, the generated global Orca rule, all five restricted reviewer tool lists, and all three writer tool lists. Reuse the bootstrap test’s existing repeat-install coverage; do not run the suite twice.

5. **Install only the corrected configuration.** Back up and replace the eight installed Codex role files. Regenerate `~/.codex/AGENTS.md` using the existing `write_generated_agents` composition from canonical policy sources. Run the existing AGY and Pi adapters without installing extensions. Do not invoke full `install_config`, which would overwrite the current live model. Verify installed roles match their sources and unrelated live settings remain unchanged.

## Applicable instructions

- `AGENTS.md`: focused changes, preserve unrelated work, no commits or branches.
- `config/AGENTS.md`: canonical global policy and mandatory Orca delegation.
- `agent-home/skills/subagent-routing/SKILL.md`: preserve roles and permissions through Orca.
- `agent-home/skills/review-plan/SKILL.md`: finalize in chat; implementation belongs to `$code`.

## Readiness check

Run once:

```bash
node --test tests/codex-config.test.mjs && bash tests/bootstrap.test.sh
```

This covers role configuration, generated policies, tool restrictions, and repeat installation.

## Live validation

**Flow:** After approval, launch fresh Codex and AGY workers through Orca for harmless `printf` execution and reading three README lines. Forward Codex permission values from the installed reviewer configuration rather than hardcoding test overrides. Use a command-capable AGY worker because restricted AGY reviewers intentionally lack command tools. Collect completion reports and close test terminals.

**Expected:** Commands succeed without approval prompts or sandbox errors. Installed-role assertions establish default correctness; the live flow establishes Orca execution. Report AGY automatic readiness and manual dispatch results separately.

**Can run:** Orca CLI through `exec_command`. Pending user approval; neither planner nor executor launches this validation automatically.

## Main-agent memory updates

None needed.

## Out of scope

OS security changes, changing reviewer editing authority, repairing Orca itself, unrelated settings, model changes, authentication changes, commits, branches, and worktrees. Existing sessions require restarting to load corrected defaults.

The plan is finalized in chat and ready for `$code`.
