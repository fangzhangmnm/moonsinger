// engrave.ts —— 一串 token → 五线谱的绘图指令 + 命中数据（纯函数，Node 里可测）。created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 重写
// 范围：一行高音谱表、单声部；谱头（开头三个记号 token：调号 / 拍号 / 速度）+ 中途的记号 token；符头 / 符干 / 符尾 / 符杠 / 附点 / 临时记号（小节内记忆）/ 加线 / 休止；
// 拆开的时值用连音线连；数据里的 tie（「−」跨小节线开的音）也画连音线；三 / 五 / 六 / 七连音画括号和数字；
// 小节线：按拍号自动数（autoBars，默认开；只画、不进数据，和存 MusicXML 时切小节同一个规则）+ 人插的「|」= 从这里重新数
//   （弱起 = 写完弱起的音按一下「|」；user「按拍号自动画小节线，手插「|」= 从这里重新数 可以啊，试试，然后自动加小节也是可以toggle的，默认开」
//   「嗯弱起就是你写两个音然后加一个小节线，电脑就自动适应了」）。跨过自动小节线的音画成连起来的两段（数据里还是一个音）。
//   拍数和拍号对不上的小节只轻标（第一小节当弱起不标）；歌词在音符下，英文断开处画连字符，拖腔画延长线；空音高的音画淡色。
// 写（光标）：光标 = 一条零宽的竖线，不占排版宽度、不画预览、不打断符杠——挪光标、写 / 改切换时谱面一动不动
//   （user「插入不要在谱上显示音符预览，也不要让谱的排版抖动」；下一个音的时值 / 升降在 pad 工具条和状态行）；
//   点谱面写音 2026-10-07 拿掉（user「先去掉触碰加音符的功能，以后用专门的toolstate做」）。改（选中）：选中的一段高亮。
// 放不下就像文字一样折行，优先在小节线处折；只超出一点的小节压进这一行（整行压紧 ≤ 15%）。右端对齐只给「不是最后一行、而且已经排到六成以上」的行（user「iPhone SE2 一行只有一小节加一大片空白 几个简易试一下」）：
//   正在写的最后一行不对齐 = 打字时前面的音不晃；一行写满折到下一行时，上一行会拉开一次。

import { type Song, type NoteTok, type Token, TPQ, WHOLE, DEFAULT_KEY, DEFAULT_TIME, DEFAULT_BPM, effectivePitch, isTimed, headLen, beatTicks, tempoWord } from "../score/song.ts";
import { type Pitch, diatonicIndex, keyAlter } from "../score/pitch.ts";
import { MELISMA_MARK, lyricShow } from "../score/lyrics.ts";
import { GLYPH, W, ENGRAVE, STEM_UP_SE, STEM_DOWN_NW, FLAG_ANCHOR_UP, FLAG_ANCHOR_DOWN, timeSigDigits } from "./smufl.ts";
import { KEY_LABEL } from "../score/pitch.ts";

export type Prim =
  | { t: "line"; x1: number; y1: number; x2: number; y2: number; w: number; cls?: string }
  | { t: "glyph"; x: number; y: number; ch: string; cls?: string; size?: number /* px，默认 4 sp */ }
  | { t: "text"; x: number; y: number; s: string; cls?: string; size?: number /* px，默认歌词字号 */; anchor?: "start" | "middle" }
  | { t: "path"; d: string; cls?: string }
  | { t: "rect"; x: number; y: number; w: number; h: number; cls?: string };

export interface EngraveOpts {
  width: number;                         // px，谱面板宽
  sp: number;                            // px，五线谱间距
  caret: number;                         // 光标（插入点）
  sel?: { from: number; to: number } | null;   // 有 = 改（没有光标）
  measureLyric: (s: string) => number;   // px，歌词字号 = LYRIC_EM × sp
  titlePlaceholder?: boolean;            // 歌名空着时画浅色的「歌名（可不填）」（编辑器里；导出 / 打印不画）
  autoBars?: boolean;                    // 按拍号自动画小节线（默认开）；关 = 只画人插的「|」
  partName?: string;                     // 声部名（歌手牌），画在第一行谱号左边（第一行缩进让出来，同打谱软件的乐器名）；没有 = 不画
  partEmpty?: boolean;                   // 还没人上场（未选角）：声部名画淡色
  paperLabel?: string;                   // 纸右上角的小钮（「A5」）；点了 = 纸的设置（user「这种应该是纸的右上角有一个可以设置纸的属性吧。加图片的入口以后也可以放那里」）
}
export const LYRIC_EM = 1.6;
const TEMPO_EM = 1.35;   // 速度记号的字号（sp）

export interface SystemBox { top: number; staffTop: number; bottom: number }
export interface HitNote { index: number; system: number; x: number; y: number; w: number; d: number }
export interface Slot { caret: number; system: number; x: number }
export interface LyricHit { index: number; system: number; x: number; y: number }   // x = 歌词中心，y = 基线
/** 记号（调号 / 拍号 / 速度）的点击区域（px）：点了就地改。谱头的调号 = 谱号 + 调号那一块（C 大调没有升降号也点得到）。 */
export interface MarkHit { index: number; kind: "key" | "time" | "tempo"; system: number; x: number; y: number; w: number; h: number }
/** 纸面最上面的歌名那一条（点了就地改）。 */
export interface TitleHit { x: number; y: number; w: number; h: number; baseline: number; size: number }
export interface Layout {
  prims: Prim[]; width: number; height: number; sp: number;
  systems: SystemBox[]; notes: HitNote[]; slots: Slot[]; lyrics: LyricHit[]; marks: MarkHit[]; title: TitleHit;
  head: { system: number; x: number } | null;   // 光标在哪（画面跟随用；改的时候没有）
  part: { x: number; y: number; w: number; h: number } | null;   // 歌手牌（声部名）的点击区域（px）
  paperChip: { x: number; y: number; w: number; h: number } | null;   // 纸右上角小钮的点击区域（px）
  shortBars: number;   // 拍数和拍号对不上的小节有几个（状态行用；第一小节当弱起不算）
  lyricY: (system: number) => number;
  yOf: (system: number, d: number) => number;
  dOf: (system: number, y: number) => number;
}

