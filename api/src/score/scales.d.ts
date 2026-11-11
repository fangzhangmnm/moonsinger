import { type Pitch } from "./pitch.ts";
export interface ScaleDeg {
    deg: number;
    alt: number;
}
export interface Scale {
    id: string;
    name: string;
    group: string;
    degs: ScaleDeg[];
    home: number;
}
/** 滚轮里的顺序 = 这个数组的顺序（常用的在前）。 */
export declare const SCALES: Scale[];
export declare const DEFAULT_SCALE = "major";
export declare const scaleById: (id: string) => Scale;
/** pad 上第 k 个音（k 可以是负数）：k = 0 是 do（「1=」那个音，do 所在的八度由 tonicD 定）那一级，往上一个调式音一格。
 *  tonicD = do 的五线谱位置（diatonicIndex），fifths = 「1=」的调号。 */
export declare function ladderAt(sc: Scale, k: number, tonicD: number, fifths: number): {
    pitch: Pitch;
    deg: ScaleDeg;
    oct: number;
};
/** 第一个音高 ≥ midi 的那一级（绝对排法：每行从 C 起）。 */
export declare function ladderFirstAtOrAbove(sc: Scale, midi: number, tonicD: number, fifths: number): number;
/** 主音离 do 最近的那一级（首调排法：从主音起）。 */
export declare function ladderHome(sc: Scale, tonicD: number, fifths: number): number;
/** 简谱写法：带升降的音级（♯4 / ♭7）。 */
export declare const degLabel: (g: ScaleDeg) => string;
