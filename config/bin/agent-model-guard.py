#!/usr/bin/env python3
"""Claude Code PreToolUse hook: block helper launches of restricted models for roles not allowed.

Reads the `model_guard` block of the model catalog (model id -> allowed roles) and the
`Catalog role:` line of the launch prompt. On a model in `model_guard`, a role that is no
catalog role key is blocked with the valid roles listed. A launch with a `name` is blocked
whatever the model, because named helpers send idle notices that wake their parent. A launch
without a `model` is blocked unless the agent is `fork` or has an agent file of ours, because
Claude's built-in agents inherit the parent model. Set AGENT_MODEL_GUARD=off to skip the
guard. Any problem reading the hook input or the catalog allows the launch: a broken guard
must never stop all helpers.
"""

import json
import os
import pathlib
import re
import sys

CATALOG = pathlib.Path(__file__).resolve().parent.parent / "skills/super-agent/references/model-catalog.yaml"


def read_catalog(catalog: pathlib.Path) -> tuple[dict[str, list[str]], list[str]]:
    """Parse the flat `model_guard:` mapping of `id: [role, ...]` lines and the role keys.

    Catalog roles are the top-level keys after the `ROLES` banner, except `model_guard`.
    """
    guard, roles, inside, after_banner = {}, [], False, False
    for line in catalog.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        if line.lstrip().startswith("#"):
            after_banner = after_banner or line.strip("# ") == "ROLES"
            continue
        if not line[0].isspace():
            inside = line.rstrip() == "model_guard:"
            if after_banner and not inside:
                roles.append(line.partition(":")[0].lower())
            continue
        match = re.match(r"\s+(\S+):\s*\[(.*)\]\s*(?:#.*)?$", line)
        if inside and match:
            allowed = (role.strip().strip("'\"") for role in match.group(2).split(","))
            guard[match.group(1).lower()] = [role.lower() for role in allowed if role]
    return guard, roles


def denial(prompt: str, model: str) -> str | None:
    """Return the reason to block this launch, or None to allow it."""
    # The first plain `Catalog role:` line wins, so a list or quote marker above it (a list item
    # naming a child's role) cannot decide. `[^\S\r\n]` (any space, non-breaking too) keeps
    # the value on the label's line, so an empty `Catalog role:` line reads as no role instead
    # of taking the next line's word.
    plain = re.search(r"(?im)^[^\S\r\n]*(?:\*\*)?Catalog role(?:\*\*)?:(?:[^\S\r\n]|\*)*(\S*)", prompt)
    match = plain or re.search(r"(?im)^(?:[^\S\r\n]|[*>#-])*Catalog role[*`]*:(?:[^\S\r\n]|\*)*(\S*)", prompt)
    role = match.group(1).strip("`*.,:;").lower() if match else None
    guard, roles = read_catalog(CATALOG)
    for guarded, allowed in guard.items():
        if (model == guarded or model in guarded) and role not in allowed:
            if role and roles and role not in roles:
                return (
                    f"Role {role} is not a catalog role; valid roles: {', '.join(roles)}. "
                    "Use the catalog role for the launch."
                )
            return (
                f"Role {role or '(none, no Catalog role: line)'} may not launch {guarded}; "
                f"allowed roles: {', '.join(allowed)}. "
                "Use the catalog model for the role, or ask the user."
            )
    return None


def no_model_denial(agent_type: str, cwd: str) -> str | None:
    """Return the reason to block a model-less launch, or None to allow it."""
    if agent_type == "fork":
        return None
    for base in (pathlib.Path.home(), pathlib.Path(cwd)):
        if (base / ".claude" / "agents" / f"{agent_type}.md").is_file():
            return None
    return (
        f"Agent {agent_type} inherits the parent model when no model is given. "
        "Pass the catalog model for the role, or ask the user."
    )


def main() -> None:
    if os.environ.get("AGENT_MODEL_GUARD") == "off":
        return
    payload = json.load(sys.stdin)
    tool_input = payload.get("tool_input") or {}
    model = str(tool_input.get("model") or "").strip().lower()
    if str(tool_input.get("name") or "").strip():
        reason = (
            "Launch the helper without a name and message it by the ID its launch returns: "
            "named helpers send idle notices that wake their parent."
        )
    elif model:
        reason = denial(str(tool_input.get("prompt") or ""), model)
    else:
        reason = no_model_denial(
            str(tool_input.get("subagent_type") or "general-purpose"),
            str(payload.get("cwd") or os.getcwd()),
        )
    if reason:
        print(json.dumps({"hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }}))


if __name__ == "__main__":
    try:
        main()
    except Exception:  # fail open, see the module docstring
        pass
