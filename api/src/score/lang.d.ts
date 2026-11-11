import type { Token } from "./song.ts";
/** 一段文字按文字系统唱哪种语言（唱 / 画灰按段用它：喂小月相一段的字，timeline.ts sungPlan）：有假名 → 日；有汉字（没假名）→ 中；拉丁字母 → 英；都没有（数字 / 符号 / 空）→ null = 跟前面的。 */
export declare const scriptLang: (lyric: string) => "ja" | "zh" | "en" | null;
/** 这条声部的默认语言：整条歌词里有假名 → 日；只有汉字 → 中；只有拉丁字母 → 英；什么都没有 → 日。 */
export declare function partDefaultLang(tokens: Token[]): string;
/** 每个下标的语言：有歌词（不含拖腔记号）的音符 = 语言，别的 = null。override = 用音符上记着的 lang（编辑 / 唱用）；false = 只算自动认的（判断要不要记）。 */
export declare function syllableLangs(tokens: Token[], override?: boolean): (string | null)[];
/** 读档用：每个音节读到的语言（null = 文件里没写）→ 只在和自动认（按前面已定的语言往后推）不一样的音符上记 lang。原地改 tokens 里的音符。 */
export declare function keepOnlyOverrides(tokens: Token[], read: (string | null)[]): void;
