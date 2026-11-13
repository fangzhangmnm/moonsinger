import type { FxV2 } from "../format/contract.ts";
import type { ParamDef } from "./fx.ts";
import { type Song } from "../score/song.ts";
/** 主线程换算的两个参数（不是原语的，录音房不认；放之前就换成 hpHz / timeMs）。登记在这里 = 参数表的一员、存的时候明写（第 16 条 16-5，统筹 2026-11-12 夜）；
 *  新插一格写什么在 format/template.ts（16-4 A2），这里不带默认。
 *  意思：开着 = 这个数跟着这首歌自己的谱（跟着的东西就在同一个文件里）；存的时候把那一刻算出来的数写进 hpHz / timeMs（文件里的数 = 存那一刻真的在用的数，writeResolved）。 */
export declare const HOST_PARAMS: Record<string, ParamDef[]>;
/** 这位歌手全曲最低的音（自动低切用；没有音 = null）。 */
export declare function lowestMidiOf(song: Song, partId: string): number | null;
/** 歌开头的速度（延迟「跟速度」用）。 */
export declare function songBpm(song: Song): number;
/** 自动低切的频率：这个声部最低的音往下大三度（约 0.79 倍），夹在 20–300 Hz；没有音 = 0（关）。 */
export declare function autoLowCutHz(lowestMidi: number | null): number;
/** 存的时候用（16-5）：开关照写，开着的那一格把这一刻算出来的数写进 hpHz / timeMs——和 resolveChain 同一份换算，所以文件里写的就是放的时候用的数。 */
export declare function writeResolved(chain: readonly FxV2[], ctx: {
    lowestMidi: number | null;
    bpm: number;
}): FxV2[];
/** 一条链 → 录音房收的样子：hpAuto / syncBeats 换成 hpHz / timeMs（主线程换算的参数本身不送）。 */
export declare function resolveChain(chain: readonly FxV2[], ctx: {
    lowestMidi: number | null;
    bpm: number;
}): FxV2[];
