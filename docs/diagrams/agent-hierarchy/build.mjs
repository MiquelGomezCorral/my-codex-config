// Generates the agent hierarchy diagram. From this folder:
//   node build.mjs > agent-hierarchy.excalidraw
//   excalidraw render agent-hierarchy.excalidraw --max-width 8000 --max-height 8000 --scale 1.5 \
//     --out ../../../workflow-diagrams/Agent-Hierarchy.png
// The full poster is too wide for a README column, so each view below is its own readable panel:
//   for v in tree-planning tree-build tree-finish rules workflow; do
//     node build.mjs $v > /tmp/$v.excalidraw
//     excalidraw render /tmp/$v.excalidraw --max-width 8000 --max-height 8000 --scale 1.5 \
//       --out ../../../workflow-diagrams/Agent-$v.png
//   done
const view = process.argv[2] ?? "full";
const treeKids = {
  "tree-planning": ["Code-blind proposer", "Researchers", "diagram-worker", "critic ×2"],
  "tree-build": ["coding-supervisor"],
  "tree-finish": ["cleanup-worker", "Closure check", "git-worker"],
};
const panelName = { "tree-planning": "planning side", "tree-build": "building a slice", "tree-finish": "cleanup and Git" };
const showTree = view === "full" || view in treeKids;
const showRules = view === "full" || view === "rules";
const showFlow = view === "full" || view === "workflow";
let n = 0;
const els = [];
const base = () => ({
  id: `e${++n}`, angle: 0, fillStyle: "solid", strokeWidth: 2, strokeStyle: "solid",
  roughness: 0, opacity: 100, groupIds: [], frameId: null, roundness: null, seed: n,
  version: 1, versionNonce: n, isDeleted: false, boundElements: null, updated: 1,
  link: null, locked: false, backgroundColor: "transparent", strokeColor: "#1e1e1e",
});
const SANS = 6, MONO = 3, LH = 1.25;
const cw = (font) => (font === MONO ? 0.6 : 0.53);
const measure = (t, s, f) => {
  const lines = t.split("\n");
  return { w: Math.max(...lines.map((l) => l.length)) * s * cw(f), h: lines.length * s * LH };
};
const wrap = (t, s, f, w) => {
  const max = Math.floor(w / (s * cw(f)));
  const out = [];
  for (const para of t.split("\n")) {
    let line = "";
    for (const word of para.split(" ")) {
      if (line && (line + " " + word).length > max) { out.push(line); line = word; }
      else line = line ? `${line} ${word}` : word;
    }
    out.push(line);
  }
  return out.join("\n");
};
const text = (x, y, t, s, o = {}) => {
  const f = o.font ?? SANS;
  const { w, h } = measure(t, s, f);
  els.push({ ...base(), type: "text", x, y, width: w, height: h, text: t, originalText: t,
    fontSize: s, fontFamily: f, textAlign: "left", verticalAlign: "top", containerId: null,
    lineHeight: LH, autoResize: true, strokeColor: o.color ?? "#1e1e1e" });
  return { w, h };
};
const rect = (x, y, w, h, o = {}) => els.push({ ...base(), type: "rectangle", x, y, width: w, height: h, ...o });
const arrow = (pts, o = {}) => {
  const [x0, y0] = pts[0];
  const rel = pts.map(([x, y]) => [x - x0, y - y0]);
  els.push({ ...base(), type: "arrow", x: x0, y: y0,
    width: Math.max(...rel.map((p) => Math.abs(p[0]))), height: Math.max(...rel.map((p) => Math.abs(p[1]))),
    points: rel, lastCommittedPoint: null, startBinding: null, endBinding: null,
    startArrowhead: null, endArrowhead: "triangle", elbowed: false, ...o });
};
const chip = (x, y, t, o = {}) => {
  const s = 13, { w, h } = measure(t, s, MONO);
  rect(x, y, w + 14, h + 8, { strokeWidth: 1, strokeColor: o.stroke ?? "#868e96", backgroundColor: o.bg ?? "#ffffff" });
  text(x + 7, y + 4, t, s, { font: MONO, color: "#343a40" });
  return w + 14;
};

