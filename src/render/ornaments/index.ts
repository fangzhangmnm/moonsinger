// ornaments —— 两种行的画法共用的挂件（施工单第三节「4」：力度、渐强渐弱、渐到、反复房子 / 跳转、速度、风格）：位置只吃画法给的锚点，画成什么查记号表（src/render/signs.ts）。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第四刀 4-3：代码原样从 staff/draw.ts 搬出，五线谱传它原来的锚点 = 每一行画出来和原来一样）。
//   每一样都按行登记（attach(行, 道, …)；统筹审第四刀接口第 3 条：每一行按它自己那种画法的道的先后贴）；一次跨好几行的（发夹、房子）拆成一行一个。
//   这里不是框架（frame/ 不认字形）：画法 import 它；它认得的只有记号表、文字样式和 Bravura 的速度音符。
import { DYNS, type Song, type PaperSeg, type Token, type GrooveTok, type NavTok, type PedalKind, PEDAL_KINDS, NAV_LABEL, endingLabel, tempoWord, rampSource } from "../../score/song.ts";
import { grooveLabel, grooveDataIn } from "../../score/groove.ts";
import type { NotationId } from "../../score/song-view.ts";
import { TEMPO_EM, type TextRole } from "../text/index.ts";
import { GLYPH } from "../smufl.ts";
import { MARGIN } from "../../look/frame.ts";
import type { LaneKind } from "../frame/lanes.ts";
import type { Prim, EngraveOpts, DynHit, MarkHit } from "../engrave.ts";
import type { Unit, Chunk, DynU, NavU, PedalU } from "../frame/units.ts";
import { dynDepiction, SIGNS } from "../signs.ts";
import { hairpinDead } from "../../score/perform.ts";
import { GLYPH_BOX } from "../glyph-box.gen.ts";
import { PIN_GAP, PIN_MIN, PIN_WORD, DASH, RAMP_DASH, PEDAL } from "../../look/marks.ts";   // 记号摆法的数在 src/look/marks.ts（17-2）

/** 一段长 L 的渐到发夹切成几段、每段多长、隔多远（同一个单位进出）。 */
export const rampDashes = (L: number, unit: number): { n: number; on: number; per: number } => {
  const n = Math.max(RAMP_DASH.min, Math.round(L / (unit * RAMP_DASH.len * (1 + RAMP_DASH.gapK)))), on = L / (n + (n - 1) * RAMP_DASH.gapK);
  return { n, on, per: on * (1 + RAMP_DASH.gapK) };
};

/** 画法交给挂件的（一条轨在这张纸上）。 */
export interface OrnCtx {
  /** notation = 记号表查哪一栏 = 这一行的种类（不是这首歌的谱种：简谱歌里照旧排五线谱的行查五线谱那一栏）。 */
  song: Song; paper: PaperSeg; o: EngraveOpts; notation: NotationId;
  P: (v: number) => number; tx: (role: TextRole) => number; TR: (role: TextRole, v: number) => number; RS: (role: TextRole) => number; mw: (role: TextRole, s: string) => number; sp: number;
  prims: Prim[]; dyns: DynHit[]; marks: MarkHit[];
  placeAbove: (row: number, gap: number, draw: (y: number) => void) => number;
  /** 谱下方贴（踏板用）：同 placeAbove，往下挪到离上面的天际线 gap。 */
  placeBelow: (row: number, gap: number, draw: (y: number) => void, o2?: { min?: number }) => number;
  attach: (row: number, lane: LaneKind, run: () => void) => void;
  /** 这条轨第 s 行最下面那一行（五线谱 = 最下面那张谱表，大谱表 = 低音那张；数字行 = 它自己）：踏板挂在这一行下面。 */
  rowLow: (s: number) => number;
  /** 台上这位不认的记号（PartView.ignores：演奏法的名字 + 踏板「pedal:sustain」…）：画灰。 */
  ignores: readonly string[];
  /** 这位没写踏板记号时留住音（PartView.pedalHeld，踏板 11-3）：每一段（这张纸）开头延音踏板就踩着。 */
  pedalHeld?: boolean;
  /** 第 s 行的线画到哪（px；五线 / 数字行的行尾，最后一根小节线）；contentEnd = 这一行内容的右缘（所有声部的列里最右那一列，不过行尾）。踏板的线用。 */
  rowEnd: (s: number) => number; contentEnd: (s: number) => number;
  /** 这一行的右边界（sp）。 */
  right: number;
  /** 这一行内容最左能到哪（px；7-K ⑤）：五线谱 = 行首竖线；数字行 = 行首竖线往右它自己的行首（同 jianpuLineStart）。挂件续到下一行时从不早于这里起，不越过竖线。 */
  left: (s: number) => number;
  /** 这一行字形的尺寸比例（力度字、突强 / 强后弱）：数字行 = 排版参数表行一级的 scale（第五刀 5-0c）；五线谱不给 = 原样。 */
  glyphScale?: number;
  tokens: Token[]; units: Unit[];
  /** 这条轨第 s 行挂挂件的那一行（五线谱 = 第一张谱表）。 */
  row: (s: number) => number;
  /** 音的墨的左边 / 右边（px）：五线谱 = 符头；简谱 = 数字。 */
  noteX: (c: Chunk) => number; noteEnd: (c: Chunk) => number;
  /** 被紧跟着的强后即弱盖掉的力度记号（画灰）；不起作用的跳转（画灰的 class 后缀）。 */
  dynOff: ReadonlySet<number>; navMute: (i: number) => string;
  /** 不印的提示交给框架最后贴、只躲不推（第八刀 8-5；数字行给，五线谱不给 = 照旧当场画）：part 的图元 / 墨相对锚点，tries = 依次试的锚点（这一行局部 px）。 */
  hint?: (row: number, h: { part: { ink: { x0: number; x1: number; y0: number; y1: number }; prims: Prim[] }; tries: readonly { x: number; y: number }[]; climb?: number; /** 摆好之后（落点 = 字的锚点）：登记点击框之类。 */ onPlace?: (x: number, y: number) => void }) => void;
}

