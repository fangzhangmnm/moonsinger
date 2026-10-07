// song.ts —— 一首歌 = 一串 token（音符 / 休止 / 小节线 / 记号：调号 · 拍号 · 速度）。created 2026-10-06 by Claude Opus 5.5
// 2026-10-07 UX-2 重写（grill 账本 §9¾，user 原话见账本）：
//   · 数据只存时长 + tie（「连着前一个音」）+ hyph（「这个词接到下一个音」）——单位、份数不进数据（user「不要hidden landmine，所以你说的份数可能就是编辑的立即存的，而不是音的属性？」）；
//   · 时间精度 = 每四分 1680 格（2⁴·3·5·7：三十二分、三 / 五 / 七连音都是整数；user「所以你是想离散时间精度…那么可以啊」）；
//   · 调号变化是 token，和小节线一样（user「显示的调号边界能不能也是一个记谱的token，和小节线一样」）；
//   · 选中 = 改，光标 = 写（user「智能识别，选中音符就是改，光标就是写 对」）：有选中就作用在选中上，没选中就作用在下一个要写的音上；
//   · 写的时候：长短 = 输入状态（三十二分…全音符六档，默认八分），「−」把刚写的音加一份它写入时的单位、跨小节线就新开一个 tie 着的音，
//     退格撤回「本次输入记录」的最后一笔；记录在离开写（选中、挪光标）时清空——写字头在，记录就在。
// 2026-10-07：调号 / 拍号 / 速度全是 token，没有全局设置（user「谱子的调号应该也是一个按了可以下拉的文本框。不是全局的，bpm也是，都是token」「这么说拍号也是」）。
//   一首歌开头固定三个记号（谱头）：光标进不去、删不掉，只能就地改；中途可以插，插的地方旁边已有同类记号就改它而不是再插一个。
// 编辑器状态是纯数据，所有命令是纯函数：旧状态 → 新状态。

import { type Dir, type Pitch, HOME, placeDegree, stepBy, alterBy, octaveBy } from "./pitch.ts";

/** 一个四分音符的 tick 数。 */
export const TPQ = 1680;
/** 第一版拍子单位 = 四分音符（x/4 拍号）。 */
export const BEAT = TPQ;
export const WHOLE = TPQ * 4;
/** 长短六档（plain 值）：三十二分 · 十六分 · 八分 · 四分 · 二分 · 全音符（user「长的话最多全音符同意，再有需求用连音」）。 */
export const LADDER = [TPQ / 8, TPQ / 4, TPQ / 2, TPQ, TPQ * 2, WHOLE] as const;
export const DEFAULT_UNIT = 2;   // 八分（user「默认可以是八分音符吗」）
/** 连音：n 个占 m 个的位置 → 每个 × m/n（三连 ×⅔、五连 ×⅘、六连 ×⅔（4 拍分 6）、七连 ×4/7）。 */
export const TUPLET: Record<number, [number, number]> = { 3: [2, 3], 5: [4, 5], 6: [4, 6], 7: [4, 7] };
/** 数据上的时值下限 / 上限（下限 = 三十二分七连音；上限 = 四个全音符，再长用连音线）。 */
export const MIN_DUR = (TPQ / 8) * 4 / 7;
export const MAX_DUR = WHOLE * 4;

export interface NoteTok { kind: "note"; id: number; pitch: Pitch | null; dur: number; lyric: string | null; hyph?: boolean; tie?: boolean }
export interface RestTok { kind: "rest"; id: number; dur: number }
export interface BarTok { kind: "bar"; id: number }
export interface KeyTok { kind: "key"; id: number; fifths: number }
export interface TimeTok { kind: "time"; id: number; beats: number; beatType: number }
export interface TempoTok { kind: "tempo"; id: number; bpm: number }   // 每分钟几个四分音符
export type MarkTok = KeyTok | TimeTok | TempoTok;
export type Token = NoteTok | RestTok | BarTok | MarkTok;
export type Timed = NoteTok | RestTok;
/** 一个记号的值（不带 id）。 */
export type MarkVal = Omit<KeyTok, "id"> | Omit<TimeTok, "id"> | Omit<TempoTok, "id">;

