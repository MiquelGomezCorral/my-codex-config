# UI

Rules for any change that renders an interface (HTML, CSS, React, Vue, Svelte, and similar).
Two layers:

- **Design rules** (this first part): judgment no tool measures. Placement, grouping,
consistency, color, wording, states.
- **Measured checks** (`lintapple`, below): real sizes, contrast, overflow and spacing on the
rendered page. The bootstrap installs it globally.

> **Must, on every UI change.** Open the running app before saying done. Check the main
> language, then every other shipped language. A state change moves nothing outside the changed
> part. Elements of one kind share size. Report numbers and what you did not check.

## Design rules

Defaults for product UI (dashboards, tools, lists, settings), where scanability, consistency
and standard controls win over novelty. Explicit user requirements and the project's own
design system come first; accessibility and protection against data loss always apply.
The rules already merge design-system guidance, agent UI skills and user feedback; the
sources at the end are documentation, not reading. Examples marked *seen* are real mistakes from agent-built pages; they illustrate a
rule, not a required layout.

### Before you build

- **Reuse the project's system first.** Its components, tokens, icon set and patterns beat
anything new. If the same detail exists two ways, one of them is a defect.
- **Name the one job of the screen and its focal element.** Make that win through position,
weight or space; demote everything else.
- **Build with real content.** Longest and shortest titles, a missing description, zero, one
and many items. Layouts break first on extreme content.
- **Never invent facts the user will read as real.** No made-up metrics, customer names,
logos or quotes. Use the project's data, or sample data plainly marked as sample.
- **Design every supported theme together**, not one then the other.
- **Design alternatives differ on one named question**, and the reply says what it is.

### Layout and space

- **Group by nearness before adding boxes or lines.** Tight inside a group, clearly more
space between groups. Reach for a divider only when space is not enough.
- **Give every item in a collection one anatomy.** Same fields, same order, same alignment
at each width. Text may wrap or be cut; corresponding parts and actions must not move. A missing
optional part must not shift its neighbors. *Seen:* cards put title, open icon and status
chip on different lines depending on title length. Fix: pick one anatomy (for example
logo, time and status on line 1, title on line 2) and apply it to every card.
- **Give actions one fixed home.** Same edge, same order, same slot in every row or card.
Never let a control float in the middle of free space. *Seen:* a trash button parked
mid-row with an empty gap on both sides.
- **Pin card actions and links to the card bottom.** Stretch cards to the row height and
push the footer down, so footers line up when descriptions differ; keep clear space
between body and footer. Let the card grow; never fix its height, and cut text only as
**Cut long values** describes.
- **Show each fact once.** If the title already says it, drop the repeated block or move it
to a details section.
- **Keep headers to the title and one quiet line.** Addresses, counts and utilities go to a
separate metadata or info area. *Seen:* host address and counts crowded beside a page
title.
- **Show what the user needs to identify and act on; hide the rest.** Internal names, run ids
and implementation detail go behind details or a tooltip; keep ids and paths the task
needs. *Seen:* "robot icon · claude · sonnet-5.5 · today 16:05" where a harness logo and
the time were enough.
- **Rows or tables for dense comparison; cards for summaries and visual content.** Keep
comparable cards identical in anatomy; avoid cards inside cards.
- **A column is as wide as its widest value**: no empty reserved width at the row edge, and a
status column fits its widest label so its left edge is straight.
- **One leading mark per row**, a selector or an icon, not both, unless the icon is the item's
identity. A status chip that qualifies a name sits beside the name.
- **Sibling groups share one heading pattern**, the title above its content, never in a side
column. Sections follow the order of the user's decisions; long lists go last.
- **Views in one flow share one container width**; a side panel is as tall as the form.
- **A phone layout hides no text the desktop shows**; a collapsed menu keeps items reachable.

### Actions and destructive actions

