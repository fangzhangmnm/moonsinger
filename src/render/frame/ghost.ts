// ghost.ts —— 鬼音符（「弹」时不占排版、盖在谱上的那个音）要画的一个音：谱面算好交给这一行的几何（notations.ts GEOMETRY[行的种类].ghost），两种行共用这个形状。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第四刀 4-6）。
import type { Pitch } from "../../score/pitch.ts";

/** p = 按那里的调号拼好的音（按 C 调看时已经换到 C）；shown = 画哪个升降号（同排版的规矩：null = 不画，0 = 还原号）；
 *  shift = 这一行那里的谱号 / 八度线位移（有「纵向 = 音高」的行用）；fifths = 那里的调号（数字行读级数用）。 */
export interface GhostNote { p: Pitch; shown: number | null; shift: number; fifths: number }
