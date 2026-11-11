import type { Command } from "../score/commands.ts";
import type { Dir } from "../score/pitch.ts";
export type Mode = "write" | "edit" | "impro";
export type Where = Mode | "lyric" | "mark" | "sheet";
/** 一个按键：物理键位 + Shift / Alt / mod（Windows·Linux 的 Ctrl 或 Mac 的 ⌘）（必须完全一致）。 */
export interface Chord {
    code: string;
    shift?: boolean;
    alt?: boolean;
    mod?: boolean;
}
/** 路由的结果：宿主照着做。 */
export type Action = {
    k: "cmd";
    cmd: Command;
} | {
    k: "audition";
    degree: number;
    dir: Dir;
} | {
    k: "stack";
    degree: number;
} | {
    k: "play";
} | {
    k: "impro";
} | {
    k: "file";
    a: "open" | "save" | "export";
} | {
    k: "clip";
    a: "copy" | "cut" | "paste" | "all";
} | {
    k: "undo";
} | {
    k: "redo";
} | {
    k: "lyric";
    a: "commit" | "cancel" | "next" | "prev" | "hyphen" | "back";
} | {
    k: "mark";
    a: "commit" | "cancel";
} | {
    k: "sheet";
    a: "close";
};
export interface Binding {
    id: string;
    keys: Chord[];
    show?: string;
    group: string;
    does: Partial<Record<Where, string>>;
    act: (i: number, where: Where) => Action;
    sound?: boolean;
}
export declare const BINDINGS: Binding[];
export declare function chordName(c: Chord): string;
/** pad 按钮提示用：某条映射的第一个键（没有 = ""）。 */
export declare function hint(id: string): string;
export interface KeyLike {
    code: string;
    key: string;
    shiftKey: boolean;
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    isComposing?: boolean;
}
/** 路由：这个按键在 where 该做什么（null = 不管，让浏览器 / 文本框照常）。弹没写的键照写 / 改走（base）。 */
export declare function route(e: KeyLike, where: Where, base?: "write" | "edit"): Action | null;
/** 松开的这个键是不是「按住响」的键（谱面上：写 / 改 / 弹）。 */
export declare function isSoundKey(e: KeyLike): boolean;
export declare function renderKeysDoc(): string;
