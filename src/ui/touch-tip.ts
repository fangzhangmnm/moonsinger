// touch-tip.ts —— 触屏上的 tooltip：长按纯图标钮 = 冒一个说明气泡。created 2026-11-04 by Claude Opus 5.5（v0.15.0）
//   触屏没有悬停，title 看不到；窄钮换成图标之后（user 2026-11-04「能图标就不文字」），iPad 上就得有地方看字。
//   只挂在下面这张名单里的钮上：它们是纯图标、又没有自己的长按。有长按的（|▶、退格、旋钮）不进名单。
//   长按到点 = 气泡出来、这一下不算点（松手不触发钮）；手指挪开 = 取消。鼠标 / 笔不管（有 tooltip）。
const TIP_BUTTONS = ".mode-seg [data-mode], .pad-head .kb-switch, .pad-head .impro-pad, .pad-head .hide-pad, .tb-lib, .tb-lock, #saveBtn, #setBtn, #undoBtn, #redoBtn, .dock-undo, .dock-redo";
const HOLD_MS = 450, MOVE_PX = 10, LINGER_MS = 1800;

export function installTouchTips(root: HTMLElement = document.body): void {
  let timer = 0, bubble: HTMLElement | null = null, hideTimer = 0, sx = 0, sy = 0, swallowClick = false;
  const hide = () => { clearTimeout(hideTimer); bubble?.remove(); bubble = null; };
  const show = (el: HTMLElement, text: string) => {
    hide();
    const b = document.createElement("div");
    b.className = "touch-tip"; b.setAttribute("role", "tooltip"); b.textContent = text;
    document.body.append(b);
    const r = el.getBoundingClientRect(), w = b.offsetWidth, h = b.offsetHeight;
    b.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2))}px`;
    b.style.top = `${r.top - h - 8 >= 8 ? r.top - h - 8 : r.bottom + 8}px`;   // 上面放不下 = 放下面（手指挡着的是下面，优先上面）
    bubble = b;
  };
  const cancel = () => { clearTimeout(timer); timer = 0; };
  root.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch") return;
    hide();
    const el = (e.target as HTMLElement).closest<HTMLElement>(TIP_BUTTONS);
    if (!el) return;
    const text = el.title || el.getAttribute("aria-label");
    if (!text) return;
    sx = e.clientX; sy = e.clientY; swallowClick = false;
    timer = window.setTimeout(() => { timer = 0; swallowClick = true; show(el, text); }, HOLD_MS);
  }, { capture: true, passive: true });
  root.addEventListener("pointermove", (e) => { if (timer && Math.hypot(e.clientX - sx, e.clientY - sy) > MOVE_PX) cancel(); }, { capture: true, passive: true });
  const up = () => { cancel(); if (bubble) { clearTimeout(hideTimer); hideTimer = window.setTimeout(hide, LINGER_MS); } };
  root.addEventListener("pointerup", up, { capture: true, passive: true });
  root.addEventListener("pointercancel", () => { cancel(); hide(); }, { capture: true, passive: true });
  // 长按过的这一下不算点
  root.addEventListener("click", (e) => { if (swallowClick) { swallowClick = false; e.preventDefault(); e.stopPropagation(); } }, { capture: true });
}
