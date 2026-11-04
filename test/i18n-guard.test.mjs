// i18n 守卫：界面的字都走 _t、表里都有英文。created 2026-11-04 by Claude Opus 5.5（v0.15.0）
//   新写的中文字串没包 _t = 红（故意不翻的：行尾写 `// i18n-keep`，判定在 tools/i18n-ast.mjs）。
//   _t 的键表里没有 tsc 已经会红；这里再守「英文别空着」「参数名对得上」「不多留没人用的条」。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, assert } from "./runner.mjs";
import { ts, parse, isSkipFile, isSkippedContext, hasKeepMark, literalHasHan } from "../tools/i18n-ast.mjs";
import { usedKeys } from "../tools/i18n-sync.mjs";
import { S } from "../src/i18n/strings.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function files(d, out = []) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) files(p, out);
    else if (/\.(ts|mjs|js)$/.test(f) && !f.endsWith(".d.ts")) out.push(p);
  }
  return out;
}

describe("i18n 守卫", () => {
  it("src 里的中文字串都走 _t（故意不翻的写 // i18n-keep）", () => {
    const bad = [];
    for (const abs of files(path.join(ROOT, "src"))) {
      const rel = path.relative(ROOT, abs).replace(/\\/g, "/");
      if (isSkipFile(rel)) continue;
      const sf = parse(abs, fs.readFileSync(abs, "utf8"));
      const visit = (n) => {
        if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateExpression(n)) && literalHasHan(n, sf) && !isSkippedContext(n) && !hasKeepMark(sf, n)) {
          bad.push(`${rel}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1} ${n.getText(sf).slice(0, 40)}`);
        }
        ts.forEachChild(n, visit);
      };
      visit(sf);
    }
    assert(bad.length === 0, `没走 _t：\n${bad.slice(0, 30).join("\n")}`);
  });
  it("表里每条英文都有、参数名和中文对得上、复数写法合法", () => {
    const bad = [];
    const params = (s) => [...new Set([...s.matchAll(/\{(\w+)(?:\|[^}]*)?\}/g)].map((m) => m[1]))].sort().join();
    for (const [k, e] of Object.entries(S)) {
      if (!e.en) { bad.push(`空：${k.slice(0, 30)}`); continue; }
      if (params(k) !== params(e.en)) bad.push(`参数：${k.slice(0, 30)} → ${e.en.slice(0, 30)}`);
      if (e.en.includes('"') && !k.includes('"')) bad.push(`英文双引号（落在 title="…" 里会断）：${e.en.slice(0, 30)}`);
      for (const m of e.en.matchAll(/\{\w+\|([^}]*)\}/g)) if (m[1].split("|").length !== 2) bad.push(`复数要两种写法：${m[0]}`);
    }
    assert(bad.length === 0, bad.slice(0, 20).join("\n"));
  });
  it("表和源码对得上（缺 / 多都红；node tools/i18n-sync.mjs 看）", () => {
    const used = usedKeys();
    const missing = [...used.keys()].filter((k) => !S[k]), unused = Object.keys(S).filter((k) => !used.has(k));
    assert(missing.length === 0 && unused.length === 0, `缺 ${missing.slice(0, 8).join(" | ")}；多 ${unused.slice(0, 8).join(" | ")}`);
  });
  it("styles.css 的 content 不写死中文（CSS 没有 _t，走变量）", () => {
    const css = fs.readFileSync(path.join(ROOT, "styles.css"), "utf8");
    const bad = css.split("\n").filter((l) => /content:\s*"[^"]*[一-鿿]/.test(l));
    assert(bad.length === 0, bad.join("\n").slice(0, 200));
  });
});
