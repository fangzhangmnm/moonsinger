import { type Token, type TempoMap, type Dyn } from "./song.ts";
import { ROLL_HZ_MIN, ROLL_HZ_MAX } from "../format/performance.ts";
export interface PerfSpec {
    dynamicsDb: Record<Dyn, number>;
    staccatoGate: number;
    accentDb: number;
    marcatoDb?: number;
    /** 记号怎么解读的其余的数（候选 articulation by value；没给 = MARK_DEFAULTS）。 */
    accentSec?: number;
    breathSec?: number;
    breathShare?: number;
    gapShare?: number;
    wedgeStepDb?: number;
    wedgeStepVel?: number;
    sfzDb?: number;
    sfzVel?: number;
    sfzSec?: number;
    fpSec?: number;
    swellDb?: number;
    canSwell?: boolean;
    stressDb?: number;
    stressVel?: number;
    unstressDb?: number;
    unstressVel?: number;
    ghostDb?: number;
    ghostVel?: number;
    /** 有 = 力度记号 / 重音 / 强音走 MIDI 力度（SoundFont 新候选），音量曲线就不再管它们；没有 = 走 dB（月读 / 元音版 / 旧候选）。 */
    dynamicsVel?: Record<Dyn, number> | null;
    accentVel?: number;
    marcatoVel?: number;
    /** 滚奏每秒敲几下（v0.16.64；演奏者自己的，没写 = 按乐器的默认，rollDefaultHz）。 */
    rollHz?: number | null;
}
/** 音量曲线的一段：t0–t1（秒，谱的时钟）这段多少 dB；-Infinity = 静音。 */
export interface GainSeg {
    t0: number;
    t1: number;
    dB: number;
}
/** 一个声部的音量曲线。gateStaccato = 跳音靠收声（月读）。全程 0 dB = null。
 *  groove = 拍子轻重（下标 → 权重，src/score/groove.ts；已乘过幅度和跟多少）：正的 = 按次重音的量在音头加，负的 = 按弱化的量整个音轻下去（写了音头记号的音不在里面）。 */
export declare function gainSegments(tokens: Token[], map: TempoMap | undefined, spec: PerfSpec, bounds?: readonly number[], groove?: ReadonlyMap<number, number>): GainSeg[] | null;
/** 轻量版 / SoundFont 一个音的结束时刻（秒）：跳音截到 staccatoGate；呼吸（只给元音版）= 收短一口气的空当（同唱法核心的 v：至多 0.16 s / 25%）。 */
export declare function noteEnd(t0: number, t1: number, art: readonly string[], o: {
    staccatoGate: number;
    breath: boolean;
    gapSec?: number;
    gapShare?: number;
    breathSec?: number;
    breathShare?: number;
}, slur?: boolean): number;
/** 渐强渐弱的终点：同一张纸里（bounds = 每张纸在这一串里从第几个起；不给 = 整串一张），后面第一个力度记号 / 下一个渐强渐弱 / 纸尾。 */
export declare function hairpinEnd(tokens: Token[], i: number, bounds?: readonly number[]): {
    kind: "dyn" | "hairpin" | "end";
    at: number;
};
/** 每个有时值的 token（音 / 休止）的力度水平：音头 at0、音尾 at1（单位 = 表的单位：MIDI 力度或 dB）。力度记号（查 table）= 状态，从这儿起；
 *  渐强 / 渐弱记号 = 过渡：从它后面第一个音的音头，线性变到同一张纸里下一个力度记号生效的那个音的音头；先遇到另一个渐强渐弱 = 到那儿为止、走一档；
 *  都没有 = 到纸尾、走一档（step，卡在表的最小最大之间；谱上灰字披露）。前面一个力度记号都没有 = def（演奏者的默认 / 旋钮）。
 *  2026-10-08，user「所以<>是一个语义，就是从这一刻开始连续变到下一个强度/速度标记？」「过渡到这张纸的结尾…走一档也行，更合理，需要向用户披露」。 */
export declare function dynLevels(tokens: Token[], map: TempoMap | undefined, table: Record<Dyn, number>, def: number, step: number, bounds?: readonly number[]): Map<number, {
    at0: number;
    at1: number;
}>;
/** 被强后即弱盖掉、不起作用的力度记号（下标）：紧跟着的那个音是 fp（音头按 f、随后落到 p，之后都是 p——不看前面的力度），
 *  而且它也不是渐强渐弱 / 渐到的起点或终点。判法 = 把它换成别的值，除了 fp 那个音以外每个音的力度水平都不变（和出声同一个函数 dynLevels，不另写规则）。
 *  谱上画灰、点开说为什么（纪律「做不到的一律画灰 + 明说」；2026-10-09 user「要不要按纪律把 mf 画灰、说一句？ 要」）。 */
