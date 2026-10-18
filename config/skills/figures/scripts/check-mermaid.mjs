#!/usr/bin/env node
// Check Mermaid sources against the vendored Pele bundle (Node 22, no dependencies).
//
//   node check-mermaid.mjs <file ...>     a .md or .markdown file is checked fence by fence
//   node check-mermaid.mjs -              one source from stdin
//
// Prints "OK <file>:block N" or "<file>:block N:line:column message" per source
// (line and column count inside the source). A file that cannot be read prints
// "<file>: cannot read (CODE)" and counts as a failure; a Markdown file with no
// mermaid fence prints "<file>: no mermaid block" and does not. Exits 1 when any
// source or file fails.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const bundle = join(dirname(fileURLToPath(import.meta.url)), "../assets/pele/pele.global.js");
const context = vm.createContext({});
context.globalThis = context;
vm.runInContext(readFileSync(bundle, "utf8"), context);
const { pele } = context;

// Opening fence of a Markdown line: quote markers, indentation, an optional list marker, then
// three or more backticks or tildes and the info string. This is the shape the artifact
// Markdown export writes (list items in galleries, "> " in insets), not only column 0.
const FENCE = /^((?:[ \t]*>)*[ \t]*)((?:[-*+]|\d+[.)])[ \t]+)?(`{3,}|~{3,})[ \t]*(.*)$/;

// Remove the prefix of the opening line from a content line: the quote markers and as much
// indentation as the prefix had, so a mindmap's own indentation stays.
function stripPrefix(line, prefix) {
  let at = 0;
  for (const char of prefix) {
    if (char === ">") {
      if (line[at] !== ">") break;
    } else if (line[at] !== " " && line[at] !== "\t") break;
    at += 1;
  }
  return line.slice(at);
}

function mermaidFences(text) {
  const sources = [];
  let open = null;
  for (const line of text.split(/\r?\n/)) {
    if (open) {
      const body = stripPrefix(line, open.prefix);
      const close = body.match(/^[ \t]{0,3}(`+|~+)[ \t]*$/);
      if (close && close[1][0] === open.fence[0] && close[1].length >= open.fence.length) {
        if (open.mermaid) sources.push(open.lines.join("\n") + "\n");
        open = null;
      } else {
        open.lines.push(body);
      }
      continue;
    }
    const start = line.match(FENCE);
    if (!start) continue;
    const [, indent, marker = "", fence, info] = start;
    open = {
      // Continuation lines of a list item are indented by the marker's width.
      prefix: indent + " ".repeat(marker.length),
      fence,
      mermaid: /^mermaid(\s|$)/.test(info),
      lines: [],
    };
  }
  // An unclosed fence runs to the end of the file, as in CommonMark.
  if (open?.mermaid) sources.push(open.lines.join("\n") + "\n");
  return sources;
}

function sourcesOf(name, text) {
  return /\.(md|markdown)$/i.test(name) ? mermaidFences(text) : [text];
}

const names = process.argv.slice(2);
if (names.length === 0) {
  console.error("usage: check-mermaid.mjs <file ...> | -");
  process.exit(2);
}

let failed = 0;
for (const name of names) {
  const label = name === "-" ? "<stdin>" : name;
  let text;
  try {
    text = readFileSync(name === "-" ? 0 : name, "utf8");
  } catch (error) {
    failed += 1;
    console.log(`${label}: cannot read (${error.code ?? error.message})`);
    continue;
  }
  const sources = sourcesOf(name, text);
  if (sources.length === 0) console.log(`${label}: no mermaid block`);
  sources.forEach((source, index) => {
    const where = `${label}:block ${index + 1}`;
    try {
      pele.render(source);
      console.log(`OK ${where}`);
    } catch (error) {
      failed += 1;
      const lines = String(error.message).split("\n");
      const message = lines.length > 1 ? `${lines[0]} ${lines.at(-1)}` : lines[0];
      console.log(`${where}:${error.line ?? 0}:${error.column ?? 0} ${message}`);
    }
  });
}
process.exit(failed ? 1 : 0);
