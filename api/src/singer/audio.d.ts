/** 黑匣子的口（main.ts 接 diagNote("audio", …)）。 */
export declare function onAudioNote(f: (msg: string) => void): void;
export declare function audioCtx(): AudioContext;
/** 只看不建、不叫醒：没建过 = null。 */
export declare function audioCtxIfAny(): AudioContext | null;
/** ③ 在用户手势里把声音设备提前起好。 */
export declare function warmAudio(): void;
/** 用不用垫脚（宿主定：iPad 才开；设置 → 开发者能关）。真正的那一个已经起来过 = 这次打开不再有区别。 */
export declare function setPrimer(on: boolean): void;
export declare const primerOn: () => boolean;
export declare function noteKeyAsleep(now: number): void;
/** 纯逻辑（test/audio-queue.test.ts）：一下一下喂（墙上的毫秒，音频时钟的秒）。arm = 等时钟下一次动，动之前最后一下当锚点（误差 = 喂得多密）；
 *  queued = 从锚点起 时钟走的 − 墙上过的（ms）。时钟停过、没追回来 = 那一段是断音不是排队，记进 slack 抵掉，不让它把后来的排队盖住。 */
export declare function createQueueMeter(): {
    arm(): void;
    feed(now: number, ct: number): void;
    queued(now: number, ct: number): number | null;
    burst(): number | null;
    anchorAt(): number | null;
};
/** 时钟开始走之后过这么久，定下这一次多算了多少。 */
export declare const BURST_SETTLE_MS = 600;
/** 起来时多算了这么多以上 = 当场清（不等空当）。真机上量到的：起得干净 = 1 ms（PC 2–7 ms），起得脏 = 224 / 587 ms；v0.16.28 / 29 就是这条线，清完 user「延迟好了很多」。 */
export declare const FLUSH_NOW_MS = 120;
/** 排着这么多以上 = 等没有音在响的空当清。user 11-08「手感好的时候它显示都是一毫秒、两毫秒，然后那是手感不好的时候它显示是四十多毫秒」
 *  （哪一个数他自己也不确定；干净时排队读数正好是 1 ms，所以多半是这一项——**没证实**）→ 线划在 30：比干净的读数加量的误差（锚点最多差一个 10 ms 的定时器间隔）高，比四十多低。
 *  v0.16.30 这条线也管当场清；user 用下来「响应延迟非常的顺手，非常的快」。v0.16.31 把 30–120 这一档改成只在空当清：当场清会掐到正在响的音。 */
export declare const FLUSH_IDLE_MS = 30;
/** 「这一次声音起来时多算了多少」的账（纯逻辑，test/feel-text.test.ts；施工单「手感横幅照实说」，2026-11-12 Claude Opus 5.5（MoonSinger小弟））：
 *  起来 / 回前台 / 换出声口那几次量到的记下来，**清（flush）之后重量的那一次不记**——清完从零重新量、读到几毫秒是必然的（复盘 ai-docs/20261108-key-latency-postmortem.md 后记二、三），
 *  不能拿它盖掉起来时那个数。只记账，不影响起、清、垫脚的任何行为。seq = 记过几次（「点了重启声音之后新的那一次」靠它认）。 */
export declare function createStartBurstLog(): {
    measured(why: string, ms: number): void;
    get(): {
        ms: number | null;
        seq: number;
    };
};
/** 起来之后量到多算了：当场清不清（纯逻辑）。连着 2 次清完还是多 = 这一次不再清。 */
export declare function shouldAutoFlush(burstMs: number, doneInARow: number): boolean;
/** 这一次打开里，声音设备最近一次起来时量到的多算了多少（ms；清过不归零、没量过 = null）+ 量过几次。只读（手感横幅照实说）。 */
export declare const audioStartBurst: () => {
    ms: number | null;
    seq: number;
};
/** 现在大约排着多少毫秒（还没量出来 / 没在跑 = null）。离起来越久越不准：音频的钟和墙上的钟每分钟会差出几毫秒。 */
export declare function audioQueuedMs(): number | null;
/** ② 清掉排着的：suspend 完了再 resume；重新起来时（statechange → running）重新量。who = 谁要清的。 */
export declare function flushAudio(who?: "auto" | "idle" | "tap"): void;
/** ① 回前台那一刻叫：上下文写着 running（没有 statechange 可等）而时钟 60 ms 没走 = 设备其实停过、正在重起 → 再量一次这次起来（脏就清）。
 *  状态变过的（interrupted → running）由 statechange 那一次量；时钟本来就在走的不重量（重量会把还排着的忘掉）。 */
export declare function audioShown(): void;
/** ⑤ 换出声口（见文件头）。why = 谁要换的。同一秒半里只换一次；「时钟不走」那两路一次回前台最多自动换 3 次（换不活就别来回折腾，留给人按）。
 *  回的是「换完之后声音时钟在不在走」（0.5 秒后看；不走 = 再试 suspend + resume、1.5 秒后看）。 */
export declare function reviveAudio(why: "manual" | "frozen-key" | "frozen-visible"): Promise<boolean>;
/** ② 空当里清：宿主在**确认没有音在响**的时候叫（每秒一次就够；怎么算「没有音在响」是宿主的事，见 main.ts）。排着的超过线、这一次起来已经量完、离上次清超过 10 秒才动手。 */
export declare function idleFlushAudio(): void;
export declare function holdAudio(): void;
export declare function releaseAudio(): void;
