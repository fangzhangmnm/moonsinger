import type { VelCurve } from "../gm/sf2-subset.ts";
import type { BankLookup } from "../performers/registry.ts";
import { type Song, type PartDef } from "../score/song.ts";
import { type Extras, type GmCandidate } from "../format/project.ts";
import { type Timeline, type PerformerInfo } from "../engine/timeline.ts";
import { lowestMidiOf, songBpm } from "../engine/chain.ts";
import type { TimelineMsg, ChannelParams, BusSpec, MasterParams } from "../engine/studio.ts";
import type { VowelTableMsg } from "../engine/studio-client.ts";
import type { BuiltinLib } from "../sources/removed.ts";
/** 录音房的离线面：浏览器的 StudioClient 和 node 的 OfflineStudio 都长这样（结构类型）。 */
export interface RenderEngine {
    hasBank(sha: string): boolean;
    bank(sha: string, bytes: Uint8Array): Promise<void>;
    presetIndex(sha: string, bank: number, program: number): number;
    /** 这一份库里一个预设的 L 曲线（7-N；库没载 = null）。 */
    velCurve(sha: string, bank: number, program: number): VelCurve | null;
    vowels(t: VowelTableMsg): void;
    hasChunk(key: string): boolean;
    chunk(key: string, sr: number, samples: Float32Array | Int16Array): void;
    channel(id: string, p: Partial<ChannelParams>): void;
    buses(b: BusSpec[]): void;
    master(p: Partial<MasterParams>): void;
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
/** 音源 / 元音表从哪来（浏览器 = src/sources/sounds.ts + vowel-table.ts；node = 文件 / fetch）。 */
export interface RenderSounds {
    resolveGmBytes(g: GmCandidate): Promise<Uint8Array>;
    /** 元音表装进录音房（装过就不装）。 */
    ensureVowels(): Promise<void>;
}
export interface RenderDeps {
    engine: RenderEngine;
    sounds: RenderSounds;
    /** 慢引擎的块：把时间线里录音房还没有的块唱出来、`engine.chunk()` 喂进去（浏览器 = performance.ts 的泵；node = 顺序 singCore）。唱不了的一句 = 抛（整次渲染失败）或喂一块空的（那句空着）——由实现定。 */
    sing(tl: Timeline, progress: (msg: string) => void): Promise<void>;
}
/** 每个声部的视图态（静音 / 独奏）：出声的声部 = 有独奏的只出独奏的，否则出没静音的（user「不同的声部视图和出声应该分别可以solo和hide」）。 */
export type PartAudible = (partId: string) => {
    muted: boolean;
    solo: boolean;
};
export interface RenderPlan {
    song: Song;
    extras: Extras;
    /** 出声的声部（已经按静音 / 独奏筛过；audibleParts 算）。 */
    parts: readonly PartDef[];
    /** 效果全关（A/B，播放用；导出 / 定稿一律 false）。 */
    mixBypass?: boolean;
    /** 静音的混音轨（视图态）。 */
    busMuted?: ReadonlySet<string>;
}
export interface PrepareError {
    part: string;
    cand: string;
    why: string; /** 用的自带库被人删了（错上带着的种类，v0.17.25）。 */
    lib?: BuiltinLib;
}
/** 整首唱时给唱法核心的哼的参数：ん 闭嘴（N_m）、哼的字辅音至少 70 ms（核心默认关，Lab 命令行不受影响）；leadIn 明说（块按它摆）。歌级；小月相自己的旋钮在候选里（performers/tsukuyomi.ts info → ChunkPlan.opt）。 */
export declare const humOpt: () => Record<string, unknown>;
export declare const RENDER_SR = 44100;
/** 出声的声部：有独奏的只出独奏的，否则出没静音的。 */
export declare function audibleParts(song: Song, pv: PartAudible): PartDef[];
/** 上场那位的出声参数（时间线不碰 Extras）。SoundFont 的预设下标要库先进录音房（prepareParts）。 */
export declare function performerInfoOf(extras: Extras, part: PartDef, banks: BankLookup): PerformerInfo;
/** 这些声部上场那位各自的出声准备（SoundFont 子集进录音房 / 元音表 / …，归插件；找不到 = 那个声部报错、不出声，其余照放 = 换人的窄接口）。返回报错清单。 */
export declare function prepareParts(parts: readonly PartDef[], extras: Extras, deps: Pick<RenderDeps, "engine" | "sounds">): Promise<PrepareError[]>;
/** 录音房里这个声部的麦克风（增益 dB、声像 −1…1）；照写着的读（没有这条轨 = NaN：新建 / 门口都会建，到这儿还没有 = 缺数，mixProblemsFor 报）。 */
export declare function micOf(extras: Extras, part: PartDef): {
    gainDb: number;
    pan: number;
};
/** 这个声部的声音一路经过的录音房里缺的数（16-4 A2；和乐手身上的缺数同一处查——送进录音房之前，performerInfoOf）：
 *  它自己的轨、出到 / 发给的每一条混音轨（一路往下）、总轨。缺了 = 这个声部明着不出声，清单里写在哪、缺哪几个；音频线程不抛、不替它补。 */
export declare function mixProblemsFor(extras: Extras, part: PartDef): string[];
/** 这条通道 = 麦克风增益 + 上场那位的响度校准（三层不连乘：音符力度 = 意图；校准 = 看得见能调的默认；推子 = dB）。 */
export declare const channelOf: (extras: Extras, part: PartDef) => {
    gainDb: number;
    pan: number;
};
/** 这位歌手全曲最低的音、歌开头的速度：住在 engine/chain.ts（存档也要用，16-5）。 */
export { lowestMidiOf, songBpm };
/** 通道 / 总线 / 总轨的参数（录音房认的样子）：插件里「主线程换算」的参数（自动低切 = 这位最低的音、延迟跟速度）换成数；效果全关 = 插件格和发送都不响、推子 / 声像 / 出到 / 限幅留着。 */
export declare function mixParamsOf(plan: RenderPlan, pv: PartAudible): {
    channels: {
        id: string;
        p: Partial<ChannelParams>;
    }[];
    buses: BusSpec[];
    master: MasterParams | null;
};
/** 通道参数推进录音房（播放时才乘 → 边放边调立刻听见；静音 / 独奏在 audibleParts 里筛，不在通道上）。 */
export declare function pushMix(engine: RenderEngine, plan: RenderPlan, pv: PartAudible): void;
/** 这首歌（出声的声部）的时间线：谁上场 / 分段 / 音符表 / 块清单。纯函数（除了预设下标 / L 曲线要问录音房里的库）。 */
export declare function timelineOf(plan: RenderPlan, banks: BankLookup): Timeline;
/** 循环按谱绕的那一圈（谱上的秒）：从第一张纸头（编排写了 `[循环段]` 且 withArrangementLoop = 循环段第一张纸的头）到谱的结尾。
 *  余音（最后一个音之后的释放、混响尾巴）不在里面——下一圈开头接上去（编辑器的循环）或者切掉（歌库的 mp3 循环）。
 *  编辑器（performance.ts playRange）和渲出来的 mp3（renderSong 的 loop）共用这一份。2026-11-11 Claude Opus 5.5（user「歌库播放的loop的时间好像算错了…你不应该等小尾巴吧」）。 */
export declare function loopSpanOf(song: Song, tl: Timeline, withArrangementLoop?: boolean): {
    from: number;
    to: number;
};
/** loop = 渲出来的声音里循环那一圈的起止（**输出里的秒**，0 = 输出第一个样本）；太短 / 落在声音外面 = null（就按整个文件循环）。 */
export interface RenderResult {
    left: Float32Array;
    right: Float32Array;
    sr: number;
    secs: number;
    timeline: Timeline;
    errors: PrepareError[];
    loop: {
        start: number;
        end: number;
    } | null;
}
/** 整首（或一段）渲染成立体声样本：准备 → 时间线 → 块 → 混（和播放同一个类、同一份数学）。
 *  没法出声的声部报在 errors / timeline.unplayable 里、其余照混；一个都放不了 = 抛。pv = 静音 / 独奏（通道上的 mute / solo；筛声部用 plan.parts）。 */
export declare function renderSong(plan: RenderPlan, deps: RenderDeps, o?: {
    sr?: number;
    progress?: (msg: string, frac?: number) => void;
    pv?: PartAudible;
    /** 准备完、时间线算好那一刻（宿主记清单 §2.2½ 用）；一个都放不了也先叫它再抛。 */ onPrepared?: (errors: PrepareError[], tl: Timeline) => void;
}): Promise<RenderResult>;
/** 立体声 → 单声道（左右平均）。 */
export declare function toMono(left: Float32Array, right: Float32Array): Float32Array;
