#!/usr/bin/env node
// Measure every state of a running UI with inspect-page.js in headless Chromium (see code-quality ui.md, "Inspect the running app").
// Per URL, width, language (as loaded, then after clicking the element with the text --lang) and theme (light, plus dark with --dark):
// probes the loaded state, then after each click on a [role=tab]. --plan adds screens and steps auto mode cannot reach:
//   { "screens": [{ "name": "optional label", "url": "#/route", "widths": [390], "setup": [<step>...], "steps": [{ "click": "css" }, { "fill": "css", "text": "..." }] }] }
// --dark only emulates the OS dark preference; an app with its own theme toggle or class needs the toggle click in a plan file.
// A screen url is resolved against the first <url>. Setup steps run first and are not compared; each later step is followed by the probes.
// Exit 0 clean, 1 findings, 2 error, which includes a state that shows no visible text (a blank page is never clean).
import { execSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const USAGE = 'usage: node check-ui.mjs <url>... [--lang <text>] [--widths 390,768,1440] [--dark] [--plan <file.json>] [--out <dir>] [--json]';
const INSPECT = fileURLToPath(new URL('inspect-page.js', import.meta.url));
const fail = (message) => { console.error(`check-ui: ${message}`); process.exit(2); };

// Runs in the page, where inspect-page.js defined census, columns, gaps, boxes and overflow.
// It picks what to measure, runs the probes and returns their items.
function measure() {
  const vis = (e) => e.getClientRects().length, rect = (e) => e.getBoundingClientRect();
  const tag = (e) => e.tagName.toLowerCase();
  const all = [...document.querySelectorAll('body *')].filter(vis), items = [];
  if (!all.length || !document.body.innerText.trim()) return null; // nothing to measure: the caller reports a blank page
  const named = (e) => `${tag(e.parentElement)} > ${tag(e)}${e.classList[0] ? '.' + e.classList[0] : ''} "${e.textContent.replace(/\s+/g, ' ').trim().slice(0, 20)}"`;
  const inner = (e) => [...e.querySelectorAll('*')].filter((d) => !d.ownerSVGElement).map(tag); // what is drawn inside an svg does not count
  const path = (e, root) => { const steps = []; for (; e !== root; e = e.parentElement) steps.unshift(`${tag(e)}:nth-of-type(${[...e.parentElement.children].filter((c) => c.tagName === e.tagName).indexOf(e) + 1})`); return steps.join(' > '); };
  // Probes take a CSS selector, so each measured set gets a temporary data-ck mark; results are renamed to a readable selector.
  let count = 0;
  document.querySelectorAll('[data-ck]').forEach((e) => e.removeAttribute('data-ck'));
  const mark = (els) => { const id = `k${++count}`; els.forEach((e) => e.setAttribute('data-ck', id)); return `[data-ck="${id}"]`; };
  const run = (name, sel, list) => items.push(...list.map((i) => ({ ...i, selector: i.selector.replace(sel, name) })));
  const controls = 'a,button,[role=tab],[role=switch],[role=menuitem]';

  // Repeated rows and cards: siblings with the same tag, class and inner tags, not counting what is drawn inside an svg (table cells are columns, not repeats).
  // The same place inside each repeat is one kind of element: its size must match. Rows (side by side cells, stacked) also get column checks.
  for (const parent of [document.body, ...all]) {
    const groups = {};
    for (const c of parent.children) if (vis(c) && c.firstElementChild && !c.ownerSVGElement && !/^(td|th)$/i.test(c.tagName)) (groups[`${c.tagName} ${c.getAttribute('class') ?? inner(c)}`] ??= []).push(c);
    for (const repeats of Object.values(groups).filter((g) => g.length > 1)) {
      const where = `${tag(parent)} > ${tag(repeats[0])}`, kinds = {};
      const kids = [...repeats[0].children].filter(vis);
      const row = kids.length > 1 && kids.every((k) => rect(k).top < rect(kids[0]).bottom) && repeats.every((r) => Math.abs(rect(r).left - rect(repeats[0]).left) < 1);
      for (const r of repeats) for (const d of r.querySelectorAll('*')) if (vis(d) && !d.ownerSVGElement && !/^t[dh]$/i.test(tag(d))) (kinds[`${path(d, r)}|${inner(d)}`] ??= []).push(d);
      for (const [key, els] of Object.entries(kinds)) if (els.length > 1) { const k = mark(els), name = `${where} > ${key.split('|')[0]}`; run(name, k, census(k, 'size')); if (row) run(name, k, census(k, 'center')); }
      if (row) { const sel = mark(repeats); run(where, sel, columns(sel)); }
    }
  }

  // Groups: buttons in an ARIA group, two or more labelled buttons, two or more tall blocks. Tabs are not actions, so they only get the moved check below.
  const grouped = all.filter((p) => { const k = [...p.children].filter(vis); return k.length > 1 && (k.every((c) => c.matches('button:not([role=tab])') && (p.matches('[role=group],[role=toolbar]') || c.textContent.trim().length > 2)) || k.every((c) => rect(c).height >= 150)); });
  for (const g of grouped) { const sel = mark([g]); run(named(g), sel, gaps(sel)); }

  // The selected-border check compares each chosen element with every unchosen match on the page, not only its siblings, so it runs on the choice elements only.
  const choices = 'label:has(input),[role=radio],[role=option],[aria-pressed],[aria-selected]';
  items.push(...census(choices, 'contrast').filter((i) => /^selected border/.test(i.detail)));
  items.push(...census('body *', 'contrast').filter((i) => !/^selected border/.test(i.detail)));
  items.push(...census('body *', 'key'));
  items.push(...census(controls, 'target'));
  items.push(...census(controls, 'hidden'));
  if (document.querySelector('[role=menu]')) items.push(...census(controls, 'dupe'));
  items.push(...overflow());

  // Compare with the previous call: landmarks and headings always; every text element too when the page kept the same ones.
  // A text element that stays put through a click is still comparable when an icon or dot appears or goes, so the gate counts text only.
  document.querySelectorAll('[data-ck-text]').forEach((e) => e.removeAttribute('data-ck-text'));
  const texts = all.filter((e) => !e.firstElementChild && !e.ownerSVGElement && e.textContent.trim());
  texts.forEach((e) => e.setAttribute('data-ck-text', ''));
  const outline = texts.map((e) => tag(e) + e.textContent).join(); // a click that changes text is not a pure layout change
  const same = outline === window.ckOutline;
  window.ckOutline = outline;
  run('text', '[data-ck-text]', boxes(['nav', 'aside', 'footer', 'form', 'h1,h2,h3', '[role=tablist]', '[role=tab]', '[data-ck-text]']).filter((i) => same || !i.selector.startsWith('[data-ck-text]')));
  return items;
}

let args;
try {
  args = parseArgs({ allowPositionals: true, options: { lang: { type: 'string' }, widths: { type: 'string', default: '390,768,1440' }, dark: { type: 'boolean' }, plan: { type: 'string' }, out: { type: 'string' }, json: { type: 'boolean' } } });
} catch (error) { fail(`${error.message}\n${USAGE}`); }
const { values: opt, positionals: urls } = args;
if (!urls.length) fail(USAGE);

let chromium;
try {
  const root = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  ({ chromium } = createRequire(join(root, 'lintapple', 'package.json'))('playwright'));
} catch { fail('Playwright not found; run: npm i -g lintapple'); }

const findings = [];
let browser, failure;
try {
  const plan = opt.plan ? JSON.parse(readFileSync(opt.plan, 'utf8')) : { screens: [] };
  const screens = [...urls.map((url) => ({ url })), ...plan.screens.map((s) => ({ ...s, url: new URL(s.url, urls[0]).href }))];
  const widths = opt.widths.split(',').map(Number);
  const out = opt.out ?? mkdtempSync(join(tmpdir(), 'check-ui-'));
  mkdirSync(out, { recursive: true });
  console.error(`screenshots: ${out}`);
  browser = await chromium.launch({ headless: true });
  let shots = 0;
  const reported = new Set(); // a finding that shows in later states or screens is printed once, at the first

  for (const screen of screens) for (const width of screen.widths ?? widths) for (const lang of [null, ...(opt.lang ? [opt.lang] : [])]) for (const dark of opt.dark ? [false, true] : [false]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: dark ? 'dark' : 'light' });
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    const settle = () => page.waitForTimeout(500); // ui.md, Motion timing: wait for motion to end
    const act = async (step) => { await (step.click ? page.locator(step.click).first().click() : page.locator(step.fill).first().fill(step.text)); await settle(); };
    const check = async (after) => {
      const shot = `s${String(++shots).padStart(3, '0')}.png`;
      await page.screenshot({ path: join(out, shot), fullPage: true });
      const state = [screen.name ?? screen.url, `${width}px`, lang ?? 'as loaded', dark ? 'dark' : 'light', after && `after ${after}`, `[${shot}]`].filter(Boolean).join(' ');
      const items = await page.evaluate(measure);
      if (!items) throw new Error(`page looks blank: ${state}`);
      findings.push(...items.filter((i) => i.check !== 'saved' && !reported.has(JSON.stringify(i)) && reported.add(JSON.stringify(i))).map((i) => ({ state, ...i })));
    };
    try {
      await page.addInitScript({ path: INSPECT }); // runs again on every navigation, so a link that reloads the page keeps the probes
      await page.goto(screen.url);
      if (lang) await page.getByText(lang, { exact: true }).first().click();
      await settle();
      for (const step of screen.setup ?? []) await act(step); // brings the page to its first state without comparing with the one before
      await check(screen.setup && 'setup');
      for (const step of screen.steps ?? []) {
        await act(step);
        await check(step.click ? `click ${step.click}` : `fill ${step.fill}`);
      }
      const tabs = page.locator('[role=tab]:visible');
      for (let i = 0, n = await tabs.count(); i < n; i++) {
        const name = (await tabs.nth(i).innerText()).replace(/\s+/g, ' ').trim();
        await tabs.nth(i).click();
        await settle();
        await check(`click tab "${name}"`);
      }
    } finally { await context.close(); }
  }
} catch (error) { failure = error; } finally { await browser?.close(); }
if (failure) fail(String(failure.message).split('\n')[0]);

if (opt.json) console.log(JSON.stringify(findings, null, 2));
else for (const f of findings) console.log(`${f.state} | ${f.check} | ${f.selector} | ${f.detail} (${f.values.join(', ')})`);
process.exit(findings.length ? 1 : 0);
