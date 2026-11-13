import type { Token } from "./song.ts";
/** 一段文字按文字系统唱哪种语言（唱 / 画灰按段用它：喂小月相一段的字，timeline.ts sungPlan）：有假名 → 日；有汉字（没假名）→ 中；拉丁字母 → 英；都没有（数字 / 符号 / 空）→ null = 跟前面的。 */
export declare const scriptLang: (lyric: string) => "ja" | "zh" | "en" | null;
/** 这条声部的默认语言：整条歌词里有假名 → 日；只有汉字 → 中；只有拉丁字母 → 英；什么都没有 → 日。 */
export declare function partDefaultLang(tokens: Token[]): string;
/** 每个下标按逐音节规矩认的语言（有歌词、不含拖腔记号的音符 = 语言，别的 = null）。只在没给唱的那一份语言时写 xml:lang 用（project.ts 存档给的是唱的那一份）。 */
export declare function syllableLangs(tokens: Token[]): (string | null)[];
