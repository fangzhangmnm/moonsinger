/** 歌名折行（v0.16.58，user 11-09「曲名应该能换行」）：放得下 = 一行；放不下 = 先在空格处断（「陽だまり道とれんちょん 简单笛子版」= 两行），
 *  一个词本身比一行还宽（中文 / 日文整串没有空格）= 按字断；行首不放标点和小写假名（把上一行最后一个字带下来）。w = 量宽（px），max = 一行最宽（px）。 */
export declare const NO_LINE_START: Set<string>;
export declare function wrapTitle(s: string, w: (t: string) => number, max: number): string[];
