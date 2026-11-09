// text/index.ts —— 谱上的字：一个模块、一个入口。created 2026-11-10 by Claude Opus 5.5
//   user 11-09：「到时候让fable把文字排版引擎审核的时候写个计划书让opus做收成一个深模块窄接口」；计划书 = ai-docs/20261109-plan-text-engine.md（Fable 5.1 写）。
//   现在（第 1 步）：样式表（style.ts）+ 歌词让路和连字符摆哪（lyric-fit.ts）。之后：量字一把尺子（第 2 步）、基线一处定义（第 3 步）。
//   外面只从这里 import；里面的文件名不是接口。
export { TEXT_FACES, TEXT_STYLES, TEMPO_EM, LYRIC_EM, LYRIC_LOOK, LYRIC_MIN_SX, isBlockScript, textStyleOf, textPx, textFont, textStyleCss, type TextFace, type TextRuler, type TextStyle, type TextRole } from "./style.ts";
export { fitLyrics, lyricBlockSx, hyphens, DEFAULT_GAPS, LYRIC_SPACE, HYPHEN_SX, GAP_MIN, GAP_FLOOR, type LyricFit, type LyricItem, type LyricGaps, type HyphenSyl } from "./lyric-fit.ts";
