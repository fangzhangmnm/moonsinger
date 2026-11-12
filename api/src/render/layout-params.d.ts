import type { Density } from "../score/paper.ts";
import type { NotationId } from "../score/song-view.ts";
import type { SpacingMode, SpringPts } from "./spacing.ts";
import type { RowKind } from "./notations.ts";
/** 纸一级（按这首歌的谱种 × 版式）：行与行之间多空（sysGap，sp）、音距曲线（curve：v0.16.43 起跟版式，user 11-09「舒适 = 大谱、音距正常 / 紧凑 = 小谱、音距紧」）、
 *  一行最多压紧多少（squeeze，弹簧的比例）、一行最多拉宽到自然宽的几倍（maxStretch；两种谱都是 1.3，第六刀起；Infinity = 不设上限、拉满整行）。 */
export interface PaperParams {
    sysGap: number;
    curve: SpacingMode | SpringPts;
    squeeze: number;
    maxStretch: number; /** 一小节里一样长的音等距（spacing.ts lineGaps 的 even）。 */
    evenBars?: boolean;
    /** 歌词字号再乘多少（没写 = 1）：简谱 = 样张的「歌词 0.727 个数字字号」换算出来的（第五刀）。 */ lyricScale?: number;
    /** 左边歌手名的字号再乘多少（没写 = 1）：简谱 = 样张的「名字 0.545 个数字字号」换算出来的（第五刀）。 */ nameScale?: number;
    /** 数字行的小节线从哪画到哪（7-I，等 user 定；没写 = body）：body = 行身（帽子那一层的顶到数字下面，样张的高线）；notes = 只兜住音那一带
     *  （这一行最高那个数字——和弦叠多高兜多高——的顶，到最深那条下划线的底；帽子、换气、力度、八度点在外面）。 */ barSpan?: "body" | "notes";
}
export declare const PAPER_PARAMS: Readonly<Record<NotationId, Readonly<Record<Density, PaperParams>>>>;
/** 行一级（按这一行的种类 × 版式；单位 sp，从行身算：行身 = 画法的竖向锚点 top–bottom）：行身上面最少留多少（above）、整行最少多高（rowH 有歌词 / rowHNoLyric 没歌词 /
 *  graveUpper 大谱表上面那条：没歌词、紧挨着下面那条）、歌词基线在行身下沿往下多少（lyricBelow）、谱上方贴挂件时下面什么墨都没有就贴在行身上沿上方多远（clear；
 *  五线谱 2.4 = 躲开符干的老手感，数字行没有符干）、行里的尺寸比例（scale：这种行自己的字形 / 偏移 / 线宽统一乘它，竖向锚点也按它取）。墨多了照天际线往外让（engrave 第 12 步），这里只是最小值。
 *  数字行（第五刀 5-0c，user 看了 A5 成品「字有点大……有点太舒适了」）：数字字号舒适 3.6 mm、紧凑约 3.0 mm（不跟着纸变）——数字字号是 2.5 × scale 个线间距，
 *  舒适一个线间距 1.75 mm → scale 0.823，紧凑 1.25 mm → 0.96；行距的最小值跟着乘（别只缩字）。
 *  五线谱：舒适 = 谱 7 mm、行距用原来紧凑那一档（user 2026-10-08「舒适的行距太宽了，反而不舒适。和紧凑的对齐」；0.2.x 的 17 sp 退役）；
 *  紧凑 = 谱 5 mm、再卷一点（「紧凑也许可以再卷一点」）：谱上面 / 歌词下面都收、没歌词的那条谱更矮。 */
/** barNoPad = 每行开头的小节号量天际线时往右多看多宽（线间距）：数字行行首紧挨着就是第一个数字 / 横线，要让到它上面（统筹看样张 ⑪）；五线谱那里是谱号，小节号照老规矩压在谱号上方，不看右边。 */
export interface RowParams {
    above: number;
    rowH: number;
    rowHNoLyric: number;
    graveUpper: number;
    lyricBelow: number;
    clear: number;
    scale: number;
    barNoPad: number;
}
export declare const ROW_PARAMS: Readonly<Record<RowKind, Readonly<Record<Density, RowParams>>>>;
