// score-view.ts —— 谱面板：画谱、指针（笔 / 鼠标 = 编辑，手指 = 滚动和放光标）、光标跟随。created 2026-10-06 by Claude Opus 5.5
// grill 账本：「笔 = 鼠标 = 指针」负责记谱的编辑体感；拖时值吸附到离散档，只有曲线 / velocity 不吸附；手指走 pad。
//   点光标那一列（写字头）的线 / 间 = 在光标处写这个音（升降照调号）；点已有的音 = 选中（光标放到它后面）；
//   上下拖符头 = 改音高（按五线谱一级一级吸附）；左右拖 = 改时值（在一串离散时值上一档一档走）；点别处 = 放光标。

import { type EditorState, type NoteTok, writePitch, setCaret, setNote, setDur, TPQ } from "../score/song.ts";
import { fromDiatonic } from "../score/pitch.ts";
import { engrave, LYRIC_EM, type Layout } from "../render/engrave.ts";
import { toSvg } from "../render/svg.ts";

/** 拖时值的阶梯：三十二分起，plain 与附点交替（都画得出来）。 */
const DUR_LADDER = [6, 12, 18, 24, 36, 48, 72, 96, 144, 192, 288, 384].map((v) => (v * TPQ) / 48);

export interface ScoreViewHost { get(): EditorState; set(next: EditorState): void }

export class ScoreView {
  private layout: Layout | null = null;
  private ctx = document.createElement("canvas").getContext("2d")!;
  private drag: null | { index: number; d0: number; dur0: number; x0: number; y0: number; axis: "" | "x" | "y"; pid: number } = null;
  private finger: null | { pid: number; y0: number; top0: number; x: number; y: number; moved: boolean } = null;

  constructor(private el: HTMLElement, private host: ScoreViewHost) {
    el.addEventListener("pointerdown", (e) => this.down(e));
    el.addEventListener("pointermove", (e) => this.move(e));
    el.addEventListener("pointerup", (e) => this.up(e));
    el.addEventListener("pointercancel", () => { this.drag = null; this.finger = null; });
    new ResizeObserver(() => this.render()).observe(el);
  }

  get sp(): number { return matchMedia("(pointer: coarse)").matches ? 11 : 10; }

  render(): void {
    const st = this.host.get(), sp = this.sp;
    this.ctx.font = `${LYRIC_EM * sp}px system-ui, "Hiragino Sans", "PingFang SC", "Noto Sans CJK JP", sans-serif`;
    const width = Math.max(320, this.el.clientWidth);
    this.layout = engrave(st.song, { width, sp, caret: st.caret, measureLyric: (s) => this.ctx.measureText(s).width });
    this.el.innerHTML = toSvg(this.layout);
    this.follow();
  }

  /** 光标那一行保持在视野里（只滚谱面板自己，页面不滚）。 */
  private follow(): void {
    const L = this.layout; if (!L) return;
    const box = L.systems[L.head.system]; if (!box) return;
    const top = this.el.scrollTop, h = this.el.clientHeight;
    if (box.top < top) this.el.scrollTop = box.top;
    else if (box.bottom > top + h) this.el.scrollTop = box.bottom - h;
  }

  private local(e: PointerEvent): { x: number; y: number } {
    const r = this.el.getBoundingClientRect();
    return { x: e.clientX - r.left + this.el.scrollLeft, y: e.clientY - r.top + this.el.scrollTop };
  }
  private systemAt(y: number): number {
    const L = this.layout!; const i = L.systems.findIndex((s) => y >= s.top && y < s.bottom);
    return i < 0 ? L.systems.length - 1 : i;
  }

  private down(e: PointerEvent): void {
    const L = this.layout; if (!L) return;
    this.el.focus({ preventScroll: true });
    const p = this.local(e);
    if (e.pointerType === "touch") {   // 手指：滚动；不动就放光标
      this.finger = { pid: e.pointerId, y0: e.clientY, top0: this.el.scrollTop, x: p.x, y: p.y, moved: false };
      this.el.setPointerCapture(e.pointerId); return;
    }
    e.preventDefault();
    const sp = L.sp, sys = this.systemAt(p.y);
    // 1. 点在已有的音符上 → 选中 + 开始拖
    const hit = L.notes.find((n) => n.system === sys && p.x >= n.x - sp * 0.5 && p.x <= n.x + n.w + sp * 0.5 && Math.abs(p.y - n.y) <= sp * 0.9);
    if (hit) {
      const st = this.host.get(), t = st.song.tokens[hit.index] as NoteTok;
      this.host.set(setCaret(st, hit.index + 1));
      this.drag = { index: hit.index, d0: hit.d, dur0: t.dur, x0: p.x, y0: p.y, axis: "", pid: e.pointerId };
      this.el.setPointerCapture(e.pointerId); return;
    }
    // 2. 点在写字头那一列 → 在光标处写这个音
    const h = L.head;
    if (sys === h.system && p.x >= h.x && p.x <= h.x + h.w) {
      const d = L.dOf(sys, p.y);
      if (d >= 20 && d <= 48) { const st = this.host.get(); this.host.set(writePitch(st, fromDiatonic(d, st.song.fifths))); }
      return;
    }
    // 3. 别处 → 放光标
    this.placeCaret(sys, p.x);
  }

  private placeCaret(sys: number, x: number): void {
    const L = this.layout!; const cands = L.slots.filter((s) => s.system === sys);
    if (!cands.length) return;
    const best = cands.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
    this.host.set(setCaret(this.host.get(), best.caret));
  }

  private move(e: PointerEvent): void {
    if (this.finger && e.pointerId === this.finger.pid) {
      const dy = e.clientY - this.finger.y0;
      if (Math.abs(dy) > 6) this.finger.moved = true;
      if (this.finger.moved) this.el.scrollTop = this.finger.top0 - dy;
      return;
    }
    const g = this.drag, L = this.layout; if (!g || !L || e.pointerId !== g.pid) return;
    const p = this.local(e), dx = p.x - g.x0, dy = p.y - g.y0;
    if (!g.axis) { if (Math.hypot(dx, dy) < 6) return; g.axis = Math.abs(dy) >= Math.abs(dx) ? "y" : "x"; }
    const st = this.host.get();
    if (g.axis === "y") {
      const steps = Math.round(-dy / (L.sp / 2));
      this.host.set(setNote(st, g.index, { pitch: fromDiatonic(g.d0 + steps, st.song.fifths) }));
    } else {
      const i0 = DUR_LADDER.reduce((bi, v, i) => (Math.abs(v - g.dur0) < Math.abs(DUR_LADDER[bi] - g.dur0) ? i : bi), 0);
      const i = Math.max(0, Math.min(DUR_LADDER.length - 1, i0 + Math.round(dx / (L.sp * 2.2))));
      this.host.set(setDur(st, g.index, DUR_LADDER[i]));
    }
  }

  private up(e: PointerEvent): void {
    if (this.finger && e.pointerId === this.finger.pid) {
      const f = this.finger; this.finger = null;
      if (!f.moved && this.layout) this.placeCaret(this.systemAt(f.y), f.x);
      return;
    }
    if (this.drag && e.pointerId === this.drag.pid) this.drag = null;
  }
}
