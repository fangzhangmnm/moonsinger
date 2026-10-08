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

import { type EditorState, type NoteTok, type Token, unitDur, tr, withTrack } from "./song.ts";

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
/** 整段都是小字（っ / ゃゅょ / ぁぃぅぇぉ…）：唱的时候自己不成拍，归前一个音节（lab-score.ts）。促音 = っ / ッ（唱出来是前一个音节后面的一下停顿）。
 *  打字照原样（输入法上屏几次、小字落在哪个音上就在哪个音上；user 2026-10-08「我大tsu小tsu大yo小yo确实分不清」——不替人改歌词，唱的那一路兜住）。 */
export const isSmallKana = (s: string): boolean => !!s && [...s].every((c) => SMALL.has(c));
export const isSokuon = (s: string): boolean => !!s && [...s].every((c) => c === "っ" || c === "ッ");
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
  const tokens: Token[] = tr(st).slice();
  let nextId = st.nextId, i = start, last = -1;
  for (const s of syl) {
    while (i < tokens.length && !lyricSlot(tokens[i])) i++;
    if (i < tokens.length) tokens[i] = { ...(tokens[i] as NoteTok), lyric: s.text, hyph: s.hyph || undefined };
    else tokens.push({ kind: "note", id: nextId++, pitch: null, dur: unitDur(st.input), lyric: s.text, hyph: s.hyph || undefined });
    last = i; i++;
  }
  return { st: { ...st, song: withTrack(st.song, st.at.paper, st.at.part, tokens), nextId }, last };
}

/** 一整行歌词贴到谱上（粘贴用）：光标后第一个音起；光标在末尾时从第一个还没有歌词的音起。光标不动（詞先之后接着用数字填音高）。 */
export function applyLyricLine(st: EditorState, text: string): EditorState {
  const syl = splitSyllables(text);
  if (!syl.length) return st;
  const tokens = tr(st);
  let start: number;
  if (st.caret >= tokens.length && !st.sel) { start = tokens.findIndex((t) => lyricSlot(t) && t.lyric === null); if (start < 0) start = tokens.length; }
  else start = st.sel ? st.sel.from : st.caret;
  return distributeFrom(st, start, syl).st;
}

/** 「+」开头的那个字并进下标 i 之前最近的那个有歌词的音（歌词框已经跳到下一个音了）；前面没有 = 原样。 */
export function joinIntoPrev(st: EditorState, i: number, text: string): EditorState {
  const p = prevLyricSlot(tr(st), i), t = tr(st)[p] as NoteTok | undefined;
  if (!t || !t.lyric || t.lyric === MELISMA_MARK) return st;
  const tokens = tr(st).slice();
  tokens[p] = { ...t, lyric: t.lyric + ELISION + text };
  return { ...st, song: withTrack(st.song, st.at.paper, st.at.part, tokens) };
}
/** 「合」：下标 i 那个音的字并进前一个有字的音（一个音上几个字），这一句（到下一个休止为止）后面的字依次往前挪一个音、这一句最后一个音空出来
 *  （user「打完回头改同意。这里的心流反而是输入。所以不应该提前按」：打字照常自动分，回头点一个字再合）。这个音 / 前一个音没有字（或是拖腔）= 原样。 */
export function mergeIntoPrev(st: EditorState, i: number): EditorState {
  const toks = tr(st), cur = toks[i], p = prevLyricSlot(toks, i), prev = toks[p];
  if (!cur || !lyricSlot(cur) || !cur.lyric || cur.lyric === MELISMA_MARK || !prev || !lyricSlot(prev) || !prev.lyric || prev.lyric === MELISMA_MARK) return st;
  const slots = [i];   // 这一句后面的歌词位：从 i 往后、到下一个「句」为止（跨休止符；user 2026-10-08「应该跨休止符」；此前到休止为止）
  for (let j = i + 1; j < toks.length; j++) { const t = toks[j]; if (t.kind === "phrase") break; if (lyricSlot(t)) slots.push(j); }
  const tokens = toks.slice();
  const merged: NoteTok = { ...prev, lyric: prev.lyric + ELISION + cur.lyric };
  if (cur.hyph) merged.hyph = true; else delete merged.hyph;
  tokens[p] = merged;
  slots.forEach((at, k) => {   // 字往前挪一个音（「词没完」和手动改过的语言跟着字走）
    const from = k + 1 < slots.length ? (toks[slots[k + 1]] as NoteTok) : null, t: NoteTok = { ...(toks[at] as NoteTok), lyric: from ? from.lyric : null };
    if (from?.hyph) t.hyph = true; else delete t.hyph;
    if (from?.lang) t.lang = from.lang; else delete t.lang;
    tokens[at] = t;
  });
  return { ...st, song: withTrack(st.song, st.at.paper, st.at.part, tokens) };
}
/** 一个音上的「一颗字」：字 + 词没完 + 手动改过的语言（挪的时候一起走）。 */
interface Bead { lyric: string | null; hyph?: boolean; lang?: string }
const beadOf = (t: NoteTok): Bead => ({ lyric: t.lyric, hyph: t.hyph, lang: t.lang });
function put(t: NoteTok, b: Bead): NoteTok {
  const o: NoteTok = { ...t, lyric: b.lyric };
  if (b.hyph) o.hyph = true; else delete o.hyph;
  if (b.lang) o.lang = b.lang; else delete o.lang;
  return o;
}
const hasText = (t: Token | undefined): boolean => !!t && t.kind === "note" && !!t.lyric && t.lyric !== MELISMA_MARK;
/** 这一句里 i 后面的歌词位（到「句」为止）/ i 前面最近的那个（隔着「句」= -1）。 */
function slotsAfter(toks: Token[], i: number): number[] { const out: number[] = []; for (let j = i + 1; j < toks.length; j++) { if (toks[j].kind === "phrase") break; if (lyricSlot(toks[j])) out.push(j); } return out; }
function slotBefore(toks: Token[], i: number): number { for (let j = i - 1; j >= 0; j--) { if (toks[j].kind === "phrase") return -1; if (lyricSlot(toks[j])) return j; } return -1; }
/** 往后一个音：这个字晚一个音起。后面的字被推着走，推到第一个空着的音（没字 / 拖腔）为止，那个空位被吃掉；
 *  空出来的音 = 拖腔（前面这一句里有字可拖），否则空着。一个音上几个字（合过的）= 只拿最后一个字往后挪（「合」的反操作）。推不动（后面没空位 / 是句尾）= null。 */
