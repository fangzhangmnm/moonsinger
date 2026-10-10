// 渐到（2026-10-08 深夜 Opus 5.5）：力度记号上的「从上一个力度渐变过来」= 关键帧的线性插值，和手写的渐强渐弱分开管。
// user「渐到 同意，然后这个和手动加的可以分开来，行吗，这样好管理。其实就是有一个start位置和一开始就均匀插值的问题」「渐到 做」「如何不混淆的搞清楚<到底是哪里开始的？」
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, writeDegree, tr, setDynSel, editMarkAt, rampSource, TPQ, type Token, type EditorState } from "../src/score/song.ts";
import { dynLevels } from "../src/score/perform.ts";
import { DYNAMICS_VEL, MARK_DEFAULTS } from "../src/format/performance.ts";
import { writeMusicXml, readMusicXml } from "../src/format/musicxml.ts";
import { apply } from "../src/score/commands.ts";
import { engrave } from "../src/render/engrave.ts";

let nid = 4000;
const dyn = (v: "p" | "mp" | "mf" | "f", ramp = false) => ({ kind: "dyn", id: nid++, value: v, ...(ramp ? { ramp: true } : {}) }) as Token;
const pin = (dir: "cresc" | "dim") => ({ kind: "hairpin", id: nid++, dir }) as Token;
const note = () => ({ kind: "note", id: nid++, pitch: { step: "C", alter: 0, octave: 4 }, dur: TPQ, lyric: null }) as Token;
const line = (items: (Token | "n")[]): Token[] => [...tr(initState()).slice(0, 3), ...items.map((x) => (x === "n" ? note() : x))];
const notes = (toks: Token[]) => toks.flatMap((t, i) => (t.kind === "note" ? [i] : []));
const lv = (toks: Token[]) => { const L = dynLevels(toks, undefined, DYNAMICS_VEL, 80, MARK_DEFAULTS.wedgeStepVel); return notes(toks).map((i) => Math.round(L.get(i)!.at0)); };

describe("渐到：怎么渐", () => {
  it("p · · · 渐到 f：从 p 后面第一个音起，均匀变到 f 那个音的音头", () => {
    eq(JSON.stringify(lv(line([dyn("p"), "n", "n", "n", dyn("f", true), "n"]))), JSON.stringify([49, 65, 80, 96]));
  });
  it("中间有手写的渐强渐弱 = 手写的说了算（渐到不起作用）", () => {
    const toks = line([dyn("p"), "n", pin("dim"), "n", dyn("f", true), "n"]);
    eq(rampSource(toks, toks.findIndex((t) => t.kind === "dyn" && (t as { ramp?: true }).ramp)), "hairpin");
    const L = dynLevels(toks, undefined, DYNAMICS_VEL, 80, MARK_DEFAULTS.wedgeStepVel), [, nb, nc] = notes(toks);
    assert(L.get(nb)!.at1 < 49, "按手写的渐弱往下走（音头还是 p、这个音里往下）"); eq(Math.round(L.get(nc)!.at0), 96, "到 f 突变");
  });
  it("前面没有力度记号 = 不起作用（到那儿突变）", () => {
    const toks = line(["n", dyn("f", true), "n"]);
    eq(rampSource(toks, 4), "none"); eq(JSON.stringify(lv(toks)), JSON.stringify([80, 96]));
  });
  it("一串：p 渐到 mf 渐到 f", () => {
    eq(JSON.stringify(lv(line([dyn("p"), "n", "n", dyn("mf", true), "n", "n", dyn("f", true), "n"]))), JSON.stringify([49, 65, 80, 88, 96]));
  });
});

