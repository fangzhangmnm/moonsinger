// draw.ts —— 简谱数字行的「画」：一条轨 → 音符层的图元 + 点击框 + 光标落点 + 歌词锚点（挂件往道上登记）。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第四刀 4-2；UX 稿 ai-docs/20261111-jianpu-display-ux.md 第 3–5 节）。
//   每一行在自己的局部坐标里画（局部 y：0 = 行框上沿、4 = 下沿，和五线谱同一个框）；put(行, 图元) 记行号，框架定了行距整行挪（同 staff/draw.ts）。
//   这一版画：数字 1–7 / 0、八度点（基准 = 点最少）、升降还原、长音横线、附点、按拍连起来的下划线、几拍的休止一拍一个 0、小节线（单 / 段落 / 终止）、
//   中途换调换拍号（写字）、第一行上方的谱头「1=C  4/4」、歌词锚点、点击框、光标落点。弧线 / 连音 / 记号 / 力度道等 = 第四刀后面几步（施工单第六节）。
import { TPQ, swellOf, type Song, type PaperSeg, type NoteTok, type OttavaTok } from "../../score/song.ts";
import { _tIn } from "../../i18n/index.ts";
import { SIGNS } from "../signs.ts";
import { harmonyTheory, type PlacedTag } from "../../theory/index.ts";
import { keyText, midiOf } from "../../score/pitch.ts";
import { percOf } from "../../gm/percussion.ts";
import { toDegree, fewestDotsBase, rangeBase } from "../../score/degree.ts";
import type { SongView } from "../../score/song-view.ts";
import type { Prim, EngraveOpts, HitNote, RestHit, MarkHit, DynHit, ClefHit, Slot, CaretHead, SystemBox, Layout } from "../engrave.ts";
import { dynOverridden } from "../../score/perform.ts";
import { navWhy } from "../../score/repeats.ts";
import { layDynamics, layGroove, layNav, layTempo, layNoteDynamics, layPedals, tempoAt, tempoW, type OrnCtx } from "../ornaments/index.ts";
import type { TextRole } from "../text/index.ts";
import type { LaneKind } from "../frame/lanes.ts";
import { MARGIN, NAME_MAX } from "../../look/frame.ts";
import { caretStops } from "../frame/carets.ts";
import type { LyricSpot, LyricPart } from "../frame/lyric-spots.ts";
import type { Chunk } from "../frame/units.ts";
import { type JianpuTrack, type JianpuMode, type JianpuAux, foldOf, extraGlyphs, hasAugDot, underlines, accsOf, hasArp, contDash as isContDash, lettersOf, glyphWOf } from "./chunk.ts";
import { midTextW } from "./measure.ts";
import { headTextW } from "./glyphs.ts";
import { noteCell, tailW, coreBottom, rowGlyphSpan, UL_DROP } from "./note-cell.ts";
import { keyParts, keyLayout, keyPrims } from "./keytext.ts";
import { layoutHead } from "../frame/rowhead.ts";
import type { Part } from "../frame/cell.ts";
import { scalePrim } from "../skyline.ts";
import { chordTextPrims } from "../chord-text.ts";   // 和弦标的字 + 升降号字形（v0.17.34）
import { DIGIT_EM, DIGIT_W, BASE_Y, DIGIT_TOP, DIGIT_MID, UL_GAP, UL_W, DASH_PITCH, BAR_Y0, BAR_Y1, BAR_DX, BAR_THIN, BAR_THICK, BAR_GAP, MID_TEXT_EM, DIGIT_H, KIT_CHAR, JP_BODY, HEAD_EM, MARK_GAP, MARK_GAP2, CHEV_W, CHEV_H, CHEV_STROKE, CHEV_STROKE_THIN, MARCATO_EM, UNSTRESS_EM, CHORD_H, chordNameW, dotPath } from "./glyphs.ts";


/** 框架交给数字行的东西（是五线谱那一份的子集：不要纵向 ↔ 音高的几何）。 */
export interface JianpuDrawCtx {
  song: Song; look: SongView; paper: PaperSeg; o: EngraveOpts;
  P: (v: number) => number; tx: (role: TextRole) => number; TR: (role: TextRole, v: number) => number; RS: (role: TextRole) => number; mw: (role: TextRole, s: string) => number; sp: number;
  /** 行里的尺寸比例（排版参数表行一级；第五刀 5-0c）：数字行自己的尺寸 / 偏移都乘它。没给 = 1。 */
  scale?: number;
  put: (row: number, p: Prim) => void; hitRow: (hit: object, row: number) => void;
  /** 不印的提示交给框架最后贴、只躲不推（第八刀 8-5）：图元 / 墨相对锚点，tries = 依次试的锚点（这一行局部 px），onPlace 拿到最后的位置再登记点击区。 */
  hint: (row: number, h: { part: Part; tries: readonly { x: number; y: number }[]; climb?: number; onPlace?: (x: number, y: number) => void }) => void;
  prims: Prim[]; notes: HitNote[]; chordHeads: Layout["chordHeads"]; keyHints: Layout["keyHints"]; chordTagsOut: Layout["chordTags"]; rests: RestHit[]; marks: MarkHit[]; dyns: DynHit[]; clefs: ClefHit[]; slots: Slot[]; heads: CaretHead[]; bars: Layout["bars"]; rows: SystemBox[];
  staffTop: (r: number) => number; rowOf: (s: number, r: number, k?: number) => number;
  placeAbove: (row: number, gap: number, draw: (y: number) => void) => number;
  placeBelow: (row: number, gap: number, draw: (y: number) => void, o2?: { min?: number; count?: boolean; wall?: boolean }) => number;
  /** 和弦级数（预处理，theory/families.ts）：合租的一家合起来认、标在这一家最下面那一行；不标 = null。 */
  harmony: ReadonlyMap<string, readonly PlacedTag[]> | null;
  /** 每条轨的预处理（下标同 per）：叠着的和弦折成的和弦名（第五刀 5-4）。 */
  aux: readonly JianpuAux[];
  attach: (row: number, lane: LaneKind, run: () => void) => void;
  /** 这一行的右边界（sp）；速度画在哪一位那行（这张纸最上面在场的那位）、上一段结尾的速度（开头变了标 ↑ / ↓）。 */
  right: number; owner: string | null; prevBpm: number | null;
  per: readonly JianpuTrack[]; measured: { inkL: Map<Chunk, number> }[];
  nSys: number; sysStarts: number[]; staffEnd: number[]; cols: { x: number; w: number; system: number }[]; ind0: number; indN: number;
}
/** 记号表里这个演奏法在简谱那一栏的字形（没有字形的 = null，画法自己画）。 */
const jpGlyph = (a: string): { above: string; w: number; h: number } | null => { const d = SIGNS[`art:${a}` as keyof typeof SIGNS]?.draw.jianpu; return d && d.kind === "glyph" ? { above: d.above, w: d.w ?? 1, h: d.h ?? 1 } : null; };
/** 「1=A♭」→「1=♭A」（简谱的老写法：升降号在字母前面；UX 稿第 3 节）。 */
const keyHead = (fifths: number, minor: boolean): string => keyText(fifths, minor).replace(/=([A-G])([♭♯])$/, "=$2$1");

