// 滚轮 → 几步（created by Claude Opus 5.5 2026-10-10）：pad 的旋钮和混音台的滑块共用一份。
// 鼠标滚轮一格（Chrome 报 100 px、按行模式报 3 行…）= 正好一步（user「滚轮滚键盘的range的时候应该是一行行滚而不是两行」
// 「鼠标滚轮能不能一格一格滚各种slider，帮助强迫症」）；触控板的小 delta 攒够 40 px 才走一步。

const STEP_PX = 40, NOTCH_PX = 50;

/** 这一下滚轮走几步（往下滚 = 正）；acc = 上次攒下的零头，返回新的零头。 */
export function wheelSteps(e: Pick<WheelEvent, "deltaMode" | "deltaY">, acc: number): { steps: number; acc: number } {
  // 按行 / 按页报的只会是鼠标滚轮（Firefox 一格 = 3 行），一下 = 一步；原来折成 48 px 当触控板攒，零头攒满会一格走两步
  if (e.deltaMode !== 0) return { steps: Math.sign(e.deltaY), acc: 0 };
  const px = e.deltaY;
  if (Math.abs(px) >= NOTCH_PX) return { steps: Math.sign(px), acc: 0 };
  const a = acc + px, steps = Math.trunc(a / STEP_PX);
  return { steps, acc: a - steps * STEP_PX };
}
