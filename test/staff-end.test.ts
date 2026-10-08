// 每行五线画到最后一根小节线为止（不出头）。created 2026-10-08 by Claude Opus 5.5（user「每行五线谱最好过了最后一个小节线能不能不出头」）
import { describe, it, eq, assert } from "./runner.mjs";
import { engrave } from "../src/render/engrave.ts";
import { TPQ, type Song, type Token, songOf } from "../src/score/song.ts";

const p = { step: "C" as const, alter: 0, octave: 5 };
/** n 个整小节的四分音符（4/4，自动小节线）。 */
function song(quarters: number): Song {
  let id = 1;
  const toks: Token[] = [{ kind: "key", fifths: 0, id: id++ }, { kind: "time", beats: 4, beatType: 4, id: id++ }, { kind: "tempo", bpm: 90, id: id++ }] as Token[];
  for (let i = 0; i < quarters; i++) toks.push({ kind: "note", pitch: p, dur: TPQ, lyric: null, id: id++ } as Token);
  return songOf(toks, { title: "" });
}
const lay = (quarters: number, caretAtEnd: boolean) => engrave(song(quarters), { width: 700, sp: 10, at: { paper: "p1", part: "P1" }, parts: [{ id: "P1", name: "Vocals", first: true }], caret: caretAtEnd ? 3 + quarters : 3, sel: null, measureLyric: () => 10 });
type Line = { t: "line"; x1: number; y1: number; x2: number; y2: number; w: number; cls?: string };
const staffRows = (l: ReturnType<typeof lay>) => {
  const st = l.prims.filter((x): x is Line => x.t === "line" && x.cls === "staff");
  return st.filter((_, i) => i % 5 === 0);   // 每条谱的最下面那根线代表这一行
};
const bars = (l: ReturnType<typeof lay>) => l.prims.filter((x): x is Line => x.t === "line" && !!x.cls?.startsWith("bar") && x.cls !== "bracket");

describe("每行五线不出头", () => {
  it("几行都以小节线结尾（光标不在最后）：每行五线的右端 = 这一行最后一根小节线", () => {
    const l = lay(40, false), rows = staffRows(l), bs = bars(l);
    assert(rows.length >= 2, `要折成几行才测得到（现在 ${rows.length} 行）`);
    for (const r of rows) {
      const inRow = bs.filter((b) => b.y1 >= r.y1 - 50 && b.y2 <= r.y1 + 5);
      const lastBar = Math.max(...inRow.map((b) => b.x1));
      eq(Math.round(r.x2), Math.round(lastBar), `y=${Math.round(r.y1)} 这一行的五线出头了`);
    }
  });
  it("光标停在最后一根小节线后面（还要往下写）：最后一行照旧画到右边", () => {
    const a = staffRows(lay(40, false)), b = staffRows(lay(40, true));
    assert(b[b.length - 1].x2 > a[a.length - 1].x2 + 1, "写字头在最后：最后一行要留出写的地方");
  });
});
