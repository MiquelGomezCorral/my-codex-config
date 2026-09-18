# Fix SearXNG detection and startup checks

## Summary

Correct the two validated bootstrap issues with focused changes to `bootstrap.sh` and its existing tests. Preserve the OpenCode-owned deployment and continue other installation steps when SearXNG fails.

## Implementation

- **Verify existing service identity.** For a container publishing port 8080, inspect its configured image before announcing reuse. Accept `searxng/searxng` and `docker.io/searxng/searxng`, including tags and digests, or the exact configured `SEARXNG_IMAGE`. Docker exposes this through `.Config.Image`. [Docker documentation](https://docs.docker.com/reference/cli/docker/inspect/)
- An unrelated image or failed inspection produces an occupied-port warning and skips deployment. Leave that container untouched. Your current digest-pinned SearXNG image qualifies for reuse.
- **Check both startup paths.** Add one shared check after successful `docker run` and `docker start`: inspect container state once per second for five seconds. Require it to remain running without restarting; warn on a failed inspection, non-running state, or restart during that window.
- Print startup success only after this check passes. Failures remain non-fatal and identify the container for troubleshooting; do not automatically remove, recreate, or upgrade it.

## Verification

Extend `tests/bootstrap.test.sh` using its isolated homes and Docker stubs:

- Recognized existing SearXNG is reused without starting another container.
- An unrelated port-8080 container or failed identity inspection produces a warning.
- Both creation and restart cover sustained running, immediate exit, restart during observation, and inspection failure.
- Failure cases still complete configuration installation and preserve Pi’s connector.
- Stub sleep so tests stay fast; retain existing opt-out and check-only coverage.

Run shell syntax checks, `./bootstrap.sh --check`, the repository Node tests, `bash tests/bootstrap.test.sh`, and `git diff --check`. Independently review the resulting diff.

## Boundaries and defaults

- No new dependencies, CLI flags, MCP changes, or README changes.
- The five-second check detects early container failure; it does not certify search readiness or future availability.
- No live installation, container lifecycle changes, or commits during implementation verification.
- **Decision records: no change** — these fixes enforce the existing approved behavior. Record/index changes: none. Enforcement: bootstrap guards and regression tests.
