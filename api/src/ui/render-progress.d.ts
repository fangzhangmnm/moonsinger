export declare class RenderProgress {
    private el;
    private fill;
    private cur;
    private total;
    private done;
    constructor(parent: HTMLElement);
    /** 开始：一共几格。 */
    start(units: number): void;
    /** 当前这一格知道百分比了（0–1；下载）。null = 不知道（条纹）。 */
    frac(f: number | null): void;
    /** 这一格做完。 */
    next(): void;
    /** 收起。 */
    end(): void;
    get running(): boolean;
    private draw;
}
