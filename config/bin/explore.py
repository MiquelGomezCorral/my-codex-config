#!/usr/bin/env python3
"""Answer one read-only repository question with the explorer role.

Runs the catalog's `explorer` candidates in order (pi one-shot, then claude) and prints the
first brief that comes back. stdout carries only the brief; stderr carries one line per
failed candidate and one line naming the route that answered. Exit status 1 means every
candidate failed. Each candidate runs under a timeout (240 s, or --timeout seconds). Every
call carries the global policy and the current repository's AGENTS.md in its system prompt.
"""

import argparse
import pathlib
import re
import subprocess
import sys
import tomllib


CONFIG_ROOT = pathlib.Path(__file__).resolve().parent.parent
CATALOG = CONFIG_ROOT / "skills/super-agent/references/model-catalog.yaml"
AGENT_FILE = CONFIG_ROOT / "agents/explorer.toml"
POLICY_FILE = CONFIG_ROOT / "AGENTS.md"
DEFAULT_TIMEOUT_SECONDS = 240
MAX_BRIEF_LINES = 20


def explorer_candidates(catalog: pathlib.Path) -> list[dict[str, str]]:
    """Return the ordered `explorer:` entries as dicts with harness, model and thinking."""
    candidates, inside = [], False
    for line in catalog.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if not line[0].isspace():
            inside = line.rstrip() == "explorer:"
            continue
        match = re.match(r"\s+(?:- )?(harness|model|thinking): (\S+)\s*(?:#.*)?$", line)
        if inside and match:
            key, value = match.group(1), match.group(2).strip("'\"")
            if key == "harness" or not candidates:
                candidates.append({})
            candidates[-1][key] = value

    if not candidates:
        raise SystemExit(f"explore: no explorer entries in {catalog}")
    for candidate in candidates:
        if not {"harness", "model", "thinking"} <= candidate.keys():
            raise SystemExit(f"explore: incomplete explorer entry in {catalog}: {candidate}")
    return candidates


def instructions() -> str:
    """Return the explorer's developer instructions, which explorer.toml owns."""
    return tomllib.loads(AGENT_FILE.read_text(encoding="utf-8"))["developer_instructions"].strip()


def repository_context() -> tuple[pathlib.Path | None, str]:
    """Return the current Git root (None outside Git) and its agent-memory folder or `unavailable`."""
    try:
        done = subprocess.run(
            ["git", "rev-parse", "--path-format=absolute", "--show-toplevel", "--git-common-dir"],
            capture_output=True, encoding="utf-8", check=False,
        )
    except OSError:
        return None, "unavailable"
    if done.returncode:
        return None, "unavailable"
    root, common_dir = done.stdout.splitlines()[:2]
    memory = pathlib.Path(common_dir) / "agent-memory"
    return pathlib.Path(root), (str(memory) if memory.is_dir() else "unavailable")


def system_prompt(root: pathlib.Path | None) -> str:
    """Return the explorer's instructions with the global policy and the repository's AGENTS.md.

    The pi and claude flags drop AGENTS.md and CLAUDE.md, so both texts travel in the system prompt.
    """
    policy = POLICY_FILE.read_text(encoding="utf-8").strip()
    parts = [instructions(), f"# Global policy ({POLICY_FILE})", policy]
    agents = root / "AGENTS.md" if root is not None else None
    if agents is not None and agents.is_file():
        parts += [f"# Repository AGENTS.md ({agents})", agents.read_text(encoding="utf-8").strip()]
    return "\n\n".join(parts)


def one_shot_argv(candidate: dict[str, str], prompt: str, system: str) -> list[str] | None:
    """Return the read-only one-shot command for a candidate; None for any other harness."""
    model, thinking = candidate["model"], candidate["thinking"]
    if candidate["harness"] == "pi":
        # pi keeps every MCP tool unless an mcp__ entry is listed, so only CodeGraph is listed.
        return [
            "pi", "--model", model, "--thinking", thinking, "--print", "--no-context-files",
            "--tools", "read,grep,find,ls,mcp__codegraph__*", "--append-system-prompt", system,
            "--", prompt,
        ]
    if candidate["harness"] == "claude":
        # --safe-mode drops MCP servers, CLAUDE.md and hooks; --tools keeps the read tools only.
        return [
            "claude", "--model", model, "--effort", thinking, "--safe-mode",
            "--tools", "Read,Grep,Glob", "--append-system-prompt", system, "-p", prompt,
        ]
    return None


def run_candidate(argv: list[str], timeout: float) -> str:
    """Run one candidate and return its brief, or raise RuntimeError with a one-line reason."""
    try:
        done = subprocess.run(
            argv, stdin=subprocess.DEVNULL, capture_output=True, encoding="utf-8",
            errors="replace", timeout=timeout, check=False,
        )
    except subprocess.TimeoutExpired as error:
        raise RuntimeError(f"timed out after {timeout:g} s") from error
    except OSError as error:
        raise RuntimeError(error.strerror or str(error)) from error

    if done.returncode:
        last_line = (done.stderr.strip().splitlines() or ["no error output"])[-1]
        raise RuntimeError(f"exit {done.returncode}: {last_line}")
    if not done.stdout.strip():
        raise RuntimeError("printed nothing")
    return done.stdout.strip()


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="explore", description="Answer one read-only repository question."
    )
    parser.add_argument("--timeout", type=float, default=DEFAULT_TIMEOUT_SECONDS,
                        help="seconds allowed per candidate (default %(default)g)")
    parser.add_argument("question")
    parser.add_argument("paths", nargs="*", help="starting-point hints, not a limit")
    args = parser.parse_args()

    paths = ", ".join(args.paths) or "none"
    root, memory = repository_context()
    prompt = (
        f"Question: {args.question}\n"
        f"Paths (hints, not limits): {paths}\n"
        f"Agent memory for the error lookup: {memory}"
    )
    system = system_prompt(root)
    for candidate in explorer_candidates(CATALOG):
        route = f"{candidate['harness']} {candidate['model']} thinking {candidate['thinking']}"
        argv = one_shot_argv(candidate, prompt, system)
        if argv is None:
            print(f"explore: skipped {route}: harness is not pi or claude", file=sys.stderr)
            continue
        try:
            brief = run_candidate(argv, args.timeout)
        except RuntimeError as error:
            print(f"explore: {route} failed: {error}", file=sys.stderr)
            continue
        print(f"explore: route {route}", file=sys.stderr)
        lines = brief.splitlines()
        if len(lines) > MAX_BRIEF_LINES:
            cut = len(lines) - MAX_BRIEF_LINES
            print(f"explore: cut {cut} lines past {MAX_BRIEF_LINES}; ask a narrower question",
                  file=sys.stderr)
        print("\n".join(lines[:MAX_BRIEF_LINES]))
        return
    print("explore: every explorer candidate failed", file=sys.stderr)
    raise SystemExit(1)


if __name__ == "__main__":
    main()
