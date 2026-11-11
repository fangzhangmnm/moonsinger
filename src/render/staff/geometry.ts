// geometry.ts —— 五线谱这一种行的纵向（设计稿第 3.3 节末「行的画法另外给的几何纯函数」）：第几级 ↔ y、这一行的竖向锚点。只吃平数据（这一行第五线的 y、半个线间距）。
//   created 2026-11-11 by Claude Opus 5.5（谱面分家施工单 1b-7：从 engrave.ts 的 yOf / dOf 原样抽出，浮点运算的先后不变）。
import { TOP_LINE, MID_LINE, BOTTOM_LINE } from "./glyphs.ts";

/** 第 d 级（第五线 = 38、中线 34、第一线 30；每级半个线间距）在这一行的 y（px）。staffTop = 这一行第五线的 y，half = 半个线间距（px）。 */
export const yAt = (staffTop: number, d: number, half: number): number => staffTop + (TOP_LINE - d) * half;
/** y（px）→ 最近的第几级。 */
export const dAt = (staffTop: number, y: number, half: number): number => Math.round(TOP_LINE - (y - staffTop) / half);
/** 这一行的竖向锚点（px）：上沿 = 第五线、中线、下沿 = 第一线。框架的家具（声部名、色条、括号、左边的竖线、歌词基线）只认这三个。 */
export const anchors = (staffTop: number, half: number): { top: number; mid: number; bottom: number } => ({ top: yAt(staffTop, TOP_LINE, half), mid: yAt(staffTop, MID_LINE, half), bottom: yAt(staffTop, BOTTOM_LINE, half) });