/** 画这几条（mine = per 里的下标）简谱轨。 */
/** mode = 数字行（digits）还是鼓的 X 行（x：音画成 X、调号只在编辑器里给淡的提示；第五刀 5-4）。 */
/** 整套鼓的图例按「哪种字」分组：字 → 这种字的几件鼓（名字、各自在五线鼓谱上的高低）、这一组最高的那一线。sys 给了 = 只看这一行（画图例用：这张纸上第一次有敲击的那一行）；
 *  没给 = 整张纸（名字一栏要多宽用：排之前还不知道折到哪一行）。 */
function kitGroups(q: JianpuTrack, sys?: number): Map<string, { line: number; names: string[]; lines: number[] }> {
  const groups = new Map<string, { line: number; names: string[]; lines: number[] }>();
  for (const u of q.units) {
    if (u.kind !== "chunk" || !u.note || u.pad || (sys !== undefined && u.system !== sys) || !u.pitch) continue;
    for (const pp of u.pitches.length ? u.pitches : [u.pitch]) {
      const m = midiOf(pp), nm = q.p.kitNames?.[m]; if (!nm) continue;
      const pi = percOf(128, 0, m), ch = KIT_CHAR[pi?.head ?? "normal"] ?? "●", g = groups.get(ch) ?? { line: pi?.line ?? 4, names: [], lines: [] };
      g.line = Math.min(g.line, pi?.line ?? 4); if (!g.names.includes(nm)) { g.names.push(nm); g.lines.push(pi?.line ?? 4); } groups.set(ch, g);
    }
  }
  return groups;
}
/** 名字那一栏至少要多宽才放得下这条轨的鼓的图例（sp；施工单第 12 条 12-2，统筹选 A：栏宽只看谱上真有的字）：一件鼓占一行时最宽的那一行（「● 小鼓」），
 *  最多到声部名的上限 NAME_MAX（再长的名字照旧在栏里折）。按整张纸用到的鼓算（排之前不知道第一行有哪几件）；没有图例 = 0。 */
