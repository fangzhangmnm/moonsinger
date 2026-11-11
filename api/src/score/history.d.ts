import type { EditorState, Song, Focus } from "./song.ts";
import type { Extras } from "../format/project.ts";
/** 这一步改在哪一块：score = 谱（纸 / 声部看快照的 at）；lounge = 休息室（选角 / 候选 / 角色名）；studio = 录音室（麦克风）；cover = 封面；paper = 纸（加 / 删 / 隐藏）。 */
export type LocusKind = "score" | "lounge" | "studio" | "cover" | "paper" | "paperHidden";
export interface Locus {
    kind: LocusKind;
    label: string;
}
export interface Snap {
    song: Song;
    extras: Extras;
    at: Focus;
    caret: number;
    sel: {
        from: number;
        to: number;
    } | null;
    locus: Locus;
}
export interface History {
    past: Snap[];
    future: Snap[];
    lastKey: string | null;
    lastAt: number;
}
export declare const LIMIT = 200, COALESCE_MS = 1500;
export declare const emptyHistory: () => History;
export declare const snapOf: (st: EditorState, extras: Extras, locus: Locus) => Snap;
/** 记一步：prev / prevExtras = 改之前的状态；locus = 这一步改了什么。gesture 相同且 COALESCE_MS 内 = 同一个连续动作，不另记（future 照样清掉；locus 换成最新的那句话）。 */
export declare function record(h: History, prev: EditorState, prevExtras: Extras, gesture: string | null, now: number, locus: Locus): History;
export interface Restored {
    h: History;
    st: EditorState;
    extras: Extras;
    locus: Locus;
}
/** 撤销：回到上一份快照；现在的状态进 future（带着同一个 locus——重做时还是这句话）。没有可撤的 = null。 */
export declare function undo(h: History, cur: EditorState, curExtras: Extras): Restored | null;
/** 重做。 */
export declare function redo(h: History, cur: EditorState, curExtras: Extras): Restored | null;
/** 谱的一步改了什么（人话，给 toast）：看光标所在 track 的 token 数变化；数没变再看歌名 / 作者栏 / 纸数 / 声部数；都没变 = 「改」。纯函数，便宜。 */
export declare function describeSongChange(prev: EditorState, next: EditorState): Locus;
