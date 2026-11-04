#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd)
TEST_ROOT=$(mktemp -d)
trap 'rm -rf "$TEST_ROOT"' EXIT
STUB_BIN="$TEST_ROOT/bin"
STUB_LOG="$TEST_ROOT/install.log"
PI_LOG="$TEST_ROOT/pi.log"
CLAUDE_LOG="$TEST_ROOT/claude.log"
CLAUDE_MCP_STATE="$TEST_ROOT/claude-mcp-names"
mkdir -p "$STUB_BIN/global/node_modules/mcp-searxng"
printf 'unrelated\n' > "$CLAUDE_MCP_STATE"
export STUB_BIN STUB_LOG PI_LOG CLAUDE_LOG CLAUDE_MCP_STATE

cat > "$STUB_BIN/npm" <<'SH'
#!/usr/bin/env bash
printf 'npm %s\n' "$*" >> "$STUB_LOG"
if [[ "$*" == *'@colbymchenry/codegraph@1.6.0'* ]]; then
  printf '#!/usr/bin/env bash\nexit 0\n' > "$STUB_BIN/codegraph"
  chmod +x "$STUB_BIN/codegraph"
fi
if [[ "$*" == *'lintapple@0.1.20'* ]]; then
  printf '#!/usr/bin/env bash\nexit 0\n' > "$STUB_BIN/lintapple"
  chmod +x "$STUB_BIN/lintapple"
fi
if [[ "$*" == *'mcp-searxng@1.11.1'* ]]; then
  mkdir -p "$STUB_BIN/global/node_modules/mcp-searxng"
  printf '{"name":"mcp-searxng","version":"1.11.1"}\n' > "$STUB_BIN/global/node_modules/mcp-searxng/package.json"
  printf '#!/usr/bin/env bash\nexit 0\n' > "$STUB_BIN/global/node_modules/mcp-searxng/cli.js"
  chmod +x "$STUB_BIN/global/node_modules/mcp-searxng/cli.js"
  ln -sfn "$STUB_BIN/global/node_modules/mcp-searxng/cli.js" "$STUB_BIN/mcp-searxng"
fi
SH
cat > "$STUB_BIN/bun" <<'SH'
#!/usr/bin/env bash
printf 'bun %s\n' "$*" >> "$STUB_LOG"
if [[ "$*" == *'add -g btca'* ]]; then
  printf '#!/usr/bin/env bash\nexit 0\n' > "$STUB_BIN/btca"
  chmod +x "$STUB_BIN/btca"
fi
SH
cat > "$STUB_BIN/npx" <<'SH'
#!/usr/bin/env bash
printf 'npx %s\n' "$*" >> "$STUB_LOG"
SH
cat > "$STUB_BIN/git" <<'SH'
#!/usr/bin/env bash
if [[ "$1" != clone ]]; then
  exit 2
fi
printf 'git %s\n' "$*" >> "$STUB_LOG"
repository=$4
destination=$5
mkdir -p "$destination"
case "$repository" in
  *diagram-design.git)
    mkdir -p "$destination/skills/diagram-design"
    printf '%s\n' '---' 'name: diagram-design' 'description: fixture' '---' > "$destination/skills/diagram-design/SKILL.md"
    ;;
  *codex-excalidraw-skill.git)
    mkdir -p "$destination/skill"
    printf '%s\n' '---' 'name: excalidraw' 'description: fixture' '---' > "$destination/skill/SKILL.md"
    ;;
  *) exit 3 ;;
esac
SH
cat > "$STUB_BIN/codex" <<'SH'
#!/usr/bin/env bash
printf 'codex %s\n' "$*" >> "$STUB_LOG"
SH
cat > "$STUB_BIN/agy" <<'SH'
#!/usr/bin/env bash
printf 'agy %s\n' "$*" >> "$STUB_LOG"
SH
cat > "$STUB_BIN/claude" <<'SH'
#!/usr/bin/env bash
printf 'claude %s\n' "$*" >> "$CLAUDE_LOG"
if [[ "$1" == mcp && "$2" == remove ]]; then
  name=$3
  grep -Fxq "$name" "$CLAUDE_MCP_STATE" || exit 1
  awk -v name="$name" '$0 != name' "$CLAUDE_MCP_STATE" > "$CLAUDE_MCP_STATE.tmp"
  mv "$CLAUDE_MCP_STATE.tmp" "$CLAUDE_MCP_STATE"
elif [[ "$1" == mcp && "$2" == get ]]; then
  grep -Fxq "$3" "$CLAUDE_MCP_STATE" || exit 1
  printf '%s:\n  Scope: User config (available in all your projects)\n  Type: stdio\n' "$3"
  if [[ -n "${CLAUDE_SEARXNG_CUSTOM:-}" ]]; then
    printf '  Command: /usr/bin/mcp-searxng\n  Args: --custom\n  Environment:\n    SEARXNG_URL=http://localhost:8080\n'
  else
    printf '  Command: /usr/bin/mcp-searxng\n  Args:\n  Environment:\n    SEARXNG_URL=http://localhost:8080\n'
  fi
elif [[ "$1" == mcp && "$2" == add-json ]]; then
  name=$3
  if grep -Fxq "$name" "$CLAUDE_MCP_STATE"; then
    printf 'Server already exists: %s\n' "$name" >&2
    exit 1
  fi
  printf '%s\n' "$name" >> "$CLAUDE_MCP_STATE"
fi
SH
cat > "$STUB_BIN/pi" <<'SH'
#!/usr/bin/env bash
printf 'pi %s\n' "$*" >> "$PI_LOG"
if [[ "$1" == install && "$2" == npm:pi-subagents@0.79.1 ]]; then
  mkdir -p "$PI_CODING_AGENT_DIR/npm/node_modules/pi-subagents"
  printf '{"name":"pi-subagents","version":"0.79.1"}\n' > "$PI_CODING_AGENT_DIR/npm/node_modules/pi-subagents/package.json"
fi
SH
cat > "$STUB_BIN/sleep" <<'SH'
#!/usr/bin/env bash
exit 0
SH
cat > "$STUB_BIN/docker" <<'SH'
#!/usr/bin/env bash
printf 'docker %s\n' "$*" >> "$STUB_LOG"
case "$1" in
  ps)
    if [[ -n "${DOCKER_PS_OUTPUT:-}" ]]; then
      printf '%s\n' "$DOCKER_PS_OUTPUT"
    fi
    ;;
  info)
    [[ "${DOCKER_MODE:-}" != unavailable ]]
    ;;
  inspect)
    if [[ "$2" == --format ]]; then
      if [[ "$3" == *'.Config.Image'* ]]; then
        [[ "${DOCKER_MODE:-}" != identity-fail ]]
        printf '%s\n' "${DOCKER_IMAGE:-docker.io/searxng/searxng:latest}"
      else
        [[ "${DOCKER_MODE:-}" != inspect-fail ]]
        printf '%s\n' 'running true false 0'
      fi
      exit 0
    fi
    [[ -e "$DOCKER_STATE" ]]
    ;;
  run)
    [[ "${DOCKER_MODE:-}" != run-fail ]] || exit 1
    : > "$DOCKER_STATE"
    ;;
  start)
    : > "$DOCKER_STATE"
    ;;
  *) exit 2 ;;
