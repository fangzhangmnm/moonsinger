import { type EditorState, type Song } from "../score/song.ts";
import { type Command } from "../score/commands.ts";
import { type History, type Locus, type LocusKind, type Restored } from "../score/history.ts";
import type { Extras } from "../format/project.ts";
/** 宿主接的副作用（全是「之后」；这里先把真相换好再叫）。 */
export interface DocHooks {
    now(): number;
    /** 谱变了之后（commit 换了 st）：moved = 光标换了纸 / 声部。 */
    onState(prev: EditorState, next: EditorState, moved: boolean): void;
    /** extras 变了之后（休息室 / 录音房 / 封面）。 */
    onExtras(prev: Extras, next: Extras, locus: Locus): void;
    /** 被锁拒了：what = 改的是什么（人话）；kind = 按哪个类别问的锁。 */
    onRefused(what: string, kind: LocusKind): void;
    /** 撤销 / 重做落地之后（st / extras 已换、栈已换）：宿主让视图跟过去、说一句。 */
    onRestored(r: Restored, verb: string, prev: {
        st: EditorState;
        extras: Extras;
    }): void;
    /** commit 之前对 song 变了的 next 做规整（纸头补力度那类；同一步、能一起撤销）。 */
    normalize?(next: EditorState): EditorState;
    /** 文件之外、但也算「改过没存」的东西的版本号（参考窗的卡）。 */
    extraDirty?(): number;
    /** 修改锁的写入口那一头：这一类操作此刻让不让做。null = 让；一句话 = 不让（宿主那头顺便让门闪一下）。不给 = 都让。
     *  **只在真要改的那一下问**（commit / undo / redo）；只想知道「现在锁着吗」问 lockedWhy。 */
    writeGate?(kind: LocusKind): string | null;
    /** 现在内容为什么不能改（只问、没有副作用）；null = 能。不给 = 能。 */
    lockedWhy?(): string | null;
}
export interface CommitOpts {
    /** 这一步改了什么（人话；undo 时 toast）。不给 = 按谱的变化推（describeSongChange）。 */
    locus?: Locus;
    /** 连续动作并成一步（拖 / 连打 / 推子）。类别是看法的那一步不并（见头注释）。 */
    gesture?: string;
    /** false = 不进撤销栈（开歌时的规整）。 */
    undo?: boolean;
    /** true = 不叫宿主的 hooks（只换真相；开歌装视图态用）。 */
    silent?: boolean;
}
export type CommitResult = {
    ok: true;
    changed: boolean;
} | {
    ok: false;
    why: string;
};
/** 「上次存 / 打开时的样子」：判脏用（引用比较 + 休息室 / 录音房的 JSON）。 */
export interface SavedMark {
    song: Song;
    thumbnail: Uint8Array | null;
    key: string;
    refs: number;
}
/** 和上次存的样子比：一样 / 只差看法（曲段隐藏）/ 内容变了。 */
export type DirtyKind = "clean" | "looks" | "content";
export interface Document {
    readonly st: EditorState;
    readonly extras: Extras;
    readonly history: History;
    /** 现在内容为什么不能改（修改锁锁着）；null = 能。只问，没有副作用。 */
    locked(): string | null;
    /** **唯一入口**：换谱 / 换 extras / 两个一起。拒了（锁着）= ok:false + onRefused；没变 = changed:false。 */
    commit(next: {
        st?: EditorState;
        extras?: Extras;
    }, o?: CommitOpts): CommitResult;
    /** 指令式：一条键盘命令（src/score/commands.ts）→ commit。 */
    run(c: Command, o?: CommitOpts): CommitResult;
    undo(): boolean;
    redo(): boolean;
    /** 换歌：真相整个换掉、栈清空、脏的基线 = 现在（不叫 onState / onExtras：宿主自己按开歌的顺序重画）。整份装入不归锁管。 */
    load(st: EditorState, extras: Extras): void;
    /** 改过没存？ */
    dirty(): boolean;
    /** 脏的是哪一种（见 DirtyKind）。 */
    dirtyKind(): DirtyKind;
    /** 现在这一刻的「已存」基线（encode 那一刻记下来，落盘成功再 adoptSaved）。 */
    savedMark(): SavedMark;
    adoptSaved(m: SavedMark): void;
    /** 刚存好 = 基线换成现在。 */
    markSaved(): void;
}
export declare function createDocument(init: {
    st: EditorState;
    extras: Extras;
}, hooks: DocHooks): Document;
