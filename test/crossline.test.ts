// 跨行的连音线 / 连音括号（2026-10-08 Opus 5.5；user「跨行的连音符显示不正常」）：连音线跨行 = 两半（这一行到行尾、下一行从行头）；
//   三连音组跨行 = 接着数（每组一个数字），这一行右边开口、下一行左边开口——以前到行尾就收组、下一行从头数，后面全错一组。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, withTrack, tr, TPQ, type Token, type EditorState } from "../src/score/song.ts";
import { engrave } from "../src/render/engrave.ts";

let id = 6000;
const S = "CDEFGAB";
const n = (dur: number, k: number, extra: Record<string, unknown> = {}): Token => ({ kind: "note", id: id++, pitch: { step: S[k % 7], alter: 0, octave: 5 }, dur, lyric: null, ...extra }) as Token;
function song(items: Token[], beats = 4): EditorState {
  const st = initState(), head = tr(st).slice(0, 3).map((t) => (t.kind === "time" ? { ...t, beats } : t)) as Token[];
  return { ...st, song: withTrack(st.song, st.at.paper, st.at.part, [...head, ...items]) };
}
const lay = (st: EditorState, width = 420) => engrave(st.song, { width, sp: 10, at: st.at, caret: 0, sel: null, parts: [{ id: "P1", name: "V", empty: false, first: true, clef: "G", hidden: false, badges: [], mono: true }], measureLyric: (s: string) => s.length * 10 } as never);

describe("三连音组跨行", () => {
  it("一个长小节（12/4，36 个三连八分）折好几行：每组一个数字（12 组 = 12 个「3」），组不错位", () => {
    let midGroup = 0;
    for (const w of [300, 340, 380, 420, 460, 520, 600]) {   // 几种行宽：总有在组中间折行的
      const L = lay(song(Array.from({ length: 36 }, (_, k) => n(TPQ / 3, k)), 12), w), sysOf = new Map(L.notes.map((x) => [x.index, x.system]));
      assert(new Set(sysOf.values()).size >= 2, `${w}：折成了好几行`);
      for (let g = 0; g < 12; g++) if (sysOf.get(3 + g * 3) !== sysOf.get(3 + g * 3 + 2)) midGroup++;
      eq(L.prims.filter((p) => p.t === "glyph" && (p as { cls?: string }).cls === "tuplet").length, 12, `${w}：12 组三连音 = 12 个数字`);
    }
    assert(midGroup > 0, "真的有组跨行（不然这条没测到）");
  });
});

describe("连音线跨行", () => {
  it("行尾的音连到下一行开头的音 = 两半（以前一条都不画）", () => {
    const items: Token[] = [];
    for (let k = 0; k < 40; k++) items.push(n(TPQ, k));
    const L0 = lay(song(items)), sys = (i: number) => L0.notes.find((x) => x.index === i)!.system;
    const idx = L0.notes.map((x) => x.index).find((i) => sys(i) !== sys(i + 1) && L0.notes.some((x) => x.index === i + 1))!;   // 行尾那个音
    const k = idx - 3, tied = items.map((t, j) => (j === k + 1 ? { ...t, tie: true, pitch: (items[k] as { pitch: unknown }).pitch } : t)) as Token[];
    const L = lay(song(tied));
    eq(L.prims.filter((p) => p.t === "path" && (p as { cls?: string }).cls === "tie").length, 2, "两半");
  });
});
