// chord-text.ts —— 和弦标的字（级数写法 V7、♭VII、I/3；根音写法 B♭7、F♯m7♭5、C/E）：字 + 升降号字形怎么摆。两种谱、屏幕和 PDF 同一份。
//   created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟；统筹 134f74e4 第 3 条，v0.17.34）。
//   为什么：原来整串当一行衬线字画，升降号是字体里的 ♭ ♯——放大图里「B ♭7」字母和降号之间空得比字距大（读成 B 加降七），降号也比旁边的字细。
//   规矩（统筹）：升降号和它所属的字之间不留比字距更大的空，粗细和旁边的字对得上；四种位置都算——根音字母后面（B♭）、级数前面（♭VII）、变化音数字前面（♭5、♯9）、低音字母后面（/B♭）。
//   做法：
//   · 升降号用乐谱字体 Bravura 的字形（同 7-P、谱头「1=♭B」keytext.ts）：字号 = 字的 ACC_GLYPH_EM / DIGIT_EM 倍 × CHORD_ACC_SCALE（v0.17.36 user 定大一点 = 1.2），顶比大写字母顶高 ACC_RISE / DIGIT_EM 倍（照 keytext）；
//     补粗照 7-P 那条（jianpu/glyphs.ts accStroke），只是主字竖笔换成这款衬线半粗「I」量的（CHORD_STEM）。
//   · 谁的升降号：紧跟在大写字母 A–G 后面 = 那个字母的（B♭、F♯、/B♭）；别的 = 后面那个字的（♭VII、♭5、♯9）。
//   · 缝按「看得见的缝」（墨到墨）：贴所属的那个字 tight、另一边 loose（src/look/text.ts CHORD_ACC_GAP）——这样「B♭7」读成 B♭ 加 7。
//   · 字宽、留白查这款字自己的（chord-text.gen.ts，和 PDF 的轮廓同一次生成），不按字数估；回来的 w = 画出来的宽（让位、点击区都用它）。
//   只用已有的两种图元（text、glyph），没加新形状。
import type { Prim } from "./engrave.ts";
import { ACC_GLYPH_EM, ACC_RISE, DIGIT_EM, accGlyphsOfText, accStroke } from "./jianpu/glyphs.ts";
import { CHORD_ADV, CHORD_SB, CHORD_CAP, CHORD_STEM } from "./chord-text.gen.ts";
import { CHORD_ACC_GAP, CHORD_ACC_SCALE } from "../look/text.ts";   // 缝的两个数、升降号大多少是排版规则（人会想调），住 src/look

const { tight: CHORD_TIGHT, loose: CHORD_LOOSE } = CHORD_ACC_GAP;
const ACC_K = (ACC_GLYPH_EM / DIGIT_EM) * CHORD_ACC_SCALE, RISE_K = ACC_RISE / DIGIT_EM;
const adv = (s: string): number => [...s].reduce((w, c) => w + (CHORD_ADV[c] ?? 0.6), 0);
/** 一段和弦标的字在字号 fs（px）下多宽（px）：这款衬线字自己的字宽。天际线算和弦标的墨也用它（skyline.ts primInk）——原来按正文的尺子量，衬线半粗「VII」比量的宽三成，
 *  两个标会挤到同一行贴在一起（v0.17.34 出图时抓到：「♭VII」「V7♯9」排成「♭VIIV7♯9」）。 */
export const chordTextW = (s: string, fs: number): number => adv(s) * fs;
const lsb = (s: string): number => CHORD_SB[[...s][0] ?? ""]?.[0] ?? 0, rsb = (s: string): number => CHORD_SB[[...s].at(-1) ?? ""]?.[1] ?? 0;

/** 一段：字（从 x 起，字宽 w）或者一个升降号字形（墨从 x 起、宽 w；ch / box = Bravura 的码位和墨迹框，em = 字形字号，stroke = 补粗）。x 相对整串的起点，字号的倍数 × fs = px。 */
export type ChordPiece = { kind: "text"; s: string; x: number; w: number } | { kind: "acc"; ch: string; box: readonly number[]; x: number; w: number; em: number; stroke: number };

/** 整串怎么摆（fs = 字号 px）：每一段的位置，和一共多宽（px）。 */
export function chordTextLayout(label: string, fs: number): { pieces: ChordPiece[]; w: number } {
  const runs = label.match(/[♭♯]+|[^♭♯]+/g) ?? [], pieces: ChordPiece[] = [], em = ACC_K * fs;
  let x = 0;
  runs.forEach((run, k) => {
    if (!/^[♭♯]/.test(run)) { pieces.push({ kind: "text", s: run, x, w: adv(run) * fs }); x += adv(run) * fs; return; }
    const prev = runs[k - 1], next = runs[k + 1], left = !!prev && /[A-G]$/.test(prev);   // 紧跟在根音字母后面 = 那个字母的
    if (prev) x += Math.max(0, (left ? CHORD_TIGHT : CHORD_LOOSE) - rsb(prev)) * fs;   // 前一个字已经自带右边的留白：只补到看得见的缝
    accGlyphsOfText(run).forEach((g, i) => {
      const sk = accStroke(g, em, fs, CHORD_STEM), w = ((g.box[1] - g.box[0]) * em) / 4 + sk * em;   // 描边两边各长一半
      if (i) x += CHORD_TIGHT * fs;   // 重升 / 重降：两个字形贴着
      pieces.push({ kind: "acc", ch: g.ch, box: g.box, x, w, em, stroke: sk }); x += w;
    });
    if (next) x += Math.max(0, (left ? CHORD_LOOSE : CHORD_TIGHT) - lsb(next)) * fs;
  });
  return { pieces, w: x };
}

/** 画：写在 (x, y)（y = 基线）、字号 fs（px）；cls = 字的样式类（chord-tag + 人挑的 / 对不上的那几个修饰类）。字一段一个 text 图元；升降号一个 glyph 图元，
 *  类把 chord-tag 换成 chord-acc（颜色跟着同样的修饰类，styles.css；不带 chord-tag = 「text.chord-tag」永远只是字）。回图元和画出来多宽（px）。 */
export function chordTextPrims(label: string, x: number, y: number, fs: number, cls: string, T: { tok?: number } = {}): { prims: Prim[]; w: number } {
  const L = chordTextLayout(label, fs), top = y - (CHORD_CAP + RISE_K) * fs, prims: Prim[] = [];
  for (const p of L.pieces) {
    if (p.kind === "text") { prims.push({ ...T, t: "text", x: x + p.x, y, s: p.s, cls, size: fs, anchor: "start" }); continue; }
    const half = (p.stroke * p.em) / 2;
    prims.push({ ...T, t: "glyph", x: x + p.x + half - (p.box[0]! * p.em) / 4, y: top + half - (p.box[2]! * p.em) / 4, ch: p.ch, cls: cls.replace(/\bchord-tag\b/, "chord-acc"), size: p.em, ...(p.stroke > 0 ? { stroke: p.stroke } : {}) });
  }
  return { prims, w: L.w };
}
