// multi.ts —— 选了好几行（几行 × 一段时间）：选区是什么、复制、变休止、整块贴、再来一遍（纯函数，只碰谱，不碰界面）。
// created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。设计 = ai-docs/20261113-selection-rules-design.md 第六节（user「跨行也精确到音」「贴不下时整块不贴」）。
//   · 选区 = 一张纸上挨着的几行（声部 id，谱上的顺序）× 一段时间 [t0, t1)（tick，从纸头算）。只在运行时，不进文件、不进撤销。
//   · 一个音 / 休止算不算在里面，只看它的起点：起点在 [t0, t1) 里 = 算（尾巴伸出去也整个带走）；起点在前面、响进来的不算。
//   · 往歌里写只走一个口：replaceSpan「把一行里一段时间换掉」——等长，不往后推；落点切到休止 = 把休止切开；切到音的中间 = 贴不下。
//   · 行里的骨架（人插的「|」、调号 / 拍号 / 速度 / 谱号 / 八度线 / 反复跳转）留在原地：贴进来的只有音、休止和挂在音上的曲级记号（力度 / 渐强渐弱 / 风格 / 踏板）；
//     目标行在这段时间里有人插的「|」、落在贴进来的音中间 = 照单行「整段换成一个音」的老规矩，在那儿切成两段、用连音线连起来（休止切成两个）。
import { type Token, type NoteTok, type Song, type EditorState, isTimed, isPhraseMark, headLen, trackOf, withTrack, setFocus, MIN_DUR, MAX_DUR, WHOLE, DEFAULT_TIME } from "./song.ts";
import { tickOf } from "./repeats.ts";

export interface MultiSel { paper: string; parts: string[]; t0: number; t1: number }
/** 一行是有音高的还是打击乐（宿主按台上那位查；有音高的不许贴到打击乐的行上，反过来也不许）。 */
export type RowKind = "pitched" | "perc";
/** 块里的一行：off = 它的第一个音离这段时间开头多远；len = 它自己那一截多长（尾巴伸出去的算在里面）；toks 里只有音、休止和挂在音上的曲级记号。 */
export interface BlockRow { kind: RowKind; off: number; len: number; toks: Token[] }
/** 复制下来的一块：len = 这段时间多长（再来一遍的步长）。 */
export interface Block { len: number; rows: BlockRow[] }

const validDur = (d: number) => Number.isInteger(d) && d >= MIN_DUR && d <= MAX_DUR;
export const trackLen = (tokens: readonly Token[]): number => tokens.reduce((s, t) => s + (isTimed(t) ? t.dur : 0), 0);

/** 一行里起点落在 [t0, t1) 的那一段：下标 [a, b)（a 带上第一个音前面挂着的曲级记号，同单行复制）+ 这一截的起止 tick。一个都没有 = null。 */
export function rowRange(tokens: readonly Token[], t0: number, t1: number): { a: number; b: number; s0: number; s1: number } | null {
  const ticks = tickOf(tokens), h = headLen(tokens as Token[]);
  let first = -1, last = -1;
  for (let i = h; i < tokens.length; i++) {
    const t = tokens[i]; if (!isTimed(t)) continue;
    if (ticks[i] >= t0 && ticks[i] < t1) { if (first < 0) first = i; last = i; }
    else if (ticks[i] >= t1) break;
  }
  if (first < 0) return null;
  let a = first; while (a > h && isPhraseMark(tokens[a - 1])) a--;
  const lt = tokens[last] as { dur: number };
  return { a, b: last + 1, s0: ticks[first], s1: ticks[last] + lt.dur };
}

/** 把这几行 × 这段时间收成选区：t0 / t1 = 各行里起点在 [t0, t1) 的那些音最早的起点、最晚的终点（框住的东西定的时间）。一行都没东西 = null。 */
export function normalize(song: Song, paper: string, parts: string[], t0: number, t1: number): MultiSel | null {
  let a = Infinity, b = -Infinity;
  for (const p of parts) { const r = rowRange(trackOf(song, paper, p), t0, t1); if (r) { a = Math.min(a, r.s0); b = Math.max(b, r.s1); } }
  return a < b ? { paper, parts: parts.slice(), t0: a, t1: b } : null;
}

