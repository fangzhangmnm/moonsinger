// 力度那一行一律在谱上面（2026-10-09 Opus 5.5；user「有没有歌词的时候强度符号都统一放谱子上面」）：
//   没歌词的声部、大谱表也是——以前没歌词写下面、大谱表写两条谱中间。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, withTrack, tr, setPartStaves, TPQ, type Token, type EditorState } from "../src/score/song.ts";
import { engrave } from "../src/render/engrave.ts";

let id = 7000;
const S = "CDEFGAB";
const n = (k: number, lyric: string | null = null, octave = 4): Token => ({ kind: "note", id: id++, pitch: { step: S[k % 7], alter: 0, octave }, dur: TPQ, lyric }) as Token;
const f = (): Token => ({ kind: "dyn", id: id++, value: "f" }) as Token;
const cresc = (): Token => ({ kind: "hairpin", id: id++, dir: "cresc" }) as Token;
function song(items: Token[], grand = false): EditorState {
  const st = initState(), s1 = { ...st, song: withTrack(st.song, st.at.paper, st.at.part, [...tr(st).slice(0, 3), ...items]) };
  return grand ? setPartStaves(s1, st.at.part, 2) : s1;
}
function check(st: EditorState, what: string) {
  const L = engrave(st.song, { width: 600, sp: 10, at: st.at, caret: 0, sel: null, parts: [{ id: st.at.part, name: "V", empty: false, first: true, clef: "G", hidden: false, badges: [], mono: false, ...(st.song.parts[0]!.staves ? { staves: 2 } : {}) }], measureLyric: (s: string) => s.length * 10 } as never);
  const top = Math.min(...L.systems.map((r) => r.staffTop));
  const dyn = L.prims.filter((p) => p.t === "glyph" && /\bdyn\b/.test((p as { cls?: string }).cls ?? "")) as { y: number }[];
  const pin = L.prims.filter((p) => p.t === "path" && /\bhairpin\b/.test((p as { cls?: string }).cls ?? "")) as { d: string }[];
  eq(dyn.length, 1, `${what}：画了一个 f`); assert(pin.length >= 1, `${what}：画了渐强`);
  assert(dyn[0]!.y < top, `${what}：f 的基线在最上面那条谱的第五线上方（${dyn[0]!.y} < ${top}）`);
  for (const p of pin) for (const y of (p.d.match(/-?\d+\.?\d*/g) ?? []).filter((_, i) => i % 2 === 1).map(Number)) assert(y < top, `${what}：渐强在谱上方（${y} < ${top}）`);
}
describe("力度那一行一律在谱上面", () => {
  it("没歌词的声部", () => check(song([f(), cresc(), n(0), n(1), n(2), n(3), f(), n(4)].slice(0, 6)), "没歌词"));
  it("有歌词的声部（照旧）", () => check(song([f(), cresc(), n(0, "あ"), n(1, "い"), n(2, "う"), n(3, "え")]), "有歌词"));
  it("大谱表 = 上面那条谱的上面（以前在两条谱中间）", () => check(song([f(), cresc(), n(0, null, 4), n(1, null, 3), n(2, null, 2), n(3, null, 5)], true), "大谱表"));
});

// 力度两道（2026-10-09，user「两道 可以」）：音的修饰（sfz / fp / 音内起伏）在里道、大的强弱线（字 / 发夹 / 渐到）在外道——同一个音上两样都有不再叠在一起。
describe("力度两道：音的修饰里道、大的强弱线外道", () => {
  const nn = (k: number, extra: Record<string, unknown>): Token => ({ ...(n(k) as object), ...extra }) as unknown as Token;
  const sw = (k: number, swell: string): Token => nn(k, { swell });
  const lay2 = (items: Token[]) => { const st = song(items); return engrave(st.song, { width: 600, sp: 10, at: st.at, caret: 0, sel: null, parts: [{ id: st.at.part, name: "V", empty: false, first: true, clef: "G", hidden: false, badges: [], mono: false }], measureLyric: (s: string) => s.length * 10 } as never); };
  const ys = (d: string) => (d.match(/-?\d+\.?\d*/g) ?? []).filter((_, i) => i % 2 === 1).map(Number);
  it("同一个音上 mf + 音内渐强：mf 在上面一道，小发夹在下面一道（以前叠在一起）", () => {
    const L = lay2([{ kind: "dyn", id: id++, value: "mf" } as Token, sw(0, "<"), n(1)]);
    const mf = L.prims.find((p) => p.t === "glyph" && /\bdyn\b/.test((p as { cls?: string }).cls ?? "")) as { y: number };
    const pin = L.prims.find((p) => p.t === "path" && /\bhairpin\b/.test((p as { cls?: string }).cls ?? "")) as { d: string };
    assert(Math.min(...ys(pin.d)) - mf.y >= 10, `小发夹整个在 mf 的基线下面至少一个间距（mf ${mf.y}，发夹 ${ys(pin.d).join(",")}）`);
  });
  it("同一个音上 f + sfz：sfz 在里道（更靠谱）", () => {
    const L = lay2([{ kind: "dyn", id: id++, value: "f" } as Token, nn(0, { art: ["sfz"] }), n(1)]);
    const g = L.prims.filter((p) => p.t === "glyph" && /\bdyn\b/.test((p as { cls?: string }).cls ?? "")) as { y: number; ch: string }[];
    const f = g.find((x) => x.ch !== "\u{E539}")!, sfz = g.find((x) => x.ch === "\u{E539}")!;
    assert(sfz && f && sfz.y - f.y >= 20, `sfz 比 f 低两个间距左右（f ${f?.y}，sfz ${sfz?.y}）`);
  });
  it("这一行只有音的修饰：就在最靠谱的那一道（不白占外道的高度）", () => {
    const a = lay2([sw(0, "<"), n(1)]), b = lay2([{ kind: "dyn", id: id++, value: "mf" } as Token, n(0), n(1)]);
    const pinY = Math.max(...ys((a.prims.find((p) => p.t === "path" && /\bhairpin\b/.test((p as { cls?: string }).cls ?? "")) as { d: string }).d));
    const mfY = (b.prims.find((p) => p.t === "glyph" && /\bdyn\b/.test((p as { cls?: string }).cls ?? "")) as { y: number }).y;
    assert(Math.abs(a.systems[0]!.staffTop - b.systems[0]!.staffTop) < 1 && pinY > mfY - 12, `只有修饰 = 同一个高度（谱顶 ${a.systems[0]!.staffTop} vs ${b.systems[0]!.staffTop}）`);
  });
});
