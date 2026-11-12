// 简谱数字行（谱面分家第四刀；src/render/jianpu/、src/render/notations.ts）。created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟）。
//   这一份守画法本身（数字 / 八度点 / 下划线 / 谱种表怎么分行 / 点击框 / 记号 / 弧线 / 连音 / 五线谱专有记号的小灰标）；全量（每个 token 都有图元）、点击只指 token 的守卫在第四刀收尾时加。
import { describe, it, eq, assert } from "./runner.mjs";
import { engrave, type Prim } from "../src/render/engrave.ts";
import { createTextMeasure, textStyleOf } from "../src/render/text/index.ts";
import { initState, TPQ, type Song, type Token } from "../src/score/song.ts";
import { setNotation, setPartChords, setMiddleC } from "../src/score/song-view.ts";
import { GEOMETRY, DRAWERS } from "../src/render/notations.ts";
import { SIGNS } from "../src/render/signs.ts";
import { harmonyTheory } from "../src/theory/index.ts";
import { rangeBase, fewestDotsBase } from "../src/score/degree.ts";
import { fullSong } from "./fixtures/layout/full-song.ts";
import { CHORD_CH_EM, GLYPH_INK } from "../src/render/jianpu/glyphs.ts";
import { parseTtf } from "../src/export/ttf.ts";
import { isPrinted } from "../src/export/score-pdf.ts";
// node 的内置模块照 pdf-wysiwyg.test.ts 的取法（类型检查不带 node 的类型）
const nodeMod = (m: string) => (globalThis as unknown as { process: { getBuiltinModule(m: string): any } }).process.getBuiltinModule(m);
const fs = nodeMod("node:fs"), zlib = nodeMod("node:zlib");
import { FULL_VIEWS } from "./fixtures/layout/full.ts";

const P = (step: "C" | "D" | "E" | "F" | "G" | "A" | "B", octave = 4, alter = 0) => ({ step, alter, octave });
/** 一条声部、给定的音（谱头照 initState）→ 简谱排一遍。 */
function lay(body: Omit<Token, "id">[], song?: (s: Song) => Song, part0?: object) {
  const st0 = initState(), part = st0.at.part, paper = st0.song.papers[0]!;
  let id = 1000; const toks = [...paper.tracks[part]!, ...body.map((t) => ({ ...t, id: id++ }) as Token)];
  let s: Song = { ...st0.song, papers: [{ ...paper, tracks: { ...paper.tracks, [part]: toks } }] };
  s = setNotation({ ...st0, song: s }, "jianpu").song; if (song) s = song(s);
  const L = engrave(s, { width: 900, sp: 10, locale: "zh", at: { paper: paper.id, part }, parts: [{ id: part, name: "V", first: true, ...part0 }], measure: createTextMeasure((x: string) => x.length * 8), autoBars: true });
  return { L, toks };
}
const digits = (ps: Prim[]) => ps.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-digit/.test(p.cls ?? "")).map((p) => p.s);
const n = (p: ReturnType<typeof P>, dur = TPQ, extra: object = {}) => ({ kind: "note", pitch: p, dur, lyric: null, ...extra }) as Omit<Token, "id">;

