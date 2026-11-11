/** 第 d 级（第五线 = 38、中线 34、第一线 30；每级半个线间距）在这一行的 y（px）。staffTop = 这一行第五线的 y，half = 半个线间距（px）。 */
export declare const yAt: (staffTop: number, d: number, half: number) => number;
/** y（px）→ 最近的第几级。 */
export declare const dAt: (staffTop: number, y: number, half: number) => number;
/** 这一行的竖向锚点（px）：上沿 = 第五线、中线、下沿 = 第一线。框架的家具（声部名、色条、括号、左边的竖线、歌词基线）只认这三个。 */
export declare const anchors: (staffTop: number, half: number) => {
    top: number;
    mid: number;
    bottom: number;
};
/** 这一行五线谱自己的平数据：第五线的 y（px）、大谱表里是上（1）还是下（2）。现在就是 SystemBox 的 staffTop / staff 两个字段（挪成 RowBox.data 归第二刀）。 */
export interface StaffRowData {
    staffTop: number;
    staff: 1 | 2;
}
/** 光标：从第 42 级画到第 26 级的一根竖线（谱上方两格到谱下方两格）。 */
export declare const caretSpan: (row: StaffRowData, half: number) => {
    y1: number;
    y2: number;
};
/** 鬼音符（「弹」时不占排版的那个音）：符头的 y + 要画的加线（谱下方从第 28 级往下、谱上方从第 40 级往上，到这个音为止）。d = 谱上的第几级（已带谱号 / 八度线的位移）。 */
export declare const previewAt: (row: StaffRowData, d: number, half: number) => {
    y: number;
    ledgers: number[];
};
/** 纵向 = 音高（五线谱有、简谱没有）：这个 y 是第几级；竖着拖了 dy（px，往下为正）是几级（半个线间距一级）。 */
export declare const pitchAxis: {
    stepAt: (row: StaffRowData, y: number, half: number) => number;
    stepsOfDrag: (dy: number, half: number) => number;
};
/** 选区带的上沿：第 44 级（谱上方三格）。 */
export declare const bandTop: (row: StaffRowData, half: number) => number;
