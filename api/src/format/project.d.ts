import { type Song } from "../score/song.ts";
import { FORMAT, type Dynamic, type FxV2, type Hum, type InstrumentV2, type Credit, type Sf2Source } from "./contract.ts";
import { FINAL_MP3_ENTRY, type FinalRecord } from "./final.ts";
export { FINAL_MP3_ENTRY, type FinalRecord };
import { type SingMark } from "./performance.ts";
export { FORMAT };
export type { Hum, InstrumentV2 };
/** 参考窗（v0.8，2026-10-08 深夜 Opus 5.5；对齐稿 ai-docs/20261008-reference-window-alignment.md）：整个目录归 @internal/reference-window
 *  （manifest.json 自带版本号和迁移 + 每张卡的字节）；这里零知识、原样进出。不放 extras（extras 进撤销，参考窗不进）。 */
export declare const REFERENCES_DIR = ".moonsinger/references/";
type Json = Record<string, unknown>;
/** 文件里我们读进来、这一版不改动的部分（原样写回用）。新建的歌 = 空。 */
export interface Extras {
    scoreExt?: Json;
    lounge: Record<string, Json>;
    studio?: Json;
    manifest?: Json;
    sounds: Record<string, Uint8Array>;
    unknown: Record<string, Uint8Array>;
    rootfiles: {
        path: string;
        mediaType: string;
    }[];
    /** 封面 = `Thumbnails/thumbnail.png` 这个 entry 本身（家族既定做法 WXHW ADR-0012 = ORA 同款路径；PNG ≤ 256²、≤ 70 KB；
     *  **永远最后一个 entry、不压缩**——书架靠 store getPeek 尾读一次命中，不是最后就会被别的东西挤出尾窗）。null = 没有封面（书架画自动封面）。 */
    thumbnail: Uint8Array | null;
}
export declare const emptyExtras: () => Extras;
export declare const THUMBNAIL_ENTRY = "Thumbnails/thumbnail.png";
/** 换封面（null = 去掉）。 */
export declare const withThumbnail: (extras: Extras, png: Uint8Array | null) => Extras;
/** 新歌默认的两个候选：月读完整 / 月读元音版（轻量）。
 *  显示名 2026-10-13 起叫「小月相」/「小月相（元音）」（W-28，家规「共享叫法」）；旧歌里按值存着的「月读」原样留着——打开时迁移还是显示时换，等 user 定。 */
export declare const CANDIDATE_ID: {
    readonly full: "c1";
    readonly light: "c2";
};
export type Engine = InstrumentV2["engine"];
export interface SaveArgs {
    song: Song;
    extras: Extras;
    app: string;
    date: string;
    view?: Record<string, unknown> | null;
    references?: Record<string, Uint8Array>;
    /** 渲染核心的版本 + 哈希（src/core/version.ts；每次保存都记——user 2026-10-13「核心的版本号和hash反而是每次保存的时候都要记的。ui壳无所谓」）。不给 = 不写（测试 / 旧调用方）。 */
    core?: {
        version: string;
        hash: string;
    };
}
/** 歌 → .mxl 的字节。 */
export declare function saveMxl(a: SaveArgs): Uint8Array;
/** 歌 → .mxl 的字节 + 这份字节里出声内容的指纹（同一趟算出来的；存盘的编码 worker 顺手带回，宿主拿它认「设备上记着的那份声音还是不是这个文件的」）。 */
export declare function saveMxlWithFingerprint(a: SaveArgs): {
    bytes: Uint8Array;
    fingerprint: string;
};
/** 出声内容的指纹（渲染缓存的钥匙：内容没变 = 上次渲好的那份还算数）。和 saveMxl 同一条管线、同一份字符串。 */
export declare function contentFingerprintOf(a: SaveArgs): string;
/** 写出去之前，把 token 的编号重编成「纸序 × 声部序 × 下标，从 1 起」——和读进来时 songFromReads 编的是同一套（2026-11-10，Claude Fable 5.2）。
 *  文件里的编号只在那一份文件里有用（unwritten / swells 两张表、跨小节拆开的段并回去），读的时候本来就整首重编；所以这里重编不改任何意思，旧版本照样读。
 *  为的是「写出来的谱只看内容」：内存里的编号是按这次打开里先写谁后写谁发的（新歌第一个音 n4、强制补的力度 n5；重开一次就变成力度 4、音 5），
 *  不重编的话，同样的内容存两次、中间重开过 = 两份不一样的谱文本 = 两个指纹——设备上记着的渲好的声音（src/app/render-cache.ts）就认不出「内容没变」。
 *  只动写出去的这一份；内存里的歌不动（撤销栈、光标、唱好的块的键都按内存里的编号）。不在 song.parts 里的 track（不该有）原样带着。 */
