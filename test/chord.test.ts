// 叠音（polyphony，2026-10-08）：XOR 叠 / 拿掉、最后一个留着、最高的当旋律线、移调带着叠音走、.mxl 来回、简谱文字。created 2026-10-08 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, writeDegree, toggleChordPitch, stackPitch, allPitches, withPitches, transposeSel, select, tr, firstTrack, type NoteTok } from "../src/score/song.ts";
import type { Pitch } from "../src/score/pitch.ts";
import { saveMxl, openBytes, emptyExtras } from "../src/format/project.ts";
import { toJianpu, fromJianpu } from "../src/score/clipboard.ts";
const P = (step: Pitch["step"], octave: number, alter = 0): Pitch => ({ step, alter, octave });
const deq = (a: unknown, b: unknown, msg?: string) => eq(JSON.stringify(a), JSON.stringify(b), msg);
describe("叠音", () => {
  it("叠 = XOR：加一个、再按同一个 = 拿掉；最后一个永远留着；最高的 = pitch", () => {
    let st = initState(); st = writeDegree(st, 1, "near");   // C4（HOME 附近）
    const i = tr(st).length - 1;
    st = toggleChordPitch(st, i, P("E", 4)); st = toggleChordPitch(st, i, P("G", 3));
    const t = tr(st)[i] as NoteTok;
    deq(t.pitch, P("E", 4)); deq(t.chord, [P("C", 4), P("G", 3)]);
    st = toggleChordPitch(st, i, P("E", 4)); deq((tr(st)[i] as NoteTok).pitch, P("C", 4)); deq((tr(st)[i] as NoteTok).chord, [P("G", 3)]);
    st = toggleChordPitch(st, i, P("G", 3)); eq((tr(st)[i] as NoteTok).chord, undefined, "只剩一个 = 不带 chord");
    st = toggleChordPitch(st, i, P("C", 4)); deq((tr(st)[i] as NoteTok).pitch, P("C", 4), "最后一个拿不掉");
  });
  it("stackPitch 叠到光标前那个音；同 midi 不同拼法 = 同一个", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = writeDegree(st, 3, "near");
    st = stackPitch(st, P("G", 4));
    const last = tr(st)[tr(st).length - 1] as NoteTok; deq(allPitches(last).map((p) => p.step + p.octave), ["G4", "E4"]);
    deq(withPitches(last, [P("C", 4), P("B", 3, 1)]).chord, undefined, "C4 和 B#3 同 midi：去重");
  });
  it("移调带着叠音一起走", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); const i = tr(st).length - 1;
    st = toggleChordPitch(st, i, P("E", 4)); st = select(st, i, i + 1); st = transposeSel(st, 2);
    deq(allPitches(tr(st)[i] as NoteTok).map((p) => p.step + (p.alter ? "#" : "") + p.octave), ["F#4", "D4"]);
  });
  it(".mxl 来回：<chord/> 写出去读回来一样；句号在 score.json 里来回", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = writeDegree(st, 5, "near");
    st = toggleChordPitch(st, 3, P("E", 4)); st = toggleChordPitch(st, 3, P("G", 4));
    const toks = tr(st).slice(); toks.splice(4, 0, { kind: "phrase", id: 99 });
    const song = { ...st.song, papers: [{ ...st.song.papers[0], tracks: { P1: toks } }] };
    const bytes = saveMxl({ song, hum: "n", extras: emptyExtras(), app: "test", date: "2026-10-08T00:00:00Z" });
    const o = openBytes("x.mxl", bytes), back = firstTrack(o.song);
    deq(back.map((t) => t.kind), ["key", "time", "tempo", "note", "phrase", "note"]);
    deq(allPitches(back[3] as NoteTok).map((p) => p.step + p.octave), ["G4", "E4", "C4"]);
    assert(!o.notices.length, "零提示");
  });
  it("简谱文字：1&3&5 来回", () => {
    const t = fromJianpu("5&3&1 2", 0)!;
    deq(allPitches(t[0] as NoteTok).map((p) => p.step + p.octave), ["G4", "E4", "C4"]);
    eq(toJianpu(t, 0), "5&3&1 2");
  });
});
