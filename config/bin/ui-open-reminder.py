#!/usr/bin/env python3
"""Claude Code hook (PostToolUse, Stop, SubagentStop): remind an agent once to open the app after UI edits.

Pending edits: one file per agent in ${XDG_RUNTIME_DIR:-/tmp}/ui-open-reminder/. Opening the app deletes it;
a Stop or SubagentStop with edits blocks once and deletes it. Any error exits 0 silently."""

import json
import os
import pathlib
import re
import sys

STATE_DIR = pathlib.Path(os.environ.get("XDG_RUNTIME_DIR") or "/tmp") / "ui-open-reminder"
UI_FILE = re.compile(r"\.(tsx|jsx|css|scss|html|vue|svelte)$|(^|/)tailwind\.config\.")
APP_OPENED = re.compile(r"playwright|chrom(?:e|ium)|inspect-page|check-ui|capture\.mjs|agent-browser|orca(?:-ide|-dev)? +(?:tab|snapshot|goto|screenshot)\b", re.I)
APP_TOOLS = ("mcp__playwright__", "mcp__claude-in-chrome__", "mcp__Claude_Browser__",
             "mcp__remote-devices__Claude_Browser__", "mcp__computer-use__")


def main() -> None:
    payload = json.load(sys.stdin)
    event, agent = payload["hook_event_name"], payload.get("agent_id") or "main"
    path = STATE_DIR / f"{payload['session_id']}-{agent}"

    if event == "PostToolUse":
        tool, tool_input = payload["tool_name"], payload.get("tool_input") or {}
        file_path = tool_input.get("file_path") or ""
        if tool in ("Edit", "Write", "MultiEdit") and UI_FILE.search(file_path):
            STATE_DIR.mkdir(parents=True, exist_ok=True)
            with path.open("a", encoding="utf-8") as file:  # "a" is O_APPEND, so no lock is needed
                file.write(file_path + "\n")
        elif opened_app(tool, tool_input):
            path.unlink(missing_ok=True)
    elif event in ("Stop", "SubagentStop") and not payload.get("stop_hook_active") and path.exists():
        lines = path.read_text(encoding="utf-8").splitlines()
        path.unlink()
        names = list(dict.fromkeys(os.path.basename(line) for line in lines))[:3]
        reason = (f"You changed {', '.join(names)} and have not opened the app since. Have the ui-checker agent "
                  "check it live (code-quality ui.md, Inspect the running app) before you finish.")
        print(json.dumps({"decision": "block", "reason": reason}))


def opened_app(tool: str, tool_input: dict) -> bool:
    if tool == "Bash":
        return APP_OPENED.search(tool_input.get("command") or "") is not None
    if tool == "Agent":
        return tool_input.get("subagent_type") in ("computer-controller", "ui-checker")
    return tool.startswith(APP_TOOLS)


if __name__ == "__main__":
    try:
        main()
    except Exception:  # fail open, see the module docstring
        pass
