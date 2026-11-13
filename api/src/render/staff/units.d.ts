import type { ClefName } from "../../score/song.ts";
import type { UnitWidths } from "../frame/units.ts";
export declare const CLEF_GLYPH: Record<ClefName, string>;
export declare const keyWidth: (fifths: number, prev: number) => number;
export declare const timeWidth: (beats: number, beatType: number) => number;
/** 五线谱的单元宽（sp）：交给框架的 unitsOf。= 字形的宽（字形的数据）+ 留白（规则的数，src/look/marks.ts STAFF_UNIT）；这里只管拼（17-2 拆开，数一个没改）。 */
export declare const STAFF_WIDTHS: UnitWidths;
