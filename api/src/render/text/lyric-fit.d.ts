export interface LyricFit {
    dx: number; /** 宽度倍数（乘在这一档平常的宽度上；1 = 不收）。 */
    sx: number;
    tight: boolean;
}
export interface LyricItem {
    cx: number;
    w: number;
    hy?: boolean; /** 方块字：宽度跟整段统一（不各收各的）。 */
    block?: boolean;
}
/** 歌词之间的缝怎么算（v0.16.48；user 11-09「空格要不要用就是零点七五个字距。就是空格本来默认就挤一点」「先把这个空格的定义是什么搞清楚，每个字每个字形把它给理清楚」）：
 *  · 字宽 w = 这个音节按字形量出来的前进宽度（含字形自带的左右留白；宿主按这一档的字号 / 平常宽度量好传进来）；
 *  · 空格 space = 这款字里空格字符「 」的前进宽度 × 0.6（默认就比正常空格紧；user「连字符和空格都可以默认省一点…只要能勉强看出节奏就行了」），中英文同一个定义；
 *  · 连字符 hyphen = 连字符「-」画出来的宽度（压到 HYPHEN_SX）+ 一个上面那种空格（两边各半个）；方块字挨着的连字符不占地方（挂在两个方块字中间本来就有的那道小缝里，user「方块字的排版最好能忽视连字符」）；
 *  · 缝跟着左右两个字里**更窄的那个**一起收（× min(f)，user「空格和最窄的邻居宽度对齐」），挤的时候**先压缝、再压字**（缝最多压到 GAP_MIN）。单位都是 sp。 */
export interface LyricGaps {
    space: number;
    hyphen: number; /** 缝再挤也至少留这么宽（sp）；没给 = GAP_FLOOR。按档的数在样式表 LYRIC_LOOK.gapFloor。 */
    floor?: number;
}
/** 没量的时候的默认（测试 / 没有量字的宿主）：歌词字号 1.6 sp 的系统无衬线体，空格约 0.27 字宽、连字符约 0.33 字宽。 */
export declare const LYRIC_SPACE = 0.6, HYPHEN_SX = 0.8, GAP_MIN = 0.5;
/** 缝再挤也至少留这么宽（sp）：能看出是两个词（user「只要能勉强看出节奏就行了」；v0.16.48 第一版没有底线 = 英文连成一片「bovetheworld」）。排版器按档传（LyricGaps.floor ← LYRIC_LOOK.gapFloor）；这个是没给时的默认。 */
export declare const GAP_FLOOR = 0.2;
export declare const DEFAULT_GAPS: LyricGaps;
/** 这一行的方块字至少要压到多宽才不挤（1、0.95…minSx 里取最宽的那个；压到底也救不了 = 救得最多的那个）。整段取各行里最窄的 = 整段统一的宽度。 */
export declare function lyricBlockSx(items: readonly LyricItem[], minSx?: number, gaps?: LyricGaps): number;
/** 歌词按节奏排的让路（v0.9.40 立；v0.16.43 整行一起缩；v0.16.44 字高不动、只收宽度；v0.16.47 改成上面那个小优化问题——见 solveLyrics）。
 *  items 按 cx 排好；blockSx = 方块字整段统一的宽度（宿主按 lyricBlockSx 对整段取最窄）；gaps = 空格 / 连字符按字形量的宽度（LyricGaps）。纯函数。 */
export declare function fitLyrics(items: readonly LyricItem[], blockSx?: number, minSx?: number, gaps?: LyricGaps): LyricFit[];
/** 连字符要摆的一个音节（按谱上的先后）。x = 字的中心；hw = 让路之后的半宽、sx = 让路之后的宽度倍数（没走让路 = 都不给）；
 *  cjk = 这个音节是方块字（中日韩：旁边的连字符挂在缝里、不占地方）；row = 在哪一行（跨行的连字符挂在左边那个字后面）。单位随宿主，全用同一个就行。 */
export interface HyphenSyl {
    x: number;
    hy?: boolean;
    hw?: number;
    sx?: number; /** 没走让路时的半宽（字照原样画多宽）：只拿来找缝的正中，不按它判放不放得下。 */
    nw?: number;
    cjk: boolean;
    row: number;
}
/** 连字符摆哪（2026-11-09 从 engrave 抽出来，行为不变）：每个带连字符的音节 → 摆的 x + 跟着压几成（hf）；null = 不画。
 *  · 和下一个音节在同一行：摆在两个字之间那道缝的正中（原来是两个中心的正中 = 贴着长的那个，user 11-09 看着像虚线）；
 *    缝放不下一个连字符 = 不画（常见打谱软件的做法；挤了才会）；方块字旁边的连字符挂在缝里、不占地方，照画；hf = 左右更窄的那个字压到几成。
 *  · 没走让路（按节奏排以外的排法）：给了 nw = 照样摆在缝的正中、但照画（这一档的音距本来就按歌词留够了）；没给 = 两个中心的正中
 *    （v0.16.78 起宿主都给：两个中心的正中 = 贴着宽的那个字，user 11-09「un -der」「dar -ling」）；· 下一个在别的行 / 没有下一个：左边那个字后面 lonely 那么远。
 *  hyphenW = 一个连字符（没压）占的宽度。下标和 syls 对齐；不带连字符的 = null。 */
export declare function hyphens(syls: readonly HyphenSyl[], hyphenW: number, lonely: number): ({
    x: number;
    hf: number;
} | null)[];