// Who-is-who colours, shared by the tree and the workflow
const C = {
  human: ["#868e96", "#f1f3f5"], root: ["#3b5bdb", "#dbe4ff"], plan: ["#2b8a3e", "#d3f9d8"],
  diagram: ["#e67700", "#fff3bf"], critic: ["#9c36b5", "#f3d9fa"], sup: ["#5f3dc4", "#e5dbff"],
  coder: ["#d9480f", "#ffe8cc"], review: ["#1971c2", "#d0ebff"], live: ["#087f5b", "#c3fae8"],
  cleanup: ["#c2255c", "#ffdeeb"], git: ["#343a40", "#e9ecef"],
};
const legend = [["human", "Human"], ["root", "Root coordinator"], ["plan", "Planning helpers"],
  ["diagram", "diagram-worker"], ["critic", "Critics"], ["sup", "coding-supervisor"], ["coder", "coder"],
  ["review", "Review"], ["live", "live-validator"], ["cleanup", "Cleanup"], ["git", "git-worker"]];
const drawLegend = (x, y) => {
  let lx = x;
  for (const [k, label] of legend) {
    rect(lx, y + 2, 18, 18, { strokeColor: C[k][0], backgroundColor: C[k][1], strokeWidth: 2 });
    lx += 26 + text(lx + 26, y, label, 16).w + 22;
  }
};

// ---------- Page 1: the agent tree ----------
const BW = 270, PAD = 12;
const card = (x, y, node, w = BW) => {
  const [stroke, bg] = C[node.k];
  const title = node.t, mono = wrap(node.m, 12, MONO, w - PAD * 2), body = wrap(node.b, 14, SANS, w - PAD * 2);
  const th = measure(title, 19, SANS).h, mh = measure(mono, 12, MONO).h, bh = measure(body, 14, SANS).h;
  const h = PAD + th + 4 + mh + 8 + bh + PAD;
  rect(x, y, w, h, { strokeColor: stroke, backgroundColor: bg });
  text(x + PAD, y + PAD, title, 19, { color: stroke });
  text(x + PAD, y + PAD + th + 4, mono, 12, { font: MONO, color: "#495057" });
  text(x + PAD, y + PAD + th + 4 + mh + 8, body, 14);
  return h;
};
const cardH = (node, w = BW) => {
  const th = measure(node.t, 19, SANS).h;
  const mh = measure(wrap(node.m, 12, MONO, w - PAD * 2), 12, MONO).h;
  const bh = measure(wrap(node.b, 14, SANS, w - PAD * 2), 14, SANS).h;
  return PAD + th + 4 + mh + 8 + bh + PAD;
};

const N = (k, t, m, b, kids = [], edge = "", dashed = false) => ({ k, t, m, b, kids, edge, dashed });
const tree = N("human", "Human", "the person", "Decides, approves the wave and its live tests, accepts the result, authorizes shipping", [
  N("root", "Root coordinator", "super_agent · Opus 5.5 · xhigh", "The agent you talk to. Plans with you, alone holds private memory, launches every worker through super-agent, never edits product code. Also presents the result and closes the wave.", [
    N("plan", "Code-blind proposer", "swarms · cheap model\non the current harness", "Gets only problem facts, never the code, and proposes a fix on its own", [], "delegate"),
    N("plan", "Researchers", "swarms · cheap model\non the current harness", "Read-only research: sources, code facts, bug-evidence checks", [], "delegate"),
    N("diagram", "diagram-worker", "coder · Sonnet 5.5", "Draws planning diagrams and mockups, only inside one assigned folder", [], "delegate"),
    N("critic", "critic ×2", "adversarial · GPT-6.1 Sol\n+ Fable 5.1", "Two independent read-only critiques of the plan, one pass each", [], "$review-plan"),
    N("sup", "coding-supervisor", "sub_orchestrator · Opus 5.5", "Large slices only; for small ones the root does this job. Read-only: narrows the slice, directs one coder, runs review, routes verified fixes", [
      N("coder", "coder", "coder · Sonnet 5.5", "The only writer in a slice. Implements the plan, then applies accepted fixes", [], "retained"),
      N("review", "review-worker", "sub_orchestrator · Opus 5.5", "Swarm review lead: picks lenses, verifies and dedupes. The flash preset uses one reviewer-quick instead", [
        N("review", "Lens specialists", "swarms · cheap model\non the current harness", "reviewer-quick, -reasoning, -arch, -e2e: only the lenses the diff needs", [], "lenses"),
        N("review", "Strong reviewers 1-2", "reviewer-high · Sol / Opus", "Review the whole change; two when it touches security, data or contracts", [], "1-2 slots"),
      ], "$review"),
      N("review", "Verifier", "reviewer-fast · cheap model\non the current harness", "A fresh review-worker that re-checks every finding against the source", [], "swarm-smart, full", true),
      N("live", "live-validator ×N", "reviewer-fast · cheap model\non the current harness", "Runs the approved live tests on the real app and reports evidence", [], "full preset", true),
    ], "large slice", true),
    N("cleanup", "cleanup-worker", "sub_orchestrator · Opus 5.5", "Read-only deslop audit of the slice diff. Findings only; the root accepts or rejects each", [
      N("cleanup", "Cleanup lenses ≥2", "swarms · cheap model\non the current harness", "Dead code, duplication, indirection, test value", [], "lenses"),
      N("cleanup", "Simplest-design 1-2", "reviewer-high · Sol / Opus", "Sketch the simplest design first, then flag what the diff adds beyond it", [], "1-2 slots"),
    ], "$cleanup"),
    N("cleanup", "Closure check", "reviewer-high · 1 slot", "Confirms accepted simplifications landed and nothing new crept in", [], "after fixes"),
    N("git", "git-worker", "coder · Sonnet 5.5", "Checkpoint commit before cleanup; after you accept: final commit, push, PR", [], "$git"),
  ], "chat"),
]);

