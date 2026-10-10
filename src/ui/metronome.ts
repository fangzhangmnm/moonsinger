// metronome.ts —— 速度框里的小节拍器：一个自己维持摆幅的摆（擒纵式），频率跟着目标速度平滑地追。created 2026-10-10 by Claude Opus 5.5
// user 2026-10-07（wishlist W-12）：「调速度的时候那个小节拍器的动画应该有物理动画，你可以想想有什么受迫物理模型让小节拍器跟上你的乱调」。
// 问题陈述：输入 = 目标速度（每帧都可能变，滚轮乱拨时一帧一个数）；输出 = 摆杆角度。要求：① 稳定时摆到一头 = 一拍（整个来回 = 两拍）、摆幅 ±AMP；
//   ② 速度怎么乱变，摆杆的角度和角速度都连续（不跳、不重新起摆）；③ 变了之后几百毫秒内追上新的速度。
// 模型：θ'' = −ω²θ + μ(1 − r²)θ'，r² = (θ/A)² + (θ'/(ωA))²（van der Pol 式的自激振子 = 真节拍器的擒纵：摆幅小了推一把、大了耗一点，极限环 = 摆幅 A、频率 ω）；
//   ω 本身一阶追目标（时间常数 TAU）：像在摆着的时候把摆锤挪上挪下，不会瞬移。纯函数，node 测试（test/metronome.test.ts）。
export const AMP = 32;          // 度：摆到一头的角度（同原来的 CSS 动画）
const TAU = 0.15;               // 秒：频率追目标的时间常数
const MU = 4;                   // 1/秒：摆幅回到 AMP 的快慢
const SUB = 1 / 480;            // 秒：积分步长上限（rAF 一帧切几小步，半隐式欧拉）

export interface MetroState { th: number; v: number; w: number }   // 角度（度）、角速度（度 / 秒）、当前角频率（弧度 / 秒）
/** 速度（每分钟拍数）→ 角频率：摆到一头 = 一拍 → 半个周期 = 一拍。 */
export const omegaOf = (bpm: number): number => (Math.PI * bpm) / 60;
/** 刚出现：从一头放手（静止在 −AMP），频率直接 = 目标。 */
export const metroStart = (bpm: number): MetroState => ({ th: -AMP, v: 0, w: omegaOf(bpm) });
/** 往前走 dt 秒（目标速度 bpm）。
 *  自愈（2026-10-10 user「如果你通过快速调频率abuse节拍器的话应该可以自愈，而不是卡在一个奇怪的动力学位置里面」）：
 *  ① 极限环对所有状态都是吸引的，只有正中静止（θ = 0、θ' = 0）这一个点不动 → 落到它附近就轻推一下；
 *  ② 摆幅大了的「耗」那一项按隐式算（无条件稳定：速度乱跳、频率猛降都不会算炸），r² 封顶；
 *  ③ 算出非数 / 无穷 = 从头放手。目标速度本身也夹在合理范围里（20–400）。 */
export function metroStep(s: MetroState, bpm: number, dt: number): MetroState {
  let { th, v, w } = s;
  if (!Number.isFinite(th) || !Number.isFinite(v) || !Number.isFinite(w) || w <= 0) ({ th, v, w } = metroStart(bpm));
  const wt = omegaOf(Math.max(20, Math.min(400, Number.isFinite(bpm) ? bpm : 90))), n = Math.max(1, Math.ceil(Math.min(dt, 0.1) / SUB)), h = Math.min(dt, 0.1) / n;
  for (let i = 0; i < n; i++) {
    w += (wt - w) * (1 - Math.exp(-h / TAU));
    const r2 = Math.min(50, (th / AMP) ** 2 + (v / (w * AMP)) ** 2);
    if (r2 < 1e-4) v += w * AMP * 0.05;                       // ① 正中静止：轻推
    const c = MU * (1 - r2);
    v = c >= 0 ? v + (-w * w * th + c * v) * h : (v - w * w * th * h) / (1 - c * h);   // ② 推 = 显式；耗 = 隐式
    th += v * h;                                              // 半隐式：用新速度走角度（能量不漂）
  }
  return { th, v, w };
}
