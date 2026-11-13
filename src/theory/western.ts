// theory/western.ts —— 西方功能和声：认和弦 + 写成罗马数字级数（v0.16.11，辅助：和弦标级数）。纯函数，只给显示用：不进文件、不改谱。
//   2026-11-09 起是乐理模块（src/theory/index.ts）里的一种理论（原 src/score/chord-name.ts，搬家没改认法；user「乐理引擎可以拆出一个单独的可热插拔的模块」）。
//   v0.16.76（2026-11-09 Claude Fable 5.2）：只拿得到一小节（readBar）——前提「只看前面」写在 index.ts 文件头；「最后一个音是 la 就从 la 数」撤了（那要看完一段才知道）。
// created 2026-11-07 by Claude Opus 5.5。user 11-07「你大概看得出来，是我根本看不懂我自己摸的和弦，摸出来是几级和弦，我脑袋根本转不过来」
//   「和弦上标级数…我建议你写个深模块，不用麻烦音乐仓鼠吧，就你自己写，因为这个世界上和弦很多」「你这个和弦判断，你打算怎么判断？因为它很多和弦，它歧义很多的…
//   换根音，还是挂二、挂四、十七、十三…还是说你其实根据调号判断就会比较准？」。
// 怎么认（AI 答 user 的那套，user 没否）：
//   ① 列候选：按下的几个音（不管八度）和下面这张和弦表比，12 个音轮流当根音，表里的音（可省的除外）都要有、按下的音都要在表里。
//   ② 排先后（cost 小的在前）：省掉的音少的优先（每个 +1.2：按下的音凑得成一个完整的和弦——哪怕是转位——就不说它是省了音的另一个；C E A = Am/C，不是省了五音的 C6）
//      → 根音 = 最低音的优先（不是 = 转位，+1）→ 根音在这个调里的优先（不在 +0.25）→ 简单的和弦优先（表里靠前）。
//   ③ 调号只管「第几级」（根音在 1= 那个调里是几）和破平手，不决定是什么和弦。
//   ④ 打平（差不到 0.1）= 都给出来，显示的人自己写「vi7 / I6」；点开能看全部候选。
// 写法：罗马数字 = 根音在调里是第几级（大写 = 大三度的和弦，小写 = 小三度的；调外的带 ♭ / ♯：B♭ 在 C 调 = ♭VII），后面跟这类和弦的记号（7 / maj7 / ° / ø7 / sus4…）；
//   转位 = 「/」+ 最低音在调里是第几级（C/E 在 C 调 = I/3，同简谱的想法）。
import { type Pitch, STEPS, midiOf, stepIndex, tonicStepIndex, keyAlter } from "../score/pitch.ts";
import { WHOLE, beatTicks } from "../score/song.ts";
import { _t } from "../i18n/index.ts";
import type { HarmonyTheory, HarmonyGuess, HarmonyRead, HarmonyTag, BarInput, ReadOpts, ChordFold } from "./index.ts";
import type { ChordPin } from "../score/song.ts";

