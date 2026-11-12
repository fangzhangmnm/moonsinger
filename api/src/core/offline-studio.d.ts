import { type VelCurve } from "../gm/sf2-subset.ts";
import { type TimelineMsg, type ChannelParams, type MasterParams, type BusSpec } from "../engine/studio.ts";
import type { VowelTableMsg } from "../engine/studio-client.ts";
import type { RenderEngine } from "./render.ts";
export declare class OfflineStudio implements RenderEngine {
    private tsfP;
    private presets;
    private bankBytes;
    private vowelTable;
    private chunks;
    private channels;
    private masterP;
    private busesP;
    /** wasm = TinySoundFont 独立 WASM 的字节或编好的模块（vendor/tsf/tsf-standalone.wasm）。 */
    constructor(wasm: WebAssembly.Module | BufferSource);
    hasBank(sha: string): boolean;
    /** 载一份 sf2：先在一个临时 Studio 里装一次拿预设表（和录音房同一个 tsf.load），字节留着 renderOffline 再装。 */
    bank(sha: string, bytes: Uint8Array): Promise<void>;
    presetIndex(sha: string, bank: number, program: number): number;
    private curves;
    /** L 曲线（7-N）：从载库时留着的字节算，按预设记着（曲线自己按键懒算）；库没载 / 没有这个预设 = null（不记，载好了再问就有）。 */
    velCurve(sha: string, bank: number, program: number): VelCurve | null;
    vowels(t: VowelTableMsg): void;
    hasChunk(key: string): boolean;
    chunk(key: string, sr: number, samples: Float32Array | Int16Array): void;
    forget(keys: string[]): void;
    channel(id: string, p: Partial<ChannelParams>): void;
    master(p: Partial<MasterParams>): void;
    buses(b: BusSpec[]): void;
    /** 同 StudioClient.renderOffline：输出从 range.from 起、扣掉限幅器的延迟；每 400 块让一次事件循环。 */
    renderOffline(tl: TimelineMsg, o?: {
        sr?: number;
        progress?: (f: number) => void;
    }): Promise<{
        left: Float32Array;
        right: Float32Array;
        sr: number;
        start: number;
    }>;
}
