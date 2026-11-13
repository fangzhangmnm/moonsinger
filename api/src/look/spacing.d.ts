export type Pt = readonly [ticks: number, width: number];
export declare const LOOSE: readonly Pt[];
export declare const DENSE: readonly Pt[];
export declare const TIGHT: readonly Pt[];
/** 音前后留白、空小节宽（sp）。 */
export declare const SP_DEFAULTS: {
    readonly pad: 0.3;
    readonly emptyBar: 4.5;
};
/** 符头的左缘离对齐线（列的 x）多远（sp）：刀 3 起临时记号挂在左边，符头从这儿起。（原 src/render/staff/measure.ts，17-2 搬来） */
export declare const NOTEHEAD_X = 0.35;