interface Tpl { id: string; iv: number[]; opt?: number[]; /** 缺三度（大小分不出来）：大写小写按调里这个根音上面的三度（v0.16.13，user 11-07 截图：A E G 没标）。 */ no3?: boolean; minor: boolean; /** 罗马数字后面写的（小写的已经说了小三度，不再写 m）。 */ rs: string; /** 和弦名（根音字母后面写的，点开看候选用）。 */ sym: string }
/** 和弦表（半音，从根音数；opt = 可以省的音，一般是五度 / 九度）。顺序 = 简单的在前（同分时排前面的赢）。 */
const TPLS: Tpl[] = [
  { id: "maj", iv: [0, 4, 7], minor: false, rs: "", sym: "" },
  { id: "min", iv: [0, 3, 7], minor: true, rs: "", sym: "m" },
  { id: "dim", iv: [0, 3, 6], minor: true, rs: "°", sym: "dim" },
  { id: "aug", iv: [0, 4, 8], minor: false, rs: "+", sym: "aug" },
  { id: "sus4", iv: [0, 5, 7], minor: false, rs: "sus4", sym: "sus4" },
  { id: "sus2", iv: [0, 2, 7], minor: false, rs: "sus2", sym: "sus2" },
  { id: "7", iv: [0, 4, 10], opt: [7], minor: false, rs: "7", sym: "7" },
  { id: "m7", iv: [0, 3, 10], opt: [7], minor: true, rs: "7", sym: "m7" },
  { id: "maj7", iv: [0, 4, 11], opt: [7], minor: false, rs: "maj7", sym: "maj7" },
  { id: "6", iv: [0, 4, 9], opt: [7], minor: false, rs: "6", sym: "6" },
  { id: "m6", iv: [0, 3, 9], opt: [7], minor: true, rs: "6", sym: "m6" },
  { id: "m7b5", iv: [0, 3, 6, 10], minor: true, rs: "ø7", sym: "m7♭5" },
  { id: "dim7", iv: [0, 3, 6, 9], minor: true, rs: "°7", sym: "dim7" },
  { id: "mMaj7", iv: [0, 3, 11], opt: [7], minor: true, rs: "(maj7)", sym: "m(maj7)" },
  { id: "aug7", iv: [0, 4, 8, 10], minor: false, rs: "+7", sym: "aug7" },
  { id: "7sus4", iv: [0, 5, 10], opt: [7], minor: false, rs: "7sus4", sym: "7sus4" },
  { id: "add9", iv: [0, 4, 2], opt: [7], minor: false, rs: "add9", sym: "add9" },
  { id: "madd9", iv: [0, 3, 2], opt: [7], minor: true, rs: "(add9)", sym: "m(add9)" },
  { id: "69", iv: [0, 4, 9, 2], opt: [7], minor: false, rs: "69", sym: "69" },   // 写 69 不写 6/9：斜线只表示转位（统筹 5068622f）
  { id: "9", iv: [0, 4, 10, 2], opt: [7], minor: false, rs: "9", sym: "9" },
  { id: "m9", iv: [0, 3, 10, 2], opt: [7], minor: true, rs: "9", sym: "m9" },
  { id: "maj9", iv: [0, 4, 11, 2], opt: [7], minor: false, rs: "maj9", sym: "maj9" },
  { id: "7b9", iv: [0, 4, 10, 1], opt: [7], minor: false, rs: "7♭9", sym: "7♭9" },
  { id: "7s9", iv: [0, 4, 10, 3], opt: [7], minor: false, rs: "7♯9", sym: "7♯9" },
  { id: "11", iv: [0, 10, 5], opt: [7, 2], minor: false, rs: "11", sym: "11" },
  { id: "m11", iv: [0, 3, 10, 5], opt: [7, 2], minor: true, rs: "11", sym: "m11" },
  { id: "13", iv: [0, 4, 10, 9], opt: [7, 2], minor: false, rs: "13", sym: "13" },
  { id: "m13", iv: [0, 3, 10, 9], opt: [7, 2], minor: true, rs: "13", sym: "m13" },
  { id: "maj13", iv: [0, 4, 11, 9], opt: [7, 2], minor: false, rs: "maj13", sym: "maj13" },
  // 缺三度的（排在最后、算省了一个音）：A E G = Am7 还是 A7 分不出来，大小按调里的写，候选里明说
  { id: "7no3", iv: [0, 7, 10], no3: true, minor: false, rs: "7(no3)", sym: "7(no3)" },
  { id: "maj7no3", iv: [0, 7, 11], no3: true, minor: false, rs: "maj7(no3)", sym: "maj7(no3)" },
];
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];
const ACC = (a: number): string => (a === 0 ? "" : a > 0 ? "♯".repeat(a) : "♭".repeat(-a));
const pc = (p: Pitch): number => ((midiOf(p) % 12) + 12) % 12;

export interface ChordGuess extends HarmonyGuess {
  /** 根音（按下的音里那一个的拼法）。 */ root: Pitch;
  /** 最低音。 */ bass: Pitch;
  tpl: string;
  /** 级数写法：V7、ii、♭VII、I/3（= 谱上写的字）。 */ label: string;
  /** 和弦名：G7、Dm、C/E（点开看候选用）。 */ name: string;
  /** 越小越像；同分 = 打平。 */ cost: number;
  /** 省掉了几个可省的音（缺三度也算一个）。 */ omitted: number;
  /** 缺三度：大小三和弦分不出来，大小写按调里的。 */ no3: boolean;
}
export type ChordRead = HarmonyRead<ChordGuess> & { /** 按哪个音为主数级数。没有 = do。 */ mode?: Mode };
/** 以 do 为主（大调）还是以 la 为主（小调）。v0.16.83 起由人写明：调号记号上的「小调」（user 11-09「在选调号的时候强制一起选。
 *  不过关系大小调对齐」），从 BarNote.minor 带进来；没写 = 从 do 数（和简谱的习惯一样：1 = do）。分析自己不猜（index.ts 文件头 ③；
 *  v0.16.72 的「最后一个音是 la 就从 la 数」撤了，user 11-09「我直觉觉得不妥」）。 */
