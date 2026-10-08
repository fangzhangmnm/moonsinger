// 有选区时 pad 别的键 = 整组（C）：长短旋钮 = 整组改时值（并显示选区的时值）、0 = 整组变休止、叠 = 每个音都叠。created 2026-10-08 by Claude Fable 5.1
// user 2026-10-08「其他键用C没问题」（选区 + 音键的替换模式另议）。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, writeDegree, select, setCaret, setSelDur, selUnit, restSel, writeRest, stackPitch, shorter, tr, headLen, TPQ, type EditorState, type NoteTok } from "../src/score/song.ts";
import { pitchName } from "../src/score/pitch.ts";

const E = TPQ / 2, H = 3;
const show = (st: EditorState) => tr(st).slice(headLen(tr(st))).map((t) => t.kind === "note" ? `${t.pitch ? pitchName(t.pitch) : "?"}${t.chord ? "+" + t.chord.map(pitchName).join("+") : ""}/${t.dur / E}` : t.kind === "rest" ? `r/${t.dur / E}` : t.kind).join(" ");
function four(): EditorState { let st = initState(); for (const d of [1, 2, 3, 4]) st = writeDegree(st, d, "near"); return setCaret(st, tr(st).length); }   // 注意 escape() = 选中上一个音，不是清选区

describe("有选区：整组（C）", () => {
  it("长短旋钮：选中的都改成拨到的那一档；选区留着；没选 = 原样", () => {
    let st = select(four(), H, H + 3);
    st = setSelDur(st, 3);   // 四分
    eq(show(st), "C4/2 D4/2 E4/2 F4/1");
    eq(JSON.stringify(st.sel), JSON.stringify({ from: H, to: H + 3 }), "选区留着");
    const clear = { ...st, sel: null }; eq(setSelDur(clear, 1), clear, "没选区 = 原样");
  });
  it("selUnit：都一样才报那一档；长短不一 / 没选 = null", () => {
    const st = four();
    eq(selUnit(select(st, H, H + 4)), 2, "都是八分 = 2");
    eq(selUnit(st), null);
    let m = select(st, H, H + 1); m = shorter(m); m = select(m, H, H + 2);   // 第一个减半 → 混
    eq(selUnit(m), null);
  });
  it("「0」有选中 = 都变成同样长的休止（叠音 / 歌词没了）；选区留着", () => {
    let st = select(four(), H + 1, H + 3);
    st = writeRest(st);
    eq(show(st), "C4/1 r/1 r/1 F4/1");
    eq(JSON.stringify(st.sel), JSON.stringify({ from: H + 1, to: H + 3 }));
  });
  it("叠：有选中 = 每个音都叠这个音（XOR）；休止跳过；选区留着", () => {
    const g = { step: "G" as const, alter: 0, octave: 4 };
    let st = select(four(), H, H + 2);
    st = stackPitch(st, g);
    const a = tr(st)[H] as NoteTok, b = tr(st)[H + 1] as NoteTok;
    assert(!!a.chord?.length && !!b.chord?.length, "两个音都叠了");
    eq(JSON.stringify(st.sel), JSON.stringify({ from: H, to: H + 2 }));
    st = stackPitch(st, g);   // 再叠一次 = 取消（XOR）
    assert(!(tr(st)[H] as NoteTok).chord && !(tr(st)[H + 1] as NoteTok).chord, "XOR 取消");
  });
});
