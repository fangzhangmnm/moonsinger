import type { FxV2 } from "../format/contract.ts";
/** 自动低切的频率：这个声部最低的音往下大三度（约 0.79 倍），夹在 20–300 Hz；没有音 = 0（关）。 */
export declare function autoLowCutHz(lowestMidi: number | null): number;
/** 一条链 → 录音房收的样子：hpAuto / syncBeats 换成 hpHz / timeMs（主线程换算的参数本身不送）。 */
export declare function resolveChain(chain: readonly FxV2[], ctx: {
    lowestMidi: number | null;
    bpm: number;
}): FxV2[];