/** 速度记号一共多宽（sp）：词 + 四分音符 + 数（同 tempoAt 的摆法）。不印的提示（8-5）找「速度后面」那个位置用。 */
export function tempoW(c: OrnCtx, v: number): number { const k = c.RS("tempo-word"); return c.mw("tempo-word", tempoWord(v).it) + 0.7 * k + 1.3 * k + c.mw("tempo-num", `= ${v}`); }
/** 速度记号画在基线 y（「Andante ♩ = 88」：词 + 四分音符 + 数）；change = 这一段开头比上一段快 / 慢（前面标 ↑ / ↓）。 */
export function tempoAt(c: OrnCtx, r: number, x0: number, v: number, cls: string, index: number, change: "up" | "down" | undefined, y: number): void {
  const { P, tx, TR, RS, mw, prims, marks } = c;
  const fs = tx("tempo-word"), word = tempoWord(v).it, k = RS("tempo-word"), T = c.tokens[index] ? { tok: c.tokens[index]!.id } : {};   // 速度的字挂速度那个 token（守卫 4，第五刀 5-3）   // 尺子查样式表（v0.16.48 起跟谱，user「速度那一串字号…也应该跟着走」）
  // 这一段开头的速度和上一段不一样 = 前面标一个强调色的 ↑（快了）/ ↓（慢了）提示（user 2026-10-08「不要grey out，而是有变化的时候会标一个东西提示用户」；一样 = 照常画，不标）
  if (change) {
    const ar: Prim = { t: "text", x: 0, y: 0, s: change === "up" ? "↑" : "↓", cls: "tempo-change ann", size: fs, anchor: "end" };
    if (c.hint) {   // 不印的提示（第八刀 8-5）：最后贴、只躲不推——先试速度字左边（原来的位置），再试速度后面、上面
      const w = fs * 0.62, end = P(x0 + tempoW(c, v) + 0.3) + w;
      c.hint(r, { part: { ink: { x0: -w, x1: 0, y0: -fs * 0.8, y1: fs * 0.1 }, prims: [ar] }, tries: [{ x: P(x0 - 0.3), y }, { x: end, y }, { x: P(x0 - 0.3), y: y - fs * 1.1 }, { x: end, y: y - fs * 1.1 }, { x: P(x0 - 0.3), y: y - fs * 2.2 }], climb: fs * 1.1 });
    }
    else prims.push({ ...ar, x: P(x0 - 0.3), y });
  }
  const ww = mw("tempo-word", word), num = `= ${v}`, nw = mw("tempo-num", num);
  prims.push({ ...T, t: "text", x: P(x0), y, s: word, cls: `${cls} tempo-word`, size: fs, anchor: "start" });
  const gx = x0 + ww + 0.7 * k;
  prims.push({ ...T, t: "glyph", x: P(gx), y: y - TR("tempo-word", 0.3), ch: GLYPH.metNoteQuarterUp, cls, size: fs * 1.75 });
  prims.push({ ...T, t: "text", x: P(gx + 1.3 * k), y, s: num, cls: `${cls} tempo-num`, size: fs, anchor: "start" });
  marks.push({ index, kind: "tempo", system: r, x: P(x0 - 0.3), y: y - TR("tempo-word", TEMPO_EM * 1.1), w: P(gx + 1.3 * k + nw + 0.6 * k - x0), h: TR("tempo-word", TEMPO_EM * 1.5) });
}
/** 速度记号（挂件第 7 样）：这一段天际线往上 0.5。 */
export function layTempo(c: OrnCtx, r: number, x0: number, v: number, cls: string, index: number, change?: "up" | "down"): void {
  c.attach(r, "tempo", () => { c.placeAbove(r, 0.5, (y) => tempoAt(c, r, x0, v, cls, index, change, y)); });
}

/** 风格记号（拍子轻重）：斜体字、和后面那个音左对齐；不认识的预设（以后的版本写的）= 灰字 + 说明（纪律）。挂件第 8 样：速度之后、贴天际线往上 0.5（挤了自然叠上去）。 */
export function layGroove(c: OrnCtx, u: Unit): void {
  const { P, tx, TR, mw, prims, dyns, tokens } = c;
  const gt = tokens[u.index] as GrooveTok, gr = c.row(u.system), data = grooveDataIn(c.song, gt.style), label = grooveLabel(gt, data), known = gt.style === "none" || !!data;   // 16-4 D：歌里没有这种风格的拍子表 = 不起作用、画灰
  const fs = tx("groove-mark"), gw = P(mw("groove-mark", label)), gx = P(u.x + 0.3);
  c.attach(gr, "groove", () => c.placeAbove(gr, 0.5, (gy) => {
    prims.push({ t: "text", x: gx, y: gy, s: label, tok: gt.id, cls: ["groove-mark", known ? "" : "groove-unknown"].filter(Boolean).join(" "), size: fs, anchor: "start" });
    dyns.push({ index: u.index, kind: "groove", system: gr, x: P(u.x), y: gy - TR("groove-mark", TEMPO_EM * 1.1), w: gw + TR("groove-mark", 0.6), h: TR("groove-mark", TEMPO_EM * 1.5) });
  }));
}

/** 谱内反复 / 跳转（2026-10-09）：挂件第 6 样（刀 4b：它那一段天际线往上 0.6）；不起作用的（不是最上面那位的行 / D.S. 没 Segno…）画灰，点开说为什么（repeats.ts navWhy）。
 *  repeatBarX(v) = 这种画法里反复小节线的右端（房子的钩下到那里）；没给 = 小节线的位置 + 0.7（单线）。 */
export function layNav(c: OrnCtx, u: NavU, repeatBarX: (v: Unit) => number): void {
  const { P, tx, TR, mw, sp, prims, dyns, tokens, units, navMute } = c;
  const t = tokens[u.index] as NavTok, cls = "nav-mark" + navMute(u.index), tok = t.id, row0 = c.row(u.system);
  const fs = tx("nav-mark"), x = P(u.x + 0.4);
  if (t.what === "ending") {   // 房子：左边一道竖钩 + 横线 + 「1.」；到它的尽头——下一条 :|（右边也钩下来）/ 下一个房子 / 最后一个房子到下一条小节线（右边开口）
    const ui = units.indexOf(u);
    let end: Unit | null = null, closed = false, fallback: Unit | null = null, sawNote = false;
    for (let k = ui + 1; k < units.length; k++) {
      const v = units[k]!;
      if (v.kind === "chunk") sawNote = true;
      if (v.kind === "bar" && (v.repeat === "end" || v.repeat === "both")) { end = v; closed = true; break; }
      if (v.kind === "nav" && (tokens[v.index] as NavTok).what === "ending") { end = v; closed = true; break; }
      if (v.kind === "bar" && v.repeat === "start") { if (!fallback) fallback = v; break; }   // 新的 |: = 这个房子到此为止（开口）
      if (v.kind === "bar" && sawNote && !fallback) fallback = v;   // 最后一个房子：到它后面第一条小节线
    }
    if (!end) end = fallback;
    const h = TR("nav-mark", 1.6);   // 房子的钩跟着字高（里面写「1.」）
    const endX = (v: Unit | null, sys: number) => (v && v.system === sys ? (v.kind === "bar" ? repeatBarX(v) : P(v.x) - P(0.3)) : P(c.right));
    // 每一行一段，各自贴着自己那一段天际线（跨行的房子每行高度可以不一样）；按行登记（每一行按自己的道的先后贴）
    const seg = (sys: number, xa: number, openL: boolean, xb: number, hookR: boolean, first: boolean) => { const rr = c.row(sys); c.attach(rr, "nav", () => c.placeAbove(rr, 0.6, (yy) => {
      prims.push({ t: "path", d: `${openL ? `M${xa},${yy}` : `M${xa},${yy + h}L${xa},${yy}`}L${xb},${yy}${hookR ? `L${xb},${yy + h}` : ""}`, cls: "volta" + navMute(u.index) });
      if (!first) return;
      prims.push({ tok, t: "text", x: x + TR("nav-mark", 0.3), y: yy + TR("nav-mark", 1.25), s: endingLabel(t.nums), cls, size: fs, anchor: "start" });
      dyns.push({ index: u.index, kind: "nav", system: row0, x: x - P(0.4), y: yy - TR("nav-mark", 0.4), w: TR("nav-mark", 3), h: h + TR("nav-mark", 0.8) });
    })); };
    const endSys = end ? end.system : u.system;
    seg(u.system, x - P(0.2), false, endX(endSys === u.system ? end : null, u.system), closed && endSys === u.system, true);
    for (let s2 = u.system + 1; s2 <= endSys; s2++) { const first = units.find((w) => w.system === s2); seg(s2, P((first?.x ?? MARGIN) - 0.3), true, endX(s2 === endSys ? end : null, s2), closed && s2 === endSys, false); }
    return;
  }
  if (t.what === "segno" || t.what === "coda") {   // Segno / Coda：Bravura 字形（缩到 0.7）
    const gs = 4 * sp * 0.7;
    c.attach(row0, "nav", () => c.placeAbove(row0, 0.6, (y) => {
      prims.push({ tok, t: "glyph", x, y, ch: t.what === "segno" ? "\u{E047}" : "\u{E048}", cls: cls.replace("nav-mark", "nav-sign"), size: gs });
      dyns.push({ index: u.index, kind: "nav", system: row0, x: x - P(0.3), y: y - gs * 0.8, w: gs * (t.what === "segno" ? 0.6 : 1.0), h: gs * 0.95 });
    }));
    return;
  }
  const label = NAV_LABEL[t.what], tw = P(mw("nav-word", label)), atEnd = x - tw > P(MARGIN + 6);   // 它排在小节线前面：x ≈ 小节线   // D.C. / Fine / To Coda…：斜体字，靠右对齐在它的位置（小节尾）；前面放不下就靠左
  c.attach(row0, "nav", () => c.placeAbove(row0, 0.6, (y) => {
    prims.push({ tok, t: "text", x: atEnd ? x : x - P(0.2), y, s: label, cls: cls + " nav-word", size: fs, anchor: atEnd ? "end" : "start" });
    dyns.push({ index: u.index, kind: "nav", system: row0, x: atEnd ? x - tw - P(0.3) : x - P(0.5), y: y - TR("nav-word", TEMPO_EM * 1.1), w: tw + TR("nav-word", 0.8), h: TR("nav-word", TEMPO_EM * 1.5) });
  }));
}

