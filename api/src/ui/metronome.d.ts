export declare const AMP = 32;
export interface MetroState {
    th: number;
    v: number;
    w: number;
}
/** 速度（每分钟拍数）→ 角频率：摆到一头 = 一拍 → 半个周期 = 一拍。 */
export declare const omegaOf: (bpm: number) => number;
/** 刚出现：从一头放手（静止在 −AMP），频率直接 = 目标。 */
export declare const metroStart: (bpm: number) => MetroState;
/** 往前走 dt 秒（目标速度 bpm）。
 *  自愈（2026-10-10 user「如果你通过快速调频率abuse节拍器的话应该可以自愈，而不是卡在一个奇怪的动力学位置里面」）：
 *  ① 极限环对所有状态都是吸引的，只有正中静止（θ = 0、θ' = 0）这一个点不动 → 落到它附近就轻推一下；
 *  ② 摆幅大了的「耗」那一项按隐式算（无条件稳定：速度乱跳、频率猛降都不会算炸），r² 封顶；
 *  ③ 算出非数 / 无穷 = 从头放手。目标速度本身也夹在合理范围里（20–400）。 */
export declare function metroStep(s: MetroState, bpm: number, dt: number): MetroState;
