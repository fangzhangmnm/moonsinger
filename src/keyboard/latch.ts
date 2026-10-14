// latch.ts —— 键盘上的「锁」：Shift 式修饰键的那一条规则，写一份、三把锁（/2、升降、渐到）各一个实例。created 2026-10-15 by Claude Fable 5.1
//   编辑状态机整理第 2 期（策划稿 ai-docs/20261013-edit-state-machine-survey.md §1b / §3；不变量 I3「一把锁一条规则」）；键盘模块（src/keyboard/，项目内部模块，
//   user 2026-10-15「这个是项目内部库…更像是模块」）的第一块。纯函数、不碰 DOM、不懂音乐。
//   规则（user 2026-10-07「因为accessibility的issue可能按住不方便…和键盘shift的逻辑一样」；10-09「符号键盘应该只有caps模式没有shift模式」——caps 不在这里，它是个布尔）：
//     · 点一下 = 只管接下来的 uses 次写（/2 = 2：两个减半的凑一份；升降 / 渐到 = 1）；
//     · 350 ms 内再点一下 = 锁住（之后一直管，再点一下关）；过了窗口再点 = 关；
//     · 按住写 = 按住期间写的都算、松手回去（同 iOS 按住 Shift 打字）；按住没写 = 松手等于点了一下；
//     · 挪光标 / 拨旋钮 = 「只管接下来几次」作废（锁住的不动）。

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
export const DOUBLE_TAP_MS = 350;
export const LATCH_OFF: Latch = { mode: "off", at: 0, held: false, wrote: false, left: 0 };

/** 按下（点一下的前半）：off → once；once 且在连点窗口里 → lock；其余 → off。 */
export function latchDown(l: Latch, now: number, uses = 1): Latch {
  const mode: LatchMode = l.mode === "off" ? "once" : l.mode === "once" && now - l.at < DOUBLE_TAP_MS ? "lock" : "off";
  return { mode, at: now, held: true, wrote: false, left: mode === "once" ? uses : 0 };
}
/** 松手：按着的时候写过且没锁住 = 回去（off）；没写过 = 点了一下的后半，状态照 down 定的。 */
export function latchUp(l: Latch): Latch {
  if (!l.held) return l;
  return l.wrote && l.mode !== "lock" ? { ...LATCH_OFF, at: l.at } : { ...l, held: false };
}
/** 点一下（按下马上松开；pad 的格子）。 */
export const latchTap = (l: Latch, now: number, uses = 1): Latch => latchUp(latchDown(l, now, uses));
/** 写了一个（音 / 休止 / 拉长 / 力度…）：按着 = 记一笔（松手再回去，不消耗）；once = 用掉一次，用完关；lock / off 不动。 */
export function latchWrite(l: Latch): Latch {
  if (l.held) return l.wrote ? l : { ...l, wrote: true };
  if (l.mode === "once") return l.left <= 1 ? { ...LATCH_OFF, at: l.at } : { ...l, left: l.left - 1 };
  return l;
}
/** 挪光标 / 拨旋钮：「只管接下来几次」作废；锁住的不动。 */
export const latchCancel = (l: Latch): Latch => (l.mode === "once" ? { ...LATCH_OFF, at: l.at, held: l.held } : l);
export const latchOn = (l: Latch): boolean => l.mode !== "off";
