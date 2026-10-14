// overlay.ts —— 盖层登记（编辑状态机整理第 1 期 = 刀 3 之一；策划稿 ai-docs/20261013-edit-state-machine-survey.md §1c / §3；不变量 I2「一次一层盖层」）。
//   created 2026-10-14 by Claude Fable 5.1
//   之前 main.ts 用一个模块级闭包 `closeOffer` 当「现在开着的那张面板怎么关」：开新的之前每处自己记得 `closeOffer?.()`，关的时候自己记得清掉——
//   44 处赋值 / 89 处读，漏一处 = 两张叠着，晚到的 close 会把后来开的那张误清掉（只有 10 处有 `=== close` 的守卫）。
//   这里只是把那条协议收成一个对象：开新的 = 旧的先关；自己收了只在「还是现在这层」时才清。DOM 仍归各个 open…（这里不碰 DOM）。
//   还没收进来的（第 1 期刀 3 之二）：乐器页 / 乐器目录 / 歌库这几个整页的旗（instShown / finderShown / …）、从盖层推 pad 锁不锁 / 键盘归谁。

/** 盖层的种类：menu = 小菜单（点外面收）；sheet = 面板（offer：导出 / 设置 / 问一句…）；card = 轨的小卡（非模态，点外面收）。 */
export type OverlayKind = "menu" | "sheet" | "card";
export interface Overlay { readonly k: OverlayKind; readonly close: () => void }

export interface OverlayRegistry {
  /** 现在开着的那层（没有 = null）。 */
  readonly overlay: Overlay | null;
  /** 开新的 = 旧的先关（调它的 close），再记下这层。 */
  open(next: Overlay): void;
  /** 关现在开着的（没有 = 什么都不做）。 */
  close(): void;
  /** 某一层自己收了（点外面 / Esc / 做完）：只在它还是现在这层时清掉——晚到的 close 不会误清后来开的那层。 */
  closed(close: () => void): void;
  is(k: OverlayKind): boolean;
}

export function createOverlayRegistry(): OverlayRegistry {
  let cur: Overlay | null = null;
  return {
    get overlay() { return cur; },
    open(next) { const prev = cur; cur = null; prev?.close(); cur = next; },   // 先登记为空再关旧的：旧的 close 里的 closed(自己) 不会碰到新的
    close() { const prev = cur; cur = null; prev?.close(); },
    closed(close) { if (cur?.close === close) cur = null; },
    is(k) { return cur?.k === k; },
  };
}
