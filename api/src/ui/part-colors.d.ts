/** matplotlib 的 tab20：十种颜色，每种一深一浅。 */
export declare const TAB20: readonly ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"];
/** 类别 → tab20 的第几种颜色（0–9）。 */
declare const HUE: Record<string, number>;
export type PartCategory = keyof typeof HUE;
export declare const CATEGORY_LABEL: Record<string, string>;
/** 角色的 sound id → 类别。 */
export declare function categoryOfSound(sound: string): PartCategory;
/** 每个声部在 tab20 里的下标：同一类都用深的那个（v0.10.43；浅的那半不用了——user 10-10「我不太喜欢淡色alternative，可读性太差」、10-11「我之前说了二号同样乐器不要用弱颜色，宁愿用和一号一样的」；
 *  起因：主人不在时合租那一行归 Piano 2，它的浅蓝播放高亮在纸上几乎看不见，user「piano1不在的时候23的高亮动画没有」）。 */
export declare function partColorIndices(sounds: readonly string[]): number[];
/** 名字自己缩短（目录里没有简写、或者用户自己起了名字）：中文 / 日文 = 前两个字；英文一个词 ≤ 5 个字母 = 原样，长的 = 前三个字母加点；几个词 = 首字母加点。 */
export declare function shortName(name: string): string;
/** 显示宽度：半角 = 1，全角（汉字 / 假名 / 谚文 / 全角符号）= 2。 */
export declare const dispWidth: (s: string) => number;
/** 简写那一列的定宽（显示宽度；v0.9.41，user 经仓鼠转达「没简写的能不能想办法也按定宽裁一下，不然有一个没查到简写就beat the propose了，然后让opus也处理下用户的自定义输入，也要处理定宽」）。
 *  7：仓鼠 v12 有出处的 123 个简写里 ≤ 7 的约八成，去掉句点后的空格之后更多；再宽谱前就太占地方（iPad mini）。 */
export declare const ABBR_W = 7;
/** 按定宽裁（号也算在宽度里）：① 放得下 = 原样 ② 去掉句点后的空格（Bar. Sax. → Bar.Sax.）③ 还宽就截——拉丁字截到 W − 1 再补「.」，全角字截到放得下为止（不补点）。 */
export declare function fitAbbr(base: string, num?: string, W?: number): string;
export {};
