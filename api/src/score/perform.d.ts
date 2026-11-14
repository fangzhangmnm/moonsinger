import { type Token, type TempoMap, type Dyn } from "./song.ts";
import { ROLL_HZ_MIN, ROLL_HZ_MAX, type SingMark } from "../format/performance.ts";
/** 交给出声代码的这位的数（第 16 条 16-4 A，统筹 2026-11-12 夜）：每个都必填——读文件的门口补全、新建按模板抄（format/template.ts），出声的代码不带默认、不 import 模板。
 *  按这位的力度路分（插件报的 dynamics；哪一路有哪些键 = format/project.ts ART_KEYS_BY，守卫 test/art-keys-by-path.test.ts）。缺了 = 送进录音房之前明着报错（format/project.ts perfSpecProblems）。 */
export interface PerfCommon {
    staccatoGate: number;
    gapSec: number;
    gapShare: number;
    breathSec: number;
    breathShare: number;
    fpSec: number;
    swellDb: number;
    canSwell: boolean;
    arpeggioSec: number;
    /** 滚奏每秒几下（16-4 F 起只写数）。 */
    rollHz: number;
    /** 小月相：谱上的记号 → 唱法核心的字前记号（别的乐手身上没有 = 空）。 */
    sing: Record<string, SingMark | null>;
}
/** 按音量走力度的（小月相 / 元音版）：力度 = dB 表；重音那一组是 dB。 */
export interface GainSpec extends PerfCommon {
    path: "gain";
    dynamicsDb: Record<Dyn, number>;
    accentDb: number;
    marcatoDb: number;
    accentSec: number;
    sfzDb: number;
    sfzSec: number;
    stressDb: number;
    unstressDb: number;
    ghostDb: number;
}
/** 按力度敲的（SoundFont）：力度 = MIDI 力度表；重音那一组是力度格；没终点的渐强渐弱走 wedgeStepVel。 */
export interface VelSpec extends PerfCommon {
    path: "velocity";
    dynamicsVel: Record<Dyn, number>;
    accentVel: number;
    marcatoVel: number;
    wedgeStepVel: number;
    sfzVel: number;
    stressVel: number;
    unstressVel: number;
    ghostVel: number; /** 弱音踏板踩着期间起的音加多少力度（MIDI 格，负 = 轻；踏板 11-2）。 */
    softVel: number; /** 没写踏板记号时留不留住音：每一段开头延音踏板的状态（踏板 11-3）。 */
    pedal: "down" | "up";
}
export type PerfSpec = GainSpec | VelSpec;
/** 音量曲线的一段：t0–t1（秒，谱的时钟）这段多少 dB；-Infinity = 静音。 */
export interface GainSeg {
    t0: number;
    t1: number;
    dB: number;
}
/** 「这一下力度让它多响」L（dB）：写的音高 × 力度 → dB（施工单 7-N，2026-11-12，统筹选 A）。**dB 和力度互相换只经过这个接口**（守卫：test/roll.test.ts「结构」）。
 *  只有按力度敲的乐器有：引擎在敲的那个键上实际施加的（src/gm/sf2-subset.ts sf2VelocityCurve，深度是音色库自己写的；插件把写的音高换成敲的键；准备声音时从库的字节算）。
 *  按音量走力度的小月相 / 元音版没有这一条：她们的力度就是 dB 表（16-4）。只用差（L(f) − L(p) …），绝对值不管。null = 这个键不出声（声音没载好 / 没有区）= 不换算。 */
export type VelDb = (midi: number, vel: number) => number | null;
/** 没有曲线（声音没载好）：哪个力度都不换算。 */
export declare const NO_CURVE: VelDb;
/** 反查（7-N；统筹定的规矩，写死、确定）：从力度 from 往下找一个力度，让 L 低 D dB——只在不高于 from 的整数力度里找，取 L 最接近目标的；一样近取力度高的那个。
 *  L 不单调的地方（换力度层时）照这个规矩走、不特判。L 没有（不出声）= 原样回 from。 */
