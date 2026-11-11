import type { Token } from "./song.ts";
export type LyricWhy = "notSung" | "kanji" | "beats" | "script";
export type LyricLang = "ja" | "zh" | "en";
export interface LyricIssue {
    why: LyricWhy;
    beats?: number; /** 这个字所在的句按哪种语言唱（提示文案用）。 */
    lang: LyricLang;
}
/** 一段假名几拍：小字（ゃ / っ…）不算、ー 算一拍。 */
export declare const kanaBeats: (s: string) => number;
/** engine = 台上这位的引擎（tsukuyomi / vowel-sampler / soundfont；没人 / 认不出 = 不逐个画灰，整条本来就不出声）；langAt = 下标 i 的字所在的句按哪种语言唱（一种语言也行：直接给字符串）。
 *  返回 下标 → 为什么。 */
/** lyrics = 台上这位唱不唱字（插件能力，ADR-0004：words 唱字 / hum 只哼 / none 不唱）；null = 没人上场 = 不画灰（照旧能写，多半等着请人）。 */
export declare function lyricIssues(tokens: Token[], lyrics: "words" | "hum" | "none" | null | undefined, langAt: LyricLang | ((i: number) => LyricLang)): Map<number, LyricIssue>;
/** 给人看的那句话。 */
export declare function lyricWhyText(x: LyricIssue, engineName: string): string;
/** 引擎念成什么的显示（v0.9.34，歌词框下面那条）：日语前端的音素写成好认的样子——ん（N_n / N_m / N_ng…）= n，促音 cl = 双写下一个辅音（cl + ch = tch）；
 *  几拍的「-」照留。中文照原样（国际音标 + 声调数字，不硬转拼音：转错了比不转更误导）。 */
export declare function prettyReading(lang: string, x: string): string;
