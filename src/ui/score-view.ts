// score-view.ts —— 谱面板：画谱、指针、光标跟随、就地写歌词。created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 改
// 选中 = 改，光标 = 写（user「智能识别，选中音符就是改，光标就是写 对」）：
//   点音符 = 选中它（Shift+点 = 把选中扩到它）；点歌词那一行 = 在那个音下面打开歌词框；
//   点谱面写音 2026-10-07 拿掉（user「先去掉触碰加音符的功能，以后用专门的toolstate做」）——指针现在只选、只拖、只放光标；
//   点别处 = 放光标。笔 / 鼠标拖符头：上下改音高（按五线谱一级一级吸附）、左右改时值（离散阶梯）；手指拖 = 滚动，手指轻点和笔一样。
// 歌词就地写（user「歌词输入不应该放在键盘上，而是放在五线谱下面点进去一个一个写或者删」）：见 lyric-editor.ts。
// 点记号（调号 / 拍号 / 速度）= 就地改：见 mark-editor.ts。
// 框选（user「框选 + 整体移调 / 转调 也先做」）：笔 / 鼠标在空白处拖 = 拉一个框，框住的音（第一个到最后一个之间的一整段）实时选中；
//   空白处不拖 = 放光标（松开时才放）；手指拖照旧是滚动。
// 试听：笔 / 鼠标按住音符 = 一直响，上下拖到新音高就换成新的（一张嘴，新的顶掉旧的），松手停；横拖改时长不出声
//   （user「拖动音高的时候最好也有预览。新的抢占旧的。然后改时长和velocity就不用预览了」）。手指轻点 = 响一下。

import { type EditorState, type NoteTok, setCaret, select, setNote, setDur, keyAt, TPQ } from "../score/song.ts";
import { fromDiatonic } from "../score/pitch.ts";
import { engrave, LYRIC_EM, type Layout } from "../render/engrave.ts";
import { toSvg } from "../render/svg.ts";
import { LyricEditor } from "./lyric-editor.ts";
import { MarkEditor } from "./mark-editor.ts";
import { TitleEditor } from "./title-editor.ts";

/** 拖时值的阶梯：三十二分起，plain 与附点交替（都画得出来）。 */
const DUR_LADDER = [6, 12, 18, 24, 36, 48, 72, 96, 144, 192].map((v) => (v * TPQ) / 48);

export interface ScoreViewHost {
  get(): EditorState; set(next: EditorState): void;
  /** 唱下标 i 那个音：hold = 按住一直响（等 release），否则响一下。 */
  audition?(i: number, hold?: boolean): void;
  /** 拖音高时换到下标 i 的新音高（新的顶掉旧的；怎么顶由采样器定：滑过去或重新起音）。 */
  glide?(i: number): void;
  release?(): void;
  /** 五线谱像文本框（user「可以想象五线谱是文本框，你touch点了会弹键盘。然后点别的地方会隐藏」）：
   *  staff = 点在谱上（音 / 空白 / 框选）；text = 打开了要系统键盘的框（歌词 / 歌名）。记号框不算（触屏上不弹系统键盘）。 */
  focus?(where: "staff" | "text"): void;
  /** 按拍号自动画小节线开着没有（默认开）。 */
  autoBars?(): boolean;
  /** 歌手牌：第一行谱号左边的声部名（未选角 = empty）；点了 = onPart（选乐器、就地改它的设置）。 */
  part?(): { name: string; empty: boolean } | null;
  onPart?(): void;
}

export class ScoreView {
  layout: Layout | null = null;
  private sheet: HTMLDivElement;
  private ctx = document.createElement("canvas").getContext("2d")!;
  private drag: null | { index: number; d0: number; dur0: number; x0: number; y0: number; axis: "" | "x" | "y"; pid: number; heard: number } = null;
  private finger: null | { pid: number; y0: number; top0: number; x: number; y: number; moved: boolean; shift: boolean } = null;
  private box: null | { pid: number; x0: number; y0: number; moved: boolean; st0: EditorState } = null;
  private boxEl: HTMLDivElement;
  readonly lyrics: LyricEditor;
  readonly marks: MarkEditor;
  readonly title: TitleEditor;

  constructor(private el: HTMLElement, private host: ScoreViewHost) {
    this.sheet = document.createElement("div"); this.sheet.className = "sheet";
    this.boxEl = document.createElement("div"); this.boxEl.className = "marquee"; this.boxEl.hidden = true;
    el.replaceChildren(this.sheet);
    this.lyrics = new LyricEditor(this.sheet, host, () => this.layout, () => this.render());
    this.marks = new MarkEditor(this.sheet, host, () => this.layout, () => this.render());
    this.title = new TitleEditor(this.sheet, host, () => this.layout);
    el.addEventListener("pointerdown", (e) => this.down(e));
    el.addEventListener("pointermove", (e) => this.move(e));
    el.addEventListener("pointerup", (e) => this.up(e));
    el.addEventListener("pointercancel", () => { if (this.drag) this.host.release?.(); this.drag = null; this.finger = null; this.box = null; this.boxEl.hidden = true; });
    new ResizeObserver(() => this.render()).observe(el);
  }

