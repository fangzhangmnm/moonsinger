// ornaments —— 两种行的画法共用的挂件（施工单第三节「4」：力度、渐强渐弱、渐到、反复房子 / 跳转、速度、风格）：位置只吃画法给的锚点，画成什么查记号表（src/render/signs.ts）。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第四刀 4-3：代码原样从 staff/draw.ts 搬出，五线谱传它原来的锚点 = 每一行画出来和原来一样）。
//   每一样都按行登记（attach(行, 道, …)；统筹审第四刀接口第 3 条：每一行按它自己那种画法的道的先后贴）；一次跨好几行的（发夹、房子）拆成一行一个。
//   这里不是框架（frame/ 不认字形）：画法 import 它；它认得的只有记号表、文字样式和 Bravura 的速度音符。
import { DYNS, type Song, type PaperSeg, type Token, type GrooveTok, type NavTok, NAV_LABEL, endingLabel, tempoWord, rampSource } from "../../score/song.ts";
import { grooveLabel, grooveStyle } from "../../score/groove.ts";
import type { NotationId } from "../../score/song-view.ts";
import { TEMPO_EM, type TextRole } from "../text/index.ts";
import { GLYPH } from "../smufl.ts";
import { MARGIN } from "../frame/params.ts";
import type { LaneKind } from "../frame/lanes.ts";
import type { Prim, EngraveOpts, DynHit, MarkHit } from "../engrave.ts";
import type { Unit, Chunk, DynU, NavU } from "../frame/units.ts";
import { dynDepiction } from "../signs.ts";
import { GLYPH_BOX } from "../glyph-box.gen.ts";

/** 渐强渐弱和两头的字之间留多少（sp）；比一整行还长 = 写「cresc. - - -」（字的大概宽 / 虚线一节多长、隔多远）；渐到的虚线。原样从 staff/glyphs.ts 搬来。 */
export const PIN_GAP = 0.7;
/** 一个楔形（发夹 / 渐到）最短多长（sp）：整条短于它就拉到它；折到下一行的那一段短于它就不画。 */
export const PIN_MIN = 1.4;
export const PIN_WORD = { w: { cresc: 4.7, dim: 3.5 } } as const, DASH = { len: 0.6, gap: 1.0 } as const;
export const RAMP_DASH = { len: 0.5, gap: 0.4 } as const;

/** 画法交给挂件的（一条轨在这张纸上）。 */
export interface OrnCtx {
  /** notation = 记号表查哪一栏 = 这一行的种类（不是这首歌的谱种：简谱歌里照旧排五线谱的行查五线谱那一栏）。 */
  song: Song; paper: PaperSeg; o: EngraveOpts; notation: NotationId;
  P: (v: number) => number; tx: (role: TextRole) => number; TR: (role: TextRole, v: number) => number; RS: (role: TextRole) => number; mw: (role: TextRole, s: string) => number; sp: number;
  prims: Prim[]; dyns: DynHit[]; marks: MarkHit[];
  placeAbove: (row: number, gap: number, draw: (y: number) => void) => number;
  attach: (row: number, lane: LaneKind, run: () => void) => void;
  /** 这一行的右边界（sp）。 */
  right: number;
  /** 这一行字形的尺寸比例（力度字、突强 / 强后弱）：数字行 = 排版参数表行一级的 scale（第五刀 5-0c）；五线谱不给 = 原样。 */
  glyphScale?: number;
  tokens: Token[]; units: Unit[];
  /** 这条轨第 s 行挂挂件的那一行（五线谱 = 第一张谱表）。 */
  row: (s: number) => number;
  /** 音的墨的左边 / 右边（px）：五线谱 = 符头；简谱 = 数字。 */
  noteX: (c: Chunk) => number; noteEnd: (c: Chunk) => number;
  /** 被紧跟着的强后即弱盖掉的力度记号（画灰）；不起作用的跳转（画灰的 class 后缀）。 */
  dynOff: ReadonlySet<number>; navMute: (i: number) => string;
}

