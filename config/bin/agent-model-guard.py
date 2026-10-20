#!/usr/bin/env python3
"""Claude Code PreToolUse hook: block helper launches of restricted models for roles not allowed.

Reads the `model_guard` block of the model catalog (model id -> allowed roles) and the
`Catalog role:` line of the launch prompt. A launch without a `model` is blocked unless
the agent is `fork` or has an agent file of ours, because Claude's built-in agents inherit
the parent model. Set AGENT_MODEL_GUARD=off to skip the guard. Any problem reading the
hook input or the catalog allows the launch: a broken guard must never stop all helpers.
"""

import json
import os
import pathlib
import re
import sys

CATALOG = pathlib.Path(__file__).resolve().parent.parent / "skills/super-agent/references/model-catalog.yaml"


def guarded_models(catalog: pathlib.Path) -> dict[str, list[str]]:
    """Parse the flat `model_guard:` mapping of `id: [role, ...]` lines."""
    guard, inside = {}, False
    for line in catalog.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if not line[0].isspace():
            inside = line.rstrip() == "model_guard:"
            continue
        match = re.match(r"\s+(\S+):\s*\[(.*)\]\s*(?:#.*)?$", line)
        if inside and match:
            roles = (role.strip().strip("'\"") for role in match.group(2).split(","))
            guard[match.group(1).lower()] = [role.lower() for role in roles if role]
    return guard


def denial(prompt: str, model: str) -> str | None:
    """Return the reason to block this launch, or None to allow it."""
    match = re.search(r"(?im)^\s*Catalog role:\s*(\S+)", prompt)
    role = match.group(1).lower() if match else None
    for guarded, allowed in guarded_models(CATALOG).items():
        if (model == guarded or model in guarded) and role not in allowed:
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
    if model:
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
