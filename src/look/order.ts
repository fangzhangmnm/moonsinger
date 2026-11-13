// src/look/order.ts —— 先后和让路的规则（第 17 条 17-2：从 src/render 原样搬来，数一个没改）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   同一时刻几种东西从左到右的先后（SLOT，原 frame/columns.ts）、谱上上下那几道的先后（STAFF_LANES 原 staff/draw.ts、JIANPU_LANES 原 jianpu/draw.ts）、
//   简谱左边挂件的让路倍数（LEFT_CLEAR，原 jianpu/measure.ts）、提示字往上让几层（MAX_CLIMB，原 frame/hints.ts）。
import type { ColumnKind } from "../render/frame/columns.ts";   // 只要类型
import type { LaneKind } from "../render/frame/lanes.ts";

/** 同一时刻里的先后（小）→（大）。房子 / Segno / Coda 排在小节线后面（0.5），D.C. / Fine / To Coda 排在前面（−0.5）由画法直接报。 */
export const SLOT: Record<ColumnKind, number> = { bar: 0, nav: 0.5, clef: 0.8, key: 1, time: 2, tempo: 3, groove: 3.3, dyn: 3.5, ottava: 3.6, pedal: 3.65, hairpin: 3.7, tail: 4, note: 5 };

/** 五线谱这一种贴挂件的先后（原来按编号 later[2..12]：跳音 / 保持在音符层里，不是挂件）。 */
export const STAFF_LANES: readonly LaneKind[] = ["strength", "noteDynamics", "dynamics", "ottavaAbove", "nav", "tempo", "groove", "barNumber", "chordTag", "lyrics", "ottavaBelow", "pedal"];

/** 简谱数字行贴挂件的先后（从数字往上：演奏法 → 音的修饰 → 力度道 → 跳转 → 速度 → 风格 → 小节号 → 和弦级数；歌词在下面）。和五线谱同一张道名表（frame/lanes.ts）。 */
export const JIANPU_LANES: readonly LaneKind[] = ["strength", "noteDynamics", "dynamics", "nav", "tempo", "groove", "barNumber", "chordTag", "lyrics", "pedal"];

/** 左边挂了东西的音：前一个音的墨到这个挂件的空 ≥ 挂件到它自己那个音的空的几倍（第八刀，统筹 2026-11-12 定成规矩，不定成数）。 */
export const LEFT_CLEAR = 4;

/** 往上找最多几格。 */
export const MAX_CLIMB = 6;
