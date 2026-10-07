// lyrics.ts —— 歌词：一串文字 → 一个个音节（带「这个词接到下一个音」标记），贴到音符上。created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 改
// 记谱层的规矩（user「月读我记得能读英文的…以及未来也有非月读，现在说的是如何记谱」「输入 同意，拖为什么不用~？」）——和嗓子无关，同 MusicXML <syllabic>：
//   · 汉字一个字一个音节；假名一个「拍」一个（ゃゅょ等小字、っ 并进前一个；ん 自己一个）；
//   · 拉丁字母：空格分词；词里的「-」= 音节结束、词没完（hyph，谱面画连字符），如 hap-py；
//   · 拖腔 = 「~」（主键，user 自己写过 2153~），「～」「_」「ー」和单独的「-」也认：这个音延续上一个音节，谱面画延长线；
//   · 标点、空格（拉丁之外）跳过。
//   · 「+」（全角「＋」也认）= 后面那个字和前面的放同一个音（elision；user「日语歌词需支持一个音对应两个假名 也许不一定两个，然后中文也一样，
//     这样之前的自动输入怎么办呢？之前的自动输入其实蛮舒服的」→ AI 答「照常连着打、字中间打 +」→「点头」）：数据里用标准的连字弧「‿」（U+203F）连着，
//     MusicXML = 一个 <lyric> 里 <text>…<elision/>…<text>；纸上中日文两个字之间不画弧（日文谱的习惯），拉丁字母之间画「‿」；唱的时候这个音平分给这几拍字。
// 贴的规则：从某个音符开始往后贴，覆盖原来的歌词；连音线连着的音（tie）不吃歌词；音符不够就在末尾补新音（音高空着 = 继承上一个）。

import { type EditorState, type NoteTok, type Token, unitDur } from "./song.ts";

export interface Syl { text: string; hyph: boolean; joinPrev?: boolean }   // joinPrev = 这段文字一开头就是「+」：第一个字并进前一个音（歌词框已经跳到下一个音的时候）
export const MELISMA_MARK = "ー";
/** 一个音上几个音节之间的连字弧（数据里的分隔）。 */
export const ELISION = "‿";
const JOINERS = new Set(["+", "＋"]);
const CJK_CHAR = /[぀-ヿ\p{Script=Han}]/u;
/** 纸上怎么写：中日文两个字之间不画弧，拉丁字母之间画「‿」。 */
export const lyricShow = (s: string): string => s.split(ELISION).reduce((a, b) => (!a ? b : CJK_CHAR.test(a.slice(-1)) && CJK_CHAR.test(b.slice(0, 1)) ? a + b : `${a}${ELISION}${b}`), "");
/** 歌词框里怎么写：连字弧写回「+」（好改）。 */
export const lyricEdit = (s: string): string => s.split(ELISION).join("+");

const SMALL = new Set([..."ゃゅょぁぃぅぇぉゎゕゖャュョァィゥェォヮヵヶ", "っ", "ッ"]);
const MELISMA = new Set(["ー", "~", "～", "_", "＿"]);
const isKana = (c: string) => /[぀-ゟ゠-ヿ]/.test(c);
const isHan = (c: string) => /\p{Script=Han}/u.test(c);
const isLatin = (c: string) => /[A-Za-z'’]/.test(c);

export function splitSyllables(text: string): Syl[] {
  const out: Syl[] = [];
  const chars = [...text.normalize("NFC")];
  let join = false, leadJoin = false;
  const push = (s: Syl) => {   // 前面有「+」= 并进上一个音节（这一段里还没有上一个 = 记成 joinPrev，交给调用方并进前一个音）
    if (join && s.text !== MELISMA_MARK) {
      const last = out[out.length - 1];
      if (last && last.text !== MELISMA_MARK) { last.text += ELISION + s.text; last.hyph = s.hyph; join = false; return; }
      if (!last && leadJoin) { out.push({ ...s, joinPrev: true }); join = false; return; }
    }
    join = false; out.push(s);
  };
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (JOINERS.has(c)) { join = true; if (!out.length) leadJoin = true; continue; }
    if (MELISMA.has(c)) { push({ text: MELISMA_MARK, hyph: false }); continue; }
    if (c === "-" || c === "－") { push({ text: MELISMA_MARK, hyph: false }); continue; }   // 单独的 -（词里的 - 在拉丁分支处理）
    if (SMALL.has(c)) { const last = out[out.length - 1]; if (last && last.text !== MELISMA_MARK) last.text += c; else out.push({ text: c, hyph: false }); continue; }
    if (isKana(c) || isHan(c)) { push({ text: c, hyph: false }); continue; }
    if (isLatin(c)) {
      let w = c;
      while (i + 1 < chars.length) {
        const n = chars[i + 1];
        if (isLatin(n)) { w += n; i++; continue; }
        if ((n === "-" || n === "－") && i + 2 < chars.length && isLatin(chars[i + 2])) { push({ text: w, hyph: true }); w = ""; i++; continue; }
        break;
      }
      if (w) push({ text: w, hyph: false });
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

/** 「+」开头的那个字并进下标 i 之前最近的那个有歌词的音（歌词框已经跳到下一个音了）；前面没有 = 原样。 */
export function joinIntoPrev(st: EditorState, i: number, text: string): EditorState {
  const p = prevLyricSlot(st.song.tokens, i), t = st.song.tokens[p] as NoteTok | undefined;
  if (!t || !t.lyric || t.lyric === MELISMA_MARK) return st;
  const tokens = st.song.tokens.slice();
  tokens[p] = { ...t, lyric: t.lyric + ELISION + text };
  return { ...st, song: { ...st.song, tokens } };
}
/** 下一个能放歌词的音（跳过休止、小节线、调号、tie 音）；没有 = -1。 */
export function nextLyricSlot(tokens: Token[], i: number): number { for (let j = i + 1; j < tokens.length; j++) if (lyricSlot(tokens[j])) return j; return -1; }
export function prevLyricSlot(tokens: Token[], i: number): number { for (let j = i - 1; j >= 0; j--) if (lyricSlot(tokens[j])) return j; return -1; }
export { lyricSlot };
