// note-cell.ts —— 数字行上一个音 / 休止的盒子：量和画用同一个（第八刀 8-2；施工单第 8 节「量 = 画」）。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。图元原样从 draw.ts 搬来（作者和来历见那边：谱面分家第四刀、第五刀、7-B、7-D、7-K）；
//   改的只是「摆在哪」：贴着音的东西不再按「离基线多远」的写死数摆，而是按 place.ts 的表贴在盒子这一边现在的实际边缘外面（frame/cell.ts）。
//   坐标 = 数字行自己的单位：x 相对这一列（u.x），y = 行的局部坐标（draw.ts 的 Y(row, v) 那一套）。画的时候整块放大成 px（skyline.ts scalePrim）。
//   两层：头 = 第一个字形（和弦 = 叠起来的那一摞）+ 贴在它身上的；整个 = 头 + 后面的横线 / 0（落在拍上，核）+ 附点、换气（贴在最右边）。
import type { Prim } from "../engrave.ts";
import type { Chunk } from "../frame/units.ts";
import { cell, type Cell, type Part, type Ink } from "../frame/cell.ts";
import { toDegree } from "../../score/degree.ts";
import { midiOf } from "../../score/pitch.ts";
import { percOf } from "../../gm/percussion.ts";
import { type JianpuTrack, type JianpuMode, type JianpuAux, foldOf, extraGlyphs, hasAugDot, underlines, accsOf, hasArp, contDash as isContDash, lettersOf } from "./chunk.ts";
import { PLACE, gapOf, groupOf, type PlaceId } from "./place.ts";
import { DIGIT_EM, DIGIT_W, BASE_Y, UL_Y0, UL_GAP, UL_W, DOT_R, DOT_STEP, ACC_EM, DASH_L, DASH_W, DASH_Y, DASH_PITCH, AUG_R, AUG_Y,
  BREATH_W, INHALE_W, DIGIT_H, X_EM, KIT_CHAR, KIT_EM, letterW, letterParts, CHORD_GAP, SCRIPT_K, SCRIPT_GAP, SUP_DY, SUB_DY, SUB_DROP, SUP_RISE, LOW_DOT_UNDER, GHOST_K,
  STACC_W, STACC_H, TEN_L, TEN_W, BREATH_EM, BREATH_Y, CHORD_EM, CHORD_SX, CHORD_H, CHORD_AMB_W, chordNameW, chordBassCx, stackBases, dotPath, DOT_GAP,
  ACC_GLYPH_EM, ACC_RISE, ACC_SEP, accGlyphs, accGlyphsOfText, accRunW, supAccEm, accStroke } from "./glyphs.ts";

export interface NoteCellIn {
  u: Chunk; q: JianpuTrack; mode: JianpuMode; aux?: JianpuAux;
  /** 这一处的调（级数按它算）和八度基准（draw.ts 按整条轨定的；没有 = 0）。 */
  fifths: number; base: number;
  /** 后面的横线 / 0 一拍多宽（数字行的单位）：画的时候按排完版之后占到的宽算；量的时候 = null（最少的 DASH_PITCH）。 */
  step: number | null;
  /** 这一段占到哪（数字行的单位，相对这一列）：换气的 V 不越过它（离它留一点），挤不下最多贴到离最后一个字形 0.1；量的时候不用给。 */
  limit?: number;
  /** 第一条下划线的中线（局部 y）：同一拍的一组先对齐到组里最低的核（8-3「成组的」）——画的时候 draw.ts 按组算好给；没给 = 按自己的核（量的时候）。 */
  ulY?: number;
  tok?: number;
  /** 演奏法的类名（台上那位不认的画灰）；量的时候不用给。 */
  artCls?: (a: string, base?: string) => string;
  /** 「吸 / 深吸」那行小字（字、字号，数字行的单位）；量的时候不用给（宽照 INHALE_W 留）。 */
  inhale?: { text: string; size: number };
}
export interface NoteCellOut {
  cell: Cell;
  /** 第一个字形从哪起、中心、多宽（数字行的单位，相对这一列）。 */
  x0: number; cx: number; glyphW: number;
  /** 叠着的每个音：ps 里的下标、基线（点击框用）；最上面那个的基线。 */
  members: { i: number; yb: number }[]; hiBase: number;
  /** 画了数字的音（不是接着上一段的横线）：弧线要的上沿（局部 y）。 */
  top?: number;
  /** 盒子下边到哪（局部 y；含下划线、低八度点、滚奏）：连音的数字 / 括号贴在一组里最低的那个下面。 */
  bot: number;
  /** 左边挂了东西（升降号、琶音）：紧挨着音的那一个离音多远。量的时候框架按它要求「前一个音的墨到这个挂件」至少 4 倍（统筹定的规矩）。 */
  leftGap?: number;
}

