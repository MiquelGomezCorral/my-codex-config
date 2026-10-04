#!/usr/bin/env python3
"""Translate the shared MCP inventory for each client's native config."""

import argparse
import json
import os
import pathlib
import shutil
import sys
import tomllib


MANAGED = {"codegraph", "searxng", "btca"}
RETIRED = {"braintrust", "vidext-operator-my-workspace", "headroom", "sequential-thinking"}
TIMEOUTS = {"codegraph": 120, "searxng": 120, "btca": 300}


def read_inventory(path: str) -> dict:
    data = json.loads(pathlib.Path(path).read_text(encoding="utf-8"))
    servers = data.get("mcpServers") if isinstance(data, dict) else None
    if not isinstance(servers, dict) or set(servers) != MANAGED:
        raise SystemExit("Shared MCP source must define exactly CodeGraph, SearXNG, and BTCA")
    return servers


def pinned_searxng(binary: pathlib.Path) -> bool:
    for directory in binary.resolve().parents:
        package = directory / "package.json"
        if not package.is_file():
            continue
        try:
            data = json.loads(package.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        return data.get("name") == "mcp-searxng" and data.get("version") == "1.11.1"
    return False


def command_path(command: str) -> str:
    if command == "mcp-searxng":
        pi_root = pathlib.Path(
            os.environ.get("PI_CODING_AGENT_DIR", pathlib.Path.home() / ".pi/agent")
        ).expanduser().resolve()
        for directory in os.environ.get("PATH", "").split(os.pathsep):
            candidate = pathlib.Path(directory or os.curdir) / command
            if not candidate.is_file() or not os.access(candidate, os.X_OK):
                continue
            resolved = candidate.resolve()
            if resolved == pi_root or pi_root in resolved.parents or not pinned_searxng(candidate):
                continue
            return str(candidate.absolute())
        raise SystemExit("Required pinned shared MCP executable is not on PATH: mcp-searxng")
    resolved = shutil.which(command)
    if resolved:
        return resolved
    raise SystemExit(f"Required MCP executable is not on PATH: {command}")


def native_entry(name: str, source: dict, mode: str, pi_extension_bin: str | None) -> dict:
    entry = dict(source[name])
    if name == "searxng" and mode == "pi" and pi_extension_bin:
        candidate = pathlib.Path(pi_extension_bin)
        if candidate.is_file() and os.access(candidate, os.X_OK):
            entry["command"] = str(candidate.absolute())
        else:
            entry["command"] = command_path(entry["command"])
    else:
        entry["command"] = command_path(entry["command"])
    if mode == "pi":
        entry.update(lifecycle="lazy", directTools=True)
    elif mode == "claude":
        entry["type"] = "stdio"
    return entry


def managed_searxng(entry: object, mode: str) -> bool:
    if not isinstance(entry, dict):
        return False
    if pathlib.PurePath(str(entry.get("command", ""))).name != "mcp-searxng":
        return False
    expected = {"command", "env"}
    if mode != "pi" or "args" in entry:
        expected.add("args")
    if entry.get("args", []) != [] or entry.get("env") != {"SEARXNG_URL": "http://localhost:8080"}:
        return False
    if mode == "pi":
        expected.update({"lifecycle", "directTools"})
        if entry.get("lifecycle") != "lazy" or entry.get("directTools") is not True:
            return False
    return set(entry) == expected


def merge_json(args: argparse.Namespace) -> None:
    inventory = read_inventory(args.source)
    target = pathlib.Path(args.target)
    current = target.read_text(encoding="utf-8") if target.exists() else ""
    data = json.loads(current) if current.strip() else {}
    if not isinstance(data, dict):
        raise SystemExit(f"MCP config must be an object: {target}")
    servers = data.setdefault("mcpServers", {})
    if not isinstance(servers, dict):
        raise SystemExit(f"MCP config mcpServers must be an object: {target}")

    for name in RETIRED:
        servers.pop(name, None)
    for name in MANAGED:
        if name == "searxng" and args.no_searxng_mcp:
            if managed_searxng(servers.get(name), args.mode):
                servers.pop(name, None)
            continue
        servers[name] = native_entry(name, inventory, args.mode, args.pi_extension_bin)
    pathlib.Path(args.output).write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def render_server(args: argparse.Namespace) -> None:
    inventory = read_inventory(args.source)
    if args.name not in MANAGED:
        raise SystemExit(f"Unknown managed MCP server: {args.name}")
    entry = native_entry(args.name, inventory, "claude", None)
    pathlib.Path(args.output).write_text(json.dumps(entry, separators=(",", ":")), encoding="utf-8")


def render_codex(args: argparse.Namespace) -> None:
    inventory = read_inventory(args.source)
    base = pathlib.Path(args.codex).read_text(encoding="utf-8")
    try:
        data = tomllib.loads(base)
    except Exception as error:
        raise SystemExit(f"Invalid Codex source config: {error}") from error
    if data.get("mcp_servers"):
        raise SystemExit("Codex source config must not own MCP definitions")

    lines = [base.rstrip(), ""]
    for name in sorted(MANAGED):
        if name == "searxng" and args.no_searxng_mcp:
            continue
        entry = native_entry(name, inventory, "codex", None)
        lines.extend((f"[mcp_servers.{name}]", f"command = {json.dumps(entry['command'])}"))
        lines.append(f"args = {json.dumps(entry.get('args', []))}")
        lines.append(f"startup_timeout_sec = {TIMEOUTS[name]}.0")
        for key, value in sorted(entry.get("env", {}).items()):
            lines.append("")
            lines.append(f"[mcp_servers.{name}.env]")
            lines.append(f"{key} = {json.dumps(value)}")
        lines.append("")
    pathlib.Path(args.output).write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser()
    commands = root.add_subparsers(dest="action", required=True)

    merge = commands.add_parser("merge-json")
    merge.add_argument("--mode", choices=("pi", "agy"), required=True)
    merge.add_argument("--source", required=True)
    merge.add_argument("--target", required=True)
    merge.add_argument("--output", required=True)
    merge.add_argument("--pi-extension-bin")
    merge.add_argument("--no-searxng-mcp", action="store_true")
    merge.set_defaults(run=merge_json)

    server = commands.add_parser("render-claude")
    server.add_argument("--source", required=True)
    server.add_argument("--name", required=True)
    server.add_argument("--output", required=True)
    server.set_defaults(run=render_server)

    codex = commands.add_parser("render-codex")
    codex.add_argument("--source", required=True)
    codex.add_argument("--codex", required=True)
    codex.add_argument("--output", required=True)
    codex.add_argument("--no-searxng-mcp", action="store_true")
    codex.set_defaults(run=render_codex)
    return root


if __name__ == "__main__":
    arguments = parser().parse_args()
    try:
        arguments.run(arguments)
    except (OSError, ValueError, KeyError) as error:
        print(f"mcp-config: {error}", file=sys.stderr)
        raise SystemExit(1) from error
