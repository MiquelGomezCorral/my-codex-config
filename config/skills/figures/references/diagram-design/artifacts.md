<!-- diagram-design-profile
name: Artifacts
slug: artifacts
source-url: none
created: 2026-10-18
updated: 2026-10-18
notes: Artifact page palette and system font, light and dark columns
-->
# Style Guide

**The single source of truth for colors, typography, and tokens.** Every diagram draws from this — not from hex values inlined in other reference files. If you want to change the visual skin of Diagram Design, change this file.

The `artifacts` skin makes a figure sit on an artifact page: card white and card ink, the page's
blue accent, and the page's own system font, in a light and a dark column that match the page
tokens (`--card`, `--ink`, `--muted`, `--muted-tone`, `--mutedbg`, `--acc`) in both themes.
Draw every diagram twice, once per column, and show the light SVG in `figure.src` and the dark
one in `figure.dark`.

---

## Tokens

### Semantic roles

Every token is referred to by **semantic role**, not by its hex value. Type references (`type-*.md`) and SKILL.md say `accent`, not `#f7591f`.

| Role | Purpose | Light | Dark |
|---|---|---|---|
| `paper` | Page background, default node fill (the page `--card`) | `#ffffff` | `#1d1d21` |
| `paper-2` | Diagram container bg, secondary fill (the page `--mutedbg`) | `#ececf0` | `#2a2a30` |
| `ink` | Primary text, primary stroke (the page `--ink`) | `#1d1d1f` | `#ececf0` |
| `ink-strong` | High-contrast text on warm accent fills | `#111111` | `#111111` |
| `muted` | Secondary text, default arrow stroke (the page `--muted-tone`) | `#5b5b66` | `#b9b9c4` |
| `soft` | Sublabels, boundary labels (the page `--muted`) | `#6b6b70` | `#a0a0aa` |
| `rule` | Hairline borders (`ink` at 12 %) | `rgba(29,29,31,0.12)` | `rgba(236,236,240,0.14)` |
| `rule-solid` | Stronger borders, baselines (`soft` at 40 %) | `rgba(107,107,112,0.40)` | `rgba(160,160,170,0.40)` |
| `accent` | Focal / 1–2 max per diagram (the page `--acc`) | `#2f5bd3` | `#8fb0ff` |
| `accent-tint` | Fill for accent-bordered boxes (`accent` at 8 % light, 12 % dark) | `rgba(47,91,211,0.08)` | `rgba(143,176,255,0.12)` |
| `link` | HTTP/API calls, external arrows (artifact series 6, teal) | `#1b7f8c` | `#5ccfdc` |

> **Palette source:** the artifact page tokens and the shared figure palette (Pele, Plotly and
> this skin use the same values). `rule`, `rule-solid`, `accent-tint` and `link` are derived: the
> page has no token for them. `link` is the teal series colour so it differs from the blue
> `accent`. Every `ink`, `muted` and `soft` pair clears 4.5:1 on its `paper`; `accent` and `link`
> clear 4.5:1 too.

### Inversion rule (light → dark)

Any `rgba(29,29,31, X)` in light becomes `rgba(236,236,240, X)` in dark. Same opacities, RGB flipped. The accent is the lighter blue `#8fb0ff` to read on `#1d1d21`.

### Series palette (multi-series chart types only)

A small set of colors, the page's series palette without its blue (the blue is `accent`), for chart types that genuinely need to distinguish multiple overlapping entities (currently: **radar**). The "1-focal" rule still holds — `accent` is reserved for the focal series; the palette below covers the rest.

| Token | Light | Dark | Notes |
|---|---|---|---|
| `series-1` | `#d96f00` (orange) | `#ffa24d` | Non-focal series |
| `series-2` | `#1f7a4d` (green) | `#5fd394` | Non-focal series |
| `series-3` | `#b03a9a` (magenta) | `#e58ad2` | Non-focal series |
| `series-4` | `#1b7f8c` (teal) | `#5ccfdc` | Non-focal series |
| `series-5` | `#6b52c0` (violet) | `#b9a2ff` | Non-focal series |

Fills sit at `0.18` opacity light, `0.22` dark; strokes use the full color. **Don't backfill these tokens to non-chart types** — architecture, swimlane, etc. continue to use muted-ink variants. The series palette is opt-in for diagrams where overlapping shapes demand distinguishable color, not a license to add color elsewhere.

### Terminal skin (opt-in alternate)

A self-contained palette for the terminal-window primitive (see [primitive-terminal.md](primitive-terminal.md)) — a CLI-chrome register for dev-tool posts and technical social cards. It does not replace the default skin above and isn't affected by onboarding; it's a second, fixed skin you opt into per-diagram.

