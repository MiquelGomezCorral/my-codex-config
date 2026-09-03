---
name: btca-first
description: Source-first SDK and framework research with btca. Use when implementation, review, or an answer depends on current external-library behavior; skip stable repository-local conventions.
---

# BTCA-First Research

1. Inspect the live resource catalog; never assume a resource name exists.
2. Identify the narrow external behavior that needs fresh evidence.
3. Choose the fewest relevant configured resources, HTTPS Git URLs, or npm references.
4. Ask one implementation-shaped question through BTCA before relying on memory.
5. Preserve supporting paths or URLs and distinguish source evidence from inference.
6. If BTCA is unavailable or incomplete, say so and fall back to local integration
   code plus official source or documentation.

Do not skip local code inspection when the task asks how the repository already uses
the SDK. When repository behavior and upstream guidance disagree, surface the mismatch.
Use `btca-cli` only for setup, resource management, or CLI troubleshooting.
