// measure.ts —— 五线谱这一种行的「量」：一条轨 → 列条目（每个排版单元往左 / 往右占多宽、管多长）+ 行首多宽；还有谱上的位置（第几级）和符干的输入。
//   created 2026-11-11 by Claude Opus 5.5（谱面分家施工单 1b-4；代码原样从 engrave.ts 搬出：posD / shAt / percAt / stemInput / restW / spItems / headerOf）。
//   「量」是一条轨的纯函数：进来的东西全在 StaffTrack 里（不读别的轨、不改单元）；以后加缓存就是在外面包一层（施工单第五节裁定 2）。
import type { Token, ClefName, Staff } from "../../score/song.ts";
import { TPQ, WHOLE } from "../../score/song.ts";
import { type Pitch, diatonicIndex, midiOf } from "../../score/pitch.ts";
import { CLEF_SHIFT, ottavaShift } from "../../score/clef.ts";
import { percOf, type PercInfo } from "../../gm/percussion.ts";
import { W, FLAG_W } from "../smufl.ts";
import { layoutStems, type StemNote, type StemDir } from "../stems.ts";
import type { SpItem } from "../spacing.ts";
import { SLOT, type ColumnKind } from "../frame/columns.ts";
import type { ColEntry } from "../frame/arrange.ts";
import type { PartView } from "../engrave.ts";
import { TOP_LINE, MID_LINE } from "./glyphs.ts";
import { timeWidth, type Unit, type Chunk, type Head } from "./units.ts";
import { MELISMA_MARK } from "../../score/lyrics.ts";

/** 一条要排的五线谱轨（一个声部在这张纸上；合租叠出来的虚拟轨、声部 2、双手谱下面那张也各是一条）。 */
export interface StaffTrack {
  p: PartView; tokens: Token[]; realLen: number; realTicks: number; focused: boolean; staves: 1 | 2; start: ClefName;
  ds: { clef: ClefName[]; ott: number[]; auto: boolean[] | null; runs: { from: number; to: number; shift: 1 | 2 | -1 }[] };
  fFam: boolean; vrt: boolean; units: Unit[]; head: Head; shortBars: number; pickup: boolean;
  /** 鼓谱：一线谱 / 五线鼓谱 / 不是鼓。 */
  pmode: "five" | "one" | null;
  /** 声部 2（画在主人那一行、符干朝下）/ 这一行有声部 2（符干朝上）。 */
  v2: boolean; hasV2: boolean;
}

