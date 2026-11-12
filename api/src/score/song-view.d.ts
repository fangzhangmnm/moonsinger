import type { EditorState, Song } from "./song.ts";
import { type Density } from "./paper.ts";
/** 谱种：五线谱 / 简谱（第四刀）/ 字母谱（7-B：简谱的变体，数字换成实际音名的字母，同一种数字行）。以后 "figures"（设计稿第 7 节）。封闭的联合，不走注册表（ADR-0004：显示 = 库）。 */
export type NotationId = "staff" | "jianpu" | "letters";
export declare const NOTATIONS: readonly NotationId[];
/** 每条轨的和弦选项三档（设计稿第 3.7 节）：只认叠在一起的和弦 / 也认拆开弹的和弦 / 折叠成和弦名（折叠 = 第五刀，现在画法同 auto）。 */
export type ChordsMode = "stacked" | "auto" | "fold";
export declare const CHORDS_MODES: readonly ChordsMode[];
/** 文件里没写 = 这些值。写死，永远不变（改它 = 改了所有旧歌的样子）。chordTags / viewInC 在文件里永远是布尔（src/format/contract.ts score minor 5 那段）。
 *  后三样是原来就有的意思（4-5 收进来时照抄，不是新定的）：版式没写 = 舒适（paper.ts densityOf）；歌词排法没写 = 按节奏（v0.9.40 user「默认用修歌词的那个排版方式吧」，
 *  旧歌打开也是按节奏）；小节号没写 = 每行开头印（v0.9.42「默认是每行开头有」）。 */
export declare const UNWRITTEN: Readonly<{
    notation: NotationId;
    chordTags: boolean;
    viewInC: boolean;
    chords: ChordsMode;
    density: Density;
    lyricFit: LyricFit;
    barNumbers: boolean;
    middleC: number;
    expressions: boolean;
}>;
/** 歌词怎么排：按节奏（音的位置只看时值，歌词让路）/ 按歌词（长字把音推开）。 */
export type LyricFit = "rhythm" | "lyrics";
/** 这首歌怎么看。排版、PDF、键盘上的大字、鬼音符、谱面的拖音高都读它，不各读各的歌字段。 */
export interface SongView {
    readonly notation: NotationId;
    /** 叠音的和弦上方写级数（乐理模块 src/theory/）。 */
    readonly chordTags: boolean;
    /** 按 C 调看（辅助）：谱换到 C 调画、每个调号上方写「1=原来的调」、键上大字写级数；拖音高 / 鬼音符按显示的换回实际的。= 存着的值（设置面板亮哪个钮）。 */
    readonly viewInC: boolean;
    /** 按 C 调看此刻起不起作用 = 存着开 ∧ 这种谱上起作用（IN_C_APPLIES：简谱本来就是首调、字母谱写的是实际的音名：开关变灰、存着的值不动；施工单第三节「4」、7-B）。排版、谱面、键上的大字都看这个。 */
    readonly inCActive: boolean;
    /** 这条轨的和弦选项。 */
    chordsOf(part: string): ChordsMode;
    /** 版式（舒适 / 紧凑）：谱多大、音距、行距（排版参数表按它挑一行）。存在纸里（Song.paper.density）。 */
    readonly density: Density;
    /** 歌词怎么排。 */
    readonly lyricFit: LyricFit;
    /** 每行开头印不印小节号。 */
    readonly barNumbers: boolean;
    /** 字母谱里中央 C 叫 C 几（C-4 那个数字；默认 4，可以 3 / 5；7-B）。别的谱种用不上。 */
    readonly middleC: number;
    /** 演奏法和表情显示不显示（7-G；score minor 8）。false = 键盘「演奏法」「力度」两页上的东西都不交给排版（不画、不占地方；src/render/expressions.ts），播放照写的来。 */
    readonly expressions: boolean;
}
/** 这种谱是不是首调（「1」= 这个调的主音）：首调的谱上「按 C 调看」没有意义。 */
export declare const MOVABLE_DO: Readonly<Record<NotationId, boolean>>;
/** 这种谱上「按 C 调看」起不起作用：五线谱 = 起；简谱本来就是首调；字母谱写的是实际的音名（7-B：「按 C 调看」在字母谱下变灰）。 */
export declare const IN_C_APPLIES: Readonly<Record<NotationId, boolean>>;
/** 界面上能选的中央 C 叫法。 */
export declare const MIDDLE_C_NAMES: readonly number[];
/** 歌 → 这首歌怎么看（纯函数；不读设备、不读界面语言、不读时钟）。 */
export declare function songViewOf(song: Song): SongView;
/** 换谱种。五线谱 = 不写。 */
export declare function setNotation(st: EditorState, id: NotationId): EditorState;
/** 字母谱里中央 C 叫 C 几（4 = 不写）。 */
export declare function setMiddleC(st: EditorState, n: number): EditorState;
/** 演奏法和表情显示 / 不显示（7-G）。显示 = 不写。 */
export declare function setExpressions(st: EditorState, on: boolean): EditorState;
/** 和弦标级数开 / 关。开 = 不写。 */
export declare function setChordTags(st: EditorState, on: boolean): EditorState;
/** 按 C 调看开 / 关。关 = 不写。 */
export declare function setViewInC(st: EditorState, on: boolean): EditorState;
/** 这条轨的和弦选项。auto = 不写。 */
export declare function setPartChords(st: EditorState, partId: string, mode: ChordsMode): EditorState;
/** 这四样在歌里住在哪几个键（歌的顶层三个 + 每个声部一个）。修改锁拿它核「这一步真的只动了这首歌怎么看」（src/app/edit-lock-table.ts）。 */
export declare const SONG_VIEW_KEYS: readonly ["notation", "chordTags", "viewInC", "middleC", "expressions"];
export declare const PART_VIEW_KEYS: readonly ["chords"];