esac
SH
chmod +x "$STUB_BIN"/*
export PATH="$STUB_BIN:/usr/bin:/bin"

CHECK_ROOT="$TEST_ROOT/source-check"
mkdir -p "$CHECK_ROOT"
cp "$REPO_ROOT/bootstrap_codex.sh" "$REPO_ROOT/bootstrap_common.sh" "$CHECK_ROOT/"
cp "$REPO_ROOT/bootstrap_pi.sh" "$REPO_ROOT/bootstrap_agy.sh" "$CHECK_ROOT/"
cp -as "$REPO_ROOT/config" "$CHECK_ROOT/"
rm "$CHECK_ROOT/config/bin/update-codex"
if HOME="$TEST_ROOT/check-home" "$CHECK_ROOT/bootstrap_codex.sh" --check \
  > /dev/null 2> "$TEST_ROOT/missing-source.err"; then
  printf 'Codex source check accepted a missing managed file.\n' >&2
  exit 1
fi
grep -Fxq 'Missing config/bin/update-codex' "$TEST_ROOT/missing-source.err"
ln -s "$REPO_ROOT/config/bin/update-codex" "$CHECK_ROOT/config/bin/update-codex"
printf '%s\n' 'Read ~/.agents/skills/review/scripts/ocr-opencode-go.' > "$CHECK_ROOT/config/agents/guard-fixture.txt"
if HOME="$TEST_ROOT/check-home" "$CHECK_ROOT/bootstrap_codex.sh" --check \
  > /dev/null 2> "$TEST_ROOT/harness-root.err"; then
  printf 'Codex source check accepted a hard-coded harness skill root.\n' >&2
  exit 1
fi
grep -Fxq 'Hard-coded harness skill root found; use a path relative to the loaded skill instead' "$TEST_ROOT/harness-root.err"
printf '%s\n' 'Read `/home/miquel`' > "$CHECK_ROOT/config/agents/guard-fixture.txt"
HOME="$TEST_ROOT/check-home" "$CHECK_ROOT/bootstrap_codex.sh" --check > /dev/null 2> "$TEST_ROOT/home-path.err" || true
grep -Fxq 'Hard-coded harness skill root found; use a path relative to the loaded skill instead' "$TEST_ROOT/home-path.err"
rm "$CHECK_ROOT/config/agents/guard-fixture.txt"
printf '%s\n' 'See https://example.com/home/x/page and the rule /home/<user>/.' > "$CHECK_ROOT/config/agents/guard-fixture.md"
HOME="$TEST_ROOT/check-home" "$CHECK_ROOT/bootstrap_codex.sh" --check > /dev/null 2> "$TEST_ROOT/guard-quote.err" || true
if grep -Fq 'Hard-coded harness skill root' "$TEST_ROOT/guard-quote.err"; then
  printf 'Codex source check rejected a URL or quoted placeholder path.\n' >&2
  exit 1
fi
rm "$CHECK_ROOT/config/agents/guard-fixture.md"
credential_value='sk-'
for _ in {1..16}; do credential_value+='a'; done
printf '%s\n' "$credential_value" > "$CHECK_ROOT/credential-fixture.txt"
if HOME="$TEST_ROOT/check-home" "$CHECK_ROOT/bootstrap_codex.sh" --check \
  > /dev/null 2> "$TEST_ROOT/credential-check.err"; then
  printf 'Codex source check accepted a credential-shaped value.\n' >&2
  exit 1
fi
[[ "$(<"$TEST_ROOT/credential-check.err")" == 'Credential-shaped value found in repository' ]]

# An unpinned executable is replaced by the required connector version.
printf '{"name":"mcp-searxng","version":"1.0.0"}\n' > "$STUB_BIN/global/node_modules/mcp-searxng/package.json"
printf '#!/usr/bin/env bash\nexit 0\n' > "$STUB_BIN/global/node_modules/mcp-searxng/cli.js"
ln -s "$STUB_BIN/global/node_modules/mcp-searxng/cli.js" "$STUB_BIN/mcp-searxng"
OLD_SEARXNG_BIN="$TEST_ROOT/old-searxng-bin"
mkdir -p "$OLD_SEARXNG_BIN/node_modules/mcp-searxng"
printf '{"name":"mcp-searxng","version":"1.0.0"}\n' > "$OLD_SEARXNG_BIN/node_modules/mcp-searxng/package.json"
printf '#!/usr/bin/env bash\nexit 0\n' > "$OLD_SEARXNG_BIN/node_modules/mcp-searxng/cli.js"
chmod +x "$OLD_SEARXNG_BIN/node_modules/mcp-searxng/cli.js"
ln -s "$OLD_SEARXNG_BIN/node_modules/mcp-searxng/cli.js" "$OLD_SEARXNG_BIN/mcp-searxng"

CODEX_HOME_ROOT="$TEST_ROOT/codex-home"
CODEX_HOME="$CODEX_HOME_ROOT/.codex"
CODEX_TARGET="$CODEX_HOME"
BACKUP_ROOT="$TEST_ROOT/backups"
REUSED_PI_ROOT="$TEST_ROOT/reused-pi"
mkdir -p "$CODEX_TARGET/agents"
mkdir -p "$REUSED_PI_ROOT/skills/diagram-design"
printf '%s\n' '---' 'name: diagram-design' 'description: existing native skill' '---' > "$REUSED_PI_ROOT/skills/diagram-design/SKILL.md"
mkdir -p "$REUSED_PI_ROOT/npm/node_modules/mcp-searxng" "$REUSED_PI_ROOT/npm/node_modules/.bin"
printf '{"name":"mcp-searxng","version":"1.11.1"}\n' > "$REUSED_PI_ROOT/npm/node_modules/mcp-searxng/package.json"
printf '#!/usr/bin/env bash\nexit 0\n' > "$REUSED_PI_ROOT/npm/node_modules/mcp-searxng/cli.js"
chmod +x "$REUSED_PI_ROOT/npm/node_modules/mcp-searxng/cli.js"
ln -s "$REUSED_PI_ROOT/npm/node_modules/mcp-searxng/cli.js" "$REUSED_PI_ROOT/npm/node_modules/.bin/mcp-searxng"
mkdir -p "$CODEX_HOME_ROOT/.agents/skills/user-skill"
printf '%s\n' 'name: user-skill' > "$CODEX_HOME_ROOT/.agents/skills/user-skill/SKILL.md"
ln -s "$REPO_ROOT/config/skills/retired-skill" "$CODEX_HOME_ROOT/.agents/skills/retired-skill"
# Relative link that reaches the skills folder through a symlinked alias, so only resolving from the
# link's own folder (symlinks before `..`) lands it in the managed source.
ln -s "$REPO_ROOT/config/skills" "$TEST_ROOT/repo-skills"
ln -s ../../../repo-skills/relative-retired-skill "$CODEX_HOME_ROOT/.agents/skills/relative-retired-skill"
ln -s ../../elsewhere/foreign-skill "$CODEX_HOME_ROOT/.agents/skills/foreign-skill"
printf 'User Codex instructions.\n' > "$CODEX_TARGET/AGENTS.md"
cat > "$CODEX_TARGET/hooks.json" <<'JSON'
{"hooks":{"UserPromptSubmit":[{"hooks":[{"type":"command","command":": orca-agent-hook-form=1; orca","timeout":10}]}],"Stop":[{"hooks":[{"type":"command","command":"user-stop-hook"}]}]},"extra":"keep"}
JSON
printf '%s\n' '{"auth":"preserve"}' > "$CODEX_TARGET/auth.json"
printf '%s\n' 'user-owned role' > "$CODEX_TARGET/agents/coder.toml"
cat > "$CODEX_TARGET/config.toml" <<'TOML'
model = "user-selected-model"
custom_root_setting = "preserve"
user_paths = ["one", "two"]
plan_mode_reasoning_effort = "medium"
mcp_servers.dotted_local.command = "local-dotted-helper"
mcp_servers.dotted_local.args = []
[features]
hooks = false
local_option = "preserve"
[mcp_servers.local_test]
command = "local-helper"
args = []
[mcp_servers.braintrust]
command = "retired-helper"
[mcp_servers.vidext-operator-my-workspace]
command = "retired-helper"
[mcp_servers.headroom]
command = "retired-helper"
[mcp_servers.sequential-thinking]
command = "retired-helper"
[tui]
theme = "dark"
[model_providers.custom]
name = "Custom provider"
base_url = "https://example.invalid/v1"
[plugins.example]
marketplace = "user"
[projects."/tmp/project"]
trusted = true
TOML
export HOME="$CODEX_HOME_ROOT" CODEX_HOME BACKUP_ROOT
CODEX_HOME="$CODEX_HOME" HOME="$CODEX_HOME_ROOT" BACKUP_ROOT="$BACKUP_ROOT" \
  PATH="$REUSED_PI_ROOT/npm/node_modules/.bin:$OLD_SEARXNG_BIN:$STUB_BIN:/usr/bin:/bin" \
  PI_CODING_AGENT_DIR="$REUSED_PI_ROOT" DOCKER_STATE="$TEST_ROOT/searxng.state" "$REPO_ROOT/bootstrap_codex.sh" \
  > "$TEST_ROOT/codex.out" 2> "$TEST_ROOT/codex.err"

python3 - "$CODEX_TARGET/config.toml" "$CODEX_TARGET/agents" "$BACKUP_ROOT" "$STUB_BIN" <<'PY'
import pathlib
import sys
import tomllib

config_path, agents, backup, stub_bin = map(pathlib.Path, sys.argv[1:])
config = tomllib.loads(config_path.read_text(encoding="utf-8"))
assert config["model"] == "gpt-6.1-sol"
assert config["model_auto_compact_token_limit"] == 300000
assert config["custom_root_setting"] == "preserve"
assert config["user_paths"] == ["one", "two"]
assert config["plan_mode_reasoning_effort"] == "medium"
assert config["features"]["hooks"] is True
assert config["features"]["local_option"] == "preserve"
assert config["tui"]["theme"] == "dark"
assert config["model_providers"]["custom"]["base_url"] == "https://example.invalid/v1"
assert config["mcp_servers"]["searxng"]["command"] == str((stub_bin / "mcp-searxng").absolute())
assert config["mcp_servers"]["local_test"]["command"] == "local-helper"
assert config["mcp_servers"]["dotted_local"] == {"command": "local-dotted-helper", "args": []}
assert set(config["mcp_servers"]) == {"codegraph", "searxng", "btca", "local_test", "dotted_local"}, config["mcp_servers"].keys()
assert config["plugins"]["example"]["marketplace"] == "user"
assert config["projects"]["/tmp/project"]["trusted"] is True
assert {path.stem for path in agents.glob("*.toml")} >= {"coder", "diagram-worker"}
assert (backup / ".codex/agents/coder.toml").read_text() == "user-owned role\n"
PY
[[ "$(<"$CODEX_TARGET/auth.json")" == '{"auth":"preserve"}' ]]
[[ -L "$CODEX_HOME_ROOT/.agents/skills/writing" ]]
[[ -L "$CODEX_HOME_ROOT/.agents/skills/diagram-design" ]]
[[ -f "$CODEX_HOME_ROOT/.agents/skills/user-skill/SKILL.md" ]]
[[ ! -e "$CODEX_HOME_ROOT/.agents/skills/retired-skill" && ! -L "$CODEX_HOME_ROOT/.agents/skills/retired-skill" ]]
[[ ! -L "$CODEX_HOME_ROOT/.agents/skills/relative-retired-skill" ]]
[[ -L "$CODEX_HOME_ROOT/.agents/skills/foreign-skill" ]]
[[ "$(find "$CODEX_HOME_ROOT/.agents/skills" -maxdepth 1 -type l | wc -l)" -eq 33 ]]
[[ -L "$CODEX_HOME_ROOT/.local/share/my-codex-config/external-skills/diagram-design/skills/diagram-design" ]]
[[ "$(grep -c '^git clone' "$STUB_LOG")" -eq 1 ]]
[[ -L "$CODEX_TARGET/commands" ]]
[[ "$(find -L "$CODEX_TARGET/commands" -maxdepth 1 -type f -name '*.md' | wc -l)" -eq 12 ]]
[[ "$(find "$CODEX_TARGET/agents" -maxdepth 1 -type f -name '*.toml' | wc -l)" -eq 14 ]]
python3 - "$CODEX_TARGET/hooks.json" <<'PY'
import json
import pathlib
import sys

data = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
commands = [hook["command"] for group in data["hooks"]["UserPromptSubmit"] for hook in group["hooks"]]
assert commands[0] == ": orca-agent-hook-form=1; orca", commands
assert sum("codex-command-dispatch.mjs" in command for command in commands) == 1, commands
assert data["hooks"]["Stop"][0]["hooks"][0]["command"] == "user-stop-hook"
assert data["extra"] == "keep"
assert set(data["hooks"]) == {"UserPromptSubmit", "Stop"}
PY
[[ -f "$BACKUP_ROOT/.codex/hooks.json" ]]
[[ -L "$CODEX_HOME_ROOT/.local/bin/ocr-go" ]]
[[ -L "$CODEX_HOME_ROOT/.local/bin/explore" ]]
SEARXNG_SETTINGS="$CODEX_HOME_ROOT/.local/share/my-codex-config/searxng/config/settings.yml"
grep -Eq '^  secret_key: "[0-9a-f]{64}"$' "$SEARXNG_SETTINGS"
grep -q '^use_default_settings: true$' "$SEARXNG_SETTINGS"
[[ "$(stat -c %a "$SEARXNG_SETTINGS")" == 600 ]]
if grep -q secret_key "$REPO_ROOT/config/searxng/settings.yml"; then
  printf 'The tracked SearXNG settings hold a secret key.\n' >&2
  exit 1
fi
[[ -L "$CODEX_TARGET/rules/my-opencode-config.rules" ]]
[[ -e "$CODEX_TARGET/vault-context" ]]
grep -q 'BEGIN my-harness-config policy' "$CODEX_TARGET/AGENTS.md"
grep -q 'User Codex instructions' "$CODEX_TARGET/AGENTS.md"
grep -q 'Security Rules' "$CODEX_TARGET/AGENTS.md"
[[ -f "$TEST_ROOT/searxng.state" ]]
grep -q 'docker run --detach --name my-codex-config-searxng --restart unless-stopped --publish 127.0.0.1:8080:8080' "$STUB_LOG"
grep -q 'bun add -g btca' "$STUB_LOG"
grep -q 'npm install --global lintapple@0.1.20' "$STUB_LOG"
[[ "$(grep -c 'npm install --global mcp-searxng@1.11.1' "$STUB_LOG")" -eq 1 ]]

INCOMPLETE_HOME="$TEST_ROOT/incomplete-home"
INCOMPLETE_SKILL="$INCOMPLETE_HOME/.local/share/my-codex-config/external-skills/diagram-design"
INCOMPLETE_BACKUPS="$TEST_ROOT/incomplete-backups"
mkdir -p "$INCOMPLETE_SKILL"
printf 'stale source\n' > "$INCOMPLETE_SKILL/partial.txt"
env -u CODEX_HOME -u XDG_DATA_HOME -u XDG_STATE_HOME HOME="$INCOMPLETE_HOME" \
  BACKUP_ROOT="$INCOMPLETE_BACKUPS" "$REPO_ROOT/bootstrap_codex.sh" \
  --no-searxng --no-searxng-mcp > "$TEST_ROOT/incomplete.out" 2> "$TEST_ROOT/incomplete.err"
[[ -f "$INCOMPLETE_SKILL/skills/diagram-design/SKILL.md" ]]
[[ "$(<"$INCOMPLETE_BACKUPS/.local/share/my-codex-config/external-skills/diagram-design/partial.txt")" == 'stale source' ]]
[[ "$(grep -c '^git clone' "$STUB_LOG")" -eq 3 ]]

cp "$CODEX_TARGET/config.toml" "$TEST_ROOT/codex-before-rerun.toml"
cp "$CODEX_TARGET/hooks.json" "$TEST_ROOT/codex-hooks-before-rerun.json"
cp "$SEARXNG_SETTINGS" "$TEST_ROOT/searxng-before-rerun.yml"
backups_before_rerun=$(find "$BACKUP_ROOT" -name 'hooks.json*' | wc -l)
CODEX_HOME="$CODEX_HOME" HOME="$CODEX_HOME_ROOT" BACKUP_ROOT="$BACKUP_ROOT" \
  DOCKER_STATE="$TEST_ROOT/searxng.state" "$REPO_ROOT/bootstrap_codex.sh" \
  > "$TEST_ROOT/codex-repeat.out" 2> "$TEST_ROOT/codex-repeat.err"
cmp -s "$TEST_ROOT/codex-before-rerun.toml" "$CODEX_TARGET/config.toml"
cmp -s "$TEST_ROOT/codex-hooks-before-rerun.json" "$CODEX_TARGET/hooks.json"
cmp -s "$TEST_ROOT/searxng-before-rerun.yml" "$SEARXNG_SETTINGS"
[[ "$(find "$BACKUP_ROOT" -name 'hooks.json*' | wc -l)" -eq "$backups_before_rerun" ]]
[[ "$(grep -c '^docker run' "$STUB_LOG")" -eq 1 ]]
[[ "$(grep -c 'npm install --global mcp-searxng@1.11.1' "$STUB_LOG")" -eq 1 ]]

CODEX_NO_MCP_HOME="$TEST_ROOT/codex-no-mcp-home"
mkdir -p "$CODEX_NO_MCP_HOME/.codex"
printf '%s\n' '[mcp_servers.searxng]' 'command = "/usr/bin/mcp-searxng"' 'args = []' 'startup_timeout_sec = 120.0' \
  '[mcp_servers.searxng.env]' 'SEARXNG_URL = "http://localhost:8080"' > "$CODEX_NO_MCP_HOME/.codex/config.toml"
HOME="$CODEX_NO_MCP_HOME" CODEX_HOME="$CODEX_NO_MCP_HOME/.codex" BACKUP_ROOT="$TEST_ROOT/codex-no-mcp-backups" \
  "$REPO_ROOT/bootstrap_codex.sh" --no-searxng --no-searxng-mcp > "$TEST_ROOT/codex-no-mcp.out" 2> "$TEST_ROOT/codex-no-mcp.err"
python3 - "$CODEX_NO_MCP_HOME/.codex/config.toml" <<'PY'
import pathlib
import sys
import tomllib

servers = tomllib.loads(pathlib.Path(sys.argv[1]).read_text())["mcp_servers"]
assert set(servers) == {"codegraph", "btca"}
PY

CODEX_OWN_MCP_HOME="$TEST_ROOT/codex-own-mcp-home"
mkdir -p "$CODEX_OWN_MCP_HOME/.codex"
printf '%s\n' '[mcp_servers.searxng]' 'command = "my-own-search"' 'args = ["--mine"]' > "$CODEX_OWN_MCP_HOME/.codex/config.toml"
HOME="$CODEX_OWN_MCP_HOME" CODEX_HOME="$CODEX_OWN_MCP_HOME/.codex" BACKUP_ROOT="$TEST_ROOT/codex-own-mcp-backups" \
  "$REPO_ROOT/bootstrap_codex.sh" --no-searxng --no-searxng-mcp > "$TEST_ROOT/codex-own-mcp.out" 2> "$TEST_ROOT/codex-own-mcp.err"
python3 - "$CODEX_OWN_MCP_HOME/.codex/config.toml" <<'PY'
import pathlib
import sys
import tomllib

servers = tomllib.loads(pathlib.Path(sys.argv[1]).read_text())["mcp_servers"]
assert set(servers) == {"codegraph", "btca", "searxng"}
assert servers["searxng"] == {"command": "my-own-search", "args": ["--mine"]}
PY

CODEX_INITIAL_HOME="$TEST_ROOT/codex-initial-home"
CODEX_OVERRIDE_HOME="$TEST_ROOT/codex-override-home"
mkdir -p "$CODEX_INITIAL_HOME/.codex/agents" "$CODEX_OVERRIDE_HOME/.codex/agents"
printf 'initial-home role\n' > "$CODEX_INITIAL_HOME/.codex/agents/coder.toml"
printf 'override-home role\n' > "$CODEX_OVERRIDE_HOME/.codex/agents/coder.toml"
env -u CODEX_HOME -u BACKUP_ROOT -u XDG_CONFIG_HOME -u XDG_DATA_HOME -u XDG_STATE_HOME \
  HOME="$CODEX_INITIAL_HOME" "$REPO_ROOT/bootstrap_codex.sh" --home "$CODEX_OVERRIDE_HOME" \
  --no-searxng --no-searxng-mcp > "$TEST_ROOT/codex-home-override.out" 2> "$TEST_ROOT/codex-home-override.err"
[[ -f "$CODEX_OVERRIDE_HOME/.codex/config.toml" ]]
[[ ! -e "$CODEX_INITIAL_HOME/.codex/config.toml" ]]
[[ "$(<"$CODEX_INITIAL_HOME/.codex/agents/coder.toml")" == 'initial-home role' ]]
[[ "$(find "$CODEX_OVERRIDE_HOME/.local/state/my-codex-config/backups" -type f -path '*/.codex/agents/coder.toml' -exec cat {} \;)" == 'override-home role' ]]
[[ -d "$CODEX_OVERRIDE_HOME/.local/share/my-codex-config/external-skills" ]]
[[ ! -e "$CODEX_INITIAL_HOME/.local/share/my-codex-config/external-skills" ]]

