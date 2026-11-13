import type { Extras, GmCandidate } from "../format/project.ts";
import type { VelCurve } from "../gm/sf2-subset.ts";
import type { Catalog } from "../gm/catalog.ts";
import type { Hum } from "../format/contract.ts";
import type { FxV2 } from "../format/contract.ts";
import type { PerformerInfo } from "../engine/timeline.ts";
import type { TrackSpec, GainSeg, AuditionInst } from "../engine/studio.ts";
import type { Mark } from "../score/perform.ts";
import type { PercKind } from "../gm/percussion.ts";
/** 唱不唱字：words = 唱歌词；hum = 只哼（歌词画灰「只哼」）；none = 乐器，不唱。 */
export type LyricsAbility = "words" | "hum" | "none";
/** pad 键底部提示的音域（人声固定；乐器看目录 = null，由界面另查）。 */
export type FixedRange = {
    lo: number;
    hi: number;
    who: string;
} | null;
/** 时间线交给插件的一个音（秒；力度已按谱算好）。 */
export interface LightNote {
    midi: number;
    t0: number;
    t1: number;
    vel?: number; /** 写的结尾（只有被踏板留长了的才有，score/pedal.ts；追音用，规矩八）。 */
    w1?: number;
}
/** 只要知道「哪首歌的哪个角色」的调用都用这个。 */
export interface RoleCtx {
    extras: Extras;
    role: string;
}
/** 出声前准备要用的东西（胶水给；插件只拿它要的）。 */
export interface PrepareCtx extends RoleCtx {
    engine: {
        hasBank(sha: string): boolean;
        bank(sha: string, bytes: Uint8Array): Promise<void>;
    };
    resolveGmBytes(g: GmCandidate): Promise<Uint8Array>;
    ensureVowels(): Promise<void>;
}
/** 载进录音房的库能问什么（引擎本身就满足它）：预设下标；L 曲线（7-N：从库的字节算、按键懒算；库没载 = null）。 */
export interface BankLookup {
    presetIndex(sha: string, bank: number, program: number): number;
    velCurve(sha: string, bank: number, program: number): VelCurve | null;
}
export interface InfoCtx extends RoleCtx, BankLookup {
}
export interface TrackCtx {
    id: string;
    notes: LightNote[];
    gain: GainSeg[] | null;
    chain?: FxV2[];
    hum: Hum;
    info: PerformerInfo;
}
export type TrackResult = {
    track: TrackSpec;
    from?: number;
} | {
    unplayable: string;
};
/** 按键试听（弹 / 写音 / 拖音高的预听）：光标处的力度已算好（vel = MIDI 力度 0–1，有力度表的用；dB = 音量，没有的用）；kana = 这首歌哼的字。 */
export interface AuditionCtx extends RoleCtx {
    kana: string;
    dyn: {
        vel: number;
        dB: number;
    };
    engine: {
        hasBank(sha: string): boolean;
        presetIndex(sha: string, bank: number, program: number): number;
    };
    /** 库还没载好：这一下丢掉、顺手去载（试听要即时，迟到的音更烦）。 */
    ensureBank(): void;
}
/** 试听用谁出声；gainDb = 力度带来的那部分（通道的增益 / 声像归轨，胶水加）。null = 这一下不出声。 */
export type AuditionTarget = {
    inst: AuditionInst;
    key: (midi: number) => number;
    vel: number;
    gainDb: number;
};
/** 谱上怎么画这位（只是画法，数据不动）：xHead = 固定敲一个键 → × 符头；perc = 鼓 / 音效 → 鼓谱。 */
export type Notation = {
    xHead?: true;
    perc?: PercKind;
};
/** 乐器页「怎么演」里这位自报的一行（ADR-0004 §2.5「槽旁的参数行由插件自报，不是 main.ts 写死」；2026-10-15 刀 5 之一）：
 *  control / note = HTML 片段（宿主的 row() 排版；按钮带 data-v，按到了回 onInspector）；place = 放哪：主块（默认）/ 「高级」折叠 / 末尾。 */
