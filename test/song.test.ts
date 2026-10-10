// created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 重写（选中即改 / 光标即写、输入状态、本次输入记录）
import { describe, it, eq } from "./runner.mjs";
import {
  initState, emptySong, writeDegree, writeRest, writeBar, writeKey, extend, backspace, shorter, longer, setTuplet, tapAcc,
  setCaret, select, escape, moveCaret, setInputKey, barFill, keyAt, TPQ, type NoteTok, type EditorState,
  headLen, writeMark, deleteMark, setMark, timeline, tempoWord, TEMPO_WORDS, transposeSel, modulateSel, selectToEdge, alterTarget, tr, songOf, scaleSelDur } from "../src/score/song.ts";
import { toLabScore } from "../src/score/lab-score.ts";
import { parseMark } from "../src/score/marks.ts";
import { pitchName } from "../src/score/pitch.ts";

const E = TPQ / 2;   // 八分
const H = 3;         // 谱头：调号 / 拍号 / 速度三个记号
/** 谱头之后的 token（谱头不显示）。 */
const show = (st: EditorState) => tr(st).slice(headLen(tr(st))).map((t) => t.kind === "note" ? `${t.tie ? "~" : ""}${t.pitch ? pitchName(t.pitch) : "?"}/${t.dur / E}`
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
  // 2026-10-08 Opus：「/2」开着时拉长 = 半份（user「除2的时候拉长可以出附点吗」）；宿主的「/2」= 挪短一档（shorter）+ 拉长带 half
  it("「/2」+「−」= 加半份 → 附点；再写一个减半的音 = 附点八分 + 十六分；退格撤的是那半份", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = shorter(st);   // 八分，然后「/2」（挪短一档）
    st = extend(st, true); eq(show(st), "C4/1.5");   // 附点八分
    st = writeDegree(st, 2, "near"); eq(show(st), "C4/1.5 D4/0.5");   // 接十六分：凑满两份八分
    st = backspace(st); st = backspace(st); eq(show(st), "C4/1");
  });
  it("「/2」+「−」跨小节线 = tie 着的同音是半份", () => {
    let st = initState(); st = writeDegree(st, 5, "near"); st = writeBar(st); st = shorter(st); st = extend(st, true);
    eq(show(st), "G4/1 | ~G4/0.5");
  });
  it("没有「/2」的「−」照旧加一整份（不受挪过档位影响）", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = shorter(st); st = extend(st); eq(show(st), "C4/2");
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
    let st = initState(); st = setTuplet(st, 3); st = writeDegree(st, 1, "near"); eq((tr(st)[H] as NoteTok).dur, TPQ / 3);
  });
  it("「1=」只管输入：换了以后写进去的音不变；输入的调是输入设备自己的，不跟谱上的调号（2026-10-07 pad = 独立设备）", () => {
    let st = initState(); st = writeDegree(st, 4, "near"); st = setInputKey(st, 1); st = writeDegree(st, 7, "near");
    eq(show(st), "F4/1 F#4/1");
    st = setInputKey(st, 0); st = writeKey(st, -1); st = writeDegree(st, 4, "near");
    eq(show(st), "F4/1 F#4/1 K-1 F4/1"); eq(keyAt(tr(st), tr(st).length), -1); eq(st.input.inputFifths, 0);
  });
  it("光标后是空音高的音 → 数字填它（詞先），退格把它撤回成空", () => {
    const head = emptySong();
    let st = initState(songOf([...tr(initState(head)), { kind: "note", id: 4, pitch: null, dur: E, lyric: "う" }, { kind: "bar", id: 5 }, { kind: "note", id: 6, pitch: null, dur: E, lyric: "さ" }]));
    st = setCaret(st, H); st = writeDegree(st, 4, "near"); st = writeDegree(st, 6, "near");
    eq(show(st), "F4/1 | A4/1"); st = backspace(st); eq(show(st), "F4/1 | ?/1");
  });
  it("小节对账：只报不拦", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = writeBar(st); st = longer(st); st = longer(st); st = longer(st); st = writeDegree(st, 1, "near"); st = writeBar(st);
    const f = barFill(tr(st)); eq(f.length, 2); eq(f[0].full, false); eq(f[1].full, true);
  });
});

