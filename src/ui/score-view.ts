// score-view.ts —— 谱面板：画谱、指针、光标跟随、就地写歌词。created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 改；2026-10-08 多声部多纸（Claude Fable 5.1）
// 选中 = 改，光标 = 写（user「智能识别，选中音符就是改，光标就是写 对」）：
//   点音符 = 选中它（Shift+点 = 把选中扩到它）；点歌词那一行 = 在那个音下面打开歌词框；
//   点谱面写音 2026-10-07 拿掉（user「先去掉触碰加音符的功能，以后用专门的toolstate做」）——指针现在只选、只拖、只放光标；
//   点别处 = 放光标。笔 / 鼠标拖符头：上下改音高（按五线谱一级一级吸附）、左右改时值（离散阶梯）；手指拖 = 滚动，手指轻点和笔一样。
// 多声部（总谱式）：点哪条谱，光标 / 选中就到那条 track（那张纸 × 那个声部）——不另做切换器；pad 往光标所在的那条写。
// 歌词就地写（user「歌词输入不应该放在键盘上，而是放在五线谱下面点进去一个一个写或者删」）：见 lyric-editor.ts。
// 点记号（调号 / 拍号 / 速度）= 就地改：见 mark-editor.ts。点曲段名 = 就地改（title-editor.ts）；「⋯」= 纸的菜单；「＋ 新的纸」= 加一张。
// 框选（user「框选 + 整体移调 / 转调 也先做」）：笔 / 鼠标在空白处拖 = 拉一个框，框住的音（第一个到最后一个之间的一整段；只算框起点那条谱的）实时选中；
//   空白处不拖 = 放光标（松开时才放）；手指拖照旧是滚动。
// 触屏缩放（2026-10-08 user「手机之类你可以放大pan pinch」「默认开」）：双指捏合 = 放大 / 缩小这张纸（视图状态，CSS zoom，不进文件、和「谱的大小」是两回事），
//   双指拖 = 平移；放大后单指拖也能横着滚；角上「1:1」复位。只有两根手指才触发，不碰单指滚动 / 轻点 / 笔。
// 试听：笔 / 鼠标按住音符 = 一直响，上下拖到新音高就换成新的（一张嘴，新的顶掉旧的），松手停；横拖改时长不出声
//   （user「拖动音高的时候最好也有预览。新的抢占旧的。然后改时长和velocity就不用预览了」）。手指轻点 = 响一下。

import { DEFAULT_PAPER, paperOf, lineSp, spMm, staffMmOf, STAFF_MM, PAPER_LABEL } from "../score/paper.ts";
import { type EditorState, type NoteTok, setCaret, setFocus, select, setNote, setDur, keyAt, tr, TPQ } from "../score/song.ts";
import { fromDiatonic } from "../score/pitch.ts";
import { engrave, LYRIC_EM, type Layout, type PartView } from "../render/engrave.ts";
import { toSvg } from "../render/svg.ts";
import { LyricEditor } from "./lyric-editor.ts";
import { MarkEditor } from "./mark-editor.ts";
import { TitleEditor } from "./title-editor.ts";

/** 拖时值的阶梯：三十二分起，plain 与附点交替（都画得出来）。 */
const DUR_LADDER = [6, 12, 18, 24, 36, 48, 72, 96, 144, 192].map((v) => (v * TPQ) / 48);

