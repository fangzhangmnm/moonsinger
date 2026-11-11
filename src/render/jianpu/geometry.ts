// geometry.ts —— 简谱数字行的主线程几何（设计稿第 3.3 节末：光标长什么样、鬼音符长什么样）。只吃平数据（这一行的原点 + 半个线间距）。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第四刀 4-2）。**没有「纵向 = 音高」**：谱面在数字行上不提供竖着拖改音高（施工单第三节「4」）。
import { CARET_Y0, CARET_Y1, BASE_Y, DIGIT_EM, DIGIT_W } from "./glyphs.ts";

/** 数字行自己的平数据：行框原点的 y（px；和五线谱同一个框，0 = 上沿）。现在就是 SystemBox.staffTop。 */
export interface JianpuRowData { staffTop: number }
/** 光标：从行框上面一点画到下面一点的一根竖线（half = 半个线间距 px）。 */
export const jianpuCaretSpan = (row: JianpuRowData, half: number): { y1: number; y2: number } => ({ y1: row.staffTop + CARET_Y0 * 2 * half, y2: row.staffTop + CARET_Y1 * 2 * half });
/** 鬼音符（「弹」时不占排版的那个音）：一个淡的数字画在哪、多大（x = 光标的位置 px，数字的中心在它右边半个数字宽）。 */
export const jianpuPreviewAt = (row: JianpuRowData, x: number, half: number): { x: number; y: number; size: number } => ({ x: x + (0.1 + DIGIT_W / 2) * 2 * half, y: row.staffTop + BASE_Y * 2 * half, size: DIGIT_EM * 2 * half });
/** 选区带的上沿（和光标同一个上沿）。 */
export const jianpuBandTop = (row: JianpuRowData, half: number): number => row.staffTop + CARET_Y0 * 2 * half;
