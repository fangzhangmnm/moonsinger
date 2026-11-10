// theory/index.ts —— 乐理：和声的读法是一个能整块换的模块。created 2026-11-09 by Claude Opus 5.5 · 门改成「从左到右一小节一小节喂」2026-11-09 by Claude Fable 5.2（v0.16.76）
//   user 11-09：「乐理引擎可以拆出一个单独的可热插拔的模块 因为可能不同文明他们用的和声理论都不一样」（总表第 33 条，愿望单 W-55 有原话）。
//
// ── 前提：只看前面（设计分析算法的前提，不是事后的检查）──────────────────────────────────────────────
//   user 11-09：「我们这个软件的核心是给不会写歌的新手…这就代表了什么呢？代表这里面的输入的曲曲子很有可能都是错的…所以我才一直在说locality 关键是我们在输入的时候，
//   它是没有头的，不对，它是没有尾巴的。就是我们是写到一半，我们这个辅助功能是不能看到完整的曲子的。你可以想象说，神笔马娘他画了一只狗，但是画好头之后，你跟我说这个狗已经活过来了，
//   然后因为没有身子，所以死掉了，这不就很滑稽吗？」「这个不是守卫，而是设计分析算法的前提。我们是LLAMA不是BERT，只能看到前面的」。
//   读法（Claude Fable 5.2 归纳，user 没逐字说的）：
//   ① 只看前面：读到某一处时，手里只有它前面写好的；后面写什么，都不改已经读出来的。歌永远是写到一半的。
//   ② 只看附近：歌多半有写错的地方，远处的一个音不该改这里的读法。
//   ③ 所以凡是要「看完整首 / 看完这一段才知道」的判断（大调还是小调、曲式、终止…）分析不猜：要么人写明（存在歌里的记号，读到那儿就知道），要么不做。
//      撤掉的例子 = v0.16.72「这一段最后一个音是 la 就从 la 数」（AI 自己挑的认法，user 11-09「我直觉觉得不妥」）。
//   落在门上（结构，不靠自觉）：一种理论一次只拿得到**一小节**（BarInput）+ 它自己上一小节交出来的东西（carry）。整条 track、后面的小节，没人给它。
//   一小节是最小的一口（user 11-09「然后不跨小节」「如果用户没有输入articulation的话那么我们唯一知道的就是小节」）：正在写的这一小节，读法会跟着往里填音而变；写过去的小节不再变。
//   carry 要小、要健忘：「刚才标过什么」这一类可以带，「这首歌是什么调」这一类不许带（那是 ③）——不然开头写错的一个音会顺着它一路传到后面。
//
//   门面（外面只认这些）：harmonyTags(理论, 一条 track) = 哪几个音底下标什么；理论自己管谱上写什么字（label）、点开候选时每个读法怎么说（explain / howTo）。
//   读法是纯数据（能进 worker、能结构化克隆），带着自己是哪种理论（theory）——点开时找回同一种理论来解释。
//   每个声部各认各的，不把几个声部合起来读（user 11-09「我还是希望它的局域性好一点，所以说可能还是每个声部单独做吧」）。
//   现在只有一种：western = 西方功能和声的罗马数字级数（src/theory/western.ts）。以后加别的 = 写一个同样门面的文件、登记进 THEORIES；
//   挑哪一种的开关（歌里 / 设备上）等真有第二种时再定。
import { DEFAULT_KEY, type Token, type NoteTok, type ChordPin } from "../score/song.ts";
import { meterPositions } from "../score/groove.ts";
import { western } from "./western.ts";

/** 一个读法（候选）。label = 谱上写的短字；name = 点开时写在旁边的全名；cost 越小越像（同分 = 打平）。各理论可以多带自己的字段（纯数据）。 */
export interface HarmonyGuess { label: string; name: string; cost: number }
/** 读出来的结果：best = 第一候选；ties = 和它打平的（含它自己）；all = 全部候选（按先后）；theory = 哪种理论读的。 */
export interface HarmonyRead<G extends HarmonyGuess = HarmonyGuess> { theory: string; best: G; ties: G[]; all: G[];
  /** 人挑的（音上写着和弦名，v0.16.87）：best = 写着的那个；auto = 这几个音自己认出来的（没有 = 认不出，比如旋律里一个单音）。 */
  pinned?: true; auto?: HarmonyRead<G>;
  /** 写着的那个不在 auto 的候选里（音后来改了）：照样画、灰 + 「?」，点开说一声；不自动删、不自动换。 */
  stale?: true }
/** 一处标签：index = 那个音在 track 里的下标。 */
export interface HarmonyTag<R extends HarmonyRead = HarmonyRead> { index: number; read: R }
/** 一条 track：一张纸（曲段）里一个声部的记号串（调号从里面的调号记号读）。 */
export interface TrackInput { tokens: readonly Token[]; /** 这个声部认不认「拆开弹的和弦」（声部开关，v0.16.73；没给 = 认）。 */ broken?: boolean }