export interface ScoreViewHost {
  get(): EditorState; set(next: EditorState): void;
  /** 唱下标 i 那个音（光标所在那条 track 的）：hold = 按住一直响（等 release），否则响一下。 */
  audition?(i: number, hold?: boolean): void;
  /** 拖音高时换到下标 i 的新音高（新的顶掉旧的；怎么顶由采样器定：滑过去或重新起音）。 */
  glide?(i: number): void;
  release?(): void;
  /** 五线谱像文本框（user「可以想象五线谱是文本框，你touch点了会弹键盘。然后点别的地方会隐藏」）：
   *  staff = 点在谱上（音 / 空白 / 框选）；text = 打开了要系统键盘的框（歌词 / 歌名）。记号框不算（触屏上不弹系统键盘）。 */
  focus?(where: "staff" | "text"): void;
  /** 按拍号自动画小节线开着没有（默认开）。 */
  autoBars?(): boolean;
  /** 要画的声部（隐藏的不在里面；顺序 = 总谱从上到下）。 */
  parts(): PartView[];
  /** 歌手牌：某张纸第一行某条谱左边的声部名点了（那条已经成了光标所在的 track）。 */
  onPart?(paper: string, part: string): void;
  /** 纸顶「⋯」点了（纸的菜单）；扳手旁的「＋」点了（新的纸）；歌名左边「‹ ›」点了（上一张 / 下一张纸）。 */
  onPaperMenu?(paper: string): void;
  onAddPaper?(): void;
  onNav?(dir: -1 | 1): void;
  /** 纸右上角的小钮（纸张）点了。 */
  onPaper?(): void;
  /** 标题下面靠右的作词 / 作曲点了。 */
  onCredits?(): void;
  /** 屏幕放不下纸的时候：true = 按屏宽重新折行；false（默认）= 不折行、整张纸按比例缩小（行和纸上一模一样）。 */
  reflow?(): boolean;
  /** 排法：true = 分页（按纸高分页、画页框，所见即所得）；false = 连续。 */
  pages?(): boolean;
}

export class ScoreView {
  layout: Layout | null = null;
  private sheet: HTMLDivElement;
  private ink: HTMLDivElement;   // 歌词框 / 记号框 / 框选的容器：分页时往右挪到版心（svg 的 viewBox 往左扩了边距）
  private ctx = document.createElement("canvas").getContext("2d")!;
  private drag: null | { index: number; d0: number; dur0: number; x0: number; y0: number; axis: "" | "x" | "y"; pid: number; heard: number } = null;
  private finger: null | { pid: number; y0: number; top0: number; x: number; y: number; moved: boolean; shift: boolean; x0: number; left0: number } = null;
  private box: null | { pid: number; x0: number; y0: number; moved: boolean; st0: EditorState; row: number } = null;
  private boxEl: HTMLDivElement;
  private touches = new Map<number, { x: number; y: number }>();   // 现在按着的手指（触屏缩放用）
  private pinch: null | { d0: number; z0: number; cx: number; cy: number } = null;   // 捏合起点：两指距离、当时的 zoom、两指中点下面那个纸面点（纸面坐标）
  private zoom = 1;
  private zoomBtn: HTMLButtonElement;
  readonly lyrics: LyricEditor;
  readonly marks: MarkEditor;
  readonly title: TitleEditor;

