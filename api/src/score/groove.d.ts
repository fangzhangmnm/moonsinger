import { type Token, type Song, type GrooveTok, type TempoMap } from "./song.ts";
import { GROOVE_STYLES, type GrooveStyle } from "./grooves.gen.ts";
export { GROOVE_STYLES, type GrooveStyle };
export declare const grooveStyle: (id: string) => GrooveStyle | null;
/** 预设的名字（"none" = 「不加轻重」，比预设名「无」好懂）；不认识的预设（以后的版本写的）= 原样显示 id。 */
export declare const grooveName: (style: string) => string;
/** 预设的英文名（谱面语言，同速度的 Andante；user「风格名用英文」）："none" = none；不认识的预设 = 原样 id。 */
export declare const grooveNameEn: (style: string) => string;
/** 谱上 / MusicXML 里写的字：「Style: Classical」（光写名字像谜语，user「光说一个古典比较谜语人，说风格：古典」；
 *  语言对齐记谱：拉丁不用于演奏指示，古典传统是意大利文、流行 / 爵士谱的风格写英文——user「风格名用英文」）。 */
export declare const grooveLabel: (t: Pick<GrooveTok, "style" | "amount" | "shift">) => string;
/** 这个风格有没有两小节一轮的拍号（克拉维）：有 = 菜单里给「3-2 / 2-3」（错开一小节）。 */
export declare const grooveHasPhase: (s: GrooveStyle | null) => boolean;
/** 人话说这个风格在这个拍号下怎么轻重（从数据现算，数据变了说明跟着变）：「一拍 最重 · 二拍 不变 · …；半拍 稍轻；更细的 轻」。 */
export declare function describeGroove(s: GrooveStyle, beats: number, beatType: number): string | null;
/** 没列的拍号按古典层级推（仓鼠 meterFallback.rule = "classical" 的说法）：小节第一拍 1；四拍的第三拍 0.5；其余拍 0；
 *  拍里第一层细分 −0.25、再往下 −0.5。复拍子（6/8 9/8 12/8）一拍 = 三个八分，每个八分是第一层细分；
 *  x/8 不是 3 的倍数（5/8 7/8）= 加法拍子：两个八分一组、单数的话最后一组三个（谱上没记分组，按这个推；面板里明说）。
 *  一小节不是整数个十六分（如 x/32）= null（不加）。 */
export declare function classicalWeights(beats: number, beatType: number): {
    grid: number;
    weights: number[];
} | null;
/** 这个风格在这个拍号下的表：列了的用列的；没列 = 按 fallback（古典层级推 / 不加）。 */
export declare function grooveTable(s: GrooveStyle, beats: number, beatType: number): {
    grid: number;
    weights: number[];
    bars: number;
    derived: boolean;
} | null;
/** 每个音头（不含连过来的音）在小节里的位置（tick）+ 那里的拍号。bounds = 纸界（每张纸各自从头数，同画谱）。规则同 engrave unitsOf：
 *  人插的「|」/ 拍号变 = 新的一小节；写满一小节 = 自动小节线；每张纸的第一小节还没写满就碰到「|」= 弱起——位置按小节尾对齐（弱起的那一拍是最后一拍）。 */
/** withTies（v0.16.76）：接着前面连过来的音（不重新起音）也给位置，带 tie 记号——乐理模块按小节读谱时要（叠音的和弦连过小节线照样标）；拍子轻重那边不要（没给 = 不带）。 */
export declare function meterPositions(tokens: readonly Token[], bounds?: readonly number[], withTies?: boolean): Map<number, {
    pos: number;
    beats: number;
    beatType: number;
    bar: number;
    pickup?: true;
    tie?: true;
}>;
/** 整首（照放的顺序）的风格记号：每张纸开头回到「不加」（风格只管它那张纸）；纸里任何一行写的都算（整张纸一起听），同一时刻两行都写了 = 上面那行。
 *  tick = 压平后从头数（flattenPart 把每张纸补到最长那条的长度，所以纸的起点 = 前面各张纸长度之和）。 */
export type GrooveMap = {
    tick: number;
    style: string | null;
    amount: number;
    shift?: boolean;
}[];
export declare function grooveMapOf(song: Song, order?: readonly string[]): GrooveMap;
/** 一个声部（压平、照同一个顺序）每个音的拍子轻重（index → 权重 × 幅度 × 跟多少；0 的不放）。follow = 这位演奏者对这个风格跟多少（0–1）。 */
export declare function grooveWeights(tokens: readonly Token[], bounds: readonly number[], map: GrooveMap, follow: (s: GrooveStyle) => number): Map<number, number>;
export declare function grooveCategory(cat: "voice" | "gm" | null | undefined, gm?: {
    bank: number;
    program: number;
} | null): string | null;
/** 类别里预设没写的 = 0（不跟）。 */
export declare const followOf: (s: GrooveStyle, category: string | null) => number;
/** 摇多少：风格数据的 swing.ratio（一拍里前一个八分占多少；仓鼠 grooves，Swing = 0.667、范围 0.5–0.75），幅度放大 / 缩小「比直的多出来的那一截」，
 *  夹在数据给的范围里；这个风格不摇 = 0。 */
export declare function swingRatio(style: string | null, amount?: number): number;
/** 放的时候用的时间表 = 速度表（tempoMapOf）+ 摇摆：风格记号带摇摆的那一段，**整张纸所有歌手一起摇**（时间不分谁跟多少，不然对不上拍；跟多少只管轻重）。
 *  拍的网格从纸头起数；纸的第一小节是弱起（还没写满就碰到「|」）= 网格对齐到那条小节线（弱起的那个八分是后半拍）。
 *  整首没有哪一段摇 = 原样返回速度表（旧歌逐样本不变）。 */
export declare function timeMapOf(song: Song, order?: readonly string[]): TempoMap;