// ── 尺寸（单位 sp） ─────────────────────────────────────────────────────
const SQUEEZE = 0.15;   // 一行最多压紧多少（音符总宽的比例）
const MARGIN = 1.2, STAFF_ABOVE = 6, SYS_H = 17, LYRIC_BELOW = 5.2, BAR_W = 1.6, TITLE_H = 4.6;   // TITLE_H = 纸面最上面歌名那一条
const TOP_LINE = 38, MID_LINE = 34, BOTTOM_LINE = 30;     // F5 / B4 / E4 的五线谱位置
const SHARP_POS = [38, 35, 39, 36, 33, 37, 34], FLAT_POS = [34, 37, 33, 36, 32, 35, 31];
const GLYPH_TUPLET = (n: number) => [...String(n)].map((d) => String.fromCodePoint(0xe880 + Number(d))).join("");

// ── 时值记法 ────────────────────────────────────────────────────────────
const MIN_PLAIN = TPQ / 8;
const NOTATABLE: { ticks: number; base: number; dotted: boolean }[] = [];
for (let b = WHOLE; b >= MIN_PLAIN; b /= 2) { NOTATABLE.push({ ticks: b * 1.5, base: b, dotted: true }, { ticks: b, base: b, dotted: false }); }
NOTATABLE.sort((a, b) => b.ticks - a.ticks);
/** 把一个（写出来的）时值拆成能记的几段（贪心取最大的；段之间画连音线）。 */
export function splitDur(dur: number): { base: number; dotted: boolean; ticks: number }[] {
  const out: { base: number; dotted: boolean; ticks: number }[] = [];
  let left = dur;
  while (left > 0) {
    const n = NOTATABLE.find((v) => v.ticks <= left && (v.dotted ? v.base >= MIN_PLAIN * 2 : true));
    if (!n) { out.push({ base: MIN_PLAIN, dotted: false, ticks: left }); break; }
    out.push(n); left -= n.ticks;
  }
  return out;
}
/** 连音：n 个占 m 个（照 song.ts TUPLET）。时值不是三十二分的整数倍时，找一个比例让「写出来的时值」能记。 */
const RATIOS: [number, number][] = [[3, 2], [5, 4], [6, 4], [7, 4]];
export function notate(dur: number): { ratio: [number, number] | null; chunks: { base: number; dotted: boolean; ticks: number }[] } {
  if (dur % MIN_PLAIN === 0) return { ratio: null, chunks: splitDur(dur) };
  for (const [n, m] of RATIOS) {
    const written = (dur * n) / m;
    if (Number.isInteger(written) && written % MIN_PLAIN === 0) return { ratio: [n, m], chunks: splitDur(written).map((c) => ({ ...c, ticks: (c.ticks * m) / n })) };
  }
  return { ratio: null, chunks: [{ base: MIN_PLAIN, dotted: false, ticks: dur }] };
}
const flagLevel = (base: number) => (base >= TPQ ? 0 : Math.round(Math.log2(TPQ / base)));
const baseWidth = (base: number) => Math.max(2.2, 3.6 + 0.75 * Math.log2(base / TPQ));   // 四分 3.6，每翻倍 +0.75（2026-10-07 收紧一点：原 4.0 / +0.8，SE2 一行放不下一小节八分）

// ── 排版单元 ────────────────────────────────────────────────────────────
interface Chunk {
  kind: "chunk"; index: number; j: number; last: boolean; base: number; dotted: boolean; note: boolean; ratio: [number, number] | null; ticks: number;
  pitch: Pitch | null; ghost: boolean; tie: boolean; lyric: string | null; hyph: boolean; inBar: number; beat: number; acc: number | null; w: number; accW: number;
  x: number; system: number;
}
interface BarU { kind: "bar"; index: number; w: number; x: number; system: number; warn: boolean; auto: boolean }   // auto = 按拍号自动画的（index = -1，不是 token）
interface KeyU { kind: "key"; index: number; fifths: number; prev: number; w: number; x: number; system: number }
interface TimeU { kind: "time"; index: number; beats: number; beatType: number; w: number; x: number; system: number }
interface TempoU { kind: "tempo"; index: number; bpm: number; w: number; x: number; system: number }
interface HeadU { kind: "head"; w: 0; x: number; system: number }   // 光标：零宽
type Unit = Chunk | BarU | KeyU | TimeU | TempoU | HeadU;
const keyWidth = (fifths: number, prev: number) => (fifths === 0 ? Math.abs(prev) * 0.8 : Math.abs(fifths) * 1.05) + 1.0;
const timeWidth = (beats: number, beatType: number) => Math.max([...String(beats)].length, [...String(beatType)].length) * W.timeSigDigit;

