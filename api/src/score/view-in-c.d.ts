import type { Song, Token, KeyTok } from "./song.ts";
import { type Pitch } from "./pitch.ts";
export interface KeyTokInC extends KeyTok {
    realFifths: number;
}
/** 调号记号原来是几个升降号（没换算过的 = 它自己的）。 */
export declare const realFifthsOf: (t: KeyTok) => number;
/** 一个实际音高（在 fifths 那个调里）按 C 调看是哪个音。 */
export declare function toC(p: Pitch, fifths: number): Pitch;
/** 按 C 调看时往上 / 往下挪了几级（拖音高：显示上的第 d 级 − 这个 = 实际的第几级）。 */
export declare const stepsToC: (fifths: number) => number;
/** 一条 track：每个音按它前面最近的调号换到 C；调号记号 → 0 个升降号 + realFifths。 */
export declare function trackInC(tokens: readonly Token[]): Token[];
/** 整首：skip(声部 id) = 不换（鼓：写的音高 = 敲哪个鼓）。 */
export declare function songInC(song: Song, skip: (partId: string) => boolean): Song;
