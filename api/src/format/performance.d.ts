import type { Credit, Spec, Dynamic } from "./contract.ts";
/** 演奏法：跳音吃掉时值的多少（0–1）、重音加多少 dB。（tenutoGate 退役：哪条路的出声代码都不读——保持 = 这个音不留缝；统筹 2026-11-12 夜按「读不读」分路时查出来的。） */
export declare const ARTICULATION: {
    readonly staccatoGate: 0.5;
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
/** 按音量走力度的乐手（小月相 / 元音版）新建时按值抄进去的 dB 表（第 16 条 16-4，统筹 2026-11-12 夜）：这个力度记号下她的声音乘多少 dB。
 *  这八个数 = 9-4 那条公式（深度 800 ÷ 960 × 40·log10(力度 ÷ 127)）在标准力度表 DYNAMICS_VEL 上算出来、取两位小数（和公式最大差 0.0044 dB），新建的歌声音和改之前一样；
 *  从这里起它是数据、不是公式。老歌身上带着的表照文件读（缺的档用这里的补）。 */
export declare const DYNAMICS_DB: Record<Dynamic, number>;
/** 重音 / 强音在力度上加多少（MIDI 格；SoundFont 这一路）。月读 / 元音版这一路是音头加 dB：重音 accentDb、强音 MARCATO_DB。 */
export declare const ACCENT_VEL = 16, MARCATO_VEL = 28, MARCATO_DB = 7;
/** 没画曲线的音用的默认数（单位同 curves.json 的 units）：soundfont 的 velocity = MIDI 力度比例 0–1。 */
export declare const SOUNDFONT_DEFAULTS: Record<string, number>;
/** 乐手「响度」（候选的 calibrationDb，dB）的默认：0 = 这个库 / 引擎的满音量，不加不减。**一个默认只有这一处定义**（施工单第 14 条，2026-11-12）：
 *  新建的乐手按值写进去的、插件报的（registry.ts defaultCalibrationDb）、文件里没写时用的，都是它——没写 = 软件现行的默认，不单独留一个旧的数、不按新旧分路
 *  （user 2026-11-12 晚：没写的值可以用软件现行的默认值；改了默认不许为了和以前一样垫数、加 if else）。
 *  库和库之间要对齐时，才由那个库的插件报一个非零的数（加第三个库时用量响度的工具给建议，数由人定）。
 *  2026-10-08 到 2026-11-12 的默认是 −6（user 11-12「就我们这边为什么整体会轻六db？」「不能为了向后兼容而加一大堆隐藏的convention」）：
 *  老歌里明写着的 −6 照写照读、界面上照实显示，user 自己调；没写这个数的（没存过的新歌、缺了休息室的声部）跟着现在的 0，比以前响 6 dB。 */
export declare const CALIBRATION_DEFAULT_DB = 0;
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
