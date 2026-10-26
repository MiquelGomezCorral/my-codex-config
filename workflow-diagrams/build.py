"""Rebuilds the three README review pictures as editable Excalidraw scenes.

From this folder:
    PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=<excalidraw-draw skill>/scripts python3 build.py
    for n in Review Coding-loop Whole-Flow; do
      excalidraw render $n.excalidraw --out $n.png --scale 1.3 --max-width 8192 --max-height 8192
    done

The review panel (diff review, verdict, validation) is drawn once and reused, so the three
pictures cannot drift apart again. Review validates and routes verified in-scope P0-P3
findings; the cleanup swarm always runs.
"""

from scene import INK, MONO, SECONDARY, Scene, measure

# kind -> (stroke, fill, dashed); the legend of the workflow pictures
KINDS = {
    "super": ("#4263eb", "#eef1ff", False),
    "sub": ("#4263eb", "#eef1ff", True),
    "worker": ("#9c36b5", "#f8e9fb", False),
    "mid": ("#0c8599", "#e3fafc", False),
    "optional": ("#0c8599", "#effcfd", True),
    "out": ("#099268", "#e6f6ee", False),
    "human": ("#e8590c", "#fff0e0", False),
    "input": ("#495057", "#e9ecef", False),
}
DECISION = {"human": ("#e03131", "#ffecec", False), "agent": ("#e03131", "#ffecec", True)}
PANEL_FILL, ZONE_FILL = "#f3f0ff", "#f8f9fa"
GAP = 4  # arrow stop distance, the same as Scene.arrow


def node(s, x, y, w, h, label, kind, size=16):
    """A rounded role box; grows around its centre when the label needs more room."""
    stroke, fill, dashed = KINDS[kind]
    text_w, text_h = measure(label, size)
    new_w, new_h = max(w, text_w + 28), max(h, text_h + 16)
    return s.box(x - (new_w - w) / 2, y - (new_h - h) / 2, new_w, new_h, label, rounded=True,
                 stroke=stroke, fill=fill, dashed=dashed, size=size)


def decision(s, x, y, w, h, label, who="agent", size=16):
    stroke, fill, dashed = DECISION[who]
    return s.box(x, y, w, h, label, shape="diamond", stroke=stroke, fill=fill, dashed=dashed, size=size)


def container(s, x, y, w, h, fill=PANEL_FILL, dashed=False):
    return s.box(x, y, w, h, "", rounded=True, stroke=INK, fill=fill, dashed=dashed)


def edge(s, shape, side, gap=GAP):
    """Mid-point of one side of a shape, `gap` px outside it."""
    e = s.get(shape)
    x, y, w, h = e["x"], e["y"], e["width"], e["height"]
    return {"l": (x - gap, y + h / 2), "r": (x + w + gap, y + h / 2),
            "t": (x + w / 2, y - gap), "b": (x + w / 2, y + h + gap)}[side]


def link(s, start, start_side, end, end_side, *, via=(), dashed=False, color=INK):
    """An arrow from one shape side to another, through absolute `via` points."""
    return s.pointer([edge(s, start, start_side, GAP), *via, edge(s, end, end_side)],
                     end=end, dashed=dashed, color=color)


def note(s, x, y, text, width=None, size=14, mono=False):
    from scene import wrap
    font = MONO if mono else 6
    return s.text(x, y, wrap(text, width, size, font) if width else text, size=size, color=SECONDARY, font=font)


def label(s, x, y, text):
    return s.text(x, y, text, size=14, color=INK)


