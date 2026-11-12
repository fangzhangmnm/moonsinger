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
import { layDynamics, layGroove, layNav, layTempo, layNoteDynamics, tempoAt, type OrnCtx } from "../ornaments/index.ts";
import type { TextRole } from "../text/index.ts";
import type { LaneKind } from "../frame/lanes.ts";
import { MARGIN } from "../frame/params.ts";
import { caretStops } from "../frame/carets.ts";
import type { LyricSpot, LyricPart } from "../frame/lyric-spots.ts";
import type { Chunk } from "../frame/units.ts";
import { type JianpuTrack, type JianpuMode, type JianpuAux, foldOf, extraGlyphs, hasAugDot, underlines, accsOf, hasArp, contDash as isContDash, lettersOf, glyphWOf } from "./chunk.ts";
import { midTextW } from "./measure.ts";
import { noteCell, tailW } from "./note-cell.ts";
import { scalePrim } from "../skyline.ts";
import { DIGIT_EM, DIGIT_W, BASE_Y, DIGIT_TOP, DIGIT_MID, UL_Y0, UL_GAP, UL_W, DOT_R, DOT_GAP, DOT_STEP, ACC_EM, ACC_DX, ACC_Y, DASH_L, DASH_W, DASH_Y, DASH_PITCH, AUG_DX, AUG_R,
  BAR_Y0, BAR_Y1, BAR_DX, BAR_THIN, BAR_THICK, BAR_GAP, MID_TEXT_EM, BREATH_W, INHALE_W, ACC_W, ARP_W, DIGIT_H, X_EM, KIT_CHAR, KIT_EM, JP_BODY, letterW, letterParts, CHORD_GAP, SCRIPT_K, SCRIPT_GAP, SUP_DY, SUB_DY, SUB_DROP, SUP_RISE, AUG_Y, lowDotY, LOW_DOT_UNDER, GHOST_K, HEAD_EM, MARK_GAP, MARK_GAP2, STACC_W, STACC_H, STACC_STEP, CHEV_W, CHEV_H, CHEV_STROKE, CHEV_STROKE_THIN, TEN_L, TEN_W, TEN_DY, TEN_STEP, MARCATO_EM, UNSTRESS_EM, BREATH_EM, BREATH_Y, MID_TEXT_CH, CHORD_EM, CHORD_SX, CHORD_H, CHORD_AMB_W, chordNameW, chordBassCx, stackBases, dotPath, accText } from "./glyphs.ts";

/** 简谱数字行贴挂件的先后（从数字往上：演奏法 → 音的修饰 → 力度道 → 跳转 → 速度 → 风格 → 小节号 → 和弦级数；歌词在下面）。和五线谱同一张道名表（frame/lanes.ts）。 */
export const JIANPU_LANES: readonly LaneKind[] = ["strength", "noteDynamics", "dynamics", "nav", "tempo", "groove", "barNumber", "chordTag", "lyrics"];

