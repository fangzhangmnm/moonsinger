// 版面上不许叠在一起（7-K，2026-11-12；user「各种打架」）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
//   施工单 ai-docs/20261111-score-surface-construction-plan.md 7-K：用全的测试歌（十种视图）+ 照 user 截图搭的三声部带词歌（编辑 / 印），三种谱各排一遍，
//   每个图元的墨迹框两两比（test/fixtures/layout/collide.ts：字用仓里那款黑体逐个字形取真的墨迹框，排版也用这款字量 = PDF 印出来的；调号的淡提示也算）。
//   相叠分三张明着的单子：ALLOWED（本来就该叠）、PENDING（查出来了、等统筹定谁让谁）、STAFF_KNOWN（五线谱查出来的，这一串只报不修）。
//   单子之外的相叠 = 红。以后加新的画法 / 记号，撞了这里自己会报。单子里的条目没再出现 = 也红（修好了就从单子里划掉，单子不留死条目）。
import { describe, it, assert } from "./runner.mjs";
import { engrave, type EngraveOpts, type Layout, type Prim } from "../src/render/engrave.ts";
import { printOpts, textEm } from "../src/export/score-pdf.ts";
import { parseTtf } from "../src/export/ttf.ts";
import { createTextMeasure } from "../src/render/text/index.ts";
import type { Song } from "../src/score/song.ts";
import { FULL_VIEWS } from "./fixtures/layout/full.ts";
import { fullSong } from "./fixtures/layout/full-song.ts";
import { trioSong, TRIO_LABELS } from "./fixtures/layout/trio-song.ts";
import { asFrozen, editorBase, views, SP } from "./fixtures/layout/cases.ts";
import { allPrims, inkOf, overlaps, kindOf } from "./fixtures/layout/collide.ts";
// node 的内置模块照 pdf-wysiwyg.test.ts 的取法（类型检查不带 node 的类型）
const nodeMod = (m: string) => (globalThis as unknown as { process: { getBuiltinModule(m: string): any } }).process.getBuiltinModule(m);
const fs = nodeMod("node:fs"), zlib = nodeMod("node:zlib");

const font = parseTtf(new Uint8Array(zlib.gunzipSync(fs.readFileSync(new URL("../vendor/fonts/sans.ttf.gz", import.meta.url)))));
const real = createTextMeasure((s: string, px: number) => textEm(font, s) * px);
const EPS = 0.3;   // px（sp 10 时 0.03 个线间距）：叠进去超过这么多才算

const has = (p: Prim, c: string) => new RegExp(`(^|\\s)${c}(\\s|$)`).test(p.cls ?? "");
const isArc = (p: Prim) => p.t === "path" && (has(p, "tie") || has(p, "slur"));
/** 本来就该叠的（两头都看；三种谱共用）。名字写进报错，方便查。 */
const ALLOWED: { name: string; ok: (a: Prim, b: Prim) => boolean }[] = [
  { name: "延音线 / 圆滑线跨过小节线", ok: (a, b) => isArc(a) && b.t === "line" && has(b, "bar") },
  { name: "延音线 / 圆滑线跨过数字、字母、×（贴着字形的顶）", ok: (a, b) => isArc(a) && b.t === "text" && (has(b, "jp-digit") || has(b, "jp-acc")) },
  { name: "同一个记号的几笔（滚奏的几道斜线、拍号上下两个数字）", ok: (a, b) => a.tok === b.tok && a.cls === b.cls && a.t === b.t },
  // 五线谱：东西压在谱线 / 加线上、符干连着符头和符杠、滚奏斜线穿符干
  { name: "五线谱：压在谱线 / 加线上", ok: (_a, b) => b.t === "line" && (has(b, "staff") || has(b, "ledger")) },
  { name: "五线谱：小节线 / 谱号 / 调号 / 拍号 / 休止 / 符头和谱线", ok: (a, b) => a.t === "glyph" && b.t === "line" && has(b, "staff") },
  { name: "五线谱：符干（没有类名的线）连着符头 / 符杠 / 符尾 / 滚奏斜线 / 别的符干", ok: (a, b) => b.t === "line" && !b.cls && (a.t === "glyph" || (a.t === "path" && (has(a, "beam") || has(a, "roll"))) || (a.t === "line" && !a.cls)) },
  { name: "五线谱：幽灵音的括号符头 × 它的加线", ok: (a, b) => a.t === "glyph" && has(a, "ghost") && b.t === "line" && has(b, "ghost") },
  { name: "五线谱：符尾 / 附点挨着符头", ok: (a, b) => a.t === "glyph" && b.t === "glyph" && !a.cls && has(b, "note") },
];
/** 查出来了、等统筹定谁让谁：按「谁和谁」认。第八刀 8-5（不印的提示最后贴、只躲不推）之后 7-K 的 ⑥ ⑦ 三条都没了。 */
const PENDING: Record<string, string> = {};   // 8-7 ① 时字母谱有过一条 7-V 的（一行比一页高跑出纸底，压到下一页第一行的「2.」），8-7 (A) 数字报墨之后行高变了、碰不到了，划掉；7-V 本身没修
/** 五线谱查出来的（这一串只报不修；施工单第六节 7-K「五线谱只报不修」）。 */
const STAFF_KNOWN: Record<string, string> = {
  "path:brace × rect:cat-bar.ann.cat-1": "花括号压着编辑器的色条", "path:brace × rect:cat-bar.ann.cat-4": "花括号压着编辑器的色条",
  "line:ottava-line × text:ottava.cont": "8va 虚线压着「(8va)」",
  "line:- × path:tie": "延音线压符干", "glyph:dyn × glyph:timesig": "7-V：一行比一页高，跑出纸底压到下一页第一行（分页 / 印；8-7 夹具先过补力度之后出现）", "glyph:note × line:ottava-line.off.ann": "关着的自动八度线提示压符头", "glyph:note × text:ottava.cont.off.ann": "关着的自动八度线提示的字压符头",
};

