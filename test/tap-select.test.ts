// 轻点一个音 / 休止 = 选中它这一个；再点一下 = 收成它后面的光标（v0.17.54「乙」，src/score/song.ts tapTimed）。
// created 2026-11-14 by Claude Opus 5.5（MoonSinger小弟；设计稿 ai-docs/20261113-selection-rules-design.md 第五节；
//   user 2026-11-13「点一下音再按音键，是接着写，还是改它本身 应该是改吧」）。谱面上的接线只有 score-view tapNote 一处；按键怎么改选中的那一个 = 原来「只选了一个」那一列，不在这里测。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, select, setCaret, writePitch, singleSel, tapTimed, releaseSingle, tr, headLen, TPQ, songOf, type EditorState, type Token } from "../src/score/song.ts";
import { TAP_SELECTS } from "../src/ui/press-rules.ts";

const P = (step: "C" | "D" | "E") => ({ step, alter: 0, octave: 4 });
function song(): EditorState {   // 调 / 拍 / 速度 + C D 休止 E（四分）
  let id = 1;
  const toks: Token[] = [{ kind: "key", fifths: 0, id: id++ }, { kind: "time", beats: 4, beatType: 4, id: id++ }, { kind: "tempo", bpm: 90, id: id++ },
    { kind: "note", pitch: P("C"), dur: TPQ, lyric: null, id: id++ }, { kind: "note", pitch: P("D"), dur: TPQ, lyric: null, id: id++ },
    { kind: "rest", dur: TPQ, id: id++ }, { kind: "note", pitch: P("E"), dur: TPQ, lyric: null, id: id++ }] as Token[];
  return initState(songOf(toks, { title: "" }));
}
const where = (st: EditorState) => (st.sel ? `选 ${st.sel.from}–${st.sel.to}` : `光标 ${st.caret}`);

describe("轻点一个音 = 选中它这一个（乙）", () => {
  const st0 = song(), H = headLen(tr(st0)), C = H, D = H + 1, R = H + 2;
  it("现在的开关是乙", () => { eq(TAP_SELECTS, true); });
  it("光标在别处：点一个音 = 只选了它（之后按键 = 改它）", () => {
    const a = tapTimed(setCaret(st0, H), D, true);
    eq(where(a), `选 ${D}–${D + 1}`); eq(singleSel(a), D);
  });
  it("再点一下已经选中的这一个 = 收成它后面的光标；和「叠」键再按一下同一个结果", () => {
    const a = tapTimed(st0, D, true), b = tapTimed(a, D, true);
    eq(where(b), `光标 ${D + 1}`);
    eq(JSON.stringify(b), JSON.stringify(releaseSingle(a)), "再点 = releaseSingle");
  });
  it("选着一个、点另一个 = 换成选另一个；选着好几个、点一个 = 只选它", () => {
    eq(where(tapTimed(tapTimed(st0, C, true), D, true)), `选 ${D}–${D + 1}`);
    eq(where(tapTimed(select(st0, C, R + 1), D, true)), `选 ${D}–${D + 1}`);
  });
  it("休止也一样能点中选中", () => { const a = tapTimed(st0, R, true); eq(singleSel(a), R); eq(where(tapTimed(a, R, true)), `光标 ${R + 1}`); });
  it("甲（开关 false）= 光标到它后面，不选", () => {
    eq(where(tapTimed(st0, D, false)), `光标 ${D + 1}`);
    eq(where(tapTimed(tapTimed(st0, D, true), D, false)), `光标 ${D + 1}`);
  });
  it("写完一个音之后光标照旧在它后面，不自动选中刚写的", () => {
    const w = writePitch(setCaret(st0, tr(st0).length), P("C"));
    assert(!w.sel, "写完不选"); eq(w.caret, tr(w).length);
  });
  it("没选的时候收起 = 原样", () => { const s = setCaret(st0, H); eq(releaseSingle(s), s); });
});
