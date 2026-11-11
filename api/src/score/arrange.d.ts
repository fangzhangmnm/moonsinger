import { type Lang } from "../i18n/index.ts";
import { type PaperSeg, type Token, type TempoMap } from "./song.ts";
export type ArrNode = {
    kind: "ref";
    paper: string;
    text: string;
    at: number;
} | {
    kind: "rep";
    body: ArrNode[];
    n: number;
};
export interface ArrIssue {
    at: number;
    len: number;
    why: string;
}
export interface Arrangement {
    order: string[];
    loop: string[] | null;
    issues: ArrIssue[];
    explicit: boolean;
}
/** 解析编排那一行。papers = 歌里的纸（按顺序）。 */
/** l = 写错时说明用哪种语言（排版明着传；别处没给 = 这一页的当前语言）。 */
export declare function parseArrangement(text: string | undefined, papers: readonly PaperSeg[], l?: Lang): Arrangement;
/** 放的顺序（循环段放一遍）：给压平件 / 导出用。 */
export declare const playOrder: (a: Arrangement) => string[];
/** 一首歌整首放的顺序（没写编排 = 每张没藏的纸各一遍）。 */
export declare const songPlayOrder: (song: {
    arrangement?: string;
    papers: readonly PaperSeg[];
}) => string[];
/** 循环放（走带「循环」开着；user「我确实希望能单曲循环，或者测试战斗循环切割」「无穷循环和循环走带都做」）：
 *  渲染的顺序 = 前面那段 + 循环段**放两遍**；循环区间 = 第二遍。第一遍的尾音（混响、没收完的音）自然渗进第二遍的开头，
 *  所以每次从第二遍的结尾跳回第二遍的开头，听到的接缝和真的一遍遍连着放一模一样（游戏里循环音乐切法的同一个道理）。
 *  没写循环段 = 整首循环；本段视图（歌只剩一张纸、没有编排）= 这一张循环。intro / body = 纸的张数。 */
export declare function loopPlan(song: {
    arrangement?: string;
    papers: readonly PaperSeg[];
}): {
    order: string[];
    intro: number;
    body: number;
};
/** 循环区间（谱上的秒）：tokens / map / starts = 照 loopPlan 的顺序压平的第一个声部；第二遍从 starts[intro + body] 起、到整串结尾。 */
export declare function loopWindow(tokens: Token[], map: TempoMap, starts: readonly {
    index: number;
}[], plan: {
    intro: number;
    body: number;
}): {
    start: number;
    end: number;
} | null;
