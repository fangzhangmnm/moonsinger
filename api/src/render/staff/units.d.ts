import { type TextMeasure } from "../text/index.ts";
import { type Token, type Repeat, type Art, type Dyn, type ClefName, type Staff } from "../../score/song.ts";
import { type Pitch } from "../../score/pitch.ts";
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
/** 行中间换谱号：小一号的谱号（谱号的 0.72）占多宽（sp）。 */
export declare const CLEF_CUE = 0.72, CLEF_CUE_W: number;
export declare const CLEF_GLYPH: Record<ClefName, string>;
/** 「1=F♯」这几个字大约多宽（sp，TEMPO_EM × 0.85 的字号）：按 C 调看时中途换调那一处至少留这么宽。 */
export declare const KEY_LABEL_W = 3.5;
export declare const keyWidth: (fifths: number, prev: number) => number;
export declare const timeWidth: (beats: number, beatType: number) => number;
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
/** 一条 track → 排版单元（第 1 步：切时值、临时记号、自动小节线；tick = 从这条的开头数）。tail = 写字头在这条的尾巴后面（排一个零宽的 head 单元：五线画到右边）。 */
export declare function unitsOf(tokens: Token[], o: {
    tail: boolean;
    autoBars: boolean;
    measure: TextMeasure;
    sp: number;
    ts?: number;
    rhythm?: boolean; /** 从这个下标起是补齐的淡色休止（不在谱里）。 */
    padFrom?: number;
}): {
    units: Unit[];
    head: Head;
    shortBars: number;
    pickup: boolean;
};
