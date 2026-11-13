// src/look/spacing.ts —— 音距的规则的数（第 17 条 17-2：从 src/render/spacing.ts 原样搬来，数一个没改）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   插值的算法（lerpLog / curveOf / idealGaps…）留在 src/render/spacing.ts；这里只有表。
import { TPQ } from "../score/song.ts";

// 折线（横轴 = 时值的 log2）。app 用两档（纸设置「音距」；user 11-09「我觉得可以再紧一点，你这个新版本算正常，然后加一个紧凑的」「松可能不要，因为原来的样子真的很难看」）；
//   松 = 原来的样子（四分 3.6，每翻一倍 +0.75，十六分及更短一律 2.2）：app 不再给，留着当单测里一把简单的尺子；
//   正常（默认；user 11-08「很密的十六分和三十二分音符…压密一点」「正常人都会画密」）= 松的那条，十六分 1.9、三十二分及更短 1.6（符头宽 1.18，留 0.4 的缝）；
//   紧 = 整条再收一截（四分 3.0、每翻一倍 +0.6），短音符贴着顶杆（三十二分 1.5 ≈ 两个符头之间留 0.3）。
// 这几个数是起点：出了样张 user 看着再调，只改这三张表。
export type Pt = readonly [ticks: number, width: number];
export const LOOSE: readonly Pt[] = [[TPQ / 8, 2.2], [TPQ / 4, 2.2], [TPQ / 2, 2.85], [TPQ, 3.6], [TPQ * 2, 4.35], [TPQ * 4, 5.1]];
export const DENSE: readonly Pt[] = [[TPQ / 8, 1.6], [TPQ / 4, 1.9], [TPQ / 2, 2.85], [TPQ, 3.6], [TPQ * 2, 4.35], [TPQ * 4, 5.1]];
export const TIGHT: readonly Pt[] = [[TPQ / 8, 1.5], [TPQ / 4, 1.7], [TPQ / 2, 2.35], [TPQ, 3.0], [TPQ * 2, 3.6], [TPQ * 4, 4.2]];
/** 音前后留白、空小节宽（sp）。 */
export const SP_DEFAULTS = { pad: 0.3, emptyBar: 4.5 } as const;
/** 符头的左缘离对齐线（列的 x）多远（sp）：刀 3 起临时记号挂在左边，符头从这儿起。（原 src/render/staff/measure.ts，17-2 搬来） */
export const NOTEHEAD_X = 0.35;
