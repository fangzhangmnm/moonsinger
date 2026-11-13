// chunk.ts —— 简谱数字行上一段（排版单元里的一个音 / 休止）的几个小判断：量、画、盒子三处共用（第八刀 8-2 从 measure.ts 挪出来，免得互相 import）。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）；里面的函数原样搬，作者和来历见各自的注释（谱面分家第四刀、第五刀、7-B）。
import { TPQ } from "../../score/song.ts";
import type { Token } from "../../score/song.ts";
import type { PartView } from "../engrave.ts";
import type { Unit, Chunk, Head } from "../frame/units.ts";
import { DIGIT_W, letterNoteW } from "./glyphs.ts";

/** 一条要排的简谱轨（一个声部在这张纸上；框架交来的单元已经切好了时值）。 */
export interface JianpuTrack {
  p: PartView; tokens: Token[]; units: Unit[]; head: Head; realLen: number; realTicks: number; staves: number; focused: boolean; pickup: boolean;
  /** 字母谱（7-B）：数字换成字母 + 右上升降号 + 右下八度数字；值 = 中央 C 叫 C 几（默认 4）。别的一样不动。 */
  letters?: number;
}

/** 接着上一段的长音，这一段画成横线（不重写数字）：只在**同一小节之内**、正好整拍、不是连音的才行——一条横线 = 一拍（UX 稿第 4 节）。
 *  跨过小节线的（这一段从小节头起）一律在小节线后面重写数字、用连线连到前一段（课本写法、样张也是；统筹 5-6「横线只在一小节之内用」）；
 *  不是整拍的同样重写（附点、下划线照常；统筹看第四刀成品样张后定的第 1 处：原来一律画横线、按 round 算根数，3/4 里连过来的一拍半画成两条横线，读成三拍半）。 */
export const contDash = (u: Chunk): boolean => u.note && u.j > 0 && u.inBar > 1e-6 && u.base >= TPQ && !u.ratio && Math.abs(u.ticks / TPQ - Math.round(u.ticks / TPQ)) < 1e-6;
/** 这一段除了第一个字形（数字 / 0 / 横线）后面还有几个：长音的横线、几拍的休止一拍一个 0。 */
export function extraGlyphs(u: Chunk): number {
  if (u.note) {
    if (contDash(u)) return Math.max(0, Math.round(u.ticks / TPQ) - 1);   // 接着上一段的长音：一拍一条横线（第一个字形就是横线）
    if (u.base >= TPQ * 2) return Math.round(u.base / TPQ) - 1 + (u.dotted ? Math.round(u.base / (TPQ * 2)) : 0);   // 二分 = 5 –、附点二分 = 5 – –、全音 = 5 – – –
    return 0;
  }
  if (u.base >= TPQ) return Math.max(0, Math.floor(u.ticks / TPQ + 1e-6) - 1);   // 一拍一个 0（整小节休止也是：UX 稿第 4 节，帮唱的人倒数）
  return 0;
}
/** 这一段有没有附点（画在数字右边）：附点的四分 / 八分…；附点二分以上写成横线，不画点；几拍的休止剩下的半拍也画点。 */
export function hasAugDot(u: Chunk): boolean {
  if (u.note) return u.dotted && u.base < TPQ * 2 && !contDash(u);
  return u.base >= TPQ ? Math.floor(u.ticks / TPQ + 1e-6) * TPQ < u.ticks - 1e-6 : u.dotted;
}
/** 数字行的两种写法：digits = 数字（有音高的声部）；x = 鼓的 X 行（音画成 X，没有升降号 / 八度点 / 琶音；UX 稿第 7 节，第五刀 5-4）。 */
export type JianpuMode = "digits" | "x";
/** 框架给的这条轨的预处理（同 notations.ts TrackAux 的形状）：labels = 「吸 / 深吸」那行小字（字、字号、多宽，这一种行的单位；量和画同一份）。 */
export interface JianpuAux { labels?: { readonly inhale: Readonly<Record<"soft" | "big", { readonly text: string; readonly size: number; readonly w: number }>> } }
/** 字母谱（7-B）里这一段第一个字形（字母 + 右上的升降号 / 右下的八度数字）多宽；不是字母谱 / 不写音高的（横线、没写音高的）= null。 */
export const lettersOf = (q: { letters?: number }, u: Chunk, mode: JianpuMode, aux: JianpuAux | undefined): { w: number } | null =>
  q.letters !== undefined && mode === "digits" && u.note && u.pitch && !u.ghost && !contDash(u) ? { w: letterNoteW(u.pitches.length ? u.pitches : [u.pitch], q.letters) } : null;
export const glyphWOf = (u: Chunk, aux: JianpuAux | undefined, q: { letters?: number } = {}): number => { const lt = lettersOf(q, u, "digits", aux); return lt ? lt.w : DIGIT_W; };
/** 这一段要写临时记号的那几个音（叠音 = 每个音各自的；单音 = 它自己的）：只有第一段写（同五线谱）。 */
export const accsOf = (u: Chunk): (number | null)[] => (u.j !== 0 || !u.note ? [] : u.pitches.length > 1 ? u.accs : [u.acc]);
/** 这一段画不画琶音的竖波浪（只挂在和弦上：单音的琶音核心那边已经去掉了）。 */
export const hasArp = (u: Chunk): boolean => u.note && u.j === 0 && u.pitches.length > 1 && u.art.includes("arpeggio");
/** 第几层下划线（八分 = 1、十六分 = 2…；四分以上 = 0）。 */
export const underlines = (u: Chunk): number => (u.base < TPQ ? Math.max(1, Math.round(Math.log2(TPQ / u.base))) : 0);

