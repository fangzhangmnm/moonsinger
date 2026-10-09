// lyric-check.ts —— 台上这位唱不出来的歌词（画灰 + 明说）。created 2026-10-08 by Claude Opus 5.5
// 纪律（user 2026-10-08「不能成功发音识别的歌词也标灰，我觉得这个可以变成这个项目的纪律了哈哈」；CLAUDE.md「纪律：做不到的一律画灰 + 明说」）：
//   照写、照存、不替人改，只是在谱上画灰、在看得见的地方说清楚为什么。
// 只有月读唱字：元音版只哼（ら / ん / う / あ）、乐器不唱 → 整条歌词都灰（这位不唱字）。
// 月读一条声部按一种语言唱（main.ts songLangOf）；唱法核心按读音数拍，一个音一拍（src/singer/sing-core.mjs「sung syllables in the text」）：
//   日语：汉字的读音几拍说不准（星 = ほし 两拍）、字母 / 数字会被念成别的、一个音上两拍（ラー）→ 拍数对不上，整条不出声；
//   中文：一个音一个汉字；英文：拉丁字母（词典查不到的现在查不出来）。小字 / 促音自己占一个音是可以的（lab-score 兜住）。
import type { Token } from "./song.ts";
import { MELISMA_MARK, ELISION, isSmallKana } from "./lyrics.ts";

export type LyricWhy = "notSung" | "kanji" | "beats" | "script";
export interface LyricIssue { why: LyricWhy; beats?: number }
const HAN = /\p{Script=Han}/u, KANA = /[぀-ヿ]/, LATIN = /[A-Za-z]/;

/** 一段假名几拍：小字（ゃ / っ…）不算、ー 算一拍。 */
export const kanaBeats = (s: string): number => [...s].filter((c) => !isSmallKana(c)).length;

/** engine = 台上这位的引擎（tsukuyomi / vowel-sampler / soundfont；没人 / 认不出 = 不逐个画灰，整条本来就不出声）；lang = 这条声部用哪种语言唱。
 *  返回 下标 → 为什么。 */
export function lyricIssues(tokens: Token[], engine: string | null | undefined, lang: "ja" | "zh" | "en"): Map<number, LyricIssue> {
  const out = new Map<number, LyricIssue>();
  if (engine !== "tsukuyomi" && engine !== "vowel-sampler" && engine !== "soundfont") return out;
  tokens.forEach((t, i) => {
    if (t.kind !== "note" || t.tie || !t.lyric || t.lyric === MELISMA_MARK) return;
    if (engine !== "tsukuyomi") { out.set(i, { why: "notSung" }); return; }
    for (const part of t.lyric.split(ELISION).filter(Boolean)) {
      if (lang === "ja") {
        if (isSmallKana(part)) continue;   // 小字 / 促音自己占一个音：唱的那一路并进前一个音节
        if (HAN.test(part)) { out.set(i, { why: "kanji" }); return; }
        if (!/^[぀-ヿー]+$/.test(part)) { out.set(i, { why: "script" }); return; }
        const b = kanaBeats(part); if (b !== 1) { out.set(i, { why: "beats", beats: b }); return; }
      } else if (lang === "zh") {
        if (KANA.test(part) || LATIN.test(part) || !HAN.test(part)) { out.set(i, { why: "script" }); return; }
        const b = [...part].filter((c) => HAN.test(c)).length; if (b !== 1) { out.set(i, { why: "beats", beats: b }); return; }
      } else if (HAN.test(part) || KANA.test(part) || !LATIN.test(part)) { out.set(i, { why: "script" }); return; }
    }
  });
  return out;
}

/** 给人看的那句话。 */
export function lyricWhyText(x: LyricIssue, engineName: string, lang: "ja" | "zh" | "en"): string {
  if (x.why === "notSung") return `${engineName}不唱歌词（只哼 / 只弹）；歌词照写照存`;
  if (x.why === "kanji") return "汉字：月读按读音数拍，一个字可能好几拍、对不上音——写成假名";
  if (x.why === "beats") return `一个音上 ${x.beats} 拍：月读一个音唱一拍——拆成 ${x.beats} 个音，或者用「+」连着写`;
  return lang === "ja" ? "这条按日语唱：字母 / 数字 / 符号念不准——写成假名" : lang === "zh" ? "这条按中文唱：一个音写一个汉字" : "这条按英文唱：写拉丁字母";
}