export type Mode = "do" | "la";
const modeOf = (n: { minor?: true }): Mode => (n.minor ? "la" : "do");
const ID = "western";

/** 这个音在 fifths 那个调里是第几级（1–7）+ 比调里那个音高 / 低几个半音（拼法定）。 */
export function degreeOf(p: Pitch, fifths: number, mode: Mode = "do"): { deg: number; acc: number } {
  const deg = (((stepIndex(p.step) - tonicStepIndex(fifths)) % 7) + 7) % 7, acc = p.alter - keyAlter(p.step, fifths);
  if (mode === "do") return { deg: deg + 1, acc };
  // 以 la 为主（v0.16.72，user 11-09「按曲段认乐理同意」）：从 la 数（la = 1、si = 2、do = 3…sol = 7）；升 sol = 小调的导音，算调内（写 vii°、V 里的三音不带 ♯）
  const d = ((deg - 5 + 7) % 7) + 1;
  return { deg: d, acc: d === 7 && acc === 1 ? 0 : acc };
}
const stepName = (p: Pitch): string => `${p.step}${ACC(p.alter)}`;
/** 调里这个根音上面的三度隔几个半音（3 = 小三度、4 = 大三度）：缺三度的和弦按它定大小写。 */
function diatonicThird(root: Pitch, fifths: number): number {
  const st = STEPS[(stepIndex(root.step) + 2) % 7], up = stepIndex(root.step) + 2 >= 7 ? 1 : 0;
  return (((midiOf({ step: st, alter: keyAlter(st, fifths), octave: root.octave + up }) - midiOf({ ...root, alter: keyAlter(root.step, fifths) })) % 12) + 12) % 12;
}

/** 认和弦：几个音（只有一个音 = null；两个音只认五度和三度 / 六度）+ 调（1= 那个调，几个升降号）。认不出来（表里没有）= null。 */
export function readChord(pitches: readonly Pitch[], fifths: number, mode: Mode = "do"): ChordRead | null {
  const ps = [...pitches].sort((a, b) => midiOf(a) - midiOf(b));
  const set = new Set(ps.map(pc));
  const bass = ps[0], bassPc = pc(bass);
  // 空五度（v0.16.62，user 11-09「和弦级数认「空五度」…本次纪元做」；W-50「大部分写歌的时候都会空三」）：只有两个音、隔五度（带八度重复也算）= 「I5 / V5」，
  //   照流行 / 吉他谱一律大写（没有三度，不说大小）；五度在下面 = 转位「I5/5」。别的两个音（三度、六度…）照旧不认
  if (set.size === 2) {
    const [a, b] = [...set], rootPc = (a + 7) % 12 === b ? a : (b + 7) % 12 === a ? b : null;
    if (rootPc === null) return thirdDyad(ps, fifths, mode);
    const root = ps.find((p) => pc(p) === rootPc)!, r = degreeOf(root, fifths, mode), bd = degreeOf(bass, fifths, mode), slash = rootPc === bassPc ? "" : `/${ACC(bd.acc)}${bd.deg}`;
    const g: ChordGuess = { root, bass, tpl: "5", label: ACC(r.acc) + ROMAN[r.deg - 1] + "5" + slash, name: stepName(root) + "5" + (slash ? `/${stepName(bass)}` : ""), cost: (rootPc === bassPc ? 0 : 1) + (r.acc === 0 ? 0 : 0.25), omitted: 1, no3: true };
    return { theory: ID, best: g, ties: [g], all: [g], ...(mode === "la" ? { mode } : {}) };
  }
  if (set.size < 3) return null;
  const out: ChordGuess[] = [];
  for (const rootPc of set) {
    const root = ps.find((p) => pc(p) === rootPc)!;
    TPLS.forEach((t, ti) => {
      const req = new Set(t.iv.map((i) => (rootPc + i) % 12)), opt = new Set((t.opt ?? []).map((i) => (rootPc + i) % 12));
      for (const x of set) if (!req.has(x) && !opt.has(x)) return;   // 按下的音都得在表里
      for (const x of req) if (!set.has(x)) return;                   // 表里该有的都得有
      const omitted = [...opt].filter((x) => !set.has(x)).length + (t.no3 ? 1 : 0);
      const r = degreeOf(root, fifths, mode), inKey = r.acc === 0;
      const minor = t.no3 ? diatonicThird(root, fifths) === 3 : t.minor;
      const cost = (rootPc === bassPc ? 0 : 1) + omitted * 1.2 + (inKey ? 0 : 0.25) + ti * 0.01;
      const numeral = ACC(r.acc) + (minor ? ROMAN[r.deg - 1].toLowerCase() : ROMAN[r.deg - 1]) + t.rs;
      const b = degreeOf(bass, fifths, mode), slash = rootPc === bassPc ? "" : `/${ACC(b.acc)}${b.deg}`;
      out.push({ root, bass, tpl: t.id, label: numeral + slash, name: stepName(root) + (t.no3 && minor ? "m" : "") + t.sym + (slash ? `/${stepName(bass)}` : ""), cost, omitted, no3: !!t.no3 });
    });
  }
  if (!out.length) return null;
  out.sort((a, b) => a.cost - b.cost);
  const best = out[0];
  return { theory: ID, best, ties: out.filter((g) => g.cost - best.cost < 0.1), all: out, ...(mode === "la" ? { mode } : {}) };
}
/** 三度双音（v0.16.65，user 11-09「好，按你的提议来」：大提琴双音 do-mi 原来不标）：两个音隔三度 / 六度 = 少了五音的三和弦——三度里下面那个音当根音，
 *  五音按调里的补上（放在最高音上面，不动最低音）再认：do-mi = I、re-fa = ii、la-do = vi、si-re = vii°；mi 在下 do 在上 = 转位 I/3。记成省了一个音。
 *  do-mi 也能读成省了根音的 vi，按习惯只取「省五音」这一种。二度、三全音 = null（照旧不标）。 */