type Case = { name: string; L: Layout; ts: number };
function cases(notation: "staff" | "jianpu" | "letters"): Case[] {
  const out: Case[] = [];
  for (const v of FULL_VIEWS) { const s0 = { ...asFrozen(fullSong()), notation } as Song, s = v.song ? v.song(s0) : s0, o = { ...v.opts(s), measure: real } as EngraveOpts; out.push({ name: `用全的测试歌 · ${v.name}`, L: engrave(s, o), ts: o.textScale ?? 1 }); }
  const t = { ...asFrozen(trioSong()), notation } as Song;
  for (const [name, o] of [["编辑", { ...editorBase(t, TRIO_LABELS), measure: real }], ["印", printOpts(t, SP, views(t, TRIO_LABELS, false), real, true, 0)]] as const) out.push({ name: `三声部 · ${name}`, L: engrave(t, o as EngraveOpts), ts: (o as EngraveOpts).textScale ?? 1 });
  return out;
}
/** 一种谱的所有相叠，按「谁和谁」分组（去掉 ALLOWED 的）。 */
function found(notation: "staff" | "jianpu" | "letters"): Map<string, string[]> {
  const g = new Map<string, string[]>();
  for (const c of cases(notation)) {
    const AP = allPrims(c.L), ink = inkOf(c.L, (s, size) => real.widthPx(s, size, c.L.sp, c.ts), (p) => p.t === "rect" && has(p, "page"), font);
    for (const o of overlaps(ink, EPS).values()) {
      const a = AP[o.a]!, b = AP[o.b]!;
      if (ALLOWED.some((r) => r.ok(a, b) || r.ok(b, a))) continue;
      const ka = kindOf(a), kb = kindOf(b), key = ka < kb ? `${ka} × ${kb}` : `${kb} × ${ka}`, lab = (p: Prim) => (p.t === "text" ? `「${p.s}」` : p.t);
      const arr = g.get(key) ?? []; g.set(key, arr); if (arr.length < 3) arr.push(`${c.name} (${o.x.toFixed(0)}, ${o.y.toFixed(0)}) ${lab(a)}${lab(b)}`);
    }
  }
  return g;
}

describe("版面上不许叠在一起（7-K）", () => {
  for (const notation of ["jianpu", "letters"] as const) it(`${notation === "jianpu" ? "简谱" : "字母谱"}：名单之外的相叠一个都没有；等统筹定的那几类没多出新的种类`, () => {
    const g = found(notation), bad = [...g].filter(([k]) => !(k in PENDING));
    assert(!bad.length, `相叠了（不在名单上）：\n${bad.map(([k, ex]) => `  ${k}\n    ${ex.join("\n    ")}`).join("\n")}`);
  });
  it("五线谱（只报不修）：查出来的都在已知的单子上；单子里的条目还在（修好了就划掉）", () => {
    const g = found("staff"), bad = [...g].filter(([k]) => !(k in STAFF_KNOWN)), gone = Object.keys(STAFF_KNOWN).filter((k) => !g.has(k));
    assert(!bad.length, `五线谱多出来的相叠：\n${bad.map(([k, ex]) => `  ${k}\n    ${ex.join("\n    ")}`).join("\n")}`);
    assert(!gone.length, `单子上这几条已经没有了（从 STAFF_KNOWN 里划掉）：${gone.join("；")}`);
  });
  it("等统筹定的单子里的条目还在（修好了就划掉）", () => {
    const g = new Map([...found("jianpu"), ...found("letters")]), gone = Object.keys(PENDING).filter((k) => !g.has(k));
    assert(!gone.length, `单子上这几条已经没有了（从 PENDING 里划掉）：${gone.join("；")}`);
  });
});
