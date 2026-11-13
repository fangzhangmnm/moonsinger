import { type Song, type PaperSeg, type Choice, type ClefChoice } from "../score/song.ts";
import { type Paper, type ReadPaper, type PaperKind, type PaperChoice, type Margins } from "../score/paper.ts";
import { type SongView } from "../score/song-view.ts";
/** 能跟着软件的那几项（歌级；score.json 顶层同名的键）。arrangement 改声音（第 16 条），textLang 的 "ui" 本身就是跟界面，都不在这里。 */
export declare const LOOK_KEYS: readonly ["notation", "viewInC", "middleC", "chordTags", "expressions", "barNumbers", "lyricFit", "paper", "density", "staffMm", "marginMm"];
export type LookKey = typeof LOOK_KEYS[number];
/** 一整份「现在怎么画」：SongView 的每一项（排版、PDF、键上的大字、鬼音符都读它）+ 纸（每个字段都有值）+ 每一项是选的还是跟着软件。 */
export interface Look extends SongView {
    /** 这张纸到底多大、边距、舒适 / 紧凑、谱高（每个字段都填好了，没有可选的）。屏幕、PDF、存 MusicXML 的 <defaults> 都用这一份。 */
    readonly paper: Paper;
    /** 每一项是不是跟着软件（true）——页面设置「跟着软件（现在是：X）」那一格亮不亮。模块外面问它，不自己比 "default"。 */
    readonly follows: {
        readonly [K in LookKey]: boolean;
    };
}
/** 歌 → 这首歌现在怎么画（纯函数；不读设备、不读界面语言、不读时钟）。认不出来的值（比这一版新的文件带来的）按最基本的那一档画：谱种 = 五线谱、歌词 = 按节奏、小节号 = 印、中央 C = C4、谱上的字 = 跟着界面。 */
export declare function lookOf(song: Song): Look;
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
/** 「全部跟着软件」：把这首歌里选过的每一项都改回 "default"（一步撤销由宿主走写入口）。都已经是 = 原样。 */
export declare function allDefault(song: Song): Song;
/** 这首歌里选过的有几项（歌库核对 / 页面设置「全部跟着软件」亮不亮）。 */
export declare const chosenCount: (song: Song) => number;
/** 页面设置第一格「跟着软件（现在是：X）」的 X。 */
export declare function defaultText(key: LookKey): string;
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
