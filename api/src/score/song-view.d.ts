import type { EditorState, Song } from "./song.ts";
/** 谱种。现在只画得出五线谱；简谱 = 第四刀。以后 "letters" | "figures"（设计稿第 7 节）。封闭的联合，不走注册表（ADR-0004：显示 = 库）。 */
export type NotationId = "staff" | "jianpu";
export declare const NOTATIONS: readonly NotationId[];
/** 每条轨的和弦选项三档（设计稿第 3.7 节）：只认叠在一起的和弦 / 也认拆开弹的和弦 / 折叠成和弦名（折叠 = 第五刀，现在画法同 auto）。 */
export type ChordsMode = "stacked" | "auto" | "fold";
export declare const CHORDS_MODES: readonly ChordsMode[];
/** 文件里没写 = 这些值。写死，永远不变（改它 = 改了所有旧歌的样子）。chordTags / viewInC 在文件里永远是布尔（src/format/contract.ts score minor 5 那段）。 */
export declare const UNWRITTEN: Readonly<{
    notation: NotationId;
    chordTags: boolean;
    viewInC: boolean;
    chords: ChordsMode;
}>;
/** 这首歌怎么看。排版、PDF、键盘上的大字、鬼音符、谱面的拖音高都读它，不各读各的歌字段。 */
export interface SongView {
    readonly notation: NotationId;
    /** 叠音的和弦上方写级数（乐理模块 src/theory/）。 */
    readonly chordTags: boolean;
    /** 按 C 调看（辅助）：谱换到 C 调画、每个调号上方写「1=原来的调」、键上大字写级数；拖音高 / 鬼音符按显示的换回实际的。 */
    readonly viewInC: boolean;
    /** 这条轨的和弦选项。 */
    chordsOf(part: string): ChordsMode;
}
/** 歌 → 这首歌怎么看（纯函数；不读设备、不读界面语言、不读时钟）。 */
export declare function songViewOf(song: Song): SongView;
/** 换谱种。五线谱 = 不写。 */
export declare function setNotation(st: EditorState, id: NotationId): EditorState;
/** 和弦标级数开 / 关。开 = 不写。 */
export declare function setChordTags(st: EditorState, on: boolean): EditorState;
/** 按 C 调看开 / 关。关 = 不写。 */
export declare function setViewInC(st: EditorState, on: boolean): EditorState;
/** 这条轨的和弦选项。auto = 不写。 */
export declare function setPartChords(st: EditorState, partId: string, mode: ChordsMode): EditorState;
/** 这四样在歌里住在哪几个键（歌的顶层三个 + 每个声部一个）。修改锁拿它核「这一步真的只动了这首歌怎么看」（src/app/edit-lock-table.ts）。 */
export declare const SONG_VIEW_KEYS: readonly ["notation", "chordTags", "viewInC"];
export declare const PART_VIEW_KEYS: readonly ["chords"];