/** 同一个实际音高在谱上要挪几级：谱号 + 八度线（index < 0 = 这张纸开头的谱号）。大谱表 = 上高音下低音。 */
export const shAt = (q: StaffTrack, staff: Staff, index: number): number => {
  return q.staves === 2 ? (staff === 2 ? 12 : 0) : CLEF_SHIFT[(index >= 0 ? q.ds.clef[index] : undefined) ?? q.start] + ottavaShift(index >= 0 ? q.ds.ott[index] ?? 0 : 0);
};
/** 这个音在鼓谱上的写法（哪一线 / 符头 / 符干）：整套鼓按写的音高（= GM 鼓键）查；固定敲一件的就是那一件。 */
export const percAt = (q: StaffTrack, p: Pitch): PercInfo | null => { const pk = q.p.perc; return !pk ? null : pk.kind === "kit" ? percOf(128, 0, midiOf(p)) : pk.info; };
/** 谱上的位置（级数）：鼓谱 = 一线谱那条线（一线谱的高 / 低音 ±1）/ 五线鼓谱按 MuseScore 的 line（0 = 第五线，往下 +1 走半格）；有音高 = 实际音高 + 谱号 / 八度线。 */
export const posD = (q: StaffTrack, p: Pitch, staff: Staff, index: number): number => {
  const m = q.pmode;
  if (m && q.p.perc) { const pi = percAt(q, p); return m === "one" ? MID_LINE - (pi && pi.staff === 1 ? pi.line : 0) : TOP_LINE - (pi ? pi.line : 4); }
  return diatonicIndex(p) + shAt(q, staff, index);
};
/** 刀 4a：一条 track 交给 stems.ts 的那一串（null = 打断符杠）+ 朝向的规矩。x = 符头左缘，单位由调用方定（横向间距那一步还不知道 x，给 0.35 = 相对对齐线）。 */
export const stemInput = (q: StaffTrack, xOf: (u: Chunk) => number): { seq: (StemNote<Chunk> | null)[]; dir: StemDir } => {
  const pm = q.pmode, percHere = !!pm && !!q.p.perc, seq: (StemNote<Chunk> | null)[] = [];
  for (const u of q.units) {
    if (u.kind === "bar" || u.kind === "key" || u.kind === "time") { seq.push(null); continue; }
    if (u.kind !== "chunk") continue;
    if (!u.note || u.base >= WHOLE) { seq.push(null); continue; }
    const ps = u.pitches.length ? u.pitches : [u.pitch!], ds = ps.map((pp) => posD(q, pp, u.staff, u.index));
    seq.push({ key: u, x: xOf(u), dHi: ds[0], dLo: ds[ds.length - 1], base: u.base, beat: Math.floor(u.inBar / u.beat), system: u.system, staff: u.staff, ghost: u.ghost,
      ...(percHere && pm !== "one" && ps.some((p) => percAt(q, p)?.stem !== "down") ? { handUp: true } : {}) });   // 鼓谱：手打朝上、脚踩朝下（一组里有手打的 = 朝上）
  }
  return { seq, dir: q.v2 ? "down" : q.hasV2 ? "up" : percHere ? (pm === "one" ? "up" : "kit") : "auto" };   // 声部 2 朝下、有声部 2 的朝上、一线谱一律朝上
};
const restW = (base: number) => (base >= WHOLE ? W.restWhole : base >= TPQ * 2 ? W.restHalf : base >= TPQ ? W.restQuarter : base >= TPQ / 2 ? W.rest8th : base >= TPQ / 4 ? W.rest16th : W.rest32nd);
/** 排版单元的种类 → 框架那张先后表里的种类。 */
const COLUMN_KIND: Record<Unit["kind"], ColumnKind> = { bar: "bar", nav: "nav", clef: "clef", key: "key", time: "time", tempo: "tempo", groove: "groove", dyn: "dyn", ottava: "ottava", hairpin: "hairpin", head: "tail", chunk: "note" };

/** 量（设计稿第 3.3 节第 3 步）：这条轨的每个排版单元 → 一个列条目。道号是这条轨自己的：第几张谱表 × 2，歌词那一道 +1（框架加上这条轨的道基数）。
 *  inkL = 这个音的墨往对齐线左边伸多远（sp；临时记号 / 括号 / 琶音线）：光标画在它左边（刀 3）。 */
