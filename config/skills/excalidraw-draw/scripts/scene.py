#!/usr/bin/env python3
"""Build clean Excalidraw scenes with correct text geometry, and lint existing scenes.

The Excalidraw CLI draws every element exactly where the file says: it does not re-centre
bound text, re-measure free text, or repair one-sided arrow bindings. This module computes
that geometry from the real font widths so hand-written scenes render as intended.

Library use: keep the builder script next to its output and run it with this folder on
the import path, without writing a bytecode cache into the skill:

    PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=<skill>/scripts python3 build.py

    from scene import Scene
    s = Scene()
    s.text(40, 40, "Checkout flow", size=28)
    web = s.box(40, 120, 200, 64, "Storefront", role="blue")
    api = s.box(340, 120, 200, 64, "Payment API", role="green")
    s.arrow(web, api, label="authorize")
    s.save("checkout.excalidraw")      # also prints lint findings

Command line:

    python3 scene.py lint scene.excalidraw     report geometry, binding, and style defects
    python3 scene.py measure "Some label" --size 16 --font 6
    python3 scene.py crop scene.excalidraw X Y W H   copy with a frame "crop" over that area;
        render it with --frame-id crop to check detail in a large scene
"""

import argparse
import copy
import json
import re
import sys
from base64 import b64encode
from pathlib import Path

WIDTHS = json.loads((Path(__file__).resolve().parent.parent / "assets" / "font-widths.json").read_text("utf-8"))
SANS, MONO = 6, 3  # Nunito ("Normal") and Cascadia; both ship with the CLI
LINE_HEIGHT = {SANS: 1.25, MONO: 1.2, 9: 1.15}
FALLBACK_WIDTH = 0.6  # per em, for glyphs a font lacks (the browser substitutes a system font)
WIDE_WIDTH = 1.0  # per em, CJK and other full-width text
BOUND_TEXT_PADDING = 5  # Excalidraw's own inner padding for text bound to a container
MIN_FONT_SIZE = 14

INK, SECONDARY, MUTED = "#1e1e1e", "#495057", "#6c757d"  # MUTED is the lightest grey that passes 4.5:1 on white
NOTE = "#c92a2a"  # annotation red that passes 4.5:1 on white at 14 px
# role -> (stroke, light fill, text), from Excalidraw's open-color palette. The text shade
# keeps 4.5:1 on the fill and on white, so coloured titles stay readable.
ROLES = {
    "grey": ("#868e96", "#f1f3f5", "#495057"),
    "blue": ("#1971c2", "#e7f5ff", "#1864ab"),
    "indigo": ("#4263eb", "#dbe4ff", "#364fc7"),
    "violet": ("#7048e8", "#e5dbff", "#5f3dc4"),
    "green": ("#2f9e44", "#ebfbee", "#237032"),
    "teal": ("#0c8599", "#e3fafc", "#0b7285"),
    "orange": ("#e8590c", "#fff4e6", "#c2410c"),
    "red": ("#e03131", "#fff5f5", "#c92a2a"),
    "white": ("#adb5bd", "#ffffff", "#495057"),
}
LARGE_TEXT = 24  # WCAG large text (px) needs 3:1; smaller text needs 4.5:1
SHAPES = {"rectangle", "ellipse", "diamond"}


def wrap(text, width, size=14, font=SANS):
    """Break `text` into lines that each fit `width` px, at spaces. Returns one string."""
    lines, current = [], ""
    for word in text.split():
        candidate = f"{current} {word}".strip()
        if current and measure(candidate, size, font)[0] > width:
            lines.append(current)
            current = word
        else:
            current = candidate
    return "\n".join([*lines, current])


def missing_glyphs(text, font=SANS):
    """Characters the font lacks; the browser draws them in a fallback font."""
    table = WIDTHS.get(str(font), WIDTHS[str(SANS)])["widths"]
    return sorted({c for c in text if c not in table and c != "\n"})


