// lyrics.ts —— 歌词：一串文字 → 一个个音节（带「这个词接到下一个音」标记），贴到音符上。created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 改
// 记谱层的规矩（user「月读我记得能读英文的…以及未来也有非月读，现在说的是如何记谱」「输入 同意，拖为什么不用~？」）——和嗓子无关，同 MusicXML <syllabic>：
//   · 汉字一个字一个音节；假名一个「拍」一个（ゃゅょ等小字、っ 并进前一个；ん 自己一个）；
//   · 拉丁字母：空格分词；词里的「-」= 音节结束、词没完（hyph，谱面画连字符），如 hap-py；
//   · 拖腔 = 「~」（主键，user 自己写过 2153~），「～」「_」「ー」和单独的「-」也认：这个音延续上一个音节，谱面画延长线；
//   · 标点、空格（拉丁之外）跳过。
// 贴的规则：从某个音符开始往后贴，覆盖原来的歌词；连音线连着的音（tie）不吃歌词；音符不够就在末尾补新音（音高空着 = 继承上一个）。

import { type EditorState, type NoteTok, type Token, unitDur } from "./song.ts";

export interface Syl { text: string; hyph: boolean }
export const MELISMA_MARK = "ー";

const SMALL = new Set([..."ゃゅょぁぃぅぇぉゎゕゖャュョァィゥェォヮヵヶ", "っ", "ッ"]);
const MELISMA = new Set(["ー", "~", "～", "_", "＿"]);
const isKana = (c: string) => /[぀-ゟ゠-ヿ]/.test(c);
const isHan = (c: string) => /\p{Script=Han}/u.test(c);
const isLatin = (c: string) => /[A-Za-z'’]/.test(c);

export function splitSyllables(text: string): Syl[] {
  const out: Syl[] = [];
  const chars = [...text.normalize("NFC")];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (MELISMA.has(c)) { out.push({ text: MELISMA_MARK, hyph: false }); continue; }
    if (c === "-" || c === "－") { out.push({ text: MELISMA_MARK, hyph: false }); continue; }   // 单独的 -（词里的 - 在拉丁分支处理）
    if (SMALL.has(c)) { const last = out[out.length - 1]; if (last && last.text !== MELISMA_MARK) last.text += c; else out.push({ text: c, hyph: false }); continue; }
    if (isKana(c) || isHan(c)) { out.push({ text: c, hyph: false }); continue; }
    if (isLatin(c)) {
      let w = c;
      while (i + 1 < chars.length) {
        const n = chars[i + 1];
        if (isLatin(n)) { w += n; i++; continue; }
        if ((n === "-" || n === "－") && i + 2 < chars.length && isLatin(chars[i + 2])) { out.push({ text: w, hyph: true }); w = ""; i++; continue; }
        break;
      }
      if (w) out.push({ text: w, hyph: false });
      continue;
    }
    // 空格、标点、数字：跳过（以后可以变成呼吸记号）
  }
  return out;
}

const lyricSlot = (t: Token): t is NoteTok => t.kind === "note" && !t.tie;

/** 从下标 start 起（含）往后把音节贴到音符上；不够就在末尾补空音高的新音。返回新状态 + 最后贴到的下标。 */
export function distributeFrom(st: EditorState, start: number, syl: Syl[]): { st: EditorState; last: number } {
  const tokens: Token[] = st.song.tokens.slice();
  let nextId = st.nextId, i = start, last = -1;
  for (const s of syl) {
    while (i < tokens.length && !lyricSlot(tokens[i])) i++;
    if (i < tokens.length) tokens[i] = { ...(tokens[i] as NoteTok), lyric: s.text, hyph: s.hyph || undefined };
    else tokens.push({ kind: "note", id: nextId++, pitch: null, dur: unitDur(st.input), lyric: s.text, hyph: s.hyph || undefined });
    last = i; i++;
  }
  return { st: { ...st, song: { ...st.song, tokens }, nextId }, last };
}

/** 一整行歌词贴到谱上（粘贴用）：光标后第一个音起；光标在末尾时从第一个还没有歌词的音起。光标不动（詞先之后接着用数字填音高）。 */
export function applyLyricLine(st: EditorState, text: string): EditorState {
  const syl = splitSyllables(text);
  if (!syl.length) return st;
  const tokens = st.song.tokens;
  let start: number;
  if (st.caret >= tokens.length && !st.sel) { start = tokens.findIndex((t) => lyricSlot(t) && t.lyric === null); if (start < 0) start = tokens.length; }
  else start = st.sel ? st.sel.from : st.caret;
  return distributeFrom(st, start, syl).st;
}

/** 下一个能放歌词的音（跳过休止、小节线、调号、tie 音）；没有 = -1。 */
export function nextLyricSlot(tokens: Token[], i: number): number { for (let j = i + 1; j < tokens.length; j++) if (lyricSlot(tokens[j])) return j; return -1; }
export function prevLyricSlot(tokens: Token[], i: number): number { for (let j = i - 1; j >= 0; j--) if (lyricSlot(tokens[j])) return j; return -1; }
export { lyricSlot };
