// 简谱数字行（谱面分家第四刀；src/render/jianpu/、src/render/notations.ts）。created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟）。
//   这一份守画法本身（数字 / 八度点 / 下划线 / 谱种表怎么分行 / 点击框 / 记号 / 弧线 / 连音 / 五线谱专有记号的小灰标）；全量（每个 token 都有图元）、点击只指 token 的守卫在第四刀收尾时加。
import { describe, it, eq, assert } from "./runner.mjs";
import { engrave, type Prim } from "../src/render/engrave.ts";
import { createTextMeasure, textStyleOf } from "../src/render/text/index.ts";
import { initState, TPQ, type Song, type Token } from "../src/score/song.ts";
import { setNotation, setPartChords } from "../src/score/song-view.ts";
import { GEOMETRY, DRAWERS } from "../src/render/notations.ts";
import { SIGNS } from "../src/render/signs.ts";
import { harmonyTheory } from "../src/theory/index.ts";
import { rangeBase, fewestDotsBase } from "../src/score/degree.ts";
import { fullSong } from "./fixtures/layout/full-song.ts";
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
    const acc = L.prims.find((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-acc/.test(p.cls ?? "") && p.s === "♯");
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
  it("鼓 = X 行（第五刀 5-4，UX 稿第 7 节）：另一种行；音画成 X、幽灵音 = 小 x、同时敲的几件往上叠；节奏的写法同数字行；调号不印、编辑器里淡的「1=D」提示带着它", () => {
    const kit = { perc: { kind: "kit" } };
    const { L, toks } = lay([n(P("C", 2)), n(P("D", 2), TPQ, { art: ["ghost"] }), n(P("F", 4, 1), TPQ / 2, { chord: [P("C", 2)] }), n(P("C", 2), TPQ / 2), n(P("C", 2), TPQ)], undefined, kit);
    assert(L.systems.length > 0 && L.systems.every((r) => r.kind === "jianpuX"), "鼓的那一行 = X 行");
    const xs = L.prims.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-x/.test(p.cls ?? ""));
    eq(xs.map((p) => p.s).join(""), "XxXXXX", "每一下一个 X；幽灵音 = 小 x；同时敲的两件 = 两个 X");
    assert(!L.prims.some((p) => p.t === "text" && /jp-acc/.test(p.cls ?? "")) && !L.prims.some((p) => p.t === "path" && /jp-dot/.test(p.cls ?? "")), "没有升降号、没有八度点");
    eq(L.prims.filter((p) => p.t === "line" && /jp-ul/.test(p.cls ?? "")).length, 1, "两个八分连一条下划线（节奏写法同数字行）");
    assert(!L.prims.some((p) => p.t === "text" && /jp-head/.test(p.cls ?? "") && (p as { s: string }).s.startsWith("1=")), "谱头不印「1=」");
    const iKey = toks.findIndex((t) => t.kind === "key");
    assert(L.keyHints.some((h) => h.index === iKey && h.tok === toks[iKey]!.id && h.s.startsWith("1=")), "编辑器里淡的「1=…」提示带着调号 token");
    eq(GEOMETRY.jianpuX.pitchAxis, undefined, "X 行没有「纵向 = 音高」");
    // 不分音高的一律 X 行（统筹裁定 5-4 ⑨）：台上固定敲一个键的（五线谱上画 × 符头）也是；简谱的歌里不再有五线谱的行
    const fixed = lay([n(P("E")), n(P("G"))], undefined, { xHead: true }).L;
    assert(fixed.systems.every((r) => r.kind === "jianpuX") && fixed.prims.some((p) => p.t === "text" && /jp-x/.test(p.cls ?? "")), "固定敲一个键的声部 = X 行");
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
  });
  it("八度基准按乐器音域（第五刀 5-4，UX 稿第 3 节）：宿主给了音域 = 按音域；没给 = 写的音「点最少」；按音域要三个点以上 = 极端，退回点最少；基准画在「1=」那个字母上下", () => {
    eq(rangeBase(57, 76, 0), 0, "人声 A3–E5 在 C 调 = 0");
    eq(rangeBase(28, 55, 0), -2, "低音 E1–G3 = 低两组");
    const low = [n(P("G", 2)), n(P("A", 2)), n(P("B", 2)), n(P("C", 3))];
    const keyDots = (L: ReturnType<typeof lay>["L"]) => L.prims.filter((p) => p.t === "path" && /jp-key-dot/.test(p.cls ?? "")).length;
    const voice = lay(low, undefined, { range: { lo: 57, hi: 76 } }).L, plain = lay(low).L;
    eq(voice.systems[0]!.octBase, 0, "人声的音域 = 基准 0（这几个低音各两个点）"); eq(keyDots(voice), 0, "基准 0 = 字母上下不画点");
    eq(plain.systems[0]!.octBase, -2, "没给音域 = 点最少（低两组）"); eq(keyDots(plain), 2, "低两组 = 「1=C」的 C 下面两个点");
    eq(lay([n(P("C", 1)), n(P("C"))], undefined, { range: { lo: 57, hi: 76 } }).L.systems[0]!.octBase, fewestDotsBase([-3, 0]), "按音域要三个点（C1）= 极端，退回点最少");
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
  it("长音不是整拍时后一截不画横线（统筹看第四刀成品样张后定的第 1 处）：3/4 里四拍半的音 = 第一小节「1 – –」，第二小节重写「1·」、连线连上；横线只表示整拍", () => {
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
  it("弧线：延音线（数据里的 tie）、圆滑线（一串连着的一条）；连音 = 组上方一个小数字；反复小节线带点", () => {
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
