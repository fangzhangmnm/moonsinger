// draw.ts —— 五线谱这一种行的「画」（设计稿第 3.3 节第 5 步）：每行的五线 / 谱号 / 调号 / 拍号（行首），每条轨的内容（音、休止、小节线、记号、符干符杠、
//   演奏法、连音线、连线、发夹、八度线、连音括号、反复房子），挂件交给框架贴，光标落点。
//   created 2026-11-11 by Claude Opus 5.5（谱面分家施工单 1b-6a：代码原样从 engrave.ts 搬出；框架交来的东西都在 StaffDrawCtx 里）。
import { TEMPO_EM, type TextRole } from "../text/index.ts";
import { _tIn } from "../../i18n/index.ts";
import { swellOf, type ClefName, type Song, type PaperSeg, type NoteTok, type Staff, TPQ, WHOLE, headLen } from "../../score/song.ts";
import { dynOverridden } from "../../score/perform.ts";
import { navWhy } from "../../score/repeats.ts";
import { type Pitch, diatonicIndex } from "../../score/pitch.ts";
import { GLYPH, W, ENGRAVE, timeSigDigits, PERC_CLEF, PERC_HEAD, PERC_SMUFL } from "../smufl.ts";
import { layoutStems } from "../stems.ts";
import { GLYPH_BOX } from "../glyph-box.gen.ts";
import { keyText } from "../../score/pitch.ts";
import { harmonyTheory, type PlacedTag, type ChordFold } from "../../theory/index.ts";
import { baseClef } from "../../score/clef.ts";
import { MARGIN } from "../frame/params.ts";
import { TOP_LINE, MID_LINE, BOTTOM_LINE, ART_GLYPH, GLYPH_BREATH, SHARP_POS, FLAT_POS, GLYPH_TUPLET } from "./glyphs.ts";
import { layDynamics, layGroove, layNav, layTempo, layNoteDynamics, type OrnCtx } from "../ornaments/index.ts";   // 两种行共用的挂件（第四刀 4-3）
import { CLEF_CUE, CLEF_GLYPH, KEY_LABEL_W } from "./units.ts";
import type { Unit, Chunk } from "../frame/units.ts";
import { stemInput, posD, shAt, percAt, clefW } from "./measure.ts";
import type { Prim, EngraveOpts, Layout, HitNote, RestHit, LyricHit, MarkHit, DynHit, ClefHit, Slot, CaretHead, SystemBox } from "../engrave.ts";
import type { StaffTrack } from "./measure.ts";
import { caretStops } from "../frame/carets.ts";
import { yAt } from "./geometry.ts";
import type { SongView } from "../../score/song-view.ts";
import type { LaneKind } from "../frame/lanes.ts";

/** 框架交给五线谱画法的东西（施工单 1b-6a：原来是 engrave() 里的局部变量）。以后 6b–6d 收窄：挂件改成清单、每行一张图元表、摆的结果不抄回单元。 */
/** 五线谱这一种贴挂件的先后（原来按编号 later[2..12]：跳音 / 保持在音符层里，不是挂件）。 */
export const STAFF_LANES: readonly LaneKind[] = ["strength", "noteDynamics", "dynamics", "ottavaAbove", "nav", "tempo", "groove", "barNumber", "chordTag", "lyrics", "ottavaBelow"];
export interface StaffDrawCtx {
  song: Song; paper: PaperSeg; o: EngraveOpts;
  /** 这首歌怎么看（src/score/song-view.ts；框架读一次传进来：按 C 调看、和弦标级数、每条轨的和弦选项）。 */
  look: SongView;
  /** 尺子：P = 谱（sp → px）；tx / TR / RS / mw = 字（文字模块的样式表）。 */
  P: (v: number) => number; tx: (role: TextRole) => number; TR: (role: TextRole, v: number) => number; RS: (role: TextRole) => number; mw: (role: TextRole, str: string) => number; sp: number; ts: number;
  /** 输出：图元和各张点击表，都在每一行自己的局部坐标里画（第五线 = 0），框架定了行距再整行挪。
   *  put(行, 图元) = 往那一行的图元表里画（贴挂件回调里画的不用写行，框架知道贴在哪一行）；hitRow = 点击框画在哪一行（和它的 system 不同时才记：歌词）。 */
  put: (row: number, p: Prim) => void; hitRow: (hit: object, row: number) => void;
  /** 不印的提示交给框架最后贴、只躲不推（第八刀 8-5；五线谱这一刀不用，提示照旧当场画）。 */
  hint: (row: number, h: { part: { ink: { x0: number; x1: number; y0: number; y1: number }; prims: Prim[] }; tries: readonly { x: number; y: number }[]; climb?: number; onPlace?: (x: number, y: number) => void }) => void;
  prims: Prim[]; notes: HitNote[]; chordHeads: Layout["chordHeads"]; rests: RestHit[]; lyrics: LyricHit[]; marks: MarkHit[]; dyns: DynHit[]; clefs: ClefHit[];
  keyHints: Layout["keyHints"]; chordTagsOut: Layout["chordTags"]; slots: Slot[]; heads: CaretHead[]; bars: Layout["bars"]; rows: SystemBox[];
  /** 和弦级数（预处理，theory/families.ts）：每一位身上要标的那几处（合租的一家合起来认、标在这一家最下面那一行）；不标 = null。第五刀 5-4。 */
  harmony: ReadonlyMap<string, readonly PlacedTag[]> | null;
  /** 每条轨的预处理（下标同 per；框架交给所有画法，五线谱现在用不上：叠着的和弦折成和弦名只在数字行上画，第五刀 5-4）。 */
  aux: readonly { folds?: ReadonlyMap<number, ChordFold> }[];
  /** 纵向：第 r 行的原点（第五线）；歌词基线；（第 s 行、第 r 个声部、第 k 张谱表）→ 行号。第几级 ↔ y 由画法自己算（geometry.ts yAt；第四刀起框架不递 yOf）。 */
  staffTop: (r: number) => number; lyricY: (r: number) => number; rowOf: (s: number, r: number, k?: number) => number;
  /** 挂件：贴在谱上方 / 下方（天际线）；attach = 往某一道上登记一件（框架按 STAFF_LANES 的先后执行）。 */
  placeAbove: (row: number, gap: number, draw: (y: number) => void) => number;
  placeBelow: (row: number, gap: number, draw: (y: number) => void, o2?: { min?: number; count?: boolean; step?: number }) => number;
  attach: (row: number, lane: LaneKind, run: () => void) => void;   // 第四刀：按行登记（每一行按自己那种画法的道的先后贴；统筹审第四刀接口第 3 条）
  /** 每条要排的轨、声部 2 画在哪一行、鼓谱模式、量的结果（墨往左伸多远）。 */
  per: StaffTrack[]; rowHost: number[]; pmode: ("five" | "one" | null)[]; measured: { inkL: Map<Chunk, number> }[];
  /** 排的结果：几行、每行行首多宽 / 那里生效的调号、每行五线画到哪、每一列、右边界（sp）、名字一栏的缩进（第一行 / 别的行）。 */
  nSys: number; sysStarts: number[]; sysKeys: Map<string, number>[]; staffEnd: number[]; cols: { x: number; w: number; system: number }[]; right: number; ind0: number; indN: number;
  /** 速度画在谁那一行、上一段结尾的速度。 */
  owner: string | null; prevBpm: number | null;
}

