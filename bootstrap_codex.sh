#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
CONFIG_SOURCE="$ROOT/config"
CODEX_SOURCE="$CONFIG_SOURCE"
COMMANDS_SOURCE="$CONFIG_SOURCE/commands"
SKILLS_SOURCE="$CONFIG_SOURCE/skills"
HARNESS_ROOT_PATTERN='(~|\$\{?[A-Z_]*HOME\}?"?)/\.(agents|claude|codex)/skills|\$\{?(CLAUDE_CONFIG_DIR|PI_CODING_AGENT_DIR|CODEX_HOME)(:-[^}]*)?\}?/skills|\.pi/agent/skills|\.gemini/[A-Za-z0-9_./-]*skills|(^|[^A-Za-z0-9_/.-])/(home|Users)/[A-Za-z0-9_]'
CHECK_ONLY=false
CHECK_DEPS=false
SEARXNG_ENABLED=true
SEARXNG_MCP_ENABLED=true
TEMP_DIR=""

usage() {
  printf 'Usage: %s [--check] [--check-deps] [--no-searxng] [--no-searxng-mcp] [--home PATH]\n' "$0"
}

while (($#)); do
  case "$1" in
    --check) CHECK_ONLY=true ;;
    --check-deps) CHECK_DEPS=true ;;
    --no-searxng) SEARXNG_ENABLED=false ;;
    --no-searxng-mcp) SEARXNG_MCP_ENABLED=false ;;
    --home)
      [[ $# -ge 2 ]] || { usage; exit 2; }
      HOME=$2
      export HOME
      XDG_CONFIG_HOME="$HOME/.config"
      XDG_DATA_HOME="$HOME/.local/share"
      XDG_STATE_HOME="$HOME/.local/state"
      CODEX_HOME="$HOME/.codex"
      export XDG_CONFIG_HOME XDG_DATA_HOME XDG_STATE_HOME CODEX_HOME
      shift
      ;;
    -h|--help) usage; exit 0 ;;
    *) usage >&2; exit 2 ;;
  esac
  shift
done

CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
CODEX_TARGET="$CODEX_HOME"
BACKUP_ROOT="${BACKUP_ROOT:-${XDG_STATE_HOME:-$HOME/.local/state}/my-codex-config/backups/$(date +%Y%m%d-%H%M%S)}"
source "$ROOT/bootstrap_common.sh"

die() {
  printf '%s\n' "$1" >&2
  exit 1
}

check_inventory() {
  python3 - "$CONFIG_SOURCE" <<'PY'
import json
import pathlib
import re
import sys
import tomllib

root = pathlib.Path(sys.argv[1])
skills = root / "skills"
agents = root / "agents"
commands = root / "commands"
skill_paths = sorted(path for path in skills.iterdir() if (path / "SKILL.md").is_file())
agent_paths = sorted(agents.glob("*.toml"))
command_paths = sorted(commands.glob("*.md"))
if len(skill_paths) != 30 or len(agent_paths) != 14 or len(command_paths) != 12:
    raise SystemExit("Expected 30 skills, 14 roles, and 12 command intents")

for path in skill_paths:
    text = (path / "SKILL.md").read_text(encoding="utf-8")
    name = re.search(r"^name:\s*([^\n]+)$", text, re.MULTILINE)
    if not name or name.group(1).strip() != path.name:
        raise SystemExit(f"Invalid skill name: {path}")
for path in agent_paths:
    data = tomllib.loads(path.read_text(encoding="utf-8"))
    if data.get("name") != path.stem:
        raise SystemExit(f"Agent name does not match filename: {path}")
for path in command_paths:
    text = path.read_text(encoding="utf-8")
    frontmatter = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
    if not frontmatter or "$ARGUMENTS" not in text:
        raise SystemExit(f"Invalid command or missing argument forwarding: {path}")
    skill = re.search(r"^skill:\s*([a-z0-9-]+)$", frontmatter.group(1), re.MULTILINE)
    if not skill or not (skills / skill.group(1) / "SKILL.md").is_file():
        raise SystemExit(f"Command references a missing skill: {path}")

inventory = json.loads((root / "mcp.json").read_text(encoding="utf-8"))
if set(inventory.get("mcpServers", {})) != {"codegraph", "searxng", "btca"}:
    raise SystemExit("MCP inventory must contain CodeGraph, SearXNG, and BTCA only")
for path in (root / "codex.toml", root / "codex-hooks.json"):
    if path.suffix == ".toml":
        tomllib.loads(path.read_text(encoding="utf-8"))
    else:
        json.loads(path.read_text(encoding="utf-8"))
PY
}