  /** 五线谱间距（px）：触屏 11、鼠标 10；窄屏（< 420，iPhone）跟着宽度小一点，最小 8.5（user「iPhone SE2 一行只有一小节加一大片空白 几个简易试一下」）。 */
  get sp(): number {
    const base = matchMedia("(pointer: coarse)").matches ? 11 : 10, w = this.el.clientWidth;
    return w > 0 && w < 420 ? Math.max(8.5, Math.min(base, w / 42)) : base;
  }

  render(): void {
    const st = this.host.get(), sp = this.sp;
    this.ctx.font = `${LYRIC_EM * sp}px system-ui, "Hiragino Sans", "PingFang SC", "Noto Sans CJK JP", sans-serif`;
    const width = Math.max(320, this.el.clientWidth);
    this.layout = engrave(st.song, { width, sp, caret: st.caret, sel: st.sel, measureLyric: (s) => this.ctx.measureText(s).width, titlePlaceholder: true, autoBars: this.host.autoBars?.() ?? true,
      partName: this.host.part?.()?.name, partEmpty: this.host.part?.()?.empty });
    const svg = toSvg(this.layout);
    const old = this.sheet.querySelector("svg");
    if (old) old.outerHTML = svg; else this.sheet.insertAdjacentHTML("afterbegin", svg);
    if (!this.boxEl.isConnected) this.sheet.appendChild(this.boxEl);
    this.lyrics.reposition();
    this.marks.reposition();
    this.title.reposition();
    this.follow();
  }

  /** 光标（或选中）那一行保持在视野里（只滚谱面板自己，页面不滚）。 */
  private follow(): void {
    const L = this.layout, st = this.host.get(); if (!L) return;
    let sys = L.head?.system ?? -1;
    if (sys < 0 && st.sel) sys = L.notes.find((n) => n.index >= st.sel!.from && n.index < st.sel!.to)?.system ?? -1;
    if (this.lyrics.open) sys = this.lyrics.system;
    if (this.marks.open) sys = this.marks.system;
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
    if ((e.target as HTMLElement).closest(".lyric-input, .mark-ed, .title-input")) return;   // 在歌词框 / 记号框里点：交给它们
    const L = this.layout; if (!L) return;
    this.el.focus({ preventScroll: true });   // 点谱面 = 键盘回到谱上（下面 preventDefault 会拦掉浏览器默认的抢焦点）
    const p = this.local(e);
    if (e.pointerType === "touch") {   // 手指：拖 = 滚动；不动 = 和笔一样的轻点
      this.finger = { pid: e.pointerId, y0: e.clientY, top0: this.el.scrollTop, x: p.x, y: p.y, moved: false, shift: e.shiftKey };
      this.el.setPointerCapture(e.pointerId); return;
    }
    e.preventDefault();
    if (this.tap(p.x, p.y, e.shiftKey, e.pointerId)) return;
    // 空白处：先不放光标——拖了就是框选，没拖（松开）才放光标
    this.box = { pid: e.pointerId, x0: p.x, y0: p.y, moved: false, st0: this.host.get() };
    this.el.setPointerCapture(e.pointerId);
  }

