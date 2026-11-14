// 长短旋钮的档（note-values.ts，键盘这一轮 v1「带附点的档」）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）
// 设计 = ai-docs/20261113-keyboard-round-design.md 第三节：表里每一行 = 一条测试；随机拍号写出来的每一档都是合法时值；
//   光标走过拍号，选着的长短不变（不在表上 = 插进去）；/2 在不带附点的档上和原来一样；带附点的档不连音。
import { describe, it, eq } from "./runner.mjs";
import { lenSteps, lenChoices, stepLen, halfLen, lenName, lenGlyph, lenLabel } from "../src/score/note-values.ts";
import { TPQ, WHOLE, MIN_DUR, initState, tr, headLen, withTrack, setLen, setTuplet, shorter, longer, unitDur, type Token, type EditorState } from "../src/score/song.ts";

const deq = (a: unknown, b: unknown, msg?: string) => eq(JSON.stringify(a), JSON.stringify(b), msg);
const W = WHOLE, P = { "32": W / 32, "16": W / 16, "8": W / 8, "4": W / 4, "2": W / 2, "1": W }, D = (x: number) => x * 1.5;
const PLAIN6 = [P["32"], P["16"], P["8"], P["4"], P["2"], P["1"]];

describe("长短旋钮的档：设计稿那张表逐行", () => {
  const rows: [string, number, number, number[]][] = [
    ["4/4 不变", 4, 4, PLAIN6], ["2/2 不变", 2, 2, PLAIN6], ["5/4 不变", 5, 4, PLAIN6],
    ["3/4", 3, 4, [P["32"], P["16"], P["8"], P["4"], P["2"], D(P["2"])]],
    ["6/8", 6, 8, [P["32"], P["16"], P["8"], P["4"], D(P["4"]), D(P["2"])]],
    ["9/8", 9, 8, [P["32"], P["16"], P["8"], P["4"], D(P["4"])]],
    ["12/8", 12, 8, [P["32"], P["16"], P["8"], P["4"], D(P["4"]), D(P["2"]), D(P["1"])]],
    ["3/8", 3, 8, [P["32"], P["16"], P["8"], P["4"], D(P["4"])]],
    ["6/4", 6, 4, [P["32"], P["16"], P["8"], P["4"], P["2"], D(P["2"]), D(P["1"])]],
    ["3/2", 3, 2, [...PLAIN6, D(P["1"])]],
    ["2/4 没有全音符", 2, 4, PLAIN6.slice(0, 5)], ["7/8 没有全音符", 7, 8, PLAIN6.slice(0, 5)],
  ];
  for (const [name, b, t, want] of rows) it(name, () => deq(lenSteps(b, t), want, name));
});

describe("长短旋钮的档：别的规矩", () => {
  it("随机拍号：每一档都是合法时值（整数 tick、不短于最短的、不比一小节长、都有名字有图）", () => {
    let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    for (let n = 0; n < 300; n++) {
      const beats = 1 + Math.floor(rnd() * 16), beatType = [1, 2, 4, 8, 16, 32][Math.floor(rnd() * 6)];
      const s = lenSteps(beats, beatType), bar = (beats * W) / beatType;
      for (const L of s) {
        eq(Number.isInteger(L) && L >= MIN_DUR && L <= Math.max(bar, P["32"]), true, `${beats}/${beatType}: ${L}`);
        eq(lenName(L) !== null && lenGlyph(L) !== "" && lenLabel(L) !== "", true, `${beats}/${beatType}: ${L} 有名字`);
      }
      deq([...s].sort((a, b) => a - b), s, "短 → 长");
    }
  });
  it("选着的长短不在这个拍号的表上 = 按长短插进去；在 = 原样", () => {
    deq(lenChoices(lenSteps(4, 4), D(P["4"])), [P["32"], P["16"], P["8"], P["4"], D(P["4"]), P["2"], P["1"]]);
    deq(lenChoices(lenSteps(6, 8), D(P["4"])), lenSteps(6, 8));
  });
  it("8 / 9 沿表走：不在表上 = 往那个方向最近的一档；到头 = null", () => {
    const s = lenSteps(4, 4);
    eq(stepLen(s, D(P["4"]), 1), P["2"]); eq(stepLen(s, D(P["4"]), -1), P["4"]);
    eq(stepLen(s, P["1"], 1), null); eq(stepLen(s, P["32"], -1), null);
    eq(stepLen(lenSteps(6, 8), P["4"], 1), D(P["4"]), "6/8 里四分往长 = 附点四分");
  });
  it("/2 在不带附点的档上和原来一样（长度减半，最短的减不了）；带附点的减半还带附点", () => {
    for (let k = 1; k < 6; k++) eq(halfLen(PLAIN6[k]), PLAIN6[k - 1]);
    eq(halfLen(P["32"]), null); eq(halfLen(D(P["4"])), D(P["8"]));
  });
  it("人话名 / 图", () => {
    eq(lenLabel(D(P["4"])), "附点四分"); eq(lenLabel(P["8"]), "八分");
    eq(lenGlyph(D(P["4"])), lenGlyph(P["4"]) + "");
  });
});

describe("输入状态：长短 = 多长（不再是第几档）", () => {
  // 一条只有谱头的 track，拍号换成 b/t
  const withTime = (st: EditorState, beats: number, beatType: number): EditorState => {
    const t = tr(st), h = t.slice(0, headLen(t)).map((x) => (x.kind === "time" ? { ...x, beats, beatType } : x)) as Token[];
    return { ...st, song: withTrack(st.song, st.at.paper, st.at.part, [...h, ...t.slice(headLen(t))]) };
  };
  it("6/8：四分往长一档 = 附点四分，再往长 = 附点二分（一小节）", () => {
    let st = withTime(initState(), 6, 8); st = { ...st, caret: tr(st).length };
    st = setLen(st, P["4"]); st = longer(st); eq(st.input.len, D(P["4"])); st = longer(st); eq(st.input.len, D(P["2"])); eq(longer(st), st, "到头不动");
    st = shorter(shorter(st)); eq(st.input.len, P["4"]);
  });
  it("带附点的档：连音清掉、设不上；写出来的时值 = 1.5 倍", () => {
    let st = setTuplet(initState(), 3); eq(st.input.tuplet, 3);
    st = setLen(st, D(P["4"])); eq(st.input.tuplet, 0); eq(setTuplet(st, 3), st);
    eq(unitDur(st.input), TPQ * 1.5);
  });
});
