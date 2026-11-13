import type { Dynamic } from "./contract.ts";
import { type SingMark } from "./performance.ts";
type Json = Record<string, unknown>;
export declare const TEMPLATE: {
    /** 谱的扩展（16-4 A3）：look = 新建的歌写进去的歌级显示设置（song.ts NEW_SONG_LOOK）；head = 新歌 / 新纸 / 新声部的谱头三样，调号 C 大调、拍号 4/4、♩=90
     *  （song.ts NEW_SONG_HEAD；16-6 并进来，统筹「v0.17.18 收」①②）。都是同一个引用，不另抄。 */
    score: {
        look: Readonly<Pick<import("../score/song.ts").Song, import("../score/song.ts").SongLookKey>>;
        head: Readonly<{
            fifths: number;
            minor: boolean;
            beats: number;
            beatType: number;
            bpm: number;
        }>;
    };
    /** 录音房（16-4 A2，v0.17.17）：新建的轨 / 混音轨 / 总轨 / 每种效果刚插上一格时的样子。数从原处搬来、一个没改（project.ts micTrack / emptyStudio、
     *  ui/plugins.ts freshParams、混音台加发送时的 −12）；效果参数表（engine/fx.ts）只剩量纲、范围、公式。读老文件时门口缺的也按这里补（每种效果按「轨上」那一份）。 */
    studio: {
        /** 一条轨（歌手的麦克风轨 / 混音轨）：推子 dB、声像 −1…1、效果链、推子后的发送、出到哪、整条旁通（混音轨才有开关；歌手轨照样写 false）。名字新建时现起。 */
        track: {
            gainDb: number;
            pan: number;
            chain: unknown[];
            sends: unknown[];
            to: string;
            bypass: boolean;
        };
        /** 新加一条发送的量（dB，推子后）。 */
        sendGainDb: number;
        /** 总轨：增益 dB、限幅开关、效果链、限幅器的四个数（16-4 C：天花板 = 满幅的几分之几（线性）；起 / 放 / 前瞻 = 毫秒）。 */
        master: {
            gainDb: number;
            limiter: boolean;
            chain: unknown[];
            limiterParams: {
                ceiling: number;
                attackMs: number;
                releaseMs: number;
                lookaheadMs: number;
            };
        };
        /** 每种效果新插一格的参数（歌手轨 / 总轨上 = 一键面板的「中间值」：插上就有一点效果，一眼能听出它在干什么）。键的先后 = 存出来的先后。 */
        fx: Record<string, Record<string, number>>;
        /** 插在混音轨（发送的返回轨）上的混响 / 延迟 / 合唱：全湿（混音的老规矩：原声留在歌手自己那条路上，发多少 = 加多少效果）。别的种类和轨上一样。 */
        fxOnBus: Record<string, Record<string, number>>;
    };
    lounge: {
        /** 力度记号 → MIDI 力度（按力度敲的乐手；MuseScore 的经典值，ppp 16 / fff 126 = v0.9.23）。 */
        dynamicsVel: Record<Dynamic, number>;
        /** 力度记号 → dB（按音量走的乐手，16-4）：= 9-4 那条公式（深度 800）在上面那张力度表上算出来、取两位小数；从此是数据。 */
        dynamicsDb: Record<Dynamic, number>;
        /** 记号怎么解读的数，按力度路（每一路只有这一路的出声代码读的键；守卫 test/art-keys-by-path.test.ts）。 */
        articulation: {
            gain: {
                rollHz: 14;
                accentDb: number;
                marcatoDb: number;
                accentSec: number;
                sfzDb: number;
                sfzSec: number;
                stressDb: number;
                unstressDb: number;
                ghostDb: number;
                staccatoGate: number;
                gapSec: number;
                gapShare: number;
                breathSec: number;
                breathShare: number;
                fpSec: number;
                swellDb: number;
                canSwell: boolean;
                arpeggioSec: number;
            };
            velocity: {
                rollHz: 14;
                accentVel: number;
                marcatoVel: number;
                wedgeStepVel: number;
                sfzVel: number;
                stressVel: number;
                unstressVel: number;
                ghostVel: number;
                staccatoGate: number;
                gapSec: number;
                gapShare: number;
                breathSec: number;
                breathShare: number;
                fpSec: number;
                swellDb: number;
                canSwell: boolean;
                arpeggioSec: number;
            };
        };
        rollHz: {
            readonly drum: 12;
            readonly pitched: 14;
        };
        /** 乐手「响度」（calibrationDb，dB）：0 = 这个库 / 引擎的满音量。库和库要对齐时由那个库的插件报一个非零的数（registry.ts defaultCalibrationDb）。 */
        calibrationDb: number;
        /** 小月相：谱上的记号 → 唱法核心认的字前记号。 */
        sing: Record<"staccato" | "accent" | "marcato" | "breath" | "sfz" | "fp", SingMark>;
        /** 小月相唱法核心的旋钮（物理意义见 ai-docs/20261013-dango-c10-pop-probe.md §6）。 */
        tsukuyomiDefaults: Record<string, number>;
        /** 小月相：唱法核心原始输出进她那条轨之前乘多少（dB；16-4 B）。= 20·log10(0.89 ÷ 0.42) 取两位小数：刀 0 量的原始峰值约 0.42（うさぎ 0.419 / 団子 0.412）→ 抬到 0.89
         *  （按句出块之前整首归一化的目标）。原来是插件里的常数 chunkGain = 0.89 / 0.42。这是这个引擎自己的满音量；乐手「响度」（calibrationDb）在它之上另算。 */
        tsukuyomiOutputGainDb: number;
        /** SoundFont 没写力度记号的音按多大力度（0–1 = MIDI ÷ 127）：= 力度表的 mf ÷ 127（新建时一直写的就是它；三处两份默认并成这一个）。 */
        soundfontDefaults: Record<string, number>;
    };
};
/** 测试和界面常用的几样，指着上面同一份（不是另一份数）。 */
export declare const DYNAMICS_VEL: Record<Dynamic, number>;
export declare const DYNAMICS_DB: Record<Dynamic, number>;
export declare const CALIBRATION_DEFAULT_DB: number;
export declare const SING_MARKS: Record<"fp" | "staccato" | "accent" | "marcato" | "sfz" | "breath", SingMark>;
export declare const TSUKUYOMI_DEFAULTS: Record<string, number>;
export declare const ART_TEMPLATE: {
    gain: {
        rollHz: 14;
        accentDb: number;
        marcatoDb: number;
        accentSec: number;
        sfzDb: number;
        sfzSec: number;
        stressDb: number;
        unstressDb: number;
        ghostDb: number;
        staccatoGate: number;
        gapSec: number;
        gapShare: number;
        breathSec: number;
        breathShare: number;
        fpSec: number;
        swellDb: number;
        canSwell: boolean;
        arpeggioSec: number;
    };
    velocity: {
        rollHz: 14;
        accentVel: number;
        marcatoVel: number;
        wedgeStepVel: number;
        sfzVel: number;
        stressVel: number;
        unstressVel: number;
        ghostVel: number;
        staccatoGate: number;
        gapSec: number;
        gapShare: number;
        breathSec: number;
        breathShare: number;
        fpSec: number;
        swellDb: number;
        canSwell: boolean;
        arpeggioSec: number;
    };
};
/** 三种出厂乐手，每种一整位候选的样子（新建 = 按值抄这一份；门口 = 老歌里这位缺的按这一份补）。SoundFont 那一种不带音色来源（上场那一刻按选中的那一件写）；
 *  不固定敲一个键 = 没有 note（写文件时写 null）。键的先后 = 存出来的先后。 */
export declare function templateCandidate(engine: "tsukuyomi" | "vowel-sampler" | "soundfont"): Json;
/** 新插一格的参数（按值抄一份）：onBus = 插在混音轨上（混响 / 延迟 / 合唱 = 全湿那一份）。不认识的种类 = null。 */
export declare function templateFxParams(kind: string, onBus?: boolean): Record<string, number> | null;
export {};