- **One visually primary action per area.** Rank the rest by style (filled, outlined, quiet),
not by size, and by how necessary each is: never demote the only way to do a task. Buttons in
one group share height and size.
- **Button labels never wrap** (`white-space: nowrap`). When space runs out, shorten the
label or move the action into the overflow menu.
- **Status and main actions lead; delete trails.** People look at the start of a row first,
so the status and the main action (Start, Stop) sit at the leading edge, and the delete or
remove control sits alone at the trailing edge, the same way everywhere:
  - list row: status and main action at the start, delete at the far end;
  - card footer: main actions at the bottom-left, delete at the bottom-right.
  Never two clusters floating apart in the middle, and never delete glued to Open or Start.
  Keep DOM order equal to visual order. Status trailing, with the main action shown on hover
  or focus in its slot, is the other valid layout. Follow what the app already does or what
  the user said; ask only when there is no clear evidence.
- **Hover-revealed controls go in fixed places.** A control that appears on hover sits either
at the trailing end of its row, or right after the text it belongs to (the link icon just
right of the title). Pick one place per kind of control and repeat it in every item.
- **Pick destructive emphasis by context:**
  - repeated rows: a quiet delete or remove icon; a nice touch, not a rule, is to show it
  only on row hover or keyboard focus and turn it red on its own hover. Hover-revealed
  controls stay visible on touch screens, which have no hover;
  - a standalone delete (settings, a danger area): always visible, labeled, red outline or
  text;
  - the confirmation: a filled red button.
  On the page, destruction is never the primary style, the Enter default or the first focus.
- **Mark danger with more than color**: position, a trash or stop icon, and a label or
tooltip.
- **Confirm deletes, revoking or disconnecting access, and stopping live work with a modal**,
even when the process can be restarted. Any change that loses access or data the user cannot
restore in one click warns first. Reversible changes (archive, remove a filter or chip) act
at once and show Undo. Start, Open and ordinary controls need neither. Type-the-name
confirmation only for rare, severe deletes.
- **Write the confirmation as a restatement.** The title names the action and the item
("Delete artifact-hub-plan?"); one line says the consequence; buttons are "Cancel" and
the verb ("Delete page"), never Yes/No/OK.
- **One button form per group.** All icon plus label, all icon-only, or all label-only.
*Seen:* an icon-only trash beside an icon-plus-text "Stop"; fix by adding "Delete", or by
making both icon-only with tooltips.
- **Icon-only only for glyphs everyone knows** (close, search, external link, copy, trash),
always with a tooltip and an accessible name. Beside labeled buttons, a destructive action
keeps its label.
- **Links navigate, buttons change state.** The link to the item itself is a bare link icon
just right of its title, not a boxed button in the action group.
- **Keep state-dependent actions in a predictable slot.** Start may become Stop in the same
place because Stop carries its modal. When an action is unavailable, say why instead of a
silent disabled button.
- **Up to two row actions stay inline as icon buttons; three or more go in an overflow
menu**, destructive item last and set off by a divider. An action appears once per screen,
inline or in the menu, never both. Add bulk actions ("Stop all") only when batch work is part
of the task, with the same safeguards as the single action.
- **Actions on a whole list sit in one fixed toolbar above it**, never inside explanatory text.
- **The action that fixes a warning sits inside that warning.**

### Consistency

- **Same thing, same look, same word, same place.** An action keeps its icon, label, color,
size and position on every screen. "Stop" is never also "Halt" or "Cancel".
- **Show an attribute on all comparable items or none.** If status chips are shown, every
item shows its real status in the same slot. *Seen:* a "serving" chip on some cards only.
Optional content (a description, a warning badge) appears only when it applies and never
displaces actions. A list and a grid of one collection show the same fields. A row whose data
cannot be read shows an error or unknown state, never a default that contradicts stored data.
- **One marker per state, separate from identity.** The same status gets the same labeled
indicator in every row; a different marker says "different state". Identity marks (a
harness logo) are allowed to differ, but must not look like status. *Seen:* a dotted
spinner on two running rows and an orange asterisk on the third.
- **A status indicator is a shape or icon, a color and a word, placed before the label** so
it aligns down the list. Never reuse one shape in different colors for different meanings.
A group summary takes its most urgent member's status. When a status needs no attention,
plain text is enough.
- **One title format.** Human titles in one case and style; raw slugs and ids only as
secondary text. *Seen:* "artifact-hub-discovery" next to "One page hub — result".
- **One icon family for controls**, stroke weight matched to the text beside it, outline by
default. Real logos stay as they are; never emoji or Unicode glyphs as icons. Icons and
markers in one row share one size and one center line with their text.
- **Consistent surfaces:** borders for structure, soft shadows only for raised layers (per
theme; dark uses lighter surfaces instead), one radius scale.

