import { type TextMeasure } from "../text/index.ts";
import { type Token, type Repeat, type Art, type Dyn, type ClefName, type Staff } from "../../score/song.ts";
import { type Pitch } from "../../score/pitch.ts";
export declare const MIN_PLAIN: number;
export declare const NOTATABLE: {
    ticks: number;
    base: number;
    dotted: boolean;
}[];
/** 把一个（写出来的）时值拆成能记的几段（贪心取最大的；段之间画连音线）。 */
export declare function splitDur(dur: number): {
    base: number;
    dotted: boolean;
    ticks: number;
}[];
/** 连音：n 个占 m 个（照 song.ts TUPLET）。时值不是三十二分的整数倍时，找一个比例让「写出来的时值」能记。 */
export declare const RATIOS: [number, number][];
export declare function notate(dur: number): {
    ratio: [number, number] | null;
    chunks: {
        base: number;
        dotted: boolean;
        ticks: number;
    }[];
};
export interface Chunk {
    kind: "chunk";
    index: number;
    j: number;
    last: boolean;
    base: number;
    dotted: boolean;
    note: boolean;
    ratio: [number, number] | null;
    ticks: number;
    pitch: Pitch | null;
    ghost: boolean;
    tie: boolean;
    lyric: string | null;
    hyph: boolean;
    inBar: number;
    beat: number;
    acc: number | null;
    w: number;
    accW: number;
    m?: number;
    pad?: true;
    pitches: Pitch[];
    accs: (number | null)[];
    art: Art[];
    breath: boolean;
    inhale?: "soft" | "big";
    whisper?: boolean;
    lyW?: number;
    mrest?: "draw" | "skip";
    x: number;
    system: number;
    tick: number;
    staff: Staff;
}
export interface BarU {
    kind: "bar";
    index: number;
    w: number;
    x: number;
    system: number;
    tick: number;
    staff: Staff;
    warn: boolean;
    auto: boolean;
    repeat?: Repeat;
    times?: number;
    style?: "double" | "final";
}
export interface KeyU {
    kind: "key";
    index: number;
    fifths: number;
    prev: number;
    w: number;
    x: number;
    system: number;
    tick: number;
    staff: Staff; /** 按 C 调看时原来的调（写「1=」）。 */
    real: number; /** 小调（写「6=」）。 */
    minor: boolean;
}
export interface TimeU {
    kind: "time";
    index: number;
    beats: number;
    beatType: number;
    w: number;
    x: number;
    system: number;
    tick: number;
    staff: Staff;
}
export interface TempoU {
    kind: "tempo";
    index: number;
    bpm: number;
    w: number;
    x: number;
    system: number;
    tick: number;
    staff: Staff;
}
export interface HeadU {
    kind: "head";
    index: -1;
    w: 0;
    x: number;
    system: number;
    tick: number;
    staff: Staff;
}
export interface DynU {
    kind: "dyn";
    index: number;
    value: Dyn;
    w: number;
    x: number;
    system: number;
    tick: number;
    staff: Staff;
}
export interface HairpinU {
    kind: "hairpin";
    index: number;
    dir: "cresc" | "dim";
    w: number;
    x: number;
    system: number;
    tick: number;
    staff: Staff;
}
export interface GrooveU {
    kind: "groove";
    index: number;
    w: number;
    x: number;
    system: number;
    tick: number;
    staff: Staff;
}
export interface NavU {
    kind: "nav";
    index: number;
    w: number;
    x: number;
    system: number;
    tick: number;
    staff: Staff;
    slot: number;
}
export interface ClefU {
    kind: "clef";
    index: number;
    clef: ClefName;
    w: number;
    x: number;
    system: number;
    tick: number;
    staff: Staff;
}
export interface OttavaU {
    kind: "ottava";
    index: number;
    w: number;
    x: number;
    system: number;
    tick: number;
    staff: Staff;
}
export type Unit = Chunk | BarU | KeyU | TimeU | TempoU | HeadU | DynU | HairpinU | GrooveU | NavU | ClefU | OttavaU;
/** 各种单元多宽（sp，量之前的那个宽；画法给）。音那一段：先算临时记号让位的宽 acc，再 chunk = 平常占多宽，按歌词排时 lyric 和它取大，换气 / 出声的换气另加。 */
export interface UnitWidths {
    bar(repeat: Repeat | undefined, style: "double" | "final" | undefined): number;
    /** inCLabel = 按 C 调看时这一处要写「1=X」；ts = 字的尺子。 */
    key(fifths: number, prev: number, inCLabel: boolean, ts: number): number;
    time(beats: number, beatType: number): number;
    readonly tempo: number;
    readonly clef: number;
    acc(any: boolean): number;
    chunk(accW: number, base: number, dotted: boolean): number;
    lyric(accW: number, lyW: number, hyph: boolean): number;
    readonly breath: number;
    readonly inhale: Readonly<Record<"soft" | "big", number>>;
}
export interface Head {
    key: number; /** 按 C 调看时原来的调。 */
    real: number;
    minor: boolean;
    time: {
        beats: number;
        beatType: number;
    };
    bpm: number;
    idx: Partial<Record<"key" | "time" | "tempo", number>>;
}
export declare function unitsOf(tokens: Token[], o: {
    tail: boolean;
    autoBars: boolean;
    measure: TextMeasure;
    sp: number;
    ts?: number;
    rhythm?: boolean; /** 从这个下标起是补齐的淡色休止（不在谱里）。 */
    padFrom?: number; /** 各种单元多宽（画法给的）。 */
    widths: UnitWidths;
}): {
    units: Unit[];
    head: Head;
    shortBars: number;
    pickup: boolean;
};
