// created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 重写（选中即改 / 光标即写、输入状态、本次输入记录）
import { describe, it, eq } from "./runner.mjs";
import {
  initState, emptySong, writeDegree, writeRest, writeBar, writeKey, extend, backspace, shorter, longer, setTuplet, tapAcc,
  setCaret, select, escape, moveCaret, setInputKey, barFill, keyAt, TPQ, type NoteTok, type EditorState,
} from "../src/score/song.ts";
import { pitchName } from "../src/score/pitch.ts";

const E = TPQ / 2;   // 八分
const show = (st: EditorState) => st.song.tokens.map((t) => t.kind === "note" ? `${t.tie ? "~" : ""}${t.pitch ? pitchName(t.pitch) : "?"}/${t.dur / E}` : t.kind === "rest" ? `r/${t.dur / E}` : t.kind === "key" ? `K${t.fifths}` : "|").join(" ");

describe("song（写）", () => {
  it("默认八分；长短改的是下一个音，不回头改上一个", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = longer(st); st = writeDegree(st, 2, "near"); st = shorter(st); st = shorter(st); st = writeDegree(st, 3, "near");
    eq(show(st), "C4/1 D4/2 E4/0.5");
  });
  it("「−」= 刚写的音加一份它写入时的单位；改了档位也按写入时的算；下一个音照旧用当前档", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = extend(st); st = extend(st); st = extend(st); eq(show(st), "C4/4");   // 1--- = 4 份
    st = longer(st); st = extend(st); eq(show(st), "C4/5");   // 写入时是八分 → 还是加一个八分
    st = writeDegree(st, 2, "near"); eq(show(st), "C4/5 D4/2");
  });
  it("退格一笔一笔撤回：先撤「−」，再删音", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = extend(st); st = extend(st);
    st = backspace(st); eq(show(st), "C4/2"); st = backspace(st); eq(show(st), "C4/1"); st = backspace(st); eq(show(st), "");
  });
  it("「−」跨小节线 = 新开一个 tie 着的同音；退格先删它", () => {
    let st = initState(); st = writeDegree(st, 5, "near"); st = writeBar(st); st = extend(st); st = extend(st);
    eq(show(st), "G4/1 | ~G4/2"); st = backspace(st); st = backspace(st); eq(show(st), "G4/1 |");
  });
  it("挪光标 = 离开本次输入：记录清空，退格变成普通删除", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = extend(st); st = setCaret(st, 1);
    st = backspace(st); eq(show(st), "");
  });
  it("♯ Shift：点一下只管下一个音；350 ms 内连点两下锁住；再点解开", () => {
    let st = initState(); st = tapAcc(st, 1, 0); st = writeDegree(st, 4, "near"); st = writeDegree(st, 4, "near");
    eq(show(st), "F#4/1 F4/1");
    st = tapAcc(st, 1, 1000); st = tapAcc(st, 1, 1200); st = writeDegree(st, 1, "near"); st = writeDegree(st, 2, "near");
    eq(show(st), "F#4/1 F4/1 C#4/1 D#4/1"); st = tapAcc(st, 1, 3000); st = writeDegree(st, 3, "near"); eq(show(st).split(" ").pop(), "E4/1");
  });
  it("三连音：×⅔（八分三连 = ⅓ 拍）", () => {
    let st = initState(); st = setTuplet(st, 3); st = writeDegree(st, 1, "near"); eq((st.song.tokens[0] as NoteTok).dur, TPQ / 3);
  });
  it("「1=」只管输入：换了以后写进去的音不变；调号 token 之后输入跟新调", () => {
    let st = initState(); st = writeDegree(st, 4, "near"); st = setInputKey(st, 1); st = writeDegree(st, 7, "near");
    eq(show(st), "F4/1 F#4/1");
    st = setInputKey(st, null); st = writeKey(st, -1); st = writeDegree(st, 4, "near");
    eq(show(st), "F4/1 F#4/1 K-1 Bb4/1"); eq(keyAt(st.song, st.song.tokens.length), -1);
  });
  it("光标后是空音高的音 → 数字填它（詞先），退格把它撤回成空", () => {
    let st = initState({ ...emptySong(), tokens: [{ kind: "note", id: 1, pitch: null, dur: E, lyric: "う" }, { kind: "bar", id: 2 }, { kind: "note", id: 3, pitch: null, dur: E, lyric: "さ" }] });
    st = setCaret(st, 0); st = writeDegree(st, 4, "near"); st = writeDegree(st, 6, "near");
    eq(show(st), "F4/1 | A4/1"); st = backspace(st); eq(show(st), "F4/1 | ?/1");
  });
  it("小节对账：只报不拦", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = writeBar(st); st = longer(st); st = longer(st); st = longer(st); st = writeDegree(st, 1, "near"); st = writeBar(st);
    const f = barFill(st.song); eq(f.length, 2); eq(f[0].full, false); eq(f[1].full, true);
  });
});

describe("song（改：选中）", () => {
  const base = () => { let st = initState(); for (const d of [1, 2, 3, 4]) st = writeDegree(st, d, "near"); return st; };
  it("选中一个音按数字 = 覆盖音高、节奏不动、选中跳到下一个音", () => {
    let st = select(base(), 1, 2); st = writeDegree(st, 5, "near"); st = writeDegree(st, 6, "near");
    eq(show(st), "C4/1 G3/1 A3/1 F4/1"); eq(st.sel?.from, 3);   // 就近：C4 → 下面的 G3（3 级）比上面的 G4（4 级）近
  });
  it("选中改长短 = 选中的音减半 / 加倍；输入档位不变", () => {
    let st = select(base(), 0, 2); st = longer(st); eq(show(st), "C4/2 D4/2 E4/1 F4/1"); eq(st.input.unit, 2);
  });
  it("选中按 ♯ = 选中的音直接升半音", () => {
    let st = select(base(), 2, 3); st = tapAcc(st, 1, 0); eq(show(st), "C4/1 D4/1 E#4/1 F4/1");
  });
  it("选中退格 = 删掉，变成那里的光标（写）", () => {
    let st = select(base(), 1, 3); st = backspace(st); eq(show(st), "C4/1 F4/1"); eq(st.sel, null); eq(st.caret, 1);
  });
  it("Esc = 选中光标前那个；← 收成左边的光标", () => {
    let st = escape(base()); eq(st.sel?.from, 3); st = moveCaret(st, -1); eq(st.sel, null); eq(st.caret, 3);
  });
});