/** 复制：每一行原样切下来（只留音、休止、曲级记号；第一个音和前面连着的连音线断开），记下离开头多远。 */
export function copyBlock(song: Song, m: MultiSel, kindOf: (part: string) => RowKind): Block {
  return {
    len: m.t1 - m.t0,
    rows: m.parts.map((part) => {
      const tk = trackOf(song, m.paper, part), r = rowRange(tk, m.t0, m.t1), kind = kindOf(part);
      if (!r) return { kind, off: 0, len: 0, toks: [] };
      const toks = tk.slice(r.a, r.b).filter((t) => isTimed(t) || isPhraseMark(t)).map((t) => ({ ...t })) as Token[];
      const f = toks.findIndex(isTimed);
      if (f >= 0 && toks[f].kind === "note" && (toks[f] as NoteTok).tie) { const { tie: _t, ...rest } = toks[f] as NoteTok; void _t; toks[f] = rest as Token; }
      return { kind, off: r.s0 - m.t0, len: r.s1 - r.s0, toks };
    }),
  };
}

/** 退格 / Delete / 剪切：每一行里起点在这段时间里的音变成一样长的休止（不合拢，各行不错位）；不占时值的一律留在原地——
 *  人插的「|」、别的记号、挂在这些音上的曲级记号（力度 / 渐强渐弱 / 风格 / 踏板）都在（同单行的「变休止」fillSel：力度是状态，拿掉它会改选区外面的音的响度）。 */
export function clearBlock(song: Song, m: MultiSel): Song {
  let out = song;
  for (const part of m.parts) {
    const tk = trackOf(out, m.paper, part), r = rowRange(tk, m.t0, m.t1); if (!r) continue;
    const nt: Token[] = [...tk.slice(0, r.a)];
    for (let i = r.a; i < r.b; i++) { const t = tk[i]; nt.push(isTimed(t) ? { kind: "rest", id: t.id, dur: t.dur, ...(t.staff ? { staff: t.staff } : {}) } as Token : t); }
    const end = nt.length; nt.push(...tk.slice(r.b)); untieAt(nt, end);
    out = withTrack(out, m.paper, part, nt);
  }
  return out;
}

/** 下标 i 起往后第一个有时值的是连着前面的音 = 断开（前面那个已经不是它连着的音了）。 */
function untieAt(nt: Token[], i: number): void {
  for (let j = i; j < nt.length; j++) { const t = nt[j]; if (!isTimed(t)) continue; if (t.kind === "note" && t.tie) { const { tie: _t, ...rest } = t; void _t; nt[j] = rest as Token; } return; }
}

/** 行尾补休止补到 upTo（补的时候按小节切，同「点小节写这里」落成休止那一套；按人插的「|」/ 拍号 / 写满自动换数）。 */
function padTo(tokens: Token[], upTo: number, id: number): { tokens: Token[]; id: number } {
  let left = upTo - trackLen(tokens); if (left <= 0) return { tokens, id };
  let len = (DEFAULT_TIME.beats * WHOLE) / DEFAULT_TIME.beatType, inBar = 0;
  for (const t of tokens) {
    if (t.kind === "time") { inBar = 0; len = (t.beats * WHOLE) / t.beatType; }
    else if (t.kind === "bar") inBar = 0;
    else if (isTimed(t)) { inBar += t.dur; while (inBar >= len - 1e-6) inBar -= len; if (inBar < 1e-6) inBar = 0; }
  }
  const out = tokens.slice(); let piece = inBar > 0 ? Math.min(left, len - inBar) : Math.min(left, len);
  while (left > 0) { out.push({ kind: "rest", id: id++, dur: piece } as Token); left -= piece; piece = Math.min(left, len); }
  return { tokens: out, id };
}

/** 在 tick x 处把一行切开：x 落在休止中间 = 切成两个休止；落在音中间 = "cut"；正好在边上 / 行尾 = 原样。 */
function splitAt(tokens: Token[], x: number, id: number): { tokens: Token[]; id: number } | "cut" | "dur" {
  const ticks = tickOf(tokens);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]; if (!isTimed(t)) continue;
    const s = ticks[i], e = s + t.dur; if (x <= s || x >= e) continue;
    if (t.kind === "note") return "cut";
    const d1 = x - s, d2 = e - x; if (!validDur(d1) || !validDur(d2)) return "dur";
    const out = tokens.slice(); out.splice(i, 1, { ...t, dur: d1 }, { kind: "rest", id: id++, dur: d2, ...(t.staff ? { staff: t.staff } : {}) } as Token);
    return { tokens: out, id };
  }
  return { tokens, id };
}

