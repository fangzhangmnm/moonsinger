import { type Song, type PaperSeg, type Choice, type ClefChoice } from "../score/song.ts";
import { type Paper, type ReadPaper, type PaperKind, type PaperChoice, type Margins } from "../score/paper.ts";
import { type SongView, type NotationId, type ChordTagStyle, type TextLang } from "../score/song-view.ts";
import { type LookContext, type LookDefaults } from "./habits.ts";
/** 能跟着软件的那几项（歌级；score.json 顶层同名的键）。arrangement 改声音（第 16 条），textLang 的 "ui" 本身就是跟界面，都不在这里。 */
export declare const LOOK_KEYS: readonly ["notation", "viewInC", "middleC", "chordTags", "chordTagStyle", "expressions", "barNumbers", "lyricFit", "paper", "density", "staffMm", "marginMm"];
export type LookKey = typeof LOOK_KEYS[number];
/** "default" 现在等于什么（只在这里；改了 = 所有跟着软件的歌跟着变）。纸的边距和谱高没有自己的一个数：边距 = 这张纸自己的，谱高 = 这一档的。 */
export { BASE_DEFAULTS, HABIT_KEYS, defaultsFor, type HabitKey, type Habits, type LookContext, type LookDefaults } from "./habits.ts";
/** 一整份「现在怎么画」：SongView 的每一项（排版、PDF、键上的大字、鬼音符都读它）+ 纸（每个字段都有值）+ 每一项是选的还是跟着软件。 */
export interface Look extends SongView {
    /** 这张纸到底多大、边距、舒适 / 紧凑、谱高（每个字段都填好了，没有可选的）。屏幕、PDF、存 MusicXML 的 <defaults> 都用这一份。 */
    readonly paper: Paper;
    /** 每一项是不是跟着软件（true）——页面设置「跟着软件（现在是：X）」那一格亮不亮。模块外面问它，不自己比 "default"。 */
    readonly follows: {
        readonly [K in LookKey]: boolean;
    };
    /** 这一次「跟着软件」用的那张表（设备上没选习惯 = BASE_DEFAULTS；第 18 条）。 */
    readonly base: LookDefaults;
}
/** 歌 → 这首歌现在怎么画（纯函数；不读设备、不读界面语言、不读时钟）。认不出来的值（比这一版新的文件带来的）按最基本的那一档画：谱种 = 五线谱、歌词 = 按节奏、小节号 = 印、中央 C = C4、谱上的字 = 跟着界面。 */
export declare function lookOf(song: Song, ctx?: LookContext): Look;
/** 页面设置「音符密度」那一格（第 17 条 17-2：原来 main.ts 自己拿 STAFF_MM 比）：这首歌选了一个谱高、又不是这一档本来的 = 那个毫米数（下拉里写「自定义（N 毫米）」）；否则 null。 */
export declare const customStaffMm: (look: Look) => number | null;
/** 页面设置「版面」页「边距」那一行（第 17 条 17-2 顺手，统筹 2026-11-13）：边距按值带着（别家的谱、老文件）才有这一行；跟着软件 = null（不显示）。
 *  follow = 第一格「跟着软件（现在是：X）」的 X（这张纸自己的边距）；custom = 另一格「自定义（X）」的 X（这首歌带着的四边）。 */
export declare function marginRow(look: Look): {
    follow: string;
    custom: string;
} | null;
/** 每张纸 / 每个声部那几样（第 17 条四问第 2 条）：排版、存档都只问这一个口子。文件和内存的写法不动（PaperSeg.looks 只存大谱表 = true、自动八度线 = false）。 */
export interface TrackLook {
    autoOttava: boolean;
    grand: boolean;
}
export declare function trackLookOf(song: Song): (paperId: string, partId: string) => TrackLook;
/** 谱头面板谱号那一格现在是什么（第 17 条 17-1 从 song.ts 搬来）：手选的大谱表 / 纸头写的谱号记号 / 自动。 */
export declare function clefChoiceOf(paper: PaperSeg, partId: string): ClefChoice;
/** 页面设置里一项选「跟着软件」：这一项写回 "default"。纸跟着软件 = 边距也跟着（边距跟着纸，同 setPaper）；舒适 / 紧凑跟着软件 = 谱高也跟着（同 setDensity）。都已经是 = 原样。 */
export declare function followDefault(song: Song, key: LookKey): Song;
/** 第 21 条（v0.17.38，统筹 74ea9a53；user「我建议是新建时写下来，跟default只是一个技术上的选项，用户不太会用」）：把歌里「跟着」的那几项写成这一刻它等于的值。
 *  · born（新建的歌、别家的谱进门）：只换写着 "default" 的（谱上的字：写着 "ui" 的）——别家谱里从 <defaults> 认出来的纸张 / 密度是它自己的，照留；
 *  · apply（页面设置「套用我的习惯」）：只写习惯那几样（HABIT_KEYS）+ 谱上的字，别的项一个不动——v0.17.39（统筹审 v0.17.38：原来连纸张、音符密度…都写回软件的默认，
 *    这首歌里选了 A4，点一下纸就变回去了；钮的名字说的是习惯，做的比名字多）。以后习惯多一样，这颗钮跟着多写一样。
 *  值 = 有习惯的照习惯、别的照软件当时的默认（defaultsFor(ctx)——和画的时候「跟着」等于什么是同一份）；谱上的字 = 这一刻的界面语言。
 *  边距、谱高两项的 "default" 意思是「这种纸自己的」「跟着音符密度」，不是跟习惯：born 不动（apply 本来就不碰不是习惯的）。
 *  没变 = 原样（同一个引用）。三层读法（lookOf）不动：写着 "default" 的老歌照旧跟着。 */