function thirdDyad(ps: Pitch[], fifths: number, mode: Mode): ChordRead | null {
  const [a, b] = [...new Set(ps.map(pc))], d = (b - a + 12) % 12;
  const rootPc = d === 3 || d === 4 ? a : d === 8 || d === 9 ? b : null;
  if (rootPc === null) return null;
  const root = ps.find((p) => pc(p) === rootPc)!, st = STEPS[(stepIndex(root.step) + 4) % 7];
  const r = readChord([...ps, { step: st, alter: keyAlter(st, fifths), octave: ps[ps.length - 1].octave + 1 }], fifths, mode);
  const all = (r?.all ?? []).filter((g) => pc(g.root) === rootPc).map((g) => ({ ...g, omitted: g.omitted + 1, cost: g.cost + 1.2 }));
  if (!all.length) return null;
  return { theory: ID, best: all[0], ties: all.filter((g) => g.cost - all[0].cost < 0.1), all, ...(mode === "la" ? { mode } : {}) };
}
/** 标在谱上的那一行字：打平的用「 / 」连起来（最多两个）。 */
export const chordLabel = (r: HarmonyRead): string => r.ties.slice(0, 2).map((g) => g.label).join(" / ") + (r.stale ? "?" : "");   // 人挑的对不上这几个音了 = 带「?」
/** 根音写法（第 19 条）：和 chordLabel 一样的取法，只是每个读法写它的 name（候选小表里的根音名就是这一个）。 */
export const rootChordLabel = (r: HarmonyRead): string => r.ties.slice(0, 2).map((g) => g.name).join(" / ") + (r.stale ? "?" : "");
/** 一个和弦（根音 + 种类 + 最低音）在这个调里怎么写（v0.16.87：人挑过的按这个现算；算法和 readChord 里同一套）。种类不认识 = null。 */
function guessOf(root: Pitch, tplId: string, bass: Pitch, fifths: number, mode: Mode): ChordGuess | null {
  if (tplId.startsWith(FREE)) { const nm = stepName(root) + tplId.slice(FREE.length) + (pc(root) === pc(bass) ? "" : `/${stepName(bass)}`); return { root, bass, tpl: tplId, label: nm, name: nm, cost: 0, omitted: 0, no3: false }; }   // 这一版不认识的种类：只写和弦名，不算级数
  const r = degreeOf(root, fifths, mode), b = degreeOf(bass, fifths, mode), slash = pc(root) === pc(bass) ? "" : `/${ACC(b.acc)}${b.deg}`, nameSlash = slash ? `/${stepName(bass)}` : "";
  if (tplId === "5") return { root, bass, tpl: "5", label: ACC(r.acc) + ROMAN[r.deg - 1] + "5" + slash, name: stepName(root) + "5" + nameSlash, cost: 0, omitted: 1, no3: true };
  const t = TPLS.find((x) => x.id === tplId); if (!t) return null;
  const minor = t.no3 ? diatonicThird(root, fifths) === 3 : t.minor;
  return { root, bass, tpl: t.id, label: ACC(r.acc) + (minor ? ROMAN[r.deg - 1].toLowerCase() : ROMAN[r.deg - 1]) + t.rs + slash, name: stepName(root) + (t.no3 && minor ? "m" : "") + t.sym + nameSlash, cost: 0, omitted: 0, no3: !!t.no3 };
}
/** 和弦种类 ↔ MusicXML <kind>（src/format/musicxml.ts 写 / 读 <harmony> 用；表归这种理论）。没有标准名的 = <kind text="7sus4">other</kind>。
 *  读到 other + 不认识的 text（以后的版本写的 / 别的软件写的）= 种类记成 FREE + text：只写和弦名、不算级数，存的时候原样写回去。 */
