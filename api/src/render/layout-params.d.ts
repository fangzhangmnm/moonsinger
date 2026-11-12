import type { Density } from "../score/paper.ts";
import type { NotationId } from "../score/song-view.ts";
import type { SpacingMode } from "./spacing.ts";
import type { RowKind } from "./notations.ts";
/** 纸一级（按这首歌的谱种 × 版式）：行与行之间多空（sysGap，sp）、音距曲线（curve：v0.16.43 起跟版式，user 11-09「舒适 = 大谱、音距正常 / 紧凑 = 小谱、音距紧」）、
 *  一行最多压紧多少（squeeze，弹簧的比例）、一行最多拉宽到自然宽的几倍（maxStretch；Infinity = 不设上限、拉满整行 = 五线谱现在的样子，第六刀才改）。 */
export interface PaperParams {
    sysGap: number;
    curve: SpacingMode;
    squeeze: number;
    maxStretch: number;
}
export declare const PAPER_PARAMS: Readonly<Record<NotationId, Readonly<Record<Density, PaperParams>>>>;
/** 行一级（按这一行的种类 × 版式；单位 sp，从行身算：行身 = 画法的竖向锚点 top–bottom）：行身上面最少留多少（above）、整行最少多高（rowH 有歌词 / rowHNoLyric 没歌词 /
 *  graveUpper 大谱表上面那条：没歌词、紧挨着下面那条）、歌词基线在行身下沿往下多少（lyricBelow）、谱上方贴挂件时下面什么墨都没有就贴在行身上沿上方多远（clear；
 *  五线谱 2.4 = 躲开符干的老手感，数字行没有符干）。墨多了照天际线往外让（engrave 第 12 步），这里只是最小值。
 *  五线谱：舒适 = 谱 7 mm、行距用原来紧凑那一档（user 2026-10-08「舒适的行距太宽了，反而不舒适。和紧凑的对齐」；0.2.x 的 17 sp 退役）；
 *  紧凑 = 谱 5 mm、再卷一点（「紧凑也许可以再卷一点」）：谱上面 / 歌词下面都收、没歌词的那条谱更矮。 */
export interface RowParams {
    above: number;
    rowH: number;
    rowHNoLyric: number;
    graveUpper: number;
    lyricBelow: number;
    clear: number;
}
export declare const ROW_PARAMS: Readonly<Record<RowKind, Readonly<Record<Density, RowParams>>>>;