def review_panel(s, ox, oy):
    """The review box: diff review, kind of review, verdicts, validation. 920 x 544."""
    s.box(ox, oy, 920, 544, "", rounded=True, stroke=INK, fill=PANEL_FILL)
    s.text(ox + 896, oy + 6, "Review", size=24, font=MONO, align="right")
    gets = node(s, ox + 40, oy + 64, 240, 64, "Gets diffs and plans review", "sub")
    kind = decision(s, ox + 350, oy + 46, 160, 100, "Kind of\nreview", who="human")
    s.text(ox + 430, oy + 18, "Stated on the plan by human", size=14, color=INK, align="center")
    s.box(ox + 540, oy + 48, 350, 472, "", rounded=True, stroke=INK, fill=PANEL_FILL, dashed=True)

    def row(y, tag, first, others=("...", "...")):
        s.text(ox + 556, oy + y, tag, size=14, font=MONO)
        ids = [node(s, ox + 556, oy + y + 22, 96, 34, first, "worker")]
        for i, other in enumerate(others):
            ids.append(node(s, ox + 666 + i * 110, oy + y + 22, 96, 34, other, "worker"))
        return ids

    def wide(y, text):
        return node(s, ox + 556, oy + y, 316, 34, text, "worker")

    flash = row(52, "Flash", "Review", others=())[0]
    s.text(ox + 662, oy + 78, "One cheap model;\nread-only terminal", size=14, color=INK)
    swarm = row(126, "Swarm", "Review")[0]
    wide(190, "Strong complete-change review")
    s.text(ox + 556, oy + 244, "Swarm + Smart", size=14, font=MONO)
    smart = wide(266, "Review Smart")
    row_y = 310
    for i, text in enumerate(("Review", "...", "...")):
        node(s, ox + 556 + i * 110, oy + row_y, 96, 34, text, "worker")
    s.text(ox + 556, oy + 362, "Full", size=14, font=MONO)
    full = wide(384, "Review Smart")
    for i, text in enumerate(("Review", "...", "...")):
        node(s, ox + 556 + i * 110, oy + 428, 96, 34, text, "worker")
    wide(470, "e2e tester (computer-controller)")

    # kind of review fans out to the four depths
    trunk = ox + 526
    kx, ky = edge(s, kind, "r")
    s.line([(kx, ky), (trunk, ky)])
    s.line([(trunk, oy + 91), (trunk, oy + 401)])
    for target in (flash, swarm, smart, full):
        tx, ty = edge(s, target, "l")
        s.pointer([(trunk, ty), (tx, ty)], end=target)

    verdict = node(s, ox + 40, oy + 250, 260, 72, "Each agent verdict:\nReject / P0 to P3 file:line", "mid")
    validate = node(s, ox + 40, oy + 380, 260, 72, "Validate P0-P3\nReal or FPs", "sub")
    s.pointer([(ox + 536, oy + 487), (ox + 420, oy + 487), (ox + 420, oy + 286), edge(s, verdict, "r")], end=verdict)
    link(s, verdict, "b", validate, "t")
    link(s, gets, "r", kind, "l")
    return {"gets": gets, "kind": kind, "validate": validate, "verdict": verdict}


def swarm_panel(s, x, y):
    """The cleanup swarm: always runs, lens specialists plus simplest-design reviewers."""
    box = container(s, x, y, 340, 180, fill="#ffffff", dashed=True)
    s.text(x + 16, y + 10, "Swarm: always runs", size=14, font=MONO)
    s.text(x + 16, y + 38, "Lens specialists, 2 or more", size=14, color=SECONDARY)
    for i, text in enumerate(("Lens", "Lens", "...")):
        node(s, x + 16 + i * 110, y + 60, 96, 34, text, "worker")
    s.text(x + 16, y + 108, "Simplest-design reviewers, 1 or 2", size=14, color=SECONDARY)
    node(s, x + 16, y + 130, 308, 34, "Review Smart", "worker")
    return box