export function measureTrack(q: StaffTrack): { entries: ColEntry<Unit>[]; inkL: Map<Chunk, number> } {
  // 没连杠的符尾往右伸（刀 3 留的、刀 4a 补）：符干朝上的八分 / 十六分，墨从对齐线往右到约 2.5（符头才到 1.53）。行还没折，连杠按「不换行」算（一拍里折行只在一个小节一行都放不下时才有）
  const flagRight = new Map<Chunk, number>();
  { const si = stemInput(q, () => 0.35); for (const [c, st] of layoutStems(si.seq, si.dir).notes) if (st.flag) flagRight.set(c, st.flag.x + FLAG_W[st.up ? "up" : "down"][st.flag.level - 1]); }
  const inkL = new Map<Chunk, number>();
  const lane = (staff: Staff) => (staff - 1) * 2;   // 同一条谱表上的才会撞；声部 2 画在主人那一行（框架给的道基数 = 主人的）
  const spItems = (u: Chunk): SpItem[] => {
    const out: SpItem[] = [], row = lane(u.staff);
    if (!u.note) {
      if (u.pad || q.v2 || u.mrest) return out;   // 补齐的 / 声部 2 的空不画；整小节休止画在小节正中，都不参加间距
      out.push({ row, left: -0.35, right: 0.35 + (u.dotted ? 1.5 + 0.45 : restW(u.base)), dur: u.ticks });
      return out;
    }
    const nhw = u.base >= WHOLE ? W.noteheadWhole : W.noteheadBlack, perc = !!q.pmode && !!q.p.perc;
    const ds = (u.pitches.length ? u.pitches : u.pitch ? [u.pitch] : []).map((pp) => posD(q, pp, u.staff, u.index));
    const second = ds.some((d, k) => k > 0 && Math.abs(ds[k - 1] - d) === 1);
    let right = 0.35 + nhw * (second ? 1.95 : 1), left = -0.35;
    if (u.dotted) right = Math.max(right, 0.35 + nhw + 0.3 + 0.45);
    const fr = flagRight.get(u); if (fr !== undefined) right = Math.max(right, fr);
    const nAcc = perc ? [] : u.accs.map((a, k) => (a === null ? -1 : k)).filter((k) => k >= 0);
    if (nAcc.length) left = 1.1 + (nAcc.some((k, i) => i > 0 && Math.abs(ds[nAcc[i - 1]] - ds[k]) < 3) ? 1.1 : 0);
    const ghost = u.art.includes("ghost");
    if (ghost) { left = nAcc.length ? left + 0.6 : Math.max(left, 0.15); right += 0.45; }   // 括号（符头左 0.6 / 右 0.25 起，各约 0.3 宽）很细：两个音的括号允许几乎贴上（密的幽灵音滚奏不至于一个小节一行）
    if (u.art.includes("arpeggio")) left = Math.max(left, (nAcc.length ? 1.3 : 0) + 0.83);
    if (u.breath) right = Math.max(right, 0.35 + nhw + 0.55 + 0.85);
    if (u.breath && u.inhale) right = Math.max(right, 0.35 + nhw + 1.35 + (u.inhale === "big" ? 2.3 : 1.15));
    inkL.set(u, Math.max(0, left));
    out.push({ row, left, right, dur: u.ticks });
    if (u.lyW !== undefined && !q.v2) out.push({ row: lane(q.staves as Staff) + 1, left: u.lyW / 2 - 0.94, right: 0.94 + u.lyW / 2 + 0.4 + (u.hyph ? 0.7 : 0) });   // 按歌词排：字和字之间不撞（同一套顶杆）
    return out;
  };
  const entries = q.units.map((u): ColEntry<Unit> => ({ tick: u.tick, slot: u.kind === "nav" ? u.slot : SLOT[COLUMN_KIND[u.kind]], w: u.w, ...(u.kind === "bar" ? { bar: true } : {}), ...(u.kind === "chunk" ? { chunk: { items: spItems(u), span: u.ticks } } : {}), ref: u }));
  return { entries, inkL };
}

export const clefW = (q: { fFam: boolean }) => (q.fFam ? W.fClef : W.gClef);
/** 行首多宽（sp）：base = 框架给的（名字一栏的缩进 + 边距），后面是这条轨行首要画的：谱号 + 调号（key = 那里生效的调号）+ 第一行的拍号。加的先后照原来（浮点逐位相同）。 */
export const lineStartWidth = (q: StaffTrack, key: number, first: boolean, base: number): number =>
  base + 0.6 + clefW(q) + 1.0 + Math.abs(key) * 1.05 + (key ? 0.8 : 0) + (first ? timeWidth(q.head.time.beats, q.head.time.beatType) + 1.2 : 0.4);

/** 歌词按节奏排（框架的歌词让路）要的：这条轨每个带字的音在第几行、字的中心在哪（sp：对齐线往右 0.6）。拖腔线不算。 */
export const lyricAnchors = (q: StaffTrack): { index: number; system: number; cx: number; lyric: string; hyph: boolean }[] =>
  q.units.filter((u): u is Chunk => u.kind === "chunk" && !!u.lyric && u.lyric !== MELISMA_MARK).map((u) => ({ index: u.index, system: u.system, cx: u.x + 0.6, lyric: u.lyric!, hyph: u.hyph }));
