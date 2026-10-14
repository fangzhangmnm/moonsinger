// drum.ts —— 竖直滚轮（像 iOS 选日期的那种）：点开 pad 的旋钮，以那一格为中心展开（放不下就往里挪）、和旋钮一样宽，浮在音键上面。created 2026-10-07 by Claude Opus 5.5
// user 2026-10-07「我想的是点了之后变成一个overlay的同样宽度的竖直滚动桶？」→「2好主意！ 试一下吧」「1也同意」→
//   「宽度比例不合理，能不能共用原来的宽度」（几列合起来 = 旋钮那一格的宽度）→
//   「点了之后放完动画再回去响应太慢了，拖动的物理也很难受，能不能换成标准的」→ 用浏览器原生的滚动 + 吸附（scroll-snap），
//   惯性 / 手感和系统里别的列表一样；点一格 = 立刻选中、立刻收起；点外面 / Esc = 收起（点外面这一下吃掉，不顺手按到音键）。
//   不按时间自己收起（user「点开之后弹出来的滚轮不应该限时自动关，这样我几乎点不了」）。
// · 停在中间高亮带里的那格 = 选中，一变就生效（旋钮上的字跟着变 = 预览）。
// · 只在点一下旋钮时展开（按住滑 = 在旋钮那一格里原地滑，见 pad.ts；user「我希望手指松了立刻停，不要顿一下，这是快速输入。要不还是做成in place 滑动只在窗格里面预览」）。
// · 一根滚轮可以并几列（长短 + 连音）：每列各滚各的。
// · loop 列 = 环（五度圈；user「五度圈应该是一个环吧」）：内容摆 LOOP_COPIES 份，从中间那份开始；滚停了悄悄挪回中间那份（看起来一样），一直转都转不到头。

export interface DrumColumn { items: string[]; index: number; width: number; title?: string; loop?: boolean }   // items = 每格的 HTML；loop = 首尾相接
export interface DrumOpts { onChange(col: number, index: number): void; onClose?(): void }
/** setItems：换某一列的内容（位置不变）——长短一变，连音那列的小蝌蚪跟着变（user「三联五联的小蝌蚪应该跟着base时值adaptive的变」）。 */
export interface DrumHandle { close(): void; setItems(col: number, items: string[]): void }

const ROW = 44, VISIBLE = 5;   // 每格高、看得见几格（中间那格 = 选中）
const LOOP_COPIES = 7, RECENTER_MS = 140;   // 环：摆几份；滚停了多久挪回中间那份

let current: { close(): void } | null = null;

/** 在 anchor（旋钮）那里展开：选中带对着旋钮（旋钮在最下面一排时放不下，就整根往上挪）。同时只开一根，再开会先收起旧的。 */
export function openDrum(anchor: HTMLElement, cols: DrumColumn[], o: DrumOpts): DrumHandle {
  current?.close();
  const r = anchor.getBoundingClientRect();
  const box = document.createElement("div");
  box.className = "drum";
  const total = cols.reduce((s, c) => s + c.width, 0) + (cols.length - 1) * 2;
  let left = r.left;
  if (left + total > innerWidth - 4) left = Math.max(4, r.right - total);   // 右边放不下：从右往左展开
  Object.assign(box.style, { left: `${left}px`, top: `${Math.max(4, Math.min(r.top + r.height / 2 - (ROW * VISIBLE) / 2, innerHeight - ROW * VISIBLE - 4))}px`, height: `${ROW * VISIBLE}px` });
  document.body.appendChild(box);
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    box.remove(); document.removeEventListener("pointerdown", outside, true); removeEventListener("keydown", esc, true);
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

  const wheels = cols.map((c, ci) => {
    const col = document.createElement("div");
    col.className = "drum-col"; col.style.width = `${c.width}px`;
    if (c.title) col.title = c.title;
    box.appendChild(col);
    return mountWheel(col, { items: c.items, index: c.index, loop: c.loop, onChange: (i) => o.onChange(ci, i), onPick: () => close() });   // 点一格 = 立刻选中、立刻收起（不等动画）
  });
  const handle: DrumHandle = {
    close,
    setItems: (ci, items) => wheels[ci]?.setItems(items),
  };
  current = handle;
  return handle;
}
export const closeDrum = () => current?.close();

export interface WheelOpts { items: string[]; index: number; row?: number; visible?: number; loop?: boolean; onChange(i: number): void; onPick?(i: number): void }
export interface WheelHandle { setItems(items: string[]): void; scrollTo(i: number): void }
/** 一根滚轮（浏览器原生滚动 + 吸附：手感 = 系统里别的列表；慢拖微调、一甩靠惯性滑一大段）。弹出的滚轮（上面）和速度面板里嵌着的共用一份。
 *  col = 一个 class 为 drum-col 的空元素（CSS 管滚动和吸附），高度 = row × visible。停在中间那格 = 选中，一变就 onChange；点一格 = onPick。 */
export function mountWheel(col: HTMLElement, c: WheelOpts): WheelHandle {
  const row = c.row ?? ROW, visible = c.visible ?? VISIBLE, padRows = Math.floor(visible / 2), n = c.items.length;
  const copies = c.loop ? LOOP_COPIES : 1, mid = Math.floor(copies / 2) * n;
  col.style.height = `${row * visible}px`;
  col.innerHTML = `<div class="drum-pad" style="height:${row * padRows}px"></div>` +
    Array.from({ length: n * copies }, (_, r) => `<div class="drum-item" data-i="${r}" style="height:${row}px">${c.items[r % n]}</div>`).join("") +
    `<div class="drum-pad" style="height:${row * padRows}px"></div>`;
  const items = [...col.querySelectorAll<HTMLElement>(".drum-item")], total = items.length;
  const raw = () => Math.max(0, Math.min(total - 1, Math.round(col.scrollTop / row)));
  let shown = c.index, recenter = 0;
  const paint = () => {
    const top = col.scrollTop, a = raw();
    items.forEach((el, i) => { el.style.opacity = String(Math.max(0.25, 1 - (Math.abs(i * row - top) / row) * 0.3)); el.classList.toggle("on", i === a); });
  };
  col.scrollTop = (c.index + mid) * row;
  paint();
  col.addEventListener("scroll", () => {
    paint();
    const i = raw() % n; if (i !== shown) { shown = i; c.onChange(i); }
    if (c.loop) {   // 环：滚停了挪回中间那份（内容一样，看不出来）
      clearTimeout(recenter);
      recenter = window.setTimeout(() => { const r = raw(); if (Math.abs(r - (r % n) - mid) >= n) col.scrollTop = ((r % n) + mid) * row; }, RECENTER_MS);
    }
  }, { passive: true });
  col.addEventListener("click", (e) => {
    const it = (e.target as HTMLElement).closest<HTMLElement>(".drum-item"); if (!it) return;
    const i = Number(it.dataset.i) % n;
    if (i !== shown) { shown = i; c.onChange(i); }
    if (c.onPick) c.onPick(i); else col.scrollTop = (i + mid) * row;
  });
  return {
    setItems: (its) => items.forEach((el, i) => { const h = its[i % its.length]; if (h !== undefined) el.innerHTML = h; }),
    scrollTo: (i) => { shown = i; col.scrollTop = (i + mid) * row; paint(); },   // 外面改了值（点候选 / 打字）：滚过去，不再回报 onChange
  };
}
