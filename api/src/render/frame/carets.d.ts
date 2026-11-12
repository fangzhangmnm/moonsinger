import { type Token } from "../../score/song.ts";
import type { Slot, CaretHead } from "../engrave.ts";
/** 画法交来的一条轨（只要时间那一半和摆好的位置）。 */
export interface CaretTrack {
    tokens: Token[];
    realLen: number;
    realTicks: number;
    staves: number;
    units: readonly {
        kind: string;
        index: number;
        x: number;
        w: number;
        system: number;
        tick: number;
        pad?: true;
        inBar?: number;
    }[];
}
/** 推这条轨的落点和写字头。cx(u) = 这个单元左边光标画在哪（px）；shiftAt(c) = 第 c 个光标位置每张谱表的位移；rowOf(行, 谱表) = 谱行号。cols = 这张纸摆好的列（行末落点用）。 */
export declare function caretStops(q: CaretTrack, o: {
    cx: (u: CaretTrack["units"][number]) => number;
    shiftAt: (c: number) => number[];
    rowOf: (s: number, k: number) => number;
    P: (v: number) => number;
    sysStart0: number;
    cols: readonly {
        x: number;
        w: number;
        system: number;
    }[];
    slots: Slot[];
    heads: CaretHead[];
}): void;
