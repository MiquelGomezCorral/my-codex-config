#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
CHECK_ONLY=false
CHECK_DEPS=false
HOME_OVERRIDE=false
PI_ENABLED=false
AGY_ENABLED=false
SEARXNG_ENABLED=true
SEARXNG_MCP_ENABLED=true

usage() {
  printf 'Usage: %s [--check] [--check-deps] [--pi] [--agy] [--no-searxng] [--no-searxng-mcp] [--home PATH]\n' "$0"
}

while (($#)); do
  case "$1" in
    --check) CHECK_ONLY=true ;;
    --check-deps) CHECK_DEPS=true ;;
    --pi) PI_ENABLED=true ;;
    --agy) AGY_ENABLED=true ;;
    --no-searxng) SEARXNG_ENABLED=false ;;
    --no-searxng-mcp) SEARXNG_MCP_ENABLED=false ;;
    --home)
      [[ $# -ge 2 ]] || { usage; exit 2; }
      HOME=$2
      export HOME
      HOME_OVERRIDE=true
      XDG_CONFIG_HOME="$HOME/.config"
      XDG_DATA_HOME="$HOME/.local/share"
      XDG_STATE_HOME="$HOME/.local/state"
      export XDG_CONFIG_HOME XDG_DATA_HOME XDG_STATE_HOME
      shift
      ;;
    -h|--help) usage; exit 0 ;;
    *) usage; exit 2 ;;
  esac
  shift
done

if $HOME_OVERRIDE; then
  CODEX_HOME="$HOME/.codex"
else
  CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
fi
export CODEX_HOME

CONFIG_SOURCE="$ROOT/config"
SKILLS_SOURCE="$ROOT/agent-home/skills"
CODEX_SOURCE="$ROOT/codex"
COMMANDS_SOURCE="$CODEX_SOURCE/commands"
CODEX_TARGET="$CODEX_HOME"
BACKUP_ROOT="${XDG_STATE_HOME:-$HOME/.local/state}/my-codex-config/backups/$(date +%Y%m%d-%H%M%S)"
SEARXNG_DATA_ROOT="${XDG_DATA_HOME:-$HOME/.local/share}/my-codex-config/searxng"
SEARXNG_CONFIG_ROOT="$SEARXNG_DATA_ROOT/config"
SEARXNG_CACHE_ROOT="$SEARXNG_DATA_ROOT/cache"
SEARXNG_CONTAINER="${SEARXNG_CONTAINER:-my-codex-config-searxng}"
SEARXNG_IMAGE="${SEARXNG_IMAGE:-docker.io/searxng/searxng:latest}"
PONYTAIL_MARKETPLACE="DietrichGebert/ponytail"
PONYTAIL_PLUGIN="ponytail@ponytail"
DIAGRAM_MARKETPLACE="cathrynlavery/diagram-design"
DIAGRAM_PLUGIN="diagram-design@diagram-design"
EXCALIDRAW_REPO="https://github.com/fabricioartur/codex-excalidraw-skill.git"
EXCALIDRAW_SOURCE_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/my-codex-config/excalidraw-skill"

source "$ROOT/config/bin/codegraph-dependency.sh"

CODEX_AGENT_NAMES=(
  coder cleanup-worker git-worker review-worker
  reviewer-quick reviewer-reasoning reviewer-arch reviewer-e2e
  coding-supervisor live-validator critic diagram-worker
)

die() {
  printf '%s\n' "$1" >&2
  exit 1
}

check_skill_inventory() {
  python3 - "$SKILLS_SOURCE" <<'PY'
import pathlib
import re
import sys

root = pathlib.Path(sys.argv[1])
names = []
for skill_dir in sorted(path for path in root.iterdir() if path.is_dir()):
    path = skill_dir / "SKILL.md"
    if not path.is_file():
        continue
    text = path.read_text(encoding="utf-8")
    name = re.search(r"^name:\s*([^\n]+)$", text, re.MULTILINE)
    description = re.search(r"^description:\s*(.+)$", text, re.MULTILINE)
    if not name or name.group(1).strip() != skill_dir.name:
        raise SystemExit(f"Invalid skill name: {path}")
    if not description or not description.group(1).strip() or len(description.group(1).strip()) > 1024:
        raise SystemExit(f"Invalid skill description: {path}")
    names.append(name.group(1).strip())
if len(names) != len(set(names)):
    raise SystemExit("Duplicate skill name found")
for required in ("writing", "super-agent", "orca-cli", "orchestration", "computer-use", "decision-records", "git", "review-findings", "codegraph-setup", "agents-memory", "refine-plan", "workflow", "test-audit", "code-quality", "skill-scout", "btca"):
    if required not in names:
        raise SystemExit(f"Missing shared skill: {required}")
PY
}