### Color and themes

- **Define colors as roles, never raw values.** Surface, raised surface, text (primary,
secondary, muted), border, accent, and danger, warning, success, info. Each role has a
value per theme, chosen together.
- **Soft colors that match come from one scale per hue**, with the same step roles for every
hue: a low-chroma tint of the hue as background, a high-contrast shade of the same hue as
text on it, the saturated step only for the one filled action and the danger confirm. The
steps flip between light and dark. This keeps pastel chips readable and of one family.
Never gray text on a tinted background.
- **Dark is composed, not inverted.** Dark gray surfaces rather than black, off-white text
rather than pure white, slightly desaturated lighter accents, elevation by lighter surfaces
or quiet borders instead of shadows.
- **One accent per view**, on actions, selection and state only, separate from status colors.
Secondary actions stay neutral. No decoration that competes with hierarchy or implies a
meaning (gradients, glows, colored side stripes).
- **One color, one meaning.** Red is danger and failure only; a red "stopped" teaches users
stopped means broken. Neutral states get neutral colors.
- **Never color alone.** Pair every status color with an icon or a word.
- **Soft is not low contrast.** Check muted text, text on tints and borders in every theme.

### Typography and wording

- **Reuse the project's type roles and scale.** One text family plus monospace; hierarchy
from weight and tone as much as size. The same role looks the same everywhere.
- **Headings form the outline:** levels step one at a time without skips, picked by structure
rather than size. Each page sets `lang` and a `<title>` that names it.
- **Monospace only for code, paths, ids and numbers**, never as a "technical" costume.
- **Cut long values; never let them move the actions.** In rows, cards and table cells, a
title, URL, path, command or id that does not fit stays on one line (a description on two;
metadata such as date, place and type always on one) and ends in "…", cut with CSS
(`text-overflow: ellipsis`, or `-webkit-line-clamp` for two lines) so screen readers still
get the full value. The cut text is focusable; hover, focus
or a tap opens a small panel with the full value, which stays while hovered or focused and
closes on Escape. Add a copy button there when people copy the value. When values share a
long start, such as paths in one folder, show the part that tells them apart (the folder or
file name) and leave the full path to the panel. The item's own details view, error
messages and body text wrap instead.
- **Running text is about 65–75 characters wide**, never over about 80.
- **Use the shortest correct word**, checked in every language. A helper note is one short
sentence; a summary line leaves out empty parts.
- **Sentence case for new labels**, keeping names, acronyms and user content as written. No
all-caps labels. An eyebrow above a heading is allowed only when it is informational (a
date, a scope); decorative eyebrows stay banned.
- **Buttons start with the verb.** Add the object when the button does not sit on it ("Stop"
in a row, "Delete page" in the confirmation). The result reuses the word: Stop,
"Stopping…", "Stopped".
- **Status words are adjectives**, one per state across the app ("Running", "Stopped").
- **Delete destroys; Remove takes out of a list.** Use the word that matches what happens and
say whether it is permanent.
- **Errors say what failed and what to do next**, next to the thing that failed.
- **Placeholders show an example or name what is searched**, ending with "…"; they never
replace a label.
- **A menu item that opens a follow-up step ends with "…"** ("Rename…"), and so do progress
states ("Saving…").
- **Explain inline first; tooltips are the last resort** for anything essential.
- **Numbers read the same everywhere:** numerals for counts ("8 pages"), a space between
number and unit ("10 MB"), dates, times and numbers formatted for the user's locale.

### States and feedback

