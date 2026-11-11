import { type Art } from "../score/song.ts";
export type SelVerb = "all" | "copy" | "cut" | "paste" | "transpose" | "delete" | "clear" | "forget" | "up" | "down" | "sharp" | "flat" | "octUp" | "octDown" | "half" | "double" | "dot";
/** 「修」（2026-10-08 by Claude Opus 5.5；user 拍「挂在音上 + 选区条」）：选区条原地换成一排开关——演奏法（选中的音都有 = 亮；有的有 = 半亮）+ 力度（选区开头那儿写着的亮）。 */
export interface FixState {
    art: Record<Art, "all" | "some" | "none">;
    slur?: "all" | "some" | "none";
    ignores?: readonly string[];
}
/** 渐强 / 渐弱的钮面：< / >（两条线）。 */
export declare const CRESC_SVG = "<svg class=\"slur-ico\" viewBox=\"0 0 22 12\" aria-hidden=\"true\"><path d=\"M20,2 L3,6 L20,10\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>";
export declare const DIM_SVG = "<svg class=\"slur-ico\" viewBox=\"0 0 22 12\" aria-hidden=\"true\"><path d=\"M2,2 L19,6 L2,10\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>";
/** 连线的钮面：一道弧（SMuFL 没有单个连线字形）。 */
export declare const SLUR_SVG = "<svg class=\"slur-ico\" viewBox=\"0 0 22 12\" aria-hidden=\"true\"><path d=\"M2,9 Q11,1 20,9\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\"/></svg>";
export interface SelBarHost {
    verb(v: SelVerb): void;
}
export declare class SelBar {
    readonly el: HTMLDivElement;
    constructor(parent: HTMLElement, host: SelBarHost);
    /** 画：sel = 有没有选区（几个 token）；clip = 剪贴板里有没有东西；over = 别的全屏视图盖着（藏）；fix = 「修」开着（那一排开关的状态）。 */
    update(sel: number, clip: boolean, over: boolean): void;
}
