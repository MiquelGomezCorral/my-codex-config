# Rework the Lavish Plan as an Editorial Brief

## Summary

The plan should read like a compact technical document, not a dashboard. Borrow the upstream Lavish principles—stable reading width, restrained hierarchy, and layouts chosen by content—without inventing metrics, timelines, or extra UI. The [upstream plan example](https://github.com/kunchenguid/lavish-axi/blob/main/test/fixtures/layout-audit/real-plan-clean.html) reserves columns for genuinely comparable data, while its [brand guidance](https://github.com/kunchenguid/lavish-axi/blob/main/lavish-editor-marketing/DESIGN.md) favors restraint and avoids decorative gradients and shadows.

```text
APPROVED PLAN
Fix Sandbox Authoring Review Findings
One-sentence summary
─────────────────────────────────────

Implementation Changes

Policy Hook       – First change
                  – Second change
─────────────────────────────────────
Prompts           – First change
                  – Second change
─────────────────────────────────────
Evaluations       – First change
                  – Second change

Test Plan
Policy tests      – ...
Evaluation tests  – ...
Run               command list

Assumptions
│ Short assumption list

Native plan ▸
```

## Implementation Changes

- Replace the large hero card with a compact document header:
  - small eyebrow;
  - title capped around `36px`;
  - readable summary width;
  - thin divider;
  - no gradient, large shadow, or duplicated section chips.

- Replace automatic card grids with deterministic plan rows:
  - group title in a narrow left column;
  - group content in the wider right column;
  - subtle separators instead of a heavy box around every item;
  - stack title above content on narrow screens.

- Improve plan typography:
  - constrain the page to roughly `64rem`;
  - keep prose near `70ch`;
  - reduce section-heading and card-title sizes;
  - use tighter but consistent section spacing.

- Make list structure unmistakable:
  - render unordered items with explicit `–` markers;
  - retain numbers for ordered lists;
  - preserve nested indentation with a subtle guide line;
  - keep status badges inline without replacing the bullet.

- Choose layouts only from source semantics:
  - nested implementation groups become plan rows;
  - Markdown tables remain responsive tables;
  - command groups use the existing command treatment;
  - plain Summary and Assumptions remain simple prose or restrained callouts.
  - Never infer dashboards, metrics, timelines, or multi-column cards from item count.

- Keep the existing luxury colors, parser, escaping, CLI, deterministic execution, and no-poll behavior unchanged. Add no dependency, font download, JavaScript, or model call.

## Test Plan

- Update the existing renderer check to verify plan rows, compact title styling, explicit dash markers, and absence of the auto-fit grid.
- Preserve the existing table, nested-list, command, status, escaping, and deterministic-output checks.
- Render the long sandbox plan and inspect desktop and narrow layouts:
  - Implementation and Test Plan groups remain vertically readable;
  - no cramped three-column cards;
  - title does not dominate the viewport;
  - bullets and group boundaries are immediately visible.
- Open the artifact once through Lavish and return the direct absolute HTML link.

## Assumptions

- The target is an editorial technical brief, closest to screenshot 1’s reading flow with screenshot 2’s compact density.
- Color palette and status colors stay unchanged.
- Only the renderer and its existing focused assertions need changes; the skill workflow remains untouched.
