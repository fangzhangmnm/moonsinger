// units.ts —— 排版单元的时间那一半（框架的）：一条 track → 排版单元（切小节、拆成能记的时值、临时记号要不要写、自动小节线、第几小节、弱起、补齐）。
// > moved 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第五刀 5-1：从 src/render/staff/units.ts 搬进框架，统筹审第四刀接口第 6 条；纯搬家，算法和浮点先后不变）。
//   各种单元多宽（字形宽、调号宽、换气留的宽…）是画法的事：由画法交进来（UnitWidths；五线谱那一份在 staff/units.ts STAFF_WIDTHS）。
import { lyricWidth, type TextMeasure } from "../text/index.ts";
import { type Token, type NoteTok, type BarTok, type Repeat, type Art, type Dyn, type ClefName, type Staff, WHOLE, TPQ, DEFAULT_KEY, DEFAULT_TIME, DEFAULT_BPM, effectivePitch, headLen, beatTicks, allPitches } from "../../score/song.ts";
import { type Pitch, keyAlter } from "../../score/pitch.ts";
import { MELISMA_MARK, lyricShow } from "../../score/lyrics.ts";
import { realFifthsOf } from "../../score/view-in-c.ts";

// ── 时值记法：一个时值拆成能记的几段（附点、连音）——原 staff/notation.ts（第五刀 5-1 搬来；平常占多宽 baseWidth 留在五线谱那边）──
export const MIN_PLAIN = TPQ / 8;
export const NOTATABLE: { ticks: number; base: number; dotted: boolean }[] = [];
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
export const RATIOS: [number, number][] = [[3, 2], [5, 4], [6, 4], [7, 4]];
export function notate(dur: number): { ratio: [number, number] | null; chunks: { base: number; dotted: boolean; ticks: number }[] } {
  if (dur % MIN_PLAIN === 0) return { ratio: null, chunks: splitDur(dur) };
  for (const [n, m] of RATIOS) {
    const written = (dur * n) / m;
    if (Number.isInteger(written) && written % MIN_PLAIN === 0) return { ratio: [n, m], chunks: splitDur(written).map((c) => ({ ...c, ticks: (c.ticks * m) / n })) };
  }
  return { ratio: null, chunks: [{ base: MIN_PLAIN, dotted: false, ticks: dur }] };
}

/** 复合拍子里的一段休止按拍切（unitsOf 的 restBeats）：拍前那一截（不在拍上起）照常拆，中间一拍一段附点四分，剩下的照常拆。 */
function beatRest(piece: number, offInBeat: number, beat: number): ReturnType<typeof notate> {
  const out: { base: number; dotted: boolean; ticks: number }[] = []; let rem = piece;
  if (offInBeat > 1e-6) { const lead = Math.min(rem, beat - offInBeat); out.push(...notate(lead).chunks); rem -= lead; }
  while (rem >= beat - 1e-6) { out.push({ base: TPQ, dotted: true, ticks: beat }); rem -= beat; }
  if (rem > 1e-6) out.push(...notate(rem).chunks);
  return { ratio: null, chunks: out };
}