export interface InspectorRow {
    label: string;
    control: string;
    note?: string;
    place?: "adv" | "tail";
}
export interface InspectorCtx extends RoleCtx {
    hum: Hum;
    /** 这个声部显示成什么（宿主从唯一出口 src/format/part-show.ts 拿，12-4；插件不自己拼声部名）。撤销的话里用。 */
    roleLabel: string;
    /** 音乐目录（载好了才有；没载 = 行里少几句说明，宿主载好会重画）。 */
    catalog: Catalog | null;
    esc(s: string): string;
    /** 一个选项钮（亮 = 现在是它）。 */
    chip(v: string, label: string, on: boolean, title?: string): string;
    /** 力度换算表（每个力度记号 → 这位的 MIDI 力度或 dB；有 GS 力度层再加一行）。L = 这位在一个键上的「力度 → dB」（和出声同一个函数，7-N；null = 不知道，不写 dB 那一行）。 */
    dynTable(layers: {
        count: number;
        ranges: [number, number][];
    } | null, L: ((vel: number) => number | null) | null): string;
    /** 这一份库里一个预设的 L 曲线（字节在手边才有；7-N）。 */
    velCurve(sha: string, bank: number, program: number): VelCurve | null;
    /** 这次打开里手边有的子集字节（找到过 / 加进来的；歌里嵌的在候选的 bytes 里）。没有 = undefined（声音载好后宿主会重画）。 */
    bankBytes(sha256: string): Uint8Array | undefined;
}
/** 行里的按钮按到了：改成什么（休息室新值 + undo 的话 + 连续拖并成一步的 gesture + 要不要把正在响的停掉）。 */
export interface InspectorChange {
    extras: Extras;
    label: string;
    gesture?: string;
    silence?: boolean;
}
export interface PerformerPlugin {
    readonly guid: string;
    readonly kind: "performer";
    /** 英文名 = 歌里 `instrument.engine` 的值（第一版参数里的引擎名就是它）。 */
    readonly name: string;
    readonly version: number;
    /** 界面上的名字（中文）。 */
    readonly label: string;
    /** 候选 chip 的悬浮说明（一句话：是谁、代价是什么）。 */
    readonly description: string;
    /** 出声方式：chunks = 慢引擎按句出块（时间线出 ChunkPlan、worker 唱、录音房放块）；notes = 快引擎音符表（录音房里实时合成）。 */
    readonly sound: "chunks" | "notes";
    /** 能不能叠音（pad 叠键、两键同按、时间线的和弦）。 */
    readonly poly: boolean;
    readonly lyrics: LyricsAbility;
    readonly hintRange: FixedRange;
    /** 认哪些记号（不认的谱上画灰 + 明说；`test/honors.test.ts` 核「表说认 = 出声真变了」）。 */
    readonly honors: readonly Mark[];
    /** 认哪几种踏板（没写 = 都不认 → 踏板记号画灰、明说）。只写出声真接了的：11-1 = 延音；持音、弱音 11-2。test/pedal.test.ts 核「表说认 = 出声真变了」。 */
    readonly pedals?: readonly import("../score/song.ts").PedalKind[];
    /** 本来就连着唱（连线 / 保持对它没意义，断句用呼吸）→ 这两个记号画灰的理由是 "sung" 而不是 "gap"。 */
    readonly connected: boolean;
    /** 力度怎么落：velocity = 按下那一下的 MIDI 力度（候选带力度表 dynamicsVel，深度是库给每件乐器写的、引擎自己读，vendor/tsf/patch-tsf.py 补丁 2）；
     *  gain = 音量曲线（dB）乘在声音上（候选带 dB 表 dynamicsDb，16-4）。乐器页按这个摆哪一行；存档按这个分这位身上写哪些键（format/project.ts dynPathOf / ART_KEYS_BY）。
     *  **这个字段是格式契约的一部分**（统筹 2026-11-12 夜）：它决定歌里这位身上写哪些键、不写哪些键，所以一个引擎名走哪条路永远不变——想换路 = 换一个新的引擎名
     *  （同「键的意思永远不变」）。守卫：test/art-keys-by-path.test.ts 把现有三个引擎各走哪条路钉住。 */
    readonly dynamics: "velocity" | "gain";
    /** 新上场的这位默认的「响度」（calibrationDb，dB）：插件 / 库自己报（9-3；user「是不同库之间需要调」）。library = 候选的 origin.library（SoundFont 按库；
     *  别的引擎不看）。乐器页的「默认」钮回到它。库和库之间只在这一个数上对齐；混音台的推子是这首歌的决定，不算。 */
    defaultCalibrationDb(library: string | null): number;
    /** 拍子轻重预设的类别：voice = 人声一档；gm = 按 GM 音色家族 / 鼓件（要 gm 参数）。 */
    readonly grooveCategory: "voice" | "gm";
    /** 能不能从休息室删掉（第一公民的两位不删；带自己字节的乐器能删）。 */
    readonly removable: boolean;
    /** 出声参数里这位自己的那部分（gm / 分段唱 / 着力点）；通用部分（力度表 / 校准 / 修八度 / 链 / 拍子轻重）胶水填。 */
    info(ctx: InfoCtx): Pick<PerformerInfo, "gm" | "chunk" | "hitSec" | "singOpt" | "velDb" | "outputGainDb" | "missing">;
    /** 出声前准备：库进录音房 / 元音表。抛错 = 这位出不了声（胶水报出来、这个声部不出声、其余照放）。 */
    prepare(ctx: PrepareCtx): Promise<void>;
    /** notes 模式：音符表 → 这位的轨（chunks 模式没有这一步，时间线自己出块）。 */
    track?(ctx: TrackCtx): TrackResult;
    /** 谱上怎么画（没有 = 普通符头、普通谱）。 */
    notation?(ctx: RoleCtx): Notation;
    /** 按键试听用谁出声（没有 = 这位不能试听）。 */
    audition?(ctx: AuditionCtx): AuditionTarget | null;
    /** 乐器页「怎么演」里这位自己的参数行（通用的——响度 / 音和音之间 / 力度记号 dB 表 / 哼的字——宿主按能力字段摆）。 */
    inspector?(ctx: InspectorCtx): InspectorRow[];
    /** 自己那几行的按钮按到了（data-v）：改成什么；不认识 = null。 */
    onInspector?(v: string, ctx: InspectorCtx): InspectorChange | null;
}
export declare function registerPerformer(p: PerformerPlugin): PerformerPlugin;
/** 按英文名（= 歌里的 engine 字段）找插件；不认识 = null。 */
export declare function performerOf(engine: string | null | undefined): PerformerPlugin | null;
export declare function performerByGuid(guid: string): PerformerPlugin | null;
export declare function performers(): readonly PerformerPlugin[];
/** 地址：`performer:<name>@<version>`（ADR-0004 §2.2）。 */
export declare const addressOf: (p: PerformerPlugin) => string;
