// engrave.ts —— 一串 token → 五线谱的绘图指令 + 命中数据（纯函数，Node 里可测）。created 2026-10-06 by Claude Opus 5.5
// 第一版范围（grill 账本 §8½）：一行高音谱表、单声部；调号、拍号；符头 / 符干 / 符尾 / 符杠 / 附点 / 临时记号 / 加线 / 休止 /
// 拆开的时值用连音线连（例：一拍又四分之一 = 四分 ⌒ 十六分）；小节线 = 人插的 token（小节不满只轻标，第一小节当弱起不标）；
// 歌词写在音符下；空音高的音画成淡色（显示的是它继承来的音高）；光标处撑开一列「写字头」（下一个音写在这里）。
// 不做右端对齐（打字时前面的音不晃）；放不下就像文字一样折行，优先在小节线处折。

import { type Song, type NoteTok, TPQ, BEAT, effectivePitch, barFill } from "../score/song.ts";
import { type Pitch, diatonicIndex, keyAlter } from "../score/pitch.ts";
import { MELISMA_MARK } from "../score/lyrics.ts";
import { GLYPH, W, ENGRAVE, STEM_UP_SE, STEM_DOWN_NW, FLAG_ANCHOR_UP, FLAG_ANCHOR_DOWN, timeSigDigits } from "./smufl.ts";

export type Prim =
  | { t: "line"; x1: number; y1: number; x2: number; y2: number; w: number; cls?: string }
  | { t: "glyph"; x: number; y: number; ch: string; cls?: string }
  | { t: "text"; x: number; y: number; s: string; cls?: string }
  | { t: "path"; d: string; cls?: string }
  | { t: "rect"; x: number; y: number; w: number; h: number; cls?: string };

export interface EngraveOpts {
  width: number;                         // px，谱面板宽
  sp: number;                            // px，五线谱间距
  caret: number;                         // 光标（插入点）
  measureLyric: (s: string) => number;   // px，歌词字号 = LYRIC_EM × sp
}
export const LYRIC_EM = 1.6;

export interface SystemBox { top: number; staffTop: number; bottom: number }
export interface HitNote { index: number; system: number; x: number; y: number; w: number; d: number }
export interface Slot { caret: number; system: number; x: number }
export interface Layout {
  prims: Prim[]; width: number; height: number; sp: number;
  systems: SystemBox[]; notes: HitNote[]; slots: Slot[];
  head: { system: number; x: number; w: number };   // 写字头那一列
  yOf: (system: number, d: number) => number;
  dOf: (system: number, y: number) => number;
}

// ── 尺寸（单位 sp） ─────────────────────────────────────────────────────
const MARGIN = 1.2, STAFF_ABOVE = 6, SYS_H = 17, LYRIC_BELOW = 5.2, HEAD_W = 3.4, BAR_W = 1.6;
const TOP_LINE = 38, MID_LINE = 34, BOTTOM_LINE = 30;     // F5 / B4 / E4 的五线谱位置
const SHARP_POS = [38, 35, 39, 36, 33, 37, 34], FLAT_POS = [34, 37, 33, 36, 32, 35, 31];
const WHOLE = TPQ * 4;

// ── 时值拆分 ────────────────────────────────────────────────────────────
const NOTATABLE: { ticks: number; base: number; dotted: boolean }[] = [];
for (let b = WHOLE; b >= TPQ / 8; b /= 2) { NOTATABLE.push({ ticks: b * 1.5, base: b, dotted: true }, { ticks: b, base: b, dotted: false }); }
NOTATABLE.sort((a, b) => b.ticks - a.ticks);
/** 把一个时值拆成可以记出来的几段（贪心取最大的；拆开的段之间画连音线）。 */
export function splitDur(dur: number): { base: number; dotted: boolean; ticks: number }[] {
  const out: { base: number; dotted: boolean; ticks: number }[] = [];
  let left = dur;
  while (left > 0) {
    const n = NOTATABLE.find((v) => v.ticks <= left && v.ticks >= TPQ / 8 && (v.dotted ? v.base >= TPQ / 8 * 2 : true));
    if (!n) { out.push({ base: TPQ / 8, dotted: false, ticks: left }); break; }
    out.push(n); left -= n.ticks;
  }
  return out;
}
const flagLevel = (base: number) => (base >= TPQ ? 0 : Math.round(Math.log2(TPQ / base)));
const baseWidth = (base: number) => 4.0 + 0.8 * Math.log2(base / TPQ);   // 四分 4.0，每翻倍 +0.8