describe("song（改：选中）", () => {
  const base = () => { let st = initState(); for (const d of [1, 2, 3, 4]) st = writeDegree(st, d, "near"); return st; };
  it("选中一个音按数字 = 改这个音：XOR 叠上这一级（离它最近的那个），再按 = 拿掉（v0.10.5；原来是替换模式）", () => {
    let st = select(base(), H + 1, H + 2); st = writeDegree(st, 5, "near");
    eq(show(st), "C4/1 G4/1 E4/1 F4/1"); eq((tr(st)[H + 1] as NoteTok).chord?.map(pitchName).join(), "D4", "D4 留在和弦里（show 只印最上面那个）");   // D4 的 5 级：上面的 G4（5 个半音）比下面的 G3（7 个）近
    st = writeDegree(st, 5, "near"); eq(show(st), "C4/1 D4/1 E4/1 F4/1", "再按 = 拿掉");
    eq(JSON.stringify(st.sel), JSON.stringify({ from: H + 1, to: H + 2 }), "选区一直在它身上");
  });
  it("有选区按长短 = 只改输入档位（谱不动）；整组改时值走选区菜单 scaleSelDur", () => {
    let st = select(base(), H, H + 2); st = longer(st); eq(show(st), "C4/1 D4/1 E4/1 F4/1"); eq(st.input.unit, 3);
    st = scaleSelDur(st, 2); eq(show(st), "C4/2 D4/2 E4/1 F4/1"); eq(st.input.unit, 3);
  });
  it("选中按 ♯ = 选中的音直接升半音", () => {
    let st = select(base(), H + 2, H + 3); st = tapAcc(st, 1, 0); eq(show(st), "C4/1 D4/1 E#4/1 F4/1");
  });
  it("选中退格 = 删掉，变成那里的光标（写）", () => {
    let st = select(base(), H + 1, H + 3); st = backspace(st); eq(show(st), "C4/1 F4/1"); eq(st.sel, null); eq(st.caret, H + 1);
  });
  it("Esc = 选中光标前那个；只选一个时 ← = 换到前一个（v0.10.5：改一个音时 ← → 换邻居）；选好几个时 ← 收成左边的光标", () => {
    let st = escape(base()); eq(st.sel?.from, H + 3); st = moveCaret(st, -1); eq(st.sel?.from, H + 2);
    st = moveCaret(select(base(), H + 1, H + 3), -1); eq(st.sel, null); eq(st.caret, H + 1);
  });
});

