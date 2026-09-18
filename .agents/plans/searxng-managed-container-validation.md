# Validate stopped SearXNG containers before restart

## Summary

Fix the remaining restart-path bug and close the success-message test gap. Keep the change limited to `bootstrap.sh` and `tests/bootstrap.test.sh`.

## Implementation

- When the managed container name already exists, inspect its `.Config.Image` before calling `docker start`.
- Reuse `searxng_image_matches` so restart accepts the same configured, tagged, and digest-pinned SearXNG images as running-container reuse.
- If image inspection fails or the image is unrelated, warn, leave the container untouched, and continue the remaining bootstrap steps.
- Preserve the existing startup check, nonfatal failure behavior, Pi connector configuration, and all public CLI behavior.

## Tests

Extend the existing Docker stub coverage to verify:

- A stopped managed-name SearXNG container is started and prints success only after its stable startup check.
- A stopped managed-name container with an unrelated image is not started, produces a warning, and preserves the Pi connector.
- A stopped managed-name container whose image cannot be inspected is also left untouched with a warning.
- Stable create and restart paths print their expected success messages.
- Immediate exit, restart, and inspection-failure cases for both create and restart never print either SearXNG success message.

Run `bash -n`, `./bootstrap.sh --check`, the Node test suite, `bash tests/bootstrap.test.sh`, and `git diff --check`. Review the resulting scoped diff separately.

## Assumptions and records

- No new dependencies, flags, documentation, MCP behavior, container removal, or live Docker operations.
- Existing explicit MCP imports remain preserved.
- Decision records: no change — this correction enforces the existing requirement to preserve unrelated containers.
- Record changes: none.
- Enforcement: bootstrap image validation and isolated regression tests.
