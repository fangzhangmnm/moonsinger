// 渐强渐弱（< >）：编辑 + 力度水平怎么过渡（MIDI 力度 / dB）+ MusicXML 原生 <wedge> 往返。created 2026-10-08 by Claude Opus 5.5
// user「mp mf 大于小于号这种，可以preliminary的控制力度」「力度就是velocity」。终点 = 被连到的那个音前面写的力度记号，没写 = 走一档；过渡完停在那儿。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, writeDegree, select, tr, toggleWedgeSel, toggleWedgeBefore, wedgeStateSel, type NoteTok, type Token, type EditorState } from "../src/score/song.ts";
import { dynLevels, noteVelocities, gainSegments } from "../src/score/perform.ts";
import { DYNAMICS_DB, DYNAMICS_VEL, ACCENT_VEL, MARCATO_VEL, MARCATO_DB, ARTICULATION, MARK_DEFAULTS } from "../src/format/performance.ts";
const WEDGE_STEP_VEL = MARK_DEFAULTS.wedgeStepVel;
import { writeMusicXml, readMusicXml } from "../src/format/musicxml.ts";
import { apply } from "../src/score/commands.ts";

const meta = { software: "test", date: "2026-10-08" };
const info = { id: "P1", name: "Vocals", instrumentName: "月读", sound: "voice.vocals", program: 55 };
function four(): EditorState { let st = initState(); st = { ...st, input: { ...st.input, unit: 3 } }; for (const d of [1, 2, 3, 4]) st = writeDegree(st, d, "near"); return st; }
const noteIdx = (toks: Token[]) => toks.flatMap((t, i) => (t.kind === "note" ? [i] : []));
const dyn = (v: "mp" | "f" | "pp") => ({ kind: "dyn", id: 900, value: v }) as Token;
const sv = { dynamicsDb: { ...DYNAMICS_DB }, staccatoGate: ARTICULATION.staccatoGate, accentDb: ARTICULATION.accentDb, marcatoDb: MARCATO_DB, dynamicsVel: { ...DYNAMICS_VEL }, accentVel: ACCENT_VEL, marcatoVel: MARCATO_VEL };
/** 四个四分音符，前面一个 mp；前两个标渐强（= 从第 1 个到第 3 个）；end = 第 3 个前面写的终点记号（不给 = 没写）。 */
function cresc(end?: "f" | "pp"): Token[] {
  const st = toggleWedgeSel(select(four(), noteIdx(tr(four()))[0], noteIdx(tr(four()))[1] + 2), "cresc");
  const toks = tr(st).slice(), [a, , c] = noteIdx(toks);
  if (end) toks.splice(c, 0, dyn(end));
  toks.splice(a, 0, dyn("mp"));
  return toks;
}

describe("渐强渐弱：编辑", () => {
  it("选中三个音 = 前两个往下一个渐强；再点 = 去掉；换成渐弱 = 换掉", () => {
    let st = four(); const [a, , c] = noteIdx(tr(st));
    st = toggleWedgeSel(select(st, a, c + 1), "cresc");
    eq(JSON.stringify(noteIdx(tr(st)).map((i) => (tr(st)[i] as NoteTok).wedge ?? null)), `["cresc","cresc",null,null]`);
    eq(wedgeStateSel(st, "cresc"), "all");
    st = toggleWedgeSel(st, "dim"); eq((tr(st)[a] as NoteTok).wedge, "dim", "换成渐弱");
    st = toggleWedgeSel(st, "dim"); eq((tr(st)[a] as NoteTok).wedge, undefined, "都是 = 去掉");
  });
  it("符号层：光标前那个音往下一个；前面没有音 = null", () => {
    const st = toggleWedgeBefore(four(), "dim")!;
    eq((tr(st)[noteIdx(tr(st)).at(-1)!] as NoteTok).wedge, "dim");
    eq(toggleWedgeBefore(initState(), "cresc"), null);
  });
});

