// draw.ts —— 简谱数字行的「画」：一条轨 → 音符层的图元 + 点击框 + 光标落点 + 歌词锚点（挂件往道上登记）。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第四刀 4-2；UX 稿 ai-docs/20261111-jianpu-display-ux.md 第 3–5 节）。
//   每一行在自己的局部坐标里画（局部 y：0 = 行框上沿、4 = 下沿，和五线谱同一个框）；put(行, 图元) 记行号，框架定了行距整行挪（同 staff/draw.ts）。
//   这一版画：数字 1–7 / 0、八度点（基准 = 点最少）、升降还原、长音横线、附点、按拍连起来的下划线、几拍的休止一拍一个 0、小节线（单 / 段落 / 终止）、
//   中途换调换拍号（写字）、第一行上方的谱头「1=C  4/4」、歌词锚点、点击框、光标落点。弧线 / 连音 / 记号 / 力度道等 = 第四刀后面几步（施工单第六节）。
import { TPQ, type Song, type PaperSeg, type NoteTok } from "../../score/song.ts";
import { keyText } from "../../score/pitch.ts";
import { toDegree, fewestDotsBase } from "../../score/degree.ts";
import type { SongView } from "../../score/song-view.ts";
import type { Prim, EngraveOpts, HitNote, RestHit, MarkHit, Slot, CaretHead, SystemBox, Layout } from "../engrave.ts";
import type { TextRole } from "../text/index.ts";
import type { LaneKind } from "../frame/lanes.ts";
import { MARGIN } from "../frame/params.ts";
import { caretStops } from "../frame/carets.ts";
import type { LyricSpot, LyricPart } from "../frame/lyric-spots.ts";
import type { Chunk } from "../staff/units.ts";
import { type JianpuTrack, extraGlyphs, hasAugDot, underlines, midTextW } from "./measure.ts";
import { DIGIT_EM, DIGIT_W, BASE_Y, DIGIT_TOP, DIGIT_MID, UL_Y0, UL_GAP, UL_W, DOT_R, DOT_GAP, DOT_STEP, ACC_EM, ACC_DX, ACC_Y, DASH_L, DASH_W, DASH_Y, DASH_PITCH, AUG_DX, AUG_R,
  BAR_Y0, BAR_Y1, BAR_DX, BAR_THIN, BAR_THICK, BAR_GAP, MID_TEXT_EM, dotPath, accText } from "./glyphs.ts";

/** 简谱数字行贴挂件的先后（从数字往上：演奏法 → 音的修饰 → 力度道 → 跳转 → 速度 → 风格 → 小节号 → 和弦级数；歌词在下面）。和五线谱同一张道名表（frame/lanes.ts）。 */
export const JIANPU_LANES: readonly LaneKind[] = ["strength", "noteDynamics", "dynamics", "nav", "tempo", "groove", "barNumber", "chordTag", "lyrics"];

/** 框架交给数字行的东西（是五线谱那一份的子集：不要纵向 ↔ 音高的几何）。 */
export interface JianpuDrawCtx {
  song: Song; look: SongView; paper: PaperSeg; o: EngraveOpts;
  P: (v: number) => number; tx: (role: TextRole) => number; sp: number;
  put: (row: number, p: Prim) => void; hitRow: (hit: object, row: number) => void;
  prims: Prim[]; notes: HitNote[]; rests: RestHit[]; marks: MarkHit[]; slots: Slot[]; heads: CaretHead[]; bars: Layout["bars"]; rows: SystemBox[];
  staffTop: (r: number) => number; rowOf: (s: number, r: number, k?: number) => number;
  placeAbove: (row: number, gap: number, draw: (y: number) => void) => number;
  attach: (lane: LaneKind, run: () => void) => void;
  per: readonly JianpuTrack[]; measured: { inkL: Map<Chunk, number> }[];
  nSys: number; sysStarts: number[]; staffEnd: number[]; cols: { x: number; w: number; system: number }[]; ind0: number; indN: number;
}
/** 「1=A♭」→「1=♭A」（简谱的老写法：升降号在字母前面；UX 稿第 3 节）。 */
const keyHead = (fifths: number, minor: boolean): string => keyText(fifths, minor).replace(/=([A-G])([♭♯])$/, "=$2$1");