export declare function canonicalIds(song: Song): Song;
/** stem = 打开的文件叫什么（去掉扩展名；文件名和歌名分开：歌名在 song.title，可不填）。 */
export interface Opened {
    song: Song;
    stem: string;
    extras: Extras;
    ours: boolean;
    notices: string[];
    view: Record<string, unknown> | null;
    references: Record<string, Uint8Array>; /** 「更新版本写的（minor）」那一句（最多一条）：宿主 info 一次，不是报错、不拦。 */
    advice: string[];
}
/** 这个角色是什么（MusicXML 官方 <instrument-sound> id；user「角色名可以和xml的乐器 功能语义对齐，用最官方的正规的」）。还没有角色快照 = 新角色的。 */
export declare function roleSound(extras: Extras, role: string): string;
/** 给角色起名字 / 清掉名字（12-4：名字和乐器分开）。空串 = 回到没起（谱上写乐器的叫法）；起的名字原样存、什么语言都不翻。还没有角色快照 = 先按默认的建一份。 */
export declare function withRoleName(extras: Extras, role: string, name: string, hum: Hum): Extras;
/** 角色改成某个乐器概念（乐器目录里挑了 / 点回旧候选）：官方 id + 概念 by value（含谱上的叫法、简写）。**名字不动**（12-4）：没起的照旧没起 = 谱上跟着换成新乐器的叫法；
 *  用户起了名字的照旧是那个名字（名字是用户的）。c.name 是候选里记的当初上场叫法（castAs，格式里有），这里不用。 */
export declare function withRoleConcept(extras: Extras, role: string, c: {
    name: string;
    sound: string | null;
    concept: NonNullable<import("./contract.ts").LoungeRoleV2["concept"]>;
}, hum: Hum): Extras;
/** 给这个角色里的一位候选记下「当初作为哪件乐器上场」（CandidateV2.castAs；点回它时 withRoleConcept 套回去）。没这位 = 原样返回。 */
export declare function withCastAs(extras: Extras, role: string, candId: string, castAs: NonNullable<import("./contract.ts").CandidateV2["castAs"]>, hum: Hum): Extras;
/** 新声部要的角色 id（休息室里没用过的「r<n>」）。 */
export declare function newRoleId(extras: Extras, song: Song): string;
/** 新声部要的麦克风 id。 */
export type StudioTrack = {
    id: string;
    kind: "mic" | "bus";
    name: string;
    gainDb: number;
    pan: number;
    chain: FxV2[];
    sends: {
        to: string;
        gainDb: number;
    }[];
    to: string;
    bypass: boolean;
};
/** 录音房里的轨（原样读出；没有录音房 = 空）。 */
export declare function studioTracks(extras: Extras): StudioTrack[];
export declare function studioTrack(extras: Extras, id: string): StudioTrack | null;
/** 改一条轨（没有录音房 / 没有这条 = 先建一条 mic 轨）：增益 / 声像 / 名字 / 效果链 / 发送 / 去哪。 */
export declare function withTrack(extras: Extras, id: string, patch: Partial<Omit<StudioTrack, "id" | "kind">> & {
    kind?: "mic" | "bus";
}): Extras;
/** 删一条总线（mic 轨跟着声部走，这里不删）；指着它的发送 / 去向回总轨。 */
export declare function withoutBus(extras: Extras, id: string): Extras;
/** 混音轨往前 / 往后挪一位（只在混音轨之间换；歌手的麦克风轨不动，它们的顺序跟谱走）。到头 = 原样。v0.10.10，user「混音轨之间还可以排序」。 */
export declare function moveBus(extras: Extras, id: string, dir: -1 | 1): Extras;
export declare function newBusId(extras: Extras): string;
/** 总轨（studio.json master；没写 = 0 dB + 限幅开 + 空链）。 */
export declare function activeMaster(extras: Extras): {
    gainDb: number;
    limiter: boolean;
    chain: FxV2[];
};
export declare function withMaster(extras: Extras, patch: {
    gainDb?: number;
    limiter?: boolean;
    chain?: FxV2[];
}): Extras;
/** 跟着演奏者走的效果链（CandidateV2.chain；没有 = 空）。 */
export declare function activeChain(extras: Extras, role: string): FxV2[];
export declare function newMicId(extras: Extras, song: Song): string;
/** 给新声部在休息室里建一份默认角色（月读两个候选；名字可给）。 */
export declare function withNewRole(extras: Extras, role: string, hum: Hum, name?: string, sound?: string): Extras;
/** 新建的歌：每个声部按模板把乐手明写进休息室（第 16 条，2026-11-12：乐手读不到 = 没人上场，所以新歌在创建那一刻就写下来，不靠读的一侧退路）。 */
export declare function templateExtras(song: Song): Extras;
/** 删一个声部之后：它的角色从休息室拿掉（嵌的音源没别人引用 = 一起丢）。 */
export declare function withoutRole(extras: Extras, role: string): Extras;
/** 改一个麦克风的增益 / 声像（没有录音房 / 没有这个麦克风 = 先建）。 */
export declare function withMic(extras: Extras, micId: string, patch: {
    gainDb?: number;
    pan?: number;
}): Extras;
export interface CandidateInfo {
    id: string;
    name: string;
    engine: Engine;
}
/** 角色的候选们（顺序 = 文件里的顺序）。没有角色快照 = 没有（第 16 条：乐手读不到 ≠ 小月相）。 */
export declare function candidates(extras: Extras, role: string): CandidateInfo[];
/** 这个角色里 id 那位候选（整份 json；没有 = null）。 */
export declare function candidateJson(extras: Extras, role: string, id: string): Json | null;
/** 上场的候选的 id（没有角色快照 = "" = 没人上场）。 */
export declare function activeId(extras: Extras, role: string): string;
/** 现在上场的候选（整份 json）。 */
export declare function activeCandidate(extras: Extras, role: string): Json | null;
/** 现在上场的候选（乐器）叫什么——只给角色卡里看，不上谱。 */
export declare function activeCandidateName(extras: Extras, role: string): string | null;
/** 上场的那位的乐器（按引擎分）；没有角色快照 / 读不懂 = null = 没人上场（第 16 条：不再当成小月相；新建的歌、新加的声部在创建时就写了乐手，见 templateExtras / withNewRole）。 */
export declare function activeInstrument(extras: Extras, role: string): InstrumentV2 | null;
/** 这一位乐手的哼的字（没写歌词的音唱什么）：只存在乐手身上、每位各自的（第 16 条 16-3，2026-11-12；user「哼的字存歌手，是没有输入的默认」）。
 *  上场那位不是小月相 / 元音版、或者没人上场 = "n"（用不上）。原来是「整首歌一个」：读的时候取第一位会唱的、存的时候抄给每一位。 */