export declare function stampLooks(song: Song, ctx: LookContext, uiLang: Exclude<TextLang, "ui">, mode: "born" | "apply"): Song;
/** 这一项有没有习惯可跟（v0.17.39；判断只此一处）：页面设置最后一格叫「跟着我的习惯」还是「跟着软件的默认」、撤销那一句、「套用我的习惯」写哪几样，都问它。 */
export declare const isHabitKey: (k: LookKey) => boolean;
/** 页面设置里每一行的名字（按 LookKey；谱高没有自己的一行——它跟着音符密度，见 customStaffMm）。「跟着…」那一格撤销的话、「套用我的习惯」的提示从这里拿名字（v0.17.39 从页面设置的处理函数里搬出来）。 */
export declare const LOOK_ROW_NAME: Record<Exclude<LookKey, "staffMm">, () => string>;
/** 页面设置最后一格「跟着…」的字（v0.17.39，统筹审 v0.17.38）：习惯那几行「跟着我的习惯（现在是：X）」；别的行没有习惯可跟 =「跟着软件的默认（现在是：X）」。
 *  边距那一行不走这里：它的「跟着软件」意思是这张纸自己的边距（main.ts marginRow）。 */
export declare const followOptionText: (key: LookKey, ctx: LookContext) => string;
/** 选了「跟着…」那一格之后，撤销那一句怎么说（跟着这一格的名字分；边距 =「跟着软件」）。 */
export declare const followUndoLabel: (key: Exclude<LookKey, "staffMm">) => string;
/** 「全部跟着软件」：把这首歌里选过的每一项都改回 "default"（一步撤销由宿主走写入口）。都已经是 = 原样。v0.17.38 起页面设置那颗钮换成「套用我的习惯」（stampLooks apply），这个留给测试和以后。 */
export declare function allDefault(song: Song): Song;
/** 这首歌里选过的有几项（歌库核对 / 页面设置「全部跟着软件」亮不亮）。 */
export declare const chosenCount: (song: Song) => number;
/** 页面设置第一格「跟着软件（现在是：X）」的 X。 */
/** 谱种的名字（页面设置的下拉、设置「习惯看的谱」那一行、第一次打开的卡都从这里拿；加一种谱 = Record 逼着这里多一个名字，几处自动多一格）。 */
export declare const notationName: (id: NotationId) => string;
/** 每种谱一句说明（页面设置的问号、第一次打开的卡）；字母谱那句的中央 C 跟着叫法。 */
export declare const NOTATION_NOTE: Record<NotationId, (middleC: number) => string>;
/** 「中央 C 叫」的选项上写什么（页面设置、设置「界面」页、第一次打开的卡同一份）。 */
export declare const middleCLabel: (n: number) => string;
/** 和弦写法（第 19 条；统筹 0d97f07a：「和弦辅助」管标不标、「和弦写法」管标成什么样，一行一个键）：页面设置、设置「界面」页、「初始设置」卡同一份名字。 */
export declare const CHORD_TAG_STYLE_LABEL: Record<ChordTagStyle, () => string>;
/** 「和弦写法」是什么（一句；三处同一份）。 */
export declare const CHORD_TAG_STYLE_NOTE: () => string;
/** 「移调辅助」是什么（一句；设置「界面」页、页面设置、「初始设置」卡同一份）。后半句 = 第 19 条第 7 点的披露之一：键上的字也按 C 调写。 */
export declare const TRANSPOSE_AID_NOTE: () => readonly string[];
/** 「中央 C 叫」是什么（一句；三处同一份）。 */
export declare const MIDDLE_C_NOTE: () => string;
export declare function defaultText(key: LookKey, ctx?: LookContext): string;
/** 纸张那一格的字（选的是「其他」时写大小）。 */
export declare const paperChoiceText: (c: PaperChoice) => string;
/** 读文件的门口（17-1）：score.json 里没有纸张那几项（老文件、别家的谱）时，从 MusicXML <defaults> 认出来的纸认一次——
 *  认成四种之一的算选过的；认成「A5 舒适、边距和谱高都是那一档的」的算 "default"；舒适算跟着软件（老文件里舒适就是没写）；边距 / 谱高和这张纸、这一档自己的一样 = "default"，不一样 = 按值带着。没有 <defaults> = 全部 "default"。 */
export declare function paperChoicesOf(p: ReadPaper | undefined): Pick<Song, "paper" | "density" | "staffMm" | "marginMm">;
/** 读文件的门口（17-1）：score.json 顶层这几项 → 歌字段。没写 / 写坏了 = "default"（补的是这个字，不是当时的默认值）；认得的值原样；
 *  比这一版新的文件里键认识、值不认识的字（以后的谱种 / 排法…）原样留在歌里、存的时候照写，记进 odd（打开时说一句）——画的时候 lookOf 按最基本的那一档。
 *  纸张那四项：score.json 里有任何一项 = 以它为准（缺的那几项 = "default"）；一项都没有（老文件、别家的谱）= 从 MusicXML <defaults> 认一次（paperChoicesOf）。 */
export declare function lookFromFile(x: Record<string, unknown> | undefined, xmlPaper: ReadPaper | undefined, newer: boolean, odd: string[]): Pick<Song, LookKey>;
/** score.json 里读到的一项纸张的选择（门口）：认不出来 = null（宽容：当没写）。 */
export declare function readPaperChoice(v: unknown): Choice<PaperChoice> | null;
export declare function readMargins(v: unknown): Choice<Margins> | null;
/** 四种纸的宽高（纸的设置面板写大小用）。 */
export declare const kindSize: (k: PaperKind) => {
    w: number;
    h: number;
};
