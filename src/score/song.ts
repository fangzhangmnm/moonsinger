// song.ts —— 一首歌 = 一串 token（音符 / 休止 / 小节线）+ 调号、拍号、速度。created 2026-10-06 by Claude Opus 5.5
// grill 账本：user「一串token，拍」；「bar是你人工插的token，而不是定好的护栏」；token 里音高、歌词都可以空着（詞先 / 曲先都能起手）；
// 时值「今天下雨明天也下雨」= 新音默认和上一个音一样长；8 / 9 / - / . 只改刚打的那个音，没有隐藏模式。
// 编辑器状态 = 歌 + 光标（插入点，像文字的光标，0..tokens.length）。所有命令是纯函数：旧状态 → 新状态。

import { type Dir, type Pitch, HOME, placeDegree, stepBy, alterBy, octaveBy } from "./pitch.ts";

/** 一个四分音符的 tick 数（能被 2、3、4、8、16 整除：三十二分音符 = 6，以后三连音也装得下）。 */
export const TPQ = 48;
/** 第一版拍子单位 = 四分音符（x/4 拍号）。 */
export const BEAT = TPQ;
/** 最短（「普朗克时间」）= 三十二分音符；最长 = 四个全音符。 */
export const MIN_DUR = TPQ / 8;
export const MAX_DUR = TPQ * 16;

export interface NoteTok { kind: "note"; id: number; pitch: Pitch | null; dur: number; lyric: string | null }
export interface RestTok { kind: "rest"; id: number; dur: number }
export interface BarTok { kind: "bar"; id: number }
export type Token = NoteTok | RestTok | BarTok;

export interface Song {
  fifths: number;        // 调号（MusicXML <key><fifths>）
  beats: number;         // 拍号分子
  beatType: number;      // 拍号分母（第一版只认 4）
  tempo: number;         // 每分钟几个四分音符
  hum: Hum;              // 没写歌词的音唱什么（一首歌一个；user 2026-10-06「同意」）
  tokens: Token[];
}

/** 「哼的字」：跟语言无关的四档，唱的时候按语言换字（lab-score.ts HUM_SYLLABLE）。 */
export type Hum = "la" | "n" | "u" | "a";

export interface EditorState { song: Song; caret: number; nextId: number }

export function emptySong(): Song { return { fifths: 0, beats: 4, beatType: 4, tempo: 90, hum: "la", tokens: [] }; }
export function initState(song: Song = emptySong()): EditorState {
  const maxId = song.tokens.reduce((m, t) => Math.max(m, t.id), 0);
  return { song, caret: song.tokens.length, nextId: maxId + 1 };
}

const isTimed = (t: Token): t is NoteTok | RestTok => t.kind !== "bar";

// ── 查询 ────────────────────────────────────────────────────────────────

/** 光标前最近的音符 / 休止（跳过小节线）= 「刚打的那个音」。 */
export function currentIndex(st: EditorState): number {
  for (let i = st.caret - 1; i >= 0; i--) if (isTimed(st.song.tokens[i])) return i;
  return -1;
}

/** 新音的默认长度：光标前最近的音符 / 休止的长度；什么都没有就一拍。 */
export function rainDur(st: EditorState): number {
  const i = currentIndex(st);
  return i >= 0 ? (st.song.tokens[i] as NoteTok | RestTok).dur : BEAT;
}

/** 下标 i 之前最近一个有音高的音（就近规则的参照）。 */
export function prevPitch(tokens: Token[], i: number): Pitch | null {
  for (let j = i - 1; j >= 0; j--) { const t = tokens[j]; if (t.kind === "note" && t.pitch) return t.pitch; }
  return null;
}

/** 空音高的音：显示和播放时沿用前一个有音高的音（「今天下雨明天也下雨」），什么都没有就是 HOME。 */
export function effectivePitch(tokens: Token[], i: number): Pitch {
  const t = tokens[i];
  if (t.kind === "note" && t.pitch) return t.pitch;
  return prevPitch(tokens, i) ?? HOME;
}