// ── 排版单元的类型（两种画法共用）──
export interface Chunk {
  kind: "chunk"; index: number; j: number; last: boolean; base: number; dotted: boolean; note: boolean; ratio: [number, number] | null; ticks: number;
  pitch: Pitch | null; ghost: boolean; tie: boolean; lyric: string | null; hyph: boolean; inBar: number; beat: number; acc: number | null; w: number; accW: number;
  m?: number;   // 第几小节（0 起；纸头弱起 = 第 0 小节）——每行开头的小节号用（v0.9.42）
  pad?: true;   // 补齐的淡色休止（不在谱里：这张纸别的声部更长，这位后面空着的那几个小节；只画、不能点）
  pitches: Pitch[]; accs: (number | null)[];   // 叠音：全部符头（从高到低，第一个 = pitch）+ 各自的临时记号
  art: Art[]; breath: boolean;                 // 修：第一段画跳音 / 重音 / 保持，最后一段后面画呼吸（2026-10-08）
  inhale?: "soft" | "big";                     // 呼吸出声：逗号后面写「吸」/「深吸」（2026-10-10）
  whisper?: boolean;                           // 气声：这个音（拆开的每一段）画 × 符头（2026-10-10）
  lyW?: number;                                // 按歌词排时这个字多宽（sp）：横向间距里当这一位歌词那一行的一样东西（刀 3）
  mrest?: "draw" | "skip";                     // 整小节休止（真写的休止正好占满一个小节、从小节头起）：不参加横向间距，画一个全休止在这个小节正中（只画 draw 那一段；刀 3）
  x: number; system: number; tick: number; staff: Staff;   // staff = 大谱表里在上还是下（单谱表 = 1）
}
export interface BarU { kind: "bar"; index: number; w: number; x: number; system: number; tick: number; staff: Staff; warn: boolean; auto: boolean; repeat?: Repeat; times?: number; style?: "double" | "final" }   // repeat = 反复小节线（Bravura 的反复记号字形，比细线宽）   // auto = 按拍号自动画的（index = -1，不是 token）
export interface KeyU { kind: "key"; index: number; fifths: number; prev: number; w: number; x: number; system: number; tick: number; staff: Staff; /** 按 C 调看时原来的调（写「1=」）。 */ real: number; /** 小调（写「6=」）。 */ minor: boolean }
export interface TimeU { kind: "time"; index: number; beats: number; beatType: number; w: number; x: number; system: number; tick: number; staff: Staff }
export interface TempoU { kind: "tempo"; index: number; bpm: number; w: number; x: number; system: number; tick: number; staff: Staff }
export interface HeadU { kind: "head"; index: -1; w: 0; x: number; system: number; tick: number; staff: Staff }   // 光标：零宽
export interface DynU { kind: "dyn"; index: number; value: Dyn; w: number; x: number; system: number; tick: number; staff: Staff }   // 力度：谱上方一个字（不占地方，和后面那个音对齐）
export interface HairpinU { kind: "hairpin"; index: number; dir: "cresc" | "dim"; w: number; x: number; system: number; tick: number; staff: Staff }   // 渐强渐弱：力度那一行，从这儿画到终点（不占地方）
export interface GrooveU { kind: "groove"; index: number; w: number; x: number; system: number; tick: number; staff: Staff }   // 风格记号：谱上方一行斜体字（不占地方，和后面那个音对齐）
export interface NavU { kind: "nav"; index: number; w: number; x: number; system: number; tick: number; staff: Staff; slot: number }   // slot：D.C. / D.S. / Fine / To Coda 在小节线前（这小节尾），房子 / Segno / Coda 在后（下一小节头）   // 房子 / 跳转记号（谱内反复）：画在谱上方的反复那一道，不占地方
export interface ClefU { kind: "clef"; index: number; clef: ClefName; w: number; x: number; system: number; tick: number; staff: Staff }   // 行中间换谱号：画一个小一号的谱号（v0.9.28）
export interface OttavaU { kind: "ottava"; index: number; w: number; x: number; system: number; tick: number; staff: Staff }   // 八度线：不占地方（线在谱上 / 下，按音的范围画）
export type Unit = Chunk | BarU | KeyU | TimeU | TempoU | HeadU | DynU | HairpinU | GrooveU | NavU | ClefU | OttavaU;

