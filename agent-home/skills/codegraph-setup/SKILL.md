---
name: codegraph-setup
description: "CodeGraph MCP server setup — install, index, and configure semantic code search. Use when setting up CodeGraph in a new repo, re-indexing, or troubleshooting codegraph MCP."
---

# CodeGraph Setup

Check whether CodeGraph is installed with `command -v codegraph`. In this managed setup,
`./bootstrap.sh` and `./bootstrap_pi.sh` install the official
`@colbymchenry/codegraph@1.6.0` package when it is missing; do not run `codegraph install`,
because the Codex and Pi MCP configurations already own the server definition. On an
unmanaged machine, follow the official installer.

Initialize the current project:
```bash
codegraph init
codegraph index >/dev/null
```

The bootstrap never indexes a project automatically. Run those commands once per project,
then restart Codex or Pi so the MCP tools are discovered. `bootstrap.sh --pi` enables Pi's
local CodeGraph and SearXNG tools; `--no-searxng` skips only the main-owned Docker service,
while `--no-searxng-mcp` skips only Pi's SearXNG connector.

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
