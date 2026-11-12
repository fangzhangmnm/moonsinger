// 版面上不许叠在一起（7-K，2026-11-12；user「各种打架」）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
//   施工单 ai-docs/20261111-score-surface-construction-plan.md 7-K：用全的测试歌（十种视图）+ 照 user 截图搭的三声部带词歌（编辑 / 印），三种谱各排一遍，
//   每个图元的墨迹框两两比（test/fixtures/layout/collide.ts：字用仓里那款黑体逐个字形取真的墨迹框，排版也用这款字量 = PDF 印出来的；调号的淡提示也算）。
//   相叠分三张明着的单子：ALLOWED（本来就该叠）、PENDING（查出来了、等统筹定谁让谁）、STAFF_KNOWN（五线谱查出来的，这一串只报不修）。
//   单子之外的相叠 = 红。以后加新的画法 / 记号，撞了这里自己会报。单子里的条目没再出现 = 也红（修好了就从单子里划掉，单子不留死条目）。
import { describe, it, eq, assert } from "./runner.mjs";
import { engrave, type EngraveOpts, type Layout, type Prim } from "../src/render/engrave.ts";
import { printOpts, textEm } from "../src/export/score-pdf.ts";
import { parseTtf } from "../src/export/ttf.ts";
import { createTextMeasure } from "../src/render/text/index.ts";
import type { Song } from "../src/score/song.ts";
import { FULL_VIEWS } from "./fixtures/layout/full.ts";
import { fullSong } from "./fixtures/layout/full-song.ts";
import { trioSong, TRIO_LABELS } from "./fixtures/layout/trio-song.ts";
import { asFrozen, editorBase, views, SP } from "./fixtures/layout/cases.ts";
import { emptySong, type Token } from "../src/score/song.ts";
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
const PENDING: Record<string, string> = {   // 8-7 ① 时字母谱有过一条 7-V 的，8-7 (A) 之后碰不到、划掉；7-G 时又碰上，7-I 小节线改固定短线之后（房子不用再越过高线、落低了）又碰不到、划掉。7-V 本身（一组比一页还高）没修
};
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
  for (const [name, o] of [["编辑", { ...editorBase(t, TRIO_LABELS), measure: real }], ["印", printOpts(t, SP, views(t, TRIO_LABELS, false), real, true)]] as const) out.push({ name: `三声部 · ${name}`, L: engrave(t, o as EngraveOpts), ts: (o as EngraveOpts).textScale ?? 1 });
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

