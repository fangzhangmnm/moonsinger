// text-style.ts —— 谱上的字：一张样式表。created 2026-11-09 by Claude Opus 5.5
//   user 11-09（截图「Andante ♩ = 90」「1=C mf」）：「这些字体也应该对齐吧，能不能深模块窄接口统一一下风格」。
//   以前字的样式散在四处：CSS 定字体 / 粗细 / 斜体，排版器各处自己写字号，PDF 另有一份粗体 / 斜体名单，覆盖层（「1=C」）自己估基线——四份对不上。
//   现在：谱上每一种字一行（按样式类认，= 图元 cls 里的一个词），写明字体 / 粗细 / 斜体 / 几号字 / 跟哪把尺子。
//   排版（字号、量字）、屏幕（textStyleCss 生成的样式表）、PDF（粗 / 斜）、覆盖层（字体 + 真基线）都只查这一张表。
//   窄接口：textStyleOf(cls) / textPx(role, sp, ts) / textStyleCss()。颜色不在这里（颜色是状态：灰 = 推定 / 不认、强调色 = 选中，归 CSS）。

/** 字体：sans = 正文的无衬线（和界面同一套）；serif = 衬线（和弦级数、cresc.）；lyric = 歌词（日文汉字优先日本字形）。 */
export type TextFace = "sans" | "serif" | "lyric";
/** 尺子：staff = 跟谱（紧凑档跟着谱缩）；text = 跟字（紧凑档照舒适档那么大，刀 2）。 */
export type TextRuler = "staff" | "text";
export interface TextStyle { face: TextFace; weight: 400 | 600 | 700; italic: boolean; /** 字号（线间距的倍数）。 */ em: number; ruler: TextRuler }

export const TEXT_FACES: Record<TextFace, string> = {
  sans: `system-ui, -apple-system, "PingFang SC", "Hiragino Sans", "Noto Sans CJK SC", sans-serif`,
  serif: `"Noto Serif", "Times New Roman", Times, Georgia, serif`,
  lyric: `system-ui, "Hiragino Sans", "PingFang SC", "Noto Sans CJK JP", sans-serif`,
};

const s = (face: TextFace, em: number, ruler: TextRuler, weight: 400 | 600 | 700 = 400, italic = false): TextStyle => ({ face, weight, italic, em, ruler });
/** 速度那一串的字号（线间距）；「1=X」、和弦级数、风格记号和它一样大。 */
export const TEMPO_EM = 1.35;
/** 歌词的字号（线间距；跟谱）。 */
export const LYRIC_EM = 1.6;

/** 谱上每一种字（键 = 样式类）。改字的样子只改这里。 */
export const TEXT_STYLES = {
  "song-title": s("sans", 2.8, "text", 600),
  credits: s("sans", 1.25, "text"),
  arr: s("sans", 1.25, "text"), "arr-label": s("sans", 1.25, "text"), "arr-issue": s("sans", 1.1, "text", 400, true),
  "paper-name": s("sans", 1.6, "text", 600),
  "part-name": s("sans", LYRIC_EM * 0.85, "text", 600), "part-badge": s("sans", 1.0, "text", 600),
  "tempo-word": s("sans", TEMPO_EM, "text", 600), "tempo-num": s("sans", TEMPO_EM, "text"), "tempo-change": s("sans", TEMPO_EM, "text", 700),
  "key-label": s("sans", TEMPO_EM, "text"),
  /** 专业模式 C 调的淡「1=C」（覆盖层写、不印）：跟谱（紧凑档不放大，不然挨上第一个音的力度字；刀 2）。 */
  "key-hint": s("sans", TEMPO_EM, "staff"),
  "groove-mark": s("sans", TEMPO_EM, "text", 600, true),
  "chord-tag": s("serif", TEMPO_EM, "text", 600),
  "nav-word": s("sans", TEMPO_EM * 1.05, "text", 600, true), "nav-mark": s("sans", TEMPO_EM * 1.05, "text", 600),   // 反复的字（房子「1.」、×3、D.C.…）：屏幕一直是粗的，PDF 原来印细的——统一成粗的
  "bar-no": s("sans", 1.05, "text"), "page-no": s("sans", 1.2, "text"),
  lyric: s("lyric", LYRIC_EM, "staff"),
  "phrase-mark": s("sans", 1.3, "staff"), ottava: s("sans", 1.3, "staff"), "breath-label": s("sans", 1.15, "staff"),
  "dyn-word": s("serif", 2.0, "staff", 400, true), "dyn-implied": s("sans", 1.3, "staff", 600, true),
} satisfies Record<string, TextStyle>;
export type TextRole = keyof typeof TEXT_STYLES;
/** 同一种字的变体（样式类里同时有这两个词）：只改粗细。 */
const VARIANTS: { role: TextRole; when: string; weight: 400 | 600 | 700 }[] = [{ role: "part-name", when: "empty", weight: 400 }];
const DEFAULT: TextStyle = s("sans", LYRIC_EM, "staff");

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
