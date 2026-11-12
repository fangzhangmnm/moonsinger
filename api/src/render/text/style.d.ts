/** 字体：sans = 正文的无衬线（和界面同一套）；serif = 衬线（和弦级数、cresc.）；lyric = 歌词（日文汉字优先日本字形）。 */
export type TextFace = "sans" | "serif" | "lyric";
/** 尺子：staff = 跟谱（紧凑档跟着谱缩）；text = 跟字（紧凑档照舒适档那么大，刀 2）。 */
export type TextRuler = "staff" | "text";
export interface TextStyle {
    face: TextFace;
    weight: 400 | 600 | 700;
    italic: boolean; /** 字号（线间距的倍数）。 */
    em: number;
    ruler: TextRuler;
}
export declare const TEXT_FACES: Record<TextFace, string>;
/** 速度那一串的字号（线间距）；「1=X」、和弦级数、风格记号和它一样大。 */
export declare const TEMPO_EM = 1.35;
/** 歌词的字号（线间距；跟谱）。 */
export declare const LYRIC_EM = 1.6;
/** 歌词在两档里长什么样（v0.16.44；user 11-09「字号可以稍微大一点，窄窄的字好看」→ 紧凑档挑了 B；「舒适版和紧凑版都有一个固定的字高，然后这个字高就永远不要动了。如果挤不下的话，是收宽度，不是收字高」）：
 *  k = 字号是歌词基准字号（LYRIC_EM，跟谱）的几倍——字高就这么定、永远不动；sx = 平常的宽度（1 = 不压）。挤了只往下收宽度，最窄 LYRIC_MIN_SX。
 *  gapFloor = 挤到底时词和词之间至少留多宽（线间距；v0.16.48 起 0.2，AI 定的数——v0.16.70 起按档各给一个；user 11-09 看了 0.2 / 0.35 / 0.5 的样张：「0.2看着舒服」，两档都 0.2；计划书 ai-docs/20261109-plan-text-engine.md 第 5 步）。*/
export declare const LYRIC_LOOK: {
    readonly cozy: {
        readonly k: 1;
        readonly sx: 1;
        readonly gapFloor: 0.2;
    };
    readonly compact: {
        readonly k: 1.15;
        readonly sx: 0.85;
        readonly gapFloor: 0.2;
    };
};
/** 挤的时候歌词最窄压到原宽的几成（乘在 LYRIC_LOOK.sx 上）；再挤 = 照写、画灰。 */
export declare const LYRIC_MIN_SX = 0.5;
/** 方块字（中日韩）：宽度跟整段统一（user 11-09「中文和日文本身有方块字的美感…统一宽度…甚至是整篇曲段统一宽度」）；别的（英文…）每个音节各收各的（「宽窄的节奏」）。 */
export declare const isBlockScript: (s: string) => boolean;
/** 谱上每一种字（键 = 样式类）。改字的样子只改这里。 */
export declare const TEXT_STYLES: {
    "song-title": TextStyle;
    credits: TextStyle;
    arr: TextStyle;
    "arr-label": TextStyle;
    "arr-issue": TextStyle;
    "paper-name": TextStyle;
    "part-name": TextStyle;
    "part-badge": TextStyle;
    "tempo-word": TextStyle;
    "tempo-num": TextStyle;
    "tempo-change": TextStyle;
    "key-label": TextStyle;
    /** 专业模式 C 调的淡「1=C」（覆盖层写、不印）：和「1=F」一样跟谱。 */
    "key-hint": TextStyle;
    "groove-mark": TextStyle;
    "chord-tag": TextStyle;
    "nav-word": TextStyle;
    "nav-mark": TextStyle;
    "bar-no": TextStyle;
    "page-no": TextStyle;
    lyric: TextStyle;
    ottava: TextStyle;
    "breath-label": TextStyle;
    "dyn-word": TextStyle;
    "dyn-implied": TextStyle;
    "jp-digit": TextStyle;
    "jp-acc": TextStyle;
    "jp-head": TextStyle;
};
export type TextRole = keyof typeof TEXT_STYLES;
/** 一个字图元的样式：样式类里最后一个在表里的词（越往后越具体：「tempo tempo-word」→ tempo-word、「nav-mark nav-word」→ nav-word）；都不在 = 正文默认。 */
export declare function textStyleOf(cls: string | undefined): TextStyle;
/** 这种字多大（px）：sp = 线间距，ts = 字的尺子比例（紧凑档 1.4）。 */
export declare function textPx(role: TextRole, sp: number, ts?: number): number;
/** CSS font 简写（量字用：canvas ctx.font）。 */
export declare function textFont(st: TextStyle, px: number): string;
/** 屏幕上的样式表（score-view 装一次）：每种字的字体 / 粗细 / 斜体。scope = 谱的 svg 的类。 */
export declare function textStyleCss(scope?: string): string;