export declare function velocityForDb(curve: VelDb, midi: number, from: number, D: number): number;
/** 滚奏的音上，音内起伏能不能靠每一下的力度做出来（这个键上力度从 1 到 127 的 L 差够 D dB）：能 = 起伏在每一下的力度里（rollHitVelocity）、音量曲线不再算；
 *  不能（力度深度 0 这类：力度不改响度）= 起伏照旧走音量曲线。两处问同一个函数，不各说各的。 */
export declare function swellByVelocity(curve: VelDb, midi: number, D: number): boolean;
/** 一个声部的音量曲线。byVelocity = 这位按力度敲（演奏者插件的能力 dynamics: "velocity"）：力度记号 / 渐强渐弱 / 重音都在每个音的力度里（noteVelocities），
 *  这条曲线只剩强后即弱的「压」和音内起伏；否则（小月相 / 元音版）力度水平、重音、渐强渐弱都在这条曲线上。全程 0 dB = null。
 *  渐强渐弱 / 渐到按这位的表的单位线性（16-4，统筹 2026-11-12 夜）：小月相 / 元音版 = 她的 dB 表，在 dB 上线性、没终点走到表里的下一档；
 *  按力度敲的乐器 = 力度表，在力度上线性（curve = 引擎在那个键上实际的 L，7-N；这条曲线上只用它压强后即弱、做不出的音内起伏）。
 *  rolls = 这位认滚奏（7-N）：滚奏的音是靠连着敲撑起来的长音——音内起伏谁都能演（不看 canSwell）；按力度敲的这一路，强后即弱和（做得出来的）音内起伏
 *  已经在每一下的力度里（rollHitVelocity），这里不再压一遍。
 *  groove = 拍子轻重（下标 → 权重，src/score/groove.ts；已乘过幅度和跟多少）：正的 = 按次重音的量在音头加，负的 = 按弱化的量整个音轻下去（写了音头记号的音不在里面）。 */
