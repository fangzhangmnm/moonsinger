import type { LyricGaps } from "../render/text/index.ts";
/** 字体：sans = 正文的无衬线（和界面同一套）；serif = 衬线（cresc. 这类）；lyric = 歌词（日文汉字优先日本字形）；
 *  chord = 和弦标（随 app 发的那款衬线半粗子集，v0.17.36：屏幕、字宽表、PDF 轮廓同一款字；只给和弦标用）。 */
export type TextFace = "sans" | "serif" | "lyric" | "chord";
/** 尺子：staff = 跟谱（紧凑档跟着谱缩）；text = 跟字（紧凑档照舒适档那么大，刀 2）。 */
export type TextRuler = "staff" | "text";
export interface TextStyle {
    face: TextFace;
    weight: 400 | 600 | 700;
    italic: boolean; /** 字号（线间距的倍数）。 */
    em: number;
    ruler: TextRuler;
}
/** 小字补粗（7-P，user 11-12「记得latex的上下标的处理方法」；统筹的读法：缩小画的字，笔画要和旁边的主字看起来是一家的，缩得越小补得越多）。
 *  主字的竖笔 = Noto Sans SC Regular 的「I」量出来 0.092 字号（test/text-style.test.ts 拿 vendor 里那款字核着）；目标 = 主字竖笔 × 0.9；
 *  缩成主字的 k 倍之后，在常规 / 半粗里挑竖笔最接近目标的。半粗在 PDF 里 = 描边 BOLD_STROKE 字号（src/export/pdf.ts 同一个数，测试核着），屏幕 = CSS 600。 */
export declare const STEM_REGULAR = 0.092, BOLD_STROKE = 0.035, SMALL_STEM_K = 0.9;
export declare function smallWeight(k: number): 400 | 600;
/** 和弦标里的升降号和旁边的字之间看得见的缝（墨到墨，字号的倍数；v0.17.34，统筹 134f74e4「升降号贴着它所属的字」）：
 *  tight = 贴着它所属的那个字（B♭ 的 B、♭VII 的 V）——比这款衬线半粗字和字之间看得见的缝的中位 0.06 小一点；loose = 另一边（B♭ 和后面的 7），比字距大，读成「B♭ 7」不是「B ♭7」。
 *  数是 AI 照量出来的字距起的（施工 Claude Opus 5.5），好不好看归 user 看图。 */
export declare const CHORD_ACC_GAP: {
    readonly tight: 0.05;
    readonly loose: 0.1;
};
/** 和弦标里的升降号比谱头「1=♭B」那一套的升降号大多少（v0.17.36；user 看了两档的放大图「可以用大一点的」= 1.2 倍）。只管和弦标，谱头那一套不动。 */
export declare const CHORD_ACC_SCALE = 1.2;
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
    "jp-letter-sup": TextStyle;
    "jp-letter-sub": TextStyle;
    "jp-chord": TextStyle;
    "jp-tuplet": TextStyle;
    "jp-dyn": TextStyle;
    "jp-legend": TextStyle;
};
export type TextRole = keyof typeof TEXT_STYLES;
/** 幽灵音（演奏法）的数字画小一号：几成（同 render/jianpu/glyphs.ts GHOST_K，测试核着）。 */
export declare const GHOST_DIGIT_K = 0.62;
/** 没量的时候的默认（测试 / 没有量字的宿主）：歌词字号 1.6 sp 的系统无衬线体，空格约 0.27 字宽、连字符约 0.33 字宽。 */
export declare const LYRIC_SPACE = 0.6, HYPHEN_SX = 0.8, GAP_MIN = 0.5;
/** 缝再挤也至少留这么宽（sp）：能看出是两个词（user「只要能勉强看出节奏就行了」；v0.16.48 第一版没有底线 = 英文连成一片「bovetheworld」）。排版器按档传（LyricGaps.floor ← LYRIC_LOOK.gapFloor）；这个是没给时的默认。 */
export declare const GAP_FLOOR = 0.2;
export declare const DEFAULT_GAPS: LyricGaps;