/** 光标处要不要「填」而不是「插」：光标后（跳过小节线）第一个 token 是空音高的音符，就填它。 */
function fillTarget(st: EditorState): number {
  for (let i = st.caret; i < st.song.tokens.length; i++) {
    const t = st.song.tokens[i];
    if (t.kind === "bar") continue;
    return t.kind === "note" && t.pitch === null ? i : -1;
  }
  return -1;
}

// ── 小工具 ──────────────────────────────────────────────────────────────

function withTokens(st: EditorState, tokens: Token[], caret: number, nextId = st.nextId): EditorState {
  return { song: { ...st.song, tokens }, caret: Math.max(0, Math.min(tokens.length, caret)), nextId };
}
function insert(st: EditorState, tok: Token): EditorState {
  const tokens = st.song.tokens.slice(); tokens.splice(st.caret, 0, tok);
  return withTokens(st, tokens, st.caret + 1, st.nextId + 1);
}
function replaceAt(st: EditorState, i: number, tok: Token, caret = st.caret): EditorState {
  const tokens = st.song.tokens.slice(); tokens[i] = tok;
  return withTokens(st, tokens, caret);
}

/** 两的幂次的时值（全 / 二分 / 四分 / 八分…）。 */
export function isPlain(dur: number): boolean {
  for (let d = MIN_DUR; d <= MAX_DUR; d *= 2) if (d === dur) return true;
  return false;
}
/** 一个附点（plain × 1.5）。 */
export const isDotted = (dur: number): boolean => dur % 3 === 0 && isPlain((dur / 3) * 2);

// ── 命令 ────────────────────────────────────────────────────────────────

/** 写一个音：给定音高（pad / 指针）。光标后是空音高的音就填它，否则在光标处插一个新音。 */
export function writePitch(st: EditorState, pitch: Pitch): EditorState {
  const f = fillTarget(st);
  if (f >= 0) { const t = st.song.tokens[f] as NoteTok; return replaceAt(st, f, { ...t, pitch }, f + 1); }
  return insert(st, { kind: "note", id: st.nextId, pitch, dur: rainDur(st), lyric: null });
}

/** 写一个音：调里第几级 + 方向（键盘数字 / QWERTYU / Shift）。参照 = 落点前最近一个有音高的音。 */
export function writeDegree(st: EditorState, degree: number, dir: Dir): EditorState {
  const f = fillTarget(st);
  const at = f >= 0 ? f : st.caret;
  return writePitch(st, placeDegree(degree, st.song.fifths, prevPitch(st.song.tokens, at), dir));
}

export function writeRest(st: EditorState): EditorState {
  return insert(st, { kind: "rest", id: st.nextId, dur: rainDur(st) });
}

export function writeBar(st: EditorState): EditorState {
  return insert(st, { kind: "bar", id: st.nextId });
}

/** 改「刚打的那个音」的时值。 */
function mapCurrentDur(st: EditorState, f: (dur: number) => number): EditorState {
  const i = currentIndex(st);
  if (i < 0) return st;
  const t = st.song.tokens[i] as NoteTok | RestTok;
  const dur = f(t.dur);
  if (dur === t.dur || dur < MIN_DUR || dur > MAX_DUR || dur % MIN_DUR !== 0) return st;   // 只认三十二分音符的整数倍（画得出来）
  return replaceAt(st, i, { ...t, dur });
}
export const halve = (st: EditorState) => mapCurrentDur(st, (d) => d / 2);          // 8（诺基亚）
export const double = (st: EditorState) => mapCurrentDur(st, (d) => d * 2);         // 9（诺基亚）
export const extendBeat = (st: EditorState) => mapCurrentDur(st, (d) => d + BEAT);  // -（简谱横线）
/** .：附点开关（plain ↔ 1.5 倍）。 */
export const toggleDot = (st: EditorState) => mapCurrentDur(st, (d) => (isPlain(d) ? d * 1.5 : isDotted(d) ? (d / 3) * 2 : d));