if (view in treeKids) tree.kids[0].kids = tree.kids[0].kids.filter((c) => treeKids[view].includes(c.t));

const HG = 28, VG = 110, X0 = 0, Y0 = 260;
let nextX = X0;
const levelH = [];
const place = (node, depth, w) => {
  node.w = node.k === "root" || node.k === "human" ? 420 : BW;
  levelH[depth] = Math.max(levelH[depth] ?? 0, cardH(node, node.w));
  if (!node.kids.length) { node.x = nextX; nextX += node.w + HG; return; }
  node.kids.forEach((c, i) => { if (depth === 1 && i) nextX += 24; place(c, depth + 1); });
  const a = node.kids[0], b = node.kids.at(-1);
  node.x = (a.x + b.x + b.w) / 2 - node.w / 2;
};
place(tree, 0);
const levelY = [Y0];
for (let i = 1; i < levelH.length; i++) levelY[i] = levelY[i - 1] + levelH[i - 1] + VG;
const treeW = nextX - HG;

const draw = (node, depth) => {
  node.y = levelY[depth];
  node.h = card(node.x, node.y, node, node.w);
  if (node.kids.length) {
    const px = node.x + node.w / 2, busY = node.y + levelH[depth] + VG * 0.3;
    const xs = node.kids.map((c) => c.x + c.w / 2);
    arrow([[px, node.y + node.h], [px, busY]], { endArrowhead: null, strokeColor: "#343a40" });
    if (node.kids.length > 1)
      arrow([[Math.min(...xs, px), busY], [Math.max(...xs, px), busY]], { endArrowhead: null, strokeColor: "#343a40" });
  }
  for (const c of node.kids) {
    const busY = node.y + levelH[depth] + VG * 0.3, cy = levelY[depth + 1], cx = c.x + c.w / 2;
    arrow([[cx, busY], [cx, cy]], { strokeColor: c.dashed ? "#868e96" : "#343a40", strokeStyle: c.dashed ? "dashed" : "solid" });
    const { w, h } = measure(c.edge, 13, MONO), ly = (busY + cy) / 2;
    rect(cx - w / 2 - 7, ly - h / 2 - 4, w + 14, h + 8, { strokeWidth: 1, strokeColor: c.dashed ? "#adb5bd" : "#495057", backgroundColor: "#f8f9fa", strokeStyle: c.dashed ? "dashed" : "solid" });
    text(cx - w / 2, ly - h / 2, c.edge, 13, { font: MONO, color: "#343a40" });
    draw(c, depth + 1);
  }
};

