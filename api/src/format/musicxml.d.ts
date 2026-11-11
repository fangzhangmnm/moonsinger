import { type Paper } from "../score/paper.ts";
import { type ClefName, type Token } from "../score/song.ts";
export interface PartInfo {
    id: string;
    clef?: ClefName;
    staves?: 2;
    name: string;
    instrumentName: string;
    sound: string;
    program: number;
    variant?: {
        library: string;
        name: string;
    };
    volume?: number;
    pan?: number;
}
/** 一条声部：谁 + 一串 token；breaks = 从哪些 token 下标起是新的一页（压平件的纸界：token 下标 → 曲段名，第一个声部写排练记号）。 */
export interface PartXml {
    info: PartInfo;
    tokens: Token[];
    breaks?: Map<number, string>;
}
/** padMeasures = 各声部小节数不等时补整小节休止（给别的软件看的压平件要；自家正本不补——读回来会多出休止）。 */
export interface ScoreXml {
    title?: string;
    movementTitle?: string;
    paper?: Paper;
    credits?: string;
    rights?: string;
    parts: PartXml[];
    padMeasures?: boolean;
}
export interface WriteMeta {
    software: string;
    date: string;
}
export interface Written {
    xml: string;
    manualBars: Record<string, number[]>;
    unwritten: string[];
}
export declare const clefXml: (c: ClefName) => string;
/** MusicXML <clef> → 谱号（中音 / 打击乐 / TAB 这些不认 = null）。 */
export declare function clefOfXml(sign: string | undefined, octave: string | undefined): ClefName | null;
/** 几条声部 → 整份 MusicXML。manualBars = 声部 id → 人插的小节线（小节序号，1 起）；unwritten = 还没写音高的音（note id，各声部一起）。 */
export declare function writeMusicXml(doc: ScoreXml, meta: WriteMeta): Written;
export interface ReadPart {
    id: string;
    name: string;
    instrumentName?: string;
    sound?: string;
    program?: number;
    variant?: string;
    volume?: number;
    pan?: number;
    clef?: ClefName;
    staves?: 2;
}
export interface ReadScore {
    title: string;
    movementTitle: string;
    paper?: Paper;
    credits?: string;
    rights?: string;
    parts: {
        info: ReadPart;
        tokens: Token[];
    }[];
    dropped: Record<string, number>;
}
export interface ReadHints {
    manualBars?: Record<string, number[]>;
    unwritten?: string[];
}
/** MusicXML → 每个声部一串 token（id 在这份文件里唯一；调用方拼进歌时再错开）。hints 没给（别的软件存的）= 每条小节线都当人插的（编辑器只画人插的小节线）。
 *  别的声部没写速度（自家文件只写第一个声部的）= 谱头抄第一个声部的。 */
export declare function readMusicXml(xml: string, hints?: ReadHints): ReadScore;