export declare function activeHum(extras: Extras, role: string): Hum;
/** 改上场那位的哼的字（不是会唱的 = 不动）。 */
export declare function withHum(extras: Extras, role: string, hum: Hum): Extras;
/** 换上场的候选（人选的；不自动）。 */
export declare function withActive(extras: Extras, role: string, id: string, hum: Hum): Extras;
/** R1：设置指纹 = 去掉 id / castAs / asCast 三个键之后的 sha256 前 16 位。名字、出声的那一件、响度、移调、每一张表、效果链、署名，连同以后才有的不认识的键，全在里面。 */
export declare function settingsPrint(c: Json): string;
/** 这一位换上台以后没调过？内置两位 = 和出厂那一位一样；别的 = asCast 还等于现在的指纹（没有 asCast = 旧歌 / 旧版 app 造的 = 当作调过）。没有这一位 = false。 */
export declare function isUntouched(extras: Extras, role: string, id: string): boolean;
/** R2 + R3：换上台。下台的那位没调过、又不是内置的 = 同一次提交里删掉（连同没别人引用的嵌入字节）；fresh = 新造的这位记下 asCast（内置的不记）。
 *  prev = 换之前台上的是谁（新造候选的函数会顺手把台上换掉，所以由调用方在造之前记下）；默认 = 现在台上的。三条换上台的路（目录选 / 点预设 / 自己的 .sf2）都走这里。 */
export declare function withSwap(extras: Extras, role: string, nextActive: string, hum: Hum, o?: {
    prev?: string;
    fresh?: boolean;
    before?: Extras;
}): Extras;
/** R5 / R6：把 fromRole 里的 fromId 拷一份到 toRole、换上台。新 id、不带 asCast（拷来的是调过的，留着）、castAs 一起拷（声部的名字 / 乐器概念跟着换）；
 *  嵌入的字节按 sha256 本来就共用一份。原来那一位一个字节不动；永远是新加一位，不覆盖已有的任何候选。同一个声部里 = 「复制一份」：名字后面加「 2」，原来那位留着。 */
