/** 数字的字号（sp）和占多宽（等宽数字 ≈ 0.56 em）。 */
export declare const DIGIT_EM = 2.5, DIGIT_W = 1.4;
/** 数字的基线、上沿、中线（局部 y）。 */
export declare const BASE_Y = 2.95, DIGIT_TOP = 1.15, DIGIT_MID = 2.05;
/** 下划线：第一条在哪、条与条之间、粗细；八度点的半径、和下划线 / 数字隔多远、点与点之间。 */
export declare const UL_Y0 = 3.35, UL_GAP = 0.3, UL_W = 0.11, DOT_R = 0.16, DOT_GAP = 0.3, DOT_STEP = 0.42;
/** 升降号（挂在数字左上）：字号、往左挪多少（中心离数字中心）、基线；占多宽（光标让开它）。 */
export declare const ACC_EM = 1.3, ACC_DX = 1, ACC_Y = 1.75, ACC_W = 0.95;
/** 增时线（长音的「–」）：长、粗、在哪个高度；两条之间至少隔多远（中心距）。附点：离数字右边多远、多大。 */
export declare const DASH_L = 1, DASH_W = 0.13, DASH_Y = 2.05, DASH_PITCH = 2.4, AUG_DX = 0.35, AUG_R = 0.14;
/** 小节线从哪画到哪（局部 y）、离列的 x 多远、占多宽；双线 / 终止线的间距和粗线。 */
export declare const BAR_Y0 = 0.75, BAR_Y1 = 3.55, BAR_DX = 0.5, BAR_THIN = 0.12, BAR_THICK = 0.4, BAR_GAP = 0.35, BAR_W_J = 1.2;
/** 数字行的行身（局部 y：上沿 / 下沿）= 小节线那一段。框架经过竖向锚点（geometry.ts jianpuAnchors）知道它，行距从这里往外算（layout-params.ts ROW_PARAMS）。 */
export declare const JP_BODY: {
    readonly top: 0.75;
    readonly bottom: 3.55;
};
/** 中途换调 / 换拍号写的字（「1=D」「3/4」）占多宽（sp，按字数估：这几个字都是半角）。 */
export declare const MID_TEXT_EM = 1.4, MID_TEXT_CH = 0.62;
/** 换气：音后面的「V」占多宽、「吸 / 深吸」小字占多宽（sp；量的时候留出来）。 */
export declare const BREATH_W: number, INHALE_W = 2.2;
/** 光标在数字行上从哪画到哪（局部 y）。 */
export declare const CARET_Y0 = 0.6, CARET_Y1 = 3.9;
/** 一个实心小圆点（四段三次贝塞尔；PDF 认 M / C / Z）。cx / cy / r 都是 px。 */
export declare const dotPath: (cx: number, cy: number, r: number) => string;
/** 升降号的字（相对这个调的调内音：+1 = ♯、−1 = ♭、0 = ♮）。 */
export declare const accText: (rel: number) => string;
