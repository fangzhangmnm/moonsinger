// 「现在怎么画」只在 src/look（施工单第 17 条 17-1，统筹 2026-11-13「v0.17.20 收；17-0 审过」）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   守：① 方向和边界——src/score 不 import src/look；模块外面没有人比较这几项和 "default"、没有「没写就当成某个值」的退路（song.paper ?? …、DEFAULT_PAPER、
//      每张纸每个声部那几样的 looks?.[…] / autoOttava !== false——song.ts 里管写法的那几个 helper 除外）。
//   ② 意思——新建的歌全跟着软件；选「跟着软件」/「全部跟着软件」；读文件的门口没写 / 写坏了 = "default"、写了的照读；老文件的纸从 <defaults> 认一次；纸张存选择、往返；
//      每张纸每个声部那几样「没写 = 开 / 一行」。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, setPaper, setDensity, setBarNumbers, setLyricFit, type Song } from "../src/score/song.ts";
import { setNotation, setChordTags } from "../src/score/song-view.ts";
import { paperOf, detectPaper } from "../src/look/paper.ts";
import { lookOf, followDefault, allDefault, chosenCount, trackLookOf, paperChoicesOf, marginRow, defaultText, LOOK_KEYS, type LookKey } from "../src/look/index.ts";
import { saveMxl, openBytes, emptyExtras } from "../src/format/project.ts";
import { unzipSync, zipSync, strFromU8, strToU8 } from "../vendor/fflate/fflate.esm.js";
const fs = (await import("node:fs" as string)) as { readdirSync(u: URL, o: { withFileTypes: true }): { name: string; isDirectory(): boolean }[]; readFileSync(u: URL, e: "utf8"): string };
const ROOT = new URL("../", import.meta.url);
const walk = (dir: string): string[] => fs.readdirSync(new URL(dir, ROOT), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}${e.name}/`) : /\.(ts|mjs)$/.test(e.name) ? [`${dir}${e.name}`] : []));
const code = (f: string) => fs.readFileSync(new URL(f, ROOT), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
const save = (s: Song) => saveMxl({ song: s, extras: emptyExtras(), app: "t", date: "2026-11-13T00:00:00.000Z" });
const scoreJson = (b: Uint8Array) => JSON.parse(strFromU8(unzipSync(b)[".moonsinger/score.json"]!));
const withScoreJson = (b: Uint8Array, f: (j: Record<string, unknown>) => void): Uint8Array => { const z = unzipSync(b), j = JSON.parse(strFromU8(z[".moonsinger/score.json"]!)); f(j); z[".moonsinger/score.json"] = strToU8(JSON.stringify(j)); return zipSync(z); };

describe("src/look 的边界（第 17 条 17-1）", () => {
  const outside = walk("src/").filter((f) => !f.startsWith("src/look/"));
  it("谱这一层（src/score）不 import src/look", () => {
    eq(walk("src/score/").filter((f) => /from\s+["'][^"']*look\/index/.test(code(f))).join("、"), "");
  });
  it("模块外面没有人拿这几项和 \"default\" 比", () => {
    const re = new RegExp(`\\.(${LOOK_KEYS.join("|")})\\s*[!=]==?\\s*"default"|"default"\\s*[!=]==?\\s*[\\w.]*\\.(${LOOK_KEYS.join("|")})\\b`);
    eq(outside.filter((f) => re.test(code(f))).join("、"), "");
  });
  it("模块外面没有「没写就当成某个值」的退路：DEFAULT_PAPER、song.paper ?? …、?? paperOf(…)", () => {
    eq(outside.filter((f) => /\bDEFAULT_PAPER\b|\bsong\.paper\s*\?\?|\?\?\s*paperOf\(/.test(code(f))).join("、"), "");
  });
  it("每张纸每个声部那几样：模块外面不直接读 looks（只有 song.ts 里管写法的 helper 碰它）", () => {
    eq(outside.filter((f) => f !== "src/score/song.ts" && /looks\?\.\[|\.looks\[|autoOttava\s*[!=]==?\s*false/.test(code(f))).join("、"), "");
  });
});

describe("跟着软件（第 17 条 17-1）", () => {
  it("新建的歌：每一项都跟着软件；现在画成五线谱 / 按节奏 / 每行开头印小节号 / A5 舒适 7 mm", () => {
    const s = initState().song, L = lookOf(s);
    eq(chosenCount(s), 0); assert(LOOK_KEYS.every((k) => L.follows[k]), "follows 全是 true");
    eq([L.notation, L.lyricFit, L.barNumbers, L.chordTags, L.viewInC, L.expressions, L.middleC].join(","), "staff,rhythm,true,true,false,true,4");
    eq(JSON.stringify(L.paper), JSON.stringify({ ...paperOf("A5"), density: "cozy", staffMm: 7 }));
  });
  it("选了 = 写具体的值（选的正好是现在的默认那一个也是选过的）；选「跟着软件」= 写回；纸跟着软件 = 边距也跟着，版式跟着软件 = 谱高也跟着；「全部跟着软件」= 和新歌一样", () => {
    const st = initState();
    const picked = setLyricFit(setBarNumbers(setChordTags(setNotation(setDensity(setPaper(st, "A5"), "cozy"), "staff"), true), true), "rhythm").song;
    eq(chosenCount(picked), 6, "六项都选过（值和现在的默认一样）"); assert(!lookOf(picked).follows.paper);
    const far: Song = { ...picked, marginMm: { l: 1, r: 1, t: 1, b: 1 }, staffMm: 6 };
    const f1 = followDefault(far, "paper"), f2 = followDefault(far, "density");
    eq([f1.paper, f1.marginMm].join(","), "default,default", "纸跟着软件 = 边距也跟着"); eq([f2.density, f2.staffMm].join(","), "default,default", "版式跟着软件 = 谱高也跟着");
    eq(JSON.stringify(allDefault(far)), JSON.stringify(st.song), "全部跟着软件 = 和新歌一样");
    eq(allDefault(st.song), st.song, "都已经跟着软件 = 原样（同一个引用）");
  });
  it("读文件的门口：没写 / 写坏了 = \"default\"（补的是这个字）；写了的照读、算选过的；\"default\" 往返", () => {
    const b = save(initState().song);
    eq(scoreJson(b).notation, "default", "新歌存出去明写 default");
    const gone = openBytes("x.mxl", withScoreJson(b, (j) => { for (const k of LOOK_KEYS) delete j[k]; }));
    eq(chosenCount(gone.song), 0, "一项都没写 = 全跟着软件");
    const bad = openBytes("x.mxl", withScoreJson(b, (j) => { j.chordTags = "yes"; j.middleC = 99; j.barNumbers = 3; j.paper = { kind: "B5" }; j.marginMm = { l: "x" }; }));
    eq(chosenCount(bad.song), 0, "写坏了 = 跟着软件");
    const old = openBytes("x.mxl", withScoreJson(b, (j) => { Object.assign(j, { notation: "staff", chordTags: true, viewInC: false, middleC: 4, expressions: true, barNumbers: "line", lyricFit: "rhythm" }); }));
    eq(chosenCount(old.song), 7, "16-3 起明写着具体值的老歌：七项都算选过的（不猜、不转换）");
    eq(JSON.stringify(lookOf(old.song).follows.paper), "true", "老歌的 score.json 没有纸张那几项、MusicXML 里是 A5 舒适 = 跟着软件");
  });
});

// ── 每一样显示设置选过的值存得进去、读得回来（v0.17.33；统筹 134f74e4「加一样跟着歌走的显示设置要一起动的几处」）──
//   样本表按 LookKey 写满：LOOK_KEYS 加一样、这里不配一个选过的值 = 类型就报错；值存不进 score.json（写的那一处漏了）/ 读的门口不认（KNOWN_SCORE_KEYS、lookFromFile 漏了）= 这里红。
const CHOSEN: { readonly [K in LookKey]: Song[K] } = {
  notation: "jianpu", viewInC: true, middleC: 3, chordTags: false, chordTagStyle: "root", expressions: false, barNumbers: "off", lyricFit: "lyrics",
  paper: { kind: "A4" }, density: "compact", staffMm: 6, marginMm: { l: 11, r: 12, t: 13, b: 14 },
};
describe("每一样显示设置：选过的值存了再读回来一样（LOOK_KEYS 逐项）", () => {
  for (const k of LOOK_KEYS) it(`${k}`, () => {
    const s = { ...initState().song, [k]: CHOSEN[k] } as Song, o = openBytes("x.mxl", save(s));
    eq(JSON.stringify(o.song[k]), JSON.stringify(CHOSEN[k]), "读回来的值"); assert(!lookOf(o.song).follows[k], "读回来算选过的（不是跟着软件）");
  });
});

describe("纸张存选择（第 17 条 17-1）", () => {
  it("老文件 / 别家的谱从 <defaults> 认一次：没有 = 全跟着软件；A5 舒适、边距谱高都是那一档的 = 跟着软件；A4 = 选过的；A5 紧凑 = 选了 A5 和紧凑；Letter = 其他（按值）；别家的边距 / 谱高按值", () => {
    eq(JSON.stringify(paperChoicesOf(undefined)), JSON.stringify({ paper: "default", density: "default", staffMm: "default", marginMm: "default" }));
    eq(JSON.stringify(paperChoicesOf(paperOf("A5"))), JSON.stringify({ paper: "default", density: "default", staffMm: "default", marginMm: "default" }));
    eq(JSON.stringify(paperChoicesOf(paperOf("A4"))), JSON.stringify({ paper: { kind: "A4" }, density: "default", staffMm: "default", marginMm: "default" }));
    eq(JSON.stringify(paperChoicesOf(paperOf("A5", "compact"))), JSON.stringify({ paper: { kind: "A5" }, density: "compact", staffMm: "default", marginMm: "default" }));
    const letter = paperChoicesOf(detectPaper(215.9, 279.4, { l: 12, r: 12, t: 12, b: 12 }, 6.5));
    eq(JSON.stringify(letter), JSON.stringify({ paper: { kind: "other", widthMm: 215.9, heightMm: 279.4 }, density: "default", staffMm: 6.5, marginMm: { l: 12, r: 12, t: 12, b: 12 } }));
  });
  it("存选择、往返；<defaults> 每次照「现在怎么画」写：跟着软件 = 写 A5 的数；score.json 有纸张这几项时读的时候不看 <defaults>", () => {
    const a4 = setPaper(initState(), "A4").song, back = openBytes("x.mxl", save(a4)).song;
    eq(JSON.stringify(back.paper), JSON.stringify({ kind: "A4" }));
    const xml = (s: Song) => strFromU8(unzipSync(save(s))["score.musicxml"]!);
    assert(/<page-width>/.test(xml(initState().song)), "跟着软件也写 <defaults>（给别的软件看）");
    const lie = openBytes("x.mxl", withScoreJson(save(a4), (j) => { j.paper = "default"; }));
    eq(lie.song.paper, "default", "score.json 说跟着软件 = 跟着软件（不看 <defaults> 里写的 A4）");
  });
});

describe("每张纸每个声部那几样（第 17 条四问第 2 条）", () => {
  it("没写 = 自动八度线开、一行谱；写了大谱表 / 关了自动八度线 = 照写的", () => {
    const st = initState(), p = st.song.papers[0]!, part = st.song.parts[0]!.id;
    eq(JSON.stringify(trackLookOf(st.song)(p.id, part)), JSON.stringify({ autoOttava: true, grand: false }));
    const s2: Song = { ...st.song, papers: [{ ...p, looks: { [part]: { grand: true, autoOttava: false } } }] };
    eq(JSON.stringify(trackLookOf(s2)(p.id, part)), JSON.stringify({ autoOttava: false, grand: true }));
    eq(lookOf(st.song).chordsOf(part), "auto", "和弦选项没写 = 也认拆开弹的");
  });
});

describe("版面页「边距」那一行（第 17 条 17-2 顺手）", () => {
  it("边距跟着软件 = 没有这一行；按值带着 = 第一格写这张纸自己的边距、另一格照实写四边；「其他」大小的纸跟着软件 = 默认那张纸的边距", () => {
    const s = initState().song;
    eq(marginRow(lookOf(s)), null, "新歌：边距跟着软件，不出这一行");
    const a4 = { ...s, paper: { kind: "A4" as const }, marginMm: { t: 12, b: 14.5, l: 10, r: 10.125 } };
    eq(JSON.stringify(marginRow(lookOf(a4))), JSON.stringify({ follow: "15 毫米", custom: "上 12 · 下 14.5 · 左 10 · 右 10.13 毫米" }));
    const other = { ...s, paper: { kind: "other" as const, widthMm: 215.9, heightMm: 279.4 }, marginMm: { t: 12, b: 12, l: 12, r: 12 } };
    eq(marginRow(lookOf(other))?.follow, "16 毫米", "其他大小的纸：跟着软件 = A5 的 16 毫米（和 lookOf 跟着软件时用的同一个）");
    eq(JSON.stringify(lookOf(followDefault(other, "marginMm")).paper.marginMm), JSON.stringify({ l: 16, r: 16, t: 16, b: 16 }), "选「跟着软件」之后真的用这个数");
  });
  it("「移调辅助」第一格：跟着软件（现在是：不用）——不再括号套括号", () => { eq(defaultText("viewInC"), "不用"); });
});
