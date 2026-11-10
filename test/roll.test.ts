// roll.test.ts —— 滚奏（v0.16.64，总表第 26 条）。created 2026-11-09 by Claude Opus 5.5
// user 11-07「标准滚奏记号 可以，但是要可以调整密度」、11-09「滚奏也许可以顺手做一下，然后设计可以下一个纪元」。
// 守：放的时候按密度敲满（连音线连过去的也算）、不认滚奏的照一个长音放；MusicXML 往返（单音颤音三道 = 滚奏，一两道不当滚奏）；谱上三道斜杠（全音符也有）；
//   默认密度按乐器（军鼓 20、镲 14、底鼓 12、别的鼓 16、有音高的 14）；乐器页调过的存得住、能回默认。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, writeDegree, select, toggleArtSel, tr, TPQ, withTrack, type Token, type NoteTok } from "../src/score/song.ts";
import { lightNotes } from "../src/engine/timeline.ts";
import { lightMarks, rollDefaultHz } from "../src/score/perform.ts";
import { writeMusicXml, readMusicXml } from "../src/format/musicxml.ts";
import { engrave } from "../src/render/engrave.ts";
import { spellMidi } from "../src/score/pitch.ts";
import { emptyExtras, withNewRole, withRollHz, activePerfSpec } from "../src/format/project.ts";
import { createTextMeasure } from "../src/render/text/index.ts";

const meta = { software: "test", date: "2026-11-09" };
const info = { id: "P1", name: "Snare", instrumentName: "军鼓", sound: "drum.snare-drum", program: 0 };
let id = 9700;
const n = (m: number, dur = TPQ, extra: Partial<NoteTok> = {}): Token => ({ kind: "note", id: id++, pitch: spellMidi(m, 0), dur, lyric: null, ...extra }) as Token;
const head = () => { const t = tr(initState()); return t.slice(0, 3); };
const marks = (hz?: number) => ({ staccatoGate: 0.5, breath: true, gapSec: 0, ...(hz ? { rollHz: () => hz } : {}) });

describe("滚奏：放", () => {
  it("一个二分音符（120 拍 = 1 秒）每秒 16 下 = 16 下、等长、头尾接上；不认滚奏（没给 rollHz）= 照一个长音", () => {
    const toks = [...head(), n(38, 2 * TPQ, { art: ["roll"] })], map = [{ tick: 0, bpm: 120 }] as never;
    const hits = lightNotes(toks, map, true, marks(16));
    eq(hits.length, 16);
    assert(Math.abs(hits[0]!.t0) < 1e-9 && Math.abs(hits[15]!.t1 - 1) < 1e-9, `0 → 1 秒（${hits[0]!.t0} → ${hits[15]!.t1}）`);
    assert(hits.every((h, k) => k === 0 || Math.abs(h.t0 - hits[k - 1]!.t1) < 1e-9), "一下接一下");
    eq(lightNotes(toks, map, true, marks()).length, 1, "不认滚奏 = 一个音");
  });
  it("连音线连过去的也算（两个四分连着 = 1 秒，敲满整段）；没标滚奏的音不受影响", () => {
    const toks = [...head(), n(38, TPQ, { art: ["roll"] }), n(38, TPQ, { tie: true, art: ["roll"] }), n(36, TPQ)], map = [{ tick: 0, bpm: 120 }] as never;
    const hits = lightNotes(toks, map, true, marks(10));
    eq(hits.filter((h) => h.midi === 38).length, 10); eq(hits.filter((h) => h.midi === 36).length, 1);
  });
  it("默认密度按乐器：军鼓 20、镲 14、底鼓 12、别的鼓 16、有音高的 14", () => {
    eq([38, 40, 49, 51, 36, 45].map((k) => rollDefaultHz(k)).join(","), "20,20,14,14,12,16"); eq(rollDefaultHz(null), 14);
  });
  it("乐器页调过的存进演奏者（可选字段）、能回默认", () => {
    let ex = withNewRole(emptyExtras(), "r1", "n");
    eq(activePerfSpec(ex, "r1").rollHz, null, "没调过 = null（按乐器默认）");
    ex = withRollHz(ex, "r1", 24, "n"); eq(activePerfSpec(ex, "r1").rollHz, 24);
    ex = withRollHz(ex, "r1", 99, "n"); eq(activePerfSpec(ex, "r1").rollHz, 40, "封顶");
    ex = withRollHz(ex, "r1", null, "n"); eq(activePerfSpec(ex, "r1").rollHz, null, "回默认 = 字段拿掉");
  });
});

describe("滚奏：写谱 / MusicXML / 画", () => {
  it("符号键盘那一下 = 光标前那个音带上滚奏；再点 = 去掉", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); const i = tr(st).findIndex((t) => t.kind === "note");
    st = toggleArtSel(select(st, i, i + 1), "roll"); assert((tr(st)[i] as NoteTok).art?.includes("roll") ?? false, "带上了");
    st = toggleArtSel(select(st, i, i + 1), "roll"); assert(!((tr(st)[i] as NoteTok).art ?? []).includes("roll"), "去掉了");
  });
  it("MusicXML 往返：写成 <tremolo type=\"single\">3</tremolo>、读回来是滚奏；一两道斜线（按拍子重复）不当滚奏、说出来", () => {
    const toks = [...head(), n(60, 4 * TPQ, { art: ["roll"] })], w = writeMusicXml({ parts: [{ info, tokens: toks }] }, meta);
    assert(/<ornaments><tremolo type="single">3<\/tremolo><\/ornaments>/.test(w.xml), "写了颤音");
    const r = readMusicXml(w.xml, { manualBars: w.manualBars, unwritten: w.unwritten });
    assert(r.parts[0]!.tokens.some((t) => t.kind === "note" && (t.art ?? []).includes("roll")), "读回来是滚奏");
    const two = readMusicXml(w.xml.replace('<tremolo type="single">3</tremolo>', '<tremolo type="single">2</tremolo>'));
    assert(!two.parts[0]!.tokens.some((t) => t.kind === "note" && (t.art ?? []).includes("roll")), "两道不当滚奏");
    assert(Object.keys(two.dropped).length > 0, "不认的说出来");
  });
  it("谱上：带滚奏的音画三道斜杠（有符干 = 在符干上；全音符 = 符头上方）；不带的不画", () => {
    const st = initState(), lay = (items: Token[]) => engrave(withTrack(st.song, st.at.paper, st.at.part, [...head(), ...items]), { width: 600, sp: 10, at: st.at, parts: [{ id: st.at.part, name: "V", empty: false, first: true, clef: "G", hidden: false, badges: [], mono: false }], measure: createTextMeasure((s: string) => s.length * 8) } as never);
    const rolls = (L: ReturnType<typeof lay>) => L.prims.filter((p) => p.t === "path" && /(^|\s)roll(\s|$)/.test(p.cls ?? ""));
    eq(rolls(lay([n(72, 2 * TPQ, { art: ["roll"] }), n(72, 2 * TPQ)])).length, 3, "二分音符：三道");
    eq(rolls(lay([n(72, 4 * TPQ, { art: ["roll"] })])).length, 3, "全音符：三道");
    eq(rolls(lay([n(72, 2 * TPQ), n(72, 2 * TPQ)])).length, 0, "不带的不画");
  });
});
