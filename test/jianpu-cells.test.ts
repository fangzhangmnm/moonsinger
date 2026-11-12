// 数字行的盒子（第八刀守卫 2、3）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）
//   守卫 2：每个音 / 休止的盒子报的边 = 它那些图元的真墨迹（vendor 黑体逐字形量、Bravura 字形照墨迹框；同不相撞检查 test/fixtures/layout/collide.ts）；墨不越过同一行里后面第一样画出来的东西（下一个音 / 休止的墨、小节线那根线）。
//   守卫 3：jianpu/draw.ts 不直接拿纵向的位置常数摆贴身的东西（只经过盒子 note-cell.ts / 表 place.ts）；记号表里贴在音上的记号和 place.ts 的单子一致。
import { describe, it, assert, eq } from "./runner.mjs";
import { engrave, type EngraveOpts, type Prim } from "../src/render/engrave.ts";
import { printOpts, textEm } from "../src/export/score-pdf.ts";
import { parseTtf } from "../src/export/ttf.ts";
import { createTextMeasure } from "../src/render/text/index.ts";
import { SIGNS } from "../src/render/signs.ts";
import { NOTE_SIGN_PLACE } from "../src/render/jianpu/place.ts";
import { GLYPH_INK } from "../src/render/jianpu/glyphs.ts";
import type { Song } from "../src/score/song.ts";
import { FULL_VIEWS } from "./fixtures/layout/full.ts";
import { fullSong } from "./fixtures/layout/full-song.ts";
import { trioSong, TRIO_LABELS } from "./fixtures/layout/trio-song.ts";
import { asFrozen, editorBase, views, SP } from "./fixtures/layout/cases.ts";
import { primBoxes } from "./fixtures/layout/collide.ts";
const nodeMod = (m: string) => (globalThis as unknown as { process: { getBuiltinModule(m: string): any } }).process.getBuiltinModule(m);
const fs = nodeMod("node:fs"), zlib = nodeMod("node:zlib");
const font = parseTtf(new Uint8Array(zlib.gunzipSync(fs.readFileSync(new URL("../vendor/fonts/sans.ttf.gz", import.meta.url)))));
const real = createTextMeasure((s: string, px: number) => textEm(font, s) * px);

type Cell = { tok?: number; box: { x0: number; x1: number; y0: number; y1: number }; prims: Prim[]; row: number; ox: number; unit: number; wall: number };
function cells(notation: "jianpu" | "letters"): { name: string; c: Cell }[] {
  const out: { name: string; c: Cell }[] = [];
  const run = (name: string, s: Song, o: EngraveOpts) => engrave(s, { ...o, __cells: (c) => out.push({ name, c }) });
  for (const v of FULL_VIEWS) { const s0 = { ...asFrozen(fullSong()), notation } as Song, s = v.song ? v.song(s0) : s0; run(`用全的测试歌 · ${v.name}`, s, { ...v.opts(s), measure: real } as EngraveOpts); }
  { const v = FULL_VIEWS.find((x) => x.name === "print")!, s0 = { ...asFrozen(fullSong()), notation } as Song, s = v.song ? v.song(s0) : s0; run("用全的测试歌 · print · 英文界面", s, { ...v.opts(s), measure: real, locale: "en" } as EngraveOpts); }   // 「吸 / 深吸」按界面语言量（英文 = in / deep in，拉丁字母）
  const t = { ...asFrozen(trioSong()), notation } as Song;
  run("三声部 · 编辑", t, { ...editorBase(t, TRIO_LABELS), measure: real } as EngraveOpts);
  run("三声部 · 印", t, printOpts(t, SP, views(t, TRIO_LABELS, false), real, true, 0) as EngraveOpts);
  return out;
}
/** 图元的真墨迹（数字行的单位：图元的字号就是这个单位）。 */
function inkOfCell(c: Cell) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of c.prims) primBoxes(p, 1, (s, size) => textEm(font, s) * size, (a, b, cc, d) => { x0 = Math.min(x0, a); x1 = Math.max(x1, b); y0 = Math.min(y0, cc); y1 = Math.max(y1, d); }, font);
  return { x0, x1, y0, y1 };
}
/** 墨不许出盒子（盒子少报 = 后面的东西会贴到墨上）：容差；盒子也不许比墨大太多（多报 = 白白让位）：按字的前进宽报、字身两边自带留白，所以多报的容差大一些。 */
const UNDER = 0.12, OVER = 0.45;