const FREE = "?";
const XML_KIND: Record<string, string> = { maj: "major", min: "minor", dim: "diminished", aug: "augmented", sus4: "suspended-fourth", sus2: "suspended-second", "7": "dominant", m7: "minor-seventh", maj7: "major-seventh",
  "6": "major-sixth", m6: "minor-sixth", m7b5: "half-diminished", dim7: "diminished-seventh", mMaj7: "major-minor", aug7: "augmented-seventh", "9": "dominant-ninth", m9: "minor-ninth", maj9: "major-ninth",
  "11": "dominant-11th", m11: "minor-11th", "13": "dominant-13th", m13: "minor-13th", maj13: "major-13th", "5": "power" };
const KIND_BY_XML: Record<string, string> = Object.fromEntries(Object.entries(XML_KIND).map(([k, v]) => [v, k]));
/** 没有标准名的那几种写进文件的字（<kind text="…">other</kind>）。**这张表是文件格式：只许加，不许改已经有的。**
 *  和谱上显示的字（TPLS 的 sym）分开放——v0.16.87 写的是 sym 本身，以后谁改了显示的写法，老歌里的和弦名就认不出种类了（Claude Fable 5.2 2026-11-10 复查时改）。
 *  现在的值 = v0.16.87 当时的 sym，所以那几版存的歌照样认得。守卫 = test/chord-pin.test.ts「每一种和弦在文件里的写法」。 */
const XML_OTHER_TEXT: Record<string, string> = { "7sus4": "7sus4", add9: "add9", madd9: "m(add9)", "69": "6/9", "7b9": "7♭9", "7s9": "7♯9", "7no3": "7(no3)", maj7no3: "maj7(no3)" };
/** 读的时候多认几种别人常见的写法（只读不写）。 */
const OTHER_TEXT_ALIAS: Record<string, string> = { "7b9": "7b9", "7#9": "7s9", "madd9": "madd9", "69": "69", "6add9": "69" };
const KIND_BY_OTHER_TEXT: Record<string, string> = { ...OTHER_TEXT_ALIAS, ...Object.fromEntries(Object.entries(XML_OTHER_TEXT).map(([k, v]) => [v, k])) };
/** 人能挑的和弦种类（测试守「每一种在文件里都有写法」用）。 */
export const PIN_KIND_IDS: readonly string[] = [...TPLS.map((t) => t.id), "5"];
export function pinXmlKind(kind: string): { value: string; text?: string } {
  if (kind.startsWith(FREE)) return { value: "other", text: kind.slice(FREE.length) };
  const std = XML_KIND[kind]; if (std) return { value: std };
  return { value: "other", text: XML_OTHER_TEXT[kind] ?? kind };
}
/** <kind> 的值 + text 属性 → 和弦种类；认不出 = null（调用方数出来报）。 */
export function xmlKindToPin(value: string, text: string | undefined): string | null {
  const std = KIND_BY_XML[value]; if (std) return std;
  if (value !== "other" || !text) return null;
  const own = KIND_BY_OTHER_TEXT[text]; if (own) return own;
  return TPLS.find((t) => t.sym === text && t.sym !== "")?.id ?? FREE + text;   // 别的软件写的字碰巧和我们显示的一样 = 也认（图方便，不算身份）；都不是 = 只留名字
}
const samePin = (a: ChordGuess, b: ChordGuess): boolean => pc(a.root) === pc(b.root) && a.tpl === b.tpl && pc(a.bass) === pc(b.bass);
function pinRead(pin: ChordPin, at: { fifths: number; minor: boolean }, auto: HarmonyRead | undefined): ChordRead | null {
  const root = { ...pin.root, octave: 4 }, bass = { ...(pin.bass ?? pin.root), octave: 3 }, mode: Mode = at.minor ? "la" : "do";
  const g = guessOf(root, pin.kind, bass, at.fifths, mode); if (!g) return null;
  const others = ((auto?.all ?? []) as ChordGuess[]).filter((x) => !samePin(x, g));
  const stale = !!auto && others.length === (auto.all as ChordGuess[]).length;   // 这几个音认得出、但写着的不在候选里
  return { theory: ID, best: g, ties: [g], all: [g, ...others], pinned: true, ...(auto ? { auto: auto as ChordRead } : {}), ...(stale ? { stale: true as const } : {}), ...(mode === "la" ? { mode } : {}) };
}
const pinOf = (guess: HarmonyGuess): ChordPin => {
  const g = guess as ChordGuess;
  return { root: { step: g.root.step, alter: g.root.alter }, kind: g.tpl, ...(pc(g.bass) !== pc(g.root) ? { bass: { step: g.bass.step, alter: g.bass.alter } } : {}) };
};

