// text/style.ts —— 谱上的字：一张样式表。created 2026-11-09 by Claude Opus 5.5（原 src/render/text-style.ts；2026-11-09 搬进文字模块 src/render/text/，内容没改）
//   user 11-09（截图「Andante ♩ = 90」「1=C mf」）：「这些字体也应该对齐吧，能不能深模块窄接口统一一下风格」。
//   以前字的样式散在四处：CSS 定字体 / 粗细 / 斜体，排版器各处自己写字号，PDF 另有一份粗体 / 斜体名单，覆盖层（「1=C」）自己估基线——四份对不上。
//   现在：谱上每一种字一行（按样式类认，= 图元 cls 里的一个词），写明字体 / 粗细 / 斜体 / 几号字 / 跟哪把尺子。
//   排版（字号、量字）、屏幕（textStyleCss 生成的样式表）、PDF（粗 / 斜）、覆盖层（字体 + 真基线）都只查这一张表。
//   窄接口：textStyleOf(cls) / textPx(role, sp, ts) / textStyleCss()。颜色不在这里（颜色是状态：灰 = 推定 / 不认、强调色 = 选中，归 CSS）。
//   17-2（2026-11-13）：字号表、歌词两档、小字补粗挪到 src/look/text.ts（规则的数归「现在怎么画」那个模块）；这里留字体、认样式类、量字用的 font 串和屏幕样式表。

import { TEXT_STYLES, LYRIC_EM, smallWeight, GHOST_DIGIT_K, type TextFace, type TextStyle, type TextRole } from "../../look/text.ts";
export { TEXT_STYLES, TEMPO_EM, LYRIC_EM, LYRIC_LOOK, LYRIC_MIN_SX, STEM_REGULAR, BOLD_STROKE, SMALL_STEM_K, smallWeight, GHOST_DIGIT_K, type TextFace, type TextRuler, type TextStyle, type TextRole } from "../../look/text.ts";

export const TEXT_FACES: Record<TextFace, string> = {
  sans: `system-ui, -apple-system, "PingFang SC", "Hiragino Sans", "Noto Sans CJK SC", sans-serif`,
  serif: `"Noto Serif", "Times New Roman", Times, Georgia, serif`,
  // 和弦标（v0.17.36，统筹 796e524b）：随 app 发的子集（styles.css @font-face，vendor/fonts/serif/chord-serif.ttf = Noto Serif SemiBold 里和弦标用得到的那几十个字）。
  //   字体还没载到时先用后面的（字的位置照字宽表排、不量，所以载到之后只换字形、不挪位置）；font-display: swap。
  chord: `"MoonSinger Chord", "Noto Serif", "Times New Roman", Times, Georgia, serif`,
  lyric: `system-ui, "Hiragino Sans", "PingFang SC", "Noto Sans CJK JP", sans-serif`,
};

/** 方块字（中日韩）：宽度跟整段统一（user 11-09「中文和日文本身有方块字的美感…统一宽度…甚至是整篇曲段统一宽度」）；别的（英文…）每个音节各收各的（「宽窄的节奏」）。 */
export const isBlockScript = (s: string): boolean => /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af\uff66-\uff9f]/.test(s);

/** 同一种字的变体（样式类里同时有这两个词）：只改粗细。 */
const VARIANTS: { role: TextRole; when: string; weight: 400 | 600 | 700 }[] = [{ role: "part-name", when: "empty", weight: 400 }, { role: "jp-digit", when: "art-ghost", weight: smallWeight(GHOST_DIGIT_K) }];   // 幽灵音的小数字：补粗（7-P）
const DEFAULT: TextStyle = { face: "sans", weight: 400, italic: false, em: LYRIC_EM, ruler: "staff" };   // 样式类都不在表里 = 正文（原来 s("sans", LYRIC_EM, "staff")，同一个值）

/** 一个字图元的样式：样式类里最后一个在表里的词（越往后越具体：「tempo tempo-word」→ tempo-word、「nav-mark nav-word」→ nav-word）；都不在 = 正文默认。 */
export function textStyleOf(cls: string | undefined): TextStyle {
  const words = (cls ?? "").split(/\s+/).filter(Boolean);
  const role = words.filter((w): w is TextRole => w in TEXT_STYLES).pop();
  if (!role) return DEFAULT;
  const v = VARIANTS.find((x) => x.role === role && words.includes(x.when));
  return v ? { ...TEXT_STYLES[role], weight: v.weight } : TEXT_STYLES[role];
}
/** 这种字多大（px）：sp = 线间距，ts = 字的尺子比例（紧凑档 1.4）。 */
export function textPx(role: TextRole, sp: number, ts = 1): number { const st = TEXT_STYLES[role]; return st.ruler === "text" ? st.em * sp * ts : st.em * sp; }
/** CSS font 简写（量字用：canvas ctx.font）。 */
export function textFont(st: TextStyle, px: number): string { return `${st.italic ? "italic " : ""}${st.weight} ${px}px ${TEXT_FACES[st.face]}`; }
/** 屏幕上的样式表（score-view 装一次）：每种字的字体 / 粗细 / 斜体。scope = 谱的 svg 的类。 */
export function textStyleCss(scope = ".staff-svg"): string {
  // :not([font-family]) = 只管字，不碰乐谱字形（字形的 <text> 带 font-family="Bravura" 属性；CSS 规则会盖过属性——八度线的字形也叫 ottava，踩过：整张谱的字形被换成无衬线）
  const rule = (sel: string, st: Pick<TextStyle, "face" | "weight" | "italic">) => `${scope} text.${sel}:not([font-family]){font-family:${TEXT_FACES[st.face]};font-weight:${st.weight};font-style:${st.italic ? "italic" : "normal"}}`;
  return [
    ...Object.entries(TEXT_STYLES).map(([k, st]) => rule(k, st)),
    ...VARIANTS.map((v) => rule(`${v.role}.${v.when}`, { ...TEXT_STYLES[v.role], weight: v.weight })),
  ].join("\n");
}