export type SpanFail = "cut" | "dur";
/** 歌里的写入口「把一行里一段时间换掉」：tokens 这一行从 t0 起、长 len 的那段时间换成 src（src 只留音、休止和曲级记号，从 t0 起排；短了后面补休止到 len）。
 *  等长，不往后推；行不够长 = 先在行尾补休止。落点两头切到休止 = 把休止切开；切到音的中间 = "cut"（这一版算贴不下）；切出来的长度不合法 = "dur"。
 *  这段时间里原来的音、休止和挂在它们上面的曲级记号去掉；骨架记号（「|」、调号拍号速度、谱号、八度线、反复跳转）留在原来的时刻，
 *  落在贴进来的音中间 = 那个音在那儿切成两段、连音线连（休止切成两个）。回新的一行 + 贴进来的那一截的下标 [a, b)。 */
export function replaceSpan(tokens0: readonly Token[], t0: number, src0: readonly Token[], len: number, id0: number): { tokens: Token[]; id: number; a: number; b: number } | { fail: SpanFail } {
  let id = id0;
  const src: Token[] = src0.filter((t) => isTimed(t) || isPhraseMark(t)).map((t) => ({ ...t, id: id++ }));
  const have = trackLen(src);
  if (have > len) return { fail: "dur" };
  if (have < len) { const pad = padRestsFlat(len - have, id); src.push(...pad.toks); id = pad.id; }
  const t1 = t0 + len;
  let tokens = tokens0.slice() as Token[];
  ({ tokens, id } = padTo(tokens, t1, id));
  for (const x of [t0, t1]) { const r = splitAt(tokens, x, id); if (typeof r === "string") return { fail: r }; ({ tokens, id } = r); }
  // 切成 前 / 中 / 后：中 = 起点在 [t0, t1) 的音 + 它们之间的记号（前面挂着的曲级记号也算中）
  const ticks = tickOf(tokens), h = headLen(tokens);
  let first = -1, last = -1, endI = tokens.length;
  for (let i = h; i < tokens.length; i++) { const t = tokens[i]; if (!isTimed(t)) continue; if (ticks[i] >= t1) { endI = i; break; } if (ticks[i] >= t0) { if (first < 0) first = i; last = i; } }
  if (first < 0) first = endI;
  let a = first; while (a > h && isPhraseMark(tokens[a - 1])) a--;
  // 「后」从这段时间里最后一个音后面开始：时刻 = 段尾的一律留着（后面那个音的力度、段尾的「|」…，不管先后怎么排）；中间夹着的骨架记号按时刻记下来
  const b = last >= 0 ? last + 1 : a;
  const bones: { tick: number; tok: Token }[] = [];
  for (let i = a; i < b; i++) { const t = tokens[i]; if (!isTimed(t) && !isPhraseMark(t)) bones.push({ tick: ticks[i], tok: t }); }
  // 贴进来的：骨架落在它的音中间 = 切开
  const mid: Token[] = []; let at = t0, bi = 0;
  const flushBones = (upTo: number, strict: boolean) => { while (bi < bones.length && (strict ? bones[bi].tick < upTo : bones[bi].tick <= upTo)) mid.push(bones[bi++].tok); };
  for (const t of src) {
    if (!isTimed(t)) { flushBones(at, false); mid.push(t); continue; }
    flushBones(at, false);
    let piece: Token = t, s = at; const e = at + t.dur;
    while (bi < bones.length && bones[bi].tick > s && bones[bi].tick < e) {
      const x = bones[bi].tick, d1 = x - s, d2 = e - x;
      if (!validDur(d1) || !validDur(d2)) return { fail: "dur" };
      const head = { ...piece, dur: d1 } as Token;
      const tail = (piece.kind === "note" ? { ...(piece as NoteTok), id: id++, dur: d2, lyric: null, hyph: undefined, art: undefined, tie: true } : { ...piece, id: id++, dur: d2 }) as Token;
      if (tail.kind === "note") { delete (tail as Partial<NoteTok>).hyph; delete (tail as Partial<NoteTok>).art; }
      mid.push(head); while (bi < bones.length && bones[bi].tick === x) mid.push(bones[bi++].tok);
      piece = tail; s = x;
    }
    mid.push(piece); at = e;
  }
  flushBones(t1, true);
  while (bi < bones.length) mid.push(bones[bi++].tok);
  const out = [...tokens.slice(0, a), ...mid, ...tokens.slice(b)];
  untieAt(out, a + mid.length);
  return { tokens: out, id, a, b: a + mid.length };
}
/** 一串休止凑够 left（每个最多一个全音符；落点切开时用不到小节，贴进来的块尾巴补齐用）。 */
function padRestsFlat(left: number, id: number): { toks: Token[]; id: number } {
  const toks: Token[] = [];
  while (left > 0) { const d = Math.min(left, WHOLE); toks.push({ kind: "rest", id: id++, dur: d } as Token); left -= d; }
  return { toks, id };
}