describe("不印的状态提示不和别人打架（7-G 重做 → 统筹 2026-11-12 收成一串：隐藏了 N 段 · 隐藏了 N 个声部 · 演奏法和表情：不显示）", () => {
  const LONG = "一个很长很长的歌名用来测试两行的标题会不会和谱头那一行右端的提示打架以及作者栏";
  /** 两种组合（三条凑不到一起：「隐藏了 N 段」只在几张纸的全部视图里有，「隐藏了 N 个声部」只在一张纸、曲段名那一条没画时有）。 */
  const combos = (notation: "staff" | "jianpu" | "letters") => {
    const base = { ...asFrozen(fullSong()), notation, title: LONG, credits: "词：某某\n曲：某某", expressions: false } as Song;
    const multi = { ...base, papers: base.papers.map((p, k) => (k === 1 ? { ...p, hidden: true } : p)) } as Song;   // 藏一张纸 → 隐藏了 1 段 + 演奏法
    const one = { ...base, papers: [{ ...base.papers[0]!, name: "" }] } as Song;   // 只有一张纸、没名字 → 隐藏了 N 个声部 + 演奏法
    return [{ name: "隐藏了 N 段 + 演奏法", song: multi, hide: false, want: ["hiddenPapers", "expr"] }, { name: "隐藏了 N 个声部 + 演奏法", song: one, hide: true, want: ["hiddenParts", "expr"] }];
  };
  for (const notation of ["staff", "jianpu", "letters"] as const) it(`${notation}：两行的长歌名 + 作者栏，两种组合 × 编辑 / 分页 / 印 / 窄屏：提示不压任何墨、歌名、作者栏、曲段名那一条，不出右端，几条之间不叠；点击区不比字小`, () => {
    for (const c of combos(notation)) {
      const labels = c.song.parts.map((p) => p.id), hide = new Set(c.hide ? [c.song.parts[1]!.id] : []);   // 单纸那种：藏第二位（用全的测试歌的视图参数要第二张纸，这里用通用的编辑 / 印参数）
      const vs: [string, EngraveOpts][] = c.hide
        ? [["编辑", editorBase(c.song, labels, hide)], ["印", printOpts(c.song, SP, views(c.song, labels, false, hide), real, true) as EngraveOpts]]
        : FULL_VIEWS.filter((x) => ["edit-all", "edit-pages", "print"].includes(x.name)).map((v) => [v.name, v.opts(c.song) as EngraveOpts]);
      for (const [vn, o0] of vs) for (const narrow of [false, true]) {
      const o = { ...o0, measure: real, ...(narrow ? { width: 360 } : {}) } as EngraveOpts, L = engrave(c.song, o), tag = `${c.name} · ${vn}${narrow ? " · 窄屏" : ""}`;
      const kinds = L.statusHints.flatMap((ln) => ln.items.map((it) => it.kind));
      eq(kinds.join(","), c.want.join(","), `${tag}：该有的几条都在、先后对`);
      const boxes = L.statusHints.flatMap((ln) => ln.items.map((it) => { const w = real.widthPx(it.s, ln.size, L.sp, o.textScale ?? 1); return { x0: ln.x + it.dx, x1: ln.x + it.dx + w, y0: ln.y - ln.size * 0.8, y1: ln.y + ln.size * 0.2 }; }));
      const ink = inkOf(L, (t, size) => real.widthPx(t, size, L.sp, o.textScale ?? 1), (p) => p.t === "rect" && has(p, "page"), font), AP = allPrims(L);
      boxes.forEach((box, i) => {
        const hit = (b: { x0: number; x1: number; y0: number; y1: number }) => box.x0 < b.x1 - EPS && b.x0 < box.x1 - EPS && box.y0 < b.y1 - EPS && b.y0 < box.y1 - EPS;
        const bad = ink.filter(hit).map((k) => kindOf(AP[k.i]!));
        assert(!bad.length, `${tag} · 第 ${i + 1} 条：压到了 ${[...new Set(bad)].join(" ")}`);
        const t = L.title; assert(!hit({ x0: t.x, x1: t.x + t.w, y0: t.y, y1: t.y + t.h }), `${tag}：压到歌名那一条`);
        if (L.credits) assert(!hit({ x0: L.credits.x, x1: L.credits.x + L.credits.w, y0: L.credits.y, y1: L.credits.y + L.credits.h }), `${tag}：压到作者栏`);
        for (const pp of L.papers) if (pp.title.shown) assert(!hit({ x0: 0, x1: L.width, y0: pp.title.y, y1: pp.title.y + pp.title.h }), `${tag}：压到曲段名那一条（曲段控件）`);
        assert(box.x1 <= o.width + 1, `${tag}：出了右端`);
        boxes.forEach((b2, j) => { if (j > i) assert(!hit(b2), `${tag}：第 ${i + 1}、${j + 1} 条叠在一起`); });
      });
      for (const ln of L.statusHints) assert(ln.hit.y0 <= ln.y - ln.size * 0.8 + 1e-6 && ln.hit.y1 >= ln.y + ln.size * 0.2 - 1e-6, `${tag}：点击区比字还小`);
      }
    }
  });
});