- **Each control has its relevant states**: default, hover, focus, active, and disabled,
loading or error where they can occur. Focus is always visible: an `outline` ring with at
least 3:1 contrast against its surroundings, shown at once, never faded in. Use `outline`
because forced-colors mode removes `box-shadow`.
- **States never move the layout.** Hover, focus and error keep a control's size and border
width. A field next to buttons matches their height. A tab, step, selection, page or data
change moves and resizes nothing outside the part that changed; tab widths hold.
- **Each data view has its states**: loading (placeholders that keep the layout), empty,
error, one item, many items. A paged list keeps its full-page height on a short last page and
an empty state keeps the filled frame, the one exception to fixing a height.
- **A busy button keeps its width** and its label with a spinner, or a progress label
("Stopping…"), and blocks double clicks. Spinners and skeletons wait a moment before showing
and stay long enough not to flicker. A destructive action waits for the server; never remove the row first.
- **Never fake success.** Show "Saved" or "Sent" only after the request succeeded. An
optimistic toggle rolls back and says so when the request fails. An action with no backend
yet says it is not connected instead of pretending.
- **No dead ends.** Empty, error and finished states say which state it is (first use, no
results, filtered) and offer one next step.
- **No dead zones.** If part of a control looks clickable, it is clickable; a label and its
checkbox share one hit area.
- **Hover, active and focus raise contrast** over the resting state.
- **Feedback sits next to the action** and is announced to screen readers without moving
focus. Toasts only for a short result with Undo, reachable by keyboard and touch.
- **Errors keep the user's input.** Closing a dialog or leaving a page with unsaved changes
asks first (inside the same dialog, never a second modal).
- **Live lists keep scroll, focus and open state across refreshes.**
- **Motion explains a change, briefly**, and leaves a static state cue. Frequent actions are
instant; respect reduced motion. Timing: 100–150 ms for feedback, 150–300 ms for a state
change, 300–500 ms for layout or overlays; exits are shorter than enters. Transition named
properties, never `all`, and move things with `transform` and `opacity` rather than size or
position.

### Components

- **Segmented control for a few short, related, exclusive options applied at once** (about
2–5), all text or all icon-only with tooltips. Long choices or deferred submit: radios or a
select. A switch is only on/off; tabs switch content panels. *Seen:* a four-state filter
(All, Serving, Stopped, Apps) belongs in one segmented control.
- **A selected option fills its whole control box.**
- **Each option card shows an icon, a one-line meaning and what it changes** before picking.
- **A multi-step flow is a numbered sequence of short rows**, not a stack of cards.
- **Search fields have a leading magnifier**, a placeholder naming the scope, and a clear
icon at the right end of the field.
- **Close is an icon at the top-right; Copy confirms with a short "Copied" tooltip.**
- **Forms:** every field has a visible label; errors sit next to their field and the first
one gets focus on submit; submit stays enabled until submission starts, so validation can
explain what is missing; never block typing or paste. Fields set `type`, `inputmode`, `name`
and `autocomplete`, with spellcheck off for codes and emails.
- **Images get `alt`** (empty when decorative); decorative icons get `aria-hidden`.
- **Filters, tabs and segmented choices live in the URL**, so refresh, Back and shared links
keep them.
- **Chips are static labels**: a short adjective in a semantic tint. A chip that filters is a
button and needs button semantics. Chips and tags of one kind share height, padding and type
size, as buttons do. A type name is plain text or an icon, not a chip.
- **Modals hold one task.** Cancel left, confirm right, a solid scrim, focus trapped and
returned, Escape and the close control dismiss, never a modal on a modal.
- **The project's accessible primitives first, then native elements**; hand-roll a dialog,
menu or select only with full keyboard and focus behavior.

### Inspect the running app

The author checks its own render in the running app; after delegating, the lead opens each
delivered screen itself. An app that will not start means blocked, not done.

- **Matrix:** each changed screen and each screen sharing a changed component, in every state
  (empty, one, many, loading, error, open, selected), at 390, 768 and 1440 px, light and dark,
  in every language the app ships (locale files, switcher or route prefix), and for changed
  screens with motion on and off.
- **Who checks:** the builder has `ui-checker` (through `super-agent`) check each changed screen and
  each screen sharing a changed component. Brief it with the URL, the clicks to each state, the
  languages, whether the dark theme follows the OS preference or has its own toggle, and a base
  build or URL when there is one. The builder runs `scripts/check-ui.mjs` itself only to re-check a
  fix. It fixes every new finding and pastes the checker's fenced `UI checker findings` block into
  its final report word for word, even when it shortens everything else, then says what it did about
  each line. It never drops, merges or rewords a line, old ones included.
