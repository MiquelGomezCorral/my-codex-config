#!/usr/bin/env python3
"""Claude Code PreToolUse hook: hold Opus sessions to three files per message and to no browser tools.

Applies only when the session's model contains `opus`. A main session reads its model from the newest
API request its transcript logs; a native helper reads it from its own `subagents/agent-<id>.jsonl`.
The fourth distinct file read in one human message is denied, and so is every browser or desktop tool;
each reason names the way out. `agent-guard unlock reads` or `agent-guard unlock browser` lifts one for
the session, and the command itself is denied as its receipt. Set AGENT_GUARD=off to skip the guard.
Any problem reading the hook input, the transcript or the state allows the call.
"""

import fcntl
import glob
import json
import os
import pathlib
import re
import shlex
import subprocess
import sys
import time
from collections.abc import Callable, Iterator

CHUNK = 256 * 1024
PRUNE_AFTER = 7 * 24 * 3600
READ_BUDGET = 3
STATE_DIR = pathlib.Path(os.environ.get("XDG_STATE_HOME") or pathlib.Path.home() / ".local/state") / "agent-guard"
SKILLS_DIR = pathlib.Path(os.environ.get("CLAUDE_CONFIG_DIR") or pathlib.Path.home() / ".claude") / "skills"
UNLOCKS = {"agent-guard unlock reads": "reads", "agent-guard unlock browser": "browser"}
BROWSER_TOOLS = (
    "mcp__claude-in-chrome__",
    "mcp__Claude_Browser__",
    "mcp__remote-devices__Claude_Browser__",
    "mcp__computer-use__",
)
BROWSER_BINARIES = ("playwright", "playwright-cli", "agent-browser", "xdotool", "ydotool", "firefox")
BROWSER_BINARY_PREFIXES = ("chromium", "google-chrome")
# Browser Automation verbs of `orca-ide --help` (Orca 1.4.243), plus the desktop `computer` group.
ORCA_BROWSER_VERBS = frozenset({
    "back", "check", "clear", "click", "clipboard", "computer", "dblclick", "dialog", "download",
    "drag", "eval", "exec", "fill", "find", "focus", "forward", "get", "goto", "highlight", "hover",
    "inserttext", "is", "keypress", "mouse", "reload", "screenshot", "scroll", "scrollintoview",
    "select", "set", "snapshot", "storage", "tab", "type", "uncheck", "upload", "wait",
})
# Options that take a value, per read command. For sed these are also its script flags.
READ_COMMANDS = {
    "cat": (),
    "head": ("-n", "-c", "--lines", "--bytes"),
    "tail": ("-n", "-c", "--lines", "--bytes"),
    "sed": ("-e", "-f", "--expression", "--file"),
}
# Wrappers run a command after their own options; each lists the short options that take a value.
# shortcut: wrappers not listed here (xargs, find -exec), env -S strings and long options hide their
# command; add them when a live run shows one.
WRAPPERS = {
    "timeout": ("-k", "-s"),
    "env": ("-u", "-C"),
    "nohup": (),
    "time": ("-f", "-o"),
    "nice": ("-n",),
    "ionice": ("-c", "-n", "-p", "-P", "-u"),
    "sudo": ("-u", "-g", "-C", "-D", "-p", "-r", "-R", "-t", "-T", "-U"),
    "setsid": (),
    "exec": ("-a",),
    "command": (),
    "xvfb-run": ("-e", "-f", "-n", "-p", "-s"),
    "stdbuf": ("-i", "-o", "-e"),
}
SHELLS = ("bash", "sh", "zsh")
SHELL_OPERATORS = frozenset("<>;|&()")
# A # starts a comment only at a word start, outside quotes and not after a backslash-escaped blank or newline.
COMMENT = re.compile(r"""('[^']*'|"(?:\\.|[^"\\])*"|\\.)|(?<!\S)(?<!\\\s)#.*""")
# <<WORD, <<-WORD, <<\WORD, <<'WORD' or <<"WORD" opens a here-document body (a quoted WORD may hold spaces); <<< does not.
# shortcut: a << in quotes or $((1 << 3)) opens a body that hides lines up to its closing word; upgrade by lexing first.
# shortcut: a bash <<EOF body is not scanned and a \ ending a <<WORD line is not joined; upgrade by parsing the shell.
HEREDOC_START = re.compile(r"(?<!<)<<-?\s*\\?(?:(['\"])(.+?)\1|([\w.-]+))")
# A digit touching < or > is a file descriptor (2>, 1>>), not a file.
DESCRIPTOR_DIGITS = re.compile(r"(?<![^\s;&|()])\d+(?=[<>])")
# Node, Bun, Deno and any Python run the script file they name; only the head of that file is read.
SCRIPT_RUNNERS = ("node", "nodejs", "bun", "deno")
SCRIPT_SUFFIXES = (".js", ".mjs", ".cjs", ".ts", ".py")
SCRIPT_HEAD = 64 * 1024
# shortcut: a Write-tool script run from another cwd, an indirect library load and library text outside a heredoc body (node -e, echo > file.mjs) are not matched, upgrade on a live miss.
BROWSER_LIB = re.compile(
    r"\b(?:from|import|require)\s*\(?\s*['\"](?:[^'\"\n]*/)?"
    r"(?:playwright|playwright-core|puppeteer|puppeteer-core)(?:/index\.mjs)?['\"]"
    r"|(?m:^)\s*(?:from|import)\s+(?:playwright|puppeteer)\b"  # Python's unquoted import, at a line start so prose does not match
    r"|\b(?:chromium|firefox|webkit)\.launch"
)
BROWSER_REASON = (
    "Browser and desktop tools are blocked in this Opus session. Hand the task to a computer-controller "
    "helper. `agent-guard unlock browser` lifts the block only on the user's explicit words."
)