/** 力度那一层（挂件第 4 样）：力度字 / 发夹 / cresc. 字 / 渐到，各一块；用发夹连着的一串（字—发夹—字）共用一条基线 = 这一串里最高的那个，贴它们自己那几段天际线往上 0.4。
 *  力度字画成什么查记号表（五线谱 = Bravura 字形；简谱中文界面 = 中文字）。 */
export function layDynamics(c: OrnCtx): void {
  const { P, tx, prims, dyns, tokens, units, dynOff, o, notation } = c;
  const right = c.right;
  /** 一个力度字：怎么画 + 墨迹（sp，相对字的原点：左、右、基线以上、基线以下）+ lean = 斜体的字往右多伸出去多少（sp；「f」的上钩伸出字宽、斜体再往右倾——只在夹到行右端时用）。 */
  const dynOf = (v: DynU["value"]) => {
    const d = dynDepiction(v, notation), g = c.glyphScale;
    if (d.kind === "text") {   // 简谱：普通的细斜体字母（文字样式 jp-dyn）；墨迹 = 量出来的字宽 × 行里的比例、高按字号估（上 0.72、下 0.22）
      const k = g ?? 1, em = (tx("jp-dyn") / P(1)) * k, w = c.mw("jp-dyn", d.s) * k;
      return { ink: [0, w, em * 0.72, em * 0.22] as const, lean: em * 0.2, draw: (x: number, y: number, tok: number, cls: string) => prims.push({ t: "text", x, y, s: d.s, tok, cls: `${cls} jp-dyn`, size: tx("jp-dyn") * k, anchor: "start" }) };
    }
    if (g === undefined) return { ink: d.ink, lean: 0, draw: (x: number, y: number, tok: number, cls: string) => prims.push({ t: "glyph", x, y, ch: d.glyph, tok, cls }) };
    return { ink: [d.ink[0] * g, d.ink[1] * g, d.ink[2] * g, d.ink[3] * g] as const, lean: 0, draw: (x: number, y: number, tok: number, cls: string) => prims.push({ t: "glyph", x, y, ch: d.glyph, tok, cls, size: P(4 * g) }) };
  };
  /** late = 挤住了、挪到外面一道的（段尾的力度 / 连着它的发夹）：一串里有一个 late，这一串排在别的串后面摆，碰到前面的就叠上去（统筹 2026-11-12）。 */
  const dynItems: { row: number; x0: number; keys: string[]; late?: boolean; draw: (base: number) => void }[] = [];
  // 挂在这一段结尾的力度（后面没有音了：7-N 的「挪到这一段结尾」/「变到」放的，常见 = 一个音的滚奏 ppp < fff）是一条发夹的终点、又离发夹起点太近：
  //   往右让到发夹最短也画得出为止（7-N 补查出来的：原来 fff 叠在 ppp 后面、发夹被盖住看不见）。只挪这种结尾的字；后面还有音的力度照旧和那个音对齐
  const tailDynX = new Map<Unit, number>(), lastC = units.reduce((m, u, k) => (u.kind === "chunk" ? k : m), -1);
  { units.forEach((h, hi) => {
      if (h.kind !== "hairpin") return;
      const ei = units.findIndex((u, k) => k > hi && (u.kind === "dyn" || u.kind === "hairpin")), endU = ei >= 0 ? units[ei]! : null;
      if (!endU || endU.kind !== "dyn" || ei < lastC || endU.system !== h.system) return;
      const prevU = units[hi - 1], before = prevU && prevU.kind === "dyn" && prevU.system === h.system ? prevU : null;
      const startX = Math.max(P(h.x + 0.3), before ? (tailDynX.get(before) ?? P(before.x + 0.3)) + P(dynOf(before.value).ink[1] + PIN_GAP) : 0);
      const need = startX + P(PIN_MIN + PIN_GAP - dynOf(endU.value).ink[0]);
      if (need > P(endU.x + 0.3)) tailDynX.set(endU, need);
    }); }
  // 力度字墨的右边不出这一行的右端（c.right）：7-N 补时先管挂在一段结尾的（一行最右那个音后面的 fff 会出版心 1–6 个线间距），
  //   2026-11-12 起每个力度字都管（一行排满、最后一个音上的 ppp 也会伸出去约 2 个线间距；只在会出去时往左挪，别处和音对齐不变）。夹住之后挤了的，下面挪到外面一道
  const dynX = (u: Unit) => { const x = tailDynX.get(u) ?? P(u.x + 0.3); if (u.kind !== "dyn") return x; const d = dynOf(u.value); return Math.min(x, P(c.right - d.ink[1] - d.lean)); };
  const dynItemOf = new Map<Unit, (typeof dynItems)[number]>();
  // 力度：谱上方、和后面那个音左对齐；挂件第 4 样（刀 4b：和用发夹连着的一串共用一条基线，贴它们自己那几段天际线往上 0.4；挨得近的两个 = 后摆的那个自然叠上去）
  for (const u of units) {
    if (u.kind !== "dyn") continue;
    const dr = c.row(u.system), ui = units.indexOf(u), dd = dynOf(u.value), [il, ir, iu, id] = dd.ink;
    const X = dynX(u), it: (typeof dynItems)[number] = { row: dr, x0: X + P(il), keys: [`${dr}|d${ui}`], draw: (dy) => {
      dd.draw(X, dy, tokens[u.index]!.id, "dyn" + (dynOff.has(u.index) ? " art-mute" : ""));
      dyns.push({ index: u.index, kind: "dyn", system: dr, x: X + P(il - 0.3), y: dy - P(iu + 0.4), w: P(ir - il + 0.6), h: P(iu + id + 0.8) });
    } };
    dynItems.push(it); dynItemOf.set(u, it);
  }
  // 渐强渐弱（v0.7.6 起是记号）：从它那儿画到终点——下一个力度记号 / 下一个渐强渐弱 / 纸尾（没有终点 = 后面灰字「(f)」= 走一档推定的终点）。跨行 = 每行画它那一份开口（按横向长度分）。
  //   和两头的力度字之间留空（user 2026-10-08「< 号不用靠着一点空隙都没有」：按量过的墨迹让开 PIN_GAP）；比一整行还长 = 写成「cresc. - - -」（PIN_WORD）。
  const LEVELS = DYNS;   // ppp…fff（v0.9.23）：走一档推定的灰字也能推到 ppp / fff
  const lastChunk = [...units].reverse().find((u): u is Chunk => u.kind === "chunk");
  const dynKey = (u: Unit) => `${c.row(u.system)}|d${units.indexOf(u)}`;
  const wedgeKey = (index: number, sy: number) => `${c.row(sy)}|w${index}:${sy}`;
  const inkOf = (u: DynU) => dynOf(u.value).ink;
  // 发夹（或太长时的「cresc. - - -」）从 (s0, startX) 到 (s1, endX)：跨行每行一段，每段是力度那一层的一块；index = 点它开哪个记号的小菜单；
  //   k0 = 第一段连着谁（前面紧挨着的力度字），k1 = 最后一段连着谁（终点的字 / 下一个发夹）；tail = 最后一段画完再画的（推定的灰字，注解）。ramp = 渐到画的（虚线）。
  const pinOff = hairpinDead(tokens);   // 和终点之间一个音都没有的渐强渐弱：画灰（点开小菜单说为什么；W-70）
  const wedgeItems = (index: number, dir: "cresc" | "dim", s0: number, startX: number, s1: number, endX: number, ramp: boolean, k0?: string, k1?: string, tail?: (base: number) => void, late?: boolean) => {
    const mute = tokens[index]?.kind === "hairpin" && pinOff.has(index) ? "art-mute" : "";
    const leftOf = (sy: number) => Math.max(Math.min(...units.filter((u): u is Chunk => u.kind === "chunk" && u.system === sy).map((ch) => c.noteX(ch)), P(right)) - P(1), c.left(sy));   // 不越过行首竖线（7-K ⑤）
    const segs: [number, number, number][] = [];
    for (let sy = s0; sy <= s1; sy++) segs.push([sy, sy === s0 ? startX : leftOf(sy), sy === s1 ? endX : P(right) - P(0.3)]);
    const total = segs.reduce((n, [, a, b]) => n + Math.max(0, b - a), 0) || 1, H = P(0.5), long = total > P(right - MARGIN);
    const word = dir === "cresc" ? "cresc." : "dim.", ww = P(PIN_WORD.w[dir === "cresc" ? "cresc" : "dim"]);
    let said = false, acc = 0, tailDone = false;
    // 折到下一行的那一段短到画不出一个楔形 = 不画（统筹看第四刀成品样张后定的第 2 处：行首力度字前面那一小截虚线）。
    //   **但不许整条都不画**（第五刀：照样张放宽音距后，行尾的力度字后面接着折行、下一行开头又是终点的字，两段都太短 = 记号静默没了，守卫 4 抓出来的）：
    //   一段都画不出来时，最长的那一段照最短的楔形画
    const drawable = segs.map(([, a0, b], i) => !(b - a0 < P(0.3) || (i > 0 && b - a0 < P(PIN_MIN))));
    if (!drawable.some(Boolean) && segs.length) { let bi = 0; segs.forEach(([, a0, b], i) => { if (b - a0 > segs[bi]![2] - segs[bi]![1]) bi = i; }); segs[bi]![2] = Math.max(segs[bi]![2], segs[bi]![1] + P(PIN_MIN)); drawable[bi] = true; }
    segs.forEach(([sy, a0, b], i) => {
      if (!drawable[i]) return;
      const row = c.row(sy), keys = [wedgeKey(index, sy)], last = i === segs.length - 1;
      if (i === 0 && k0) keys.push(k0);
      if (last && k1) keys.push(k1);
      if (last) tailDone = true;
      if (long) {   // 太长：「cresc.」+ 虚线，跨行接着画虚线；第一段放得下字才写（行尾剩一点点 = 字挪到下一行开头）
        const writeWord = !said && b - a0 >= ww + P(1); if (writeWord) said = true;
        dynItems.push({ row, x0: a0, keys, ...(late ? { late } : {}), draw: (base) => {
          const midY = base - P(0.5); let a = a0;
          if (writeWord) { prims.push({ t: "text", x: a, y: midY + P(0.5), s: word, tok: tokens[index]!.id, cls: ["dyn-word", ramp ? "ramp" : "", mute].filter(Boolean).join(" "), size: tx("dyn-word"), anchor: "start" }); a += ww + P(0.6); }
          for (let x = a; x + P(DASH.len) <= b; x += P(DASH.len + DASH.gap)) prims.push({ t: "line", x1: x, y1: midY, x2: x + P(DASH.len), y2: midY, w: P(0.12), cls: mute ? "dyn-dash art-mute" : "dyn-dash" });
          dyns.push({ index, kind: "hairpin", system: row, x: a0, y: midY - P(1.4), w: b - a0, h: P(2.8) });
          if (last && tail) tail(base);
        } });
        return;
      }
      const f0 = acc / total, f1 = (acc + b - a0) / total; acc += b - a0;
      const [h0, h1] = dir === "cresc" ? [H * f0, H * f1] : [H * (1 - f0), H * (1 - f1)];
      dynItems.push({ row, x0: a0, keys, ...(late ? { late } : {}), draw: (base) => {
        const y = base - P(0.5), a = a0;   // 发夹的中线 = 力度字的半腰
        // 渐到 = 虚线：两条边的每一小段在同一个 x 上（以前靠 CSS stroke-dasharray——iPad Safari 上第二条边的虚线接着第一条的相位走，尖头那边两条快重合时一段段错开打架，v0.10.26）
        let d = `M${a},${y - h0}L${b},${y - h1}M${a},${y + h0}L${b},${y + h1}`;
        if (ramp) {
          const hAt = (x: number) => h0 + (h1 - h0) * ((x - a) / (b - a)), { n, on, per } = rampDashes(b - a, P(1));
          d = "";
          for (let k = 0; k < n; k++) { const x = a + k * per, x2 = k === n - 1 ? b : x + on; d += `M${x},${y - hAt(x)}L${x2},${y - hAt(x2)}M${x},${y + hAt(x)}L${x2},${y + hAt(x2)}`; }
        }
        prims.push({ tok: tokens[index]!.id, t: "path", d, cls: ["hairpin", ramp ? "ramp" : "", mute].filter(Boolean).join(" ") });
        dyns.push({ index, kind: "hairpin", system: row, x: a, y: y - P(1.4), w: b - a, h: P(2.8) });
        if (last && tail) tail(base);
      } });
    });
    if (!tailDone && tail) dynItems.push({ row: c.row(s1), x0: endX, keys: [wedgeKey(index, s1), ...(k1 ? [k1] : [])], ...(late ? { late } : {}), draw: tail });   // 最后一段太短没画：推定的灰字照样写
  };
  units.forEach((h, hi) => {
    if (h.kind !== "hairpin" || !lastChunk) return;
    // 紧挨在前面的力度记号（mp < 这种）：从它的字后面起画，别压在字上
    const prevU = units[hi - 1];
    const dynBefore = prevU && prevU.kind === "dyn" && prevU.system === h.system ? prevU : null;
    const startX = Math.max(P(h.x + 0.3), dynBefore ? dynX(dynBefore) + P(inkOf(dynBefore)[1] + PIN_GAP) : 0), s0 = h.system;
    const endU = units.slice(hi + 1).find((u) => u.kind === "dyn" || u.kind === "hairpin");
    // 终点的力度和方向反着（渐弱后面更强 / 一样）= 方向说了算：走一档、到那儿突变（perform.ts dynLevels）→ 发夹末端照样画灰字推定的那一档，让开它（2026-10-08 user「同意」）
    let curDyn: string = "mf"; for (let j = h.index - 1; j >= 0; j--) { const t = tokens[j]!; if (t.kind === "dyn") { curDyn = t.value; break; } }
    const ci = LEVELS.indexOf(curDyn as (typeof LEVELS)[number]), against = !!endU && endU.kind === "dyn" && (h.dir === "cresc" ? LEVELS.indexOf(endU.value) <= ci : LEVELS.indexOf(endU.value) >= ci);
    const IMPLIED_W = 3;   // 灰字「(mp)」大概多宽（sp，1.3 号斜体）
    const endX = endU ? (endU.kind === "dyn" ? dynX(endU) + P(inkOf(endU)[0]) : P(endU.x + 0.3)) - P(PIN_GAP + (against ? IMPLIED_W + 0.4 : 0)) : c.noteEnd(lastChunk) + P(0.8), s1 = endU ? endU.system : lastChunk.system;   // 终点的字画在 x + 0.3
    if (s1 < s0) return;
    // 太短也照样画（以前不到 1 个间距就整条不画 = 静默没了）：至少 MIN_PIN；灰字放不下就挪到发夹末端上面
    let endXd = endX, labelAbove = false, sx = startX;
    const MIN_PIN = P(PIN_MIN);
    // 段尾的力度（后面没有音了）夹在行右端以内之后挤住了——发夹不够最短，或者和起点的力度字叠在一起（叠了发夹必然不够最短）：
    //   统筹 2026-11-12 裁定：力度不占横向（v0.7.29 不开口子），挤了就往离谱远的那边挪一道。结尾的力度拆出这一串、最后摆（碰到前面的就叠上去 = 外面一道），
    //   发夹留在原来那一道、至少最短；连发夹也放不下（起点后面到行右端不够最短）= 发夹跟着结尾的力度一起到外面那一道，两个靠右摆（都不出行右端）
    const outer = endU && endU.kind === "dyn" && units.indexOf(endU) > lastC && endU.system === s0 && endX - startX < MIN_PIN - P(0.01) ? (startX + MIN_PIN <= P(right) ? "dyn" : "both") : "";   // 0.01：上面「往右让到发夹正好最短」算出来的长度有浮点零头，别把正好的当挤了
    if (outer === "dyn") {
      endXd = Math.max(startX + MIN_PIN, Math.min(P(right), dynX(endU!) + P(inkOf(endU as DynU)[1])));   // 发夹伸到外面那个字的下面（不出行右端）
      labelAbove = against;
    } else if (outer === "both") sx = endX - MIN_PIN;   // 终点照常让开字（方向反着时也让出灰字的地方），起点往左让出最短那么长
    if (outer) dynItemOf.get(endU!)!.late = true;
    if (!outer && s1 === s0 && endXd - startX < MIN_PIN) {
      const roomy = against ? endXd + P(IMPLIED_W + 0.4) : endXd;   // 不让灰字占地方时能有多长
      if (against) labelAbove = true;
      endXd = Math.max(startX + MIN_PIN, Math.min(roomy, startX + MIN_PIN * 2));
    }
    const k1 = !endU || outer === "dyn" ? undefined : endU.kind === "dyn" ? dynKey(endU) : wedgeKey(endU.index, endU.system);
    const tail = !endU || against ? (base: number) => {   // 推定的终点：现在的力度往上 / 往下一档（没有终点 / 终点和方向反着）
      const k = Math.max(0, Math.min(LEVELS.length - 1, ci + (h.dir === "cresc" ? 1 : -1)));
      const im: Prim = { t: "text", x: 0, y: 0, s: `(${LEVELS[k]})`, cls: "dyn-implied ann", size: tx("dyn-implied"), anchor: "start" }, ix = labelAbove ? endXd - P(1.2) : endXd + P(0.4), iy = base + P(labelAbove ? -1.9 : 0.1);
      if (c.hint) {   // 不印的提示（第八刀 8-5）：最后贴、只躲不推——先试原来的位置，再往上、往右让
        const fs = tx("dyn-implied"), w = P(c.mw("dyn-implied", im.s as string)), rr = c.row(s1);
        c.hint(rr, { part: { ink: { x0: 0, x1: w, y0: -fs * 0.8, y1: fs * 0.2 }, prims: [im] }, tries: [{ x: ix, y: iy }, { x: ix, y: iy - fs * 1.1 }, { x: ix + P(0.8), y: iy }, { x: ix, y: iy - fs * 2.2 }, { x: endXd - w - P(0.4), y: base - P(1.9) }], climb: fs * 1.1,
          // 点得到（7-N 补，user「这种渐强渐弱里面那个括号的小字，我们都让它可以手动设置成别的」）：指着这条发夹 = 开同一个菜单（「变到」）；框按字摆好的地方、稍放大，压在发夹的框上面也指同一条
          onPlace: (x: number, y: number) => { dyns.push({ index: h.index, kind: "hairpin", system: rr, x: x - P(0.3), y: y - fs * 0.9, w: w + P(0.6), h: fs * 1.3 }); } });
      } else { prims.push({ ...im, x: ix, y: iy }); const fs = tx("dyn-implied"); dyns.push({ index: h.index, kind: "hairpin", system: c.row(s1), x: ix - P(0.3), y: iy - fs * 0.9, w: P(3.6), h: fs * 1.3 }); }
    } : undefined;
    wedgeItems(h.index, h.dir, s0, sx, s1, endXd, false, dynBefore && outer !== "both" ? dynKey(dynBefore) : undefined, k1, tail, outer === "both");
  });
  // 渐到：写着「从上一个渐变过来」的力度记号 = 从上一个力度字后面画一条虚线发夹到它前面（方向按两个力度的高低；一样高 = 不画，渐到不起作用）。
  //   前面没有力度记号 / 中间隔着手写的渐强渐弱 = 不画（手写的说了算；小菜单里那个开关画灰、说为什么——perform.ts 也不渐）
  for (const u of units) {
    if (u.kind !== "dyn" || !(tokens[u.index] as { ramp?: true }).ramp) continue;
    const src = rampSource(tokens, u.index); if (typeof src !== "number") continue;
    const pu = units.find((x): x is DynU => x.kind === "dyn" && x.index === src); if (!pu) continue;
    const a = LEVELS.indexOf(pu.value as (typeof LEVELS)[number]), b = LEVELS.indexOf(u.value as (typeof LEVELS)[number]); if (a === b) continue;
    const sx = P(pu.x + 0.3 + inkOf(pu)[1] + PIN_GAP);
    let ex = P(u.x + 0.3 + inkOf(u)[0] - PIN_GAP);
    if (u.system === pu.system && ex - sx < P(1.4)) ex = sx + P(1.4);
    if (u.system < pu.system) continue;
    wedgeItems(u.index, b > a ? "cresc" : "dim", pu.system, sx, u.system, ex, true, dynKey(pu), dynKey(u));
  }
  // 力度那一层摆出来：同一行里 keys 有交集的连成一串（并查集），一串一起贴（共用一条基线）；从左往右摆，后摆的挨着前面的就叠上去。按行登记（一串只在一行上）
  if (!dynItems.length) return;
  const parent = dynItems.map((_, i) => i), find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  const byKey = new Map<string, number>();
  dynItems.forEach((it, i) => { for (const k of it.keys) { const j = byKey.get(k); if (j === undefined) byKey.set(k, i); else parent[find(i)] = find(j); } });
  const chains = new Map<number, number[]>();
  dynItems.forEach((_, i) => { const root = find(i), l = chains.get(root); if (l) l.push(i); else chains.set(root, [i]); });
  const minX = (ch: number[]) => Math.min(...ch.map((i) => dynItems[i]!.x0)), late = (ch: number[]) => (ch.some((i) => dynItems[i]!.late) ? 1 : 0);
  for (const ch of [...chains.values()].sort((a, b) => late(a) - late(b) || minX(a) - minX(b))) { const row = dynItems[ch[0]!]!.row; c.attach(row, "dynamics", () => { c.placeAbove(row, 0.4, (y) => { for (const i of ch) dynItems[i]!.draw(y); }); }); }
}

