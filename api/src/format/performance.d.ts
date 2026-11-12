import type { Credit, Spec, Dynamic } from "./contract.ts";
/** 演奏法：跳音 / 保持各吃掉时值的多少（0–1）、重音加多少 dB。 */
export declare const ARTICULATION: {
    readonly staccatoGate: 0.5;
    readonly tenutoGate: 1;
    readonly accentDb: 4;
};
/** 记号怎么解读的其余的数（2026-10-08 Claude Opus 5.5；user「记号怎么解读应该乐器里面有explicit的配置，而不是代码写死」「先看看记号承重能走多远」）：
 *  新建演奏者时 by value 抄进 articulation；旧演奏者没写的键 = 这里的值（= 这一版之前写死在代码里的数，旧歌逐样本不变）。好不好听归 user 耳朵。 */
/** 滚奏每秒几下能调到的范围（v0.16.64；乐器页 ±2 一档）。 */
export declare const ROLL_HZ_MIN = 4, ROLL_HZ_MAX = 40;
export declare const MARK_DEFAULTS: {
    readonly accentSec: 0.12;
    readonly breathSec: 0.16;
    readonly breathShare: 0.25;
    readonly gapShare: 0.25;
    readonly wedgeStepVel: 16;
    readonly sfzDb: 9;
    readonly sfzVel: 32;
    readonly sfzSec: 0.2;
    readonly fpSec: 0.2;
    readonly arpeggioSec: 0.035;
    readonly swellDb: 6;
    readonly stressDb: 2;
    readonly stressVel: 8;
    readonly unstressDb: -3;
    readonly unstressVel: -10;
    readonly ghostDb: -9;
    readonly ghostVel: -28;
};
/** 月读：谱上的记号 → 唱法核心认的字前记号（^ = 顿一下、不换气；v = 换气；O = 大口换气）、放在哪个字前（this = 这个字，next = 下一个字）。
 *  user「跳音就是顿一下」「嗯重音也顿」「月读在那儿换气」。同一个字前面有几个：换气优先（v / O 本来就带一个空当）。 */
export type SingMark = {
    mark: "^" | "v" | "O";
    at: "this" | "next";
};
export declare const SING_MARKS: Record<"staccato" | "accent" | "marcato" | "breath" | "sfz" | "fp", SingMark>;
/** 力度记号 → MIDI 力度（1–127）：全体演奏者 by value 带的表（9-2 起小月相 / 元音版也是；SoundFont 从 2026-10-08 Claude Opus 5.5 起；user「应该send的就是velocity！」「力度就是velocity」
 *  「mp mf 大于小于号这种，可以preliminary的控制力度。然后跳音强音重音也应该是这个」）。起点 = MuseScore 的经典默认值，好不好听归 user 耳朵。
 *  新建候选都抄一份；旧候选没有这张表 = 用这张（9-2：不再有「没表就走 dB」那条路）。GS 很多音色按力度换录音层（仓鼠 v11 velLayers）。 */
export declare const DYNAMICS_VEL: Record<Dynamic, number>;
/** 重音 / 强音在力度上加多少（MIDI 格；SoundFont 这一路）。月读 / 元音版这一路是音头加 dB：重音 accentDb、强音 MARCATO_DB。 */
export declare const ACCENT_VEL = 16, MARCATO_VEL = 28, MARCATO_DB = 7;
/** 没画曲线的音用的默认数（单位同 curves.json 的 units）：soundfont 的 velocity = MIDI 力度比例 0–1。 */
export declare const SOUNDFONT_DEFAULTS: Record<string, number>;
/** 候选里没写 calibrationDb（「响度」）时的值——格式的意思，冻住（2026-10-08 起：user「月读也得-6db，不然一和别的乐器在一起，就会音色变成另外一个人」）。
 *  新上场的演奏者默认多少不归这里：归各自的插件 / 库报（9-3，registry.ts defaultCalibrationDb）。 */
export declare const UNWRITTEN_CALIBRATION_DB = -6;
/** 内置的两位（小月相 / 元音版）新建时按值写进去的「响度」（dB）；她们的插件报的就是这张表（9-3，2026-11-12；user「小月相有自己的normalization，normalization应该是乐器自己可以带的。
 *  是不同库之间需要调」）。数 = 2026-10-08 定的 −6（几个声部相加超过母线天花板时，限幅器压的主要是她的峰、掰弯她的波形；先让 6 dB）。
 *  和唱法旋钮的默认（TSUKUYOMI_DEFAULTS）一样是内置预设的数据，进歌 by value，以后改这里动不到旧歌。 */
export declare const BUILTIN_CALIBRATION_DB: {
    readonly tsukuyomi: -6;
    readonly "vowel-sampler": -6;
};
/** 小月相唱法核心的旋钮（by value 存在候选的 defaults 里，乐器页「高级」里改；没写 = 这张表；新建时抄进去）。2026-10-15 user 拍板：「应该leverage就是齐平，我觉得不开没什么影响吧，
 *  默认不开，然后月相可以设置，齐平和其他的也都放在高级设置里面可以持久化」「嗯你试一下连续也行」。物理意义见 ai-docs/20261013-dango-c10-pop-probe.md §6：
 *  level = 每个字的响度往整句中位数拉几成（0 = 关 = 照念的轻重；唱法核心自己的默认 0.8 只给 Lab 命令行）；levelMaxDb = 最多拉几 dB；levelContinuous = 1 时增益从前一个字连续过渡到这个字（不每字跳回 0）；
 *  cleanMax = 一个字自己的元音杂到这个数以上就借同句干净的同元音来唱；breath = 合成前把杂度压到最干净那几帧的程度（0 = 全压成实声，1 = 照 piper 念的留着）。
 *  2026-10-17 改回齐平开 + 连续（Claude Opus 5.5）：user「那个破音是因为默认关了齐平导致的，能不能考古一下修齐平之前的默认是什么？加上连续过渡然后用那个默认？」「齐平还是默认开吧。爆音至少比响度不可控好」——
 *  考古 = v0.12.9 之前编辑器用唱法核心自己的默认（level 0.8 / levelMaxDb 6 / cleanMax 0.4 / breath 0，那时没有 levelContinuous = 每字重起），v0.12.9 只把 level 改成 0；
 *  现在 = 那一套 + levelContinuous 1（每字重起在字边界上先跳回 0 再爬 = 「そ」破音的来路，连续不跳）。候选里写了值的歌（v0.12.9 起新建的会抄进 level 0）照旧，不偷偷改。 */
export declare const TSUKUYOMI_DEFAULTS: Record<string, number>;
/** 月读的署名块 + 条款（包内 LICENSE 要求显示；出处 = 模型仓 voices/tsukuyomi-chan-zhen.json，经 packs.gen.ts 内嵌）。 */
export declare const TSUKUYOMI_CREDIT: Credit;
/** 月读完整版 = 我们写的引擎（piper 时长接管 + WORLD 重建；唱法 src/singer/sing-core.mjs）；§10.6 vault：指向源码出处 + 文档章节。 */
export declare const TSUKUYOMI_SPEC: Spec;
export declare const VOWEL_SAMPLER_SPEC: Spec;
export declare const SOUNDFONT_SPEC: Spec;
/** 月读模型 = 家族模型包（packId = manifest 的 sha256；app 钉的信任根）。 */
export declare const TSUKUYOMI_MODEL: {
    pack: "voice-tsukuyomi-chan-zhen-dur-6lang-fp16-20261007";
    sha256: string;
};