| Token | Hex | Purpose |
|---|---|---|
| `terminal-page` | `#0a0a0a` | Page background behind the window |
| `terminal-paper` | `#141414` | Window body, node fill |
| `terminal-bar` | `#1b1b1b` | Titlebar strip |
| `terminal-border` | `#2b2b2b` | Window border, hairlines |
| `terminal-ink` | `#f5f5f5` | Primary text, primary stroke (same white-smoke as default `ink`) |
| `terminal-muted` | `#9a9a9a` | Secondary text, sublabels, ring stroke |
| `terminal-soft` | `#5c5c5c` | Tertiary — inactive dots, spokes |
| `terminal-accent` | `#ff5a36` | The one accent — focal station, prompt sign, active dot |
| `terminal-accent-tint` | `rgba(255,90,54,0.12)` | Fill for accent-bordered boxes |

**1-accent rule still holds.** Everything that isn't `terminal-ink` or `terminal-muted`/`terminal-soft` should be `terminal-accent` — never introduce a second hue.

---

## Typography

| Role | Family | Size | Weight | Usage |
|---|---|---|---|---|
| `title` | `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | 1.75rem | 600 | Page H1 |
| `node-name` | `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | 12px | 600 | Human-readable labels |
| `sublabel` | `ui-monospace, SFMono-Regular, Menlo, monospace` | 9px | 400 | Port, protocol, URL, field type |
| `eyebrow` | `ui-monospace, SFMono-Regular, Menlo, monospace` | 7–8px | 500, tracked 0.18em, uppercase | Type tags, axis labels |
| `arrow-label` | `ui-monospace, SFMono-Regular, Menlo, monospace` | 8px | 400, tracked 0.06em | Arrow annotations |
| `callout` | `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` *italic* | 14px | 400 | Editorial asides only |

### Font stack

The page font, so a figure reads like the text around it. No web font link and no network:

```css
--font-sans:  system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
--font-serif: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
--font-mono:  ui-monospace, SFMono-Regular, Menlo, monospace;
```

Put these three lines in the working HTML's `:root` and write the same families in each SVG
`font-family`. Do not load Google Fonts. System fonts vary in width (Roboto, Segoe UI and
DejaVu differ by a few percent), so leave 12 % free room in every box and keep the 12px floor for
names; measure widths at 0.62em, not the Geist 0.60em.

Non-Latin labels: the system stack falls back per script. Keep names at 12px or more and size boxes
by 1em per full-width glyph.

**Load-bearing rule:** Mono is for *technical* content (ports, commands, URLs, field types). Names go in the sans.

---

## Stroke, radius, spacing

| Token | Value | Use |
|---|---|---|
| `stroke-thin` | `0.8` | Tag-box outlines, leaf nodes |
| `stroke-default` | `1` | Most strokes |
| `stroke-strong` | `1.2` | Emphasis strokes |
| `radius-sm` | `4` | Small tags |
| `radius-md` | `6` | Node boxes |
| `radius-lg` | `8` | Containers, rings |
| `grid` | `4` | Every coord, size, and gap is divisible by 4 (hard rule) |

---

## Node type → treatment

Semantic role combinations — reference these by name in type specs.

| Type | Fill | Stroke |
|---|---|---|
| `focal` (1–2 max) | `accent-tint` | `accent` |
| `backend` | `paper` light, `paper-2` dark | `ink` |
| `store` | `ink @ 0.05` | `muted` |
| `external` | `ink @ 0.03` | `ink @ 0.30` |
| `input` | `muted @ 0.10` | `soft` |
| `optional` | `ink @ 0.02` | `ink @ 0.20` dashed `4,3` |
| `security` | `accent @ 0.05` | `accent @ 0.50` dashed `4,4` |

---

## Customizing the skin

Four options:

1. **Run onboarding** — see [`onboarding.md`](onboarding.md). Drop a URL; the skill extracts the palette + fonts and rewrites this file.
2. **Edit by hand** — change the hex values in the tables above. Run the pre-output taste gate afterward to verify the accent still reads as "focal" against the new paper color.
3. **Brand handoff** — paste your existing design-token JSON into a new section here and map its tokens to the semantic roles above.
4. **Client profiles** — save and switch named skins, or bind one to a project, using [`profiles.md`](profiles.md).

### Constraints (don't break these)

- **Contrast**: `ink` must hit WCAG AA on `paper`. `muted` must hit AA on `paper` for 11px+ text.
- **One accent**: pick one color for `accent`. Two accents erases the focal signal.
- **No rainbow palette**: if your brand ships 8 colors, pick 3 (paper, ink, accent). The rest become `muted` variants.
- **Sans + mono**: two families, the page font and its monospace. The page's own typography is all sans, so `title` and `callout` use it too; the exported SVG carries no title text.
- **Paper is the page card**: `#ffffff` light and `#1d1d21` dark, on purpose, so the figure has no frame of its own on the page.
- **Dot pattern is optional, not default**: the 22×22 dot pattern is an opt-in "dotted paper" variant (good for long-form editorial hero diagrams). The default background is a clean `paper` fill, no pattern. When the pattern is enabled, it should sit at ~10% opacity of `ink` on `paper` — visible but quiet.
- **Container is clean by default**: the diagram sits directly on the page paper, no secondary container background or border. A framed variant (`paper-2` bg + `rule` border + 8px radius + padding) is available as an opt-in for card-heavy layouts, but don't reach for it by default — the extra chrome fights the figure.
