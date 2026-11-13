export type PaperKind = "A3L" | "A4" | "A5" | "A6";
/** density = 版式两档：舒适 / 紧凑（谱小一号、行距 / 谱距 / 歌词距都收紧、没歌词的声部不留歌词位）——2026-10-08 user「排版引擎还是要支持小字号…」
 *  →「比起字号，就一个舒适一个紧凑两个选项？然后紧凑你可以多帮我优化一些，包括字号，行距之类的」。 */
export type Density = "cozy" | "compact";
/** 画的时候用的那张纸（每个字段必填；src/look lookOf 交出来的就是这一份）。staffMm = 五线谱高（四个线间距）mm。 */
export interface Paper {
    kind: PaperKind | "other";
    widthMm: number;
    heightMm: number;
    marginMm: {
        l: number;
        r: number;
        t: number;
        b: number;
    };
    density: Density;
    staffMm: number;
}
/** 从 MusicXML <defaults> 认出来的那一份（只在读文件的门口用，src/look paperChoicesOf 把它变成选择）：版式是紧凑才写、谱高不是那一档的才写。 */
export interface ReadPaper {
    kind: PaperKind | "other";
    widthMm: number;
    heightMm: number;
    marginMm: Paper["marginMm"];
    density?: Density;
    staffMm?: number;
}
/** 四边边距（mm）。 */
export type Margins = Paper["marginMm"];
/** 纸张的选择（第 17 条 17-1；score.json `paper`）：四种之一，或者按值带着的一张（别家的谱带来的大小；以后人自己填的也是这一种）。 */
export type PaperChoice = {
    kind: PaperKind;
} | {
    kind: "other";
    widthMm: number;
    heightMm: number;
};
export declare const DENSITIES: {
    id: Density;
    label: string;
    note: string;
}[];
export declare const PAPER_KINDS: PaperKind[];
export declare const isPaperKind: (v: unknown) => v is PaperKind;
/** 档名后面的一句话（纸的设置面板里）。 */
export declare const PAPER_NOTE: Record<PaperKind, string>;
export declare const PAPER_LABEL: Record<PaperKind, string>;