  /** 一次轻点：记号 → 记号框；歌词行 → 歌词框；音符 → 选中（+ 笔 / 鼠标开始拖）。点中了东西返回 true；落在空白处返回 false（调用方决定放光标还是框选）。 */
  private tap(x: number, y: number, shift: boolean, pid: number | null): boolean {
    const L0 = this.layout!, wasMark = this.marks.open;
    this.lyrics.commitAndClose(); this.marks.commitAndClose();
    if (wasMark) { this.host.focus?.("staff"); return true; }   // 点别处 = 先收起记号框（这一下不另做事）
    const L = this.layout ?? L0, sp = L.sp, sys = this.systemAt(y), st = this.host.get();
    // 0. 歌手牌（第一行谱号左边的声部名）
    const pt = L.part;
    if (pt && x >= pt.x && x <= pt.x + pt.w && y >= pt.y && y <= pt.y + pt.h) { this.host.onPart?.(); return true; }
    // 0¼. 纸面最上面的歌名（可不填）
    const tt = L.title;
    if (x >= tt.x && x <= tt.x + tt.w && y >= tt.y && y <= tt.y + tt.h) { this.title.openNow(); this.host.focus?.("text"); return true; }
    // 0½. 记号（调号 / 拍号 / 速度）
    const mk = L.marks.find((m) => x >= m.x && x <= m.x + m.w && y >= m.y && y <= m.y + m.h);
    if (mk) { this.marks.openAt(mk.index); return true; }
    // 1. 歌词那一行
    const ly = L.lyricY(sys);
    if (y > ly - sp * 2.2 && y < ly + sp * 1.2) {
      const cands = L.lyrics.filter((h) => h.system === sys);
      if (cands.length) { const best = cands.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a)); if (Math.abs(best.x - x) < sp * 4) { this.lyrics.openAt(best.index); this.host.focus?.("text"); return true; } }
    }
    // 2. 音符
    const hit = L.notes.find((n) => n.system === sys && x >= n.x - sp * 0.5 && x <= n.x + n.w + sp * 0.5 && Math.abs(y - n.y) <= sp * 0.9);
    if (hit) {
      this.host.focus?.("staff");
      const cur = st.sel;
      this.host.set(shift && cur ? select(st, Math.min(cur.from, hit.index), Math.max(cur.to, hit.index + 1)) : select(st, hit.index, hit.index + 1));
      if (pid !== null) {   // 笔 / 鼠标：按住一直响，拖音高换音，松手停
        const t = st.song.tokens[hit.index] as NoteTok;
        this.drag = { index: hit.index, d0: hit.d, dur0: t.dur, x0: x, y0: y, axis: "", pid, heard: hit.d };
        this.el.setPointerCapture(pid);
        this.host.audition?.(hit.index, true);
      } else this.host.audition?.(hit.index);
      return true;
    }
    return false;
  }
  /** 空白处 → 最近的光标落点（= 写）。 */
  private caretAt(x: number, y: number, st = this.host.get()): EditorState {
    const L = this.layout!, sys = this.systemAt(y), cands = L.slots.filter((s) => s.system === sys);
    if (!cands.length) return st;
    const best = cands.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
    return setCaret(st, best.caret);
  }
  /** 框选：框住的音（音头中心在框里）从第一个到最后一个选成一段；一个都没框住 = 回到起点的光标。 */
  private boxSelect(x1: number, y1: number): void {
    const b = this.box!, L = this.layout!, xa = Math.min(b.x0, x1), xb = Math.max(b.x0, x1), ya = Math.min(b.y0, y1), yb = Math.max(b.y0, y1);
    Object.assign(this.boxEl.style, { left: `${xa}px`, top: `${ya}px`, width: `${xb - xa}px`, height: `${yb - ya}px` });
    const inside = L.notes.filter((n) => { const cx = n.x + n.w / 2; return cx >= xa && cx <= xb && n.y >= ya && n.y <= yb; }).map((n) => n.index);
    if (!inside.length) { this.host.set(this.caretAt(b.x0, b.y0, b.st0)); return; }
    this.host.set(select(b.st0, Math.min(...inside), Math.max(...inside) + 1));
  }

  private move(e: PointerEvent): void {
    if (this.finger && e.pointerId === this.finger.pid) {
      const dy = e.clientY - this.finger.y0;
      if (Math.abs(dy) > 6) this.finger.moved = true;
      if (this.finger.moved) this.el.scrollTop = this.finger.top0 - dy;
      return;
    }
    if (this.box && e.pointerId === this.box.pid && this.layout) {
      const p = this.local(e), b = this.box;
      if (!b.moved && Math.hypot(p.x - b.x0, p.y - b.y0) < 6) return;
      if (!b.moved) { b.moved = true; this.boxEl.hidden = false; }
      this.boxSelect(p.x, p.y);
      return;
    }
    const g = this.drag, L = this.layout; if (!g || !L || e.pointerId !== g.pid) return;
    const p = this.local(e), dx = p.x - g.x0, dy = p.y - g.y0;
    if (!g.axis) {
      if (Math.hypot(dx, dy) < 6) return;
      g.axis = Math.abs(dy) >= Math.abs(dx) ? "y" : "x";
      if (g.axis === "x") this.host.release?.();   // 改时长不出声
    }
    const st = this.host.get();
    if (g.axis === "y") {
      const d = g.d0 + Math.round(-dy / (L.sp / 2));
      if (d === g.heard) return;   // 还在同一个音高：不重画、不重新起音
      g.heard = d;
      this.host.set(setNote(st, g.index, { pitch: fromDiatonic(d, keyAt(st.song, g.index)) }));
      if (this.host.glide) this.host.glide(g.index); else this.host.audition?.(g.index, true);   // 新音顶掉旧音
    } else {
      const i0 = DUR_LADDER.reduce((bi, v, i) => (Math.abs(v - g.dur0) < Math.abs(DUR_LADDER[bi] - g.dur0) ? i : bi), 0);
      const i = Math.max(0, Math.min(DUR_LADDER.length - 1, i0 + Math.round(dx / (L.sp * 2.2))));
      this.host.set(setDur(st, g.index, DUR_LADDER[i]));
    }
  }

  private up(e: PointerEvent): void {
    if (this.finger && e.pointerId === this.finger.pid) {
      const f = this.finger; this.finger = null;
      if (!f.moved && this.layout && !this.tap(f.x, f.y, f.shift, null)) { this.host.set(this.caretAt(f.x, f.y)); this.host.focus?.("staff"); }
      return;
    }
    if (this.box && e.pointerId === this.box.pid) {
      const b = this.box; this.box = null; this.boxEl.hidden = true;
      if (!b.moved && this.layout) this.host.set(this.caretAt(b.x0, b.y0));   // 没拖 = 放光标
      this.host.focus?.("staff");
      return;
    }
    if (this.drag && e.pointerId === this.drag.pid) { if (this.drag.axis !== "x") this.host.release?.(); this.drag = null; }
  }
}
