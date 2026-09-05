# Codex TUI Markdown Colors

## Goal

Make assistant Markdown in the normal terminal `codex` command easier to scan by
adding OpenCode-inspired colors on top of Codex's existing Markdown styles.

Keep Codex's current layout, parser, streaming, wrapping, tables, heading markers,
and text modifiers. This is a small renderer patch, not a new frontend or plugin.

## Visual Contract

| Markdown element | Keep from Codex | Add color |
|---|---|---|
| Body text | Current rendering | Current foreground |
| Headings | Existing bold, underline, or italic modifiers | Purple `#9d7cd8` |
| Strong | Bold | Orange `#f5a742` |
| Emphasis | Italic | Yellow `#e5c07b` |
| Inline code | Current code treatment | Green `#7fd88f` |
| Links | Underline | Peach `#fab283` |
| Blockquotes | Current quote rendering | Yellow `#e5c07b` |
| Unordered-list markers | Current marker | Peach `#fab283` |
| Ordered-list markers | Current marker | Cyan `#56b6c2` |
| Horizontal rules | Current rule | Gray `#808080` |
| Strikethrough | Current rendering | Unchanged |

Use these fixed colors for the current dark-terminal setup. Do not add theme
configuration until another theme is actually needed.

## Smallest Implementation

1. Clone the official Codex source into a separate development directory. Do not
   vendor it into this configuration repository.
2. Start from the Codex version currently in use.
3. Change the color fields in `codex-rs/tui/src/markdown_render.rs`, primarily in
   `MarkdownStyles::default()`. Change the separately rendered horizontal rule if
   needed.
4. Keep the patch as one focused commit so it can be reapplied to later upstream
   versions.
5. Build the Codex executable with the repository's documented Rust build command.
6. Install the custom executable outside Orca's managed release directory and make
   the shell's `codex` command point to it. Keep the official executable available
   as a fallback.

No parser rewrite, plugin system, browser UI, OpenCode layout clone, new dependency,
or general theming framework is part of this work.

## Acceptance Check

Build and run the custom `codex`, then render this sample in an interactive terminal:

```markdown
# Heading one
## Heading two
### Heading three

Normal text with **strong**, *emphasis*, ~~strikethrough~~, `inline code`, and a
[link](https://example.com).

> Blockquote

- Unordered item
1. Ordered item

---
```

Accept the patch when:

- Every element matches the visual contract above.
- Existing bold, italic, underline, and strikethrough modifiers remain visible.
- Streaming text, wrapping, lists, links, code blocks, and tables still behave as
  before.
- The relevant existing Codex Markdown-renderer tests pass.
- Running `codex --version` confirms the shell selects the custom build.

## Updating Codex

For each upstream release: fetch it, apply or rebase the single color commit, run the
same checks, build a new executable, and replace the previous custom executable only
after it passes. Manual work is needed only when upstream changes the same renderer
lines or its styling API.

## Known Limits

- Official Codex updates do not rebuild the custom executable automatically.
- Fixed RGB colors target a dark terminal and may be poor on a light background.
- The patch affects the terminal Codex TUI only; Orca or other Codex frontends keep
  their own rendering.
