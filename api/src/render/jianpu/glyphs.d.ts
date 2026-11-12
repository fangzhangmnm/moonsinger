/** 数字的字号（sp）和占多宽（样张 0.62 FS）。 */
export declare const DIGIT_EM = 2.5, DIGIT_W: number;
/** 数字的基线、上沿、中线（局部 y）。 */
export declare const BASE_Y = 2.95, DIGIT_TOP = 1.15, DIGIT_MID = 2.05;
/** 下划线：第一条在基线下 0.27 FS、条与条之间 0.18 FS、粗 0.059 FS（样张）；八度点：半径 0.082 FS、高八度的点中心在基线上 0.9 FS、点与点之间 0.227 FS（样张）。 */
export declare const UL_Y0: number, UL_GAP: number, UL_W: number, DOT_R: number, DOT_GAP: number, DOT_STEP: number;
/** 低八度的点（7-D，user「为什么最下面一个点间距这么开」「有下划线的时候点更低」）：和高八度的点对称——没有下划线 = 贴着数字的底（间隙 DOT_GAP，和高八度的点离数字顶一样）；
 *  有下划线 = 贴着最下面一条下划线的底（同样的间隙）。原来照样张脚本：先给下划线留位置、点放在留的位置下面（没下划线时在基线下 0.55 FS、有下划线再往下），
 *  样张本身的数偏大，app 照抄了。叠在上面的数字（和弦里不是最低的那几个）没有下划线：贴着自己的基线往下。 */
export declare const lowDotY: (nUL: number, j: number) => number;
export declare const LOW_DOT_UNDER: number;
/** 升降号（挂在数字左上）：字号 0.59 FS、中心离数字中心往左 0.465 FS、基线在数字基线上 0.364 FS；占多宽（光标让开它，样张这一列多 0.41 FS）。 */
export declare const ACC_EM: number, ACC_DX: number, ACC_Y: number, ACC_W: number;
/** 增时线（长音的「–」）：长 0.545 FS、粗 0.073 FS、在基线上 0.32 FS（样张）；两条之间至少隔一列的最小宽（样张 0.756 FS；放得开时一拍一条，按这一列的宽分）。附点：中心离数字中心 0.5 FS、半径 0.091 FS、在基线上 0.3 FS（样张）。 */
export declare const DASH_L: number, DASH_W: number, DASH_Y: number, DASH_PITCH: number, AUG_R: number, AUG_DX: number, AUG_Y: number;
/** 一列至少多宽（样张：四分 / 八分 = 数字宽 + 一点缝 = 0.756 FS；十六分及更短 = 0.49 FS「短音只占字宽：密的声部自己挤紧」）。 */
export declare const COL_MIN: number, COL_MIN_SHORT: number;
/** 小节线从哪画到哪（局部 y；样张：从基线上 1.82 FS 到基线下 1.0 FS——上头到力度道下面、下头到歌词上面）、离列的 x 多远、占多宽；双线 / 终止线的间距和粗线。 */
export declare const BAR_Y0: number, BAR_Y1: number, BAR_DX = 0.5, BAR_THIN = 0.12, BAR_THICK = 0.4, BAR_GAP = 0.35, BAR_W_J: number;
/** 数字行的行身（局部 y：上沿 / 下沿）= 小节线那一段。框架经过竖向锚点（geometry.ts jianpuAnchors）知道它，行距从这里往外算（layout-params.ts ROW_PARAMS）。 */
export declare const JP_BODY: {
    readonly top: number;
    readonly bottom: number;
};
/** 中途换调 / 换拍号写的字（「1=D」「3/4」）占多宽（sp，按字数估：这几个字都是半角）。 */
export declare const MID_TEXT_EM = 1.4, MID_TEXT_CH = 0.62;
/** 换气：音后面的「V」占多宽、「吸 / 深吸」小字占多宽（sp；量的时候留出来）。 */
export declare const BREATH_W: number, INHALE_W = 2.2;
/** 和弦竖叠（第五刀 5-4；UX 稿第 7 节「只压高、不缩宽」）：数字之间留多少（sp）；数字本身多高（基线到上沿）；琶音的竖波浪往左占多宽。 */
export declare const CHORD_GAP = 0.25, DIGIT_H: number, ARP_W = 0.9;
/** 和弦里每个数字的基线（局部 y）：dots = 每个音的八度点数（+ 高、− 低），从最低的音起；最低的那个在行的基线上，往上一个叠一个，
 *  间距 = 数字高 + 下面那个的高八度点 + 上面这个的低八度点 + CHORD_GAP（有点才让，没点贴紧 = 只压高）。真画的和弦、鬼音符共用这一个。 */