/** 框架交给数字行的东西（是五线谱那一份的子集：不要纵向 ↔ 音高的几何）。 */
export interface JianpuDrawCtx {
  song: Song; look: SongView; paper: PaperSeg; o: EngraveOpts;
  P: (v: number) => number; tx: (role: TextRole) => number; TR: (role: TextRole, v: number) => number; RS: (role: TextRole) => number; mw: (role: TextRole, s: string) => number; sp: number;
  /** 行里的尺寸比例（排版参数表行一级；第五刀 5-0c）：数字行自己的尺寸 / 偏移都乘它。没给 = 1。 */
  scale?: number;
  put: (row: number, p: Prim) => void; hitRow: (hit: object, row: number) => void;
  prims: Prim[]; notes: HitNote[]; chordHeads: Layout["chordHeads"]; keyHints: Layout["keyHints"]; chordTagsOut: Layout["chordTags"]; rests: RestHit[]; marks: MarkHit[]; dyns: DynHit[]; clefs: ClefHit[]; slots: Slot[]; heads: CaretHead[]; bars: Layout["bars"]; rows: SystemBox[];
  staffTop: (r: number) => number; rowOf: (s: number, r: number, k?: number) => number;
  placeAbove: (row: number, gap: number, draw: (y: number) => void) => number;
  placeBelow: (row: number, gap: number, draw: (y: number) => void, o2?: { min?: number; count?: boolean }) => number;
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
export function drawJianpu(c: JianpuDrawCtx, mine: readonly number[], mode: JianpuMode = "digits"): { lyricParts: LyricPart[] } {
  const lyricParts: LyricPart[] = [];
  const { song, paper, o, P, tx, TR, put, notes, chordHeads, keyHints, chordTagsOut, placeBelow, rests, marks, slots, heads, bars, rows, staffTop, rowOf, placeAbove, per, measured, nSys, sysStarts, staffEnd, cols, ind0 } = c;
  const jk = c.scale ?? 1, Q = (v: number) => P(v * jk);   // 行里的尺寸比例（排版参数表行一级，第五刀 5-0c）：数字行自己的尺寸 / 偏移走 Q，框架给的位置（u.x、右边界、行首）走 P
  const Y = (row: number, v: number) => staffTop(row) + Q(v);   // 局部 y（数字行的单位）→ px（框架还没定行距：staffTop 是这一行的临时原点）
  /** 整套鼓的图例（5-6，统筹裁定：简谱里印一行图例说明每种字是哪几件）：这张纸上这位第一次有敲击的那一行，行首名字下面一行一种字——
   *  「● 大鼓 / 小鼓」；按五线鼓谱上的高低从上往下排（同叠的方向）；名字宽过名字那一栏就折到下一行（缩进）。名字由宿主按界面语言给（PartView.kitNames），没有名字的鼓件不列。屏幕和 PDF 都印。 */
  const layKitLegend = (q: JianpuTrack, r: number): void => {
    const first = q.units.find((u): u is Chunk => u.kind === "chunk" && u.note && !u.pad && !!u.pitch); if (!first) return;
    const groups = new Map<string, { line: number; names: string[]; lines: number[] }>();
    for (const u of q.units) {
      if (u.kind !== "chunk" || !u.note || u.pad || u.system !== first.system || !u.pitch) continue;
      for (const pp of u.pitches.length ? u.pitches : [u.pitch]) {
        const m = midiOf(pp), nm = q.p.kitNames?.[m]; if (!nm) continue;
        const pi = percOf(128, 0, m), ch = KIT_CHAR[pi?.head ?? "normal"] ?? "●", g = groups.get(ch) ?? { line: pi?.line ?? 4, names: [], lines: [] };
        g.line = Math.min(g.line, pi?.line ?? 4); if (!g.names.includes(nm)) { g.names.push(nm); g.lines.push(pi?.line ?? 4); } groups.set(ch, g);
      }
    }
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
      for (const c0 of pend) spanTo.set(c0, staffEnd[c0.system]!); }
    // 共用挂件（力度那一串、风格、跳转房子、速度；ornaments/index.ts）：音的锚点 = 数字的左右缘
    const orn: OrnCtx = { song, paper, o, notation: "jianpu", P, tx, TR: c.TR, RS: c.RS, mw: c.mw, sp: c.sp, prims: c.prims, dyns: c.dyns, marks, placeAbove, attach: c.attach, right: c.right, left: (sy) => P(MARGIN + (sy === 0 ? ind0 : c.indN)) + Q(0.6), tokens, units, row: (sy) => rowOf(sy, r, 0),   // left = jianpuLineStart（行首竖线往右 0.6）
      glyphScale: jk, noteX: (ch) => P(ch.x) + Q(0.1), noteEnd: (ch) => P(ch.x) + Q(0.1 + DIGIT_W), dynOff: dynOverridden(tokens), navMute: (i) => (navWhy(song, paper, q.p.id, tokens[i]!) ? " art-mute" : "") };
    // 八度基准（UX 稿第 3 节；第五刀 5-4）：整条轨（这张纸上）一个基准——按台上那位的音域定（宿主查好放在 q.p.range）；查不到 = 写的音「点最少」；
    //   按音域定的基准下有音要三个点以上（写得离这件乐器的音域很远）= 极端：退回「点最少」。基准画在每一行「1=」那个字母上下（下面 keyDots）
    //   字母谱（7-B）：tracker 写法自己带八度数字，不用点（tonicOf 只是让基准按 C 分组，给鬼音符之类读 octBase 时不乱）
    const letters = q.letters !== undefined && mode === "digits", tonicOf = (f: number) => (letters ? 0 : f);
    let f0 = q.head.key; const shifts: number[] = [];
    for (const u of units) { if (u.kind === "key") f0 = u.fifths; else if (u.kind === "chunk" && u.note && u.pitch && !u.pad) shifts.push(toDegree(u.pitch, tonicOf(f0)).shift); }
    const fewest = fewestDotsBase(shifts), byRange = q.p.range ? rangeBase(q.p.range.lo, q.p.range.hi, tonicOf(q.head.key)) : null;
    const base = byRange !== null && shifts.every((x) => Math.abs(x - byRange) <= 2) ? byRange : fewest;
    /** 「1=D」那个字母上下画基准的点（上 = 高八度、下 = 低八度；UX 稿第 3 节「每行自己的 1=，字母上下加点」）：x0 = 字的左边、y = 基线、size = 字号（px）；字母的位置按字宽估（半角）。 */
    const keyDots = (row: number, x0: number, y: number, size: number, text: string, tok: number | undefined) => {
      if (!base || mode !== "digits" || letters) return;
      const cs = [...text], li = cs.findIndex((ch) => /[A-G]/.test(ch)); if (li < 0) return;
      const wOf = (ch: string) => (/[0-9]/.test(ch) ? 0.56 : ch === "=" ? 0.6 : /[♭♯]/.test(ch) ? 0.5 : 0.66) * size;
      const lx = x0 + cs.slice(0, li).reduce((w, ch) => w + wOf(ch), 0) + wOf(cs[li]!) / 2, r0 = size * 0.075, step = size * 0.2;
      for (let j = 0; j < Math.abs(base); j++) put(row, { ...(tok !== undefined ? { tok } : {}), t: "path", d: dotPath(lx, base > 0 ? y - size * 0.82 - r0 - j * step : y + size * 0.16 + r0 + j * step, r0), cls: "jp-dot jp-key-dot" });
    };
    for (let s = 0; s < nSys; s++) { const row = rowOf(s, r, 0); if (rows[row]) { rows[row]!.octBase = base; if (letters) rows[row]!.middleC = q.letters!; } }
    // 谱头（UX 稿第 3 节）：第一行上方「1=C  4/4」，字也能点（= 调号 / 拍号的点击框，开谱头面板）
    const row0 = rowOf(0, r, 0), hx = P(MARGIN + ind0) + Q(0.6);
    const keyS = keyHead(q.head.key, q.head.minor), timeS = `${q.head.time.beats}/${q.head.time.beatType}`, hs = Q(HEAD_EM);   // 样张：谱头那一行 0.773 FS、常规粗细
    const headW = (str: string) => ([...str].length * MID_TEXT_CH * HEAD_EM + 0.6) * jk;   // 谱头的字占多宽（sp；半角，按字数估）
    const tempoHere = q.p.id === c.owner && q.head.idx.tempo !== undefined;   // 速度写在谱头同一行（UX 稿第 3 节「1=♭A  4/4  ♩=100」）：这张纸最上面在场的那位才写
    c.attach(row0, "tempo", () => placeAbove(row0, 0.5 * jk, (y) => {
      const kw = P(headW(keyS)), tw = P(headW(timeS));   // 谱头的字跟字的尺子（tx），不跟数字行缩
      const kt = q.head.idx.key !== undefined ? tokens[q.head.idx.key]?.id : undefined, tt = q.head.idx.time !== undefined ? tokens[q.head.idx.time]?.id : undefined;   // 谱头的字指着谱头那两个 token（守卫 4：每个 token 都有图元）
      if (mode === "x" || letters) keyHints.push({ ...(kt !== undefined ? { tok: kt } : {}), system: row0, index: q.head.idx.key ?? 0, x: letters ? hx + tw : hx, y, size: tx("key-hint"), s: mode === "x" ? _tIn(o.locale, "无调") : keyS });   // 打击乐的行没有调（7-R，统筹定 A：提示照画、字写「无调」，不加括号——括号在这个 app 里是「推定的」；守卫 4 不改）   // 字母谱：拍号顶到了前面，提示放在拍号后面那个空当里（速度照旧让出一个调号的宽；7-K ①）   // 鼓的 X 行 / 字母谱（7-B「调号不写」）：调号不印，编辑器里淡的「1=D」提示（统筹裁定 5-3：调号是真的状态）
      else { put(row0, { ...(kt !== undefined ? { tok: kt } : {}), t: "text", x: hx, y, s: keyS, cls: "jp-head", size: hs, anchor: "start" }); keyDots(row0, hx, y, hs, keyS, kt); }
      put(row0, { ...(tt !== undefined ? { tok: tt } : {}), t: "text", x: letters ? hx : hx + kw, y, s: timeS, cls: "jp-head", size: hs, anchor: "start" });   // 字母谱没有「1=」：拍号顶到前面
      if (tempoHere) tempoAt(orn, row0, MARGIN + ind0 + 0.6 * jk + headW(keyS) + headW(timeS) + 0.6 * jk, q.head.bpm, "tempo", q.head.idx.tempo!, c.prevBpm === null || c.prevBpm === q.head.bpm ? undefined : q.head.bpm > c.prevBpm ? "up" : "down", y);
      if (q.head.idx.key !== undefined) marks.push({ index: q.head.idx.key, kind: "key", system: row0, x: hx - Q(0.3), y: y - hs, w: kw, h: hs * 1.4 });
      // 轨开头的谱号记号（五线谱才有的；守卫 4，第五刀 5-3）：谱头「1=C」左边一个小灰标「谱号」（不印），点得到（谱号的小菜单里能改 / 删）
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i]!; if (t.kind === "note" || t.kind === "rest") break; if (t.kind !== "clef") continue;
        const lw = Q(2.6), ly = y - hs;   // 7-K ②：谱头那一行上面一行、左对齐行首（原来在「1=C」左边往左写，写进了名字那一栏、压着行首竖线和色条）；上下差一个谱头字号
        put(row0, { tok: t.id, t: "text", x: hx, y: ly, s: _tIn(o.locale, "谱号"), cls: "jp-staffonly ann", size: Q(1.0), anchor: "start" });
        c.clefs.push({ kind: "mid", paper: paper.id, part: q.p.id, index: i, system: row0, x: hx, y: ly - Q(1.2), w: lw, h: Q(1.6) });
        break;
      }
      if (q.head.idx.time !== undefined) marks.push({ index: q.head.idx.time, kind: "time", system: row0, x: hx + kw - Q(0.3), y: y - hs, w: tw, h: hs * 1.4 });
    }));
    const spots: LyricSpot[] = []; lyricParts.push({ r, lrow: (s) => rowOf(s, r, 0), spots });
    const ign = new Set(q.p.ignores ?? []);   // 台上这位不认的记号：照画、画灰（纪律）
    const artCls = (a: string, base = "art") => [base, ign.has(a) ? "art-mute" : ""].filter(Boolean).join(" ");
    /** 弧线（延音线 / 圆滑线）要的：每个音的数字中心（px）+ 所在行 + 数字上沿（局部，八度点之上）；bot = 这个音往下的墨最低到哪（局部：下划线 / 低八度点 / 字母谱的下标；7-H 连音括号贴着它）。 */
    const arcAt = new Map<Chunk, { row: number; cx: number; top: number; bot: number }>();
    /** 下划线：同一行、同一小节、同一拍里挨着的音 / 休止连成一条（第 L 层只连有 ≥ L 层的）。ch = 哪个音（7-H：连音的组认它）。 */
    const ul: { row: number; x0: number; x1: number; level: number; group: string; tok: number | undefined; ch: Chunk }[] = [];
    let fifths = q.head.key;
    for (const u of units) {
      if (u.kind === "key") {   // 中途换调：在那一点写新的「1=D」（UX 稿第 3 节）
        fifths = u.fifths;
        const row = rowOf(u.system, r, 0), s = keyHead(u.fifths, u.minor), x = P(u.x) + Q(0.3);
        if (mode === "x" || letters) keyHints.push({ ...(tokens[u.index] ? { tok: tokens[u.index]!.id } : {}), system: row, index: u.index, x, y: Y(row, BASE_Y - 0.3), size: tx("key-hint"), s: mode === "x" ? _tIn(o.locale, "无调") : s });   // 鼓 / 字母谱：只给提示（同谱头）
        else { put(row, { tok: tokens[u.index]?.id, t: "text", x, y: Y(row, BASE_Y - 0.3), s, cls: "jp-head jp-mid", size: Q(MID_TEXT_EM), anchor: "start" }); keyDots(row, x, Y(row, BASE_Y - 0.3), Q(MID_TEXT_EM), s, tokens[u.index]?.id); }
        marks.push({ index: u.index, kind: "key", system: row, x: x - Q(0.3), y: Y(row, BASE_Y - 1.6), w: Q(midTextW(s)), h: Q(2.2) });
        continue;
      }
      if (u.kind === "time") {
        const row = rowOf(u.system, r, 0), s = `${u.beats}/${u.beatType}`, x = P(u.x) + Q(0.3);
        put(row, { tok: tokens[u.index]?.id, t: "text", x, y: Y(row, BASE_Y - 0.3), s, cls: "jp-head jp-mid", size: Q(MID_TEXT_EM), anchor: "start" });
        marks.push({ index: u.index, kind: "time", system: row, x: x - Q(0.3), y: Y(row, BASE_Y - 1.6), w: Q(midTextW(s)), h: Q(2.2) });
        continue;
      }
      if (u.kind === "bar") {   // 小节线：单线 / 段落线（双细）/ 终止线（细 + 粗）；反复的点 = 后面几步
        const row = rowOf(u.system, r, 0), x = P(u.x) + Q(BAR_DX), y0 = Y(row, BAR_Y0), y1 = Y(row, BAR_Y1), tok = u.index >= 0 ? tokens[u.index]?.id : undefined;
        const line = (lx: number, w: number) => put(row, { ...(tok !== undefined ? { tok } : {}), t: "line", x1: lx, y1: y0, x2: lx, y2: y1, w: Q(w), cls: "bar jp-bar" });
        if (u.style === "final" || u.repeat === "end") { line(x - Q(BAR_GAP + BAR_THICK / 2), BAR_THIN); line(x, BAR_THICK); }
        else if (u.style === "double" || u.repeat) { line(x - Q(BAR_GAP), BAR_THIN); line(x, BAR_THIN); }
        else line(x, BAR_THIN);
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
        put(row, { tok: t.id, t: "text", x, y: Y(row, 0.45), s: label, cls: "jp-staffonly ann", size: Q(1.0), anchor: "start" });
        c.clefs.push({ kind: u.kind === "clef" ? "mid" : "ottava", paper: paper.id, part: q.p.id, index: u.index, system: row, x: x - Q(0.2), y: Y(row, -0.5), w: Q(2.6), h: Q(1.3) });
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
      const nc = noteCell({ u, q, mode, ...(c.aux[r] ? { aux: c.aux[r] } : {}), fifths, base, step: n ? Math.max(DASH_PITCH, (span / jk - tailW(u)) / (n + 1)) : null, limit: span / jk, ...(tok !== undefined ? { tok } : {}), artCls,
        ...(u.note && u.inhale ? { inhale: { text: u.inhale === "big" ? _tIn(o.locale, "深吸##记号") : _tIn(o.locale, "吸##记号"), size: tx("breath-label") / Q(1) } } : {}) });
      { const ox = P(u.x), oy = staffTop(row), f = Q(1); for (const p of nc.cell.prims(0, 0)) { scalePrim(p, f, ox, oy); put(row, p); } }
      const x0 = P(u.x) + Q(nc.x0), cx = P(u.x) + Q(nc.cx), glyphW = nc.glyphW;
      if (u.note && (u.ghost || !u.pitch)) {   // 没写音高的音：点得到、能放字
        if (u.j === 0) notes.push({ index: u.index, system: row, x: x0, y: Y(row, DIGIT_MID), w: Q(DIGIT_W), d: NaN });
        if (u.j === 0 && !u.tie) spots.push({ index: u.index, sys: u.system, row, cx0: cx, mx0: x0 - Q(0.6), mx1: x0 + Q(DIGIT_W) + Q(0.4), lyric: u.lyric, tok, cls: "ghost", mute: !!q.p.lyricMute?.has(tokens[u.index]?.id ?? -1), hyph: !!(tokens[u.index] as NoteTok | undefined)?.hyph });
      } else if (u.note && u.pitch) {
        if (fd?.ambiguous && !contDash) {   // 和弦名有歧义 = 右下角小三角（编辑器里，点它 = 候选；不在盒子里：8-5 搬去不印的提示）
          const tx0 = x0 + Q(chordNameW(fd.name) + 0.05), ty = Y(row, BASE_Y), a = Q(0.45);
          put(row, { ...T, t: "path", d: `M${tx0},${ty}L${tx0 + a},${ty}L${tx0 + a},${ty - a}Z`, cls: "jp-chord-amb ann" });
          if (u.j === 0) chordTagsOut.push({ x: tx0 - Q(0.2), y: ty - a - Q(0.3), w: a + Q(0.5), h: a + Q(0.6), read: fd.read, system: row, index: u.index });
        }
        if (u.j === 0) for (const m of nc.members) if (m.i > 0) chordHeads.push({ index: u.index, system: row, x: x0, y: Y(row, m.yb - DIGIT_H / 2), w: Q(DIGIT_W) });   // 叠在一起的别的音：各自一块点击区（指着同一个音 token）
        if (!contDash) {
          arcAt.set(u, { row, cx, top: nc.top!, bot: nc.bot! });
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
      if (nUL) { const bar0 = u.tick - u.inBar, uh = fd || lt ? glyphW / 2 - 0.05 * DIGIT_W : 0.45 * DIGIT_W; ul.push({ row, x0: cx - Q(uh), x1: cx + Q(uh), level: nUL, group: `${u.system}|${bar0}|${Math.floor((u.inBar + 1e-6) / u.beat)}`, tok, ch: u }); }   // 样张：每个数字下面 ±0.45 个数字宽（附点不带）
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
    // 7-H（user 11-11「三连音的逻辑错了吧，不是说好了放下面吗」；UX 稿第 4 节）：这组音连成了一条下划线 = 小数字压在这条线上（组里每个音都有的那一层 = 最上面那条连着的），
    //   线在数字那儿断开让位（更深的几层同样让开）；没连成一条 = 下划线、低八度点下面一层一道带钩的细括号，数字在括号中间。数字的字号、括号的钩长、数字两边让多宽照原来那一版。
    const NUM_EM = 1.1, numCap = DIGIT_H * (NUM_EM / DIGIT_EM), GAP_HALF = 0.45, HOOK = 0.35;   // numCap = 数字的字高（局部）：数字行的字高按字号比例换算
    const ulY = (L: number) => UL_Y0 + (L - 1) * UL_GAP + (letters ? SUB_DROP : 0);   // 第 L 层下划线（局部）；字母谱让开右下角的八度数字
    const ulOf = new Map(ul.map((e) => [e.ch, e] as const));
    const gaps: { row: number; level: number; x0: number; x1: number }[] = [];
    const tupDraw: (() => void)[] = [];
    for (const { run, num } of tups) {
      const first = run[0]!, last = run[run.length - 1]!, row = rowOf(first.system, r, 0), x1 = P(first.x) + Q(0.1), x2 = last.system === first.system ? P(last.x) + Q(0.1 + glyphWOf(last, c.aux[r], q)) : P(c.right), mid = (x1 + x2) / 2;
      const Ls = Math.min(...run.map((v) => ulOf.get(v)?.level ?? 0)), g0 = ulOf.get(first)?.group, onLine = Ls >= 1 && last.system === first.system && run.every((v) => ulOf.get(v)?.group === g0);
      if (onLine) {
        gaps.push({ row, level: Ls, x0: mid - Q(GAP_HALF), x1: mid + Q(GAP_HALF) });
        tupDraw.push(() => put(row, { t: "text", x: mid, y: Y(row, ulY(Ls) + numCap / 2), s: num, cls: "tuplet jp-tuplet", size: Q(NUM_EM), anchor: "middle" }));
      } else {
        const yl = Math.max(...run.map((v) => arcAt.get(v)?.bot ?? BASE_Y)) + DOT_GAP + numCap / 2;   // 括号那道线（局部）：组里最低的墨往下一个「点离数字」的间隙，再让出半个数字高（数字压在线上）
        tupDraw.push(() => {
          put(row, { t: "text", x: mid, y: Y(row, yl + numCap / 2), s: num, cls: "tuplet jp-tuplet", size: Q(NUM_EM), anchor: "middle" });
          put(row, { t: "path", d: `M${x1},${Y(row, yl - HOOK)}L${x1},${Y(row, yl)}L${mid - Q(GAP_HALF)},${Y(row, yl)}M${mid + Q(GAP_HALF)},${Y(row, yl)}L${x2},${Y(row, yl)}L${x2},${Y(row, yl - HOOK)}`, cls: "tuplet-bracket" });
        });
      }
    }
    // 下划线按拍分组（UX 稿第 4 节）：第 L 层 = 一串挨着的、同组、都有 ≥ L 层的连成一条
    const maxL = Math.max(0, ...ul.map((e) => e.level));
    for (let L = 1; L <= maxL; L++) {
      let i = 0;
      while (i < ul.length) {
        if (ul[i]!.level < L) { i++; continue; }
        let j = i; while (j + 1 < ul.length && ul[j + 1]!.level >= L && ul[j + 1]!.group === ul[i]!.group) j++;
        const a = ul[i]!, b = ul[j]!, y = Y(a.row, ulY(L));   // 字母谱：下划线让开右下角的八度数字
        // 连音的数字压在这一层（或更上面一层）上 = 在那儿断开（7-H）；一段的 tok 照旧给第一截
        let xs = a.x0; const cuts = gaps.filter((gp) => gp.row === a.row && gp.level <= L && gp.x1 > a.x0 && gp.x0 < b.x1).sort((p, q2) => p.x0 - q2.x0);
        for (const gp of cuts) { if (gp.x0 > xs) put(a.row, { ...(i === j && a.tok !== undefined && xs === a.x0 ? { tok: a.tok } : {}), t: "line", x1: xs, y1: y, x2: gp.x0, y2: y, w: Q(UL_W), cls: "jp-ul" }); xs = Math.max(xs, gp.x1); }
        if (b.x1 > xs) put(a.row, { ...(i === j && a.tok !== undefined && xs === a.x0 ? { tok: a.tok } : {}), t: "line", x1: xs, y1: y, x2: b.x1, y2: y, w: Q(UL_W), cls: "jp-ul" });
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
        const row = rowOf(u.system, atOwn ? rAt : r, 0), lx = P(u.x) + Q(0.1 + DIGIT_W) + TR("chord-tag", 0.1), label = theory.label(rd), w = [...label].length * fs * 0.6 + TR("chord-tag", 0.6);
        const cls = `chord-tag${rd.pinned ? " is-pinned" : ""}${rd.stale ? " is-stale" : ""}`;   // 人挑的 = 换个颜色；对不上了 = 灰 + 「?」（同五线谱）
        //   最少往下让到行身（小节线那一段）下面 + 字高：数字行没有五条线，数字右边的那一截下面可能一点墨都没有（五线谱靠线挡着），不给最小值就贴在行顶上
        c.attach(row, "chordTag", () => placeBelow(row, 0.3 * jk, (y) => {
          c.prims.push({ t: "text", x: lx, y, s: label, cls, size: fs, anchor: "start" });
          chordTagsOut.push({ x: lx - TR("chord-tag", 0.3), y: y - fs * 1.05, w, h: fs * 1.4, read: rd, system: row, index: u.index, ...(atOwn ? { part: q.p.id } : {}) });
        }, { min: (BAR_Y1 + 0.3) * jk + (fs / P(1)) * 0.8 }));
      }
    }
    layDynamics(orn);   // 力度那一层（力度字：中文界面写中文、别的界面写字母；记号表 signs.ts）
    if (kit && mode === "x" && q.p.kitNames) layKitLegend(q, r);   // 整套鼓的图例（行首名字下面）
    // 光标落点、写字头：框架那一套（frame/carets.ts）；升降号挂在左边，光标画在它左边；数字行没有谱号位移
    const inkL = measured[r]!.inkL;
    caretStops(q, { cx: (u) => { const k = u.kind === "chunk" ? inkL.get(u as Chunk) : undefined; return P(u.x) - (k ? P(k) + Q(0.2) : 0); }, shiftAt: () => Array.from({ length: q.staves }, () => 0), rowOf: (sy, k) => rowOf(sy, r, k), P, sysStart0: sysStarts[0]!, cols, slots, heads });
  }
  return { lyricParts };
}