/** 「哼的字」：跟语言无关的四档，唱的时候按语言换字（lab-score.ts HUM_SYLLABLE）。 */
export type Hum = "la" | "n" | "u" | "a";

export interface Song {
  hum: Hum;              // 没写歌词的音唱什么（一首歌一个）
  tokens: Token[];       // 开头三个 = 谱头记号（调号 / 拍号 / 速度）
}
export const DEFAULT_KEY = 0, DEFAULT_TIME = { beats: 4, beatType: 4 }, DEFAULT_BPM = 90;

/** 输入状态（不进数据）：写的时候下一个音长什么样。 */
export interface InputState {
  unit: number;                       // LADDER 下标
  tuplet: 0 | 3 | 5 | 6 | 7;          // 0 = 不连音；锁定式
  acc: 0 | 1 | -1;                    // ♯ / ♭ Shift
  accMode: "off" | "once" | "lock";   // 点一下只管下一个音，连点两下锁住（user「double tap shift is "capslock"」）
  accAt: number;                      // 上一次点 Shift 的时刻（ms，判连点）
  inputFifths: number | null;         // 「1=」：null = 跟光标处生效的调号（user「it is an input toggle」）
}

/** 本次输入记录：退格撤回最后一笔（写字头在，记录就在）。 */
export type LogEntry =
  | { k: "ins"; id: number; unit: number }          // 写了一个音 / 休止（unit = 写入时的时长）
  | { k: "fill"; id: number; unit: number }         // 填了一个空音高的音（詞先）
  | { k: "ext"; id: number; by: number }            // 「−」加长
  | { k: "tie"; id: number; unit: number };         // 「−」跨小节线新开的 tie 音

export interface EditorState {
  song: Song;
  caret: number;                                    // 插入点 0..tokens.length（sel 为 null 时 = 写）
  sel: { from: number; to: number } | null;         // 选中范围 [from, to)（= 改）
  nextId: number;
  log: LogEntry[];
  input: InputState;
}

export function emptySong(m: { fifths?: number; beats?: number; beatType?: number; bpm?: number } = {}): Song {
  return { hum: "la", tokens: [
    { kind: "key", id: 1, fifths: m.fifths ?? DEFAULT_KEY },
    { kind: "time", id: 2, beats: m.beats ?? DEFAULT_TIME.beats, beatType: m.beatType ?? DEFAULT_TIME.beatType },
    { kind: "tempo", id: 3, bpm: m.bpm ?? DEFAULT_BPM },
  ] };
}
export function initInput(): InputState { return { unit: DEFAULT_UNIT, tuplet: 0, acc: 0, accMode: "off", accAt: 0, inputFifths: null }; }
export function initState(song: Song = emptySong()): EditorState {
  const maxId = song.tokens.reduce((m, t) => Math.max(m, t.id), 0);
  return { song, caret: song.tokens.length, sel: null, nextId: maxId + 1, log: [], input: initInput() };
}

export const isTimed = (t: Token): t is Timed => t.kind === "note" || t.kind === "rest";
export const isMark = (t: Token): t is MarkTok => t.kind === "key" || t.kind === "time" || t.kind === "tempo";
/** 谱头 = 开头连着的记号；光标最左只能到它后面。 */
export function headLen(tokens: Token[]): number { let n = 0; while (n < tokens.length && isMark(tokens[n])) n++; return n; }
export const isWriting = (st: EditorState): boolean => st.sel === null;

// ── 查询 ────────────────────────────────────────────────────────────────

