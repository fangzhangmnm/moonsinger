// template.ts —— 新文件的模板（第 16 条 16-4 A，统筹 2026-11-12 夜「v0.17.13 收」「v0.17.15 收」）：和歌同样形状的数据，过同一份契约的类型。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。数从原来散在各处的默认表搬来，一个都没改（format/performance.ts 的几张表、乐手新建时写的那几样）；
//   原处只留量纲、范围、公式的说明。
// 用它的只有三处（统筹第 3 条）：新建（按值抄）、读文件的门口（缺的补；project.ts completeCandidate）、界面上的「默认」钮。
//   出声的代码（src/score、src/engine、src/core）不许 import 这个文件——它们拿到的永远是写全的（守卫 test/template.test.ts）。
// 分三块：休息室（三种出厂乐手）/ 录音房（轨、混音轨、总轨、每种效果）/ 谱的扩展（歌级的显示设置）。这一版先有休息室那一块；另两块下一步搬进来。
// 「从目录抄」的几样不在这里放数：SoundFont 的缝（gapSec）、能不能音内渐强（canSwell）、着力点（hitSecByKey）——新上场那一刻从音乐目录那一行按值抄；
//   这里的 gapSec 0 / canSwell true 只是门口给「老歌里没写」的那一位补的（和改之前一样）。
import { _t } from "../i18n/index.ts";
import type { Dynamic } from "./contract.ts";
import { TSUKUYOMI_CREDIT, TSUKUYOMI_SPEC, VOWEL_SAMPLER_SPEC, TSUKUYOMI_MODEL, type SingMark } from "./performance.ts";

type Json = Record<string, unknown>;
/** 两路都有的演奏法（键 = project.ts ART_KEYS_BY 的交集）。 */
const ART_BOTH = { staccatoGate: 0.5, gapSec: 0, gapShare: 0.25, breathSec: 0.16, breathShare: 0.25, fpSec: 0.2, swellDb: 6, canSwell: true, arpeggioSec: 0.035 };
/** 滚奏每秒几下：鼓 12、有音高的 14（原来是 perform.ts 里的 rollDefaultHz；16-4 F：从此每位乐手身上只写数，新上场 / 门口补都按这位是不是鼓抄这里的）。 */
const ROLL_HZ = { drum: 12, pitched: 14 } as const;

export const TEMPLATE = {
  lounge: {
    /** 力度记号 → MIDI 力度（按力度敲的乐手；MuseScore 的经典值，ppp 16 / fff 126 = v0.9.23）。 */
    dynamicsVel: { ppp: 16, pp: 33, p: 49, mp: 64, mf: 80, f: 96, ff: 112, fff: 126 } as Record<Dynamic, number>,
    /** 力度记号 → dB（按音量走的乐手，16-4）：= 9-4 那条公式（深度 800）在上面那张力度表上算出来、取两位小数；从此是数据。 */
    dynamicsDb: { ppp: -29.99, pp: -19.51, p: -13.79, mp: -9.92, mf: -6.69, f: -4.05, ff: -1.82, fff: -0.11 } as Record<Dynamic, number>,
    /** 记号怎么解读的数，按力度路（每一路只有这一路的出声代码读的键；守卫 test/art-keys-by-path.test.ts）。 */
    articulation: {
      gain: { ...ART_BOTH, rollHz: ROLL_HZ.pitched, accentDb: 4, marcatoDb: 7, accentSec: 0.12, sfzDb: 9, sfzSec: 0.2, stressDb: 2, unstressDb: -3, ghostDb: -9 },
      velocity: { ...ART_BOTH, rollHz: ROLL_HZ.pitched, accentVel: 16, marcatoVel: 28, wedgeStepVel: 16, sfzVel: 32, stressVel: 8, unstressVel: -10, ghostVel: -28 },
    },
    rollHz: ROLL_HZ,
    /** 乐手「响度」（calibrationDb，dB）：0 = 这个库 / 引擎的满音量。库和库要对齐时由那个库的插件报一个非零的数（registry.ts defaultCalibrationDb）。 */
    calibrationDb: 0,
    /** 小月相：谱上的记号 → 唱法核心认的字前记号。 */
    sing: {
      staccato: { mark: "^", at: "next" }, accent: { mark: "^", at: "this" }, marcato: { mark: "^", at: "this" }, breath: { mark: "v", at: "next" },
      sfz: { mark: "^", at: "this" }, fp: { mark: "^", at: "this" },
    } as Record<"staccato" | "accent" | "marcato" | "breath" | "sfz" | "fp", SingMark>,
    /** 小月相唱法核心的旋钮（物理意义见 ai-docs/20261013-dango-c10-pop-probe.md §6）。 */
    tsukuyomiDefaults: { level: 0.8, levelMaxDb: 6, cleanMax: 0.4, breath: 0, levelContinuous: 1 } as Record<string, number>,
    /** 小月相：唱法核心原始输出进她那条轨之前乘多少（dB；16-4 B）。= 20·log10(0.89 ÷ 0.42) 取两位小数：刀 0 量的原始峰值约 0.42（うさぎ 0.419 / 団子 0.412）→ 抬到 0.89
     *  （按句出块之前整首归一化的目标）。原来是插件里的常数 chunkGain = 0.89 / 0.42。这是这个引擎自己的满音量；乐手「响度」（calibrationDb）在它之上另算。 */
    tsukuyomiOutputGainDb: 6.52,
    /** SoundFont 没写力度记号的音按多大力度（0–1 = MIDI ÷ 127）：= 力度表的 mf ÷ 127（新建时一直写的就是它；三处两份默认并成这一个）。 */
    soundfontDefaults: { velocity: 80 / 127 } as Record<string, number>,
  },
};