describe("渐强渐弱：力度怎么过渡（dynLevels）", () => {
  it("有终点记号：mp → f 线性过渡，按音头的时刻；过渡完停在终点", () => {
    const toks = cresc("f"), L = dynLevels(toks, undefined, DYNAMICS_VEL, 80, WEDGE_STEP_VEL), [a, b, c, d] = noteIdx(toks);
    eq(L.get(a)!.at0, 64); eq(L.get(b)!.at0, 80); eq(L.get(c)!.at0, 96); eq(L.get(d)!.at0, 96, "停在 f");
  });
  it("没写终点 = 走一档（+16）；停在那儿直到下一个力度记号", () => {
    const toks = cresc(), L = dynLevels(toks, undefined, DYNAMICS_VEL, 80, WEDGE_STEP_VEL), [a, b, c, d] = noteIdx(toks);
    eq(L.get(a)!.at0, 64); eq(L.get(b)!.at0, 72); eq(L.get(c)!.at0, 80); eq(L.get(d)!.at0, 80);
  });
  it("力度（SoundFont）= 每个音按音头取；dB 那一路在一个音里面也走（月读一个长音能渐强）", () => {
    const toks = cresc("f"), V = noteVelocities(toks, undefined, sv, 80 / 127), [a, b, c] = noteIdx(toks);
    eq(Math.round(V.get(a)! * 127), 64); eq(Math.round(V.get(b)! * 127), 80); eq(Math.round(V.get(c)! * 127), 96);
    const { dynamicsVel: _v, ...dbSpec } = sv, g = gainSegments(toks, undefined, dbSpec)!;
    const inA = g.filter((x) => x.t1 <= 0.67 && x.dB > -100).map((x) => x.dB);   // 90 bpm 一拍 0.667 s：第一个音里面
    assert(inA.length > 1 && inA[inA.length - 1] > inA[0], "第一个音里面 dB 往上走");
    eq(gainSegments(toks, undefined, sv), null, "有力度表 = 音量曲线不再管力度（不双算）");
  });
});

describe("渐强渐弱：MusicXML（<wedge>）", () => {
  it("往返：头一个前面 crescendo、被连到的那个前面 stop；读回来一样", () => {
    const toks = cresc("f"), w = writeMusicXml({ parts: [{ info, tokens: toks }] }, meta);
    eq((w.xml.match(/<wedge type="crescendo"/g) ?? []).length, 1); eq((w.xml.match(/<wedge type="stop"/g) ?? []).length, 1);
    const back = readMusicXml(w.xml, { manualBars: w.manualBars, unwritten: w.unwritten }).parts[0].tokens.filter((t) => t.kind === "note");
    eq(JSON.stringify(back.map((t) => (t as NoteTok).wedge ?? null)), `["cresc","cresc",null,null]`);
  });
  it("一直渐弱到谱尾：结尾补 stop（不留没收的 <wedge>）", () => {
    const st = toggleWedgeBefore(four(), "dim")!, w = writeMusicXml({ parts: [{ info, tokens: tr(st) }] }, meta);
    eq((w.xml.match(/<wedge type="diminuendo"/g) ?? []).length, 1); eq((w.xml.match(/<wedge type="stop"/g) ?? []).length, 1);
  });
});

describe("力度记号（pad 符号层；user「mp mf 在哪里加啊」）", () => {
  it("光标处放一个 mp，光标挪到它后面（接着写的音归它管）；再点 mp = 去掉", () => {
    let st = four(); const n0 = tr(st).length;
    st = apply(st, { k: "dyn", v: "mp" });
    eq(tr(st).length, n0 + 1); eq(tr(st)[st.caret - 1].kind, "dyn", "光标在力度记号后面");
    st = writeDegree(st, 5, "near");
    eq(tr(st).at(-2)!.kind, "dyn", "接着写的音在 mp 后面");
    st = { ...st, caret: st.caret - 1 }; st = apply(st, { k: "dyn", v: "mp" });
    eq(tr(st).filter((t) => t.kind === "dyn").length, 0, "那儿已经是 mp = 去掉");
  });
});