export declare function withCandidateCopy(extras: Extras, fromRole: string, fromId: string, toRole: string, hum: Hum): Extras;
/** R4：目录顶上「这首歌的乐器预设」一行列谁。本声部：台上那位 + 所有调过的；别的声部：调过的，指纹和已经列出来的一样的不再列；内置两位没调过 = 不列（它们在「常用」一行）。
 *  parts = 歌里声部的顺序（角色 id + 谱上叫什么）。 */
export interface PresetEntry {
    role: string;
    id: string;
    name: string;
    on: boolean;
    here: boolean;
    from: string;
    removable: boolean;
}
export declare function songPresets(extras: Extras, parts: {
    role: string;
    label: string;
}[], role: string, hum: Hum): PresetEntry[];
export interface GmCandidate {
    id: string;
    name: string;
    bank: number;
    program: number;
    note?: number;
    sfx?: {
        key: number;
        midi?: number;
        centsPerKey?: number;
        align?: boolean;
    };
    path: string | null;
    bytes: Uint8Array | null;
    origin: Sf2Source["origin"];
    subsetSha256: string;
}
/** 角色的 SoundFont 候选们。 */
export declare function gmCandidates(extras: Extras, role: string): GmCandidate[];
/** 现在上场的 SoundFont 候选（上场的不是它 = null）。 */
export declare function activeGm(extras: Extras, role: string): GmCandidate | null;
export interface Sf2CandidateArgs {
    name: string;
    bank: number;
    program: number;
    note?: number;
    sfx?: {
        key: number;
        midi?: number;
        centsPerKey?: number;
        align?: boolean;
    };
    subset: Uint8Array;
    sha256: string;
    embed?: boolean;
    origin: Sf2Source["origin"];
    credit: Credit;
    calibrationDb: number;
    gapSec?: number;
    canSwell?: boolean;
}
/** 加一个 SoundFont 候选并让它上场。同一份字节（同 sha256）只存一份。 */
export declare function withSf2Candidate(extras: Extras, role: string, c: Sf2CandidateArgs, hum: Hum): Extras;
/** 内存里的 GC：丢掉没人引用的嵌入块（删候选 / 换嵌入块之后立刻做，不等存档——user「需要严格的 GC」）。 */
export declare function pruneSounds(extras: Extras): Extras;
/** 删一个候选（人删的；上场的那个不许删——先换人）。它的嵌入块没别人引用 = 一起丢。 */
export declare function withoutCandidate(extras: Extras, role: string, id: string): Extras;
export interface SoundUse {
    subsetSha256: string;
    packed: boolean;
    bytes: number;
    origin: Sf2Source["origin"];
    names: string[];
}
/** 歌里所有 SoundFont 候选用到的声音（台上 + 候补都算；同一份子集只算一次）。packed = 字节在歌里。 */
export declare function soundUses(extras: Extras): SoundUse[];
/** 打包：没在歌里的 SoundFont 候选（弱引用，或强引用但文件里少了那块），have(子集 sha256) 给得出字节的 → 嵌进歌。
 *  调用方保证 have 给的字节核过 sha256。返回打包了哪些、哪些拿不到（拿不到的保持原样，不静默：调用方报出来）。 */
export declare function withPacked(extras: Extras, have: (subsetSha256: string) => Uint8Array | undefined): {
    extras: Extras;
    packed: string[];
    missing: string[];
};
/** 解包：嵌着的 SoundFont 候选改弱引用（embedded = null），字节从歌里拿掉；only = 只解这些子集（调用方先确认字节留得住，留不住的别解——解了就找不回来）。
 *  返回拿掉的字节（子集 sha256 → 字节）：调用方留到设备上，这台设备照样能响（Blender 的 unpack = 写到旁边的文件，这里 = 设备的音源缓存）。 */
