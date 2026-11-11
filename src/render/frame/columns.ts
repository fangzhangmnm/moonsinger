// columns.ts —— 一张纸上各声部按时刻对齐成列：同一时刻里各种东西的先后（SLOT）、一列的形状。
// > moved 2026-11-11 by Claude Opus 5.5（施工单 1b-2 搬家：从 src/render/engrave.ts 原样搬出，内容没改）
import type { Unit } from "../staff/units.ts";

export const SLOT: Record<Unit["kind"], number> = { bar: 0, nav: 0.5, clef: 0.8, key: 1, time: 2, tempo: 3, groove: 3.3, dyn: 3.5, ottava: 3.6, hairpin: 3.7, head: 4, chunk: 5 };
/** 一列：同一 tick、同一种东西（小节线 / 记号 / 音）各声部对齐在一起；宽 = 最宽的那个。 */
export interface Col { tick: number; slot: number; n: number; w: number; x: number; system: number; units: Unit[]; bar: boolean; chunk: boolean }
