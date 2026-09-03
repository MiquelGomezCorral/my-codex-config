---
name: codegraph-setup
description: "CodeGraph MCP server setup — install, index, and configure semantic code search. Use when setting up CodeGraph in a new repo, re-indexing, or troubleshooting codegraph MCP."
---

# CodeGraph Setup

Check whether CodeGraph is installed with `command -v codegraph`. In this managed Codex setup, install or repair it through `bootstrap.sh`; do not run `codegraph install`, because `codex/config.toml` already owns the MCP configuration. On an unmanaged machine, follow the official installer.

Initialize the current project:
```bash
codegraph init
codegraph index >/dev/null
```

## MCP config

CodeGraph is configured as an MCP server in `codex/config.toml`:
```json
"codegraph": {
  "type": "local",
  "command": ["codegraph", "serve", "--mcp"]
}
```

On macOS with Homebrew: `/opt/homebrew/bin/codegraph serve --mcp`

## MCP tools

Use the live MCP tool descriptions; the available CodeGraph tools vary by installed
version. Do not infer the tool surface from this setup skill.

## After indexing

- The watcher keeps the graph current after initialization. Use `codegraph sync` only when the watcher is disabled or a script needs an explicit incremental update.
- Restart Codex after the first index so the MCP server exposes the live CodeGraph tools for the project.
- Without a `.codegraph/` directory, the MCP server exposes no tools.
