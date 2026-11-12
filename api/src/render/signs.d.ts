import { type Lang } from "../i18n/index.ts";
import type { Art, Dyn } from "../score/song.ts";
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
    kind: "word";
    zh: string; /** 不是中文界面时画成什么（简谱力度：标准字母 = 五线谱同一个字形）。 */
    other: Depiction;
} | {
    kind: "drawn";
    how: string;
};
export type SignId = `art:${Art}` | `dyn:${Dyn}` | "hairpin:cresc" | "hairpin:dim" | "ramp";
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
/** 力度字在这种谱、这种界面语言下画成什么（word 按语言落到中文字或 other）。 */
export declare function dynDepiction(d: Dyn, notation: NotationId, l: Lang): {
    glyph: string;
    ink: readonly [number, number, number, number];
} | {
    text: string;
};