check_source() {
  local path
  local required=(
    config/AGENTS.md config/skills config/agents config/commands config/codex.toml
    config/codex-hooks.json config/rules/my-opencode-config.rules config/mcp.json
    config/bin/codegraph-dependency.sh config/bin/codex-command-dispatch.mjs
    config/bin/harness-assets.py config/bin/mcp-config.py
    config/plugins/vault-context/bin/search.mjs
    config/plugins/vault-context/vault-context.js
    config/plugins/vault-context/vault-context.config.json
    config/plugins/vault-context/vault-context.schema.json
    config/plugins/vault-context/stopwords/en.json
    config/plugins/vault-context/stopwords/es.json
    config/bin/update-codex config/skills/review/scripts/ocr-opencode-go config/bin/explore.py
    config/skills/super-agent/references/model-catalog.yaml
    config/plugins/vault-context config/searxng/settings.yml
    bootstrap_pi.sh bootstrap_agy.sh
  )
  for path in "${required[@]}"; do
    [[ -e "$ROOT/$path" ]] || die "Missing $path"
  done
  [[ ! -e "$ROOT/config/security-rules.md" ]] || die 'config/security-rules.md must be merged into config/AGENTS.md'
  check_inventory

  if find "$ROOT" -type d \( -name .git -o -name node_modules -o -name .codegraph \) -prune -o -type f \
    \( -name .env -o \( -name '.env.*' ! -name .env.example \) -o -name auth.json \
    -o -name mcp-auth.json -o -name '*.db*' -o -name '*.sqlite*' -o -name '*.log' \
    -o -name history.jsonl -o -name installation_id \) -print -quit | grep -q .; then
    die 'Forbidden runtime file found in repository'
  fi
  if grep -R -I -n -E '/Users/|/Applications/|/home/[^/]+/|BRAINTRUST_API_KEY|-----BEGIN [A-Z ]*PRIVATE KEY-----' \
    --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.codegraph \
    --exclude='*.md' --exclude='*.bak' "$CONFIG_SOURCE"; then
    die 'Machine-specific path or credential-shaped value found in managed configuration'
  fi
  # Harnesses install skills in different roots, so skills and roles must not name one.
  if grep -R -I -n -E "$HARNESS_ROOT_PATTERN" --exclude-dir=node_modules --exclude-dir=__pycache__ \
    "$CONFIG_SOURCE/skills" "$CONFIG_SOURCE/agents"; then
    die 'Hard-coded harness skill root found; use a path relative to the loaded skill instead'
  fi
  if grep -R -I -q -E '(sk-[A-Za-z0-9]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|Fe26\.2\*\*)' \
    --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.codegraph "$ROOT"; then
    die 'Credential-shaped value found in repository'
  fi
}

