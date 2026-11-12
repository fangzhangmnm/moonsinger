import type { Ink, Part } from "./cell.ts";
export interface Hint {
    part: Part; /** 依次试的锚点位置（和墨迹同一个坐标；part 的墨迹 / 图元相对锚点）。 */
    tries: readonly {
        x: number;
        y: number;
    }[]; /** 都压墨时再把这几个位置一格一格往上挪着试（一格多高；没给 = 不挪）。 */
    climb?: number;
}
export interface Placed {
    x: number;
    y: number; /** 找到了不压墨的位置（false = 都压，用的是最后一个）。 */
    ok: boolean;
}
/** printed = 印的墨迹框；pad = 离墨至少多远（同墨迹的单位）。回每个提示落在哪（顺序同 hints）。 */
export declare function placeHints(printed: readonly Ink[], hints: readonly Hint[], pad?: number): Placed[];