def main() -> None:
    if os.environ.get("AGENT_GUARD") == "off":
        return
    payload = json.load(sys.stdin)
    session_id = str(payload.get("session_id") or "")
    tool_input = payload.get("tool_input") or {}
    command = str(tool_input.get("command") or "").strip() if payload.get("tool_name") == "Bash" else ""
    if command in UNLOCKS:
        kind = UNLOCKS[command]
        reason = with_state(session_id, lambda state: unlock(state, kind))
    else:
        main_transcript = pathlib.Path(payload["transcript_path"])
        if "opus" not in current_model(model_transcript(payload, main_transcript)).lower():
            return
        prompt_id = str(payload.get("prompt_id") or "") or newest(main_transcript, prompt_of)
        reason = with_state(session_id, lambda state: decide(payload, state, prompt_id))
    if reason:
        print(json.dumps({"hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }}))


def model_transcript(payload: dict, main_transcript: pathlib.Path) -> pathlib.Path:
    """Return the transcript that names the model: a helper's own file, or the main session's."""
    if not payload.get("agent_id"):
        return main_transcript
    helper = f"agent-{payload['agent_id']}.jsonl"
    return main_transcript.parent / str(payload.get("session_id") or "") / "subagents" / helper


def decide(payload: dict, state: dict, prompt_id: str) -> str | None:
    """Return why this tool call is denied, recording the files it counts, or None to admit it."""
    # A missing message id must not reset the budget: keep the stored one.
    new_prompt(state, prompt_id or state.get("prompt_id", ""))
    tool = str(payload.get("tool_name") or "")
    tool_input = payload.get("tool_input") or {}
    cwd = str(payload.get("cwd") or os.getcwd())
    browser, opened = tool.startswith(BROWSER_TOOLS), []
    if tool == "Bash":
        browser, opened = scan_bash(str(tool_input.get("command") or ""), cwd)
    elif tool == "Read":
        opened = [os.path.normpath(os.path.join(cwd, str(tool_input.get("file_path") or "")))]
    if browser and "browser" not in state["unlocked"]:
        return BROWSER_REASON
    if "reads" in state["unlocked"] or not opened:
        return None
    memory = memory_dir(cwd)
    new = [path for path in dict.fromkeys(opened) if path not in state["files"] and not is_free(path, memory)]
    if len(state["files"]) + len(new) > READ_BUDGET:
        return read_reason(state["files"], len(new))
    state["files"].extend(new)
    return None


def read_reason(files: list[str], new_count: int) -> str:
    """Name the files already read, how many new ones the denied call opens, and the way out of the budget."""
    already = ", ".join(files) or "none"
    noun = "file" if new_count == 1 else "files"
    return (
        f"Read budget: {READ_BUDGET} distinct files per human message on Opus. Already read: "
        f"{already}; this call opens {new_count} new {noun}. "
        "Use `explore \"<question>\" [paths]` for the rest. "
        "`agent-guard unlock reads` lifts the budget only on the user's explicit words."
    )


def unlock(state: dict, kind: str) -> str:
    """Record the unlock for this session and return the receipt that denies the command."""
    state["unlocked"] = sorted({*state.get("unlocked", []), kind})
    return f"Opus guard: unlocked {kind} for this session. No agent-guard binary exists; this denial is the receipt."


def new_prompt(state: dict, prompt_id: str) -> None:
    """Forget the files read in an earlier human message; unlocks last for the whole session."""
    if state.get("prompt_id") != prompt_id:
        state.update(prompt_id=prompt_id, files=[])
    state.setdefault("files", [])
    state.setdefault("unlocked", [])


def with_state(session_id: str, act: Callable[[dict], str | None]) -> str | None:
    """Prune old state, then run `act` on the session's state under one lock and save it by atomic rename."""
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    path = STATE_DIR / f"{session_id}.json"
    with (STATE_DIR / ".lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        prune()
        try:
            state = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            state = {}
        reason = act(state)
        temporary = path.with_name(f"{path.name}.{os.getpid()}.tmp")
        temporary.write_text(json.dumps(state), encoding="utf-8")
        os.replace(temporary, path)
    return reason


def prune() -> None:
    """Delete state files untouched for seven days; the caller holds the state lock."""
    cutoff = time.time() - PRUNE_AFTER
    for path in STATE_DIR.glob("*.json"):
        if path.stat().st_mtime < cutoff:
            path.unlink()


def records_backwards(path: pathlib.Path) -> Iterator[dict]:
    """Yield the records of a JSONL transcript from newest to oldest, reading 256 KB at a time."""
    with path.open("rb") as file:
        position = file.seek(0, os.SEEK_END)
        tail = b""
        while position:
            size = min(CHUNK, position)
            position -= size
            file.seek(position)
            lines = (file.read(size) + tail).split(b"\n")
            tail = lines.pop(0)  # its start lies in an older chunk
            for line in reversed(lines):
                yield parse_record(line)
    yield parse_record(tail)


def parse_record(line: bytes) -> dict:
    """Parse one transcript line; anything that is not a JSON object counts as no record."""
    try:
        record = json.loads(line)
    except ValueError:
        return {}
    return record if isinstance(record, dict) else {}


def newest(path: pathlib.Path, field: Callable[[dict], str]) -> str:
    """Return the first non-empty value of `field` scanning from the newest transcript record."""
    for record in records_backwards(path):
        value = field(record)
        if value:
            return value
    return ""


def current_model(path: pathlib.Path) -> str:
    """Return the model of the newest API request that names one, else of the newest assistant record."""
    fallback = ""
    for record in records_backwards(path):
        requested = request_model_of(record) if record.get("type") == "api-request" else ""
        if requested:
            return requested
        fallback = fallback or model_of(record)
    return fallback


def request_model_of(record: dict) -> str:
    """Return the model an API request record names, or an empty string."""
    params = record.get("params")
    return str(params.get("model") or "") if isinstance(params, dict) else ""


def model_of(record: dict) -> str:
    """Return the model an assistant record names, or an empty string."""
    message = record.get("message")
    return str(message.get("model") or "") if isinstance(message, dict) else ""


def prompt_of(record: dict) -> str:
    """Return the human message id of a user record; isMeta records carry a new id mid-message, so skip them."""
    if record.get("type") != "user" or record.get("isMeta"):
        return ""
    return str(record.get("promptId") or "")


def scan_bash(command: str, cwd: str) -> tuple[bool, list[str]]:
    """Return whether a Bash command drives a browser, and the files its cat, head, tail and sed open."""
    text, bodies = split_heredoc_bodies(command)
    # a closed body is text the command writes, such as a script not yet on disk; it counts only when the command runs a script too
    # shortcut: a same-call write and run through tsx or ts-node is not matched, upgrade on a live miss
    browser = BROWSER_LIB.search(bodies) is not None and has_script_runner(text)
    opened = []
    for words in bash_commands(text):
        words = after_wrappers(words)
        if not words:
            continue
        name = os.path.basename(words[0])
        script = shell_script(words)
        if script:  # bash -c STRING runs STRING as a command list of its own
            inner_browser, inner_opened = scan_bash(script, cwd)
            browser = browser or inner_browser
            opened.extend(inner_opened)
        elif is_browser(name, words[1:]) or runs_browser_script(name, words[1:], cwd):
            browser = True
        elif name == "cd":
            target = words[1] if len(words) > 1 else "~"
            cwd = os.path.normpath(os.path.join(cwd, os.path.expanduser(target)))
        elif name in READ_COMMANDS:
            for operand in operands(name, words[1:]):
                opened.extend(operand_files(operand, cwd))
    return browser, opened


def split_heredoc_bodies(command: str) -> tuple[str, str]:
    """Return the command without closed here-document bodies, and those bodies; an unclosed body stays, so it is still checked."""
    kept, bodies, body, ends = [], [], [], []
    for line in command.split("\n"):
        if ends:
            body.append(line)
            if line.strip() == ends[0]:
                ends.pop(0)
                bodies.extend(body)
                body = []
            continue
        kept.append(line)
        ends.extend(match.group(2) or match.group(3) for match in HEREDOC_START.finditer(line))
    return "\n".join(kept + body), "\n".join(bodies)


def cut_comments(command: str) -> str:
    """Return the command without its # comments; quoted text and escapes are kept as they are."""
    return COMMENT.sub(lambda match: match.group(1) or "", command)


def bash_commands(command: str) -> list[list[str]]:
    """Split a Bash command at ; && || | & and newlines, keeping each command's words without redirections."""
    text = cut_comments(command).replace("\\\n", "").replace("\n", ";")
    text = DESCRIPTOR_DIGITS.sub("", text)
    lexer = shlex.shlex(text, posix=True, punctuation_chars=True)
    lexer.whitespace_split = True
    lexer.commenters = ""  # shlex would end the whole call at a #
    try:
        tokens = list(lexer)
    except ValueError:  # an unclosed quote: split on whitespace and operators so command names still match
        tokens = re.findall(r"[^\s;<>|&]+|[;<>|&]+", text)
    commands, words, target = [], [], False
    for token in tokens:
        if target:
            target = False
        elif token and set(token) <= SHELL_OPERATORS:
            if "<" in token or ">" in token:
                target = True
            else:
                commands.append(words)
                words = []
        else:
            words.append(token)
    return [*commands, words]


def without_assignments(words: list[str]) -> list[str]:
    """Drop the leading VAR=value words that set the environment of a command."""
    while words and "=" in words[0] and words[0].partition("=")[0].isidentifier():
        words = words[1:]
    return words


def after_wrappers(words: list[str]) -> list[str]:
    """Return the words of the command that transparent wrappers such as timeout or nohup run."""
    words = without_assignments(words)
    while words and os.path.basename(words[0]) in WRAPPERS:
        name, index = os.path.basename(words[0]), 1
        while index < len(words) and words[index].startswith("-"):
            if name == "command" and words[index] in ("-v", "-V"):
                return []  # a lookup, not a run
            index += 2 if words[index] in WRAPPERS[name] else 1
        if name == "timeout":
            index += 1  # its duration
        words = without_assignments(words[index:])
    return words


def shell_script(words: list[str]) -> str:
    """Return the STRING of `bash -c STRING`, also for sh, zsh and combined flags such as -lc; else ''."""
    if os.path.basename(words[0]) not in SHELLS:
        return ""
    for index, arg in enumerate(words[1:-1], 1):
        if arg.startswith("-") and not arg.startswith("--") and "c" in arg:
            return words[index + 1]
    return ""


def has_script_runner(command: str) -> bool:
    """Return whether a command word of the Bash command, or of a `bash -c` string in it, is a script runner."""
    for words in bash_commands(command):
        words = after_wrappers(words)
        if not words:
            continue
        script = shell_script(words)
        if is_script_runner(os.path.basename(words[0])) or (script and has_script_runner(script)):
            return True
    return False


def is_browser(name: str, args: list[str]) -> bool:
    """Return whether a command word drives a browser or the desktop."""
    first = next((arg for arg in args if not arg.startswith("-")), "")
    if name in ("npx", "bunx"):
        return first.startswith(("playwright", "@playwright/"))
    if name in ("orca", "orca-ide", "orca-dev"):
        return first in ORCA_BROWSER_VERBS
    if name.startswith("python"):
        return "-m" in args and first.startswith("playwright")
    return name in BROWSER_BINARIES or name.startswith(BROWSER_BINARY_PREFIXES)


def is_script_runner(name: str) -> bool:
    """Return whether a command word runs a script file: Node, Bun, Deno or any Python."""
    return name in SCRIPT_RUNNERS or name.startswith("python")


def runs_browser_script(name: str, args: list[str], cwd: str) -> bool:
    """Return whether a node, bun, deno or python command runs a script file that imports a browser library."""
    if not is_script_runner(name):
        return False
    return any(script_imports_browser(resolve(arg, cwd)) for arg in args if arg.endswith(SCRIPT_SUFFIXES))


def script_imports_browser(path: str) -> bool:
    """Return whether the head of an existing script file imports a browser library; unreadable files count as no."""
    if not os.path.isfile(path):  # a FIFO would block the read
        return False
    try:
        with open(path, "rb") as file:
            return BROWSER_LIB.search(file.read(SCRIPT_HEAD).decode("utf-8", "replace")) is not None
    except OSError:
        return False


def operands(name: str, args: list[str]) -> list[str]:
    """Return the file operands of cat, head, tail or sed, leaving out options and their values."""
    value_options = READ_COMMANDS[name]
    files, takes_value = [], False
    for arg in args:
        if takes_value:
            takes_value = False
        elif arg in value_options:
            takes_value = True
        elif not arg.startswith("-"):
            files.append(arg)
    script_given = any(arg.split("=")[0] in value_options or arg.startswith(("-e", "-f")) for arg in args)
    if name == "sed" and not script_given:
        files = files[1:]  # without -e or -f, the first operand is the script
    return files


def resolve(path: str, cwd: str) -> str:
    """Return the absolute path a command argument names, from the tracked cwd."""
    return os.path.normpath(os.path.join(cwd, os.path.expanduser(path)))


def operand_files(operand: str, cwd: str) -> list[str]:
    """Return the absolute paths an operand names; a shell expansion counts as one unknown file."""
    if "$" in operand or "`" in operand:
        return [operand]
    literal = resolve(operand, cwd)
    if os.path.isfile(literal) or not any(char in operand for char in "*?["):
        return [literal]
    matches = glob.glob(os.path.expanduser(operand), root_dir=cwd)
    return [os.path.normpath(os.path.join(cwd, match)) for match in matches] or [literal]


def memory_dir(cwd: str) -> str:
    """Return the agent-memory folder shared by the worktrees of the repository at cwd, or '' outside Git."""
    result = subprocess.run(
        ["git", "-C", cwd, "rev-parse", "--path-format=absolute", "--git-common-dir"],
        capture_output=True, text=True,
    )
    return os.path.join(result.stdout.strip(), "agent-memory") if result.returncode == 0 else ""


def is_free(path: str, memory: str) -> bool:
    """Return whether a path is a harness skill or shared agent memory, which the budget does not count."""
    return path.startswith(str(SKILLS_DIR) + os.sep) or (bool(memory) and path.startswith(memory + os.sep))


if __name__ == "__main__":
    try:
        main()
    except Exception:  # fail open, see the module docstring
        pass
