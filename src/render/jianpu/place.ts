// place.ts —— 数字行上贴着音的东西：贴在盒子哪一边、第几个贴、离前一样多远（第八刀 8-2；施工单第 8 节「贴在哪一边、第几个贴 = 一张表」）。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。单位 = 数字行自己的单位（glyphs.ts 那一套）。
//   一边上贴的先后 = 这张表里同一边的行的先后（盒子 note-cell.ts 照这个顺序贴）；「离多远」= 贴的时候这一边现在的边缘到它的墨（同一组接着贴的用 next）。
//   glyphs.ts 里留下的是大小；离基线多远这一类位置，凡是能从「贴在哪」推出来的都改成这里的间隔（8-2 起；成组的东西、行首、不印的提示是后面几步）。
import type { Side } from "../frame/cell.ts";
import { DOT_GAP, MARK_GAP, STACC_STEP, STACC_H, TEN_DY, TEN_W, AUG_DX } from "./glyphs.ts";

export interface Placement { side: Side; gap: number; /** 同一组里不是第一个的时候的间隔（没写 = gap）：只在同一组接着贴时用，前面是别的东西（如八度点）照旧用 gap。 */ next?: number; /** 哪一组（没写 = 自己一组）。 */ group?: string }
/** 贴身的东西（一个音一份）。同一边的先后 = 下面的先后。 */
export const PLACE = {
  /** 升降号 / 还原号：数字左边（和弦 = 每个数字自己的，一起算一块，右边对齐）。 */
  acc: { side: "left", gap: 0.14 },
  /** 琶音的竖波浪：升降号再左边。 */
  arpeggio: { side: "left", gap: 0.2 },
  /** 高八度点：最上面那个数字的顶上（和弦里中间那几个数字的点在叠的时候已经让开了：glyphs.ts stackBases）。 */
  dotHigh: { side: "above", gap: DOT_GAP },
  /** 跳音（实心窄楔形）：高八度点再上面；第一个离墨 MARK_GAP（样张）。 */
  staccato: { side: "above", gap: MARK_GAP, next: STACC_STEP - STACC_H, group: "mark" },
  /** 保持（短横）：同上；横本身有粗细，第一个按样张「横离上一条墨 TEN_DY」折算。 */
  tenuto: { side: "above", gap: MARK_GAP + TEN_DY - TEN_W / 2, next: STACC_STEP - STACC_H, group: "mark" },
  /** 气声 / 固定敲一个键的 ×：字形右上（高度按字形表）。 */
  xmark: { side: "right", gap: 0.0775 },
  /** 低八度点：最下面那个数字底下；有下划线 = 下划线底下（8-3 前下划线还不在盒子里：先 reserve 到下划线的底）。 */
  dotLow: { side: "below", gap: DOT_GAP },
  /** 滚奏三道短斜线：最下面。 */
  roll: { side: "below", gap: 0.17 },
  /** 附点：最后一个字形（数字 / 横线 / 0）右边，高度按字形表（样张：在基线上 0.3 字号）。 */
  augDot: { side: "right", gap: AUG_DX },
  /** 换气 V（+「吸 / 深吸」）：最右边。 */
  breath: { side: "right", gap: 0.35 },
} as const satisfies Record<string, Placement>;
export type PlaceId = keyof typeof PLACE;
/** 这一组里第 n 个贴（0 起）用多大的间隔。 */
export const gapOf = (id: PlaceId, n: number): number => { const p: Placement = PLACE[id]; return n > 0 && p.next !== undefined ? p.next : p.gap; };
/** 数「第几个」按哪一组数。 */
export const groupOf = (id: PlaceId): string => (PLACE[id] as Placement).group ?? id;
