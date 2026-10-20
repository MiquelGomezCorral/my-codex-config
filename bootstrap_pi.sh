#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SKILLS_SOURCE="$ROOT/config/skills"
PI_AGENT_ROOT="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}"
BACKUP_ROOT="${BACKUP_ROOT:-${XDG_STATE_HOME:-$HOME/.local/state}/my-codex-config/backups/$(date +%Y%m%d-%H%M%S)}"
SEARXNG_ENABLED=true
SEARXNG_MCP_ENABLED=true
TEMP_DIR=""

source "$ROOT/bootstrap_common.sh"

usage() {
  printf 'Usage: %s [--no-searxng] [--no-searxng-mcp]\n' "$0"
}

while (($#)); do
  case "$1" in
    --no-searxng) SEARXNG_ENABLED=false ;;
    --no-searxng-mcp) SEARXNG_MCP_ENABLED=false ;;
    -h|--help) usage; exit 0 ;;
    *) usage >&2; exit 2 ;;
  esac
  shift
done

pi_package_version() {
  python3 - "$PI_AGENT_ROOT/npm/node_modules/$1/package.json" <<'PY'
import json
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
if path.is_file():
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        raise SystemExit(1)
    print(data.get("version", ""))
PY
}

install_pi_package() {
  local package=$1 specification=$2 version=$3 installed
  installed=$(pi_package_version "$package" || true)
  [[ "$installed" == "$version" ]] && return 0
  printf 'Installing Pi package %s...\n' "$specification"
  pi install "$specification"
}

install_pi_extensions() {
  install_pi_package pi-subagents npm:pi-subagents@0.79.1 0.79.1
  install_pi_package pi-mcp-adapter npm:pi-mcp-adapter@5.3.2 5.3.2
  if ! pi list 2>/dev/null | grep -Fq 'cathrynlavery/diagram-design'; then
    pi install https://github.com/cathrynlavery/diagram-design
  fi
}

install_mcp_config() {
  local target="$PI_AGENT_ROOT/mcp.json"
  local extension_bin="$PI_AGENT_ROOT/npm/node_modules/.bin/mcp-searxng"
  local connector_version temporary mcp_args=()

  $SEARXNG_MCP_ENABLED || mcp_args+=(--no-searxng-mcp)
  connector_version=$(python3 - "$PI_AGENT_ROOT/npm/node_modules/mcp-searxng/package.json" <<'PY'
import json
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
if path.is_file():
    try:
        package = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        raise SystemExit(0)
    if package.get("name") == "mcp-searxng" and package.get("version") == "1.11.1":
        print(package["version"])
PY
  )
  if [[ "$connector_version" == 1.11.1 && -x "$extension_bin" ]]; then
    mcp_args+=(--pi-extension-bin "$extension_bin")
  fi
  temporary=$(mktemp "$PI_AGENT_ROOT/mcp.json.XXXXXX")
  if ! python3 "$ROOT/config/bin/mcp-config.py" merge-json --mode pi \
    --source "$ROOT/config/mcp.json" --target "$target" --output "$temporary" \
    "${mcp_args[@]}"; then
    rm -f "$temporary"
    return 1
  fi
  if [[ -f "$target" && ! -L "$target" ]] && cmp -s "$temporary" "$target"; then
    rm "$temporary"
    return
  fi
  if [[ -e "$target" || -L "$target" ]]; then
    common_backup_existing "$target"
  fi
  install -m 600 "$temporary" "$target"
  rm "$temporary"
}

install_assets() {
  local source target name portable
  common_ensure_directory "$PI_AGENT_ROOT"
  common_ensure_directory "$PI_AGENT_ROOT/agents"
  common_ensure_directory "$PI_AGENT_ROOT/prompts"
  python3 "$ROOT/config/bin/harness-assets.py" install-skills \
    --source "$SKILLS_SOURCE" --target "$PI_AGENT_ROOT/skills" --backup "$BACKUP_ROOT" \
    --portable "$COMMON_PORTABLE_ROOT/diagram-design/skills" \
    --portable "$COMMON_PORTABLE_ROOT/excalidraw/skill"
  python3 "$ROOT/config/bin/harness-assets.py" install-policy \
    --source "$ROOT/config/AGENTS.md" --target "$PI_AGENT_ROOT/AGENTS.md" --backup "$BACKUP_ROOT"

  for source in "$ROOT"/config/agents/*.toml; do
    name=$(basename "$source" .toml)
    target="$PI_AGENT_ROOT/agents/$name.md"
    python3 "$ROOT/config/bin/harness-assets.py" render-agent --format pi \
      --source "$source" --target "$target" --backup "$BACKUP_ROOT"
  done
  for source in "$ROOT"/config/commands/*.md; do
    python3 "$ROOT/config/bin/harness-assets.py" render-command --format pi \
      --source "$source" --target "$PI_AGENT_ROOT/prompts" --backup "$BACKUP_ROOT"
  done
  install_mcp_config
}

cleanup() {
  [[ -z "$TEMP_DIR" ]] || rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

main() {
  local common_args=()
  command -v pi >/dev/null 2>&1 || common_die 'Pi is not installed.'
  COMMON_CURRENT_SKILL_ROOTS=("$PI_AGENT_ROOT/skills")
  $SEARXNG_ENABLED || common_args+=(--no-searxng)
  $SEARXNG_MCP_ENABLED || common_args+=(--no-searxng-mcp)
  common_install_shared "${common_args[@]}"
  install_assets
  install_pi_extensions
  printf 'Installed Pi configuration. Restart Pi after reviewing generated assets.\n'
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main
fi