- **Methods:** `scripts/check-ui.mjs` (`../scripts/` from this file) measures the matrix in
  headless Chromium after motion ends (see Motion timing) and prints one line per finding with
  its state, check, selector and numbers, plus a screenshot per state. Usage: `node check-ui.mjs
  <url>... [--lang <text>] [--widths 390,768,1440] [--dark] [--plan <file.json>] [--out <dir>]
  [--json]`, where `--lang` is the visible text of the language switch, `--dark` only emulates
  the OS dark preference (a theme toggle needs its click in the plan) and `--plan` adds screens
  and click or fill steps it cannot reach alone (format in the script header). Exit 0 clean, 1
  findings, 2 error (a blank page included). It runs every probe below, and again after a click
  on each tab. Say aligned, fits or unchanged only from a probe result. The probes live in
  `scripts/inspect-page.js` (`page.addScriptTag({ path })` for a check of your own). Each
  returns `{ check, selector, detail, values }` items, `[]` when clean:
  - `census(selector)`: one kind of element: size, type, padding, contrast, small targets,
    icon off center (a second argument runs one check; `hidden`, `dupe`, `key` are opt-in);
  - `columns(rowSelector)` and `gaps(groupSelector)`: ragged edges, empty reserved width,
    uneven gaps, a selected option that does not fill its box;
  - `boxes(selectors)` before and after every state change, including a click on each tab:
    what moved. A first call for a selector only saves and returns one `saved` notice (not a
    defect) instead of `[]`;
  - `overflow()`: text past its box, page wider than the window, a fixed bar over content;
  - by hand in each state, which the script cannot do: tab through (focus reaches every action
    in reading order; hover-revealed actions appear on focus), read the accessibility tree,
    compare a screenshot with the mock, read the wording.
- **lintapple 0.1.20 cannot see** layout shifts between states, other languages (it forces
  en-US), motion, a fixed bar over content, or layout on elements without `data-ui-*`
  markup. Run it after these methods, not instead.
- **A new screen also goes to a fresh, skeptical reviewer** (through `super-agent`) with the
  screenshots, routes and this file, never the reasons behind choices. It answers `ship` or
  `fix`, then at most five findings, worst first, and changes nothing. Not findings: the
  project's design system, explicit user requirements, approved `exceptions`. A full review
  of the whole app comes at the very end, only when the user asks. Give it these examples:
  - fail: the selected segment leaves a gap and is not fully filled; the footer buttons sit
    at a different height on each step;
  - pass: every status chip in the column has the same height, padding and type size; the
    pager sits at the same top on every page and tab.
- **A human eye** still decides whether the hierarchy reads, the screen fits the task and
  brand, and the copy reads well in each language.

## Set up once per project

```sh
npm install -D lintapple && npx lintapple init
```

`init` creates `ui-policy.json` and a `lint:ui` script. Keep existing files. Set `fonts` and
`fontSizes` to the app's real values, and the app URL in `lint:ui` (default
`http://localhost:3000`). The first run downloads Chromium. Needs Node 22 or later.

## Run the measured checks

1. Start the app and run `npm run lint:ui` (or `lintapple <url>`) on each changed route.
 Add `--ready '[data-app-ready]'` when the page loads asynchronously.
2. Exit `0` passed, `1` findings, `2` the check did not finish. Only `0` is a pass.
3. Each finding names the rule, element, measured value, and fix. Fix the interface.
4. Check relevant states too (open dialog, error, hover, focus, dark mode when the policy
 lists it). Pass `--interactions <file>` to reach states a bare load does not show.
5. In a Playwright suite, call `expectUI(page, testInfo)` from `lintapple/playwright` after
 the page is ready. Findings fail the test and attach a JSON report.

Fix the code, never the policy. Do not edit `ui-policy.json`, add `exceptions`, or remove
`data-ui-*` attributes to get a pass; a policy change needs a user request. One standing
request: an element cut as **Cut long values** describes, with its full-value panel, may get
a `content-clipping` entry on its own selector, with a reason naming the panel. No other
rule, no page-wide selector, and never for hidden overflow, fixed heights or horizontal
scroll; those are bugs. Unresolved
contrast findings need review; they are not passes. After changing the checker itself,
run `npm test` in its repository.

## Markup contract