/** 光标前最近的音符 / 休止（跳过小节线、调号）。 */
export function currentIndex(st: EditorState): number {
  for (let i = st.caret - 1; i >= 0; i--) if (isTimed(st.song.tokens[i])) return i;
  return -1;
}
/** 下标 i 之前最近一个有音高的音（就近规则的参照）。 */
export function prevPitch(tokens: Token[], i: number): Pitch | null {
  for (let j = i - 1; j >= 0; j--) { const t = tokens[j]; if (t.kind === "note" && t.pitch) return t.pitch; }
  return null;
}
/** 空音高的音：显示和播放时沿用前一个有音高的音，什么都没有就是 HOME。 */
export function effectivePitch(tokens: Token[], i: number): Pitch {
  const t = tokens[i];
  if (t.kind === "note" && t.pitch) return t.pitch;
  return prevPitch(tokens, i) ?? HOME;
}
/** 下标 i 处（i 之前最近的那个记号）生效的调号 / 拍号 / 速度。 */
export function keyAt(song: Song, i: number): number {
  let f = DEFAULT_KEY;
  for (let j = 0; j < i && j < song.tokens.length; j++) { const t = song.tokens[j]; if (t.kind === "key") f = t.fifths; }
  return f;
}
export function timeAt(song: Song, i: number): { beats: number; beatType: number } {
  let v = DEFAULT_TIME;
  for (let j = 0; j < i && j < song.tokens.length; j++) { const t = song.tokens[j]; if (t.kind === "time") v = t; }
  return { beats: v.beats, beatType: v.beatType };
}
export function tempoAt(song: Song, i: number): number {
  let v = DEFAULT_BPM;
  for (let j = 0; j < i && j < song.tokens.length; j++) { const t = song.tokens[j]; if (t.kind === "tempo") v = t.bpm; }
  return v;
}
/** 速度的「语义」：数据只存 bpm（绝对的那个数），词按 bpm 落在哪一档推出来，谱上画「词 ♩ = 数」
 *  （user「速度记号可以用语义+数字吗。绝对零度。」）。typical = 候选里点这个词时给的 bpm；档的边界是常见范围取的整数。 */
export const TEMPO_WORDS: { from: number; it: string; zh: string; typical: number }[] = [
  { from: 0, it: "Largo", zh: "广板", typical: 50 },
  { from: 60, it: "Larghetto", zh: "小广板", typical: 63 },
  { from: 66, it: "Adagio", zh: "柔板", typical: 70 },
  { from: 76, it: "Andante", zh: "行板", typical: 88 },
  { from: 100, it: "Moderato", zh: "中板", typical: 108 },
  { from: 112, it: "Allegretto", zh: "小快板", typical: 116 },
  { from: 120, it: "Allegro", zh: "快板", typical: 132 },
  { from: 156, it: "Vivace", zh: "活板", typical: 160 },
  { from: 176, it: "Presto", zh: "急板", typical: 184 },
  { from: 200, it: "Prestissimo", zh: "最急板", typical: 208 },
];
export function tempoWord(bpm: number): { it: string; zh: string } {
  let w = TEMPO_WORDS[0];
  for (const x of TEMPO_WORDS) if (bpm >= x.from) w = x;
  return w;
}
/** 一拍多少 tick（符杠按拍分组用）：x/2 x/4 x/8 = 那个音符；6/8 9/8 12/8 这类复拍子 = 附点四分。 */
export function beatTicks(beats: number, beatType: number): number {
  return beatType === 8 && beats > 3 && beats % 3 === 0 ? (WHOLE * 3) / 8 : WHOLE / beatType;
}
/** 写的时候「1=」= 手动设过的，否则跟光标处的调号。 */
export const inputKey = (st: EditorState): number => st.input.inputFifths ?? keyAt(st.song, st.caret);
/** 下一个要写的音的时长 = 当前档 ×（连音比例）。 */
export function unitDur(input: InputState): number {
  const plain = LADDER[input.unit];
  if (!input.tuplet) return plain;
  const [m, n] = TUPLET[input.tuplet];
  return (plain * m) / n;
}
const indexOfId = (tokens: Token[], id: number) => tokens.findIndex((t) => t.id === id);

