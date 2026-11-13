// test/note-name-outlets.test.ts —— 给人看的音名的出口，两类（施工单第 19 条；出口表 = ai-docs/20261113-note-name-outlets.md；统筹 a6be57e4 的名单）。
//   created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。例子统一用：谱降 E 大调、键盘跟谱（1=E♭）、移调辅助开着（五线谱）。
//   · 照眼前的谱写（移调辅助起作用 = 换到 C 调之后的；别的时候 = 实际的）：K1 键上大字、K3 升降滑的大字、K4 音域旋钮（= 最低最高两个键的大字，pad 里拿 cell().big；
//     真画出来的字在 E2E view-in-c 核）、S5 鬼音符、S8 点和弦字弹出的候选小表的根音名。（第 19 条新加的谱上根音写法到时加进这一组。）
//   · 永远写实际的：K2 小字（含升降滑时）、K5「1=」、K6「手动」那句、K7 符号层「调号」现值、S1 调号上方的原调、S3 简谱谱头、S4 字母谱；
//     M1 / M2（调号框、谱头面板、转调菜单）= 写的是谱上调号这个数据本身，不经过任何换法（这里钉：那几个文件不碰换到 C 的函数）。
//     F1–F4（文件、剪贴板、诊断日志、mp3 标签）另有守卫：look-habits（存文件碰不到习惯）、E2E habits-card（换习惯存出来逐条目一样）。
//   · 换法只有一份：src/score/view-in-c.ts（toC / trackInC / drawnPitch）；别处不许自己算「换到 C」。
import { describe, it, eq, assert } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readdirSync(u: URL): string[]; statSync(u: URL): { isDirectory(): boolean }; readFileSync(u: URL, e: "utf8"): string };
import { initState, setMark, setInputKey, tr, withTrack, TPQ, type EditorState, type Token } from "../src/score/song.ts";
import { setViewInC } from "../src/score/song-view.ts";
import { noteName, type Pitch } from "../src/score/pitch.ts";
import { drawnPitch } from "../src/score/view-in-c.ts";
import { createPadMusic } from "../src/app/pad-music.ts";
import { engrave } from "../src/render/engrave.ts";
import { printOpts } from "../src/export/score-pdf.ts";
import { createTextMeasure } from "../src/render/text/index.ts";
import { keyParts } from "../src/render/jianpu/keytext.ts";
import { letterParts } from "../src/render/jianpu/glyphs.ts";
import type { KeyFace } from "../src/keyboard/pad.ts";

