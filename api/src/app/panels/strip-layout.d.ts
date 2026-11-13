/** 每格多宽、滑不滑。visible = 那一行可见的宽（px），n = 几格，gap = 格子之间的间隔，base = 基准宽。 */
export declare function stripLayout(visible: number, n: number, gap: number, base: number): {
    cell: number;
    scroll: boolean;
};