check_command_inventory() {
  python3 - "$COMMANDS_SOURCE" "$SKILLS_SOURCE" <<'PY'
import pathlib
import re
import sys

commands = pathlib.Path(sys.argv[1])
skills = pathlib.Path(sys.argv[2])
expected = {
    "bro", "cleanup", "code", "commit", "index", "init", "merge",
    "workflow", "refine-plan", "review-findings", "review-plan",
    "review-pr-comments", "review",
}
found = set()
for path in commands.glob("*.md"):
    name = path.stem
    found.add(name)
    text = path.read_text(encoding="utf-8")
    frontmatter = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
    if not frontmatter:
        raise SystemExit(f"Missing frontmatter: {path}")
    description = re.search(r"^description:\s*(.+)$", frontmatter.group(1), re.MULTILINE)
    skill = re.search(r"^skill:\s*([a-z0-9-]+)$", frontmatter.group(1), re.MULTILINE)
    if not description or not description.group(1).strip() or not skill:
        raise SystemExit(f"Invalid command metadata: {path}")
    if "$ARGUMENTS" not in text:
        raise SystemExit(f"Command does not forward arguments: {path}")
    if not (skills / skill.group(1) / "SKILL.md").is_file():
        raise SystemExit(f"Command references missing skill: {path}")
if found != expected:
    raise SystemExit(f"Unexpected command inventory: {sorted(found)}")
PY
}

check_toml() {
  python3 - "$CODEX_SOURCE/config.toml" "${CODEX_AGENT_NAMES[*]}" <<'PY'
import pathlib
import sys
import tomllib

config = pathlib.Path(sys.argv[1])
names = sys.argv[2].split()
paths = [config] + [config.parent / "agents" / f"{name}.toml" for name in names]
for path in paths:
    try:
        data = tomllib.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise SystemExit(f"Invalid TOML {path}: {exc}")
    if path.parent.name == "agents":
        if data.get("name") != path.stem:
            raise SystemExit(f"Agent name does not match filename: {path}")
        for required in ("description", "developer_instructions", "sandbox_mode"):
            if not data.get(required):
                raise SystemExit(f"Missing {required} in {path}")
PY
}

check_json() {
  python3 - "$CODEX_SOURCE/hooks.json" \
    "$CONFIG_SOURCE/plugins/vault-context/vault-context.config.json" \
    "$CONFIG_SOURCE/plugins/vault-context/vault-context.schema.json" <<'PY'
import json
import pathlib
import sys

for raw in sys.argv[1:]:
    path = pathlib.Path(raw)
    try:
        json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise SystemExit(f"Invalid JSON {path}: {exc}")
PY
}

check_source() {
  local path
  local required=(
    config/AGENTS.md
    config/security-rules.md
    agent-home/skills
    codex/config.toml
    codex/commands
    codex/hooks.json
    codex/rules/my-opencode-config.rules
    config/bin/codex-command-dispatch.mjs
    config/plugins/vault-context/bin/search.mjs
    config/plugins/vault-context/vault-context.js
    config/plugins/vault-context/vault-context.config.json
    config/plugins/vault-context/vault-context.schema.json
    config/plugins/vault-context/stopwords/en.json
    config/plugins/vault-context/stopwords/es.json
    config/bin/codegraph-dependency.sh
    config/bin/update-codex
    agent-home/skills/review/scripts/ocr-opencode-go
    config/searxng/settings.yml
    agent-home/skills/super-agent/references/model-catalog.yaml
    bootstrap_pi.sh
    bootstrap_agy.sh
  )

  for path in "${required[@]}"; do
    [[ -e "$ROOT/$path" ]] || die "Missing $path"
  done
  [[ ! -e "$ROOT/config/skills" ]] || die "config/skills must not remain an independent owner"

  check_skill_inventory
  check_command_inventory
  check_toml
  check_json

  if find "$ROOT" -type d \( -name .git -o -name node_modules -o -name .codegraph \) -prune -o -type f \
    \( -name .env -o \( -name '.env.*' ! -name .env.example \) -o -name auth.json \
    -o -name mcp-auth.json -o -name 'opencode.db*' -o -name '*.db*' -o -name '*.sqlite*' \
    -o -name '*.log' -o -name history.jsonl -o -name installation_id -o -name models_cache.json \
    -o -name session_index.jsonl \) -print -quit | grep -q .; then
    die "Forbidden runtime file found in repository"
  fi

  if grep -R -I -n -E '/Users/|/Applications/|/home/[^/]+/|BRAINTRUST_API_KEY|-----BEGIN [A-Z ]*PRIVATE KEY-----' \
    --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.codegraph \
    --exclude='*.md' --exclude='*.bak' "$CODEX_SOURCE" "$CONFIG_SOURCE"; then
    die "Machine-specific path or credential-shaped value found in managed configuration"
  fi

  if grep -R -I -n -E '(sk-[A-Za-z0-9]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|Fe26\.2\*\*)' \
    --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.codegraph "$ROOT"; then
    die "Credential-shaped value found in repository"
  fi
}