const ROOT = new URL("../", import.meta.url);
const code = (f: string) => fs.readFileSync(new URL(f, ROOT), "utf8").replace(/(^|\s)\/\*[\s\S]*?\*\//g, "$1").split("\n").map((l: string) => l.replace(/(^|\s)\/\/.*$/, "")).join("\n");
function* walk(dir: string): Generator<string> { for (const f of fs.readdirSync(new URL(`${dir}/`, ROOT))) { const p = `${dir}/${f}`; if (fs.statSync(new URL(p, ROOT)).isDirectory()) yield* walk(p); else if (/\.ts$/.test(f)) yield p; } }
const T = (f: KeyFace): string => ("name" in f ? f.name : `${f.acc ?? ""}${f.deg}`);
const Eb: EditorState = setMark(initState(), 0, { kind: "key", fifths: -3 });
const pad = (st: EditorState, inC: boolean) => createPadMusic(() => st, () => 4, () => inC);
const keyOf = (m: ReturnType<typeof pad>, small: string) => [...Array(30).keys()].map((i) => i - 10).find((i) => T(m.cell(i).small) === small || T(m.cell(i).big) === small)!;

describe("给人看的音名 · 照眼前的谱写", () => {
  const m = pad(Eb, true), k = keyOf(m, "E♭4");
  it("K1 键上大字 = 谱上会画成的名字（drawnPitch + 音名出口）", () => eq(T(m.cell(k).big), noteName(drawnPitch({ step: "E", alter: -1, octave: 4 }, -3), 4)));
  it("K3 升降滑出来的那个音的大字同一条规矩", () => eq(T(m.altered(k, 1).big), noteName(drawnPitch({ step: "E", alter: 0, octave: 4 }, -3), 4)));
  it("K4 音域旋钮用的 = 两头那两个键的大字（cell().big）；没开移调辅助 = 实际的", () => { eq(T(m.cell(k).big), "C4"); eq(T(pad(Eb, false).cell(k).big), "E♭4"); });
  it("S5 鬼音符和键上的字是同一个换法（score-view 的鬼音符走 drawnPitch）", () => {
    const sv = code("src/ui/score-view.ts");
    assert(/inC \? drawnPitch\(p0, fifths\)/.test(sv), "score-view 的鬼音符要走 drawnPitch");
  });
  it("S8 点和弦字的候选小表：根音名跟着谱换到 C 调（读法在排版换到 C 之后算）", () => {
    let id = 500; const n = (step: string, alter = 0, chord?: Pitch[]): Token => ({ kind: "note", id: id++, pitch: { step, alter, octave: 4 }, ...(chord ? { chord } : {}), dur: TPQ, lyric: null }) as unknown as Token;
    const toks = [...tr(Eb).slice(0, 3), n("B", -1, [{ step: "G", alter: 0, octave: 4 }, { step: "E", alter: -1, octave: 4 }] as Pitch[])];
    const st = { ...Eb, song: withTrack(Eb.song, Eb.at.paper, Eb.at.part, toks) };
    const meas = createTextMeasure((s: string, px: number) => s.length * px * 0.6), parts = [{ id: st.at.part, name: "", first: true }];
    const on = engrave(setViewInC(st, true).song, printOpts(setViewInC(st, true).song, 10, parts, meas, true)).chordTags[0]?.read.best.name;
    const off = engrave(st.song, printOpts(st.song, 10, parts, meas, true)).chordTags[0]?.read.best.name;
    eq(off, "E♭"); eq(on, "C", "开着移调辅助：E♭ 大三和弦画成 C 大三和弦，根音名写 C");
  });
});

describe("和弦写法：后缀只有一份，两处用（谱上「根音」写法的字、候选小表的根音名；统筹 5068622f）", () => {
  let id = 700;
  const P = (step: string, octave: number, alter = 0): Pitch => ({ step: step as Pitch["step"], alter, octave });
  const chordNote = (ps: Pitch[]): Token => ({ kind: "note", id: id++, pitch: ps[0], chord: ps.slice(1), dur: TPQ, lyric: null }) as unknown as Token;
  const layout = (fifths: number, chords: Pitch[][], style: "degree" | "root", inC = false) => {
    let st = setMark(initState(), 0, { kind: "key", fifths });
    st = { ...st, song: { ...withTrack(st.song, st.at.paper, st.at.part, [...tr(st).slice(0, 3), ...chords.map(chordNote)]), chordTagStyle: style } };
    if (inC) st = setViewInC(st, true);
    const L = engrave(st.song, printOpts(st.song, 10, [{ id: st.at.part, name: "", first: true }], createTextMeasure((x: string, px: number) => x.length * px * 0.6), true));
    return { tags: L.prims.filter((q) => q.t === "text" && /chord-tag/.test(q.cls ?? "")).map((q) => (q.t === "text" ? q.s : "")), reads: L.chordTags.map((c) => c.read) };
  };
  // 和弦从高到低写：pitch = 最高的，chord = 其余
  const Bb7 = [P("A", 4, -1), P("F", 4), P("D", 4), P("B", 3, -1)], Fsm7b5 = [P("E", 5), P("C", 5), P("A", 4), P("F", 4, 1)], G7B = [P("F", 5), P("D", 5), P("G", 4), P("B", 3)], G69 = [P("E", 5), P("A", 4), P("D", 4), P("B", 3), P("G", 3)];
  it("根音写法：谱上的字 = 候选小表的根音名（同一个读法的 name）", () => {
    const r = layout(-1, [Bb7, Fsm7b5, G7B], "root");
    eq(r.tags.length, 3); r.tags.forEach((t, i) => eq(t.split(" / ")[0], r.reads[i]!.best.name, `第 ${i + 1} 个`));
  });
  it("交付要看的几个：B♭7、F♯m7♭5、G7/B；六九写 69（G69、V69），斜线只表示转位", () => {
    eq(layout(-1, [Bb7], "root").tags[0]!.split(" / ")[0], "B♭7");
    eq(layout(0, [Fsm7b5], "root").tags[0]!.split(" / ")[0], "F♯m7♭5");
    eq(layout(0, [G7B], "root").tags[0]!.split(" / ")[0], "G7/B");
    const g69 = layout(0, [G69], "root").reads[0]!, d69 = layout(0, [G69], "degree");
    assert(g69.all.some((g) => g.name === "G69") && !g69.all.some((g) => g.name.includes("6/9")), g69.all.map((g) => g.name).join(","));
    assert(d69.reads[0]!.all.some((g) => g.label === "V69"), d69.reads[0]!.all.map((g) => g.label).join(","));
  });
  it("级数写法照旧（IV7…）；开着移调辅助时根音照换到 C 调之后的写", () => {
    eq(layout(-1, [Bb7], "degree").tags[0]!.split(" / ")[0], "IV7", "F 大调里 B♭7 = IV7");
    eq(layout(-1, [Bb7], "root", true).tags[0]!.split(" / ")[0], "F7", "F 大调的 B♭7 换到 C 调 = F7");
    eq(layout(-1, [Bb7], "degree", true).tags[0]!.split(" / ")[0], "IV7", "级数换不换调都一样");
  });
});

describe("给人看的音名 · 永远写实际的", () => {
  const m = pad(Eb, true), k = keyOf(m, "E♭4");
  it("K2 小字（含升降滑时）= 实际的", () => { eq(T(m.cell(k).small), "E♭4"); eq(T(m.altered(k, 1).small), "E4"); });
  it("K5「1=」旋钮和滚轮、K7 符号层「调号」现值 = 实际的调", () => {
    assert(m.keyChoices().name.includes("1=E♭"), m.keyChoices().name); eq(m.keyDrum().keys.items[m.keyDrum().keys.index], "1=E♭"); eq(m.marksHere().key, "E♭");
  });
  it("K6「手动」那句写实际的调（谱降 E、键盘手动 1=G）", () => {
    const g = pad(setInputKey(Eb, 1), true), t = (g.keyChoices().tags ?? []).find((x) => x.text === "手动");
    assert(!!t && t.title.includes("1=E♭") && t.title.includes("1=G"), t?.title ?? "没挂");
  });
  it("S1 调号上方写的原调、S3 简谱谱头、S4 字母谱 = 实际的", () => {
    const st = setViewInC(Eb, true), L = engrave(st.song, printOpts(st.song, 10, [{ id: st.at.part, name: "", first: true }], createTextMeasure((s: string, px: number) => s.length * px * 0.6), true));
    assert(L.prims.some((q) => q.t === "text" && /key-label/.test(q.cls ?? "") && q.s === "1=E♭"), "调号上方写 1=E♭");
    const kp = keyParts(-3, false, 0, 4); eq(`${kp.pre}${kp.acc}${kp.letter}`, "1=♭E");
    const lp = letterParts({ step: "E", alter: -1, octave: 4 }, 4); eq(`${lp.letter}${lp.acc}${lp.oct}`, "E♭4");
  });
  it("M1 / M2 和存文件那一层不碰换到 C 的函数；换到 C 只在 view-in-c.ts", () => {
    for (const f of ["src/ui/mark-editor.ts", "src/app/header-panel.ts", "src/format/project.ts", "src/format/musicxml.ts", "src/score/clipboard.ts"]) assert(!/\b(toC|drawnPitch|trackInC|songInC)\b/.test(code(f)), `${f} 碰了换到 C`);
    const bad = [...walk("src")].filter((f) => f !== "src/score/view-in-c.ts" && /\btoC\(/.test(code(f)));
    eq(bad.join(","), "", "toC 只许在 view-in-c.ts 里调");
  });
});
