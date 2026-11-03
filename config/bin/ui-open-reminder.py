#!/usr/bin/env python3
"""Claude Code hook (PostToolUse, Stop, SubagentStop): remind an agent once to open the app after UI edits.

PostToolUse records each agent's UI edits and clears them when that agent opens the app (APP_OPENED, APP_TOOLS,
or a computer-controller dispatch; lintapple alone does not count). Stop (main agent) and SubagentStop (its
agent_id) block once while edits are pending and stop_hook_active is false. State lives in
${XDG_RUNTIME_DIR:-/tmp}/ui-open-reminder/, one file per session; any problem exits 0 silently.
"""

import fcntl
import json
import os
import pathlib
import re
import sys
from collections.abc import Callable

STATE_DIR = pathlib.Path(os.environ.get("XDG_RUNTIME_DIR") or "/tmp") / "ui-open-reminder"
UI_FILE = re.compile(r"\.(tsx|jsx|css|scss|html|vue|svelte)$|(^|/)tailwind\.config\.")
APP_OPENED = re.compile(r"playwright|chrom(?:e|ium)|inspect-page|capture\.mjs|agent-browser|orca browser", re.I)
APP_TOOLS = ("mcp__playwright__", "mcp__claude-in-chrome__", "mcp__Claude_Browser__",
             "mcp__remote-devices__Claude_Browser__", "mcp__computer-use__")


def main() -> None:
    payload = json.load(sys.stdin)
    event, agent = payload["hook_event_name"], str(payload.get("agent_id") or "main")
    path = STATE_DIR / f"{payload['session_id']}.json"
    if event == "PostToolUse":
        tool, tool_input = payload["tool_name"], payload.get("tool_input") or {}
        file_path = str(tool_input.get("file_path") or "")
        if tool in ("Edit", "Write", "MultiEdit") and UI_FILE.search(file_path):
            with_state(path, lambda state: remember_edit(state, agent, payload.get("agent_type"), file_path))
        elif opened_app(tool, tool_input) and path.exists():
            with_state(path, lambda state: state.pop(agent, None))
    elif event in ("Stop", "SubagentStop") and not payload.get("stop_hook_active") and path.exists():
        reason = with_state(path, lambda state: block_reason(state.pop(agent, {})))
        if reason:
            print(json.dumps({"decision": "block", "reason": reason}))


def opened_app(tool: str, tool_input: dict) -> bool:
    if tool == "Bash":
        return APP_OPENED.search(str(tool_input.get("command") or "")) is not None
    if tool == "Agent":
        return tool_input.get("subagent_type") == "computer-controller"
    return tool.startswith(APP_TOOLS)


def remember_edit(state: dict, agent: str, agent_type: str | None, file_path: str) -> None:
    record = state.setdefault(agent, {"files": []})
    record["files"] = list(dict.fromkeys([*record["files"], file_path]))
    if agent_type:
        record["agent_type"] = agent_type


def block_reason(record: dict) -> str | None:
    names = ", ".join(os.path.basename(name) for name in record.get("files", [])[:3])
    if not names:
        return None
    return (f"You changed {names} and have not opened the app since. Open it and check it live "
            "(code-quality ui.md, Inspect the running app) before you finish.")


def with_state(path: pathlib.Path, act: Callable[[dict], object]) -> object:
    """Run `act` on the state under an exclusive lock on its file, then save it in place."""
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    with path.open("a+", encoding="utf-8") as file:  # creates the file; a+ never truncates it
        fcntl.flock(file, fcntl.LOCK_EX)
        file.seek(0)
        state = json.loads(file.read() or "{}")
        result = act(state)
        file.seek(0)
        file.truncate()
        file.write(json.dumps(state))  # a+ appends; the file is empty now, so this starts at 0
    return result


if __name__ == "__main__":
    try:
        main()
    except Exception:  # fail open, see the module docstring
        pass
