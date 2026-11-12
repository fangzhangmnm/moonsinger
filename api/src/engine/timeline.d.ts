import { type Token, type Song, type PartDef, type PaperSeg, type TempoMap, type Hum } from "../score/song.ts";
import { type RollVariation } from "./roll-variation.ts";
import { rollHitVelocity, type PerfSpec, type VelDb } from "../score/perform.ts";
import { type GrooveStyle } from "../score/groove.ts";
import { type LabScore, type SingLang, type SingChunkMode } from "../score/lab-score.ts";
import { type SfxInfo } from "../gm/sf-key.ts";
import type { SingMark } from "../format/performance.ts";
import type { FxV2 } from "../format/contract.ts";
import type { TrackSpec } from "./studio.ts";
import type { PerformerPlugin } from "../performers/registry.ts";
/** 月读核心 OPT.leadIn（sing-core.mjs）：第一个元音前留的秒数；块的第 0 个采样 = 第一个音的时刻 − 它。 */
export declare const LEAD_IN = 0.5;
/** 唱法核心 finish 的尾巴（秒）：块的声音比最后一个音长这么多。 */
export declare const SUNG_TAIL = 0.6;
/** 从光标放：提前这么多起放，第一个字的辅音（在元音前）不被切掉。 */
export declare const PRE_ROLL = 0.1;
export type Engine = "tsukuyomi" | "vowel-sampler" | "soundfont" | "unknown";
/** 一个声部上场那位的出声参数（主线程从休息室查好递进来；时间线不碰 Extras）。 */
export interface PerformerInfo {
    /** 引擎名（= 插件英文名；诊断 / 记号解读表 perform.ts 用）。 */
    engine: Engine;
    /** 上场那位的插件；null = 还没有人上场（认不出的引擎也算；ADR-0004）。出声方式 / 叠音 / 唱不唱字都问它。 */
    plugin: PerformerPlugin | null;
    spec: PerfSpec & {
        gapSec: number;
        sing: Record<string, SingMark | null>;
    };
    velocity: number;
    transpose: number;
    gm: {
        sha: string;
        presetIndex: number;
        note?: number;
        sfx?: SfxInfo;
    } | null;
    chunk: SingChunkMode;
    /** 拍子轻重：这位跟多少（按乐器类别，src/score/groove.ts followOf）。 */
    follow: (s: GrooveStyle) => number;
    /** 跟着演奏者走的效果链（CandidateV2.chain；刀 4）。 */
    chain?: FxV2[];
    /** 着力点（v0.10.27；鼓 / 音效）：敲这个键时采样开头到「砸下去那一下」几秒——录音房提前这么多开始放，砸在写的那一拍上（反向镲 1.4 s）。
     *  有音高的乐器不给（不挪）。src/gm/percussion.ts；设计账 ai-docs/20261010-shared-staff-percussion-design.md §3。 */
    hitSec?: (key: number) => number;
    /** 滚奏的「变化」（7-N 第三批，试验）：只在这次打开里有效、不进歌（RenderPlan.trial 带进来）；没有 = 均匀。 */
    rollVar?: RollVariation;
    /** 这位自己的唱法参数（小月相：候选 defaults 里的旋钮，乐器页「高级」；2026-10-15）：盖在 TimelineInput.singOpt 上，一起进块的内容键。 */
    singOpt?: Record<string, unknown>;
    /** 按力度敲的乐器：引擎在敲的键上实际的 L（写的音高 × 力度 → dB；perform.ts VelDb，7-N）。准备声音时从库的字节算（录音房载库时），没载好 = 没有（这个声部本来就不出声）。
     *  按音量曲线走力度的不给——用插件报的深度（depthCurve）。 */
    velDb?: VelDb;
}
export interface TimelineInput {
    song: Song;
    /** 放的顺序（编排；本段 = 只这一张）。 */
    order: string[];
    /** 出声的声部（静音 / 独奏已经筛过）。 */
    parts: PartDef[];
    info: (part: PartDef) => PerformerInfo;
    hum: Hum;
    /** 月读核心的哼的参数（main.ts humOpt）；进内容键。 */
    singOpt: Record<string, unknown>;
}
/** 月读要唱的一块（主线程拿去让 worker 唱、按 key 喂给录音房）。 */
export interface ChunkPlan {
    part: string;
    key: string;
    score: LabScore;
    lang: SingLang; /** 给唱法核心的 opt（歌级的 + 这位自己的）；块的键里也有它。 */
    opt: Record<string, unknown>;
    t0: number;
    dur: number; /** 唱的最后一个音结束的秒（不含收尾余音）。 */
    end: number; /** token id → 这句里唱成第几条（按键试听「只唱这个字」用） */
    entryOf: Map<number, number>;
}
export interface PaperSpan {
    paper: PaperSeg;
    tick0: number;
    t0: number;
    t1: number;
}
export interface Timeline {
    tracks: TrackSpec[];
    range: {
        from: number;
        to: number;
    };
    /** 谱的总长（秒；不含月读的提前量 / 尾巴）。 */
    total: number;
    chunks: ChunkPlan[];
    papers: PaperSpan[];
    /** 没法出声的声部（没人上场）：不出声、报出来、人换（不自动替补）。 */
    unplayable: {
        part: string;
        why: string;
    }[];
    /** 这个声部里 id = tokenId 的那个 token 在时间线上的秒（不是音 = 后面第一个音的时刻；不在放的范围里 = null）。 */
    secondsOfToken(partId: string, tokenId: number): number | null;
    /** 第 sec 秒落在哪张纸的第几个 tick（纸自己的 tick，反复已折回去；画播放头用）。 */
    locate(sec: number): {
        paperId: string;
        tick: number;
    } | null;
    /** 谱位置（纸 + 纸内 tick）→ 秒：反复 / 编排里同一处放几遍 = 几个候选，取离 near 最近的；不在播放顺序里 = null。放着的时候换时间线用（播放头按谱位置留在原地）。 */
    secondsAt(paperId: string, tick: number, near: number): number | null;
}
/** 小月相唱的段和每段的语言（2026-10-13；user「打了日文之后想换成中文翻译会说不能打汉字然后报错」→「每一段里面有假名就算日文」「就是句子的单位」
 *  →「小月相不是本来就是默认模式一句一句吃的吗，用同一个深模块」）。唱（buildTimeline）、画灰（main.ts lyricMutes）都走这一个，切分只有 singChunks 一份：
 *  段 = 歌手的「分段唱」（每句 = 休止处切、每张纸、一整首）；一段的字合起来看（score/lang.ts scriptLang）：有假名 = 日（夹着的汉字照旧画灰「写成假名」）、只有汉字 = 中、只有字母 = 英；
 *  没字的段（哼）跟前一段，开头跟后面第一个有字的段；整条没字 = songLangOf（哼法定）。
 *  此前整条声部一种语言（songLangOf）：跨所有纸只要还剩一个假名就整条按日语，中文翻译打到一半每个汉字都灰、一放就「sung syllables … in the score」报错。
 *  （同日 Fable 5.1 先另写了一套切句 + 按语言再切段，跟唱的段不是同一份，Opus 5.5 收回这一个。）
 *  at = 每个 token 下标 → 它所在那段的语言（不在任何段里的 = 没有音的那几个 token，给前一段的）。 */
