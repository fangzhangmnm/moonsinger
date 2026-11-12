import { type Lang } from "../i18n/index.ts";
import type { Art, Dyn, PedalKind } from "../score/song.ts";
import type { NotationId } from "../score/song-view.ts";
import type { LaneKind } from "./frame/lanes.ts";
export type Depiction = {
    kind: "glyph";
    above: string;
    below?: string; /** 墨迹（sp）：宽 / 高；力度字另带左、右、基线以上、基线以下。 */
    w?: number;
    h?: number;
    ink?: readonly [number, number, number, number];
} | {
    kind: "drawn";
    how: string;
}
/** 普通的字（文字样式表里的一种：字体 / 粗细 / 斜体在那里）：简谱数字行上的力度（第五刀，统筹转达 user 11-11「我觉得主要是我们简谱字比较细，你用粗体就怎么都会抢吧」）。 */
 | {
    kind: "text";
    s: string;
};
export type SignId = `art:${Art}` | `dyn:${Dyn}` | "hairpin:cresc" | "hairpin:dim" | "ramp" | `pedal:${PedalKind}`;
export interface Sign {
    readonly id: SignId;
    name(l: Lang): string;
    says(l: Lang): string;
    /** 贴在哪一道（frame/lanes.ts）；跟着音本身画的（符头上的、音右边的）= "note"。 */
    readonly lane: LaneKind | "note";
    readonly draw: Readonly<Record<NotationId, Depiction>>;
}
/** 记号表（演奏法 + 力度 + 渐强 / 渐弱 + 渐到）。不做类型断言：少一行 = 编译不过。 */
export declare const SIGNS: Readonly<Record<SignId, Sign>>;
/** 力度字在这种谱里画成什么：五线谱 = Bravura 字形 + 墨迹；简谱 = 普通的字（细斜体小写，墨迹按字宽现量）。不分界面语言（纪要第 88 节）。 */
export declare function dynDepiction(d: Dyn, notation: NotationId): {
    kind: "glyph";
    glyph: string;
    ink: readonly [number, number, number, number];
} | {
    kind: "text";
    s: string;
};
