// units.ts —— 五线谱这一种的排版单元宽和字形（排版单元本身、时间那一半在框架：src/render/frame/units.ts）。
// > moved 2026-11-11 by Claude Opus 5.5（施工单 1b-2 搬家：从 src/render/engrave.ts 原样搬出）
// > edited 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第五刀 5-1）：时间那一半和单元的类型搬进框架，这里只留五线谱的宽（STAFF_WIDTHS：数值、运算先后照原样）和字形。
import { TEXT_STYLES } from "../text/index.ts";
import type { ClefName } from "../../score/song.ts";
import { GLYPH, W } from "../smufl.ts";
import { BAR_W } from "../../look/frame.ts";
import type { UnitWidths } from "../frame/units.ts";
import { baseWidth } from "./notation.ts";
import { CLEF_CUE_W, KEY_LABEL_W, STAFF_UNIT as U } from "../../look/marks.ts";   // 留白的数在 src/look/marks.ts（17-2）

export const CLEF_GLYPH: Record<ClefName, string> = { G: GLYPH.gClef, G8vb: GLYPH.gClef8vb, G8va: GLYPH.gClef8va, G15ma: GLYPH.gClef15ma, F: GLYPH.fClef, F8vb: GLYPH.fClef8vb };   // 同一 tick 上的先后（句在小节线前：换气画在上一个音后面）
export const keyWidth = (fifths: number, prev: number) => (fifths === 0 ? Math.abs(prev) * 0.8 : Math.abs(fifths) * 1.05) + 1.0;
export const timeWidth = (beats: number, beatType: number) => Math.max([...String(beats)].length, [...String(beatType)].length) * W.timeSigDigit;

/** 五线谱的单元宽（sp）：交给框架的 unitsOf。= 字形的宽（字形的数据）+ 留白（规则的数，src/look/marks.ts STAFF_UNIT）；这里只管拼（17-2 拆开，数一个没改）。 */
export const STAFF_WIDTHS: UnitWidths = {
  // 反复小节线：字形宽 1.47（:|: 2.43）+ 两边留一点（Bravura repeatLeft / repeatRight / repeatRightLeft）；段落线 / 终止线（v0.9.32）比一根小节线宽一点
  bar: (repeat, style) => (repeat ? (repeat === "both" ? 2.43 : 1.47) + U.repeat : style ? BAR_W + U.barStyle : BAR_W),
  // 按 C 调看：这一处要写「1=X」，给字留宽（KEY_LABEL_W）
  key: (fifths, prev, inCLabel, ts) => (inCLabel ? Math.max(KEY_LABEL_W * (TEXT_STYLES["key-label"].ruler === "text" ? ts : 1), keyWidth(fifths, prev)) : keyWidth(fifths, prev)),
  time: (beats, beatType) => timeWidth(beats, beatType) + U.time,
  tempo: U.tempo, clef: CLEF_CUE_W,
  acc: (any) => (any ? U.acc : 0),
  chunk: (accW, base, dotted) => accW + baseWidth(base) + (dotted ? U.dot : 0),
  lyric: (accW, lyW, hyph) => accW + lyW + (hyph ? U.lyricHyph : U.lyricPlain),
  breath: U.breath, inhale: U.inhale,   // 呼吸逗号画在这个音后面：留一点地方；出声的换气：逗号后面的字也留地方
};
