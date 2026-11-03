# Tailwind CSS

How to apply `ui.md` with Tailwind v4 (read against the v4.3 docs on 2026-11-03). It adds
class-level mechanics and never repeats a `ui.md` rule. Check the project's version first;
v3 names differ.

- **Write every class name as a full literal.** `text-${color}-500` or `'bg-' + color`
  generates no CSS and nothing warns, because Tailwind scans source as plain text. Map
  variants to full class strings in an object.
- **Draw focus with `focus-visible:outline-2 outline-offset-2`**, not `ring-*` (a box-shadow).
  Hide the default outline with `outline-hidden`; in v4 `outline-none` sets
  `outline-style: none`, which also removes it in forced-colors mode.
- **`hover:` applies only inside `@media (hover: hover)`.** A control revealed with
  `opacity-0 group-hover:opacity-100` never shows on touch; add `focus-visible:` and
  `group-focus-within:` and keep it visible where there is no hover.
- **`dark:` follows the OS by default.** For an app theme toggle, declare
  `@custom-variant dark (&:where(.dark, .dark *));` (or a `data-theme` selector).
- **Use v4 names.** `shadow-xs`, `shadow-sm`, `rounded-xs`, `rounded-sm` replace the v3
  `shadow-sm`, `shadow`, `rounded-sm`, `rounded`; `bg-(--brand)` replaces `bg-[--brand]`;
  the important flag goes last (`flex!`).
- **Give every `border` and `divide` utility a color.** The v4 default is `currentColor`,
  not the v3 gray.
- **Configure in CSS:** `@import "tailwindcss";` and `@theme`. A JS config loads only through
  `@config`; `safelist`, `corePlugins` and `separator` are unsupported (use
  `@source inline()`).
- **`motion-reduce:` is the reduced-motion switch** (`motion-reduce:transition-none`).
- **Merge a component's `className` with the project's `cn` helper or `twMerge`**; plain
  concatenation keeps both `p-2` and `p-4` and CSS order, not the caller, picks the winner.
  Add the dependency only when the project lacks one and needs it.
- **v4 targets Safari 16.4+, Chrome 111+, Firefox 128+** (it needs `@property` and
  `color-mix()`). Check the project's support list before upgrading.
