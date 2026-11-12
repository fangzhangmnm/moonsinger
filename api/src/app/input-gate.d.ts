import type { EditorState } from "../score/song.ts";
import type { History, LocusKind } from "../score/history.ts";
/** 现在键盘为什么不往谱上写。 */
export type NoWrite = "locked" | "picking" | "unplugged";
export interface GateFacts {
    locked: boolean;
    picking: boolean;
    unplugged: boolean;
}
/** 三个原因合成一个答案（先后 = 说给人听时先说哪个：锁最重，其次是正在选乐器，最后才是自己拔的）。null = 能写。 */
export declare function noWrite(f: GateFacts): NoWrite | null;
/** 这一下会不会改谱（和 document.ts commit 的 songChanged 同一条判据）。 */
export declare const writesScore: (prev: EditorState, next: EditorState) => boolean;
/** 插头管的块 = 谱和纸（都住在 song 里）。乐器 / 混音 / 封面不归插头：键盘上的撤销撤到这几块照常（锁另算，在文档写入口）。操作类别和 D.commit 的 locus.kind 同一套词。 */
export declare const PLUG_LOCI: ReadonlySet<LocusKind>;
/** 键盘上的撤销 / 重做要动的那一步改的是哪一块（没有可撤的 = null）。 */
export declare function stepLocus(h: History, dir: "undo" | "redo"): LocusKind | null;
export interface InputGatePorts {
    /** 歌锁着吗（注入：修改锁的回答）。 */
    locked(): boolean;
    /** 正在选乐器吗（乐器目录 / 乐器页开着）。 */
    picking(): boolean;
    /** 人自己拔着吗（「弹」）。 */
    unplugged(): boolean;
    /** 被挡下了：why = 哪个原因，kind = 想改的是哪一块（以后「门闪一下」用）。不许在这里弹错误。 */
    onBlocked(why: NoWrite, kind: LocusKind): void;
}
export interface InputGate {
    /** 现在键盘为什么不往谱上写；null = 能写。「音键只响不写」也看它。 */
    why(): NoWrite | null;
    /** 键盘族的一下要把状态从 prev 换成 next：会改谱而现在不能写 = false（已经叫过 onBlocked；调用方这一下什么都别做，后面的「响一下 / 披露」也别做）。
     *  只动光标 / 选中 / 输入状态 = true。 */
    may(prev: EditorState, next: EditorState): boolean;
    /** 明知道会写的一下（叠、剪切、粘贴、符号格里开记号框 / 菜单的键）：能不能做。 */
    mayWrite(kind?: LocusKind): boolean;
    /** 键盘上的撤销 / 重做：人自己拔着、而那一步改的是谱 / 纸 = false。
     *  锁着不在这里拦（文档自己拒、自己说）；在选乐器也不拦——那时键盘上唯一的撤销是乐器页自己的快捷键，撤的是在那一页上做的事
     *  （其中动到声部的那些按「谱」登记，按块分不出来）。 */
    mayStep(h: History, dir: "undo" | "redo"): boolean;
    /** 「弹」这颗钮现在拨得动吗：锁着 / 在选乐器 = 强制拔着，接不回去。拨不动 = false（已经叫过 onBlocked）。 */
    mayToggle(): boolean;
}
export declare function createInputGate(p: InputGatePorts): InputGate;
export type KeyOwner = "galleryFinder" | "gallery" | "file" | "list" | "ime" | "field" | "finder" | "inst" | "ref" | "studioEsc" | "studio" | "listen" | "control" | "score";
export interface KeyFacts {
    galleryOpen: boolean;
    /** 乐器目录那一页开着（歌库上面的 / 歌里的都算）。 */
    finderShown: boolean;
    /** 歌里的找人视图开着（finder.isOpen）。 */
    finderOpen: boolean;
    /** Ctrl / ⌘ + S / Shift+S / O，且键表认它是文件动作。 */
    fileCombo: boolean;
    composing: boolean;
    /** 这一下按下时有下拉列表开着（src/ui/dropdown.ts keyForList：在库的弹层监听之前记下的）。 */
    listOpen: boolean;
    escape: boolean;
    /** Ctrl / ⌘ 按着。 */
    mod: boolean;
    /** 焦点在能打字的框里。 */
    typing: boolean;
    /** 那个框是谱自己的歌词框 / 记号框。 */
    ownField: boolean;
    /** 焦点在下拉那颗按钮（界面零件库的标准件，7-T）/ TEXTAREA / 不是 ownField 的 INPUT 上。 */
    formControl: boolean;
    instShown: boolean;
    /** 焦点在参考窗里。 */
    inRef: boolean;
    studioOpen: boolean;
    /** 焦点在混音台里。 */
    inStudio: boolean;
    /** 谱上没有别的可以用 Esc 退的（没选中、歌词框 / 记号框 / 面板都没开）。 */
    escFree: boolean;
    listen: boolean;
}
export declare function keyOwner(f: KeyFacts): KeyOwner;
