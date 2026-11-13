// performance.ts —— 新建候选（乐器）时 by value 抄进歌里的默认数：力度表、演奏法、月读的署名 / 规格、SoundFont 的规格。
// created 2026-10-07 by Claude Fable 5.1。契约草稿 §8：渲染 = 纯函数(文件)，候选快照里写全纯函数要的一切，不依赖 app 里的默认表——
//   这些常量只在「新建候选那一刻」用一次，之后歌里的数就是歌自己的（app 升级改了这里也动不到旧歌，「later edits … dont nuke us」）。
import { _t } from "../i18n/index.ts";
import { CREDIT, SINGER, PACKS } from "../singer/packs.gen.ts";
import { APP_VERSION } from "../version.ts";
import type { Credit, Spec, Dynamic } from "./contract.ts";

// 力度 → 响度只有一条（施工单第 9 节 / 9-2 / 9-4，2026-11-12）：力度记号查力度表（DYNAMICS_VEL，全体演奏者一张）、响度 = 深度 ÷ 960 × 40·log10(力度 ÷ 127)（score/perform.ts velocityDb）。
//   原来小月相 / 元音版那张「力度字母 → dB」的表（每档 6 dB）和「走一档 = 6 dB」退役了；旧文件里按值存的由 lounge 迁移 2→3 删掉（migrate/index.ts）。
/** 演奏法：跳音 / 保持各吃掉时值的多少（0–1）、重音加多少 dB。 */
export const ARTICULATION = { staccatoGate: 0.5, tenutoGate: 1.0, accentDb: 4 } as const;
/** 记号怎么解读的其余的数（2026-10-08 Claude Opus 5.5；user「记号怎么解读应该乐器里面有explicit的配置，而不是代码写死」「先看看记号承重能走多远」）：
 *  新建演奏者时 by value 抄进 articulation；旧演奏者没写的键 = 这里的值（= 这一版之前写死在代码里的数，旧歌逐样本不变）。好不好听归 user 耳朵。 */
/** 滚奏每秒几下能调到的范围（v0.16.64；乐器页 ±2 一档）。 */
export const ROLL_HZ_MIN = 4, ROLL_HZ_MAX = 40;
export const MARK_DEFAULTS = {
  accentSec: 0.12,                  // 重音 / 强音：音头加重持续多久（秒；月读 / 元音版 / 旧乐器的 dB 那一路）
  breathSec: 0.16, breathShare: 0.25,   // 呼吸：前一个音收短多少（秒），最多占这个音的几分之几（元音版 / 乐器）
  gapShare: 0.25,                   // 连断底色的缝最多吃掉这个音的几分之几
  wedgeStepVel: 16,                 // 渐强渐弱后面没写力度记号 = 走一档：力度走多少（9-2 起全体一样）
  sfzDb: 9, sfzVel: 32, sfzSec: 0.2,     // 突强：音头比当下高多少（dB 那一路，sfzSec 里落回来）/ 力度那一路加多少
  fpSec: 0.2,                       // 强后即弱：音头按这位的 f，这么久落到 p（之后的音都是 p）
  arpeggioSec: 0.035,               // 琶音（v0.9.45 / v0.9.48）：旋律（最上面）准时落拍，下面的从低到高每个提早这么多秒（最多摊到这个音一半长）；35 ms = user 定的
  swellDb: 6,                       // 音内起伏：< 走到 +swellDb、> 走到 −swellDb、<> 中间到 +swellDb 再回来
  // 强度的其余几级（2026-10-08 深夜 Opus 5.5）：次重音 = 重音的一半（音头 accentSec 那一段 / 力度）；弱化 / 幽灵音 = 整个音轻下去（幽灵音 ≈ 强音反过来）
  stressDb: 2, stressVel: 8, unstressDb: -3, unstressVel: -10, ghostDb: -9, ghostVel: -28,
} as const;
/** 月读：谱上的记号 → 唱法核心认的字前记号（^ = 顿一下、不换气；v = 换气；O = 大口换气）、放在哪个字前（this = 这个字，next = 下一个字）。
 *  user「跳音就是顿一下」「嗯重音也顿」「月读在那儿换气」。同一个字前面有几个：换气优先（v / O 本来就带一个空当）。 */
export type SingMark = { mark: "^" | "v" | "O"; at: "this" | "next" };
export const SING_MARKS: Record<"staccato" | "accent" | "marcato" | "breath" | "sfz" | "fp", SingMark> = {
  staccato: { mark: "^", at: "next" }, accent: { mark: "^", at: "this" }, marcato: { mark: "^", at: "this" }, breath: { mark: "v", at: "next" },
  sfz: { mark: "^", at: "this" }, fp: { mark: "^", at: "this" },   // 音头那一组都顿一下（同重音，user「嗯重音也顿」）
};
/** 力度记号 → MIDI 力度（1–127）：全体演奏者 by value 带的表（9-2 起小月相 / 元音版也是；SoundFont 从 2026-10-08 Claude Opus 5.5 起；user「应该send的就是velocity！」「力度就是velocity」
 *  「mp mf 大于小于号这种，可以preliminary的控制力度。然后跳音强音重音也应该是这个」）。起点 = MuseScore 的经典默认值，好不好听归 user 耳朵。
 *  新建候选都抄一份；旧候选没有这张表 = 用这张（9-2：不再有「没表就走 dB」那条路）。GS 很多音色按力度换录音层（仓鼠 v11 velLayers）。 */
