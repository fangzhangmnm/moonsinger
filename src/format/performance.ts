// performance.ts —— 新建候选（乐器）时 by value 抄进歌里的默认数：力度表、演奏法、月读的署名 / 规格、SoundFont 的规格。
// created 2026-10-07 by Claude Fable 5.1。契约草稿 §8：渲染 = 纯函数(文件)，候选快照里写全纯函数要的一切，不依赖 app 里的默认表——
//   这些常量只在「新建候选那一刻」用一次，之后歌里的数就是歌自己的（app 升级改了这里也动不到旧歌，「later edits … dont nuke us」）。
import { CREDIT, SINGER, PACKS } from "../singer/packs.gen.ts";
import { APP_VERSION } from "../version.ts";
import type { Credit, Spec, Dynamic } from "./contract.ts";

/** 力度字母 → dB（相对 mf = 0；§7.7 记号 ↔ 曲线的换算表，by value）。常见打谱软件的默认大致是每档 6 dB。 */
//   ppp / fff（v0.9.23，2026-10-10 user「wishlist: ppp fff，以及帮我科普这些和db的换算关系，然后应该向用户揭露，方便对比」）：顺着一档 6 dB 往外推；旧演奏者的表里没有这两格 = 按它自己的间隔推（project.ts activePerfSpec）。
export const DYNAMICS_DB: Record<Dynamic, number> = { ppp: -24, pp: -18, p: -12, mp: -6, mf: 0, f: 6, ff: 12, fff: 18 };
/** 演奏法：跳音 / 保持各吃掉时值的多少（0–1）、重音加多少 dB。 */
export const ARTICULATION = { staccatoGate: 0.5, tenutoGate: 1.0, accentDb: 4 } as const;
/** 记号怎么解读的其余的数（2026-10-08 Claude Opus 5.5；user「记号怎么解读应该乐器里面有explicit的配置，而不是代码写死」「先看看记号承重能走多远」）：
 *  新建演奏者时 by value 抄进 articulation；旧演奏者没写的键 = 这里的值（= 这一版之前写死在代码里的数，旧歌逐样本不变）。好不好听归 user 耳朵。 */
export const MARK_DEFAULTS = {
  accentSec: 0.12,                  // 重音 / 强音：音头加重持续多久（秒；月读 / 元音版 / 旧乐器的 dB 那一路）
  breathSec: 0.16, breathShare: 0.25,   // 呼吸：前一个音收短多少（秒），最多占这个音的几分之几（元音版 / 乐器）
  gapShare: 0.25,                   // 连断底色的缝最多吃掉这个音的几分之几
  wedgeStepDb: 6, wedgeStepVel: 16, // 渐强渐弱后面没写力度记号 = 走一档：dB 那一路 / 力度那一路各走多少
  sfzDb: 9, sfzVel: 32, sfzSec: 0.2,     // 突强：音头比当下高多少（dB 那一路，sfzSec 里落回来）/ 力度那一路加多少
  fpSec: 0.2,                       // 强后即弱：音头按这位的 f，这么久落到 p（之后的音都是 p）
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
/** 力度记号 → MIDI 力度（1–127）：SoundFont 演奏者 by value 带的表（2026-10-08 Claude Opus 5.5；user「应该send的就是velocity！」「力度就是velocity」
 *  「mp mf 大于小于号这种，可以preliminary的控制力度。然后跳音强音重音也应该是这个」）。起点 = MuseScore 的经典默认值，好不好听归 user 耳朵。
 *  只给新建的 SoundFont 候选；旧候选没有这张表 = 照旧（力度记号走 dB、力度 0.8），旧歌逐样本不变。GS 很多音色按力度换录音层（仓鼠 v11 velLayers）。 */
export const DYNAMICS_VEL: Record<Dynamic, number> = { ppp: 16, pp: 33, p: 49, mp: 64, mf: 80, f: 96, ff: 112, fff: 126 };   // ppp 16 / fff 126 = MuseScore 的经典值（v0.9.23）
/** 重音 / 强音在力度上加多少（MIDI 格；SoundFont 这一路）。月读 / 元音版这一路是音头加 dB：重音 accentDb、强音 MARCATO_DB。 */
export const ACCENT_VEL = 16, MARCATO_VEL = 28, MARCATO_DB = 7;
/** 没画曲线的音用的默认数（单位同 curves.json 的 units）：soundfont 的 velocity = MIDI 力度比例 0–1。 */
export const SOUNDFONT_DEFAULTS: Record<string, number> = { velocity: 0.8 };
/** 新建 SoundFont 候选的响度校准（dB）：月读当基准（0），乐器默认让一点（2026-10-08 by Claude Opus 5.5；user「感觉乐器进来之后好像月读变轻了」）。
 *  只是起点：好不好听归 user 耳朵，歌手牌上看得见、能调（契约「校准 = 看得见、能调的默认，不偷偷自动」）；进歌 by value，以后改这个数动不到旧歌。 */
export const SOUNDFONT_CALIBRATION_DB = -6;
/** 新建的演奏者（月读也是）默认的响度校准，也是「没写」时的值（2026-10-08 by Claude Opus 5.5；user「月读也得-6db，不然一和别的乐器在一起，
 *  就会音色变成另外一个人」）：几个声部相加超过母线天花板时限幅器（src/audio/mix.ts，起压 3 ms）压的是整条混音——月读最响，压的主要是她的峰，
 *  3 ms 只够她一两个声门周期，等于掰弯她的波形；先让 6 dB = 叠在一起也很少顶到天花板。只管新建的：旧歌里存的 0 照旧（不偷偷改，人能调）。 */
export const DEFAULT_CALIBRATION_DB = -6;
export const TSUKUYOMI_DEFAULTS: Record<string, number> = {};   // 月读的旋钮（气息 / 张力 / 实声…）的物理定义表 = 契约 §7.3，还没定；定了之后新建时抄进来

const REPO = "https://github.com/fangzhangmnm/moonsinger";
/** 月读的署名块 + 条款（包内 LICENSE 要求显示；出处 = 模型仓 voices/tsukuyomi-chan-zhen.json，经 packs.gen.ts 内嵌）。 */
export const TSUKUYOMI_CREDIT: Credit = {
  attribution: [CREDIT.credit, ...CREDIT.attribution],
  license: { name: "つくよみちゃんコーパス利用規約（衍生模型）", url: CREDIT.termsUrl, text: CREDIT.terms },
};
/** 月读完整版 = 我们写的引擎（piper 时长接管 + WORLD 重建；唱法 src/singer/sing-core.mjs）；§10.6 vault：指向源码出处 + 文档章节。 */
export const TSUKUYOMI_SPEC: Spec = { kind: "ours", doc: "#tsukuyomi", source: { repo: REPO, ref: APP_VERSION, path: "src/singer/sing-core.mjs" } };
export const VOWEL_SAMPLER_SPEC: Spec = { kind: "ours", doc: "#vowel-sampler", source: { repo: REPO, ref: APP_VERSION, path: "src/singer/sampler.ts" } };
export const SOUNDFONT_SPEC: Spec = { kind: "standard", name: "SoundFont", version: "2.04" };
/** 月读模型 = 家族模型包（packId = manifest 的 sha256；app 钉的信任根）。 */
export const TSUKUYOMI_MODEL = { pack: SINGER.voice, sha256: PACKS[SINGER.voice].packId };
