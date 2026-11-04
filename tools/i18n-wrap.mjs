#!/usr/bin/env node
// tools/i18n-wrap.mjs —— 把源码里的中文字串包进 _t("…")。created 2026-11-04 by Claude Opus 5.5（v0.15.0 i18n）
//   node tools/i18n-wrap.mjs --dry [out.json]   只列：每条 key、出现在哪（看提取质量、翻译用）
//   node tools/i18n-wrap.mjs --apply            改写 src/ 里的文件
//   规则：
//     · 普通字串 / 模板 = 一条消息，${x} 变成 {x} 参数（词序留给翻译）。
//     · 带 HTML 的模板：按块级标签切开，每段文字、title / placeholder / aria-label 的值各一条；
//       行内标签（b / i / small / kbd / code / br / span …）留在消息里，免得一句话被切碎。
//     · 图标类的 ${iconHtml(..)} 贴在段落边上 = 留在消息外面。
//     · "第 " + n + " 张" 这种无 HTML 的加号链 = 合成一条。
//   不翻的判定在 tools/i18n-ast.mjs（比较、查找、日志、对象键……），故意不翻的写 `// i18n-keep`。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ts, HAN, isSkipFile, isSkippedContext, hasKeepMark, parse } from "./i18n-ast.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mode = process.argv[2];
const NAMES = /** @type {Map<string,{n:number,where:string[]}>} */ (new Map());
const INLINE = new Set(["b", "i", "em", "strong", "code", "kbd", "u", "sub", "sup"]);
const ATTRS = /(\b(?:title|placeholder|aria-label|alt|label)=)"([^"]*)"/g;

function note(key, where) { const e = NAMES.get(key) ?? { n: 0, where: [] }; e.n++; if (e.where.length < 3) e.where.push(where); NAMES.set(key, e); }

function cookTemplate(raw) { return new Function("return `" + raw.replace(/\$\{/g, "\\${") + "`")(); }
function isMarkupExpr(src) { return /icon|svg|Html|html|<\w/.test(src); }
function paramName(src, used) {
  let s = src.trim();
  let m = s.match(/^[A-Za-z_$][\w$]*$/);
  let name = m ? s : null;
  if (!name) {
    const call = s.match(/^(?:[\w$.]+)\(\s*([\s\S]*)\)$/);
    if (call) s = call[1];
    const len = s.match(/([A-Za-z_$][\w$]*)\.length$/);
    if (len) name = "n";
    else { const prop = s.match(/([A-Za-z_$][\w$]*)(?:\s*[,)?].*)?$/); name = prop ? prop[1] : null; }
    if (!name || /^(true|false|null|undefined|function|return)$/.test(name)) name = "p";
  }
  name = name.replace(/^\$+/, "") || "p";
  let out = name, i = 2;
  while (used.has(out)) out = `${name}${i++}`;
  used.add(out);
  return out;
}

class Rewriter {
  constructor(file, sf) { this.file = file; this.sf = sf; }
  where(node) { return `${this.file}:${this.sf.getLineAndCharacterOfPosition(node.getStart(this.sf)).line + 1}`; }
  src(node) { return this.sf.text.slice(node.getStart(this.sf), node.end); }

  /** 输出 node 的源码，里面该包的字面量都包好。 */
  render(node) {
    const edits = [];
    const visit = (n) => {
      const r = this.rewriteNode(n);
      if (r != null) { edits.push({ start: n.getStart(this.sf), end: n.end, text: r }); return; }
      ts.forEachChild(n, visit);
    };
    ts.forEachChild(node, visit);
    const rootR = this.rewriteNode(node);
    if (rootR != null) return rootR;
    let out = "", at = node.getStart(this.sf);
    for (const e of edits.sort((a, b) => a.start - b.start)) { out += this.sf.text.slice(at, e.start) + e.text; at = e.end; }
    return out + this.sf.text.slice(at, node.end);
  }

