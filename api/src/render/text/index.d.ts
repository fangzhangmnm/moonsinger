export { TEXT_FACES, TEXT_STYLES, TEMPO_EM, LYRIC_EM, LYRIC_LOOK, LYRIC_MIN_SX, isBlockScript, textStyleOf, textPx, textFont, textStyleCss, type TextFace, type TextRuler, type TextStyle, type TextRole } from "./style.ts";
export { fitLyrics, lyricBlockSx, hyphens, DEFAULT_GAPS, LYRIC_SPACE, HYPHEN_SX, GAP_MIN, GAP_FLOOR, type LyricFit, type LyricItem, type LyricGaps, type HyphenSyl } from "./lyric-fit.ts";
export { createTextMeasure, canvasMeasure, lyricFont, lyricLook, lyricWidth, lyricSizePx, type RawMeasure, type TextMeasure } from "./measure.ts";
export { faceMetrics, boxTopFor, INK_EST, type FaceMetrics } from "./baseline.ts";