describe("song（记号：调号 / 拍号 / 速度都是 token）", () => {
  it("新歌开头 = 谱头三个记号；光标进不去、退格删不掉、选不中", () => {
    let st = initState(); eq(tr(st).map((t) => t.kind).join(" "), "key time tempo"); eq(st.caret, H);
    st = setCaret(st, 0); eq(st.caret, H); st = backspace(st); eq(tr(st).length, H);
    st = select(st, 0, 2); eq(st.sel, null); eq(st.caret, H);
    eq(deleteMark(st, 0), st);
  });
  it("插记号：旁边连着的记号里有同类 → 改它（谱头就这样改），否则新插一个", () => {
    let st = initState(); let r = writeMark(st, { kind: "tempo", bpm: 120 });
    eq(r.fresh, false); eq(r.index, 2); eq(tr(r.st).length, H); eq(timeline(tr(r.st)).length, 0);
    st = writeDegree(r.st, 1, "near"); r = writeMark(st, { kind: "key", fifths: 2 }); eq(r.fresh, true); eq(r.index, H + 1);
    st = writeDegree(r.st, 2, "near"); eq(show(st), "C4/1 K2 D4/1");   // 输入的调不跟谱上的调号（1=C 的 2 = D）
  });
  it("中途记号能删；删了光标跟着挪", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = writeMark(st, { kind: "time", beats: 3, beatType: 4 }).st; st = writeDegree(st, 2, "near");
    eq(show(st), "C4/1 T3/4 D4/1"); st = deleteMark(st, H + 1); eq(show(st), "C4/1 D4/1"); eq(st.caret, H + 2);
  });
  it("改谱上的调号记号不动输入的「1=」（输入设备自己的调）", () => {
    let st = setInputKey(initState(), 3); st = setMark(st, 0, { kind: "key", fifths: -1 }); eq(st.input.inputFifths, 3); eq(keyAt(tr(st), H), -1);
  });
  it("速度分段：换速度以后的音按新速度算秒；Lab 换算成第一个速度下的八分数", () => {
    let st = initState(); st = writeDegree(st, 1, "near"); st = writeMark(st, { kind: "tempo", bpm: 180 }).st; st = writeDegree(st, 2, "near");
    const tl = timeline(tr(st)), near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
    eq(near(tl[0].t1, 60 / 90 / 2), true); eq(near(tl[1].t1 - tl[1].t0, 60 / 180 / 2), true);
    const lab = toLabScore(tr(st), st.song.hum); eq(lab.TEMPO_QUARTER, 90); eq(JSON.stringify(lab.SCORE.map((e) => e.notes[0][1])), "[1,0.5]");
  });
  it("小节对账跟着拍号记号走", () => {
    let st = initState(); st = writeMark(st, { kind: "time", beats: 3, beatType: 4 }).st;   // 改谱头
    st = longer(st); for (const d of [1, 2, 3]) st = writeDegree(st, d, "near"); st = writeBar(st);
    const f = barFill(tr(st)); eq(f[0].full, true);
  });
  it("小节线 XOR：光标紧挨在人插的「|」后面再按 = 去掉它；反复小节线不动（user「小节线应该也是xor，有时候误加的小节线一直删不掉」）", () => {
    let st = initState(); st = writeDegree(st, 1, "near");
    const n0 = tr(st).length;
    st = writeBar(st); eq(tr(st).length, n0 + 1); eq(tr(st)[st.caret - 1].kind, "bar");
    st = writeBar(st); eq(tr(st).length, n0, "再按一下 = 去掉"); eq(st.caret, n0); eq(tr(st)[st.caret - 1].kind, "note");
    st = writeBar(st); const i = st.caret - 1, toks = tr(st).slice(); toks[i] = { ...(toks[i] as { kind: "bar"; id: number }), repeat: "end" } as never;
    st = { ...st, song: { ...st.song, papers: st.song.papers.map((p) => ({ ...p, tracks: { ...p.tracks, [st.at.part]: toks } })) } };
    st = writeBar(st); eq(tr(st).filter((t) => t.kind === "bar").length, 2, "反复小节线后面再按 = 照常加一根");
  });
  it("记号框认得的写法", () => {
    eq(JSON.stringify(parseMark("key", "1=D")), '{"kind":"key","fifths":2}'); eq(parseMark("key", "bb")?.kind, "key");
    eq((parseMark("key", "B♭") as { fifths: number }).fifths, -2); eq((parseMark("key", "3b") as { fifths: number }).fifths, -3); eq((parseMark("key", "f#") as { fifths: number }).fifths, 6);
    eq(JSON.stringify(parseMark("time", "6/8")), '{"kind":"time","beats":6,"beatType":8}'); eq(parseMark("time", "3/5"), null);
    eq((parseMark("tempo", "Andante 76") as { bpm: number }).bpm, 76); eq((parseMark("tempo", "allegro") as { bpm: number }).bpm, 132); eq(parseMark("tempo", "5"), null);
    eq((parseMark("tempo", "400") as { bpm: number }).bpm, 400); eq(parseMark("tempo", "401"), null); eq((parseMark("tempo", "20") as { bpm: number }).bpm, 20); eq(parseMark("tempo", "19"), null);   // 和速度滚轮同一个范围（TEMPO_MIN / TEMPO_MAX）
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
    eq(show(st), "Bb3/1 D4/1 F4/1 A4/1"); eq(keyAt(tr(st), H), -2); eq(tr(st).length, H + 4);
  });
  it("Shift+Home / Shift+End：选到开头 / 末尾", () => {
    let st = four(); st = setCaret(st, H + 2); st = selectToEdge(st, 1); eq(JSON.stringify(st.sel), `{"from":${H + 2},"to":${H + 4}}`);
    st = setCaret(st, H + 2); st = selectToEdge(st, -1); eq(JSON.stringify(st.sel), `{"from":${H},"to":${H + 2}}`);
  });
});

// 升降 Shift 的 𝄪 / 𝄫（pad 升降键；user「上下滑动切换## # b bb，然后按是当作shift」）。edited by Claude Opus 5.5 2026-10-07
import { setAccState as _setAcc, tapAcc as _tapAcc, writePitch as _write, initState as _init } from "../src/score/song.ts";
describe("升降 Shift（±2）", () => {
  it("锁住 𝄫：写的都降两个半音；点一下 𝄪 = 只管下一个", () => {
    const C = { step: "C" as const, alter: 0, octave: 4 };
    let st = _setAcc(_init(), -2, "lock");
    st = _write(st, C); st = _write(st, C);
    st = _setAcc(st, 0, "off"); st = _tapAcc(st, 2, 0); st = _write(st, C); st = _write(st, C);
    eq(tr(st).filter((t) => t.kind === "note").map((t) => (t as { pitch: { alter: number } }).pitch.alter).join(","), "-2,-2,2,0");
  });
});

