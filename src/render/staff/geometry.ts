// geometry.ts —— 五线谱这一种行的纵向（设计稿第 3.3 节末「行的画法另外给的几何纯函数」）：第几级 ↔ y、这一行的竖向锚点。只吃平数据（这一行第五线的 y、半个线间距）。
//   created 2026-11-11 by Claude Opus 5.5（谱面分家施工单 1b-7：从 engrave.ts 的 yOf / dOf 原样抽出，浮点运算的先后不变）。
import { TOP_LINE, MID_LINE, BOTTOM_LINE } from "./glyphs.ts";

/** 第 d 级（第五线 = 38、中线 34、第一线 30；每级半个线间距）在这一行的 y（px）。staffTop = 这一行第五线的 y，half = 半个线间距（px）。 */
export const yAt = (staffTop: number, d: number, half: number): number => staffTop + (TOP_LINE - d) * half;
/** y（px）→ 最近的第几级。 */
export const dAt = (staffTop: number, y: number, half: number): number => Math.round(TOP_LINE - (y - staffTop) / half);
/** 这一行的竖向锚点（px）：上沿 = 第五线、中线、下沿 = 第一线。框架的家具（声部名、色条、括号、左边的竖线、歌词基线）只认这三个。 */
export const anchors = (staffTop: number, half: number): { top: number; mid: number; bottom: number } => ({ top: yAt(staffTop, TOP_LINE, half), mid: yAt(staffTop, MID_LINE, half), bottom: yAt(staffTop, BOTTOM_LINE, half) });

// ── 主线程上的几何（设计稿第 3.3 节末：光标长什么样、鬼音符长什么样、纵向 ↔ 音高；施工单 1b-8）。只吃平数据，谱面视图第二刀改用它们（现在谱面视图还读 Layout.yOf / dOf） ──
/** 这一行五线谱自己的平数据：第五线的 y（px）、大谱表里是上（1）还是下（2）。现在就是 SystemBox 的 staffTop / staff 两个字段（挪成 RowBox.data 归第二刀）。 */
export interface StaffRowData { staffTop: number; staff: 1 | 2 }
/** 光标：从第 42 级画到第 26 级的一根竖线（谱上方两格到谱下方两格）。 */
export const caretSpan = (row: StaffRowData, half: number): { y1: number; y2: number } => ({ y1: yAt(row.staffTop, 42, half), y2: yAt(row.staffTop, 26, half) });
/** 鬼音符（「弹」时不占排版的那个音）：符头的 y + 要画的加线（谱下方从第 28 级往下、谱上方从第 40 级往上，到这个音为止）。d = 谱上的第几级（已带谱号 / 八度线的位移）。 */
export const previewAt = (row: StaffRowData, d: number, half: number): { y: number; ledgers: number[] } => {
  const ledgers: number[] = [];
  for (let k = 28; k >= d; k -= 2) ledgers.push(yAt(row.staffTop, k, half));
  for (let k = 40; k <= d; k += 2) ledgers.push(yAt(row.staffTop, k, half));
  return { y: yAt(row.staffTop, d, half), ledgers };
};
/** 纵向 = 音高（五线谱有、简谱没有）：这个 y 是第几级；竖着拖了 dy（px，往下为正）是几级（半个线间距一级）。 */
export const pitchAxis = {
  stepAt: (row: StaffRowData, y: number, half: number): number => dAt(row.staffTop, y, half),
  stepsOfDrag: (dy: number, half: number): number => Math.round(-dy / half),
};
/** 选区带的上沿：第 44 级（谱上方三格）。 */
export const bandTop = (row: StaffRowData, half: number): number => yAt(row.staffTop, 44, half);

/** 平数据 → 带 yOf / dOf / lyricY 的 Layout（worker 回来的、排版自己交出去的都走这里；原来 engrave.ts 的 strip / attachLayoutFns 一拆一装）。
 *  Layout 上的 yOf / dOf 是暂时留着给谱面视图的，退场 = 第二刀（谱面视图改用上面几个函数）。 */
export function withStaffGeometry<D extends { sp: number; systems: { staffTop: number }[]; lyricYs: number[] }>(d: D): D & { yOf: (r: number, dd: number) => number; dOf: (r: number, y: number) => number; lyricY: (r: number) => number } {
  const half = d.sp * 0.5;
  return { ...d, yOf: (r: number, dd: number) => yAt(d.systems[r]!.staffTop, dd, half), dOf: (r: number, y: number) => dAt(d.systems[r]!.staffTop, y, half), lyricY: (r: number) => d.lyricYs[r]! };
}
