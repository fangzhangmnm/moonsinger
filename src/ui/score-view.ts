// score-view.ts —— 谱面板：画谱、指针、光标跟随、就地写歌词。created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 改
// 选中 = 改，光标 = 写（user「智能识别，选中音符就是改，光标就是写 对」）：
//   点音符 = 选中它（Shift+点 = 把选中扩到它）；点写字头那一列的线 / 间 = 在光标处写这个音；点歌词那一行 = 在那个音下面打开歌词框；
//   点别处 = 放光标。笔 / 鼠标拖符头：上下改音高（按五线谱一级一级吸附）、左右改时值（离散阶梯）；手指拖 = 滚动，手指轻点和笔一样。
// 歌词就地写（user「歌词输入不应该放在键盘上，而是放在五线谱下面点进去一个一个写或者删」）：见 lyric-editor.ts。

import { type EditorState, type NoteTok, writePitch, setCaret, select, setNote, setDur, unitDur, prevPitch, inputKey, keyAt, TPQ } from "../score/song.ts";
import { fromDiatonic, HOME } from "../score/pitch.ts";
import { engrave, LYRIC_EM, type Layout } from "../render/engrave.ts";
import { toSvg } from "../render/svg.ts";
import { LyricEditor } from "./lyric-editor.ts";

/** 拖时值的阶梯：三十二分起，plain 与附点交替（都画得出来）。 */
const DUR_LADDER = [6, 12, 18, 24, 36, 48, 72, 96, 144, 192].map((v) => (v * TPQ) / 48);

export interface ScoreViewHost { get(): EditorState; set(next: EditorState): void; audition?(i: number): void }

export class ScoreView {
  layout: Layout | null = null;
  private sheet: HTMLDivElement;
  private ctx = document.createElement("canvas").getContext("2d")!;
  private drag: null | { index: number; d0: number; dur0: number; x0: number; y0: number; axis: "" | "x" | "y"; pid: number } = null;
  private finger: null | { pid: number; y0: number; top0: number; x: number; y: number; moved: boolean; shift: boolean } = null;
  readonly lyrics: LyricEditor;

  constructor(private el: HTMLElement, private host: ScoreViewHost) {
    this.sheet = document.createElement("div"); this.sheet.className = "sheet";
    el.replaceChildren(this.sheet);
    this.lyrics = new LyricEditor(this.sheet, host, () => this.layout, () => this.render());
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
    const writing = !st.sel;
    const preview = writing ? { dur: unitDur(st.input), acc: st.input.acc, pitch: prevPitch(st.song.tokens, st.caret) ?? HOME } : null;
    this.layout = engrave(st.song, { width, sp, caret: st.caret, sel: st.sel, preview, measureLyric: (s) => this.ctx.measureText(s).width });
    const svg = toSvg(this.layout);
    const old = this.sheet.querySelector("svg");
    if (old) old.outerHTML = svg; else this.sheet.insertAdjacentHTML("afterbegin", svg);
    this.lyrics.reposition();
    this.follow();
  }

  /** 光标（或选中）那一行保持在视野里（只滚谱面板自己，页面不滚）。 */
  private follow(): void {
    const L = this.layout, st = this.host.get(); if (!L) return;
    let sys = L.head?.system ?? -1;
    if (sys < 0 && st.sel) sys = L.notes.find((n) => n.index >= st.sel!.from && n.index < st.sel!.to)?.system ?? -1;
    if (this.lyrics.open) sys = this.lyrics.system;
    const box = L.systems[sys]; if (!box) return;
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
    if ((e.target as HTMLElement).closest(".lyric-input")) return;   // 在歌词框里点：交给输入框
    const L = this.layout; if (!L) return;
    this.el.focus({ preventScroll: true });   // 点谱面 = 键盘回到谱上（下面 preventDefault 会拦掉浏览器默认的抢焦点）
    const p = this.local(e);
    if (e.pointerType === "touch") {   // 手指：拖 = 滚动；不动 = 和笔一样的轻点
      this.finger = { pid: e.pointerId, y0: e.clientY, top0: this.el.scrollTop, x: p.x, y: p.y, moved: false, shift: e.shiftKey };
      this.el.setPointerCapture(e.pointerId); return;
    }
    e.preventDefault();
    this.tap(p.x, p.y, e.shiftKey, e.pointerId);
  }

  /** 一次轻点：歌词行 → 歌词框；音符 → 选中（+ 笔 / 鼠标开始拖）；写字头 → 写；别处 → 光标。 */
  private tap(x: number, y: number, shift: boolean, pid: number | null): void {
    const L = this.layout!, sp = L.sp, sys = this.systemAt(y), st = this.host.get();
    this.lyrics.commitAndClose();
    // 1. 歌词那一行
    const ly = L.lyricY(sys);
    if (y > ly - sp * 2.2 && y < ly + sp * 1.2) {
      const cands = L.lyrics.filter((h) => h.system === sys);
      if (cands.length) { const best = cands.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a)); if (Math.abs(best.x - x) < sp * 4) { this.lyrics.openAt(best.index); return; } }
    }
    // 2. 音符
    const hit = L.notes.find((n) => n.system === sys && x >= n.x - sp * 0.5 && x <= n.x + n.w + sp * 0.5 && Math.abs(y - n.y) <= sp * 0.9);
    if (hit) {
      const cur = st.sel;
      this.host.set(shift && cur ? select(st, Math.min(cur.from, hit.index), Math.max(cur.to, hit.index + 1)) : select(st, hit.index, hit.index + 1));
      this.host.audition?.(hit.index);
      if (pid !== null) {
        const t = st.song.tokens[hit.index] as NoteTok;
        this.drag = { index: hit.index, d0: hit.d, dur0: t.dur, x0: x, y0: y, axis: "", pid };
        this.el.setPointerCapture(pid);
      }
      return;
    }
    // 3. 写字头那一列（写的时候才有）
    const h = L.head;
    if (h && sys === h.system && x >= h.x && x <= h.x + h.w) {
      const d = L.dOf(sys, y);
      if (d >= 20 && d <= 48) { const ns = writePitch(st, fromDiatonic(d, inputKey(st))); this.host.set(ns); this.host.audition?.(ns.caret - 1); }
      return;
    }
    // 4. 别处 → 光标（= 写）
    const cands = L.slots.filter((s) => s.system === sys);
    if (!cands.length) return;
    const best = cands.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
    this.host.set(setCaret(st, best.caret));
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
      const ns = setNote(st, g.index, { pitch: fromDiatonic(g.d0 + steps, keyAt(st.song, g.index)) });
      if (ns !== st) { this.host.set(ns); if (steps) this.host.audition?.(g.index); }
    } else {
      const i0 = DUR_LADDER.reduce((bi, v, i) => (Math.abs(v - g.dur0) < Math.abs(DUR_LADDER[bi] - g.dur0) ? i : bi), 0);
      const i = Math.max(0, Math.min(DUR_LADDER.length - 1, i0 + Math.round(dx / (L.sp * 2.2))));
      this.host.set(setDur(st, g.index, DUR_LADDER[i]));
    }
  }

  private up(e: PointerEvent): void {
    if (this.finger && e.pointerId === this.finger.pid) {
      const f = this.finger; this.finger = null;
      if (!f.moved && this.layout) this.tap(f.x, f.y, f.shift, null);
      return;
    }
    if (this.drag && e.pointerId === this.drag.pid) this.drag = null;
  }
}
