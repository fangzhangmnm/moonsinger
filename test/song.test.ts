// created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 重写（选中即改 / 光标即写、输入状态、本次输入记录）
import { describe, it, eq } from "./runner.mjs";
import {
  initState, emptySong, writeDegree, writeRest, writeBar, writeKey, extend, backspace, shorter, longer, setTuplet, tapAcc,
  setCaret, select, escape, moveCaret, setInputKey, barFill, keyAt, TPQ, type NoteTok, type EditorState,
  headLen, writeMark, deleteMark, setMark, timeline, tempoWord, TEMPO_WORDS, transposeSel, modulateSel, selectToEdge, alterTarget,
} from "../src/score/song.ts";
import { toLabScore } from "../src/score/lab-score.ts";
import { parseMark } from "../src/score/marks.ts";
import { pitchName } from "../src/score/pitch.ts";

const E = TPQ / 2;   // 八分
const H = 3;         // 谱头：调号 / 拍号 / 速度三个记号
/** 谱头之后的 token（谱头不显示）。 */
const show = (st: EditorState) => st.song.tokens.slice(headLen(st.song.tokens)).map((t) => t.kind === "note" ? `${t.tie ? "~" : ""}${t.pitch ? pitchName(t.pitch) : "?"}/${t.dur / E}`
  : t.kind === "rest" ? `r/${t.dur / E}` : t.kind === "key" ? `K${t.fifths}` : t.kind === "time" ? `T${t.beats}/${t.beatType}` : t.kind === "tempo" ? `Q${t.bpm}` : "|").join(" ");

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
    let st = initState(); st = writeDegree(st, 1, "near"); st = extend(st); st = setCaret(st, H + 1);
    st = backspace(st); eq(show(st), "");
  });
  it("♯ Shift：点一下只管下一个音；350 ms 内连点两下锁住；再点解开", () => {
    let st = initState(); st = tapAcc(st, 1, 0); st = writeDegree(st, 4, "near"); st = writeDegree(st, 4, "near");
    eq(show(st), "F#4/1 F4/1");
    st = tapAcc(st, 1, 1000); st = tapAcc(st, 1, 1200); st = writeDegree(st, 1, "near"); st = writeDegree(st, 2, "near");
    eq(show(st), "F#4/1 F4/1 C#4/1 D#4/1"); st = tapAcc(st, 1, 3000); st = writeDegree(st, 3, "near"); eq(show(st).split(" ").pop(), "E4/1");
  });
  it("三连音：×⅔（八分三连 = ⅓ 拍）", () => {
    let st = initState(); st = setTuplet(st, 3); st = writeDegree(st, 1, "near"); eq((st.song.tokens[H] as NoteTok).dur, TPQ / 3);
  });
  it("「1=」只管输入：换了以后写进去的音不变；输入的调是输入设备自己的，不跟谱上的调号（2026-10-07 pad = 独立设备）", () => {
    let st = initState(); st = writeDegree(st, 4, "near"); st = setInputKey(st, 1); st = writeDegree(st, 7, "near");
    eq(show(st), "F4/1 F#4/1");
    st = setInputKey(st, 0); st = writeKey(st, -1); st = writeDegree(st, 4, "near");
    eq(show(st), "F4/1 F#4/1 K-1 F4/1"); eq(keyAt(st.song, st.song.tokens.length), -1); eq(st.input.inputFifths, 0);
  });
  it("光标后是空音高的音 → 数字填它（詞先），退格把它撤回成空", () => {
    const head = emptySong();
    let st = initState({ ...head, tokens: [...head.tokens, { kind: "note", id: 4, pitch: null, dur: E, lyric: "う" }, { kind: "bar", id: 5 }, { kind: "note", id: 6, pitch: null, dur: E, lyric: "さ" }] });
    st = setCaret(st, H); st = writeDegree(st, 4, "near"); st = writeDegree(st, 6, "near");
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
    let st = select(base(), H + 1, H + 2); st = writeDegree(st, 5, "near"); st = writeDegree(st, 6, "near");
    eq(show(st), "C4/1 G3/1 A3/1 F4/1"); eq(st.sel?.from, H + 3);   // 就近：C4 → 下面的 G3（3 级）比上面的 G4（4 级）近
  });
  it("选中改长短 = 选中的音减半 / 加倍；输入档位不变", () => {
    let st = select(base(), H, H + 2); st = longer(st); eq(show(st), "C4/2 D4/2 E4/1 F4/1"); eq(st.input.unit, 2);
  });
  it("选中按 ♯ = 选中的音直接升半音", () => {
    let st = select(base(), H + 2, H + 3); st = tapAcc(st, 1, 0); eq(show(st), "C4/1 D4/1 E#4/1 F4/1");
  });
  it("选中退格 = 删掉，变成那里的光标（写）", () => {
    let st = select(base(), H + 1, H + 3); st = backspace(st); eq(show(st), "C4/1 F4/1"); eq(st.sel, null); eq(st.caret, H + 1);
  });
  it("Esc = 选中光标前那个；← 收成左边的光标", () => {
    let st = escape(base()); eq(st.sel?.from, H + 3); st = moveCaret(st, -1); eq(st.sel, null); eq(st.caret, H + 3);
  });
});