// ── 小工具 ──────────────────────────────────────────────────────────────

function next(st: EditorState, tokens: Token[], patch: Partial<EditorState> = {}): EditorState {
  const caret = Math.max(headLen(tokens), Math.min(tokens.length, patch.caret ?? st.caret));
  return { ...st, ...patch, song: { ...st.song, tokens }, caret };
}
/** 挪光标 / 选中 = 离开「本次输入」，记录清空。 */
const leave = (st: EditorState): EditorState => (st.log.length ? { ...st, log: [] } : st);
const validDur = (d: number) => Number.isInteger(d) && d >= MIN_DUR && d <= MAX_DUR;

/** 用掉一次 Shift：一次性的用完就关，锁定的留着。 */
function consumeAcc(input: InputState): InputState { return input.accMode === "once" ? { ...input, acc: 0, accMode: "off" } : input; }
function applyAcc(p: Pitch, input: InputState): Pitch { return input.acc ? alterBy(p, input.acc) : p; }

/** 写的时候：光标后（跳过小节线、记号）第一个是空音高的音符，就填它而不是插（詞先）。 */
function fillTarget(st: EditorState): number {
  for (let i = st.caret; i < st.song.tokens.length; i++) {
    const t = st.song.tokens[i];
    if (t.kind === "bar" || isMark(t)) continue;
    return t.kind === "note" && t.pitch === null ? i : -1;
  }
  return -1;
}

// ── 写（光标） ──────────────────────────────────────────────────────────

/** 写一个音（给定音高：pad / 指针）。有选中 = 覆盖选中第一个音的音高并跳到下一个音（改）。 */
export function writePitch(st: EditorState, pitch0: Pitch): EditorState {
  const pitch = applyAcc(pitch0, st.input), input = consumeAcc(st.input);
  if (st.sel) return overwritePitch({ ...st, input }, pitch);
  const f = fillTarget(st);
  if (f >= 0) {
    const t = st.song.tokens[f] as NoteTok, tokens = st.song.tokens.slice(); tokens[f] = { ...t, pitch };
    return next(st, tokens, { caret: f + 1, input, log: [...st.log, { k: "fill", id: t.id, unit: t.dur }] });
  }
  const dur = unitDur(st.input), id = st.nextId, tokens = st.song.tokens.slice();
  tokens.splice(st.caret, 0, { kind: "note", id, pitch, dur, lyric: null });
  return next(st, tokens, { caret: st.caret + 1, nextId: id + 1, input, log: [...st.log, { k: "ins", id, unit: dur }] });
}

/** 写一个音：调里第几级 + 方向（键盘数字 / QWERTYU / Shift；pad 也能走这里）。参照 = 落点前最近一个有音高的音。 */
export function writeDegree(st: EditorState, degree: number, dir: Dir): EditorState {
  let at: number;
  if (st.sel) at = firstNoteIn(st);
  else { const f = fillTarget(st); at = f >= 0 ? f : st.caret; }
  if (at < 0) return st;
  return writePitch(st, placeDegree(degree, inputKey(st), prevPitch(st.song.tokens, at), dir));
}

export function writeRest(st: EditorState): EditorState {
  if (st.sel) return st;
  const dur = unitDur(st.input), id = st.nextId, tokens = st.song.tokens.slice();
  tokens.splice(st.caret, 0, { kind: "rest", id, dur });
  return next(st, tokens, { caret: st.caret + 1, nextId: id + 1, log: [...st.log, { k: "ins", id, unit: dur }] });
}

export function writeBar(st: EditorState): EditorState {
  const at = st.sel ? st.sel.to : st.caret, id = st.nextId, tokens = st.song.tokens.slice();
  tokens.splice(at, 0, { kind: "bar", id });
  return next(st, tokens, { caret: at + 1, sel: null, nextId: id + 1, log: [] });
}