PI_HOME="$TEST_ROOT/pi-home"
PI_AGENT_ROOT="$PI_HOME/custom-pi-root"
mkdir -p "$PI_AGENT_ROOT/npm/node_modules/mcp-searxng" "$PI_AGENT_ROOT/npm/node_modules/.bin"
printf '{"name":"mcp-searxng","version":"1.11.1"}\n' > "$PI_AGENT_ROOT/npm/node_modules/mcp-searxng/package.json"
printf '#!/usr/bin/env bash\nexit 0\n' > "$PI_AGENT_ROOT/npm/node_modules/mcp-searxng/cli.js"
chmod +x "$PI_AGENT_ROOT/npm/node_modules/mcp-searxng/cli.js"
ln -s "$PI_AGENT_ROOT/npm/node_modules/mcp-searxng/cli.js" "$PI_AGENT_ROOT/npm/node_modules/.bin/mcp-searxng"
mkdir -p "$PI_AGENT_ROOT"
cat > "$PI_AGENT_ROOT/mcp.json" <<'JSON'
{"settings":{"hostConfigDiscovery":"off"},"mcpServers":{"keep":{"command":"keep"},"braintrust":{"command":"old"},"vidext-operator-my-workspace":{"command":"old"},"headroom":{"command":"old"},"sequential-thinking":{"command":"old"}}}
JSON
printf 'User Pi instructions.\n' > "$PI_AGENT_ROOT/AGENTS.md"
export HOME="$PI_HOME" PI_CODING_AGENT_DIR="$PI_AGENT_ROOT" BACKUP_ROOT="$TEST_ROOT/pi-backups"
docker_calls_before=$(grep -c '^docker ' "$STUB_LOG")
"$REPO_ROOT/bootstrap_pi.sh" --no-searxng > "$TEST_ROOT/pi.out" 2> "$TEST_ROOT/pi.err"
python3 - "$PI_AGENT_ROOT/mcp.json" "$PI_AGENT_ROOT" <<'PY'
import json
import pathlib
import sys

config = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
root = pathlib.Path(sys.argv[2])
assert config["settings"]["hostConfigDiscovery"] == "off"
assert set(config["mcpServers"]) == {"keep", "codegraph", "searxng", "btca"}
assert config["mcpServers"]["searxng"]["command"] == str(root / "npm/node_modules/.bin/mcp-searxng")
assert config["mcpServers"]["searxng"]["env"]["SEARXNG_URL"] == "http://localhost:8080"
assert config["mcpServers"]["searxng"]["exposure"] == "direct"
assert config["mcpServers"]["codegraph"]["exposure"] == "direct"
role = (root / "agents/coder.md").read_text(encoding="utf-8")
assert "systemPromptMode: append" in role
assert "inheritGlobalContext: true" in role and "inheritSkills: true" in role
assert "async: true" in role and "tools:" not in role
assert "thinking:" not in role
assert "thinking:" not in (root / "agents/diagram-worker.md").read_text(encoding="utf-8")
prompt = (root / "prompts/review.md").read_text(encoding="utf-8")
assert "$@" in prompt and "review" in prompt, prompt
assert (root / "skills/writing").is_symlink()
assert (root / "skills/diagram-design").is_symlink()
assert "User Pi instructions" in (root / "AGENTS.md").read_text(encoding="utf-8")
assert len(list((root / "agents").glob("*.md"))) == 14
assert len(list((root / "prompts").glob("*.md"))) == 12
for path in (root / "agents").glob("*.md"):
    assert "\ntools:" not in path.read_text(encoding="utf-8"), path
