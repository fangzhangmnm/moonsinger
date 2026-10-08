// 光标 / 退格的心智模型（2026-10-08，Claude Opus 5.5）：写音一层、符号一层。
// user「写音和符号：嗯简化的心智模型好」「多个非音记号会影响步进吗」「退格只删符号或者没符号的时候退一步，不删音符」
//   「大批量删音的时候会不会堆一堆强度符号…p f删第二个音，会变成，你觉得是p还是f?」「手动的「|」：属于写音层…同意」
import { describe, it, eq } from "./runner.mjs";
import { initState, tr, moveCaret, backspace, symBackspace, annihilate, TPQ, type Token, type EditorState, type NoteTok } from "../src/score/song.ts";

let nid = 700;
const note = (art?: NoteTok["art"]) => ({ kind: "note", id: nid++, pitch: { step: "C", alter: 0, octave: 4 }, dur: TPQ, lyric: null, ...(art ? { art } : {}) }) as Token;
const dyn = (v: "p" | "f" | "mp") => ({ kind: "dyn", id: nid++, value: v }) as Token;
const pin = () => ({ kind: "hairpin", id: nid++, dir: "cresc" }) as Token;
const bar = () => ({ kind: "bar", id: nid++ }) as Token;
const head = tr(initState()).slice(0, 3);
function stOf(items: Token[], caret?: number): EditorState {
  const base = initState(), toks = [...head, ...items];
  const song = { ...base.song, papers: base.song.papers.map((p) => ({ ...p, tracks: { ...p.tracks, [base.at.part]: toks } })) };
  return { ...base, song, caret: caret ?? toks.length, log: [] };
}
const show = (st: EditorState) => tr(st).slice(3).map((t) => (t.kind === "note" ? `n${(t.art ?? []).length ? `[${t.art!.join(",")}]` : ""}` : t.kind === "dyn" ? t.value : t.kind === "hairpin" ? "<" : t.kind === "bar" ? "|" : t.kind)).join(" ");

describe("← →：只停在音 / 休止 / 手动小节线后面（记号不单独占一步）", () => {
  it("A mp < B C：从尾巴往回 = B 后 → A 后（在 mp 前面）→ 谱头；往前 = 跳过记号", () => {
    let st = stOf([note(), dyn("mp"), pin(), note(), note()]);
    st = moveCaret(st, -1); eq(st.caret, 3 + 4, "C 前 = B 后");
    st = moveCaret(st, -1); eq(st.caret, 3 + 1, "A 后（mp、< 在光标后面，跟着 B）");
    st = moveCaret(st, -1); eq(st.caret, 3, "谱头后");
    st = moveCaret(st, 1); eq(st.caret, 4); st = moveCaret(st, 1); eq(st.caret, 3 + 4, "→ 跳过 mp <，到 B 后");
  });
  it("手动「|」是写音层的：占一步", () => {
    let st = stOf([note(), bar(), note()]);
    st = moveCaret(st, -1); eq(st.caret, 3 + 2, "| 后"); st = moveCaret(st, -1); eq(st.caret, 3 + 1, "A 后");
  });
});

describe("写音模式 ⌫：只删音 / 休止 / 小节线，记号留着；删完湮灭", () => {
  it("A mp B，光标在 B 后：删 B，mp 留着", () => {
    const st = backspace(stOf([note(), dyn("mp"), note()])); eq(show(st), "n mp");
  });
  it("p A f B C：删掉 B、A → 留 f（C 本来就在 f 下面），p 湮灭", () => {
    let st = stOf([dyn("p"), note(), dyn("f"), note(), note()], 3 + 4);   // 光标在 B 后
    st = backspace(st); eq(show(st), "p n f n");
    st = backspace(st); eq(show(st), "f n", "p 不再管任何音 = 湮灭");
  });
  it("mp < A f：删掉 A → < 和 mp 都不再管音，一起湮灭，留 f", () => {
    const st = backspace(stOf([dyn("mp"), pin(), note(), dyn("f")], 3 + 3)); eq(show(st), "f");
  });
  it("annihilate：中间有音的不动", () => { const t = [dyn("p"), note(), dyn("f"), note()]; eq(annihilate(t).removed.length, 0); });
});

describe("符号模式 ⌫：只删记号，没有就退一步，永远不删音", () => {
  it("光标前紧挨着的记号先删；然后是音上的装饰（从外到里）；都没有 = 退一步", () => {
    let st = stOf([note(), note(["staccato", "accent"]), dyn("mp")]);
    st = symBackspace(st); eq(show(st), "n n[staccato,accent]", "先删光标前的 mp");
    st = symBackspace(st); eq(show(st), "n n[staccato]", "再删音头（重音）");
    st = symBackspace(st); eq(show(st), "n n", "再删跳音");
    const c = st.caret; st = symBackspace(st); eq(show(st), "n n", "没有记号 = 不删音"); eq(st.caret < c, true, "光标往回一步");
  });
});
