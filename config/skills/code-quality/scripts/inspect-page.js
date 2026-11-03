// Browser-side UI probes for a running page. Each function returns [{ check, selector, detail, values }]; [] means clean.
(() => {
  const EPS = 0.75; // sub-pixel noise reaches 0.5 px, real defects start at 1 px
  const seen = (window.inspectSeen ??= {}); // on window, so loading the script again keeps the saved boxes
  const item = (check, selector, detail, values) => ({ check, selector, detail, values }); // every result item, the `saved` notice too
  const $$ = (s) => [...document.querySelectorAll(s)].filter((e) => e.getClientRects().length);
  const rect = (e) => e.getBoundingClientRect();
  const px = (n) => Math.round(n * 10) / 10;
  const spread = (a) => Math.max(...a) - Math.min(...a);
  const css = (e) => getComputedStyle(e);
  const own = (e) => [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim(); // own text only
  const label = (e) => (e.getAttribute('aria-label') || e.textContent).replace(/\s+/g, ' ').trim().slice(0, 24);
  const named = (e) => `${e.tagName.toLowerCase()}${e.classList[0] ? '.' + e.classList[0] : ''} "${label(e)}"`;
  const chosen = (e) => e.matches('[aria-pressed=true],[aria-selected=true],[aria-checked=true],label:has(input:checked)');
  const after = (e) => { let n = e.nextSibling; while (n && n.nodeType === 3 && !n.textContent.trim()) n = n.nextSibling; return n; };
  // Range around a node or its contents: the real text box, not the element box (svg and img keep their own box).
  const span = (n, within) => { const g = document.createRange(); within && !n.matches('svg,img') ? g.selectNodeContents(n) : g.selectNode(n); return g.getBoundingClientRect(); };
  const pad = (e) => { const r = rect(e), left = r.left + e.clientLeft, top = r.top + e.clientTop; return { left, top, right: left + e.clientWidth, bottom: top + e.clientHeight }; };
  const inner = (e) => { const s = css(e), l = parseFloat(s.paddingLeft); return { left: pad(e).left + l, width: e.clientWidth - l - parseFloat(s.paddingRight) }; };
  // Computed colors can be oklch(): a 1x1 canvas turns any CSS color into RGB. The background is the first opaque ancestor.
  const canvas = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const rgba = (c) => { canvas.clearRect(0, 0, 1, 1); canvas.fillStyle = c; canvas.fillRect(0, 0, 1, 1); return canvas.getImageData(0, 0, 1, 1).data; };
  const lum = (c) => [0, 1, 2].reduce((t, i) => t + [0.2126, 0.7152, 0.0722][i] * ((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))(c[i] / 255), 0);
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  const bgOf = (e) => { for (; e; e = e.parentElement) { const c = rgba(css(e).backgroundColor); if (c[3] === 255) return c; } return [255, 255, 255]; };

  // Elements of one kind: unequal height, type size or padding; low text or selected-border contrast; small icon controls; icon off its text.
  // A second argument runs one check alone: size, contrast, target, center, or the opt-in hidden (opacity 0), dupe (name used twice), key (a.b.c shown).
  function census(selector, only) {
    const els = $$(selector), found = [], names = {};
    const on = (c) => (only ? only === c : !['hidden', 'dupe', 'key'].includes(c));
    const add = (check, detail, values) => found.push(item(check, selector, detail, values));
    const dims = { height: (e) => rect(e).height, 'font-size': (e) => parseFloat(css(e).fontSize), 'padding-x': (e) => parseFloat(css(e).paddingLeft), 'padding-y': (e) => parseFloat(css(e).paddingTop) };
    for (const [key, get] of Object.entries(dims)) {
      const v = els.map(get);
      if (on('size') && els.length > 1 && spread(v) > EPS) add('size', `${key} ${px(Math.min(...v))} to ${px(Math.max(...v))}`, els.map((e, i) => `${label(e)}=${px(v[i])}`));
    }
    const edges = (list) => [...new Set(list.map((e) => parseFloat(css(e).borderTopWidth) && css(e).borderTopColor).filter(Boolean))];
    for (const a of on('contrast') ? edges(els.filter(chosen)) : []) for (const b of edges(els.filter((e) => !chosen(e)))) {
      const r = ratio(rgba(a), rgba(b));
      if (a !== b && r < 3) add('contrast', `selected border differs from the others by ${px(r)}:1, needs 3`, [a, b]);
    }
    for (const e of els) {
      const r = rect(e), name = label(e), control = e.matches('a,button,input,[role]'), next = e.matches('svg,img') && after(e);
      const s = css(e), big = parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.66 && +s.fontWeight >= 700), need = big ? 3 : 4.5;
      // 21 is the highest possible contrast ratio: an element with no text of its own never fails
      const c = own(e) ? ratio(rgba(s.color), bgOf(e)) : 21, off = next && r.top + r.height / 2 - (span(next).top + span(next).height / 2);
      if (on('contrast') && c < need) add('contrast', `${name} ${px(c)}:1, needs ${need}`, [name]);
      if (on('target') && control && !e.textContent.trim() && Math.min(r.width, r.height) < 24 - EPS) add('target', `${name} ${px(r.width)}x${px(r.height)}, needs 24`, [name]);
      if (on('hidden') && control && +css(e).opacity === 0) add('hidden', `${name} has opacity 0 at rest`, [name]);
      if (on('key') && /^[a-z]+(\.\w+){2,}$/.test(own(e))) add('key', `"${own(e)}" looks like a translation key`, [own(e)]);
      if (on('center') && Math.abs(off) > EPS) add('center', `${label(e.parentElement)} icon is ${px(off)} px off its text`, [label(e.parentElement)]);
      if (on('dupe') && name) (names[name] ??= []).push(e);
    }
    for (const [name, list] of Object.entries(names)) if (list.length > 1) add('dupe', `"${name}" appears ${list.length} times`, [name]);
    return found;
  }

  // Cells of one column across rows: ragged content edge (left, or right for right-aligned numbers; not for centered or control columns), reserved width that stays empty on one side.
  function columns(rowSelector) {
    const rows = $$(rowSelector).map((r) => [...r.children].filter((c) => c.getClientRects().length)), found = [], count = Math.max(0, ...rows.map((r) => r.length));
    for (let i = 0; i < count; i++) {
      const cells = rows.map((r) => r[i]).filter((c) => c && span(c, true).width > 0), at = `${rowSelector} > :nth-child(${i + 1})`; // an empty cell has no box
      if (cells.length < 2) continue;
      const text = cells.map((c) => span(c, true)), widest = text.indexOf(text.reduce((a, b) => (b.width > a.width ? b : a))), box = inner(cells[widest]);
      const lead = text[widest].left - box.left, trail = box.left + box.width - text[widest].right;
      const numeric = cells.every((c) => /right|end/.test(css(c).textAlign) && /\d/.test(c.textContent)), side = numeric ? 'right' : 'left', edge = text.map((t) => t[side]);
      const plain = !cells.some((c) => c.querySelector('a,button,input,[role]')) && !cells.every((c) => css(c).textAlign === 'center');
      if (plain && spread(edge) > EPS) found.push(item('edge', at, `${side} edges differ by ${px(spread(edge))}`, edge.map(px)));
      // The last column's empty reserved width shows only as trailing space, so it counts without leading space.
      if (Math.abs(lead - trail) > EPS && (lead > EPS || i === count - 1)) found.push(item('width', at, `${px(Math.max(lead, trail))} px of the column is empty beside its widest value`, [px(box.width), px(text[widest].width)]));
    }
    return found;
  }

  // Children of a group: uneven or under-8 px gaps (0 is fine); a selected child that does not fill the group; children that start together and end apart.
  function gaps(groupSelector) {
    const found = [];
    for (const g of $$(groupSelector)) {
      const kids = [...g.children].filter((c) => c.getClientRects().length), r = kids.map(rect), box = pad(g);
      if (kids.length < 2) continue;
      const row = Math.abs(r.at(-1).left - r[0].left) >= Math.abs(r.at(-1).top - r[0].top);
      const [a, b, c, d] = row ? ['left', 'right', 'top', 'bottom'] : ['top', 'bottom', 'left', 'right'];
      const gap = r.slice(1).map((k, i) => k[a] - r[i][b]).filter((v) => v > -EPS), edge = r.map((k) => [k[c] - box[c], box[d] - k[d]]);
      const fills = kids.every((k, i) => !chosen(k) || edge[i].every((v) => v <= EPS)), ends = edge.map((e) => e[1]);
      if (gap.length && (spread(gap) > EPS || gap.some((v) => v > EPS && v < 8 - EPS))) found.push(item('gap', groupSelector, `gaps ${gap.map(px).join(', ')} px; they should be equal and at least 8`, gap.map(px)));
      if (!fills || (spread(edge.map((e) => e[0])) <= EPS && spread(ends) > EPS)) found.push(item('inset', groupSelector, 'a selected child does not fill the group, or children start together and end apart', edge.map((e) => e.map(px))));
    }
    return found;
  }

  // Text and icons wider than the content box (of the element and its in-flow descendants, so padding overflow and a label in a child span count;
  // positioned-out, ellipsis and scrolling parts are skipped), page wider than the window, a fixed bar over the last content.
  function overflow() {
    const d = document.documentElement, found = [], all = $$('body *');
    const add = (check, e, detail, values) => found.push(item(check, typeof e === 'string' ? e : named(e), detail, values));
    const clipped = (x) => /ellipsis/.test(css(x).textOverflow) || /auto|scroll/.test(css(x).overflowX);
    const words = (n) => [...n.childNodes].flatMap((c) => (c.nodeType === 3 ? (c.textContent.trim() ? [span(c)] : []) : c.nodeType !== 1 || !c.getClientRects().length || clipped(c) || /absolute|fixed/.test(css(c).position) ? [] : c.matches('svg,img') ? [span(c)] : words(c)));
    for (const e of all.filter((x) => x.textContent.trim() && x.clientWidth > 2 && !clipped(x))) {
      let lo = Infinity, hi = -Infinity; // text that never renders has a 0x0 box at x=0: ignore it
      for (const r of words(e)) if (r.width) { lo = Math.min(lo, r.left); hi = Math.max(hi, r.right); }
      const over = hi - lo - inner(e).width;
      if (over > EPS) add('overflow', e, `text runs ${px(over)} px past its box`, [px(hi - lo), px(inner(e).width)]);
    }
    if (d.scrollWidth - d.clientWidth > EPS) add('overflow', 'page', `page is ${d.scrollWidth - d.clientWidth} px wider than the window`, [d.scrollWidth, d.clientWidth]);
    const fixed = all.filter((e) => css(e).position === 'fixed' && rect(e).top > innerHeight / 2);
    for (const f of fixed) {
      const leaves = all.filter((e) => !e.children.length && !fixed.some((x) => x.contains(e)));
      const end = Math.max(...leaves.map((e) => rect(e).bottom + scrollY)) - (d.scrollHeight - innerHeight); // last content, page scrolled to the end
      if (end - rect(f).top > EPS) add('covered', f, `covers the last content by ${px(end - rect(f).top)} px at the end of the page`, [px(end), px(rect(f).top)]);
    }
    return found;
  }

  // Matches whose position or size changed (a state change should move nothing outside the changed part).
  function boxes(selectors) {
    const found = [];
    for (const s of selectors) {
      const now = $$(s).map((e) => ({ n: label(e), left: rect(e).left + scrollX, top: rect(e).top + scrollY, width: rect(e).width, height: rect(e).height }));
      if (!seen[s]) found.push(item('saved', s, `nothing to compare yet: saved ${now.length} boxes as the before state`, [now.length]));
      (seen[s] ?? []).forEach((was, i) => {
        const moves = now[i] && ['left', 'top', 'width', 'height'].filter((k) => Math.abs(now[i][k] - was[k]) > EPS).map((k) => `${k} ${px(now[i][k] - was[k])}`);
        if (moves?.length) found.push(item('moved', `${s}[${i}]`, `${was.n}: ${moves.join(', ')}`, [was, now[i]].map((b) => [b.left, b.top, b.width, b.height].map(px))));
      });
      seen[s] = now;
    }
    return found;
  }

  Object.assign(window, { census, columns, gaps, overflow, boxes });
})();