describe("简谱数字行", () => {
  it("每行开头的小节号让开行首的墨（统筹看样张 ⑪）：紧挨在右边的第一个数字、换气比它高 = 小节号的底在它们的顶上面", () => {
    const body = Array.from({ length: 160 }, (_, i) => n(P("C", 5), TPQ, i % 4 === 0 ? { art: ["breath"] } : {}));   // 每小节第一个音后面一个换气 V（比数字高，紧挨在小节号右边：笛子版第 26 小节那一处）
    const { L } = lay(body, undefined, { range: { lo: 60, hi: 84 } });
    const nums = L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && p.cls === "bar-no");
    assert(nums.length >= 2, "排出了好几行、有小节号");
    const inRow = (y: number, by: number, top: number) => y > by - 30 && y < top + 60;   // 这一行里、小节号下面那一截（不拿上一行的墨）
    /** 一个图元的墨：x 们、顶（字 = 基线往上 0.72 个字号；路径 = 所有点里最高的）。 */
    const inkOf = (p: Prim): { xs: number[]; top: number } | null => {
      const d = (p as { d?: string }).d;
      if (d) { const pts = [...d.matchAll(/[ML]([\d.-]+),([\d.-]+)/g)].map((m) => [+m[1]!, +m[2]!] as const); return pts.length ? { xs: pts.map((q) => q[0]), top: Math.min(...pts.map((q) => q[1])) } : null; }
      if ("x" in p && "y" in p) { const sz = (p as { size?: number }).size ?? 0; return { xs: [p.x as number], top: (p.y as number) - sz * 0.72 }; }
      return null;
    };
    for (const b of nums) {
      const sys = L.systems.findIndex((r) => r.staffTop > b.y && r.staffTop - b.y < 200), top = L.systems[sys]!.staffTop, x1 = b.x + b.s.length * 8 + 6;   // 量字 = 一个字 8 px；往右多看一点
      const ys = L.prims.filter((p) => /jp-dot|jp-digit|jp-chev|jp-acc/.test(p.cls ?? "")).map(inkOf).filter((k): k is { xs: number[]; top: number } => !!k && inRow(k.top, b.y, top) && k.xs.some((v) => v >= b.x - 1 && v <= x1)).map((k) => k.top);
      assert(ys.length > 0, `「${b.s}」右边紧挨着有墨（这条测试量得到东西）`);
      assert(b.y <= Math.min(...ys) + 0.5, `「${b.s}」的底（${b.y.toFixed(1)}）在行首的墨上面（${Math.min(...ys).toFixed(1)}）`);
    }
  });
  it("谱种是简谱：有音高、没有叠音的声部排成数字行（行框 kind = jianpu；每一行都写种类）；C 大调音阶 = 1–7、高八度的 1 带一个点", () => {
    const { L } = lay(["C", "D", "E", "F", "G", "A", "B"].map((s) => n(P(s as "C"))).concat([n(P("C", 5))]));
    assert(L.systems.length > 0 && L.systems.every((r) => r.kind === "jianpu"), "都是数字行");
    eq(digits(L.prims).join(""), "12345671");
    assert(L.prims.filter((p) => p.t === "path" && /jp-dot/.test(p.cls ?? "")).length === 1, "高八度的 1 上一个点（八度基准 = 点最少：七个音在 0 组）");
  });
  it("和弦竖叠（第五刀 5-4，UX 稿第 7 节）：数字行、从低到高往上叠、同一个 x；只压高不缩宽（和弦那一列和单音一样宽）；每个音自己的升降号和点击框", () => {
    const { L, toks } = lay([n(P("C")), n(P("G"), TPQ, { chord: [P("E"), P("C", 4, 1)] }), n(P("C")), n(P("C"))]);
    assert(L.systems.length > 0 && L.systems.every((r) => r.kind === "jianpu"), "有叠音也是数字行");
    const ds = L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-digit/.test(p.cls ?? ""));
    const ch = ds.slice(1, 4), [lo, mid, hi] = ch;
    eq(ch.map((d) => d.s).join(""), "135", "和弦从低到高画（♯1 3 5）");
    assert(ch.every((d) => Math.abs(d.x - ch[0]!.x) < 1e-6), "叠着的数字同一个 x");
    assert(lo!.y > mid!.y && mid!.y > hi!.y, "往上一个叠一个（y 越来越小）");
    assert(Math.abs(lo!.y - ds[0]!.y) < 1e-6, "最低的那个在行的基线上（和前一个单音同一条基线）");
    const one = lay([n(P("C")), n(P("C", 4, 1)), n(P("C")), n(P("C"))]).L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-digit/.test(p.cls ?? "")).map((p) => p.x.toFixed(3));
    eq([ds[0]!, lo!, ds[4]!, ds[5]!].map((p) => p.x.toFixed(3)).join(" "), one.join(" "), "和弦那一列和同样带 ♯ 的单音一样宽（只压高、不缩宽也不加宽）");
    const acc = L.prims.find((p): p is Extract<Prim, { t: "glyph" }> => p.t === "glyph" && /jp-acc/.test(p.cls ?? "") && p.ch === "\u{E262}");   // 7-P：Bravura 的 ♯
    assert(!!acc && acc.y > mid!.y && acc.y < lo!.y + 1e-6, "♯ 挂在它自己那个数字（最低的 1）旁边");
    const iCh = toks.findIndex((t) => t.kind === "note" && !!t.chord?.length);
    eq(L.chordHeads.filter((h) => h.index === iCh).length, 2, "叠着的另外两个音各一块点击框（指着同一个音）");
    assert(L.notes.some((h) => h.index === iCh && Math.abs(h.y - (hi!.y - 9)) < 12), "旋律线（最上面那个）的点击框在最上面那个数字那儿");
  });
  it("琶音（第五刀 5-4，UX 稿第 7 节）：和弦左边一条竖的波浪线；左边挂的东西让位——前面有空就不挪；挤了 = 这一小节一起放宽（一样长的音照样等距，⑦ 一小节里等距）", () => {
    const xs = (body: Omit<Token, "id">[], song?: (s: Song) => Song) => { const { L } = lay(body, song); return { L, x: L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-digit/.test(p.cls ?? "")).map((p) => p.x) }; };
    const chord = (arp: boolean) => n(P("G"), TPQ, { chord: [P("C")], ...(arp ? { art: ["arpeggio"] } : {}) });
    //   前面空够 = 同一小节里前面一个全音符（8/4 拍：中间没有小节线——小节线后面的第一个音本来就贴着小节线，左边挂的东西一律往右顶）
    const eight = (s: Song): Song => ({ ...s, papers: s.papers.map((pp) => ({ ...pp, tracks: Object.fromEntries(Object.entries(pp.tracks).map(([k, ts]) => [k, ts.map((t) => (t.kind === "time" ? { ...t, beats: 8 } : t))])) })) });
    const loose0 = xs([n(P("C"), TPQ * 4), chord(false), n(P("C"))], eight), loose1 = xs([n(P("C"), TPQ * 4), chord(true), n(P("C"))], eight);
    const arp = loose1.L.prims.find((p): p is Extract<Prim, { t: "path" }> => p.t === "path" && /arpeggio/.test(p.cls ?? ""));
    assert(!!arp, "画了琶音");
    const ax = Number(/^M([\d.]+)/.exec(arp!.d)![1]);
    assert(ax < loose1.x[1]! - 5, `波浪线在和弦左边（${ax} < ${loose1.x[1]}）`);
    eq(loose1.x.map((v) => v.toFixed(3)).join(" "), loose0.x.map((v) => v.toFixed(3)).join(" "), "前面空够：加了琶音谁都不挪");
    const s16 = TPQ / 4, tight = (arpOn: boolean) => xs([n(P("C"), s16), n(P("D"), s16), n(P("E"), s16), n(P("F"), s16), chord(arpOn), n(P("C"))]);
    const t0 = tight(false), t1 = tight(true);
    const g = t1.x.slice(1, 5).map((v, i) => v - t1.x[i]!);
    assert(Math.max(...g) - Math.min(...g) < 1e-6, `挤了：这一小节一起放宽，和弦前面一样长的十六分照样等距（${g.map((v) => v.toFixed(2)).join(" ")}）`);
    assert(t1.x[4]! > t0.x[4]! + 1, `挤了：和弦往右让出琶音的地方（${t0.x[4]} → ${t1.x[4]}）`);
  });
  it("鼓 = X 行（第五刀 5-4，UX 稿第 7 节；5-6 整套鼓按件换字）：另一种行；整套鼓每一下按五线鼓谱的符头种类换字（● × ⊗…）、同时敲的几件按五线鼓谱上的高低叠、幽灵音小一号；只有一件鼓 = X；节奏的写法同数字行；调号不印、编辑器里淡的「1=D」提示带着它", () => {
    const kit = { perc: { kind: "kit" } };
    const { L, toks } = lay([n(P("C", 2)), n(P("D", 2), TPQ, { art: ["ghost"] }), n(P("F", 4, 1), TPQ / 2, { chord: [P("C", 2)] }), n(P("C", 2), TPQ / 2), n(P("C", 2), TPQ)], undefined, kit);
    assert(L.systems.length > 0 && L.systems.every((r) => r.kind === "jianpuX"), "鼓的那一行 = X 行");
    const xs = L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-x/.test(p.cls ?? ""));
    eq(xs.map((p) => p.s).join(""), "●●●●●●", "整套鼓：底鼓 / 军鼓 / 低音天巴 = 普通符头 = ●（五线鼓谱同一张表）；同时敲的两件 = 两个");
    assert(xs[1]!.size! < xs[0]!.size!, "幽灵音 = 小一号");
    // 按件换字 + 按五线鼓谱上的高低叠：踩镲（×，最上面）+ 军鼓（●）+ 底鼓（●，最下面）同时敲；开的踩镲 = ⊗；吊镲（×）
    const M = (m: number) => P((["C", "C", "D", "D", "E", "F", "F", "G", "G", "A", "A", "B"] as const)[m % 12]!, Math.floor(m / 12) - 1, [1, 3, 6, 8, 10].includes(m % 12) ? 1 : 0);
    const kitL = lay([n(M(42), TPQ, { chord: [M(38), M(36)] }), n(M(46)), n(M(49))], undefined, kit).L;
    const ks = kitL.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-kit/.test(p.cls ?? ""));
    eq(ks.slice(0, 3).sort((a, b) => b.y - a.y).map((p) => p.s).join(""), "●●×", "从下往上：底鼓、军鼓、踩镲（五线鼓谱上的高低）");
    eq(ks.slice(3).map((p) => p.s).join(""), "⊗×", "开的踩镲 = ⊗、吊镲 = ×");
    const oneL = lay([n(M(38)), n(M(38))], undefined, { perc: { kind: "one", key: 38, info: { staff: 1, line: 0, head: "normal", stem: "up" } } }).L;
    eq(oneL.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-x/.test(p.cls ?? "")).map((p) => p.s).join(""), "XX", "只有一件鼓的行照旧一律 X");
    // 图例（5-6，统筹裁定 (c)）：整套鼓这张纸上第一次有敲击的那一行，行首名字下面一行一种字（名字宿主按界面语言给）；从上往下 = 五线鼓谱上的高低；只印一次；印出来（PDF 也有）
    const names = { 36: "大鼓", 38: "小鼓", 42: "脚踏钹（闭镲）", 46: "脚踏钹（开镲）", 49: "碎音钹" };
    const many = Array.from({ length: 120 }, (_, i) => (i % 2 ? n(M(42), TPQ, { chord: [M(38), M(36)] }) : n(M(46))));
    const lgL = lay(many, undefined, { ...kit, kitNames: names }).L, legend = lgL.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-legend/.test(p.cls ?? ""));
    assert(lgL.systems.length >= 2, "排了好几行");
    eq(legend.map((p) => p.s).join(" | "), "⊗ 脚踏钹（开镲） | × 脚踏钹（闭镲） | ● 小鼓 / 大鼓", "一行一种字，按五线鼓谱上的高低从上往下（踩镲在上、鼓在下；一样高 = 先出现的在前），同一种字的几件写在一起、也是上面的先写");
    assert(legend.every((p, k) => k === 0 || p.y > legend[k - 1]!.y) && legend.every((p) => isPrinted(p.cls)), "从上往下排、印出来");
    const name = lgL.prims.find((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /part-name/.test(p.cls ?? ""))!;
    assert(legend[0]!.y > name.y && legend.every((p) => Math.abs(p.x - name.x) < 1e-6), "在行首名字下面、和名字左对齐");
    assert(legend.every((p) => p.y < lgL.systems[1]!.staffTop), "只印在第一行（不重复印）");
    eq(lay(many, undefined, kit).L.prims.filter((p) => /jp-legend/.test(p.cls ?? "")).length, 0, "没给名字 = 不印图例");
    // 名字比名字那一栏还宽：折行（中文按字、英文按词），不伸进谱里
    const longL = lay(many, undefined, { ...kit, kitNames: { ...names, 42: "脚踏钹（闭镲）脚踏钹（闭镲）脚踏钹", 38: "Acoustic Snare Drum Very Long Name" } }).L;
    const lg2 = longL.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-legend/.test(p.cls ?? "")), x0 = Math.min(...longL.notes.filter((h) => h.system === 0).map((h) => h.x));   // 图例那一行（第一行）最左那一下的左缘
    assert(lg2.length > 3, "长名字折成了好几行");
    const perCh = (8 * textStyleOf("jp-legend").em) / textStyleOf("lyric").em;   // 这个测试的尺子：一个字按歌词字号量 8 px，换算到图例的字号
    for (const p of lg2) assert(p.x + p.s.trimEnd().length * perCh < x0, `「${p.s}」没伸进谱里（${p.x.toFixed(1)} + ${p.s.trimEnd().length} × ${perCh.toFixed(2)} vs ${x0.toFixed(1)}）`);
    assert(lg2.every((p) => !/[（(]$/.test(p.s) && !/^\u3000?[）)，、]/.test(p.s)), "开括号不在行尾、闭括号和标点不在行首");
    assert(lg2.some((p) => p.s.includes("大鼓")), "放得下的一件不拆开（整件折到下一行）");
    eq(lg2.map((p) => p.s.replace(/^\u3000/, "")).join(" ").replace(/\s+/g, " ").includes("Acoustic Snare Drum Very Long Name"), true, "英文按词折（词没被拆开）");
    assert(!L.prims.some((p) => (p.t === "text" || p.t === "glyph") && /jp-acc/.test(p.cls ?? "")) && !L.prims.some((p) => p.t === "path" && /jp-dot/.test(p.cls ?? "")), "没有升降号、没有八度点");
    eq(L.prims.filter((p) => p.t === "line" && /jp-ul/.test(p.cls ?? "")).length, 1, "两个八分连一条下划线（节奏写法同数字行）");
    assert(!L.prims.some((p) => p.t === "text" && /jp-head/.test(p.cls ?? "") && (p as { s: string }).s.startsWith("1=")), "谱头不印「1=」");
    const iKey = toks.findIndex((t) => t.kind === "key");
    assert(L.keyHints.some((h) => h.index === iKey && h.tok === toks[iKey]!.id && h.s === "无调"), "编辑器里淡的提示带着调号 token、写「无调」（打击乐的行没有调，7-R）");
    eq(GEOMETRY.jianpuX.pitchAxis, undefined, "X 行没有「纵向 = 音高」");
    // 简谱跟五线谱的分法一一对上（统筹 5-6 更正 5-4 ⑨）：鼓（五线谱画成鼓谱 / 一线谱）= X 行；台上固定敲一个键的（五线谱画在五线上、× 符头）= 数字行，每个数字 + ×（同气声），音高看得见
    const fixed = lay([n(P("E")), n(P("G"))], undefined, { xHead: true }).L;
    assert(fixed.systems.every((r) => r.kind === "jianpu") && !fixed.prims.some((p) => p.t === "text" && /jp-x/.test(p.cls ?? "")), "固定敲一个键的声部 = 数字行（不是 X 行）");
    const fd = fixed.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-digit/.test(p.cls ?? "")), fx = fixed.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /xhead/.test(p.cls ?? ""));
    eq(fd.map((p) => p.s).join(""), "35", "数字照写的音（音高看得见）"); eq(fx.map((p) => p.s).join(""), "××", "每个数字旁边一个 ×");
    const fixedKey = fixed.prims.some((p) => p.t === "text" && /jp-head/.test(p.cls ?? "") && (p as { s: string }).s.startsWith("1="));
    assert(fixedKey && !fixed.keyHints.length, "数字行照常印调号「1=」（不是鼓那种只给提示）");
    const v = FULL_VIEWS.find((x) => x.name === "edit-all")!, J = { ...fullSong(), notation: "jianpu" } as Song;
    eq(engrave(J, v.opts(J)).systems.filter((r) => r.kind === "staff").length, 0, "用全的测试歌切成简谱：一行五线谱都没有了（过渡退场）");
  });
  it("和弦级数在数字行上也标（第五刀 5-4 ④）：歌的总开关开着 = 和弦右下一个级数，点得到（指着那个音）；鼓的 X 行不标", () => {
    const { L, toks } = lay([n(P("G"), TPQ, { chord: [P("E"), P("C")] }), n(P("C")), n(P("D")), n(P("E"))]);
    const iCh = toks.findIndex((t) => t.kind === "note" && !!t.chord?.length);
    const tag = L.chordTags.find((h) => h.index === iCh), txt = L.prims.find((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /chord-tag/.test(p.cls ?? ""));
    assert(!!tag && !!txt && txt.s.length > 0, "和弦有级数（字 + 点击框）");
    const lo = L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-digit/.test(p.cls ?? ""))[0]!;
    assert(txt!.y > lo.y && txt!.x > lo.x, `级数在和弦的右下（${txt!.x},${txt!.y} vs 数字 ${lo.x},${lo.y}）`);
    const off = lay([n(P("G"), TPQ, { chord: [P("E"), P("C")] })], (s) => ({ ...s, chordTags: false }));
    eq(off.L.chordTags.length, 0, "总开关关了 = 不标");
    eq(lay([n(P("G", 2), TPQ, { chord: [P("C", 2)] })], undefined, { perc: { kind: "kit" } }).L.chordTags.length, 0, "鼓的 X 行不标");
  });
  it("合租一家合起来认和弦（第五刀 5-4；统筹裁定第 5–8 条，user 11-11 纪要第 70 节）：同一首歌，五线谱（一家展开着）和简谱，一家每一刻的读法相同；只标一次、标在最下面那一行", () => {
    const v = FULL_VIEWS.find((x) => x.name === "edit-all")!, S = fullSong(), J = { ...fullSong(), notation: "jianpu" } as Song;
    const at = { paper: "pa", part: "X" };   // 光标在这一家里 = 五线谱里这一家展开着
    const Ls = engrave(S, { ...v.opts(S), at }), Lj = engrave(J, { ...v.opts(J), at });
    const fam = (L: typeof Ls) => L.chordTags.filter((t) => { const r = L.systems[t.system]!; return r.paper === "pa" && (r.part === "X" || r.part === "Y"); });
    const key = (L: typeof Ls) => fam(L).map((t) => `${t.part ?? L.systems[t.system]!.part}#${t.index}:${harmonyTheory().label(t.read)}@${L.systems[t.system]!.part}`).sort().join(" ");
    assert(fam(Ls).length > 0, "五线谱这一家展开着有级数（比较器不是空的）");
    eq(key(Lj), key(Ls), "两种谱一家每一刻的读法、挂在谁身上、画在哪一行都一样");
    assert(fam(Ls).every((t) => Ls.systems[t.system]!.part === "Y"), "都画在这一家最下面那一位（Y）那一行；X 自己不标");
  });
  it("叠着的和弦折叠成和弦名（第五刀 5-4，UX 稿第 7 节）：这条轨选了「折叠」= 还原得回的写成和弦名、按名字的宽占位；有歧义 = 右下角小三角（编辑器里，点它 = 候选）；还原不回 = 照写数字", () => {
    const e = TPQ / 2, body = [n(P("G"), e, { chord: [P("E"), P("C")] }), n(P("A"), e, { chord: [P("G"), P("E"), P("C")] }), n(P("E", 5), e, { chord: [P("G"), P("C")] }), n(P("C"), e)];   // 八分：间距由宽决定（四分的弹簧够长，名字放得下就不挪）
    const foldOn = (s: Song): Song => setPartChords({ ...initState(), song: s }, initState().at.part, "fold").song;
    const on = lay(body, foldOn), off = lay(body);
    const names = (L: typeof on.L) => L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-chord/.test(p.cls ?? "")).map((p) => p.s);
    eq(names(on.L).join(" "), "C C6", "C E G = C；C E G A = C6（默认：根音是最低音的）");
    eq(names(off.L).length, 0, "没选「折叠」= 不折");
    eq(digits(on.L.prims).filter((d) => d !== "1").length + digits(on.L.prims).filter((d) => d === "1").length, 4, "开放排法那个和弦（C G E）还原不回 = 照写三个数字 + 最后一个单音 1");
    const amb = on.L.prims.filter((p) => p.t === "path" && /jp-chord-amb/.test(p.cls ?? ""));
    eq(amb.length, 1, "C6 有歧义（Am7/C 也还原得回）= 一个小三角"); assert(/(^|\s)ann(\s|$)/.test(amb[0]!.cls ?? ""), "小三角只在编辑器里（不印）");
    const iC6 = on.toks.findIndex((t) => t.kind === "note" && (t.chord?.length ?? 0) === 3);
    assert(on.L.chordTags.some((h) => h.index === iC6 && h.w < 20), "小三角有点击框（指着那个音，开候选）");
    const xs = (L: typeof on.L) => L.notes.map((h) => h.x);
    assert(xs(on.L)[2]! - xs(on.L)[1]! > xs(off.L)[2]! - xs(off.L)[1]! + 1e-6, `和弦名按名字的宽占位（C6 比一个数字宽 = 后面的音往右）：${xs(on.L)[2]! - xs(on.L)[1]!} vs ${xs(off.L)[2]! - xs(off.L)[1]!}`);
    const arp = lay([n(P("G"), TPQ, { chord: [P("E"), P("C")], art: ["arpeggio"] })], foldOn).L;
    assert(arp.prims.some((p) => p.t === "text" && /jp-chord/.test(p.cls ?? "")) && arp.prims.some((p) => p.t === "path" && /arpeggio/.test(p.cls ?? "")), "折成名字的和弦上的琶音照画（不静默丢掉）");
    // 名字的宽表里 ♭ ♯ = PDF 那款字（思源黑体）的前进宽（统筹看样张 ⑨：照实际的字形量一次进表，不现场量）
    const font = parseTtf(new Uint8Array(zlib.gunzipSync(fs.readFileSync(new URL("../vendor/fonts/sans.ttf.gz", import.meta.url)))));
    for (const ch of ["♭", "♯"]) eq(CHORD_CH_EM[ch], font.advance(font.glyphId(ch.codePointAt(0)!)) / font.unitsPerEm, `和弦名宽表里的 ${ch} = 字体里的前进宽`);
  });
  it("八度基准按乐器音域（第五刀 5-4，UX 稿第 3 节）：宿主给了音域 = 按音域；没给 = 写的音「点最少」；按音域要三个点以上 = 极端，退回点最少；基准写成「1=C₄」的八度数字（7-Q，取代字母上下的点）", () => {
    eq(rangeBase(57, 76, 0), 0, "人声 A3–E5 在 C 调 = 0");
    eq(rangeBase(28, 55, 0), -2, "低音 E1–G3 = 低两组");
    const low = [n(P("G", 2)), n(P("A", 2)), n(P("B", 2)), n(P("C", 3))];
    const keyOct = (L: ReturnType<typeof lay>["L"]) => L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-key-oct/.test(p.cls ?? "")).map((p) => p.s).join(",");
    const voice = lay(low, undefined, { range: { lo: 57, hi: 76 } }).L, plain = lay(low).L;
    eq(voice.systems[0]!.octBase, 0, "人声的音域 = 基准 0（这几个低音各两个点）"); eq(keyOct(voice), "4", "基准 0 = 「1=C₄」（不带点的 1 = 中央 C）");
    eq(plain.systems[0]!.octBase, -2, "没给音域 = 点最少（低两组）"); eq(keyOct(plain), "2", "低两组 = 「1=C₂」");
    assert(!voice.prims.some((p) => p.t === "path" && /jp-key-dot/.test(p.cls ?? "")), "「1=」上下不再画点（7-Q）");
    eq(lay([n(P("C", 1)), n(P("C"))], undefined, { range: { lo: 57, hi: 76 } }).L.systems[0]!.octBase, fewestDotsBase([-3, 0]), "按音域要三个点（C1）= 极端，退回点最少");
  });
  it("7-Q：「1=」后面 = 字母 + 右下角八度数字（不带点的 1 是哪个音）；跟着这首歌中央 C 叫 C 几；升降号在字母前面（Bravura）；中途换调同样写", async () => {
    const { keyParts } = await import("../src/render/jianpu/keytext.ts");
    const k = (f: number, minor: boolean, base: number, mc = 4) => { const p = keyParts(f, minor, base, mc); return `${p.pre}${p.acc}${p.letter}${p.oct}`; };
    eq(k(0, false, 0), "1=C4", "C 调、基准 0 = 1=C₄"); eq(k(1, false, 0), "1=G4", "G 调 = 1=G₄"); eq(k(-2, false, -1), "1=♭B3", "♭B 调、低一组 = 1=♭B₃（升降号在字母前面）");
    eq(k(0, false, 0, 3), "1=C3", "中央 C 叫 C3 的歌 = 1=C₃"); eq(k(0, false, 0, 5), "1=C5", "叫 C5 = 1=C₅");
    eq(k(0, true, 0), "6=A4", "小调写 6=：不带点的 6 = 这一组里的 la");
    const L = lay([n(P("C")), n(P("D"))], (s) => ({ ...s, papers: s.papers.map((pp) => ({ ...pp, tracks: Object.fromEntries(Object.entries(pp.tracks).map(([id, ts]) => [id, ts.map((t) => (t.kind === "key" ? { ...t, fifths: -2 } : t))])) })) })).L;
    assert(L.prims.some((p) => p.t === "glyph" && /jp-key-acc/.test(p.cls ?? "") && p.ch === "\u{E260}"), "谱头的 ♭ 是 Bravura 的字形");
    assert(L.prims.some((p) => p.t === "text" && /jp-key-oct/.test(p.cls ?? "")), "谱头写了八度数字");
  });
  it("一小节里等距（第五刀 5-4 ⑦；UX 稿第 8 节验收）：扬琴的和弦折成名字 + 琶音让位之后，同一页上手鼓那一声部同一小节里相邻八分的间距相等（几种行宽都是）", () => {
    const st0 = initState(), paper = st0.song.papers[0]!, p0 = st0.song.parts[0]!, head = paper.tracks[p0.id]!.slice(0, 3);
    let id = 3000; const ids = (ts: Omit<Token, "id">[]) => ts.map((t) => ({ ...t, id: id++ }) as Token);
    const bar = [n(P("A"), TPQ, { chord: [P("E"), P("C")], art: ["arpeggio"] }), n(P("G"), TPQ, { chord: [P("E"), P("C")] }), n(P("B"), TPQ, { chord: [P("G"), P("D"), P("G", 3)], art: ["arpeggio"] }), n(P("F"), TPQ, { chord: [P("D"), P("A", 3)] })];
    const song0: Song = { ...st0.song, parts: [p0, { ...p0, id: "BG", role: "rBG", mic: "mBG" }], papers: [{ ...paper, tracks: { [p0.id]: [...head, ...ids([...bar, ...bar, ...bar, ...bar])], BG: [...head, ...ids(Array.from({ length: 32 }, () => n(P("C", 2), TPQ / 2)))] } }] };
    const song = setPartChords({ ...st0, song: setNotation({ ...st0, song: song0 }, "jianpu").song }, p0.id, "fold").song;
    let bars = 0;
    for (const width of [900, 600, 450]) {
      const L = engrave(song, { width, sp: 10, locale: "zh", at: { paper: paper.id, part: p0.id }, parts: [{ id: p0.id, name: "Yq", first: true }, { id: "BG", name: "Bongo", perc: { kind: "kit" } }], measure: createTextMeasure((x: string) => x.length * 8), autoBars: true });
      assert(L.prims.some((p) => p.t === "text" && /jp-chord/.test(p.cls ?? "")) && L.prims.some((p) => p.t === "path" && /arpeggio/.test(p.cls ?? "")), "扬琴折成了名字、有琶音（比较器不是空的）");
      const bg = new Set(L.systems.map((r, i) => (r.part === "BG" ? i : -1)).filter((i) => i >= 0)), hits = L.notes.filter((h) => bg.has(h.system)).sort((a, b) => a.system - b.system || a.x - b.x);
      for (let b = 0; b * 8 < hits.length; b++) {
        const hb = hits.slice(b * 8, b * 8 + 8); if (hb.length < 8 || hb.some((h) => h.system !== hb[0]!.system)) continue;
        const gaps = hb.slice(1).map((h, i) => h.x - hb[i]!.x); bars++;
        assert(Math.max(...gaps) - Math.min(...gaps) < 1e-6, `行宽 ${width} 第 ${b + 1} 小节：手鼓八分等距（${gaps.map((v) => v.toFixed(2)).join(" ")}）`);
      }
    }
    assert(bars >= 10, `量到了足够多的小节（${bars}）`);
  });
  it("下划线按拍连：两个八分在同一拍 = 一条；跨拍 = 断开；十六分 = 两层", () => {
    const e = TPQ / 2, s16 = TPQ / 4;
    const ul = (body: Omit<Token, "id">[]) => lay(body).L.prims.filter((p) => p.t === "line" && /jp-ul/.test(p.cls ?? "")).length;
    eq(ul([n(P("C"), e), n(P("D"), e)]), 1, "一拍里的两个八分 = 一条");
    eq(ul([n(P("C"), TPQ), n(P("D"), e), n(P("E"), e), n(P("F"), e), n(P("G"), e)]), 2, "两拍各一条");
    eq(ul([n(P("C"), s16), n(P("D"), s16), n(P("E"), e)]), 2, "十六分十六分八分 = 第一层一条 + 第二层一条");
  });
  it("点击框：每个音、休止各一个（音的 d = NaN：数字行没有「纵向 = 音高」，不提供竖着拖）；长音 = 数字 + 横线、几拍的休止一拍一个 0", () => {
    const { L, toks } = lay([n(P("C"), TPQ * 2), { kind: "rest", dur: TPQ * 2 } as Omit<Token, "id">]);
    const iC = toks.findIndex((t) => t.kind === "note"), iR = toks.findIndex((t) => t.kind === "rest");
    assert(L.notes.some((h) => h.index === iC && Number.isNaN(h.d)), "音的点击框");
    assert(L.rests.some((h) => h.index === iR), "休止的点击框");
    eq(digits(L.prims).join(""), "100", "二分音符 1 –、二分休止 0 0");
    assert(L.prims.some((p) => p.t === "line" && /jp-dash/.test(p.cls ?? "")), "长音后面的横线");
  });
  it("长音跨小节线一律重写数字加连线、不是整拍的也不画横线（统筹看第四刀成品样张后定的第 1 处 + 5-6）：3/4 里四拍半的音 = 第一小节「1 – –」，第二小节重写「1·」、连线连上；横线只在一小节之内、只表示整拍", () => {
    const st0 = initState(), part = st0.at.part, paper = st0.song.papers[0]!;
    const head = paper.tracks[part]!.map((t) => (t.kind === "time" ? { ...t, beats: 3, beatType: 4 } : t));
    let s: Song = { ...st0.song, papers: [{ ...paper, tracks: { ...paper.tracks, [part]: [...head, { ...n(P("C"), TPQ * 4.5), id: 1000 } as Token, { ...n(P("D"), TPQ * 1.5), id: 1001 } as Token] } }] };
    s = setNotation({ ...st0, song: s }, "jianpu").song;
    const L = engrave(s, { width: 900, sp: 10, locale: "zh", at: { paper: paper.id, part }, parts: [{ id: part, name: "V", first: true }], measure: createTextMeasure((x: string) => x.length * 8), autoBars: true });
    eq(digits(L.prims).join(""), "112", "C 写两次（第二小节重写），D 一次");
    eq(L.prims.filter((p) => p.t === "line" && /jp-dash/.test(p.cls ?? "") && p.tok === 1000).length, 2, "C 的横线只有第一小节那两根（一拍一根）");
    eq(L.prims.filter((p) => p.t === "path" && /jp-tie/.test(p.cls ?? "")).length, 1, "重写的「1」用连线连到前一小节的「1」");
    assert(L.prims.filter((p) => p.t === "path" && /jp-dot/.test(p.cls ?? "") && p.tok === 1000).length >= 1, "第二小节那一拍半 = 带附点");
    assert(L.notes.filter((h) => h.index === paper.tracks[part]!.length).length === 1, "点击框只有一个、指回这个音");
    // 整拍跨过小节线也一样（统筹 5-6）：4/4 里五拍的音 = 第一小节「1 – – –」，第二小节重写「1」、连线连上；横线只在一小节之内
    const head4 = paper.tracks[part]!;
    let s4: Song = { ...st0.song, papers: [{ ...paper, tracks: { ...paper.tracks, [part]: [...head4, { ...n(P("C"), TPQ * 5), id: 1000 } as Token, { ...n(P("D"), TPQ * 3), id: 1001 } as Token] } }] };
    s4 = setNotation({ ...st0, song: s4 }, "jianpu").song;
    const L4 = engrave(s4, { width: 900, sp: 10, locale: "zh", at: { paper: paper.id, part }, parts: [{ id: part, name: "V", first: true }], measure: createTextMeasure((x: string) => x.length * 8), autoBars: true });
    eq(digits(L4.prims).join(""), "112", "五拍的 C：第二小节开头重写（不是横线）");
    eq(L4.prims.filter((p) => p.t === "line" && /jp-dash/.test(p.cls ?? "") && p.tok === 1000).length, 3, "C 的横线只有第一小节那三根");
    eq(L4.prims.filter((p) => p.t === "path" && /jp-tie/.test(p.cls ?? "")).length, 1, "重写的「1」连线连到前一小节");
  });
  it("长音的横线一拍一条、占一拍的宽（统筹看 5-6 样张：照样张，「3 – –」和「1 2 3」一样宽）；带换气也不挤横线", () => {
    const st0 = initState(), part = st0.at.part, paper = st0.song.papers[0]!;
    const head = paper.tracks[part]!.map((t) => (t.kind === "time" ? { ...t, beats: 3, beatType: 4 } : t));
    let id = 2000; const nn = (p: ReturnType<typeof P>, dur: number, extra: object = {}) => ({ kind: "note", id: id++, pitch: p, dur, lyric: null, ...extra }) as Token;
    const body: Token[] = []; for (let k = 0; k < 4; k++) body.push(nn(P("E"), TPQ * 3, k % 2 ? { art: ["breath"] } : {}), nn(P("C"), TPQ), nn(P("D"), TPQ), nn(P("E"), TPQ));
    let s: Song = { ...st0.song, papers: [{ ...paper, tracks: { ...paper.tracks, [part]: [...head, ...body] } }] };
    s = setNotation({ ...st0, song: s }, "jianpu").song;
    const L = engrave(s, { width: 900, sp: 10, locale: "zh", at: { paper: paper.id, part }, parts: [{ id: part, name: "V", first: true }], measure: createTextMeasure((x: string) => x.length * 8), autoBars: true });
    for (let k = 0; k < 4; k++) {
      const long = body[k * 4]!.id, q = [body[k * 4 + 1]!.id, body[k * 4 + 2]!.id, body[k * 4 + 3]!.id];
      const lx = [...L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-digit/.test(p.cls ?? "") && p.tok === long).map((p) => p.x), ...L.prims.filter((p): p is Extract<Prim, { t: "line" }> => p.t === "line" && /jp-dash/.test(p.cls ?? "") && p.tok === long).map((p) => (p.x1 + p.x2) / 2)].sort((a, b) => a - b);
      const qx = q.map((i) => L.prims.find((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-digit/.test(p.cls ?? "") && p.tok === i)!.x);
      const lStep = (lx[2]! - lx[0]!) / 2, qStep = (qx[2]! - qx[0]!) / 2;
      assert(lx.length === 3 && Math.abs(lStep / qStep - 1) < 0.1, `第 ${k + 1} 组：「3 – –」一拍 ${lStep.toFixed(1)} ≈「1 2 3」一拍 ${qStep.toFixed(1)}${k % 2 ? "（带换气）" : ""}`);
    }
  });
  it("复合拍子（6/8、9/8、12/8）的整小节休止 = 一拍（附点四分）一个「0·」（统筹看 5-6 样张后定的、user「0· 0· 可以，确实是数两下」）；3/4、4/4 照旧一拍一个 0", () => {
    const st0 = initState(), part = st0.at.part, paper = st0.song.papers[0]!;
    const zeros = (beats: number, beatType: number) => {
      const head = paper.tracks[part]!.map((t) => (t.kind === "time" ? { ...t, beats, beatType } : t)), bar = (TPQ * 4 * beats) / beatType;
      let id = 3000; const body = [{ kind: "rest", id: id++, dur: bar } as Token, { kind: "note", id: id++, pitch: P("C"), dur: bar, lyric: null } as Token];
      let s: Song = { ...st0.song, papers: [{ ...paper, tracks: { ...paper.tracks, [part]: [...head, ...body] } }] };
      s = setNotation({ ...st0, song: s }, "jianpu").song;
      const L = engrave(s, { width: 900, sp: 10, locale: "zh", at: { paper: paper.id, part }, parts: [{ id: part, name: "V", first: true }], measure: createTextMeasure((x: string) => x.length * 8), autoBars: true });
      const rid = body[0]!.id, zs = L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && p.s === "0" && p.tok === rid), dots = L.prims.filter((p) => p.t === "path" && /jp-dot/.test(p.cls ?? "") && p.tok === rid);
      const dx = dots.map((d) => +/M([\d.-]+)/.exec((d as { d: string }).d)![1]!).sort((a, b) => a - b), zx = zs.map((z) => z.x).sort((a, b) => a - b);
      return { zeros: zs.length, dots: dots.length, dotRight: dx.every((x, i) => x > zx[i]! && (i + 1 >= zx.length || x < zx[i + 1]!)) };   // 每个点紧跟在自己那个 0 后面（不在下一个 0 后面）
    };
    eq(JSON.stringify(zeros(6, 8)), JSON.stringify({ zeros: 2, dots: 2, dotRight: true }), "6/8：两个「0·」（原来三个 0，看着像三拍子）");
    eq(zeros(9, 8).zeros, 3, "9/8：三个「0·」"); eq(zeros(9, 8).dots, 3);
    eq(zeros(12, 8).zeros, 4, "12/8：四个「0·」");
    eq(JSON.stringify(zeros(3, 4)), JSON.stringify({ zeros: 3, dots: 0, dotRight: true }), "3/4 照旧三个 0、没有点");
    eq(zeros(4, 4).zeros, 4, "4/4 照旧四个 0");
  });
  it("字母谱（7-B）：同一种数字行，只把数字换成实际音名的大写字母，右上角挂升降号（每个带升降的都写）、右下角挂八度数字；不用点、不写调号；中央 C 叫法跟着歌", () => {
    const letters = (body: Omit<Token, "id">[], key = 2, extra: (s: Song) => Song = (x) => x) => lay(body, (s0) => {
      const st0 = initState(), part = st0.at.part, paper = s0.papers[0]!;
      const toks = paper.tracks[part]!.map((t) => (t.kind === "key" ? { ...t, fifths: key } : t));
      return extra({ ...setNotation({ ...st0, song: { ...s0, papers: [{ ...paper, tracks: { ...paper.tracks, [part]: toks } }] } }, "letters").song });
    });
    const texts = (L: ReturnType<typeof lay>["L"], re: RegExp) => L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && re.test(p.cls ?? ""));
    // D 大调里的 E4 F♯4 G4 F♯5：字母 E F G F；两个 F 右上角都写 ♯（调号里有也写）；右下角 4 4 4 5；调号不印（编辑器里有淡的提示）；没有点
    const a = letters([n(P("E")), n(P("F", 4, 1)), n(P("G")), n(P("F", 5, 1))]).L;
    assert(a.systems.every((r) => r.kind === "jianpu"), "行的种类还是数字行（不另写一种行）");
    eq(texts(a, /jp-letter\b(?!-)/).map((p) => p.s).join(""), "EFGF", "字母 = 实际音名、大写");
    const supG = a.prims.filter((p): p is Extract<Prim, { t: "glyph" }> => p.t === "glyph" && /jp-letter-sup/.test(p.cls ?? ""));
    eq(supG.map((p) => p.ch).join(""), "\u{E262}\u{E262}", "每个 F♯ 右上角都写 ♯（7-P：Bravura 字形）");
    eq(texts(a, /jp-letter-sub/).map((p) => p.s).join(""), "4445", "右下角每个音都写八度数字（中央 C = C4）");
    const f = texts(a, /jp-letter\b(?!-)/)[1]!, sup = supG[0]!, sub = texts(a, /jp-letter-sub/)[1]!;
    assert(sup.x > f.x && sup.y < f.y && sup.size! < f.size!, "升降号在字母右上、小一号"); assert(sub.x > f.x && sub.y > f.y && Math.abs(sub.size! / f.size! - 0.7) < 0.01, "八度数字在字母右下、字母的七成（7-L）");
    assert(!texts(a, /jp-head/).some((p) => p.s.startsWith("1=")) && a.keyHints.some((h) => h.s.startsWith("1=")), "调号不印，编辑器里淡的提示带着它");
    eq(a.prims.filter((p) => p.t === "path" && /jp-dot/.test(p.cls ?? "")).length, 0, "不用上下的点");
    // 下划线让开右下角的数字：在下标的下面
    const u8 = letters([n(P("C"), TPQ / 2), n(P("D"), TPQ / 2)], 0).L, ul = u8.prims.find((p): p is Extract<Prim, { t: "line" }> => p.t === "line" && /jp-ul/.test(p.cls ?? ""))!, sub8 = texts(u8, /jp-letter-sub/)[0]!;
    assert(!!ul && ul.y1 > sub8.y, "八分音符的下划线在右下角数字的下面");
    // 中央 C 叫 C3：同一个 C4 写成 C₃
    const c3 = letters([n(P("C"))], 0, (s) => setMiddleC({ ...initState(), song: s }, 3).song).L;
    eq(texts(c3, /jp-letter-sub/).map((p) => p.s).join(""), "3", "中央 C 叫 C3 = 写 3");
    // 按 C 调看存着开：字母谱下不起作用；和弦竖叠每个音一个字母、各带自己的角标
    const c = letters([n(P("E")), n(P("F", 4, 1))], 2, (s) => ({ ...s, viewInC: true })).L;
    eq(texts(c, /jp-letter\b(?!-)/).map((p) => p.s).join(""), "EF", "按 C 调看在字母谱下不起作用");
    const d = letters([n(P("G"), TPQ, { chord: [P("E"), P("C")] })], 0).L;
    eq(texts(d, /jp-letter\b(?!-)/).map((p) => p.s).sort().join(""), "CEG"); eq(texts(d, /jp-letter-sub/).length, 3, "叠着的每个音各带自己的八度数字");
  });
  it("记号（UX 稿第 5 节；第五刀起样子照样张）：跳音 = 实心窄楔形、保持 = 短横、重音 = 描边的 >、次重音细一号、幽灵音小一号、气声 ×、换气 V + 吸、滚奏三道斜线", () => {
    const { L } = lay([
      n(P("C"), TPQ, { art: ["staccato"] }), n(P("D"), TPQ, { art: ["tenuto"] }), n(P("E"), TPQ, { art: ["accent"] }), n(P("F"), TPQ, { art: ["stress"] }),
      n(P("G"), TPQ, { art: ["ghost"] }), n(P("A"), TPQ, { art: ["whisper"] }), n(P("B"), TPQ, { art: ["breath"], inhale: "soft" }), n(P("C", 5), TPQ, { art: ["roll"] }),
    ]);
    const glyphs = L.prims.filter((p): p is Extract<Prim, { t: "glyph" }> => p.t === "glyph");
    void glyphs;
    assert(L.prims.some((p) => p.t === "path" && /jp-stacc/.test(p.cls ?? "") && /staccato/.test(p.cls ?? "")), "跳音 = 实心窄楔形");
    assert(L.prims.some((p) => p.t === "line" && /jp-ten/.test(p.cls ?? "")), "保持 = 短横");
    const chev = L.prims.filter((p): p is Extract<Prim, { t: "path" }> => p.t === "path" && /jp-chev/.test(p.cls ?? ""));
    eq(chev.length, 2, "重音、次重音都是 >");
    const thick = (p: { d: string }) => { const n = p.d.match(/-?[\d.]+/g)!.map(Number); return n[11]! - n[1]!; };   // 第一条臂竖着的厚（上沿 → 下沿）
    const accT = thick(chev.find((p) => /accent/.test(p.cls ?? ""))!), strT = thick(chev.find((p) => /stress/.test(p.cls ?? ""))!);
    assert(strT < accT, `次重音细一号（描边细：${strT.toFixed(2)} < ${accT.toFixed(2)}）`);
    const ds = L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-digit/.test(p.cls ?? ""));
    const gh = ds.find((p) => /art-ghost/.test(p.cls ?? ""));
    assert(gh !== undefined && gh.size! < ds.find((p) => !/ghost/.test(p.cls ?? ""))!.size! && !/(^|\s)ghost(\s|$)/.test(gh.cls ?? ""), "幽灵音 = 数字小一号（不是灰的：灰 = 没写音高）");
    const texts = L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text").map((p) => p.s);
    assert(texts.includes("×") && texts.includes("V") && texts.includes("吸"), "气声 ×、换气 V、出声的换气「吸」");
    eq(L.prims.filter((p) => p.t === "line" && /jp-roll/.test(p.cls ?? "")).length, 3, "滚奏 = 三道短斜线");
  });
  it("没写音高的音 = 灰色 x（点得到）", () => {
    const { L, toks } = lay([n(P("C")), { kind: "note", pitch: null, dur: TPQ * 2, lyric: null } as Omit<Token, "id">]);
    const i = toks.findIndex((t) => t.kind === "note" && t.pitch === null);
    const x = L.prims.find((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && p.tok === toks[i]!.id && p.s === "x");
    assert(x !== undefined && /(^|\s)ghost(\s|$)/.test(x.cls ?? ""), "灰色 x");
    assert(L.notes.some((h) => h.index === i), "点得到");
  });
  it("建轨是谱种表里的一项（第五刀 5-2）：简谱的合租不叠成一行（一家几位各自一行、没有虚拟轨、没有只读的叠起来的行）；五线谱照旧叠", () => {
    const v = FULL_VIEWS.find((x) => x.name === "edit-all")!, staff = fullSong(), jp = { ...fullSong(), notation: "jianpu" } as Song;
    const Ls = engrave(staff, v.opts(staff)), Lj = engrave(jp, v.opts(jp));
    assert(!!Ls.virtual["pa:X"] && Ls.sharedRows.length > 0, "五线谱：X、Y 叠成一行虚拟轨（只读）");
    eq(Object.keys(Lj.virtual).join(","), "", "简谱：没有虚拟轨（哪一家都不叠）");
    eq(Lj.sharedRows.length, 0, "简谱：没有只读的叠起来的行");
    for (const id of ["X", "Y"]) assert(Lj.systems.some((r) => r.paper === "pa" && r.part === id), `简谱：${id} 有自己的行`);
    // 一家左边一条竖线包住（第五刀 5-4 ③，UX 稿第 7 节）：印出来的；没有「叠回去」的括号（简谱不叠）
    const famLines = Lj.prims.filter((p): p is Extract<Prim, { t: "line" }> => p.t === "line" && /family-line/.test(p.cls ?? ""));
    const rowX = Lj.systems.find((r) => r.paper === "pa" && r.part === "X")!, rowY = Lj.systems.find((r) => r.paper === "pa" && r.part === "Y")!;
    assert(famLines.some((l) => l.y1 <= rowX.staffTop + 1e-6 + 30 && l.y1 >= rowX.top - 1e-6 && l.y2 >= rowY.staffTop && l.y2 <= rowY.bottom + 1e-6), "简谱：X、Y 那一家左边一条竖线，从 X 那一行到 Y 那一行");
    eq(Lj.families.length, 0, "简谱：没有「叠回去」的括号");
    eq(Ls.prims.filter((p) => /family-line/.test(p.cls ?? "")).length, 0, "五线谱：没有这条竖线（叠 / 展开括号照旧）");
  });
  it("力度 = p / f 字母（不分界面语言；user 11-11 夜纪要第 88 节「中文的字确实有点太抢眼了」）；简谱 = 和数字同一款的细斜体小写、约数字的 0.8（user「主要是我们简谱字比较细，你用粗体就怎么都会抢吧」），五线谱照旧 Bravura；中文叫法在说明栏里", () => {
    const body = [{ kind: "dyn", value: "mf" } as Omit<Token, "id">, n(P("C")), { kind: "dyn", value: "pp" } as Omit<Token, "id">, n(P("D"))];
    const glyphs = (locale: "zh" | "en") => {
      const st0 = initState(), part = st0.at.part, paper = st0.song.papers[0]!;
      let id = 1000; let s: Song = { ...st0.song, papers: [{ ...paper, tracks: { ...paper.tracks, [part]: [...paper.tracks[part]!, ...body.map((t) => ({ ...t, id: id++ }) as Token)] } }] };
      s = setNotation({ ...st0, song: s }, "jianpu").song;
      const L = engrave(s, { width: 900, sp: 10, locale, at: { paper: paper.id, part }, parts: [{ id: part, name: "V", first: true }], measure: createTextMeasure((x: string) => x.length * 8), autoBars: true });
      const ds = L.prims.filter((p) => /(^|\s)dyn(\s|$)/.test(p.cls ?? ""));
      for (const p of ds) if (p.t === "text") { assert(/jp-dyn/.test(p.cls ?? ""), "简谱的力度字 = 文字样式 jp-dyn（细斜体）"); assert(Math.abs((p.size ?? 0) - 10 * 2.0 * (3.6 / (2.5 * 1.75))) < 1e-6, `字号 = 数字的 0.8（${p.size}）`); }
      return ds.map((p) => (p.t === "glyph" ? p.ch : p.t === "text" ? `text:${p.s}` : p.t)).join(" ");
    };
    eq(glyphs("zh"), "text:mf text:pp", "中文界面：mf、pp 是普通的字母");
    eq(glyphs("en"), glyphs("zh"), "英文界面一样");
    assert(SIGNS["dyn:mf"].says("zh").includes("中强") && SIGNS["dyn:pp"].says("zh").includes("很弱"), "中文叫法在说明栏");
    eq(SIGNS["dyn:mf"].draw.staff.kind, "glyph", "五线谱那一栏照旧是 Bravura 字形"); eq(SIGNS["art:sfz"].draw.jianpu.kind, "text", "sfz / fp 在简谱上也是字");
    const st = textStyleOf("dyn jp-dyn"); assert(st.italic && st.weight === 400 && st.face === textStyleOf("jp-digit").face, "细（常规粗细）、斜体、和数字同一款字");
  });
  it("低八度的点和高八度的点对称（7-D）：没下划线 = 离数字底和高点离数字顶一样远；有下划线 = 贴着最下面一条下划线、间隙一样；点之间同一个步长", () => {
    // 一四分低 6、两个八分低 6 5（一条下划线）、一四分高 1、一四分低低 6（两个点）；八度基准钉在 C4（音域 C4–C5）
    const { L } = lay([n(P("A", 3)), n(P("A", 3), TPQ / 2), n(P("G", 3), TPQ / 2), n(P("C", 5)), n(P("A", 2))], undefined, { range: { lo: 60, hi: 72 } });
    const cy = (p: Prim) => +/^M[-\d.]+,([-\d.]+)/.exec((p as { d: string }).d)![1]!;
    const dots = L.prims.filter((p) => p.t === "path" && p.cls === "jp-dot" && p.tok !== undefined), byTok = (id: number) => dots.filter((p) => p.tok === id).map(cy).sort((a, b) => a - b);
    const ds = L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-digit/.test(p.cls ?? "") && p.tok !== undefined);
    const ids = ds.map((p) => p.tok!).filter((t, i, a) => a.indexOf(t) === i).slice(-5), digitOf = (id: number) => ds.find((p) => p.tok === id)!;
    const [low, ul1, , hi, low2] = ids as [number, number, number, number, number];
    const u = digitOf(low).size! / 2.5;   // 一个单位 = 数字字号 / FS
    // 8-7（墨和占位宽分开）：点贴数字的墨——量也从墨量（字形表 GLYPH_INK：[左, 下, 右, 上]，字号的倍数，往上为正）
    const inkBot = (d: Extract<Prim, { t: "text" }>) => d.y - GLYPH_INK[d.s]![1] * d.size!, inkTop = (d: Extract<Prim, { t: "text" }>) => d.y - GLYPH_INK[d.s]![3] * d.size!;
    const gapLow = (byTok(low)[0]! - inkBot(digitOf(low))) / u, gapHi = (inkTop(digitOf(hi)) - byTok(hi)[0]!) / u;
    assert(Math.abs(gapHi - gapLow) < 0.02, `低点离数字的墨底 = 高点离数字的墨顶（${gapLow.toFixed(3)} vs ${gapHi.toFixed(3)}）`);
    const ul = L.prims.filter((p): p is Extract<Prim, { t: "line" }> => p.t === "line" && p.cls === "jp-ul" && Math.min(p.x1, p.x2) <= digitOf(ul1).x && Math.max(p.x1, p.x2) >= digitOf(ul1).x);
    eq(ul.length, 1, "八分音符一条下划线");
    const ulBottom = ul[0]!.y1 + ul[0]!.w / 2, gapUl = (byTok(ul1)[0]! - ulBottom) / u;
    assert(Math.abs(gapUl - gapLow) < 0.02, `有下划线：点离下划线底的间隙 = 没下划线时离数字底的间隙（${gapUl.toFixed(3)} vs ${gapLow.toFixed(3)}）`);
    const two = byTok(low2); eq(two.length, 2, "低低 6：两个点");
    assert(Math.abs((two[0]! - inkBot(digitOf(low2))) / u - gapLow) < 0.02 && Math.abs((two[1]! - two[0]!) / u - 0.227 * 2.5) < 0.02, "第一个点同一个位置、第二个往下一步");
  });
  it("几何表（谱面只查它；统筹审接口第 2 条）：数字行没有「纵向 = 音高」；鬼音符 = 数字 + 升降 + 照这一行八度基准的点；光标在数字行的上下沿之间", () => {
    assert(!GEOMETRY.jianpu.pitchAxis && !!GEOMETRY.staff.pitchAxis, "数字行不提供竖着拖改音高");
    const { L } = lay([n(P("C")), n(P("E")), n(P("G"))]);
    const row = L.systems.find((r) => r.kind === "jianpu")!;
    assert(typeof row.octBase === "number", "数字行带着八度基准");
    const g = (p: ReturnType<typeof P>, shown: number | null) => GEOMETRY.jianpu.ghost(row, 100, [{ p, shown, shift: 0, fifths: 0 }], 5, true);
    const dots = (svg: string) => (svg.match(/<path /g) ?? []).length, digit = (svg: string) => /middle">(\d)<\/text>/.exec(svg)?.[1];
    eq([digit(g(P("C"), null)), dots(g(P("C"), null))].join(","), "1,0", "和这一行同一个八度的 1：不加点");
    eq([digit(g(P("C", 5), null)), dots(g(P("C", 5), null))].join(","), "1,1", "高八度：一个点");
    eq([digit(g(P("A", 3), null)), dots(g(P("A", 3), null))].join(","), "6,1", "低八度的 6：一个点");
    assert(g(P("F", 4, 1), 1).includes("♯") && digit(g(P("F", 4, 1), 1)) === "4", "♯4：画升号（shown 不是 null）");
    assert(!g(P("F", 4, 1), null).includes("♯"), "shown = null 不画升降（同排版的规矩）");
    const cs = GEOMETRY.jianpu.caretSpan(row, 5), a = DRAWERS.jianpu.anchors(row.staffTop, 5 * (row.scale ?? 1));   // 行身按这一行的尺寸比例取（第五刀 5-0c）
    assert(cs.y1 < a.top + 1e-6 && cs.y2 > a.bottom - 1e-6, "光标盖住行身");
  });
  it("连音（8-3，user 11-12：带下划线的数字写在横线下面、横线不断；不带下划线的用方钩虚线括号，数字在缺口里）", () => {
    const t3 = TPQ / 3;
    const { L } = lay([n(P("C")), n(P("D"), t3), n(P("E"), t3), n(P("F"), t3), n(P("G"), (2 * TPQ) / 3), n(P("A", 3), t3), n(P("C"))], undefined, { range: { lo: 60, hi: 72 } });   // 八分三连（一条下划线）、四分三连 + 八分三连（低 6，带一个低八度点）
    const tup = L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-tuplet/.test(p.cls ?? "")).sort((a, b) => a.x - b.x);
    eq(tup.map((p) => p.s).join(","), "3,3", "两组各一个「3」");
    const dig = L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-digit/.test(p.cls ?? "")), base = dig[0]!.y, u = dig[0]!.size! / 2.5;   // 一个单位 = 数字字号 / FS
    const uls = L.prims.filter((p): p is Extract<Prim, { t: "line" }> => p.t === "line" && p.cls === "jp-ul"), cap = 1.8 * (1.1 / 2.5) * u;   // 小数字的字高
    // ① 八分三连：下划线一条、不断开；数字在它下面、居中
    const a = tup[0]!, under = uls.filter((l) => Math.min(l.x1, l.x2) < a.x && Math.max(l.x1, l.x2) > a.x);
    assert(a.y > base, "数字在音的下面");
    eq(under.length, 1, "数字上面那条下划线是一整条（不断开）");
    assert(a.y - cap > under[0]!.y1, "数字的顶在下划线下面");
    const ulL = Math.min(under[0]!.x1, under[0]!.x2), ulR = Math.max(under[0]!.x1, under[0]!.x2);
    assert(Math.abs(a.x - (ulL + ulR) / 2) < 1.2 * u, "数字大约在这一组的正中");
    // ② 四分三连 + 八分三连：方钩虚线括号——两头的钩是实线、朝上；中间是一段段的虚线；数字在缺口里、压在括号线上；括号在这组最低的墨下面
    const b = tup[1]!, hooks = L.prims.filter((p): p is Extract<Prim, { t: "path" }> => p.t === "path" && /tuplet-bracket/.test(p.cls ?? "") && !/tuplet-dash/.test(p.cls ?? ""));
    const dash = L.prims.filter((p): p is Extract<Prim, { t: "path" }> => p.t === "path" && /tuplet-dash/.test(p.cls ?? ""));
    eq(hooks.length, 1, "没连成一条下划线的那组：一道括号的两个钩"); eq(dash.length, 1, "中间一道虚线");
    const hy = [...hooks[0]!.d.matchAll(/[ML]([-\d.]+),([-\d.]+)/g)].map((m) => +m[2]!), lineY = Math.max(...hy);
    assert(Math.min(...hy) < lineY, "钩朝上");
    const segs = [...dash[0]!.d.matchAll(/M([-\d.]+),[-\d.]+L([-\d.]+),/g)].map((m) => [+m[1]!, +m[2]!] as const);
    assert(segs.length >= 4, `虚线是一段一段的（${segs.length} 段）`);
    assert(!segs.some(([x0, x1]) => Math.min(x0, x1) < b.x && Math.max(x0, x1) > b.x), "数字那儿是缺口");
    assert(Math.abs(b.y - cap / 2 - lineY) < 0.05 * u, "数字压在括号线上");
    const dotsBelow = L.prims.filter((p) => p.t === "path" && p.cls === "jp-dot").map((p) => +/^M[-\d.]+,([-\d.]+)/.exec((p as { d: string }).d)![1]!), ulBelow = Math.max(...uls.map((l) => l.y1));
    assert(lineY - cap / 2 > Math.max(...dotsBelow, ulBelow), "数字的顶在这组最低的墨（低八度点、下划线）下面");
  });
  it("弧线：延音线（数据里的 tie）、圆滑线（一串连着的一条）；连音一组一个数字（摆在哪见上一条）；反复小节线带点", () => {
    const tr = TPQ / 3;
    const { L } = lay([
      n(P("C")), n(P("C"), TPQ, { tie: true }), n(P("D"), TPQ, { slur: true }), n(P("E"), TPQ, { slur: true }), n(P("F")),
      { kind: "bar", repeat: "start" } as Omit<Token, "id">, n(P("G"), tr), n(P("A"), tr), n(P("B"), tr), n(P("C", 5), TPQ * 3), { kind: "bar", repeat: "end" } as Omit<Token, "id">,
    ]);
    eq(L.prims.filter((p) => p.t === "path" && /jp-tie/.test(p.cls ?? "")).length, 1, "一条延音线");
    eq(L.prims.filter((p) => p.t === "path" && /jp-slur/.test(p.cls ?? "")).length, 1, "D–E–F 一条圆滑线");
    const tup = L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-tuplet/.test(p.cls ?? ""));
    eq(tup.map((p) => p.s).join(","), "3", "三连音一组一个「3」");
    eq(L.prims.filter((p) => p.t === "path" && /tuplet-bracket/.test(p.cls ?? "")).length, 0, "有下划线的组不加括号");
    eq(L.prims.filter((p) => p.t === "path" && /repeat-dot/.test(p.cls ?? "")).length, 4, "|: 和 :| 各两个点");
  });
  it("五线谱才有的记号（行中间的谱号、八度线）落在数字行上 = 小灰标（不印）+ 点得到；token 都有图元", () => {
    const { L, toks } = lay([n(P("C")), { kind: "clef", clef: "F" } as Omit<Token, "id">, n(P("D")), { kind: "ottava", shift: 1 } as Omit<Token, "id">, n(P("E")), { kind: "ottava", shift: 0 } as Omit<Token, "id">]);
    const lab = L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-staffonly/.test(p.cls ?? ""));
    eq(lab.map((p) => p.s).join(","), "谱号,8va,loco");
    assert(lab.every((p) => /\bann\b/.test(p.cls ?? "")), "编辑器专用（ann = 不印）");
    for (const k of ["clef", "ottava"] as const) {
      const ids = toks.filter((t) => t.kind === k).map((t) => t.id);
      assert(ids.every((id) => L.prims.some((p) => p.tok === id)), `${k} 每个 token 都有图元`);
    }
    eq(L.clefs.filter((h) => h.kind === "mid").length + L.clefs.filter((h) => h.kind === "ottava").length, 3, "三个都点得到");
  });
});
describe("数字行的升降号（7-P）", async () => {
  const G = await import("../src/render/jianpu/glyphs.ts"), B = await import("../src/render/glyph-box.gen.ts");
  it("用 Bravura 的字形；抄进字形表的墨迹框和生成的那份一样", () => {
    for (const g of Object.values(G.ACC_GLYPH)) assert(JSON.stringify([...g.box]) === JSON.stringify([...B.GLYPH_BOX[g.ch]!]), `${g.ch.codePointAt(0)!.toString(16)}：${g.box} ≠ ${B.GLYPH_BOX[g.ch]}`);
  });
});
describe("升降号的描边补粗（7-P 补：逐个字形按主笔画算）", async () => {
  const G = await import("../src/render/jianpu/glyphs.ts"), SV = await import("../src/render/svg.ts");
  const nodeMod = (m: string) => (globalThis as unknown as { process: { getBuiltinModule(m: string): any } }).process.getBuiltinModule(m);
  const outl = JSON.parse(nodeMod("node:fs").readFileSync(new URL("../vendor/fonts/bravura/outlines.json", import.meta.url), "utf8")) as { glyphs: Record<string, { d: string }> };
  /** 轮廓 → 折线（曲线每段切 16 份）。 */
  const contours = (d: string): [number, number][][] => {
    const t = d.match(/[MLHVCQZ]|-?\d+\.?\d*/g)!; const cs: [number, number][][] = []; let cur: [number, number][] = [], x = 0, y = 0, cmd = "", i = 0;
    const n = () => Number(t[i++]);
    while (i < t.length) {
      if (/[MLHVCQZ]/.test(t[i]!)) cmd = t[i++]!;
      if (cmd === "M") { if (cur.length) cs.push(cur); x = n(); y = n(); cur = [[x, y]]; cmd = "L"; }
      else if (cmd === "L") { x = n(); y = n(); cur.push([x, y]); } else if (cmd === "H") { x = n(); cur.push([x, y]); } else if (cmd === "V") { y = n(); cur.push([x, y]); }
      else if (cmd === "C") { const [a, b, c, e, f, g] = [n(), n(), n(), n(), n(), n()]; for (let k = 1; k <= 16; k++) { const s = k / 16, u = 1 - s; cur.push([u * u * u * x + 3 * u * u * s * a + 3 * u * s * s * c + s * s * s * f, u * u * u * y + 3 * u * u * s * b + 3 * u * s * s * e + s * s * s * g]); } x = f; y = g; }
      else if (cmd === "Q") { const [a, b, c, e] = [n(), n(), n(), n()]; for (let k = 1; k <= 16; k++) { const s = k / 16, u = 1 - s; cur.push([u * u * x + 2 * u * s * a + s * s * c, u * u * y + 2 * u * s * b + s * s * e]); } x = c; y = e; }
      else if (cmd === "Z") { if (cur.length) cs.push(cur); cur = []; cmd = ""; } else i++;
    }
    if (cur.length) cs.push(cur); return cs;
  };
  /** 扫描线（水平 = 竖笔有多粗；竖直 = 横 / 斜笔有多粗）：每一段墨的长度。 */
  const runs = (cs: [number, number][][], v: number, vertical: boolean): number[] => {
    const xs: number[] = []; for (const c of cs) c.forEach((p, k) => { const q = c[(k + 1) % c.length]!, [a0, b0] = vertical ? [p[1], p[0]] : [p[0], p[1]], [a1, b1] = vertical ? [q[1], q[0]] : [q[0], q[1]]; if ((b0 <= v && v < b1) || (b1 <= v && v < b0)) xs.push(a0 + ((v - b0) * (a1 - a0)) / (b1 - b0)); });
    xs.sort((p, q) => p - q); const out: number[] = []; for (let k = 0; k + 1 < xs.length; k += 2) out.push(xs[k + 1]! - xs[k]!); return out;
  };
  const span = (cs: [number, number][][], i: 0 | 1) => { const v = cs.flat().map((p) => p[i]); return [Math.min(...v), Math.max(...v)] as const; };
  it("主笔画（dom）= 轮廓量出来的：♭ 肚子右边最粗那一笔、♮ ♯ 两道斜横", () => {
    const flat = contours(outl.glyphs.E260!.d), [y0, y1] = span(flat, 1);
    const fl = Math.max(...[0.1, 0.15, 0.2, 0.25, 0.3].flatMap((f) => runs(flat, y0 + (y1 - y0) * f, false)).filter((w) => w < 80)) / 1000;
    const beams = (code: string) => { const cs = contours(outl.glyphs[code]!.d), [x0, x1] = span(cs, 0); const w = [0.3, 0.4, 0.5, 0.6, 0.7].flatMap((f) => runs(cs, x0 + (x1 - x0) * f, true)).filter((h) => h < 130).sort((p, q) => p - q); return w[Math.floor(w.length / 2)]! / 1000; };
    assert(Math.abs(fl - G.ACC_GLYPH.flat.dom) < 0.006, `♭ 量出来 ${fl}`); assert(Math.abs(beams("E262") - G.ACC_GLYPH.sharp.dom) < 0.012, `♯ 量出来 ${beams("E262")}`); assert(Math.abs(beams("E261") - G.ACC_GLYPH.natural.dom) < 0.012, `♮ 量出来 ${beams("E261")}`);
  });
  it("描多粗（统筹定 B）：同一家先看齐到 ♯ 的主笔画（♭ 补、♮ ♯ 不动）；整家明显轻于主字才一起补（现在不补；主字放大到整家明显轻时三个一起补）；画出来的 SVG 带描边", () => {
    const st = (g: { dom: number }, main = G.DIGIT_EM) => G.accStroke(g, G.ACC_GLYPH_EM, main);
    const f = st(G.ACC_GLYPH.flat), s = st(G.ACC_GLYPH.sharp), n = st(G.ACC_GLYPH.natural);
    assert(Math.abs(f - (G.ACC_GLYPH.sharp.dom - G.ACC_GLYPH.flat.dom)) < 1e-12 && s === 0 && n === 0, `数字行：♭ ${f} ♯ ${s} ♮ ${n}`);
    const big = G.DIGIT_EM * 1.5, fb = st(G.ACC_GLYPH.flat, big), sb = st(G.ACC_GLYPH.sharp, big), nb = st(G.ACC_GLYPH.natural, big);
    assert(sb > 0 && Math.abs(fb - sb - f) < 1e-12 && nb === sb, `主字大一截（整家明显轻）：三个一起补同样多（♭ 另加看齐那一截）：♭ ${fb} ♯ ${sb} ♮ ${nb}`);
    const svg = SV.primSvg({ t: "glyph", x: 0, y: 0, ch: "\u{E260}", size: 20, stroke: f }, "40", "15", "6");
    assert(/stroke-width="[\d.]+"/.test(svg), svg);
  });
});
