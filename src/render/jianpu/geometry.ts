// geometry.ts —— 简谱数字行的主线程几何（设计稿第 3.3 节末：光标长什么样、鬼音符长什么样）。只吃平数据（这一行的原点 + 半个线间距）。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第四刀 4-2）。**没有「纵向 = 音高」**：谱面在数字行上不提供竖着拖改音高（施工单第三节「4」）。
import { CARET_Y0, CARET_Y1, BASE_Y, DIGIT_EM, DIGIT_W, JP_BODY, DIGIT_TOP, DOT_R, DOT_GAP, DOT_STEP, ACC_EM, ACC_DX, ACC_Y, dotPath, accText } from "./glyphs.ts";
import { toDegree } from "../../score/degree.ts";
import { TEXT_FACES, TEXT_STYLES } from "../text/index.ts";
import type { GhostNote } from "../frame/ghost.ts";

/** 数字行自己的平数据：行框原点的 y（px；和五线谱同一个框，0 = 上沿）。现在就是 SystemBox.staffTop。 */
export interface JianpuRowData { staffTop: number }
/** 光标：从行框上面一点画到下面一点的一根竖线（half = 半个线间距 px）。 */
export const jianpuCaretSpan = (row: JianpuRowData, half: number): { y1: number; y2: number } => ({ y1: row.staffTop + CARET_Y0 * 2 * half, y2: row.staffTop + CARET_Y1 * 2 * half });
/** 鬼音符（「弹」时不占排版的那个音）：一个淡的数字画在哪、多大（x = 光标的位置 px，数字的中心在它右边半个数字宽）。 */
export const jianpuPreviewAt = (row: JianpuRowData, x: number, half: number): { x: number; y: number; size: number } => ({ x: x + (0.1 + DIGIT_W / 2) * 2 * half, y: row.staffTop + BASE_Y * 2 * half, size: DIGIT_EM * 2 * half });
/** 选区带的上沿（和光标同一个上沿）。 */
export const jianpuBandTop = (row: JianpuRowData, half: number): number => row.staffTop + CARET_Y0 * 2 * half;
/** 数字行的鬼音符（谱面分家第四刀 4-6）：x 处（光标 / 那个音的位置）一个淡的数字 + 升降 + 八度点（按这一行的八度基准；row.octBase）。几个音（叠）= 往上一个叠一个。
 *  字和排版里的数字同一款（字体属性写在元素上：鬼音符那一层不在 .staff-svg 里，套不上谱的样式表）。 */
export function jianpuGhost(row: JianpuRowData & { octBase?: number }, x: number, notes: readonly GhostNote[], half: number): string {
  const sp = 2 * half, pv = jianpuPreviewAt(row, x, half), face = TEXT_FACES[TEXT_STYLES["jp-digit"].face], parts: string[] = [];
  notes.forEach((n, k) => {
    const d = toDegree(n.p, n.fifths), dots = d.shift - (row.octBase ?? 0), dy = -k * 2.4 * sp, Y = (v: number) => row.staffTop + v * sp + dy;
    parts.push(`<text x="${pv.x}" y="${pv.y + dy}" font-family='${face}' font-size="${pv.size}" text-anchor="middle">${d.degree}</text>`);
    if (n.shown !== null) parts.push(`<text x="${pv.x - ACC_DX * sp}" y="${Y(ACC_Y)}" font-family='${face}' font-size="${ACC_EM * sp}" text-anchor="middle">${accText(d.acc)}</text>`);
    for (let j = 0; j < Math.abs(dots); j++) parts.push(`<path d="${dotPath(pv.x, Y(dots > 0 ? DIGIT_TOP - DOT_GAP - DOT_R - j * DOT_STEP : BASE_Y + DOT_GAP + DOT_R + j * DOT_STEP), DOT_R * sp)}"/>`);
  });
  return parts.join("");
}
/** 数字行的竖向锚点（px）：上沿 / 中线 / 下沿 = 行身（小节线那一段）。框架的家具（名字、色条、括号、左边的竖线、歌词基线）和行距只认这三个（统筹审第四刀接口第 4 条）。 */
export const jianpuAnchors = (origin: number, half: number): { top: number; mid: number; bottom: number } => ({ top: origin + JP_BODY.top * 2 * half, mid: origin + ((JP_BODY.top + JP_BODY.bottom) / 2) * 2 * half, bottom: origin + JP_BODY.bottom * 2 * half });