def measure(text, size=16, font=SANS):
    """Return (width, height) in px of `text` as Excalidraw lays it out, one line per \\n."""
    table = WIDTHS.get(str(font), WIDTHS[str(SANS)])["widths"]
    lines = text.split("\n")

    def em_width(char):
        if char in table:
            return table[char]
        return WIDE_WIDTH if ord(char) >= 0x2E80 else FALLBACK_WIDTH

    width = max(sum(em_width(c) for c in line) for line in lines) * size
    height = len(lines) * size * LINE_HEIGHT.get(font, 1.25)
    return round(width, 2), round(height, 2)


def _facing_positions(a_start, a_size, b_start, b_size, margin=16):
    """Where an arrow leaves box a and enters box b along their facing sides (one axis).

    Run straight through the middle of the span both boxes share; without a shared span,
    leave a at the point nearest b and enter b nearest that. Arrows from different sources
    then land at different points instead of piling onto the centre with shallow heads."""
    low = max(a_start, b_start) + margin
    high = min(a_start + a_size, b_start + b_size) - margin
    if low <= high:
        middle = (low + high) / 2
        return middle, middle
    b_centre = b_start + b_size / 2
    leave = min(max(b_centre, a_start + margin), a_start + a_size - margin)
    enter = min(max(leave, b_start + margin), b_start + b_size - margin)
    return leave, enter