export declare function gainSegments(tokens: Token[], map: TempoMap | undefined, spec: PerfSpec, bounds?: readonly number[], groove?: ReadonlyMap<number, number>, curve?: VelDb, rolls?: boolean): GainSeg[] | null;
/** 轻量版 / SoundFont 一个音的结束时刻（秒）：跳音截到 staccatoGate；呼吸（只给元音版）= 收短一口气的空当（同唱法核心的 v：至多 0.16 s / 25%）。 */
export declare function noteEnd(t0: number, t1: number, art: readonly string[], o: {
    staccatoGate: number;
    breath: boolean;
    gapSec: number;
    gapShare: number;
    breathSec: number;
    breathShare: number;
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
/** step = 渐强渐弱 / 渐到后面没有终点时「走一档」怎么走：一个数 = 在表的单位上走这么多（按力度敲的乐器，wedgeStepVel）；"table" = 走到表里的下一档（ppp → pp → … → fff，到头不动；
 *  小月相 / 元音版的 dB 表，16-4）。 */
export declare function dynLevels(tokens: Token[], map: TempoMap | undefined, table: Record<Dyn, number>, def: number, step: number | "table", bounds?: readonly number[]): Map<number, {
    at0: number;
    at1: number;
}>;
/** 不起作用的渐强渐弱（下标）：它和终点（同一张纸里后面第一个力度记号 / 渐强渐弱）之间一个音、一个休止都没有——和 dynLevels 里「start 为空 = 不起作用」同一条判法。
 *  常见 = 老歌里存成「渐强渐弱、力度、音」（开头自动补的力度插在了发夹后面；W-70）：不改文件（硬规则 #9），谱上画灰、点开说为什么、人自己把力度拖到前面。 */
export declare function hairpinDead(tokens: Token[], bounds?: readonly number[]): Set<number>;
/** 被强后即弱盖掉、不起作用的力度记号（下标）：紧跟着的那个音是 fp（音头按 f、随后落到 p，之后都是 p——不看前面的力度），
 *  而且它也不是渐强渐弱 / 渐到的起点或终点。判法 = 把它换成别的值，除了 fp 那个音以外每个音的力度水平都不变（和出声同一个函数 dynLevels，不另写规则）。
 *  谱上画灰、点开说为什么（纪律「做不到的一律画灰 + 明说」；2026-10-09 user「要不要按纪律把 mf 画灰、说一句？ 要」）。 */
export declare function dynOverridden(tokens: Token[], bounds?: readonly number[]): Set<number>;
/** 一个音的 MIDI 力度（0–1，= 力度 ÷ 127；按力度敲的演奏者这一路）：前面最近的力度记号查表，没有记号 = 演奏者的默认力度（defaultVel，乐器页的旋钮）；
 *  再加重音 / 强音。9-2 起人人有表（没带 = 标准表），10-08 以前的旧 SoundFont 候选也这样敲。2026-10-08 user「应该send的就是velocity！」「力度就是velocity」。 */
export declare function noteVelocity(tokens: Token[], index: number, art: readonly string[], spec: VelSpec, defaultVel: number): number;
/** 一整条的每个音的力度（index → 0–1）：力度记号 + 渐强渐弱（dynLevels，取音头）+ 重音 / 强音 + 拍子轻重（groove，同 gainSegments）。只给按力度敲的演奏者（调用方按插件的 dynamics 能力分）。 */
export declare function noteVelocities(tokens: Token[], map: TempoMap | undefined, spec: VelSpec, defaultVel: number, bounds?: readonly number[], groove?: ReadonlyMap<number, number>): Map<number, number>;
/** 滚奏一下的力度（7-N，2026-11-12；user「这个滚奏完全没法用啊，比如如何实现我之前手动滚奏的效果？」「没法上音内渐强」）——只给按力度敲的演奏者（timeline.ts 按插件能力分路）。
 *  · 力度水平 = 出声已经在用的那一份 dynLevels：这一下落在哪个 token（连音线连过去的几段各用各的），按它在那一段里的进度在 at0 → at1 之间线性取——
 *    所以「一个滚奏长音 + 渐强渐弱 / 渐到」和手写的一串音逐下相同（插值不改：力度表的数值线性走，同 lvl）。
 *  · 音头那一组：重音 / 强音 / 突强 / 次重音、拍子轻重只算第一下；弱化 / 幽灵音每一下都算（看这一段自己的 token）；强后即弱 = 第一下按 f、后面按 p。
 *  · 音内起伏（< > <>）：形状照旧（写的力度是最高点），fr = 这一下在整个滚奏音里的进度；低 D dB 按这件乐器在这个键上实际的 L 反查力度（velocityForDb）；
 *    力度做不出来的（swellByVelocity 为假）这里不动、音量曲线做。
 *  返回 0–1（同 noteVel）。 */
export declare function rollHitVelocity(tokens: Token[], map: TempoMap | undefined, spec: VelSpec, defaultVel: number, bounds?: readonly number[], groove?: ReadonlyMap<number, number>, curve?: VelDb): (hit: {
    index: number;
    t: number;
    seg: {
        t0: number;
        t1: number;
    };
    first: number;
    isFirst: boolean;
    fr: number;
}) => number;
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
export declare function lightMarks(spec: PerfCommon): {
    staccatoGate: number;
    breath: boolean;
    gapSec: number;
    arpeggioSec: number;
    gapShare: number;
    breathSec: number;
    breathShare: number;
};
/** 滚奏每秒几下的出厂值（鼓 12 / 有音高的 14）在 format/template.ts：每位乐手身上只写数（16-4 F），出声只读这一个数。 */
export { ROLL_HZ_MIN, ROLL_HZ_MAX };