export declare function stackBases(dots: readonly number[]): number[];
/** 鼓的 X 行：大写 X 比数字宽，字号按这个比例收到和数字一样宽（不然十六分的一串 X 挨在一起）；幽灵音的小 x 照数字的小号。 */
export declare const X_EM = 0.8;
/** 整套鼓的 X 行（统筹看第五刀样张后定的，先顶上的写法）：每一下按五线鼓谱同一张表（src/gm/percussion.gen.ts 的符头种类）换字——
 *  普通符头（底鼓、军鼓、通鼓）= ●、× 符头（镲、踩镲）= ×、圈 × = ⊗、菱形 = ◇、三角 = △ / ▽、方块（la）= □、加号 = +、斜杠 = /、带斜杠的 = ⊘；表里没有的 = ●。
 *  只有一件鼓的行照旧一律 X（行首的名字已经说了是哪件）。这几个字在 PDF 那款字（思源黑体）里都是满一个字宽，字号按 KIT_EM 收到和数字差不多宽。 */
export declare const KIT_CHAR: Readonly<Record<string, string>>;
export declare const KIT_EM = 0.62;
/** 叠着的和弦折成的和弦名（第五刀 5-4，UX 稿第 7 节「和弦名用窄字、按实际宽度占位」）：字号（sp，数字原大起）、横向压到几成；每个字占多宽（em，写死的表，不现场量；
 *  表里没有的数字 0.56、别的 0.6）。名字的高（基线往上）。
 *  ♭ ♯ 照 PDF 那款字（vendor/fonts/sans.ttf = 思源黑体 / Noto Sans SC）的前进宽量过一次进表 = 满一个字宽（统筹看样张 ⑨：原来估 0.5 / 0.58，「B♭」带附点时点挤；test/jianpu.test.ts 拿真字体核着）。 */
export declare const CHORD_EM = 2, CHORD_SX = 0.82, CHORD_H = 1.45;
export declare const CHORD_CH_EM: Readonly<Record<string, number>>;
/** 这个和弦名在数字行上占多宽（sp，数字原大起；乘行里的比例才是这一行的）。 */
export declare const chordNameW: (s: string) => number;
/** 有歧义的小三角（名字右下角，编辑器里）占多宽（sp，数字原大起；量的时候也让出来，不然挨着下一个名字）。 */
export declare const CHORD_AMB_W = 0.55;
/** 最低音那个字母的中心离名字左边多远（sp，数字原大起）：有斜杠 = 斜杠后面那个字母（转位的最低音），没有 = 第一个字母（根音就是最低音）。八度点标在它上下。 */
export declare const chordBassCx: (s: string) => number;
/** 数字上方的记号（样张）：第一个记号离数字（和高八度点）的上沿 0.545 FS；顿音 = 实心窄楔形 宽 0.19 FS、高 0.27 FS，占 0.41 FS；
 *  重音 / 次重音 = 描边的 >（宽 0.455 FS、高 0.364 FS，重音描边 0.068 FS、次重音 0.032 FS），占 0.545 FS；保持 = 短横（长 0.455 FS、粗 0.064 FS），占 0.364 FS；
 *  换气 V = 0.5 FS 的字，在基线上 1.09 FS。 */
export declare const TEN_DY: number, MARK_GAP2: number, MARCATO_EM: number, UNSTRESS_EM: number;
export declare const MARK_GAP: number, STACC_W: number, STACC_H: number, STACC_STEP: number, CHEV_W: number, CHEV_H: number, CHEV_STROKE: number, CHEV_STROKE_THIN: number, CHEV_STEP: number, TEN_L: number, TEN_W: number, TEN_STEP: number, BREATH_EM: number, BREATH_Y: number;
/** 谱头那一行（「1=C 3/4」）的字号（样张 0.773 FS，常规粗细）。 */
export declare const HEAD_EM: number;
/** 幽灵音（演奏法）= 小字：样张 0.62 倍的数字。 */
export declare const GHOST_K = 0.62;
/** 光标在数字行上从哪画到哪（局部 y）：盖住行身（小节线那一段）再出一点。 */
export declare const CARET_Y0: number, CARET_Y1: number;
/** 一个实心小圆点（四段三次贝塞尔；PDF 认 M / C / Z）。cx / cy / r 都是 px。 */
export declare const dotPath: (cx: number, cy: number, r: number) => string;
/** 升降号 / 还原号的字形（7-P，user 11-12「b太细了…记得latex的上下标的处理方法」；统筹定：不用文字字体的 ♭，改用乐谱字体 Bravura 的——按谱面的粗细设计的）。
 *  码位 + 墨迹框 [左, 右, 上, 下]（字号 4 时的线间距）：抄自 src/render/glyph-box.gen.ts（数字行不许 import 那个文件，结构守卫；test/jianpu.test.ts 核着两边一样）。 */