for path in (root / "prompts").glob("*.md"):
    assert "$@" in path.read_text(encoding="utf-8"), path
PY
[[ "$(grep -c '^docker ' "$STUB_LOG")" -eq "$docker_calls_before" ]]
[[ -L "$PI_HOME/.local/bin/ocr-go" ]]
cp "$PI_AGENT_ROOT/mcp.json" "$TEST_ROOT/pi-before-rerun.json"
"$REPO_ROOT/bootstrap_pi.sh" --no-searxng > "$TEST_ROOT/pi-repeat.out" 2> "$TEST_ROOT/pi-repeat.err"
cmp -s "$TEST_ROOT/pi-before-rerun.json" "$PI_AGENT_ROOT/mcp.json"

NO_MCP_PI="$TEST_ROOT/pi-no-mcp"
mkdir -p "$NO_MCP_PI"
printf '%s\n' '{"mcpServers":{"keep":{"command":"keep"},"searxng":{"command":"mcp-searxng","env":{"SEARXNG_URL":"http://localhost:8080"},"exposure":"direct"}}}' > "$NO_MCP_PI/mcp.json"
HOME="$TEST_ROOT/pi-no-mcp-home" PI_CODING_AGENT_DIR="$NO_MCP_PI" BACKUP_ROOT="$TEST_ROOT/no-mcp-backups" \
  "$REPO_ROOT/bootstrap_pi.sh" --no-searxng --no-searxng-mcp > "$TEST_ROOT/no-mcp.out" 2> "$TEST_ROOT/no-mcp.err"
python3 - "$NO_MCP_PI/mcp.json" <<'PY'
import json
import pathlib
import sys

servers = json.loads(pathlib.Path(sys.argv[1]).read_text())["mcpServers"]
assert set(servers) == {"keep", "codegraph", "btca"}
PY

