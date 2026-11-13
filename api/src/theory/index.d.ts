import { type Token, type NoteTok, type ChordPin } from "../score/song.ts";
/** 一个读法（候选）。label = 谱上写的短字；name = 点开时写在旁边的全名；cost 越小越像（同分 = 打平）。各理论可以多带自己的字段（纯数据）。 */
export interface HarmonyGuess {
    label: string;
    name: string;
    cost: number;
}
/** 读出来的结果：best = 第一候选；ties = 和它打平的（含它自己）；all = 全部候选（按先后）；theory = 哪种理论读的。 */
export interface HarmonyRead<G extends HarmonyGuess = HarmonyGuess> {
    theory: string;
    best: G;
    ties: G[];
    all: G[];
    /** 人挑的（音上写着和弦名，v0.16.87）：best = 写着的那个；auto = 这几个音自己认出来的（没有 = 认不出，比如旋律里一个单音）。 */
    pinned?: true;
    auto?: HarmonyRead<G>;
    /** 写着的那个不在 auto 的候选里（音后来改了）：照样画、灰 + 「?」，点开说一声；不自动删、不自动换。 */
    stale?: true;
}
/** 一处标签：index = 那个音在 track 里的下标。 */
export interface HarmonyTag<R extends HarmonyRead = HarmonyRead> {
    index: number;
    read: R;
}
/** 一条 track：一张纸（曲段）里一个声部的记号串（调号从里面的调号记号读）。 */
export interface TrackInput {
    tokens: readonly Token[]; /** 这个声部认不认「拆开弹的和弦」（声部开关，v0.16.73；没给 = 认）。 */
    broken?: boolean;
}
/** 一小节里的一个音。index 只当名字用（标签挂回它身上）——理论手里没有 track，拿它翻不到别的记号。 */
export interface BarNote {
    index: number;
    tok: NoteTok;
    /** 在小节里的位置（tick，从小节头数；弱起小节的音靠右）。 */
    pos: number;
    /** 这个音这里的调（几个升降号）= 它前面最近的调号。 */
    fifths: number;
    /** 那个调号写着「小调」（v0.16.83；user 11-09「在选调号的时候强制一起选」）= 级数从 la 数。人写明的，不是分析猜的（文件头 ③）。 */
    minor?: true;
    /** 接着前面连过来的（不重新起音）。 */
    tie?: true;
}
/** 读的单位 = 一小节：这一小节的拍号 + 里面的音（按先后）。没有音的小节不喂。 */
export interface BarInput {
    beats: number;
    beatType: number;
    notes: readonly BarNote[];
}
export interface ReadOpts {
    broken: boolean;
}
export interface HarmonyTheory {
    id: string;
    /** 读一小节：这一小节 + 上一小节交出来的 carry（第一小节 = undefined）→ 这一小节里要标的音 + 交给下一小节的 carry。纯函数、纯数据（排版 worker 里跑）。
     *  理论只见得到喂给它的这一小节（见文件头「只看前面」）。 */
    readBar(bar: BarInput, carry: unknown, opts: ReadOpts): {
        tags: HarmonyTag[];
        carry: unknown;
    };
    /** 谱上写的那一行字（级数写法：V7、ii）。 */
    label(read: HarmonyRead): string;
    /** 同一处读法写成根音（G7、Am、C/E；和弦写法选「根音」时谱上写这个，第 19 条）。后缀和候选小表里的根音名是同一张表（读法里的 name）。 */
    rootLabel(read: HarmonyRead): string;
    /** 点开候选时：顶上那句「怎么认的」、每个读法后面的小字。界面上跑（可以用 _t）。 */
    howTo(read?: HarmonyRead): string;
    explain(guess: HarmonyGuess): string[];
    /** 人写明的和弦（音上的 harm）→ 一处读法（级数按这里的调现算）；auto = 这个音自己认出来的。种类不认识 = null（不画）。 */
    pinRead(pin: ChordPin, at: {
        fifths: number;
        minor: boolean;
    }, auto: HarmonyRead | undefined): HarmonyRead | null;
    /** 候选里的一个 → 存进音里的和弦名。 */
    pinOf(guess: HarmonyGuess): ChordPin;
}
export declare const THEORIES: Record<string, HarmonyTheory>;
/** 人写明的和弦 ↔ MusicXML <harmony><kind>（v0.16.87）：和弦种类的写法表跟着西方功能和声那一种（存盘用的是和弦名本身，不看是哪种理论在读）。 */
export { pinXmlKind, xmlKindToPin, PIN_KIND_IDS } from "./western.ts";
export declare const DEFAULT_THEORY: string;
/** 一张纸上「哪几个音底下标什么」：合租的一家合起来认、不在一家的各认各的（预处理，两种谱读同一份；第五刀 5-4）。 */
export { paperHarmony, type PlacedTag, type PaperHarmonyInput } from "./families.ts";
/** 按 id 找理论；不认识的 id（别的版本加的）= 默认那一种。 */
export declare const harmonyTheory: (id?: string) => HarmonyTheory;
/** 把一条 track 切成一小节一小节（从左到右；小节怎么分 = 画谱 / 拍子轻重同一套 meterPositions；调 = 走到这儿之前最近的调号）。 */
export declare function barsOf(tokens: readonly Token[]): BarInput[];
/** 一条 track 要标的音：从左到右一小节一小节喂给理论，carry 一路往右传（理论拿不到整条 track——文件头「只看前面」）。 */
export declare function harmonyTags(theory: HarmonyTheory, track: TrackInput): HarmonyTag[];
