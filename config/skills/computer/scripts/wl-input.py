#!/usr/bin/python3 -I
"""Real mouse and keyboard input on GNOME Wayland, through Mutter's RemoteDesktop D-Bus API.

No prompt and no install: the API is on the user session bus. Coordinates are global
logical pixels, the same as a pixel in a `gnome-screenshot` PNG.

  wl-input.py move X Y
  wl-input.py click X Y [left|right|middle] [count]
  wl-input.py drag X1 Y1 X2 Y2
  wl-input.py scroll X Y up|down|left|right [steps]
  wl-input.py key ctrl+a | Return | ctrl+shift+p
  wl-input.py type "text"
"""
import sys
import time

from gi.repository import Gio, GLib

RD = "org.gnome.Mutter.RemoteDesktop"
SC = "org.gnome.Mutter.ScreenCast"
DC = "org.gnome.Mutter.DisplayConfig"
BUTTONS = {"left": 0x110, "right": 0x111, "middle": 0x112}  # evdev codes
KEYSYMS = {
    "return": 0xFF0D, "enter": 0xFF0D, "tab": 0xFF09, "escape": 0xFF1B, "esc": 0xFF1B,
    "backspace": 0xFF08, "delete": 0xFFFF, "home": 0xFF50, "left": 0xFF51, "up": 0xFF52,
    "right": 0xFF53, "down": 0xFF54, "pageup": 0xFF55, "pagedown": 0xFF56, "end": 0xFF57,
    "space": 0x20, "shift": 0xFFE1, "ctrl": 0xFFE3, "alt": 0xFFE9, "super": 0xFFEB,
    **{f"f{n}": 0xFFBD + n for n in range(1, 13)},
}

AXES = {"up": (0, -1), "down": (0, 1), "left": (1, -1), "right": (1, 1)}
DRAG_STEPS = 20  # small steps so the page sees mousemove events

bus = Gio.bus_get_sync(Gio.BusType.SESSION)


def call(dest, path, iface, method, args=None):
    return bus.call_sync(dest, path, iface, method, args, None, Gio.DBusCallFlags.NONE, 5000, None).unpack()


def monitors():
    """Return (connector, x, y, width, height) per logical monitor, from the live layout."""
    state = call(DC, "/org/gnome/Mutter/DisplayConfig", DC, "GetCurrentState")
    modes = {}
    for (connector, *_), mode_list, _props in state[1]:
        modes[connector] = next((m for m in mode_list if m[6].get("is-current")), None)
    layout = []
    for x, y, scale, _transform, _primary, members, _props in state[2]:
        connector = members[0][0]
        layout.append((connector, x, y, modes[connector][1] / scale, modes[connector][2] / scale))
    return layout


def locate(layout, x, y):
    """Return the monitor that holds the global point, or None."""
    return next((m for m in layout if m[1] <= x < m[1] + m[3] and m[2] <= y < m[2] + m[4]), None)


def point(layout, x, y):
    x, y = float(x), float(y)
    if locate(layout, x, y) is None:
        raise ValueError(f"({x}, {y}) is outside every monitor")
    return x, y


def keysym(token):
    if token.lower() in KEYSYMS:
        return KEYSYMS[token.lower()]
    return ord(token) if len(token) == 1 else int(token, 0)


# ======================================================================================
#                                    PARSE (NO SESSION)
# ======================================================================================
def parse(argv, layout):
    """Check every argument and every pointer point, and return the action to run on a Session.

    Nothing here touches the RemoteDesktop API, so bad input never opens a session.
    """
    command, *args = argv
    if command == "move" and len(args) == 2:
        x, y = point(layout, *args)
        return lambda session: session.move(x, y)
    if command == "click" and 2 <= len(args) <= 4:
        x, y = point(layout, *args[:2])
        name = args[2] if len(args) > 2 else "left"
        count = int(args[3]) if len(args) > 3 else 1
        if name not in BUTTONS:
            raise ValueError(f"unknown button {name!r}")
        return lambda session: session.click(x, y, name, count)
    if command == "drag" and len(args) == 4:
        x1, y1, x2, y2 = map(float, args)
        path = [
            point(layout, x1 + (x2 - x1) * step / DRAG_STEPS, y1 + (y2 - y1) * step / DRAG_STEPS)
            for step in range(DRAG_STEPS + 1)
        ]
        return lambda session: session.drag(path)
    if command == "scroll" and 3 <= len(args) <= 4:
        x, y = point(layout, *args[:2])
        if args[2] not in AXES:
            raise ValueError(f"unknown direction {args[2]!r}")
        steps = int(args[3]) if len(args) > 3 else 3
        return lambda session: session.scroll(x, y, *AXES[args[2]], steps)
    if command == "key" and len(args) == 1:
        codes = [keysym(token) for token in args[0].replace("CmdOrCtrl", "ctrl").split("+")]
        return lambda session: session.press(codes)
    if command == "type" and len(args) == 1:
        text = args[0]
        return lambda session: session.type_text(text)
    raise ValueError(f"unknown command or wrong arguments for {command!r}")