check_dependencies() {
  local missing=() tool
  local tools=(codex python3 node npm npx codegraph btca lintapple)
  if $SEARXNG_MCP_ENABLED; then
    tools+=(mcp-searxng)
  fi
  for tool in "${tools[@]}"; do
    command -v "$tool" >/dev/null 2>&1 || missing+=("$tool")
  done
  if $SEARXNG_MCP_ENABLED && ! common_has_pinned_searxng_connector; then
    missing+=(mcp-searxng@1.11.1)
  fi
  ((${#missing[@]} == 0)) || die "Missing required commands: ${missing[*]}"
}

if $CHECK_ONLY || $CHECK_DEPS; then
  check_source
  check_dependencies
  if $CHECK_ONLY; then
    printf 'Codex configuration source and dependencies are valid.\n'
  else
    printf 'Codex dependencies are available.\n'
  fi
  exit 0
fi

backup_existing() {
  common_backup_existing "$1"
}

install_codex_config() {
  local source=$1 target=$2 runtime_line temporary

  if [[ -f "$target" && ! -L "$target" ]]; then
    temporary=$(mktemp "$target.tmp.XXXXXX")
    runtime_line=$(grep -n -m 1 -E '^\[(marketplaces|plugins|hooks\.state|projects)(\.|\])' "$target" | cut -d: -f1 || true)
    if python3 - "$source" "$target" "$runtime_line" "$temporary" "$($SEARXNG_MCP_ENABLED && echo 0 || echo 1)" <<'PY'
import pathlib
import re
import sys
import tomllib

source_path, target_path, output_path = map(pathlib.Path, (sys.argv[1], sys.argv[2], sys.argv[4]))
source_text = source_path.read_text(encoding="utf-8")
target_text = target_path.read_text(encoding="utf-8")
try:
    source_data = tomllib.loads(source_text)
    target_data = tomllib.loads(target_text)
except Exception as error:
    raise SystemExit(f"Could not parse Codex config: {error}")

target_lines = target_text.splitlines(keepends=True)
runtime_line = int(sys.argv[3]) if sys.argv[3] else 0
prefix_lines = target_lines[:runtime_line - 1] if runtime_line else target_lines
runtime_text = "".join(target_lines[runtime_line - 1:]) if runtime_line else ""
prefix_text = "".join(prefix_lines)
first_table = re.search(r"(?m)^[ \t]*\[", prefix_text)
root_text = prefix_text[:first_table.start()] if first_table else prefix_text
local_root = []
local_root_keys = []
root_assignment = re.compile(r"^[ \t]*(?:\"((?:\\.|[^\"\\])*)\"|'([^']*)'|([A-Za-z0-9_-]+))[ \t]*=")
for line in root_text.splitlines():
    stripped = line.strip()
    if not stripped or stripped.startswith("#"):
        continue
    if re.match(r"^[ \t]*mcp_servers[ \t]*\.", line):
        continue
    if re.match(r"^[ \t]*mcp_servers[ \t]*(?:=|$)", line):
        raise SystemExit("Could not safely merge a root-level mcp_servers table")
    if not root_assignment.match(line):
        raise SystemExit("Could not safely merge Codex root settings")
    try:
        parsed_line = tomllib.loads(line)
    except Exception as error:
        raise SystemExit("Could not safely merge multiline Codex root settings") from error
    if len(parsed_line) != 1:
        raise SystemExit("Could not safely merge Codex root settings")
    key = next(iter(parsed_line))
    if key not in source_data:
        local_root.append(line.rstrip("\r\n"))
        local_root_keys.append(key)

retired = {"braintrust", "vidext-operator-my-workspace", "headroom", "sequential-thinking"}
managed = {"codegraph", "searxng", "btca"}

def managed_searxng(entry):
    return (
        isinstance(entry, dict)
        and set(entry) == {"command", "args", "startup_timeout_sec", "env"}
        and pathlib.PurePath(str(entry["command"])).name == "mcp-searxng"
        and entry["args"] == []
        and entry["env"] == {"SEARXNG_URL": "http://localhost:8080"}
    )

if sys.argv[5] == "1" and not managed_searxng(target_data.get("mcp_servers", {}).get("searxng")):
    managed = managed - {"searxng"}
local_servers = set(target_data.get("mcp_servers", {})) - managed - retired
local_tables = []
local_table_paths = []
local_table_values = []
managed_table_entries = {}
local_dotted = []
table_header = re.compile(r"(?m)^[ \t]*\[(?!\[)(.*?)\][ \t]*(?:#.*)?$")
table_key = re.compile(r'"((?:\\.|[^"\\])*)"|\'([^\']*)\'|([A-Za-z0-9_-]+)')

def table_keys(match):
    return [quoted or literal or bare for quoted, literal, bare in table_key.findall(match.group(1))]

def table_value(data, keys):
    for key in keys:
        if not isinstance(data, dict) or key not in data:
            return None
        data = data[key]
    return data

def mcp_server_table(match):
    keys = table_keys(match)
    return keys[1] if len(keys) > 1 and keys[0] == "mcp_servers" else None

if re.search(r"(?m)^[ \t]*\[\[", target_text):
    raise SystemExit("Could not safely merge Codex array tables")
source_table_paths = {tuple(table_keys(match)) for match in table_header.finditer(source_text)}
headers = list(table_header.finditer(target_text))
for index, match in enumerate(headers):
    keys = table_keys(match)
    server = mcp_server_table(match)
    end = headers[index + 1].start() if index + 1 < len(headers) else len(target_text)
    if keys == ["mcp_servers"]:
        raise SystemExit("Could not safely merge a parent mcp_servers table")
    if server is not None:
        if server in local_servers:
            local_tables.append(target_text[match.start():end].rstrip())
            local_table_paths.append(tuple(keys))
        continue
    table_path = tuple(keys)
    if match.start() < len(prefix_text) and table_path in source_table_paths:
        source_values = table_value(source_data, keys)
        target_values = table_value(target_data, keys)
        if not isinstance(source_values, dict) or not isinstance(target_values, dict):
            raise SystemExit(f"Could not safely merge Codex table {'.'.join(keys)}")
        additions = []
        for line in target_text[match.end():end].splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue
            if not root_assignment.match(line):
                raise SystemExit(f"Could not safely merge Codex table {'.'.join(keys)}")
            try:
                parsed_line = tomllib.loads(line)
            except Exception as error:
                raise SystemExit(f"Could not safely merge Codex table {'.'.join(keys)}") from error
            if len(parsed_line) != 1:
                raise SystemExit(f"Could not safely merge Codex table {'.'.join(keys)}")
            key = next(iter(parsed_line))
            if key not in source_values:
                additions.append(line)
                local_table_values.append((table_path, key))
        if additions:
            managed_table_entries[table_path] = additions
    elif match.start() < len(prefix_text):
        local_tables.append(target_text[match.start():end].rstrip())
        local_table_paths.append(tuple(keys))

def without_mcp_tables(text):
    headers = list(table_header.finditer(text))
    pieces = []
    cursor = 0
    for index, match in enumerate(headers):
        if mcp_server_table(match) is None:
            continue
        end = headers[index + 1].start() if index + 1 < len(headers) else len(text)
        pieces.append(text[cursor:match.start()])
        cursor = end
    pieces.append(text[cursor:])
    return "".join(pieces)

if local_servers:
    dotted_server = re.compile(r'''^[ \t]*mcp_servers[ \t]*\.[ \t]*(?:"((?:\\.|[^"\\])*)"|'([^']*)'|([A-Za-z0-9_-]+))[ \t]*\.''')
    for line in root_text.splitlines():
        match = dotted_server.match(line)
        if match and next((key for key in match.groups() if key is not None), None) in local_servers:
            local_dotted.append(line.rstrip("\r\n"))

root_additions = [*local_root, *local_dotted]
first_table = re.search(r"(?m)^[ \t]*\[", source_text)
if root_additions:
    additions = "\n".join(root_additions)
    if first_table:
        source_text = source_text[:first_table.start()].rstrip() + "\n\n" + additions + "\n\n" + source_text[first_table.start():]
    else:
        source_text = source_text.rstrip() + "\n\n" + additions + "\n"

if managed_table_entries:
    pieces = []
    cursor = 0
    found = set()
    source_headers = list(table_header.finditer(source_text))
    for index, match in enumerate(source_headers):
        keys = tuple(table_keys(match))
        end = source_headers[index + 1].start() if index + 1 < len(source_headers) else len(source_text)
        block = source_text[match.start():end]
        additions = managed_table_entries.get(keys)
        if additions:
            block = block.rstrip("\r\n") + "\n" + "\n".join(additions) + "\n"
            found.add(keys)
        pieces.append(source_text[cursor:match.start()])
        pieces.append(block)
        cursor = end
    pieces.append(source_text[cursor:])
    if found != set(managed_table_entries):
        raise SystemExit("Could not safely preserve entries in a Codex table")
    source_text = "".join(pieces)

if local_tables:
    source_text = source_text.rstrip() + "\n\n" + "\n\n".join(local_tables) + "\n"
runtime_text = without_mcp_tables(runtime_text)
if runtime_text:
    source_text = source_text.rstrip() + "\n\n" + runtime_text.lstrip()
try:
    merged = tomllib.loads(source_text)
except Exception as error:
    raise SystemExit(f"Could not merge Codex config: {error}")
for key in local_root_keys:
    if merged.get(key) != target_data.get(key):
        raise SystemExit(f"Could not preserve Codex root setting {key}")
for server in local_servers:
    if merged.get("mcp_servers", {}).get(server) != target_data["mcp_servers"][server]:
        raise SystemExit(f"Could not preserve local MCP server {server}")
for keys in local_table_paths:
    if table_value(merged, keys) != table_value(target_data, keys):
        raise SystemExit(f"Could not preserve Codex table {'.'.join(keys)}")
for keys, key in local_table_values:
    merged_table = table_value(merged, keys)
    target_table = table_value(target_data, keys)
    if not isinstance(merged_table, dict) or merged_table.get(key) != target_table.get(key):
        raise SystemExit(f"Could not preserve Codex table key {'.'.join((*keys, key))}")
pathlib.Path(sys.argv[4]).write_text(source_text, encoding="utf-8")
PY
    then
      chmod 600 "$temporary"
      if cmp -s "$temporary" "$target"; then
        rm "$temporary"
        chmod 600 "$target"
        return
      fi
      backup_existing "$target"
      mv "$temporary" "$target"
      return
    fi
    rm -f "$temporary"
    die "Could not safely merge Codex config at $target; existing config left unchanged"
  fi

  common_install_generated_file "$source" "$target"
}

install_config() {
  local name source destination portable
  mkdir -p "$CODEX_TARGET/rules" "$CODEX_TARGET/agents" "$CODEX_TARGET/bin" "$HOME/.local/bin"
  TEMP_DIR=$(mktemp -d "${TMPDIR:-/tmp}/my-harness-codex.XXXXXX")
  local mcp_args=()
  $SEARXNG_MCP_ENABLED || mcp_args+=(--no-searxng-mcp)
  python3 "$ROOT/config/bin/mcp-config.py" render-codex \
    --source "$ROOT/config/mcp.json" --codex "$ROOT/config/codex.toml" \
    --output "$TEMP_DIR/config.toml" "${mcp_args[@]}"
  install_codex_config "$TEMP_DIR/config.toml" "$CODEX_TARGET/config.toml"
  python3 "$ROOT/config/bin/harness-assets.py" merge-hooks \
    --source "$ROOT/config/codex-hooks.json" --target "$CODEX_TARGET/hooks.json" --backup "$BACKUP_ROOT"
  common_link_managed "$COMMANDS_SOURCE" "$CODEX_TARGET/commands"
  common_link_managed "$ROOT/config/rules/my-opencode-config.rules" "$CODEX_TARGET/rules/my-opencode-config.rules"
  for name in automation-runner commit-worker live-validator; do
    [[ ! -e "$CODEX_TARGET/agents/$name.toml" && ! -L "$CODEX_TARGET/agents/$name.toml" ]] || backup_existing "$CODEX_TARGET/agents/$name.toml"
  done
  for source in "$ROOT"/config/agents/*.toml; do
    common_install_generated_file "$source" "$CODEX_TARGET/agents/$(basename "$source")"
  done
  python3 "$ROOT/config/bin/harness-assets.py" install-skills \
    --source "$SKILLS_SOURCE" --target "$HOME/.agents/skills" --backup "$BACKUP_ROOT" \
    --portable "$COMMON_PORTABLE_ROOT/diagram-design/skills" \
    --portable "$COMMON_PORTABLE_ROOT/excalidraw/skill"
  python3 "$ROOT/config/bin/harness-assets.py" install-policy \
    --source "$ROOT/config/AGENTS.md" --target "$CODEX_TARGET/AGENTS.md" --backup "$BACKUP_ROOT"
  common_link_managed "$ROOT/config/bin/codex-command-dispatch.mjs" "$CODEX_TARGET/bin/codex-command-dispatch.mjs"
  common_link_managed "$ROOT/config/bin/update-codex" "$HOME/.local/bin/update-codex"
  common_link_managed "$ROOT/config/plugins/vault-context" "$CODEX_TARGET/vault-context"
}

report_hook_review() {
  # Codex owns hook trust: ask it which user and plugin hooks wait for review (a repo's own hooks are not checked).
  python3 - "$HOME" 2>/dev/null <<'PY' || printf 'Could not ask Codex which hooks need review.\n' >&2
import json
import signal
import subprocess
import sys

signal.signal(signal.SIGALRM, lambda *_: sys.exit(1))
signal.alarm(30)
server = subprocess.Popen(["codex", "app-server"], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                          stderr=subprocess.DEVNULL, text=True)
try:
    for message in (
        {"id": 1, "method": "initialize", "params": {"clientInfo": {"name": "my-codex-config", "version": "1"}}},
        {"method": "initialized"},
        {"id": 2, "method": "hooks/list", "params": {"cwds": [sys.argv[1]]}},
    ):
        server.stdin.write(json.dumps({"jsonrpc": "2.0", **message}) + "\n")
    server.stdin.flush()
    reply = next(reply for reply in map(json.loads, server.stdout) if reply.get("id") == 2)
finally:
    server.kill()
    server.wait()
pending = [
    f'  {hook.get("pluginId") or hook["sourcePath"]} {hook["eventName"]} ({hook["trustStatus"]})'
    for entry in reply["result"]["data"]
    for hook in entry["hooks"]
    if hook["enabled"] and hook["trustStatus"] in ("untrusted", "modified")
]
if pending:
    print("\nCodex hooks need review:", *pending,
          "Open Codex and trust them; until then every new Codex session stops on that prompt.", sep="\n")
PY
}

cleanup() {
  [[ -z "$TEMP_DIR" ]] || rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

main() {
  local common_args=()
  command -v codex >/dev/null 2>&1 || die 'Codex CLI is not installed.'
  check_source
  COMMON_CURRENT_SKILL_ROOTS=("$HOME/.agents/skills")
  $SEARXNG_ENABLED || common_args+=(--no-searxng)
  $SEARXNG_MCP_ENABLED || common_args+=(--no-searxng-mcp)
  common_install_shared "${common_args[@]}"
  install_config
  printf '\nInstalled Codex configuration. Restart Codex after reviewing generated assets.\n'
  report_hook_review
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main
fi
