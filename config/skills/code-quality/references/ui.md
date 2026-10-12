# UI

Rules for any change that renders an interface (HTML, CSS, React, Vue, Svelte, and similar).
Two layers:

- **Design rules** (this first part): judgment no tool measures. Placement, grouping,
consistency, color, wording, states.
- **Measured checks** (`lintapple`, below): real sizes, contrast, overflow and spacing on the
rendered page. The bootstrap installs it globally.

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
- **Design every supported theme together**, not one then the other.

### Layout and space

- **Group by nearness before adding boxes or lines.** Tight inside a group, clearly more
space between groups. Reach for a divider only when space is not enough.
- **Give every item in a collection one anatomy.** Same fields, same order, same alignment
at each width. Text may wrap; corresponding parts and actions must not move. A missing
optional part must not shift its neighbors. *Seen:* cards put title, open icon and status
chip on different lines depending on title length. Fix: pick one anatomy (for example
logo, time and status on line 1, title on line 2) and apply it to every card.
- **Give actions one fixed home.** Same edge, same order, same slot in every row or card.
Never let a control float in the middle of free space. *Seen:* a trash button parked
mid-row with an empty gap on both sides.
- **Pin card actions and links to the card bottom.** Stretch cards to the row height and
push the footer down, so footers line up when descriptions differ; keep clear space
between body and footer. Let the card grow; never fix its height or clip text.
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

### Actions and destructive actions

- **One visually primary action per area.** Rank the rest by style (filled, outlined, quiet),
not by size. Buttons in one group share height and size.
- **Status and main actions lead; delete trails.** People look at the start of a row first,
so the status and the main action (Start, Stop) sit at the leading edge, and the delete or
remove control sits alone at the trailing edge, the same way everywhere:
  - list row: status and main action at the start, delete at the far end;
  - card footer: main actions at the bottom-left, delete at the bottom-right.
  Never two clusters floating apart in the middle, and never delete glued to Open or Start.
  Keep DOM order equal to visual order.
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
- **Confirm deletes and stopping live work with a modal**, even when the process can be
restarted. Reversible changes (archive, remove a filter or chip) act at once and show Undo.
Start, Open and ordinary controls need neither. Type-the-name confirmation only for rare,
severe deletes.
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
menu**, destructive item last and set off by a divider. Add bulk actions ("Stop all") only when batch work is part of the task, with the
same safeguards as the single action.

### Consistency

- **Same thing, same look, same word, same place.** An action keeps its icon, label, color,
size and position on every screen. "Stop" is never also "Halt" or "Cancel".
- **Show an attribute on all comparable items or none.** If status chips are shown, every
item shows its real status in the same slot. *Seen:* a "serving" chip on some cards only.
Optional content (a description, a warning badge) appears only when it applies and never
displaces actions.
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
default. Real logos stay as they are; never emoji or Unicode glyphs as icons.
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
- **Monospace only for code, paths, ids and numbers**, never as a "technical" costume.
- **Long titles wrap; they never move the actions.** The checker flags ellipsis truncation
as clipping, so truncate only through an `exceptions` entry the user approved.
- **Sentence case for new labels**, keeping names, acronyms and user content as written. No
all-caps labels, no decorative eyebrow labels above headings.
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
loading or error where they can occur. Focus is always visible.
- **Each data view has its states**: loading (placeholders that keep the layout), empty,
error, one item, many items.
- **A busy button keeps its width** and its label with a spinner, or a progress label
("Stopping…"), and blocks double clicks. Spinners and skeletons wait a moment before showing
and stay long enough not to flicker. A destructive action waits for the server; never remove the row first.
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
instant; respect reduced motion.

### Components

- **Segmented control for a few short, related, exclusive options applied at once** (about
2–5), all text or all icon-only with tooltips. Long choices or deferred submit: radios or a
select. A switch is only on/off; tabs switch content panels. *Seen:* a four-state filter
(All, Serving, Stopped, Apps) belongs in one segmented control.
- **Search fields have a leading magnifier**, a placeholder naming the scope, and a clear
icon at the right end of the field.
- **Close is an icon at the top-right; Copy confirms with a short "Copied" tooltip.**
- **Forms:** every field has a visible label; errors sit next to their field and the first
one gets focus on submit; submit stays enabled until submission starts, so validation can
explain what is missing; never block typing or paste.
- **Filters, tabs and segmented choices live in the URL**, so refresh, Back and shared links
keep them.
- **Chips are static labels**: a short adjective in a semantic tint. A chip that filters is a
button and needs button semantics.
- **Modals hold one task.** Cancel left, confirm right, a solid scrim, focus trapped and
returned, Escape and the close control dismiss, never a modal on a modal.
- **The project's accessible primitives first, then native elements**; hand-roll a dialog,
menu or select only with full keyboard and focus behavior.

### Review before the measured checks

In one pass over each changed route and relevant state:

1. Hierarchy: in a small screenshot the focal element and the groups still read in order.
2. Collections: every item has the same anatomy, action positions, button forms and markers.
3. Every supported theme, a narrow and a wide window, enlarged text, extreme content.
4. Keyboard: focus reaches every action in reading order; hover-revealed actions appear on
 focus.
5. Run the measured checks below, then report which routes and states you checked.

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
`data-ui-*` attributes to get a pass; a policy change needs a user request. Unresolved
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
- **Controls:** at least 15 px by default (`minControlSize`; give touch targets more, as
`examples/ui.css` does with 40 px), 8 px between actions, 8 px between a control and its
container edge.
- **Spacing:** at least 8 px between stacked items (`minLayoutGap`).
- **Nested corners:** inner radius = outer radius minus the inset.
- **Overflow:** nothing past the horizontal viewport at each configured width (390 and 1440
by default). Fixed elements and open dialogs also fit vertically. Let long text wrap
(`overflow-wrap: anywhere`) or scroll in a local region. Never hide overflow to conceal a
layout error.
- **Copy:** `bannedCopy` phrases ("seamlessly", "game-changing") fail.

Starter CSS that already satisfies these lives in the package at `examples/ui.css`
(`.ui-stack`, `.ui-actions`, `.ui-panel`, `.ui-surface`); keep its values in agreement with
`ui-policy.json`.

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