export function engrave(song: Song, o: EngraveOpts): Layout {
  const sp = o.sp, P = (v: number) => v * sp;
  const tokens = song.tokens, sel = o.sel ?? null, writing = !sel;
  const prims: Prim[] = [];
  const inSel = (i: number) => !!sel && i >= sel.from && i < sel.to;

  // 0. 谱头：开头连着的记号，画在每行行首（调号）/ 第一行（拍号、速度），不占排版单元
  const H = headLen(tokens);
  let fifths = DEFAULT_KEY, time = { ...DEFAULT_TIME }, bpm = DEFAULT_BPM;
  const headIdx: Partial<Record<"key" | "time" | "tempo", number>> = {};
  for (let i = 0; i < H; i++) {
    const t = tokens[i];
    if (t.kind === "key") fifths = t.fifths; else if (t.kind === "time") time = { beats: t.beats, beatType: t.beatType }; else if (t.kind === "tempo") bpm = t.bpm;
    if (t.kind === "key" || t.kind === "time" || t.kind === "tempo") headIdx[t.kind] = i;
  }
  const headKey = fifths, headTime = time, headBpm = bpm;

  // 1. 单元 + 临时记号（小节内记忆；小节线、调号清零）+ 小节怎么分
  //   inBar = 这个小节里已经走了多少；满了（= len）不马上画小节线，等下一个音 / 记号 / 写字头 / 曲尾来了再画——
  //   紧跟着的是人插的「|」就用它那一条（不画两条）。拍号中途变了：没写完的这个小节就此结束（同存 MusicXML）。
  const autoBars = o.autoBars !== false;
  const units: Unit[] = [];
  const measureLen = (b: number, bt: number) => (b * WHOLE) / bt;
  let accState = new Map<string, number>(), inBar = 0, measureNo = 0, shortBars = 0;
  let beat = beatTicks(time.beats, time.beatType), len = measureLen(time.beats, time.beatType);
  const pushHead = () => { units.push({ kind: "head", w: 0, x: 0, system: 0 }); };
  const pushBar = (index: number, auto: boolean) => {
    const warn = inBar !== len && measureNo > 0;   // 第一小节 = 弱起，不标
    if (warn) shortBars++;
    units.push({ kind: "bar", index, w: BAR_W, x: 0, system: 0, warn, auto });
    accState = new Map(); inBar = 0; measureNo++;
  };
  const flushFull = () => { if (autoBars && inBar >= len && inBar > 0) pushBar(-1, true); };
  tokens.forEach((t, i) => {
    if (i < H) return;
    if (writing && i === o.caret) { if (t.kind !== "bar") flushFull(); pushHead(); }   // 光标在满了的小节后面 = 画在小节线后面（下一个音写在那）
    if (t.kind === "bar") { pushBar(i, false); return; }
    if (t.kind === "key") {
      flushFull();
      units.push({ kind: "key", index: i, fifths: t.fifths, prev: fifths, w: keyWidth(t.fifths, fifths), x: 0, system: 0 });
      fifths = t.fifths; accState = new Map(); return;
    }
    if (t.kind === "time") {
      if (autoBars && inBar > 0) pushBar(-1, true);
      units.push({ kind: "time", index: i, beats: t.beats, beatType: t.beatType, w: timeWidth(t.beats, t.beatType) + 1.2, x: 0, system: 0 });
      beat = beatTicks(t.beats, t.beatType); len = measureLen(t.beats, t.beatType); return;
    }
    if (t.kind === "tempo") { flushFull(); units.push({ kind: "tempo", index: i, bpm: t.bpm, w: 0.3, x: 0, system: 0 }); return; }
    const isNote = t.kind === "note", nt = t as NoteTok;
    const pitch = isNote ? effectivePitch(tokens, i) : null;
    // 一个音按自动小节线切成几段（不切 = 整个一段，和以前一样记）；每段再拆成能记的时值
    let left = t.dur, j = 0, lastChunk: Chunk | null = null;
    while (left > 1e-6) {
      flushFull();
      const piece = autoBars ? Math.min(left, len - inBar) : left;
      const { ratio, chunks } = notate(piece);
      let off = 0;
      for (const c of chunks) {
        let acc: number | null = null;
        if (pitch && j === 0 && !(isNote && nt.tie)) {
          const key = `${pitch.step}${pitch.octave}`;
          const cur = accState.has(key) ? accState.get(key)! : keyAlter(pitch.step, fifths);
          if (pitch.alter !== cur) { acc = pitch.alter; accState.set(key, pitch.alter); }
        }
        const lyric = isNote && j === 0 && !nt.tie ? nt.lyric : null;
        const accW = acc === null ? 0 : 1.3;
        let w = accW + baseWidth(c.base) + (c.dotted ? 0.6 : 0);
        if (lyric && lyric !== MELISMA_MARK) w = Math.max(w, accW + o.measureLyric(lyricShow(lyric)) / sp + (nt.hyph ? 1.4 : 0.7));
        const u: Chunk = { kind: "chunk", index: i, j, last: false, base: c.base, dotted: c.dotted, note: isNote, ratio, ticks: c.ticks, pitch,
          ghost: isNote && nt.pitch === null, tie: isNote && !!nt.tie && j === 0, lyric, hyph: !!(isNote && nt.hyph && j === 0), inBar: inBar + off, beat, acc, w, accW, x: 0, system: 0 };
        units.push(u); lastChunk = u;
        off += c.ticks; j++;
      }
      inBar += piece; left -= piece;
    }
    if (lastChunk) lastChunk.last = true;
  });
  flushFull();   // 曲尾正好写满：画上这一条小节线
  if (writing && o.caret >= tokens.length) pushHead();

  // 2. 折行（像文字：优先在小节线后折；一个小节都放不下就逐个单元折）。每行开头的调号 = 那里生效的调号
  const right = o.width / sp - MARGIN;
  const PART_EM = LYRIC_EM * 0.85, ind0 = o.partName ? (o.measureLyric(o.partName) * PART_EM) / LYRIC_EM / sp + 1.4 : 0;   // 第一行让给声部名的缩进（sp）
  const headerW = (first: boolean, f: number) => (first ? ind0 : 0) + MARGIN + 0.6 + W.gClef + 1.0 + Math.abs(f) * 1.05 + (f ? 0.8 : 0) + (first ? timeWidth(headTime.beats, headTime.beatType) + 1.2 : 0.4);
  let system = 0, curKey = headKey, x = headerW(true, curKey);
  const sysStarts: number[] = [x], sysKeys: number[] = [curKey];
  const newline = () => { system++; x = headerW(false, curKey); sysStarts.push(x); sysKeys.push(curKey); };
  let seg: Unit[] = [];
  const placed = new Set<Unit>();
  const place = (u: Unit) => { u.x = x; u.system = system; x += u.w; placed.add(u); if (u.kind === "key") curKey = u.fifths; };
  // 挤一挤（user「「稍微超出一点的小节」压进当前行 这个就是我想要的」）：下一个小节只超出这一行音符总宽的 SQUEEZE 以内 = 留在这一行、整行压紧一点（下面右端对齐那一步压）。
  //   还没写完的小节按「已经画上小节线」算超没超——写完那一下不会突然掉到下一行。
  const chunkW = (us: Unit[]) => us.reduce((a, u) => a + (u.kind === "chunk" ? u.w : 0), 0);
  const flush = () => {
    const segW = seg.reduce((s, u) => s + u.w, 0), closed = seg.length > 0 && seg[seg.length - 1].kind === "bar";
    const over = x + segW + (closed ? 0 : BAR_W) - right;
    if (over > 0 && x > sysStarts[system] + 0.01) {
      const lineChunks = chunkW(units.filter((u) => u.system === system && u.x >= sysStarts[system] && placed.has(u))) + chunkW(seg);
      if (over <= lineChunks * SQUEEZE) { for (const u of seg) place(u); seg = []; return; }
      newline();
    }
    for (const u of seg) { if (x + u.w > right && x > sysStarts[system] + 0.01) newline(); place(u); }
    seg = [];
  };
  for (const u of units) { seg.push(u); if (u.kind === "bar") flush(); }
  flush();
  const nSys = system + 1;
  // 右端对齐：多出来的地方按宽度分给这一行的音 / 休止（小节线、记号不拉宽）；挤进来超出的行（最后一行也算）同样按宽度压回来
  for (let s = 0; s < nSys; s++) {
    const row = units.filter((u) => u.system === s);
    const end = row.reduce((m, u) => Math.max(m, u.x + u.w), sysStarts[s]), avail = right - sysStarts[s], used = end - sysStarts[s];
    if (used <= avail + 1e-6 && (s === nSys - 1 || used < avail * 0.6)) continue;
    const grow = row.filter((u) => u.kind === "chunk"), gw = grow.reduce((a, u) => a + u.w, 0);
    if (!gw) continue;
    const k = (avail - used) / gw;
    let x = sysStarts[s];
    for (const u of row) { u.x = x; if (u.kind === "chunk") u.w *= 1 + k; x += u.w; }
  }

  // 3. 坐标系
  const sysTop = (s: number) => P(TITLE_H + 0.5 + s * SYS_H);
  const staffTop = (s: number) => sysTop(s) + P(STAFF_ABOVE);
  const yOf = (s: number, d: number) => staffTop(s) + (TOP_LINE - d) * P(0.5);
  const dOf = (s: number, y: number) => Math.round(TOP_LINE - (y - staffTop(s)) / P(0.5));
  const lyricY = (s: number) => yOf(s, BOTTOM_LINE) + P(LYRIC_BELOW);
  const systems: SystemBox[] = Array.from({ length: nSys }, (_, s) => ({ top: sysTop(s), staffTop: staffTop(s), bottom: sysTop(s) + P(SYS_H) }));

  // 4. 选中的底色（先画，压在最下面）
  if (sel) {
    const byS = new Map<number, [number, number]>();
    for (const u of units) {
      if (u.kind === "head" || !inSel(u.index)) continue;
      const r = byS.get(u.system); const a = u.x, b = u.x + u.w;
      byS.set(u.system, r ? [Math.min(r[0], a), Math.max(r[1], b)] : [a, b]);
    }
    for (const [s, [a, b]] of byS) prims.push({ t: "rect", x: P(a), y: yOf(s, 44), w: P(b - a), h: lyricY(s) + P(0.8) - yOf(s, 44), cls: "selbox" });
  }

  // 5. 五线、谱号、调号、拍号（+ 第一行上方的速度）
  const marks: MarkHit[] = [];
  const drawTime = (s: number, x0: number, beats: number, beatType: number, cls: string) => {
    const num = timeSigDigits(beats), den = timeSigDigits(beatType);
    const wn = [...num].length * W.timeSigDigit, wd = [...den].length * W.timeSigDigit, cw = Math.max(wn, wd);
    prims.push({ t: "glyph", x: P(x0 + (cw - wn) / 2), y: yOf(s, 36), ch: num, cls });
    prims.push({ t: "glyph", x: P(x0 + (cw - wd) / 2), y: yOf(s, 32), ch: den, cls });
    return cw;
  };
  /** 「Andante ♩ = 88」：词 + 四分音符 + 数（user「速度记号可以用语义+数字吗」）。返回点击区域。 */
  const drawTempo = (s: number, x0: number, v: number, cls: string, index: number) => {
    const fs = TEMPO_EM * sp, word = tempoWord(v).it, y = staffTop(s) - P(2.4);
    const ww = (o.measureLyric(word) * TEMPO_EM) / LYRIC_EM / sp, num = `= ${v}`, nw = (o.measureLyric(num) * TEMPO_EM) / LYRIC_EM / sp;
    prims.push({ t: "text", x: P(x0), y, s: word, cls: `${cls} tempo-word`, size: fs, anchor: "start" });
    const gx = x0 + ww + 0.7;
    prims.push({ t: "glyph", x: P(gx), y: y - P(0.3), ch: GLYPH.metNoteQuarterUp, cls, size: fs * 1.75 });
    prims.push({ t: "text", x: P(gx + 1.3), y, s: num, cls: `${cls} tempo-num`, size: fs, anchor: "start" });
    marks.push({ index, kind: "tempo", system: s, x: P(x0 - 0.3), y: y - P(TEMPO_EM * 1.1), w: P(gx + 1.3 + nw + 0.6 - x0), h: P(TEMPO_EM * 1.5) });
  };
  const staffHit = (s: number) => ({ y: yOf(s, TOP_LINE) - P(1.2), h: yOf(s, BOTTOM_LINE) - yOf(s, TOP_LINE) + P(2.4) });
  const drawKeySig = (s: number, x0: number, f: number, cls: string) => {
    const pos = f > 0 ? SHARP_POS : FLAT_POS, ch = f > 0 ? GLYPH.accidentalSharp : GLYPH.accidentalFlat;
    for (let k = 0; k < Math.abs(f); k++) prims.push({ t: "glyph", x: P(x0 + k * 1.05), y: yOf(s, pos[k]), ch, cls });
  };
  for (let s = 0; s < nSys; s++) {
    const ind = s === 0 ? ind0 : 0;
    for (let k = 0; k < 5; k++) { const y = yOf(s, BOTTOM_LINE + 2 * k); prims.push({ t: "line", x1: P(MARGIN + ind), y1: y, x2: P(right), y2: y, w: P(ENGRAVE.staffLine), cls: "staff" }); }
    let hx = MARGIN + ind + 0.6;
    prims.push({ t: "glyph", x: P(hx), y: yOf(s, 32), ch: GLYPH.gClef, cls: "clef" });
    hx += W.gClef + 1.0;
    drawKeySig(s, hx, sysKeys[s], "keysig"); hx += Math.abs(sysKeys[s]) * 1.05;
    if (s === 0) {
      // 谱头记号的点击区域：谱号 + 调号一块（改调号）、拍号（改拍号）、上方速度（改速度）
      if (headIdx.key !== undefined) marks.push({ index: headIdx.key, kind: "key", system: 0, x: P(MARGIN + ind + 0.3), ...staffHit(0), w: P(hx - MARGIN - ind) });
      if (sysKeys[0]) hx += 0.8;
      const cw = drawTime(s, hx, headTime.beats, headTime.beatType, "timesig");
      if (headIdx.time !== undefined) marks.push({ index: headIdx.time, kind: "time", system: 0, x: P(hx - 0.3), ...staffHit(0), w: P(cw + 0.6) });
      if (headIdx.tempo !== undefined) drawTempo(0, MARGIN + ind + 0.6, headBpm, "tempo", headIdx.tempo);
      // 歌手牌：声部名在第一行谱号左边、竖着居中（user「歌手牌同意，和打谱软件对齐」「乐器名可以选择一大堆乐器，然后下面可以in place改」）
      if (o.partName) prims.push({ t: "text", x: P(MARGIN), y: yOf(0, MID_LINE) + P(0.55 * PART_EM), s: o.partName, cls: o.partEmpty ? "part-name empty" : "part-name", size: PART_EM * sp, anchor: "start" });
    }
  }

  // 6. 写字头、小节线、调号 token、休止、符头（+ 临时记号 / 加线 / 附点 / 歌词）
  const notes: HitNote[] = [], lyrics: LyricHit[] = [];
  let head: Layout["head"] = null;
  const curIndex = (() => { if (!writing) return -1; for (let i = o.caret - 1; i >= 0; i--) if (isTimed(tokens[i])) return i; return -1; })();
  const nhX = (c: Chunk) => P(c.x + c.accW + 0.35);
  const nhW = (c: Chunk) => P(c.base >= WHOLE ? W.noteheadWhole : W.noteheadBlack);
  const clsOf = (c: Chunk) => [c.ghost ? "ghost" : "", c.index >= 0 && c.index === curIndex ? "cur" : "", c.index >= 0 && inSel(c.index) ? "sel" : ""].filter(Boolean).join(" ") || undefined;
  const drawChunk = (c: Chunk) => {
    const cls = clsOf(c);
    if (!c.note) {
      const g = c.base >= WHOLE ? GLYPH.restWhole : c.base >= TPQ * 2 ? GLYPH.restHalf : c.base >= TPQ ? GLYPH.restQuarter
        : c.base >= TPQ / 2 ? GLYPH.rest8th : c.base >= TPQ / 4 ? GLYPH.rest16th : GLYPH.rest32nd;
      const ry = c.base >= WHOLE ? yOf(c.system, 36) : yOf(c.system, MID_LINE);
      prims.push({ t: "glyph", x: P(c.x + 0.35), y: ry, ch: g, cls: cls ? `rest ${cls}` : "rest" });
      if (c.dotted) prims.push({ t: "glyph", x: P(c.x + 0.35 + 1.5), y: yOf(c.system, 35), ch: GLYPH.augmentationDot, cls });
      return;
    }
    const d = diatonicIndex(c.pitch!), y = yOf(c.system, d), x0 = nhX(c);
    if (c.acc !== null) {
      const ag = c.acc === 1 ? GLYPH.accidentalSharp : c.acc === -1 ? GLYPH.accidentalFlat : c.acc === 2 ? GLYPH.accidentalDoubleSharp : c.acc === -2 ? GLYPH.accidentalDoubleFlat : GLYPH.accidentalNatural;
      prims.push({ t: "glyph", x: P(c.x + 0.2), y, ch: ag, cls });
    }
    for (let L = 28; L >= d; L -= 2) prims.push({ t: "line", x1: x0 - P(ENGRAVE.ledgerExt), y1: yOf(c.system, L), x2: x0 + nhW(c) + P(ENGRAVE.ledgerExt), y2: yOf(c.system, L), w: P(ENGRAVE.ledger), cls: "ledger" });
    for (let L = 40; L <= d; L += 2) prims.push({ t: "line", x1: x0 - P(ENGRAVE.ledgerExt), y1: yOf(c.system, L), x2: x0 + nhW(c) + P(ENGRAVE.ledgerExt), y2: yOf(c.system, L), w: P(ENGRAVE.ledger), cls: "ledger" });
    const ng = c.base >= WHOLE ? GLYPH.noteheadWhole : c.base >= TPQ * 2 ? GLYPH.noteheadHalf : GLYPH.noteheadBlack;
    prims.push({ t: "glyph", x: x0, y, ch: ng, cls: cls ? `note ${cls}` : "note" });
    if (c.dotted) prims.push({ t: "glyph", x: x0 + nhW(c) + P(0.3), y: yOf(c.system, d % 2 === 0 ? d + 1 : d), ch: GLYPH.augmentationDot, cls });
    if (c.j === 0) notes.push({ index: c.index, system: c.system, x: x0, y, w: nhW(c), d });
    if (c.j === 0 && !c.tie) {
      const ly = lyricY(c.system), cx = x0 + nhW(c) / 2;
      lyrics.push({ index: c.index, system: c.system, x: cx, y: ly });
      if (c.lyric === MELISMA_MARK) prims.push({ t: "line", x1: x0 - P(0.6), y1: ly, x2: x0 + nhW(c) + P(0.4), y2: ly, w: P(0.12), cls: "melisma" });
      else if (c.lyric) prims.push({ t: "text", x: cx, y: ly, s: lyricShow(c.lyric), cls: cls ? `lyric ${cls}` : "lyric" });
    }
  };
  for (const u of units) {
    if (u.kind === "head") {
      head = { system: u.system, x: P(u.x) };
      prims.push({ t: "line", x1: P(u.x + 0.1), y1: yOf(u.system, 42), x2: P(u.x + 0.1), y2: yOf(u.system, 26), w: P(0.16), cls: "caret" });
      continue;
    }
    if (u.kind === "bar") {
      const bx = P(u.x + 0.7);
      prims.push({ t: "line", x1: bx, y1: yOf(u.system, TOP_LINE), x2: bx, y2: yOf(u.system, BOTTOM_LINE), w: P(ENGRAVE.thinBar), cls: u.auto ? "bar auto" : inSel(u.index) ? "bar sel" : "bar" });
      if (u.warn) prims.push({ t: "rect", x: bx - P(0.3), y: yOf(u.system, TOP_LINE) - P(1.6), w: P(0.6), h: P(0.6), cls: "warn" });
      continue;
    }
    if (u.kind === "key") {
      const cls = inSel(u.index) ? "keysig sel" : "keysig";
      if (u.fifths === 0) { const pos = u.prev > 0 ? SHARP_POS : FLAT_POS; for (let k = 0; k < Math.abs(u.prev); k++) prims.push({ t: "glyph", x: P(u.x + 0.4 + k * 0.8), y: yOf(u.system, pos[k]), ch: GLYPH.accidentalNatural, cls }); }
      else drawKeySig(u.system, u.x + 0.4, u.fifths, cls);
      // 换到同一个调、又没有升降号（C → C）：什么都画不出来 → 写个小字，免得成了看不见的记号
      if (u.fifths === 0 && u.prev === 0) prims.push({ t: "text", x: P(u.x + 0.2), y: staffTop(u.system) - P(0.8), s: `1=${KEY_LABEL[0]}`, cls: `${cls} key-label`, size: TEMPO_EM * sp * 0.85, anchor: "start" });
      marks.push({ index: u.index, kind: "key", system: u.system, x: P(u.x), ...staffHit(u.system), w: P(Math.max(u.w, 1.6)) });
      continue;
    }
    if (u.kind === "time") {
      const cls = inSel(u.index) ? "timesig sel" : "timesig";
      drawTime(u.system, u.x + 0.6, u.beats, u.beatType, cls);
      marks.push({ index: u.index, kind: "time", system: u.system, x: P(u.x), ...staffHit(u.system), w: P(u.w) });
      continue;
    }
    if (u.kind === "tempo") { drawTempo(u.system, u.x + 0.3, u.bpm, inSel(u.index) ? "tempo sel" : "tempo", u.index); continue; }
    drawChunk(u);
  }

  // 7. 符干、符杠、符尾（按拍分组：同一拍里连着的八分及更短的音符共用符杠；预览音符单独画）
  type Stemmed = { c: Chunk; x0: number; y: number; d: number };
  const stemmed: Stemmed[][] = [];
  let group: Stemmed[] = [], groupBeat = -1, groupSys = -1;
  const endGroup = () => { if (group.length) stemmed.push(group); group = []; groupBeat = -1; };
  const chunksInOrder: Chunk[] = [];
  for (const u of units) { if (u.kind === "chunk") chunksInOrder.push(u); else if (u.kind !== "head") chunksInOrder.push(null as unknown as Chunk); }   // 光标不打断符杠
  for (const u of chunksInOrder) {
    if (!u || !u.note || u.base >= WHOLE) { endGroup(); continue; }
    const s: Stemmed = { c: u, x0: nhX(u), y: yOf(u.system, diatonicIndex(u.pitch!)), d: diatonicIndex(u.pitch!) };
    if (u.base > TPQ / 2) { endGroup(); stemmed.push([s]); continue; }
    const beat = Math.floor(u.inBar / u.beat);
    if (group.length && (beat !== groupBeat || u.system !== groupSys)) endGroup();
    group.push(s); groupBeat = beat; groupSys = u.system;
  }
  endGroup();
  const stemCls = (s: Stemmed) => clsOf(s.c);
  const tipOf = new Map<Chunk, number>();
  for (const g of stemmed) {
    const sys = g[0].c.system, mid = yOf(sys, MID_LINE);
    const up = g.reduce((a, s) => a + s.d, 0) / g.length < MID_LINE;
    const sx = (s: Stemmed) => (up ? s.x0 + P(STEM_UP_SE[0] - ENGRAVE.stem / 2) : s.x0 + P(STEM_DOWN_NW[0] + ENGRAVE.stem / 2));
    const sy0 = (s: Stemmed) => (up ? s.y - P(STEM_UP_SE[1]) : s.y - P(STEM_DOWN_NW[1]));
    if (g.length === 1) {
      const s = g[0];
      let tip = up ? s.y - P(3.5) : s.y + P(3.5);
      if (up && s.d < 27) tip = Math.min(tip, mid); if (!up && s.d > 41) tip = Math.max(tip, mid);
      tipOf.set(s.c, tip);
      prims.push({ t: "line", x1: sx(s), y1: sy0(s), x2: sx(s), y2: tip, w: P(ENGRAVE.stem), cls: stemCls(s) });
      const lv = flagLevel(s.c.base);
      if (lv > 0) {
        const fx = sx(s) - P(ENGRAVE.stem / 2);
        const fg = up ? [GLYPH.flag8thUp, GLYPH.flag16thUp, GLYPH.flag32ndUp][lv - 1] : [GLYPH.flag8thDown, GLYPH.flag16thDown, GLYPH.flag32ndDown][lv - 1];
        prims.push({ t: "glyph", x: fx, y: up ? tip + P(FLAG_ANCHOR_UP[lv]) : tip + P(FLAG_ANCHOR_DOWN[lv]), ch: fg, cls: stemCls(s) });
      }
      continue;
    }
    const xa = sx(g[0]), xb = sx(g[g.length - 1]);
    const k = Math.max(-0.2, Math.min(0.2, ((g[g.length - 1].y - g[0].y) / (xb - xa)) * 0.5));
    const at = (x: number, y0: number) => y0 + k * (x - xa);
    const y0 = up ? Math.min(...g.map((s) => s.y - P(3.5) - k * (sx(s) - xa))) : Math.max(...g.map((s) => s.y + P(3.5) - k * (sx(s) - xa)));
    for (const s of g) { tipOf.set(s.c, at(sx(s), y0)); prims.push({ t: "line", x1: sx(s), y1: sy0(s), x2: sx(s), y2: at(sx(s), y0), w: P(ENGRAVE.stem), cls: stemCls(s) }); }
    const step = P(ENGRAVE.beam + ENGRAVE.beamGap) * (up ? 1 : -1), th = P(ENGRAVE.beam) * (up ? 1 : -1);
    const beamPath = (xL: number, xR: number, lvl: number) => {
      const of = step * lvl; const a = at(xL, y0) + of, b = at(xR, y0) + of;
      return `M${xL - P(ENGRAVE.stem / 2)},${a}L${xR + P(ENGRAVE.stem / 2)},${b}L${xR + P(ENGRAVE.stem / 2)},${b + th}L${xL - P(ENGRAVE.stem / 2)},${a + th}Z`;
    };
    const gcls = ["beam", g.every((s) => s.c.ghost) ? "ghost" : "", g.every((s) => s.c.index >= 0 && inSel(s.c.index)) ? "sel" : ""].filter(Boolean).join(" ");
    prims.push({ t: "path", d: beamPath(xa, xb, 0), cls: gcls });
    const maxLv = Math.max(...g.map((s) => flagLevel(s.c.base)));
    for (let lvl = 2; lvl <= maxLv; lvl++) {
      let runStart = -1;
      for (let n = 0; n <= g.length; n++) {
        const has = n < g.length && flagLevel(g[n].c.base) >= lvl;
        if (has && runStart < 0) runStart = n;
        if (!has && runStart >= 0) {
          const L = runStart, R = n - 1;
          if (L === R) { const stub = P(1.1), toRight = L < g.length - 1;   // 单独一个更短的音：半截杠，组里最后一个朝左，其余朝右
            prims.push({ t: "path", d: beamPath(toRight ? sx(g[L]) : sx(g[L]) - stub, toRight ? sx(g[L]) + stub : sx(g[L]), lvl - 1), cls: gcls }); }
          else prims.push({ t: "path", d: beamPath(sx(g[L]), sx(g[R]), lvl - 1), cls: gcls });
          runStart = -1;
        }
      }
    }
  }

  // 8. 连音线：同一个 token 拆开的几段之间 + 数据里的 tie（连着前一个音）。跨行的第一版不画
  const tieBetween = (a: Chunk, b: Chunk) => {
    if (a.system !== b.system || !a.pitch || !b.pitch) return;
    const d = diatonicIndex(b.pitch), below = d < MID_LINE, sgn = below ? 1 : -1;
    const y = yOf(b.system, d) + sgn * P(0.8), xa2 = nhX(a) + nhW(a) * 0.8, xb2 = nhX(b) + nhW(b) * 0.2;
    prims.push({ t: "path", d: `M${xa2},${y}Q${(xa2 + xb2) / 2},${y + sgn * P(1.0)} ${xb2},${y}`, cls: b.ghost ? "tie ghost" : "tie" });
  };
  const realChunks = units.filter((u): u is Chunk => u.kind === "chunk");
  for (let n = 1; n < realChunks.length; n++) {
    const a = realChunks[n - 1], b = realChunks[n];
    if (!a.note || !b.note) continue;
    if ((b.j > 0 && a.index === b.index) || (b.tie && a.last)) tieBetween(a, b);
  }

  // 9. 歌词连字符（英文断开的音节）：画在两个歌词中间
  for (let n = 0; n < lyrics.length; n++) {
    const L = lyrics[n], tok = tokens[L.index] as NoteTok;
    if (!tok.hyph) continue;
    const R = lyrics[n + 1];
    const x = R && R.system === L.system ? (L.x + R.x) / 2 : L.x + P(1.6);
    prims.push({ t: "text", x, y: L.y, s: "-", cls: "lyric hyphen" });
  }

  // 10. 连音括号：同一比例连着的一串，凑满「m 个最小写出单位」就收一组
  let run: Chunk[] = [], runRatio: string | null = null, acc = 0, minBase = Infinity;
  const closeRun = () => {
    if (run.length && run[0].ratio) {
      const s = run[0].system, n = run[0].ratio[0];
      const xa = nhX(run[0]), xb = nhX(run[run.length - 1]) + nhW(run[run.length - 1]);
      const top = Math.min(...run.map((c) => Math.min(c.pitch ? yOf(s, diatonicIndex(c.pitch)) : yOf(s, MID_LINE), tipOf.get(c) ?? Infinity)), yOf(s, TOP_LINE)) - P(1.6);
      const mid = (xa + xb) / 2, gap = P(1.0);
      prims.push({ t: "path", d: `M${xa},${top + P(0.6)}L${xa},${top}L${mid - gap},${top}M${mid + gap},${top}L${xb},${top}L${xb},${top + P(0.6)}`, cls: "tuplet-bracket" });
      prims.push({ t: "glyph", x: mid - P(0.55), y: top + P(0.55), ch: GLYPH_TUPLET(n), cls: "tuplet" });
    }
    run = []; runRatio = null; acc = 0; minBase = Infinity;
  };
  for (const c of realChunks) {
    const r = c.ratio ? c.ratio.join(":") : null;
    if (r !== runRatio || (run.length && c.system !== run[0].system)) closeRun();
    if (!r) continue;
    run.push(c); runRatio = r; acc += c.ticks; minBase = Math.min(minBase, c.base);
    if (acc >= c.ratio![1] * minBase - 1e-6) closeRun();
  }
  closeRun();

  // 11. 光标落点（点在哪个空隙）
  const slots: Slot[] = [];
  const firstUnitOf = new Map<number, Unit>();
  for (const u of units) if (u.kind !== "head" && u.index >= 0 && !firstUnitOf.has(u.index)) firstUnitOf.set(u.index, u);
  for (let c = H; c <= tokens.length; c++) {
    const u = c < tokens.length ? firstUnitOf.get(c)! : null;
    if (u) slots.push({ caret: c, system: u.system, x: P(u.x) });
    else { const last = units[units.length - 1]; slots.push({ caret: c, system: last ? last.system : 0, x: last ? P(last.x + last.w) : P(sysStarts[0]) }); }
  }

  // 歌名：纸面最上面居中；空着时编辑器里画浅色提示（可不填）
  const titleSize = P(1.9), titleBase = P(TITLE_H * 0.62);
  if (song.title) prims.push({ t: "text", x: o.width / 2, y: titleBase, s: song.title, cls: "song-title", size: titleSize, anchor: "middle" });
  else if (o.titlePlaceholder) prims.push({ t: "text", x: o.width / 2, y: titleBase, s: "歌名（可不填）", cls: "song-title empty", size: titleSize * 0.8, anchor: "middle" });
  let paperChip: Layout["paperChip"] = null;
  if (o.paperLabel) {   // 纸右上角：一个写着纸张的小钮
    const fs = P(1.15), cw = (o.measureLyric(o.paperLabel) * 1.15) / LYRIC_EM + P(1.4), ch = P(2.2), cx = o.width - P(MARGIN) - cw, cy = P(0.9);
    prims.push({ t: "rect", x: cx, y: cy, w: cw, h: ch, cls: "paper-chip" });
    prims.push({ t: "text", x: cx + cw / 2, y: cy + ch / 2 + fs * 0.36, s: o.paperLabel, cls: "paper-chip-text", size: fs, anchor: "middle" });
    paperChip = { x: cx - P(0.5), y: cy - P(0.5), w: cw + P(1), h: ch + P(1) };
  }
  const title: TitleHit = { x: P(MARGIN), y: P(0.3), w: o.width - P(2 * MARGIN), h: P(TITLE_H), baseline: titleBase, size: titleSize };
  const part = o.partName ? { x: P(MARGIN - 0.4), y: yOf(0, TOP_LINE) - P(1.2), w: P(ind0 + 0.2), h: yOf(0, BOTTOM_LINE) - yOf(0, TOP_LINE) + P(2.4) } : null;
  return { prims, width: o.width, height: P(TITLE_H + nSys * SYS_H + 1), sp, systems, notes, slots, lyrics, marks, title, head, part, paperChip, shortBars, lyricY, yOf, dOf };
}

export type { Token };