  constructor(private el: HTMLElement, private host: ScoreViewHost) {
    this.sheet = document.createElement("div"); this.sheet.className = "sheet";
    this.boxEl = document.createElement("div"); this.boxEl.className = "marquee"; this.boxEl.hidden = true;
    el.replaceChildren(this.sheet);
    this.ink = document.createElement("div"); this.ink.className = "sheet-ink"; this.sheet.appendChild(this.ink);
    this.zoomBtn = document.createElement("button"); this.zoomBtn.className = "btn zoom-reset"; this.zoomBtn.type = "button"; this.zoomBtn.textContent = "1:1"; this.zoomBtn.title = "回到原大"; this.zoomBtn.hidden = true;
    this.zoomBtn.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); this.setZoom(1, null); });
    el.appendChild(this.zoomBtn);
    this.lyrics = new LyricEditor(this.ink, host, () => this.layout, () => this.render());
    this.marks = new MarkEditor(this.ink, host, () => this.layout, () => this.render());
    this.title = new TitleEditor(this.ink, host, () => this.layout);
    el.addEventListener("pointerdown", (e) => this.down(e));
    el.addEventListener("pointermove", (e) => this.move(e));
    el.addEventListener("pointerup", (e) => this.up(e));
    el.addEventListener("pointercancel", (e) => { if (this.drag) this.host.release?.(); this.drag = null; this.finger = null; this.box = null; this.boxEl.hidden = true; this.touches.delete(e.pointerId); if (this.touches.size < 2) this.pinch = null; });
    new ResizeObserver(() => this.render()).observe(el);
  }

  /** 五线谱间距（px）和纸面宽（px）：触屏 11、鼠标 10 一格（× 这张纸的谱大小 / 默认档——谱小了一格就小、纸的宽度不变）；纸的版心放得下 = 严格按纸（纸居中、四周是桌面），
   *  放不下（手机）：默认不折行 = 整张纸按比例缩小；选了「折行」= 按屏宽重新折行，窄屏（< 420）一格跟着宽度小一点、最小 8.5（user「iPhone SE2 一行只有一小节加一大片空白 几个简易试一下」）。
   *  纸 = 这首歌的纸张（src/score/paper.ts，默认 A5；user「五线谱宽度：要不还是按照固定物理页框？」「看一下webxiaoheiwu屏幕太宽的时候行宽会有max」）。 */
  private frame(): { sp: number; width: number; strict: boolean; page: { h: number; l: number; r: number; t: number; b: number } | null } {
    const st = this.host.get(), paper = st.song.paper ?? paperOf(DEFAULT_PAPER), scale = staffMmOf(paper) / STAFF_MM;
    const base = (matchMedia("(pointer: coarse)").matches ? 11 : 10) * scale, avail = this.el.clientWidth;
    // 分页：整页（版心 + 左右边距）要放得下；页高 / 边距按这张纸算（sp）
    const mm = spMm(paper), m = paper.marginMm, page = this.host.pages?.() ? { h: paper.heightMm / mm, l: m.l / mm, r: m.r / mm, t: m.t / mm, b: m.b / mm } : null;
    const extra = page ? page.l + page.r : 0, want = Math.ceil((lineSp(paper) + extra) * base);
    if (avail > 0 && want <= avail) return { sp: base, width: Math.ceil(lineSp(paper) * base), strict: true, page };
    // 放不下、不折行（默认；user「纸能不能toggle不折行预览有多宽和折行的两种选项。我其实还是倾向于不折行」
    //   「我现在发现我基本不点五线谱，都是用键盘输入。这样的话其实五线谱只是让你看你在哪里」）：整张纸按比例缩小，行和纸上一样
    if (avail > 0 && (page || !(this.host.reflow?.() ?? false))) { const sp = (base * avail) / want; return { sp, width: Math.floor(lineSp(paper) * sp), strict: false, page }; }
    return { sp: avail > 0 && avail < 420 ? Math.max(8.5 * scale, Math.min(base, (avail / 42) * scale)) : base, width: Math.max(320, avail), strict: false, page: null };
  }

  render(): void {
    const st = this.host.get(), { sp, width, strict, page } = this.frame();
    const totalW = width + (page ? (page.l + page.r) * sp : 0);
    this.el.classList.toggle("desk", (strict && totalW < this.el.clientWidth - 1) || !!page);
    this.el.classList.toggle("pages", !!page);
    this.sheet.style.width = strict ? `${Math.ceil(totalW)}px` : "";
    const paper = st.song.paper ?? paperOf(DEFAULT_PAPER);
    this.ctx.font = `${LYRIC_EM * sp}px system-ui, "Hiragino Sans", "PingFang SC", "Noto Sans CJK JP", sans-serif`;
    this.layout = engrave(st.song, { width, sp, at: st.at, caret: st.caret, sel: st.sel, parts: this.host.parts(), measureLyric: (s) => this.ctx.measureText(s).width, titlePlaceholder: true,
      autoBars: this.host.autoBars?.() ?? true, paperLabel: paper.kind === "other" ? "其他纸" : PAPER_LABEL[paper.kind], ...(page ? { page } : {}) });
    this.ink.style.left = `${this.layout.pageX.left}px`;
    const svg = toSvg(this.layout);
    const old = this.sheet.querySelector("svg");
    if (old) old.outerHTML = svg; else this.sheet.insertAdjacentHTML("afterbegin", svg);
    if (!this.boxEl.isConnected) this.ink.appendChild(this.boxEl);
    this.lyrics.reposition();
    this.marks.reposition();
    this.title.reposition();
    this.follow();
  }

  /** 这个命中记录是不是光标所在那条 track 的。 */
  private onTrack(h: { system: number }): boolean {
    const L = this.layout!, st = this.host.get(), row = L.systems[h.system];
    return !!row && row.paper === st.at.paper && row.part === st.at.part;
  }
  /** 光标（或选中）那一行保持在视野里（只滚谱面板自己，页面不滚）。 */
  private follow(): void {
    const L = this.layout, st = this.host.get(); if (!L) return;
    let sys = L.head?.system ?? -1;
    if (sys < 0 && st.sel) sys = L.notes.find((n) => this.onTrack(n) && n.index >= st.sel!.from && n.index < st.sel!.to)?.system ?? -1;
    if (this.lyrics.open) sys = this.lyrics.system;
    if (this.marks.open) sys = this.marks.system;
    const box = L.systems[sys]; if (!box) return;
    const top = this.el.scrollTop, h = this.el.clientHeight, z = this.zoom;
    if (box.top * z < top) this.el.scrollTop = box.top * z;
    else if (box.bottom * z > top + h) this.el.scrollTop = box.bottom * z - h;
  }

  /** 指针 → 纸面坐标（纸可能居中在桌面上：按纸自己的位置算；放大了除回去）。 */
  private local(e: { clientX: number; clientY: number }): { x: number; y: number } {
    const r = this.sheet.getBoundingClientRect(), ox = this.layout?.pageX.left ?? 0;
    return { x: (e.clientX - r.left) / this.zoom - ox, y: (e.clientY - r.top) / this.zoom };
  }
  /** 放大 / 缩小到 z（1 = 原大，最多 5 倍）；anchor = 屏幕上这个点下面的纸面点保持不动（null = 左上角）。 */
  private setZoom(z: number, anchor: { x: number; y: number; cx: number; cy: number } | null): void {
    z = Math.max(1, Math.min(5, z));
    const r = this.el.getBoundingClientRect();
    this.zoom = z; this.sheet.style.zoom = z === 1 ? "" : String(z);
    this.el.classList.toggle("zoomed", z > 1.001);
    this.zoomBtn.hidden = z <= 1.001;
    if (anchor) {
      // 纸面点 (cx, cy)（纸面坐标）要落在屏幕 (x, y) 下面：滚动到 纸的位置 + 点 × zoom − (x − 滚动区左上)
      const nsr = this.sheet.getBoundingClientRect(), nl = nsr.left - r.left + this.el.scrollLeft, nt = nsr.top - r.top + this.el.scrollTop;
      this.el.scrollLeft = nl + anchor.cx * z - (anchor.x - r.left);
      this.el.scrollTop = nt + anchor.cy * z - (anchor.y - r.top);
    } else { this.el.scrollLeft = 0; }
    if (!this.zoomBtn.hidden) Object.assign(this.zoomBtn.style, { left: `${r.right - 54}px`, top: `${r.top + 8}px` });
  }
  /** y 落在哪条谱行（行与行之间的空隙归上面那条；都不是 = 最近的一条）。 */
  private rowAt(y: number): number {
    const L = this.layout!, rows = L.systems; if (!rows.length) return -1;
    const i = rows.findIndex((s) => y >= s.top && y < s.bottom);
    if (i >= 0) return i;
    let best = 0, bd = Infinity;
    rows.forEach((s, k) => { const d = y < s.top ? s.top - y : y - s.bottom; if (d < bd) { bd = d; best = k; } });
    return best;
  }
  /** 光标到这条谱行的 track（点哪条谱写哪条）。 */
  private focusRow(st: EditorState, row: number, caret?: number): EditorState {
    const r = this.layout!.systems[row]; if (!r) return st;
    return setFocus(st, r.paper, r.part, caret);
  }

  private down(e: PointerEvent): void {
    if ((e.target as HTMLElement).closest(".lyric-input, .lyric-merge, .mark-ed, .title-input")) return;   // 在歌词框 / 记号框里点：交给它们
    const L = this.layout; if (!L) return;
    const p = this.local(e);   // 先算纸面坐标再拿焦点：focus 可能连带滚一下（分页时光标那行在页外），坐标就错了（2026-10-08 E2E 抓到）
    this.el.focus({ preventScroll: true });   // 点谱面 = 键盘回到谱上（下面 preventDefault 会拦掉浏览器默认的抢焦点）
    if (e.pointerType === "touch") {   // 手指：拖 = 滚动；不动 = 和笔一样的轻点；第二根手指落下 = 捏合缩放 / 双指平移
      this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.el.setPointerCapture(e.pointerId);
      if (this.touches.size === 2) {
        this.finger = null;
        const [a, b] = [...this.touches.values()], mid = this.local({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 });
        this.pinch = { d0: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), z0: this.zoom, cx: mid.x, cy: mid.y };
        return;
      }
      if (this.touches.size > 2) return;
      this.finger = { pid: e.pointerId, y0: e.clientY, top0: this.el.scrollTop, x: p.x, y: p.y, moved: false, shift: e.shiftKey, x0: e.clientX, left0: this.el.scrollLeft };
      return;
    }
    e.preventDefault();
    if (this.tap(p.x, p.y, e.shiftKey, e.pointerId)) return;
    // 空白处：先不放光标——拖了就是框选，没拖（松开）才放光标
    this.box = { pid: e.pointerId, x0: p.x, y0: p.y, moved: false, st0: this.host.get(), row: this.rowAt(p.y) };
    this.el.setPointerCapture(e.pointerId);
  }

  private inBox(b: { x: number; y: number; w: number; h: number } | null | undefined, x: number, y: number): boolean { return !!b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }
  /** 一次轻点：记号 → 记号框；歌词行 → 歌词框；音符 → 选中（+ 笔 / 鼠标开始拖）。点中了东西返回 true；落在空白处返回 false（调用方决定放光标还是框选）。 */
  private tap(x: number, y: number, shift: boolean, pid: number | null): boolean {
    const L0 = this.layout!, wasMark = this.marks.open;
    this.lyrics.commitAndClose(); this.marks.commitAndClose();
    if (wasMark) { this.host.focus?.("staff"); return true; }   // 点别处 = 先收起记号框（这一下不另做事）
    const L = this.layout ?? L0, sp = L.sp;
    // 0. 纸右上角的小钮（纸张）、旁边的「＋」、歌名左边的「‹ ›」——都在歌名那一条里，先于歌名判
    if (this.inBox(L.paperChip, x, y)) { this.host.onPaper?.(); return true; }
    if (this.inBox(L.addPaper, x, y)) { this.host.onAddPaper?.(); return true; }
    if (this.inBox(L.nav?.prev, x, y)) { this.host.onNav?.(-1); return true; }
    if (this.inBox(L.nav?.next, x, y)) { this.host.onNav?.(1); return true; }
    // 0⅙. 作词 / 作曲（标题下面靠右）
    if (this.inBox(L.credits, x, y)) { this.host.focus?.("text"); this.host.onCredits?.(); return true; }
    // 0⅛. 歌手牌（每张纸第一行各条谱左边的声部名）：先把光标换到那条，再开歌手牌
    const pt = L.parts.find((b) => this.inBox(b, x, y));
    if (pt) { this.host.set(setFocus(this.host.get(), pt.paper, pt.part)); this.host.onPart?.(pt.paper, pt.part); return true; }
    // 0¼. 纸面最上面的歌名（可不填）
    if (this.inBox(L.title, x, y)) { this.title.openNow(); this.host.focus?.("text"); return true; }
    // 0⅜. 纸顶：「⋯」（纸的菜单）、曲段名（就地改）；最底下「＋ 新的纸」
    for (const pp of L.papers) {
      if (this.inBox(pp.menu, x, y)) { this.host.onPaperMenu?.(pp.id); return true; }
      if (pp.title.shown && this.inBox(pp.title, x, y)) { this.title.openNow(pp.id); this.host.focus?.("text"); return true; }
    }
    const row = this.rowAt(y); if (row < 0) return false;
    // 0½. 记号（调号 / 拍号 / 速度）：换到那条 track 再开框
    const mk = L.marks.find((m) => x >= m.x && x <= m.x + m.w && y >= m.y && y <= m.y + m.h);
    if (mk) { this.host.set(this.focusRow(this.host.get(), mk.system, this.host.get().caret)); this.marks.openAt(mk.index); return true; }
    // 1. 歌词那一行
    const ly = L.lyricY(row);
    if (y > ly - sp * 2.2 && y < ly + sp * 1.2) {
      const cands = L.lyrics.filter((h) => h.system === row);
      if (cands.length) { const best = cands.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a)); if (Math.abs(best.x - x) < sp * 4) { this.host.set(this.focusRow(this.host.get(), row, this.host.get().caret)); this.lyrics.openAt(best.index); this.host.focus?.("text"); return true; } }
    }
    // 2. 音符
    const hit = L.notes.find((n) => n.system === row && x >= n.x - sp * 0.5 && x <= n.x + n.w + sp * 0.5 && Math.abs(y - n.y) <= sp * 0.9);
    if (hit) {
      this.host.focus?.("staff");
      const sameTrack = this.onTrack(hit), st = sameTrack ? this.host.get() : this.focusRow(this.host.get(), row);
      const cur = sameTrack ? st.sel : null;
      this.host.set(shift && cur ? select(st, Math.min(cur.from, hit.index), Math.max(cur.to, hit.index + 1)) : select(st, hit.index, hit.index + 1));
      if (pid !== null) {   // 笔 / 鼠标：按住一直响，拖音高换音，松手停
        const t = tr(this.host.get())[hit.index] as NoteTok;
        this.drag = { index: hit.index, d0: hit.d, dur0: t.dur, x0: x, y0: y, axis: "", pid, heard: hit.d };
        this.el.setPointerCapture(pid);
        this.host.audition?.(hit.index, true);
      } else this.host.audition?.(hit.index);
      return true;
    }
    return false;
  }
  /** 空白处 → 那条谱最近的光标落点（= 写；点哪条谱光标就到哪条）。 */
  private caretAt(x: number, y: number, st = this.host.get()): EditorState {
    const L = this.layout!, row = this.rowAt(y), cands = L.slots.filter((s) => s.system === row);
    if (!cands.length) return st;
    const best = cands.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
    const r = L.systems[row];
    return r.paper === st.at.paper && r.part === st.at.part ? setCaret(st, best.caret) : setFocus(st, r.paper, r.part, best.caret);
  }
  /** 框选：框住的音（音头中心在框里；只算框起点那条谱的）从第一个到最后一个选成一段；一个都没框住 = 回到起点的光标。 */
  private boxSelect(x1: number, y1: number): void {
    const b = this.box!, L = this.layout!, xa = Math.min(b.x0, x1), xb = Math.max(b.x0, x1), ya = Math.min(b.y0, y1), yb = Math.max(b.y0, y1);
    Object.assign(this.boxEl.style, { left: `${xa}px`, top: `${ya}px`, width: `${xb - xa}px`, height: `${yb - ya}px` });
    const inside = L.notes.filter((n) => { const cx = n.x + n.w / 2; return n.system === b.row && cx >= xa && cx <= xb && n.y >= ya && n.y <= yb; }).map((n) => n.index);
    if (!inside.length) { this.host.set(this.caretAt(b.x0, b.y0, b.st0)); return; }
    const st = this.focusRow(b.st0, b.row, b.st0.caret);
    this.host.set(select(st, Math.min(...inside), Math.max(...inside) + 1));
  }

  private move(e: PointerEvent): void {
    if (this.touches.has(e.pointerId)) {
      this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pinch && this.touches.size === 2) {
        const [a, b] = [...this.touches.values()], d = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
        this.setZoom(this.pinch.z0 * (d / this.pinch.d0), { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, cx: this.pinch.cx, cy: this.pinch.cy });   // 中点下面的纸面点跟着两指走 = 缩放 + 平移一起
        return;
      }
    }
    if (this.finger && e.pointerId === this.finger.pid) {
      const dy = e.clientY - this.finger.y0, dx = e.clientX - this.finger.x0;
      if (Math.hypot(dx, dy) > 6) this.finger.moved = true;
      if (this.finger.moved) { this.el.scrollTop = this.finger.top0 - dy; if (this.zoom > 1.001) this.el.scrollLeft = this.finger.left0 - dx; }   // 放大了单指也能横着滚
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
      this.host.set(setNote(st, g.index, { pitch: fromDiatonic(d, keyAt(tr(st), g.index)) }));
      if (this.host.glide) this.host.glide(g.index); else this.host.audition?.(g.index, true);   // 新音顶掉旧音
    } else {
      const i0 = DUR_LADDER.reduce((bi, v, i) => (Math.abs(v - g.dur0) < Math.abs(DUR_LADDER[bi] - g.dur0) ? i : bi), 0);
      const i = Math.max(0, Math.min(DUR_LADDER.length - 1, i0 + Math.round(dx / (L.sp * 2.2))));
      this.host.set(setDur(st, g.index, DUR_LADDER[i]));
    }
  }

  private up(e: PointerEvent): void {
    if (this.touches.delete(e.pointerId) && this.pinch && this.touches.size < 2) { this.pinch = null; this.finger = null; return; }   // 捏合结束：剩下那根手指不接着当滚动（会跳）
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
