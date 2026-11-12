// layout-params.ts —— 排版参数表（设计稿第 3.8 节；谱面分家第四刀 4-5）：一种版式 × 一种谱（纸一级）/ 一种行（行一级）= 一行数。调版式 = 改这个文件。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟）：原来散在 frame/params.ts 的 SPACING（版式表）、SQUEEZE 和 engrave.ts 里按版式挑音距曲线的那一句收到这里，数值没改；
//   简谱的两行是新的。参数分两级（统筹审第四刀接口第 3 条）：纸一级的量按这首歌的谱种；行一级的量按这一行的种类（一张纸上可以有两种行）。
//   不在这里的：行身的上下沿（每种画法的竖向锚点给：notations.ts RowDrawer.anchors，框架只经过它知道，统筹第 4 条）；行里面的尺寸（字形多大、数字多宽，各在自己画法的
//   staff/glyphs.ts、jianpu/glyphs.ts，写死的数，排版不现场量；现场量的只有歌词和名字）；框架自己的尺寸（frame/params.ts）。
import type { Density } from "../score/paper.ts";
import type { NotationId } from "../score/song-view.ts";
import type { SpacingMode, SpringPts } from "./spacing.ts";
import { TPQ } from "../score/song.ts";
import type { RowKind } from "./notations.ts";

/** 纸一级（按这首歌的谱种 × 版式）：行与行之间多空（sysGap，sp）、音距曲线（curve：v0.16.43 起跟版式，user 11-09「舒适 = 大谱、音距正常 / 紧凑 = 小谱、音距紧」）、
 *  一行最多压紧多少（squeeze，弹簧的比例）、一行最多拉宽到自然宽的几倍（maxStretch；Infinity = 不设上限、拉满整行 = 五线谱现在的样子，第六刀才改）。 */
export interface PaperParams { sysGap: number; curve: SpacingMode | SpringPts; squeeze: number; maxStretch: number; /** 一小节里一样长的音等距（spacing.ts lineGaps 的 even）。 */ evenBars?: boolean;
  /** 歌词字号再乘多少（没写 = 1）：简谱 = 样张的「歌词 0.727 个数字字号」换算出来的（第五刀）。 */ lyricScale?: number;
  /** 左边歌手名的字号再乘多少（没写 = 1）：简谱 = 样张的「名字 0.545 个数字字号」换算出来的（第五刀）。 */ nameScale?: number }
/** 数字行的尺寸比例：数字字号（mm）÷（2.5 个线间距 × 这一档一个线间距的 mm）。舒适 3.6 / (2.5 × 1.75)、紧凑 3.0 / (2.5 × 1.25)（第五刀 5-0c）。 */
const JP_COZY = 3.6 / (2.5 * 1.75), JP_COMPACT = 3.0 / (2.5 * 1.25);
/** 简谱的弹簧（第五刀 5-0c，user「字有点大……有点太舒适了」）：一拍一格——四分一个字位、二分两个、全音符四个（横线一拍一根）；短音只比数字宽一点（「密的声部自己挤紧，短音只占字宽」）。
 *  按数字原大（scale 1）起的数，乘这一档的尺寸比例；A5 舒适档四拍子、四分和八分为主的旋律一行约 6 小节（测试守着）。 */