if (showTree) {
  text(X0, 0, `The agent tree${panelName[view] ? `, ${panelName[view]}` : ""}: who starts whom, and what each one does`, 40);
  text(X0, 58, "Read from config/agents/*.toml, super-agent's model-catalog.yaml and the workflow skill on branch consolidate-agent-skills, 2026-10-16.", 18, { color: "#868e96" });
  text(X0, 92, "Each card: name · catalog role · model · job. The arrow label says what starts the child. Models checked against model-catalog.yaml 2026-10-16.", 18, { color: "#868e96" });
  arrow([[X0, 140], [X0 + 70, 140]], { endArrowhead: null, strokeColor: "#343a40" });
  text(X0 + 82, 128, "Always runs in its stage", 16);
  arrow([[X0 + 320, 140], [X0 + 390, 140]], { endArrowhead: null, strokeColor: "#868e96", strokeStyle: "dashed" });
  text(X0 + 402, 128, "Only when the slice size or review preset calls for it", 16);
  drawLegend(X0, 176);
  draw(tree, 0);
}

// Whole-tree rules and the write/start table, under the tree
const by = view === "full" ? levelY.at(-1) + levelH.at(-1) + 90 : 0;
let page1Bottom = 0, page1W = 0;
if (showRules) {
  text(X0, by, "Rules for the whole tree", 28);
  const rules = [
    "One writer per slice: only the coder edits product code. diagram-worker and git-worker write only in their own lane.",
    "Every launch goes through super-agent: stage → catalog role → exact harness, model and thinking. No harness defaults.",
    "Nesting needs the parent's Delegation grant; a child never widens its own budget. A missing grant means forbidden.",
    "Workers get the plan, never private memory. Each report ends with \"Memory candidates\" for the root to save.",
    "A slot that can't run is skipped and reported as reduced coverage. Only a role with no runnable slot blocks the stage.",
    "Retained workers live only inside their loop; a fresh session starts each new stage or slice.",
  ];
  rules.forEach((r, i) => { rect(X0, by + 52 + i * 30, 12, 12, { strokeWidth: 1.5 }); text(X0 + 24, by + 46 + i * 30, r, 17); });

  const tx = view === "full" ? X0 + 1250 : X0;  // the rules panel stacks the table under the rules
  const ty = view === "full" ? by : by + 300;
  text(tx, ty, "Who may write, and who may start workers", 28);
  const rows = [
    ["Agent", "Writes", "Starts workers"],
    ["Root coordinator", "plans and private memory only", "yes: everything, via super-agent"],
    ["coding-supervisor", "nothing", "one retained coder, plus review"],
    ["coder", "product code inside the slice", "no"],
    ["review-worker", "nothing", "lens specialists + strong reviewers"],
    ["cleanup-worker", "nothing", "cleanup lenses + simplest-design"],
    ["git-worker", "commits, push, PR the plan allows", "no"],
    ["diagram-worker", "one assigned output folder", "no"],
    ["live-validator", "its own test data only", "no"],
    ["critics, reviewers, researchers", "nothing", "no"],
  ];
  const colX = [0, 330, 720];
  rows.forEach((r, i) => {
    const y = ty + 50 + i * 32;
    r.forEach((cell, j) => text(tx + colX[j], y, cell, i ? 16 : 14, { color: i ? "#1e1e1e" : "#868e96", font: SANS }));
    arrow([[tx, y + 27], [tx + 1080, y + 27]], { endArrowhead: null, strokeWidth: 1, strokeColor: i ? "#dee2e6" : "#495057" });
  });
  page1Bottom = ty + 50 + rows.length * 32 + 40;
  if (view === "full") {
    page1W = Math.max(treeW, tx + 1080 - X0);
    rect(X0 - 50, -50, page1W + 100, page1Bottom + 50 + 50, { strokeWidth: 1, strokeColor: "#ced4da" });
  }
}

