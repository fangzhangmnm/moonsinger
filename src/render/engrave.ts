// engrave.ts —— 一串 token → 五线谱的绘图指令 + 命中数据（纯函数，Node 里可测）。created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 重写
// 范围：一行高音谱表、单声部；谱头（开头三个记号 token：调号 / 拍号 / 速度）+ 中途的记号 token；符头 / 符干 / 符尾 / 符杠 / 附点 / 临时记号（小节内记忆）/ 加线 / 休止；
// 拆开的时值用连音线连；数据里的 tie（「−」跨小节线开的音）也画连音线；三 / 五 / 六 / 七连音画括号和数字；
// 小节线 = 人插的 token（小节不满只轻标，第一小节当弱起不标）；歌词在音符下，英文断开处画连字符，拖腔画延长线；空音高的音画淡色。
// 写（光标）：光标处撑开写字头，里面画预览音符（下一个音的时值 / 升降 / 连音）；改（选中）：没有写字头，选中的一段高亮。
// 不做右端对齐（打字时前面的音不晃）；放不下就像文字一样折行，优先在小节线处折。

import { type Song, type NoteTok, type Token, TPQ, WHOLE, DEFAULT_KEY, DEFAULT_TIME, DEFAULT_BPM, effectivePitch, barFill, isTimed, headLen, beatTicks, tempoWord } from "../score/song.ts";
import { type Pitch, diatonicIndex, keyAlter } from "../score/pitch.ts";
import { MELISMA_MARK } from "../score/lyrics.ts";
import { GLYPH, W, ENGRAVE, STEM_UP_SE, STEM_DOWN_NW, FLAG_ANCHOR_UP, FLAG_ANCHOR_DOWN, timeSigDigits } from "./smufl.ts";
import { KEY_LABEL } from "../score/pitch.ts";

export type Prim =
  | { t: "line"; x1: number; y1: number; x2: number; y2: number; w: number; cls?: string }
  | { t: "glyph"; x: number; y: number; ch: string; cls?: string; size?: number /* px，默认 4 sp */ }
  | { t: "text"; x: number; y: number; s: string; cls?: string; size?: number /* px，默认歌词字号 */; anchor?: "start" | "middle" }
  | { t: "path"; d: string; cls?: string }
  | { t: "rect"; x: number; y: number; w: number; h: number; cls?: string };

/** 写字头里的预览：下一个音长什么样（时值、升降、连音）；音高先画在上一个音的位置。 */
export interface PreviewOpts { dur: number; acc: 0 | 1 | -1; pitch: Pitch }
export interface EngraveOpts {
  width: number;                         // px，谱面板宽
  sp: number;                            // px，五线谱间距
  caret: number;                         // 光标（插入点）
  sel?: { from: number; to: number } | null;   // 有 = 改（不撑写字头）
  preview?: PreviewOpts | null;          // 写的时候的预览音符
  measureLyric: (s: string) => number;   // px，歌词字号 = LYRIC_EM × sp
}
export const LYRIC_EM = 1.6;
const TEMPO_EM = 1.35;   // 速度记号的字号（sp）

export interface SystemBox { top: number; staffTop: number; bottom: number }
export interface HitNote { index: number; system: number; x: number; y: number; w: number; d: number }
export interface Slot { caret: number; system: number; x: number }
export interface LyricHit { index: number; system: number; x: number; y: number }   // x = 歌词中心，y = 基线
/** 记号（调号 / 拍号 / 速度）的点击区域（px）：点了就地改。谱头的调号 = 谱号 + 调号那一块（C 大调没有升降号也点得到）。 */
export interface MarkHit { index: number; kind: "key" | "time" | "tempo"; system: number; x: number; y: number; w: number; h: number }
export interface Layout {
  prims: Prim[]; width: number; height: number; sp: number;
  systems: SystemBox[]; notes: HitNote[]; slots: Slot[]; lyrics: LyricHit[]; marks: MarkHit[];
  head: { system: number; x: number; w: number } | null;   // 写字头那一列（改的时候没有）
  lyricY: (system: number) => number;
  yOf: (system: number, d: number) => number;
  dOf: (system: number, y: number) => number;
}

// ── 尺寸（单位 sp） ─────────────────────────────────────────────────────
const MARGIN = 1.2, STAFF_ABOVE = 6, SYS_H = 17, LYRIC_BELOW = 5.2, HEAD_W = 4.2, BAR_W = 1.6;
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
const baseWidth = (base: number) => 4.0 + 0.8 * Math.log2(base / TPQ);   // 四分 4.0，每翻倍 +0.8