//   第五刀起照样张（施工单第五节「简谱的样子以当时的样张为准」）：一拍以内 = 样张的对数弹簧（字号 22 px 时 5 + 6.8·log2(1 + 4×几拍) px，换算成数字行的单位 ×2.5/22）；
//   一拍以上 = 每拍一个一拍的宽（样张里长音的每条横线自己占一列）；附点四分照对数。
const mockSpring = (q: number): number => ((5 + 6.8 * Math.log2(1 + 4 * q)) * 2.5) / 22;
const jianpuSprings = (k: number): SpringPts => ([[TPQ / 8, mockSpring(1 / 8)], [TPQ / 4, mockSpring(1 / 4)], [TPQ / 2, mockSpring(1 / 2)], [TPQ, mockSpring(1)], [TPQ * 1.5, mockSpring(1.5)], [TPQ * 2, 2 * mockSpring(1)], [TPQ * 4, 4 * mockSpring(1)]] as const).map(([t, w]) => [t, w * k] as const);
export const PAPER_PARAMS: Readonly<Record<NotationId, Readonly<Record<Density, PaperParams>>>> = {
  staff: { cozy: { sysGap: 0.4, curve: "normal", squeeze: 0.15, maxStretch: Infinity }, compact: { sysGap: 0, curve: "tight", squeeze: 0.15, maxStretch: Infinity } },
  // 简谱：一行最多拉宽约 1.3 倍，放不满就让右边空着（UX 稿第 8 节 §51）
  //   一小节里一样长的音等距（UX 稿第 8 节验收：别的声部折叠成和弦、琶音让位之后手鼓每小节八分等距）
  //   歌词：样张 = 0.727 个数字字号（舒适档歌词基准 1.6 线间距 × 1，紧凑 × 1.15，text/style.ts LYRIC_LOOK）
  jianpu: { cozy: { sysGap: 0.4, curve: jianpuSprings(JP_COZY), squeeze: 0.15, maxStretch: 1.3, evenBars: true, lyricScale: (0.727 * 2.5 * JP_COZY) / (1.6 * 1), nameScale: (0.545 * 2.5 * JP_COZY) / (1.36 * 1) }, compact: { sysGap: 0, curve: jianpuSprings(JP_COMPACT), squeeze: 0.15, maxStretch: 1.3, evenBars: true, lyricScale: (0.727 * 2.5 * JP_COMPACT) / (1.6 * 1.15), nameScale: (0.545 * 2.5 * JP_COMPACT) / (1.36 * 1.4) } },   // 名字：正文字号 1.36 线间距 × 字的尺子（紧凑 1.4）
};
/** 行一级（按这一行的种类 × 版式；单位 sp，从行身算：行身 = 画法的竖向锚点 top–bottom）：行身上面最少留多少（above）、整行最少多高（rowH 有歌词 / rowHNoLyric 没歌词 /
 *  graveUpper 大谱表上面那条：没歌词、紧挨着下面那条）、歌词基线在行身下沿往下多少（lyricBelow）、谱上方贴挂件时下面什么墨都没有就贴在行身上沿上方多远（clear；
 *  五线谱 2.4 = 躲开符干的老手感，数字行没有符干）、行里的尺寸比例（scale：这种行自己的字形 / 偏移 / 线宽统一乘它，竖向锚点也按它取）。墨多了照天际线往外让（engrave 第 12 步），这里只是最小值。
 *  数字行（第五刀 5-0c，user 看了 A5 成品「字有点大……有点太舒适了」）：数字字号舒适 3.6 mm、紧凑约 3.0 mm（不跟着纸变）——数字字号是 2.5 × scale 个线间距，
 *  舒适一个线间距 1.75 mm → scale 0.823，紧凑 1.25 mm → 0.96；行距的最小值跟着乘（别只缩字）。
 *  五线谱：舒适 = 谱 7 mm、行距用原来紧凑那一档（user 2026-10-08「舒适的行距太宽了，反而不舒适。和紧凑的对齐」；0.2.x 的 17 sp 退役）；
 *  紧凑 = 谱 5 mm、再卷一点（「紧凑也许可以再卷一点」）：谱上面 / 歌词下面都收、没歌词的那条谱更矮。 */
/** barNoPad = 每行开头的小节号量天际线时往右多看多宽（线间距）：数字行行首紧挨着就是第一个数字 / 横线，要让到它上面（统筹看样张 ⑪）；五线谱那里是谱号，小节号照老规矩压在谱号上方，不看右边。 */
export interface RowParams { above: number; rowH: number; rowHNoLyric: number; graveUpper: number; lyricBelow: number; clear: number; scale: number; barNoPad: number }
/** 数字行的行一级参数：按数字原来的大小（scale 1）起的数，整体乘 scale（行高、各道的距离跟着字号一起收）。 */
const jianpuRow = (k: number, v: Omit<RowParams, "scale">): RowParams => ({ above: v.above * k, rowH: v.rowH * k, rowHNoLyric: v.rowHNoLyric * k, graveUpper: v.graveUpper * k, lyricBelow: v.lyricBelow * k, clear: v.clear * k, scale: k, barNoPad: v.barNoPad * k });
//   第五刀起照样张：行身 = 小节线那一段（基线上 1.82 到基线下 1.0 个字号）；行顶到行身上沿 0.82 个字号；歌词基线在行身下沿下面 0.82 个字号（= 数字基线下 1.82）；
//   一行（有歌词）从行顶到下一行行顶 5.45 个字号、没歌词 4.73 个（含纸一级的行间 sysGap）。紧凑档样张里没有：照舒适的收一成。单位 = 数字行的单位（一个字号 = 2.5）
const JIANPU_ROW_PARAMS: Readonly<Record<Density, RowParams>> = { cozy: jianpuRow(JP_COZY, { above: 2.05, rowH: 13.2, rowHNoLyric: 11.4, graveUpper: 11.4, lyricBelow: 2.05, clear: 0.8, barNoPad: 1.5 }), compact: jianpuRow(JP_COMPACT, { above: 1.85, rowH: 11.9, rowHNoLyric: 10.3, graveUpper: 10.3, lyricBelow: 1.85, clear: 0.8, barNoPad: 1.5 }) };
export const ROW_PARAMS: Readonly<Record<RowKind, Readonly<Record<Density, RowParams>>>> = {
  staff: { cozy: { above: 4.6, rowH: 13.4, rowHNoLyric: 11, graveUpper: 9.4, lyricBelow: 4.4, clear: 2.4, scale: 1, barNoPad: 0 }, compact: { above: 4, rowH: 12.2, rowHNoLyric: 9.6, graveUpper: 8.6, lyricBelow: 4, clear: 2.4, scale: 1, barNoPad: 0 } },
  // 数字行（行身 = 小节线那一段，jianpu/glyphs.ts JP_BODY）：没有五条线，比五线谱的行矮；数字行不分大谱表（graveUpper 用不上，照没歌词的填）
  jianpu: JIANPU_ROW_PARAMS,
  jianpuX: JIANPU_ROW_PARAMS,   // 鼓的 X 行：和数字行同一个行身、同一套行距（第五刀 5-4）
};
