# Known Errors

## Errors

- `Missing required commands`: install or expose the app-managed `codex` binary; bootstrap
  does not replace or upgrade it.
- `codex-install.sh: No such file or directory`, or a stale `/tmp/codex-install.sh`: use
  `config/bin/update-codex` (`~/.local/bin/update-codex`), which always re-fetches a fresh
  installer and resolves the target from the live `codex` symlink, so no `CODEX_HOME` prefix
  is needed. A 404 on a pinned version means the `--release` value does not exist on GitHub.
- `AGY readiness timeout`: inspect the terminal before retrying; the timeout can be an
  unsubmitted prompt rather than a launch failure. Follow the loaded environment guide for
  the recovery sequence.
- `Forbidden runtime file found in repository`: remove the runtime artifact and keep it
  in the user home rather than the repository.
- `spawn mcp-searxng ENOENT` from a Pi MCP connect, or any Pi MCP server that cannot be
  found although `pi install` succeeded: Pi spawns MCP servers with its own `PATH`, which
  does not include the extension bin directory. Re-run `bootstrap_pi.sh`, which writes the
  resolved `$PI_AGENT_ROOT/npm/node_modules/.bin/...` command instead of a bare name.
