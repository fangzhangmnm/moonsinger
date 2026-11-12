import type { GhostNote } from "../frame/ghost.ts";
/** 数字行自己的平数据：行框原点的 y（px；和五线谱同一个框，0 = 上沿）。现在就是 SystemBox.staffTop。 */
export interface JianpuRowData {
    staffTop: number;
}
/** 光标：从行框上面一点画到下面一点的一根竖线（half = 半个线间距 px）。 */
export declare const jianpuCaretSpan: (row: JianpuRowData, half: number) => {
    y1: number;
    y2: number;
};
/** 鬼音符（「弹」时不占排版的那个音）：一个淡的数字画在哪、多大（x = 光标的位置 px，数字的中心在它右边半个数字宽）。 */
export declare const jianpuPreviewAt: (row: JianpuRowData, x: number, half: number) => {
    x: number;
    y: number;
    size: number;
};
/** 选区带的上沿（和光标同一个上沿）。 */
export declare const jianpuBandTop: (row: JianpuRowData, half: number) => number;
/** 数字行的鬼音符（谱面分家第四刀 4-6）：x 处（光标 / 那个音的位置）一个淡的数字 + 升降 + 八度点（按这一行的八度基准；row.octBase）。几个音（叠）= 往上一个叠一个。
 *  字和排版里的数字同一款（字体属性写在元素上：鬼音符那一层不在 .staff-svg 里，套不上谱的样式表）。 */
export declare function jianpuGhost(row: JianpuRowData & {
    octBase?: number;
}, x: number, notes: readonly GhostNote[], half: number): string;
/** 数字行的竖向锚点（px）：上沿 / 中线 / 下沿 = 行身（小节线那一段）。框架的家具（名字、色条、括号、左边的竖线、歌词基线）和行距只认这三个（统筹审第四刀接口第 4 条）。 */
export declare const jianpuAnchors: (origin: number, half: number) => {
    top: number;
    mid: number;
    bottom: number;
};
