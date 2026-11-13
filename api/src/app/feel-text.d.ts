import type { FeelReading } from "./feel-probe.ts";
/** 起来时多算了这么多以上 = 横幅上照实写、放「重启声音」（统筹定的线；和 audio.ts 的 FLUSH_IDLE_MS 同一个数，干净的读数是 1–7 ms）。 */
export declare const START_BURST_SHOW_MS = 30;
export interface FeelBanner {
    text: string;
    /** 点这一行字 = 清掉排着的声音（不是收起）。 */
    flush: boolean;
    /** 后面放一颗「重启声音」（和设置里那一颗同一个动作）。 */
    revive: boolean;
}
/** late = 有一项超了门槛；startBurst = 这一次声音起来时多算了多少（ms；没量过 = null）；slow = 分账秒表里最慢的一步（宿主拼好的字）。 */
export declare function feelBanner(r: FeelReading, late: boolean, startBurst: number | null, slow: string): FeelBanner;