const T0 = (tok: number | undefined) => (tok !== undefined ? { tok } : {});
const textInk = (x0: number, x1: number, top: number, base: number): Ink => ({ x0, x1, y0: top, y1: base });
const part = (ink: Ink, prims: Prim[]): Part => ({ ink, prims });
const unionInk = (ks: readonly Ink[]): Ink => ({ x0: Math.min(...ks.map((k) => k.x0)), x1: Math.max(...ks.map((k) => k.x1)), y0: Math.min(...ks.map((k) => k.y0)), y1: Math.max(...ks.map((k) => k.y1)) });
/** 核的下沿（局部 y）：最低的那个字形的底——数字 / 0 / X = 基线；字母谱 = 右下角八度数字的底；整套鼓的件字往上挪了一点。下划线按一组里最低的这个对齐（8-3）。 */
export function coreBottom(u: Chunk, q: JianpuTrack, mode: JianpuMode, aux?: JianpuAux): number {
  if (!u.note || u.ghost || !u.pitch || isContDash(u)) return BASE_Y;
  if (mode === "x") return q.p.perc?.kind === "kit" ? BASE_Y - DIGIT_H * 0.12 : BASE_Y;
  return lettersOf(q, u, mode, aux) ? BASE_Y + SUB_DY * (u.art.includes("ghost") ? GHOST_K : 1) : BASE_Y;
}
/** 第一条下划线离核的下沿多远（中线；样张：数字基线下 0.273 字号）。 */
export const UL_DROP = UL_Y0 - BASE_Y;
/** 一串升降号字形（7-P：Bravura）：右边对齐 xr、顶在 top；回图元和墨迹框。 */
function accRun(gs: readonly { ch: string; box: readonly number[]; dom: number }[], em: number, xr: number, top: number, cls: string, T: { tok?: number }, main: number): { prims: Prim[]; ink: Ink } {
  const prims: Prim[] = [], w = accRunW(gs, em), h = Math.max(...gs.map((g) => ((g.box[3]! - g.box[2]!) * em) / 4));
  let x = xr - w;
  for (const g of gs) { const gw = ((g.box[1]! - g.box[0]!) * em) / 4; const sk = accStroke(g, em, main); prims.push({ ...T, t: "glyph", x: x - (g.box[0]! * em) / 4, y: top - (g.box[2]! * em) / 4, ch: g.ch, cls, size: em, ...(sk > 0 ? { stroke: sk } : {}) }); x += gw + ACC_SEP; }   // 描边补粗（7-P）
  return { prims, ink: { x0: xr - w, x1: xr, y0: top, y1: top + h } };
}

