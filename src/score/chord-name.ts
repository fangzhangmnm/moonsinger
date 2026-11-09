// chord-name.ts —— 认和弦 + 写成级数（v0.16.11，辅助：和弦标级数）。纯函数，只给显示用：不进文件、不改谱。
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
import { type Pitch, STEPS, midiOf, stepIndex, tonicStepIndex, keyAlter } from "./pitch.ts";
import { WHOLE, type Token, type NoteTok } from "./song.ts";
import { meterPositions } from "./groove.ts";

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
  { id: "69", iv: [0, 4, 9, 2], opt: [7], minor: false, rs: "6/9", sym: "6/9" },
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

export interface ChordGuess {
  /** 根音（按下的音里那一个的拼法）。 */ root: Pitch;
  /** 最低音。 */ bass: Pitch;
  tpl: string;
  /** 级数写法：V7、ii、♭VII、I/3。 */ roman: string;
  /** 和弦名：G7、Dm、C/E（点开看候选用）。 */ name: string;
  /** 越小越像；同分 = 打平。 */ cost: number;
  /** 省掉了几个可省的音（缺三度也算一个）。 */ omitted: number;
  /** 缺三度：大小三和弦分不出来，大小写按调里的。 */ no3: boolean;
}
export interface ChordRead { best: ChordGuess; /** 和 best 打平的（含 best 自己，按先后）。 */ ties: ChordGuess[]; /** 全部候选（按先后）。 */ all: ChordGuess[] }

/** 这个音在 fifths 那个调里是第几级（1–7）+ 比调里那个音高 / 低几个半音（拼法定）。 */
export function degreeOf(p: Pitch, fifths: number): { deg: number; acc: number } {
  const deg = (((stepIndex(p.step) - tonicStepIndex(fifths)) % 7) + 7) % 7;
  return { deg: deg + 1, acc: p.alter - keyAlter(p.step, fifths) };
}
const stepName = (p: Pitch): string => `${p.step}${ACC(p.alter)}`;
/** 调里这个根音上面的三度隔几个半音（3 = 小三度、4 = 大三度）：缺三度的和弦按它定大小写。 */
function diatonicThird(root: Pitch, fifths: number): number {
  const st = STEPS[(stepIndex(root.step) + 2) % 7], up = stepIndex(root.step) + 2 >= 7 ? 1 : 0;
  return (((midiOf({ step: st, alter: keyAlter(st, fifths), octave: root.octave + up }) - midiOf({ ...root, alter: keyAlter(root.step, fifths) })) % 12) + 12) % 12;
}

/** 认和弦：几个音（三个不同的音以下 = null）+ 调（1= 那个调，几个升降号）。认不出来（表里没有）= null。 */
export function readChord(pitches: readonly Pitch[], fifths: number): ChordRead | null {
  const ps = [...pitches].sort((a, b) => midiOf(a) - midiOf(b));
  const set = new Set(ps.map(pc));
  const bass = ps[0], bassPc = pc(bass);
  // 空五度（v0.16.62，user 11-09「和弦级数认「空五度」…本次纪元做」；W-50「大部分写歌的时候都会空三」）：只有两个音、隔五度（带八度重复也算）= 「I5 / V5」，
  //   照流行 / 吉他谱一律大写（没有三度，不说大小）；五度在下面 = 转位「I5/5」。别的两个音（三度、六度…）照旧不认
  if (set.size === 2) {
    const [a, b] = [...set], rootPc = (a + 7) % 12 === b ? a : (b + 7) % 12 === a ? b : null;
    if (rootPc === null) return null;
    const root = ps.find((p) => pc(p) === rootPc)!, r = degreeOf(root, fifths), bd = degreeOf(bass, fifths), slash = rootPc === bassPc ? "" : `/${ACC(bd.acc)}${bd.deg}`;
    const g: ChordGuess = { root, bass, tpl: "5", roman: ACC(r.acc) + ROMAN[r.deg - 1] + "5" + slash, name: stepName(root) + "5" + (slash ? `/${stepName(bass)}` : ""), cost: (rootPc === bassPc ? 0 : 1) + (r.acc === 0 ? 0 : 0.25), omitted: 1, no3: true };
    return { best: g, ties: [g], all: [g] };
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
      const r = degreeOf(root, fifths), inKey = r.acc === 0;
      const minor = t.no3 ? diatonicThird(root, fifths) === 3 : t.minor;
      const cost = (rootPc === bassPc ? 0 : 1) + omitted * 1.2 + (inKey ? 0 : 0.25) + ti * 0.01;
      const numeral = ACC(r.acc) + (minor ? ROMAN[r.deg - 1].toLowerCase() : ROMAN[r.deg - 1]) + t.rs;
      const b = degreeOf(bass, fifths), slash = rootPc === bassPc ? "" : `/${ACC(b.acc)}${b.deg}`;
      out.push({ root, bass, tpl: t.id, roman: numeral + slash, name: stepName(root) + (t.no3 && minor ? "m" : "") + t.sym + (slash ? `/${stepName(bass)}` : ""), cost, omitted, no3: !!t.no3 });
    });
  }
  if (!out.length) return null;
  out.sort((a, b) => a.cost - b.cost);
  const best = out[0];
  return { best, ties: out.filter((g) => g.cost - best.cost < 0.1), all: out };
}
/** 标在谱上的那一行字：打平的用「 / 」连起来（最多两个）。 */
export const chordLabel = (r: ChordRead): string => r.ties.slice(0, 2).map((g) => g.roman).join(" / ");

