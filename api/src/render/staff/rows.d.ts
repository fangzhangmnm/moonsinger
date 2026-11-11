import type { Song, PaperSeg, Token, ClefName, Focus } from "../../score/song.ts";
import { type ResolvedLook } from "../../score/clef.ts";
import type { TextMeasure } from "../text/index.ts";
import type { PartView } from "../engrave.ts";
import type { StaffTrack } from "./measure.ts";
/** 框架交来的一家：这张纸上看得见的两位以上（按歌里的顺序，主人在前）、这次可以叠。host = 这一家的主人 id（不一定在这张纸上）。 */
export interface FoldFamily {
    host: string;
    members: PartView[];
}
type LookAt = (paperId: string, partId: string) => ResolvedLook | undefined;
export interface StaffRows {
    /** 要排的声部（叠起来的一家 = 一位虚拟的、声部 2 / 双手谱下面那张 = 假的一位）。 */
    parts: PartView[];
    /** 主人 id → 叠进来的房客 / 并好的虚拟 track / 双手谱下面那张的假 id / 一张谱表 → 它的声部 2 / 声部 2 → 画在哪一位那行 / 虚拟那几条的谱号。 */
    absorbed: Map<string, PartView[]>;
    virt: Map<string, Token[]>;
    lowOf: Map<string, string>;
    voice2Of: Map<string, string>;
    shareWith: Map<string, string>;
    startFor: Map<string, ClefName>;
    /** 一家全是鼓：谱前名字的顺序 = 各位的音在鼓谱上的高低（v0.16.4，user 11-07「鼓合租的时候应该是按照代理音符的高低排序前面的名字」）。 */
    drumNames: Map<string, PartView[]>;
    loIds: Set<string>;
    /** 叠起来的那几条虚拟 track（键 = "纸 id:id"；Layout.virtual）。 */
    virtualOut: Record<string, Token[]>;
}
/** 合租（v0.10.28 改；设计账 ai-docs/20261010-shared-staff-percussion-design.md §1）：一家（主人 + 这张纸上看得见的房客）叠起来 = 一条虚拟的多声部 track
 *  （src/score/merge.ts：各人的音按时间并成和弦），当成主人那一位交给普通的排谱流程——自己挑谱号、太宽 = 双手谱、自动八度线、全是鼓 = 五线鼓谱；房客不再自己画。
 *  user「i think it is wiser to just 聚合 all the notes and render them as they are a single polyphonic track」「…use the already-have rendering procedure for that virtual track」
 *  「for shared clef i dont know why there is data contract. it is just the proper way of showing multi teanants」（不存东西）。以前（v0.10.24–27）各画各的 = 符干打架（「蝌蚪的尾巴在打架」）。 */
export declare function staffRows(paper: PaperSeg, visible: readonly PartView[], fold: readonly FoldFamily[], lookAt: LookAt): StaffRows;
export interface StaffTracksCtx {
    song: Song;
    paper: PaperSeg;
    lookAt: LookAt;
    at: Focus;
    tailOpen: boolean;
    autoBars: boolean;
    measure: TextMeasure;
    sp: number;
    ts: number;
    /** 框架算的：每条要排的轨的真长度、这张纸最长那条（后面补齐的空小节）。 */
    lens: number[];
    paperLen: number;
}
/** 每条要排的轨 → 排版单元 + 谱号 + 八度线（设计稿第 3.3 节第 1 步的五线谱那一半）。rowHost = 声部 2 画在哪一位那行（下标；-1 = 自己一行）。 */
export declare function staffTracks(rows: StaffRows, c: StaffTracksCtx): {
    per: StaffTrack[];
    rowHost: number[];
    shortBars: number;
};
export {};