export interface SungPlan {
    ranges: [number, number][];
    langs: SingLang[];
    at: SingLang[];
}
export declare function sungPlan(tokens: Token[], tempoMap: TempoMap | undefined, bounds: readonly number[], mode: SingChunkMode, hum: Hum): SungPlan;
/** 整条声部只有一种语言时它是哪种（sungPlan 的兜底：整条没写歌词时哼什么；debug 面板的整首唱谱）：歌词里有汉字、没有假名 → 中；有字母、没假名汉字 → 英；其余按日语。 */
export declare function songLangOf(tokens: readonly Token[], hum: Hum): SingLang;
/** 滚奏一下的力度（7-N）：perform.ts rollHitVelocity 给的那个函数。 */
export type RollVel = ReturnType<typeof rollHitVelocity>;
/** 轻量版 / SoundFont 的音符表（秒）：tie 并成一个长音。marks = 修的记号怎么落到这一路上（跳音截短、呼吸处收短一口气）；不给 = 照谱满长。 */
export declare function lightNotes(tokens: Token[], tempoMap: TempoMap, poly?: boolean, marks?: {
    staccatoGate: number;
    breath: boolean;
    gapSec: number;
    arpeggioSec?: number; /** 滚奏每秒几下（按敲的键 / 音高）；没给 = 这位不认滚奏，照一个长音放。 */
    rollHz?: (midi: number) => number; /** 滚奏的「变化」（7-N 第三批，试验）：没有 = 均匀。 */
    rollVar?: RollVariation;
}, velOf?: (index: number, art: readonly string[]) => number, rollVel?: RollVel): {
    midi: number;
    t0: number;
    t1: number;
    vel?: number;
}[];
export declare const HUM_KANA: Record<Hum, string>;
export declare function buildTimeline(inp: TimelineInput): Timeline;
