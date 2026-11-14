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
export declare function caps(p: Pointer): Caps;
/** 这一下是哪种指针：全 app 唯一读 pointerType 的地方。报不出来的（老浏览器的空串）= 鼠标。 */
export declare function pointerOf(e: {
    pointerType: string;
}): Pointer;
/** 这台设备的主要指针粗不粗（只管大小：谱上一格几 px、开机时还没有按过时猜最近一下是哪种）。 */
export declare function deviceCoarse(): boolean;
/** 最近一下用的是哪种指针（没有事件可问的事问它：画不画选区旁的小钮、键盘让不让开）。还没按过 = 按设备猜。 */
export declare function lastPointer(): Pointer;
/** 记下这一下（watchPointers 装的全局监听调；测试也可以直接调）。 */
export declare function notePointer(e: {
    pointerType: string;
}): void;
/** 在 window 上装一次捕获阶段的 pointerdown：任何元素收到这一下之前，lastPointer 已经是它。 */
export declare function watchPointers(): void;
