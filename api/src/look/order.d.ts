import type { ColumnKind } from "../render/frame/columns.ts";
import type { LaneKind } from "../render/frame/lanes.ts";
/** 同一时刻里的先后（小）→（大）。房子 / Segno / Coda 排在小节线后面（0.5），D.C. / Fine / To Coda 排在前面（−0.5）由画法直接报。 */
export declare const SLOT: Record<ColumnKind, number>;
/** 五线谱这一种贴挂件的先后（原来按编号 later[2..12]：跳音 / 保持在音符层里，不是挂件）。 */
export declare const STAFF_LANES: readonly LaneKind[];
/** 简谱数字行贴挂件的先后（从数字往上：演奏法 → 音的修饰 → 力度道 → 跳转 → 速度 → 风格 → 小节号 → 和弦级数；歌词在下面）。和五线谱同一张道名表（frame/lanes.ts）。 */
export declare const JIANPU_LANES: readonly LaneKind[];
/** 左边挂了东西的音：前一个音的墨到这个挂件的空 ≥ 挂件到它自己那个音的空的几倍（第八刀，统筹 2026-11-12 定成规矩，不定成数）。 */
export declare const LEFT_CLEAR = 4;
/** 往上找最多几格。 */
export declare const MAX_CLIMB = 6;