// ── 折成和弦名（谱面分家第五刀 5-4；UX 稿第 7 节）：能还原就折——照这个名字的标准排法（最低音起、其余一个八度内依次往上、不重复）还原得回这几个音（连拼法）才折。
//   名字多对一没关系（C6 和 Am7/C 还原的是同一组音）= 默认按认的先后（根音是最低音的优先），几个都还原得回 = 有歧义（右下角小三角）。created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟）
/** 从根音数几个半音 → 隔几个字母（拼法）：默认表 + 几种和弦自己的（增五度 = 升五、减七 = 降降七、♯9 = 升二）。 */
const STEPS_OF_IV: readonly number[] = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];
const STEPS_OVERRIDE: Readonly<Record<string, Readonly<Record<number, number>>>> = { aug: { 8: 4 }, aug7: { 8: 4 }, dim7: { 9: 6 }, "7s9": { 3: 1 } };
const NAT_PC = [0, 2, 4, 5, 7, 9, 11];
const pcOfSpelled = (x: { step: Pitch["step"]; alter: number }): number => (((NAT_PC[stepIndex(x.step)]! + x.alter) % 12) + 12) % 12;
/** 这个读法的标准排法（最低音 = 读法里的最低音，八度 = bassOctave；其余各一个、在它上面一个八度之内从低到高）；拼不出来 = null。 */
export function voicingOf(g: ChordGuess, bassOctave: number): Pitch[] | null {
  const t = g.tpl === "5" ? { iv: [0, 7], opt: [] as number[] } : TPLS.find((x) => x.id === g.tpl); if (!t) return null;
  const tones: { step: Pitch["step"]; alter: number }[] = [];
  for (const iv of [...t.iv, ...(t.opt ?? [])]) {
    const li = (stepIndex(g.root.step) + (STEPS_OVERRIDE[g.tpl]?.[iv] ?? STEPS_OF_IV[iv]!)) % 7, target = (pc(g.root) + iv) % 12;
    const alter = ((((target - NAT_PC[li]!) % 12) + 18) % 12) - 6; if (Math.abs(alter) > 2) return null;
    tones.push({ step: STEPS[li]!, alter });
  }
  const bpc = pc(g.bass), b = tones.find((x) => pcOfSpelled(x) === bpc); if (!b) return null;
  const bass: Pitch = { ...b, octave: bassOctave }, bm = midiOf(bass);
  const above = tones.filter((x) => pcOfSpelled(x) !== bpc).map((x) => { let p: Pitch = { ...x, octave: bassOctave - 1 }; while (midiOf(p) <= bm) p = { ...p, octave: p.octave + 1 }; return p; });
  return [bass, ...above.sort((x, y) => midiOf(x) - midiOf(y))];
}
function foldChord(pitches: readonly Pitch[], at: { fifths: number; minor: boolean }, pin: ChordPin | undefined): ChordFold | null {
  if (pitches.length < 2) return null;
  const auto = readChord(pitches, at.fifths, at.minor ? "la" : "do"); if (!auto) return null;
  const ps = [...pitches].sort((x, y) => midiOf(x) - midiOf(y)), lo = ps[0]!;
  const restores = (g: ChordGuess) => { const v = voicingOf(g, lo.octave); return !!v && v.length === ps.length && v.every((p, i) => p.step === ps[i]!.step && p.alter === ps[i]!.alter && p.octave === ps[i]!.octave); };
  const ok = (auto.all as ChordGuess[]).filter(restores); if (!ok.length) return null;
  const ambiguous = new Set(ok.map((g) => g.name)).size > 1;
  if (pin) {   // 人挑的：还原得回 = 按它折；还原不回 = 不折（照画数字，级数照挑的标）
    const rd = pinRead(pin, at, auto); if (!rd || !restores(rd.best as ChordGuess)) return null;
    return { name: rd.best.name, bass: lo, ambiguous, read: rd };
  }
  return { name: ok[0]!.name, bass: lo, ambiguous, read: auto };
}
/** 分解和弦认得出的那几类（完整的三和弦 / 七和弦 / 挂留；加音、省音的不认——旋律里随便几个音凑出来的 add9 之类太多）。 */
const BROKEN_OK = new Set(["maj", "min", "dim", "aug", "sus4", "sus2", "7", "m7", "maj7", "dim7", "m7b5"]);
type Tag = HarmonyTag<ChordRead>;
/** 一小节里的分解和弦（v0.16.62 起；v0.16.65 改成按拍子的轻重一层一层看；v0.16.76 改成手里只有这一小节——index.ts「只看前面」）：
 *  ① 不跨小节（user 11-09「然后不跨小节」「如果用户没有输入articulation的话那么我们唯一知道的就是小节」）。
 *  ② 按拍子的轻重从粗到细看（user 11-09「其实不一定最优是正确的，有时候不应该牵强。而是得看节拍重音启发式的看」）：先看整小节是不是一个和弦；
 *     不是 = 对半切（拍数是双数时切在中间那个次强拍：4/4 第三拍、6/8 第二个大拍、12/8 第三个大拍），再不是 = 一拍一拍看；一拍里面不再往下切。
 *     切口只在拍上；认不出 = 不标，不挪切口去凑。一拍 = 符尾连杠用的那一拍（`beatTicks`：x/4 = 四分，3/8 6/8 9/8 12/8 = 附点四分），所以最细一层 = 符杠的一组；音归它开头那一拍。
 *  ③ 叠音的音不算进来（那里按叠音自己标）；连过来的音（不重新起音）也不算；一组认得出 = 至少三个不同的音、相邻的音全是跳进（≥ 小三度；同一个音重复不算级进）、
 *     认得出一个完整的基本和弦（BROKEN_OK、没省音）。没音高的（休止）跳过。调 = 这一组第一个音那里的调号。
 *  ④ 级数标在一组第一个音下面；和前一组同一个和弦 = 不再标；中间隔着认不出的音 = 重新标。
 *     prev = 前一组标的那行字（空 = 没有 / 被打断了）；上一小节的由 readBar 的 carry 带过来、这一小节的交回去。它只记「刚才标过什么」。
 *  这一小节还在写的时候，读法会跟着往里填音而变（整小节 → 半小节 → 一拍）；小节写过去了就不再变。 */
