#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
CHECK_ONLY=false
CHECK_DEPS=false
HOME_OVERRIDE=false

usage() {
  printf 'Usage: %s [--check] [--check-deps] [--home PATH]\n' "$0"
}

while (($#)); do
  case "$1" in
    --check) CHECK_ONLY=true ;;
    --check-deps) CHECK_DEPS=true ;;
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
PONYTAIL_MARKETPLACE="DietrichGebert/ponytail"
PONYTAIL_PLUGIN="ponytail@ponytail"

CODEX_AGENT_NAMES=(
  coder cleanup-worker commit-worker automation-runner review-worker
  reviewer-quick reviewer-reasoning reviewer-arch reviewer-e2e
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
for required in ("core", "subagent-routing", "commit", "review-findings", "index", "init", "plan-implementation"):
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
    "bro", "cleanup", "code", "commit", "index", "init", "plan-implementation",
    "review-findings", "review-plan", "review-pr-comments", "review",
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

  if grep -R -I -n -E '/Users/|/Applications/|BRAINTRUST_API_KEY|-----BEGIN [A-Z ]*PRIVATE KEY-----' \
    --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.codegraph \
    --exclude='*.md' "$CODEX_SOURCE" "$CONFIG_SOURCE"; then
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
  for tool in codex python3 node npx codegraph btca headroom; do
    command -v "$tool" >/dev/null 2>&1 || missing+=("$tool")
  done
  ((${#missing[@]} == 0)) || die "Missing required commands: ${missing[*]}"
}

check_codex_config() {
  local check_home
  check_home=$(mktemp -d "${TMPDIR:-/tmp}/my-codex-config-check.XXXXXX")
  mkdir -p "$check_home/.codex"
  install -m 600 "$CODEX_SOURCE/config.toml" "$check_home/.codex/config.toml"
  if ! HOME="$check_home" CODEX_HOME="$check_home/.codex" \
    XDG_CONFIG_HOME="$check_home/.config" XDG_DATA_HOME="$check_home/.local/share" \
    XDG_STATE_HOME="$check_home/.local/state" codex mcp-server --strict-config < /dev/null \
    >/dev/null 2>&1; then
    rm -rf "$check_home"
    die "Codex rejected the managed configuration"
  fi
  rm -rf "$check_home"
}

if $CHECK_ONLY; then
  check_source
  check_dependencies
  check_codex_config
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
  mkdir -p "$CODEX_TARGET" "$CODEX_TARGET/rules" "$CODEX_TARGET/agents" "$CODEX_TARGET/bin" "$HOME/.agents"

  install_managed_file "$CODEX_SOURCE/config.toml" "$CODEX_TARGET/config.toml"
  link_managed "$CODEX_SOURCE/hooks.json" "$CODEX_TARGET/hooks.json"
  link_managed "$COMMANDS_SOURCE" "$CODEX_TARGET/commands"
  link_managed "$CODEX_SOURCE/rules/my-opencode-config.rules" "$CODEX_TARGET/rules/my-opencode-config.rules"
  for name in "${CODEX_AGENT_NAMES[@]}"; do
    install_managed_file "$CODEX_SOURCE/agents/$name.toml" "$CODEX_TARGET/agents/$name.toml"
  done
  link_managed "$SKILLS_SOURCE" "$HOME/.agents/skills"
  link_managed "$ROOT/config/bin/codex-command-dispatch.mjs" "$CODEX_TARGET/bin/codex-command-dispatch.mjs"
  link_managed "$ROOT/config/plugins/vault-context" "$CODEX_TARGET/vault-context"
  write_generated_agents
}

install_ponytail_plugin() {
  codex plugin marketplace add "$PONYTAIL_MARKETPLACE"
  codex plugin add "$PONYTAIL_PLUGIN"
}

main() {
  check_source
  check_dependencies
  install_config
  install_ponytail_plugin
  printf '\nInstalled Codex configuration.\n'
  printf 'Restart Codex after reviewing new hooks, agents, and skills.\n'
  printf 'Authenticate Codex manually.\n'
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main
fi