/** 贴的目标：一行一个，从光标那一行起、按谱上的顺序往下（只数看得见、能改的行）。readOnly = 锁着 / 只读（宿主标）。 */
export interface Target { part: string; kind: RowKind; readOnly?: boolean }
export type PasteWhy = "rows" | "kind" | "cut" | "dur" | "locked";
export interface PasteFail { row: number; part: string | null; why: PasteWhy }

/** 整块贴：块的第 k 行贴到 targets[k]，落在 at + 它的偏移，把那段时间换掉。任何一行贴不下 = 整块不贴，回第一处贴不下的是哪一行、为什么。
 *  贴好了 = 新的歌 + 选中贴上去的那一块（几行 × [at, at + 块长)）。空的一行（那段时间里没有音起头）照样占一行、不写。 */
export function pasteBlock(song: Song, paper: string, targets: readonly Target[], at: number, block: Block, id0: number): { song: Song; id: number; sel: MultiSel } | { fail: PasteFail } {
  if (targets.length < block.rows.length) return { fail: { row: targets.length, part: null, why: "rows" } };
  let out = song, id = id0;
  for (let k = 0; k < block.rows.length; k++) {
    const row = block.rows[k], tg = targets[k];
    if (tg.readOnly) return { fail: { row: k, part: tg.part, why: "locked" } };
    if (!row.toks.length) continue;
    if (row.kind !== tg.kind) return { fail: { row: k, part: tg.part, why: "kind" } };
    const r = replaceSpan(trackOf(out, paper, tg.part), at + row.off, row.toks, row.len, id);
    if ("fail" in r) return { fail: { row: k, part: tg.part, why: r.fail } };
    out = withTrack(out, paper, tg.part, r.tokens); id = r.id;
  }
  return { song: out, id, sel: { paper, parts: targets.slice(0, block.rows.length).map((t) => t.part), t0: at, t1: at + block.len } };
}

/** 再来一遍：选中的这一块贴到它自己的结尾、同样的几行（照粘贴的规矩，贴不下整块不贴）；贴完选区跟过去。 */
export function repeatBlock(song: Song, m: MultiSel, kindOf: (part: string) => RowKind, id0: number): ReturnType<typeof pasteBlock> {
  const block = copyBlock(song, m, kindOf);
  return pasteBlock(song, m.paper, m.parts.map((part) => ({ part, kind: kindOf(part) })), m.t1, block, id0);
}

/** 光标在这一行的哪个时刻（光标前面所有音 / 休止的时值之和；补齐的淡色小节里 = 再加 lead）。 */
export function caretTick(tokens: readonly Token[], caret: number, lead = 0): number {
  let t = 0; for (let i = 0; i < Math.min(caret, tokens.length); i++) { const x = tokens[i]; if (isTimed(x)) t += x.dur; }
  return t + (lead > 0 ? lead : 0);
}

/** 进入「选了好几行」：光标放到最上面那行这段时间的开头（粘贴的落点 = 光标的时刻和那一行），单行选区收掉。每次都是新的一个对象（只活一步，见 EditorState.multi）。 */
export function enterMulti(st: EditorState, m: MultiSel): EditorState {
  const tk = trackOf(st.song, m.paper, m.parts[0]), r = rowRange(tk, m.t0, m.t1);
  let caret = r ? r.a : tk.length;
  if (!r) { const ticks = tickOf(tk); caret = tk.length; for (let i = headLen(tk); i < tk.length; i++) if (isTimed(tk[i]) && ticks[i] >= m.t0) { caret = i; break; } }
  return { ...setFocus(st, m.paper, m.parts[0], caret), sel: null, lead: undefined, log: [], multi: { ...m, parts: m.parts.slice() } };
}