  rewriteNode(n) {
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.PlusToken) return this.rewritePlus(n);
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      if (!HAN.test(n.text) || isSkippedContext(n) || hasKeepMark(this.sf, n)) return null;
      return this.rewriteSeq([{ text: n.text }], n, ts.isStringLiteral(n));
    }
    if (ts.isTemplateExpression(n)) {
      if (isSkippedContext(n) || hasKeepMark(this.sf, n)) return null;
      const seq = [{ text: cookTemplate(n.head.rawText ?? n.head.text) }];
      for (const sp of n.templateSpans) { seq.push({ expr: sp.expression }); seq.push({ text: cookTemplate(sp.literal.rawText ?? sp.literal.text) }); }
      if (!seq.some((p) => p.text && HAN.test(p.text))) return null;   // 静态部分没中文：里面的 ${…} 走普通递归
      return this.rewriteSeq(seq, n, false);
    }
    return null;
  }

  rewritePlus(n) {
    if (n.parent && ts.isBinaryExpression(n.parent) && n.parent.operatorToken.kind === ts.SyntaxKind.PlusToken) return null;   // 从链头处理
    const leaves = [];
    const walk = (x) => { if (ts.isBinaryExpression(x) && x.operatorToken.kind === ts.SyntaxKind.PlusToken) { walk(x.left); walk(x.right); } else if (ts.isParenthesizedExpression(x) && ts.isBinaryExpression(x.expression) && x.expression.operatorToken.kind === ts.SyntaxKind.PlusToken && false) walk(x.expression); else leaves.push(x); };
    walk(n);
    const isTextLeaf = (x) => ts.isStringLiteral(x) || ts.isNoSubstitutionTemplateLiteral(x) || ts.isTemplateExpression(x);
    const han = leaves.some((x) => isTextLeaf(x) && (ts.isTemplateExpression(x) ? (HAN.test(x.head.text) || x.templateSpans.some((s) => HAN.test(s.literal.text))) : HAN.test(x.text)));
    if (!han || isSkippedContext(n) || hasKeepMark(this.sf, n)) return null;
    const html = leaves.some((x) => isTextLeaf(x) && /<\/?[a-zA-Z]/.test(this.src(x)));
    if (html) return null;   // 带 HTML 的长串：各段自己处理，版面（换行）不动
    const seq = [];
    const pushText = (t) => { if (seq.length && seq[seq.length - 1].text != null) seq[seq.length - 1].text += t; else seq.push({ text: t }); };
    for (const x of leaves) {
      if (ts.isStringLiteral(x) || ts.isNoSubstitutionTemplateLiteral(x)) pushText(x.text);
      else if (ts.isTemplateExpression(x)) {
        pushText(cookTemplate(x.head.rawText ?? x.head.text));
        for (const sp of x.templateSpans) { seq.push({ expr: sp.expression }); pushText(cookTemplate(sp.literal.rawText ?? sp.literal.text)); }
      } else seq.push({ expr: x });
    }
    return this.rewriteSeq(seq, n, false);
  }

  /** seq = 文字 / 表达式交替。没 HTML = 一条消息；有 HTML = 切段。 */
  rewriteSeq(seq, node, wasPlainString) {
    const staticText = seq.map((p) => p.text ?? "").join("");
    if (!/<\/?[a-zA-Z][^<>]*>/.test(staticText)) return this.message(seq, node);
    return this.htmlTemplate(seq, node);
  }

  message(seq, node, opts = {}) {
    const used = new Set();
    let key = "";
    const params = [];
    for (const p of seq) {
      if (p.text != null) { key += p.text; continue; }
      const src = this.src(p.expr);
      const name = paramName(src, used);
      key += `{${name}}`;
      params.push(name === src.trim() ? name : `${/^[A-Za-z_$][\w$]*$/.test(name) ? name : JSON.stringify(name)}: ${this.render(p.expr)}`);
    }
    note(key, this.where(node));
    return `_t(${JSON.stringify(key)}${params.length ? `, { ${params.join(", ")} }` : ""})`;
  }

  /** 带 HTML：按块切，输出模板串。 */
  htmlTemplate(seq, node) {
    // 拼成带哨兵的串：<序号> = 第几个表达式
    const exprs = [];
    let s = "";
    for (const p of seq) { if (p.text != null) s += p.text; else { s += `${exprs.length}`; exprs.push(p.expr); } }
    const tok = /<\/?([a-zA-Z][\w-]*)(?:[^<>"]|"[^"]*")*>/g;
    let out = "", last = 0, run = "", m;
    const flush = () => { out += this.wrapRun(run, exprs, node); run = ""; };
    while ((m = tok.exec(s))) {
      run += s.slice(last, m.index);
      last = m.index + m[0].length;
      const tag = m[1].toLowerCase();
      if (INLINE.has(tag) && !/\b(?:title|placeholder|aria-label)="[^"]*[一-鿿]/.test(m[0])) { run += m[0]; continue; }
      flush();
      out += this.wrapAttrs(m[0], exprs, node);
    }
    run += s.slice(last);
    flush();
    // 哨兵换回 ${…}（消息外面的表达式 / 标签属性里的表达式）
    const text = out.replace(/[`\\]/g, (c) => "\\" + c).replace(/\$\{/g, "\\${").replace(/\n/g, "\\n")
      .replace(/([0-9a-f]+)/g, (_, h) => Buffer.from(h, "hex").toString("utf8"))
      .replace(/(\d+)/g, (_, i) => "${" + this.render(exprs[+i]) + "}");
    return "`" + text + "`";
  }

  /** 已经是源码的片段（${_t(…)}）：编码起来，免得被当模板文字转义。 */
  raw(codeText) { return "" + Buffer.from(codeText, "utf8").toString("hex") + ""; }

  wrapAttrs(tagText, exprs, node) {
    return tagText.replace(ATTRS, (all, head, val) => {
      if (!HAN.test(val)) return all;
      return `${head}"${this.wrapRun(val, exprs, node)}"`;
    });
  }

  wrapRun(run, exprs, node) {
    if (!HAN.test(run)) return run;
    // 去掉两边的空白、贴边的图标表达式、整包在外面 / 不成对的行内标签：它们留在消息外面
    let start = 0, end = run.length;
    const edge = /^(\s+|\uE000(\d+)\uE001)/, edgeEnd = /(\s+|\uE000(\d+)\uE001)$/;
    for (;;) {
      const s0 = start, e0 = end;
      for (;;) {
        const m = run.slice(start, end).match(edge);
        if (!m) break;
        if (m[2] != null && !isMarkupExpr(this.src(exprs[+m[2]]))) break;
        start += m[0].length;
      }
      for (;;) {
        const m = run.slice(start, end).match(edgeEnd);
        if (!m) break;
        if (m[2] != null && !isMarkupExpr(this.src(exprs[+m[2]]))) break;
        end -= m[0].length;
      }
      const c = run.slice(start, end);
      const tags = [...c.matchAll(/<(\/?)([a-zA-Z][\w-]*)(?:[^<>"]|"[^"]*")*>/g)].map((t) => ({ at: t.index, len: t[0].length, close: !!t[1], name: t[2], mate: -1 }));
      const stack = [];
      tags.forEach((t, i) => { if (!t.close) stack.push(i); else { for (let j = stack.length - 1; j >= 0; j--) if (tags[stack[j]].name === t.name) { t.mate = stack[j]; tags[stack[j]].mate = i; stack.splice(j); break; } } });
      if (tags.length) {
        const first = tags[0], last = tags[tags.length - 1];
        if (first.at === 0 && !first.close && (first.mate === -1 || (first.mate === tags.length - 1 && last.at + last.len === c.length))) {
          start += first.len;
          if (first.mate !== -1) end -= last.len;
        } else if (last.at + last.len === c.length && last.close && last.mate === -1) end -= last.len;
      }
      if (start === s0 && end === e0) break;
    }
    if (!HAN.test(run.slice(start, end))) return run;
    const core = run.slice(start, end);
    const seq = [];
    let at = 0, mm;
    const re = /(\d+)/g;
    while ((mm = re.exec(core))) { if (mm.index > at) seq.push({ text: core.slice(at, mm.index) }); seq.push({ expr: exprs[+mm[1]] }); at = mm.index + mm[0].length; }
    if (at < core.length) seq.push({ text: core.slice(at) });
    return run.slice(0, start) + this.raw("${" + this.message(seq, node) + "}") + run.slice(end);
  }
}

function walkFiles(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walkFiles(p, out);
    else if (/\.(ts|mjs|js)$/.test(f) && !f.endsWith(".d.ts")) out.push(p);
  }
  return out;
}

let changed = 0;
for (const abs of walkFiles(path.join(ROOT, "src"))) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, "/");
  if (isSkipFile(rel)) continue;
  const text = fs.readFileSync(abs, "utf8");
  if (!HAN.test(text)) continue;
  const sf = parse(abs, text);
  const rw = new Rewriter(rel, sf);
  const edits = [];
  const visit = (n) => {
    const r = rw.rewriteNode(n);
    if (r != null) { edits.push({ start: n.getStart(sf), end: n.end, text: r }); return; }
    ts.forEachChild(n, visit);
  };
  ts.forEachChild(sf, visit);
  if (!edits.length) continue;
  if (mode === "--apply") {
    let out = "", at = 0;
    for (const e of edits.sort((a, b) => a.start - b.start)) { out += text.slice(at, e.start) + e.text; at = e.end; }
    out += text.slice(at);
    const depth = path.relative(path.dirname(abs), path.join(ROOT, "src/i18n/index.ts")).replace(/\\/g, "/");
    const imp = `import { _t } from "${depth.startsWith(".") ? depth : "./" + depth}";\n`;
    const firstImport = out.search(/^import /m);
    out = firstImport >= 0 ? out.slice(0, firstImport) + imp + out.slice(firstImport) : imp + out;
    fs.writeFileSync(abs, out);
    changed++;
  }
}
if (mode === "--dry") {
  const list = [...NAMES.entries()].map(([k, v], id) => ({ id, k, n: v.n, w: v.where }));
  const outp = process.argv[3] ?? "/dev/stdout";
  fs.writeFileSync(outp, JSON.stringify(list, null, 0));
  console.error(`${list.length} keys`);
} else if (mode === "--apply") console.error(`rewrote ${changed} files, ${NAMES.size} keys`);
else console.error("usage: --dry [out.json] | --apply");
