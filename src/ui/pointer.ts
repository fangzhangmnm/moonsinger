// pointer.ts —— 鼠标、笔、手指差在哪：全 app 认「这是哪种指针」只在这里（设计 = ai-docs/20261114-pointer-rules-design.md 第三、五节）。
// created 2026-11-14 by Claude Opus 5.5（MoonSinger小弟）。
//   user 2026-11-14：「然后这些东西，就是你做个深模块窄接口，系统性的看一下哪些触屏和鼠标的逻辑的区别。」
//   规矩：模块外面不比 pointerType、不问「是不是手指」，只问能力（caps(p).hover…）或者问 press-rules.ts 要结论。
//   还没收进来的老分路（键盘、乐器目录、提示条、记号输入框…）登记在 test/pointer-census.test.ts，只许减不许增。

export type Pointer = "mouse" | "pen" | "touch";

/** 三种指针物理上差的四件事（第三节那张表）。 */
export interface Caps {
  /** 还没按下就知道指着谁（悬停）。笔当没有（不是每支笔、每台设备都报）。 */
  hover: boolean;
  /** 第二个键（右键）。 */
  secondary: boolean;
  /** 滚轮。 */
  wheel: boolean;
  /** 在谱上拖 = 滚动屏幕（手指）；不是 = 拖的是谱上的东西（鼠标、笔）。捏合、双击缩放也算这一件（手势管的是视图）。 */
  dragScrolls: boolean;
  /** 粗（手指）：点得中的范围按指尖大小算。 */
  coarse: boolean;
  /** 会带出系统键盘（手指、笔）：输入框不自动聚焦，打字时键盘让开。 */
  softKeyboard: boolean;
}

const CAPS: Record<Pointer, Caps> = {
  mouse: { hover: true, secondary: true, wheel: true, dragScrolls: false, coarse: false, softKeyboard: false },
  pen: { hover: false, secondary: false, wheel: false, dragScrolls: false, coarse: false, softKeyboard: true },
  touch: { hover: false, secondary: false, wheel: false, dragScrolls: true, coarse: true, softKeyboard: true },
};

export function caps(p: Pointer): Caps { return CAPS[p]; }

/** 这一下是哪种指针：全 app 唯一读 pointerType 的地方。报不出来的（老浏览器的空串）= 鼠标。 */
export function pointerOf(e: { pointerType: string }): Pointer {
  return e.pointerType === "touch" ? "touch" : e.pointerType === "pen" ? "pen" : "mouse";
}

/** 这台设备的主要指针粗不粗（只管大小：谱上一格几 px、开机时还没有按过时猜最近一下是哪种）。 */
export function deviceCoarse(): boolean {
  try { return matchMedia("(pointer: coarse)").matches; } catch { return false; }
}

let last: Pointer | null = null;
/** 最近一下用的是哪种指针（没有事件可问的事问它：画不画选区旁的小钮、键盘让不让开）。还没按过 = 按设备猜。 */
export function lastPointer(): Pointer { return last ?? (deviceCoarse() ? "touch" : "mouse"); }
/** 记下这一下（watchPointers 装的全局监听调；测试也可以直接调）。 */
export function notePointer(e: { pointerType: string }): void { last = pointerOf(e); }

let watching = false;
/** 在 window 上装一次捕获阶段的 pointerdown：任何元素收到这一下之前，lastPointer 已经是它。 */
export function watchPointers(): void {
  if (watching || typeof addEventListener !== "function") return;
  watching = true;
  addEventListener("pointerdown", (e) => notePointer(e), { capture: true, passive: true });
}