# ======================================================================================
#                                        SESSION
# ======================================================================================
class Session:
    """One RemoteDesktop session. `close` releases held buttons and keys, then stops it."""

    def __init__(self, layout):
        self.layout = layout
        self.held_buttons = []
        self.held_keys = []
        self.path = call(RD, "/org/gnome/Mutter/RemoteDesktop", RD, "CreateSession")[0]

    def start(self):
        session_id = call(RD, self.path, "org.freedesktop.DBus.Properties", "Get",
                          GLib.Variant("(ss)", (RD + ".Session", "SessionId")))[0]
        screencast = call(SC, "/org/gnome/Mutter/ScreenCast", SC, "CreateSession",
                          GLib.Variant("(a{sv})", ({"remote-desktop-session-id": GLib.Variant("s", session_id)},)))[0]
        self.streams = {
            m[0]: call(SC, screencast, SC + ".Session", "RecordMonitor", GLib.Variant("(sa{sv})", (m[0], {})))[0]
            for m in self.layout
        }
        call(RD, self.path, RD + ".Session", "Start")

    def close(self):
        try:
            for name in self.held_buttons[:]:
                self.button(name, False)
            for code in reversed(self.held_keys[:]):
                self.key(code, False)
        finally:
            call(RD, self.path, RD + ".Session", "Stop")

    def notify(self, method, signature, *values):
        call(RD, self.path, RD + ".Session", method, GLib.Variant(signature, values))

    def move(self, x, y):
        connector, mx, my, *_ = locate(self.layout, x, y)
        # The first event after the pointer enters a window can be swallowed, so land on the point twice.
        for dx in (1, 0):
            self.notify("NotifyPointerMotionAbsolute", "(sdd)", self.streams[connector], x - mx + dx, y - my)
            time.sleep(0.1)

    def button(self, name, down):
        self.notify("NotifyPointerButton", "(ib)", BUTTONS[name], down)
        if down:
            self.held_buttons.append(name)
        elif name in self.held_buttons:
            self.held_buttons.remove(name)

    def key(self, code, down):
        self.notify("NotifyKeyboardKeysym", "(ub)", code, down)
        if down:
            self.held_keys.append(code)
        elif code in self.held_keys:
            self.held_keys.remove(code)

    def click(self, x, y, name, count):
        self.move(x, y)
        for _ in range(count):
            self.button(name, True)
            time.sleep(0.04)
            self.button(name, False)
            time.sleep(0.06)

    def drag(self, path):
        self.move(*path[0])
        self.button("left", True)
        time.sleep(0.15)
        for x, y in path[1:]:
            self.move(x, y)
        self.button("left", False)

    def scroll(self, x, y, axis, sign, steps):
        self.move(x, y)
        self.notify("NotifyPointerAxisDiscrete", "(ui)", axis, sign * steps)

    def press(self, codes):
        for code in codes:
            self.key(code, True)
            time.sleep(0.02)
        for code in reversed(codes):
            self.key(code, False)
            time.sleep(0.02)

    def type_text(self, text):
        for char in text:
            code = KEYSYMS["return"] if char == "\n" else ord(char) if ord(char) < 0x100 else 0x01000000 + ord(char)
            self.key(code, True)
            self.key(code, False)
            time.sleep(0.02)


def main(argv):
    if not argv:
        sys.exit(__doc__)
    if argv[0] in ("-h", "--help"):
        print(__doc__)
        return
    layout = monitors()
    try:
        act = parse(argv, layout)
    except ValueError as error:
        sys.exit(f"wl-input.py: {error}\nRun with --help for usage.")

    session = Session(layout)
    try:
        session.start()
        act(session)
        time.sleep(0.2)
    finally:
        session.close()


if __name__ == "__main__":
    main(sys.argv[1:])