export declare function dynOverridden(tokens: Token[], bounds?: readonly number[]): Set<number>;
/** 一个音的 MIDI 力度（0–1，= 力度 ÷ 127；SoundFont 这一路）。有力度表：前面最近的力度记号查表，没有记号 = 演奏者的默认力度（defaultVel，乐器页的旋钮）；
 *  再加重音 / 强音。没有力度表（旧候选）= 一律 defaultVel（力度记号照旧走 dB）。2026-10-08 user「应该send的就是velocity！」「力度就是velocity」。 */
export declare function noteVelocity(tokens: Token[], index: number, art: readonly string[], spec: PerfSpec, defaultVel: number): number;
/** 一整条的每个音的力度（index → 0–1）：力度记号 + 渐强渐弱（dynLevels，取音头）+ 重音 / 强音 + 拍子轻重（groove，同 gainSegments）。没有力度表 = 一律 defaultVel（拍子轻重走 dB）。 */
export declare function noteVelocities(tokens: Token[], map: TempoMap | undefined, spec: PerfSpec, defaultVel: number, bounds?: readonly number[], groove?: ReadonlyMap<number, number>): Map<number, number>;
/** 谁认哪些记号（2026-10-08 Opus 5.5；user 拍「演奏者不认的记号也变灰，不静默失效，而是向用户披露」）。
 *  这张表必须和上面真做的事一致——跳音：月读 = gainSegments 后半段收声，元音版 / SoundFont = noteEnd 截短；重音、力度：所有引擎走 gainSegments；
 *  呼吸：月读 = 唱法核心换气（lab-score），元音版 / SoundFont = noteEnd 收短（lightMarks）；
 *  保持 / 连线：元音版 / SoundFont = 这个音不留底色的缝（gapSec > 0 才有区别），月读还不认（连断第 3 步）。test/honors.test.ts 守着。
 *  不在表里的引擎（没人上场 / 认不出的）= null：整个声部本来就不出声，不再逐个记号画灰。 */
/** 谁认哪些记号 = 演奏者插件自报（ADR-0004，2026-10-14 起表住在 src/performers/*.ts 的 honors；connected = 本来就连着唱，连线 / 保持对它没意义）。 */
export interface HonorsOf {
    readonly honors: readonly string[];
    readonly connected: boolean;
}
export declare const ALL_MARKS: readonly ["staccato", "accent", "marcato", "sfz", "fp", "tenuto", "breath", "slur", "swellGrow", "swellFade", "stress", "unstress", "ghost", "whisper", "inhale", "arpeggio", "roll"];
export type Mark = (typeof ALL_MARKS)[number];
/** 这位不认的记号（写在谱上照画、画灰，出声不受影响）：引擎没实现的 + 底色不留缝时的连线 / 保持。 */
export declare function ignoredArts(p: HonorsOf | null | undefined, gapSec?: number, canSwell?: boolean): Mark[];
/** 为什么不认（明说用）：引擎没实现 = "engine"；底色不留缝 = "gap"；月读的连线 / 保持 = "sung"——她本来就连着唱，连线 / 保持对她不改变什么，
 *  断句用呼吸（连线和呼吸是同一件事的两头：音和下一个音之间连还是断；2026-10-08 user「连线vs呼吸这两个干的是不是一件事…月读是最需要断句的」）。 */
export declare function whyIgnored(p: HonorsOf | null | undefined, m: Mark): "engine" | "gap" | "sung" | "decay";
/** 元音版 / SoundFont 这一路（lightNotes）怎么落修的记号：跳音截到 staccatoGate、呼吸收短一口气（两种引擎一样；月读不走这条，走唱谱 + 音量曲线）。
 *  main.ts 的出声和 test/honors.test.ts 都从这里取，不各写一份。 */
export declare function lightMarks(spec: {
    staccatoGate: number;
    gapSec?: number;
    gapShare?: number;
    breathSec?: number;
    breathShare?: number;
    arpeggioSec?: number;
}): {
    staccatoGate: number;
    breath: boolean;
    gapSec: number;
    arpeggioSec: number;
    gapShare: number;
    breathSec: number;
    breathShare: number;
};
/** 滚奏默认每秒几下（v0.16.64；演奏者没写 rollHz 时用；好不好听归 user 耳朵，能在乐器页调）：key = 敲的是哪个鼓键（整套鼓 = 写的音、固定敲一件 = 那一件的键），
 *  null = 有音高的乐器（定音鼓 / 弦乐的颤音）。军鼓 20、镲 14、底鼓 12、别的鼓 16、有音高的 14。 */
export declare function rollDefaultHz(key: number | null): number;
export { ROLL_HZ_MIN, ROLL_HZ_MAX };