function brokenInBar(bar: BarInput, prev: string): { tags: Tag[]; prev: string } {
  type N = { i: number; p: Pitch | null; stacked: boolean; fifths: number; mode: Mode; /** 这个音上人写明的和弦怎么写（v0.16.87）。 */ pin: string | null };
  const beatLen = beatTicks(bar.beats, bar.beatType), nb = Math.max(1, Math.round((bar.beats * WHOLE) / bar.beatType / beatLen));
  const beats: N[][] = Array.from({ length: nb }, () => []);
  for (const n of bar.notes) if (!n.tie) beats[Math.min(nb - 1, Math.max(0, Math.floor(n.pos / beatLen + 1e-9)))].push({ i: n.index, p: n.tok.pitch, stacked: !!n.tok.chord?.length, fifths: n.fifths, mode: modeOf(n),
    pin: n.tok.harm ? guessOf({ ...n.tok.harm.root, octave: 4 }, n.tok.harm.kind, { ...(n.tok.harm.bass ?? n.tok.harm.root), octave: 3 }, n.fifths, modeOf(n))?.label ?? null : null });
  const tags: Tag[] = [];
  /** 这几个音是不是一组分解和弦（认得出 = 读法，认不出 = null）。 */
  const groupOf = (ns: N[]): ChordRead | null => {
    const us = ns.filter((n) => n.p && !n.stacked), ps = us.map((n) => n.p!);
    if (new Set(ps.map(pc)).size < 3) return null;
    for (let k = 1; k < ps.length; k++) { const d = Math.abs(midiOf(ps[k]) - midiOf(ps[k - 1])); if (d === 1 || d === 2) return null; }
    const rd = readChord(ps, us[0].fifths, us[0].mode);
    return rd && rd.best.omitted === 0 && BROKEN_OK.has(rd.best.tpl) ? rd : null;
  };
  /** 看拍 [b0, b1)：整段认得出就标；不然按轻重往下切（双数拍对半、单数拍一拍一拍），一拍认不出就算了。 */
  const look = (b0: number, b1: number): void => {
    const ns = beats.slice(b0, b1).flat();
    if (!ns.some((n) => n.p && !n.stacked)) return;   // 只有休止 / 叠音：不标、也不打断
    const rd = groupOf(ns);
    if (rd) {
      const label = chordLabel(rd);
      if (label !== prev) tags.push({ index: ns.find((n) => n.p && !n.stacked)!.i, read: rd });
      prev = label;
      // 这一组里有人写明的和弦（harmonyTags 会在那个音上标它）：谱上看得见的最后一个标签是它——后面那一组照它比，不照自动认的比
      for (const n of ns) if (n.pin && !n.stacked) prev = n.pin;
      return;
    }
    const len = b1 - b0;
    if (len === 1) { prev = ""; return; }
    if (len % 2 === 0 && len > 2) { const mid = b0 + len / 2; look(b0, mid); look(mid, b1); return; }
    for (let b = b0; b < b1; b++) look(b, b + 1);
  };
  look(0, nb);
  return { tags, prev };
}