/** 音内的起伏（< / > / <>）+ 突强 / 强后即弱：音自己的修饰，挂件第 3 样（刀 4b：这个音自己那一段天际线往上 0.5）。突强 / 强后即弱的字对着音的中心（user「还是居中对齐」）；
 *  小发夹从音的左缘（有字 = 字后面）到这个音的宽，中线在字的半腰；做不到的画灰。原样从 staff/draw.ts 搬出（第四刀 4-4）：cx = 音的中心、x0 = 音的左缘、w = 这一列的宽（px）。 */
export function layNoteDynamics(c: OrnCtx, row: number, _ch: Chunk, a: { cx: number; x0: number; w: number; tok: number | undefined; cls: string | undefined; ign: ReadonlySet<string>; swl: "<" | ">" | "<>" | undefined; /** 这个音是滚奏（7-N）：认滚奏的演奏者上，音内起伏谁都能演（滚奏 = 连着敲撑起来的长音），不画灰。 */ roll?: boolean; atk: readonly ("sfz" | "fp")[] }): void {
  const { P, prims } = c, { cx, tok, cls, ign, swl, atk } = a;
  c.attach(row, "noteDynamics", () => c.placeAbove(row, 0.5, (y) => {
    let xa = a.x0;
    for (const k of atk) {
      const dp = SIGNS[`art:${k}`].draw[c.notation];
      if (dp.kind === "text") {   // 简谱：sfz / fp 也是细斜体字母（同力度）
        const gk = c.glyphScale ?? 1, w = P(c.mw("jp-dyn", dp.s) * gk), gx = cx - w / 2;
        prims.push({ tok, t: "text", x: gx, y, s: dp.s, cls: ["dyn jp-dyn", ign.has(k) ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" "), size: c.tx("jp-dyn") * gk, anchor: "start" });
        xa = Math.max(xa, gx + w + P(0.3)); continue;
      }
      const gs = c.glyphScale, ch = k === "sfz" ? "\u{E539}" : "\u{E534}", w = P((GLYPH_BOX[ch]?.[1] ?? 2.6) * (gs ?? 1)), gx = cx - w / 2;
      prims.push({ tok, t: "glyph", x: gx, y, ch, cls: ["dyn", ign.has(k) ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" "), ...(gs !== undefined ? { size: P(4 * gs) } : {}) });
      xa = Math.max(xa, gx + w + P(0.3));
    }
    if (!swl) return;
    const ym = y - P(0.5), xb = Math.max(xa + P(1.6), a.x0 + a.w - P(0.8)), H = P(0.35);
    const cl = ["hairpin", ign.has(swl === ">" ? "swellFade" : "swellGrow") && !(a.roll && !ign.has("roll")) ? "art-mute" : ""].filter(Boolean).join(" "), mx = (xa + xb) / 2;   // 滚奏的音例外（7-N）
    const d = swl === "<" ? `M${xb},${ym - H}L${xa},${ym}L${xb},${ym + H}` : swl === ">" ? `M${xa},${ym - H}L${xb},${ym}L${xa},${ym + H}` : `M${xa},${ym}L${mx},${ym - H}L${xb},${ym}M${xa},${ym}L${mx},${ym + H}L${xb},${ym}`;
    prims.push({ t: "path", d, cls: cl });
  }));
}