export declare function withUnpacked(extras: Extras, only?: (subsetSha256: string) => boolean): {
    extras: Extras;
    removed: Map<string, Uint8Array>;
};
/** 上场那位的力度表（力度记号 → 力度；9-2 起全体一张，没带 = 标准表 DYNAMICS_VEL）/ 跳音吃掉多少 / 重音加多少。没有角色快照或字段缺 = app 内置那份（ARTICULATION…）。 */
export declare function activePerfSpec(extras: Extras, role: string): {
    staccatoGate: number;
    accentDb: number;
    gapSec: number;
    marcatoDb: number;
    dynamicsVel: Record<Dynamic, number>;
    dynamicsDb: Record<Dynamic, number>;
    accentVel: number;
    marcatoVel: number;
    stressDb: number;
    stressVel: number;
    unstressDb: number;
    unstressVel: number;
    ghostDb: number;
    ghostVel: number;
    accentSec: number;
    breathSec: number;
    breathShare: number;
    gapShare: number;
    wedgeStepVel: number;
    sfzDb: number;
    sfzVel: number;
    sfzSec: number;
    fpSec: number;
    swellDb: number;
    canSwell: boolean;
    sing: Record<string, SingMark | null>;
    rollHz: number | null;
};
/** 连断底色能调到多大（秒）。 */
export declare const GAP_MAX_SEC = 0.2;
/** 改上场那位的滚奏密度（乐器页；每秒几下，ROLL_HZ_MIN … ROLL_HZ_MAX；null = 去掉、回到乐器默认）。没人上场 = 原样。v0.16.64 */
export declare function withRollHz(extras: Extras, role: string, hz: number | null, hum: Hum): Extras;
/** 音内起伏多深能调到哪（dB；乐器页一档 3 dB；7-N，2026-11-12）。默认 = MARK_DEFAULTS.swellDb（6）。 */
export declare const SWELL_DB_MIN = 3, SWELL_DB_MAX = 24;
/** 改上场那位的音内起伏多深（articulation.swellDb，dB；字段本来就有、格式不动；null = 回到默认 6）。没人上场 = 原样。 */
export declare function withSwellDb(extras: Extras, role: string, dB: number | null, hum: Hum): Extras;
/** 改上场那位的连断底色（乐器页；秒，0 … GAP_MAX_SEC，记到毫秒）。没人上场 = 原样。 */
export declare function withGapSec(extras: Extras, role: string, sec: number, hum: Hum): Extras;
/** 上场那位的校准（dB；没写 = 现行的默认 CALIBRATION_DEFAULT_DB，和新建时写进去的同一个数，第 14 条）。渲染时乘在这个声部上，和录音室推子相加（推子 = 混音决定，校准 = 演奏者自己的响度）。 */
export declare function activeCalibrationDb(extras: Extras, role: string): number;
/** 上场那位的力度（0–1，= MIDI 力度 ÷ 127）；没写 = SOUNDFONT_DEFAULTS.velocity。 */
export declare function activeVelocity(extras: Extras, role: string): number;
/** 改上场那位的力度（记到 MIDI 整数格：k / 127）。没人上场 = 原样。 */
export declare function withVelocity(extras: Extras, role: string, v: number, hum: Hum): Extras;
/** 改上场那位的校准。 */
export declare function withCalibration(extras: Extras, role: string, dB: number, hum: Hum): Extras;
/** 固定原速开 / 关：开 = 每个音都敲原速键（note = sfx.key）；关 = 按写的音敲（可再开音高对齐）。不是音效 = 原样。 */
export declare function withSfxFixed(extras: Extras, role: string, on: boolean, hum: Hum): Extras;
/** 月读分段唱的粒度（上场那位；没写 = 每句）。user「开关是歌手的属性，可以有不同的粒度」。 */
export declare function activeSingChunk(extras: Extras, role: string): "phrase" | "sheet" | "whole";
/** 小月相唱法核心的旋钮（存在候选 defaults 里，by value；没写 = TSUKUYOMI_DEFAULTS；2026-10-15 user「齐平和其他的也都放在高级设置里面可以持久化」）。 */
export declare const SING_CORE_KEYS: readonly ["level", "levelContinuous", "levelMaxDb", "cleanMax", "breath"];
export type SingCoreKey = (typeof SING_CORE_KEYS)[number];
export declare function activeSingCore(extras: Extras, role: string): Record<SingCoreKey, number>;
export declare function withSingCore(extras: Extras, role: string, key: SingCoreKey, value: number, hum: Hum): Extras;
export declare function withSingChunk(extras: Extras, role: string, v: "phrase" | "sheet" | "whole", hum: Hum): Extras;
/** 音高对齐开 / 关（只在没固定原速、原速时听得出音高时有意义）。 */
export declare function withSfxAlign(extras: Extras, role: string, on: boolean, hum: Hum): Extras;
/** 上场那位的移调（半音；没写 = 0）。 */
export declare function activeTranspose(extras: Extras, role: string): number;
/** 改上场那位的移调（夹在 ±48；0 = 去掉字段，存档不多出 0）。 */
export declare function withTranspose(extras: Extras, role: string, semis: number, hum: Hum): Extras;
/** 字节 → 歌。认 .mxl（zip）和不压缩的 .musicxml / .xml。读不了 = 抛错（错误文字直接给人看）。 */
export declare function openBytes(name: string, bytes: Uint8Array): Opened;
