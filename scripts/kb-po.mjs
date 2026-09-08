// Copyright 2026 SK Telecom Co., Ltd.
// SPDX-License-Identifier: Apache-2.0
//
// Convert the knowledge-base registries' sibling translation fields <-> gettext
// PO, so Weblate can host them.
//
// The registries keep translations as siblings of the English field
// (`label` / `label_ko` / `label_zh`), which is what keeps the JSON a stable
// English machine contract: a consumer that knows nothing about locales still
// reads `label`. No Weblate file format understands that shape, hence this
// bridge.
//
// Writing back is deliberately line-surgical rather than JSON.stringify:
// ai-risk-knowledge.json is hand-formatted with compact inline arrays, and
// re-serializing it would turn 489 lines into ~1060 and bury the real diff.
// Every `_<sfx>` key already exists, so the nth occurrence of `"label_zh":` in
// the raw text is the nth `label` field a depth-first walk reaches -- object
// key order and array order are both preserved by JSON.parse.
//
// Usage:
//   node scripts/kb-po.mjs --to-po   <ko|zh-TW>   # JSON -> po/knowledge/<lang>.po
//   node scripts/kb-po.mjs --from-po <ko|zh-TW>   # po/knowledge/<lang>.po -> JSON
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = join(dirname(new URL(import.meta.url).pathname), "..");
const LIB = join(ROOT, "docker/lib");
const FILES = [
  "cisa-guidance.json", "ai-risk-knowledge.json", "g7-registry.json",
  "regulation-crosswalk.json", "cisa-registry.json", "g7-guidance.json",
];
const SFX = { ko: "_ko", "zh-TW": "_zh" };

const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
  .replace(/\n/g, "\\n").replace(/\t/g, "\\t");
const unesc = (s) => s.replace(/\\(.)/g, (_, c) =>
  ({ n: "\n", t: "\t", "\\": "\\", '"': '"' }[c] ?? c));

/** Depth-first walk yielding {path, key, english, translated} in file order. */
function* walk(node, sfx, path = []) {
  if (Array.isArray(node)) {
    for (const [i, v] of node.entries()) yield* walk(v, sfx, [...path, i]);
    return;
  }
  if (node === null || typeof node !== "object") return;
  for (const [k, v] of Object.entries(node)) {
    if (k.endsWith(sfx)) continue;                       // the sibling itself
    const sib = node[k + sfx];
    if (typeof v === "string" && typeof sib === "string") {
      yield { path: [...path, k].join("."), key: k, english: v, translated: sib };
    }
    yield* walk(v, sfx, [...path, k]);
  }
}

function collect(sfx) {
  const out = [];
  for (const fn of FILES) {
    const data = JSON.parse(readFileSync(join(LIB, fn), "utf8"));
    for (const e of walk(data, sfx)) out.push({ file: fn, ...e });
  }
  return out;
}

function toPo(lang) {
  const sfx = SFX[lang];
  const rows = collect(sfx);
  const L = [
    "# Knowledge-base registry labels for BomLens (G7 / CISA / AI risk /",
    "# regulatory crosswalk). Stored in the JSON as siblings of the English",
    "# field, so the JSON stays an English machine contract.",
    "#",
    "# Regenerate the JSON after a Weblate push:",
    `#   node scripts/kb-po.mjs --from-po ${lang}`,
    "#",
    "# Identifiers are NOT translatable and carry no entry here: element ids,",
    "# PURLs, SPDX ids, CycloneDX field paths, regulation citations.",
    'msgid ""', 'msgstr ""',
    '"Project-Id-Version: BomLens knowledge base\\n"',
    '"Report-Msgid-Bugs-To: https://github.com/sktelecom/bomlens/issues\\n"',
    '"PO-Revision-Date: 2026-09-08 00:00+0800\\n"',
    '"Last-Translator: Automatically extracted <noreply@invalid>\\n"',
    `"Language-Team: ${lang}\\n"`,
    `"Language: ${lang}\\n"`,
    '"MIME-Version: 1.0\\n"',
    '"Content-Type: text/plain; charset=UTF-8\\n"',
    '"Content-Transfer-Encoding: 8bit\\n"',
    '"Plural-Forms: nplurals=1; plural=0;\\n"',
    "",
  ];
  for (const r of rows) {
    L.push(`#: ${r.file}`);
    // The context is the field's path, not its English: the same short label
    // ("Present", "Review") repeats across registries and would collide.
    L.push(`msgctxt "${esc(`${r.file}:${r.path}`)}"`);
    L.push(`msgid "${esc(r.english)}"`);
    L.push(`msgstr "${esc(r.translated)}"`);
    L.push("");
  }
  const dir = join(ROOT, "po/knowledge");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${lang}.po`), L.join("\n"));
  // A POT as well, so Weblate can seed a language the repo does not have yet.
  const pot = L.map((l) => l.startsWith("msgstr \"") && l !== 'msgstr ""'
    ? 'msgstr ""'
    : l.replace(/^"Language(-Team)?: .*/, '"Language$1: \\n"')
       .replace(/^"Plural-Forms: .*/, ""))
    .filter((l, i, a) => l !== "" || a[i - 1] !== "");
  writeFileSync(join(dir, "knowledge.pot"), pot.join("\n"));
  return rows.length;
}

function fromPo(lang) {
  const sfx = SFX[lang];
  const po = readFileSync(join(ROOT, `po/knowledge/${lang}.po`), "utf8");
  const wanted = new Map();
  const re = /msgctxt "((?:[^"\\]|\\.)*)"\s*\nmsgid "((?:[^"\\]|\\.)*)"\s*\nmsgstr "((?:[^"\\]|\\.)*)"/g;
  for (const m of po.matchAll(re)) {
    const str = unesc(m[3]);
    if (str !== "") wanted.set(unesc(m[1]), str);
  }
  let changed = 0;
  for (const fn of FILES) {
    const path = join(LIB, fn);
    let raw = readFileSync(path, "utf8");
    const rows = [...walk(JSON.parse(raw), sfx)];
    // Per-key occurrence counters, so the nth `"label_zh":` in the text is
    // matched with the nth `label` field the walk reached.
    const seen = new Map();
    const targets = rows.map((r) => {
      const n = (seen.get(r.key) ?? 0) + 1;
      seen.set(r.key, n);
      return { key: r.key, n, value: wanted.get(`${fn}:${r.path}`) };
    });
    const counter = new Map();
    raw = raw.replace(
      /"(\w+)_(?:ko|zh)"(\s*:\s*)"((?:[^"\\]|\\.)*)"/g,
      (whole, key, sep, cur) => {
        if (!whole.includes(`_${sfx.slice(1)}"`)) return whole;
        const n = (counter.get(key) ?? 0) + 1;
        counter.set(key, n);
        const t = targets.find((x) => x.key === key && x.n === n);
        if (!t || t.value === undefined) return whole;
        const next = esc(t.value);
        if (next !== cur) changed++;
        return `"${key}${sfx}"${sep}"${next}"`;
      },
    );
    writeFileSync(path, raw);
  }
  return { fields: wanted.size, changed };
}

const [mode, lang] = process.argv.slice(2);
if (!SFX[lang] || !["--to-po", "--from-po"].includes(mode)) {
  console.error("usage: kb-po.mjs --to-po|--from-po <ko|zh-TW>");
  process.exit(1);
}
if (mode === "--to-po") {
  console.log(`${lang}: ${toPo(lang)} fields -> po/knowledge/${lang}.po`);
} else {
  const r = fromPo(lang);
  console.log(`${lang}: ${r.fields} fields from PO, ${r.changed} value(s) changed`);
}
