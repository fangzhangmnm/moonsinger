#!/usr/bin/env node
// tools/i18n-sync.mjs —— 对账：源码里 _t("…") 用到的键 vs src/i18n/strings.ts。created 2026-11-04 by Claude Opus 5.5
//   node tools/i18n-sync.mjs                 列缺的（表里没有）、多的（没人用）
//   node tools/i18n-sync.mjs --missing x.json  缺的写成 [{id, k, w}]，翻译用
//   node tools/i18n-sync.mjs --merge x.tsv…    把 `id<TAB>译文` 合进表（id = 上一步的序号），按源码出现顺序重写表
//   node tools/i18n-sync.mjs --prune           删掉没人用的条
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ts, parse, SKIP_FILES } from "./i18n-ast.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TABLE = path.join(ROOT, "src/i18n/strings.ts");

export function usedKeys() {
  const used = new Map();
  const walk = (d) => {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) { walk(p); continue; }
      if (!/\.(ts|mjs|js)$/.test(f) || f.endsWith(".d.ts")) continue;
      const rel = path.relative(ROOT, p).replace(/\\/g, "/");
      if (rel === "src/i18n/strings.ts") continue;
      const text = fs.readFileSync(p, "utf8");
      if (!text.includes("_t(")) continue;
      const sf = parse(p, text);
      const visit = (n) => {
        if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === "_t" && n.arguments[0] && (ts.isStringLiteral(n.arguments[0]) || ts.isNoSubstitutionTemplateLiteral(n.arguments[0]))) {
          const k = n.arguments[0].text;
          const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
          if (!used.has(k)) used.set(k, `${rel}:${line}`);
        }
        ts.forEachChild(n, visit);
      };
      visit(sf);
    }
  };
  walk(path.join(ROOT, "src"));
  return used;
}

function readTable() {
  if (!fs.existsSync(TABLE)) return new Map();
  const sf = parse(TABLE, fs.readFileSync(TABLE, "utf8"));
  const out = new Map();
  const visit = (n) => {
    if (ts.isPropertyAssignment(n) && ts.isObjectLiteralExpression(n.initializer) && (ts.isStringLiteral(n.name))) {
      const en = n.initializer.properties.find((p) => p.name?.text === "en");
      if (en && ts.isStringLiteral(en.initializer)) { out.set(n.name.text, en.initializer.text); return; }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

function writeTable(map, order) {
  const head = `// i18n SSoT —— 键 = 中文原文，en 必填（新的 _t("…") 表里没有 = tsc 报错）。created 2026-11-04 by Claude Opus 5.5（v0.15.0）。
//   行为和设计见 ./index.ts。加一条：写 _t("新的话")，跑 node tools/i18n-sync.mjs 看缺什么，手加一行。
//   ja 留了位（可选，没有 = 用 en），这一版不做。译文里不写英文双引号（很多条落在 title="…" 里），用 “ ”。
//   > as-of v0.15.0 / 2026-11-04
export type Lang = "zh" | "en";
export type Entry = { en: string; ja?: string };

export const S = {
`;
  const lines = [];
  const seen = new Set();
  for (const k of [...order, ...map.keys()]) {
    if (seen.has(k) || !map.has(k)) continue;
    seen.add(k);
    lines.push(`  ${JSON.stringify(k)}: { en: ${JSON.stringify(map.get(k))} },`);
  }
  fs.writeFileSync(TABLE, head + lines.join("\n") + `\n} as const satisfies Record<string, Entry>;\n\nexport type Key = keyof typeof S;\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = process.argv[2];
  const used = usedKeys();
  const table = readTable();
  const missing = [...used.keys()].filter((k) => !table.has(k));
  const unused = [...table.keys()].filter((k) => !used.has(k));
  if (arg === "--missing") {
    fs.writeFileSync(process.argv[3], JSON.stringify(missing.map((k, id) => ({ id, k, w: used.get(k) }))));
    console.log(`${missing.length} missing`);
  } else if (arg === "--merge") {
    const list = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
    let n = 0;
    for (const f of process.argv.slice(4)) {
      for (const line of fs.readFileSync(f, "utf8").split("\n")) {
        if (!line.trim()) continue;
        const tab = line.indexOf("\t");
        if (tab < 0) throw new Error(`no tab: ${f}: ${line}`);
        const id = +line.slice(0, tab);
        const e = list[id];
        if (!e) throw new Error(`bad id ${id} in ${f}`);
        const en = line.slice(tab + 1).replace(/\\n/g, "\n");
        table.set(e.k, en);
        n++;
      }
    }
    writeTable(table, [...used.keys()]);
    console.log(`merged ${n}; table ${table.size}; still missing ${[...used.keys()].filter((k) => !table.has(k)).length}`);
  } else if (arg === "--stub") {
    for (const k of missing) table.set(k, "");
    writeTable(table, [...used.keys()]);
    console.log(`stubbed ${missing.length}`);
  } else if (arg === "--prune") {
    for (const k of unused) table.delete(k);
    writeTable(table, [...used.keys()]);
    console.log(`pruned ${unused.length}`);
  } else {
    console.log(`used ${used.size}, table ${table.size}, missing ${missing.length}, unused ${unused.length}`);
    for (const k of missing.slice(0, 40)) console.log("  missing:", used.get(k), k.slice(0, 60));
    for (const k of unused.slice(0, 40)) console.log("  unused:", k.slice(0, 60));
    if (missing.length) process.exitCode = 1;
  }
}
void SKIP_FILES;
