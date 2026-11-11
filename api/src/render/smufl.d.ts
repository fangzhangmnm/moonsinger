export declare const GLYPH: {
    readonly metNoteQuarterUp: "";
    readonly gClef: "";
    readonly fClef: "";
    readonly gClef8vb: "";
    readonly gClef8va: "";
    readonly gClef15ma: "";
    readonly fClef8vb: "";
    readonly ottavaAlta: "";
    readonly ottavaBassa: "";
    readonly quindicesimaAlta: "";
    readonly noteheadWhole: "";
    readonly noteheadHalf: "";
    readonly noteheadBlack: "";
    readonly noteheadXWhole: "";
    readonly noteheadXHalf: "";
    readonly noteheadXBlack: "";
    readonly augmentationDot: "";
    readonly flag8thUp: "";
    readonly flag8thDown: "";
    readonly flag16thUp: "";
    readonly flag16thDown: "";
    readonly flag32ndUp: "";
    readonly flag32ndDown: "";
    readonly accidentalFlat: "";
    readonly accidentalNatural: "";
    readonly accidentalSharp: "";
    readonly accidentalDoubleSharp: "";
    readonly accidentalDoubleFlat: "";
    readonly restWhole: "";
    readonly restHalf: "";
    readonly restQuarter: "";
    readonly rest8th: "";
    readonly rest16th: "";
    readonly rest32nd: "";
};
export declare const timeSigDigits: (n: number) => string;
/** 鼓谱（2026-10-10 v0.10.27，Claude Opus 5.5）：打击乐谱号 + 音乐仓鼠 v13 的符头名 → SMuFL 码位 [黑, 二分, 全] 和宽（sp = Bravura advance / 250）。
 *  码位在浏览器里渲了一遍对过形状（不盲画）：la = 方块、ti = 圆底倒三角（MuseScore 的形状音符）；custom 按 smufl 名查 PERC_SMUFL。 */
/** 力度记号的 Bravura 字形（ppp…fff）。2026-11-09 Opus 收到这里一份（乐器设置页 / 主程序的菜单用；engrave / pad / sel-bar 各自还有一份同样的，碰到再收）。 */
export declare const DYN_GLYPH: {
    readonly ppp: "";
    readonly pp: "";
    readonly p: "";
    readonly mp: "";
    readonly mf: "";
    readonly f: "";
    readonly ff: "";
    readonly fff: "";
};
export declare const PERC_CLEF = "\uE069";
export declare const PERC_HEAD: Record<string, {
    ch: [string, string, string];
    w: [number, number, number];
}>;
export declare const PERC_SMUFL: Record<string, {
    ch: [string, string, string];
    w: [number, number, number];
}>;
/** 宽度（sp）。 */
export declare const W: {
    readonly noteheadBlack: 1.18;
    readonly noteheadHalf: 1.18;
    readonly noteheadWhole: 1.688;
    readonly noteheadXBlack: 1.16;
    readonly noteheadXHalf: 1.34;
    readonly noteheadXWhole: 1.51;
    readonly gClef: 2.684;
    readonly fClef: 2.736;
    readonly sharp: 0.996;
    readonly flat: 0.904;
    readonly natural: 0.672;
    readonly doubleSharp: 1;
    readonly doubleFlat: 1.644;
    readonly dot: 0.4;
    readonly timeSigDigit: 1.8;
    readonly restWhole: 1.128;
    readonly restHalf: 1.128;
    readonly restQuarter: 1.08;
    readonly rest8th: 0.988;
    readonly rest16th: 1.28;
    readonly rest32nd: 1.452;
};
/** engravingDefaults（sp）。 */
export declare const ENGRAVE: {
    readonly staffLine: 0.13;
    readonly stem: 0.12;
    readonly ledger: 0.16;
    readonly ledgerExt: 0.4;
    readonly beam: 0.5;
    readonly beamGap: 0.25;
    readonly thinBar: 0.16;
    readonly tieMid: 0.22;
};
/** 符干接点（符头原点为 0,0）：上符干接右边 y=+0.168；下符干接左边 y=-0.168（黑 / 白符头相同）。 */
export declare const STEM_UP_SE: [number, number];
export declare const STEM_DOWN_NW: [number, number];
/** 符尾接点（符尾原点为 0,0）：上符尾 stemUpNW，下符尾 stemDownSW。 */
export declare const FLAG_ANCHOR_UP: Record<number, number>;
export declare const FLAG_ANCHOR_DOWN: Record<number, number>;
/** 符尾的墨宽（sp，从字形原点往右；按 1 / 2 / 3 层）：vendor/fonts/bravura/outlines.json 的轮廓量的（2026-11-09 Opus 5.5，刀 4a 补横向间距的右伸）。 */
export declare const FLAG_W: {
    readonly up: readonly [1.056, 1.116, 1.044];
    readonly down: readonly [1.224, 1.164, 1.092];
};