CUSTOM_SEARXNG="$TEST_ROOT/pi-custom-searxng.json"
CUSTOM_SEARXNG_OUTPUT="$TEST_ROOT/pi-custom-searxng-output.json"
printf '%s\n' '{"mcpServers":{"searxng":{"command":"mcp-searxng","args":["--custom"],"env":{"SEARXNG_URL":"http://localhost:8080"},"exposure":"direct","description":"user server"}}}' > "$CUSTOM_SEARXNG"
python3 "$REPO_ROOT/config/bin/mcp-config.py" merge-json --mode pi \
  --source "$REPO_ROOT/config/mcp.json" --target "$CUSTOM_SEARXNG" \
  --output "$CUSTOM_SEARXNG_OUTPUT" --no-searxng-mcp
python3 - "$CUSTOM_SEARXNG_OUTPUT" <<'PY'
import json
import pathlib
import sys

servers = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))["mcpServers"]
assert servers["searxng"]["args"] == ["--custom"]
assert servers["searxng"]["description"] == "user server"
PY

BROKEN_PI_ROOT="$TEST_ROOT/pi-broken"
mkdir -p "$BROKEN_PI_ROOT"
printf '{"mcpServers": [}\n' > "$BROKEN_PI_ROOT/mcp.json"
cp "$BROKEN_PI_ROOT/mcp.json" "$TEST_ROOT/pi-broken-before.json"
if HOME="$TEST_ROOT/pi-broken-home" PI_CODING_AGENT_DIR="$BROKEN_PI_ROOT" BACKUP_ROOT="$TEST_ROOT/pi-broken-backups" \
  "$REPO_ROOT/bootstrap_pi.sh" --no-searxng > "$TEST_ROOT/pi-broken.out" 2> "$TEST_ROOT/pi-broken.err"; then
  printf 'Malformed Pi MCP config unexpectedly succeeded.\n' >&2
  exit 1
fi
cmp -s "$TEST_ROOT/pi-broken-before.json" "$BROKEN_PI_ROOT/mcp.json"
[[ -z "$(compgen -G "$BROKEN_PI_ROOT/mcp.json.*")" ]]

AGY_HOME="$TEST_ROOT/agy-home"
AGY_ROOT="$AGY_HOME/.gemini/config"
mkdir -p "$AGY_ROOT/skills/user-skill" "$AGY_HOME/.gemini/antigravity-cli"
printf 'user skill\n' > "$AGY_ROOT/skills/user-skill/SKILL.md"
printf 'User AGY instructions.\n' > "$AGY_HOME/.gemini/GEMINI.md"
printf '%s\n' '{"colorScheme":"dark","toolPermission":"request-review"}' > "$AGY_HOME/.gemini/antigravity-cli/settings.json"
printf '%s\n' '{"mcpServers":{"keep":{"command":"keep"},"braintrust":{"command":"old"},"vidext-operator-my-workspace":{"command":"old"},"headroom":{"command":"old"},"sequential-thinking":{"command":"old"}}}' > "$AGY_ROOT/mcp_config.json"
HOME="$AGY_HOME" AGY_CONFIG_ROOT="$AGY_ROOT" BACKUP_ROOT="$TEST_ROOT/agy-backups" \
  "$REPO_ROOT/bootstrap_agy.sh" --no-searxng > "$TEST_ROOT/agy.out" 2> "$TEST_ROOT/agy.err"
python3 - "$AGY_HOME/.gemini/antigravity-cli/settings.json" "$AGY_ROOT/mcp_config.json" "$AGY_HOME" <<'PY'
import json
import pathlib
import sys

settings = json.loads(pathlib.Path(sys.argv[1]).read_text())
servers = json.loads(pathlib.Path(sys.argv[2]).read_text())["mcpServers"]
home = pathlib.Path(sys.argv[3])
assert settings["colorScheme"] == "dark"
assert settings["toolPermission"] == "always-proceed"
assert settings["enableTerminalSandbox"] is False
assert set(servers) == {"keep", "codegraph", "searxng", "btca"}
assert (home / ".gemini/antigravity-cli/agents/coder.md").is_file()
assert (home / ".gemini/antigravity-cli/commands/review.toml").is_file()
assert (home / ".gemini/antigravity-cli/plugins/my-codex-config/skills/init/SKILL.md").is_file()
assert (home / ".gemini/config/plugins/my-codex-config/agents/coder/agent.md").is_file()
assert "tools:" not in (home / ".gemini/config/plugins/my-codex-config/agents/coder/agent.md").read_text()
assert "User AGY instructions" in (home / ".gemini/GEMINI.md").read_text()
agy_skills = home / ".gemini/config/skills"
assert (agy_skills / "writing").is_symlink()
assert (agy_skills / "user-skill/SKILL.md").is_file()
assert len(list(agy_skills.glob("*"))) == 33
cli = home / ".gemini/antigravity-cli"
plugin = cli / "plugins/my-codex-config"
assert len(list((cli / "agents").glob("*.md"))) == 14
assert len(list((cli / "commands").glob("*.toml"))) == 12
assert len(list((home / ".gemini/config/plugins/my-codex-config/agents").glob("*/agent.md"))) == 14
assert len(list((plugin / "skills").glob("*/SKILL.md"))) == 12
for path in (cli / "commands").glob("*.toml"):
    assert "{{args}}" in path.read_text(encoding="utf-8"), path
for path in (plugin / "skills").glob("*/SKILL.md"):
    assert "the full invocation text" in path.read_text(encoding="utf-8"), path
PY
HOME="$AGY_HOME" AGY_CONFIG_ROOT="$AGY_ROOT" BACKUP_ROOT="$TEST_ROOT/agy-backups" \
  "$REPO_ROOT/bootstrap_agy.sh" --no-searxng --no-searxng-mcp > "$TEST_ROOT/agy-no-mcp.out" 2> "$TEST_ROOT/agy-no-mcp.err"
python3 - "$AGY_ROOT/mcp_config.json" <<'PY'
import json
import pathlib
import sys

servers = json.loads(pathlib.Path(sys.argv[1]).read_text())["mcpServers"]
assert set(servers) == {"keep", "codegraph", "btca"}
PY

CUSTOM_AGY_HOME="$TEST_ROOT/agy-custom-home"
HOME="$CUSTOM_AGY_HOME" AGY_CONFIG_ROOT="$CUSTOM_AGY_HOME/agy-config" AGY_CLI_ROOT="$CUSTOM_AGY_HOME/agy-cli" \
  BACKUP_ROOT="$TEST_ROOT/agy-custom-backups" "$REPO_ROOT/bootstrap_agy.sh" --no-searxng \
  > "$TEST_ROOT/agy-custom.out" 2> "$TEST_ROOT/agy-custom.err"
[[ -f "$CUSTOM_AGY_HOME/agy-cli/agents/coder.md" ]]
[[ ! -e "$CUSTOM_AGY_HOME/.gemini/antigravity-cli" ]]

