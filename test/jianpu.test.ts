// 简谱数字行（谱面分家第四刀；src/render/jianpu/、src/render/notations.ts）。created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟）。
//   这一份守画法本身（数字 / 八度点 / 下划线 / 谱种表怎么分行 / 点击框）；全量（每个 token 都有图元）、点击只指 token 的守卫在第四刀收尾时加。
import { describe, it, eq, assert } from "./runner.mjs";
import { engrave, type Prim } from "../src/render/engrave.ts";
import { createTextMeasure } from "../src/render/text/index.ts";
import { initState, TPQ, type Song, type Token } from "../src/score/song.ts";
import { setNotation } from "../src/score/song-view.ts";

const P = (step: "C" | "D" | "E" | "F" | "G" | "A" | "B", octave = 4, alter = 0) => ({ step, alter, octave });
/** 一条声部、给定的音（谱头照 initState）→ 简谱排一遍。 */
function lay(body: Omit<Token, "id">[], song?: (s: Song) => Song) {
  const st0 = initState(), part = st0.at.part, paper = st0.song.papers[0]!;
  let id = 1000; const toks = [...paper.tracks[part]!, ...body.map((t) => ({ ...t, id: id++ }) as Token)];
  let s: Song = { ...st0.song, papers: [{ ...paper, tracks: { ...paper.tracks, [part]: toks } }] };
  s = setNotation({ ...st0, song: s }, "jianpu").song; if (song) s = song(s);
  const L = engrave(s, { width: 900, sp: 10, locale: "zh", at: { paper: paper.id, part }, parts: [{ id: part, name: "V", first: true }], measure: createTextMeasure((x: string) => x.length * 8), autoBars: true });
  return { L, toks };
}
const digits = (ps: Prim[]) => ps.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text" && /jp-digit/.test(p.cls ?? "")).map((p) => p.s);
const n = (p: ReturnType<typeof P>, dur = TPQ, extra: object = {}) => ({ kind: "note", pitch: p, dur, lyric: null, ...extra }) as Omit<Token, "id">;

describe("简谱数字行", () => {
  it("谱种是简谱：有音高、没有叠音的声部排成数字行（行框带 kind: jianpu）；C 大调音阶 = 1–7、高八度的 1 带一个点；五线谱的行框不带 kind", () => {
    const { L } = lay(["C", "D", "E", "F", "G", "A", "B"].map((s) => n(P(s as "C"))).concat([n(P("C", 5))]));
    assert(L.systems.length > 0 && L.systems.every((r) => r.kind === "jianpu"), "都是数字行");
    eq(digits(L.prims).join(""), "12345671");
    assert(L.prims.filter((p) => p.t === "path" && /jp-dot/.test(p.cls ?? "")).length === 1, "高八度的 1 上一个点（八度基准 = 点最少：七个音在 0 组）");
  });
  it("叠音的声部照旧排五线谱的行（这一刀数字行只画单声部；同一张纸上两种行并排 = 过渡）", () => {
    const { L } = lay([n(P("E")), n(P("G"), TPQ, { chord: [P("C")] })]);
    assert(L.systems.every((r) => r.kind === undefined), "有叠音 = 五线谱的行");
  });
  it("下划线按拍连：两个八分在同一拍 = 一条；跨拍 = 断开；十六分 = 两层", () => {
    const e = TPQ / 2, s16 = TPQ / 4;
    const ul = (body: Omit<Token, "id">[]) => lay(body).L.prims.filter((p) => p.t === "line" && /jp-ul/.test(p.cls ?? "")).length;
    eq(ul([n(P("C"), e), n(P("D"), e)]), 1, "一拍里的两个八分 = 一条");
    eq(ul([n(P("C"), TPQ), n(P("D"), e), n(P("E"), e), n(P("F"), e), n(P("G"), e)]), 2, "两拍各一条");
    eq(ul([n(P("C"), s16), n(P("D"), s16), n(P("E"), e)]), 2, "十六分十六分八分 = 第一层一条 + 第二层一条");
  });
  it("点击框：每个音、休止各一个（音的 d = NaN：数字行没有「纵向 = 音高」，不提供竖着拖）；长音 = 数字 + 横线、几拍的休止一拍一个 0", () => {
    const { L, toks } = lay([n(P("C"), TPQ * 2), { kind: "rest", dur: TPQ * 2 } as Omit<Token, "id">]);
    const iC = toks.findIndex((t) => t.kind === "note"), iR = toks.findIndex((t) => t.kind === "rest");
    assert(L.notes.some((h) => h.index === iC && Number.isNaN(h.d)), "音的点击框");
    assert(L.rests.some((h) => h.index === iR), "休止的点击框");
    eq(digits(L.prims).join(""), "100", "二分音符 1 –、二分休止 0 0");
    assert(L.prims.some((p) => p.t === "line" && /jp-dash/.test(p.cls ?? "")), "长音后面的横线");
  });
});
