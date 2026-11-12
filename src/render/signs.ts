// signs.ts —— 记号表（设计稿第 3.8 节）：一个记号一行——名字、点一下的说明、贴在哪一道、每种谱里画成什么、（下一轮）键面。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第四刀 4-3）。这一刀收：演奏法（Art）、力度（Dyn）、渐强 / 渐弱、渐到。
//   「每种谱里画成什么」的类型是 Record<NotationId, …>：加一个记号或加一种谱而漏填 = 编译不过（守卫 4 的编译期那一半）。
//   画成什么：glyph = Bravura 字形（五线谱现有的码位原样搬来，数值逐位一样）；
//   drawn = 画法里用线 / 路径画的（发夹、音内起伏、琶音线、横线…），这一栏写一句它画成什么。
//   名字 / 说明走翻译表（_tIn：排版明着吃界面语言，不读这一页的当前语言）；说明的界面（点一下就说明）= 第五刀再露，这一刀先把字填上。键面那一栏不做（下一轮）。
import { _tIn, type Lang } from "../i18n/index.ts";
import type { Art, Dyn } from "../score/song.ts";
import type { NotationId } from "../score/song-view.ts";
import type { LaneKind } from "./frame/lanes.ts";

export type Depiction =
  | { kind: "glyph"; above: string; below?: string; /** 墨迹（sp）：宽 / 高；力度字另带左、右、基线以上、基线以下。 */ w?: number; h?: number; ink?: readonly [number, number, number, number] }
  | { kind: "drawn"; how: string }
  /** 普通的字（文字样式表里的一种：字体 / 粗细 / 斜体在那里）：简谱数字行上的力度（第五刀，统筹转达 user 11-11「我觉得主要是我们简谱字比较细，你用粗体就怎么都会抢吧」）。 */
  | { kind: "text"; s: string };
export type SignId = `art:${Art}` | `dyn:${Dyn}` | "hairpin:cresc" | "hairpin:dim" | "ramp";
export interface Sign {
  readonly id: SignId;
  name(l: Lang): string;
  says(l: Lang): string;
  /** 贴在哪一道（frame/lanes.ts）；跟着音本身画的（符头上的、音右边的）= "note"。 */
  readonly lane: LaneKind | "note";
  readonly draw: Readonly<Record<NotationId, Depiction>>;
}

const G = (above: string, below?: string, w?: number, h?: number): Depiction => ({ kind: "glyph", above, ...(below ? { below } : {}), ...(w !== undefined ? { w } : {}), ...(h !== undefined ? { h } : {}) });
const D = (how: string): Depiction => ({ kind: "drawn", how });
/** 简谱数字行上的力度：和数字同一款字、常规粗细、斜体的小写字母（文字样式 jp-dyn，字号约数字的 0.8）。五线谱照旧 Bravura 的力度字形。 */
const T = (s: string): Depiction => ({ kind: "text", s });
/** 力度字（Bravura；墨迹 = 浏览器里 canvas 量的，相对字的原点：左、右、基线以上、基线以下）。原样从 staff/glyphs.ts 搬来。 */
const DYN_G: Record<Dyn, Depiction> = {
  ppp: { kind: "glyph", above: "\u{E52A}", ink: [-0.4, 4.3, 1.1, 0.6] }, pp: { kind: "glyph", above: "\u{E52B}", ink: [-0.4, 3, 1.1, 0.6] }, p: { kind: "glyph", above: "\u{E520}", ink: [-0.4, 1.5, 1.1, 0.6] },
  mp: { kind: "glyph", above: "\u{E52C}", ink: [-0.1, 3.3, 1.1, 0.6] }, mf: { kind: "glyph", above: "\u{E52D}", ink: [-0.1, 3.3, 1.7, 0.7] }, f: { kind: "glyph", above: "\u{E522}", ink: [-0.6, 1.5, 1.8, 0.6] },
  ff: { kind: "glyph", above: "\u{E52F}", ink: [-0.6, 2.5, 1.8, 0.6] }, fff: { kind: "glyph", above: "\u{E530}", ink: [-0.6, 3.4, 1.8, 0.6] },
};
/** 力度的中文叫法（极弱 / 很弱 / 弱 / 中弱 / 中强 / 强 / 很强 / 极强；不用「最」）：只在说明栏里（点一下就说明）。谱上两种谱都画字母——user 11-11 夜（纪要第 88 节）
 *  「嗯，那么改成 P F 吧，因为我觉得中文的字确实有点太抢眼了。」（推翻 UX 稿第 2、6 节「中文界面写中文字」）。 */