// 按谱上的调号简化拼写（2026-10-08 Opus；user「升降号的歧义导致的没有自动简化怎么办」——绿袖子：五个升号的调、pad 1=C 按 ♭ 写，满篇 ♭）
import { respellSel as _respell, select as _select } from "../src/score/song.ts";
describe("按调号拼写", () => {
  const spelled = (st: EditorState) => tr(st).filter((t) => t.kind === "note").map((t) => { const p = (t as NoteTok).pitch!; return `${p.step}${p.alter > 0 ? "#".repeat(p.alter) : "b".repeat(-p.alter)}${p.octave}`; }).join(" ");
  it("写的时候：调内的音用谱上调号的写法（A♭ → G♯），调外的照写（G♮），重升 / 重降不动", () => {
    let st = setMark(initState(), 0, { kind: "key", fifths: 5 });   // 谱：五个升号；pad 还是 1=C
    st = _tapAcc(st, -1, 0); st = writeDegree(st, 6, "near");   // ♭ + 6 = A♭ → G♯
    st = writeDegree(st, 5, "near");                            // 5 = G（调外）→ G♮ 照写
    st = _tapAcc(st, -1, 0); st = writeDegree(st, 3, "near");   // ♭ + 3 = E♭ → D♯
    st = _setAcc(st, 2, "once"); st = writeDegree(st, 4, "near");   // 𝄪 + 4 = F𝄪（有意的导音）→ 不动
    eq(spelled(st), "G#3 G3 D#3 F##3");
  });
  // user 2026-10-08「刚才那个是我移调之后没有自动匹配，不是写的时候出问题。因为我移了好几个调找听的对的」：
  //   半音移调不动调号（C 里往下移 = 一片 ♭）→ 再把调号改成听着对的调 → 音照旧拼法。现在改调号时它管的音跟着拼
  it("半音移调之后把调号改成听着对的那个：它管的音跟着按调号拼写（音高不变；调外的不动）", () => {
    let st = initState(); for (const d of [6, 7, 2, 5]) st = writeDegree(st, d, "near");   // C 里写 A B D G
    st = transposeSel(_select(st, H, H + 4), -1); st = escape(st);
    eq(spelled(st), "Ab3 Bb3 Db4 Gb4", "C 大调里往下移半音 = 调外音，按方向拼成 ♭");
    st = setMark(st, 0, { kind: "key", fifths: 5 });   // 听着对了：调号改成五个升号
    eq(spelled(st), "G#3 A#3 C#4 F#4");
    st = setMark(st, 0, { kind: "key", fifths: 0 });   // 改回 C：都是调外音 = 照现在的写法（不来回翻）
    eq(spelled(st), "G#3 A#3 C#4 F#4");
  });
  it("插一个调号：只管它后面到下一个调号为止的音", () => {
    let st = initState(); for (const d of [6, 6]) { st = _tapAcc(st, -1, 0); st = writeDegree(st, d, "near"); }   // A♭ A♭（C 里，调外照写）
    st = setCaret(st, H + 1); st = writeKey(st, 5);
    eq(spelled(st), "Ab3 G#3");
  });
  it("「按调号拼写」收拾别处来的：调号早就是五个升号、音却写成降号（旧文件 / 粘贴进来的）", () => {
    const ab = { kind: "note", pitch: { step: "A", alter: -1, octave: 4 }, dur: E, lyric: null }, d = { kind: "note", pitch: { step: "D", alter: -1, octave: 5 }, dur: E, lyric: null };
    const song = songOf([{ kind: "key", fifths: 5, id: 1 }, { kind: "time", beats: 4, beatType: 4, id: 2 }, { kind: "tempo", bpm: 90, id: 3 }, { ...ab, id: 4 }, { ...d, id: 5 }] as never, { title: "" });
    let st = initState(song);
    eq(spelled(st), "Ab4 Db5");
    st = _respell(_select(st, H, H + 2));
    eq(spelled(st), "G#4 C#5");
    eq(_respell(escape(st)), escape(st), "没选中 = 原样");
  });
});