/** 画这几条（mine = per 里的下标）简谱轨。 */
export function drawJianpu(c: JianpuDrawCtx, mine: readonly number[]): { lyricParts: LyricPart[] } {
  const lyricParts: LyricPart[] = [];
  const { o, P, tx, put, hitRow, notes, rests, marks, slots, heads, bars, rows, staffTop, rowOf, placeAbove, per, measured, nSys, sysStarts, staffEnd, cols, ind0 } = c;
  void hitRow;
  const Y = (row: number, v: number) => staffTop(row) + P(v);   // 局部 y（sp）→ px（框架还没定行距：staffTop 是这一行的临时原点）
  for (const r of mine) {
    const q = per[r]!, units = q.units, tokens = q.tokens;
    for (let s = 0; s < nSys; s++) { const row = rowOf(s, r, 0); if (rows[row]) rows[row]!.x1 = P(staffEnd[s]!); }
    const tokOf = (u: Chunk): number | undefined => (u.index >= 0 && !u.pad ? tokens[u.index]?.id : undefined);
    // 八度基准（这一刀只做「点最少」那条退路；按乐器音域定 = 第五刀）：整条轨（这张纸上）一个基准
    let f0 = q.head.key; const shifts: number[] = [];
    for (const u of units) { if (u.kind === "key") f0 = u.fifths; else if (u.kind === "chunk" && u.note && u.pitch && !u.pad) shifts.push(toDegree(u.pitch, f0).shift); }
    const base = fewestDotsBase(shifts);
    // 谱头（UX 稿第 3 节）：第一行上方「1=C  4/4」，字也能点（= 调号 / 拍号的点击框，开谱头面板）
    const row0 = rowOf(0, r, 0), hx = P(MARGIN + ind0 + 0.6);
    const keyS = keyHead(q.head.key, q.head.minor), timeS = `${q.head.time.beats}/${q.head.time.beatType}`, hs = tx("tempo-num");
    c.attach("tempo", () => placeAbove(row0, 0.5, (y) => {
      const kw = P(midTextW(keyS)), tw = P(midTextW(timeS));
      put(row0, { t: "text", x: hx, y, s: keyS, cls: "jp-head", size: hs, anchor: "start" });
      put(row0, { t: "text", x: hx + kw, y, s: timeS, cls: "jp-head", size: hs, anchor: "start" });
      if (q.head.idx.key !== undefined) marks.push({ index: q.head.idx.key, kind: "key", system: row0, x: hx - P(0.3), y: y - hs, w: kw, h: hs * 1.4 });
      if (q.head.idx.time !== undefined) marks.push({ index: q.head.idx.time, kind: "time", system: row0, x: hx + kw - P(0.3), y: y - hs, w: tw, h: hs * 1.4 });
    }));
    const spots: LyricSpot[] = []; lyricParts.push({ r, lrow: (s) => rowOf(s, r, 0), spots });
    /** 下划线：同一行、同一小节、同一拍里挨着的音 / 休止连成一条（第 L 层只连有 ≥ L 层的）。 */
    const ul: { row: number; x0: number; x1: number; level: number; group: string; tok: number | undefined }[] = [];
    let fifths = q.head.key;
    for (const u of units) {
      if (u.kind === "key") {   // 中途换调：在那一点写新的「1=D」（UX 稿第 3 节）
        fifths = u.fifths;
        const row = rowOf(u.system, r, 0), s = keyHead(u.fifths, u.minor), x = P(u.x + 0.3);
        put(row, { tok: tokens[u.index]?.id, t: "text", x, y: Y(row, BASE_Y - 0.3), s, cls: "jp-head jp-mid", size: P(MID_TEXT_EM), anchor: "start" });
        marks.push({ index: u.index, kind: "key", system: row, x: x - P(0.3), y: Y(row, BASE_Y - 1.6), w: P(midTextW(s)), h: P(2.2) });
        continue;
      }
      if (u.kind === "time") {
        const row = rowOf(u.system, r, 0), s = `${u.beats}/${u.beatType}`, x = P(u.x + 0.3);
        put(row, { tok: tokens[u.index]?.id, t: "text", x, y: Y(row, BASE_Y - 0.3), s, cls: "jp-head jp-mid", size: P(MID_TEXT_EM), anchor: "start" });
        marks.push({ index: u.index, kind: "time", system: row, x: x - P(0.3), y: Y(row, BASE_Y - 1.6), w: P(midTextW(s)), h: P(2.2) });
        continue;
      }
      if (u.kind === "bar") {   // 小节线：单线 / 段落线（双细）/ 终止线（细 + 粗）；反复的点 = 后面几步
        const row = rowOf(u.system, r, 0), x = P(u.x + BAR_DX), y0 = Y(row, BAR_Y0), y1 = Y(row, BAR_Y1), tok = u.index >= 0 ? tokens[u.index]?.id : undefined;
        const line = (lx: number, w: number) => put(row, { ...(tok !== undefined ? { tok } : {}), t: "line", x1: lx, y1: y0, x2: lx, y2: y1, w: P(w), cls: "bar jp-bar" });
        if (u.style === "final" || u.repeat === "end") { line(x - P(BAR_GAP + BAR_THICK / 2), BAR_THIN); line(x, BAR_THICK); }
        else if (u.style === "double" || u.repeat) { line(x - P(BAR_GAP), BAR_THIN); line(x, BAR_THIN); }
        else line(x, BAR_THIN);
        bars.push({ system: row, x });
        continue;
      }
      if (u.kind !== "chunk" || u.pad) continue;   // 补齐的淡色小节不画（同五线谱 v0.10.19）
      const row = rowOf(u.system, r, 0), tok = tokOf(u), x0 = P(u.x + 0.1), cx = x0 + P(DIGIT_W / 2), T = tok !== undefined ? { tok } : {};
      const n = extraGlyphs(u), contDash = u.note && u.j > 0 && u.base >= TPQ;   // 接着上一段的长音：第一个字形也是横线
      const limit = u.x + u.w - 0.1 - DIGIT_W / 2, step = n ? Math.max(DASH_PITCH, (limit - (u.x + 0.1 + DIGIT_W / 2)) / n) : 0;   // 横线 / 一拍一个 0：在这一列里摊开（像一拍一拍）
      const gx = (k: number) => cx + P(k * step);
      const digit = (x: number, s: string) => put(row, { ...T, t: "text", x, y: Y(row, BASE_Y), s, cls: u.ghost ? "jp-digit ghost" : "jp-digit", size: P(DIGIT_EM), anchor: "middle" });
      const dash = (x: number) => put(row, { ...T, t: "line", x1: x - P(DASH_L / 2), y1: Y(row, DASH_Y), x2: x + P(DASH_L / 2), y2: Y(row, DASH_Y), w: P(DASH_W), cls: "jp-dash" });
      const nUL = underlines(u);
      if (u.note && u.pitch) {
        const d = toDegree(u.pitch, fifths), dots = d.shift - base;
        if (contDash) for (let k = 0; k <= n; k++) dash(gx(k));
        else {
          digit(cx, String(d.degree));
          for (let k = 1; k <= n; k++) dash(gx(k));
          if (u.j === 0 && u.acc !== null) put(row, { ...T, t: "text", x: cx - P(ACC_DX), y: Y(row, ACC_Y), s: accText(d.acc), cls: "jp-acc", size: P(ACC_EM), anchor: "middle" });
          // 八度点：高的在数字上面、低的在下划线下面（UX 稿第 4 节）
          for (let k = 0; k < Math.abs(dots); k++) {
            const yy = dots > 0 ? DIGIT_TOP - DOT_GAP - DOT_R - k * DOT_STEP : (nUL ? UL_Y0 + (nUL - 1) * UL_GAP : BASE_Y) + DOT_GAP + DOT_R + k * DOT_STEP;
            put(row, { ...T, t: "path", d: dotPath(cx, Y(row, yy), P(DOT_R)), cls: "jp-dot" });
          }
        }
        if (u.j === 0) notes.push({ index: u.index, system: row, x: x0, y: Y(row, DIGIT_MID), w: P(DIGIT_W), d: NaN });   // 数字行没有「纵向 = 音高」：d = NaN（不提供竖着拖改音高）
        if (u.j === 0 && !u.tie) spots.push({ index: u.index, sys: u.system, row, cx0: cx, mx0: x0 - P(0.6), mx1: x0 + P(DIGIT_W) + P(0.4), lyric: u.lyric, tok, cls: u.ghost ? "ghost" : undefined, mute: !!q.p.lyricMute?.has(tokens[u.index]?.id ?? -1), hyph: !!(tokens[u.index] as NoteTok | undefined)?.hyph });
      } else if (!u.note) {
        for (let k = 0; k <= n; k++) digit(gx(k), "0");   // 几拍的休止一拍一个 0（UX 稿第 4 节）
        if (u.j === 0 && u.index >= 0) rests.push({ index: u.index, system: row, x: x0, y: Y(row, DIGIT_MID), w: P(DIGIT_W) });
      }
      if (hasAugDot(u)) put(row, { ...T, t: "path", d: dotPath(gx(n) + P(DIGIT_W / 2 + AUG_DX + AUG_R), Y(row, BASE_Y - 0.55), P(AUG_R)), cls: "jp-dot" });
      if (nUL) { const bar0 = u.tick - u.inBar; ul.push({ row, x0: x0 - P(0.05), x1: x0 + P(DIGIT_W + 0.05) + (hasAugDot(u) ? P(AUG_DX + 2 * AUG_R) : 0), level: nUL, group: `${u.system}|${bar0}|${Math.floor((u.inBar + 1e-6) / u.beat)}`, tok }); }
    }
    // 下划线按拍分组（UX 稿第 4 节）：第 L 层 = 一串挨着的、同组、都有 ≥ L 层的连成一条
    const maxL = Math.max(0, ...ul.map((e) => e.level));
    for (let L = 1; L <= maxL; L++) {
      let i = 0;
      while (i < ul.length) {
        if (ul[i]!.level < L) { i++; continue; }
        let j = i; while (j + 1 < ul.length && ul[j + 1]!.level >= L && ul[j + 1]!.group === ul[i]!.group) j++;
        const a = ul[i]!, b = ul[j]!, y = Y(a.row, UL_Y0 + (L - 1) * UL_GAP);
        put(a.row, { ...(i === j && a.tok !== undefined ? { tok: a.tok } : {}), t: "line", x1: a.x0, y1: y, x2: b.x1, y2: y, w: P(UL_W), cls: "jp-ul" });
        i = j + 1;
      }
    }
    // 光标落点、写字头：框架那一套（frame/carets.ts）；升降号挂在左边，光标画在它左边；数字行没有谱号位移
    const inkL = measured[r]!.inkL;
    caretStops(q, { cx: (u) => { const k = u.kind === "chunk" ? inkL.get(u as Chunk) : undefined; return P(u.x - (k ? k + 0.2 : 0)); }, shiftAt: () => Array.from({ length: q.staves }, () => 0), rowOf: (sy, k) => rowOf(sy, r, k), P, sysStart0: sysStarts[0]!, cols, slots, heads });
  }
  void o;
  return { lyricParts };
}