describe("段尾的力度在行尾挤住了：挪到外面一道（统筹 2026-11-12 裁定：力度不占横向、不开口子）", () => {
  // 一个音的滚奏写「ppp < fff」放在一行的最后（7-N「变到」放的 fff 挂在这一段结尾、后面没有音）：前面 n 个八分音符把这一行挤到不同程度——
  //   不挤 / 只有结尾的 fff 放不下（挪到外面一道，发夹留在 ppp 那一道）/ 连发夹也放不下（发夹跟着 fff 一起到外面那道）/ 正好排满（以前 fff 被单独折到下一行）
  const roll = (n: number, notation: "staff" | "jianpu" | "letters", fff = true): Song => {
    const s = emptySong(), p = s.papers[0]!, pid = s.parts[0]!.id, head = p.tracks[pid]!.filter((t) => t.kind === "key" || t.kind === "time" || t.kind === "tempo");
    let id = 900; const note = (step: string, o: object = {}) => ({ kind: "note", id: id++, pitch: { step, alter: 0, octave: 5 }, dur: 840, lyric: null, ...o }) as Token;
    const toks: Token[] = [...head, ...Array.from({ length: n }, (_, k) => note("CDEFGAB"[k % 7]!))];
    toks.push({ kind: "dyn", id: 990, value: "ppp" } as Token, { kind: "hairpin", id: 991, dir: "cresc" } as Token, note("C", { art: ["roll"] }));
    if (fff) toks.push({ kind: "dyn", id: 992, value: "fff" } as Token);
    return { ...s, notation, papers: [{ ...p, tracks: { [pid]: toks } }] };
  };
  const SHAPES: [number, number][] = [[1, 600], [2, 600], [3, 600], [0, 220], [2, 220], [3, 220], [4, 220], [5, 220], [6, 220], [0, 420], [5, 420], [6, 420], [7, 420], [13, 600], [14, 600], [15, 600], [16, 600]];
  for (const notation of ["staff", "jianpu", "letters"] as const) it(`${notation}：ppp、发夹、fff 三样互相不叠、各自点得到、不出这一行右端；加不加结尾的 fff，音的位置和折行一点不变`, () => {
    let outer = 0;
    for (const [n, w] of SHAPES) for (const [mode, mk] of [["编辑", (s: Song) => ({ ...editorBase(s, ["P"]), width: w, measure: real })], ["印", (s: Song) => ({ ...printOpts(s, SP, views(s, ["P"], false), real, true), width: w })]] as const) {
      const s = roll(n, notation), o = mk(s) as EngraveOpts, L = engrave(s, o), tag = `${n} 个音 · 宽 ${w} · ${mode}`;
      const L0 = engrave(roll(n, notation, false), mk(roll(n, notation, false)) as EngraveOpts);
      assert(L.systems.length === L0.systems.length, `${tag}：结尾的 fff 多折出了一行（${L0.systems.length} → ${L.systems.length}）`);
      assert(JSON.stringify(L.notes.map((h) => [h.system, +h.x.toFixed(3)])) === JSON.stringify(L0.notes.map((h) => [h.system, +h.x.toFixed(3)])), `${tag}：加了结尾的 fff，音挪了位`);
      // 三样的墨：互相不叠、不出行右端
      const AP = allPrims(L), ink = inkOf(L, (t, size) => real.widthPx(t, size, L.sp, o.textScale ?? 1), (p) => p.t === "rect" && has(p, "page"), font);
      const mine = (p: Prim) => (p.t === "glyph" || p.t === "text" || p.t === "path") && (has(p, "dyn") || has(p, "jp-dyn") || has(p, "hairpin"));
      const marks = ink.filter((k) => mine(AP[k.i]!));
      assert(marks.length >= 3, `${tag}：三样没都画出来（${marks.length}）`);
      for (const k of marks) assert(k.x1 <= L.content.right + EPS, `${tag}：${kindOf(AP[k.i]!)} 出了这一行右端（${k.x1.toFixed(1)} > ${L.content.right.toFixed(1)}）`);
      for (let i = 0; i < marks.length; i++) for (let j = i + 1; j < marks.length; j++) {
        const a = marks[i]!, b = marks[j]!; if (a.i === b.i) continue;
        assert(!(a.x0 < b.x1 - EPS && b.x0 < a.x1 - EPS && a.y0 < b.y1 - EPS && b.y0 < a.y1 - EPS), `${tag}：${kindOf(AP[a.i]!)} 和 ${kindOf(AP[b.i]!)} 叠在一起`);
      }
      // 点得到：三样各有一块点击框，框的中心不落在另外两样的框里
      const hits = L.dyns.filter((d) => d.kind === "dyn" || d.kind === "hairpin"), by = (id: number) => hits.filter((d) => (s.papers[0]!.tracks[s.parts[0]!.id]![d.index] as { id: number }).id === id);
      for (const id of [990, 991, 992]) {
        const own = by(id); assert(own.length > 0, `${tag}：${id} 没有点击框`);
        assert(own.some((b) => { const cx = b.x + b.w / 2, cy = b.y + b.h / 2; return !hits.some((d) => !own.includes(d) && cx > d.x && cx < d.x + d.w && cy > d.y && cy < d.y + d.h); }), `${tag}：${id} 的点击框被别的盖住了`);
      }
      const yf = by(992)[0]!.y, yp = by(990)[0]!.y; if (yf < yp - 1) outer++;
      if (n <= 3 && w === 600) { const cy = (b: { y: number; h: number }) => b.y + b.h / 2; assert(Math.abs(cy(by(992)[0]!) - cy(by(990)[0]!)) < 0.8 * L.sp, `${tag}：不挤的时候 fff 不该挪到外面一道（和 ppp 同一道）`); }
    }
    assert(outer > 0, "比较器不是空的：至少有一种挤法把 fff 挪到了外面一道");
  });
});