// 歌词锚点的两个类型（LyricSpot / LyricPart）2026-11-11 挪到 frame/lyric-spots.ts（歌词归框架，两种行的画法都交这一份；第四刀 4-2）。
export type { LyricSpot, LyricPart } from "../frame/lyric-spots.ts";
import type { LyricSpot, LyricPart } from "../frame/lyric-spots.ts";
/** 画这几条（mine = per 里的下标；第四刀起同一张纸上别的轨可能是别种行，交给别的画法）五线谱轨。小节号（每行最上面那条的左上角）照旧在这里画，不看 mine（挂件抽成共用模块 = 第四刀 4-3）。 */
export function drawStaff(c: StaffDrawCtx, mine?: readonly number[]): { lyricParts: LyricPart[] } {
  const lyricParts: LyricPart[] = [];
  const own = mine ? new Set(mine) : null, skip = (r: number) => own !== null && !own.has(r);
  const { song, look, paper, o, P, tx, TR, RS, mw, sp, ts, put, hitRow, prims, notes, chordHeads, rests, lyrics, marks, dyns, clefs, keyHints, chordTagsOut, harmony, slots, heads, bars, rows, staffTop, lyricY, rowOf, placeAbove, placeBelow, attach, per, rowHost, pmode, measured, nSys, sysStarts, sysKeys, staffEnd, cols, right, ind0, indN, owner, prevBpm } = c;
  const yOf = (r: number, d: number) => yAt(staffTop(r), d, P(0.5));   // 第 r 行第 d 级的 y（五线谱自己的纵向，geometry.ts）
    /** 第 s 行开头的谱号（这一行第一个东西那里生效的）。 */
    const clefAtSys = (q: StaffTrack, s: number): ClefName => {
      const u = q.units.find((x) => x.system === s && x.index >= 0); if (u) return q.ds.clef[u.index] ?? q.start;
      let c = q.start; for (const x of q.units) if (x.system < s && x.index >= 0) c = q.ds.clef[x.index] ?? c; return c;
    };
    /** 第 s 行开头的谱号是谁管的：最近的一个谱号记号的下标（−1 = 声部自己的谱号 / 自动）。 */
    const clefSrcAtSys = (q: StaffTrack, s: number): number => srcAtSys(q, s, "clef");
    /** 第 s 行开头生效的那一种记号（谱号 / 调号）是哪个 token 管的：这一行第一个单元之前最近的一个（−1 = 没有）。行首的字形挂它的 token（守卫 4，第五刀 5-3）。 */
    const srcAtSys = (q: StaffTrack, s: number, kind: "clef" | "key"): number => {
      const u = q.units.find((x) => x.system === s && x.index >= 0), upto = u ? u.index : q.tokens.length - 1;
      for (let i = upto; i >= 0; i--) if (q.tokens[i]?.kind === kind) return i; return -1;
    };
    /** 一个 token 下标 → 图元的 tok 字段（下标无效 = 不写）。 */
    const tokAt = (q: StaffTrack, i: number | undefined): { tok?: number } => { const id = i !== undefined && i >= 0 ? q.tokens[i]?.id : undefined; return id !== undefined ? { tok: id } : {}; };

  // ── 画字的小函数（原 engrave() 里的；1b-6a 搬来） ──
  const staffHit = (r: number) => ({ y: yOf(r, TOP_LINE) - P(1.2), h: yOf(r, BOTTOM_LINE) - yOf(r, TOP_LINE) + P(2.4) });
  const drawTime = (r: number, x0: number, beats: number, beatType: number, cls: string, T: { tok?: number } = {}) => {
    const num = timeSigDigits(beats), den = timeSigDigits(beatType);
    const wn = [...num].length * W.timeSigDigit, wd = [...den].length * W.timeSigDigit, cw = Math.max(wn, wd);
    put(r, { ...T, t: "glyph", x: P(x0 + (cw - wn) / 2), y: yOf(r, 36), ch: num, cls });
    put(r, { ...T, t: "glyph", x: P(x0 + (cw - wd) / 2), y: yOf(r, 32), ch: den, cls });
    return cw;
  };
  // 速度记号（「Andante ♩ = 88」）：两种行共用的挂件（ornaments/index.ts tempoAt / layTempo，第四刀 4-3 原样搬出）
  /** 调号位置上方的「1=X」（v0.16.10）：hint = 专业模式没有升降号的地方（刀 1 起不画，只记锚点 keyHints，覆盖层写淡的「1=C」）。字也算这个调号的点击区（谱头面板）。 */
  const keyLabel = (r: number, x0: number, f: number, hint: boolean, index: number, minor = false, T: { tok?: number } = {}, perc = false) => {
    const y = staffTop(r) - P(0.8);
    if (hint) { keyHints.push({ ...T, system: r, index, x: P(x0), y, size: tx("key-hint"), s: perc ? _tIn(o.locale, "无调") : keyText(f, minor) }); return; }   // 鼓谱 / 一线谱（打击乐的行没有调，7-R 统筹定 A）：提示照画、字写「无调」   // 提示带着它指的那个调号 token（守卫 4：编辑器里的提示也算画出来了，统筹裁定 5-3）   // 淡的「1=C」只在编辑器里、不印：跟谱（紧凑档不放大，不然挨上第一个音的力度字；刀 2）
    put(r, { ...T, t: "text", x: P(x0), y, s: keyText(f, minor), cls: "keysig key-label", size: tx("key-label"), anchor: "start" });   // 和速度字一样大（v0.16.34；user 11-08「1=F 这些符号也不要字体刻意的小」）
    marks.push({ index, kind: "key", system: r, x: P(x0 - 0.2), y: y - TR("key-label", TEMPO_EM * 0.95), w: TR("key-label", KEY_LABEL_W), h: TR("key-label", TEMPO_EM * 1.2) });
  };
  const drawKeySig = (r: number, x0: number, f: number, cls: string, clef: "G" | "F" = "G", T: { tok?: number } = {}) => {   // 低音谱号的升降号比高音低两级
    const pos = f > 0 ? SHARP_POS : FLAT_POS, ch = f > 0 ? GLYPH.accidentalSharp : GLYPH.accidentalFlat, off = clef === "F" ? -2 : 0;
    for (let k = 0; k < Math.abs(f); k++) put(r, { ...T, t: "glyph", x: P(x0 + k * 1.05), y: yOf(r, pos[k] + off), ch, cls });
  };
  /** 这条轨交给共用挂件的东西（ornaments/index.ts）：音的锚点 = 符头（刀 3：对齐线 = 列的 x，符头画在 x + 0.35）。 */
  const ornCache = new Map<number, OrnCtx>();
  const ornOf = (q: StaffTrack, r: number, noteEnd?: (ch: Chunk) => number): OrnCtx => {
    const hit = ornCache.get(r); if (hit && !noteEnd) return hit;
    const oc: OrnCtx = { song, paper, o, notation: "staff", P, tx, TR, RS, mw, sp, prims, dyns, marks, placeAbove, attach, right, left: (sy) => P(MARGIN + (sy === 0 ? ind0 : indN)), tokens: q.tokens, units: q.units, row: (sy) => rowOf(sy, r, 0),
      noteX: (ch) => P(ch.x + 0.35), noteEnd: noteEnd ?? ((ch) => P(ch.x + 0.35)), dynOff: dynOverridden(q.tokens), navMute: (i) => (navWhy(song, paper, q.p.id, q.tokens[i]!) ? " art-mute" : "") };
    ornCache.set(r, oc); return oc;
  };
  // 5. 每条谱：五线、谱号、调号、拍号（第一行）；这一行自己的东西先画在临时高度上（5a）。跨行的（歌手牌、花括号、左边连着的竖线、色条）等行距定了再画（5b，在第 12 步之后）
  //   速度（第一个声部）和小节号是挂件（第 7 / 9 样）
  for (let s = 0; s < nSys; s++) {
    const ind = s === 0 ? ind0 : indN;
    // 小节号（每行最上面那条谱的左上角）第四刀起归框架画（engrave.ts：它贴在这一行最上面那条上，不归哪一种画法）
    per.forEach((q, r) => {
      if (rowHost[r] >= 0 || skip(r)) return;   // 声部 2：谱表 / 谱号 / 名字都是声部 1 那一行的；别种行的轨归别的画法
      const f = sysKeys[s].get(q.p.id) ?? q.head.key;
      for (let k = 0; k < q.staves; k++) {
        const row = rowOf(s, r, k), clef: ClefName = q.staves === 2 ? (k ? "F" : "G") : clefAtSys(q, s), base = baseClef(clef);
        if (rows[row]) rows[row].x1 = P(staffEnd[s]);
        const pm = pmode[r];   // 鼓谱：一线谱 = 中间那一条；打击乐谱号；没有调号、不能点谱号换
        for (let L = 0; L < 5; L++) { if (pm === "one" && L !== 2) continue; const y = yOf(row, BOTTOM_LINE + 2 * L); put(row, { t: "line", x1: P(MARGIN + ind), y1: y, x2: P(staffEnd[s]), y2: y, w: P(ENGRAVE.staffLine), cls: "staff" }); }
        let hx = MARGIN + ind + 0.6;
        if (pm) put(row, { t: "glyph", x: P(hx), y: yOf(row, MID_LINE), ch: PERC_CLEF, cls: "clef perc-clef" });
        else put(row, { ...tokAt(q, clefSrcAtSys(q, s)), t: "glyph", x: P(hx), y: yOf(row, base === "F" ? 36 : 32), ch: CLEF_GLYPH[clef], cls: "clef" });   // 管着这一行的谱号记号（轨开头的、行中间换的）挂在行首谱号上（守卫 4）   // 高音谱号挂 G 线（第 2 线）、低音谱号挂 F 线（第 4 线）；八度谱号的小 8 / 15 在字形里
        if (!pm && !q.vrt) clefs.push({ kind: "start", paper: paper.id, part: q.p.id, index: clefSrcAtSys(q, s), system: row, x: P(hx - 0.3), ...staffHit(row), w: P(clefW(q) + 0.6) });   // 点谱号 = 谱头面板（v0.9.28；v0.16.50 大谱表上下两个谱号也能点——user「高音谱号为什么点不中」，原来只给单谱表建了点击区）
        hx += clefW(q) + 1.0;
        const keyX0 = hx;
        const fk = pm ? 0 : f;
        drawKeySig(row, hx, fk, "keysig", base, tokAt(q, srcAtSys(q, s, "key"))); hx += Math.abs(fk) * 1.05;
        if (s === 0) {
          // 谱头记号的点击区域：谱号 + 调号一块（改调号）、拍号（改拍号）、上方速度（改速度）
          if (q.head.idx.key !== undefined) marks.push({ index: q.head.idx.key, kind: "key", system: row, x: P(keyX0 - 0.3), ...staffHit(row), w: P(Math.max(1.2, hx - keyX0 + 0.3)) });   // 调号（谱号那一块归谱号，v0.9.28）
          // 「1=X」（v0.16.10）：按 C 调看 = 写原来的调；专业模式没有升降号 = 淡的「1=C」提示（不占宽）。字也能点（同调号）
          //   小调（v0.16.83）= 每一处都写淡的「6=X」（按 C 调看 = 照印），哪里从 la 数一眼看得见
          const lab = k === 0 && q.head.idx.key !== undefined ? (look.inCActive ? q.head.real : pm ? f : fk === 0 || q.head.minor ? fk : null) : null;
          //   鼓谱照规矩不画调号：行首也给淡的「1=D」提示（编辑器里有、不印；这个调号是真的状态，换成有音高的乐器就管用；统筹裁定 5-3）
          if (lab !== null) keyLabel(row, keyX0 - 0.1, lab, !!pm || !look.inCActive, q.head.idx.key!, q.head.minor, tokAt(q, q.head.idx.key), !!pm);
          if (fk) hx += 0.8;
          const cw = drawTime(row, hx, q.head.time.beats, q.head.time.beatType, "timesig", tokAt(q, q.head.idx.time));
          if (q.head.idx.time !== undefined) marks.push({ index: q.head.idx.time, kind: "time", system: row, x: P(hx - 0.3), ...staffHit(row), w: P(cw + 0.6) });
          if (k === 0 && q.p.id === owner && q.head.idx.tempo !== undefined) { const ti = q.head.idx.tempo; layTempo(ornOf(q, r), row, MARGIN + ind + 0.6, q.head.bpm, "tempo", ti, prevBpm === null || prevBpm === q.head.bpm ? undefined : q.head.bpm > prevBpm ? "up" : "down"); }   // 速度 = 挂件第 7 样
        }
      }
    });
  }
  // 6. 各声部的内容
  per.forEach((q, r) => {
    if (skip(r)) return;   // 别种行的轨（第四刀：简谱数字行）归别的画法
    const tokens = q.tokens, focused = q.focused, v2 = rowHost[r] >= 0;   // 声部 2：只画音（小节线 / 调号 / 拍号 / 休止归声部 1）
    const units = q.units, tag = v2 ? { part: q.p.id } : {};
    const dynOff = dynOverridden(tokens);   // 被紧跟着的强后即弱（fp）盖掉的力度记号：画灰（纪律：画灰 + 明说；点开小菜单说为什么）
    const clefOf = (staff: Staff, index = -1): "G" | "F" => (q.staves === 2 ? (staff === 2 ? "F" : "G") : baseClef((index >= 0 ? q.ds.clef[index] : undefined) ?? q.start));
    // 谱号 + 八度线（v0.9.28）：同一个实际音高在谱上挪几级（低音谱号 +12、下加 8 +7、8va 线 −7…；高音谱号顶线 F5 = 38）
    const dIdx = (p: Pitch, staff: Staff, index = -1) => posD(q, p, staff, index);
    const RW = (u: Unit) => rowOf(u.system, r, u.staff - 1);
    const lyricRow = (s: number) => rowOf(s, r, q.staves - 1);   // 歌词在最下面那条谱表下面
    const navMute = (i: number) => (navWhy(song, paper, q.p.id, tokens[i]) ? " art-mute" : "");   // 不起作用的跳转（画灰；反复小节线的 ×N 也用）。房子 / Segno / D.C.… = 共用挂件（ornaments/index.ts layNav，第四刀 4-3）
    const nhX = (c: Chunk) => P(c.x + 0.35);   // 刀 3：对齐线 = 列的 x，临时记号挂在左边（原来 + accW）
    // × 符头：这个声部台上那位固定敲一个键（鼓件 / 音效固定原速）——谱上写的音高照留、只是不拿来出声，画成 × 让人一眼看出来（user 2026-10-08「披露就用x」）
    const pm = pmode[r], percHere = !!pm && !!q.p.perc;   // 鼓谱：符头按仓鼠的表（每个音各自的）、不画升降号
    const xHead = !!q.p.xHead && !percHere;
    /** 鼓谱上这个音的符头字形 + 宽（按时值挑黑 / 二分 / 全）。 */
    const percHead = (c: Chunk, p: Pitch) => { const pi = percAt(q, p), hd = (pi?.head === "custom" && pi.smufl ? PERC_SMUFL[pi.smufl] : undefined) ?? PERC_HEAD[pi?.head ?? "normal"] ?? PERC_HEAD.normal, k = c.base >= WHOLE ? 2 : c.base >= TPQ * 2 ? 1 : 0; return { ch: hd.ch[k], w: hd.w[k] }; };
    // 气声（2026-10-10，user「x同意，做支持」）：这个音画 × 符头（念白 / 说唱的标准写法）——和上面的 × 同一个意思：谱上的音高不拿来出声
    const xOf = (c: Chunk) => xHead || !!c.whisper;
    const nhW = (c: Chunk) => P(xOf(c) ? (c.base >= WHOLE ? W.noteheadXWhole : c.base >= TPQ * 2 ? W.noteheadXHalf : W.noteheadXBlack) : percHere && c.pitch ? percHead(c, c.pitch).w : c.base >= WHOLE ? W.noteheadWhole : W.noteheadBlack);
    const whisperMute = (q.p.ignores ?? []).includes("whisper");   // 台上这位做不到气声：× 照画、画灰
    const clsOf = (c: Chunk) => [c.ghost ? "ghost" : "", c.pad ? "pad-rest" : ""].filter(Boolean).join(" ") || undefined;
    /** 这个音属于哪个 token（补齐的淡色休止不算）：写字头 / 选区 / 强调色由 score-view 按 data-tok 开关 class。 */
    const tokOf = (c: Chunk): number | undefined => (c.index >= 0 && !c.pad ? tokens[c.index]?.id : undefined);
    /** 刀 4b：歌词（挂件第 11 样）等这一行的天际线都量完再画：先记下来，按行画。 */
    const spots: LyricSpot[] = []; lyricParts.push({ r, lrow: lyricRow, spots });   // 这条轨每个音的歌词锚点（第 11 样「歌词」由框架贴）
    /** 共用挂件（力度那一串、风格、跳转、速度；ornaments/index.ts）：音的锚点 = 符头左缘 / 右缘。 */
    const orn = ornOf(q, r, (ch) => nhX(ch) + nhW(ch));
    const drawChunk = (c: Chunk) => {
      const cls = clsOf(c), row = RW(c);
      if (!c.note) {
        if (c.pad || v2 || c.mrest === "skip") return;   // 整小节休止只画第一段（刀 3）；补齐的空小节不画休止；声部 2 的空也不画（隔得远的音才在这儿）（v0.10.19；user「remove the ghost mute idea」「dont display them. once you insert a note later in a new section, all the previous mute materialized」）：位置和落点照留，在那儿写 = 前面的空落成真休止
        if (c.mrest === "draw") {   // 整小节休止（刀 3）：不管什么拍号一律全休止、画在这个小节两条小节线的正中、不画附点（user 截图：6/8 画成附点二分且靠左）
          const k = units.indexOf(c);
          let L = sysStarts[c.system] ?? c.x, R = staffEnd[c.system] ?? right;
          for (let i = k - 1; i >= 0; i--) { const v = units[i]; if (v.system !== c.system) break; if (v.kind === "chunk" || v.w <= 1e-6) continue; L = v.kind === "bar" ? v.x + (v.repeat ? v.w - 0.4 : 0.7) : v.x + v.w; break; }
          for (let i = k + 1; i < units.length; i++) { const v = units[i]; if (v.system !== c.system) break; if (v.kind === "bar") { R = v.x + 0.7; break; } }
          const rx = P((L + R) / 2 - W.restWhole / 2), ry = pm !== "one" ? yOf(row, 36) : yOf(row, MID_LINE);
          put(row, { tok: tokOf(c), t: "glyph", x: rx, y: ry, ch: GLYPH.restWhole, cls: cls ? `rest ${cls}` : "rest" });
          if (c.j === 0 && c.index >= 0) rests.push({ index: c.index, system: row, x: rx, y: yOf(row, MID_LINE), w: P(1.2) });
          return;
        }
        const g = c.base >= WHOLE ? GLYPH.restWhole : c.base >= TPQ * 2 ? GLYPH.restHalf : c.base >= TPQ ? GLYPH.restQuarter
          : c.base >= TPQ / 2 ? GLYPH.rest8th : c.base >= TPQ / 4 ? GLYPH.rest16th : GLYPH.rest32nd;
        const ry = c.base >= WHOLE && pm !== "one" ? yOf(row, 36) : yOf(row, MID_LINE);   // 全休止挂在第四线下；一线谱 = 挂在那条线下
        put(row, { tok: tokOf(c), t: "glyph", x: P(c.x + 0.35), y: ry, ch: g, cls: cls ? `rest ${cls}` : "rest" });
        if (c.j === 0 && c.index >= 0 && !c.pad) rests.push({ index: c.index, system: row, x: P(c.x + 0.35), y: yOf(row, MID_LINE), w: P(1.2) });   // 补齐的淡色休止不能点（点它 = 点空白：落到那个小节开头的落点）
        if (c.dotted) put(row, { tok: tokOf(c), t: "glyph", x: P(c.x + 0.35 + 1.5), y: yOf(row, 35), ch: GLYPH.augmentationDot, cls });
        return;
      }
      const ds = (c.pitches.length ? c.pitches : [c.pitch!]).map((pp) => dIdx(pp, c.staff, c.index));   // 叠音的符头从高到低；第一个 = 旋律线
      const d = ds[0], y = yOf(row, d), x0 = nhX(c);
      c.accs.forEach((a, k) => {
        if (a === null || percHere) return;
        const ag = a === 1 ? GLYPH.accidentalSharp : a === -1 ? GLYPH.accidentalFlat : a === 2 ? GLYPH.accidentalDoubleSharp : a === -2 ? GLYPH.accidentalDoubleFlat : GLYPH.accidentalNatural;
        const near = c.accs.slice(0, k).some((b, kk) => b !== null && Math.abs(ds[kk] - ds[k]) < 3);   // 挨得近的两个临时记号错开一列
        put(row, { tok: tokOf(c), t: "glyph", x: P(c.x - 1.1) - (near ? P(1.1) : 0) - (c.art.includes("ghost") ? P(0.6) : 0), y: yOf(row, ds[k]), ch: ag, cls });   // 幽灵音：给左括号让位
      });
      const ledgers = new Set<number>();
      for (const dd of ds) { for (let L = 28; L >= dd; L -= 2) ledgers.add(L); for (let L = 40; L <= dd; L += 2) ledgers.add(L); }
      for (const L of ledgers) put(row, { t: "line", x1: x0 - P(ENGRAVE.ledgerExt), y1: yOf(row, L), x2: x0 + nhW(c) + P(ENGRAVE.ledgerExt), y2: yOf(row, L), w: P(ENGRAVE.ledger), cls: "ledger" });
      const ng = xOf(c) ? (c.base >= WHOLE ? GLYPH.noteheadXWhole : c.base >= TPQ * 2 ? GLYPH.noteheadXHalf : GLYPH.noteheadXBlack) : c.base >= WHOLE ? GLYPH.noteheadWhole : c.base >= TPQ * 2 ? GLYPH.noteheadHalf : GLYPH.noteheadBlack;
      let shifted = false;
      ds.forEach((dd, k) => {
        const second = k > 0 && Math.abs(ds[k - 1] - dd) === 1 && !shifted; shifted = second;   // 二度：下面那个符头往右错开（连着的二度交错）
        const mute = k > 0 && !!q.p.mono;   // 单声乐器的声部：下面的音灰掉、只唱最上面（user「叠音声部换单声乐器时下方音数据结构上保留，但是变灰」）
        if (c.j === 0 && k > 0) chordHeads.push({ ...tag, index: c.index, system: row, x: second ? x0 + nhW(c) * 0.95 : x0, y: yOf(row, dd), w: nhW(c) });
        const hch = percHere && !xOf(c) ? percHead(c, (c.pitches.length ? c.pitches : [c.pitch!])[k]).ch : ng;
        put(row, { tok: tokOf(c), t: "glyph", x: second ? x0 + nhW(c) * 0.95 : x0, y: yOf(row, dd), ch: hch, cls: ["note", cls ?? "", mute ? "chord-mute" : "", c.whisper && whisperMute ? "art-mute" : ""].filter(Boolean).join(" ") });
        if (c.art.includes("ghost")) {   // 幽灵音 = 符头两边一对括号（SMuFL noteheadParenthesisLeft / Right；墨迹按 canvas 量的）
          const hx = second ? x0 + nhW(c) * 0.95 : x0, pc = ["note-paren", cls ?? ""].filter(Boolean).join(" ");
          put(row, { tok: tokOf(c), t: "glyph", x: hx - P(0.6), y: yOf(row, dd), ch: "\u{E0F5}", cls: pc });
          put(row, { tok: tokOf(c), t: "glyph", x: hx + nhW(c) + P(0.25), y: yOf(row, dd), ch: "\u{E0F6}", cls: pc });
        }
      });
      if (c.dotted) put(row, { tok: tokOf(c), t: "glyph", x: x0 + nhW(c) + P(0.3), y: yOf(row, d % 2 === 0 ? d + 1 : d), ch: GLYPH.augmentationDot, cls });
      if (c.j === 0) notes.push({ ...tag, index: c.index, system: row, x: x0, y, w: nhW(c), d: diatonicIndex(c.pitch!) });   // d = 真的音级（拖音高用），不带谱号位移
      if (c.j === 0 && !c.tie) spots.push({ index: c.index, sys: c.system, row, cx0: x0 + nhW(c) / 2, mx0: x0 - P(0.6), mx1: x0 + nhW(c) + P(0.4), lyric: c.lyric, tok: tokOf(c), cls, mute: !!q.p.lyricMute?.has(tokens[c.index]?.id ?? -1), hyph: !!(tokens[c.index] as NoteTok).hyph });   // 歌词锚点：字归框架（engrave.ts layLyrics）
    };
    for (const u of units) {
      const row = RW(u);
      if (u.kind === "dyn") continue;   // 力度：共用挂件（layDynamics，在下面一起摆）
      if (u.kind === "groove") { layGroove(orn, u); continue; }   // 风格记号：共用挂件（挂件第 8 样）
      if (u.kind === "head") continue;   // 写字头（零宽，只在尾巴）：只为五线画到右边；光标本身 score-view 在 ink 层按落点（slots）画
      if (v2 && (u.kind === "bar" || u.kind === "key" || u.kind === "time")) continue;   // 声部 2：小节线 / 调号 / 拍号是声部 1 画的（单位留着：符杠照样在小节线处断）
      if (u.kind === "bar" || u.kind === "key" || u.kind === "time") {   // 小节线 / 调号 / 拍号：每张谱表各画一份
        for (let k = 0; k < q.staves; k++) {
          const rr = rowOf(u.system, r, k), clef = clefOf((k + 1) as Staff, u.index), sh = clef === "F" ? 12 : 0;
          if (u.kind === "bar") bars.push({ system: rr, x: P(u.x + 0.7) });
          if (u.kind === "bar" && u.repeat) {   // 反复小节线：Bravura 字形（|: = E040、:| = E041、:|: = E042；一条谱高）；:| 一共放几遍 > 2 = 上面写「×3」
            put(rr, { t: "glyph", x: P(u.x + 0.4), y: yOf(rr, BOTTOM_LINE), ch: u.repeat === "start" ? "\u{E040}" : u.repeat === "end" ? "\u{E041}" : "\u{E042}", cls: "repeat-bar" + navMute(u.index), tok: tokens[u.index].id });
            if (u.times && u.times > 2 && k === 0) { const times = u.times, bx = P(u.x + 0.4 + (u.repeat === "both" ? 1.2 : 1.47)), cl = "nav-mark" + navMute(u.index); attach(rr, "nav", () => placeAbove(rr, 0.6, (y) => prims.push({ t: "text", x: bx, y, s: `×${times}`, cls: cl, size: tx("nav-mark"), anchor: "end" }))); }   // ×3 = 反复那一样（挂件第 6 样）
          } else if (u.kind === "bar") {
            const bx = P(u.x + 0.7), bcls = u.auto ? "bar auto" : "bar", BT = tokAt(q, u.index);   // 人插的小节线挂它的 token（守卫 4）；自动的没有
            const [bt, bb] = pmode[r] === "one" ? [MID_LINE + 2, MID_LINE - 2] : [TOP_LINE, BOTTOM_LINE];   // 一线谱：小节线上下各出一格
            put(rr, { ...BT, t: "line", x1: bx, y1: yOf(rr, bt), x2: bx, y2: yOf(rr, bb), w: P(ENGRAVE.thinBar), cls: bcls });
            if (u.style === "double") put(rr, { ...BT, t: "line", x1: bx + P(0.45), y1: yOf(rr, bt), x2: bx + P(0.45), y2: yOf(rr, bb), w: P(ENGRAVE.thinBar), cls: bcls });   // 段落线 ‖
            if (u.style === "final") put(rr, { ...BT, t: "line", x1: bx + P(0.6), y1: yOf(rr, bt), x2: bx + P(0.6), y2: yOf(rr, bb), w: P(0.5), cls: bcls });   // 终止线：细 + 粗
            if (u.warn && k === 0) put(rr, { t: "rect", x: bx - P(0.3), y: yOf(rr, TOP_LINE) - P(1.6), w: P(0.6), h: P(0.6), cls: "warn ann" });
          } else if (u.kind === "key") {
            if (pmode[r]) {   // 鼓谱没有调号（记号照留、能点）：淡的「1=D」提示（不印，同谱头；统筹裁定 5-3）
              if (k === 0) keyLabel(rr, u.x + 0.2, look.inCActive ? u.real : u.fifths, true, u.index, u.minor, tokAt(q, u.index), true);
              marks.push({ index: u.index, kind: "key", system: rr, x: P(u.x), ...staffHit(rr), w: P(Math.max(u.w, 1.6)) }); continue;
            }
            const cls = "keysig", KT = tokAt(q, u.index);
            if (u.fifths === 0) { const pos = u.prev > 0 ? SHARP_POS : FLAT_POS; for (let j = 0; j < Math.abs(u.prev); j++) put(rr, { ...KT, t: "glyph", x: P(u.x + 0.4 + j * 0.8), y: yOf(rr, pos[j] - (sh ? 2 : 0)), ch: GLYPH.accidentalNatural, cls }); }
            else drawKeySig(rr, u.x + 0.4, u.fifths, cls, clef, KT);
            // 换到同一个调、又没有升降号（C → C）：什么都画不出来 → 写个小字，免得成了看不见的记号（印）。按 C 调看 = 每一处写原来的调；
            //   专业模式换成 C（画了还原号）= 淡的「1=C」提示（v0.16.10，不印）
            if (k === 0) {
              if (look.inCActive) keyLabel(rr, u.x + 0.2, u.real, false, u.index, u.minor, KT);
              else if (u.fifths === 0 && u.prev === 0) keyLabel(rr, u.x + 0.2, 0, false, u.index, u.minor, KT);
              else if (u.fifths === 0 || u.minor) keyLabel(rr, u.x + 0.2, u.fifths, true, u.index, u.minor, KT);
            }
            marks.push({ index: u.index, kind: "key", system: rr, x: P(u.x), ...staffHit(rr), w: P(Math.max(u.w, 1.6)) });
          } else {
            const cls = "timesig";
            drawTime(rr, u.x + 0.6, u.beats, u.beatType, cls, tokAt(q, u.index));
            marks.push({ index: u.index, kind: "time", system: rr, x: P(u.x), ...staffHit(rr), w: P(u.w) });
          }
        }
        continue;
      }
      if (u.kind === "tempo") { if (q.p.id === owner) layTempo(orn, row, u.x + 0.3, u.bpm, "tempo", u.index); continue; }   // 挂件第 7 样（共用）
      if (u.kind === "hairpin") continue;   // 渐强渐弱在 8¾ 画（要知道终点）
      if (u.kind === "nav") { layNav(orn, u, (v) => P(v.x + (v.kind === "bar" && v.repeat ? 0.4 + (v.repeat === "both" ? 1.2 : 1.47) : 0.7))); continue; }   // 挂件第 6 样（共用；房子的钩下到反复小节线的右端）
      if (u.kind === "ottava") continue;   // 八度线在下面按音的范围画
      if (u.kind === "clef") {   // 行中间换谱号（v0.9.28）：小一号的谱号；正好在一行开头 = 行首的谱号已经是它，不重画
        if (q.staves === 2) continue;
        const first = !units.some((x) => x.system === u.system && x.index >= 0 && x.index < u.index && x.kind !== "ottava");
        const base = baseClef(u.clef), cls = "clef cue";
        if (!first) put(row, { ...tokAt(q, u.index), t: "glyph", x: P(u.x + 0.35), y: yOf(row, base === "F" ? 36 : 32), ch: CLEF_GLYPH[u.clef], cls, size: P(4 * CLEF_CUE) });   // 正好在一行开头的 = 行首谱号挂它的 token
        clefs.push({ kind: "mid", paper: paper.id, part: q.p.id, index: u.index, system: row, x: P(u.x), ...staffHit(row), w: P(Math.max(u.w, 1.6)) });
        continue;
      }
      drawChunk(u);
    }
    // 7¼. 八度线（v0.9.28）：8va / 15ma 在谱上面、8vb 在谱下面；一行里连着的同一种画成一段（开头的字 + 虚线 + 收尾的钩）；接着上一行的字加括号
    //   大谱表上手写的八度线现在不起作用（音不挪）：照样画出来，灰的、不印（ann），点开说明（统筹裁定 5-3；真做 = 愿望单 W-73）。8va / 15ma 在上谱上面、8vb 在下谱下面
    {
      const OFF = q.staves === 2 ? " off ann" : "";
      const SIG: Record<number, string> = { 1: GLYPH.ottavaAlta, 2: GLYPH.quindicesimaAlta, [-1]: GLYPH.ottavaBassa };
      const SIG_W: Record<number, number> = { 1: 3.54, 2: 5.26, [-1]: 3.36 };
      for (let sy = 0; sy < nSys; sy++) {
        const us = units.filter((x) => x.system === sy && x.kind === "chunk").sort((a, b) => a.x - b.x) as Chunk[];
        let k = 0;
        while (k < us.length) {
          const v = q.ds.ott[us[k].index] ?? 0; if (!v) { k++; continue; }
          const isAuto = !!q.ds.auto?.[us[k].index];   // 自动的和挨着的手写的分开画
          let e = k; while (e + 1 < us.length && (q.ds.ott[us[e + 1].index] ?? 0) === v && !!q.ds.auto?.[us[e + 1].index] === isAuto) e++;
          const up = v > 0, row0 = rowOf(sy, r, up ? 0 : q.staves - 1);
          {   // 刀 4b：8va / 15ma = 挂件第 5 样（这一段天际线往上 0.6）；8vb = 第 12 样（歌词 / 下天际线之下 0.6）。一段一条水平线
            const sk = k, se = e;
            attach(row0, up ? "ottavaAbove" : "ottavaBelow", () => { const pl = up ? placeAbove : placeBelow; pl(row0, 0.6, (y) => { const k = sk, e = se;
            const prevIdx = us[k].index - 1, cont = k === 0 && prevIdx >= 0 && (q.ds.ott[prevIdx] ?? 0) === v && units.some((x) => x.index >= 0 && x.index <= prevIdx && x.system < sy);
            const nextU = us[e + 1], lastIdx = us[e].index, endsHere = !!nextU || (q.ds.ott[lastIdx + 1] ?? 0) !== v || lastIdx + 1 >= q.tokens.length || !units.some((x) => x.system > sy && x.index > lastIdx);
            const x0 = P(us[k].x - 0.2), x1 = P(us[e].x + us[e].w - 0.3), sz = P(4 * 0.85), gw = P(SIG_W[v] * 0.85);
            const src = units.find((x) => x.kind === "ottava" && x.index <= us[k].index && (q.ds.ott[x.index] ?? 0) === v && x.system === sy) ?? null;
            // 手写的八度线：开头的字挂开始那个 token，收尾的钩挂结束那个（守卫 4，第五刀 5-3）；自动画的不是 token
            const startIdx = isAuto ? -1 : src ? src.index : (() => { for (let i = us[k].index; i >= 0; i--) if (q.tokens[i]?.kind === "ottava") return i; return -1; })();
            const endIdx = isAuto ? -1 : (() => { for (let i = lastIdx + 1; i < q.tokens.length; i++) { const t = q.tokens[i]!; if (t.kind === "ottava") return i; if (t.kind === "note" || t.kind === "rest") return -1; } return -1; })();
            if (cont) prims.push({ ...tokAt(q, startIdx), t: "text", x: x0, y: y + P(0.5), s: `(${v === 2 ? "15ma" : v > 0 ? "8va" : "8vb"})`, cls: "ottava cont" + OFF, size: tx("ottava"), anchor: "start" });
            else prims.push({ ...tokAt(q, startIdx), t: "glyph", x: x0, y: y + P(up ? 0.4 : 0.4), ch: SIG[v], cls: (isAuto ? "ottava auto" : "ottava") + OFF, size: sz });
            const lx = x0 + (cont ? P(4.2) : gw) + P(0.4), ly = y - P(up ? 0.55 : 0.55);
            for (let x = lx; x + P(0.6) <= x1; x += P(1.0)) prims.push({ t: "line", x1: x, y1: ly, x2: x + P(0.6), y2: ly, w: P(0.1), cls: "ottava-line" + OFF });
            if (endsHere) prims.push({ ...tokAt(q, endIdx), t: "line", x1: x1, y1: ly, x2: x1, y2: ly + P(up ? 1.1 : -1.1), w: P(0.1), cls: "ottava-line" + OFF });
            const hitIdx = src ? src.index : (() => { for (let i = us[k].index; i >= 0; i--) if (q.tokens[i]?.kind === "ottava") return i; return -1; })();
            const run = isAuto ? q.ds.runs.find((rr) => us[k].index >= rr.from && us[k].index <= rr.to) : undefined;
            if (q.vrt) { /* 叠起来的那一行：自动八度线只看，不能点（只读） */ } else if (run) clefs.push({ kind: "ottava", paper: paper.id, part: q.p.id, index: -1, run, system: row0, x: x0, y: y - P(1.6), w: Math.max(gw, P(3)), h: P(2.2) });
            else if (hitIdx >= 0) clefs.push({ kind: "ottava", paper: paper.id, part: q.p.id, index: hitIdx, system: row0, x: x0, y: y - P(1.6), w: Math.max(gw, P(3)), h: P(2.2) });
            }); });
          }
          k = e + 1;
        }
      }
    }
    // 7. 符干、符杠、符尾（按拍分组：同一拍里连着的八分及更短的音符共用符杠）：几何 = src/render/stems.ts（刀 4a 抽出来的纯函数），这里只画
    //   打断符杠的只有小节线和中途的调号 / 拍号；光标、力度记号、渐强渐弱、句号、速度都不打断（2026-10-08 Opus 5.5，user「为什么…力度标识会破坏八分音符尾巴的连音？」）
    const stemIn = stemInput(per[r]!, nhX);
    const stems = layoutStems(stemIn.seq, stemIn.dir, { u: sp, y: (d, n) => yOf(RW(n.key), d) });
    const upOf = new Map<Chunk, boolean>();   // 符干朝上？（演奏法画在另一侧）
    const tipOf = new Map<Chunk, number>();
    const stemXOf = new Map<Chunk, number>();   // 符干那条线的 x（px）：和弦级数跟着它摆（v0.16.62）
    for (const g of stems.groups) {
      for (const c of g.keys) {
        const st = stems.notes.get(c)!;
        upOf.set(c, st.up); tipOf.set(c, st.tip); stemXOf.set(c, st.x);
        put(RW(c), { tok: tokOf(c), t: "line", x1: st.x, y1: st.y0, x2: st.x, y2: st.tip, w: P(ENGRAVE.stem), cls: clsOf(c) });
        if (st.flag) put(RW(c), { tok: tokOf(c), t: "glyph", x: st.flag.x, y: st.flag.y, ch: (st.up ? [GLYPH.flag8thUp, GLYPH.flag16thUp, GLYPH.flag32ndUp] : [GLYPH.flag8thDown, GLYPH.flag16thDown, GLYPH.flag32ndDown])[st.flag.level - 1], cls: clsOf(c) });
      }
      for (const bm of g.beams) put(RW(g.keys[0]!), { t: "path", d: `M${bm.xL},${bm.yL}L${bm.xR},${bm.yR}L${bm.xR},${bm.yR + bm.th}L${bm.xL},${bm.yL + bm.th}Z`, cls: ["beam", bm.ghost ? "ghost" : ""].filter(Boolean).join(" ") });
    }
    // 7¼. 滚奏（v0.16.64；user 11-07「标准滚奏记号 可以，但是要可以调整密度」）：符干中段三道斜杠（不定拍的颤音）；全音符没有符干 = 符头上方。
    //   跨小节切开、连音线连着的每一段都画（每段都在滚，标准写法）。用路径画、不用字形：PDF 的 Bravura 子集里没有颤音字形，路径两边一样、天际线也量得到
    const rollMute = (q.p.ignores ?? []).includes("roll");
    for (const c of units) {
      if (c.kind !== "chunk" || !c.note || c.index < 0) continue;
      const t = tokens[c.index]; if (t?.kind !== "note" || !(t.art ?? []).includes("roll")) continue;
      const st = stems.notes.get(c), sx = stemXOf.get(c);
      let cx: number, cy: number;
      if (st && sx !== undefined) { cx = sx; cy = st.y0 + (st.tip - st.y0) * 0.55; }
      else { const ds = (c.pitches.length ? c.pitches : [c.pitch!]).map((pp) => dIdx(pp, c.staff, c.index)); cx = nhX(c) + nhW(c) / 2; cy = yOf(RW(c), Math.max(...ds)) - P(1.7); }
      const W = P(1.2), T = P(0.24), R = P(0.36), G = P(0.5), cls = ["roll", rollMute ? "art-mute" : "", clsOf(c) ?? ""].filter(Boolean).join(" ");
      for (const k of [-1, 0, 1]) { const y = cy + k * G; put(RW(c), { tok: tokOf(c), t: "path", d: `M${cx - W / 2},${y + R / 2}L${cx + W / 2},${y - R / 2}L${cx + W / 2},${y - R / 2 + T}L${cx - W / 2},${y + R / 2 + T}Z`, cls }); }
    }
    // 7½. 修（2026-10-08）：跳音 / 保持在符头外一格（谱内落在间里）；符干朝上 = 画在下面，朝下 / 没有符干 = 上面。呼吸 = 音后面、谱线上方一个逗号。
    //   强度那一组（重音 / 强音 / 次重音 / 弱化）**一律画在谱上方**（2026-10-08 深夜 Opus 5.5，user「强度记号统一放上面吧，不然容易misleading」）：
    //   刀 4b 起是挂件（第 2 样，贴天际线），音内起伏和突强 / 强后即弱是第 3 样；跳音 / 保持、琶音、换气照旧画在音符层（天际线从它们量起）
    const ign = new Set(q.p.ignores ?? []);   // 台上那位不认的记号：照画、画灰（user「演奏者不认的记号也变灰，不静默失效，而是向用户披露」）
    const artEdge = new Map<Chunk, { below: boolean; y: number }>();   // 跳音 / 保持画到哪了（最外那个字的外沿，px）：连线从它们外面过（8½，v0.16.54）
    for (const c of units) {
      if (c.kind !== "chunk" || !c.note || (!c.art.length && !c.breath)) continue;
      const row = RW(c), cls = clsOf(c), cx = nhX(c) + nhW(c) / 2;
      const dsC = (c.pitches.length ? c.pitches : [c.pitch!]).map((pp) => dIdx(pp, c.staff, c.index)), dHi = dsC[0], dLo = dsC[dsC.length - 1];
      const below = upOf.get(c) ?? false, sgn = below ? -1 : 1;
      const inStaff = (d: number) => d >= BOTTOM_LINE && d <= TOP_LINE;
      let d = below ? dLo - 2 : dHi + 2;
      const artCls = (a: string) => ["art", ign.has(a) ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" ");
      for (const a of (["staccato", "tenuto"] as const).filter((x) => c.art.includes(x))) {   // 跳音 / 保持：符头外一格，跟着符干的另一侧
        if (inStaff(d) && d % 2 === 0) d += sgn;                                                   // 谱内落在间里
        const m = ART_GLYPH[a], g = below ? m.below : m.above;
        const gy = yOf(row, d) + (below ? -P(m.h / 2) : P(m.h / 2));
        put(row, { tok: tokOf(c), t: "glyph", x: cx - P(m.w / 2), y: gy, ch: g, cls: artCls(a) });
        artEdge.set(c, { below, y: below ? gy + P(m.h) : gy - P(m.h) });   // Above 的从基线往上长、Below 的往下长
        d += sgn * 2;
      }
      // 强度那一组：一律上面（user「强度记号统一放上面吧，不然容易misleading」）。挂件第 2 样（刀 4b）：对着符头中心，这个音自己那一段天际线往上 0.4，几个就一个叠一个
      const strong = (["accent", "marcato", "stress", "unstress"] as const).filter((x) => c.art.includes(x));
      if (strong.length) attach(row, "strength", () => { for (const a of strong) { const m = ART_GLYPH[a]; placeAbove(row, 0.4, (y) => prims.push({ tok: tokOf(c), t: "glyph", x: cx - P(m.w / 2), y, ch: m.above, cls: artCls(a) })); } });
      // 音内的起伏（< / > / <>）+ 突强 / 强后即弱：音自己的修饰，挂件第 3 样（刀 4b：这个音自己那一段天际线往上 0.5，原来是整行一条「里道」）。
      //   突强 / 强后即弱的字对着符头中心（施工单 §2.2 第 5 条，user「还是居中对齐」）；小发夹从符头左缘（有字 = 字后面）到这个音的宽，中线在字的半腰。做不到的画灰
      const swl = c.j === 0 ? swellOf(tokens[c.index]) : undefined;   // 音内起伏 = 演奏法里的那一组（v0.9.44）
      const atk = (["sfz", "fp"] as const).filter((x) => c.art.includes(x));
      if (swl || atk.length) layNoteDynamics(orn, row, c, { cx, x0: nhX(c), w: P(c.w), tok: tokOf(c), cls, ign, swl, roll: c.art.includes("roll"), atk });   // 共用挂件（ornaments/index.ts，第四刀 4-4 原样搬出）
      // 琶音（v0.9.45）：和弦左边（临时记号再左边）一条竖的波浪线，从最低的符头到最高的；做不到的（单声的歌手）画灰
      if (c.art.includes("arpeggio")) {
        const yTop = yOf(row, dHi) - P(0.7), yBot = yOf(row, dLo) + P(0.7), x0 = nhX(c) - P(c.accW + 0.9), amp = P(0.28), step = P(0.5);
        let dd = `M${x0},${yBot}`; for (let y = yBot, k = 0; y > yTop; y -= step, k++) dd += `Q${x0 + (k % 2 ? -amp : amp) * 2},${y - step / 2} ${x0},${Math.max(yTop, y - step)}`;
        put(row, { tok: tokOf(c), t: "path", d: dd, cls: ["arpeggio", ign.has("arpeggio") ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" ") });
      }
      if (c.breath) put(row, { tok: tokOf(c), t: "glyph", x: nhX(c) + nhW(c) + P(0.55), y: yOf(row, TOP_LINE + 1), ch: GLYPH_BREATH, cls: ["breath", ign.has("breath") ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" ") });
      // 出声的换气：逗号后面一个小字「吸」/「深吸」（出版谱的做法 = 逗号 + 文字；没有通用的单个记号）；做不到的人画灰
      if (c.breath && c.inhale) put(row, { tok: tokOf(c), t: "text", x: nhX(c) + nhW(c) + P(1.35), y: yOf(row, TOP_LINE + 1) + P(0.45), s: c.inhale === "big" ? _tIn(o.locale, "深吸##记号") : _tIn(o.locale, "吸##记号"), cls: ["breath-label", ign.has("inhale") ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" "), size: tx("breath-label"), anchor: "start" });
    }
    // 8. 连音线：同一个 token 拆开的几段之间 + 数据里的 tie（连着前一个音）。跨行 = 两半：这一行从音到行尾、下一行从行头到音
    //   （2026-10-08 Opus 5.5，user「跨行的连音符显示不正常」——以前跨行的整条不画）
    const tieArc = (row: number, d: number, x1: number, x2: number, ghost: boolean) => {
      // 弧高跟长度走（刀 4b，施工单 §2.2 第 5 条：很长的延音线不贴着符头走直线）：0.12 × 长，夹在 0.5–1.6 个线间距；短的（行头那半截）照旧压扁到长的四分之一，别像个「^」
      const len = Math.abs(x2 - x1), sgn = d < MID_LINE ? 1 : -1, y = yOf(row, d) + sgn * P(0.8), h = Math.min(len * 0.25, Math.max(P(0.5), Math.min(P(1.6), len * 0.12)));
      put(row, { t: "path", d: `M${x1},${y}Q${(x1 + x2) / 2},${y + sgn * h} ${x2},${y}`, cls: ghost ? "tie ghost" : "tie" });
    };
    const tieBetween = (a: Chunk, b: Chunk) => {
      if (a.staff !== b.staff || !a.pitch || !b.pitch) return;
      const da = dIdx(a.pitch, a.staff, a.index), db = dIdx(b.pitch, b.staff, b.index);
      if (a.system === b.system) { tieArc(RW(b), db, nhX(a) + nhW(a) * 0.8, nhX(b) + nhW(b) * 0.2, b.ghost); return; }
      tieArc(RW(a), da, nhX(a) + nhW(a) * 0.8, Math.max(nhX(a) + nhW(a) * 0.8 + P(2), P(right) - P(0.3)), b.ghost);   // 行尾开口
      tieArc(RW(b), db, Math.max(P((sysStarts[b.system] ?? 0) - 1.6), nhX(b) - P(3)), nhX(b) + nhW(b) * 0.2, b.ghost);      // 行头开口（从调号那儿起）
    };
    const realChunks = units.filter((u): u is Chunk => u.kind === "chunk");
    for (let n = 1; n < realChunks.length; n++) {
      const a = realChunks[n - 1], b = realChunks[n];
      if (!a.note || !b.note) continue;
      if ((b.j > 0 && a.index === b.index) || (b.tie && a.last)) tieBetween(a, b);
    }
    // 8½. 连线（2026-10-08 连断）：一串「连到下一个」的音 = 一条弧，从第一个音的符头到被连到的那个音的符头；画在符干的另一侧、越过中间的音；
    //   跨行 = 每行一段（行尾 / 行头开口）。台上那位不认（月读还没接 / 本来就不留缝）= 画灰（user「演奏者不认的记号也变灰」）
    const headOf = new Map<number, Chunk>();
    for (const c of realChunks) if (c.note && c.j === 0 && !headOf.has(c.index)) headOf.set(c.index, c);
    const noteIdx = [...headOf.keys()].sort((x, y) => x - y), slurOf = (k: number) => !!(tokens[noteIdx[k]] as NoteTok).slur;
    const ext = (c: Chunk, below: boolean) => { const ds = (c.pitches.length ? c.pitches : [c.pitch!]).map((pp) => dIdx(pp, c.staff, c.index)); return yOf(RW(c), below ? Math.min(...ds) : Math.max(...ds)); };
    // 跳音 / 保持在连线这一侧 = 连线从它们外面过（v0.16.54；user 11-09「跳音和slur撞一起了」）：符头外 head 个线间距，或者这些记号的外沿再出去 ART_CLR，取更远的
    const ART_CLR = 0.5;
    const reach = (c: Chunk, below: boolean, head: number) => { const sgn = below ? 1 : -1, h = ext(c, below) + sgn * P(head), a = artEdge.get(c); return a && a.below === below ? (below ? Math.max(h, a.y + P(ART_CLR)) : Math.min(h, a.y - P(ART_CLR))) : h; };
    for (let k = 0; k < noteIdx.length; k++) {
      if (!slurOf(k) || (k > 0 && slurOf(k - 1))) continue;   // 一串的头
      let e = k; while (e < noteIdx.length - 1 && slurOf(e)) e++;
      if (e === k) continue;                                  // 后面没有音可连
      const run = noteIdx.slice(k, e + 1).map((x) => headOf.get(x)!).filter((c) => c.pitch), below = upOf.get(run[0]) ?? false, sgn = below ? 1 : -1;
      const groups: Chunk[][] = [];
      for (const c of run) { const g = groups[groups.length - 1]; if (g && g[0].system === c.system) g.push(c); else groups.push([c]); }
      groups.forEach((g, gi) => {
        const f = g[0], l = g[g.length - 1], openL = gi > 0, openR = gi < groups.length - 1;
        const xa = openL ? nhX(f) - P(2) : nhX(f) + nhW(f) / 2, xb = openR ? nhX(l) + nhW(l) + P(2) : nhX(l) + nhW(l) / 2;
        if (xb - xa < P(1)) return;
        const ya = reach(f, below, 1.2), yb = reach(l, below, 1.2);
        const peak = g.map((c) => ext(c, below) + sgn * P(2.2));
        let cy = below ? Math.max(ya, yb, ...peak) + P(0.6) : Math.min(ya, yb, ...peak) - P(0.6);
        // 中间的音带跳音 / 保持：按真的弧线在这个音的横坐标处算——弧线 y(t) = A(t) + B(t)·cy（两个控制点同高），要越过这个音的记号外沿 + ART_CLR
        const k1 = xa + (xb - xa) * 0.2, k2 = xb - (xb - xa) * 0.2;
        const bez = (t: number, p0: number, p1: number, p2: number, p3: number) => { const u = 1 - t; return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3; };
        for (const c of g.slice(1, -1)) {
          const a = artEdge.get(c); if (!a || a.below !== below) continue;
          const x = nhX(c) + nhW(c) / 2; let lo = 0, hi = 1;
          for (let it = 0; it < 30; it++) { const m = (lo + hi) / 2; if (bez(m, xa, k1, k2, xb) < x) lo = m; else hi = m; }
          const t = (lo + hi) / 2, B = 3 * t * (1 - t), A = (1 - t) ** 3 * ya + t ** 3 * yb, need = reach(c, below, 0);
          if (B > 1e-6) cy = below ? Math.max(cy, (need - A) / B) : Math.min(cy, (need - A) / B);
        }
        put(RW(f), { t: "path", d: `M${xa},${ya}C${xa + (xb - xa) * 0.2},${cy} ${xb - (xb - xa) * 0.2},${cy} ${xb},${yb}`, cls: ["slur", ign.has("slur") ? "art-mute" : ""].filter(Boolean).join(" ") });
      });
    }
    // 8¾. 渐强渐弱（记号，2026-10-08）：从这个记号画到终点——下一个力度记号（让开它的字）/ 下一个渐强渐弱；都没有 = 画到这张纸最后一个音，
    //   后面灰字「(f)」= 走一档推定的终点（user「走一档也行，更合理，需要向用户披露」）。跨行 = 每行画它那一份开口（按横向长度分）。
    //   和两头的力度字之间留空（user 2026-10-08「< 号不用靠着一点空隙都没有」：按量过的墨迹让开 PIN_GAP）；比一整行还长 = 写成「cresc. - - -」（PIN_WORD）。
    //   刀 4b：力度字 / 发夹 / cresc. 字 / 渐到 = 力度那一层（挂件第 4 样），各是一块（dynItems）；用发夹连着的一串（字—发夹—字）共用一条基线 = 这一串里最高的那个，
    //   贴它们自己那几段天际线往上 0.4。原来整行一条「外道」（只要这一行有个高音，整行的力度都被抬上去）。
    layDynamics(orn);   // 力度那一层（力度字 / 发夹 / cresc. 字 / 渐到）：共用挂件（ornaments/index.ts，第四刀 4-3 原样搬出），按行登记
    // 和弦级数（v0.16.13；乐理模块 src/theory/）= 挂件第 10 样（刀 4b，user 11-08 拍：放到和弦的右下角）：x = 符头右缘 + 0.3、靠左对齐；y = 这一段下天际线再往下 0.3。
    //   按 C 调看时认的是换到 C 的谱 + C 调——级数一样。合租叠起来的虚拟行、声部 2 不标（只看个大概的）。印（跟着设置进 PDF）
    if (harmony && !v2 && !q.vrt) {   // 按行登记（第四刀）：一个和弦一块；合租的一家合起来认的挂在这一家最下面那一行（第五刀 5-4，预处理 theory/families.ts）
      const fs = tx("chord-tag");   // 和速度字一样大（v0.16.34）；字的尺子（刀 2）
      // 标哪几个音、标什么 = 乐理模块（src/theory/：叠音的和弦 + 分解和弦，2026-11-09 起能整块换理论）；这里只管摆。
      //   harmonyTags 把这条 track 从左到右一小节一小节喂给理论（理论拿不到整条 track——只看前面，theory/index.ts 文件头）
      const theory = harmonyTheory(), placed = new Map((harmony.get(q.p.id) ?? []).map((x) => [x.index, x] as const));
      for (const c of units) {
        if (c.kind !== "chunk" || !c.note || c.j !== 0 || c.index < 0 || c.pad) continue;
        const t = tokens[c.index]; if (t?.kind !== "note" || !t.pitch) continue;
        const pt = placed.get(c.index); if (!pt) continue;
        const rd = pt.read, rAt = pt.at === q.p.id ? -1 : per.findIndex((x) => x.p.id === pt.at), atRow = rAt >= 0 && !skip(rAt) ? rowOf(c.system, rAt, per[rAt]!.staves - 1) : null;   // 一家的：画在最下面那一位的那一行（不归这种画法管的行 = 画在自己这一行）
        const ds = (c.pitches.length ? c.pitches : [c.pitch!]).map((pp) => dIdx(pp, c.staff, c.index)), second = ds.some((dd, k) => k > 0 && Math.abs(ds[k - 1] - dd) === 1);
        // 跟着符干（v0.16.62，user 11-09「其实可以试着跟着符柄定位，只有和符头位置撞了才退避」）：字的左边对齐符干那条线；
        //   这样会压到这个和弦挂在谱下面的符头（符干朝下 = 符头在符干右边、二度挤开的那个也在右边）= 退回符头右边 + 0.3（原来的位置）。没有符干（全音符）= 符头右边
        const headR = nhX(c) + nhW(c) * (second ? 1.95 : 1), sx = stemXOf.get(c), low = ds.some((dd) => dd < BOTTOM_LINE - 1);
        const atStem = sx !== undefined && !(low && headR > sx + P(0.1));
        const label = theory.label(rd), tx = atStem ? sx! - P(ENGRAVE.stem / 2) : headR + P(0.3), w = [...label].length * fs * 0.6 + TR("chord-tag", 0.6);
        const row = atRow ?? RW(c), cls = `chord-tag${rd.pinned ? " is-pinned" : ""}${rd.stale ? " is-stale" : ""}`;   // 人挑的 = 换个颜色；对不上了 = 灰 + 「?」（v0.16.87）
        attach(row, "chordTag", () => placeBelow(row, 0.3, (y) => {
          prims.push({ t: "text", x: tx, y, s: label, cls, size: fs, anchor: "start" });
          chordTagsOut.push({ x: tx - TR("chord-tag", 0.3), y: y - fs * 1.05, w, h: fs * 1.4, read: rd, system: row, index: c.index, ...(atRow !== null ? { part: q.p.id } : {}) });
        }));
      }
    }
    // 10. 连音括号：同一比例连着的一串，凑满「m 个最小写出单位」就收一组。一组跨行（2026-10-08 Opus 5.5，user「跨行的连音符显示不正常」）=
    //   照样接着数（以前到行尾就收组、下一行从头数，后面的组全错位），每行画一段括号：这一行右边开口、带数字，下一行左边开口
    const bracket = (cs: Chunk[], openL: boolean, openR: boolean, num: boolean) => {
      const row = RW(cs[0]), n = cs[0].ratio![0];
      const xa = openL ? Math.min(nhX(cs[0]) - P(1.2), nhX(cs[0])) : nhX(cs[0]), last = cs[cs.length - 1], xb = openR ? nhX(last) + nhW(last) + P(1.2) : nhX(last) + nhW(last);
      const top = Math.min(...cs.map((c) => Math.min(c.pitch ? yOf(row, dIdx(c.pitch, c.staff, c.index)) : yOf(row, MID_LINE), tipOf.get(c) ?? Infinity)), yOf(row, TOP_LINE)) - P(1.6);
      const mid = (xa + xb) / 2, gap = num ? P(1.0) : 0;
      const left = openL ? `M${xa},${top}` : `M${xa},${top + P(0.6)}L${xa},${top}`, right = openR ? `L${xb},${top}` : `L${xb},${top}L${xb},${top + P(0.6)}`;
      put(row, { t: "path", d: num ? `${left}L${mid - gap},${top}M${mid + gap},${top}${right}` : `${left}${right}`, cls: "tuplet-bracket" });
      if (num) put(row, { t: "glyph", x: mid - P(0.55), y: top + P(0.55), ch: GLYPH_TUPLET(n), cls: "tuplet" });
    };
    let run: Chunk[] = [], runRatio: string | null = null, acc = 0, minBase = Infinity, segStart = 0;
    const flushSeg = (openR: boolean) => { const cs = run.slice(segStart); if (cs.length && cs[0].ratio) bracket(cs, segStart > 0, openR, segStart === 0); segStart = run.length; };
    const closeRun = () => { if (run.length) flushSeg(false); run = []; runRatio = null; acc = 0; minBase = Infinity; segStart = 0; };
    for (const c of realChunks) {
      const rr = c.ratio ? c.ratio.join(":") : null;
      if (rr !== runRatio || (run.length && c.staff !== run[0].staff)) closeRun();
      else if (run.length && c.system !== run[run.length - 1].system) flushSeg(true);   // 跨行：这一行先画到行尾（右边开口），组接着数
      if (!rr) continue;
      run.push(c); runRatio = rr; acc += c.ticks; minBase = Math.min(minBase, c.base);
      if (acc >= c.ratio![1] * minBase - 1e-6) closeRun();
    }
    closeRun();
    // 11 / 11½. 光标落点、写字头：和谱种无关的那一套（frame/carets.ts，第四刀 4-2 原样搬出、推的先后不变）；五线谱给光标往左让多少（刀 3：临时记号挂在对齐线左边，光标画在它左边）和谱号 / 八度线的位移
    const H = headLen(tokens), realLen = q.realLen;
    const inkL = measured[r]!.inkL, cx = (u: { kind: string; x: number }) => { const k = u.kind === "chunk" ? inkL.get(u as Chunk) : undefined; return P(u.x - (k ? k + 0.2 : 0)); };
    const shiftAt = (c: number): number[] => { const kk = Math.min(c, realLen) - 1, si = kk >= H ? kk : -1; return Array.from({ length: q.staves }, (_, k) => shAt(q, (k + 1) as Staff, si)); };
    caretStops(q, { cx, shiftAt, rowOf: (sy, k) => rowOf(sy, r, k), P, sysStart0: sysStarts[0]!, cols, slots, heads });
  });
  return { lyricParts };
}
