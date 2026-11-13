import type { Tsf } from "../gm/tsf-standalone.ts";
import type { FxV2 } from "../format/contract.ts";
import { type FxInstance } from "./fx.ts";
export declare const BLOCK = 128;
/** 母线天花板（−0.18 dBFS；原 src/audio/mix.ts 的 0.98）。 */
export declare const CEILING = 0.98;
/** 范围尾（放到歌尾 / 导出）什么时候收：演奏者都没声了 **而且** 总轨出来的声连着 QUIET_HOLD 秒低于 QUIET（−80 dBFS）。
 *  只看演奏者（原来的 TAIL_MAX / silent）会把混响 / 延迟的尾巴切掉——它们住在总线和链上（2026-11-09 user「结束的时候硬截断了」，导出的 mp3 同样）。
 *  上限 TAIL_FX_MAX 秒（反馈很大的回声可能永远到不了 −80）。实时放的时候 ended 之后总线照样自己响完（render 每块都处理总线）；
 *  离线导出在 ended 那一刻停录，所以到上限还有声 = 最后 TAIL_FADE 秒淡出（fadeTail，不硬切）。离线导出按上限留够长度。2026-11-09 Claude Opus 5.5 */
export declare const TAIL_FX_MAX = 12, TAIL_FADE = 0.5;
/** 离线导出录完：末尾还有声（> −80 dBFS）= 最后 TAIL_FADE 秒余弦淡出（就地改）。两条离线导出（core/offline-studio、engine/studio-client）共用。 */
export declare function fadeTail(L: Float32Array, R: Float32Array, sr: number): void;
/** 一个要出声的音（时间线上的秒）。preset = 这份库里的预设下标（主线程按 bank:program 查过）；vel 0–1。 */
export interface NoteEv {
    t0: number;
    t1: number;
    key: number;
    vel: number;
    preset: number; /** 写的结尾（只有被踏板留长了的才有）：从中间起放时这个音只靠踏板留着 + 乐器会自己衰减 = 不补按（规矩八）。 */
    w1?: number;
}
/** 慢引擎的一块：key = 内容键（主线程按 key 喂 samples）；t0 = 这块第 0 个采样对应时间线的第几秒（含提前量）；dur = 预计几秒（没到时判断「站在它上面」）；gain = 乘多少。 */
export interface ClipRef {
    key: string;
    t0: number;
    dur: number;
    gain: number; /** 唱的最后一个音结束的秒（t0 + dur 还含收尾余音）；从某一段放时，end ≤ 起点的块不放。 */
    end?: number;
}
export interface GainSeg {
    t0: number;
    t1: number;
    dB: number;
}
/** chain = 跟着演奏者走的效果（琴箱 / 音箱…；CandidateV2.chain），在表情曲线之后、通道条之前。 */
export type TrackSpec = {
    id: string;
    kind: "sf";
    sha: string;
    notes: NoteEv[];
    gain: GainSeg[] | null;
    chain?: FxV2[]; /** 按下去就自然衰减（候选 canSwell = false：钢琴、拨弦…）：只靠踏板留着的音从中间起放不补按（规矩八）。 */
    decays?: true;
} | {
    id: string;
    kind: "vowel";
    kana: string;
    notes: NoteEv[];
    gain: GainSeg[] | null;
    chain?: FxV2[];
} | {
    id: string;
    kind: "clips";
    clips: ClipRef[];
    gain: GainSeg[] | null;
    chain?: FxV2[];
};
export interface TimelineMsg {
    tracks: TrackSpec[];
    range: {
        from: number;
        to: number;
    };
    loop: boolean; /** 循环从哪儿跳回（不给 = 范围头）：编排「前面放一遍、括住的一直循环」。 */
    loopFrom?: number;
    /** 循环在哪儿跳回（谱上的末尾；不给 = 范围尾）。v0.16.59：范围 = 声音的头尾（唱的那几句提前 0.5 s 起辅音、最后多留 0.6 s 尾音），循环要按谱的长度绕——
     *  user 11-09「弱起的时候我最后一个小节会少一拍。播放的时候不应跟自动补全。不如我循环会很麻烦」：原来每圈接缝多出约 1.1 s。接缝两边的唱段照样接上（renderClips 的接缝那一段）。 */
    loopTo?: number;
    /** 放着的时候换时间线：播放头挪这么多秒（主线程按谱位置算的：改了播放头前面的东西 / 反复结构，秒数不变会跳到别的音上）。 */ shift?: number;
}
/** 一条通道（轨 ≠ 乐手：乐手的通道、总线、以后的素材轨都是这个形状；user 2026-10-10「轨还是和乐手是两个概念」）：
 *  chain = 通道条上的效果（EQ / 压缩（可侧链 key = 别的轨 id）…）；sends = 推子之后发到总线多少；to = 去哪（"master" / 总线 id）。 */