/** 踏板（11-1，设计稿 ai-docs/20261112-pedals-and-ring-design.md 第 5 节）：挂件最外一道——这一位最下面那条谱下面（歌词、8vb 再往外）。
 *  延音 =「Ped.」+ 一条线到抬起处、抬起处往上一个钩；换踏板 = 线上一个尖（先抬再踩）；持音 =「Sost.」、弱音 =「una corda」（细斜体字），同样的线和钩
 *  （统筹 11-12：三种踏板一个读法，范围看得见；弱音不写「tre corde」、不用「U.C.」）。
 *  道：三种严格按 延音 → 持音 → 弱音 从里往外，同一种在同一行永远一条基线；这一行没有的那种不占道（统筹 11-12）。离上面最近的东西（级数、歌词、下八度点…）至少 1 个线间距。
 *  同一行同一种踏板共用一条基线（一次贴：整行的线一样高）；三种踏板各一条，延音最靠谱。跨行 = 每行一段，下一行从行首接着画线（不再写「Ped.」）。
 *  不起作用的（已经踩着又踩、没踩就抬）照画、画灰（踩下 = 灰「Ped.」、抬起 = 灰「*」）；没踩就「换踏板」= 照踩下画（统筹 11-12：换完本来就是踩着的）。
 *  台上这位不认这种踏板（PartView.ignores 里有「pedal:<种类>」）= 整条画灰。纸尾还踩着 = 画到这张纸内容的右缘、照样有钩（放的时候纸尾就抬，sustainSpans）。 */