/** 各种单元多宽（sp，量之前的那个宽；画法给）。音那一段：先算临时记号让位的宽 acc，再 chunk = 平常占多宽，按歌词排时 lyric 和它取大，换气 / 出声的换气另加。 */
export interface UnitWidths {
  bar(repeat: Repeat | undefined, style: "double" | "final" | undefined): number;
  /** inCLabel = 按 C 调看时这一处要写「1=X」；ts = 字的尺子。 */
  key(fifths: number, prev: number, inCLabel: boolean, ts: number): number;
  time(beats: number, beatType: number): number;
  readonly tempo: number; readonly clef: number;
  acc(any: boolean): number;
  chunk(accW: number, base: number, dotted: boolean): number;
  lyric(accW: number, lyW: number, hyph: boolean): number;
  readonly breath: number; readonly inhale: Readonly<Record<"soft" | "big", number>>;
}

export interface Head { key: number; /** 按 C 调看时原来的调。 */ real: number; minor: boolean; time: { beats: number; beatType: number }; bpm: number; idx: Partial<Record<"key" | "time" | "tempo", number>> }
export function unitsOf(tokens: Token[], o: { tail: boolean; autoBars: boolean; measure: TextMeasure; sp: number; ts?: number; rhythm?: boolean; /** 从这个下标起是补齐的淡色休止（不在谱里）。 */ padFrom?: number; /** 复合拍子里的休止按拍切（简谱）。 */ restBeats?: boolean; /** 各种单元多宽（画法给的）。 */ widths: UnitWidths }): { units: Unit[]; head: Head; shortBars: number; pickup: boolean } {
  const W = o.widths;
  const H = headLen(tokens);
  let fifths = DEFAULT_KEY, real = DEFAULT_KEY, minor = false, time = { ...DEFAULT_TIME }, bpm = DEFAULT_BPM;
  const headIdx: Head["idx"] = {};
  for (let i = 0; i < H; i++) {
    const t = tokens[i];
    if (t.kind === "key") { fifths = t.fifths; real = realFifthsOf(t); minor = t.mode === "minor"; } else if (t.kind === "time") time = { beats: t.beats, beatType: t.beatType }; else if (t.kind === "tempo") bpm = t.bpm;
    if (t.kind === "key" || t.kind === "time" || t.kind === "tempo") headIdx[t.kind] = i;
  }
  const head: Head = { key: fifths, real, minor, time, bpm, idx: headIdx };
  //   inBar = 这个小节里已经走了多少；满了（= len）不马上画小节线，等下一个音 / 记号 / 写字头 / 曲尾来了再画——
  //   紧跟着的是人插的「|」就用它那一条（不画两条）。拍号中途变了：没写完的这个小节就此结束（同存 MusicXML）。
  const units: Unit[] = [], measureLen = (b: number, bt: number) => (b * WHOLE) / bt;
  let accState = new Map<string, number>(), inBar = 0, measureNo = 0, shortBars = 0, tick = 0, pickup = false;
  let beat = beatTicks(time.beats, time.beatType), len = measureLen(time.beats, time.beatType);
  const pushHead = () => { units.push({ kind: "head", index: -1, w: 0, x: 0, system: 0, tick, staff: 1 }); };
  const pushBar = (index: number, auto: boolean) => {
    const rb = index >= 0 ? (tokens[index] as BarTok) : null, repeat = rb?.repeat;
    const warn = inBar !== len && measureNo > 0 && !(repeat === "start" && inBar === 0);   // 第一小节 = 弱起，不标；开头的 |: 不算一个小节
    if (warn) shortBars++;
    const style = !repeat ? rb?.style : undefined;   // 段落线 / 终止线（v0.9.32）
    units.push({ kind: "bar", index, w: W.bar(repeat, style), x: 0, system: 0, tick, staff: 1, warn, auto, ...(repeat ? { repeat, ...(rb?.times ? { times: rb.times } : {}) } : {}), ...(style ? { style } : {}) });
    const empty = inBar === 0;
    if (measureNo === 0 && inBar > 0 && inBar < len) pickup = true;   // 纸头还没写满就碰到「|」= 弱起（小节号：弱起算第 0 小节）
    accState = new Map(); inBar = 0; if (!(repeat === "start" && empty)) measureNo++;   // 小节开头的 |:（前面那条小节线之后紧跟着 / 纸头）不多数一个小节
  };
  const flushFull = () => { if (o.autoBars && inBar >= len && inBar > 0) pushBar(-1, true); };
  tokens.forEach((t, i) => {
    if (i < H) return;
    if (t.kind === "bar") { pushBar(i, false); return; }
    if (t.kind === "key") {
      flushFull();
      const rf = realFifthsOf(t), inC = rf !== t.fifths || "realFifths" in t;   // 按 C 调看：这一处要写「1=X」，给字留宽
      units.push({ kind: "key", index: i, fifths: t.fifths, prev: fifths, w: W.key(t.fifths, fifths, inC, o.ts ?? 1), x: 0, system: 0, tick, staff: 1, real: rf, minor: t.mode === "minor" });
      fifths = t.fifths; accState = new Map(); return;
    }
    if (t.kind === "time") {
      if (o.autoBars && inBar > 0) pushBar(-1, true);
      units.push({ kind: "time", index: i, beats: t.beats, beatType: t.beatType, w: W.time(t.beats, t.beatType), x: 0, system: 0, tick, staff: 1 });
      beat = beatTicks(t.beats, t.beatType); len = measureLen(t.beats, t.beatType); return;
    }
    if (t.kind === "tempo") { flushFull(); units.push({ kind: "tempo", index: i, bpm: t.bpm, w: W.tempo, x: 0, system: 0, tick, staff: 1 }); return; }
    // 力度记号 / 渐强渐弱不占横向的地方（画在谱上下，不在音和音之间）：插 / 挪 / 删它们，音的位置、间距、折行一点都不变
    //   （2026-10-08 Opus 5.5，user「移动力度标识的时候最好音符的渲染布局一点也不改…尤其是间隔之类的，不要被力度标识的插入影响」；以前各占 0.3 个间距）
    if (t.kind === "dyn") { flushFull(); units.push({ kind: "dyn", index: i, value: t.value, w: 0, x: 0, system: 0, tick, staff: 1 }); return; }
    if (t.kind === "hairpin") { flushFull(); units.push({ kind: "hairpin", index: i, dir: t.dir, w: 0, x: 0, system: 0, tick, staff: 1 }); return; }
    if (t.kind === "groove") { flushFull(); units.push({ kind: "groove", index: i, w: 0, x: 0, system: 0, tick, staff: 1 }); return; }
    // 谱号记号（v0.9.28）。纸头那一处的（这一段手选的谱号，v0.16.88）= 开头的谱号本身（resolveSongLooks 拿它当 start），不另占一个「中途换谱号」的位子
    if (t.kind === "clef") { if (i < H || tokens.slice(H, i).every((x) => x.kind === "clef")) return; flushFull(); units.push({ kind: "clef", index: i, clef: t.clef, w: W.clef, x: 0, system: 0, tick, staff: 1 }); return; }
    if (t.kind === "ottava") { flushFull(); units.push({ kind: "ottava", index: i, w: 0, x: 0, system: 0, tick, staff: 1 }); return; }   // 八度线（v0.9.28）：不占横向地方   // 风格记号（拍子轻重）：同力度字，不占横向地方
    if (t.kind === "nav") { const head = t.what === "ending" || t.what === "segno" || t.what === "coda"; if (head) flushFull(); units.push({ kind: "nav", index: i, w: 0, x: 0, system: 0, tick, staff: 1, slot: head ? 0.5 : -0.5 }); return; }   // 房子 / 跳转：谱上方，不占地方（房子从下一小节开头起：满了的小节先画小节线）
    const isNote = t.kind === "note", nt = t as NoteTok;
    const pitch = isNote ? effectivePitch(tokens, i) : null;
    const pitches = isNote ? (nt.pitch ? allPitches(nt) : [pitch!]) : [];
    // 一个音按自动小节线切成几段（不切 = 整个一段，和以前一样记）；每段再拆成能记的时值
    let left = t.dur, j = 0, lastChunk: Chunk | null = null;
    while (left > 1e-6) {
      flushFull();
      const piece = o.autoBars ? Math.min(left, len - inBar) : left;
      // restBeats（简谱建轨时开）：复合拍子（一拍 = 附点四分）里的休止按拍切——一拍一段附点四分休止，简谱画成一拍一个「0·」（6/8 整小节 = 两个；
      //   统筹看 5-6 样张后定的、user「0· 0· 可以，确实是数两下」）；不在拍上的头尾照常拆。五线谱不开（整小节休止照旧画在小节正中）
      const byBeat = !isNote && !!o.restBeats && Math.abs(beat - TPQ * 1.5) < 1e-6 && piece >= beat - 1e-6;
      const { ratio, chunks } = byBeat ? beatRest(piece, inBar % beat, beat) : notate(piece);
      const mrest = !isNote && inBar < 1e-6 && Math.abs(piece - len) < 1e-6;   // 整小节休止（刀 3）：这一段正好一个小节、从小节头起
      let off = 0;
      for (const c of chunks) {
        const accs: (number | null)[] = pitches.map((pp) => {
          if (j !== 0 || (isNote && nt.tie)) return null;
          const key = `${pp.step}${pp.octave}`, cur = accState.has(key) ? accState.get(key)! : keyAlter(pp.step, fifths);
          if (pp.alter !== cur) { accState.set(key, pp.alter); return pp.alter; }
          return null;
        });
        const acc = accs[0] ?? null;
        const lyric = isNote && j === 0 && !nt.tie ? nt.lyric : null;
        const accW = W.acc(accs.some((a) => a !== null));
        let w = W.chunk(accW, c.base, c.dotted);
        const lyW = lyric && lyric !== MELISMA_MARK && !o.rhythm ? lyricWidth(o.measure, lyricShow(lyric), o.sp, o.ts ?? 1) : undefined;   // 这一档歌词平常写多宽（sp）
        if (lyW !== undefined) w = Math.max(w, W.lyric(accW, lyW, !!nt.hyph));   // 按歌词排：字把音推开；按节奏排（v0.9.40）= 音只看时值
        const u: Chunk = { kind: "chunk", index: i, j, last: false, m: measureNo, base: c.base, dotted: c.dotted, note: isNote, ratio, ticks: c.ticks, pitch,
          ghost: isNote && nt.pitch === null, tie: isNote && !!nt.tie && j === 0, lyric, hyph: !!(isNote && nt.hyph && j === 0), inBar: inBar + off, beat, acc, w, accW, x: 0, system: 0, tick: tick + off, staff: 1, pitches, accs,
          art: isNote && j === 0 ? (nt.art ?? []).filter((a) => a !== "breath") : [], breath: false, ...(isNote && nt.art?.includes("whisper") ? { whisper: true } : {}), ...(lyW !== undefined ? { lyW } : {}), ...(mrest ? { mrest: off < 1e-6 ? "draw" as const : "skip" as const } : {}), ...(o.padFrom !== undefined && i >= o.padFrom ? { pad: true as const } : {}) };
        units.push(u); lastChunk = u;
        off += c.ticks; j++;
      }
      inBar += piece; left -= piece; tick += piece;
    }
    if (lastChunk) { lastChunk.last = true; if (isNote && nt.art?.includes("breath")) { lastChunk.breath = true; lastChunk.w += W.breath; if (nt.inhale) { lastChunk.inhale = nt.inhale; lastChunk.w += W.inhale[nt.inhale]; } } }   // 出声的换气：逗号后面的字也留地方   // 呼吸逗号画在这个音后面：留一点地方
  });
  flushFull();   // 曲尾正好写满：画上这一条小节线
  if (o.tail) pushHead();   // 写字头在尾巴后面：零宽的 head 单元让这一行五线画到右边（staffEnd）；光标本身在 score-view 的 ink 层画
  return { units, head, shortBars, pickup };
}
