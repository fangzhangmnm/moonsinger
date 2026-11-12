import { type Pitch } from "./pitch.ts";
/** 音 → 相对 fifths 这个调的简谱：音级 1–7、八度偏移（主音在第 4 个八度那一组 = 0）、相对调内音的升降。 */
export declare function toDegree(p: Pitch, fifths: number): {
    degree: number;
    shift: number;
    acc: number;
};
/** 简谱 → 音（相对 fifths）。 */
export declare function fromDegree(degree: number, shift: number, acc: number, fifths: number): Pitch;
/** 八度基准按乐器音域（UX 稿第 3 节「按乐器音域自动定」；第五刀 5-4）：音域两头（MIDI，宿主从乐器目录 / 演奏者查好）在这个调里的八度偏移取中间（一样近取离 0 近的）。
 *  音域里的音上下最多一个点、宽的乐器偶尔两个。 */
export declare function rangeBase(lo: number, hi: number, fifths: number): number;
/** 八度基准「点最少」（UX 稿第 3 节的退路；按乐器音域定 = 第五刀）：一串音的八度偏移 → 让点的总数最少的那个基准（中位数；一样少取离 0 近的）。没有音 = 0。 */
export declare function fewestDotsBase(shifts: readonly number[]): number;
