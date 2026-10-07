// drum.ts —— 竖直滚轮（像 iOS 选日期的那种）：点开 pad 的旋钮，从那一格往下展开一根同样宽的滚轮，浮在音键上面。created 2026-10-07 by Claude Opus 5.5
// user 2026-10-07「我想的是点了之后变成一个overlay的同样宽度的竖直滚动桶？」→ AI 复述（往下展开、盖住下面的音键；
//   长短那根旁边再并一根窄的连音滚轮）→ user「2好主意！ 试一下吧」。
// · 上下拨：带惯性、停下来吸附到一格；停在中间高亮带里的就是选中的值，一变就生效（旋钮上的字跟着变 = 预览）。
// · 点某一格 = 滚到它。拨完停稳一会儿自己收起；点滚轮外面 / Esc = 收起。
// · 一根滚轮可以并几列（长短 + 连音）：每列各滚各的。

export interface DrumColumn { items: string[]; index: number; width: number; title?: string }   // items = 每格的 HTML
export interface DrumOpts { onChange(col: number, index: number): void; onClose?(): void }

const ROW = 44, VISIBLE = 5;   // 每格高、看得见几格（中间那格 = 选中）
const FRICTION = 0.92, IDLE_CLOSE = 900;

let current: { close(): void } | null = null;

/** 在 anchor（旋钮）那里往下展开。同时只开一根，再开会先收起旧的。 */
export function openDrum(anchor: HTMLElement, cols: DrumColumn[], o: DrumOpts): { close(): void } {
  current?.close();
  const r = anchor.getBoundingClientRect();
  const box = document.createElement("div");
  box.className = "drum";
  const total = cols.reduce((s, c) => s + c.width, 0) + (cols.length - 1) * 2;
  let left = r.left;
  if (left + total > innerWidth - 4) left = Math.max(4, r.right - total);   // 右边放不下：从右往左展开
  Object.assign(box.style, { left: `${left}px`, top: `${Math.max(4, Math.min(r.top, innerHeight - ROW * VISIBLE - 4))}px`, height: `${ROW * VISIBLE}px` });
  document.body.appendChild(box);
  let idle = 0, closed = false;
  const close = () => {
    if (closed) return; closed = true;
    clearTimeout(idle); box.remove(); document.removeEventListener("pointerdown", outside, true); removeEventListener("keydown", esc, true);
    if (current === handle) current = null;
    o.onClose?.();
  };
  // 点外面 = 只收起：这一下吃掉，不顺手按到底下的音键（不然收个滚轮就多写一个音）
  const outside = (e: PointerEvent) => { if (!box.contains(e.target as Node)) { e.preventDefault(); e.stopPropagation(); close(); } };
  const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); } };
  const settle = () => { clearTimeout(idle); idle = window.setTimeout(close, IDLE_CLOSE); };
  setTimeout(() => document.addEventListener("pointerdown", outside, true), 0);   // 打开它的那一下不算「点外面」
  addEventListener("keydown", esc, true);
  box.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });   // iPad：长按放大镜 / 选字 / 滚页面都不要

  cols.forEach((c, ci) => {
    const col = document.createElement("div");
    col.className = "drum-col"; col.style.width = `${c.width}px`;
    if (c.title) col.title = c.title;
    const strip = document.createElement("div");
    strip.className = "drum-strip";
    strip.innerHTML = c.items.map((h, i) => `<div class="drum-item" data-i="${i}">${h}</div>`).join("");
    col.appendChild(strip);
    box.appendChild(col);
    const n = c.items.length, pad = ROW * Math.floor(VISIBLE / 2);
    let y = -c.index * ROW, shown = c.index, raf = 0;
    const clampY = (v: number) => Math.max(-(n - 1) * ROW, Math.min(0, v));
    const paint = () => {
      strip.style.transform = `translateY(${pad + y}px)`;
      strip.querySelectorAll<HTMLElement>(".drum-item").forEach((el, i) => {
        const dist = Math.abs(i * ROW + y) / ROW;
        el.style.opacity = String(Math.max(0.25, 1 - dist * 0.3));
        el.classList.toggle("on", Math.round(-y / ROW) === i);
      });
      const at = Math.max(0, Math.min(n - 1, Math.round(-y / ROW)));
      if (at !== shown) { shown = at; o.onChange(ci, at); }
    };
    const animateTo = (target: number) => {
      cancelAnimationFrame(raf);
      const step = () => { y += (target - y) * 0.25; if (Math.abs(target - y) < 0.5) { y = target; paint(); settle(); return; } paint(); raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    };
    const coast = (v: number) => {   // 惯性：px / 帧，越来越慢，慢到一定程度吸附到最近的一格
      cancelAnimationFrame(raf);
      const step = () => {
        y = clampY(y + v); v *= FRICTION; paint();
        if (Math.abs(v) < 0.6 || y === 0 || y === -(n - 1) * ROW) { animateTo(Math.round(y / ROW) * ROW); return; }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    let drag: { pid: number; y0: number; start: number; moved: boolean; hist: { t: number; y: number }[] } | null = null;
    col.addEventListener("pointerdown", (e) => {
      e.preventDefault(); clearTimeout(idle); cancelAnimationFrame(raf);
      try { col.setPointerCapture(e.pointerId); } catch { /* 合成的指针 */ }
      drag = { pid: e.pointerId, y0: e.clientY, start: y, moved: false, hist: [{ t: performance.now(), y: e.clientY }] };
    });
    col.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.pid) return;
      const dy = e.clientY - drag.y0;
      if (Math.abs(dy) > 4) drag.moved = true;
      y = clampY(drag.start + dy); paint();
      drag.hist.push({ t: performance.now(), y: e.clientY }); if (drag.hist.length > 6) drag.hist.shift();
    });
    const end = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.pid) return;
      const d = drag; drag = null;
      if (!d.moved) {   // 点了一格 = 滚到它
        const it = (e.target as HTMLElement).closest<HTMLElement>(".drum-item");
        animateTo(it ? -Number(it.dataset.i) * ROW : Math.round(y / ROW) * ROW); return;
      }
      const a = d.hist[0], b = d.hist[d.hist.length - 1], dt = Math.max(1, b.t - a.t);
      if (performance.now() - b.t > 80) { animateTo(Math.round(y / ROW) * ROW); return; }   // 手指停住了再松开 = 不甩，就落在这一格
      coast(((b.y - a.y) / dt) * 16);
    };
    col.addEventListener("pointerup", end); col.addEventListener("pointercancel", end);
    paint();
  });
  const handle = { close };
  current = handle;
  return handle;
}
export const closeDrum = () => current?.close();
