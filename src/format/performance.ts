// performance.ts —— 新建候选（乐器）时 by value 抄进歌里的默认数：力度表、演奏法、月读的署名 / 规格、SoundFont 的规格。
// created 2026-10-07 by Claude Fable 5.1。契约草稿 §8：渲染 = 纯函数(文件)，候选快照里写全纯函数要的一切，不依赖 app 里的默认表——
//   这些常量只在「新建候选那一刻」用一次，之后歌里的数就是歌自己的（app 升级改了这里也动不到旧歌，「later edits … dont nuke us」）。
import { CREDIT, SINGER, PACKS } from "../singer/packs.gen.ts";
import { APP_VERSION } from "../version.ts";
import type { Credit, Spec, Dynamic } from "./contract.ts";

/** 力度字母 → dB（相对 mf = 0；§7.7 记号 ↔ 曲线的换算表，by value）。常见打谱软件的默认大致是每档 6 dB。 */
export const DYNAMICS_DB: Record<Dynamic, number> = { pp: -18, p: -12, mp: -6, mf: 0, f: 6, ff: 12 };
/** 演奏法：跳音 / 保持各吃掉时值的多少（0–1）、重音加多少 dB。 */
export const ARTICULATION = { staccatoGate: 0.5, tenutoGate: 1.0, accentDb: 4 } as const;
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
