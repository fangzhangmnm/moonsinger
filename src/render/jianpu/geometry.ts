// geometry.ts —— 简谱数字行的主线程几何（设计稿第 3.3 节末：光标长什么样、鬼音符长什么样）。只吃平数据（这一行的原点 + 半个线间距）。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第四刀 4-2）。**没有「纵向 = 音高」**：谱面在数字行上不提供竖着拖改音高（施工单第三节「4」）。
import { CARET_Y0, CARET_Y1, BASE_Y, DIGIT_EM, DIGIT_W, JP_BODY, DIGIT_TOP, DOT_R, DOT_GAP, DOT_STEP, ACC_EM, ACC_DX, ACC_Y, X_EM, stackBases, dotPath, accText } from "./glyphs.ts";
import { midiOf } from "../../score/pitch.ts";
import { toDegree } from "../../score/degree.ts";
import { TEXT_FACES, TEXT_STYLES } from "../text/index.ts";
import type { GhostNote } from "../frame/ghost.ts";

/** 数字行自己的平数据：行框原点的 y（px；和五线谱同一个框，0 = 上沿）。现在就是 SystemBox.staffTop。 */
export interface JianpuRowData { staffTop: number; /** 行里的尺寸比例（SystemBox.scale；没写 = 1）。 */ scale?: number }
/** 这一行数字行的一个单位（px）= 两个半线间距 × 行里的尺寸比例。 */
const unitOf = (row: JianpuRowData, half: number): number => 2 * half * (row.scale ?? 1);
/** 光标：从行框上面一点画到下面一点的一根竖线（half = 半个线间距 px）。 */
export const jianpuCaretSpan = (row: JianpuRowData, half: number): { y1: number; y2: number } => ({ y1: row.staffTop + CARET_Y0 * unitOf(row, half), y2: row.staffTop + CARET_Y1 * unitOf(row, half) });
/** 鬼音符（「弹」时不占排版的那个音）：一个淡的数字画在哪、多大（x = 光标的位置 px，数字的中心在它右边半个数字宽）。 */
export const jianpuPreviewAt = (row: JianpuRowData, x: number, half: number): { x: number; y: number; size: number } => { const u = unitOf(row, half); return { x: x + (0.1 + DIGIT_W / 2) * u, y: row.staffTop + BASE_Y * u, size: DIGIT_EM * u }; };
/** 选区带的上沿（和光标同一个上沿）。 */
export const jianpuBandTop = (row: JianpuRowData, half: number): number => row.staffTop + CARET_Y0 * unitOf(row, half);
/** 数字行的鬼音符（谱面分家第四刀 4-6）：x 处（光标 / 那个音的位置）一个淡的数字 + 升降 + 八度点（按这一行的八度基准；row.octBase）。几个音（叠）= 从低到高往上一个叠一个（和真画的和弦同一个 stackBases，第五刀 5-4）。
 *  字和排版里的数字同一款（字体属性写在元素上：鬼音符那一层不在 .staff-svg 里，套不上谱的样式表）。 */
export function jianpuGhost(row: JianpuRowData & { octBase?: number }, x: number, notes: readonly GhostNote[], half: number): string {
  const sp = unitOf(row, half), pv = jianpuPreviewAt(row, x, half), face = TEXT_FACES[TEXT_STYLES["jp-digit"].face], parts: string[] = [];
  const low = [...notes].sort((a, b) => midiOf(a.p) - midiOf(b.p)), dg = low.map((n) => toDegree(n.p, n.fifths)), dotsOf = dg.map((d) => d.shift - (row.octBase ?? 0)), bases = stackBases(dotsOf);
  low.forEach((n, k) => {
    const d = dg[k]!, dots = dotsOf[k]!, dy = (bases[k]! - BASE_Y) * sp, Y = (v: number) => row.staffTop + v * sp + dy;
    parts.push(`<text x="${pv.x}" y="${pv.y + dy}" font-family='${face}' font-size="${pv.size}" text-anchor="middle">${d.degree}</text>`);
    if (n.shown !== null) parts.push(`<text x="${pv.x - ACC_DX * sp}" y="${Y(ACC_Y)}" font-family='${face}' font-size="${ACC_EM * sp}" text-anchor="middle">${accText(d.acc)}</text>`);
    for (let j = 0; j < Math.abs(dots); j++) parts.push(`<path d="${dotPath(pv.x, Y(dots > 0 ? DIGIT_TOP - DOT_GAP - DOT_R - j * DOT_STEP : BASE_Y + DOT_GAP + DOT_R + j * DOT_STEP), DOT_R * sp)}"/>`);
  });
  return parts.join("");
}
/** 鼓的 X 行的鬼音符（第五刀 5-4）：x 处一个淡的「X」，几个（同时敲的几件）= 往上一个叠一个（同 stackBases，没有八度点）。 */
export function jianpuXGhost(row: JianpuRowData, x: number, notes: readonly GhostNote[], half: number): string {
  const sp = unitOf(row, half), pv = jianpuPreviewAt(row, x, half), face = TEXT_FACES[TEXT_STYLES["jp-digit"].face], bases = stackBases(notes.map(() => 0));
  return bases.map((b) => `<text x="${pv.x}" y="${row.staffTop + b * sp}" font-family='${face}' font-size="${pv.size * X_EM}" text-anchor="middle">X</text>`).join("");
}
/** 数字行的竖向锚点（px）：上沿 / 中线 / 下沿 = 行身（小节线那一段）。框架的家具（名字、色条、括号、左边的竖线、歌词基线）和行距只认这三个（统筹审第四刀接口第 4 条）。 */
export const jianpuAnchors = (origin: number, half: number): { top: number; mid: number; bottom: number } => ({ top: origin + JP_BODY.top * 2 * half, mid: origin + ((JP_BODY.top + JP_BODY.bottom) / 2) * 2 * half, bottom: origin + JP_BODY.bottom * 2 * half });
