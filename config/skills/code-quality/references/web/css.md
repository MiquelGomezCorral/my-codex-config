# CSS

How to apply `ui.md` in plain CSS. It adds browser mechanics and never repeats a `ui.md` rule.
Rules marked *checked* were read on the official page on 2026-11-03.

- **Size a component by its container (`@container`)** when it can sit in slots of different
  widths. A viewport breakpoint on a card in a narrow sidebar and a wide grid picks the wrong layout.
- **Style a parent from its children with `:has()`**, not JS that toggles a wrapper class.
- **Use `svh` or `dvh` for full-height screens, not `vh`.** `vh` equals `lvh`, the largest
  viewport, so retractable mobile bars can hide content. `svh` is stable; `dvh` fits exactly
  but resizes while the user scrolls. *Checked:* MDN `<length>`.
- **Set `color-scheme` on the root for each theme**, so native inputs, selects and scrollbars
  match. A dark theme otherwise ships white native controls.
- **Order overrides with `@layer`**, not `!important` or higher specificity.
- **`field-sizing: content` grows a text field with its text.** Bound it with `min-width` and
  `max-width`; fixed `width` or `height` cancels it. Baseline "newly available" since June
  2026, so keep a fallback for older browsers. *Checked:* MDN `field-sizing`.
- **`text-wrap: balance` for headings and short blocks, `pretty` for body copy.** `balance`
  only works up to 6 lines in Chromium and 10 in Firefox; longer blocks wrap as usual.
  `pretty` is a slower algorithm that keeps orphans down. *Checked:* MDN `text-wrap-style`.
- **Style focus with `:focus-visible`, not `:focus`**, and give the outline a visible color; a
  transparent outline counts as none.
- **Native inputs, selects and buttons do not inherit the page font.** Set `font: inherit`.
- **A `position: fixed` child of an ancestor with `transform`, `filter`, `perspective` or
  `contain: paint` is placed against that ancestor, not the viewport.** Render overlays
  outside such ancestors (`<dialog>`, popover API).
- **Animate interactive state with CSS transitions** (they can be interrupted midway); keep
  keyframes for one-shot sequences.
- **Set `transform-origin` on menus and popovers to the trigger side**, so they grow from it.
- **Wrap hover-only styles in `@media (hover: hover)`**, so a tap leaves no stuck hover state.
- **Reserve media space with `aspect-ratio`, or `width` and `height`**, so images do not
  shift the layout when they load.
- **Grow a small control's hit area with an `::after` pseudo-element**; two hit areas must
  not overlap.
- **`font-feature-settings` overrides `font-variant-numeric`.** Set tabular numbers with one
  of them, not both.