/** 在光标处（有选中 = 选中开头）插一个记号。插的地方前后连着的记号里已有同类 → 改它，不再插一个（谱头就是这样被改的）。
 *  返回记号的下标，fresh = 新插的（界面打开它的编辑框；没改值就关 = 撤掉）。 */
export function writeMark(st: EditorState, v: MarkVal): { st: EditorState; index: number; fresh: boolean } {
  const at = st.sel ? st.sel.from : st.caret, tokens = st.song.tokens;
  let a = at, b = at;
  while (a > 0 && isMark(tokens[a - 1])) a--;
  while (b < tokens.length && isMark(tokens[b])) b++;
  for (let i = a; i < b; i++) if (tokens[i].kind === v.kind) return { st: setMark({ ...leave(st), sel: null }, i, v), index: i, fresh: false };
  const id = st.nextId, nt = tokens.slice();
  nt.splice(at, 0, { ...v, id } as MarkTok);
  const input = v.kind === "key" ? { ...st.input, inputFifths: null } : st.input;
  return { st: next(st, nt, { caret: at + 1, sel: null, nextId: id + 1, log: [], input }), index: at, fresh: true };
}
/** 换调号（插一个调号记号）。 */
export const writeKey = (st: EditorState, fifths: number): EditorState => writeMark(st, { kind: "key", fifths }).st;
/** 改一个记号的值（种类不变）。改调号 = 「1=」回到跟调号。 */
export function setMark(st: EditorState, i: number, v: MarkVal): EditorState {
  const t = st.song.tokens[i];
  if (!t || t.kind !== v.kind) return st;
  const nt = st.song.tokens.slice(); nt[i] = { ...v, id: t.id } as MarkTok;
  return next(st, nt, v.kind === "key" ? { input: { ...st.input, inputFifths: null } } : {});
}
/** 删一个中途的记号（谱头的删不掉）。 */
export function deleteMark(st: EditorState, i: number): EditorState {
  const t = st.song.tokens[i];
  if (!t || !isMark(t) || i < headLen(st.song.tokens)) return st;
  const nt = st.song.tokens.slice(); nt.splice(i, 1);
  return next(st, nt, { caret: i < st.caret ? st.caret - 1 : st.caret, sel: null });
}

/** 「−」：写的时候 = 刚写的那个音加一份它写入时的单位（下一个音不受影响）；中间隔着小节线 = 新开一个 tie 着的同音。
 *  有选中 = 每个选中的音加一份当前单位。 */
export function extend(st: EditorState): EditorState {
  if (st.sel) return mapSelDur(st, (d) => d + unitDur(st.input));
  const tokens = st.song.tokens;
  // 目标 = 本次输入记录里最后一个音（还在的话），否则光标前最近的音 / 休止
  let target = -1, unit = unitDur(st.input);
  for (let k = st.log.length - 1; k >= 0 && target < 0; k--) {
    const e = st.log[k], i = indexOfId(tokens, e.id);
    if (i < 0) continue;
    target = i;
    // 单位 = 这个音写入时的那一笔（ins / fill / tie）记下的；最后一笔是「−」就往回找它
    for (let q = k; q >= 0; q--) { const f = st.log[q]; if (f.id === e.id && f.k !== "ext") { unit = f.unit; break; } }
  }
  if (target < 0) target = currentIndex(st);
  if (target < 0) return st;
  const t = tokens[target] as Timed;
  // 目标和光标之间有小节线 → 新开 tie 音（休止跨小节就再写一个休止）
  const barBetween = tokens.slice(target + 1, st.caret).some((x) => x.kind === "bar");
  if (barBetween) {
    const id = st.nextId, nt = tokens.slice();
    const tok: Token = t.kind === "note" ? { kind: "note", id, pitch: t.pitch, dur: unit, lyric: null, tie: true } : { kind: "rest", id, dur: unit };
    nt.splice(st.caret, 0, tok);
    return next(st, nt, { caret: st.caret + 1, nextId: id + 1, log: [...st.log, { k: "tie", id, unit }] });
  }
  const d = t.dur + unit;
  if (!validDur(d)) return st;
  const nt = tokens.slice(); nt[target] = { ...t, dur: d };
  return next(st, nt, { log: [...st.log, { k: "ext", id: t.id, by: unit }] });
}