const DYN_NAME = (d: Dyn, l: Lang): string => ({ ppp: _tIn(l, "极弱"), pp: _tIn(l, "很弱"), p: _tIn(l, "弱##力度"), mp: _tIn(l, "中弱"), mf: _tIn(l, "中强"), f: _tIn(l, "强##力度"), ff: _tIn(l, "很强"), fff: _tIn(l, "极强") })[d];

const art = (a: Art, name: (l: Lang) => string, says: (l: Lang) => string, lane: Sign["lane"], staff: Depiction, jianpu: Depiction): Sign => ({ id: `art:${a}`, name, says, lane, draw: { staff, jianpu, letters: jianpu } });
/** 演奏法：每个 Art 一行（类型 = 每个都要有；漏一个编译不过）。 */
const ART_SIGNS: Readonly<Record<`art:${Art}`, Sign>> = {
  "art:staccato": art("staccato", (l) => _tIn(l, "跳音"), (l) => _tIn(l, "这个音短一点、和下一个音断开"), "note", G("\u{E4A2}", "\u{E4A3}", 0.28, 0.28), G("\u{E4A8}", "\u{E4A9}", 0.4, 0.9)),   // 简谱 = 窄小的楔形（点被八度占了；UX 稿第 5 节）
  "art:accent": art("accent", (l) => _tIn(l, "重音"), (l) => _tIn(l, "这个音的音头重一点"), "strength", G("\u{E4A0}", "\u{E4A1}", 1.36, 0.99), G("\u{E4A0}", "\u{E4A1}", 1.36, 0.99)),
  "art:marcato": art("marcato", (l) => _tIn(l, "强音"), (l) => _tIn(l, "比重音更重的音头"), "strength", G("\u{E4AC}", "\u{E4AD}", 1.0, 1.08), G("\u{E4AC}", "\u{E4AD}", 1.0, 1.08)),
  "art:stress": art("stress", (l) => _tIn(l, "次重音"), (l) => _tIn(l, "比重音轻一档的重（四拍子里的第三拍那种）"), "strength", G("\u{E4B6}", "\u{E4B7}", 1.0, 1.0), G("\u{E4A0}", "\u{E4A1}", 1.36, 0.99)),   // 简谱 = 细一号的 >（UX 稿第 5 节：画的时候缩小）
  "art:unstress": art("unstress", (l) => _tIn(l, "弱化"), (l) => _tIn(l, "这个音轻一点"), "strength", G("\u{E4B8}", "\u{E4B9}", 1.6, 0.9), G("\u{E4B8}", "\u{E4B9}", 1.6, 0.9)),
  "art:ghost": art("ghost", (l) => _tIn(l, "幽灵音"), (l) => _tIn(l, "几乎听不见的音（只留个影子）"), "note", D("符头加括号"), D("数字画小一号")),   // i18n-keep（「画成什么」这一栏是写给开发看的说明，不是界面字）
  "art:tenuto": art("tenuto", (l) => _tIn(l, "保持"), (l) => _tIn(l, "这个音唱 / 奏满，不和下一个音断开"), "note", G("\u{E4A4}", "\u{E4A5}", 1.35, 0.17), G("\u{E4A4}", "\u{E4A5}", 1.35, 0.17)),
  "art:breath": art("breath", (l) => _tIn(l, "呼吸"), (l) => _tIn(l, "这个音后面换气"), "note", G("\u{E4CE}"), D("音后面一个 V（出声的换气写「V 吸」）")),   // i18n-keep（「画成什么」这一栏是写给开发看的说明，不是界面字）
  "art:sfz": art("sfz", (l) => _tIn(l, "突强"), (l) => _tIn(l, "音头突然冲一下、再回到当下的力度"), "noteDynamics", G("\u{E539}"), T("sfz")),
  "art:fp": art("fp", (l) => _tIn(l, "强后即弱"), (l) => _tIn(l, "音头按强、马上落到弱，后面的音都是弱"), "noteDynamics", G("\u{E534}"), T("fp")),
  "art:whisper": art("whisper", (l) => _tIn(l, "气声"), (l) => _tIn(l, "不唱音高、用气声念（音高照写在谱上）"), "note", D("× 符头"), D("数字 + ×")),   // i18n-keep（「画成什么」这一栏是写给开发看的说明，不是界面字）
  "art:swellUp": art("swellUp", (l) => _tIn(l, "音内渐强"), (l) => _tIn(l, "这个音里面从弱长到写的力度"), "noteDynamics", D("这个音上方的小发夹 <"), D("这个音上方的小楔形 <")),   // i18n-keep（「画成什么」这一栏是写给开发看的说明，不是界面字）
  "art:swellDown": art("swellDown", (l) => _tIn(l, "音内渐弱"), (l) => _tIn(l, "这个音里面从写的力度收弱"), "noteDynamics", D("这个音上方的小发夹 >"), D("这个音上方的小楔形 >")),   // i18n-keep（「画成什么」这一栏是写给开发看的说明，不是界面字）
  "art:swellBoth": art("swellBoth", (l) => _tIn(l, "音内鼓起"), (l) => _tIn(l, "这个音里面先长后收（messa di voce）"), "noteDynamics", D("这个音上方的小发夹 <>"), D("这个音上方的小楔形 <>")),   // i18n-keep（「画成什么」这一栏是写给开发看的说明，不是界面字）
  "art:arpeggio": art("arpeggio", (l) => _tIn(l, "琶音"), (l) => _tIn(l, "和弦从低到高一个个拨出来"), "note", D("和弦左边一条竖的波浪线"), D("和弦左边一条竖的波浪线（多声部 = 第五刀）")),   // i18n-keep（「画成什么」这一栏是写给开发看的说明，不是界面字）
  "art:roll": art("roll", (l) => _tIn(l, "滚奏"), (l) => _tIn(l, "这个音快速地反复敲（滚）"), "note", D("符干上三道斜线"), D("数字下面三道短斜线")),   // i18n-keep（「画成什么」这一栏是写给开发看的说明，不是界面字）
};
const dynSign = (d: Dyn): Sign => ({ id: `dyn:${d}`, name: () => d, says: (l) => _tIn(l, "{dynName}（{dyn}）：从这个音起是这个强弱，管到下一个力度记号", { dynName: DYN_NAME(d, l), dyn: d }), lane: "dynamics", draw: { staff: DYN_G[d], jianpu: T(d), letters: T(d) } });   // 两种谱都写字母（纪要第 88 节）；简谱用和数字同一款的细斜体（第五刀样张后，user「主要是粗细，不在字号」）
/** 力度：每一档一行（明着写八行，类型 = 每档都要有）。 */
const DYN_SIGNS: Readonly<Record<`dyn:${Dyn}`, Sign>> = { "dyn:ppp": dynSign("ppp"), "dyn:pp": dynSign("pp"), "dyn:p": dynSign("p"), "dyn:mp": dynSign("mp"), "dyn:mf": dynSign("mf"), "dyn:f": dynSign("f"), "dyn:ff": dynSign("ff"), "dyn:fff": dynSign("fff") };
/** 记号表（演奏法 + 力度 + 渐强 / 渐弱 + 渐到）。不做类型断言：少一行 = 编译不过。 */
export const SIGNS: Readonly<Record<SignId, Sign>> = {
  ...ART_SIGNS, ...DYN_SIGNS,
  "hairpin:cresc": { id: "hairpin:cresc", name: (l) => _tIn(l, "渐强"), says: (l) => _tIn(l, "从这里起越来越强，到下一个力度记号为止"), lane: "dynamics", draw: { staff: D("发夹 <（太长写 cresc. - - -）"), jianpu: D("楔形 <"), letters: D("楔形 <") } },   // i18n-keep（「画成什么」这一栏是写给开发看的说明，不是界面字）
  "hairpin:dim": { id: "hairpin:dim", name: (l) => _tIn(l, "渐弱"), says: (l) => _tIn(l, "从这里起越来越弱，到下一个力度记号为止"), lane: "dynamics", draw: { staff: D("发夹 >（太长写 dim. - - -）"), jianpu: D("楔形 >"), letters: D("楔形 >") } },   // i18n-keep（「画成什么」这一栏是写给开发看的说明，不是界面字）
  ramp: { id: "ramp", name: (l) => _tIn(l, "渐到"), says: (l) => _tIn(l, "从上一个力度记号均匀变到这一个"), lane: "dynamics", draw: { staff: D("虚线发夹"), jianpu: D("虚线楔形"), letters: D("虚线楔形") } },   // i18n-keep（「画成什么」这一栏是写给开发看的说明，不是界面字）
};

/** 力度字在这种谱里画成什么：五线谱 = Bravura 字形 + 墨迹；简谱 = 普通的字（细斜体小写，墨迹按字宽现量）。不分界面语言（纪要第 88 节）。 */
export function dynDepiction(d: Dyn, notation: NotationId): { kind: "glyph"; glyph: string; ink: readonly [number, number, number, number] } | { kind: "text"; s: string } {
  const g = SIGNS[`dyn:${d}`].draw[notation];
  if (g.kind === "text") return g;
  if (g.kind === "glyph" && g.ink) return { kind: "glyph", glyph: g.above, ink: g.ink };
  throw new Error(`signs: dyn ${d} has no drawable depiction for ${notation}`);
}
