// platform-guards.ts —— iPad / iOS 系统手势护栏：长按放大镜、文本选择、系统菜单、双击 / 捏合缩放、三指手势。created 2026-10-07 by Claude Opus 5.5
// user「ios长按会有放大镜，可以看一下兄弟项目比如weebpaint是怎么解决手势问题的」→ 照 WeebPaint 的三层：
//   ① CSS 全局 user-select / -webkit-touch-callout: none、touch-action（styles.css 的 html, body 已有）；
//   ② 捕获阶段全局拦：dblclick、gesturestart / gesturechange、三指 touchstart、selectstart，selectionchange 兜底清选区
//      （WeebPaint src/platform-guards.ts）；
//   ③ 放大镜 / 长按菜单是挂在 touchstart 的长按计时器上的——拦 pointerdown、contextmenu 都没用，唯一可靠的是在那块面上
//      非 passive 的单指 touchstart preventDefault（WeebPaint src/input.ts 画布那段注释）。只绑在谱面和 pad：
//      谱面的滚动是自己按 pointer 做的（.score touch-action: none），pad 不滚；pointer 事件照常来。
// 文本输入（歌词框、记号框、顶栏下拉）一律放行。

function isTextTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
}

export function installPlatformGuards(surfaces: HTMLElement[], opts: { /** Ctrl / ⌘ + = / − / 0（含小键盘）→ 缩放谱面（1 放大 / −1 缩小 / 0 回自动）；浏览器的网页缩放一律拦下。 */ zoom?: (dir: 1 | -1 | 0) => void } = {}): void {
  const cap = { capture: true, passive: false } as const;
  // 全量拦截浏览器缩放（2026-10-21；user「ctrl wheel好好的帮我全量拦截一下」）：Ctrl / ⌘ + 滚轮（下面）之外还有 Ctrl / ⌘ + = / + / − / 0 这几个键——不管焦点在哪（输入框里也一样，
  //   PDF 阅读器就是这样）都不让网页缩放；交给谱面的缩放。Alt 按着的不管（别家快捷键）。
  window.addEventListener("keydown", (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const dir = e.code === "Equal" || e.code === "NumpadAdd" || e.key === "+" || e.key === "=" ? 1 : e.code === "Minus" || e.code === "NumpadSubtract" || e.key === "-" || e.key === "_" ? -1 : e.code === "Digit0" || e.code === "Numpad0" || e.key === "0" ? 0 : null;
    if (dir === null) return;
    e.preventDefault(); e.stopPropagation();
    if (!e.repeat || dir !== 0) opts.zoom?.(dir);
  }, cap);
  window.addEventListener("dblclick", (e) => { if (!isTextTarget(e.target)) e.preventDefault(); }, cap);
  window.addEventListener("touchstart", (e) => { if (e.touches.length >= 3 && !isTextTarget(e.target)) e.preventDefault(); }, cap);
  window.addEventListener("gesturestart", (e) => e.preventDefault(), cap);
  window.addEventListener("gesturechange", (e) => e.preventDefault(), cap);
  // Ctrl + 滚轮 / 触控板捏合：哪儿都不缩放网页（v0.10.30；user「ctrl wheel不应该zoom网页，而是应该被拦截」）——谱面上它 = 缩放这张纸（score-view）
  window.addEventListener("wheel", (e) => { if (e.ctrlKey) e.preventDefault(); }, cap);
  document.addEventListener("selectstart", (e) => { if (!isTextTarget(e.target)) e.preventDefault(); }, { capture: true });
  document.addEventListener("selectionchange", () => {   // iOS 偶尔无视 selectstart：输入框外冒出非空选区就立刻清掉，系统菜单没得依附
    const sel = document.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
    let n: Node | null = sel.anchorNode;
    if (n && n.nodeType === Node.TEXT_NODE) n = n.parentElement;
    for (let el = n as HTMLElement | null; el; el = el.parentElement) if (isTextTarget(el)) return;
    sel.removeAllRanges();
  });
  for (const s of surfaces) {
    s.addEventListener("contextmenu", (e) => { if (!isTextTarget(e.target)) e.preventDefault(); });
    // 面上嵌着的原生滚动区放行：touchstart 一 preventDefault 浏览器就不滚它了——速度框里的滚轮 .drum-col（user 2026-10-07「节拍器的滚动选数字好像也坏了」= iPad 上拨不动）、
    //   pad 的符号层（高度钉在音键那几排、多了的格子在里面滚；user 2026-10-08「多出来的溢出的可以滚键盘」）
    s.addEventListener("touchstart", (e) => { if (e.touches.length === 1 && !isTextTarget(e.target) && !(e.target as HTMLElement).closest?.(".drum-col, .pad-grid.symbols")) e.preventDefault(); }, { passive: false });
  }
}
