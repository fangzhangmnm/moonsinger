// lang.ts —— 歌词每个音节唱哪种语言：自动认 + 手动改过的。created 2026-10-07 by Claude Opus 5.5
// 持久化第 6 题（user 选「每个音节都写明」）：存档时每个音节都写明语言（MusicXML `<text xml:lang>`），编辑时自动认——
//   有假名 → 日；拉丁字母（且没有假名汉字）→ 英；只有汉字 → 跟前一个音节；一条声部开头就是汉字 → 跟这条声部的默认语言。
//   认错了才在音符上记 lang（只记和自动认不一样的），所以猜法以后改了，写明过的不变。
import type { Token } from "./song.ts";
import { MELISMA_MARK } from "./lyrics.ts";

const KANA = /[぀-ヿㇰ-ㇿｦ-ﾟ]/, HAN = /\p{Script=Han}/u, LATIN = /[A-Za-z]/;

/** 这条声部的默认语言：整条歌词里有假名 → 日；只有汉字 → 中；只有拉丁字母 → 英；什么都没有 → 日。 */
export function partDefaultLang(tokens: Token[]): string {
  const ls = tokens.flatMap((t) => (t.kind === "note" && t.lyric && t.lyric !== MELISMA_MARK ? [t.lyric] : [])).join("");
  if (KANA.test(ls)) return "ja";
  if (HAN.test(ls)) return "zh";
  if (LATIN.test(ls)) return "en";
  return "ja";
}

/** 每个下标的语言：有歌词（不含拖腔记号）的音符 = 语言，别的 = null。override = 用音符上记着的 lang（编辑 / 唱用）；false = 只算自动认的（判断要不要记）。 */
export function syllableLangs(tokens: Token[], override = true): (string | null)[] {
  const def = partDefaultLang(tokens);
  let prev = def;
  return tokens.map((t) => {
    if (t.kind !== "note" || !t.lyric || t.lyric === MELISMA_MARK) return null;
    let l = KANA.test(t.lyric) ? "ja" : HAN.test(t.lyric) ? prev : LATIN.test(t.lyric) ? "en" : prev;
    if (override && t.lang) l = t.lang;
    prev = l;
    return l;
  });
}

/** 读档用：每个音节读到的语言（null = 文件里没写）→ 只在和自动认（按前面已定的语言往后推）不一样的音符上记 lang。原地改 tokens 里的音符。 */
export function keepOnlyOverrides(tokens: Token[], read: (string | null)[]): void {
  const def = partDefaultLang(tokens);
  let prev = def;
  tokens.forEach((t, i) => {
    if (t.kind !== "note" || !t.lyric || t.lyric === MELISMA_MARK) return;
    const auto = KANA.test(t.lyric) ? "ja" : HAN.test(t.lyric) ? prev : LATIN.test(t.lyric) ? "en" : prev;
    const got = read[i];
    if (got && got !== auto) t.lang = got; else delete t.lang;
    prev = got ?? auto;
  });
}
