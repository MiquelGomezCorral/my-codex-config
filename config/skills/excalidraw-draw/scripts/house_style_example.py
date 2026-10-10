#!/usr/bin/env python3
"""Build the house-style starter scene (assets/house-style.excalidraw).

It shows the core building blocks once: title and subtitle, legend chips, coloured cards with
monospace meta lines, a dashed "not a model" box, labelled arrows, a trunk from one parent
to several children (`fan_out`), a numbered step list, and a muted footnote. Copy elements from it, or read this file as an API example.

Usage: python3 house_style_example.py [output.excalidraw]
"""

import sys
from pathlib import Path

from scene import MONO, MUTED, SECONDARY, Scene

OUTPUT = Path(__file__).resolve().parent.parent / "assets" / "house-style.excalidraw"


def build():
    s = Scene()
    s.text(40, 40, "Agent tree: who starts whom", size=28)
    s.text(40, 82, "Read from the code on 2026-10-08. Each card names the model and what it holds.",
           size=16, color=SECONDARY)

    # Legend: one chip per meaning, explained in plain text beside it.
    s.chip(40, 124, "tool")
    s.text(96, 127, "a tool the agent holds", size=14, color=SECONDARY)
    s.chip(290, 124, "skill", role="violet")
    s.text(354, 127, "a method for its task", size=14, color=SECONDARY)

    person = s.box(380, 170, 160, 48, "The person", size=18)
    runtime = s.box(40, 300, 220, 70, "The runtime\ncode, no model", dashed=True, size=14)
    author = s.card(340, 290, 240, "Author", "gpt-6 · low", ["3 skills · 27 tools"], role="indigo")
    crafter = s.card(200, 510, 240, "Crafter", "gpt-6 · medium", ["1 skill per task"], role="orange")
    critic = s.card(560, 510, 240, "Critic", "author's model", ["read-only tools"], role="violet")

    s.arrow(person, author, label="chat")
    s.fan_out(author, [crafter, critic], labels={crafter: "craft", critic: "critique"})
    s.arrow(runtime, crafter, label="per format", dashed=True, color=MUTED)

    # Numbered steps: step number in mono, a box per step, detail text to the right.
    s.text(40, 680, "Start", size=20)
    previous = None
    for number, (step, detail) in enumerate([
        ("The author calls craft", "Scope unit means the plan first."),
        ("The runtime admits it", "Refused when the unit has errors."),
    ], start=1):
        y = 720 + (number - 1) * 100
        s.text(40, y + 18, f"{number:02d}", size=14, font=MONO, color=MUTED)
        current = s.box(80, y, 260, 52, step, role="indigo" if number == 1 else "grey")
        s.text(370, y + 16, detail, size=14, color=SECONDARY)
        if previous:
            s.arrow(previous, current)
        previous = current

    s.text(40, 940, "Dashed: code starts it, no model decides.", size=14, color=MUTED)
    return s


if __name__ == "__main__":
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else OUTPUT
    findings = build().save(target)
    print(target)
    raise SystemExit(1 if any(f.startswith("error:") for f in findings) else 0)