function stepRight(st: EditorState, i: number): { st: EditorState; at: number } | null {
  const toks = tr(st), cur = toks[i];
  if (!cur || !lyricSlot(cur) || !hasText(cur)) return null;
  const after = slotsAfter(toks, i), g = after.findIndex((j) => !hasText(toks[j]));
  if (g < 0) return null;
  const tokens = toks.slice(), parts = cur.lyric!.split(ELISION);
  let carry: Bead;
  if (parts.length > 1) { carry = { lyric: parts[parts.length - 1], hyph: cur.hyph, lang: cur.lang }; tokens[i] = put(cur, { lyric: parts.slice(0, -1).join(ELISION), lang: cur.lang }); }
  else { carry = beadOf(cur); const p = slotBefore(toks, i); tokens[i] = put(cur, { lyric: p >= 0 && (toks[p] as NoteTok).lyric !== null ? MELISMA_MARK : null }); }
  for (let n = 0; n <= g; n++) { const t = tokens[after[n]] as NoteTok, was = beadOf(t); tokens[after[n]] = put(t, carry); carry = was; }
  return { st: { ...st, song: withTrack(st.song, st.at.paper, st.at.part, tokens) }, at: after[0] };
}
/** 往前一个音：那个音有字 =「合」（mergeIntoPrev：并成一个音上几个字，这一句后面的字往前挪）；空着 / 拖腔 = 这个字早一个音起，原来那个音变成它的拖腔。 */
function stepLeft(st: EditorState, i: number): { st: EditorState; at: number; merged: boolean } | null {
  const toks = tr(st), cur = toks[i];
  if (!cur || !lyricSlot(cur) || !hasText(cur)) return null;
  const p = slotBefore(toks, i);
  if (p < 0) return null;
  if (hasText(toks[p])) { const n = mergeIntoPrev(st, i); return n === st ? null : { st: n, at: p, merged: true }; }
  const tokens = toks.slice();
  tokens[p] = put(toks[p] as NoteTok, beadOf(cur)); tokens[i] = put(cur, { lyric: MELISMA_MARK });
  return { st: { ...st, song: withTrack(st.song, st.at.paper, st.at.part, tokens) }, at: p, merged: false };
}
/** 长按一个字拖（2026-10-08 Opus 5.5；user「歌词的合能不能也改成长按拖动。不然每次点文本框是超级麻烦的」）：下标 i 那个音上的字挪 k 个音（k > 0 往后、k < 0 往前），
 *  一步一步走（见 stepRight / stepLeft），都只在这一句里（句号是边界）。「合」了就停（字已经不单独在一个音上了）；推不动也停。
 *  返回 at = 字现在在哪个音、done = 实际走了几步（< |k| = 没走完，调用方说一声）。 */
export function moveSyllable(st: EditorState, i: number, k: number): { st: EditorState; at: number; done: number } {
  let cur = st, at = i, done = 0;
  for (; done < Math.abs(k); done++) {
    if (k > 0) { const r = stepRight(cur, at); if (!r) break; cur = r.st; at = r.at; }
    else { const r = stepLeft(cur, at); if (!r) break; cur = r.st; at = r.at; if (r.merged) { done++; break; } }
  }
  return { st: cur, at, done };
}
/** 下一个能放歌词的音（跳过休止、小节线、调号、tie 音）；没有 = -1。 */
export function nextLyricSlot(tokens: Token[], i: number): number { for (let j = i + 1; j < tokens.length; j++) if (lyricSlot(tokens[j])) return j; return -1; }
export function prevLyricSlot(tokens: Token[], i: number): number { for (let j = i - 1; j >= 0; j--) if (lyricSlot(tokens[j])) return j; return -1; }
export { lyricSlot };
