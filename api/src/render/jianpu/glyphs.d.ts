/** 数字的字号（sp）和占多宽（样张 0.62 FS）。 */
export declare const DIGIT_EM = 2.5, DIGIT_W: number;
/** 数字的基线、上沿、中线（局部 y）。 */
export declare const BASE_Y = 2.95, DIGIT_TOP = 1.15, DIGIT_MID = 2.05;
/** 下划线：第一条在基线下 0.27 FS、条与条之间 0.18 FS、粗 0.059 FS（样张）；八度点：半径 0.082 FS、高八度的点中心在基线上 0.9 FS、点与点之间 0.227 FS（样张）。 */
export declare const UL_Y0: number, UL_GAP: number, UL_W: number, DOT_R: number, DOT_GAP: number, DOT_STEP: number;
/** 低八度的点（样张）：最下面那个数字的，第一个点中心在下划线（没有下划线也照这个位置）再往下 0.27 FS、每多一层下划线再往下一层；叠在上面的数字的，贴着它自己的基线往下 0.27 FS。 */
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
/** 叠着的和弦折成的和弦名（第五刀 5-4，UX 稿第 7 节「和弦名用窄字、按实际宽度占位」）：字号（sp，数字原大起）、横向压到几成；每个字占多宽（em，写死的表，不现场量；
 *  表里没有的数字 0.56、别的 0.6）。名字的高（基线往上）。 */
export declare const CHORD_EM = 2, CHORD_SX = 0.82, CHORD_H = 1.45;
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
/** 升降号的字（相对这个调的调内音：+1 = ♯、−1 = ♭、0 = ♮）。 */
export declare const accText: (rel: number) => string;