/** 一小节里的一个音。index 只当名字用（标签挂回它身上）——理论手里没有 track，拿它翻不到别的记号。 */
export interface BarNote {
  index: number;
  tok: NoteTok;
  /** 在小节里的位置（tick，从小节头数；弱起小节的音靠右）。 */
  pos: number;
  /** 这个音这里的调（几个升降号）= 它前面最近的调号。 */
  fifths: number;
  /** 那个调号写着「小调」（v0.16.83；user 11-09「在选调号的时候强制一起选」）= 级数从 la 数。人写明的，不是分析猜的（文件头 ③）。 */
  minor?: true;
  /** 接着前面连过来的（不重新起音）。 */
  tie?: true;
}
/** 读的单位 = 一小节：这一小节的拍号 + 里面的音（按先后）。没有音的小节不喂。 */
export interface BarInput { beats: number; beatType: number; notes: readonly BarNote[] }
export interface ReadOpts { /** 这个声部认不认「拆开弹的和弦」。 */ broken: boolean }

export interface HarmonyTheory {
  id: string;
  /** 读一小节：这一小节 + 上一小节交出来的 carry（第一小节 = undefined）→ 这一小节里要标的音 + 交给下一小节的 carry。纯函数、纯数据（排版 worker 里跑）。
   *  理论只见得到喂给它的这一小节（见文件头「只看前面」）。 */
  readBar(bar: BarInput, carry: unknown, opts: ReadOpts): { tags: HarmonyTag[]; carry: unknown };
  /** 谱上写的那一行字。 */
  label(read: HarmonyRead): string;
  /** 点开候选时：顶上那句「怎么认的」、每个读法后面的小字。界面上跑（可以用 _t）。 */
  howTo(read?: HarmonyRead): string;
  explain(guess: HarmonyGuess): string[];
  /** 人写明的和弦（音上的 harm）→ 一处读法（级数按这里的调现算）；auto = 这个音自己认出来的。种类不认识 = null（不画）。 */
  pinRead(pin: ChordPin, at: { fifths: number; minor: boolean }, auto: HarmonyRead | undefined): HarmonyRead | null;
  /** 候选里的一个 → 存进音里的和弦名。 */
  pinOf(guess: HarmonyGuess): ChordPin;
}

export const THEORIES: Record<string, HarmonyTheory> = { [western.id]: western };
/** 人写明的和弦 ↔ MusicXML <harmony><kind>（v0.16.87）：和弦种类的写法表跟着西方功能和声那一种（存盘用的是和弦名本身，不看是哪种理论在读）。 */
export { pinXmlKind, xmlKindToPin } from "./western.ts";
export const DEFAULT_THEORY = western.id;
/** 按 id 找理论；不认识的 id（别的版本加的）= 默认那一种。 */
export const harmonyTheory = (id: string = DEFAULT_THEORY): HarmonyTheory => THEORIES[id] ?? THEORIES[DEFAULT_THEORY]!;

/** 把一条 track 切成一小节一小节（从左到右；小节怎么分 = 画谱 / 拍子轻重同一套 meterPositions；调 = 走到这儿之前最近的调号）。 */
export function barsOf(tokens: readonly Token[]): BarInput[] {
  const at = meterPositions(tokens, [0], true), bars: { no: number; beats: number; beatType: number; notes: BarNote[] }[] = [];
  let fifths = DEFAULT_KEY, minor = false;
  tokens.forEach((t, i) => {
    if (t.kind === "key") { fifths = t.fifths; minor = t.mode === "minor"; return; }
    const m = at.get(i); if (!m || t.kind !== "note") return;
    let bar = bars[bars.length - 1];
    if (!bar || bar.no !== m.bar) bars.push((bar = { no: m.bar, beats: m.beats, beatType: m.beatType, notes: [] }));
    bar.notes.push({ index: i, tok: t, pos: m.pos, fifths, ...(minor ? { minor: true as const } : {}), ...(m.tie ? { tie: true as const } : {}) });
  });
  return bars;
}
/** 一条 track 要标的音：从左到右一小节一小节喂给理论，carry 一路往右传（理论拿不到整条 track——文件头「只看前面」）。 */
export function harmonyTags(theory: HarmonyTheory, track: TrackInput): HarmonyTag[] {
  const out: HarmonyTag[] = [], opts: ReadOpts = { broken: track.broken !== false }, bars = barsOf(track.tokens);
  let carry: unknown;
  for (const bar of bars) { const r = theory.readBar(bar, carry, opts); out.push(...r.tags); carry = r.carry; }
  // 人挑过的（音上写着和弦名）：那个音一定标、标写着的那个（v0.16.87）；自动认的留在 auto 里给候选和「对不上」用
  const pins = bars.flatMap((b) => b.notes).filter((n) => n.tok.harm);
  if (!pins.length) return out;
  const byIndex = new Map(out.map((t) => [t.index, t] as const));
  for (const n of pins) {
    const rd = theory.pinRead(n.tok.harm!, { fifths: n.fifths, minor: !!n.minor }, byIndex.get(n.index)?.read);
    if (rd) byIndex.set(n.index, { index: n.index, read: rd });
  }
  return [...byIndex.values()].sort((a, b) => a.index - b.index);
}
