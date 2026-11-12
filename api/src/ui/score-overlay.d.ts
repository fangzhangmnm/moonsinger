import type { Layout } from "../render/engrave.ts";
import type { Song } from "../score/song.ts";
export interface OverlayHost {
    onPaperAdd(paper: string, kind: "part" | "paper", at: {
        x: number;
        y: number;
    }): void;
    onPaperMenu(paper: string): void;
    onNavFrom(paper: string, dir: -1 | 1): void;
    onScopeOf(paper: string): void;
    onPaper(): void;
    onCredits(): void;
    onKeyHint(paper: string, part: string, index: number, at: {
        x: number;
        y: number;
    }): void;
    onLeaveFamily(paper: string, host: string): void;
    onHidden(paper: string, parts: string[], at: {
        x: number;
        y: number;
    }): void;
    /** 「隐藏 N 段」（v0.16.34）：全部视图里隐藏的整张纸不排、不占地方，提醒 = 歌名那一条上一颗不占位的小标；点开一列（去看 / 放出来）。 */
    onHiddenPapers(papers: string[], at: {
        x: number;
        y: number;
    }): void;
    /** 「演奏法和表情：不显示」的淡提示（7-G 重做）：点了 = 开页面设置的「看谱」页、落在那一项上。 */
    onFolded(): void;
}
/** 这一帧要知道的谱面状态（排版器不知道的那些）。 */
export interface OverlayView {
    song: Song;
    edit: boolean;
    marks: boolean;
    onlyPaper: string | null;
    paperLabel: string;
}
export declare class ScoreOverlay {
    private root;
    private host;
    private els;
    private hiddenPapers;
    private hiddenOf;
    private press;
    constructor(root: HTMLElement, host: OverlayHost);
    layout(L: Layout, v: OverlayView): void;
    /** 一次写 DOM：按 key 复用，变了才写。 */
    private commit;
    private down;
    private up;
    private cancel;
    private fire;
}