/** 退格：有选中 = 删选中；写的时候 = 撤回本次输入记录的最后一笔，记录空了就删光标前一个 token。 */
export function backspace(st: EditorState): EditorState {
  if (st.sel) return deleteSel(st);
  const tokens = st.song.tokens;
  while (st.log.length) {
    const e = st.log[st.log.length - 1], log = st.log.slice(0, -1), i = indexOfId(tokens, e.id);
    if (i < 0) { st = { ...st, log }; continue; }   // 记录里的东西已经不在了（别处删过）：跳过这笔
    const nt = tokens.slice();
    if (e.k === "ext") { const t = nt[i] as Timed; nt[i] = { ...t, dur: t.dur - e.by }; return next(st, nt, { log }); }
    if (e.k === "fill") { const t = nt[i] as NoteTok; nt[i] = { ...t, pitch: null }; return next(st, nt, { log, caret: i }); }
    nt.splice(i, 1);                                // ins / tie：删掉那个 token
    return next(st, nt, { log, caret: i < st.caret ? st.caret - 1 : st.caret });
  }
  if (st.caret <= headLen(tokens)) return st;   // 谱头删不掉
  const nt = tokens.slice(); nt.splice(st.caret - 1, 1);
  return next(st, nt, { caret: st.caret - 1 });
}
export function deleteForward(st: EditorState): EditorState {
  if (st.sel) return deleteSel(st);
  if (st.caret >= st.song.tokens.length) return st;
  const nt = st.song.tokens.slice(); nt.splice(st.caret, 1);
  return next(leave(st), nt);
}

// ── 输入状态（写的时候改的是下一个音） ────────────────────────────────

/** 长短：有选中 = 选中的音减半 / 加倍；写的时候 = 输入档位（到头不动）。 */
export function shorter(st: EditorState): EditorState {
  if (st.sel) return mapSelDur(st, (d) => d / 2);
  return st.input.unit > 0 ? { ...st, input: { ...st.input, unit: st.input.unit - 1 } } : st;
}
export function longer(st: EditorState): EditorState {
  if (st.sel) return mapSelDur(st, (d) => d * 2);
  return st.input.unit < LADDER.length - 1 ? { ...st, input: { ...st.input, unit: st.input.unit + 1 } } : st;
}
/** 连音：设成 0 / 3 / 5 / 6 / 7（锁定式；候选由界面弹）。 */
export function setTuplet(st: EditorState, n: InputState["tuplet"]): EditorState { return { ...st, input: { ...st.input, tuplet: n } }; }
/** ♯ / ♭ Shift：关 → 一次；一次且 350 ms 内再点 → 锁；其余 → 关。有选中 = 选中的音直接升降半音。 */
export function tapAcc(st: EditorState, acc: 1 | -1, now: number): EditorState {
  if (st.sel) return mapSelPitch(st, (p) => alterBy(p, acc));
  const i = st.input;
  if (i.acc !== acc || i.accMode === "off") return { ...st, input: { ...i, acc, accMode: "once", accAt: now } };
  if (i.accMode === "once" && now - i.accAt < 350) return { ...st, input: { ...i, accMode: "lock", accAt: now } };
  return { ...st, input: { ...i, acc: 0, accMode: "off", accAt: now } };
}
/** 「1=」：只管输入（user「after you change the 1=???, the original inputted note should not be changed」）。 */
export function setInputKey(st: EditorState, fifths: number | null): EditorState { return { ...st, input: { ...st.input, inputFifths: fifths } }; }