describe("song（记号：调号 / 拍号 / 速度都是 token）", () => {
  it("新歌开头 = 谱头三个记号；光标进不去、退格删不掉、选不中", () => {
    let st = initState(); eq(st.song.tokens.map((t) => t.kind).join(" "), "key time tempo"); eq(st.caret, H);
    st = setCaret(st, 0); eq(st.caret, H); st = backspace(st); eq(st.song.tokens.length, H);
    st = select(st, 0, 2); eq(st.sel, null); eq(st.caret, H);
    eq(deleteMark(st, 0), st);
  });
  it("插记号：旁边连着的记号里有同类 → 改它（谱头就这样改），否则新插一个", () => {
    let st = initState(); let r = writeMark(st, { kind: "tempo", bpm: 120 });
    eq(r.fresh, false); eq(r.index, 2); eq(r.st.song.tokens.length, H); eq(timeline(r.st.song).length, 0);
    st = writeDegree(r.st, 1, "near"); r = writeMark(st, { kind: "key", fifths: 2 }); eq(r.fresh, true); eq(r.index, H + 1);
    st = writeDegree(r.st, 2, "near"); eq(show(st), "C4/1 K2 D4/1");   // 输入的调不跟谱上的调号（1=C 的 2 = D）
  });
  it("中途记号能删；删了光标跟着挪", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = writeMark(st, { kind: "time", beats: 3, beatType: 4 }).st; st = writeDegree(st, 2, "near");
    eq(show(st), "C4/1 T3/4 D4/1"); st = deleteMark(st, H + 1); eq(show(st), "C4/1 D4/1"); eq(st.caret, H + 2);
  });
  it("改谱上的调号记号不动输入的「1=」（输入设备自己的调）", () => {
    let st = setInputKey(initState(), 3); st = setMark(st, 0, { kind: "key", fifths: -1 }); eq(st.input.inputFifths, 3); eq(keyAt(st.song, H), -1);
  });
  it("速度分段：换速度以后的音按新速度算秒；Lab 换算成第一个速度下的八分数", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = writeMark(st, { kind: "tempo", bpm: 180 }).st; st = writeDegree(st, 2, "near");
    const tl = timeline(st.song), near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
    eq(near(tl[0].t1, 60 / 90 / 2), true); eq(near(tl[1].t1 - tl[1].t0, 60 / 180 / 2), true);
    const lab = toLabScore(st.song); eq(lab.TEMPO_QUARTER, 90); eq(JSON.stringify(lab.SCORE.map((e) => e.notes[0][1])), "[1,0.5]");
  });
  it("小节对账跟着拍号记号走", () => {
    let st = initState(); st = writeMark(st, { kind: "time", beats: 3, beatType: 4 }).st;   // 改谱头
    st = longer(st); for (const d of [1, 2, 3]) st = writeDegree(st, d, "near"); st = writeBar(st); st = writeBar(st);
    const f = barFill(st.song); eq(f[0].full, true);
  });
  it("记号框认得的写法", () => {
    eq(JSON.stringify(parseMark("key", "1=D")), '{"kind":"key","fifths":2}'); eq(parseMark("key", "bb")?.kind, "key");
    eq((parseMark("key", "B♭") as { fifths: number }).fifths, -2); eq((parseMark("key", "3b") as { fifths: number }).fifths, -3); eq((parseMark("key", "f#") as { fifths: number }).fifths, 6);
    eq(JSON.stringify(parseMark("time", "6/8")), '{"kind":"time","beats":6,"beatType":8}'); eq(parseMark("time", "3/5"), null);
    eq((parseMark("tempo", "Andante 76") as { bpm: number }).bpm, 76); eq((parseMark("tempo", "allegro") as { bpm: number }).bpm, 132); eq(parseMark("tempo", "5"), null);
  });
  it("速度词：每个词点下去给的数，推回来还是那个词", () => {
    for (const w of TEMPO_WORDS) eq(tempoWord(w.typical).it, w.it);
    eq(tempoWord(90).it, "Andante");
  });
});

describe("song（移调 / 转调）", () => {
  const four = () => { let st = initState(); for (const d of [1, 3, 5, 7]) st = writeDegree(st, d, "near"); return st; };   // C4 E4 G4 B4
  it("移调：选中的音按调重新拼写，调号不动", () => {
    let st = select(four(), H, H + 4); st = transposeSel(st, 1); eq(show(st), "C#4/1 F4/1 G#4/1 C5/1");
    st = transposeSel(st, -1); eq(show(st), "C4/1 E4/1 G4/1 B4/1");
  });
  it("Shift+↑ 半音按调拼写（E 升半音 = F）", () => {
    let st = initState(); st = writeDegree(st, 3, "near"); st = alterTarget(st, 1); eq(show(st), "F4/1");
  });
  it("转调：中间一段 C → D，开头插新调号、后面插回原调，选中跟着挪过的那段", () => {
    let st = four(); st = select(st, H + 1, H + 3); st = modulateSel(st, 2);
    eq(show(st), "C4/1 K2 F#4/1 A4/1 K0 B4/1"); eq(st.sel?.from, H + 2); eq(st.sel?.to, H + 4);
  });
  it("转调：从歌开头全选 = 改谱头，不插记号；音按音程拼写", () => {
    let st = four(); st = select(st, H, H + 4); st = modulateSel(st, -2);
    eq(show(st), "Bb3/1 D4/1 F4/1 A4/1"); eq(keyAt(st.song, H), -2); eq(st.song.tokens.length, H + 4);
  });
  it("Shift+Home / Shift+End：选到开头 / 末尾", () => {
    let st = four(); st = setCaret(st, H + 2); st = selectToEdge(st, 1); eq(JSON.stringify(st.sel), `{"from":${H + 2},"to":${H + 4}}`);
    st = setCaret(st, H + 2); st = selectToEdge(st, -1); eq(JSON.stringify(st.sel), `{"from":${H},"to":${H + 2}}`);
  });
});
