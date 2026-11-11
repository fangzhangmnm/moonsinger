export type LatchMode = "off" | "once" | "lock";
export interface Latch {
    readonly mode: LatchMode;
    /** 上一次按下的时刻（连点判定）。 */
    readonly at: number;
    /** 正按着。 */
    readonly held: boolean;
    /** 按着的时候写过（松手要回去）。 */
    readonly wrote: boolean;
    /** once 还管几次写。 */
    readonly left: number;
}
export declare const DOUBLE_TAP_MS = 350;
export declare const LATCH_OFF: Latch;
/** 按下（点一下的前半）：off → once；once 且在连点窗口里 → lock；其余 → off。 */
export declare function latchDown(l: Latch, now: number, uses?: number): Latch;
/** 松手：按着的时候写过且没锁住 = 回去（off）；没写过 = 点了一下的后半，状态照 down 定的。 */
export declare function latchUp(l: Latch): Latch;
/** 点一下（按下马上松开；pad 的格子）。 */
export declare const latchTap: (l: Latch, now: number, uses?: number) => Latch;
/** 写了一个（音 / 休止 / 拉长 / 力度…）：按着 = 记一笔（松手再回去，不消耗）；once = 用掉一次，用完关；lock / off 不动。 */
export declare function latchWrite(l: Latch): Latch;
/** 挪光标 / 拨旋钮：「只管接下来几次」作废；锁住的不动。 */
export declare const latchCancel: (l: Latch) => Latch;
export declare const latchOn: (l: Latch) => boolean;