export interface ChannelParams {
    gainDb: number;
    pan: number;
    mute: boolean;
    solo: boolean;
    chain?: FxV2[];
    sends?: {
        to: string;
        gainDb: number;
    }[];
    to?: string;
}
/** 路由轨（总线）：to = 出到哪（"master" / 别的总线）；sends = 推子后发给别的总线（v0.10.9：总线也能接总线；user「插件：可以随便插，比如混响也是，你可以做中间的路由轨」）。 */
export interface BusSpec {
    id: string;
    gainDb: number;
    pan: number;
    chain: FxV2[];
    to?: string;
    sends?: {
        to: string;
        gainDb: number;
    }[]; /** 静音（v0.10.35，视图态）：这条混音轨不出声、也不往下发。 */
    mute?: boolean;
}
export interface MasterParams {
    gainDb: number;
    limiter: boolean;
    chain?: FxV2[];
}
/** 元音表（assets/preview/vowels.json + .pcm16 的形状）。 */
export interface VowelEntry {
    kana: string;
    midi: number;
    start: number;
    len: number;
    loopStart: number;
    loopEnd: number;
}
export type AuditionInst = {
    kind: "sf";
    sha: string;
    preset: number;
} | {
    kind: "vowel";
    kana: string;
} | {
    kind: "clip";
};
export type StudioIn = {
    type: "bank";
    sha: string;
    bytes: Uint8Array;
} | {
    type: "unbank";
    sha: string;
} | {
    type: "vowels";
    sr: number;
    entries: VowelEntry[];
    pcm: Int16Array;
} | {
    type: "timeline";
    tl: TimelineMsg;
} | {
    type: "chunk";
    key: string;
    sr: number;
    samples: Float32Array | Int16Array;
    k?: number;
} | {
    type: "forget";
    keys: string[];
}
/** 离线导出要块（主线程不再留拷贝）：录音房把这几块拷一份发回来。 */
 | {
    type: "getChunks";
    keys: string[];
} | {
    type: "channel";
    id: string;
    p: Partial<ChannelParams>;
} | {
    type: "buses";
    buses: BusSpec[];
} | {
    type: "master";
    p: Partial<MasterParams>;
} | {
    type: "play";
    at?: number;
    gen?: number; /** 起点（从某一段放：at 比它提前一点给辅音）：在它之前就结束的音不追、不按，唱完在它之前的块不放（v0.10.3）。 */
    quiet?: number;
} | {
    type: "stop";
} | {
    type: "seek";
    at: number;
    quiet?: number;
}
/** 按键试听：src = 来源（手指 / 键），同一来源新的顶掉旧的；gainDb / pan = 这条通道（麦克风 + 校准）+ 光标处的力度。 */
 | {
    type: "audition";
    src: string;
    ev: "on" | "off" | "glide" | "alloff";
    inst?: AuditionInst;
    key?: number;
    vel?: number;
    gainDb?: number;
    pan?: number;
}
/** 按键试听：放一段现成的声音（月读唱的一个字；刀 3）。同一来源新的顶掉旧的；off 走 audition off。 */
 | {
    type: "auditionClip";
    src: string;
    sr: number;
    samples: Float32Array;
    gainDb?: number;
    pan?: number;
} | {
    type: "meter";
    on: boolean;
}
/** 频谱（v0.10.11）：开着 = 每条轨（链之后、推子之前）/ 混音轨（链之后）/ 总轨（出口）留最近 2048 个采样，每 4096 帧拷一份给主线程。混音台 EQ 页看得见才开。 */
 | {
    type: "spectrum";
    on: boolean;
} | {
    type: "stereo";
    on: boolean;
};
export type StudioOut = {
    type: "ready";
} | {
    type: "banked";
    sha: string;
    presets: [number, number][];
} | {
    type: "error";
    message: string;
} | {
    type: "crash";
    message: string;
}
/** at = 这个位置对应的音频时钟（AudioContext 的秒；宿主给了 clock 才有）：主线程拿扬声器此刻的时钟（getOutputTimestamp）来查「现在听到的是走带的哪儿」。 */
 | {
    type: "pos";
    sec: number;
    playing: boolean;
    waiting: string | null;
    gen: number;
    at?: number;
} | {
    type: "ended";
    gen: number;
} | {
    type: "missing";
    keys: string[];
} | {
    type: "chunks";
    items: {
        key: string;
        sr: number;
        samples: Int16Array;
        k?: number;
    }[];
} | {
    type: "meter";
    peak: number;
    active: number; /** 每条轨 / 混音轨推子后的峰值（v0.10.10：混音台每张卡片顶上一条细线）。 */
    tracks?: Record<string, number>;
    /** 这一段推子后的均方（v0.10.16：平均电平 = RMS；单声道轨 = (x·推子)²，立体声 = (L² + R²) / 2；总轨 = 出声口）。 */ ms?: Record<string, number>;
    /** 每条轨上第一台压缩这一段最多压了多少 dB（≤ 0；v0.10.16 压缩页的表）。 */ gr?: Record<string, number>;
    /** 同一台压缩这一段进 / 出的峰值（线性；v0.10.21 压缩页的波形图）。 */ cl?: Record<string, [number, number]>;
} | {
    type: "spectrum";
    sr: number;
    tracks: Record<string, Float32Array>;
} | {
    type: "stereo";
    tracks: Record<string, {
        L: Float32Array;
        R: Float32Array;
    }>;
}
/** 每秒一条（一直开着，便宜）：音频线程这 1 s 的忙闲（渲染耗时 / 这 1 s）、录音房里留着的块（Int16 字节数 / 块数）、正在响的声音数。刀 6 负载 / 内存监控。 */
 | {
    type: "load";
    busy: number;
    chunkBytes: number;
    chunks: number;
    voices: number;
};
interface Bus {
    id: string;
    gainDb: number;
    pan: number;
    mute: boolean;
    gl: number;
    gr: number; /** 同 TrackState.sounded：上一块这条总线（链之后）有没有声。 */
    sounded: boolean;
    fx: FxInstance[];
    L: Float32Array;
    R: Float32Array; /** 出到的总线（null = 总轨）。 */
    out: Bus | null;
    sends: {
        bus: Bus;
        lin: number;
    }[];
}
/** Float32 → Int16（夹到 ±1）。 */
/** Float32 → Int16 不削顶（v0.10.38；user「合成结果转成 16 位时超过满幅会被直接削顶…这个你也能修吧」）：整块峰值超过满幅 = 整块按峰值缩进来（k = 峰值），
 *  放的时候乘回 k——音量不变、不削顶（toInt16 在 ±1 处硬削 = 月读合成冲过满幅那一下就成了爆音）。没超 = k 1，和 toInt16 一样。 */