describe("渐到：存（MusicXML）", () => {
  const info = { id: "P1", name: "V", instrumentName: "月读", sound: "voice.vocals", program: 55 };
  it("写成上一个力度记号起的虚线 wedge（id ramp-…）；读回来还是渐到、不多出手写的渐强渐弱", () => {
    const toks = line([dyn("p"), "n", "n", dyn("f", true), "n"]), w = writeMusicXml({ parts: [{ info, tokens: toks }] }, { software: "t", date: "2026-10-08" });
    assert(/<wedge type="crescendo" number="1" line-type="dashed" id="ramp-\d+"\/>/.test(w.xml), "虚线 wedge");
    const back = readMusicXml(w.xml, { manualBars: w.manualBars, unwritten: w.unwritten }).parts[0].tokens.slice(3);
    eq(back.map((t) => (t.kind === "dyn" ? `${t.value}${(t as { ramp?: true }).ramp ? "~" : ""}` : t.kind[0])).join(" "), "p n n f~ n");
  });
  it("别家的虚线 wedge（没有 ramp- id）= 照旧是手写的渐强渐弱", () => {
    const xml = writeMusicXml({ parts: [{ info, tokens: line([dyn("p"), "n", "n", dyn("f", true), "n"]) }] }, { software: "t", date: "2026-10-08" }).xml.replace(/ id="ramp-\d+"/, "");
    eq(readMusicXml(xml).parts[0].tokens.filter((t) => t.kind === "hairpin").length, 1);
  });
});

describe("渐到：编辑 / 画", () => {
  it("符号层「渐到」+ f = 光标前那个音放 f 并且渐到；小菜单能开关", () => {
    let st: EditorState = initState(); for (const d of [1, 2, 3]) st = writeDegree(st, d, "near");
    st = setDynSel({ ...st, caret: 4 }, "p"); st = { ...st, caret: tr(st).length };
    st = apply(st, { k: "dyn", v: "f", ramp: true });
    const k = tr(st).findIndex((t) => t.kind === "dyn" && t.value === "f");
    eq((tr(st)[k] as { ramp?: true }).ramp, true);
    st = editMarkAt(st, k, { ramp: false }); eq((tr(st)[k] as { ramp?: true }).ramp, undefined);
  });
  it("画：渐到 = 虚线发夹（hairpin ramp）；一样高 = 不画", () => {
    const lay = (toks: Token[]) => { const st = initState(), song = { ...st.song, papers: st.song.papers.map((p) => ({ ...p, tracks: { [st.at.part]: toks } })) }; return engrave(song, { width: 600, sp: 10, at: st.at, caret: 0, sel: null, parts: [{ id: st.at.part, name: "V", empty: false, first: true, clef: "G", hidden: false, badges: [], mono: true }], measureLyric: (s: string) => s.length * 10 } as never).prims; };
    eq(lay(line([dyn("p"), "n", "n", dyn("f", true), "n"])).filter((p) => p.t === "path" && (p as { cls?: string }).cls === "hairpin ramp").length, 1);
    eq(lay(line([dyn("f"), "n", "n", dyn("f", true), "n"])).filter((p) => p.t === "path" && /ramp/.test((p as { cls?: string }).cls ?? "")).length, 0);
  });
  it("渐到的虚线：上下两条边的每一小段都在同一个 x 上（v0.10.26，user「蝌蚪的尾巴在打架」）", () => {
    const lay = (toks: Token[]) => { const st = initState(), song = { ...st.song, papers: st.song.papers.map((p) => ({ ...p, tracks: { [st.at.part]: toks } })) }; return engrave(song, { width: 600, sp: 10, at: st.at, caret: 0, sel: null, parts: [{ id: st.at.part, name: "V", empty: false, first: true, clef: "G", hidden: false, badges: [], mono: true }], measureLyric: (s: string) => s.length * 10 } as never).prims; };
    const pin = lay(line([dyn("p"), "n", "n", "n", "n", dyn("f", true), "n"])).find((p) => p.t === "path" && (p as { cls?: string }).cls === "hairpin ramp") as { d: string };
    const xs = [...pin.d.matchAll(/M([\d.-]+),/g)].map((m) => +m[1]);
    eq(xs.length >= 8 && xs.length % 2 === 0, true);   // 不止一段，而且成对
    for (let i = 0; i < xs.length; i += 2) eq(xs[i], xs[i + 1]);   // 上边那一小段和下边那一小段起点同一个 x
  });
});
