// lyrics.ts —— 一行歌词 → 一个个音节，再按顺序贴到音符上（詞先 / 曲先都能起手）。created 2026-10-06 by Claude Opus 5.5
// 规则（grill 账本 Q9 + 同行调研：整段粘贴自动分配是现成做法）：
//   汉字一个字一个音；假名一个「拍」一个音（ゃゅょ等小字、っ 并进前一个；ん 自己一个音）；
//   「ー」（或 -）= 拖腔：上一个字延续到这个音上（うさぎ 的 は ー ー）；拉丁字母一个词一个音；空格和标点跳过。
// 贴的规则：从光标后第一个音符开始往后贴，覆盖原来的歌词；光标在末尾时从第一个还没有歌词的音开始；
//   音符不够就在末尾补新音（音高空着 = 继承上一个，月读先在一个音上把词念出来）。

import { type EditorState, type NoteTok, type Token, rainDur } from "./song.ts";

const SMALL = new Set([..."ゃゅょぁぃぅぇぉゎゕゖャュョァィゥェォヮヵヶ", "っ", "ッ"]);
const MELISMA = new Set(["ー", "-", "－", "～", "~"]);
const isKana = (c: string) => /[぀-ゟ゠-ヿ]/.test(c);
const isHan = (c: string) => /\p{Script=Han}/u.test(c);
const isLatin = (c: string) => /[A-Za-z'’]/.test(c);

export const MELISMA_MARK = "ー";

export function splitSyllables(text: string): string[] {
  const out: string[] = [];
  const chars = [...text.normalize("NFC")];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (MELISMA.has(c)) { out.push(MELISMA_MARK); continue; }
    if (SMALL.has(c)) { if (out.length && out[out.length - 1] !== MELISMA_MARK) out[out.length - 1] += c; else out.push(c); continue; }
    if (isKana(c) || isHan(c)) { out.push(c); continue; }
    if (isLatin(c)) { let w = c; while (i + 1 < chars.length && isLatin(chars[i + 1])) w += chars[++i]; out.push(w); continue; }
    // 空格、标点、数字：跳过（以后可以变成呼吸记号）
  }
  return out;
}

/** 把一行歌词贴到音符上。返回新状态（光标不动，方便詞先之后接着用数字填音高）。 */
export function applyLyricLine(st: EditorState, text: string): EditorState {
  const syl = splitSyllables(text);
  if (!syl.length) return st;
  const tokens: Token[] = st.song.tokens.slice();
  const isNote = (t: Token): t is NoteTok => t.kind === "note";
  let i: number;
  if (st.caret >= tokens.length) {
    i = tokens.findIndex((t) => isNote(t) && t.lyric === null);
    if (i < 0) i = tokens.length;
  } else {
    i = st.caret;
  }
  let nextId = st.nextId;
  let dur = rainDur(st);
  for (const s of syl) {
    while (i < tokens.length && !isNote(tokens[i])) i++;
    if (i < tokens.length) {
      const t = tokens[i] as NoteTok;
      tokens[i] = { ...t, lyric: s };
      dur = t.dur;
    } else {
      tokens.push({ kind: "note", id: nextId++, pitch: null, dur, lyric: s });
    }
    i++;
  }
  return { song: { ...st.song, tokens }, caret: st.caret, nextId };
}
