import { type TextFace, type TextStyle, type TextRole } from "../../look/text.ts";
export { TEXT_STYLES, TEMPO_EM, LYRIC_EM, LYRIC_LOOK, LYRIC_MIN_SX, STEM_REGULAR, BOLD_STROKE, SMALL_STEM_K, smallWeight, GHOST_DIGIT_K, type TextFace, type TextRuler, type TextStyle, type TextRole } from "../../look/text.ts";
export declare const TEXT_FACES: Record<TextFace, string>;
/** 方块字（中日韩）：宽度跟整段统一（user 11-09「中文和日文本身有方块字的美感…统一宽度…甚至是整篇曲段统一宽度」）；别的（英文…）每个音节各收各的（「宽窄的节奏」）。 */
export declare const isBlockScript: (s: string) => boolean;
/** 一个字图元的样式：样式类里最后一个在表里的词（越往后越具体：「tempo tempo-word」→ tempo-word、「nav-mark nav-word」→ nav-word）；都不在 = 正文默认。 */
export declare function textStyleOf(cls: string | undefined): TextStyle;
/** 这种字多大（px）：sp = 线间距，ts = 字的尺子比例（紧凑档 1.4）。 */
export declare function textPx(role: TextRole, sp: number, ts?: number): number;
/** CSS font 简写（量字用：canvas ctx.font）。 */
export declare function textFont(st: TextStyle, px: number): string;
/** 屏幕上的样式表（score-view 装一次）：每种字的字体 / 粗细 / 斜体。scope = 谱的 svg 的类。 */
export declare function textStyleCss(scope?: string): string;
