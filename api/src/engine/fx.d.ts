import type { FxV2 } from "../format/contract.ts";
export interface ParamDef {
    id: string;
    unit: "dB" | "Hz" | "ms" | "ratio" | "0..1" | "bool";
    min: number;
    max: number;
    default: number;
    label: string;
}
export interface FxKindDef {
    kind: string;
    name: string;
    params: ParamDef[]; /** 算法一句话 + 公式（伪码 / latex），进 vault README */
    formula: string;
    stereoOnly?: boolean;
}
/** 一个效果实例：process 就地改 L（和 R；单声道链 R = null）；key = 侧链信号（压缩器才看）。 */
export interface FxInstance {
    readonly kind: string;
    readonly id: string;
    on: boolean;
    setParams(p: Record<string, number>): void;
    process(L: Float32Array, R: Float32Array | null, n: number, key: Float32Array | null): void;
}
/** EQ 在这些频率上的响应（dB；混音台 EQ 页卡片背景上那条曲线，v0.10.11）：同录音房的双二阶系数，|H(e^{jω})| 连乘。 */
export declare function eqResponseDb(p: Record<string, number>, sr: number, freqs: readonly number[]): number[];
export declare const FX_KINDS: Record<string, FxKindDef>;
/** 按 FxV2 建实例；不认识的 kind = null（不出声、原样带着）。 */
export declare function createFx(spec: FxV2, sr: number): FxInstance | null;
/** 一条链：按 spec 建 / 复用实例（同 id 同 kind 的留着状态，只换参数；不认识的跳过）。 */
export declare function buildChain(specs: readonly FxV2[], prev: FxInstance[], sr: number): FxInstance[];
/** vault README 用：这条链每个效果的算法说明。 */
export declare function describeFx(spec: FxV2): string;
