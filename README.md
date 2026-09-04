# my-codex-config

Repository-managed Codex-only configuration with shared skills and native agents. Codex
owns planning, permissions, orchestration, hooks, MCP definitions, and synthesis.
OpenCode remains separately owned by `my-opencode-config`.

## Requirements

- macOS or Linux with Bash and Git.
- An app-managed Codex CLI installation.
- Python 3, Node.js, and npm (`npx`).
- `codegraph`, `btca`, and `headroom` for the configured MCP servers.
- GitHub CLI (`gh`) authenticated to GitHub for the private-repository clone command.

Workmux is optional. Its hooks become no-ops when `workmux` is unavailable.

## Install On Another Computer

Clone the private repository and run the installer:

```bash
gh auth login
gh repo clone MiquelGomezCorral/my-codex-config ~/code/my-codex-config
cd ~/code/my-codex-config
./bootstrap.sh
codex login
```

`bootstrap.sh` validates its dependencies and source files before installing. It manages
individual durable entries only; it never replaces or upgrades binaries, reads or links
the complete `~/.codex` runtime directory, or writes under `~/.config/opencode`.

Conflicting managed entries are backed up under
`${XDG_STATE_HOME:-$HOME/.local/state}/my-codex-config/backups/<timestamp>/` with private
permissions. Restart Codex after installation so it reloads config, skills, agents, and
hooks.

Bootstrap installs `config.toml` and agent TOMLs as private copies because Codex appends
local trust state to the config and rejects symlinked role files. Other immutable managed
entries remain symlinked to the repository.

Verify the installation:

```bash
./bootstrap.sh --check
codex doctor
codex mcp list
```

## Authentication

Codex authentication is manual and never stored in this repository:

```bash
codex login
```

## Skills and agents

All shared skills are owned by `agent-home/skills` and installed at `~/.agents/skills`.
Invoke one explicitly with `$skill-name`, for example `$code`, `$review`, `$cleanup`, or
`$obsidian-vault`. Codex's native behavior replaces the former OpenCode `build`, `plan`,
`general`, `explore`, `answer`, and `code-reviewer` roles. Nine focused Codex TOML agents
preserve the distinctive worker and reviewer capabilities.

Repository commands keep the OpenCode command-wrapper flow: the command passes its
arguments to one skill, and the skill owns the workflow. Use the `/commands/` namespace
because Codex reserves unqualified slash commands. Everything after the command name is
forwarded exactly as `$ARGUMENTS`.

| Command | Skill |
| --- | --- |
| `/commands/bro` | `bro` |
| `/commands/cleanup` | `cleanup` |
| `/commands/code` | `code` |
| `/commands/commit` | `commit` |
| `/commands/index` | `index` |
| `/commands/init` | `init` |
| `/commands/plan-implementation` | `plan-implementation` |
| `/commands/review-findings` | `review-findings` |
| `/commands/review-plan` | `review-plan` |
| `/commands/review-pr-comments` | `review-pr-comments` |
| `/commands/review` | `review` |

For example, `/commands/review quick focus on the payment path` invokes `review` with
`quick focus on the payment path` as its arguments. Direct `$skill-name` invocation also
remains available.

Ponytail is installed from `DietrichGebert/ponytail` during bootstrap. Its skills, hooks,
and commands are maintained by that plugin rather than copied into this repository. Review
and trust its two lifecycle hooks in Codex once after the first install.

## Repository ownership

Native Codex agents use `spawn_agent`, `wait_agent`, `send_message`, `followup_task`,
`list_agents`, and `interrupt_agent`. Retained threads resume only when their parent,
role, model, and directory still match. There is no provider fallback or second harness
in this repository.

`my-opencode-config` remains the owner of OpenCode's `config/skills/` and
`config/commands/`. It is a separate rollback path and is not modified or installed by
this repository.

Vault Context is explicit-only:

```bash
node "${CODEX_HOME:-$HOME/.codex}/vault-context/bin/search.mjs" --prompt "search text"
```

No prompt hook performs Vault search, and no OpenCode plugin adapter is installed in
Codex.

## Check

```bash
./bootstrap.sh --check
bash tests/bootstrap.test.sh
node --test tests/*.mjs config/plugins/vault-context/test/plugin.test.mjs
```

The first command is the minimum readiness check. The isolated-home test uses temporary
directories and does not install into a live home or require authentication.

## Rollback

The existing OpenCode installation remains untouched. Stop using the Codex configuration,
then run `my-opencode-config`'s documented bootstrap or restore its prior links. This
repository does not install or upgrade OpenCode.

## Never commit

- Credentials, auth state, sessions, histories, databases, logs, caches, memories,
  installation IDs, or plugin caches.
- Machine-specific absolute paths or private connection data.
- Generated dependencies such as `node_modules`.