/** 分解和弦认得出的那几类（完整的三和弦 / 七和弦 / 挂留；加音、省音的不认——旋律里随便几个音凑出来的 add9 之类太多）。 */
const BROKEN_OK = new Set(["maj", "min", "dim", "aug", "sus4", "sus2", "7", "m7", "maj7", "dim7", "m7b5"]);
/** 分解和弦（v0.16.62，user 11-09「和弦级数认「空五度」和分解和弦。 本次纪元做」；收拢的规矩 AI 定、说给 user，不对再改）：一条 track（一张纸的一个声部）里
 *  ① 按拍号的一拍收拢成一组（6/8、9/8、12/8 这类复拍子 = 附点四分一拍）；一拍里不到三个不同的音 = 并上下一拍，最多到这一小节的尾巴（不跨小节）；
 *  ② 这一组全是单音（有叠音 = 那里本来就按叠音标，这一组不认）、至少三个音、相邻的音全是跳进（≥ 小三度；一步一步走的音阶不算分解和弦）；
 *  ③ 认得出一个完整的基本和弦（BROKEN_OK、没省音）= 级数标在这一组第一个音下面；和前一组是同一个和弦 = 不再标。
 *  keyAt(i) = 第 i 个记号那里的调（几个升降号）。 */
export function brokenChords(tokens: readonly Token[], keyAt: (index: number) => number): { index: number; read: ChordRead }[] {
  const mp = meterPositions(tokens);
  type N = { i: number; p: Pitch | null; stacked: boolean };
  const byBar = new Map<number, { nb: number; beats: N[][] }>();
  for (const [i, m] of mp) {
    const t = tokens[i] as NoteTok, compound = m.beatType === 8 && m.beats % 3 === 0 && m.beats > 3;
    const beatLen = compound ? (3 * WHOLE) / 8 : WHOLE / m.beatType, nb = Math.max(1, Math.round((m.beats * WHOLE) / m.beatType / beatLen));
    const bar = byBar.get(m.bar) ?? { nb, beats: Array.from({ length: nb }, () => []) }; byBar.set(m.bar, bar);
    const k = Math.min(bar.beats.length - 1, Math.max(0, Math.floor(m.pos / beatLen + 1e-9)));
    bar.beats[k].push({ i, p: t.pitch, stacked: !!t.chord?.length });
  }
  const out: { index: number; read: ChordRead }[] = [];
  let prev = "";
  for (const bar of [...byBar.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1])) {
    const hasStack = (k: number) => bar.beats[k].some((n) => n.stacked);
    for (let b = 0; b < bar.beats.length; ) {
      if (hasStack(b)) { b++; prev = ""; continue; }   // 有叠音的拍子：那里按叠音标，自己一组、不往后并
      const win: N[] = [...bar.beats[b]]; let e = b + 1;
      const pcs = () => new Set(win.filter((n) => n.p).map((n) => pc(n.p!))).size;
      while (pcs() < 3 && e < bar.beats.length && !hasStack(e)) win.push(...bar.beats[e++]);
      b = e;
      if (!win.length) continue;
      const ns = win.filter((n) => n.p), ok = !win.some((n) => n.stacked) && ns.length >= 3 && ns.every((n, k) => k === 0 || Math.abs(midiOf(n.p!) - midiOf(ns[k - 1].p!)) >= 3);
      const rd = ok ? readChord(ns.map((n) => n.p!), keyAt(ns[0].i)) : null;
      if (!rd || rd.best.omitted > 0 || !BROKEN_OK.has(rd.best.tpl)) { prev = ""; continue; }
      const label = chordLabel(rd);
      if (label !== prev) out.push({ index: ns[0].i, read: rd });
      prev = label;
    }
  }
  return out;
}
