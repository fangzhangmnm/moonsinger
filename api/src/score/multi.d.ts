import { type Token, type Song, type EditorState } from "./song.ts";
export interface MultiSel {
    paper: string;
    parts: string[];
    t0: number;
    t1: number;
}
/** 一行是有音高的还是打击乐（宿主按台上那位查；有音高的不许贴到打击乐的行上，反过来也不许）。 */
export type RowKind = "pitched" | "perc";
/** 块里的一行：off = 它的第一个音离这段时间开头多远；len = 它自己那一截多长（尾巴伸出去的算在里面）；toks 里只有音、休止和挂在音上的曲级记号。 */
export interface BlockRow {
    kind: RowKind;
    off: number;
    len: number;
    toks: Token[];
}
/** 复制下来的一块：len = 这段时间多长（再来一遍的步长）。 */
export interface Block {
    len: number;
    rows: BlockRow[];
}
export declare const trackLen: (tokens: readonly Token[]) => number;
/** 一行里起点落在 [t0, t1) 的那一段：下标 [a, b)（a 带上第一个音前面挂着的曲级记号，同单行复制）+ 这一截的起止 tick。一个都没有 = null。 */
export declare function rowRange(tokens: readonly Token[], t0: number, t1: number): {
    a: number;
    b: number;
    s0: number;
    s1: number;
} | null;
/** 把这几行 × 这段时间收成选区：t0 / t1 = 各行里起点在 [t0, t1) 的那些音最早的起点、最晚的终点（框住的东西定的时间）。一行都没东西 = null。 */
export declare function normalize(song: Song, paper: string, parts: string[], t0: number, t1: number): MultiSel | null;
/** 复制：每一行原样切下来（只留音、休止、曲级记号；第一个音和前面连着的连音线断开），记下离开头多远。 */
export declare function copyBlock(song: Song, m: MultiSel, kindOf: (part: string) => RowKind): Block;
/** 退格 / Delete / 剪切：每一行里起点在这段时间里的音变成一样长的休止（不合拢，各行不错位）；不占时值的一律留在原地——
 *  人插的「|」、别的记号、挂在这些音上的曲级记号（力度 / 渐强渐弱 / 风格 / 踏板）都在（同单行的「变休止」fillSel：力度是状态，拿掉它会改选区外面的音的响度）。 */
export declare function clearBlock(song: Song, m: MultiSel): Song;
export type SpanFail = "cut" | "dur";
/** 歌里的写入口「把一行里一段时间换掉」：tokens 这一行从 t0 起、长 len 的那段时间换成 src（src 只留音、休止和曲级记号，从 t0 起排；短了后面补休止到 len）。
 *  等长，不往后推；行不够长 = 先在行尾补休止。落点两头切到休止 = 把休止切开；切到音的中间 = "cut"（这一版算贴不下）；切出来的长度不合法 = "dur"。
 *  这段时间里原来的音、休止和挂在它们上面的曲级记号去掉；骨架记号（「|」、调号拍号速度、谱号、八度线、反复跳转）留在原来的时刻，
 *  落在贴进来的音中间 = 那个音在那儿切成两段、连音线连（休止切成两个）。回新的一行 + 贴进来的那一截的下标 [a, b)。 */
export declare function replaceSpan(tokens0: readonly Token[], t0: number, src0: readonly Token[], len: number, id0: number): {
    tokens: Token[];
    id: number;
    a: number;
    b: number;
} | {
    fail: SpanFail;
};
/** 贴的目标：一行一个，从光标那一行起、按谱上的顺序往下（只数看得见、能改的行）。readOnly = 锁着 / 只读（宿主标）。 */
export interface Target {
    part: string;
    kind: RowKind;
    readOnly?: boolean;
}
export type PasteWhy = "rows" | "kind" | "cut" | "dur" | "locked";
export interface PasteFail {
    row: number;
    part: string | null;
    why: PasteWhy;
}
/** 整块贴：块的第 k 行贴到 targets[k]，落在 at + 它的偏移，把那段时间换掉。任何一行贴不下 = 整块不贴，回第一处贴不下的是哪一行、为什么。
 *  贴好了 = 新的歌 + 选中贴上去的那一块（几行 × [at, at + 块长)）。空的一行（那段时间里没有音起头）照样占一行、不写。 */
export declare function pasteBlock(song: Song, paper: string, targets: readonly Target[], at: number, block: Block, id0: number): {
    song: Song;
    id: number;
    sel: MultiSel;
} | {
    fail: PasteFail;
};
/** 再来一遍：选中的这一块贴到它自己的结尾、同样的几行（照粘贴的规矩，贴不下整块不贴）；贴完选区跟过去。 */
export declare function repeatBlock(song: Song, m: MultiSel, kindOf: (part: string) => RowKind, id0: number): ReturnType<typeof pasteBlock>;
/** 光标在这一行的哪个时刻（光标前面所有音 / 休止的时值之和；补齐的淡色小节里 = 再加 lead）。 */
export declare function caretTick(tokens: readonly Token[], caret: number, lead?: number): number;
/** 进入「选了好几行」：光标放到最上面那行这段时间的开头（粘贴的落点 = 光标的时刻和那一行），单行选区收掉。每次都是新的一个对象（只活一步，见 EditorState.multi）。 */
export declare function enterMulti(st: EditorState, m: MultiSel): EditorState;