def coding_loop():
    s = Scene()
    w = lambda *a, **k: node(s, *a, **k)
    draft = w(300, 20, 250, 70, "Draft worker refine\nplan/goal", "super")
    s.text(190, 104, "Loop", size=22)
    s.line([(150, 140), (700, 140)], dashed=True)
    refined = w(300, 170, 250, 76, "Refined plan +\nown terminal + worktree", "mid")
    small = decision(s, 70, 160, 170, 100, "Small\nchange?")
    yes_babysit = w(90, 300, 130, 44, "Babysit", "super")
    no_babysit = w(90, 400, 130, 44, "Babysit", "sub")
    worker = w(300, 330, 250, 80, "Worker\nworks / implements", "worker")
    panel = review_panel(s, 720, 140)
    verified = w(300, 520, 250, 76, "Verified in-scope\nP0-P3 findings", "mid")
    anyone = decision(s, 70, 510, 170, 100, "Any\nfinding?")
    nxt = w(70, 650, 170, 46, "Next: clean up", "out")

    link(s, draft, "b", refined, "t")
    link(s, refined, "l", small, "r")
    link(s, small, "b", yes_babysit, "t")
    sx, sy = edge(s, small, "l")
    s.pointer([(sx, sy), (34, sy), (34, 422), edge(s, no_babysit, "l")], end=no_babysit)
    for babysit, y in ((yes_babysit, 350), (no_babysit, 390)):
        bx, by = edge(s, babysit, "r")
        s.pointer([(bx, by), (262, by), (262, y), (296, y)], end=worker)
    gx, gy = edge(s, panel["gets"], "l")
    wx, wy = edge(s, worker, "r")
    s.pointer([(wx, wy), (640, wy), (640, gy), (gx, gy)], end=panel["gets"])
    link(s, panel["validate"], "l", verified, "r")
    link(s, verified, "l", anyone, "r")
    ax, ay = edge(s, anyone, "l")
    dx, dy = edge(s, draft, "l")
    s.pointer([(ax, ay), (12, ay), (12, dy), (dx, dy)], end=draft)
    link(s, anyone, "b", nxt, "t")
    label(s, 40, 176, "No")
    label(s, 168, 268, "Yes")
    label(s, 24, 534, "Yes")
    label(s, 168, 618, "No")
    note(s, 300, 606, "Out-of-scope findings are logged, not fixed.", 380)
    s.save("Coding-loop.excalidraw")


K = 1.8  # Whole-Flow: scene units per unit of the original picture's layout grid