export declare function packInt16(x: Float32Array): {
    s: Int16Array;
    k: number;
};
export declare function toInt16(x: Float32Array): Int16Array;
export declare class Studio {
    readonly sr: number;
    private tsf;
    private post;
    private banks;
    private vowels;
    private chunks;
    private tracks;
    private order;
    private channels;
    private buses;
    /** 处理总线的顺序：送出去的在被送进的前面（busOrder）。 */
    private busList;
    private master;
    private masterLin;
    private masterFx;
    private playing;
    private pos;
    private range;
    private loop;
    private loopFrom;
    private loopTo;
    private looped;
    private tail;
    private quietSecs;
    private draining;
    private drainPos;
    private drainSecs;
    private forgetLater;
    private waiting;
    private gen;
    private auditionSf;
    private auditions;
    private auditionVowels;
    private auditionClips;
    private lastAud;
    private mono;
    private busL;
    private busR;
    private audL;
    private audR;
    private look;
    private delayL;
    private delayR;
    private need;
    private attPow;
    private wr;
    private gPrev;
    private aRel;
    private meterOn;
    private meterPeak;
    private meterFrames;
    /** 每条轨 / 混音轨这一段推子后的峰值（只在 meterOn 时攒；混音台开着才开）。 */
    private trackPeaks;
    private specOn;
    private specFrames;
    /** 平均电平 / 压缩的表（meterOn 时攒）：均方的和 + 帧数；最多压了多少 dB。 */
    private trackMs;
    private grMin;
    private compLv;
    /** 李萨如图：总轨 / 混音轨推子后的左右最近 STEREO_N 个采样。 */
    private stereoOn;
    private stereoFrames;
    private stereoRings;
    private stereoPush;
    /** 第一台压缩（压缩页摊开的就是它）这一块压了多少 + 进 / 出的峰值。没有压缩 / 关着 = 进出都按这条轨链尾、推子前的峰值 `pre`，压了 0
     *  （v0.10.26，user「效果器的动画没开效果器的卡上面也应该有」：每张卡都有波形，看得出哪儿冲、要不要压）。 */
    private grOf;
    private specRings;
    /** 往某条轨的频谱环里写一段（单声道；立体声的传两路取平均）；g0 → g1 = 这一段的推子（线性渐变，和出声同一条斜坡）。 */
    private specPush;
    private loadBusy;
    private loadFrames;
    private chunkBytes;
    private posFrames;
    /** 宿主的音频时钟：这一块开头的 AudioContext 时间（worklet 每块前设 = currentTime；离线 / 测试不设）。位置报告带上「块尾的时钟」。 */
    clock: number | null;
    private missingSent;
    constructor(sampleRate: number, tsf: Tsf, post: (m: StudioOut, transfer?: Transferable[]) => void);
    /** 限幅器带来的固定延迟（采样）：导出时从输出里扣掉。 */
    get latency(): number;
    get isPlaying(): boolean;
    get position(): number;
    get waitingFor(): string | null;
    hasChunk(key: string): boolean;
    handle(m: StudioIn): void;
    private playerFor;
    private setTimeline;
    /** 起点（见 play 消息的 quiet）：-Infinity = 没有。跳转 / 循环绕回 / 停 = 清掉（循环第二遍前一段照常响）。
     *  user 2026-10-10「为什么从sheet C播放的时候会带前一个音，也不知道是sheet B的还是stop的时候没弄干净」：从某一段放时起点提前 PRE_ROLL（月读的辅音在拍子前），这一小截落在前一段最后一个音里，追音把它补按下去、前一句的块（带收尾余音）也放出来。 */
    private quiet;
    /** 这一块没跑 renderTracks（不放也不收尾）；见 TrackState.sounded。 */
    private idle;
    private mutedNote;
    private mutedClip;
    private play;
    /** 停：不排新音、块 30 ms 淡出、释放中的尾巴接着响到静（不是冻住）。播放头留在原地。 */
    private stop;
    private seek;
    /** 旧块响完 / 不要了：撤 hold；主线程早就说要放掉的这时才真删。 */
    private endHold;
    private dropChunk;
    private held;
    /** 放着的时候这个块正在响（时间线里它盖着播放头）。 */
    private sounding;
    /** 主线程早说要放掉的块：既没 hold 着、时间线里也不再用 = 这时才真删。 */
    private sweepForget;
    /** 所有正在响的声音快速收掉（几毫秒的淡出，不是硬切）：起放时清上一次的尾巴。 */
    private killAll;
    /** 游标对齐到 pos；chase = 把 pos 这一刻该响着的音按下（起放 / seek / 续放），正在响的先松开。 */
    private resetCursors;
    /** 起点落在这条块轨某一块的中间（块头之后、块尾之前）。 */
    private cutsInto;
    private releaseAll;
    private noteOn;
    private noteOff;
    /** 播放头前面（提前量内）的块到齐了没有；没到的报上去（主线程去算）。 */
    private checkMissing;
    /** 走带从 pos 往前最多能走到哪（≤ end）：没到的块的头挡住；正站在没到的块上 = 返回 null（要等它）。 */
    private clipBarrier;
    private keyStartingAt;
    private freeze;
    /** 出一块：outL / outR 长 n（≤ BLOCK）。 */
    render(outL: Float32Array, outR: Float32Array, n: number): void;
    activeVoices(): number;
    private renderTransport;
    /** 停了之后：尾巴（释放中的音、淡出中的块）照响到静或 TAIL_MAX；播放头不动，块按自己的钟走。 */
    private renderDrain;
    /** 循环跳回循环头（到范围尾时；或尾巴还在响时开了循环）。 */
    private loopBack;
    /** 这一圈放到哪儿为止：循环 = 谱的末尾（loopTo），不循环 = 范围尾（最后一句的尾音也放完）。 */
    private endAt;
    private chaseAtLoop;
    /** 从中间起放 / 跳转 / 循环绕回时补不补按这个音（踏板 11-1 规矩八，统筹 11-0 之后定）：写的时值盖住起点的照补；只靠踏板留着的——会自己衰减的乐器不补（真弹早衰减了，
     *  补 = 十几个音一起从音头重敲），按住不衰减的照补（它们这时候确实还响着）。 */
    private chaseable;
    private silent;
    /** 各声部出 cnt 个采样进母线 / 总线（从 off 起）。notesOn = 排新音；clipsOn = 块前进（false = 冻着，块不出声）。
     *  两趟（侧链要先看到别的轨的声）：① 每轨 出声 → 表情曲线 → 块淡入淡出 → 演奏者的链 → src；② 每轨 src → 通道链（压缩器的 key 读别的轨的 src）→ 静音 / 独奏 → 推子 / 声像 → 去总轨或总线，再按发送量发到总线。 */
    private renderTracks;
    /** 压缩器的侧链：通道条上 id 是 fxId 的那台写了 key = 别的轨 id → 那条轨这一段的第一趟输出；没写 / 找不到 = null（听自己）。 */
    private keyOf;
    private renderClips;
    private renderClip;
    /** 快引擎的轨：事件按采样位置施加（同原 synth-processor），中间逐段渲染。 */
    private renderNotes;
    private vowelOn;
    /** 一池声音出 cnt 个采样：单声道 mono（时间线轨）或立体声 L / R（试听，自带增益声像）。 */
    private renderVowels;
    private audition;
    private auditionOff;
    private renderAuditions;
    /** 试听的一段声音：线性重采样放一遍（不循环），起 5 ms、松开 40 ms 淡出、被顶掉 6 ms。 */
    private renderClipVoices;
    private limit;
}
/** 总线的处理顺序 + 连好 out / sends（v0.10.9）：送出去的排在被送进的前面（拓扑序）；一条连线会接成环 = 断掉它（出到退回总轨、发送不要），
 *  界面上本来就不让这样连（读到手改过的文件才会遇到）。不认识的去处 = 总轨 / 不发。 */
/** 混音轨之间每一条「出到 / 发送」接没接上（纯函数；录音房 busOrder 和混音台的「断了」标法共用这一个判法，界面说的就是出声的样子）：
 *  按顺序一条条接，去处不是一条混音轨 = missing（出到退回总轨、发送不发）；接上会成环的那一条 = cycle（不接）；"master" 不算一条连线（to = null）。第 16 条「断了要看得见」，2026-11-12。 */
export type LinkState = "ok" | "missing" | "cycle";
export declare function busLinkStates(specs: readonly {
    id: string;
    to?: string;
    sends?: readonly {
        to: string;
    }[];
}[], has: (id: string) => boolean): Map<string, {
    to: LinkState | null;
    sends: LinkState[];
}>;
export declare function busOrder(specs: readonly BusSpec[], buses: Map<string, Bus>): Bus[];
export {};
