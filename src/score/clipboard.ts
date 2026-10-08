// clipboard.ts —— 选区的复制 / 剪切 / 粘贴 / 全选（纯函数）+ 简谱文字（系统剪贴板那一层）。created 2026-10-08 by Claude Fable 5.1
// user 2026-10-08「剪贴板两层 同意」：app 内存一份原 token（连歌词、连音、记号）；系统剪贴板放一行简谱文字（能贴进聊天，反过来也能把简谱文字贴进来当输入）。
// 简谱文字的语法（相对「选区开头生效的调」写，贴的时候相对光标处的调读）：
//   音 = [升降][音级][八度][时值][/歌词]：升降 # / b（相对调内音）；音级 1–7；八度 ' 高一个 , 低一个（可叠）；叠音 = 几个音高用 & 连（1&3&5）；时值：不写 = 四分，_ 八分，__ 十六分，___ 三十二分，. 附点；
//   连音线 / 延音：^ 前缀 = 连着前一个音（tie）；0 = 休止（时值同音）；- = 前一个音 / 休止再加一个四分（简谱的横线）；| = 小节线；单独一个 , = 句（换气 / 换行）；
//   记号：[1=G] 调号、[3/4] 拍号、[T=90] 速度；歌词里的空格 / 斜杠不许（歌词只认到下一个空格）。
//   写不出的时值（连音 / 奇怪的 tick 数）写成 (tick)：1(560)。
import { type EditorState, type Token, type NoteTok, type Timed, tr, withTrack, headLen, keyAt, isMark, TPQ, allPitches, withPitches } from "./song.ts";
import { type Pitch, STEPS, type Step, stepIndex, diatonicIndex, tonicStepIndex, keyAlter, KEY_LABEL } from "./pitch.ts";

/** 选中的那一段（没选中 = null）。原样切片，id 原样（贴的时候重编）。 */
export function copyTokens(st: EditorState): Token[] | null {
  if (!st.sel) return null;
  return tr(st).slice(st.sel.from, st.sel.to).map((t) => ({ ...t }));
}
/** 贴：有选中 = 替换选中；没有 = 插在光标处。id 从 nextId 重编；光标落在贴的末尾；本次输入记录清空。 */
export function pasteTokens(st: EditorState, toks: Token[]): EditorState {
  if (!toks.length) return st;
  const tokens = tr(st).slice();
  let nextId = st.nextId;
  const fresh = toks.filter((t) => !isMark(t) || true).map((t) => ({ ...t, id: nextId++ }));
  const from = st.sel ? st.sel.from : st.caret, to = st.sel ? st.sel.to : st.caret;
  const at = Math.max(headLen(tokens), from);
  tokens.splice(at, Math.max(0, to - at), ...fresh);
  return { ...st, song: withTrack(st.song, st.at.paper, st.at.part, tokens), sel: null, caret: at + fresh.length, nextId, log: [] };
}
/** 剪切 = 复制 + 删掉选中（光标留在原处）。 */
export function cutTokens(st: EditorState): { st: EditorState; toks: Token[] } | null {
  const toks = copyTokens(st); if (!toks || !st.sel) return null;
  const tokens = tr(st).slice(); tokens.splice(st.sel.from, st.sel.to - st.sel.from);
  return { st: { ...st, song: withTrack(st.song, st.at.paper, st.at.part, tokens), sel: null, caret: st.sel.from, log: [] }, toks };
}
/** 全选 = 这条 track 谱头之后的全部（文本框的范围：这张纸上这个声部）。 */
export function selectAll(st: EditorState): EditorState {
  const tokens = tr(st), a = headLen(tokens), b = tokens.length;
  if (b <= a) return st;
  return { ...st, sel: { from: a, to: b }, caret: b, log: [] };
}

// ── 简谱文字 ──────────────────────────────────────────────────────────────