/** 速度记号画在基线 y（「Andante ♩ = 88」：词 + 四分音符 + 数）；change = 这一段开头比上一段快 / 慢（前面标 ↑ / ↓）。 */
export function tempoAt(c: OrnCtx, r: number, x0: number, v: number, cls: string, index: number, change: "up" | "down" | undefined, y: number): void {
  const { P, tx, TR, RS, mw, prims, marks } = c;
  const fs = tx("tempo-word"), word = tempoWord(v).it, k = RS("tempo-word"), T = c.tokens[index] ? { tok: c.tokens[index]!.id } : {};   // 速度的字挂速度那个 token（守卫 4，第五刀 5-3）   // 尺子查样式表（v0.16.48 起跟谱，user「速度那一串字号…也应该跟着走」）
  // 这一段开头的速度和上一段不一样 = 前面标一个强调色的 ↑（快了）/ ↓（慢了）提示（user 2026-10-08「不要grey out，而是有变化的时候会标一个东西提示用户」；一样 = 照常画，不标）
  if (change) prims.push({ t: "text", x: P(x0 - 0.3), y, s: change === "up" ? "↑" : "↓", cls: "tempo-change ann", size: fs, anchor: "end" });
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
  const gt = tokens[u.index] as GrooveTok, gr = c.row(u.system), label = grooveLabel(gt), known = !!grooveStyle(gt.style);
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
  /** 一个力度字：怎么画 + 墨迹（sp，相对字的原点：左、右、基线以上、基线以下）。 */
  const dynOf = (v: DynU["value"]) => {
    const d = dynDepiction(v, notation), g = c.glyphScale;
    if (g === undefined) return { ink: d.ink, draw: (x: number, y: number, tok: number, cls: string) => prims.push({ t: "glyph", x, y, ch: d.glyph, tok, cls }) };
    return { ink: [d.ink[0] * g, d.ink[1] * g, d.ink[2] * g, d.ink[3] * g] as const, draw: (x: number, y: number, tok: number, cls: string) => prims.push({ t: "glyph", x, y, ch: d.glyph, tok, cls, size: P(4 * g) }) };
  };
  const dynItems: { row: number; x0: number; keys: string[]; draw: (base: number) => void }[] = [];
  // 力度：谱上方、和后面那个音左对齐；挂件第 4 样（刀 4b：和用发夹连着的一串共用一条基线，贴它们自己那几段天际线往上 0.4；挨得近的两个 = 后摆的那个自然叠上去）
  for (const u of units) {
    if (u.kind !== "dyn") continue;
    const dr = c.row(u.system), ui = units.indexOf(u), dd = dynOf(u.value), [il, ir, iu, id] = dd.ink;
    dynItems.push({ row: dr, x0: P(u.x + 0.3 + il), keys: [`${dr}|d${ui}`], draw: (dy) => {
      dd.draw(P(u.x + 0.3), dy, tokens[u.index]!.id, "dyn" + (dynOff.has(u.index) ? " art-mute" : ""));
      dyns.push({ index: u.index, kind: "dyn", system: dr, x: P(u.x + 0.3 + il - 0.3), y: dy - P(iu + 0.4), w: P(ir - il + 0.6), h: P(iu + id + 0.8) });
    } });
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
  const wedgeItems = (index: number, dir: "cresc" | "dim", s0: number, startX: number, s1: number, endX: number, ramp: boolean, k0?: string, k1?: string, tail?: (base: number) => void) => {
    const leftOf = (sy: number) => Math.min(...units.filter((u): u is Chunk => u.kind === "chunk" && u.system === sy).map((ch) => c.noteX(ch)), P(right)) - P(1);
    const segs: [number, number, number][] = [];
    for (let sy = s0; sy <= s1; sy++) segs.push([sy, sy === s0 ? startX : leftOf(sy), sy === s1 ? endX : P(right) - P(0.3)]);
    const total = segs.reduce((n, [, a, b]) => n + Math.max(0, b - a), 0) || 1, H = P(0.5), long = total > P(right - MARGIN);
    const word = dir === "cresc" ? "cresc." : "dim.", ww = P(PIN_WORD.w[dir === "cresc" ? "cresc" : "dim"]);
    let said = false, acc = 0, tailDone = false;
    segs.forEach(([sy, a0, b], i) => {
      if (b - a0 < P(0.3) || (i > 0 && b - a0 < P(PIN_MIN))) return;   // 折到下一行的那一段短到画不出一个楔形 = 不画（统筹看第四刀成品样张后定的第 2 处：行首力度字前面那一小截虚线）
      const row = c.row(sy), keys = [wedgeKey(index, sy)], last = i === segs.length - 1;
      if (i === 0 && k0) keys.push(k0);
      if (last && k1) keys.push(k1);
      if (last) tailDone = true;
      if (long) {   // 太长：「cresc.」+ 虚线，跨行接着画虚线；第一段放得下字才写（行尾剩一点点 = 字挪到下一行开头）
        const writeWord = !said && b - a0 >= ww + P(1); if (writeWord) said = true;
        dynItems.push({ row, x0: a0, keys, draw: (base) => {
          const midY = base - P(0.5); let a = a0;
          if (writeWord) { prims.push({ t: "text", x: a, y: midY + P(0.5), s: word, tok: tokens[index]!.id, cls: ["dyn-word", ramp ? "ramp" : ""].filter(Boolean).join(" "), size: tx("dyn-word"), anchor: "start" }); a += ww + P(0.6); }
          for (let x = a; x + P(DASH.len) <= b; x += P(DASH.len + DASH.gap)) prims.push({ t: "line", x1: x, y1: midY, x2: x + P(DASH.len), y2: midY, w: P(0.12), cls: "dyn-dash" });
          dyns.push({ index, kind: "hairpin", system: row, x: a0, y: midY - P(1.4), w: b - a0, h: P(2.8) });
          if (last && tail) tail(base);
        } });
        return;
      }
      const f0 = acc / total, f1 = (acc + b - a0) / total; acc += b - a0;
      const [h0, h1] = dir === "cresc" ? [H * f0, H * f1] : [H * (1 - f0), H * (1 - f1)];
      dynItems.push({ row, x0: a0, keys, draw: (base) => {
        const y = base - P(0.5), a = a0;   // 发夹的中线 = 力度字的半腰
        // 渐到 = 虚线：两条边的每一小段在同一个 x 上（以前靠 CSS stroke-dasharray——iPad Safari 上第二条边的虚线接着第一条的相位走，尖头那边两条快重合时一段段错开打架，v0.10.26）
        let d = `M${a},${y - h0}L${b},${y - h1}M${a},${y + h0}L${b},${y + h1}`;
        if (ramp) {
          const hAt = (x: number) => h0 + (h1 - h0) * ((x - a) / (b - a)), on = P(RAMP_DASH.len), per = P(RAMP_DASH.len + RAMP_DASH.gap);
          d = "";
          for (let x = a; x < b - P(0.05); x += per) { const x2 = Math.min(b, x + on); d += `M${x},${y - hAt(x)}L${x2},${y - hAt(x2)}M${x},${y + hAt(x)}L${x2},${y + hAt(x2)}`; }
        }
        prims.push({ tok: tokens[index]!.id, t: "path", d, cls: ["hairpin", ramp ? "ramp" : ""].filter(Boolean).join(" ") });
        dyns.push({ index, kind: "hairpin", system: row, x: a, y: y - P(1.4), w: b - a, h: P(2.8) });
        if (last && tail) tail(base);
      } });
    });
    if (!tailDone && tail) dynItems.push({ row: c.row(s1), x0: endX, keys: [wedgeKey(index, s1), ...(k1 ? [k1] : [])], draw: tail });   // 最后一段太短没画：推定的灰字照样写
  };
  units.forEach((h, hi) => {
    if (h.kind !== "hairpin" || !lastChunk) return;
    // 紧挨在前面的力度记号（mp < 这种）：从它的字后面起画，别压在字上
    const prevU = units[hi - 1];
    const dynBefore = prevU && prevU.kind === "dyn" && prevU.system === h.system ? prevU : null;
    const startX = Math.max(P(h.x + 0.3), dynBefore ? P(dynBefore.x + 0.3 + inkOf(dynBefore)[1] + PIN_GAP) : 0), s0 = h.system;
    const endU = units.slice(hi + 1).find((u) => u.kind === "dyn" || u.kind === "hairpin");
    // 终点的力度和方向反着（渐弱后面更强 / 一样）= 方向说了算：走一档、到那儿突变（perform.ts dynLevels）→ 发夹末端照样画灰字推定的那一档，让开它（2026-10-08 user「同意」）
    let curDyn: string = "mf"; for (let j = h.index - 1; j >= 0; j--) { const t = tokens[j]!; if (t.kind === "dyn") { curDyn = t.value; break; } }
    const ci = LEVELS.indexOf(curDyn as (typeof LEVELS)[number]), against = !!endU && endU.kind === "dyn" && (h.dir === "cresc" ? LEVELS.indexOf(endU.value) <= ci : LEVELS.indexOf(endU.value) >= ci);
    const IMPLIED_W = 3;   // 灰字「(mp)」大概多宽（sp，1.3 号斜体）
    const endX = endU ? P(endU.x + 0.3 + (endU.kind === "dyn" ? inkOf(endU)[0] : 0) - PIN_GAP - (against ? IMPLIED_W + 0.4 : 0)) : c.noteEnd(lastChunk) + P(0.8), s1 = endU ? endU.system : lastChunk.system;   // 终点的字画在 x + 0.3
    if (s1 < s0) return;
    // 太短也照样画（以前不到 1 个间距就整条不画 = 静默没了）：至少 MIN_PIN；灰字放不下就挪到发夹末端上面
    let endXd = endX, labelAbove = false;
    const MIN_PIN = P(PIN_MIN);
    if (s1 === s0 && endXd - startX < MIN_PIN) {
      const roomy = against ? endXd + P(IMPLIED_W + 0.4) : endXd;   // 不让灰字占地方时能有多长
      if (against) labelAbove = true;
      endXd = Math.max(startX + MIN_PIN, Math.min(roomy, startX + MIN_PIN * 2));
    }
    const k1 = !endU ? undefined : endU.kind === "dyn" ? dynKey(endU) : wedgeKey(endU.index, endU.system);
    const tail = !endU || against ? (base: number) => {   // 推定的终点：现在的力度往上 / 往下一档（没有终点 / 终点和方向反着）
      const k = Math.max(0, Math.min(LEVELS.length - 1, ci + (h.dir === "cresc" ? 1 : -1)));
      prims.push({ t: "text", x: labelAbove ? endXd - P(1.2) : endXd + P(0.4), y: base + P(labelAbove ? -1.9 : 0.1), s: `(${LEVELS[k]})`, cls: "dyn-implied ann", size: tx("dyn-implied"), anchor: "start" });
    } : undefined;
    wedgeItems(h.index, h.dir, s0, startX, s1, endXd, false, dynBefore ? dynKey(dynBefore) : undefined, k1, tail);
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
  const minX = (ch: number[]) => Math.min(...ch.map((i) => dynItems[i]!.x0));
  for (const ch of [...chains.values()].sort((a, b) => minX(a) - minX(b))) { const row = dynItems[ch[0]!]!.row; c.attach(row, "dynamics", () => { c.placeAbove(row, 0.4, (y) => { for (const i of ch) dynItems[i]!.draw(y); }); }); }
}

/** 音内的起伏（< / > / <>）+ 突强 / 强后即弱：音自己的修饰，挂件第 3 样（刀 4b：这个音自己那一段天际线往上 0.5）。突强 / 强后即弱的字对着音的中心（user「还是居中对齐」）；
 *  小发夹从音的左缘（有字 = 字后面）到这个音的宽，中线在字的半腰；做不到的画灰。原样从 staff/draw.ts 搬出（第四刀 4-4）：cx = 音的中心、x0 = 音的左缘、w = 这一列的宽（px）。 */
export function layNoteDynamics(c: OrnCtx, row: number, _ch: Chunk, a: { cx: number; x0: number; w: number; tok: number | undefined; cls: string | undefined; ign: ReadonlySet<string>; swl: "<" | ">" | "<>" | undefined; atk: readonly ("sfz" | "fp")[] }): void {
  const { P, prims } = c, { cx, tok, cls, ign, swl, atk } = a;
  c.attach(row, "noteDynamics", () => c.placeAbove(row, 0.5, (y) => {
    let xa = a.x0;
    for (const k of atk) {
      const gs = c.glyphScale, ch = k === "sfz" ? "\u{E539}" : "\u{E534}", w = P((GLYPH_BOX[ch]?.[1] ?? 2.6) * (gs ?? 1)), gx = cx - w / 2;
      prims.push({ tok, t: "glyph", x: gx, y, ch, cls: ["dyn", ign.has(k) ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" "), ...(gs !== undefined ? { size: P(4 * gs) } : {}) });
      xa = Math.max(xa, gx + w + P(0.3));
    }
    if (!swl) return;
    const ym = y - P(0.5), xb = Math.max(xa + P(1.6), a.x0 + a.w - P(0.8)), H = P(0.35);
    const cl = ["hairpin", ign.has(swl === ">" ? "swellFade" : "swellGrow") ? "art-mute" : ""].filter(Boolean).join(" "), mx = (xa + xb) / 2;
    const d = swl === "<" ? `M${xb},${ym - H}L${xa},${ym}L${xb},${ym + H}` : swl === ">" ? `M${xa},${ym - H}L${xb},${ym}L${xa},${ym + H}` : `M${xa},${ym}L${mx},${ym - H}L${xb},${ym}M${xa},${ym}L${mx},${ym + H}L${xb},${ym}`;
    prims.push({ t: "path", d, cls: cl });
  }));
}
