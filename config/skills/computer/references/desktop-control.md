# Desktop control on this Ubuntu machine (GNOME, Wayland)

Tested 2026-10-16 on Ubuntu 24.04, GNOME on Wayland, two monitors, Orca IDE with provider
`orca-computer-use-linux` 1.0.0. Re-run the probes below before trusting any of it.

## Short answer

- **Orca's coordinate `click`, `type-text`, `press-key`, `drag` and `scroll` do nothing here.**
  They report success as `unverified (synthetic input)`. Orca fires them through AT-SPI, which
  GNOME Wayland does not deliver to native Wayland windows. Window positions are also wrong:
  every window reports `0,0`.
- **Real clicks, drags, keys, shortcuts and scroll work** through Mutter's RemoteDesktop D-Bus
  API. No prompt, no install. Use `scripts/wl-input.py` in this skill.
- **Orca's `click --element-index` works** on Wayland when the app exposes an accessibility tree.
- **Screenshots work** with `gnome-screenshot -f file.png`. Orca's own screenshot is off on Wayland.

## Rules

1. Prefer a programmatic path (shell, files, HTTP, CLI) over any GUI control.
2. Inside an Orca terminal, plain `orca` is the right CLI. Outside Orca, plain `orca` is the
   GNOME screen reader and starts talking; use `orca-ide`.
3. Never click or type into a window you did not open or the user did not name. Input goes to
   whatever is under the pointer or has keyboard focus, not to the window you picked.
4. Confirm the target before every input (see "Confirm the target").
5. Do not send, submit, buy, delete or change settings unless the user asked for that action.
6. Copy shortcuts overwrite the user's real clipboard. Avoid them or say so.

## Probes (read-only)

```bash
orca computer capabilities --json     # hotkey is false on Wayland
orca computer list-apps --json
orca computer list-windows --app <name|pid:N> --json    # windows by index; id is null
orca computer get-app-state --app pid:N --window-index 0 --no-screenshot --json
echo $XDG_SESSION_TYPE                # wayland
gsettings get org.gnome.desktop.interface toolkit-accessibility    # true here
```

`list-windows` returns titles. A page you control can put its state in `document.title`,
which makes a click or keystroke cheap to verify.

## Find targets

**With a tree (preferred).** GTK apps (Text Editor: 49 elements, with `clipboard.copy`,
`selection.select-all` actions) and Chromium or Electron apps started with accessibility on
list buttons, fields and page text. Read `result.snapshot.treeText`, then:

```bash
orca computer click --app pid:N --window-index 0 --element-index 103 --no-screenshot --json
orca computer perform-secondary-action --app pid:N --window-index 0 --element-index 9 --action clipboard.copy --no-screenshot --json
```

`click` by index calls the accessibility action (`press`, `activate`), so it works on Wayland
and never moves the real pointer. Indexes go stale after any UI change; re-run `get-app-state`.
A result with `action.path: synthetic` did nothing.

**Chrome, Brave and Electron apps (Slack, Obsidian, Orca) show one root element** unless
accessibility is forced on at launch. A scratch Chrome with `--force-renderer-accessibility`
showed 300+ elements: toolbar, tabs, page buttons, entries, text. The user's running Brave,
Slack, Obsidian and Orca were started without it and stay opaque. For a web page you control,
start a scratch Chrome with the browser launch arguments from the `cli.config.json` that the
global policy names, and add `--force-renderer-accessibility` to that launch.

Close it by PID when done. Never `pkill -f` a pattern that also matches your own command line.

**Without a tree,** take a screenshot and read pixel positions (below).

`set-value` fails with `'Accessible' object has no attribute 'is_editable_text'` in this
provider version. Focus the field with `click --element-index`, then type with `wl-input.py`.

## Screenshots

```bash
gnome-screenshot -f /tmp/x/full.png     # every monitor in one PNG, no prompt; 4480x1440 here
gnome-screenshot -w -f /tmp/x/win.png   # the focused window only
```

- Pixel (x, y) in the full PNG is the global coordinate `wl-input.py` takes. Scale was 1;
  compare `identify` size with the monitor layout before assuming it.
- Crop to your window before looking: `convert full.png -crop WxH+X+Y +repage crop.png`.
  The full image holds every window the user has open. Delete it after use.
- Never run `gnome-screenshot -a` or `-i`: they wait for the user to draw an area and hang.
- `grim` fails (GNOME has no wlr-screencopy). `import -window root` fails (no X root).
- Stacking can change between a screenshot and your click; a chat app raised itself once.
  Screenshot again right before an input if time passed.

## Real input: `scripts/wl-input.py`

Global logical-pixel coordinates, the same as a full-screenshot pixel. The script is
`scripts/wl-input.py` in this skill's folder (`../scripts/wl-input.py` from this file); set `S`
to its absolute path, whichever harness loaded the skill.

```bash
S=<computer skill folder>/scripts/wl-input.py
python3 -I $S move 2663 548
python3 -I $S click 2663 548 [left|right|middle] [count]   # count 2 = double-click
python3 -I $S drag 2700 787 3263 800                        # drag and drop, or select text
python3 -I $S scroll 2800 950 down 3                        # up|down|left|right
python3 -I $S key ctrl+a                                    # Return, Tab, Escape, ctrl+shift+p
python3 -I $S type "text to type"
```

- `key` takes `+` chords of: Return, Tab, Escape, BackSpace, Delete, Home, End, PageUp,
  PageDown, arrows, space, F1-F12, ctrl, shift, alt, super, or one character. `CmdOrCtrl` maps
  to ctrl. Alt and super chords act on the desktop, not the page; avoid them.
- Keys go to the keyboard-focused window. Click inside it first. `type` turns `\n` into Return, which runs the line in a focused terminal.
- Each run opens and closes its own session; the pointer stays where it ended.
- The monitor layout is read live from `org.gnome.Mutter.DisplayConfig`; nothing is hard-coded.
- A click on a window the pointer just entered can be swallowed once. The script lands on the
  point twice, but still verify with the title, tree or a screenshot.

Verified on a scratch Chrome page: click, drag-and-drop of a box into a zone, scroll of an
inner list, text selection by drag, typing, `ctrl+a`, `ctrl+c`, `ctrl+v`, BackSpace, arrows.

## Confirm the target

1. Open the window yourself, or read its title from `list-windows`.
2. Screenshot, crop, and check your window is on top where the click will land.
3. `move` first. For a page you control, confirm it saw the pointer (title or tree).
4. Click, then re-read state. Never report an input as done from the exit code.
5. Stop at once if another window shows the pointer or the typed text.

## Limits on Wayland

- No window position, focus or raise from AT-SPI (`windows.focus` is false). Only a click
  inside a window, or a new window opening, raises it.
- Orca `hotkey` is refused (`unsupported_capability`) and `paste-text` needs it; use
  `wl-input.py key`, or set the clipboard with `wl-copy` and send `ctrl+v`.
- Orca `type-text` and `press-key` look fine and do nothing; "unverified" is the clue.
- `get-app-state` returns `screenshot: null` here, even without `--no-screenshot`.
- No menus, dialogs or dock surfaces in the provider; use the tree or pixels.
- Password fields are masked in the tree. Do not type secrets.
- Any program on the session can type and click through this API. Use `wl-input.py` for the
  task the user gave, not as a habit.
