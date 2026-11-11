import { type EditorState } from "../score/song.ts";
import type { Layout } from "../render/engrave.ts";
interface Host {
    get(): EditorState;
    set(next: EditorState): void;
}
export declare class TitleEditor {
    private host;
    private layout;
    private input;
    open: boolean;
    private paper;
    private arr;
    constructor(parent: HTMLElement, host: Host, layout: () => Layout | null);
    /** 开框：不给 paperId = 歌名；给了 = 那张纸的曲段名。 */
    openNow(paperId?: string | null): void;
    /** 开编排那一行的框（曲段名 / 序号、×N、括号、最后一个 [循环段]）。 */
    openArrangement(): void;
    commitAndClose(): void;
    private close;
    reposition(): void;
}
export {};
