// drum.ts —— 竖直滚轮（像 iOS 选日期的那种）：点开 pad 的旋钮，从那一格往下展开、和旋钮一样宽，浮在音键上面。created 2026-10-07 by Claude Opus 5.5
// user 2026-10-07「我想的是点了之后变成一个overlay的同样宽度的竖直滚动桶？」→「2好主意！ 试一下吧」「1也同意」→
//   「宽度比例不合理，能不能共用原来的宽度」（几列合起来 = 旋钮那一格的宽度）→
//   「点了之后放完动画再回去响应太慢了，拖动的物理也很难受，能不能换成标准的」→ 用浏览器原生的滚动 + 吸附（scroll-snap），
//   惯性 / 手感和系统里别的列表一样；点一格 = 立刻选中、立刻收起；滚完停稳很快自己收起；点外面 / Esc = 收起（点外面这一下吃掉，不顺手按到音键）。
// · 停在中间高亮带里的那格 = 选中，一变就生效（旋钮上的字跟着变 = 预览）。
// · 看得见才滑（user「嗯，试一下」，接「上下滚动我是说音域，想想如果键盘是一个可以滑动的纸，那么你往上滑应该是往下看」）：
//   按住旋钮就当场展开、同一根手指直接拖第一列（内容跟着手指走——和纸、和系统列表一样），松手吸附到最近一格；按着不收。
// · 一根滚轮可以并几列（长短 + 连音）：每列各滚各的。

export interface DrumColumn { items: string[]; index: number; width: number; title?: string }   // items = 每格的 HTML
export interface DrumOpts { onChange(col: number, index: number): void; onClose?(): void }
/** 由外面的手指（按住旋钮那一下）拖第一列：dragBy(dy) 的 dy = 手指从按下到现在往下挪了多少 px；dragEnd(moved) 松手（没挪 = 只是点开，留着）。 */
export interface DrumHandle { close(): void; dragStart(): void; dragBy(dy: number): void; dragEnd(moved: boolean): void }

const ROW = 44, VISIBLE = 5;   // 每格高、看得见几格（中间那格 = 选中）
const SETTLE = 120, CLOSE_AFTER = 450;   // ms：滚动停了多久算停稳；停稳以后多久收起

let current: { close(): void } | null = null;

/** 在 anchor（旋钮）那里往下展开。同时只开一根，再开会先收起旧的。 */
export function openDrum(anchor: HTMLElement, cols: DrumColumn[], o: DrumOpts): DrumHandle {
  current?.close();
  const r = anchor.getBoundingClientRect();
  const box = document.createElement("div");
  box.className = "drum";
  const total = cols.reduce((s, c) => s + c.width, 0) + (cols.length - 1) * 2;
  let left = r.left;
  if (left + total > innerWidth - 4) left = Math.max(4, r.right - total);   // 右边放不下：从右往左展开
  Object.assign(box.style, { left: `${left}px`, top: `${Math.max(4, Math.min(r.top, innerHeight - ROW * VISIBLE - 4))}px`, height: `${ROW * VISIBLE}px` });
  document.body.appendChild(box);
  let closeTimer = 0, closed = false, holding = false;
  const close = () => {
    if (closed) return; closed = true;
    clearTimeout(closeTimer); box.remove(); document.removeEventListener("pointerdown", outside, true); removeEventListener("keydown", esc, true);
    if (current === handle) current = null;
    o.onClose?.();
  };
  // 点外面 = 只收起：这一下吃掉，不顺手按到底下的音键（不然收个滚轮就多写一个音）
  //   点到另一个旋钮不吃：旧的收起、那个旋钮照常展开自己的
  const outside = (e: PointerEvent) => {
    if (box.contains(e.target as Node)) return;
    if (!(e.target as HTMLElement).closest?.("[data-knob]")) { e.preventDefault(); e.stopPropagation(); }
    close();
  };
  const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); } };
  setTimeout(() => document.addEventListener("pointerdown", outside, true), 0);   // 打开它的那一下不算「点外面」
  addEventListener("keydown", esc, true);

  cols.forEach((c, ci) => {
    const col = document.createElement("div");
    col.className = "drum-col"; col.style.width = `${c.width}px`;
    if (c.title) col.title = c.title;
    const padRows = Math.floor(VISIBLE / 2);
    col.innerHTML = `<div class="drum-pad" style="height:${ROW * padRows}px"></div>` +
      c.items.map((h, i) => `<div class="drum-item" data-i="${i}">${h}</div>`).join("") +
      `<div class="drum-pad" style="height:${ROW * padRows}px"></div>`;
    box.appendChild(col);
    const items = [...col.querySelectorAll<HTMLElement>(".drum-item")], n = items.length;
    let shown = c.index, settleTimer = 0;
    const at = () => Math.max(0, Math.min(n - 1, Math.round(col.scrollTop / ROW)));
    const paint = () => {
      const top = col.scrollTop, a = at();
      items.forEach((el, i) => { el.style.opacity = String(Math.max(0.25, 1 - (Math.abs(i * ROW - top) / ROW) * 0.3)); el.classList.toggle("on", i === a); });
    };
    col.scrollTop = c.index * ROW;
    paint();
    col.addEventListener("scroll", () => {
      paint();
      const i = at(); if (i !== shown) { shown = i; o.onChange(ci, i); }
      clearTimeout(closeTimer); clearTimeout(settleTimer);
      if (!holding) settleTimer = window.setTimeout(() => { closeTimer = window.setTimeout(close, CLOSE_AFTER); }, SETTLE);   // 停稳了：过一会儿收起（手指按着旋钮拖的时候不收）
    }, { passive: true });
    col.addEventListener("click", (e) => {   // 点一格 = 立刻选中、立刻收起（不等动画）
      const it = (e.target as HTMLElement).closest<HTMLElement>(".drum-item"); if (!it) return;
      const i = Number(it.dataset.i);
      if (i !== shown) { shown = i; o.onChange(ci, i); }
      close();
    });
  });
  const first = box.querySelector<HTMLElement>(".drum-col")!;
  let startTop = 0;
  const handle: DrumHandle = {
    close,
    dragStart: () => { holding = true; clearTimeout(closeTimer); first.style.scrollSnapType = "none"; startTop = first.scrollTop; },   // 拖的时候先不吸附（不然一格一格跳）
    dragBy: (dy) => { first.scrollTop = startTop - dy; },
    dragEnd: (moved) => {
      holding = false; first.style.scrollSnapType = "";
      if (!moved) return;
      first.scrollTo({ top: Math.round(first.scrollTop / ROW) * ROW, behavior: "smooth" });   // 吸附到最近一格
      clearTimeout(closeTimer); closeTimer = window.setTimeout(close, SETTLE + CLOSE_AFTER);   // 拖完就开始算（正好停在格子上不会再有滚动事件）；还在滚会被滚动事件推后
    },
  };
  current = handle;
  return handle;
}
export const closeDrum = () => current?.close();
