---
name: codegraph-setup
description: "CodeGraph MCP server setup — install, index, and configure semantic code search. Use when setting up CodeGraph in a new repo, re-indexing, or troubleshooting codegraph MCP."
---

# CodeGraph Setup

Check whether CodeGraph is installed with `command -v codegraph`. In this managed setup,
all four `bootstrap_*.sh` commands call `bootstrap_common.sh`, which installs the official
`@colbymchenry/codegraph@1.6.0` package only when missing. Do not run `codegraph install`,
because the shared MCP inventory owns the server definition. On an unmanaged machine,
follow the official installer.

Initialize the current project:
```bash
codegraph init
codegraph index >/dev/null
```

The bootstrap never indexes a project automatically. Run those commands once per project,
then restart the harness so its MCP tools are discovered. Use `--no-searxng` to skip the
shared Docker service and `--no-searxng-mcp` to skip the connector and managed SearXNG
entry.

## MCP config

`config/mcp.json` owns the CodeGraph source entry. Each bootstrap translates it to the
harness's native MCP format while preserving unrelated native entries.

On macOS with Homebrew: `/opt/homebrew/bin/codegraph serve --mcp`

## MCP tools

Use the live MCP tool descriptions; the available CodeGraph tools vary by installed
version. Do not infer the tool surface from this setup skill.

## After indexing

- The watcher keeps the graph current after initialization. Use `codegraph sync` only when the watcher is disabled or a script needs an explicit incremental update.
- Restart the selected harness after the first index so its MCP server exposes the live
  CodeGraph tools for the project.
- Without a `.codegraph/` directory, the MCP server exposes no tools.