Font, contrast, control size, and screen-bounds checks need no markup. These attributes
switch on the layout checks:


| Attribute               | Put it on                                                           |
| ----------------------- | ------------------------------------------------------------------- |
| `data-ui-stack`         | A group whose child spacing is checked                              |
| `data-ui-actions`       | A button group whose gaps are checked                               |
| `data-ui-container`     | A surface whose button insets are checked                           |
| `data-ui-number`        | A changing number that needs equal digit widths                     |
| `data-ui-content`       | A container whose text must stay inside its edges                   |
| `data-ui-align="start"` | A group whose marked items must align (`center` or `end` also work) |
| `data-ui-align-item`    | Each item compared in an alignment group                            |
| `data-ui-radius`        | An outer surface with equal corner radii and insets                 |
| `data-ui-radius-inner`  | Its direct inner surface                                            |


The policy's `controlContainers` selectors can mark existing button containers instead.

## Guidelines the checker enforces

- **Type:** use only sizes from `fontSizes` and fonts from `fonts`. Per-element `typeRules`
narrow it (h1 24-64, h2 20-32, h3 18-24, buttons 14-16 in the default policy). Matching
text gets the same size.
- **Numbers:** `font-variant-numeric: tabular-nums` on changing values. Right-align numeric
table columns.
- **Contrast:** normal text 4.5:1, large text 3:1, in every color scheme in the policy.
Check placeholders and hover/focus color changes.
- **Controls:** at least 24 px for pointer targets (WCAG 2.2 AA; links inside a sentence are
exempt) and 40 px for touch (`examples/ui.css`), 8 px between actions, 8 px between a control
and its container edge. `minControlSize` defaults to 15: set it to 24 in `ui-policy.json` at
setup, and add a `controlSizeRules` entry (`minSize` 40) for touch widths.
- **Spacing:** at least 8 px between stacked items (`minLayoutGap`).
- **Nested corners:** inner radius = outer radius minus the inset.
- **Overflow:** nothing past the horizontal viewport at each configured width (390 and 1440
by default). Fixed elements and open dialogs also fit vertically. Cut long values as the
typography rule says, let other text wrap with `overflow-wrap: break-word` (never
`anywhere`, which can squeeze a short label to one letter per line), or scroll in a local
region. Never hide overflow to conceal a layout error. Grid tracks use `minmax(0, 1fr)`, not
bare `1fr`, which grows to fit its widest unbreakable child (a long URL or `pre` line, a
wide table, a fixed-width image). Flex children holding such content get `min-width: 0`,
and the wide element gets `overflow-x: auto`, so it scrolls inside its column instead of
widening the page.
- **Copy:** `bannedCopy` phrases ("seamlessly", "game-changing") fail.

Starter CSS that already satisfies these lives in the package at `examples/ui.css`
(`.ui-stack`, `.ui-actions`, `.ui-panel`, `.ui-surface`); keep its values in agreement with
`ui-policy.json`. The `artifacts` skill's hub policy is the exception: it lives in
the `artifacts` skill's `hub-ui-policy.json`, covers `hub.html` only, and is loaded with
`--config`.

## Where to look for inspiration and / or when these rules run out 

These rules already hold the useful parts of the sources below; do not read them for a
covered case. When a design question is not covered here, search these, in this order, and
make sure the answer does not contradict the rules above:

- [Carbon (IBM)](https://carbondesignsystem.com/): patterns for status, common actions,
dialogs, empty states, loading, forms, data tables.
- [Primer (GitHub)](https://primer.style/product/): developer-tool UI, action lists,
confirmation dialogs, empty states.
- [Pajamas (GitLab)](https://design.gitlab.com/): developer-tool UI, list rows, destructive
buttons.
- [Radix Colors](https://www.radix-ui.com/colors): matching soft color scales for light and
dark.
-  [Atlassian](https://atlassian.design/): when those four are not enough for inspo or the user asks for more (mocups or whatever)

## Sources

Documentation of where each rule came from, for people maintaining this file. Agents do not
need to read them. The full research, with per-rule citations, conflicts between sources and
the user's feedback screenshots, was done on 2026-10-12.

- Checker: [https://github.com/gholtzap/lintapple](https://github.com/gholtzap/lintapple), pinned at 0.1.20 in `bootstrap_common.sh`.
- [Hallmark](https://github.com/Nutlope/hallmark) v2.0.0, audited 2026-10-23: rules from
`references/gates.md` (10a, 15, 26a, 39a, 46a, 49a, 50, 70, F21, F23), `references/craft.md`
(flex `min-width: 0`, the document), `references/responsive.md` (button label order), and the
hero review from `references/review-hero.md`, widened to any new screen. Its grid rule covers
image tracks only; here it covers every track. Its themes and landing-page rules are left out.
- User requirements: status first and delete last, hover-revealed controls in fixed places,
modals on Stop and Delete, soft matching colors, consistency of button forms and chips.
- Nielsen Norman Group: [proximity of consequential options](https://www.nngroup.com/articles/proximity-consequential-options/),
[confirmation dialogs](https://www.nngroup.com/articles/confirmation-dialog/),
[icon usability](https://www.nngroup.com/articles/icon-usability/),
[usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/),
[OK–Cancel order](https://www.nngroup.com/articles/ok-cancel-or-cancel-ok/),
[dark mode](https://www.nngroup.com/articles/dark-mode/),
[cards](https://www.nngroup.com/articles/cards-component/).
- Carbon: [status indicators](https://carbondesignsystem.com/building-blocks/core/patterns/status-indicators),
[common actions](https://carbondesignsystem.com/patterns/common-actions/),
[dialogs](https://carbondesignsystem.com/building-blocks/core/patterns/dialogs/),
[button](https://carbondesignsystem.com/components/button/usage/),
[data table](https://carbondesignsystem.com/components/data-table/usage/),
[content switcher](https://carbondesignsystem.com/components/content-switcher/usage/).
- Primer: [button](https://primer.style/product/components/button/guidelines),
[icon button](https://primer.style/product/components/icon-button/guidelines),
[confirmation dialog](https://primer.style/product/components/confirmation-dialog/guidelines),
[action list](https://primer.style/product/components/action-list/guidelines),
[segmented control](https://primer.style/product/components/segmented-control/guidelines),
[empty states](https://primer.style/product/ui-patterns/empty-states/),
[loading](https://primer.style/product/ui-patterns/loading/),
[notifications](https://primer.style/product/ui-patterns/notification-messaging/).
- GitLab: [secondary delete buttons in list rows](https://gitlab.com/gitlab-org/gitlab/-/issues/320746).
- Atlassian: [button](https://atlassian.design/components/button/usage),
[modal dialog](https://atlassian.design/components/modal-dialog/usage),
[lozenge](https://atlassian.design/components/lozenge/usage),
[color](https://atlassian.design/foundations/color/).
- GOV.UK: [button](https://design-system.service.gov.uk/components/button/),
[tag](https://design-system.service.gov.uk/components/tag/),
[design principles](https://www.gov.uk/guidance/government-design-principles).
- Apple HIG (readable copies at `developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.md`):
[alerts](https://developer.apple.com/design/human-interface-guidelines/alerts),
[buttons](https://developer.apple.com/design/human-interface-guidelines/buttons),
[toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars),
[segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls),
[color](https://developer.apple.com/design/human-interface-guidelines/color),
[dark mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode).
- Material: [dialogs, snackbars, chips, color](https://github.com/material-components/material-components-android/tree/master/docs).
- Color: [Radix, understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale),
[Radix, composing a palette](https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette),
[Refactoring UI, building a palette](https://www.refactoringui.com/previews/building-your-color-palette).
- [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines): forms, loading,
dead ends and zones, number formats. Its Title Case rule is Vercel's own brand choice; this
file keeps sentence case.
- Agent skills from [ui-skills.com](https://www.ui-skills.com/):
[interface-design](https://github.com/Dammyjay93/interface-design),
[impeccable](https://github.com/pbakaus/impeccable),
[design-lab principles](https://github.com/0xdesign/design-plugin),
[frontend-ui-engineering](https://github.com/addyosmani/agent-skills),
[make-interfaces-feel-better](https://github.com/jakubkrehel/make-interfaces-feel-better),
[ui-skills](https://github.com/ibelick/ui-skills),
[the playbook](https://www.ui-skills.com/playbook).