/** 交给下一小节的东西：只有「分解和弦刚才标的那行字」（同一个和弦不重标）。别的不带——尤其不带「这首歌 / 这一段是什么调式」这一类（index.ts 文件头 ③）。 */
interface Carry { prev: string }
/** 读一小节：叠音的和弦（每个叠音各自认，连过来的也标）+ 分解和弦（brokenInBar；声部开关「不认」= 不做，v0.16.73）。叠音的音不进分解和弦，两路不会撞在同一个音上。 */
function readBar(bar: BarInput, carry: unknown, opts: ReadOpts): { tags: Tag[]; carry: Carry } {
  const tags: Tag[] = [];
  for (const n of bar.notes) { const t = n.tok; if (t.pitch && t.chord?.length) { const rd = readChord([t.pitch, ...t.chord], n.fifths, modeOf(n)); if (rd) tags.push({ index: n.index, read: rd }); } }
  let prev = (carry as Carry | undefined)?.prev ?? "";
  if (opts.broken) { const b = brokenInBar(bar, prev); tags.push(...b.tags); prev = b.prev; }
  return { tags: tags.sort((a, b) => a.index - b.index), carry: { prev } };
}
/** 这一种理论的门面（src/theory/index.ts HarmonyTheory）。 */
export const western: HarmonyTheory = {
  id: ID,
  readBar,
  label: chordLabel,
  rootLabel: rootChordLabel,
  pinRead,
  pinOf,
  fold: foldChord,
  howTo: () => _t("怎么认的：凑得成完整和弦的优先（不省音）→ 最低音当根音的优先 → 根音在这个调里的优先 → 简单的优先。打平的两个都写在谱上。"),
  explain: (guess) => {
    const g = guess as ChordGuess;
    return [g.root.step !== g.bass.step || g.root.alter !== g.bass.alter ? _t("转位（最低音不是根音）") : "", g.no3 ? _t("没有三度：大三和弦还是小三和弦分不出来，按这个调里的写") : "", g.omitted - (g.no3 ? 1 : 0) > 0 ? _t("省了 {n} 个音", { n: g.omitted - (g.no3 ? 1 : 0) }) : ""].filter(Boolean);
  },
};