class Scene:
    """An Excalidraw scene built in the clean house style. Methods return element ids."""

    def __init__(self, background="#ffffff"):
        self.elements = []
        self.files = {}
        self.background = background
        self._count = 0

    # -- primitives ---------------------------------------------------------------------

    def _new_id(self, prefix):
        self._count += 1
        return f"{prefix}{self._count}"

    def _add(self, kind, x, y, width, height, **fields):
        element = {
            "id": self._new_id(kind[:2]),
            "type": kind,
            "x": round(x, 2),
            "y": round(y, 2),
            "width": round(width, 2),
            "height": round(height, 2),
            "angle": 0,
            "strokeColor": INK,
            "backgroundColor": "transparent",
            "fillStyle": "solid",
            "strokeWidth": 1,
            "strokeStyle": "solid",
            "roughness": 0,
            "opacity": 100,
            "groupIds": [],
            "frameId": None,
            "roundness": None,
            "seed": self._count,
            "version": 1,
            "versionNonce": self._count,
            "isDeleted": False,
            "boundElements": None,
            "updated": 1,
            "link": None,
            "locked": False,
        }
        element.update(fields)
        self.elements.append(element)
        return element

    def _text_element(self, x, y, content, size, font, color, align, container=None):
        width, height = measure(content, size, font)
        return self._add(
            "text", x, y, width, height,
            text=content, originalText=content, fontSize=size, fontFamily=font,
            textAlign=align, verticalAlign="middle" if container else "top",
            containerId=container, lineHeight=LINE_HEIGHT.get(font, 1.25), autoResize=True,
            strokeColor=color,
        )

    def get(self, element_id):
        return next(e for e in self.elements if e["id"] == element_id)

    # -- building blocks ----------------------------------------------------------------

    def text(self, x, y, content, *, size=16, font=SANS, color=INK, align="left"):
        """Free text. With align="center", x is the centre; with "right", the right edge."""
        width, _ = measure(content, size, font)
        left = {"left": x, "center": x - width / 2, "right": x - width}[align]
        return self._text_element(left, y, content, size, font, color, align)["id"]

    def box(self, x, y, width, height, label="", *, role="grey", size=16, font=SANS,
            color=INK, dashed=False, rounded=False, shape="rectangle", fill=None, stroke=None,
            strong=False):
        """A shape with an optional centred label bound to it. `fill`/`stroke` override the
        role colours, e.g. a dark primary button with color="#ffffff". `strong` doubles the
        stroke to mark the one element a reader should see first."""
        role_stroke, role_fill, _ = ROLES[role]
        stroke, fill = stroke or role_stroke, fill or role_fill
        element = self._add(
            shape, x, y, width, height, strokeColor=stroke, backgroundColor=fill,
            strokeStyle="dashed" if dashed else "solid", strokeWidth=2 if strong else 1,
            roundness={"type": 3} if rounded else None,
        )
        if label:
            text_width, text_height = measure(label, size, font)
            text = self._text_element(
                x + (width - text_width) / 2, y + (height - text_height) / 2,
                label, size, font, color, "center", container=element["id"],
            )
            element["boundElements"] = [{"id": text["id"], "type": "text"}]
        return element["id"]

    def chip(self, x, y, label, *, role="grey", size=14, align="left"):
        """A small monospace tag sized to its label. With align="center", x is the centre."""
        text_width, text_height = measure(label, size, MONO)
        width, height = text_width + 16, text_height + 8
        left = x - width / 2 if align == "center" else x
        return self.box(left, y, width, height, label, role=role, size=size, font=MONO)

    def card(self, x, y, width, title, meta=None, details=(), *, role="blue", padding=16, height=None,
             strong=False):
        """A titled card: coloured title, an optional monospace meta line, then secondary
        detail lines. Height fits the content, or `height` when that is taller (to align a
        row). Lint reports lines wider than the card; shorten them, `wrap()` them, or widen the
        card. `strong` doubles the stroke for the one card a reader should see first."""
        stroke, fill, title_color = ROLES[role]
        rows = [(meta, MONO)] if meta else []
        rows += [(line, SANS) for line in details]
        title_height = measure(title, 20, SANS)[1]
        rows_height = sum(measure(line, 14, font)[1] + 4 for line, font in rows)
        height = max(height or 0, padding * 2 + title_height + rows_height)
        frame = self._add("rectangle", x, y, width, height, strokeColor=stroke, backgroundColor=fill,
                          strokeWidth=2 if strong else 1)
        group = self._new_id("g")
        frame["groupIds"] = [group]
        parts = [self._text_element(x + padding, y + padding, title, 20, SANS, title_color, "left")]
        cursor = y + padding + title_height + 4
        for line, font in rows:
            parts.append(self._text_element(x + padding, cursor, line, 14, font, SECONDARY, "left"))
            cursor += measure(line, 14, font)[1] + 4
        for part in parts:
            part["groupIds"] = [group]
        return frame["id"]

    def arrow(self, start, end, *, label=None, dashed=False, color=INK, elbow=False):
        """Connect two shapes edge to edge, bound on both ends, with an optional label chip."""
        a, b = self.get(start), self.get(end)
        gap = 4
        a_cx, a_cy = a["x"] + a["width"] / 2, a["y"] + a["height"] / 2
        b_cx, b_cy = b["x"] + b["width"] / 2, b["y"] + b["height"] / 2
        # Leave through the facing sides: top/bottom when the boxes are stacked, left/right
        # when they sit side by side. Comparing centres alone picks the wrong sides for
        # diagonal pairs in trees.
        vertical_gap = max(b["y"] - (a["y"] + a["height"]), a["y"] - (b["y"] + b["height"]))
        horizontal_gap = max(b["x"] - (a["x"] + a["width"]), a["x"] - (b["x"] + b["width"]))
        if vertical_gap > 0 or horizontal_gap > 0:
            vertical = vertical_gap >= horizontal_gap
        else:
            vertical = abs(b_cy - a_cy) >= abs(b_cx - a_cx)
        if vertical:
            down = b_cy > a_cy
            sx, ex = _facing_positions(a["x"], a["width"], b["x"], b["width"])
            sy = (a["y"] + a["height"] + gap) if down else (a["y"] - gap)
            ey = (b["y"] - gap) if down else (b["y"] + b["height"] + gap)
        else:
            right = b_cx > a_cx
            sy, ey = _facing_positions(a["y"], a["height"], b["y"], b["height"])
            sx = (a["x"] + a["width"] + gap) if right else (a["x"] - gap)
            ex = (b["x"] - gap) if right else (b["x"] + b["width"] + gap)
        dx, dy = ex - sx, ey - sy
        if elbow and vertical:
            points = [[0, 0], [0, dy / 2], [dx, dy / 2], [dx, dy]]
        elif elbow:
            points = [[0, 0], [dx / 2, 0], [dx / 2, dy], [dx, dy]]
        else:
            points = [[0, 0], [dx, dy]]
        element = self._add(
            "arrow", sx, sy, abs(dx), abs(dy), points=[[round(p, 2) for p in pt] for pt in points],
            strokeColor=color, strokeStyle="dashed" if dashed else "solid",
            startBinding={"elementId": start, "focus": 0, "gap": gap},
            endBinding={"elementId": end, "focus": 0, "gap": gap},
            startArrowhead=None, endArrowhead="triangle", lastCommittedPoint=None,
        )
        for shape in (a, b):
            shape["boundElements"] = (shape["boundElements"] or []) + [{"id": element["id"], "type": "arrow"}]
        if label:
            mid = points[len(points) // 2 - 1], points[len(points) // 2]
            mx, my = sx + (mid[0][0] + mid[1][0]) / 2, sy + (mid[0][1] + mid[1][1]) / 2
            chip_height = measure(label, 14, MONO)[1] + 8
            chip = self.get(self.chip(mx, my - chip_height / 2, label, align="center"))
            chip["customData"] = {"labelOf": element["id"]}  # lint lets an arrow pass under its own label
        return element["id"]

    def zone(self, x, y, width, height, title, *, role="grey", note=None):
        """A stage or layer area: a thin outline with its title (and an optional muted note)
        at the top-left. Draw zones before their contents so they sit behind them."""
        stroke, _, title_color = ROLES[role]
        zone_id = self._add("rectangle", x, y, width, height, strokeColor=stroke)["id"]
        title_id = self.text(x + 16, y + 14, title, size=18, color=title_color)
        if note:
            self.text(x + 24 + self.get(title_id)["width"], y + 17, note, size=14, color=SECONDARY)
        return zone_id

    def pointer(self, points, *, color=INK, dashed=False, end=None):
        """A free arrow through absolute points, for annotation leaders and legend samples.
        Pass `end` (a shape id) to bind its head to that shape."""
        x0, y0 = points[0]
        relative = [[round(px - x0, 2), round(py - y0, 2)] for px, py in points]
        xs, ys = [p[0] for p in relative], [p[1] for p in relative]
        element = self._add(
            "arrow", x0, y0, max(xs) - min(xs), max(ys) - min(ys), points=relative,
            strokeColor=color, strokeStyle="dashed" if dashed else "solid",
            startBinding=None, endBinding={"elementId": end, "focus": 0, "gap": 4} if end else None,
            startArrowhead=None, endArrowhead="triangle", lastCommittedPoint=None,
        )
        if end:
            target = self.get(end)
            target["boundElements"] = (target["boundElements"] or []) + [{"id": element["id"], "type": "arrow"}]
        return element["id"]

    def fan_out(self, parent, children, *, labels=None, dashed=(), color=INK, gap=4):
        """One parent to many children through a shared trunk, the readable way to draw a
        tree level: the parent keeps its normal size and each child gets a short branch.
        Children must all sit to the right of the parent or all below it. `labels` maps a
        child id to its branch label; `dashed` lists children whose branch is optional."""
        p = self.get(parent)
        kids = [self.get(c) for c in children]
        labels = labels or {}
        if all(k["x"] >= p["x"] + p["width"] for k in kids):
            trunk = p["x"] + p["width"] + 24
            mid = p["y"] + p["height"] / 2
            centres = [k["y"] + k["height"] / 2 for k in kids]
            self.line([(p["x"] + p["width"] + gap, mid), (trunk, mid)], color=color)
            self.line([(trunk, min(centres + [mid])), (trunk, max(centres + [mid]))], color=color)
            branches = [((trunk, c), (k["x"] - gap, c)) for k, c in zip(kids, centres)]
        elif all(k["y"] >= p["y"] + p["height"] for k in kids):
            trunk = p["y"] + p["height"] + 24
            mid = p["x"] + p["width"] / 2
            centres = [k["x"] + k["width"] / 2 for k in kids]
            self.line([(mid, p["y"] + p["height"] + gap), (mid, trunk)], color=color)
            self.line([(min(centres + [mid]), trunk), (max(centres + [mid]), trunk)], color=color)
            branches = [((c, trunk), (c, k["y"] - gap)) for k, c in zip(kids, centres)]
        else:
            raise ValueError("fan_out needs every child to the right of the parent or below it")
        ids = []
        for kid, (start, end) in zip(kids, branches):
            arrow_id = self.pointer([start, end], color=color, dashed=kid["id"] in dashed, end=kid["id"])
            label = labels.get(kid["id"])
            if label:
                mx, my = (start[0] + end[0]) / 2, (start[1] + end[1]) / 2
                chip_height = measure(label, 14, MONO)[1] + 8
                chip = self.get(self.chip(mx, my - chip_height / 2, label, align="center"))
                chip["customData"] = {"labelOf": arrow_id}
            ids.append(arrow_id)
        return ids

    def line(self, points, *, color=INK, width=1, dashed=False, closed=False, fill=None):
        """A polyline through absolute points; closed=True with a fill draws a custom shape."""
        if closed:
            points = [*points, points[0]]
        x0, y0 = points[0]
        relative = [[px - x0, py - y0] for px, py in points]
        xs, ys = [p[0] for p in relative], [p[1] for p in relative]
        return self._add(
            "line", x0, y0, max(xs) - min(xs), max(ys) - min(ys), points=relative,
            strokeColor=color, strokeWidth=width, strokeStyle="dashed" if dashed else "solid",
            backgroundColor=fill or "transparent", startArrowhead=None, endArrowhead=None,
            lastCommittedPoint=None,
        )["id"]

    def frame(self, x, y, width, height, name, children=()):
        """A named frame (a slide or artboard). Children and their bound text are clipped to it."""
        element = self._add("frame", x, y, width, height, name=name, strokeColor="#bbb", strokeWidth=2)
        for child_id in children:
            child = self.get(child_id)
            groups = set(child["groupIds"])
            texts = {b["id"] for b in child["boundElements"] or [] if b["type"] == "text"}
            for part in self.elements:
                if part is child or part["id"] in texts or groups & set(part["groupIds"]):
                    part["frameId"] = element["id"]
        return element["id"]

    def icon(self, x, y, svg, *, size=24, color=INK):
        """Embed an SVG icon (e.g. a Lucide file). Sets a numeric size and replaces currentColor,
        because the CLI crops SVGs that lack width/height."""
        root = re.search(r"<svg\b[^>]*>", svg)
        if root is None:
            raise ValueError("not an SVG document")
        sized = re.sub(r'\s(width|height)="[^"]*"', "", root[0]).replace("<svg", f'<svg width="{size}" height="{size}"', 1)
        svg = (svg[:root.start()] + sized + svg[root.end():]).replace("currentColor", color)
        file_id = self._new_id("file")
        data_url = "data:image/svg+xml;base64," + b64encode(svg.encode()).decode()
        self.files[file_id] = {"id": file_id, "mimeType": "image/svg+xml", "dataURL": data_url, "created": 1}
        return self._add("image", x, y, size, size, fileId=file_id, status="saved", scale=[1, 1], crop=None)["id"]

    def library_item(self, elements, x, y):
        """Insert one item from an .excalidrawlib (v2 `libraryItems[i]["elements"]` or v1
        `library[i]`) with its top-left at (x, y), fresh ids, and the clean house style."""
        items = [copy.deepcopy(e) for e in elements if not e.get("isDeleted")]
        ids = {e["id"]: self._new_id("li") for e in items}
        groups = {}
        min_x, min_y = min(e["x"] for e in items), min(e["y"] for e in items)
        for e in items:
            e["id"] = ids[e["id"]]
            e["groupIds"] = [groups.setdefault(g, self._new_id("g")) for g in e.get("groupIds", [])]
            e["x"] += x - min_x
            e["y"] += y - min_y
            e["locked"] = False
            e["roughness"] = 0
            for key in ("containerId", "frameId"):
                if e.get(key):
                    e[key] = ids.get(e[key])
            if e.get("boundElements"):
                e["boundElements"] = [dict(b, id=ids[b["id"]]) for b in e["boundElements"] if b["id"] in ids]
            for key in ("startBinding", "endBinding"):
                binding = e.get(key)
                if binding:
                    e[key] = dict(binding, elementId=ids[binding["elementId"]]) if binding["elementId"] in ids else None
            if e["type"] == "text":
                e["fontFamily"] = MONO if e.get("fontFamily") in (3, 8) else SANS
        self.elements.extend(items)
        return [e["id"] for e in items]

    # -- output -------------------------------------------------------------------------

    def to_json(self):
        return {
            "type": "excalidraw",
            "version": 2,
            "source": "excalidraw-draw",
            "elements": self.elements,
            "appState": {"viewBackgroundColor": self.background, "gridSize": 20},
            "files": self.files,
        }

    def save(self, path):
        """Write the scene and print lint findings to stderr. Returns the findings."""
        Path(path).write_text(json.dumps(self.to_json(), indent=1, ensure_ascii=False), "utf-8")
        findings = lint(self.to_json())
        for finding in findings:
            print(f"{path}: {finding}", file=sys.stderr)
        return findings


# -- lint -------------------------------------------------------------------------------


def _contrast(foreground, background):
    """WCAG contrast ratio of two #rgb/#rrggbb colours; None when either is not a hex colour."""

    def luminance(hex_color):
        value = hex_color.lstrip("#")
        if len(value) == 3:
            value = "".join(c * 2 for c in value)
        if not re.fullmatch(r"[0-9a-fA-F]{6}", value):
            return None
        channels = [int(value[i:i + 2], 16) / 255 for i in (0, 2, 4)]
        r, g, b = (c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in channels)
        return 0.2126 * r + 0.7152 * g + 0.0722 * b

    fg, bg = luminance(foreground), luminance(background)
    if fg is None or bg is None:
        return None
    return (max(fg, bg) + 0.05) / (min(fg, bg) + 0.05)


def _fill_behind(text, container, elements, canvas):
    """The colour a text sits on: its container's fill, else the smallest filled shape around it."""
    if container is not None and container.get("backgroundColor", "transparent") != "transparent":
        return container["backgroundColor"]
    around = [e for e in elements if e["type"] in SHAPES and e.get("backgroundColor", "transparent") != "transparent"
              and _contains(e, text)]
    if around:
        return min(around, key=lambda e: e["width"] * e["height"])["backgroundColor"]
    return canvas


def _absolute_points(arrow):
    return [(arrow["x"] + px, arrow["y"] + py) for px, py in arrow["points"]]


def _strictly_inside(point, shape, inset):
    px, py = point
    return (shape["x"] + inset < px < shape["x"] + shape["width"] - inset
            and shape["y"] + inset < py < shape["y"] + shape["height"] - inset)


def _path_enters(arrow, shape, inset):
    """True when the arrow's path passes through the inside of `shape` (sampled every 4 px)."""
    points = _absolute_points(arrow)
    for (x1, y1), (x2, y2) in zip(points, points[1:]):
        steps = max(1, int(max(abs(x2 - x1), abs(y2 - y1)) / 4))
        for i in range(steps + 1):
            t = i / steps
            if _strictly_inside((x1 + (x2 - x1) * t, y1 + (y2 - y1) * t), shape, inset):
                return True
    return False


def _usable_width(container, text_height):
    """Width a centred label of `text_height` gets inside a rectangle, diamond, or ellipse."""
    width, height = container["width"], max(container["height"], 1)
    share = min(text_height / height, 1)
    if container["type"] == "diamond":
        return width * (1 - share)
    if container["type"] == "ellipse":
        return width * (1 - share ** 2) ** 0.5
    return width


def _is_label_on(shape, arrow):
    """A small box with its own text, centred on the arrow's path and bound to no arrow: a
    hand-made edge label. Lint lets the arrow pass under it."""
    bound = {b["type"] for b in shape.get("boundElements") or []}
    if shape["height"] > 40 or "text" not in bound or "arrow" in bound:
        return False
    centre = {"x": shape["x"] + shape["width"] / 2 - 3, "y": shape["y"] + shape["height"] / 2 - 3,
              "width": 6, "height": 6}
    return _path_enters(arrow, centre, inset=0)


def _holds_endpoint(shape, arrow):
    """A zone or frame drawn around an arrow's start or end may contain its path."""
    points = _absolute_points(arrow)
    return _strictly_inside(points[0], shape, 0) or _strictly_inside(points[-1], shape, 0)


def _overlaps(a, b):
    return (a["x"] < b["x"] + b["width"] and b["x"] < a["x"] + a["width"]
            and a["y"] < b["y"] + b["height"] and b["y"] < a["y"] + a["height"])


def _contains(outer, inner):
    return (outer["x"] <= inner["x"] and outer["y"] <= inner["y"]
            and inner["x"] + inner["width"] <= outer["x"] + outer["width"]
            and inner["y"] + inner["height"] <= outer["y"] + outer["height"])


def lint(scene):
    """Return findings as "error: ..." (renders wrong) or "style: ..." (off house style)."""
    elements = [e for e in scene.get("elements", []) if not e.get("isDeleted")]
    by_id = {}
    findings = []
    for e in elements:
        if e["id"] in by_id:
            findings.append(f"error: {e['id']}: duplicate id")
        by_id[e["id"]] = e
    canvas = scene.get("appState", {}).get("viewBackgroundColor", "#ffffff")

    def bound_ids(element):
        return {b["id"] for b in element.get("boundElements") or []}

    for e in elements:
        eid, kind = e["id"], e["type"]
        if kind in ("line", "arrow", "freedraw") and len(e.get("points", [])) < 2:
            findings.append(f"error: {eid}: {kind} needs at least 2 points")
        for key in ("startBinding", "endBinding"):
            target = by_id.get((e.get(key) or {}).get("elementId"))
            if e.get(key) and target is None:
                findings.append(f"error: {eid}: {key} points to a missing element")
            elif target is not None and eid not in bound_ids(target):
                findings.append(f"error: {eid}: {target['id']} lacks this arrow in boundElements")
        if kind == "image" and e.get("fileId") not in scene.get("files", {}):
            findings.append(f"error: {eid}: image fileId has no entry in files")
        if e.get("roughness", 1) > 0 and kind not in ("text", "freedraw", "image"):
            findings.append(f"style: {eid}: roughness {e.get('roughness', 1)} draws sketchy strokes")
        if kind != "text":
            continue
        size, font = e.get("fontSize", 20), e.get("fontFamily", 5)
        need_width, need_height = measure(e.get("text", ""), size, font)
        if str(font) not in WIDTHS:
            # No width table for this font: trust the stored size instead of guessing.
            need_width, need_height = e.get("width", 0), e.get("height", 0)
        if size < MIN_FONT_SIZE:
            findings.append(f"error: {eid}: font size {size} is below {MIN_FONT_SIZE}")
        if font in (1, 5):
            findings.append(f"style: {eid}: hand-drawn font {font}; house style is {SANS} or {MONO}")
        missing = missing_glyphs(e.get("text", ""), font)
        if missing and str(font) in WIDTHS:
            findings.append(f"style: {eid}: font {font} lacks {''.join(missing)}; use words or the mono font")
        container = by_id.get(e.get("containerId"))
        behind = _fill_behind(e, container, elements, canvas)
        ratio = _contrast(e.get("strokeColor", INK), behind)
        needed = 3.0 if size >= LARGE_TEXT else 4.5
        if ratio is not None and ratio < needed:
            findings.append(f"error: {eid}: text contrast {ratio:.2f}:1 on {behind}, needs {needed}:1")
        if e.get("containerId") and container is None:
            findings.append(f"error: {eid}: containerId points to a missing element")
        elif container is not None:
            if eid not in bound_ids(container):
                findings.append(f"error: {eid}: container {container['id']} lacks this text in boundElements")
            inner_width = _usable_width(container, need_height) - 2 * BOUND_TEXT_PADDING
            if need_width > inner_width + 1:
                findings.append(f"error: {eid}: label needs {need_width:.0f}px, container gives {inner_width:.0f}px")
            if need_height > container["height"] + 1:
                findings.append(f"error: {eid}: label needs {need_height:.0f}px height, container has {container['height']:.0f}px")
            centre_x = container["x"] + (container["width"] - e["width"]) / 2
            centre_y = container["y"] + (container["height"] - e["height"]) / 2
            if container["type"] != "arrow" and (abs(e["x"] - centre_x) > 4 or abs(e["y"] - centre_y) > 4):
                findings.append(f"error: {eid}: label is not centred in {container['id']}; the CLI draws it where x/y say")
        else:
            if need_width > e.get("width", 0) * 1.1 + 2:
                findings.append(f"error: {eid}: stored width {e.get('width', 0):.0f} is narrower than the text ({need_width:.0f}px)")
            drawn = dict(e, width=max(e.get("width", 0), need_width), height=max(e.get("height", 0), need_height))
            for shape in elements:
                if shape["type"] in SHAPES and _overlaps(drawn, shape) and not _contains(shape, drawn):
                    findings.append(f"error: {eid}: text runs into {shape['id']}")
                    break

    shapes = [e for e in elements if e["type"] in SHAPES or e["type"] == "image"]
    for chip in shapes:
        arrow = by_id.get((chip.get("customData") or {}).get("labelOf"))
        if arrow is None:
            continue
        points = _absolute_points(arrow)
        length = sum(abs(x2 - x1) + abs(y2 - y1) for (x1, y1), (x2, y2) in zip(points, points[1:]))
        horizontal = abs(points[-1][0] - points[0][0]) >= abs(points[-1][1] - points[0][1])
        covered = chip["width"] if horizontal else chip["height"]
        if covered > 0.7 * length:
            findings.append(f"style: {chip['id']}: label covers most of arrow {arrow['id']}; lengthen the arrow or shorten the label")
    for e in elements:
        if e["type"] != "arrow" or len(e.get("points", [])) < 2:
            continue
        ends = {(e.get(k) or {}).get("elementId") for k in ("startBinding", "endBinding")}
        for shape in shapes:
            if (shape.get("customData") or {}).get("labelOf") == e["id"] or _is_label_on(shape, e):
                continue
            if shape["id"] in ends:
                hit = _path_enters(e, shape, inset=3)
                message = f"error: {e['id']}: arrow runs through its own end {shape['id']}"
            else:
                hit = _path_enters(e, shape, inset=2) and not _holds_endpoint(shape, e)
                message = f"error: {e['id']}: arrow crosses {shape['id']}"
            if hit:
                findings.append(message)
    loose_text = [e for e in elements if e["type"] == "text" and not e.get("containerId")]
    for group in (shapes, loose_text):
        for i, a in enumerate(group):
            for b in group[i + 1:]:
                shared_group = set(a.get("groupIds") or []) & set(b.get("groupIds") or [])
                if shared_group or not _overlaps(a, b) or _contains(a, b) or _contains(b, a):
                    continue
                findings.append(f"error: {a['id']} and {b['id']} overlap")
    return findings


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    commands = parser.add_subparsers(dest="command", required=True)
    lint_parser = commands.add_parser("lint", help="report defects in a .excalidraw file")
    lint_parser.add_argument("scene", type=Path)
    measure_parser = commands.add_parser("measure", help="print the width and height of a label")
    measure_parser.add_argument("text")
    measure_parser.add_argument("--size", type=int, default=16)
    measure_parser.add_argument("--font", type=int, default=SANS)
    crop_parser = commands.add_parser("crop", help="copy a scene with a frame named crop over an area")
    crop_parser.add_argument("scene", type=Path)
    crop_parser.add_argument("area", type=float, nargs=4, metavar=("X", "Y", "W", "H"))
    args = parser.parse_args()

    if args.command == "crop":
        data = json.loads(args.scene.read_text("utf-8"))
        x, y, width, height = args.area
        # --frame-id clips the render to the frame's bounds, even with no children assigned.
        # --frame-id also skips elements that belong to another frame, so the throwaway copy
        # drops frame membership.
        for element in data["elements"]:
            element["frameId"] = None
        data["elements"].append({**Scene()._add("frame", x, y, width, height, name="crop"), "id": "crop"})
        target = args.scene.with_suffix(".crop.excalidraw")
        target.write_text(json.dumps(data, ensure_ascii=False), "utf-8")
        print(f"excalidraw render {target} --frame-id crop --out {target.with_suffix('.png')} --scale 2")
        return

    if args.command == "measure":
        width, height = measure(args.text.replace("\\n", "\n"), args.size, args.font)
        print(json.dumps({"width": width, "height": height}))
        return
    findings = lint(json.loads(args.scene.read_text("utf-8")))
    for finding in findings:
        print(f"{args.scene}: {finding}")
    if any(f.startswith("error:") for f in findings):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
