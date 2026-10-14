// lyric-check.ts —— 台上这位唱不出来的歌词（画灰 + 明说）。created 2026-10-08 by Claude Opus 5.5
// 纪律（user 2026-10-08「不能成功发音识别的歌词也标灰，我觉得这个可以变成这个项目的纪律了哈哈」；CLAUDE.md「纪律：做不到的一律画灰 + 明说」）：
//   照写、照存、不替人改，只是在谱上画灰、在看得见的地方说清楚为什么。
// 只有月读唱字：元音版只哼（ら / ん / う / あ）、乐器不唱 → 整条歌词都灰（这位不唱字）。
// 语言按小月相唱的那一段判（engine/timeline.ts sungPlan：一段里有假名 = 日、只有汉字 = 中、只有字母 = 英；唱和画灰同一份），langAt 由调用方给。
//   2026-10-13 之前整条声部一种语言（songLangOf）：日文歌换中文翻译时每个汉字都灰（user「每一段里面有假名就算日文」「就是句子的单位」「用同一个深模块」；edited by Claude Fable 5.1 / Claude Opus 5.5）。
// 唱法核心按读音数拍，一个音一拍（src/singer/sing-core.mjs「sung syllables in the text」）：
//   日语：汉字的读音几拍说不准（星 = ほし 两拍）、字母 / 数字会被念成别的、一个音上两拍（ラー）→ 拍数对不上，整条不出声；
//   中文：一个音一个汉字；英文：拉丁字母（词典查不到的现在查不出来）。小字 / 促音自己占一个音是可以的（lab-score 兜住）。
import type { Token } from "./song.ts";
import { MELISMA_MARK, ELISION, isSmallKana } from "./lyrics.ts";

export type LyricWhy = "notSung" | "kanji" | "beats" | "script";
export type LyricLang = "ja" | "zh" | "en";
export interface LyricIssue { why: LyricWhy; beats?: number; /** 这个字所在的句按哪种语言唱（提示文案用）。 */ lang: LyricLang }
const HAN = /\p{Script=Han}/u, KANA = /[぀-ヿ]/, LATIN = /[A-Za-z]/;

/** 一段假名几拍：小字（ゃ / っ…）不算、ー 算一拍。 */
export const kanaBeats = (s: string): number => [...s].filter((c) => !isSmallKana(c)).length;

/** engine = 台上这位的引擎（tsukuyomi / vowel-sampler / soundfont；没人 / 认不出 = 不逐个画灰，整条本来就不出声）；langAt = 下标 i 的字所在的句按哪种语言唱（一种语言也行：直接给字符串）。
 *  返回 下标 → 为什么。 */
/** lyrics = 台上这位唱不唱字（插件能力，ADR-0004：words 唱字 / hum 只哼 / none 不唱）；null = 没人上场 = 不画灰（照旧能写，多半等着请人）。 */
export function lyricIssues(tokens: Token[], lyrics: "words" | "hum" | "none" | null | undefined, langAt: LyricLang | ((i: number) => LyricLang)): Map<number, LyricIssue> {
  const out = new Map<number, LyricIssue>();
  if (!lyrics) return out;
  tokens.forEach((t, i) => {
    if (t.kind !== "note" || t.tie || !t.lyric || t.lyric === MELISMA_MARK) return;
    const lang = typeof langAt === "string" ? langAt : langAt(i);
    if (lyrics !== "words") { out.set(i, { why: "notSung", lang }); return; }
    for (const part of t.lyric.split(ELISION).filter(Boolean)) {
      if (lang === "ja") {
        if (isSmallKana(part)) continue;   // 小字 / 促音自己占一个音：唱的那一路并进前一个音节
        if (HAN.test(part)) { out.set(i, { why: "kanji", lang }); return; }
        if (!/^[぀-ヿー]+$/.test(part)) { out.set(i, { why: "script", lang }); return; }
        const b = kanaBeats(part); if (b !== 1) { out.set(i, { why: "beats", beats: b, lang }); return; }
      } else if (lang === "zh") {
        if (KANA.test(part) || LATIN.test(part) || !HAN.test(part)) { out.set(i, { why: "script", lang }); return; }
        const b = [...part].filter((c) => HAN.test(c)).length; if (b !== 1) { out.set(i, { why: "beats", beats: b, lang }); return; }
      } else if (HAN.test(part) || KANA.test(part) || !LATIN.test(part)) { out.set(i, { why: "script", lang }); return; }
    }
  });
  return out;
}

/** 给人看的那句话。 */
export function lyricWhyText(x: LyricIssue, engineName: string): string {
  if (x.why === "notSung") return `${engineName}不唱歌词（只哼 / 只弹）；歌词照写照存`;
  if (x.why === "kanji") return "这一段有假名、按日语唱：汉字小月相按读音数拍，一个字可能好几拍、对不上音——写成假名（一段都是汉字才按中文唱；段 = 歌手牌里的「分段唱」）";
  if (x.why === "beats") return `一个音上 ${x.beats} 拍：小月相一个音唱一拍——拆成 ${x.beats} 个音，或者用「+」连着写`;
  return x.lang === "ja" ? "这一段按日语唱：字母 / 数字 / 符号念不准——写成假名" : x.lang === "zh" ? "这一段按中文唱：一个音写一个汉字" : "这一段按英文唱：写拉丁字母";
}

/** 引擎念成什么的显示（v0.9.34，歌词框下面那条）：日语前端的音素写成好认的样子——ん（N_n / N_m / N_ng…）= n，促音 cl = 双写下一个辅音（cl + ch = tch）；
 *  几拍的「-」照留。中文照原样（国际音标 + 声调数字，不硬转拼音：转错了比不转更误导）。 */
export function prettyReading(lang: string, x: string): string {
  return lang !== "ja" ? x : x.split("-").map((y) => y.replace(/N_[a-z]+/g, "n").replace(/^clch/, "tch").replace(/^cl([a-z])/, "$1$1")).join("-");
}
