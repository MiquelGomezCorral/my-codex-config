#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SKILLS_SOURCE="$ROOT/config/skills"
AGY_CONFIG_ROOT="${AGY_CONFIG_ROOT:-$HOME/.gemini/config}"
AGY_CLI_ROOT="$HOME/.gemini/antigravity-cli"
AGY_PLUGIN_TARGET="$AGY_CONFIG_ROOT/plugins/my-codex-config"
AGY_CLI_PLUGIN_TARGET="$AGY_CLI_ROOT/plugins/my-codex-config"
AGY_GLOBAL_AGENTS="$AGY_CONFIG_ROOT/agents"
BACKUP_ROOT="${BACKUP_ROOT:-${XDG_STATE_HOME:-$HOME/.local/state}/my-codex-config/backups/$(date +%Y%m%d-%H%M%S)}"
SEARXNG_ENABLED=true
SEARXNG_MCP_ENABLED=true

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

merge_settings() {
  local target="$AGY_CLI_ROOT/settings.json" temporary
  temporary=$(mktemp "$AGY_CLI_ROOT/settings.json.XXXXXX")
  if ! python3 - "$target" "$temporary" <<'PY'
import json
import pathlib
import sys

target, temporary = map(pathlib.Path, sys.argv[1:])
try:
    settings = json.loads(target.read_text(encoding="utf-8")) if target.exists() else {}
except (OSError, ValueError) as error:
    raise SystemExit(f"Cannot safely parse Antigravity settings at {target}: {error}")
if not isinstance(settings, dict):
    raise SystemExit(f"Antigravity settings must be an object: {target}")
settings.update(
    toolPermission="always-proceed",
    artifactReviewPolicy="always-proceed",
    enableTerminalSandbox=False,
)
temporary.write_text(json.dumps(settings, indent=2) + "\n", encoding="utf-8")
PY
  then
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

install_mcp_config() {
  local target="$AGY_CONFIG_ROOT/mcp_config.json" temporary mcp_args=()

  $SEARXNG_MCP_ENABLED || mcp_args+=(--no-searxng-mcp)
  temporary=$(mktemp "$AGY_CONFIG_ROOT/mcp_config.json.XXXXXX")
  if ! python3 "$ROOT/config/bin/mcp-config.py" merge-json --mode agy \
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
  local source name target directory plugin_file
  for directory in "$AGY_CONFIG_ROOT" "$AGY_CONFIG_ROOT/plugins" "$AGY_PLUGIN_TARGET" \
    "$AGY_PLUGIN_TARGET/agents" "$AGY_CLI_ROOT" "$AGY_CLI_PLUGIN_TARGET" \
    "$AGY_CLI_PLUGIN_TARGET/agents" "$AGY_GLOBAL_AGENTS" "$AGY_CONFIG_ROOT/skills"; do
    common_ensure_directory "$directory"
  done

  python3 "$ROOT/config/bin/harness-assets.py" install-skills \
    --source "$SKILLS_SOURCE" --target "$HOME/.agents/skills" --backup "$BACKUP_ROOT" \
    --portable "$COMMON_PORTABLE_ROOT/ponytail/skills" \
    --portable "$COMMON_PORTABLE_ROOT/diagram-design/skills" \
    --portable "$COMMON_PORTABLE_ROOT/excalidraw/skill"
  python3 "$ROOT/config/bin/harness-assets.py" install-skills \
    --source "$SKILLS_SOURCE" --target "$AGY_CLI_ROOT/skills" --backup "$BACKUP_ROOT" \
    --portable "$COMMON_PORTABLE_ROOT/ponytail/skills" \
    --portable "$COMMON_PORTABLE_ROOT/diagram-design/skills" \
    --portable "$COMMON_PORTABLE_ROOT/excalidraw/skill"
  python3 "$ROOT/config/bin/harness-assets.py" install-skills \
    --source "$SKILLS_SOURCE" --target "$AGY_CONFIG_ROOT/skills" --backup "$BACKUP_ROOT" \
    --portable "$COMMON_PORTABLE_ROOT/ponytail/skills" \
    --portable "$COMMON_PORTABLE_ROOT/diagram-design/skills" \
    --portable "$COMMON_PORTABLE_ROOT/excalidraw/skill"
  python3 "$ROOT/config/bin/harness-assets.py" install-skills \
    --source "$SKILLS_SOURCE" --target "$AGY_PLUGIN_TARGET/skills" --backup "$BACKUP_ROOT" \
    --portable "$COMMON_PORTABLE_ROOT/ponytail/skills" \
    --portable "$COMMON_PORTABLE_ROOT/diagram-design/skills" \
    --portable "$COMMON_PORTABLE_ROOT/excalidraw/skill"

  python3 "$ROOT/config/bin/harness-assets.py" install-policy \
    --source "$ROOT/config/AGENTS.md" --target "$HOME/.gemini/GEMINI.md" --backup "$BACKUP_ROOT"
  python3 "$ROOT/config/bin/harness-assets.py" install-policy \
    --source "$ROOT/config/AGENTS.md" --target "$AGY_PLUGIN_TARGET/GEMINI.md" --backup "$BACKUP_ROOT"

  for source in "$ROOT"/config/agents/*.toml; do
    name=$(basename "$source" .toml)
    target="$AGY_CLI_ROOT/agents/$name.md"
    python3 "$ROOT/config/bin/harness-assets.py" render-agent --format agy \
      --source "$source" --target "$target" --backup "$BACKUP_ROOT"
    target="$AGY_PLUGIN_TARGET/agents/$name/agent.md"
    python3 "$ROOT/config/bin/harness-assets.py" render-agent --format agy \
      --source "$source" --target "$target" --backup "$BACKUP_ROOT"
    common_link_managed "$AGY_PLUGIN_TARGET/agents/$name/agent.md" "$AGY_GLOBAL_AGENTS/$name/agent.md"
  done

  for source in "$ROOT"/config/commands/*.md; do
    python3 "$ROOT/config/bin/harness-assets.py" render-command --format gemini \
      --source "$source" --target "$AGY_CLI_ROOT/commands" --backup "$BACKUP_ROOT"
    python3 "$ROOT/config/bin/harness-assets.py" render-command --format skill \
      --source "$source" --target "$AGY_CLI_PLUGIN_TARGET/skills" --backup "$BACKUP_ROOT"
  done

  merge_settings
  plugin_file=$(mktemp "${TMPDIR:-/tmp}/my-harness-agy-plugin.XXXXXX")
  printf '{\n  "name": "my-codex-config"\n}\n' > "$plugin_file"
  common_install_generated_file "$plugin_file" "$AGY_PLUGIN_TARGET/plugin.json"
  common_install_generated_file "$plugin_file" "$AGY_CLI_PLUGIN_TARGET/plugin.json"
  rm "$plugin_file"
  install_mcp_config
}

main() {
  local common_args=()
  command -v agy >/dev/null 2>&1 || common_die 'Antigravity CLI is not installed.'
  COMMON_CURRENT_SKILL_ROOTS=("$HOME/.agents/skills" "$AGY_CONFIG_ROOT/skills" "$AGY_CLI_ROOT/skills" "$AGY_PLUGIN_TARGET/skills")
  $SEARXNG_ENABLED || common_args+=(--no-searxng)
  $SEARXNG_MCP_ENABLED || common_args+=(--no-searxng-mcp)
  common_install_shared "${common_args[@]}"
  install_assets
  printf 'Installed Antigravity configuration. Restart Antigravity after reviewing generated assets.\n'
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main
fi