def whole_flow():
    s = Scene()
    k = K
    below = 72  # the review panel is taller than the original, so the lanes under it move down

    def n(x, y, w, h, text, kind, size=16):
        return node(s, x * k, y * k, w * k, h * k, text, kind, size)

    def dia(x, y, w, h, text, who="agent", size=16):
        return decision(s, x * k, y * k, w * k, h * k, text, who, size)

    def txt(x, y, text, size=14, mono=False, width=None):
        return note(s, x * k, y * k, text, width and width * k, size, mono)

    def lab(x, y, text):
        return label(s, x * k, y * k, text)

    def zone(x, y, w, h, title, title_x, title_y):
        s.box(x * k, y * k, w * k, h * k, "", rounded=True, stroke=INK, fill=ZONE_FILL)
        s.text(title_x * k, title_y * k, title, size=34, font=MONO)

    def panel_box(x, y, w, h, title):
        s.box(x * k, y * k, w * k, h * k, "", rounded=True, stroke=INK, fill=PANEL_FILL)
        s.text((x + w - 8) * k, (y + 6) * k, title, size=20, font=MONO, align="right")

    def path(points, end, dashed=False):
        s.pointer(points, end=end, dashed=dashed)

    # legend
    s.text(1085 * k, 5 * k, "Sub agents:\n- On loops are the same\n- On different steps new sessions", size=16)
    lab(1112, 64, "Always the same")
    lab(1346, 62, "Same or other harness")
    for col, row, text, kind in ((0, 80, "Super-agent", "super"), (1, 80, "Sub orchestrator", "sub"),
                                 (2, 80, "Agent worker", "worker"), (0, 110, "Intermediate - artifact", "mid"),
                                 (1, 110, "Optional mid-artifact", "optional"), (2, 110, "Main flow output", "out"),
                                 (0, 140, "Human decision", "human")):
        n(1085 + col * 125, row, 117, 17, text, kind)
    dia(1210, 134, 117, 30, "Decision", "human", 14)
    dia(1335, 134, 117, 30, "Decision", "agent", 14)
    lab(1253, 166, "Human")
    lab(1381, 166, "Agent")

    incoming = n(713, 74, 126, 38, "Incoming work", "input")
    initial = n(713, 138, 126, 42, "Draft what happened, the\ninitial goal, evidence and\nanything already clear", "human", 14)
    link(s, incoming, "b", initial, "t")

    # get to know what we want
    zone(64, 189, 1403, 578, "Get to know what we want", 98, 205)
    panel_box(861, 219, 296, 227, "First Draft")
    investigate = n(717, 228, 118, 42, "Investigate and draft", "super")
    grill = n(880, 230, 102, 38, "Grill me", "sub")
    research = n(1001, 281, 118, 38, "Research", "worker")
    zero = n(1001, 339, 118, 38, "From 0, no code opinion", "worker")
    artifacts = n(1001, 396, 118, 38, "Artifacts:\nSchemas / Mockup", "optional")
    first_draft = n(717, 325, 118, 38, "First draft", "mid")
    link(s, initial, "b", investigate, "t")
    link(s, investigate, "r", grill, "l")
    gx, gy = edge(s, grill, "b")
    s.line([(gx, gy), (gx, 415 * k)])
    for target in (research, zero, artifacts):
        tx, ty = edge(s, target, "l")
        s.pointer([(gx, ty), (tx, ty)], end=target)
    fx, fy = edge(s, first_draft, "r")
    path([(gx - 20 * k, gy), (gx - 20 * k, fy), (fx, fy)], first_draft)
    txt(1164, 330, "Get an agent to think about the solution without looking at the code or "
        "'what we want'. The idea is that the agent thinks by itself and is not biased by "
        "what we have because 'is already done'", mono=True, width=270)

    # improvement loop
    panel_box(353, 308, 315, 165, "Improvement loop")
    txt(361, 316, "User must be able to ask for more, resolve questions with the other grill me, "
        "see mockups and schemas, change them and land ALL", mono=True, width=128)
    feedback = n(500, 342, 125, 38, "Feed back / Edits", "human")
    improve = n(503, 397, 118, 38, "Improve / change", "super")
    txt(365, 383, "At hand optional swarm for fixing")
    swarm_ids = [n(399, 397 + i * 20, 55, 16, "...", "worker" if i < 2 else "optional") for i in range(3)]
    accept = dia(736, 390, 80, 52, "Accept?", "human")
    link(s, first_draft, "b", accept, "t")
    link(s, improve, "r", accept, "l")
    link(s, feedback, "b", improve, "t")
    for target in swarm_ids:
        tx, ty = edge(s, target, "r")
        s.pointer([edge(s, improve, "l"), (tx + 30, ty), (tx, ty)], end=target)
    fx, fy = edge(s, feedback, "r")
    no_y = 405.6 * k  # on the diamond's upper-left side, clear of the arrow into its left corner
    path([(752 * k, no_y), (647 * k, no_y), (647 * k, fy), (fx, fy)], feedback)
    lab(690, 391, "No")
    full_idea = n(717, 489, 118, 38, "Full idea", "mid")
    link(s, accept, "b", full_idea, "t")
    lab(790, 446, "Yes")

    # adversarial
    panel_box(213, 497, 455, 203, "Adversarial")
    idea = n(540, 530, 118, 38, "Full idea", "mid")
    cites = n(540, 570, 118, 38, "Citations +\nverbatim evidence", "mid")
    critique = n(386, 551, 118, 38, "Critique/s", "worker")
    txt(386, 536, "Different families of models")
    rebuttal = n(231, 550, 118, 38, "One rebuttal:\naccept / reject / refer", "super")
    resolves = n(231, 642, 118, 38, "Human resolves\nremaining disputes", "human")
    together = n(539, 642, 118, 38, "Put all together", "super")
    second = n(716, 570, 118, 38, "Ask for\nSecond opinion", "super")
    txt(850, 572, "Overengineer\nActually feasible\nActually the problem\n...")
    link(s, full_idea, "b", second, "t")
    s.pointer([edge(s, second, "l"), edge(s, cites, "r")], end=cites)
    s.pointer([(540 * k - GAP, 570 * k), edge(s, critique, "r")], end=critique, color="#868e96")
    link(s, critique, "l", rebuttal, "r")
    link(s, rebuttal, "b", resolves, "t")
    txt(300, 606, "Orchestrator handles some trivial stuff and passes the rest to the human", width=130)
    link(s, resolves, "r", together, "l")
    txt(366, 645, "Close the ideas, goals and artifacts")
    wave = n(709, 709, 118, 38, "Wave plan\nfor follow-up", "out")
    txt(842, 718, "May be 1, 2, 3... slices depending on the size of what we want", width=130)
    tx, ty = edge(s, together, "r")
    path([(tx, ty), (768 * k, ty), edge(s, wave, "t")], wave)

    # hand over
    notify = n(521, 815, 127, 38, "Notify", "human")
    approve = n(705, 815, 127, 38, "Read / Understand / Approve", "human")
    link(s, wave, "b", approve, "t")
    link(s, notify, "r", approve, "l")

    # building
    zone(66, 886, 1404, 1062 + below, "Building: repeat per slice", 104, 898)
    draft = n(709, 917, 118, 38, "Draft worker refine\nplan/goal", "super")
    link(s, approve, "b", draft, "t")
    txt(613, 944, "Loop", size=22)
    s.line([(613 * k, 970 * k), (870 * k, 970 * k)], dashed=True)
    refined = n(709, 984, 118, 38, "Refined plan +\nown terminal + worktree", "mid")
    link(s, draft, "b", refined, "t")
    small = dia(585, 975, 90, 58, "Small\nchange?")
    link(s, refined, "l", small, "r")
    yes_babysit = n(600, 1054, 58, 17, "Babysit", "super")
    no_babysit = n(600, 1085, 58, 17, "Babysit", "sub")
    worker = n(711, 1060, 118, 38, "Worker\nworks / implements", "worker")
    link(s, small, "b", yes_babysit, "t")
    sx, sy = edge(s, small, "l")
    path([(sx, sy), (565 * k, sy), (565 * k, edge(s, no_babysit, "l")[1]), edge(s, no_babysit, "l")], no_babysit)
    for babysit, y in ((yes_babysit, 1066), (no_babysit, 1086)):
        bx, by = edge(s, babysit, "r")
        s.pointer([(bx, by), (690 * k, by), (690 * k, y * k), (edge(s, worker, "l")[0], y * k)], end=worker)
    lab(572, 980, "No")
    lab(636, 1038, "Yes")

    panel = review_panel(s, 883 * k, 977 * k)
    gx, gy = edge(s, panel["gets"], "l")
    wx, wy = edge(s, worker, "r")
    s.pointer([(wx, wy), (860 * k, wy), (860 * k, gy), (gx, gy)], end=panel["gets"])
    wave_box = s.get(wave)
    s.pointer([(883 * k + 560, 977 * k + 14), (wave_box["x"] + wave_box["width"] - 24, wave_box["y"] + wave_box["height"] + GAP)],
              end=wave, dashed=True)

    verified = n(710, 1189, 118, 38, "Verified in-scope\nP0-P3 findings", "mid")
    anyone = dia(590, 1182, 78, 52, "Any\nfinding?")
    link(s, panel["validate"], "l", verified, "r")
    link(s, verified, "l", anyone, "r")
    ax, ay = edge(s, anyone, "l")
    loop_x = 511 * k  # every "go back to the coder" branch joins this line
    s.line([(ax, ay), (loop_x, ay)])
    lab(576, 1190, "Yes")

    def divider(y, title):
        s.line([(116 * k, y * k), (1442 * k, y * k)], dashed=True)
        s.text(117 * k, (y + 11) * k, title, size=22, font=MONO)

    # clean up
    o = below
    divider(1233 + o, "Clean up")
    git = n(709, 1247 + o, 118, 34, "Git worker\nPersist validated version", "worker")
    orchestrate = n(709, 1310 + o, 118, 38, "Orchestrate a clean up", "super")
    think = n(709, 1378 + o, 118, 38, "Get the commits and think", "sub")
    real = n(709, 1446 + o, 118, 38, "Real findings", "mid")
    nx, ny = edge(s, anyone, "b")
    path([(nx, ny), (nx, (1264 + o) * k), edge(s, git, "l")], git)
    lab(636, 1236, "No")
    link(s, git, "b", orchestrate, "t")
    link(s, orchestrate, "b", think, "t")
    link(s, think, "b", real, "t")
    swarm = swarm_panel(s, 880 * k, (1397 + o) * k - 90)
    link(s, think, "r", swarm, "l")
    txt(585, 1313 + o, "Cleanup lenses:\nDead and speculative code\nDuplication and reinvention\nIndirection and structure\nTest value (when tests changed)\nPonytail\nSlopo (optional)")
    cleanup_any = dia(583, 1440 + o, 75, 50, "Any?")
    link(s, real, "l", cleanup_any, "r")
    cx, cy = edge(s, cleanup_any, "l")
    s.line([(cx, cy), (loop_x, cy)])
    lab(566, 1450 + o, "Yes")
    lab(636, 1494 + o, "No")

    # present to human
    divider(1507 + o, "Present to human")
    prepare = n(710, 1520 + o, 120, 38, "Prepare live validation", "super")
    px, py = edge(s, cleanup_any, "b")
    path([(px, py), (px, (1539 + o) * k), edge(s, prepare, "l")], prepare)
    shown = [n(x, y + o, 74, 22, text, "out") for x, y, text in (
        (656, 1585, "Report"), (734, 1585, "Schema"), (812, 1585, "Images"),
        (693, 1608, "Video?"), (771, 1608, "Demo steps?"))]
    link(s, prepare, "b", shown[1], "t")
    txt(910, 1602 + o, "ARTIFACTS")
    feedback2 = n(710, 1658 + o, 118, 38, "Feed back", "human")
    s.pointer([(769 * k, (1630 + o) * k + GAP), edge(s, feedback2, "t")], end=feedback2)
    all_ok = dia(581, 1654 + o, 78, 50, "All OK?", "human")
    link(s, feedback2, "l", all_ok, "r")
    ax, ay = edge(s, all_ok, "l")
    s.line([(ax, ay), (loop_x, ay)])
    lab(566, 1664 + o, "No")

    # ship PR
    divider(1727 + o, "Ship PR")
    commit = n(711, 1737 + o, 118, 38, "Git worker\nCommit + Push + PR", "worker")
    px, py = edge(s, all_ok, "b")
    path([(px, py), (px, (1756 + o) * k), edge(s, commit, "l")], commit)
    lab(632, 1708 + o, "Yes")
    fix = n(885, 1735 + o, 118, 38, "Get blocker and send\nfast review, then fix", "sub")
    link(s, fix, "l", commit, "r")
    txt(1051, 1728 + o, "Swarm", mono=True)
    for i, text in enumerate(("Review", "Coder", "...")):
        n(1051 + i * 56, 1745 + o, 50, 17, text, "worker")
    txt(1051, 1772 + o, "At hand optional swarm for fixing")
    blocker = dia(731, 1810 + o, 80, 50, "Blocker?")
    link(s, commit, "b", blocker, "t")
    bx, by = edge(s, blocker, "r")
    path([(bx, by), (944 * k, by), edge(s, fix, "b")], fix)
    lab(816, 1822 + o, "Yes")
    txt(814, 1840 + o, "Merge conflicts with root branch")
    wait = n(711, 1890 + o, 118, 38, "Wait for CI / CD\nGit flow Review / feedback", "worker")
    link(s, blocker, "b", wait, "t")
    lab(776, 1868 + o, "No")
    last = dia(587, 1881 + o, 75, 50, "Any?")
    link(s, wait, "l", last, "r")
    lx, ly = edge(s, last, "l")
    dx, dy = edge(s, draft, "l")
    s.pointer([(lx, ly), (loop_x, ly), (loop_x, dy), (dx, dy)], end=draft)
    lab(566, 1890 + o, "Yes")
    bx, by = edge(s, last, "b")
    nfx, nfy = edge(s, notify, "l")
    path([(bx, by), (bx, (1963 + o) * k), (4 * k, (1963 + o) * k), (4 * k, nfy), (nfx, nfy)], notify)
    lab(636, 1936 + o, "No")
    s.text(529 * k, (1975 + o) * k, "NEXT SLICE", size=22)
    s.save("Whole-Flow.excalidraw")


def review():
    s = Scene()
    review_panel(s, 40, 40)
    s.save("Review.excalidraw")


if __name__ == "__main__":
    review()
    coding_loop()
    whole_flow()