describe("数字行的盒子（第八刀守卫 2）：盒子报的边 = 真墨迹的边", () => {
  for (const notation of ["jianpu", "letters"] as const) it(`${notation === "jianpu" ? "简谱" : "字母谱"}：每个音 / 休止的墨都在盒子里、盒子不比墨大太多；墨不越过后面第一样画出来的东西`, () => {
    const bad: string[] = []; let n = 0;
    const all = cells(notation).filter(({ c }) => c.prims.length).map((e) => ({ ...e, k: inkOfCell(e.c) }));
    for (const { name, c, k } of all) {
      n++;
      const b = c.box;
      // 后面第一样画出来的东西：同一行里后面最近的那个音 / 休止的墨（左边），或者小节线那根线；换算成这个盒子的单位
      const next = all.filter((e) => e.name === name && e.c.row === c.row && e.c.ox > c.ox).reduce((m, e) => Math.min(m, e.c.ox + e.k.x0 * e.c.unit), Infinity);
      const room = (Math.min(next, c.wall) - c.ox) / c.unit;
      const under = Math.max(b.x0 - k.x0, k.x1 - b.x1, b.y0 - k.y0, k.y1 - b.y1), over = Math.max(k.x0 - b.x0, b.x1 - k.x1, k.y0 - b.y0, b.y1 - k.y1);
      if (under > UNDER || over > OVER) bad.push(`${name} tok ${c.tok}：盒子 ${[b.x0, b.x1, b.y0, b.y1].map((v) => v.toFixed(2))} 墨 ${[k.x0, k.x1, k.y0, k.y1].map((v) => v.toFixed(2))}（少报 ${under.toFixed(2)} / 多报 ${over.toFixed(2)}）`);
      if (k.x1 > room) bad.push(`${name} tok ${c.tok}：墨的右边 ${k.x1.toFixed(2)} 越过了后面第一样画出来的东西（${room.toFixed(2)}）`);   // 比墨不比前进宽：十六分的数字按设计挨着（「短音只占字宽」），前进宽的框本来就会碰；后面是小节线 = 比到那根线
    }
    assert(n > 50, `量到的盒子太少（${n}）：比较器不是空的`);
    assert(!bad.length, `${bad.length} 处：\n  ${bad.slice(0, 12).join("\n  ")}`);
  });
});

describe("数字行的盒子（第八刀守卫 2）：字形墨迹表", () => {
  it("glyphs.ts GLYPH_INK 的每个数 = vendor 黑体量出来的（差不过 0.01 字号）", () => {
    const bad: string[] = [];
    for (const [ch, want] of Object.entries(GLYPH_INK)) {
      const g = font.shape(ch); if (g.length !== 1) { bad.push(`${ch}：字体里不是一个字形`); continue; }
      const b = font.inkOf(g[0]!), em = font.unitsPerEm; if (!b) { bad.push(`${ch}：没有墨`); continue; }
      const got = [b[0] / em, b[1] / em, b[2] / em, b[3] / em, font.advance(g[0]!) / em];
      if (got.some((v, i) => Math.abs(v - want[i]!) > 0.01)) bad.push(`${ch}：表 ${want.join(" ")} / 字体 ${got.map((v) => v.toFixed(3)).join(" ")}`);
    }
    assert(!bad.length, bad.join("\n  "));
  });
});

describe("数字行的盒子（第八刀守卫 3）：结构", () => {
  it("jianpu/draw.ts 不 import 贴身东西的纵向位置常数（只经过盒子 note-cell.ts 和表 place.ts）", () => {
    const src = fs.readFileSync(new URL("../src/render/jianpu/draw.ts", import.meta.url), "utf8") as string;
    const imp = [...src.matchAll(/import\s*\{([^}]*)\}\s*from\s*"\.\/glyphs\.ts"/g)].flatMap((m) => m[1]!.split(",").map((x) => x.trim()));
    const BANNED = ["ACC_Y", "ACC_DX", "AUG_Y", "AUG_DX", "BREATH_Y", "STACC_H", "STACC_W", "STACC_STEP", "TEN_DY", "TEN_STEP", "TEN_L", "TEN_W", "DOT_GAP", "DOT_STEP", "lowDotY", "LOW_DOT_UNDER", "SUP_DY", "SUB_DY", "SUB_DROP", "UL_Y0", "ACC_RISE", "stackBases"];
    const hit = imp.filter((n) => BANNED.includes(n));
    assert(!hit.length, `draw.ts 还在 import：${hit.join(" ")}`);
  });
  it("记号表里贴在音上的记号（lane = note）= place.ts 的单子（新加一个没写 = 红）", () => {
    const want = Object.values(SIGNS).filter((s) => s.lane === "note").map((s) => s.id).sort(), have = Object.keys(NOTE_SIGN_PLACE).sort();
    eq(have.join(" "), want.join(" "));
  });
});