// ── 排版单元 ────────────────────────────────────────────────────────────
interface Chunk {
  kind: "chunk"; index: number; j: number; last: boolean; base: number; dotted: boolean; note: boolean; ratio: [number, number] | null; ticks: number;
  pitch: Pitch | null; ghost: boolean; tie: boolean; lyric: string | null; hyph: boolean; inBar: number; beat: number; acc: number | null; w: number; accW: number;
  x: number; system: number; preview?: boolean;
}
interface BarU { kind: "bar"; index: number; w: number; x: number; system: number; warn: boolean }
interface KeyU { kind: "key"; index: number; fifths: number; prev: number; w: number; x: number; system: number }
interface TimeU { kind: "time"; index: number; beats: number; beatType: number; w: number; x: number; system: number }
interface TempoU { kind: "tempo"; index: number; bpm: number; w: number; x: number; system: number }
interface HeadU { kind: "head"; w: number; x: number; system: number; chunk: Chunk | null }
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

  // 1. 单元 + 临时记号（小节内记忆；小节线、调号清零）
  const units: Unit[] = [];
  const fills = barFill(song);
  let accState = new Map<string, number>(), inBar = 0, barCount = 0, beat = beatTicks(time.beats, time.beatType);
  const pushHead = () => {
    let chunk: Chunk | null = null;
    if (o.preview) {
      const { ratio, chunks } = notate(o.preview.dur), c0 = chunks[0];
      chunk = { kind: "chunk", index: -1, j: 0, last: true, base: c0.base, dotted: c0.dotted, note: true, ratio, ticks: c0.ticks, pitch: o.preview.pitch, ghost: false, tie: false,
        lyric: null, hyph: false, inBar: 0, beat, acc: o.preview.acc || null, w: HEAD_W, accW: o.preview.acc ? 1.3 : 0, x: 0, system: 0, preview: true };
    }
    units.push({ kind: "head", w: HEAD_W + (o.preview?.acc ? 1.3 : 0), x: 0, system: 0, chunk });
  };
  tokens.forEach((t, i) => {
    if (i < H) return;
    if (writing && i === o.caret) pushHead();
    if (t.kind === "bar") {
      const f = fills[barCount++];
      units.push({ kind: "bar", index: i, w: BAR_W, x: 0, system: 0, warn: barCount > 1 && !!f && !f.full });
      accState = new Map(); inBar = 0; return;
    }
    if (t.kind === "key") {
      units.push({ kind: "key", index: i, fifths: t.fifths, prev: fifths, w: keyWidth(t.fifths, fifths), x: 0, system: 0 });
      fifths = t.fifths; accState = new Map(); return;
    }
    if (t.kind === "time") {
      units.push({ kind: "time", index: i, beats: t.beats, beatType: t.beatType, w: timeWidth(t.beats, t.beatType) + 1.2, x: 0, system: 0 });
      beat = beatTicks(t.beats, t.beatType); return;
    }
    if (t.kind === "tempo") { units.push({ kind: "tempo", index: i, bpm: t.bpm, w: 0.3, x: 0, system: 0 }); return; }
    const isNote = t.kind === "note", nt = t as NoteTok;
    const pitch = isNote ? effectivePitch(tokens, i) : null;
    const { ratio, chunks } = notate(t.dur);
    let off = 0;
    chunks.forEach((c, j) => {
      let acc: number | null = null;
      if (pitch && j === 0 && !(isNote && nt.tie)) {
        const key = `${pitch.step}${pitch.octave}`;
        const cur = accState.has(key) ? accState.get(key)! : keyAlter(pitch.step, fifths);
        if (pitch.alter !== cur) { acc = pitch.alter; accState.set(key, pitch.alter); }
      }
      const lyric = isNote && j === 0 && !nt.tie ? nt.lyric : null;
      const accW = acc === null ? 0 : 1.3;
      let w = accW + baseWidth(c.base) + (c.dotted ? 0.6 : 0);
      if (lyric && lyric !== MELISMA_MARK) w = Math.max(w, accW + o.measureLyric(lyric) / sp + (nt.hyph ? 1.4 : 0.7));
      units.push({ kind: "chunk", index: i, j, last: j === chunks.length - 1, base: c.base, dotted: c.dotted, note: isNote, ratio, ticks: c.ticks, pitch,
        ghost: isNote && nt.pitch === null, tie: isNote && !!nt.tie && j === 0, lyric, hyph: !!(isNote && nt.hyph && j === 0), inBar: inBar + off, beat, acc, w, accW, x: 0, system: 0 });
      off += c.ticks;
    });
    inBar += t.dur;
  });
  if (writing && o.caret >= tokens.length) pushHead();

  // 2. 折行（像文字：优先在小节线后折；一个小节都放不下就逐个单元折）。每行开头的调号 = 那里生效的调号
  const right = o.width / sp - MARGIN;
  const headerW = (first: boolean, f: number) => MARGIN + 0.6 + W.gClef + 1.0 + Math.abs(f) * 1.05 + (f ? 0.8 : 0) + (first ? timeWidth(headTime.beats, headTime.beatType) + 1.2 : 0.4);
  let system = 0, curKey = headKey, x = headerW(true, curKey);
  const sysStarts: number[] = [x], sysKeys: number[] = [curKey];
  const newline = () => { system++; x = headerW(false, curKey); sysStarts.push(x); sysKeys.push(curKey); };
  let seg: Unit[] = [];
  const place = (u: Unit) => { u.x = x; u.system = system; x += u.w; if (u.kind === "key") curKey = u.fifths; };
  const flush = () => {
    const segW = seg.reduce((s, u) => s + u.w, 0);
    if (x + segW > right && x > sysStarts[system] + 0.01) newline();
    for (const u of seg) { if (x + u.w > right && x > sysStarts[system] + 0.01) newline(); place(u); }
    seg = [];
  };
  for (const u of units) { seg.push(u); if (u.kind === "bar") flush(); }
  flush();
  const nSys = system + 1;

  // 3. 坐标系
  const sysTop = (s: number) => P(0.5 + s * SYS_H);
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
    for (let k = 0; k < 5; k++) { const y = yOf(s, BOTTOM_LINE + 2 * k); prims.push({ t: "line", x1: P(MARGIN), y1: y, x2: P(right), y2: y, w: P(ENGRAVE.staffLine), cls: "staff" }); }
    let hx = MARGIN + 0.6;
    prims.push({ t: "glyph", x: P(hx), y: yOf(s, 32), ch: GLYPH.gClef, cls: "clef" });
    hx += W.gClef + 1.0;
    drawKeySig(s, hx, sysKeys[s], "keysig"); hx += Math.abs(sysKeys[s]) * 1.05;
    if (s === 0) {
      // 谱头记号的点击区域：谱号 + 调号一块（改调号）、拍号（改拍号）、上方速度（改速度）
      if (headIdx.key !== undefined) marks.push({ index: headIdx.key, kind: "key", system: 0, x: P(MARGIN + 0.3), ...staffHit(0), w: P(hx - MARGIN - 0.3 + 0.3) });
      if (sysKeys[0]) hx += 0.8;
      const cw = drawTime(s, hx, headTime.beats, headTime.beatType, "timesig");
      if (headIdx.time !== undefined) marks.push({ index: headIdx.time, kind: "time", system: 0, x: P(hx - 0.3), ...staffHit(0), w: P(cw + 0.6) });
      if (headIdx.tempo !== undefined) drawTempo(0, MARGIN + 0.6, headBpm, "tempo", headIdx.tempo);
    }
  }

  // 6. 写字头、小节线、调号 token、休止、符头（+ 临时记号 / 加线 / 附点 / 歌词）
  const notes: HitNote[] = [], lyrics: LyricHit[] = [];
  let head: Layout["head"] = null;
  const curIndex = (() => { if (!writing) return -1; for (let i = o.caret - 1; i >= 0; i--) if (isTimed(tokens[i])) return i; return -1; })();
  const nhX = (c: Chunk) => P(c.x + c.accW + 0.35);
  const nhW = (c: Chunk) => P(c.base >= WHOLE ? W.noteheadWhole : W.noteheadBlack);
  const clsOf = (c: Chunk) => [c.preview ? "preview" : "", c.ghost ? "ghost" : "", c.index >= 0 && c.index === curIndex ? "cur" : "", c.index >= 0 && inSel(c.index) ? "sel" : ""].filter(Boolean).join(" ") || undefined;
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
    for (let L = 28; L >= d; L -= 2) prims.push({ t: "line", x1: x0 - P(ENGRAVE.ledgerExt), y1: yOf(c.system, L), x2: x0 + nhW(c) + P(ENGRAVE.ledgerExt), y2: yOf(c.system, L), w: P(ENGRAVE.ledger), cls: c.preview ? "ledger preview" : "ledger" });
    for (let L = 40; L <= d; L += 2) prims.push({ t: "line", x1: x0 - P(ENGRAVE.ledgerExt), y1: yOf(c.system, L), x2: x0 + nhW(c) + P(ENGRAVE.ledgerExt), y2: yOf(c.system, L), w: P(ENGRAVE.ledger), cls: c.preview ? "ledger preview" : "ledger" });
    const ng = c.base >= WHOLE ? GLYPH.noteheadWhole : c.base >= TPQ * 2 ? GLYPH.noteheadHalf : GLYPH.noteheadBlack;
    prims.push({ t: "glyph", x: x0, y, ch: ng, cls: cls ? `note ${cls}` : "note" });
    if (c.dotted) prims.push({ t: "glyph", x: x0 + nhW(c) + P(0.3), y: yOf(c.system, d % 2 === 0 ? d + 1 : d), ch: GLYPH.augmentationDot, cls });
    if (c.preview && c.ratio) prims.push({ t: "glyph", x: x0, y: yOf(c.system, Math.max(d + 9, 44)), ch: GLYPH_TUPLET(c.ratio[0]), cls: "tuplet preview" });
    if (c.index < 0) return;
    if (c.j === 0) notes.push({ index: c.index, system: c.system, x: x0, y, w: nhW(c), d });
    if (c.j === 0 && !c.tie) {
      const ly = lyricY(c.system), cx = x0 + nhW(c) / 2;
      lyrics.push({ index: c.index, system: c.system, x: cx, y: ly });
      if (c.lyric === MELISMA_MARK) prims.push({ t: "line", x1: x0 - P(0.6), y1: ly, x2: x0 + nhW(c) + P(0.4), y2: ly, w: P(0.12), cls: "melisma" });
      else if (c.lyric) prims.push({ t: "text", x: cx, y: ly, s: c.lyric, cls: cls ? `lyric ${cls}` : "lyric" });
    }
  };
  for (const u of units) {
    if (u.kind === "head") {
      head = { system: u.system, x: P(u.x), w: P(u.w) };
      prims.push({ t: "rect", x: P(u.x + 0.2), y: yOf(u.system, 44), w: P(u.w - 0.4), h: yOf(u.system, 24) - yOf(u.system, 44), cls: "head" });
      prims.push({ t: "line", x1: P(u.x + 0.2), y1: yOf(u.system, 42), x2: P(u.x + 0.2), y2: yOf(u.system, 26), w: P(0.16), cls: "caret" });
      if (u.chunk) { u.chunk.x = u.x + 0.5; u.chunk.system = u.system; drawChunk(u.chunk); }
      continue;
    }
    if (u.kind === "bar") {
      const bx = P(u.x + 0.7);
      prims.push({ t: "line", x1: bx, y1: yOf(u.system, TOP_LINE), x2: bx, y2: yOf(u.system, BOTTOM_LINE), w: P(ENGRAVE.thinBar), cls: inSel(u.index) ? "bar sel" : "bar" });
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
  for (const u of units) { if (u.kind === "chunk") chunksInOrder.push(u); else if (u.kind === "head" && u.chunk) chunksInOrder.push(u.chunk); else chunksInOrder.push(null as unknown as Chunk); }
  for (const u of chunksInOrder) {
    if (!u || !u.note || u.base >= WHOLE) { endGroup(); continue; }
    const s: Stemmed = { c: u, x0: nhX(u), y: yOf(u.system, diatonicIndex(u.pitch!)), d: diatonicIndex(u.pitch!) };
    if (u.preview || u.base > TPQ / 2) { endGroup(); stemmed.push([s]); continue; }
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
  for (const u of units) if (u.kind !== "head" && !firstUnitOf.has(u.index)) firstUnitOf.set(u.index, u);
  for (let c = H; c <= tokens.length; c++) {
    const u = c < tokens.length ? firstUnitOf.get(c)! : null;
    if (u) slots.push({ caret: c, system: u.system, x: P(u.x) });
    else { const last = units[units.length - 1]; slots.push({ caret: c, system: last ? last.system : 0, x: last ? P(last.x + last.w) : P(sysStarts[0]) }); }
  }

  return { prims, width: o.width, height: P(nSys * SYS_H + 1), sp, systems, notes, slots, lyrics, marks, head, lyricY, yOf, dOf };
}

export type { Token };
