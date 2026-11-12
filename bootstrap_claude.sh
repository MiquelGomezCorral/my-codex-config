#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SKILLS_SOURCE="$ROOT/config/skills"
CLAUDE_CONFIG_ROOT="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
BACKUP_ROOT="${BACKUP_ROOT:-${XDG_STATE_HOME:-$HOME/.local/state}/my-codex-config/backups/$(date +%Y%m%d-%H%M%S)}"
SEARXNG_ENABLED=true
TEMP_DIR=""

source "$ROOT/bootstrap_common.sh"

usage() {
  printf 'Usage: %s [--no-searxng]\n' "$0"
}

while (($#)); do
  case "$1" in
    --no-searxng) SEARXNG_ENABLED=false ;;
    -h|--help) usage; exit 0 ;;
    *) usage >&2; exit 2 ;;
  esac
  shift
done

claude_has_managed_searxng() {
  local details
  details=$(claude mcp get searxng 2>/dev/null) || return 1
  grep -Eq '^  Command: (.*/)?mcp-searxng$' <<< "$details" &&
    grep -Eq '^  Args: *$' <<< "$details" &&
    [[ "$(grep -Ec '^    [A-Za-z_]+=' <<< "$details")" -eq 1 ]] &&
    grep -Fxq '    SEARXNG_URL=http://localhost:8080' <<< "$details"
}

install_mcp() {
  local server_json name

  for name in braintrust vidext-operator-my-workspace headroom sequential-thinking; do
    claude mcp remove "$name" --scope user >/dev/null 2>&1 || true
  done
  # Claude searches with its built-in WebSearch; only Pi, Codex and AGY get the SearXNG MCP.
  if claude_has_managed_searxng; then
    claude mcp remove searxng --scope user >/dev/null 2>&1 || true
  fi
  for name in codegraph btca; do
    server_json=$(python3 "$ROOT/config/bin/mcp-config.py" render-claude \
      --source "$ROOT/config/mcp.json" --name "$name" --output "$TEMP_DIR/$name.json" >/dev/null && cat "$TEMP_DIR/$name.json")
    claude mcp remove "$name" --scope user >/dev/null 2>&1 || true
    claude mcp add-json "$name" "$server_json" --scope user >/dev/null
  done
}

install_plugins() {
  local plugin
  common_install_jq
  claude plugin marketplace add midudev/better-claude --scope user >/dev/null
  for plugin in image-preview sub-meter; do
    claude plugin install "$plugin@better-claude" --scope user >/dev/null
  done
  claude plugin marketplace add zoharbabin/claude-code-message-timestamps --scope user >/dev/null
  claude plugin install message-timestamps@zoharbabin-claude-tools --scope user >/dev/null
}

install_assets() {
  local source
  common_ensure_directory "$CLAUDE_CONFIG_ROOT"
  python3 "$ROOT/config/bin/harness-assets.py" install-skills \
    --source "$SKILLS_SOURCE" --target "$CLAUDE_CONFIG_ROOT/skills" --backup "$BACKUP_ROOT" \
    --portable "$COMMON_PORTABLE_ROOT/diagram-design/skills" \
    --portable "$COMMON_PORTABLE_ROOT/excalidraw/skill"
  python3 "$ROOT/config/bin/harness-assets.py" install-policy \
    --source "$ROOT/config/AGENTS.md" --addon "$ROOT/config/claude-policy.md" \
    --target "$CLAUDE_CONFIG_ROOT/CLAUDE.md" --backup "$BACKUP_ROOT"
  python3 "$ROOT/config/bin/harness-assets.py" merge-claude-settings \
    --target "$CLAUDE_CONFIG_ROOT/settings.json" --backup "$BACKUP_ROOT" \
    --catalog "$SKILLS_SOURCE/super-agent/references/model-catalog.yaml" \
    --guard "$ROOT/config/bin/agent-model-guard.py" \
    --opus-guard "$ROOT/config/bin/opus-guard.py" \
    --ui-reminder "$ROOT/config/bin/ui-open-reminder.py"
  common_ensure_directory "$CLAUDE_CONFIG_ROOT/agents"
  [[ ! -e "$CLAUDE_CONFIG_ROOT/agents/live-validator.md" && ! -L "$CLAUDE_CONFIG_ROOT/agents/live-validator.md" ]] ||
    common_backup_existing "$CLAUDE_CONFIG_ROOT/agents/live-validator.md"
  for source in "$ROOT"/config/agents/*.toml; do
    python3 "$ROOT/config/bin/harness-assets.py" render-agent --format claude \
      --source "$source" --target "$CLAUDE_CONFIG_ROOT/agents/$(basename "$source" .toml).md" \
      --backup "$BACKUP_ROOT"
  done
  for source in "$ROOT"/config/commands/*.md; do
    python3 "$ROOT/config/bin/harness-assets.py" render-command --format claude \
      --source "$source" --target "$CLAUDE_CONFIG_ROOT/skills" --backup "$BACKUP_ROOT"
  done
}

main() {
  local common_args=(--no-searxng-mcp)
  command -v claude >/dev/null 2>&1 || common_die 'Claude Code is not installed.'
  TEMP_DIR=$(mktemp -d "${TMPDIR:-/tmp}/my-harness-claude.XXXXXX")
  trap 'rm -rf "$TEMP_DIR"' EXIT
  COMMON_CURRENT_SKILL_ROOTS=("$CLAUDE_CONFIG_ROOT/skills")
  $SEARXNG_ENABLED || common_args+=(--no-searxng)
  common_install_shared "${common_args[@]}"
  install_assets
  install_mcp
  install_plugins
  printf 'Installed Claude Code configuration. Restart Claude Code after reviewing generated assets.\n'
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main
fi
