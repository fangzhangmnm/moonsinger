/** 谱上的级数 → 局部 y（sp，第五线 = 0，往下为正）。 */
export declare const yLocal: (d: number) => number;
/** 符尾有几层：八分 1、十六分 2、三十二分 3；四分及更长 0。 */
export declare const flagLevel: (base: number) => number;
export interface StemNote<K> {
    key: K;
    x: number;
    dHi: number;
    dLo: number;
    base: number;
    beat: number;
    system: number;
    staff: number;
    ghost: boolean;
    handUp?: boolean;
}
/** 坐标系：u = 一个线间距多长；y(d, 音) = 谱上第 d 级在哪（同一条谱上 d 大 = y 小）。 */
export interface Frame<K> {
    u: number;
    y: (d: number, n: StemNote<K>) => number;
}
/** 局部坐标：单位 = 线间距，y 从第五线往下量。 */
export declare const LOCAL: Frame<unknown>;
/** 朝向的规矩：auto = 按音高；up / down = 一律；kit = 五线鼓谱（一组里有手打的 = 朝上）。 */
export type StemDir = "auto" | "up" | "down" | "kit";
export interface StemOut {
    up: boolean;
    x: number;
    y0: number;
    tip: number;
    top: number;
    beamed: boolean;
    flag: {
        x: number;
        y: number;
        level: number;
    } | null;
}
/** 一根符杠（或一截）：平行四边形，左上 (xL, yL)、右上 (xR, yR)，往下 th（朝下的组 th < 0 = 往上长）。 */
export interface BeamOut {
    xL: number;
    yL: number;
    xR: number;
    yR: number;
    th: number;
    ghost: boolean;
}
/** 一条谱上的音（按先后；null = 打断符杠的东西：小节线、中途的调号 / 拍号、休止、全音符）→ 每个音的符干 + 每一组的符杠（groups 按先后，画的时候一组一组画：先符干再符杠）。 */
export declare function layoutStems<K>(seq: readonly (StemNote<K> | null)[], dir: StemDir, f?: Frame<K>): {
    notes: Map<K, StemOut>;
    groups: {
        keys: K[];
        beams: BeamOut[];
    }[];
};
