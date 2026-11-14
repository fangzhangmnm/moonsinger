// 每行五线画到最后一根小节线为止（不出头）。created 2026-10-08 by Claude Opus 5.5（user「每行五线谱最好过了最后一个小节线能不能不出头」）
import { describe, it, eq, assert } from "./runner.mjs";
import { engrave } from "../src/render/engrave.ts";
import { TPQ, type Song, type Token, songOf } from "../src/score/song.ts";
import { createTextMeasure } from "../src/render/text/index.ts";

const p = { step: "C" as const, alter: 0, octave: 5 };
/** n 个整小节的四分音符（4/4，自动小节线）。 */
function song(quarters: number): Song {
  let id = 1;
  const toks: Token[] = [{ kind: "key", fifths: 0, id: id++ }, { kind: "time", beats: 4, beatType: 4, id: id++ }, { kind: "tempo", bpm: 90, id: id++ }] as Token[];
  for (let i = 0; i < quarters; i++) toks.push({ kind: "note", pitch: p, dur: TPQ, lyric: null, id: id++ } as Token);
  return songOf(toks, { title: "" });
}
const lay = (quarters: number, caretAtEnd: boolean) => engrave(song(quarters), { width: 700, sp: 10, tailOpen: caretAtEnd, at: { paper: "p1", part: "P1" }, parts: [{ id: "P1", name: "Vocals", first: true }], locale: "zh", measure: createTextMeasure(() => 10) });
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
  it("在小节中间折的行（拉宽到上限、没撑满）：五线画到这一行内容的结尾，不画到最右；最后一行照旧（W-70，v0.17.53；光标在尾巴的最后一行 = 下一条管）", () => {
    // 16/4 一小节：十六分音符一串 + 几个全音符 → 一小节放不下一行、在小节中间折；全音符那几行拉宽到上限也撑不满
    const long = (sp: number, width: number) => { let id = 1;
      const toks: Token[] = [{ kind: "key", fifths: 0, id: id++ }, { kind: "time", beats: 16, beatType: 4, id: id++ }, { kind: "tempo", bpm: 90, id: id++ }] as Token[];
      for (let k = 0; k < 2; k++) { for (let i = 0; i < 16; i++) toks.push({ kind: "note", pitch: p, dur: TPQ / 4, lyric: null, id: id++ } as Token); for (let i = 0; i < 3; i++) toks.push({ kind: "note", pitch: p, dur: TPQ * 4, lyric: null, id: id++ } as Token); }
      return engrave(songOf(toks, { title: "" }), { width, sp, at: { paper: "p1", part: "P1" }, parts: [{ id: "P1", name: "Vocals", first: true }], locale: "zh", measure: createTextMeasure(() => 10) }); };
    let short = 0;
    for (const width of [700, 160, 200]) for (const sp of [8, 10, 12, 14, 16, 18, 20]) {   // 160 / 200 = 窄到一小节逐列切开（快照里 narrow 那一例的宽），才会出「拉到上限也撑不满」的行
      const l = long(sp, width), rows = staffRows(l), bs = bars(l), full = Math.max(...rows.map((r) => r.x2));
      rows.slice(0, -1).forEach((r) => {
        if (bs.some((b) => b.y1 >= r.y1 - 4 * l.sp - 2 && b.y2 <= r.y1 + 5 && Math.abs(b.x1 - r.x2) < 2)) return;   // 以小节线结尾的行 = 上一条管（谱高 4 个间距：间距大了写死的门槛会认不出，sp 14 踩过）
        if (r.x2 >= full - 0.5) return;   // 画到最右的行（排满的、一个音就比一行宽溢出去的）不归这一条
        const ns = l.notes.filter((n) => Math.abs(l.systems[n.system]!.staffTop + 4 * l.sp - r.y1) < 2);
        const lastRight = Math.max(...ns.map((n) => n.x + n.w));
        assert(r.x2 + 0.5 >= lastRight, `宽 ${width} sp ${sp}：五线短得盖不住这一行最后一个音（${r.x2} < ${lastRight}）`);
        short++;
      });
    }
    assert(short > 0, "要有拉宽到上限、没撑满的行才测得到（换个例子）");
    // 在小节中间折、又排满了的行（一小节全是十六分，没到拉宽上限）：五线右端 = 最右（差不超过 0.5；统筹 2026-11-13 要的：不许以后每行右边参差）
    for (const sp of [8, 10, 12, 14, 16, 18, 20]) { let id = 1;
      const toks: Token[] = [{ kind: "key", fifths: 0, id: id++ }, { kind: "time", beats: 16, beatType: 4, id: id++ }, { kind: "tempo", bpm: 90, id: id++ }] as Token[];
      for (let i = 0; i < 128; i++) toks.push({ kind: "note", pitch: p, dur: TPQ / 4, lyric: null, id: id++ } as Token);
      const l = engrave(songOf(toks, { title: "" }), { width: 700, sp, tailOpen: true, at: { paper: "p1", part: "P1" }, parts: [{ id: "P1", name: "Vocals", first: true }], locale: "zh", measure: createTextMeasure(() => 10) });
      const rows = staffRows(l), full = rows[rows.length - 1]!.x2;
      assert(rows.length >= 3, `sp ${sp}：要折成几行（现在 ${rows.length}）`);
      const bs = bars(l); let mid = 0;
      for (const r of rows.slice(0, -1)) {
        if (bs.some((b) => b.y1 >= r.y1 - 4 * l.sp - 2 && b.y2 <= r.y1 + 5 && Math.abs(b.x1 - r.x2) < 2)) continue;   // 以小节线结尾的行 = 第一条管
        mid++; assert(Math.abs(r.x2 - full) <= 0.5, `sp ${sp}：排满了的行五线右端 ${r.x2} ≠ 最右 ${full}`);
      }
      assert(mid > 0, `sp ${sp}：要有在小节中间折的行`);
    }
  });
  it("光标停在最后一根小节线后面（还要往下写）：最后一行照旧画到右边", () => {
    const a = staffRows(lay(40, false)), b = staffRows(lay(40, true));
    assert(b[b.length - 1].x2 > a[a.length - 1].x2 + 1, "写字头在最后：最后一行要留出写的地方");
  });
});