const PEDAL_GLYPH: Readonly<Record<"sustain" | "sostenuto", string>> = { sustain: "\u{E650}", sostenuto: "\u{E659}" };
const PEDAL_UP_GLYPH = "\u{E655}";
export function layPedals(c: OrnCtx): void {
  const { P, prims, dyns, tokens, units } = c;
  const peds = units.filter((u): u is PedalU => u.kind === "pedal");
  if (!peds.length) return;
  const chunks = units.filter((u): u is Chunk => u.kind === "chunk"), lastC = chunks[chunks.length - 1];
  const jp = c.notation !== "staff", gk = c.glyphScale ?? 1, K = PEDAL.scale;
  /** 纸尾（踏板记号后面没有音了 / 纸尾还踩着）：这张纸最后那一行内容的右缘（最后一个音占到哪；有收尾的小节线 = 到它前面），不早于最后一个音的墨后面一点。 */
  const paperEnd = (fallbackSys: number): { sys: number; x: number } => {
    if (!lastC) return { sys: fallbackSys, x: c.contentEnd(fallbackSys) - P(PEDAL.hookIn) };
    return { sys: lastC.system, x: Math.max(c.noteEnd(lastC) + P(0.6), c.contentEnd(lastC.system) - P(PEDAL.hookIn)) };
  };
  /** 这个记号作用在哪：后面那个音 / 休止的起点（音的墨的左边）；后面没有了 = 最后一个音后面一点（纸尾）。 */
  const at = (u: PedalU): { sys: number; x: number } => {
    const k = units.indexOf(u), nx = units.slice(k + 1).find((v): v is Chunk => v.kind === "chunk");
    if (nx) return { sys: nx.system, x: c.noteX(nx) };
    return paperEnd(u.system);
  };
  /** 一个字（踏板的名字 / 抬起的「*」）：画在 (x, y)，交回墨的宽高（px）。五线谱 = Bravura 字形；数字行 / 弱音的字 = 文字（简谱同力度用细斜体）。 */
  const word = (kind: "glyph" | "text", s: string, x: number, y: number, tok: number, cls: string): { w: number; h: number } => {
    if (kind === "glyph") {
      const b = GLYPH_BOX[s], w = P((b?.[1] ?? 4) * K), h = P((b ? b[3] - b[2] : 2.2) * K);
      prims.push({ tok, t: "glyph", x, y, ch: s, cls, size: P(4 * K) });
      return { w, h };
    }
    const role = jp ? "jp-dyn" : "dyn-word", k = jp ? gk : 1, fs = c.tx(role) * k;
    prims.push({ tok, t: "text", x, y, s, cls: `${cls} ${role}`, size: fs, anchor: "start" });
    return { w: P(c.mw(role, s) * k), h: fs * 0.75 };
  };
  const nameOf = (w: PedalKind): { kind: "glyph" | "text"; s: string } =>
    w === "soft" ? { kind: "text", s: "una corda" } : jp ? { kind: "text", s: w === "sustain" ? "Ped." : "Sost." } : { kind: "glyph", s: PEDAL_GLYPH[w] };
  const upOf = (): { kind: "glyph" | "text"; s: string } => (jp ? { kind: "text", s: "*" } : { kind: "glyph", s: PEDAL_UP_GLYPH });
  /** 每一行最近贴的那一种踏板的基线（局部，线间距）：下一种至少在它下面（道的先后）。 */
  const lanes = new Map<number, number>();
  /** 一种踏板的名字高出基线多少（px；同 word 的量法）。 */
  const nameH = (w: PedalKind): number => { const nm = nameOf(w); return nm.kind === "glyph" ? P(((GLYPH_BOX[nm.s] ? -GLYPH_BOX[nm.s]![2] : 2.2)) * K) : c.tx(jp ? "jp-dyn" : "dyn-word") * (jp ? gk : 1) * 0.75; };
  /** 一个字多宽多高（px），不画（摆之前查挤不挤）；同 word 的量法。 */
  const wordSize = (kind: "glyph" | "text", s: string): { w: number; h: number } => {
    if (kind === "glyph") { const b = GLYPH_BOX[s]; return { w: P((b?.[1] ?? 4) * K), h: P((b ? b[3] - b[2] : 2.2) * K) }; }
    const role = jp ? "jp-dyn" : "dyn-word", k = jp ? gk : 1; return { w: P(c.mw(role, s) * k), h: c.tx(role) * k * 0.75 };
  };
  for (const which of PEDAL_KINDS) {
    const mine = peds.filter((u) => u.which === which); if (!mine.length) continue;
    const mute = c.ignores.includes(`pedal:${which}`) ? " art-mute" : "", cls = `pedal${mute}`, nm = nameOf(which), nmW = wordSize(nm.kind, nm.s).w;
    /** 每一行要画的：main = 这一种的道上（名字、线、尖、钩；同一行一次贴、共用一条基线），taken = 道上被名字 / 钩占着的横向范围，greys = 不起作用的（灰），挤了往外让一道。 */
    type RowItems = { main: ((y: number) => void)[]; taken: [number, number][]; greys: { x0: number; x1: number; draw: (y: number) => void }[] };
    const byRow = new Map<number, RowItems>();
    const rowOf = (sy: number): RowItems => { const r = c.rowLow(sy); let it = byRow.get(r); if (!it) byRow.set(r, (it = { main: [], taken: [], greys: [] })); return it; };
    const hit = (sy: number, index: number, x: number, y: number, w: number, h: number) => dyns.push({ index, kind: "pedal", system: c.rowLow(sy), x, y, w, h });
    /** 一段踩着的线：从 (s0, x0) 到 (s1, x1)；notches = 换踏板的尖；hook = 抬起的钩挂在谁身上（undefined = 纸尾抬起，钩不挂 token）。
     *  挤的时候（换踏板 / 抬起紧跟在踩下后面、落在名字的宽里）照先后往右挪到线上第一个空处——一个都不丢（显示 = 全量）。 */
    const lineSpan = (startIdx: number, s0: number, x0: number, s1: number, x1: number, notches: { sys: number; x: number; index: number }[], hookIdx: number | undefined) => {
      const N = P(PEDAL.notch);
      for (let sy = s0; sy <= s1; sy++) {
        const a = sy === s0 ? x0 : c.left(sy) + P(0.3), closes = sy === s1;
        const ns: { x: number; index: number }[] = []; let minX = a + N;
        for (const n of notches.filter((m) => m.sys === sy).sort((m, k) => m.x - k.x)) { const x = Math.max(n.x, minX); ns.push({ x, index: n.index }); minX = x + 2 * N + P(0.2); }
        const b = closes ? Math.max(x1, ns.length ? ns[ns.length - 1]!.x + N + P(0.2) : a) : c.rowEnd(sy);   // 接到下一行的：画到这一行的行尾
        const it = rowOf(sy); if (closes) it.taken.push([b - P(0.6), b + P(0.6)]);
        it.main.push((y) => {
          const H = P(PEDAL.hook);
          // 线：一笔，尖的地方断开（尖另画一笔，挂换踏板那个 token）
          const pieces: string[] = []; let from = a;
          for (const n of ns) { pieces.push(`M${from},${y}L${n.x - N},${y}`); from = n.x + N; }
          pieces.push(`M${from},${y}L${b},${y}`);
          prims.push({ tok: tokens[startIdx]!.id, t: "path", d: pieces.join(""), cls });
          for (const n of ns) {
            prims.push({ tok: tokens[n.index]!.id, t: "path", d: `M${n.x - N},${y}L${n.x},${y - H}L${n.x + N},${y}`, cls });
            dyns.push({ index: n.index, kind: "pedal", system: c.rowLow(sy), x: n.x - N - P(0.3), y: y - H - P(0.4), w: 2 * N + P(0.6), h: H + P(0.8) });
          }
          if (closes) {
            prims.push({ ...(hookIdx !== undefined ? { tok: tokens[hookIdx]!.id } : {}), t: "path", d: `M${b},${y}L${b},${y - H}`, cls });
            if (hookIdx !== undefined) dyns.push({ index: hookIdx, kind: "pedal", system: c.rowLow(sy), x: b - P(0.6), y: y - H - P(0.4), w: P(1.2), h: H + P(0.8) });
          }
        });
      }
    };
    /** 不起作用的（画灰）：踩着又踩 = 灰名字，没踩就抬 = 灰「✱」。 */
    const grey = (u: PedalU, p: { sys: number; x: number }, w: { kind: "glyph" | "text"; s: string }) => {
      const sz = wordSize(w.kind, w.s), id = tokens[u.index]!.id;
      rowOf(p.sys).greys.push({ x0: p.x, x1: p.x + sz.w, draw: (y) => { const m = word(w.kind, w.s, p.x, y, id, "pedal art-mute"); hit(p.sys, u.index, p.x - P(0.3), y - m.h - P(0.3), m.w + P(0.6), m.h + P(0.7)); } });
    };
    let down: { sys: number; x: number; idx: number } | null = null, notches: { sys: number; x: number; index: number }[] = [];
    const finish = (endSys: number, endX: number, hookIdx: number | undefined) => {
      const d = down!; down = null;
      lineSpan(d.idx, d.sys, d.x + nmW + P(PEDAL.textGap), endSys, endX, notches, hookIdx);
    };
    /** 靠默认踩着的那一截里起作用的记号（踏板 11-3，统筹「默认留住音的那一截怎么画」）：没有「Ped.」和线可收，照实色画、带一小段线，屏幕和印出来一样。
     *  抬起 = 钩 + 左边一小段线；换踏板 = 尖 + 两边各一小段（形状同不起作用的「抬起」那个没有线的画法，这里是实色）。 */
    const STUB = P(1.2);
    const stub = (u: PedalU, p: { sys: number; x: number }, kind: "up" | "change") => {
      const it = rowOf(p.sys), N = P(PEDAL.notch), H = P(PEDAL.hook), id = tokens[u.index]!.id;
      if (kind === "up") {
        const b = p.x - P(PEDAL.hookIn); it.taken.push([b - STUB, b + P(0.6)]);
        it.main.push((y) => { prims.push({ tok: id, t: "path", d: `M${b - STUB},${y}L${b},${y}L${b},${y - H}`, cls }); dyns.push({ index: u.index, kind: "pedal", system: c.rowLow(p.sys), x: b - STUB, y: y - H - P(0.4), w: STUB + P(0.6), h: H + P(0.8) }); });
      } else {
        const x = p.x; it.taken.push([x - N - STUB, x + N + STUB]);
        it.main.push((y) => { prims.push({ tok: id, t: "path", d: `M${x - N - STUB},${y}L${x - N},${y}L${x},${y - H}L${x + N},${y}L${x + N + STUB},${y}`, cls }); dyns.push({ index: u.index, kind: "pedal", system: c.rowLow(p.sys), x: x - N - P(0.3), y: y - H - P(0.4), w: 2 * N + P(0.6), h: H + P(0.8) }); });
      }
    };
    // 这一段开头靠默认踩着（这位没写踏板记号时留住音，踏板 11-3）：这一截不画；到谱上第一次写的抬起为止
    let dflt = which === "sustain" && !!c.pedalHeld;
    for (const u of mine) {
      const p = at(u);
      if (dflt) {
        if (u.act === "down") { grey(u, p, nm); continue; }   // 默认留住时又写踩下：不起作用（画灰）
        if (u.act === "change") { stub(u, p, "change"); continue; }
        stub(u, p, "up"); dflt = false; continue;   // 抬起：从这里起照谱上写的
      }
      if (u.act === "down" || (u.act === "change" && !down)) {
        if (down) { grey(u, p, nm); continue; }   // 已经踩着又踩：不起作用
        const it = rowOf(p.sys), id = tokens[u.index]!.id;
        it.taken.push([p.x, p.x + nmW]);
        it.main.push((y) => { const m = word(nm.kind, nm.s, p.x, y, id, cls); hit(p.sys, u.index, p.x - P(0.3), y - m.h - P(0.3), m.w + P(0.6), m.h + P(0.7)); });
        down = { sys: p.sys, x: p.x, idx: u.index }; notches = [];
        continue;
      }
      if (u.act === "change") { notches.push({ sys: p.sys, x: p.x, index: u.index }); continue; }
      if (!down) { grey(u, p, upOf()); continue; }   // 没踩就抬：不起作用
      finish(p.sys, p.x - P(PEDAL.hookIn), u.index);
    }
    if (down) {   // 纸尾还踩着 = 纸尾抬起（钩不挂 token）
      const end = paperEnd((down as { sys: number }).sys);
      finish(end.sys, end.x, undefined);
    }
    // 道：这一行前一种踏板（更靠谱的）的基线往下至少「这一种的字高 + 1 个线间距」——那一种在这一段 x 上没有墨时也不往里钻（统筹 11-12 ②）。
    //   灰的那几个：和道上的名字 / 钩、和同一道上别的灰的挤了 = 往外让一道（同段尾力度挤了挪到外面一道的规矩）；一道里从左往右摆
    const top = Math.max(nameH(which), P(PEDAL.hook)) / P(1);
    for (const [row, it] of byRow) c.attach(row, "pedal", () => {
      const subs: { taken: [number, number][]; draws: ((y: number) => void)[] }[] = [{ taken: [...it.taken], draws: [...it.main] }];
      const pad = P(0.3), free = (tk: [number, number][], a: number, b: number) => tk.every(([x0, x1]) => b + pad <= x0 || a >= x1 + pad);
      for (const g of [...it.greys].sort((m, k) => m.x0 - k.x0)) {
        let k = 0; while (k < subs.length && !free(subs[k]!.taken, g.x0, g.x1)) k++;
        if (k === subs.length) subs.push({ taken: [], draws: [] });
        subs[k]!.taken.push([g.x0, g.x1]); subs[k]!.draws.push(g.draw);
      }
      let prev = lanes.get(row);
      subs.forEach((sb, k) => {
        if (!sb.draws.length) return;
        const dy = c.placeBelow(row, k ? 0.4 : PEDAL.gap, (y) => { for (const d of sb.draws) d(y); }, prev === undefined ? {} : { min: prev + top + (k ? 0.4 : PEDAL.gap) });
        prev = dy;
      });
      if (prev !== undefined) lanes.set(row, prev);
    });
  }
}
