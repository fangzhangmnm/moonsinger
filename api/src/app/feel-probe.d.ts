export interface FeelHost {
    /** 音频时钟（没建 = null，不为了量而建）。 */
    audioNow(): {
        t: number;
        state: string;
        sr: number;
        info?: string; /** 排着的声音大约多少毫秒（宿主算，src/singer/audio.ts ⑤；量不出 = null）。 */
        queued?: number | null;
    } | null;
    /** 露 / 收（text = null 收起）。 */
    report(text: string | null): void;
    /** 黑匣子一条（已经节流过了）。 */
    note(msg: string): void;
    /** 人话一行：数字已经取整、单位 ms。late = 有一项超了门槛（没超、只是「一直显示」开着 = false）。 */
    text(r: FeelReading, late: boolean): string;
    /** 「一直显示」开着（查延迟时：不超门槛也露数字）。 */
    always?(): boolean;
}
export interface FeelReading {
    queue: number;
    toSound: number;
    stall: number;
    audioStep: number;
    audioTypical: number; /** 排着的声音（ms；量不出 = null）：听到的比按下晚这么多，而别的几项都看不出来。 */
    queued: number | null;
}
export interface FeelProbe {
    /** pad 音键 pointerdown 那一刻叫：ts = 事件的 timeStamp。 */
    touch(ts: number): void;
    /** 音交给声音线程了（宿主 sound.down 之后叫）。 */
    sound(): void;
    /** 现在的读数（设置页 / 测试看；没醒过 = null）。 */
    reading(): FeelReading | null;
    /** 这一段按键的汇总现在就记一条（页面要走了 / 进后台：等不到 20 秒没按键的那一次）。没按过 = 不记。 */
    flush(): void;
}
/** 门槛（ms）：超过 = 人能感觉到、该说出来。queue / toSound 80 = 两个动画帧还多；stall 150 = 一下明显的卡；audioStep 150 = 系统给的声音块比正常（iPad ≈ 3–12 ms）大了一个量级。 */
export declare const FEEL_LIMITS: {
    readonly queue: 80;
    readonly toSound: 80;
    readonly stall: 150;
    readonly audioStep: 150;
    readonly audioTypical: 60;
    readonly queued: 100;
};
/** 事件 timeStamp 和 performance.now() 同一条时间轴才能相减（老 WebKit 给的是 epoch 毫秒 = 差出十几亿）：不合理 = 不算这一项。 */
export declare function queueDelay(now: number, ts: number): number | null;
export declare function createFeelProbe(host: FeelHost, now?: () => number, raf?: (cb: () => void) => void): FeelProbe;
