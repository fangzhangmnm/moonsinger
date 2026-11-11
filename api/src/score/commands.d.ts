import type { Dir } from "./pitch.ts";
import { type EditorState, type Art, type Dyn } from "./song.ts";
export type Command = {
    k: "degree";
    degree: number;
    dir: Dir; /** 单声乐器的声部：改一个音时换音高、不叠（v0.10.5）。 */
    mono?: boolean;
} | {
    k: "rest";
} | {
    k: "bar";
} | {
    k: "art";
    a: Art;
} | {
    k: "inhale";
    v: "soft" | "big";
} | {
    k: "slur";
} | {
    k: "wedge";
    w: "cresc" | "dim";
} | {
    k: "dyn";
    v: Dyn;
    ramp?: boolean;
} | {
    k: "swell";
    w: "<" | ">" | "<>";
} | {
    k: "shorter";
} | {
    k: "longer";
} | {
    k: "tuplet";
} | {
    k: "extend";
    half?: boolean;
} | {
    k: "acc";
    acc: 1 | -1;
} | {
    k: "octave";
    d: number;
} | {
    k: "step";
    d: number;
} | {
    k: "alter";
    d: number;
} | {
    k: "caret";
    d: number;
} | {
    k: "selext";
    d: number;
} | {
    k: "home";
} | {
    k: "end";
} | {
    k: "escape";
} | {
    k: "backspace";
} | {
    k: "delete";
} | {
    k: "symBackspace";
} | {
    k: "transpose";
    semis: number;
} | {
    k: "respell";
} | {
    k: "seldur";
} | {
    k: "selscale";
    f: 0.5 | 2;
} | {
    k: "modulate";
    fifths: number;
} | {
    k: "seledge";
    d: -1 | 1;
} | {
    k: "staff";
};
/** 应用一条编辑命令。now = 判 Shift 连点用的时刻（ms）。 */
export declare function apply(st: EditorState, c: Command, now?: number): EditorState;
