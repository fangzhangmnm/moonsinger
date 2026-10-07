// created 2026-10-06 by Claude Opus 5.5
import { describe, it, eq } from "./runner.mjs";
import { initState, emptySong, writeDegree, writeRest, writeBar, halve, double, extendBeat, toggleDot, backspace, setCaret, barFill, TPQ, type NoteTok } from "../src/score/song.ts";
import { pitchName } from "../src/score/pitch.ts";

const notes = (st: ReturnType<typeof initState>) => st.song.tokens.map((t) => t.kind === "note" ? `${t.pitch ? pitchName(t.pitch) : "?"}/${t.dur}` : t.kind === "rest" ? `r/${t.dur}` : "|").join(" ");

describe("song", () => {
  it("今天下雨明天也下雨：新音和上一个一样长，第一个一拍", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = halve(st); st = writeDegree(st, 2, "near"); st = writeRest(st);
    eq(notes(st), `C4/${TPQ / 2} D4/${TPQ / 2} r/${TPQ / 2}`);
  });
  it("8 / 9 / - / . 只改刚打的那个音（跳过小节线）", () => {
    let st = initState(); st = writeDegree(st, 3, "near"); st = writeBar(st); st = double(st);
    eq(notes(st), `E4/${TPQ * 2} |`); st = extendBeat(st); eq(notes(st), `E4/${TPQ * 3} |`);
    st = initState(); st = writeDegree(st, 3, "near"); st = toggleDot(st); eq(notes(st), `E4/${TPQ * 1.5}`); st = toggleDot(st); eq(notes(st), `E4/${TPQ}`);
  });
  it("最短三十二分音符，再减半不动", () => { let st = initState(); st = writeDegree(st, 1, "near"); for (let k = 0; k < 6; k++) st = halve(st); eq(notes(st), `C4/${TPQ / 8}`); });
  it("在中间插：后面的音自动往后挪（插入点 = 光标）", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = writeDegree(st, 3, "near"); st = setCaret(st, 1); st = writeDegree(st, 2, "near");
    eq(notes(st), `C4/${TPQ} D4/${TPQ} E4/${TPQ}`); eq(st.caret, 2);
  });
  it("退格删光标前一个", () => { let st = initState(); st = writeDegree(st, 1, "near"); st = writeDegree(st, 2, "near"); st = backspace(st); eq(notes(st), `C4/${TPQ}`); });
  it("光标后是空音高的音 → 数字填它，不另插", () => {
    let st = initState({ ...emptySong(), tokens: [{ kind: "note", id: 1, pitch: null, dur: TPQ, lyric: "う" }, { kind: "bar", id: 2 }, { kind: "note", id: 3, pitch: null, dur: TPQ, lyric: "さ" }] });
    st = setCaret(st, 0); st = writeDegree(st, 4, "near"); st = writeDegree(st, 6, "near");
    eq(notes(st), `F4/${TPQ} | A4/${TPQ}`); eq((st.song.tokens[2] as NoteTok).lyric, "さ");
  });
  it("小节对账：只报不拦", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = writeBar(st); st = writeDegree(st, 1, "near"); st = double(st); st = double(st); st = writeBar(st);
    const f = barFill(st.song); eq(f.length, 2); eq(f[0].full, false); eq(f[1].full, true);
  });
});