export function noteCell(a: NoteCellIn): NoteCellOut {
  const { u, q, mode, aux } = a, T = T0(a.tok), art = a.artCls ?? ((x: string, b = "art") => b || x);
  const fd = mode === "digits" ? foldOf(u, aux) : undefined, nameW = fd ? chordNameW(fd.name) : 0, lt = lettersOf(q, u, mode, aux), glyphW = fd ? nameW + (fd.ambiguous ? CHORD_AMB_W : 0) : lt ? lt.w : DIGIT_W;
  const x0 = 0.1, cx = x0 + glyphW / 2, n = extraGlyphs(u), contDash = isContDash(u), small = u.art.includes("ghost"), gk = small ? GHOST_K : 1;
  const letters = q.letters !== undefined && mode === "digits", xHead = mode === "digits" && !!q.p.xHead, kit = q.p.perc?.kind === "kit";
  const nUL = underlines(u);
  /** 这个音自己那几层下划线最下面一条的底（局部 y）：低八度点、滚奏、连音的数字都贴在它外面。 */
  const ulBot = nUL ? (a.ulY ?? coreBottom(u, q, mode, aux) + UL_DROP) + (nUL - 1) * UL_GAP + UL_W / 2 : 0;
  const head = cell();
  const digitPart = (x: number, y: number, s: string, cls: string, k = gk): Part =>
    part(textInk(x - (DIGIT_W * k) / 2, x + (DIGIT_W * k) / 2, y - DIGIT_H * k, y), [{ ...T, t: "text", x, y, s, cls, size: DIGIT_EM * k, anchor: "middle" }]);
  const dashPart = (x: number): Part => part({ x0: x - DASH_L / 2, x1: x + DASH_L / 2, y0: DASH_Y - DASH_W / 2, y1: DASH_Y + DASH_W / 2 }, [{ ...T, t: "line", x1: x - DASH_L / 2, y1: DASH_Y, x2: x + DASH_L / 2, y2: DASH_Y, w: DASH_W, cls: "jp-dash" }]);
  /** 横线 / 0 落在第 k 拍：一拍一个字形，在那一拍里的位置和第一个字形在第一拍里一样（draw.ts 原来的 gx）。 */
  const step = a.step ?? DASH_PITCH;
  const lFirst = lt ? Math.max(x0 + DIGIT_W / 2 + step, x0 + glyphW + DASH_L / 2 + 0.5) : 0;
  const gx = (k: number) => (k === 0 ? cx : lt ? lFirst + (k - 1) * step : x0 + glyphW - DIGIT_W / 2 + k * step);
  /** 每一组已经贴了几个（间隔按「这一组的第一个 / 后面的」取：跳音贴在八度点上面照旧离 MARK_GAP）。 */
  const count: Record<string, number> = {};
  let leftGap: number | undefined;
  const stick = (id: PlaceId, p: Part, o: { align?: "center" | "start" | "end"; cross?: number } = {}, c: Cell = head): Ink => {
    const g = groupOf(id), k = count[g] ?? 0, gap = gapOf(id, k); count[g] = k + 1;
    if (PLACE[id].side === "left" && leftGap === undefined) leftGap = gap;
    if (PLACE[id].side === "below" && nUL) head.reserve("below", ulBot);   // 有下划线 = 下面的东西贴在下划线底下（7-D；8-3 下划线按组对齐）
    return c.attach(PLACE[id].side, p, { gap, ...o });
  };
  let members: { i: number; yb: number }[] = [], hiBase = BASE_Y, top: number | undefined;

  if (u.note && (u.ghost || !u.pitch)) {   // 没写音高的音：灰色「x」+ 长音横线（施工单第五节先顶上的写法）
    head.core(contDash ? dashPart(cx) : digitPart(cx, BASE_Y, "x", "jp-digit ghost", 1));
  } else if (u.note && u.pitch) {
    const ps = fd ? [fd.bass] : u.pitches.length > 1 ? u.pitches : [u.pitch], accs = fd ? [] : accsOf(u);
    const dg = ps.map((pp) => toDegree(pp, letters ? 0 : a.fifths)), dotsOf = dg.map((d) => (mode === "x" || letters ? 0 : d.shift - a.base));
    const order = ps.map((_, i) => ps.length - 1 - i);   // 从最低的起
    const bases = letters ? order.map((_, k) => BASE_Y - k * (DIGIT_H + SUB_DROP + SUP_RISE + CHORD_GAP)) : stackBases(order.map((i) => dotsOf[i]!));
    hiBase = bases[bases.length - 1]!;
    const hiDots = dotsOf[0]!, lowDots = dotsOf[order[0]!]!;
    const mute = (i: number) => (i > 0 && !!q.p.mono ? " chord-mute" : "");   // 单声乐器的声部：下面的音灰掉（同五线谱）
    if (contDash) head.core(dashPart(cx));
    else if (fd) {   // 和弦名（UX 稿第 7 节）：窄字、左边对齐这一列；八度点标在最低音那个字母上下
      head.core(part(textInk(x0, x0 + nameW, BASE_Y - CHORD_H, BASE_Y), [{ ...T, t: "text", x: x0, y: BASE_Y, s: fd.name, cls: "jp-chord", size: CHORD_EM, sx: CHORD_SX, anchor: "start" }]));
      const bd = dotsOf[0]!, bx = x0 + chordBassCx(fd.name);
      const dots = (sign: 1 | -1): Part => { const ps2: Prim[] = []; for (let j = 0; j < Math.abs(bd); j++) ps2.push({ ...T, t: "path", d: dotPath(bx, -sign * (DOT_R + j * DOT_STEP), DOT_R), cls: "jp-dot" }); return part({ x0: bx - DOT_R, x1: bx + DOT_R, y0: sign > 0 ? -(2 * DOT_R + (Math.abs(bd) - 1) * DOT_STEP) : 0, y1: sign > 0 ? 0 : 2 * DOT_R + (Math.abs(bd) - 1) * DOT_STEP }, ps2); };
      if (hasArp(u)) {   // 琶音照画（折成名字也不静默丢掉）：名字左边一条竖的波浪线，名字那么高
        const yTop = BASE_Y - CHORD_H - 0.2, yBot = BASE_Y + 0.2; stick("arpeggio", arpPart(yTop, yBot, T, art("arpeggio", "arpeggio jp-arp")), { cross: 0 });
      }
      if (bd > 0) stick("dotHigh", dots(1), { cross: 0 });
      if (bd < 0) stick("dotLow", dots(-1), { cross: 0 });
      members = [{ i: 0, yb: BASE_Y }];
    } else if (mode === "x" && kit) {   // 整套鼓：每一下按五线鼓谱的符头种类换字；同时敲的几件按五线鼓谱上的高低叠；幽灵音 = 小一号
      const hits = ps.map((pp, i) => ({ i, pi: percOf(128, 0, midiOf(pp)) })).sort((p1, p2) => (p2.pi?.line ?? 4) - (p1.pi?.line ?? 4) || p2.i - p1.i);
      hits.forEach(({ i, pi }, k) => {
        const yb = bases[k]! - DIGIT_H * 0.12, sz = DIGIT_EM * KIT_EM * gk;
        head.core(part(textInk(cx - (DIGIT_W * gk) / 2, cx + (DIGIT_W * gk) / 2, yb - DIGIT_H * gk, yb), [{ ...T, t: "text", x: cx, y: yb, s: KIT_CHAR[pi?.head ?? "normal"] ?? "●", cls: small ? "jp-digit jp-x jp-kit art-ghost" : "jp-digit jp-x jp-kit", size: sz, anchor: "middle" }]));
        members.push({ i, yb: bases[k]! });
      });
    } else if (mode === "x") {   // 只有一件鼓 = X、幽灵音 = 小 x；同时敲的几下往上一个叠一个
      order.forEach((i, k) => {
        const k2 = small ? GHOST_K : X_EM;
        head.core(part(textInk(cx - (DIGIT_W * k2) / 2, cx + (DIGIT_W * k2) / 2, bases[k]! - DIGIT_H * k2, bases[k]!), [{ ...T, t: "text", x: cx, y: bases[k]!, s: small ? "x" : "X", cls: small ? "jp-digit jp-x art-ghost" : "jp-digit jp-x", size: DIGIT_EM * k2, anchor: "middle" }]));
        members.push({ i, yb: bases[k]! });
      });
    } else {   // 数字 / 字母：一摞（最低的在基线上）；中间那几个的八度点在叠的时候已经让开了 = 算在它自己的核里
      const accInks: Ink[] = [], accPrims: Prim[] = [];
      order.forEach((i, k) => {
        const yb = bases[k]!, d = dg[i]!, dots = dotsOf[i]!, pp = ps[i]!, prims: Prim[] = [], inks: Ink[] = [];
        if (lt) {   // 字母谱（7-B）：大写字母 + 右上角升降号 + 右下角八度数字；叠着的几个左对齐
          const lp = letterParts(pp, q.letters!), xs = x0 + (letterW(pp.step) + SCRIPT_GAP) * gk, ss = DIGIT_EM * SCRIPT_K * gk, cls = (small ? "jp-digit jp-letter art-ghost" : "jp-digit jp-letter") + mute(i);
          prims.push({ ...T, t: "text", x: x0, y: yb, s: lp.letter, cls, size: DIGIT_EM * gk, anchor: "start" });
          inks.push(textInk(x0, x0 + letterW(pp.step) * gk, yb - DIGIT_H * gk, yb));
          if (lp.acc) {   // 右上角的升降号（7-P：Bravura 字形，顶和原来文字 ♭ 的顶齐）
            const gs = accGlyphsOfText(lp.acc), em = supAccEm(gk), r = accRun(gs, em, xs + accRunW(gs, em), yb + SUP_DY * gk - 0.75 * ss, "jp-acc jp-letter-sup" + mute(i), T, DIGIT_EM * gk);
            prims.push(...r.prims); inks.push(r.ink);
          }
          prims.push({ ...T, t: "text", x: xs, y: yb + SUB_DY * gk, s: lp.oct, cls: "jp-digit jp-letter-sub" + mute(i), size: ss, anchor: "start" });
          inks.push(textInk(xs, xs + lp.oct.length * SCRIPT_K * DIGIT_W * gk, yb + SUB_DY * gk - SCRIPT_K * DIGIT_H * gk, yb + SUB_DY * gk));
        } else {
          const dp = digitPart(cx, yb, String(d.degree), (small ? "jp-digit art-ghost" : "jp-digit") + mute(i));
          prims.push(...dp.prims); inks.push(dp.ink);
          // 和弦中间那几个音的八度点（叠的时候已经让开了）：高的不是最上面那个音的、低的不是最下面那个音的，算在它自己的核里
          if (dots > 0 && k < order.length - 1) for (let j = 0; j < dots; j++) { const yy = yb - DIGIT_H * gk - DOT_GAP - DOT_R - j * DOT_STEP; prims.push({ ...T, t: "path", d: dotPath(cx, yy, DOT_R), cls: "jp-dot" + mute(i) }); inks.push({ x0: cx - DOT_R, x1: cx + DOT_R, y0: yy - DOT_R, y1: yy + DOT_R }); }
          if (dots < 0 && k > 0) for (let j = 0; j < -dots; j++) { const yy = yb + LOW_DOT_UNDER + j * DOT_STEP; prims.push({ ...T, t: "path", d: dotPath(cx, yy, DOT_R), cls: "jp-dot" + mute(i) }); inks.push({ x0: cx - DOT_R, x1: cx + DOT_R, y0: yy - DOT_R, y1: yy + DOT_R }); }
        }
        head.core(part(unionInk(inks), prims));
        if (!lt && accs[i] !== null && accs[i] !== undefined) {   // 升降号：这个数字的左上（7-P：Bravura 字形，顶比数字顶高 ACC_RISE）；和弦里每个数字各自的，一块贴在左边、右边对齐
          const r = accRun(accGlyphs(d.acc), ACC_GLYPH_EM * gk, 0, yb - DIGIT_H * gk - ACC_RISE, "jp-acc" + mute(i), T, DIGIT_EM * gk);
          accPrims.push(...r.prims); accInks.push(r.ink);
        }
        members.push({ i, yb });
      });
      if (accPrims.length) stick("acc", part(unionInk(accInks), accPrims), { cross: 0 });
      if (hasArp(u)) stick("arpeggio", arpPart(hiBase - DIGIT_H - 0.2, bases[0]! + 0.2, T, art("arpeggio", "arpeggio jp-arp")), { cross: 0 });
      if (hiDots > 0) { const ps2: Prim[] = []; for (let j = 0; j < hiDots; j++) ps2.push({ ...T, t: "path", d: dotPath(cx, -(DOT_R + j * DOT_STEP), DOT_R), cls: "jp-dot" + mute(0) }); stick("dotHigh", part({ x0: cx - DOT_R, x1: cx + DOT_R, y0: -(2 * DOT_R + (hiDots - 1) * DOT_STEP), y1: 0 }, ps2), { cross: 0 }); }
      if (lowDots < 0) {
        const ps2: Prim[] = []; for (let j = 0; j < -lowDots; j++) ps2.push({ ...T, t: "path", d: dotPath(cx, DOT_R + j * DOT_STEP, DOT_R), cls: "jp-dot" + mute(order[0]!) });
        stick("dotLow", part({ x0: cx - DOT_R, x1: cx + DOT_R, y0: 0, y1: 2 * DOT_R + (-lowDots - 1) * DOT_STEP }, ps2), { cross: 0 });
      }
    }
    if (!contDash) {
      // 数字上方贴身的记号（UX 稿第 5 节）：跳音 = 窄楔形、保持 = 短横，贴着最上面的墨（八度点之上）
      for (const m of (["staccato", "tenuto"] as const).filter((x) => u.art.includes(x))) {
        if (m === "staccato") { const hw = STACC_W / 2; stick("staccato", part({ x0: cx - hw, x1: cx + hw, y0: -STACC_H, y1: 0 }, [{ ...T, t: "path", d: `M${cx - hw},${-STACC_H}L${cx + hw},${-STACC_H}L${cx},0Z`, cls: art(m, "art jp-stacc staccato") }]), { cross: 0 }); }
        else stick("tenuto", part({ x0: cx - TEN_L / 2, x1: cx + TEN_L / 2, y0: -TEN_W / 2, y1: TEN_W / 2 }, [{ ...T, t: "line", x1: cx - TEN_L / 2, y1: 0, x2: cx + TEN_L / 2, y2: 0, w: TEN_W, cls: art(m, "art jp-ten tenuto") }]), { cross: 0 });
      }
      top = head.edge("above");
      // 气声 = 数字 + ×；台上那位固定敲一个键 = 每个数字 + ×（两样都有 = 一个 ×）
      if (u.whisper || xHead) {
        const y = hiBase - DIGIT_H + 0.5, w = 0.62 * ACC_EM;
        stick("xmark", part({ x0: 0, x1: w, y0: y - w, y1: y }, [{ ...T, t: "text", x: 0, y, s: "×", cls: u.whisper ? art("whisper", "jp-acc whisper") : "jp-acc xhead", size: ACC_EM, anchor: "start" }]), { cross: 0 });
      }
      if (u.art.includes("roll")) {   // 滚奏 = 数字下面三道短斜线（UX 稿第 7 节）
        const ps2: Prim[] = []; for (let k = 0; k < 3; k++) { const yy = 0.18 + k * 0.28; ps2.push({ ...T, t: "line", x1: cx - 0.4, y1: yy + 0.18, x2: cx + 0.4, y2: yy - 0.18, w: 0.11, cls: art("roll", "jp-roll") }); }
        stick("roll", part({ x0: cx - 0.4, x1: cx + 0.4, y0: 0, y1: 0.18 + 2 * 0.28 + 0.18 }, ps2), { cross: 0 });
      }
    }
  } else {   // 休止：一拍一个 0（第一个在头里）
    head.core(digitPart(cx, BASE_Y, "0", "jp-digit", 1));
  }
  if (nUL) head.reserve("below", ulBot);
  const bot = head.edge("below");
  // 整个：头 + 后面落在拍上的横线 / 0（核）+ 附点、换气（贴在最右边）
  const whole = cell();
  whole.core(part(head.box(), head.prims(0, 0)));
  for (let k = 1; k <= n; k++) whole.core(u.note ? dashPart(gx(k)) : digitPart(gx(k), BASE_Y, "0", "jp-digit", 1));
  const wc: Record<string, number> = {};
  const tail = (id: PlaceId, p: Part, cross: number) => { const g = groupOf(id), k = wc[g] ?? 0; wc[g] = k + 1; whole.attach(PLACE[id].side, p, { gap: gapOf(id, k), cross }); };
  if (hasAugDot(u)) tail("augDot", part({ x0: 0, x1: 2 * AUG_R, y0: -AUG_R, y1: AUG_R }, [{ ...T, t: "path", d: dotPath(AUG_R, 0, AUG_R), cls: "jp-dot" }]), AUG_Y);
  if (u.note && u.breath) {   // 换气 = 音后面一个 V；出声的换气写「V 吸」/「V 深吸」（UX 稿第 5 节）
    const vw = BREATH_W - 0.35, prims: Prim[] = [{ ...T, t: "text", x: 0, y: 0, s: "V", cls: art("breath", "jp-acc breath"), size: BREATH_EM, anchor: "start" }];
    if (u.inhale && a.inhale) prims.push({ ...T, t: "text", x: 1.0, y: 0, s: a.inhale.text, cls: art("inhale", "breath-label"), size: a.inhale.size, anchor: "start" });
    const w = vw + (u.inhale ? INHALE_W : 0), e = whole.edge("right");
    const gap = a.limit === undefined ? PLACE.breath.gap : Math.max(0.1, Math.min(PLACE.breath.gap, a.limit - 0.6 - w - e));   // 不越过这一段占到的地方（下一列 / 小节线），离它留一点（原 draw.ts 的规矩）
    whole.attach(PLACE.breath.side, part({ x0: 0, x1: w, y0: -0.7 * BREATH_EM, y1: 0 }, prims), { gap, cross: BREATH_Y });
  }
  return { cell: whole, x0, cx, glyphW, members, hiBase, bot, ...(top !== undefined ? { top } : {}), ...(leftGap !== undefined ? { leftGap } : {}) };
}
/** 画的时候横线 / 0 按「这一段占到的宽 − 它」一拍一个摆：只给附点让（附点和横线同高）。换气的 V 在上面、不挤横线（统筹看 5-6 样张定的；量的时候照样给它留了宽）。 */
export function tailW(u: Chunk): number {
  return hasAugDot(u) ? PLACE.augDot.gap + 2 * AUG_R + 0.1 : 0;
}
/** 琶音的竖波浪：x 以 0 为中线、从 yBot 画到 yTop（局部 y）。 */
function arpPart(yTop: number, yBot: number, T: { tok?: number }, cls: string): Part {
  const amp = 0.28, st = 0.5;
  let d = `M0,${yBot}`; for (let y = yBot, k = 0; y > yTop; y -= st, k++) d += `Q${(k % 2 ? -amp : amp) * 2},${y - st / 2} 0,${Math.max(yTop, y - st)}`;
  return part({ x0: -amp, x1: amp, y0: yTop, y1: yBot }, [{ ...T, t: "path", d, cls }]);
}
