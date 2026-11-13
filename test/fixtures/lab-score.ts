// 测试用的 toLabScore：和 src/score/lab-score.ts 同一个函数，只是没给的参数按出厂的那一份补（语言 = 日语、记号表 = 模板里小月相那一张）。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）：16-4 A 起出声那一层的 toLabScore 不带默认（记号表必须给），测试在这里补上出厂值。
import { toLabScore as real, type SingLang } from "../../src/score/lab-score.ts";
import { SING_MARKS } from "../../src/format/template.ts";
import type { SingMark } from "../../src/format/performance.ts";
import type { Token, TempoMap } from "../../src/score/song.ts";
import type { Hum } from "../../src/format/contract.ts";
export function toLabScore(tokens: Token[], hum: Hum, lang: SingLang = "ja", tempoMap?: TempoMap, sing: Record<string, SingMark | null> = SING_MARKS, range?: readonly [number, number], tokenEntry?: Map<number, number>) {
  return real(tokens, hum, lang, tempoMap, sing, range, tokenEntry);
}
