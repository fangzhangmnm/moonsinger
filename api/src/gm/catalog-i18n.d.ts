/** 分类标签：中文 → 英文。键是数据里的 zh，取货换了字这里会红。 */
export declare const DEF_EN: Record<string, string>;
/** 概念（乐器）在界面上叫什么。 */
export declare function conceptName(names: {
    zh: string;
    en: string;
}): string;
/** 概念名下面那一行 = 谱上名 + 详细说明（v0.16.2）：中文界面 = 谱上名 · 百科英文名（和谱上名不同才写）· 日文；英文界面（主名已是百科英文名）= 谱上名（不同才写）· 日文。
 *  user 2026-11-07「所以应该是有详细解释，名字，简写？」：谱上名先写（选了它谱上就写这个），百科名留着当说明。中文名搜索照样能搜到。 */
export declare function conceptAlt(scoreName: string, names: {
    en: string;
    ja?: string;
}): string;
/** 分类标签。英文界面没对照的 = 原样（测试守着不会没有）。 */
export declare function defLabel(zh: string): string;
/** 只有中文的长说明：英文界面不显示。 */
export declare function zhOnly(s: string): string;