export function kitLegendMin(q: JianpuTrack, mw: (role: TextRole, s: string) => number): number {
  let w = 0;
  for (const [ch, g] of kitGroups(q)) for (const nm of g.names) w = Math.max(w, mw("jp-legend", `${ch} ${nm}`));
  return Math.min(NAME_MAX, w);
}
export function drawJianpu(c: JianpuDrawCtx, mine: readonly number[], mode: JianpuMode = "digits"): { lyricParts: LyricPart[] } {
  const lyricParts: LyricPart[] = [];
  const { song, paper, o, P, tx, TR, put, notes, chordHeads, keyHints, chordTagsOut, placeBelow, rests, marks, slots, heads, bars, rows, staffTop, rowOf, placeAbove, per, measured, nSys, sysStarts, staffEnd, cols, ind0 } = c;
  const jk = c.scale ?? 1, Q = (v: number) => P(v * jk);   // 行里的尺寸比例（排版参数表行一级，第五刀 5-0c）：数字行自己的尺寸 / 偏移走 Q，框架给的位置（u.x、右边界、行首）走 P
  const Y = (row: number, v: number) => staffTop(row) + Q(v);   // 局部 y（数字行的单位）→ px（框架还没定行距：staffTop 是这一行的临时原点）
  /** 整套鼓的图例（5-6，统筹裁定：简谱里印一行图例说明每种字是哪几件）：这张纸上这位第一次有敲击的那一行，行首名字下面一行一种字——
   *  「● 大鼓 / 小鼓」；按五线鼓谱上的高低从上往下排（同叠的方向）；名字宽过名字那一栏就折到下一行（缩进）。名字由宿主按界面语言给（PartView.kitNames），没有名字的鼓件不列。屏幕和 PDF 都印。 */
  const layKitLegend = (q: JianpuTrack, r: number): void => {
    const first = q.units.find((u): u is Chunk => u.kind === "chunk" && u.note && !u.pad && !!u.pitch); if (!first) return;
    const groups = kitGroups(q, first.system);
    if (!groups.size) return;
    const width = ind0 - 1.4, lines: string[] = [];   // 名字那一栏能放多宽（sp）：右边让出一家的竖线 / 谱左边那根线
    for (const [ch, g] of [...groups].sort((a, b) => a[1].line - b[1].line)) {   // 同高的几种字 = 先出现的在前
      const nms = g.names.map((nm, k) => ({ nm, ln: g.lines[k]! })).sort((a, b) => a.ln - b.ln).map((x) => x.nm);   // 同一种字的几件：也按谱上的高低（上面的先写）
      // 先按「一件」折：放得下就几件写在一行（「 / 」隔开），放不下就下一件另起一行（缩进一个字）；只有一件的名字本身比一栏还宽，才在它里面折——
      //   中文按字、英文按词；开括号跟着后一个字、闭括号和标点跟着前一个字（不落单、不在行尾留开括号）
      const fits = (t: string) => c.mw("jp-legend", t.trimEnd()) <= width;
      const atomsOf = (t: string): string[] => {
        const out: string[] = []; let carry = "";
        for (const m of t.match(/[A-Za-z0-9.'-]+ ?|\s|./gu) ?? []) {
          if (/^[（(「『]$/.test(m)) { carry += m; continue; }
          if (/^[）)」』，、。：；]$/.test(m) && out.length && !carry) { out[out.length - 1] += m; continue; }
          out.push(carry + m); carry = "";
        }
        if (carry) out.push(carry);
        return out;
      };
      const pushLong = (first: string) => {   // 一行放不下的：按原子折
        let cur = "";
        for (const a of atomsOf(first)) { const next = cur + a; if (!cur.trim() || fits(next)) cur = next; else { lines.push(cur.trimEnd()); cur = `\u3000${a.trimStart()}`; } }
        if (cur.trim()) lines.push(cur.trimEnd());
      };
      let cur = `${ch} ${nms[0]}`;
      for (const nm of nms.slice(1)) { const next = `${cur} / ${nm}`; if (fits(next)) cur = next; else { if (fits(cur + " /")) lines.push(cur + " /"); else pushLong(cur + " /"); cur = `\u3000${nm}`; } }
      if (fits(cur)) lines.push(cur); else pushLong(cur);
    }
    const row = rowOf(first.system, r, 0), nameFs = tx("part-name"), fs = tx("jp-legend"), LH = fs * 1.3;
    const mid = Q((JP_BODY.top + JP_BODY.bottom) / 2), y0 = mid + nameFs * 0.55 + nameFs * 0.35 + fs * 1.05 + (q.p.badges?.length ? TR("part-badge", 1.4) : 0);   // 名字的基线往下：名字的下半截 + 一行图例（有「不出声」角标 = 再让一行）
    placeBelow(row, 0, (y) => { lines.forEach((ln, k) => c.prims.push({ t: "text", x: P(MARGIN), y: y + LH * k, s: ln, cls: "jp-legend", size: fs, anchor: "start" })); }, { min: y0 / P(1), count: true });
  };
  for (const r of mine) {
    const q = per[r]!, units = q.units, tokens = q.tokens, xHead = mode === "digits" && !!q.p.xHead, kit = q.p.perc?.kind === "kit";   // 台上固定敲一个键（数字行上每个数字 + ×）；整套鼓（X 行按件换字）
    for (let s = 0; s < nSys; s++) { const row = rowOf(s, r, 0); if (rows[row]) rows[row]!.x1 = P(staffEnd[s]!); }   // 八度基准下面算好再记进每一行（鬼音符要）
    const tokOf = (u: Chunk): number | undefined => (u.index >= 0 && !u.pad ? tokens[u.index]?.id : undefined);
    /** 每一段音 / 休止排完版后占到哪（sp）：同一行里它后面第一个音 / 休止 / 小节线的位置；后面没有 = 这一行的右端。长音的横线、几拍的休止的 0 按它一拍一个摆。 */
    const spanTo = new Map<Chunk, number>();
    { let pend: Chunk[] = []; for (const v of units) { if (v.kind !== "chunk" && v.kind !== "bar") continue; for (const c0 of pend) spanTo.set(c0, c0.system === v.system ? v.x : staffEnd[c0.system]!); pend = v.kind === "chunk" ? [v] : []; }
      for (const c0 of pend) { let end = -Infinity; for (const col of c.cols) if (col.system === c0.system) end = Math.max(end, col.x + col.w); spanTo.set(c0, Math.min(staffEnd[c0.system]!, end > c0.x ? end : staffEnd[c0.system]!)); } }   // 这张纸最后一个音后面什么都没有（最后一小节没写满 = 没有小节线）：占到这一行内容的结尾（所有声部的列里最右那一列的右缘），不摊到行尾（7-E 另查①：长音的横线原来摊了半行）
    // 共用挂件（力度那一串、风格、跳转房子、速度；ornaments/index.ts）：音的锚点 = 数字的左右缘
    const orn: OrnCtx = { song, paper, o, notation: "jianpu", P, tx, TR: c.TR, RS: c.RS, mw: c.mw, sp: c.sp, prims: c.prims, dyns: c.dyns, marks, placeAbove, placeBelow: (row, gap, d, o2) => placeBelow(row, gap, d, o2), rowLow: (sy) => rowOf(sy, r, 0), ignores: q.p.ignores ?? [], ...(q.p.pedalHeld ? { pedalHeld: true } : {}), rowEnd: (sy) => P(staffEnd[sy]!),
      contentEnd: (sy) => { let e = -Infinity; for (const col of cols) if (col.system === sy) e = Math.max(e, col.x + col.w); return P(e > -Infinity ? Math.min(staffEnd[sy]!, e) : staffEnd[sy]!); }, attach: c.attach, right: c.right, left: (sy) => P(MARGIN + (sy === 0 ? ind0 : c.indN)) + Q(0.6), tokens, units, row: (sy) => rowOf(sy, r, 0),   // left = jianpuLineStart（行首竖线往右 0.6）
      glyphScale: jk, noteX: (ch) => P(ch.x) + Q(0.1), noteEnd: (ch) => P(ch.x) + Q(0.1 + DIGIT_W), dynOff: dynOverridden(tokens), navMute: (i) => (navWhy(song, paper, q.p.id, tokens[i]!) ? " art-mute" : ""), hint: c.hint };   // hint：推定的灰字、速度变了的箭头交给框架最后贴（8-5）
    // 八度基准（UX 稿第 3 节；第五刀 5-4）：整条轨（这张纸上）一个基准——按台上那位的音域定（宿主查好放在 q.p.range）；查不到 = 写的音「点最少」；
    //   按音域定的基准下有音要三个点以上（写得离这件乐器的音域很远）= 极端：退回「点最少」。基准画在每一行「1=」那个字母上下（下面 keyDots）
    //   字母谱（7-B）：tracker 写法自己带八度数字，不用点（tonicOf 只是让基准按 C 分组，给鬼音符之类读 octBase 时不乱）
    const letters = q.letters !== undefined && mode === "digits", tonicOf = (f: number) => (letters ? 0 : f);
    let f0 = q.head.key; const shifts: number[] = [];
    for (const u of units) { if (u.kind === "key") f0 = u.fifths; else if (u.kind === "chunk" && u.note && u.pitch && !u.pad) shifts.push(toDegree(u.pitch, tonicOf(f0)).shift); }
    const fewest = fewestDotsBase(shifts), byRange = q.p.range ? rangeBase(q.p.range.lo, q.p.range.hi, tonicOf(q.head.key)) : null;
    const base = byRange !== null && shifts.every((x) => Math.abs(x - byRange) <= 2) ? byRange : fewest;
    for (let s = 0; s < nSys; s++) { const row = rowOf(s, r, 0); if (rows[row]) { rows[row]!.octBase = base; if (letters) rows[row]!.middleC = q.letters!; } }
    // 谱头（UX 稿第 3 节；第八刀 8-4：印的几样从左到右依次排开、宽从字形算；7-Q：调写成「1=C₄」）：第一行上方「1=C₄  4/4  ♩=…」，字也能点（= 调号 / 拍号的点击框，开谱头面板）
    const row0 = rowOf(0, r, 0), hx = P(MARGIN + ind0) + Q(0.6), hs = Q(HEAD_EM), printKey = mode === "digits" && !letters;
    const kp = keyParts(q.head.key, q.head.minor, printKey ? base : null, c.look.middleC), keyS = keyHead(q.head.key, q.head.minor), timeS = `${q.head.time.beats}/${q.head.time.beatType}`;
    const tempoHere = q.p.id === c.owner && q.head.idx.tempo !== undefined;   // 速度写在谱头同一行（UX 稿第 3 节「1=♭A  4/4  ♩=100」）：这张纸最上面在场的那位才写
    c.attach(row0, "tempo", () => placeAbove(row0, 0.5 * jk, (y) => {
      const kt = q.head.idx.key !== undefined ? tokens[q.head.idx.key]?.id : undefined, tt = q.head.idx.time !== undefined ? tokens[q.head.idx.time]?.id : undefined;   // 谱头的字指着谱头那两个 token（守卫 4：每个 token 都有图元）
      const kw = printKey ? keyLayout(kp, hs).w : 0, tw = headTextW(timeS, hs);
      const chg = c.prevBpm === null || c.prevBpm === q.head.bpm ? undefined : q.head.bpm > c.prevBpm ? "up" as const : "down" as const;
      const at = layoutHead(hx, [...(printKey ? [{ id: "key", w: kw, gap: 0 }] : []), { id: "time", w: tw, gap: printKey ? Q(0.6) : 0 }, ...(tempoHere ? [{ id: "tempo", w: 0, gap: Q(1.2) }] : [])]);   // 字母谱 / 鼓不印调号：拍号顶到前面；不印的提示不占地方（8-5）
      if (printKey) for (const pr of keyPrims(kp, at.get("key")!, y, hs, "jp-head", kt !== undefined ? { tok: kt } : {}).prims) put(row0, pr);
      put(row0, { ...(tt !== undefined ? { tok: tt } : {}), t: "text", x: at.get("time")!, y, s: timeS, cls: "jp-head", size: hs, anchor: "start" });
      if (tempoHere) tempoAt(orn, row0, at.get("tempo")! / P(1), q.head.bpm, "tempo", q.head.idx.tempo!, chg, y);
      // 鼓的 X 行 / 字母谱（7-B「调号不写」）：调号不印，编辑器里淡的提示（统筹裁定 5-3：调号是真的状态；打击乐的行写「无调」，7-R）。
      //   不印的提示最后贴、只躲不推（第八刀 8-5）：先试印的东西后面，再试谱头这一行上面一行
      if (!printKey) {
        const ks = mode === "x" ? _tIn(o.locale, "无调") : keyS, ksz = tx("key-hint"), kwh = P(c.mw("key-hint", ks)), end = at.get("end")! + Q(0.6), up = y - hs * 1.15, kIdx = q.head.idx.key ?? 0;
        const afterTempo = tempoHere ? at.get("tempo")! + P(tempoW(orn, q.head.bpm)) + Q(0.8) : end;   // 有速度：速度后面
        c.hint(row0, { part: { ink: { x0: 0, x1: kwh, y0: -ksz * 0.8, y1: ksz * 0.2 }, prims: [] }, tries: [{ x: end, y }, { x: afterTempo, y }, { x: hx, y: up }, { x: at.get("time")!, y: up }, { x: afterTempo, y: up }, { x: hx, y: up - hs * 1.15 }], climb: hs * 1.15,
          onPlace: (x, yy) => { keyHints.push({ ...(kt !== undefined ? { tok: kt } : {}), system: row0, index: kIdx, x, y: yy, size: ksz, s: ks }); } });
      }
      if (printKey && q.head.idx.key !== undefined) marks.push({ index: q.head.idx.key, kind: "key", system: row0, x: at.get("key")! - Q(0.3), y: y - hs, w: kw + Q(0.6), h: hs * 1.4 });
      // 轨开头的谱号记号（五线谱才有的；守卫 4，第五刀 5-3）：谱头那一行上面一个小灰标「谱号」（不印），点得到（谱号的小菜单里能改 / 删）
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i]!; if (t.kind === "note" || t.kind === "rest") break; if (t.kind !== "clef") continue;
        const lw = Q(2.6), ly = y - hs, ci = i;   // 7-K ②：谱头那一行上面一行、左对齐行首；上下差一个谱头字号。不印的提示（8-5）：最后贴、只躲不推
        c.hint(row0, { part: { ink: { x0: 0, x1: lw, y0: -Q(0.85), y1: Q(0.2) }, prims: [{ tok: t.id, t: "text", x: 0, y: 0, s: _tIn(o.locale, "谱号"), cls: "jp-staffonly ann", size: Q(1.0), anchor: "start" }] },
          tries: [{ x: hx, y: ly }, { x: hx, y: ly - Q(1.3) }, { x: at.get("end")! + Q(0.6), y }], climb: Q(1.3),
          onPlace: (x, yy) => { c.clefs.push({ kind: "mid", paper: paper.id, part: q.p.id, index: ci, system: row0, x, y: yy - Q(1.2), w: lw, h: Q(1.6) }); } });
        break;
      }
      if (q.head.idx.time !== undefined) marks.push({ index: q.head.idx.time, kind: "time", system: row0, x: at.get("time")! - Q(0.3), y: y - hs, w: tw + Q(0.6), h: hs * 1.4 });
    }));
    const spots: LyricSpot[] = []; lyricParts.push({ r, lrow: (s) => rowOf(s, r, 0), spots });
    const ign = new Set(q.p.ignores ?? []);   // 台上这位不认的记号：照画、画灰（纪律）
    const artCls = (a: string, base = "art") => [base, ign.has(a) ? "art-mute" : ""].filter(Boolean).join(" ");
    /** 弧线（延音线 / 圆滑线）要的：每个音的数字中心（px）+ 所在行 + 数字上沿（局部，八度点之上）；bot = 这个音往下的墨最低到哪（局部：下划线 / 低八度点 / 字母谱的下标；7-H 连音括号贴着它）。 */
    const arcAt = new Map<Chunk, { row: number; cx: number; top: number }>();
    /** 下划线：同一行、同一小节、同一拍里挨着的音 / 休止连成一条（第 L 层只连有 ≥ L 层的）。ch = 哪个音（7-H：连音的组认它）。 */
    const ul: { row: number; x0: number; x1: number; level: number; group: string; /** 第一条下划线的中线（局部 y，按组对齐好的）。 */ y0: number; tok: number | undefined; ch: Chunk }[] = [];
    // 下划线按拍成组（8-3「成组的」）：一组先对齐到组里最低的核（字母谱的下标、鼓的件字各不一样高），再一层一层往下贴
    const ulKey = (v: Chunk) => `${v.system}|${v.tick - v.inBar}|${Math.floor((v.inBar + 1e-6) / v.beat)}`;
    const ulTop = new Map<string, number>();
    for (const v of units) if (v.kind === "chunk" && !v.pad && underlines(v)) { const k = ulKey(v), y = coreBottom(v, q, mode, c.aux[r]) + UL_DROP; ulTop.set(k, Math.max(ulTop.get(k) ?? -Infinity, y)); }
    /** 每一段盒子的下边（局部 y）：连音的数字 / 括号贴在一组里最低的那个下面。 */
    const botOf = new Map<Chunk, number>();
    // 小节线 = 固定的短线（7-I，user 2026-11-12「嗯，小节线用三号」）：每一行、每一小节一样高，和这一行里有什么无关——以这种行的主字为中心，上下出头一样多 = 各一层
    //   （下面到第一条下划线的底，上面用同一个数，差不多到一个高八度点的位置；统筹 2026-11-12 改：原来「上到字顶、下到第二条下划线 + 两头各多 0.2 字高」= 下面出头是上面的两倍多，user「小节线为什么上下不一样长」）。
    //   两头不另留边（不留也不压到点或线：线在小节线那一列，点和下划线在音那一列）。和弦叠上去的音、第二三条下划线、下八度点、帽子、换气、力度都露在线外。
    //   数字行 / 字母行 / 鼓的 X 行同一条规矩，各按自己的主字（rowGlyphSpan）。试过的另两种（行身那么高的高线、跟着这一行内容兜多高的）删了，不留开关。
    //   行身（小节线原来那一段，JP_BODY）没动：名字、色条、歌词、行距照旧按它算
    const span = rowGlyphSpan(mode, kit, letters), BAR_TOP = span.top - span.layer, BAR_BOT = span.bottom + span.layer;
    let fifths = q.head.key;
    for (const u of units) {
      if (u.kind === "key") {   // 中途换调：在那一点写新的「1=D」（UX 稿第 3 节）
        fifths = u.fifths;
        const row = rowOf(u.system, r, 0), s = keyHead(u.fifths, u.minor), x = P(u.x) + Q(0.3), yb = Y(row, BASE_Y - 0.3);
        if (mode === "x" || letters) {   // 鼓 / 字母谱：只给提示（同谱头）。不印的提示最后贴、只躲不推（8-5）：这一列不占宽，提示从数字上面往上找空
          const ks = mode === "x" ? _tIn(o.locale, "无调") : s, ksz = tx("key-hint"), kwh = P(c.mw("key-hint", ks)), ktok = tokens[u.index] ? { tok: tokens[u.index]!.id } : {}, ki = u.index;
          c.hint(row, { part: { ink: { x0: 0, x1: kwh, y0: -ksz * 0.8, y1: ksz * 0.2 }, prims: [] }, tries: [-0.45, -1.65, -2.85, -4.05].map((dy) => ({ x, y: Y(row, DIGIT_TOP + dy) })), climb: Q(1.2),
            onPlace: (hx2, hy) => { keyHints.push({ ...ktok, system: row, index: ki, x: hx2, y: hy, size: ksz, s: ks }); } });
        } else {
          for (const pr of keyPrims(keyParts(u.fifths, u.minor, base, c.look.middleC), x, yb, Q(MID_TEXT_EM), "jp-head jp-mid", tokens[u.index] ? { tok: tokens[u.index]!.id } : {}).prims) put(row, pr);   // 中途换调：「1=D₄」（7-Q）
          marks.push({ index: u.index, kind: "key", system: row, x: x - Q(0.3), y: Y(row, BASE_Y - 1.6), w: Q(keyLayout(keyParts(u.fifths, u.minor, 0, 4), MID_TEXT_EM).w + 0.6), h: Q(2.2) });
        }
        continue;
      }
      if (u.kind === "time") {
        const row = rowOf(u.system, r, 0), s = `${u.beats}/${u.beatType}`, x = P(u.x) + Q(0.3);
        put(row, { tok: tokens[u.index]?.id, t: "text", x, y: Y(row, BASE_Y - 0.3), s, cls: "jp-head jp-mid", size: Q(MID_TEXT_EM), anchor: "start" });
        marks.push({ index: u.index, kind: "time", system: row, x: x - Q(0.3), y: Y(row, BASE_Y - 1.6), w: Q(headTextW(s, MID_TEXT_EM) + 0.6), h: Q(2.2) });
        continue;
      }
      if (u.kind === "bar") {   // 小节线：单线 / 段落线（双细）/ 终止线（细 + 粗）；反复的点 = 后面几步
        const row = rowOf(u.system, r, 0), x = P(u.x) + Q(BAR_DX), tok = u.index >= 0 ? tokens[u.index]?.id : undefined;
        const drawLines = (y0: number, y1: number) => {
          const line = (lx: number, w: number) => put(row, { ...(tok !== undefined ? { tok } : {}), t: "line", x1: lx, y1: y0, x2: lx, y2: y1, w: Q(w), cls: "bar jp-bar" });
          if (u.style === "final" || u.repeat === "end") { line(x - Q(BAR_GAP + BAR_THICK / 2), BAR_THIN); line(x, BAR_THICK); }
          else if (u.style === "double" || u.repeat) { line(x - Q(BAR_GAP), BAR_THIN); line(x, BAR_THIN); }
          else line(x, BAR_THIN);
        };
        drawLines(Y(row, BAR_TOP), Y(row, BAR_BOT));
        // 反复：双线旁边两个点（课本写法：|: 点在右、:| 点在左、:|: 两边都有）；一共放几遍 > 2 = 上面写「×3」
        const rdot = (dx: number) => { for (const yy of [DIGIT_MID - 0.55, DIGIT_MID + 0.55]) put(row, { ...(tok !== undefined ? { tok } : {}), t: "path", d: dotPath(x + Q(dx), Y(row, yy), Q(0.15)), cls: "jp-dot repeat-dot" }); };
        if (u.repeat === "start" || u.repeat === "both") rdot(0.4);
        if (u.repeat === "end" || u.repeat === "both") rdot(-(BAR_GAP + BAR_THICK + 0.4));
        if (u.repeat && u.times && u.times > 2) { const times = u.times, cl = "nav-mark" + orn.navMute(u.index); c.attach(row, "nav", () => placeAbove(row, 0.6 * jk, (yy) => c.prims.push({ t: "text", x: x - Q(0.6), y: yy, s: `×${times}`, cls: cl, size: tx("nav-mark"), anchor: "start" }))); }
        bars.push({ system: row, x });
        continue;
      }
      if (u.kind === "clef" || u.kind === "ottava") {   // 五线谱才有的记号落在数字行上：编辑器里画一个小灰标（不印），点得到（谱号 / 八度线的小菜单里能删）
        const row = rowOf(u.system, r, 0), x = P(u.x) + Q(0.2), t = tokens[u.index]!;
        const label = u.kind === "clef" ? _tIn(o.locale, "谱号") : (t as OttavaTok).shift === 0 ? "loco" : (t as OttavaTok).shift === 2 ? "15ma" : (t as OttavaTok).shift > 0 ? "8va" : "8vb";
        const ck = u.kind === "clef" ? "mid" as const : "ottava" as const, ci = u.index;   // 不印的提示（8-5）：不占宽、最后贴、只躲不推
        c.hint(row, { part: { ink: { x0: 0, x1: Q(2.4), y0: -Q(0.85), y1: Q(0.2) }, prims: [{ tok: t.id, t: "text", x: 0, y: 0, s: label, cls: "jp-staffonly ann", size: Q(1.0), anchor: "start" }] }, tries: [0.45, -0.75, -1.95, -3.15].map((ly) => ({ x, y: Y(row, ly) })), climb: Q(1.2),
          onPlace: (hx2, hy) => { c.clefs.push({ kind: ck, paper: paper.id, part: q.p.id, index: ci, system: row, x: hx2 - Q(0.2), y: hy - Q(0.95), w: Q(2.6), h: Q(1.3) }); } });
        continue;
      }
      if (u.kind === "groove") { layGroove(orn, u); continue; }   // 风格记号：共用挂件
      if (u.kind === "nav") { layNav(orn, u, (v) => P(v.x) + Q(BAR_DX)); continue; }   // 房子 / Segno / D.C.…：共用挂件（房子的钩下到小节线）
      if (u.kind === "tempo") { if (q.p.id === c.owner) layTempo(orn, rowOf(u.system, r, 0), u.x + 0.3, u.bpm, "tempo", u.index); continue; }   // 中途变速：共用挂件
      if (u.kind !== "chunk" || u.pad) continue;   // 补齐的淡色小节不画（同五线谱 v0.10.19）；力度 / 渐强渐弱 = 下面 layDynamics 一起摆
      // 一个音 / 休止 = 一个盒子（第八刀 8-2，note-cell.ts）：量和画用同一个；这里只把它放大成 px、放到位，再登记点击框 / 歌词位 / 弧线要的上下沿 / 挂件
      const row = rowOf(u.system, r, 0), tok = tokOf(u), T = tok !== undefined ? { tok } : {};
      const fd = mode === "digits" ? foldOf(u, c.aux[r]) : undefined, lt = lettersOf(q, u, mode, c.aux[r]), n = extraGlyphs(u), contDash = isContDash(u);
      // 横线 / 一拍一个 0：每个字形占一拍的宽——按排完版之后这个音实际占到下一列（下一个音 / 小节线 / 行尾）的宽平分，扣掉后面的附点、换气（统筹看 5-6 样张）
      const span = (spanTo.get(u) ?? u.x + u.w) - u.x;
      const nc = noteCell({ u, q, mode, ...(c.aux[r] ? { aux: c.aux[r] } : {}), fifths, base, ...(underlines(u) ? { ulY: ulTop.get(ulKey(u))! } : {}), step: n ? Math.max(DASH_PITCH, (span / jk - tailW(u)) / (n + 1)) : null, limit: span / jk, ...(tok !== undefined ? { tok } : {}), artCls });
      { const ox = P(u.x), oy = staffTop(row), f = Q(1); for (const p of nc.cell.prims(0, 0)) { scalePrim(p, f, ox, oy); put(row, p); } }
      const x0 = P(u.x) + Q(nc.x0), cx = P(u.x) + Q(nc.cx), glyphW = nc.glyphW;
      botOf.set(u, nc.bot);
      if (o.__cells) {   // 测试用（守卫 2）：这个盒子放在哪（行、原点 px、单位多大）；wall = 这一行里后面第一根小节线那根线（没有 = 行尾），px
        const nb = units.find((v) => v.system === u.system && v.x > u.x && v.kind === "bar");
        o.__cells({ ...(tok !== undefined ? { tok } : {}), box: nc.cell.box(), prims: nc.cell.prims(0, 0), row, ox: P(u.x), unit: Q(1), wall: nb ? P(nb.x) + Q(BAR_DX) : P(staffEnd[u.system]!) });
      }
      if (u.note && (u.ghost || !u.pitch)) {   // 没写音高的音：点得到、能放字
        if (u.j === 0) notes.push({ index: u.index, system: row, x: x0, y: Y(row, DIGIT_MID), w: Q(DIGIT_W), d: NaN });
        if (u.j === 0 && !u.tie) spots.push({ index: u.index, sys: u.system, row, cx0: cx, mx0: x0 - Q(0.6), mx1: x0 + Q(DIGIT_W) + Q(0.4), lyric: u.lyric, tok, cls: "ghost", mute: !!q.p.lyricMute?.has(tokens[u.index]?.id ?? -1), hyph: !!(tokens[u.index] as NoteTok | undefined)?.hyph });
      } else if (u.note && u.pitch) {
        if (fd?.ambiguous && !contDash) {   // 和弦名有歧义 = 小三角（编辑器里，点它 = 候选）：不印的提示（8-5）——不占宽、最后贴、只躲不推：先试名字右下，再右上、正下（统筹定的先后）
          const nw = Q(chordNameW(fd.name)), tx0 = x0 + nw + Q(0.05), ty = Y(row, BASE_Y), a = Q(0.45), rd = fd.read, ui = u.index, first = u.j === 0;
          c.hint(row, { part: { ink: { x0: 0, x1: a, y0: -a, y1: 0 }, prims: [{ ...T, t: "path", d: `M0,0L${a},0L${a},${-a}Z`, cls: "jp-chord-amb ann" }] },
            tries: [{ x: tx0, y: ty }, { x: tx0, y: Y(row, BASE_Y - CHORD_H) + a }, { x: x0 + nw / 2 - a / 2, y: ty + a + Q(0.35) }],
            onPlace: (hx2, hy) => { if (first) chordTagsOut.push({ x: hx2 - Q(0.2), y: hy - a - Q(0.3), w: a + Q(0.5), h: a + Q(0.6), read: rd, system: row, index: ui }); } });
        }
        if (u.j === 0) for (const m of nc.members) if (m.i > 0) chordHeads.push({ index: u.index, system: row, x: x0, y: Y(row, m.yb - DIGIT_H / 2), w: Q(DIGIT_W) });   // 叠在一起的别的音：各自一块点击区（指着同一个音 token）
        if (!contDash) {
          arcAt.set(u, { row, cx, top: nc.top! });
          // 帽子（挂件，贴天际线）：重音 / 次重音 = 描边的 >（重音粗、次重音细——UX 稿第 5 节）；强音 / 弱化 = Bravura 字形，大小照样张
          const local = u.art.includes("staccato") || u.art.includes("tenuto"), strong = (["accent", "marcato", "stress", "unstress"] as const).filter((x) => u.art.includes(x));
          const chev = (a: string, yb: number, st: number): Prim => {   // 一个实心的「>」（两条臂按粗细 st 围成的多边形；臂斜 0.4，竖着的厚 ≈ 1.08 倍粗细）
            const xa = cx - Q(CHEV_W / 2), xb = cx + Q(CHEV_W / 2), ym = yb - Q(CHEV_H / 2), yt = yb - Q(CHEV_H), t = Q(st) * 0.54;
            return { ...T, t: "path", d: `M${xa},${yt - t}L${xb + t},${ym}L${xa},${yb + t}L${xa},${yb - t}L${xb - t * 2.5},${ym}L${xa},${yt + t}Z`, cls: artCls(a, `art jp-chev ${a}`) };
          };
          if (strong.length) c.attach(row, "strength", () => { strong.forEach((a, i) => placeAbove(row, (i === 0 && !local ? MARK_GAP : MARK_GAP2) * jk, (y) => {
            if (a === "accent" || a === "stress") c.prims.push(chev(a, y, a === "accent" ? CHEV_STROKE : CHEV_STROKE_THIN));
            else { const g = jpGlyph(a)!, em = a === "marcato" ? MARCATO_EM : UNSTRESS_EM; c.prims.push({ ...T, t: "glyph", x: cx - Q((g.w * em) / 8), y, ch: g.above, cls: artCls(a), size: Q(em) }); }
          })); });
          const swl = u.j === 0 ? swellOf(tokens[u.index]!) : undefined, atk = (["sfz", "fp"] as const).filter((x) => u.art.includes(x));
          if (swl || atk.length) layNoteDynamics(orn, row, u, { cx, x0, w: P(u.w), tok, cls: undefined, ign, swl, roll: u.art.includes("roll"), atk });   // 突强 / 强后弱 / 音内起伏：共用挂件
        }
        if (u.j === 0) notes.push({ index: u.index, system: row, x: x0, y: Y(row, nc.hiBase - DIGIT_H / 2), w: Q(glyphW), d: NaN });   // 旋律线那个数字（和弦 = 最上面）；数字行没有「纵向 = 音高」：d = NaN
        if (u.j === 0 && !u.tie) spots.push({ index: u.index, sys: u.system, row, cx0: cx, mx0: x0 - Q(0.6), mx1: x0 + Q(glyphW) + Q(0.4), lyric: u.lyric, tok, cls: undefined, mute: !!q.p.lyricMute?.has(tokens[u.index]?.id ?? -1), hyph: !!(tokens[u.index] as NoteTok | undefined)?.hyph });
      } else if (!u.note) {
        if (u.j === 0 && u.index >= 0) rests.push({ index: u.index, system: row, x: x0, y: Y(row, DIGIT_MID), w: Q(DIGIT_W) });
      }
      const nUL = underlines(u);
      if (nUL) { const uh = fd || lt ? glyphW / 2 - 0.05 * DIGIT_W : 0.45 * DIGIT_W; ul.push({ row, x0: cx - Q(uh), x1: cx + Q(uh), level: nUL, group: ulKey(u), y0: ulTop.get(ulKey(u))!, tok, ch: u }); }   // 样张：每个数字下面 ±0.45 个数字宽（附点不带）
    }
    // 连音的组（UX 稿第 4 节）：同一比例连着的一串凑满就收一组；每组都标（原样从下面挪上来：下划线画之前要知道哪儿断开）
    const tups: { run: Chunk[]; num: string }[] = [];
    { let run: Chunk[] = [], acc = 0, minBase = Infinity;
      const flush = () => { if (run.length && run[0]!.ratio) tups.push({ run, num: String(run[0]!.ratio![0]) }); run = []; acc = 0; minBase = Infinity; };
      for (const v of units) {
        if (v.kind !== "chunk" || v.pad) continue;
        const rr = v.ratio ? v.ratio.join(":") : null;
        if (!rr || (run.length && run[0]!.ratio!.join(":") !== rr)) { flush(); if (!rr) continue; }
        run.push(v); acc += v.ticks; minBase = Math.min(minBase, v.base);
        if (acc >= v.ratio![1] * minBase - 1e-6) flush();
      }
      flush(); }
    // 连音（8-3，user 2026-11-12「带下划线的三连音，把数字写在那个横线下面，而不是写在横线中间…不带下划线的，要不还是用虚线吧，就是方勾虚线」；取代 7-H）：
    //   这组音连成了一条下划线 = 下划线照画、不断开，数字写在这组最低的墨（最下面那条下划线、低八度点）下面、居中；
    //   没连成一条 = 方钩的虚线括号（两头直角的短钩是实线、中间是虚线），数字在括号中间的缺口里；括号在这组最低的墨下面。
    const NUM_EM = 1.1, numCap = DIGIT_H * (NUM_EM / DIGIT_EM), GAP_HALF = 0.45, HOOK = 0.35, TUP_GAP = 0.25, DASH_ON = 0.45, DASH_OFF = 0.3;   // numCap = 数字的字高（局部）
    const ulOf = new Map(ul.map((e) => [e.ch, e] as const));
    const tupDraw: (() => void)[] = [];
    for (const { run, num } of tups) {
      const first = run[0]!, last = run[run.length - 1]!, row = rowOf(first.system, r, 0), x1 = P(first.x) + Q(0.1), x2 = last.system === first.system ? P(last.x) + Q(0.1 + glyphWOf(last, c.aux[r], q)) : P(c.right), mid = (x1 + x2) / 2;
      const Ls = Math.min(...run.map((v) => ulOf.get(v)?.level ?? 0)), g0 = ulOf.get(first)?.group, onLine = Ls >= 1 && last.system === first.system && run.every((v) => ulOf.get(v)?.group === g0);
      const low = Math.max(...run.map((v) => botOf.get(v) ?? BASE_Y));   // 这组最低的墨（局部）：盒子的下边（含下划线、低八度点、滚奏）
      if (onLine) tupDraw.push(() => put(row, { t: "text", x: mid, y: Y(row, low + TUP_GAP + numCap), s: num, cls: "tuplet jp-tuplet", size: Q(NUM_EM), anchor: "middle" }));
      else {
        const yl = low + TUP_GAP + numCap / 2;   // 括号那道线（局部）：数字的竖直中心在线上
        tupDraw.push(() => {
          put(row, { t: "text", x: mid, y: Y(row, yl + numCap / 2), s: num, cls: "tuplet jp-tuplet", size: Q(NUM_EM), anchor: "middle" });
          const y = Y(row, yl), yh = Y(row, yl - HOOK), on = Q(DASH_ON), off = Q(DASH_OFF);
          // 虚线在这里一段段算（屏幕和 PDF 一样，同渐到的虚线）：段数取整、均匀摊开，两头都落在整段上（不在缺口边上留一个小尾巴）
          const dashes = (a: number, b: number): string => { const len = b - a; if (len <= 1e-6) return ""; const n = Math.max(1, Math.round((len + off) / (on + off))), unit = (len + off) / n, dl = unit - off * (unit / (on + off)); let d = ""; for (let k = 0; k < n; k++) { const x = a + k * unit; d += `M${x},${y}L${Math.min(b, x + dl)},${y}`; } return d; };
          put(row, { t: "path", d: `M${x1},${yh}L${x1},${y}M${x2},${y}L${x2},${yh}`, cls: "tuplet-bracket" });   // 两头的钩（实线、朝上）
          put(row, { t: "path", d: dashes(x1, mid - Q(GAP_HALF)) + dashes(mid + Q(GAP_HALF), x2), cls: "tuplet-bracket tuplet-dash" });
        });
      }
    }
    // 下划线按拍分组（UX 稿第 4 节）：第 L 层 = 一串挨着的、同组、都有 ≥ L 层的连成一条；高度 = 这一组对齐好的第一条 + 层数（8-3）
    const maxL = Math.max(0, ...ul.map((e) => e.level));
    for (let L = 1; L <= maxL; L++) {
      let i = 0;
      while (i < ul.length) {
        if (ul[i]!.level < L) { i++; continue; }
        let j = i; while (j + 1 < ul.length && ul[j + 1]!.level >= L && ul[j + 1]!.group === ul[i]!.group) j++;
        const a = ul[i]!, b = ul[j]!, y = Y(a.row, a.y0 + (L - 1) * UL_GAP);
        put(a.row, { ...(i === j && a.tok !== undefined ? { tok: a.tok } : {}), t: "line", x1: a.x0, y1: y, x2: b.x1, y2: y, w: Q(UL_W), cls: "jp-ul" });
        i = j + 1;
      }
    }
    // 延音线 / 圆滑线（UX 稿第 5 节：弧线；一字多音用歌词后面的延长横线，弧线只给真的连线）：数字上方的弧。跨行 = 两半（这一行到行尾、下一行从行头起）
    const arc = (a: { row: number; cx: number; top: number }, b: { row: number; cx: number; top: number }, cls: string, lift: number) => {
      const seg = (row: number, x1: number, x2: number, top: number) => { const y = Y(row, top - lift), len = Math.abs(x2 - x1), h = Math.min(len * 0.25, Math.max(Q(0.4), Math.min(Q(1.2), len * 0.12))); put(row, { t: "path", d: `M${x1},${y}Q${(x1 + x2) / 2},${y - h} ${x2},${y}`, cls }); };
      if (a.row === b.row) seg(a.row, a.cx + Q(0.3), b.cx - Q(0.3), Math.min(a.top, b.top));
      else { seg(a.row, a.cx + Q(0.3), P(c.right) - Q(0.2), a.top); seg(b.row, Math.max(b.cx - Q(2.4), orn.left(rows[b.row]!.sys)), b.cx - Q(0.3), b.top); }   // 续行那一段不越过行首竖线（7-K ⑤）
    };
    const chunks = units.filter((v): v is Chunk => v.kind === "chunk" && v.note && !v.pad && arcAt.has(v));
    for (let i = 1; i < chunks.length; i++) {   // 延音线：同一个音拆开的几段之间（接着的长音画成横线的那几段不用）+ 数据里的 tie（连着前一个音）
      const b = chunks[i]!, a = chunks[i - 1]!;
      if ((b.j > 0 && b.index === a.index) || (b.j === 0 && b.tie)) arc(arcAt.get(a)!, arcAt.get(b)!, "tie jp-tie", 0.2);
    }
    for (let i = 0; i < chunks.length; i++) {   // 圆滑线：连着的一串（这个音连到下一个）画一条
      const a = chunks[i]!; if (a.j !== 0 || !(tokens[a.index] as NoteTok | undefined)?.slur) continue;
      let j = i; while (j + 1 < chunks.length && ((tokens[chunks[j]!.index] as NoteTok | undefined)?.slur || chunks[j + 1]!.index === chunks[j]!.index)) j++;
      if (j > i) arc(arcAt.get(a)!, arcAt.get(chunks[j]!)!, artCls("slur", "slur jp-slur"), 0.75);
      i = j;
    }
    for (const f of tupDraw) f();   // 连音的数字 / 括号（组和位置在下划线之前算好的，7-H）
    // 和弦级数（第五刀 5-4 ④；UX 稿第 2 节「显示和弦级数」= 歌的总开关）：标哪几个音、标什么 = 预处理（theory/families.ts：合租的一家合起来认，标在这一家最下面那一行；两种谱同一份）；
    //   摆在这个音的右下（数字右边、往下贴天际线，歌词让在它下面）。鼓的 X 行不标
    if (mode === "digits" && c.harmony) {
      const theory = harmonyTheory(), placed = new Map((c.harmony.get(q.p.id) ?? []).map((x) => [x.index, x] as const)), fs = tx("chord-tag"), mineSet = new Set(mine);
      for (const u of units) {
        if (u.kind !== "chunk" || !u.note || u.j !== 0 || u.index < 0 || u.pad) continue;
        const pt = placed.get(u.index); if (!pt) continue;
        const rd = pt.read, rAt = pt.at === q.p.id ? -1 : per.findIndex((x) => x.p.id === pt.at), atOwn = rAt >= 0 && mineSet.has(rAt);   // 一家的：画在最下面那一位的那一行（不是数字行的 = 画在自己这一行）
        const row = rowOf(u.system, atOwn ? rAt : r, 0), lx = P(u.x) + Q(0.1 + DIGIT_W) + TR("chord-tag", 0.1), label = c.look.chordTagStyle === "root" ? theory.rootLabel(rd) : theory.label(rd);
        const cls = `chord-tag${rd.pinned ? " is-pinned" : ""}${rd.stale ? " is-stale" : ""}`;   // 人挑的 = 换个颜色；对不上了 = 灰 + 「?」（同五线谱）
        //   最少往下让到行身（小节线那一段）下面 + 字高：数字行没有五条线，数字右边的那一截下面可能一点墨都没有（五线谱靠线挡着），不给最小值就贴在行顶上
        c.attach(row, "chordTag", () => placeBelow(row, 0.3 * jk, (y) => {
          const ct = chordTextPrims(label, lx, y, fs, cls); c.prims.push(...ct.prims);   // 字 + 升降号字形（v0.17.34，同五线谱）
          chordTagsOut.push({ x: lx - TR("chord-tag", 0.3), y: y - fs * 1.05, w: ct.w + TR("chord-tag", 0.6), h: fs * 1.4, read: rd, system: row, index: u.index, ...(atOwn ? { part: q.p.id } : {}) });
        }, { min: (BAR_Y1 + 0.3) * jk + (fs / P(1)) * 0.8, wall: true }));   // 砖墙排（v0.17.36，同五线谱）
      }
    }
    layDynamics(orn);   // 力度那一层（力度字：中文界面写中文、别的界面写字母；记号表 signs.ts）
    layPedals(orn);   // 踏板（11-1）：共用挂件，这一行下面最外一道（歌词再往外）
    if (kit && mode === "x" && q.p.kitNames) layKitLegend(q, r);   // 整套鼓的图例（行首名字下面）
    // 光标落点、写字头：框架那一套（frame/carets.ts）；升降号挂在左边，光标画在它左边；数字行没有谱号位移
    const inkL = measured[r]!.inkL;
    caretStops(q, { cx: (u) => { const k = u.kind === "chunk" ? inkL.get(u as Chunk) : undefined; return P(u.x) - (k ? P(k) + Q(0.2) : 0); }, shiftAt: () => Array.from({ length: q.staves }, () => 0), rowOf: (sy, k) => rowOf(sy, r, k), P, sysStart0: sysStarts[0]!, cols, slots, heads });
  }
  return { lyricParts };
}
