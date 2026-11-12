import type { ClefName } from "../../score/song.ts";
import type { UnitWidths } from "../frame/units.ts";
/** 行中间换谱号：小一号的谱号（谱号的 0.72）占多宽（sp）。 */
export declare const CLEF_CUE = 0.72, CLEF_CUE_W: number;
export declare const CLEF_GLYPH: Record<ClefName, string>;
/** 「1=F♯」这几个字大约多宽（sp，TEMPO_EM × 0.85 的字号）：按 C 调看时中途换调那一处至少留这么宽。 */
export declare const KEY_LABEL_W = 3.5;
export declare const keyWidth: (fifths: number, prev: number) => number;
export declare const timeWidth: (beats: number, beatType: number) => number;
/** 五线谱的单元宽（sp）：交给框架的 unitsOf。 */
export declare const STAFF_WIDTHS: UnitWidths;
