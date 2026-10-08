// 长按拖：歌词的字往前 / 往后挪（合 / 分）、力度记号 / 渐强渐弱挪到别的音上。created 2026-10-08 by Claude Opus 5.5
// user「歌词的合能不能也改成长按拖动。不然每次点文本框是超级麻烦的」；AI 提的手势（往左拖到前一个音 = 合，往右拖到后一个音 = 分开、空出来的音变成拖腔）user 说开工。
import { describe, it, eq } from "./runner.mjs";
import { initState, tr, withTrack, moveMark, editMarkAt, TPQ, type Token, type EditorState, type NoteTok } from "../src/score/song.ts";
import { moveSyllable, MELISMA_MARK, ELISION } from "../src/score/lyrics.ts";

let nid = 500;
const n = (lyric: string | null): Token => ({ kind: "note", id: nid++, pitch: { step: "C", alter: 0, octave: 4 }, dur: TPQ, lyric });
const phrase = (): Token => ({ kind: "phrase", id: nid++ }) as Token;
const dyn = (v: "p" | "mp" | "f"): Token => ({ kind: "dyn", id: nid++, value: v }) as Token;
const pin = (dir: "cresc" | "dim"): Token => ({ kind: "hairpin", id: nid++, dir }) as Token;
/** 谱头（调 / 拍 / 速度）+ items。 */
function song(items: Token[]): EditorState {
  const st = initState(), head = tr(st).slice(0, 3);
  return { ...st, song: withTrack(st.song, st.at.paper, st.at.part, [...head, ...items]), caret: 3 + items.length };
}
/** 歌词那一行（拖腔 = ー、没字 = _、句 = 。）。 */
const lyr = (st: EditorState) => tr(st).slice(3).map((t) => (t.kind === "phrase" ? "。" : t.kind === "note" ? (t.lyric === null ? "_" : t.lyric) : `[${t.kind}]`)).join(" ");
const at = (st: EditorState, k: number) => 3 + k;   // 第 k 个 item 的下标
const L = MELISMA_MARK;

describe("拖歌词：往后（分）", () => {
  it("往后一个音：字晚一个音起，后面的字推到第一个空位为止，空出来的音 = 拖腔", () => {
    const st = song([n("我"), n("爱"), n("你"), n(null), n("啊")]);
    const r = moveSyllable(st, at(st, 1), 1);
    eq(lyr(r.st), `我 ${L} 爱 你 啊`); eq(r.done, 1); eq(r.at, at(st, 2));
  });
  it("拖腔也是空位（被吃掉）；句首往后 = 空出来的音没字（没有可拖的）", () => {
    const st = song([n("我"), n("爱"), n(L), n("你")]);
    eq(lyr(moveSyllable(st, at(st, 0), 1).st), `_ 我 爱 你`);
  });
  it("往后两个音 = 走两步", () => {
    const st = song([n("我"), n("爱"), n(null), n(null)]);
    const r = moveSyllable(st, at(st, 1), 2);
    eq(lyr(r.st), `我 ${L} ${L} 爱`); eq(r.done, 2);
  });
  it("后面没有空位 / 是句尾 = 推不动（原样，done 不够）", () => {
    const st = song([n("我"), n("爱"), n("你")]);
    const r = moveSyllable(st, at(st, 1), 1);
    eq(r.st, st); eq(r.done, 0);
    const st2 = song([n("我"), n("爱"), phrase(), n(null)]);
    eq(moveSyllable(st2, at(st2, 1), 1).done, 0, "句号是边界");
  });
  it("一个音上几个字（合过的）= 只拿最后一个字往后挪（合的反操作）", () => {
    const st = song([n(`我${ELISION}爱`), n("你"), n(null)]);
    eq(lyr(moveSyllable(st, at(st, 0), 1).st), `我 爱 你`);
  });
  it("词没完（连字符）和手动语言跟着字走", () => {
    const toks: Token[] = [n("hap"), n("py"), n(null)];
    (toks[0] as NoteTok).hyph = true; (toks[1] as NoteTok).lang = "en";
    const st = song(toks), r = moveSyllable(st, at(st, 1), 1), out = tr(r.st);
    eq((out[at(st, 0)] as NoteTok).hyph, true); eq((out[at(st, 1)] as NoteTok).lyric, L); eq((out[at(st, 1)] as NoteTok).lang, undefined);
    eq((out[at(st, 2)] as NoteTok).lyric, "py"); eq((out[at(st, 2)] as NoteTok).lang, "en");
  });
});

