/* pele-embed.js: themes Pele diagrams and draws every `pre.mermaid` on the page. No network.

   Load pele.global.js first, then this file (script tags beside the HTML, or both inlined).
   - Theme: one stylesheet maps Pele's variables to the artifact page tokens through var(--token, literal), so a
     page that defines those tokens (artifact pages) switches with them and any other page gets the literals.
     Light literals by default; dark under prefers-color-scheme (unless the root has data-theme="light") and
     under data-theme="dark". Switching theme needs no redraw.
   - ?theme=light|dark sets data-theme on the root when it has none, so a frame inside an artifact page follows it.
   - Every unmounted `pre.mermaid` is drawn on DOMContentLoaded, or at once when the page is already parsed.
   - window.peleEmbed.mountAll(scope = document) draws the ones added later (inside scope, or scope itself when it is
     a pre.mermaid); refreshAll() redraws every diagram
     for the container width it has now (call it after the layout changed in a way that fires no resize).
   - Loading the file twice does nothing the second time. */
(() => {
  "use strict";
  if (!window.pele) throw new Error("pele-embed.js needs pele.global.js loaded before it");
  if (window.peleEmbed) return;

  // Pele variable, artifact page token, light literal, dark literal.
  const COLORS = [
    ["bg", "--card", "#ffffff", "#1d1d21"],
    ["fg", "--ink", "#1d1d1f", "#ececf0"],
    ["muted", "--muted", "#6b6b70", "#a0a0aa"],
    ["line", "--muted-tone", "#5b5b66", "#b9b9c4"],
    ["surface", "--mutedbg", "#ececf0", "#2a2a30"],
    ["surface-alt", "--bg", "#f7f7f5", "#141416"],
    ["border", "--muted", "#6b6b70", "#a0a0aa"],
    ["accent", "--acc", "#2f5bd3", "#8fb0ff"],
    ["critical", "--bad", "#b3261e", "#ff8a80"],
    ["error", "--bad", "#b3261e", "#ff8a80"],
  ];
  const SERIES = [
    ["#2f5bd3", "#d96f00", "#1f7a4d", "#b3261e", "#b03a9a", "#1b7f8c", "#6b52c0", "#8a6d3b"],
    ["#8fb0ff", "#ffa24d", "#5fd394", "#ff8a80", "#e58ad2", "#5ccfdc", "#b9a2ff", "#d8b56b"],
  ];
  const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
  const TARGET = ":is(pre.mermaid,.pele)";

  const declarations = (theme) => [
    ...COLORS.map(([name, token, ...literals]) => `--pele-${name}:var(${token},${literals[theme]})`),
    ...SERIES[theme].map((color, n) => `--pele-series-${n + 1}:${color}`),
    `--pele-font:${FONT}`,
  ].join(";");

  const css = `${TARGET}{${declarations(0)}}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) ${TARGET}{${declarations(1)}}}
:root[data-theme="dark"] ${TARGET}{${declarations(1)}}
pre.mermaid{background:var(--pele-bg);color:var(--pele-fg);font-family:var(--pele-font)}`;

  const style = document.createElement("style");
  style.id = "pele-embed-style";
  style.textContent = css;
  document.head.append(style);

  const root = document.documentElement;
  const asked = new URLSearchParams(location.search).get("theme");
  if ((asked === "light" || asked === "dark") && !root.dataset.theme) root.dataset.theme = asked;

  const mounted = new Set();

  const UNMOUNTED = "pre.mermaid:not([data-pele-mounted])";

  function mountAll(scope = document) {
    const found = [...scope.querySelectorAll(UNMOUNTED)];
    if (scope.matches?.(UNMOUNTED)) found.unshift(scope);
    for (const element of found) {
      element.dataset.peleMounted = "";
      mounted.add(window.pele.mount(element, element.textContent, { zoom: false }));
    }
  }

  function refreshAll() {
    mounted.forEach((diagram) => diagram.refresh());
  }

  window.peleEmbed = { mountAll, refreshAll };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => mountAll());
  else mountAll();
})();