check_dependencies() {
  local missing=()
  local tool
  for tool in codex python3 node npm npx codegraph btca headroom; do
    command -v "$tool" >/dev/null 2>&1 || missing+=("$tool")
  done
  ((${#missing[@]} == 0)) || die "Missing required commands: ${missing[*]}"
}

check_base_dependencies() {
  local missing=()
  local tool
  for tool in codex python3 node npm npx btca headroom; do
    command -v "$tool" >/dev/null 2>&1 || missing+=("$tool")
  done
  ((${#missing[@]} == 0)) || die "Missing required commands: ${missing[*]}"
}

if $CHECK_ONLY; then
  check_source
  check_dependencies
  printf 'Codex configuration source is valid.\n'
  exit 0
fi

if $CHECK_DEPS; then
  check_source
  check_dependencies
  printf 'Codex dependencies are available.\n'
  exit 0
fi

backup_existing() {
  local target=$1
  local relative_target backup_target backup_index=1

  relative_target=${target#"$HOME"/}
  [[ "$relative_target" != "$target" ]] || relative_target=".codex/${target##*/}"
  backup_target="$BACKUP_ROOT/$relative_target"
  while [[ -e "$backup_target" || -L "$backup_target" ]]; do
    backup_target="$BACKUP_ROOT/$relative_target.$backup_index"
    ((backup_index += 1))
  done
  mkdir -p -m 700 "$(dirname "$backup_target")"
  chmod 700 "$BACKUP_ROOT"
  mv "$target" "$backup_target"
  printf 'Backed up %s to %s\n' "$target" "$backup_target"
}

link_managed() {
  local source=$1
  local target=$2

  if [[ -L "$target" && "$(readlink "$target")" == "$source" ]]; then
    return
  fi
  if [[ -e "$target" || -L "$target" ]]; then
    backup_existing "$target"
  fi
  ln -s "$source" "$target"
}

install_managed_file() {
  local source=$1
  local target=$2

  if [[ -f "$target" && ! -L "$target" ]] && cmp -s "$source" "$target"; then
    chmod 600 "$target"
    return
  fi
  if [[ -L "$target" && "$(readlink "$target")" == "$source" ]]; then
    rm "$target"
  elif [[ -e "$target" || -L "$target" ]]; then
    backup_existing "$target"
  fi
  install -m 600 "$source" "$target"
}

# Keep local plan mode, extra MCP servers, and runtime tables outside the source config.
install_codex_config() {
  local source=$1
  local target=$2
  local runtime_line temporary

  if [[ -f "$target" && ! -L "$target" ]]; then
    temporary=$(mktemp "$target.tmp.XXXXXX")
    runtime_line=$(grep -n -m 1 -E '^\[(marketplaces|plugins|hooks\.state|projects)(\.|\])' "$target" | cut -d: -f1 || true)
    if python3 - "$source" "$target" "$runtime_line" "$temporary" <<'PY'
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
except Exception as exc:
    raise SystemExit(f"Could not parse Codex config: {exc}")

target_lines = target_text.splitlines(keepends=True)
runtime_line = int(sys.argv[3]) if sys.argv[3] else 0
prefix_lines = target_lines[:runtime_line - 1] if runtime_line else target_lines
runtime_text = "".join(target_lines[runtime_line - 1:]) if runtime_line else ""
prefix_text = "".join(prefix_lines)
first_table = re.search(r"(?m)^[ \t]*\[", prefix_text)
root_text = prefix_text[:first_table.start()] if first_table else prefix_text
local_root = ""
if "plan_mode_reasoning_effort" in target_data and "plan_mode_reasoning_effort" not in source_data:
    setting = re.compile(r"^[ \t]*(?:\"plan_mode_reasoning_effort\"|'plan_mode_reasoning_effort'|plan_mode_reasoning_effort)[ \t]*=")
    line = next((line for line in root_text.splitlines() if setting.match(line)), None)
    if line is None:
        raise SystemExit("Could not preserve plan_mode_reasoning_effort")
    local_root = line.rstrip("\r\n")

local_servers = set(target_data.get("mcp_servers", {})) - set(source_data.get("mcp_servers", {}))
local_tables = []
local_dotted = []
table_header = re.compile(r"(?m)^[ \t]*\[(?!\[)(.*?)\][ \t]*(?:#.*)?$")
headers = list(table_header.finditer(prefix_text))
table_key = re.compile(r'"((?:\\.|[^"\\])*)"|\'([^\']*)\'|([A-Za-z0-9_-]+)')
for index, match in enumerate(headers):
    keys = [quoted or literal or bare for quoted, literal, bare in table_key.findall(match.group(1))]
    if len(keys) > 1 and keys[0] == "mcp_servers" and keys[1] in local_servers:
        end = headers[index + 1].start() if index + 1 < len(headers) else len(prefix_text)
        local_tables.append(prefix_text[match.start():end].rstrip())

if local_servers:
    dotted_server = re.compile(r'''^[ \t]*mcp_servers[ \t]*\.[ \t]*(?:"((?:\\.|[^"\\])*)"|'([^']*)'|([A-Za-z0-9_-]+))[ \t]*\.''')
    for line in root_text.splitlines():
        match = dotted_server.match(line)
        if match and next((key for key in match.groups() if key is not None), None) in local_servers:
            local_dotted.append(line.rstrip("\r\n"))

root_additions = [line for line in (local_root, *local_dotted) if line]
first_table = re.search(r"(?m)^[ \t]*\[", source_text)
if root_additions:
    additions = "\n".join(root_additions)
    if first_table:
        source_text = source_text[:first_table.start()].rstrip() + "\n\n" + additions + "\n\n" + source_text[first_table.start():]
    else:
        source_text = source_text.rstrip() + "\n\n" + additions + "\n"

if local_tables:
    source_text = source_text.rstrip() + "\n\n" + "\n\n".join(local_tables) + "\n"
if runtime_text:
    source_text = source_text.rstrip() + "\n\n" + runtime_text.lstrip()
try:
    merged_data = tomllib.loads(source_text)
except Exception as exc:
    raise SystemExit(f"Could not merge Codex config: {exc}")
if local_root and merged_data.get("plan_mode_reasoning_effort") != target_data["plan_mode_reasoning_effort"]:
    raise SystemExit("Could not preserve plan_mode_reasoning_effort")
for server in local_servers:
    if merged_data.get("mcp_servers", {}).get(server) != target_data["mcp_servers"][server]:
        raise SystemExit(f"Could not preserve local MCP server {server}")
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

  install_managed_file "$source" "$target"
}

write_generated_agents() {
  local target="$CODEX_TARGET/AGENTS.md"
  local temporary="$target.tmp-$$"

  if [[ -e "$target" || -L "$target" ]]; then
    if [[ -L "$target" ]] || ! grep -q '^# Generated by my-codex-config bootstrap' "$target" 2>/dev/null; then
      link_managed "$CONFIG_SOURCE/AGENTS.md" "$target"
      rm "$target"
    fi
  fi
  {
    printf '# Generated by my-codex-config bootstrap.\n\n'
    cat "$CONFIG_SOURCE/AGENTS.md"
    printf '\n\n# Security Rules\n\n'
    cat "$CONFIG_SOURCE/security-rules.md"
  } > "$temporary"
  chmod 600 "$temporary"
  mv "$temporary" "$target"
}

install_config() {
  local name
  mkdir -p "$CODEX_TARGET" "$CODEX_TARGET/rules" "$CODEX_TARGET/agents" "$CODEX_TARGET/bin" "$HOME/.agents" "$HOME/.local/bin"

  install_codex_config "$CODEX_SOURCE/config.toml" "$CODEX_TARGET/config.toml"
  install_managed_file "$CODEX_SOURCE/hooks.json" "$CODEX_TARGET/hooks.json"
  link_managed "$COMMANDS_SOURCE" "$CODEX_TARGET/commands"
  link_managed "$CODEX_SOURCE/rules/my-opencode-config.rules" "$CODEX_TARGET/rules/my-opencode-config.rules"
  for name in automation-runner commit-worker; do
    retire_agent "$CODEX_TARGET/agents/$name.toml"
  done
  for name in "${CODEX_AGENT_NAMES[@]}"; do
    install_managed_file "$CODEX_SOURCE/agents/$name.toml" "$CODEX_TARGET/agents/$name.toml"
  done
  link_managed "$SKILLS_SOURCE" "$HOME/.agents/skills"
  link_managed "$ROOT/config/bin/codex-command-dispatch.mjs" "$CODEX_TARGET/bin/codex-command-dispatch.mjs"
  link_managed "$SKILLS_SOURCE/review/scripts/ocr-opencode-go" "$HOME/.local/bin/ocr-go"
  link_managed "$ROOT/config/bin/update-codex" "$HOME/.local/bin/update-codex"
  link_managed "$ROOT/config/plugins/vault-context" "$CODEX_TARGET/vault-context"
  write_generated_agents
}

retire_agent() {
  local target=$1

  [[ -e "$target" || -L "$target" ]] || return 0
  backup_existing "$target"
}

install_ponytail_plugin() {
  codex plugin marketplace add "$PONYTAIL_MARKETPLACE"
  codex plugin add "$PONYTAIL_PLUGIN"
}

install_diagram_plugin() {
  codex plugin marketplace add "$DIAGRAM_MARKETPLACE"
  codex plugin add "$DIAGRAM_PLUGIN"
}

install_excalidraw_skill() {
  if [[ ! -d "$EXCALIDRAW_SOURCE_DIR/skill" ]]; then
    mkdir -p "$(dirname "$EXCALIDRAW_SOURCE_DIR")"
    git clone --depth 1 "$EXCALIDRAW_REPO" "$EXCALIDRAW_SOURCE_DIR"
  else
    git -C "$EXCALIDRAW_SOURCE_DIR" pull
  fi
  mkdir -p "$CODEX_HOME/skills/excalidraw"
  rsync -a --delete "$EXCALIDRAW_SOURCE_DIR/skill/" "$CODEX_HOME/skills/excalidraw/"
}

warn() {
  printf 'Warning: %s\n' "$1" >&2
}

searxng_image_matches() {
  case "$1" in
    "$SEARXNG_IMAGE"|searxng/searxng|searxng/searxng:*|searxng/searxng@*|docker.io/searxng/searxng|docker.io/searxng/searxng:*|docker.io/searxng/searxng@*)
      return 0
      ;;
  esac
  return 1
}

check_searxng_startup() {
  local container=$1
  local sample status running restarting restart_count initial_restart_count

  if ! sample=$(docker inspect --format '{{.State.Status}} {{.State.Running}} {{.State.Restarting}} {{.RestartCount}}' "$container" 2>/dev/null); then
    warn "Could not inspect SearXNG container $container during startup check."
    return 1
  fi
  read -r status running restarting restart_count <<< "$sample"
  if [[ "$status" != running || "$running" != true || "$restarting" == true || ! "$restart_count" =~ ^[0-9]+$ ]]; then
    warn "SearXNG container $container is not running during startup check."
    return 1
  fi
  initial_restart_count=$restart_count

  for _ in 1 2 3 4 5; do
    sleep 1
    if ! sample=$(docker inspect --format '{{.State.Status}} {{.State.Running}} {{.State.Restarting}} {{.RestartCount}}' "$container" 2>/dev/null); then
      warn "Could not inspect SearXNG container $container during startup check."
      return 1
    fi
    read -r status running restarting restart_count <<< "$sample"
    if [[ "$status" != running || "$running" != true || "$restarting" == true || ! "$restart_count" =~ ^[0-9]+$ ]]; then
      warn "SearXNG container $container is not running during startup check."
      return 1
    fi
    if [[ "$restart_count" != "$initial_restart_count" ]]; then
      warn "SearXNG container $container restarted during startup check."
      return 1
    fi
  done
}

install_searxng() {
  local existing existing_image

  if ! command -v docker >/dev/null 2>&1; then
    warn 'Docker is not installed; skipping SearXNG deployment.'
    return 0
  fi
  existing=$(docker ps --format '{{.Names}} {{.Ports}}' 2>/dev/null | awk '/127\.0\.0\.1:8080->|0\.0\.0\.0:8080->|\[::\]:8080->/ {print $1; exit}') || true
  if [[ -n "$existing" ]]; then
    if ! existing_image=$(docker inspect --format '{{.Config.Image}}' "$existing" 2>/dev/null); then
      warn "Port 8080 is occupied by $existing, but its image could not be inspected; skipping SearXNG deployment."
      return 0
    fi
    if ! searxng_image_matches "$existing_image"; then
      warn "Port 8080 is occupied by $existing ($existing_image), not SearXNG; skipping deployment."
      return 0
    fi
    printf 'Reusing running SearXNG container %s on http://localhost:8080.\n' "$existing"
    return 0
  fi
  if ! docker info >/dev/null 2>&1; then
    warn 'Docker is unavailable; skipping SearXNG deployment.'
    return 0
  fi

  if docker inspect "$SEARXNG_CONTAINER" >/dev/null 2>&1; then
    if ! existing_image=$(docker inspect --format '{{.Config.Image}}' "$SEARXNG_CONTAINER" 2>/dev/null); then
      warn "Managed container $SEARXNG_CONTAINER image could not be inspected; skipping restart."
      return 0
    fi
    if ! searxng_image_matches "$existing_image"; then
      warn "Managed container $SEARXNG_CONTAINER ($existing_image) is not SearXNG; skipping restart."
      return 0
    fi
    if docker start "$SEARXNG_CONTAINER" >/dev/null 2>&1; then
      if check_searxng_startup "$SEARXNG_CONTAINER"; then
        printf 'Started managed SearXNG container %s.\n' "$SEARXNG_CONTAINER"
      fi
    else
      warn "Unable to start managed SearXNG container $SEARXNG_CONTAINER."
    fi
    return 0
  fi

  mkdir -p "$SEARXNG_CONFIG_ROOT" "$SEARXNG_CACHE_ROOT"
  if [[ ! -e "$SEARXNG_CONFIG_ROOT/settings.yml" ]]; then
    install -m 600 "$ROOT/config/searxng/settings.yml" "$SEARXNG_CONFIG_ROOT/settings.yml"
  fi
  if ! docker run --detach \
    --name "$SEARXNG_CONTAINER" \
    --restart unless-stopped \
    --publish 127.0.0.1:8080:8080 \
    --volume "$SEARXNG_CONFIG_ROOT:/etc/searxng" \
    --volume "$SEARXNG_CACHE_ROOT:/var/cache/searxng" \
    "$SEARXNG_IMAGE" >/dev/null; then
    warn 'Unable to start SearXNG on 127.0.0.1:8080; check Docker and port availability. Continuing with the remaining setup.'
  elif check_searxng_startup "$SEARXNG_CONTAINER"; then
    printf 'Started SearXNG container %s.\n' "$SEARXNG_CONTAINER"
  fi
}

install_optional_harnesses() {
  if $PI_ENABLED; then
    if command -v pi >/dev/null 2>&1; then
      local pi_args=(--install-extension)
      $SEARXNG_MCP_ENABLED || pi_args+=(--no-searxng-mcp)
      "$ROOT/bootstrap_pi.sh" "${pi_args[@]}"
    else
      printf 'Skipping Pi: pi is not installed.\n'
    fi
  fi

  if $AGY_ENABLED; then
    if command -v agy >/dev/null 2>&1; then
      "$ROOT/bootstrap_agy.sh"
    else
      printf 'Skipping AGY: agy is not installed.\n'
    fi
  fi
}

main() {
  check_source
  check_base_dependencies
  ensure_codegraph
  install_searxng_if_enabled
  install_config
  install_ponytail_plugin
  install_diagram_plugin
  install_excalidraw_skill
  install_optional_harnesses
  printf '\nInstalled Codex configuration.\n'
  printf 'Restart Codex after reviewing new hooks, agents, and skills.\n'
  printf 'Authenticate Codex manually.\n'
}

install_searxng_if_enabled() {
  $SEARXNG_ENABLED && install_searxng || true
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main
fi