/** 测试和界面常用的几样，指着上面同一份（不是另一份数）。 */
export const DYNAMICS_VEL = TEMPLATE.lounge.dynamicsVel;
export const DYNAMICS_DB = TEMPLATE.lounge.dynamicsDb;
export const CALIBRATION_DEFAULT_DB = TEMPLATE.lounge.calibrationDb;
export const SING_MARKS = TEMPLATE.lounge.sing;
export const TSUKUYOMI_DEFAULTS = TEMPLATE.lounge.tsukuyomiDefaults;
export const ART_TEMPLATE = TEMPLATE.lounge.articulation;

/** 三种出厂乐手，每种一整位候选的样子（新建 = 按值抄这一份；门口 = 老歌里这位缺的按这一份补）。SoundFont 那一种不带音色来源（上场那一刻按选中的那一件写）；
 *  不固定敲一个键 = 没有 note（写文件时写 null）。键的先后 = 存出来的先后。 */
export function templateCandidate(engine: "tsukuyomi" | "vowel-sampler" | "soundfont"): Json {
  const L = TEMPLATE.lounge;
  if (engine === "tsukuyomi") return {
    name: _t("小月相"), instrument: { engine: "tsukuyomi", model: { ...TSUKUYOMI_MODEL }, hum: "n", chunk: "phrase", outputGainDb: L.tsukuyomiOutputGainDb }, gm: { program: 55, variant: "tsukuyomi" },
    calibrationDb: L.calibrationDb, chain: [], dynamicsDb: { ...L.dynamicsDb }, articulation: { ...L.articulation.gain },
    sing: structuredClone(L.sing), defaults: { ...L.tsukuyomiDefaults }, credit: structuredClone(TSUKUYOMI_CREDIT), spec: structuredClone(TSUKUYOMI_SPEC), transpose: 0,
  };
  if (engine === "vowel-sampler") return {
    name: _t("小月相（元音）"), instrument: { engine: "vowel-sampler", table: "builtin", hum: "n" }, gm: { program: 55, variant: "tsukuyomi-vowels" },
    calibrationDb: L.calibrationDb, chain: [], dynamicsDb: { ...L.dynamicsDb }, articulation: { ...L.articulation.gain },
    defaults: {}, credit: structuredClone(TSUKUYOMI_CREDIT), spec: structuredClone(VOWEL_SAMPLER_SPEC), transpose: 0,
  };
  return {
    instrument: { engine: "soundfont" }, calibrationDb: L.calibrationDb, chain: [], dynamicsVel: { ...L.dynamicsVel },
    articulation: { ...L.articulation.velocity }, defaults: { ...L.soundfontDefaults }, transpose: 0,
  };
}
