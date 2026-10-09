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
