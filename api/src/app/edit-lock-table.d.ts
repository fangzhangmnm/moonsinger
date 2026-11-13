import type { Song } from "../score/song.ts";
/** 一类「看法」。 */
export interface LookOp {
    /** 这类看法进不进文件。进 = 锁着时动过，文档就算「脏了」（脏是和上次存的样子比出来的），只是锁着期间不写；解锁之后照常存
     *  （user 11-08：「切换可见性在编辑模式里面当然是需要保存的…只是说在锁定模式的时候，你 dirty 的时候也没法写」）。 */
    readonly inFile: boolean;
    /** 这一步真的只动了这类看法吗（改之前的歌、改之后的歌）。写入口和撤销重做放行之前都问。 */
    readonly verify: (prev: Song, next: Song) => boolean;
}
/** 两首歌除了「哪几段隐藏着」之外一模一样（按引用比：歌是结构共享的，没动过的东西还是同一个对象）。完全没变也算。 */
export declare function sameExceptPaperHidden(a: Song, b: Song): boolean;
/** 两首歌除了「这首歌怎么看」的那几样（歌顶层的 notation / chordTags / viewInC / middleC + 每个声部的 chords；src/score/song-view.ts）之外一模一样。按引用比；完全没变也算。 */
export declare function sameExceptSongView(a: Song, b: Song): boolean;
/** 纸张（A3 横 / A4 / A5 / A6 / 其他）：歌顶层的 paper 和 marginMm（17-1 起纸张和版式是歌顶层的四个键）。版式和谱高不许跟着变（换纸只换纸，统筹 2026-11-12）。 */
export declare const sameExceptPaperSize: (a: Song, b: Song) => boolean;
/** 版式（舒适 / 紧凑）：歌顶层的 density 和 staffMm。纸的种类、尺寸、边距不许跟着变。 */
export declare const sameExceptDensity: (a: Song, b: Song) => boolean;
/** 小节号印不印：歌顶层的 barNumbers。 */
export declare const sameExceptBarNumbers: (a: Song, b: Song) => boolean;
/** 歌词排法（按节奏 / 按歌词）：歌顶层的 lyricFit。 */
export declare const sameExceptLyricFit: (a: Song, b: Song) => boolean;
/** 看法的明文名单。加一类 = 这里加一行 + src/score/history.ts 的 LocusKind 加这个词 + 它的调用点带上这个类别
 *  （test/edit-lock-guard.test.mjs 钉：名单里的词必须真有写入口的调用点在用；带这个类别的调用点不许带 gesture）。 */
export declare const LOOK_OPS: Readonly<Record<string, LookOp>>;
/** 这个类别是不是看法（锁着也能做）。没给 / 没列 = 不是。 */
export declare function isLookOp(kind: string | null | undefined): boolean;
/** 这个看法进不进文件（不是看法 → false）。 */
export declare function lookOpInFile(kind: string | null | undefined): boolean;
/** 这一步自己报的类别 → 实际按哪个类别问锁：是看法、并且核过真的只动了那类看法 = 原样；否则一律 `fallback`（内容）。 */
export declare function effectiveKind<K extends string>(claimed: K, fallback: K, prev: Song, next: Song, extrasChanged: boolean): K;
/** 两首歌只差「看法」（表里所有进文件的看法合起来）吗。脏分成两种时用：只差看法 = looks，别的 = content。 */
export declare function sameModuloLooks(a: Song, b: Song): boolean;
