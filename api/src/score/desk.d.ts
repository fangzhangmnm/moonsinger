/** 时值存 MusicXML 的音符类型名（不存 LADDER 下标：下标哪天变了老文件就错）；顺序 = song.ts LADDER。 */
export type PadUnit = "32nd" | "16th" | "eighth" | "quarter" | "half" | "whole";
export declare const PAD_UNITS: readonly PadUnit[];
/** pad 的状态。low = 音域窗口最低那个键的 MIDI（换个行数 / 键位的设备也落在差不多的音域）；null = 默认那一档。 */
/** auto = 「1=」跟谱（v0.16.9；新歌默认）。文件里不另加字段：写了 fifths / scale = 手动（手动 1=C 大调也写 fifths: 0），都没写 = 跟谱——
 *  v0.16.8 及以前存的歌里写着 1= / 调式的 = 当时拨过 = 手动；没写的 = 当时是 1=C 大调、现在跟谱（新歌的谱头本来就是 C）。 */
export interface PadDesk {
    auto: boolean;
    fifths: number;
    scale: string;
    unit: PadUnit;
    tuplet: 0 | 3 | 5 | 6 | 7;
    low: number | null;
}
export declare const freshPad: () => PadDesk;
export interface PartViewState {
    hidden: boolean;
    only: boolean;
    muted: boolean;
    solo: boolean;
}
export declare const freshPartView: () => PartViewState;
/** mp3 = 导出歌声的音质（导出面板里选的；2026-10-08 by Claude Opus 5.5，user「音质配置就是应该也跟着吧」——跟这首歌走、存时顺手带、不标脏、不进 undo）。 */
/** ref = 参考窗的窗（开着没有 + 位置 / 大小，CSS 像素；2026-10-08 深夜 Opus 5.5，v0.8；同 WXHW 的 refPanel）——这首歌里开过窗才有；里面的卡不在这里（进文件、标脏，见 src/app/reference-host.ts）。 */
export interface RefPanelDesk {
    open: boolean;
    left: number;
    top: number;
    width: number;
    height: number;
}
/** pdf = 乐谱 PDF 的字体（导出面板里选的；同 mp3 音质跟着这首歌走、不标脏；2026-10-09 Opus 5.5，user「字体可以选普通的和那个拼音可爱的」）。 */
/** scroll = 排法「横卷」（v0.9.35；一行无限往右；和 pageFlow 互斥，两个都写着 = 横卷说了算）。 */
/** mode = 打开时进哪个模式（v0.10.21；user「打开时记住上次的模式，成品曲不应该老是跳到音符输入，容易误触」）：存的时候记下当时的模式，默认「音」不写。 */
/** 乐器目录翻到哪（v0.16.6，user 11-07「乐器列表记录滚动位置的话，是每个文件自己记录，不是用户设置…即兴的滚动归 App 记，然后文件内的滚动归文件记」）：
 *  mode = 排序；open = 每种排序展开的那一组；scroll = 列表滚到哪（px）；row = 点开的那一件（「组::概念」）；pick = 试听台上的那一位。
 *  在歌里打开的 = 这首歌的视图态（下面 Desk.finder，存时顺手带、不标脏、不进撤销）；从歌库「即兴」打开的 = 设备上的一个键（main.ts KV_FINDER_IMPRO）。 */
export interface FinderMemo {
    mode: string;
    open: Record<string, string>;
    scroll: number;
    row: string | null;
    pick: string;
}
export declare const FINDER_MODES: readonly ["year", "style", "family", "hs"];
export declare const freshFinderMemo: () => FinderMemo;
/** 文件 / 设备里的形状（只写不是默认的；全默认 = 不写）。 */
export interface FinderMemoJson {
    mode?: string;
    open?: Record<string, string>;
    scroll?: number;
    row?: string;
    pick?: string;
}
export declare function serializeFinderMemo(m: FinderMemo): FinderMemoJson | null;
/** 宽容：不认识的排序 / 不是字符串 / 不是有限的数 = 那一项默认。 */
export declare function unserializeFinderMemo(json: unknown): FinderMemo;
export interface Desk {
    scope: "all" | "segment";
    pageFlow: boolean;
    scroll: boolean;
    paper: string | null;
    parts: Record<string, PartViewState>;
    mp3: "standard" | "small";
    pad: PadDesk;
    ref: RefPanelDesk | null;
    mode: "notes" | "lyrics" | "symbols" | "listen";
    finder: FinderMemo;
}
export declare const freshDesk: () => Desk;
/** 文件里的形状（只写非默认值；全默认 = 不写这个字段）。 */
export interface DeskJson {
    scope?: "all";
    pageFlow?: true;
    scroll?: true;
    paper?: string;
    parts?: Record<string, {
        hidden?: true;
        only?: true;
        muted?: true;
        solo?: true;
    }>;
    mp3?: "small";
    pad?: PadJson;
    ref?: {
        open?: true;
        left: number;
        top: number;
        width: number;
        height: number;
    };
    mode?: "lyrics" | "symbols" | "listen";
    finder?: FinderMemoJson;
}
/** pad 在文件里的形状：只写不是默认的；全默认 = 不写。 */
export interface PadJson {
    fifths?: number;
    scale?: string;
    unit?: PadUnit;
    tuplet?: 3 | 5 | 6 | 7;
    low?: number;
}
export declare function serializeDesk(d: Desk): DeskJson | null;
/** 读文件里的（宽容：不是对象 / 字段不认识 = 当默认；别家 / 更新版写的多余字段不管）。 */
export declare function unserializeDesk(json: unknown): Desk;
