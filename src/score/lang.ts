// lang.ts —— 歌词每个音节唱哪种语言：按文字系统认。created 2026-10-07 by Claude Opus 5.5
// 持久化第 6 题（user 选「每个音节都写明」）：存档时每个音节都写明语言（MusicXML `<text xml:lang>`），编辑时自动认——
//   有假名 → 日；拉丁字母（且没有假名汉字）→ 英；只有汉字 → 跟前一个音节；一条声部开头就是汉字 → 跟这条声部的默认语言。
//   2026-11-12 夜（统筹「v0.17.12 收」第三件）：音符上不再记 lang；存档的 xml:lang 是程序按唱的规矩写出去的，读的时候不看。
// 唱 / 画灰不用这里的逐音节规则，按小月相唱的那一段判（engine/timeline.ts sungPlan：一段里有假名 = 日、只有汉字 = 中；user 2026-10-13「每一段里面有假名就算日文」
//   「就是句子的单位」「用同一个深模块」）。段要歌手的分段设置 + 速度表，这里够不着，存档标注暂仍逐音节；两者只在「日语段后面紧跟中文段」的第一个字上可能不一致。
//   edited by Claude Fable 5.1 / Claude Opus 5.5 2026-10-13
import type { Token } from "./song.ts";
import { MELISMA_MARK } from "./lyrics.ts";

const KANA = /[぀-ヿㇰ-ㇿｦ-ﾟ]/, HAN = /\p{Script=Han}/u, LATIN = /[A-Za-z]/;

/** 一段文字按文字系统唱哪种语言（唱 / 画灰按段用它：喂小月相一段的字，timeline.ts sungPlan）：有假名 → 日；有汉字（没假名）→ 中；拉丁字母 → 英；都没有（数字 / 符号 / 空）→ null = 跟前面的。 */
export const scriptLang = (lyric: string): "ja" | "zh" | "en" | null => (KANA.test(lyric) ? "ja" : HAN.test(lyric) ? "zh" : LATIN.test(lyric) ? "en" : null);

/** 这条声部的默认语言：整条歌词里有假名 → 日；只有汉字 → 中；只有拉丁字母 → 英；什么都没有 → 日。 */
export function partDefaultLang(tokens: Token[]): string {
  const ls = tokens.flatMap((t) => (t.kind === "note" && t.lyric && t.lyric !== MELISMA_MARK ? [t.lyric] : [])).join("");
  if (KANA.test(ls)) return "ja";
  if (HAN.test(ls)) return "zh";
  if (LATIN.test(ls)) return "en";
  return "ja";
}

/** 每个下标按逐音节规矩认的语言（有歌词、不含拖腔记号的音符 = 语言，别的 = null）。只在没给唱的那一份语言时写 xml:lang 用（project.ts 存档给的是唱的那一份）。 */
export function syllableLangs(tokens: Token[]): (string | null)[] {
  const def = partDefaultLang(tokens);
  let prev = def;
  return tokens.map((t) => {
    if (t.kind !== "note" || !t.lyric || t.lyric === MELISMA_MARK) return null;
    const l = KANA.test(t.lyric) ? "ja" : HAN.test(t.lyric) ? prev : LATIN.test(t.lyric) ? "en" : prev;
    prev = l;
    return l;
  });
}
