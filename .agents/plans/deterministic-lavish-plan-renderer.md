# Deterministic Lavish Plan Renderer

## Summary

Replace the default visualization worker with a deterministic renderer. The authoritative Markdown plan supplies the content; a bundled Node script owns the HTML structure, responsive styling, and Lavish `luxury` palette.

Normal plan rendering uses no secondary model. DeepSeek V4 Flash remains available only when the user explicitly requests a custom diagram.

## Implementation Changes

- Add `plan-implementation/scripts/render-plan.mjs` with this interface:
  - `node render-plan.mjs --input <plan.md> [--output <artifact.html>]`
  - Without `--output`, create a unique artifact under `/tmp`.
  - Print only the absolute HTML path on success; exit nonzero with a concise error otherwise.
- Render the native Markdown safely and deterministically:
  - Support headings, paragraphs, ordered/unordered lists, fenced code, inline code, emphasis, links, and pipe tables.
  - Escape source HTML and unsafe links.
  - Preserve unsupported syntax as readable escaped text rather than dropping it.
  - Include the exact source plan in a collapsed “Native plan” section for fidelity.
- Pin the current Lavish design direction:
  - `<html data-theme="luxury">`.
  - DaisyUI 5.5.19 theme/stylesheets.
  - Explicit readable background/text fallbacks when the CDN is unavailable.
  - Namespaced `.lp-*` layout CSS and Lavish layout-safety rules.
  - No Tailwind browser runtime, JavaScript, SVG, project inspection, or model-selected palette.
- Change `$plan-implementation`:
  - Write the approved native plan verbatim to temporary Markdown.
  - Run the renderer, then `npx -y lavish-axi <artifact.html>`.
  - Return the clickable absolute artifact path as the primary link.
  - Do not launch an agent during the normal path.
  - If the user explicitly requests a custom diagram, use Pi’s cataloged `medium` model at `low` thinking and require the same `luxury` palette; this opt-in path may be slower.
  - Rendering or Lavish failures remain non-blocking and never replace the native plan.

## Test Plan

- Update the existing skill contract test only after the renderer exists:
  - Default path invokes the deterministic script and does not delegate.
  - Diagram delegation requires explicit user intent.
  - Artifact links prefer absolute file paths.
- Add renderer checks using temporary inputs:
  - Stable input produces byte-identical HTML.
  - Long sandbox plan renders all headings, lists, tables, code, tests, and assumptions.
  - HTML and unsafe links are escaped.
  - Output uses `luxury`, pinned DaisyUI versions, namespaced CSS, and explicit fallback colors.
  - Missing/empty input and unwritable output fail without partial artifacts.
- Benchmark the same long plan:
  - Renderer itself under one second.
  - Warm end-to-end render and Lavish open target under 15 seconds.
  - Cold `npx` path target under 30 seconds.
  - Zero visualization-model tokens on the default path.

## Assumptions

- Node is the only runtime dependency; no new package or global installation is added.
- The generic deterministic layout prioritizes consistency and speed over plan-specific illustrations.
- The native Markdown plan remains authoritative for `$review-plan` and `$code`.
- DeepSeek V4 Flash remains the explicit custom-diagram fallback, not part of normal rendering.
