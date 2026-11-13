import { type Token, type Hum, type TempoMap } from "./song.ts";
import type { SingMark } from "../format/performance.ts";
export interface LabEntry {
    kana: string;
    notes: [number, number][];
    rest?: number;
    hum?: boolean;
    hyph?: boolean;
    before?: "^" | "v" | "O";
    whisper?: boolean;
    inhale?: boolean;
}
export type SingLang = "ja" | "zh" | "en";
export interface LabScore {
    SCORE: LabEntry[];
    TEXT: string;
    TEMPO_QUARTER: number;
    LANG: SingLang;
}
/** 「哼的字」四档在两种语言里的字：la 舌尖起音、节奏最清楚；n 闭嘴哼（同高的几个音会连成一个）；u = Ooh；a = Ahh（GM 人声兜底的两个元音）。 */
export declare const HUM_SYLLABLE: Record<Hum, Record<SingLang, string>>;
/** tokens = 一个声部（压平后的一串）；tempoMap = 第一个声部的速度表（这个声部不是第一个时给，自己串里的速度记号不算数）。 */
/** range = 只出这一段的 token（下标 [from, to)；月读分段唱用，见 singChunks）——速度、没写音高的音照样按整串的上下文算。不给 = 整串。 */
/** tokenEntry = 顺手记下「token 下标 → 它唱成第几条」（拖腔 / 连音线并进前一条的也记前一条；按键试听用）。 */
/** sing = 这位乐手的「记号 → 字前记号」表（候选按值带的，PerfSpec.sing；16-4 A 起必须给，这一层不带默认）。 */
export declare function toLabScore(tokens: Token[], hum: Hum, lang: SingLang, tempoMap: TempoMap | undefined, sing: Record<string, SingMark | null>, range?: readonly [number, number], tokenEntry?: Map<number, number>): LabScore;
/** 月读分段唱（2026-10-08 深夜 Opus 5.5；user「对我也觉得分开唱复用」「月读至少拆成句级别」「开关是歌手的属性，可以有不同的粒度」）：
 *  一口气唱完一整首 = 唱法核心整段算（piper 一次念完、WORLD 整段分析 + 重唱），长歌把 iPad 的内存撑爆（团子大家族 195.6 s 必崩）；
 *  分段 = 一段唱完就放掉（峰值 = 最长那段），重复的段 / 没改的句子按内容复用。whole = 一整首；sheet = 每张纸；phrase = 每张纸里再在够长的休止处切。
 *  返回 token 下标范围 [from, to)；没有音的段不要。 */
export type SingChunkMode = "phrase" | "sheet" | "whole";
export declare const PHRASE_REST_SEC = 0.25;
export declare function singChunks(tokens: Token[], tempoMap: TempoMap | undefined, bounds: readonly number[], mode: SingChunkMode): [number, number][];