// ---------- Page 2: the workflow for one slice ----------
const WX = view === "full" ? X0 + page1W + 160 : X0, SW = 430, NOTE_X = WX + 200 + SW + 30, NOTE_W = 760;
if (showFlow) {
  text(WX, 0, "The workflow, step by step", 40);
  text(WX, 58, "Top to bottom. The colour of a step says who acts. Numbers are the workflow skill's stages.", 18, { color: "#868e96" });
  text(WX, 92, "Left-side arrows are loops back to the coder.", 18, { color: "#868e96" });
  const steps = [
    ["sec", "Plan the wave"],
    ["root", "1", "Root drafts the problem", "Current vs desired behaviour, scope, evidence and how each change will be live-tested. Facts first, then grills you on real decisions.", ["Code-blind proposer", "Researchers"]],
    ["root", "2", "Root and you shape the plan", "A candidate wave: slices, dependencies, checks, review depth, live tests and their bounds.", ["diagram-worker"]],
    ["critic", "3", "Two critics attack the plan", "Independent, read-only, one pass each. The planner gets one rebuttal, then $refine-plan writes the final plan.", ["$review-plan", "critic ×2", "$refine-plan"]],
    ["human", "3", "You approve the wave", "Nothing is coded before this. The approval also covers each slice's live test set.", []],
    ["sec", "Each slice"],
    ["sup", "4", "Slice narrowed to today's code", "Root for small slices, coding-supervisor for large ones. New live tests run once on the base and must fail there.", ["coding-supervisor"]],
    ["coder", "5", "Coder implements", "One retained writer. Runs only the plan's checks; live testing waits for the review round.", ["coder"]],
    ["review", "5", "Review + live tests, every round", "Verified P0-P3 findings go back to the coder. Two failed rounds on the same problem, or a test still impossible after 3, goes to you.", ["$review --preset", "review-worker", "Verifier", "live-validator"]],
    ["git", "6", "Checkpoint commit", "Records a hash so cleanup can compare the whole slice from its base.", ["$git", "git-worker"]],
    ["cleanup", "6", "Cleanup audit", "Findings only. Accepted ones go back through step 5, then one closure check confirms them.", ["$cleanup", "cleanup-worker", "Closure check"]],
    ["human", "7", "You accept the result", "Root shows the real result, evidence, checks and gaps. Feedback loops back to the coder.", []],
    ["git", "8", "Ship", "Final commit, push and PR: only what the plan authorizes, only this slice's commits.", ["$git", "git-worker"]],
    ["sec", "After the last slice"],
    ["root", "9", "Close the wave", "Rerun every slice's live tests on the final head; record unfinished work and lessons.", []],
  ];
  let sy = 150;
  const at = {};
  for (const s of steps) {
    if (s[0] === "sec") { sy += 30; text(WX, sy, s[1], 28); sy += 60; continue; }
    const [k, num, title, note, chips] = s;
    const [stroke, bg] = C[k];
    const h = 64;
    const sx = WX + 200;
    rect(sx, sy, SW, h, { strokeColor: stroke, backgroundColor: bg, strokeWidth: k === "human" ? 3 : 2 });
    text(sx + 16, sy + 22, num, 17, { font: MONO, color: stroke });
    text(sx + 48, sy + 20, title, 20);
    const nt = wrap(note, 15, SANS, NOTE_W);
    const nh = text(NOTE_X, sy + 2, nt, 15).h;
    let cx = NOTE_X;
    chips.forEach((c) => { cx += chip(cx, sy + nh + 10, c, c.startsWith("$") ? { stroke: "#9c36b5", bg: "#f3d9fa" } : {}) + 8; });
    at[title] = { x: sx, y: sy, h };
    const next = sy + Math.max(h, nh + (chips.length ? 44 : 0)) + 34;
    if (steps[steps.indexOf(s) + 1]?.[0] !== "sec" && steps.indexOf(s) < steps.length - 1)
      arrow([[sx + SW / 2, sy + h], [sx + SW / 2, next]], { strokeColor: "#343a40" });
    sy = next;
  }
  const coder = at["Coder implements"];
  [["Review + live tests, every round", 90, "fix round"], ["Cleanup audit", 150, "accepted cleanup"], ["You accept the result", 210, "feedback"]]
    .forEach(([from, off, label]) => {
      const f = at[from], lx = coder.x - off;
      arrow([[f.x, f.y + f.h / 2], [lx, f.y + f.h / 2], [lx, coder.y + coder.h / 2], [coder.x, coder.y + coder.h / 2]],
        { strokeColor: "#d9480f", strokeStyle: "dashed", strokeWidth: 2 });
      text(f.x - measure(label, 12, MONO).w - 8, f.y + f.h / 2 - 20, label, 12, { font: MONO, color: "#d9480f" });
    });
  rect(WX - 50, -50, NOTE_X + NOTE_W - WX + 100, Math.max(sy, page1Bottom) + 100, { strokeWidth: 1, strokeColor: "#ced4da" });
}

console.log(JSON.stringify({ type: "excalidraw", version: 2, source: "https://excalidraw.com",
  elements: els, appState: { viewBackgroundColor: "#ffffff", gridSize: null }, files: {} }));