describe("拖歌词：往前（合 / 早一个音起）", () => {
  it("前一个音有字 = 合（一个音上两个字，这一句后面的字往前挪）", () => {
    const st = song([n("我"), n("爱"), n("你"), n(null)]);
    const r = moveSyllable(st, at(st, 1), -1);
    eq(lyr(r.st), `我${ELISION}爱 你 _ _`); eq(r.at, at(st, 0));
  });
  it("前一个音是拖腔 / 空着 = 字早一个音起，原来那个音变成它的拖腔", () => {
    const st = song([n("我"), n(L), n("爱"), n("你")]);
    eq(lyr(moveSyllable(st, at(st, 2), -1).st), `我 爱 ${L} 你`);
  });
  it("往前两步：先挪进拖腔，再合；合了就停", () => {
    const st = song([n("我"), n(L), n("爱")]);
    const r = moveSyllable(st, at(st, 2), -3);
    eq(lyr(r.st), `我${ELISION}爱 ${L} _`); eq(r.done, 2);
  });
  it("隔着句号 = 不动", () => {
    const st = song([n("我"), phrase(), n("爱")]);
    eq(moveSyllable(st, at(st, 2), -1).done, 0);
  });
  it("往后再往前 = 回到能读的样子（字回到原来那个音起）", () => {
    const st = song([n("我"), n("爱"), n(null)]);
    const r1 = moveSyllable(st, at(st, 1), 1), r2 = moveSyllable(r1.st, r1.at, -1);
    eq(lyr(r2.st), `我 爱 ${L}`);
  });
});

describe("拖力度记号 / 渐强渐弱", () => {
  it("力度挪到后面一个音上；光标跟着同一个音", () => {
    const st = song([dyn("p"), n("a"), n("b"), n("c")]), toks = tr(st);
    const r = moveMark(st, at(st, 0), at(st, 2));
    eq(lyr(r.st), `a [dyn] b c`); eq(r.removed, 0); eq(r.st.caret, st.caret);
    eq(moveMark(st, at(st, 0), at(st, 1)).st, st, "挪到原来那个音 = 不动");
    void toks;
  });
  it("落到已经有力度记号的音上 = 挪过去的那个算数，原来那个湮灭", () => {
    const st = song([dyn("p"), n("a"), dyn("f"), n("b")]);
    const r = moveMark(st, at(st, 0), at(st, 3));
    eq(r.removed, 1); eq(JSON.stringify(tr(r.st).filter((t) => t.kind === "dyn").map((t) => (t as { value: string }).value)), `["p"]`);
  });
  it("力度放在那儿已有的渐强渐弱前面（mp < 的顺序）", () => {
    const st = song([dyn("mp"), n("a"), pin("cresc"), n("b"), dyn("f"), n("c")]);
    const r = moveMark(st, at(st, 0), at(st, 3));
    eq(lyr(r.st), `a [dyn] [hairpin] b [dyn] c`);
  });
  it("渐强挪到后面；挪到终点那个音上 = 排在力度记号后面、从那个音起到纸尾走一档", () => {
    const st = song([dyn("p"), pin("cresc"), n("a"), n("b"), dyn("f"), n("c")]);
    eq(lyr(moveMark(st, at(st, 1), at(st, 3)).st), `[dyn] a [hairpin] b [dyn] c`);
    const r = moveMark(st, at(st, 1), at(st, 5));
    eq(r.removed, 0, "f 后面还有 c：从 c 起到纸尾走一档"); eq(lyr(r.st), `[dyn] a b [dyn] [hairpin] c`);
  });
  it("小菜单：改力度 / 换方向 / 删掉", () => {
    const st = song([dyn("p"), pin("cresc"), n("a")]);
    eq((tr(editMarkAt(st, at(st, 0), { value: "f" }))[at(st, 0)] as { value: string }).value, "f");
    eq((tr(editMarkAt(st, at(st, 1), { dir: "dim" }))[at(st, 1)] as { dir: string }).dir, "dim");
    const d = editMarkAt(st, at(st, 0), null);
    eq(lyr(d), `[hairpin] a`); eq(d.caret, st.caret - 1);
  });
});