// ── 改（选中） ──────────────────────────────────────────────────────────

function firstNoteIn(st: EditorState): number {
  if (!st.sel) return -1;
  for (let i = st.sel.from; i < st.sel.to; i++) if (st.song.tokens[i].kind === "note") return i;
  return -1;
}
function nextNoteAfter(tokens: Token[], i: number): number {
  for (let j = i + 1; j < tokens.length; j++) if (tokens[j].kind === "note") return j;
  return -1;
}
/** 覆盖选中第一个音的音高，选中跳到下一个音（没有了 = 末尾的光标，回到写）。节奏不动。 */
function overwritePitch(st: EditorState, pitch: Pitch): EditorState {
  const i = firstNoteIn(st);
  if (i < 0) return st;
  const nt = st.song.tokens.slice(); nt[i] = { ...(nt[i] as NoteTok), pitch };
  const j = nextNoteAfter(nt, i);
  return j >= 0 ? next(st, nt, { sel: { from: j, to: j + 1 }, caret: j + 1 }) : next(st, nt, { sel: null, caret: nt.length, log: [] });
}
function mapSelDur(st: EditorState, f: (d: number) => number): EditorState {
  if (!st.sel) return st;
  const nt = st.song.tokens.slice(); let changed = false;
  for (let i = st.sel.from; i < st.sel.to; i++) { const t = nt[i]; if (!isTimed(t)) continue; const d = f(t.dur); if (validDur(d)) { nt[i] = { ...t, dur: d }; changed = true; } }
  return changed ? next(st, nt) : st;
}
function mapSelPitch(st: EditorState, f: (p: Pitch) => Pitch): EditorState {
  if (!st.sel) return st;
  const nt = st.song.tokens.slice();
  for (let i = st.sel.from; i < st.sel.to; i++) { const t = nt[i]; if (t.kind === "note") nt[i] = { ...t, pitch: f(effectivePitch(nt, i)) }; }
  return next(st, nt);
}
function deleteSel(st: EditorState): EditorState {
  if (!st.sel) return st;
  const nt = st.song.tokens.slice(); nt.splice(st.sel.from, st.sel.to - st.sel.from);
  return next(st, nt, { sel: null, caret: st.sel.from, log: [] });
}

/** 改音高（↑↓ 一级 / Shift 半音 / Alt 八度）：有选中 = 全部选中；写的时候 = 光标前那个音。 */
function mapTargetPitch(st: EditorState, f: (p: Pitch, fifths: number) => Pitch): EditorState {
  if (st.sel) { const from = st.sel.from; return mapSelPitch(st, (p) => f(p, keyAt(st.song, from))); }
  const i = currentIndex(st);
  if (i < 0 || st.song.tokens[i].kind !== "note") return st;
  const nt = st.song.tokens.slice(); nt[i] = { ...(nt[i] as NoteTok), pitch: f(effectivePitch(nt, i), keyAt(st.song, i)) };
  return next(st, nt);
}
export const stepTarget = (st: EditorState, steps: number) => mapTargetPitch(st, (p, k) => stepBy(p, steps, k));
export const alterTarget = (st: EditorState, d: number) => mapTargetPitch(st, (p) => alterBy(p, d));
export const octaveTarget = (st: EditorState, d: number) => mapTargetPitch(st, (p) => octaveBy(p, d));

// ── 光标与选中 ──────────────────────────────────────────────────────────

/** 放光标（= 写）：清选中、清本次输入记录。 */
export const setCaret = (st: EditorState, caret: number): EditorState =>
  ({ ...leave(st), sel: null, caret: Math.max(headLen(st.song.tokens), Math.min(st.song.tokens.length, caret)) });