export const DYNAMICS_VEL: Record<Dynamic, number> = { ppp: 16, pp: 33, p: 49, mp: 64, mf: 80, f: 96, ff: 112, fff: 126 };   // ppp 16 / fff 126 = MuseScore 的经典值（v0.9.23）
/** 重音 / 强音在力度上加多少（MIDI 格；SoundFont 这一路）。月读 / 元音版这一路是音头加 dB：重音 accentDb、强音 MARCATO_DB。 */
export const ACCENT_VEL = 16, MARCATO_VEL = 28, MARCATO_DB = 7;
/** 没画曲线的音用的默认数（单位同 curves.json 的 units）：soundfont 的 velocity = MIDI 力度比例 0–1。 */
export const SOUNDFONT_DEFAULTS: Record<string, number> = { velocity: 0.8 };
/** 乐手「响度」（候选的 calibrationDb，dB）的默认：0 = 这个库 / 引擎的满音量，不加不减。**一个默认只有这一处定义**（施工单第 14 条，2026-11-12）：
 *  新建的乐手按值写进去的、插件报的（registry.ts defaultCalibrationDb）、文件里没写时用的，都是它——没写 = 软件现行的默认，不单独留一个旧的数、不按新旧分路
 *  （user 2026-11-12 晚：没写的值可以用软件现行的默认值；改了默认不许为了和以前一样垫数、加 if else）。
 *  库和库之间要对齐时，才由那个库的插件报一个非零的数（加第三个库时用量响度的工具给建议，数由人定）。
 *  2026-10-08 到 2026-11-12 的默认是 −6（user 11-12「就我们这边为什么整体会轻六db？」「不能为了向后兼容而加一大堆隐藏的convention」）：
 *  老歌里明写着的 −6 照写照读、界面上照实显示，user 自己调；没写这个数的（没存过的新歌、缺了休息室的声部）跟着现在的 0，比以前响 6 dB。 */
export const CALIBRATION_DEFAULT_DB = 0;
/** 小月相唱法核心的旋钮（by value 存在候选的 defaults 里，乐器页「高级」里改；没写 = 这张表；新建时抄进去）。2026-10-15 user 拍板：「应该leverage就是齐平，我觉得不开没什么影响吧，
 *  默认不开，然后月相可以设置，齐平和其他的也都放在高级设置里面可以持久化」「嗯你试一下连续也行」。物理意义见 ai-docs/20261013-dango-c10-pop-probe.md §6：
 *  level = 每个字的响度往整句中位数拉几成（0 = 关 = 照念的轻重；唱法核心自己的默认 0.8 只给 Lab 命令行）；levelMaxDb = 最多拉几 dB；levelContinuous = 1 时增益从前一个字连续过渡到这个字（不每字跳回 0）；
 *  cleanMax = 一个字自己的元音杂到这个数以上就借同句干净的同元音来唱；breath = 合成前把杂度压到最干净那几帧的程度（0 = 全压成实声，1 = 照 piper 念的留着）。
 *  2026-10-17 改回齐平开 + 连续（Claude Opus 5.5）：user「那个破音是因为默认关了齐平导致的，能不能考古一下修齐平之前的默认是什么？加上连续过渡然后用那个默认？」「齐平还是默认开吧。爆音至少比响度不可控好」——
 *  考古 = v0.12.9 之前编辑器用唱法核心自己的默认（level 0.8 / levelMaxDb 6 / cleanMax 0.4 / breath 0，那时没有 levelContinuous = 每字重起），v0.12.9 只把 level 改成 0；
 *  现在 = 那一套 + levelContinuous 1（每字重起在字边界上先跳回 0 再爬 = 「そ」破音的来路，连续不跳）。候选里写了值的歌（v0.12.9 起新建的会抄进 level 0）照旧，不偷偷改。 */
export const TSUKUYOMI_DEFAULTS: Record<string, number> = { level: 0.8, levelMaxDb: 6, cleanMax: 0.4, breath: 0, levelContinuous: 1 };

const REPO = "https://github.com/fangzhangmnm/moonsinger";
/** 月读的署名块 + 条款（包内 LICENSE 要求显示；出处 = 模型仓 voices/tsukuyomi-chan-zhen.json，经 packs.gen.ts 内嵌）。 */
export const TSUKUYOMI_CREDIT: Credit = {
  attribution: [CREDIT.credit, ...CREDIT.attribution],
  license: { name: _t("つくよみちゃんコーパス利用規約（衍生模型）"), url: CREDIT.termsUrl, text: CREDIT.terms },
};
/** 月读完整版 = 我们写的引擎（piper 时长接管 + WORLD 重建；唱法 src/singer/sing-core.mjs）；§10.6 vault：指向源码出处 + 文档章节。 */
export const TSUKUYOMI_SPEC: Spec = { kind: "ours", doc: "#tsukuyomi", source: { repo: REPO, ref: APP_VERSION, path: "src/singer/sing-core.mjs" } };
export const VOWEL_SAMPLER_SPEC: Spec = { kind: "ours", doc: "#vowel-sampler", source: { repo: REPO, ref: APP_VERSION, path: "src/singer/sampler.ts" } };
export const SOUNDFONT_SPEC: Spec = { kind: "standard", name: "SoundFont", version: "2.04" };
/** 月读模型 = 家族模型包（packId = manifest 的 sha256；app 钉的信任根）。 */
export const TSUKUYOMI_MODEL = { pack: SINGER.voice, sha256: PACKS[SINGER.voice].packId };