export declare const ACC_GLYPH: {
    readonly flat: {
        readonly ch: "";
        readonly box: readonly [0, 0.904, -1.756, 0.7];
    };
    readonly natural: {
        readonly ch: "";
        readonly box: readonly [0, 0.672, -1.364, 1.34];
    };
    readonly sharp: {
        readonly ch: "";
        readonly box: readonly [0, 0.996, -1.4, 1.392];
    };
};
/** 数字行上升降号的字号（字形的 size，数字行的单位）：照样张的大小——♭ 的高（含下伸）约等于原来文字 ♭ 的高（0.59 字号的字）。 */
export declare const ACC_GLYPH_EM: number;
/** 升降号的顶比它那个数字的顶高多少（样张：文字 ♭ 原来就略高出数字顶）。几个升降号之间的缝。 */
export declare const ACC_RISE = 0.2, ACC_SEP = 0.08;
/** 相对调内音的升降（+ 升 / − 降 / 0 还原）→ 一串字形（双升 / 双降 = 两个，同简谱老写法逐个写）。 */
export declare const accGlyphs: (rel: number) => (typeof ACC_GLYPH)[keyof typeof ACC_GLYPH][];
/** 字母谱角标里的升降号（写成 ♯ / ♭ 的字）→ 字形。 */
export declare const accGlyphsOfText: (t: string) => (typeof ACC_GLYPH)[keyof typeof ACC_GLYPH][];
/** 一串升降号字形占多宽（数字行的单位；em = 字号）。 */
export declare const accRunW: (gs: readonly {
    box: readonly number[];
}[], em: number) => number;
/** 字母谱右上角升降号的字号：照数字行的升降号按角标的字号折算（角标 = 字母的 SCRIPT_K 倍，原来文字 ♭ 的字号 = 角标字号），再收到 SUP_ACC_FIT——
 *  Bravura 的 ♯ 比文字 ♯ 往下伸得多，按比例的大小会碰到右下角的八度数字（不相撞检查抓到的）。 */
export declare const SUP_ACC_FIT = 0.88;
export declare const supAccEm: (gk?: number) => number;
/** 升降号的字（相对这个调的调内音：+1 = ♯、−1 = ♭、0 = ♮）。 */
export declare const accText: (rel: number) => string;
export declare const letterW: (step: string) => number;
/** 角标多大（字母的几成）：7-L（user 11-12「数字可以大一点再靠的近一点，以及latex是不是subscript用优化可读性的小字了？」）从六成改成七成（LaTeX 下标 = 正文的七成）；
 *  笔画加粗照小字号专用字的思路做 = 样式表里上下标两种字是半粗（text/style.ts jp-letter-sup / jp-letter-sub，屏幕和 PDF 同一张表）。离字母多近（SCRIPT_GAP）等第八刀一起摆。 */
export declare const SCRIPT_K = 0.7, SCRIPT_GAP: number;
/** 上标（升降号）的基线、下标（八度数字）的基线：离字母基线多远（数字行的单位；上 = 负）。 */
export declare const SUP_DY: number, SUB_DY: number;
/** 字母谱的行上，字母底下多让出的那一截（下标比基线低多少）：下划线、低处的东西照着往下让。 */
export declare const SUB_DROP: number;
/** 上标比字母顶高出多少（和弦竖叠时上面那个字母让开它）：按上标的基线和字号算（字高 = 数字行的字高比例），不另写数（7-L 角标变大时原来写死的 0.15 FS 不够了）。 */
export declare const SUP_RISE: number;
/** 一个音的字母和两个角标：acc = 右上角（没有升降 = 空）、oct = 右下角的八度数字（写的八度 − 4 + 中央 C 叫 C 几）。 */
export declare const letterParts: (p: {
    step: string;
    alter: number;
    octave: number;
}, middleC: number) => {
    letter: string;
    acc: string;
    oct: string;
};
/** 角标那一栏多宽（升降号和数字取宽的；升降号照简谱升降号的宽 ACC_W 按字号折算）。 */
export declare const scriptW: (p: {
    step: string;
    alter: number;
    octave: number;
}, middleC: number) => number;
/** 一个音（或竖着叠的几个）多宽（sp，数字原大起；叠着的取最宽的）。 */
export declare const letterNoteW: (ps: readonly {
    step: string;
    alter: number;
    octave: number;
}[], middleC: number) => number;