/** 改「刚打的那个音」的音高（↑↓ 一级 / Shift 半音 / Alt 八度）。空音高的音先落到它的有效音高再挪。 */
function mapCurrentPitch(st: EditorState, f: (p: Pitch) => Pitch): EditorState {
  const i = currentIndex(st);
  if (i < 0) return st;
  const t = st.song.tokens[i];
  if (t.kind !== "note") return st;
  return replaceAt(st, i, { ...t, pitch: f(effectivePitch(st.song.tokens, i)) });
}
export const stepCurrent = (st: EditorState, steps: number) => mapCurrentPitch(st, (p) => stepBy(p, steps, st.song.fifths));
export const alterCurrent = (st: EditorState, d: number) => mapCurrentPitch(st, (p) => alterBy(p, d));
export const octaveCurrent = (st: EditorState, d: number) => mapCurrentPitch(st, (p) => octaveBy(p, d));

/** 退格：删光标前一个 token。 */
export function backspace(st: EditorState): EditorState {
  if (st.caret <= 0) return st;
  const tokens = st.song.tokens.slice(); tokens.splice(st.caret - 1, 1);
  return withTokens(st, tokens, st.caret - 1);
}
/** Delete：删光标后一个 token。 */
export function deleteForward(st: EditorState): EditorState {
  if (st.caret >= st.song.tokens.length) return st;
  const tokens = st.song.tokens.slice(); tokens.splice(st.caret, 1);
  return withTokens(st, tokens, st.caret);
}

export const setCaret = (st: EditorState, caret: number): EditorState => withTokens(st, st.song.tokens, caret);
export const moveCaret = (st: EditorState, d: number): EditorState => setCaret(st, st.caret + d);

/** 改某个音符的音高 / 时值（指针拖动用）。 */
export function setNote(st: EditorState, i: number, patch: Partial<Pick<NoteTok, "pitch" | "dur" | "lyric">>): EditorState {
  const t = st.song.tokens[i];
  if (!t || t.kind !== "note") return st;
  return replaceAt(st, i, { ...t, ...patch });
}
export function setDur(st: EditorState, i: number, dur: number): EditorState {
  const t = st.song.tokens[i];
  if (!t || t.kind === "bar" || dur < MIN_DUR || dur > MAX_DUR || dur % MIN_DUR !== 0) return st;
  return replaceAt(st, i, { ...t, dur });
}

export function setSongMeta(st: EditorState, patch: Partial<Omit<Song, "tokens">>): EditorState {
  return { ...st, song: { ...st.song, ...patch } };
}

// ── 时间轴（播放、画谱、小节对账都用） ─────────────────────────────────

export interface Timed { index: number; tok: NoteTok | RestTok; start: number /* tick，从头算 */; inBar: number /* tick，从上一条小节线算 */ }

/** 把 token 串摊到时间轴上：起点 = 前面时值累加；小节内位置从上一条小节线重新算。 */
export function timeline(song: Song): Timed[] {
  const out: Timed[] = [];
  let t = 0, bar = 0;
  song.tokens.forEach((tok, index) => {
    if (tok.kind === "bar") { bar = t; return; }
    out.push({ index, tok, start: t, inBar: t - bar });
    t += tok.dur;
  });
  return out;
}

/** 每个小节（两条小节线之间）实际拍数和拍号是否对得上——只用来轻标，不拦（家规：不许规训）。 */
export function barFill(song: Song): { from: number; to: number; ticks: number; full: boolean }[] {
  const want = (song.beats * TPQ * 4) / song.beatType;
  const out: { from: number; to: number; ticks: number; full: boolean }[] = [];
  let from = 0, ticks = 0;
  song.tokens.forEach((tok, i) => {
    if (tok.kind === "bar") { out.push({ from, to: i, ticks, full: ticks === want }); from = i + 1; ticks = 0; }
    else ticks += tok.dur;
  });
  return out;
}
