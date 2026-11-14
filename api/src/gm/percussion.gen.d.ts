export type PercHead = "normal" | "x" | "circle-x" | "slash" | "slashed1" | "slashed2" | "diamond" | "triangle-up" | "triangle-down" | "plus" | "la" | "ti" | "custom";
export interface PercInfo {
    staff: 1 | 5;
    line: number;
    head: PercHead;
    stem: "up" | "down";
    smufl?: string;
    hitSec?: number; /** 并成一套鼓时画在哪个鼓键那一线（概念的 mainKey）。 */
    kitKey?: number; /** 这一行的写法借的是哪个概念（gm-map 那一行没写）。 */
    from?: string; /** 鼓组里的一件叫什么（简谱整套鼓的图例印；中文 = 本尊概念名 + 非普通奏法，英文 = GM 名）。 */
    name?: {
        zh: string;
        en: string;
    };
}
export declare const PERC_VERSION = 16;
export declare const PERC: Record<string, PercInfo>;
