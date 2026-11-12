// trio-song.ts —— 照 user 11-12 那两张「各种打架」的截图搭的三声部歌（7-K 不相撞检查 + 7-M 歌词标点用）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
//   人声：弱起两个八分、带英文歌词（含标点「sky,」「song.」）、重音、换气、mf；大提琴：竖叠的两音和弦 + 音内鼓起（菱形）+ 换气、p；
//   八音盒：一拍一个音 + 休止。1=G、4/4、♩=90；行首印小节号。只加不改（改了 = 不相撞检查的名单要重核）。
import { TPQ, type Song, type Token } from "../../../src/score/song.ts";
import { paperOf } from "../../../src/score/paper.ts";
import { asOpened } from "./opened.ts";

const Q = TPQ, E = Q / 2, H = Q * 2, W = Q * 4;
type Step = "C" | "D" | "E" | "F" | "G" | "A" | "B";
const p = (step: Step, octave = 4, alter = 0) => ({ step, alter, octave });

export function trioSong(): Song {
  let id = 1;
  const t = (x: Record<string, unknown>) => ({ ...x, id: id++ }) as unknown as Token;
  const head = () => [t({ kind: "key", fifths: 1 }), t({ kind: "time", beats: 4, beatType: 4 }), t({ kind: "tempo", bpm: 90 })];
  const n = (pitch: ReturnType<typeof p>, dur: number, more: Record<string, unknown> = {}) => t({ kind: "note", pitch, dur, lyric: null, ...more });
  const r = (dur: number) => t({ kind: "rest", dur });
  const bar = () => t({ kind: "bar" });
  const words = ["From", "the", "sky,", "sing", "a", "song.", "Watch", "the", "moon", "hear", "the", "sound", "twin", "kle", "stars,", "They", "are", "lit", "tle", "「糕，」", "pret", "ty"];
  let w = 0; const L = (more: Record<string, unknown> = {}) => ({ lyric: words[w++ % words.length], ...more });
  const V: Token[] = [...head(), t({ kind: "dyn", value: "mf" }), n(p("G"), E, L()), n(p("A"), E, L()), bar()];
  const C: Token[] = [...head(), t({ kind: "dyn", value: "p" }), r(Q), bar()];
  const M: Token[] = [...head(), t({ kind: "dyn", value: "p" }), r(Q), bar()];
  const chords: [ReturnType<typeof p>, ReturnType<typeof p>][] = [[p("B", 3), p("G", 3)], [p("A", 3), p("D", 3)], [p("B", 3), p("G", 3)], [p("E", 4), p("C", 4)], [p("G", 3), p("E", 3)], [p("A", 3), p("D", 3)], [p("B", 3), p("G", 3)], [p("E", 3), p("C", 3)]];
  chords.forEach(([hi, lo], k) => {
    V.push(n(p("B"), Q, L({ art: ["accent"] })), n(p("B"), Q), n(p("B"), Q, { art: ["breath"] }), n(p("A"), E, L({ hyph: k % 4 === 3 })), n(p("G"), E, L()));
    if (k === 3) V.push(t({ kind: "dyn", value: "mf" }));
    C.push(n(hi, W, { chord: [lo], art: ["swellBoth", "breath"] }));
    M.push(n(p("B", 5), Q), r(Q), n(p("D", 6), Q), r(Q));
  });
  const paper = { id: "pa", name: "A", tracks: { V, C, M } };
  return asOpened({   // app 打开之后的样子（每张纸开头补力度，第八刀 8-7）
    title: "MoonSingers", hum: "u", credits: "fangzhangmnm", parts: [{ id: "V", role: "r1", mic: "m1" }, { id: "C", role: "r2", mic: "m2" }, { id: "M", role: "r3", mic: "m3" }],
    papers: [paper], paper: paperOf("A5"),
  } as unknown as Song);
}
export const TRIO_LABELS = ["人声", "大提琴", "八音盒"];