/** 音 → 相对 fifths 这个调的简谱：音级 1–7、八度偏移、相对调内音的升降。 */
export function toDegree(p: Pitch, fifths: number): { degree: number; shift: number; acc: number } {
  const tonicD = 4 * 7 + tonicStepIndex(fifths), d = diatonicIndex(p) - tonicD;
  return { degree: ((d % 7) + 7) % 7 + 1, shift: Math.floor(d / 7), acc: p.alter - keyAlter(p.step, fifths) };
}
/** 简谱 → 音（相对 fifths）。 */
export function fromDegree(degree: number, shift: number, acc: number, fifths: number): Pitch {
  const n = tonicStepIndex(fifths) + degree - 1, s = n % 7, step = STEPS[s] as Step;
  return { step, alter: keyAlter(step, fifths) + acc, octave: 4 + Math.floor(n / 7) + shift };
}
const DUR_SUFFIX: [number, string][] = [[TPQ * 4, " - - -"], [TPQ * 3, " - -"], [TPQ * 2, " -"], [TPQ * 1.5, "."], [TPQ, ""], [TPQ * 0.75, "_."], [TPQ / 2, "_"], [TPQ / 4, "__"], [TPQ / 8, "___"]];
function durText(dur: number): string {
  const hit = DUR_SUFFIX.find(([d]) => d === dur);
  return hit ? hit[1] : `(${dur})`;
}
const accText = (a: number) => (a > 0 ? "#".repeat(a) : "b".repeat(-a));
const octText = (s: number) => (s > 0 ? "'".repeat(s) : ",".repeat(-s));
/** 一段 token → 简谱文字（相对 fifths）。 */
export function toJianpu(toks: Token[], fifths: number): string {
  const out: string[] = [];
  let f = fifths;
  for (const t of toks) {
    if (t.kind === "bar") { out.push("|"); continue; }
    if (t.kind === "key") { f = t.fifths; out.push(`[1=${KEY_LABEL[t.fifths] ?? t.fifths}]`); continue; }
    if (t.kind === "time") { out.push(`[${t.beats}/${t.beatType}]`); continue; }
    if (t.kind === "tempo") { out.push(`[T=${t.bpm}]`); continue; }
    if (t.kind === "phrase") { out.push(","); continue; }   // 句 = 单独一个逗号（换气）
    const suf = durText(t.dur), lead = suf.startsWith(" -") ? "" : suf, tail = suf.startsWith(" -") ? suf : "";
    if (t.kind === "rest") { out.push(`0${lead}${tail}`); continue; }
    const body = t.pitch ? allPitches(t).map((pp) => { const { degree, shift, acc } = toDegree(pp, f); return `${accText(acc)}${degree}${octText(shift)}`; }).join("&") : "x";   // 叠音 = 1&3&5（从高到低）
    const ly = t.lyric ? `/${t.lyric.replace(/\s+/g, "")}${t.hyph ? "-" : ""}` : "";
    out.push(`${t.tie ? "^" : ""}${body}${lead}${ly}${tail}`);
  }
  return out.join(" ");
}
const KEY_BY_LABEL: Record<string, number> = Object.fromEntries(Object.entries(KEY_LABEL).map(([k, v]) => [v.replace("♭", "b").replace("♯", "#"), Number(k)]));
/** 简谱文字 → token（相对 fifths；读不懂的词 = 整段不认，返回 null——别把别人聊天里的话当谱）。id 从 0 起（贴的时候重编）。 */
export function fromJianpu(text: string, fifths: number): Token[] | null {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  const out: Token[] = []; let f = fifths, id = 0, n = 0;
  const lastTimed = (): Timed | null => { for (let i = out.length - 1; i >= 0; i--) { const t = out[i]; if (t.kind === "note" || t.kind === "rest") return t; } return null; };
  for (const w of words) {
    if (w === "|") { out.push({ kind: "bar", id: id++ }); continue; }
    if (w === "-") { const t = lastTimed(); if (!t) return null; t.dur += TPQ; continue; }
    if (w === ",") { out.push({ kind: "phrase", id: id++ }); continue; }
    let m = /^\[1=([A-G][b#]?)\]$/.exec(w);
    if (m) { const k = KEY_BY_LABEL[m[1]]; if (k === undefined) return null; f = k; out.push({ kind: "key", id: id++, fifths: k }); continue; }
    m = /^\[(\d+)\/(\d+)\]$/.exec(w);
    if (m) { out.push({ kind: "time", id: id++, beats: Number(m[1]), beatType: Number(m[2]) }); continue; }
    m = /^\[T=(\d+)\]$/.exec(w);
    if (m) { out.push({ kind: "tempo", id: id++, bpm: Number(m[1]) }); continue; }
    m = /^(\^?)((?:[#b]*[0-7x]['’,]*)(?:&[#b]*[1-7]['’,]*)*)(_{0,3})(\.?)(?:\((\d+)\))?(?:\/([^/\s]+?)(-?))?$/.exec(w);
    if (!m) return null;
    const [, tie, body, unders, dot, ticks, lyric, hyph] = m;
    let dur = ticks ? Number(ticks) : TPQ / 2 ** unders.length;
    if (dot && !ticks) dur *= 1.5;
    if (body === "0") { out.push({ kind: "rest", id: id++, dur }); n++; continue; }
    const heads = body.split("&").map((h) => { const hm = /^([#b]*)([0-7x])(['’,]*)$/.exec(h)!; const acc = hm[1] ? (hm[1][0] === "#" ? hm[1].length : -hm[1].length) : 0; const shift = [...hm[3]].reduce((a, c) => a + (c === "," ? -1 : 1), 0); return hm[2] === "x" ? null : fromDegree(Number(hm[2]), shift, acc, f); });
    const t0: NoteTok = { kind: "note", id: id++, pitch: null, dur, lyric: lyric ?? null };
    const t = heads[0] ? withPitches(t0, heads.filter((h): h is NonNullable<typeof h> => !!h)) : t0;
    if (hyph) t.hyph = true; if (tie) t.tie = true;
    out.push(t); n++;
  }
  return n ? out : null;
}
/** 选区开头 / 光标处生效的调（简谱文字相对它写 / 读）。 */
export const fifthsAtSel = (st: EditorState): number => keyAt(tr(st), st.sel ? st.sel.from : Math.max(0, st.caret - 1));
export { stepIndex };
