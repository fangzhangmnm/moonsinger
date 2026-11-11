export declare const GROOVES_VERSION = 2;
export declare const GROOVES_FILE: {
    readonly file: "vendor/grooves/grooves-v2.json";
    readonly bytes: 42822;
    readonly sha256: "95c8f7fc050dc0512ee31bd6044bb1059393b80bdb2c289dbfd48001954b098b";
};
export interface GrooveStyle {
    id: string;
    name: {
        zh: string;
        en: string;
        ja: string;
    };
    aliases: string[];
    /** 拍号（"4/4"）→ 一小节几个十六分格子 + 每格上开始的音的相对轻重（−1…1）；bars = 几小节一轮（克拉维 = 2，weights = 两小节的格子接起来）。 */
    meters: Record<string, {
        grid: number;
        weights: number[];
        bars?: number;
    }>;
    /** 两小节一轮的默认方向（"3-2" = 第一小节是三击那边）；「错开一小节」= 两小节对调（2-3）。没有 = 一小节一轮。 */
    phase: string | null;
    /** 没列的拍号：classical = 按古典层级推；none = 不加。 */
    fallback: "classical" | "none";
    /** 各类乐器跟多少（0–1）：键 = GM 家族（gm-map defs.families）+ voice（人声类，优先）。 */
    follow: Record<string, number>;
    /** 摇摆（时值，不是轻重）：一对音里前一个占的比例。 */
    swing: {
        unit: string;
        ratio: number;
        range: [number, number];
    } | null;
}
export declare const GROOVE_STYLES: GrooveStyle[];
