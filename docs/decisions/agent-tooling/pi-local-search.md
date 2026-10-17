# Pi local search

## Intent

Pi receives CodeGraph and web research without paid search services or Codex search delegation.

## Current decisions

- The shared bootstrap_common.sh owns SearXNG container deployment, enabled by default with the existing opt-out; all four dedicated bootstraps call it and reuse installed dependencies.
- Pi setup owns native MCP integration; the shared installer provides the connector independently of service availability.
- Reuse existing local infrastructure, including CodeGraph and the running SearXNG service.
- Docker must already be installed and running; setup does not install Docker.
- Codex keeps its native web search separately from Pi's SearXNG search.

## Protected invariants

- Offline or missing SearXNG services do not remove Pi's installed connector configuration.
- Pi must not fall back to paid search APIs or delegate search to Codex.
- The Pi adapter does not implement SearXNG container lifecycle; it calls the shared installer that owns it.
- Existing OpenCode-owned deployment and unrelated configuration remain preserved. Reviewers keep read-only task instructions while all configured tools are available.

## Rationale and tradeoffs

Reuse local infrastructure and avoid coupling Pi to Codex authentication or paid search services.
Separate connector installation from service availability so Pi remains configured when the service is offline.
The complete local search flow requires a working Docker installation and a running SearXNG service.

## Enforcement

- Bootstrap/configuration checks: [bootstrap tests](../../../tests/bootstrap.test.sh) and [configuration tests](../../../tests/codex-config.test.mjs).
- Review-only: verify [search-routing instructions](../../../config/skills/web-search/SKILL.md) preserve the chosen provider boundary; static checks cannot prove future agent behavior.

## History

- 2026-10-03: User approved one shared installer used by all four native bootstraps, with dependency reuse and full tools governed by role/task instructions.

- 2026-09-18: Approved local Pi search through MCP, main-bootstrap SearXNG ownership, and the prerequisite that Docker be installed and running.
