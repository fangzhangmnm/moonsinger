// 剪贴板（纯函数）：复制 / 剪切 / 粘贴 / 全选 + 简谱文字来回。created 2026-10-08 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
const deq = (a: unknown, b: unknown, msg?: string) => eq(JSON.stringify(a), JSON.stringify(b), msg);
import { initState, writeDegree, writeRest, writeBar, select, tr, TPQ, type NoteTok } from "../src/score/song.ts";
import { copyTokens, cutTokens, pasteTokens, selectAll, toJianpu, fromJianpu, toDegree, fromDegree } from "../src/score/clipboard.ts";

function song(): ReturnType<typeof initState> {
  let st = initState();
  for (const d of [1, 2, 3]) st = writeDegree(st, d, "near");
  st = writeRest(st); st = writeBar(st); st = writeDegree(st, 5, "near");
  return st;
}
describe("clipboard", () => {
  it("复制选中、贴到光标处：id 重编、光标到贴的末尾", () => {
    let st = song();
    st = select(st, 3, 5);   // 1 2（谱头三个记号之后）
    const toks = copyTokens(st)!;
    eq(toks.length, 2);
    st = { ...st, sel: null, caret: tr(st).length };
    const n0 = tr(st).length, st2 = pasteTokens(st, toks);
    eq(tr(st2).length, n0 + 2); eq(st2.caret, n0 + 2); eq(st2.sel, null);
    const ids = tr(st2).map((t) => t.id); eq(new Set(ids).size, ids.length);
    assert(st2.nextId > st.nextId, "nextId 往前走");
  });
  it("有选中时贴 = 替换选中", () => {
    let st = song();
    st = select(st, 3, 6);   // 1 2 3
    const toks = copyTokens(st)!.slice(0, 1);
    const st2 = pasteTokens(st, toks);
    eq(tr(st2).length, tr(st).length - 2); eq(st2.caret, 4);
  });
  it("剪切 = 复制 + 删掉，光标留在原处", () => {
    let st = song(); st = select(st, 3, 5);
    const r = cutTokens(st)!;
    eq(r.toks.length, 2); eq(tr(r.st).length, tr(st).length - 2); eq(r.st.caret, 3); eq(r.st.sel, null);
  });
  it("全选 = 谱头之后到末尾", () => {
    const st = selectAll(song());
    deq(st.sel, { from: 3, to: tr(st).length });
  });
  it("简谱文字：音级 / 八度 / 升降 / 时值 / 休止 / 小节线 / 歌词 来回一致", () => {
    const st = song(); const toks = tr(st).slice(3);
    (toks[0] as NoteTok).lyric = "さ"; (toks[1] as NoteTok).lyric = "ku"; (toks[1] as NoteTok).hyph = true;
    const text = toJianpu(toks, 0);
    eq(text, "1_/さ 2_/ku- 3_ 0_ | 5_");
    const back = fromJianpu(text, 0)!;
    deq(back.map((t) => t.kind), toks.map((t) => t.kind));
    deq(back.map((t) => (t.kind === "note" ? [t.pitch, t.dur, t.lyric, !!t.hyph] : t.kind === "rest" ? t.dur : 0)), toks.map((t) => (t.kind === "note" ? [t.pitch, t.dur, t.lyric, !!t.hyph] : t.kind === "rest" ? t.dur : 0)));
  });
  it("简谱：G 大调里的 F♯ 是调内音 7；升降相对调内；八度点；横线加四分；附点", () => {
    const d = toDegree({ step: "F", alter: 1, octave: 5 }, 1);   // G 大调 F#5 = 7（高八度？G4 为 1 → F#5 = 7，不升）
    deq(d, { degree: 7, shift: 0, acc: 0 });
    deq(fromDegree(7, 0, 0, 1), { step: "F", alter: 1, octave: 5 });
    deq(fromDegree(1, 1, 0, 0), { step: "C", alter: 0, octave: 5 });
    deq(fromDegree(3, 0, -1, 0), { step: "E", alter: -1, octave: 4 });
    const t = fromJianpu("1 - 3. 5__ b7, 1'", 0)!;
    deq(t.map((x) => (x.kind === "note" ? x.dur : -1)), [TPQ * 2, TPQ * 1.5, TPQ / 4, TPQ, TPQ]);
    deq((t[3] as NoteTok).pitch, { step: "B", alter: -1, octave: 3 }); deq((t[4] as NoteTok).pitch, { step: "C", alter: 0, octave: 5 });
    eq(toJianpu(t, 0), "1 - 3. 5__ b7, 1'");
  });
  it("简谱：读不懂的词 = 整段不认（别把聊天当谱）", () => {
    eq(fromJianpu("hello world", 0), null); eq(fromJianpu("", 0), null); eq(fromJianpu("1 2 wat", 0), null);
  });
});

describe("复制 / 剪切带上第一个音身上的记号（2026-10-08 深夜，user「复制一段歌的时候第一个音头上的力度符号没被选进来」）", () => {
  it("选区从第一个音开始：它前面紧挨着的力度 / 渐强渐弱跟着进剪贴板；剪切也一起走；前面的小节线不带", async () => {
    const { initState, writeDegree, tr, select } = await import("../src/score/song.ts");
    const { apply } = await import("../src/score/commands.ts");
    const { copyTokens, cutTokens } = await import("../src/score/clipboard.ts");
    let st = initState(); for (const d of [1, 2, 3]) st = writeDegree(st, d, "near");
    st = apply(st, { k: "dyn", v: "f" });   // f 落在第三个音前面
    const toks = tr(st), third = toks.length - 1;
    eq(toks[third - 1].kind, "dyn");
    const sel = select(st, third, third + 1);
    eq(JSON.stringify(copyTokens(sel)!.map((t) => t.kind)), JSON.stringify(["dyn", "note"]));
    const cut = cutTokens(sel)!;
    eq(tr(cut.st).some((t) => t.kind === "dyn"), false, "剪切 = 力度记号一起走");
    eq(JSON.stringify(cut.toks.map((t) => t.kind)), JSON.stringify(["dyn", "note"]));
  });
});
