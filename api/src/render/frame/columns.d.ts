export type ColumnKind = "bar" | "nav" | "clef" | "key" | "time" | "tempo" | "groove" | "dyn" | "ottava" | "hairpin" | "tail" | "note";
/** 同一时刻里的先后（小）→（大）。房子 / Segno / Coda 排在小节线后面（0.5），D.C. / Fine / To Coda 排在前面（−0.5）由画法直接报。 */
export declare const SLOT: Record<ColumnKind, number>;