/** 选中一段（= 改）。 */
export function select(st: EditorState, from: number, to: number): EditorState {
  const n = st.song.tokens.length, a = Math.max(headLen(st.song.tokens), Math.min(from, to)), b = Math.min(n, Math.max(from, to));
  if (b <= a) return setCaret(st, a);
  return { ...leave(st), sel: { from: a, to: b }, caret: b };
}
/** ←→：有选中 = 收成左 / 右边的光标；没有 = 挪光标。 */
export function moveCaret(st: EditorState, d: number): EditorState {
  if (st.sel) return setCaret(st, d < 0 ? st.sel.from : st.sel.to);
  return setCaret(st, st.caret + d);
}
/** Shift+←→：从光标（或已有选中）往一边扩一个 token。 */
export function extendSelection(st: EditorState, d: number): EditorState {
  if (!st.sel) return d < 0 ? select(st, st.caret - 1, st.caret) : select(st, st.caret, st.caret + 1);
  return d < 0 ? select(st, st.sel.from - 1, st.sel.to) : select(st, st.sel.from, st.sel.to + 1);
}
/** Esc：写 → 选中光标前那个 token（改）。 */
export function escape(st: EditorState): EditorState {
  if (st.sel) return st;
  return st.caret > headLen(st.song.tokens) ? select(st, st.caret - 1, st.caret) : st;
}

// ── 直接改（指针拖动 / 歌词） ─────────────────────────────────────────

export function setNote(st: EditorState, i: number, patch: Partial<Pick<NoteTok, "pitch" | "dur" | "lyric" | "hyph">>): EditorState {
  const t = st.song.tokens[i];
  if (!t || t.kind !== "note") return st;
  const nt = st.song.tokens.slice(); nt[i] = { ...t, ...patch };
  return next(st, nt);
}
export function setDur(st: EditorState, i: number, dur: number): EditorState {
  const t = st.song.tokens[i];
  if (!t || !isTimed(t) || !validDur(dur)) return st;
  const nt = st.song.tokens.slice(); nt[i] = { ...t, dur };
  return next(st, nt);
}
export function setHum(st: EditorState, hum: Hum): EditorState { return { ...st, song: { ...st.song, hum } }; }

// ── 时间轴（播放、画谱、小节对账都用） ─────────────────────────────────

export interface TimedAt {
  index: number; tok: Timed;
  start: number;            // tick，从头算
  inBar: number;            // tick，从上一条小节线算
  bpm: number;              // 这里生效的速度
  t0: number; t1: number;   // 秒（按速度记号一段一段算）
}

export function timeline(song: Song): TimedAt[] {
  const out: TimedAt[] = [];
  let t = 0, bar = 0, sec = 0, bpm = DEFAULT_BPM;
  song.tokens.forEach((tok, index) => {
    if (tok.kind === "bar") { bar = t; return; }
    if (tok.kind === "tempo") { bpm = tok.bpm; return; }
    if (!isTimed(tok)) return;
    const len = (tok.dur / TPQ) * (60 / bpm);
    out.push({ index, tok, start: t, inBar: t - bar, bpm, t0: sec, t1: sec + len });
    t += tok.dur; sec += len;
  });
  return out;
}

/** 每个小节（两条小节线之间）实际拍数和那里的拍号是否对得上——只用来轻标，不拦（家规：不许规训）。 */
export function barFill(song: Song): { from: number; to: number; ticks: number; full: boolean }[] {
  const wantOf = (b: number, bt: number) => (b * WHOLE) / bt;
  let want = wantOf(DEFAULT_TIME.beats, DEFAULT_TIME.beatType);
  const out: { from: number; to: number; ticks: number; full: boolean }[] = [];
  let from = 0, ticks = 0;
  song.tokens.forEach((tok, i) => {
    if (tok.kind === "bar") { out.push({ from, to: i, ticks, full: ticks === want }); from = i + 1; ticks = 0; }
    else if (tok.kind === "time") want = wantOf(tok.beats, tok.beatType);
    else if (isTimed(tok)) ticks += tok.dur;
  });
  return out;
}