// ── 排版单元 ────────────────────────────────────────────────────────────
interface Chunk {
  kind: "chunk"; index: number; j: number; base: number; dotted: boolean; note: boolean;
  pitch: Pitch | null; ghost: boolean; lyric: string | null; inBar: number; acc: number | null; w: number; accW: number;
  x: number; system: number;
}
interface BarU { kind: "bar"; index: number; w: number; x: number; system: number; warn: boolean }
interface HeadU { kind: "head"; w: number; x: number; system: number }
type Unit = Chunk | BarU | HeadU;

export function engrave(song: Song, o: EngraveOpts): Layout {
  const sp = o.sp, P = (v: number) => v * sp;
  const tokens = song.tokens, fifths = song.fifths;
  const prims: Prim[] = [];

  // 1. 单元 + 临时记号（小节内记忆，小节线清零；第一段起算的位置从上一条小节线算）
  const units: Unit[] = [];
  const fills = barFill(song);
  let accState = new Map<string, number>(), inBar = 0, barCount = 0;
  const pushHead = () => units.push({ kind: "head", w: HEAD_W, x: 0, system: 0 });
  tokens.forEach((t, i) => {
    if (i === o.caret) pushHead();
    if (t.kind === "bar") {
      const f = fills[barCount++];
      units.push({ kind: "bar", index: i, w: BAR_W, x: 0, system: 0, warn: barCount > 1 && !!f && !f.full });
      accState = new Map(); inBar = 0; return;
    }
    if (t.kind === "key") return;   // 调号 token：下一步排版补上
    const isNote = t.kind === "note";
    const pitch = isNote ? effectivePitch(tokens, i) : null;
    const ghost = isNote && (t as NoteTok).pitch === null;
    let off = 0;
    splitDur(t.dur).forEach((c, j) => {
      let acc: number | null = null;
      if (pitch && j === 0) {
        const key = `${pitch.step}${pitch.octave}`;
        const cur = accState.has(key) ? accState.get(key)! : keyAlter(pitch.step, fifths);
        if (pitch.alter !== cur) { acc = pitch.alter; accState.set(key, pitch.alter); }
      }
      const lyric = isNote && j === 0 ? (t as NoteTok).lyric : null;
      const accW = acc === null ? 0 : 1.3;
      let w = accW + baseWidth(c.base) + (c.dotted ? 0.6 : 0);
      if (lyric && lyric !== MELISMA_MARK) w = Math.max(w, accW + o.measureLyric(lyric) / sp + 0.7);
      units.push({ kind: "chunk", index: i, j, base: c.base, dotted: c.dotted, note: isNote, pitch, ghost, lyric, inBar: inBar + off, acc, w, accW, x: 0, system: 0 });
      off += c.ticks;
    });
    inBar += t.dur;
  });
  if (o.caret >= tokens.length) pushHead();

  // 2. 折行（像文字：优先在小节线后折；一个小节都放不下就逐个单元折）
  const right = o.width / sp - MARGIN;
  const headerW = (first: boolean) => MARGIN + 0.6 + W.gClef + 1.0 + Math.abs(fifths) * 1.05 + (fifths ? 0.8 : 0) + (first ? 2.4 + 1.2 : 0.4);
  let system = 0, x = headerW(true);
  const sysStarts: number[] = [x];
  const newline = () => { system++; x = headerW(false); sysStarts.push(x); };
  let seg: Unit[] = [];
  const place = (u: Unit) => { u.x = x; u.system = system; x += u.w; };
  const flush = () => {
    const segW = seg.reduce((s, u) => s + u.w, 0);
    const onLine = x > sysStarts[system] + 0.01;
    if (x + segW > right && onLine) newline();
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
  const systems: SystemBox[] = Array.from({ length: nSys }, (_, s) => ({ top: sysTop(s), staffTop: staffTop(s), bottom: sysTop(s) + P(SYS_H) }));

  // 4. 五线、谱号、调号、拍号
  for (let s = 0; s < nSys; s++) {
    for (let k = 0; k < 5; k++) { const y = yOf(s, BOTTOM_LINE + 2 * k); prims.push({ t: "line", x1: P(MARGIN), y1: y, x2: P(right), y2: y, w: P(ENGRAVE.staffLine), cls: "staff" }); }
    let hx = MARGIN + 0.6;
    prims.push({ t: "glyph", x: P(hx), y: yOf(s, 32), ch: GLYPH.gClef, cls: "clef" });
    hx += W.gClef + 1.0;
    const pos = fifths > 0 ? SHARP_POS : FLAT_POS, ch = fifths > 0 ? GLYPH.accidentalSharp : GLYPH.accidentalFlat;
    for (let k = 0; k < Math.abs(fifths); k++) { prims.push({ t: "glyph", x: P(hx), y: yOf(s, pos[k]), ch, cls: "keysig" }); hx += 1.05; }
    if (s === 0) {
      if (fifths) hx += 0.8;
      const num = timeSigDigits(song.beats), den = timeSigDigits(song.beatType);
      const wn = [...num].length * W.timeSigDigit, wd = [...den].length * W.timeSigDigit, cw = Math.max(wn, wd);
      prims.push({ t: "glyph", x: P(hx + (cw - wn) / 2), y: yOf(s, 36), ch: num, cls: "timesig" });
      prims.push({ t: "glyph", x: P(hx + (cw - wd) / 2), y: yOf(s, 32), ch: den, cls: "timesig" });
    }
  }

  // 5. 写字头、小节线、休止、符头（+ 临时记号 / 加线 / 附点 / 歌词）
  const notes: HitNote[] = [];
  let head = { system: 0, x: 0, w: P(HEAD_W) };
  const curIndex = (() => { for (let i = o.caret - 1; i >= 0; i--) if (tokens[i].kind !== "bar") return i; return -1; })();
  const chunks = units.filter((u): u is Chunk => u.kind === "chunk");
  const nhX = (c: Chunk) => P(c.x + c.accW + 0.35);
  const nhW = (c: Chunk) => P(c.base >= WHOLE ? W.noteheadWhole : W.noteheadBlack);
  for (const u of units) {
    if (u.kind === "head") {
      head = { system: u.system, x: P(u.x), w: P(u.w) };
      prims.push({ t: "rect", x: P(u.x + 0.2), y: yOf(u.system, 44), w: P(u.w - 0.4), h: yOf(u.system, 24) - yOf(u.system, 44), cls: "head" });
      prims.push({ t: "line", x1: P(u.x + 0.2), y1: yOf(u.system, 42), x2: P(u.x + 0.2), y2: yOf(u.system, 26), w: P(0.16), cls: "caret" });
      continue;
    }
    if (u.kind === "bar") {
      const bx = P(u.x + 0.7);
      prims.push({ t: "line", x1: bx, y1: yOf(u.system, TOP_LINE), x2: bx, y2: yOf(u.system, BOTTOM_LINE), w: P(ENGRAVE.thinBar), cls: u.index === curIndex ? "bar cur" : "bar" });
      if (u.warn) prims.push({ t: "rect", x: bx - P(0.3), y: yOf(u.system, TOP_LINE) - P(1.6), w: P(0.6), h: P(0.6), cls: "warn" });
      continue;
    }
    const c = u, cls = [c.ghost ? "ghost" : "", c.index === curIndex ? "cur" : ""].filter(Boolean).join(" ") || undefined;
    if (!c.note) {
      const g = c.base >= WHOLE ? GLYPH.restWhole : c.base >= TPQ * 2 ? GLYPH.restHalf : c.base >= TPQ ? GLYPH.restQuarter
        : c.base >= TPQ / 2 ? GLYPH.rest8th : c.base >= TPQ / 4 ? GLYPH.rest16th : GLYPH.rest32nd;
      const ry = c.base >= WHOLE ? yOf(c.system, 36) : yOf(c.system, MID_LINE);
      prims.push({ t: "glyph", x: P(c.x + 0.35), y: ry, ch: g, cls: cls ? `rest ${cls}` : "rest" });
      if (c.dotted) prims.push({ t: "glyph", x: P(c.x + 0.35 + 1.5), y: yOf(c.system, 35), ch: GLYPH.augmentationDot, cls });
      continue;
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
    if (c.lyric) {
      const ly = yOf(c.system, BOTTOM_LINE) + P(LYRIC_BELOW);
      if (c.lyric === MELISMA_MARK) prims.push({ t: "line", x1: x0 - P(0.6), y1: ly, x2: x0 + nhW(c) + P(0.4), y2: ly, w: P(0.12), cls: "melisma" });
      else prims.push({ t: "text", x: x0 + nhW(c) / 2, y: ly, s: c.lyric, cls: cls ? `lyric ${cls}` : "lyric" });
    }
    if (c.j === 0) notes.push({ index: c.index, system: c.system, x: x0, y, w: nhW(c), d });
  }

  // 6. 符干、符杠、符尾（按拍分组：同一拍里连着的八分及更短的音符共用符杠）
  type Stemmed = { c: Chunk; x0: number; y: number; d: number };
  const stemmed: Stemmed[][] = [];
  let group: Stemmed[] = [], groupBeat = -1, groupSys = -1;
  const endGroup = () => { if (group.length) stemmed.push(group); group = []; groupBeat = -1; };
  for (const u of units) {
    if (u.kind !== "chunk" || !u.note) { endGroup(); continue; }
    if (u.base >= WHOLE) { endGroup(); continue; }
    const s: Stemmed = { c: u, x0: nhX(u), y: yOf(u.system, diatonicIndex(u.pitch!)), d: diatonicIndex(u.pitch!) };
    const beat = Math.floor(u.inBar / BEAT);
    const beamable = u.base <= TPQ / 2;
    if (!beamable) { endGroup(); stemmed.push([s]); continue; }
    if (group.length && (beat !== groupBeat || u.system !== groupSys)) endGroup();
    group.push(s); groupBeat = beat; groupSys = u.system;
  }
  endGroup();
  for (const g of stemmed) {
    const sys = g[0].c.system, mid = yOf(sys, MID_LINE);
    const up = g.reduce((a, s) => a + s.d, 0) / g.length < MID_LINE;
    const sx = (s: Stemmed) => (up ? s.x0 + P(STEM_UP_SE[0] - ENGRAVE.stem / 2) : s.x0 + P(STEM_DOWN_NW[0] + ENGRAVE.stem / 2));
    const sy0 = (s: Stemmed) => (up ? s.y - P(STEM_UP_SE[1]) : s.y - P(STEM_DOWN_NW[1]));
    const cls = (s: Stemmed) => [s.c.ghost ? "ghost" : "", s.c.index === curIndex ? "cur" : ""].filter(Boolean).join(" ") || undefined;
    if (g.length === 1) {
      const s = g[0];
      let tip = up ? s.y - P(3.5) : s.y + P(3.5);
      if (up && s.d < 27) tip = Math.min(tip, mid); if (!up && s.d > 41) tip = Math.max(tip, mid);
      prims.push({ t: "line", x1: sx(s), y1: sy0(s), x2: sx(s), y2: tip, w: P(ENGRAVE.stem), cls: cls(s) });
      const lv = flagLevel(s.c.base);
      if (lv > 0) {
        const fx = up ? sx(s) - P(ENGRAVE.stem / 2) : sx(s) - P(ENGRAVE.stem / 2);
        const fg = up ? [GLYPH.flag8thUp, GLYPH.flag16thUp, GLYPH.flag32ndUp][lv - 1] : [GLYPH.flag8thDown, GLYPH.flag16thDown, GLYPH.flag32ndDown][lv - 1];
        const fy = up ? tip + P(FLAG_ANCHOR_UP[lv]) : tip + P(FLAG_ANCHOR_DOWN[lv]);
        prims.push({ t: "glyph", x: fx, y: fy, ch: fg, cls: cls(s) });
      }
      continue;
    }
    // 符杠：斜率取首尾的一半并夹住，最短的符干 3.5 sp
    const xa = sx(g[0]), xb = sx(g[g.length - 1]);
    const k = Math.max(-0.2, Math.min(0.2, ((g[g.length - 1].y - g[0].y) / (xb - xa)) * 0.5));
    const at = (x: number, y0: number) => y0 + k * (x - xa);
    const y0 = up ? Math.min(...g.map((s) => s.y - P(3.5) - k * (sx(s) - xa))) : Math.max(...g.map((s) => s.y + P(3.5) - k * (sx(s) - xa)));
    for (const s of g) prims.push({ t: "line", x1: sx(s), y1: sy0(s), x2: sx(s), y2: at(sx(s), y0), w: P(ENGRAVE.stem), cls: cls(s) });
    const step = P(ENGRAVE.beam + ENGRAVE.beamGap) * (up ? 1 : -1), th = P(ENGRAVE.beam) * (up ? 1 : -1);
    const beamPath = (xL: number, xR: number, lvl: number) => {
      const o = step * lvl; const a = at(xL, y0) + o, b = at(xR, y0) + o;
      return `M${xL - P(ENGRAVE.stem / 2)},${a}L${xR + P(ENGRAVE.stem / 2)},${b}L${xR + P(ENGRAVE.stem / 2)},${b + th}L${xL - P(ENGRAVE.stem / 2)},${a + th}Z`;
    };
    const gcls = g.some((s) => s.c.ghost) && g.every((s) => s.c.ghost) ? "beam ghost" : "beam";
    prims.push({ t: "path", d: beamPath(xa, xb, 0), cls: gcls });
    const maxLv = Math.max(...g.map((s) => flagLevel(s.c.base)));
    for (let lvl = 2; lvl <= maxLv; lvl++) {
      let runStart = -1;
      for (let n = 0; n <= g.length; n++) {
        const has = n < g.length && flagLevel(g[n].c.base) >= lvl;
        if (has && runStart < 0) runStart = n;
        if (!has && runStart >= 0) {
          const L = runStart, R = n - 1;
          if (L === R) {   // 单独一个更短的音：半截杠，组里最后一个朝左，其余朝右
            const stub = P(1.1), toRight = L < g.length - 1;
            prims.push({ t: "path", d: beamPath(toRight ? sx(g[L]) : sx(g[L]) - stub, toRight ? sx(g[L]) + stub : sx(g[L]), lvl - 1), cls: gcls }); }
          else prims.push({ t: "path", d: beamPath(sx(g[L]), sx(g[R]), lvl - 1), cls: gcls });
          runStart = -1;
        }
      }
    }
  }

  // 7. 连音线（同一个 token 拆开的几段之间；跨行的第一版不画）
  for (let n = 1; n < chunks.length; n++) {
    const a = chunks[n - 1], b = chunks[n];
    if (!b.note || b.j === 0 || a.index !== b.index || a.system !== b.system) continue;
    // 连音线画在符干的反面：符干朝上（低于中线）→ 线在符头下方，弧往下鼓；反之在上方往上鼓
    const d = diatonicIndex(b.pitch!), below = d < MID_LINE, sgn = below ? 1 : -1;
    const y = yOf(b.system, d) + sgn * P(0.8), xa2 = nhX(a) + nhW(a) * 0.8, xb2 = nhX(b) + nhW(b) * 0.2;
    prims.push({ t: "path", d: `M${xa2},${y}Q${(xa2 + xb2) / 2},${y + sgn * P(1.0)} ${xb2},${y}`, cls: b.ghost ? "tie ghost" : "tie" });
  }

  // 8. 光标落点（点在哪个空隙）
  const slots: Slot[] = [];
  const firstUnitOf = new Map<number, Unit>();
  for (const u of units) if (u.kind !== "head" && !firstUnitOf.has(u.index)) firstUnitOf.set(u.index, u);
  for (let c = 0; c <= tokens.length; c++) {
    const u = c < tokens.length ? firstUnitOf.get(c)! : null;
    if (u) slots.push({ caret: c, system: u.system, x: P(u.x) });
    else { const last = units[units.length - 1]; slots.push({ caret: c, system: last ? last.system : 0, x: last ? P(last.x + last.w) : P(sysStarts[0]) }); }
  }

  return { prims, width: o.width, height: P(nSys * SYS_H + 1), sp, systems, notes, slots, head, yOf, dOf };
}
