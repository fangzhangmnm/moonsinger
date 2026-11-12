export type LaneKind = "strength" | "noteDynamics" | "dynamics" | "ottavaAbove" | "nav" | "tempo" | "groove" | "barNumber" | "chordTag" | "lyrics" | "ottavaBelow" | "pedal";
/** 播放的小节底色只盖到这一道为止（含）：反复跳转算这一行的墨，速度 / 风格这些整张谱的不算（v0.10.26）。 */
export declare const INK_UP_TO: LaneKind;
