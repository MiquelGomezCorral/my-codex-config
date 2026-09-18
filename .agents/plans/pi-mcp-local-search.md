# Pi MCP, CodeGraph, and local SearXNG setup

## Summary

Extend the setup so Pi has CodeGraph and SearXNG through MCP, without paid search APIs or Codex search delegation. The main bootstrap owns SearXNG deployment; Pi installs and configures its connector independently.

**README prerequisite: Docker must already be installed and running for the full setup to work.** Setup will not install Docker.

## Installation behavior

- Main bootstrap deploys SearXNG by default. Add `--no-searxng` to skip deployment without disabling Pi’s connector.
- Reuse the existing SearXNG service at `http://localhost:8080`. Do not modify its OpenCode-owned deployment.
- On fresh machines, use the [official SearXNG Docker image](https://docs.searxng.org/admin/installation-docker.html), bound to `127.0.0.1:8080`, with persistent configuration/data and automatic restart. Enable JSON search responses.
- Store new deployment state outside the repository under the user’s XDG data directory. Repeated setup reuses the managed container without resetting settings or upgrading it.
- Missing/unavailable Docker, occupied ports, or container startup failures produce a clear warning; other installation steps continue.
- Install missing CodeGraph using the official npm package, initially pinned to `@colbymchenry/codegraph@1.6.0`. Reuse an existing installation. Share this dependency step between main and standalone Pi setup; do not initialize project indexes automatically.

## Pi integration

- Extend `bootstrap_pi.sh --install-extension`, already invoked by `bootstrap.sh --pi`, to install:
  - The existing subagent package.
  - [`pi-mcp-adapter@2.34.0`](https://github.com/nicobailon/pi-mcp-adapter).
  - `mcp-searxng@1.11.1`, matching the existing connector version, even when SearXNG is offline.
- Merge two entries into Pi’s `mcp.json`: `codegraph serve --mcp` and `mcp-searxng`, with `SEARXNG_URL=http://localhost:8080`.
- Preserve unrelated settings and servers; back up changed configuration. Respect `PI_CODING_AGENT_DIR`.
- Use the adapter’s direct-tool support and lazy connections. CodeGraph runs in the active project directory and uses the same project index as Codex.
- Add `--no-searxng-mcp` to Pi setup and forward it through the main bootstrap. It disables the managed SearXNG connector without stopping the service or removing unrelated configuration.
- Keep automatic imports from other harnesses disabled. Preserve existing reviewer restrictions rather than granting access to arbitrary MCP tools.
- Update shared search instructions: Codex uses native search; Pi uses SearXNG search and URL-reading tools. Unavailable services produce an explicit limitation, with no paid fallback.
- Update CodeGraph instructions and README with setup commands, Docker prerequisites, project indexing, restart requirements, and both opt-out flags.

## Verification

- Extend existing bootstrap tests using isolated homes and stubbed package/container commands: fresh install, repeat install, configuration preservation, both opt-outs, missing Docker, existing service, and failed service startup.
- Verify that check-only commands never install packages or start containers.
- Verify Pi configuration remains installed when SearXNG is unavailable and CodeGraph uses the project directory.
- Run bootstrap validation, focused configuration tests, bootstrap tests, and diff checks.
- Before live installation, review the resulting changes. Subsequent live validation should confirm Pi can query an indexed project, search through SearXNG, and read a result URL. Do not stop the existing shared container to simulate failure.

## Decision records

**Decision records: create** — preserve the choice of local tools and separate service ownership.

Create `docs/decisions/agent-tooling/pi-local-search.md` using the record template, and initialize/link it from the index. Record:

- **Intent:** Pi receives CodeGraph and web research without paid search services.
- **Decisions/invariants:** main bootstrap owns container deployment; Pi owns MCP integration; offline services do not remove connector configuration; Codex search remains separate.
- **Rationale:** reuse existing local infrastructure and avoid coupling Pi to Codex authentication.
- **Enforcement:** bootstrap/configuration checks, plus review of search-routing instructions.
- **History:** the dated approval of this plan.

Personal `.agents/` memory remains unchanged.