BROKEN_AGY_HOME="$TEST_ROOT/agy-broken-home"
BROKEN_AGY_ROOT="$BROKEN_AGY_HOME/.gemini/config"
mkdir -p "$BROKEN_AGY_HOME/.gemini/antigravity-cli" "$BROKEN_AGY_ROOT"
printf '{"broken":\n' > "$BROKEN_AGY_HOME/.gemini/antigravity-cli/settings.json"
cp "$BROKEN_AGY_HOME/.gemini/antigravity-cli/settings.json" "$TEST_ROOT/agy-broken-before.json"
if HOME="$BROKEN_AGY_HOME" AGY_CONFIG_ROOT="$BROKEN_AGY_ROOT" BACKUP_ROOT="$TEST_ROOT/agy-broken-backups" \
  "$REPO_ROOT/bootstrap_agy.sh" --no-searxng > "$TEST_ROOT/agy-broken.out" 2> "$TEST_ROOT/agy-broken.err"; then
  printf 'Malformed Antigravity settings unexpectedly succeeded.\n' >&2
  exit 1
fi
cmp -s "$TEST_ROOT/agy-broken-before.json" "$BROKEN_AGY_HOME/.gemini/antigravity-cli/settings.json"
[[ -z "$(compgen -G "$BROKEN_AGY_HOME/.gemini/antigravity-cli/settings.json.*")" ]]

CLAUDE_HOME="$TEST_ROOT/claude-home"
mkdir -p "$CLAUDE_HOME/.claude"
printf 'User Claude notes.\n' > "$CLAUDE_HOME/.claude/CLAUDE.md"
printf '%s\n' '{"theme":"dark","env":{"KEEP":"1"},"skillOverrides":{"user-skill":"off","simplify":"on"},"hooks":{"PreToolUse":[{"matcher":"Bash","hooks":[{"type":"command","command":"user-hook"}]}],"PostToolUse":[{"matcher":"Bash","hooks":[{"type":"command","command":"user-post-hook"}]}],"Stop":[{"hooks":[{"type":"command","command":"user-stop-hook"}]}]}}' \
  > "$CLAUDE_HOME/.claude/settings.json"
HOME="$CLAUDE_HOME" CLAUDE_CONFIG_DIR="$CLAUDE_HOME/.claude" BACKUP_ROOT="$TEST_ROOT/claude-backups" \
  "$REPO_ROOT/bootstrap_claude.sh" --no-searxng > "$TEST_ROOT/claude.out" 2> "$TEST_ROOT/claude.err"
[[ -f "$CLAUDE_HOME/.claude/skills/harness-init/SKILL.md" ]]
[[ -f "$CLAUDE_HOME/.claude/skills/harness-review/SKILL.md" ]]
[[ "$(find "$CLAUDE_HOME/.claude/agents" -maxdepth 1 -type f -name '*.md' | wc -l)" -eq 14 ]]
grep -q 'User Claude notes' "$CLAUDE_HOME/.claude/CLAUDE.md"
grep -q 'BEGIN my-harness-config policy' "$CLAUDE_HOME/.claude/CLAUDE.md"
python3 - "$CLAUDE_HOME/.claude/skills" <<'PY'
import pathlib
import re
import sys

skills = pathlib.Path(sys.argv[1])
commands = list(pathlib.Path("config/commands").glob("*.md"))
assert len(commands) == 12
for source in commands:
    text = source.read_text(encoding="utf-8")
    skill = re.search(r"^skill:\s*([a-z0-9-]+)$", text, re.MULTILINE).group(1)
    reserved = source.stem in {"init", "review", "code-review"} or source.stem == skill
    alias = f"harness-{source.stem}" if reserved else source.stem
    body = (skills / alias / "SKILL.md").read_text(encoding="utf-8")
    assert f"Load and follow the `{skill}` skill" in body, source
    assert "$ARGUMENTS" in body, source
PY
for name in braintrust vidext-operator-my-workspace headroom sequential-thinking; do
  grep -q "^claude mcp remove $name" "$CLAUDE_LOG"
done
for name in codegraph searxng btca; do
  grep -q "^claude mcp add-json $name" "$CLAUDE_LOG"
done
grep -q '^claude plugin marketplace add zoharbabin/claude-code-message-timestamps' "$CLAUDE_LOG"
grep -q '^claude plugin install message-timestamps@zoharbabin-claude-tools' "$CLAUDE_LOG"
cp "$CLAUDE_HOME/.claude/settings.json" "$TEST_ROOT/claude-settings-first.json"
HOME="$CLAUDE_HOME" CLAUDE_CONFIG_DIR="$CLAUDE_HOME/.claude" BACKUP_ROOT="$TEST_ROOT/claude-backups" \
  "$REPO_ROOT/bootstrap_claude.sh" --no-searxng --no-searxng-mcp > "$TEST_ROOT/claude-no-mcp.out" 2> "$TEST_ROOT/claude-no-mcp.err"
cmp -s "$TEST_ROOT/claude-settings-first.json" "$CLAUDE_HOME/.claude/settings.json"
grep -q '^claude mcp remove searxng' "$CLAUDE_LOG"
[[ "$(sort "$CLAUDE_MCP_STATE")" == $'btca\ncodegraph\nunrelated' ]]
[[ "$(grep -c '^claude mcp add-json codegraph' "$CLAUDE_LOG")" -eq 2 ]]
[[ "$(grep -c '^claude mcp add-json searxng' "$CLAUDE_LOG")" -eq 1 ]]
[[ "$(grep -c '^claude mcp add-json btca' "$CLAUDE_LOG")" -eq 2 ]]
[[ -L "$CLAUDE_HOME/.local/bin/ocr-go" ]]
! grep -q '^model: inherit' "$CLAUDE_HOME/.claude/agents/coder.md"
python3 - "$CLAUDE_HOME/.claude/settings.json" <<'PY'
import json
import pathlib
import sys

settings = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
assert settings["theme"] == "dark" and settings["env"]["KEEP"] == "1"
assert settings["skillOverrides"]["user-skill"] == "off"
assert settings["skillOverrides"]["simplify"] == "off" and settings["skillOverrides"]["anthropic-skills:skill-creator"] == "off"
assert settings["autoCompactWindow"] == 300000
assert settings["timeZone"] == "Europe/Madrid"
assert settings["timeFormat"] == "24-hour"
assert settings["env"]["CLAUDE_TIMESTAMPS_TZ"] == "Europe/Madrid"
assert settings["env"]["CLAUDE_TIMESTAMPS_INJECT_CONTEXT"] == "false"
assert settings["env"]["CLAUDE_CODE_SUBAGENT_MODEL"]


def commands(event):
    return [hook["command"] for group in settings["hooks"][event] for hook in group["hooks"]]


def ui_groups(event):
    return [group for group in settings["hooks"][event]
            if any("ui-open-reminder.py" in hook["command"] for hook in group["hooks"])]


groups = settings["hooks"]["PreToolUse"]
assert "user-hook" in commands("PreToolUse")
guards = [group for group in groups if "agent-model-guard.py" in group["hooks"][0]["command"]]
assert len(guards) == 1 and len(groups) == 3 and guards[0]["matcher"] == "Agent|Task", groups
assert "user-post-hook" in commands("PostToolUse") and "user-stop-hook" in commands("Stop")
[post] = ui_groups("PostToolUse")
assert post["matcher"] == "Edit|Write|MultiEdit|Bash|Agent|mcp__.*", post
for event in ("Stop", "SubagentStop"):
    [group] = ui_groups(event)
    assert list(group) == ["hooks"], (event, group)
