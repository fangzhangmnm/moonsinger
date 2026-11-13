// performance.ts —— 新建候选（乐器）时 by value 抄进歌里的默认数：力度表、演奏法、月读的署名 / 规格、SoundFont 的规格。
// created 2026-10-07 by Claude Fable 5.1。契约草稿 §8：渲染 = 纯函数(文件)，候选快照里写全纯函数要的一切，不依赖 app 里的默认表——
//   这些常量只在「新建候选那一刻」用一次，之后歌里的数就是歌自己的（app 升级改了这里也动不到旧歌，「later edits … dont nuke us」）。
import { _t } from "../i18n/index.ts";
import { CREDIT, SINGER, PACKS } from "../singer/packs.gen.ts";
import { APP_VERSION } from "../version.ts";
import type { Credit, Spec, Dynamic } from "./contract.ts";

// 力度怎么变响（第 16 条 16-4，统筹 2026-11-12 夜）：每位乐手按值带着自己的表，程序里没有公式、没有深度。
//   按力度敲的乐器 = 力度表（力度记号 → MIDI 力度；响多少跟着音色库自己写的深度，引擎读）；按音量走的小月相 / 元音版 = dB 表（力度记号 → dB）。表的出厂值在 template.ts。
/** 滚奏每秒几下能调到的范围（v0.16.64；乐器页 ±2 一档）。数的默认（鼓 12 / 有音高 14）在 template.ts。 */
export const ROLL_HZ_MIN = 4, ROLL_HZ_MAX = 40;
/** 小月相：谱上的记号 → 唱法核心认的字前记号（^ = 顿一下、不换气；v = 换气；O = 大口换气）、放在哪个字前（this = 这个字，next = 下一个字）。
 *  user「跳音就是顿一下」「嗯重音也顿」「月读在那儿换气」。同一个字前面有几个：换气优先（v / O 本来就带一个空当）。出厂的那一张在 template.ts。 */
export type SingMark = { mark: "^" | "v" | "O"; at: "this" | "next" };
// 量纲和意思（数在 template.ts，第 16 条 16-4 A 搬过去的）：
//   · 力度表 dynamicsVel = 力度记号 → MIDI 力度 1–127（按力度敲的）；dynamicsDb = 力度记号 → dB（按音量走的，这张表就是她的力度）。
//   · 演奏法：staccatoGate / breathShare / gapShare = 时值的几分之几（0–1）；*Sec = 秒；*Db = dB；*Vel = MIDI 力度格；arpeggioSec 琶音每个音提早几秒；rollHz 每秒几下。
//   · calibrationDb = 乐手「响度」（dB；0 = 这个库 / 引擎的满音量）。tsukuyomiDefaults = 唱法核心的旋钮（物理意义 ai-docs/20261013-dango-c10-pop-probe.md §6）。
//   · soundfontDefaults.velocity = 没写力度记号的音按多大力度（MIDI ÷ 127）。

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