PY
GUARD_HOME="$TEST_ROOT/agent-model-guard-home"
GUARD_CWD="$TEST_ROOT/agent-model-guard-cwd"
mkdir -p "$GUARD_HOME/.claude/agents" "$GUARD_CWD"
: > "$GUARD_HOME/.claude/agents/coder.md"
python3 - "$REPO_ROOT/config/bin/agent-model-guard.py" "$GUARD_HOME" "$GUARD_CWD" <<'PY'
import json
import os
import subprocess
import sys

script, home, cwd = sys.argv[1:4]
# (model, prompt, subagent_type, env override, denied)
cases = [
    ("opus", "Catalog role: coder", "", {}, True),
    ("opus", "x\n  catalog role: sub_orchestrator\ny", "", {}, False),
    ("fable", "Catalog role: adversarial", "", {}, False),
    ("fable", "Catalog role: coder", "", {}, True),
    ("opus", "no role line", "", {}, True),
    ("opus", "Catalog role: coder", "", {"AGENT_MODEL_GUARD": "off"}, False),
    ("", "", "", {"HOME": home}, True),
    ("", "", "Plan", {"HOME": home}, True),
    ("", "", "coder", {"HOME": home}, False),
    ("", "", "fork", {"HOME": home}, False),
    ("", "", "Plan", {"HOME": home, "AGENT_MODEL_GUARD": "off"}, False),
]
for model, prompt, subagent_type, env, denied in cases:
    payload = json.dumps({"cwd": cwd, "tool_input": {
        "model": model, "prompt": prompt, "subagent_type": subagent_type}})
    out = subprocess.run([sys.executable, script], input=payload, text=True, check=True,
                         capture_output=True, env={**os.environ, **env}).stdout
    assert ("deny" in out) == denied, (model, prompt, subagent_type, env, out)
PY

# A user's own searxng server survives --no-searxng-mcp.
printf 'searxng\n' >> "$CLAUDE_MCP_STATE"
CLAUDE_SEARXNG_CUSTOM=1 HOME="$CLAUDE_HOME" CLAUDE_CONFIG_DIR="$CLAUDE_HOME/.claude" BACKUP_ROOT="$TEST_ROOT/claude-backups" \
  "$REPO_ROOT/bootstrap_claude.sh" --no-searxng --no-searxng-mcp > "$TEST_ROOT/claude-own.out" 2> "$TEST_ROOT/claude-own.err"
grep -Fxq searxng "$CLAUDE_MCP_STATE"

run_searxng_case() {
  local name=$1
  local home="$TEST_ROOT/$1-home"
  mkdir -p "$home"
  HOME="$home" BACKUP_ROOT="$TEST_ROOT/$name-backups" DOCKER_STATE="$TEST_ROOT/$name.state" \
    DOCKER_MODE="${DOCKER_MODE:-}" DOCKER_IMAGE="${DOCKER_IMAGE:-}" DOCKER_PS_OUTPUT="${DOCKER_PS_OUTPUT:-}" \
    bash -c 'source "$1/bootstrap_common.sh"; common_install_searxng' _ "$REPO_ROOT" \
    > "$TEST_ROOT/$name.out" 2> "$TEST_ROOT/$name.err"
}

docker_runs_before=$(grep -c '^docker run' "$STUB_LOG")
DOCKER_PS_OUTPUT='unrelated 127.0.0.1:8080->8080/tcp' DOCKER_IMAGE='docker.io/library/redis:latest' \
  run_searxng_case unrelated-port
grep -q 'not SearXNG; skipping deployment' "$TEST_ROOT/unrelated-port.err"
[[ "$(grep -c '^docker run' "$STUB_LOG")" -eq "$docker_runs_before" ]]
DOCKER_MODE=unavailable run_searxng_case unavailable-docker
grep -q 'Docker is unavailable; skipping SearXNG deployment' "$TEST_ROOT/unavailable-docker.err"
DOCKER_MODE=run-fail run_searxng_case failed-service
grep -q 'Unable to start SearXNG' "$TEST_ROOT/failed-service.err"

# Malformed managed TOML remains byte-for-byte unchanged on failure.
BROKEN_HOME="$TEST_ROOT/broken-home"
mkdir -p "$BROKEN_HOME/.codex"
printf 'invalid = [\n' > "$BROKEN_HOME/.codex/config.toml"
cp "$BROKEN_HOME/.codex/config.toml" "$TEST_ROOT/broken-before.toml"
if HOME="$BROKEN_HOME" CODEX_HOME="$BROKEN_HOME/.codex" BACKUP_ROOT="$TEST_ROOT/broken-backups" \
  "$REPO_ROOT/bootstrap_codex.sh" --no-searxng > "$TEST_ROOT/broken.out" 2> "$TEST_ROOT/broken.err"; then
  printf 'Malformed Codex config unexpectedly succeeded.\n' >&2
  exit 1
fi
cmp -s "$TEST_ROOT/broken-before.toml" "$BROKEN_HOME/.codex/config.toml"
[[ -z "$(compgen -G "$BROKEN_HOME/.codex/config.toml.tmp.*")" ]]

UNSAFE_HOME="$TEST_ROOT/unsafe-home"
mkdir -p "$UNSAFE_HOME/.codex"
cat > "$UNSAFE_HOME/.codex/config.toml" <<'TOML'
custom_paths = [
  "one",
  "two",
]
TOML
cp "$UNSAFE_HOME/.codex/config.toml" "$TEST_ROOT/unsafe-before.toml"
if HOME="$UNSAFE_HOME" CODEX_HOME="$UNSAFE_HOME/.codex" BACKUP_ROOT="$TEST_ROOT/unsafe-backups" \
  "$REPO_ROOT/bootstrap_codex.sh" --no-searxng --no-searxng-mcp \
  > "$TEST_ROOT/unsafe.out" 2> "$TEST_ROOT/unsafe.err"; then
  printf 'Unsafe multiline Codex root setting unexpectedly succeeded.\n' >&2
  exit 1
fi
grep -Fxq 'Could not safely merge multiline Codex root settings' "$TEST_ROOT/unsafe.err"
cmp -s "$TEST_ROOT/unsafe-before.toml" "$UNSAFE_HOME/.codex/config.toml"
[[ -z "$(compgen -G "$UNSAFE_HOME/.codex/config.toml.tmp.*")" ]]

HOME="$CODEX_HOME_ROOT" CODEX_HOME="$CODEX_HOME" "$REPO_ROOT/bootstrap_codex.sh" --check \
  > "$TEST_ROOT/check.out" 2> "$TEST_ROOT/check.err"
grep -q 'Codex configuration source and dependencies are valid' "$TEST_ROOT/check.out"
printf 'Isolated multi-harness bootstrap checks passed.\n'
