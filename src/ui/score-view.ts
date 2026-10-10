// score-view.ts —— 谱面板：画谱、指针、光标跟随、就地写歌词。created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 改；2026-10-08 多声部多纸（Claude Fable 5.1）
// 选中 = 改，光标 = 写（user「智能识别，选中音符就是改，光标就是写 对」）：
//   2026-10-08 改的手感（user「长按一个音 = 选中它、进选区态。轻点永远不选中，只放光标 + 出声…同意，笔也长按」「带子 + 棒棒糖把手 和我想的一样」）：
//   **轻点音符 = 光标放到它后面（不响、不选中；手指 / 笔 / 鼠标都一样）；长按（0.42 s 不动）= 选中它、进选区态，不抬手接着拖 = 扩选；选区两端各一个棒棒糖把手（拖 = 扩 / 缩）；
//   Shift+点 = 把选中扩到它（笔 / 鼠标）；点别处 = 放光标（选区消失）。笔 / 鼠标按住音符立刻拖 = 改音高 / 时值（和长按用时间分开：0.42 s 内动了就是拖）。
//   点歌词那一行 = 在那个音下面打开歌词框；
//   点谱面写音 2026-10-07 拿掉（user「先去掉触碰加音符的功能，以后用专门的toolstate做」）——指针现在只选、只拖、只放光标；
//   点别处 = 放光标。笔 / 鼠标拖符头：上下改音高（按五线谱一级一级吸附）、左右改时值（离散阶梯）；手指拖 = 滚动，手指轻点和笔一样。
// 多声部（总谱式）：点哪条谱，光标 / 选中就到那条 track（那张纸 × 那个声部）——不另做切换器；pad 往光标所在的那条写。
// 歌词就地写（user「歌词输入不应该放在键盘上，而是放在五线谱下面点进去一个一个写或者删」）：见 lyric-editor.ts。
// 点记号（调号 / 拍号 / 速度）= 就地改：见 mark-editor.ts。点曲段名 = 就地改（title-editor.ts）；「⋯」= 纸的菜单；「＋ 新的纸」= 加一张。
// 框选（user「框选 + 整体移调 / 转调 也先做」）：笔 / 鼠标在空白处拖 = 拉一个框，框住的音（第一个到最后一个之间的一整段；只算框起点那条谱的）实时选中；
//   空白处不拖 = 放光标（松开时才放）；手指拖照旧是滚动。
// 触屏缩放（2026-10-08 user「手机之类你可以放大pan pinch」「默认开」）：双指捏合 = 放大 / 缩小这张纸（视图状态，CSS zoom，不进文件、和「谱的大小」是两回事），
//   双指拖 = 平移；放大后单指拖也能横着滚；角上「1:1」复位。只有两根手指才触发，不碰单指滚动 / 轻点 / 笔。
// 长按拖（2026-10-08 Opus 5.5；user「歌词的合能不能也改成长按拖动。不然每次点文本框是超级麻烦的」，AI 提的整套手势 user 说开工）：
//   歌词：长按一个字（笔 / 鼠标按住直接拖）往左拖到前一个音 = 合 / 早一个音起，往右 = 晚一个音起（空出来的音变成拖腔）；原地松手 = 选中这个音。轻点照旧开歌词框。
//   力度记号 / 渐强渐弱：轻点 = 小菜单（改 / 删）；长按拖 = 挪到别的音上（从那个音起）；原地松手 = 小菜单。拖的时候谱上实时就是挪过去的样子（undo 一步）。
// 试听：笔 / 鼠标按住音符 = 一直响，上下拖到新音高就换成新的（一张嘴，新的顶掉旧的），松手停；横拖改时长不出声
//   （user「拖动音高的时候最好也有预览。新的抢占旧的。然后改时长和velocity就不用预览了」）。手指轻点 = 响一下。

import { DEFAULT_PAPER, paperOf, lineSp, spMm, staffMmOf, STAFF_MM, PAPER_LABEL, pageGeoOf } from "../score/paper.ts";
import { type EditorState, type NoteTok, setCaret, setCaretLead, setFocus, select, singleSel, setNote, setDur, keyAt, tr, TPQ, moveMark, trackOf, isTimed } from "../score/song.ts";
import { moveSyllable, lyricSlot, MELISMA_MARK } from "../score/lyrics.ts";
import { fromDiatonic, diatonicIndex, type Pitch } from "../score/pitch.ts";
import { engrave, LYRIC_EM, type Layout, type PartView, type HitNote, type LyricHit, type DynHit, type Slot, type ClefHit } from "../render/engrave.ts";
import { toSvg } from "../render/svg.ts";
import { LyricEditor } from "./lyric-editor.ts";
import { MarkEditor } from "./mark-editor.ts";
import { TitleEditor } from "./title-editor.ts";
import { RULES, type ModeRules } from "../app/workspace.ts";
import { TAB20 } from "./part-colors.ts";
/** 一个光标位置的身份（纸 | 声部 | 下标）：行末 / 行首的画法只对这一个位置有效。 */
const caretKey = (st: EditorState): string => `${st.at.paper}|${st.at.part}|${st.caret}`;

/** 连续排法的边距（sp）：纸的真边距只在分页里画（所见即所得）；连续 = 一圈舒服的窄边，行宽照旧是版心。 */
const CONT_MARGIN = { l: 1.5, r: 1.5, t: 1.5, b: 2 } as const;
/** 拖时值的阶梯：三十二分起，plain 与附点交替（都画得出来）。 */
const DUR_LADDER = [6, 12, 18, 24, 36, 48, 72, 96, 144, 192].map((v) => (v * TPQ) / 48);

export interface ScoreViewHost {
  get(): EditorState; set(next: EditorState, opts?: { gesture?: string }): void;   // gesture = 连续动作的名字（拖 = "drag"）：宿主的 undo 把它们并成一步
  /** 唱下标 i 那个音（光标所在那条 track 的）：hold = 按住一直响（等 release），否则响一下。 */
  audition?(i: number, hold?: boolean): void;
  /** 拖音高时换到下标 i 的新音高（新的顶掉旧的；怎么顶由采样器定：滑过去或重新起音）。 */
  glide?(i: number): void;
  release?(): void;
  /** 听模式里长按 / 右键谱面（轻点不跳播，防误触；user 2026-10-10「听模式也不应该误触摸导致跳播。可以还是用长按/右键context menu」）：
   *  点在音 / 休止上 = index（它所在的声部）；空白 = caret（那一行光标会落的位置）。宿主开小菜单（从这儿放…）。 */
  onListenMenu?(at: { x: number; y: number }, target: { paper: string; part: string; index: number | null; caret: number }): void;
  /** 五线谱像文本框（user「可以想象五线谱是文本框，你touch点了会弹键盘。然后点别的地方会隐藏」）：
   *  staff = 点在谱上（音 / 空白 / 框选）；text = 打开了要系统键盘的框（歌词 / 歌名）。记号框不算（触屏上不弹系统键盘）。 */
  focus?(where: "staff" | "text"): void;
  /** 按拍号自动画小节线开着没有（默认开）。 */
  autoBars?(): boolean;
  /** 要画的声部（隐藏的不在里面；顺序 = 总谱从上到下）。 */
  parts(): PartView[];
  /** 歌手牌：某张纸第一行某条谱左边的声部名点了（那条已经成了光标所在的 track）。 */
  onPart?(paper: string, part: string, at?: { left: number; top: number; right: number; bottom: number }): void;   // at = 歌手牌在屏幕上的框（轨的小卡挨着它开）
  /** 纸顶「⋯」点了（纸的菜单）；扳手旁的「＋」点了（新的纸）；歌名左边「‹ ›」点了（上一张 / 下一张纸）。 */
  onPaperMenu?(paper: string): void;
  onAddPaper?(): void;
  onNav?(dir: -1 | 1): void;
  /** 「‹ 2/3 ›」旁边的「本段」开关点了（视图范围：本段 ⇄ 全部）。 */
  onScopeToggle?(): void;
  /** 每张纸自己那组曲段控件：从这张纸往前 / 往后跳；「本段」= 只看这张（已经是 = 回到全部）。 */
  onNavFrom?(paper: string, dir: -1 | 1): void;
  onScopeOf?(paper: string): void;
  /** 纸右上角的小钮（纸张）点了。 */
  onPaper?(): void;
  /** 力度记号 / 渐强渐弱点了（或长按原地松手）：开小菜单（at = 屏幕坐标；那条 track 已经是光标所在的了）。 */
  onMarkPress?(index: number, at: { x: number; y: number }): void;
  /** 说一声（拖歌词挪不动、挪力度记号顶掉了原来的）。 */
  notice?(text: string): void;
  /** 点了谱号（行首 / 行中间）或八度线开头的字（v0.9.28）：at = 屏幕坐标（小菜单开在那）。 */
  onClef?(hit: ClefHit, at: { x: number; y: number }): void;
  /** 光标所在那条下标 i 的歌词台上这位唱不出来的那句话（歌词框上面的小字）；唱得出来 = null。 */
  lyricHint?(i: number): string | null;
  /** 光标所在那条下标 i 那个字所在这一句月读念成什么（歌词框下面的小字，v0.9.34）；不是月读 / 引擎还没起来 = null。 */
  lyricReading?(i: number): import("./lyric-editor.ts").LyricReading | null;
  /** 标题下面靠右的作词 / 作曲点了。 */
  onCredits?(): void;
  /** 空白处长按 / 电脑右键（光标已经放到那里了）：at = 屏幕坐标（小菜单开在那）；row = 这一行里光标所在 track 的音的下标范围（全选这一行用；这行没音 = null）。 */
  onBlankPress?(at: { x: number; y: number }, row: { from: number; to: number } | null): void;
  /** 长按 / 右键选区里的音（光标所在 track 的）：开选区菜单（at = 屏幕坐标）。 */
  onSelPress?(at: { x: number; y: number }): void;
  /** 屏幕放不下纸的时候：true = 按屏宽重新折行；false（默认）= 不折行、整张纸按比例缩小（行和纸上一模一样）。 */
  reflow?(): boolean;
  /** 排法：true = 分页（按纸的真实高度分页、画页框，所见即所得）；false = 连续（同一张纸的几何，只是不断页）。 */
  pages?(): boolean;
  /** 排法「横卷」（v0.9.35）：每张纸一行、一直往右，谱面板横着滚；打字 / 放的时候横着跟；歌手名钉在屏幕左边。 */
  scroll?(): boolean;
  /** 分页（= 打印预览）时歌词行往下让多少（sp）：选了拼音字体印 PDF 时 = 拼音那一截（PDF 和分页预览排出来一样）。 */
  lyricRaise?(): number;
  /** 范围：segment = 一次只看光标所在的那张纸（曲段），‹ › 翻；all = 全部（隐藏的纸折叠着）。 */
  scope?(): "all" | "segment";
}

/** 按下去的是能拿起来拖的东西：歌词的一个字 / 力度记号 / 渐强渐弱（index = token 下标，system = 那一行）。 */
type Grab = { kind: "lyric" | "mark"; index: number; system: number };

/** 捏合最多放大到原大的几倍（同 PDF 阅读器，横着能滚）。 */
const MAX_ZOOM = 6;
export class ScoreView {
  layout: Layout | null = null;
  private sheet: HTMLDivElement;
  private ink: HTMLDivElement;   // 歌词框 / 记号框 / 框选的容器：分页时往右挪到版心（svg 的 viewBox 往左扩了边距）
  private ctx = document.createElement("canvas").getContext("2d")!;
  /** wait = 鼠标：长按到点之前不拖（v0.9.39；user 2026-10-10「这样吧，还是普通拖动，音也是，但是鼠标的时候也需要长按」——拖动太容易误触）。 */
  private drag: null | { index: number; d0: number; dur0: number; x0: number; y0: number; axis: "" | "x" | "y"; pid: number; heard: number; wait?: boolean } = null;
  private finger: null | { pid: number; y0: number; top0: number; x: number; y: number; moved: boolean; shift: boolean; x0: number; left0: number } = null;
  /** 框选 = 鼠标短按就拖（v0.9.39；user「不，框选是普通短按拖动，这样才能有差别」「不然我框选会误触拖动」）：从空白、音、记号、字上短按拖都是框选；长按之后拖才是拿起来挪。
   *  last = 上一次框出来的结果（没变就不重设 = 不重排；user「鼠标框选有点卡」）；raf = 合并到每帧一次。 */
  private box: null | { pid: number; x0: number; y0: number; moved: boolean; st0: EditorState; row: number; last?: string; raf?: number; px?: number; py?: number } = null;
  private boxEl: HTMLDivElement;
  private tail: HTMLDivElement;
  /** 按下去还没松（手指 / 笔 / 鼠标都走它）：判轻点 / 长按 / 拖。hit = 按在哪个音上（null = 空白）。 */
  private press: null | { pid: number; type: string; x: number; y: number; cx: number; cy: number; hit: HitNote | null; grab: Grab | null; timer: number; shift: boolean; moved: boolean; fired: boolean } = null;
  /** 拿起来拖着的字 / 记号：st0 = 拿起来之前（每一下都从它重算，谱上实时是挪过去的样子）；targets = 拿起来时这条 track 上能落的音（下标 + 位置，拖的时候不跟着重排跳）；
   *  src / cur = 原来 / 现在落在第几个；moved = 指针动过（没动 = 原地松手）。 */
  /** 正拖着的东西的 token id（画成强调色；拿起来那一刻就亮）。 */
  private hot: Set<number> | null = null;
  /** 点开的记号管的那一段音（染强调色；小菜单收起就清）。 */
  private span: { from: number; to: number } | null = null;
  setSpan(sp: { from: number; to: number } | null): void { this.span = sp; this.render(); }
  /** 开这条 track 上第 index 个 token（力度 / 渐强渐弱 / 风格记号）的小菜单（刚插进去的风格记号用）；谱上没画出来 = false。 */
  menuFor(index: number): boolean { const h = this.layout?.dyns.find((d) => d.index === index && this.onTrack(d)); if (!h) return false; this.markMenu(h); return true; }
  private lift: null | { pid: number; grab: Grab; st0: EditorState; targets: { idx: number; x: number; system: number }[]; src: number; cur: number; x0: number; y0: number; cx: number; cy: number; moved: boolean; short: boolean; removed: number; dx: number } = null;
  private selDrag: null | { pid: number; anchor: number; menu?: boolean } = null;   // 长按之后没抬手接着拖 = 扩选（anchor = 长按的那个音）；menu = 长按的是选区里的音、还没动：抬手 = 选区菜单，动了 = 照常扩选
  private handles: { start: HTMLDivElement; end: HTMLDivElement };
  private handleDrag: null | { pid: number; which: "start" | "end"; other: number } = null;
  private touches = new Map<number, { x: number; y: number }>();   // 现在按着的手指（触屏缩放用）
  /** 捏合（2026-10-10 v0.9.27 重做；user「ipad可以放的很大，就和pdf浏览器一样，懂了吗。可以横着滚」+ 查案「iPad 捏合缩放卡」）：
   *  手势中只改 transform（合成器缩放，不重排、不读布局），一帧最多一次；松手才落成 CSS zoom（重排一次）并滚到让那个点还在手指下面。
   *  d0 = 起手两指距离；z0 = 起手的 zoom；sx / sy = 两指中点下面那个纸面点（sheet 坐标、原大）；left / top = 起手时 sheet 在屏幕上的位置；k = 现在相对 z0 的倍数；mx / my = 现在的两指中点。 */
  private pinch: null | { d0: number; z0: number; sx: number; sy: number; left: number; top: number; k: number; mx: number; my: number; raf: number } = null;
  private zoom = 1;
  private zoomBtn: HTMLButtonElement;
  readonly lyrics: LyricEditor;
  readonly marks: MarkEditor;
  readonly title: TitleEditor;

  constructor(private el: HTMLElement, private host: ScoreViewHost) {
    this.sheet = document.createElement("div"); this.sheet.className = "sheet";
    this.boxEl = document.createElement("div"); this.boxEl.className = "marquee"; this.boxEl.hidden = true;
    el.replaceChildren(this.sheet);
    // 谱下面永远留一大截空白（user 2026-10-08「做一个护栏：滚动的时候页面下面还是留一整页白」→ 后来「…3/4左右？」= ¾ 屏）：最后一行也能滚到上面来，
    //   跟随光标往下推时不会被「滚到底了」卡住（软键盘弹出谱面变矮时尤其）。高度 = 谱面板自己的高（render 里跟着改）
    this.tail = document.createElement("div"); this.tail.className = "sheet-tail"; this.tail.setAttribute("aria-hidden", "true");
    el.appendChild(this.tail);
    this.ink = document.createElement("div"); this.ink.className = "sheet-ink"; this.sheet.appendChild(this.ink);
    this.zoomBtn = document.createElement("button"); this.zoomBtn.className = "btn zoom-reset"; this.zoomBtn.type = "button"; this.zoomBtn.textContent = "1:1"; this.zoomBtn.title = "回到原大"; this.zoomBtn.hidden = true;
    this.zoomBtn.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); this.setZoom(1, null); });
    el.appendChild(this.zoomBtn);
    const mkHandle = (which: "start" | "end") => {
      const h = document.createElement("div"); h.className = `sel-handle ${which}`; h.hidden = true;
      h.addEventListener("pointerdown", (e) => {
        e.preventDefault(); e.stopPropagation();
        const st = this.host.get(); if (!st.sel) return;
        this.handleDrag = { pid: e.pointerId, which, other: which === "start" ? st.sel.to - 1 : st.sel.from };
        try { h.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      });
      h.addEventListener("pointermove", (e) => {
        const g = this.handleDrag; if (!g || e.pointerId !== g.pid) return;
        const idx = this.noteNear(this.local(e)); if (idx < 0) return;
        const st = this.host.get(), a = Math.min(idx, g.other), b = Math.max(idx, g.other) + 1;
        if (!st.sel || st.sel.from !== a || st.sel.to !== b) this.host.set(select(st, a, b));
      });
      const done = (e: PointerEvent) => { if (this.handleDrag && e.pointerId === this.handleDrag.pid) this.handleDrag = null; };
      h.addEventListener("pointerup", done); h.addEventListener("pointercancel", done);
      this.ink.appendChild(h);
      return h;
    };
    this.handles = { start: mkHandle("start"), end: mkHandle("end") };
    this.lyrics = new LyricEditor(this.ink, host, () => this.layout, () => this.render());
    this.marks = new MarkEditor(this.ink, host, () => this.layout, () => this.render());
    this.title = new TitleEditor(this.ink, host, () => this.layout);
    el.addEventListener("pointerdown", (e) => this.down(e));
    el.addEventListener("pointermove", (e) => this.move(e));
    el.addEventListener("wheel", () => { this.userScrollAt = performance.now(); }, { passive: true });   // 自己滚了：自动翻让开 4 秒
    el.addEventListener("scroll", () => this.placePins(), { passive: true });   // 横卷：钉在左边的歌手名跟着横滚挪
    el.addEventListener("pointerup", (e) => this.up(e));
    // 电脑右键 = 空白处的小菜单（手指 / 笔走长按）；音上右键不接（选区条管）。pointerdown 里 button 2 直接不接，免得先放一下光标 / 起框选
    el.addEventListener("contextmenu", (e) => {
      if (this.layout && this.openPartAt(this.local(e).x, this.local(e).y)) { e.preventDefault(); this.cancelPress(); return; }   // 右键歌手名 = 歌手牌（同左键）
      if (!this.rules.edit) { e.preventDefault(); const p = this.local(e); this.cancelPress(); this.listenMenu(p.x, p.y, e.clientX, e.clientY); return; }   // 听模式：右键 = 小菜单（从这儿放…）
      if (!this.layout || (e.target as HTMLElement).closest(".lyric-input, .lyric-merge, .mark-ed, .title-input, .sel-handle")) return;
      e.preventDefault();
      const p = this.local(e); this.cancelPress();
      const dh = this.rules.symbols ? this.dynHitAt(p.x, p.y, false) : null;
      if (dh) { this.lyrics.commitAndClose(); this.marks.commitAndClose(); this.markMenu(dh); return; }   // 力度记号 / 渐强渐弱上右键 = 它的小菜单（「符」里）
      const hit = this.noteAt(p.x, p.y);
      if (!hit) { this.blankPress(p.x, p.y, e.clientX, e.clientY); return; }
      // 音上右键：在选区里 = 选区菜单；不在 = 先选中它（同长按）再开菜单
      const cur = this.host.get().sel;
      if (!(cur && this.onTrack(hit) && hit.index >= cur.from && hit.index < cur.to)) {
        const st0 = this.host.get(), st1 = this.onTrack(hit) ? st0 : this.focusRow(st0, hit.system);
        this.host.set(select(st1, hit.index, hit.index + 1));
      }
      this.host.focus?.("staff");
      this.host.onSelPress?.({ x: e.clientX, y: e.clientY });
    });
    el.addEventListener("pointercancel", (e) => { if (this.pinch && this.touches.delete(e.pointerId) && this.touches.size < 2) this.pinchEnd(); if (this.holdPid === e.pointerId) { this.holdPid = null; this.host.release?.(); } this.lockTap = null; if (this.drag) this.host.release?.(); this.drag = null; if (this.lift) { this.lift = null; this.hot = null; this.render(); } el.classList.remove("lifting"); this.finger = null; this.box = null; this.boxEl.hidden = true; this.cancelPress(); this.touches.delete(e.pointerId); if (this.touches.size < 2) this.pinch = null; });
    new ResizeObserver(() => this.render()).observe(el);
  }

  /** 五线谱间距（px）和纸面宽（px）：触屏 11、鼠标 10 一格（× 这张纸的谱大小 / 默认档——谱小了一格就小、纸的宽度不变）；纸的版心放得下 = 严格按纸（纸居中、四周是桌面），
   *  放不下（手机）：默认不折行 = 整张纸按比例缩小；选了「折行」= 按屏宽重新折行，窄屏（< 420）一格跟着宽度小一点、最小 8.5（user「iPhone SE2 一行只有一小节加一大片空白 几个简易试一下」）。
   *  纸 = 这首歌的纸张（src/score/paper.ts，默认 A5；user「五线谱宽度：要不还是按照固定物理页框？」「看一下webxiaoheiwu屏幕太宽的时候行宽会有max」）。 */
  private frame(): { sp: number; width: number; strict: boolean; page: { h: number; l: number; r: number; t: number; b: number } | null; margins: { l: number; r: number; t: number; b: number } } {
    const st = this.host.get(), paper = st.song.paper ?? paperOf(DEFAULT_PAPER), scale = staffMmOf(paper) / STAFF_MM;
    const base = (matchMedia("(pointer: coarse)").matches ? 11 : 10) * scale, avail = this.el.clientWidth;
    // 分页：整页（版心 + 左右边距）要放得下；页高 / 边距按这张纸算（sp）
    const geo = pageGeoOf(paper), page = this.host.pages?.() ? geo : null;
    // 横卷：谱的大小照原大（不按屏宽缩），width 只管歌名 / 作者栏 / 纸的控件那一屏；排完纸按内容撑宽（render 里）
    if (this.host.scroll?.()) return { sp: avail > 0 && avail < 420 ? Math.max(8.5 * scale, Math.min(base, (avail / 42) * scale)) : base, width: Math.max(320, avail - (CONT_MARGIN.l + CONT_MARGIN.r) * base), strict: false, page: null, margins: CONT_MARGIN };
    // 边距：分页 = 纸的真边距（所见即所得）；连续 = 一圈舒服的窄边（CONT_MARGIN；user 2026-10-08「非分页显示…能不能把页边距省了，选一个舒服的边距，
    //   和做分页显示之前类似。但是行宽必须严格一样」）。行宽两种都是这张纸的版心 lineSp 个间距、不取整（取整会让两边差零点几个间距，可能断行不同）→ 每一行一模一样，只差断不断页、边多宽
    const margins = page ? { l: geo.l, r: geo.r, t: geo.t, b: geo.b } : CONT_MARGIN;
    const extra = margins.l + margins.r, want = Math.ceil((lineSp(paper) + extra) * base);
    if (avail > 0 && want <= avail) return { sp: base, width: lineSp(paper) * base, strict: true, page, margins };
    // 放不下、不折行（默认；user「纸能不能toggle不折行预览有多宽和折行的两种选项。我其实还是倾向于不折行」
    //   「我现在发现我基本不点五线谱，都是用键盘输入。这样的话其实五线谱只是让你看你在哪里」）：整张纸按比例缩小，行和纸上一样
    if (avail > 0 && (page || !(this.host.reflow?.() ?? false))) { const sp = (base * avail) / want; return { sp, width: lineSp(paper) * sp, strict: false, page, margins }; }
    return { sp: avail > 0 && avail < 420 ? Math.max(8.5 * scale, Math.min(base, (avail / 42) * scale)) : base, width: Math.max(320, avail), strict: false, page: null, margins: { l: 0, r: 0, t: 2.4, b: 1.5 } };
  }

  /** 量文字宽（px，歌词字号 = px）：屏幕和 PDF 共用这一把尺子——PDF 用它排版，和分页预览一模一样（2026-10-09 user「pdf画出来和开分页预览的不一样…做到除了控件和提示外的wysiwyg」）。 */
  measureAt(px: number): (s: string) => number {
    const f = `${px}px system-ui, "Hiragino Sans", "PingFang SC", "Noto Sans CJK JP", sans-serif`;
    return (s) => { if (this.ctx.font !== f) this.ctx.font = f; return this.ctx.measureText(s).width; };
  }
  render(): void {
    const st = this.host.get(), { sp, width, strict, page, margins } = this.frame();
    const was = this.hscroll; this.hscroll = !!this.host.scroll?.();
    if (was && !this.hscroll) this.el.scrollLeft = 0;
    this.el.classList.toggle("hscroll", this.hscroll);
    const totalW = width + (margins.l + margins.r) * sp; this.paperW = totalW;
    this.el.classList.toggle("desk", (strict && totalW < this.el.clientWidth - 1) || !!page);
    this.el.classList.toggle("pages", !!page);
    this.sheet.style.width = strict ? `${Math.ceil(totalW)}px` : "";
    const paper = st.song.paper ?? paperOf(DEFAULT_PAPER);
    if (this.caretEnd !== null && (this.caretEnd !== caretKey(st) || st.sel)) this.caretEnd = null;   // 光标挪了（写音 / 方向键 / 撤销…）= 回到默认（下一行开头）
    this.layout = engrave(st.song, { width, sp, at: st.at, caret: st.caret, ...(st.lead ? { lead: st.lead } : {}), sel: st.sel, parts: this.host.parts(), measureLyric: this.measureAt(LYRIC_EM * sp), titlePlaceholder: true, ...(this.caretEnd ? { caretEnd: true } : {}),
      ...(page && this.host.lyricRaise?.() ? { lyricRaise: this.host.lyricRaise() } : {}),
      autoBars: this.host.autoBars?.() ?? true, paperLabel: paper.kind === "other" ? "其他纸" : PAPER_LABEL[paper.kind], justWrote: st.log.length > 0,
      ...(page ? { page } : { margins }), ...((this.host.scope?.() ?? "segment") === "segment" ? { onlyPaper: st.at.paper } : {}), ...(this.hot ? { hot: this.hot } : {}), ...(this.span ? { span: this.span } : {}),
      ...(this.hscroll ? { scroll: true } : {}) });
    this.ink.style.left = `${this.layout.pageX.left}px`;
    if (this.hscroll) this.sheet.style.width = `${Math.ceil(this.layout.width + this.layout.pageX.left + this.layout.pageX.right)}px`;   // 横卷：纸按内容撑宽，谱面板横着滚
    this.tail.style.height = `${Math.round(this.el.clientHeight * 0.75)}px`;   // ¾ 屏（一整屏有时让人以为白屏了；user 2026-10-08「留的滚动空白不应该是一整页…3/4左右？」）
    const svg = toSvg(this.layout);
    const old = this.sheet.querySelector("svg");
    if (old) old.outerHTML = svg; else this.sheet.insertAdjacentHTML("afterbegin", svg);
    if (!this.boxEl.isConnected) this.ink.appendChild(this.boxEl);
    this.placeHandles();
    if (this.playP) this.setPlayhead(this.playP);   // 暂停着 / 放着的时候重画：播放线和高亮跟着新的排版
    this.drawStartMark();
    this.lyrics.reposition();
    this.marks.reposition();
    this.title.reposition();
    this.drawPins();
    this.drawGhost();   // 「弹」的鬼音符照着新的排版重摆（只是摆，不影响排版）
    // 只在光标 / 选区 / 编辑框挪了的时候才把视图拉过去；别的重画（静音 / 独奏的角标、隐藏、换纸设置…）不动人家滚到哪
    //   （user 2026-10-08「toggle mute solo的时候页面滚动会变」：原来每次重画都 follow，滚开了光标那行再点静音 = 被拽回去）
    const base = this.baseKey(), fk = `${base}|${this.el.clientWidth}x${this.el.clientHeight}`;   // 窗口变了（pad 弹出把谱挤矮）照样跟
    if (this.holdView) this.heldBase = base;   // 点声部名：这个光标位置不跟，直到光标再挪
    if (fk !== this.followKey) { this.followKey = fk; if (base !== this.heldBase) { this.heldBase = null; this.follow(); } }
  }
  // ── 「弹」的鬼音符（v0.10.6；user「弹模式下面能不能在谱子上面光标对应的那个地方显示鬼音符？」「特别是前面有一个音的时候…如果是叠的话会在前面一个音上面加东西，但是不能动排版！！！，
  //   如果是非叠的话就是在要插入的地方加东西」「鬼音符的时候千万不能动排版！」）：盖在谱上的一层（ink 里一个不接点击的 svg），只借排版现成的位置——
  //   只选了一个音（叠亮着）= 叠画在那个音上；否则 = 光标处（下一个音要写进去的地方）。不进 engrave、不重排。
  private ghostEl: SVGSVGElement | null = null;
  private ghostP: Pitch[] = [];
  showGhost(ps: Pitch[]): void { this.ghostP = ps; this.drawGhost(); }
  private drawGhost(): void {
    const L = this.layout, clear = () => { this.ghostEl?.remove(); this.ghostEl = null; };
    if (!this.ghostP.length || !L) { clear(); return; }
    const st = this.host.get(), one = singleSel(st), sp = L.sp;
    /** 这一行谱号的位移：看这一行上随便一个音（命中框里 y 带位移、d 不带）。 */
    const shiftOn = (row: number) => { const n = L.notes.find((h) => h.system === row); return n ? Math.round(L.dOf(row, n.y)) - n.d : L.head?.system === row ? L.head.shift : 0; };
    let row: number, x: number, shift: number;
    if (one >= 0) {
      const n = L.notes.find((h) => h.index === one && this.onTrack(h)), r = n ? null : L.rests.find((h) => h.index === one && this.onTrack(h));
      if (n) { row = n.system; x = n.x; shift = Math.round(L.dOf(row, n.y)) - n.d; }
      else if (r) { row = r.system; x = r.x; shift = shiftOn(row); }
      else { clear(); return; }
    } else if (L.head) { row = L.head.system; x = L.head.x + 0.35 * sp; shift = L.head.shift; }
    else { clear(); return; }
    const NS = "http://www.w3.org/2000/svg", g = (this.ghostEl ??= document.createElementNS(NS, "svg"));
    g.setAttribute("class", "ghost-preview"); g.setAttribute("width", String(L.width)); g.setAttribute("height", String(L.height));
    const fs = 4 * sp, nh = 1.18 * sp, ext = 0.4 * sp, parts: string[] = [];
    for (const p of this.ghostP) {
      const d = diatonicIndex(p) + shift, y = L.yOf(row, d);
      for (let k = 28; k >= d; k -= 2) parts.push(`<line x1="${x - ext}" x2="${x + nh + ext}" y1="${L.yOf(row, k)}" y2="${L.yOf(row, k)}" stroke-width="${0.16 * sp}"/>`);
      for (let k = 40; k <= d; k += 2) parts.push(`<line x1="${x - ext}" x2="${x + nh + ext}" y1="${L.yOf(row, k)}" y2="${L.yOf(row, k)}" stroke-width="${0.16 * sp}"/>`);
      parts.push(`<text x="${x}" y="${y}" font-family="Bravura" font-size="${fs}">\u{E0A4}</text>`);
      const acc = p.alter === 1 ? "\u{E262}" : p.alter === -1 ? "\u{E260}" : p.alter === 2 ? "\u{E263}" : p.alter === -2 ? "\u{E264}" : "";
      if (acc) parts.push(`<text x="${x - 1.2 * sp}" y="${y}" font-family="Bravura" font-size="${fs}">${acc}</text>`);
    }
    g.innerHTML = parts.join("");
    if (!g.isConnected) this.ink.appendChild(g);
  }
  private playheadEl: HTMLDivElement | null = null;
  private barEl: HTMLDivElement | null = null; private barKey = "";   // 播放时的小节底色（v0.10.12）
  /** 你刚在谱上动过（写 / 改 / 挪光标）：几秒内播放不拽视图（v0.10.12；user「检测到用户在折腾谱子的时候需要hold住播放页面跟随？」→ AI 建议「你正在改谱时先不跟」→「12都同意」）。 */
  private userEditAt = -1e9;
  noteUserEdit(): void { this.userEditAt = performance.now(); }
  private hlEls: HTMLDivElement[] = [];                                  // 正在响的音的高亮
  private playP: { paperId: string; tick: number } | null = null;       // 播放线在哪（重画后照着再摆）
  private startP: { paperId: string; tick: number } | null = null;      // 起点
  private startEl: HTMLDivElement | null = null;
  /** 这一下点的是哪一层（模式的规则表，src/app/workspace.ts；2026-10-10 user「模式！音，歌词，强度和articulation！」→ 音 / 词 / 符 + 听）。
   *  听（edit = false）：谱面不写——轻点 = 告诉宿主「从这儿放」，拖 = 滚动，别的手势都不接。 */
  rules: ModeRules = RULES.notes;
  /** 自动翻（2026-10-10 user「...里面加自动滚动，你思考下怎么对齐不会觉得别扭」「自动滚动默认开」）：放着的时候谱跟着正在放的那一行滚。
   *  不逐帧跟：只在那一行换行、并且出了舒服区（屏幕上沿往下 5% 到 80%）时，平滑滚到让它落在上方两成处（下面能看见接下来几行）；你刚自己滚过（滚轮 / 手指）4 秒内不跟，不抢。 */
  autoFollow = true;
  private playSysKey = "";
  private userScrollAt = -1e9;
  private lockTap: { pid: number; x: number; y: number; moved: boolean } | null = null;
  private holdPid: number | null = null;                                 // 按住一个音在出声（长按 = 预览；抬手停）
  /** 播放头（实时试听「谱上跟着亮」，2026-10-09 Claude Fable 5.1）：p = 哪张纸的第几个 tick（纸自己的，反复已折回去；src/engine/timeline.ts locate）；null = 收起。
   *  只挪一条线，不重排、不动滚动。位置 = 这张纸第一行那条 track 上「起点 ≥ tick 的第一个音」的光标位 → slot 的 x；行高 = 那一行的谱表范围。 */
  /** 播放线（2026-10-10 Opus 5.5；user「首先是线，和光标用不一样的颜色，然后对齐是和所有track里面最后面的一个音符对齐，取max，然后唱到的音符试着高亮一下。看效果好不好」）：
   *  x = 这一行所有声部里、此刻已经开始的音中最晚开始的那个（取 max）；线从这一行最上面那条谱画到最下面那条；每个声部正在响的音高亮。
   *  颜色走 CSS（.playhead / .play-hl，和光标的 --accent 分开）。暂停着也留着（续播从这儿）。 */
  setPlayhead(p: { paperId: string; tick: number } | null): void {
    this.playP = p;
    const L = this.layout;
    const clear = () => { this.playheadEl?.remove(); this.playheadEl = null; for (const e of this.hlEls) e.remove(); this.hlEls = []; this.barEl?.remove(); this.barEl = null; this.barKey = ""; };
    if (!p || !L) { clear(); this.playSysKey = ""; return; }
    const found = this.soundingAt(p.paperId, p.tick);
    if (!found.length) { clear(); return; }
    const lead = found.reduce((a, b) => (b.start > a.start ? b : a)), h0 = lead.hits[0], sys = L.systems[h0.system].sys;
    const rows = L.systems.filter((r) => r.paper === p.paperId && r.sys === sys);
    const top = Math.min(...rows.map((r) => r.top)), bottom = Math.max(...rows.map((r) => r.bottom)), x = h0.x + h0.w / 2;
    const sysKey = `${p.paperId}:${sys}`;
    if (sysKey !== this.playSysKey) { this.playSysKey = sysKey; if (this.autoFollow) this.followPlay(top, bottom); }
    if (this.hscroll && this.autoFollow) this.followPlayX(x);   // 横卷：一行很长，横着跟（不等换行）
    // 小节底色（v0.10.12；user「播放动画的时候还得垫一个比较轻的小节高亮…太低调了所以有时候找不到放哪里了」→ AI 建议整小节、user「12都同意」）：
    //   正在放的那个（最晚开始的音）所在的小节，盖住这一行所有声部，很淡，垫在音符高亮下面；一小节才换一次，不晃
    { const row = h0.system, hx = h0.x + h0.w / 2; let left = -Infinity, right = Infinity;
      for (const b of L.bars) if (b.system === row) { if (b.x <= hx - 1 && b.x > left) left = b.x; if (b.x > hx + 1 && b.x < right) right = b.x; }
      if (!Number.isFinite(left)) { let first = Infinity; for (const n of this.hits) if (n.system === row && n.x < first) first = n.x; left = (Number.isFinite(first) ? first : hx) - L.sp * 0.8; }
      if (!Number.isFinite(right)) right = L.systems[row].x1 ?? hx + L.sp * 4;
      let d = this.barEl; if (!d || !d.isConnected) { d = document.createElement("div"); d.className = "play-bar"; this.ink.insertBefore(d, this.ink.firstChild); this.barEl = d; }
      const key = `${p.paperId}:${sys}:${Math.round(left)}`;
      if (key !== this.barKey) { this.barKey = key; d.style.left = `${left}px`; d.style.top = `${top}px`; d.style.width = `${Math.max(4, right - left)}px`; d.style.height = `${bottom - top}px`; } }
    void x;   // 播放线先不画（2026-10-10 user「感觉高亮够，可以先不用那根当前播放的线…先试试不用线」）——位置照算，要回来时在这儿画
    // 正在响的音：每个声部各自的那一个（休止不亮）；连音线拆开的几段一起亮
    const spots = found.filter((f) => f.note).flatMap((f) => f.hits);
    while (this.hlEls.length > spots.length) this.hlEls.pop()!.remove();
    spots.forEach((h, k) => {
      let d = this.hlEls[k];
      if (!d || !d.isConnected) { d = document.createElement("div"); d.className = "play-hl"; this.ink.appendChild(d); this.hlEls[k] = d; }
      const r = Math.max(6, h.w * 0.8), pv = this.host.parts().find((q) => q.id === L.systems[h.system]?.part);   // 这位歌手的类别色（v0.9.31）
      d.style.setProperty("--hl", pv?.colorIdx !== undefined ? TAB20[pv.colorIdx] : "");
      d.style.left = `${h.x + h.w / 2 - r}px`; d.style.top = `${h.y - r}px`; d.style.width = d.style.height = `${2 * r}px`;
    });
  }
  /** 自动翻：正在放的那一行（纸面坐标 top..bottom）出了舒服区 = 平滑滚到它在屏幕上方两成处。 */
  private followPlay(top: number, bottom: number): void {
    const now = performance.now();
    if (now - this.userScrollAt < 4000 || now - this.userEditAt < 4000) return;
    const z = this.zoom, off = this.sheet.offsetTop, vt = this.el.scrollTop, vh = this.el.clientHeight;
    const y0 = off + top * z, y1 = off + bottom * z;
    if (y0 >= vt + vh * 0.05 && y1 <= vt + vh * 0.8) return;
    const to = Math.max(0, y0 - vh * 0.2);
    // 长跳转（编排 / 反复跳回去、跨好几屏）：先瞬移到还差三成屏的地方，再平滑滚完最后那一段，到了小节底色闪一下——
    //   一路平滑滚好几屏会晕、还会扫过一堆不相干的谱；直接瞬移又找不着北（v0.10.12；user「如果是长跳转也许需要页面动画？不然的话突然teleport会misorientation。但是动画会不会晕车」）
    if (Math.abs(to - vt) > vh * 1.5) { this.el.scrollTo({ top: to + (to > vt ? -1 : 1) * vh * 0.3, behavior: "instant" as ScrollBehavior }); this.flashBar(); }
    this.el.scrollTo({ top: to, behavior: "smooth" });
  }
  /** 小节底色闪一下（长跳转到了）。 */
  private flashBar(): void { const d = this.barEl; if (!d) return; d.classList.remove("flash"); void d.offsetWidth; d.classList.add("flash"); }
  /** 横卷的自动翻（v0.9.35）：正在放的音（纸面 x）出了舒服区（屏幕左边 5% 到 80%）= 平滑滚到它在左边两成处；你刚自己滚过 4 秒内不跟。 */
  private followPlayX(x: number): void {
    if (performance.now() - this.userScrollAt < 4000) return;
    const z = this.zoom, sx = this.sheet.offsetLeft + ((this.layout?.pageX.left ?? 0) + x) * z, vl = this.el.scrollLeft, vw = this.el.clientWidth;
    if (sx >= vl + vw * 0.05 && sx <= vl + vw * 0.8) return;
    this.el.scrollTo({ left: Math.max(0, sx - vw * 0.2), behavior: "smooth" });
  }
  /** 横卷：歌手名钉在屏幕左边（v0.9.35；10-10 问答「横卷没有行首，左边的名字会滚走，横卷里名字应该钉在屏幕左边、贴着每条谱的左上」）。
   *  纸上原来的名字照画（滚到最左边时看得见）；滚开了才露出钉住的这一列。只看、不接点（点名字 = 滚回左边点纸上那个）。 */
  private hscroll = false;
  private pinEl: HTMLDivElement | null = null;
  private drawPins(): void {
    const L = this.layout;
    if (!this.hscroll || !L) { this.pinEl?.remove(); this.pinEl = null; return; }
    if (!this.pinEl || !this.pinEl.isConnected) { this.pinEl = document.createElement("div"); this.pinEl.className = "pin-names"; this.sheet.appendChild(this.pinEl); }
    const views = this.host.parts();
    this.pinEl.replaceChildren(...L.systems.filter((r) => r.staff === 1).map((r) => {
      const v = views.find((q) => q.id === r.part), d = document.createElement("div");
      d.className = "pin-name"; d.textContent = v?.abbr || v?.name || "";
      if (v?.colorIdx !== undefined) d.style.setProperty("--cat", TAB20[v.colorIdx]);
      d.style.top = `${r.staffTop - L.sp * 1.6}px`;
      return d;
    }));
    this.placePins();
  }
  private placePins(): void {
    if (!this.pinEl) return;
    const left = this.el.scrollLeft / this.zoom;
    this.pinEl.style.transform = `translateX(${left}px)`;
    this.pinEl.classList.toggle("is-on", left > (this.layout?.sp ?? 10) * 4);
  }
  /** 这张纸 tick 那一刻每个声部（排出来的每一行）正在放的 token：下标、开始的 tick、画出来的位置（音 / 休止）。 */
  private soundingAt(paperId: string, tick: number): { part: string; index: number; start: number; note: boolean; hits: { x: number; y: number; w: number; system: number }[] }[] {
    const L = this.layout; if (!L) return [];
    const paper = this.host.get().song.papers.find((x) => x.id === paperId); if (!paper) return [];
    const out: { part: string; index: number; start: number; note: boolean; hits: { x: number; y: number; w: number; system: number }[] }[] = [], seen = new Set<string>();
    for (const r of L.systems) {
      if (r.paper !== paperId || seen.has(r.part)) continue; seen.add(r.part);
      const toks = paper.tracks[r.part] ?? []; let t = 0, at = -1, start = 0;
      for (let i = 0; i < toks.length; i++) { const k = toks[i]; if (!isTimed(k)) continue; if (t + k.dur > tick) { at = i; start = t; break; } t += k.dur; }
      if (at < 0) continue;
      const mine = (h: { index: number; system: number }) => h.index === at && L.systems[h.system]?.paper === paperId && L.systems[h.system]?.part === r.part;
      const hits = [...L.notes.filter(mine), ...L.rests.filter(mine)];
      if (hits.length) out.push({ part: r.part, index: at, start, note: toks[at].kind === "note", hits });
    }
    return out;
  }
  /** 开播的起点（小节头；2026-10-10 user「编辑的时候光标动但是播放头不动」「大部分时候可以小节级别的开始精度」）：一面小旗，颜色和光标 / 播放线都不一样。null = 没设（从头）。 */
  setStartMark(p: { paperId: string; tick: number } | null): void { this.startP = p; this.drawStartMark(); }
  private drawStartMark(): void {
    const L = this.layout, p = this.startP;
    if (!p || !L) { this.startEl?.remove(); this.startEl = null; return; }
    const found = this.soundingAt(p.paperId, p.tick).filter((f) => f.start >= p.tick);   // 正好从小节头开始的那些音 / 休止
    const h = (found.length ? found : this.soundingAt(p.paperId, p.tick)).flatMap((f) => f.hits).sort((a, b) => a.x - b.x)[0];
    if (!h) { this.startEl?.remove(); this.startEl = null; return; }
    const sys = L.systems[h.system].sys, rows = L.systems.filter((r) => r.paper === p.paperId && r.sys === sys);
    const top = Math.min(...rows.map((r) => r.top)), bottom = Math.max(...rows.map((r) => r.bottom));
    let el = this.startEl;
    if (!el || !el.isConnected) { el = document.createElement("div"); el.className = "start-mark"; el.title = "起点：|▶ 从这儿放（长按 / 右键空白处「从这儿放」挪它；编辑不动它）"; this.ink.appendChild(el); this.startEl = el; }
    el.style.left = `${h.x - 4}px`; el.style.top = `${top}px`; el.style.height = `${Math.max(1, bottom - top)}px`;
  }
  /** 光标 / 选区 / 编辑框在哪（变了才跟）。 */
  private baseKey(): string {
    const st = this.host.get();
    return `${st.at.paper}|${st.at.part}|${st.caret}|${st.sel ? `${st.sel.from}-${st.sel.to}` : ""}|${this.lyrics.open ? this.lyrics.system : ""}|${this.marks.open ? this.marks.system : ""}`;
  }
  private followKey = "";
  private holdView = false;               // 正在点声部名（这一次重画不跟光标）
  private heldBase: string | null = null; // 点声部名之后的光标位置：没挪之前（含 pad 弹出的窗口变化）都不跟
  /** 光标画在上一行末尾（点在上一行行末放的）：记着是哪个光标位置（纸|声部|下标），光标一挪就失效；不进文件、不进 undo（2026-10-10 user「然后我希望光标能同时支持一行的末尾和下一行的开头两个位置取决于点在哪里」）。 */
  private caretEnd: string | null = null;

  /** 能点、能选的东西 = 音 + 休止（user 2026-10-08「为什么休止符没法选择，休止符就这么没有人权吗，我感觉编辑的心智模型里面休止符也应该和普通音符没区别」）。
   *  休止没有音高：d = NaN（笔 / 鼠标按住拖只改时值、不出声）。 */
  private get hits(): HitNote[] {
    const L = this.layout; if (!L) return [];
    return [...L.notes, ...L.rests.map((r) => ({ index: r.index, system: r.system, x: r.x, y: r.y, w: r.w, d: NaN }))];
  }
  /** 这个命中记录是不是光标所在那条 track 的。 */
  private onTrack(h: { system: number }): boolean {
    const L = this.layout!, st = this.host.get(), row = L.systems[h.system];
    return !!row && row.paper === st.at.paper && row.part === st.at.part;
  }
  /** 选区两端的棒棒糖把手：第一个 / 最后一个选中的音的下面（歌词行再往下一点）。 */
  private placeHandles(): void {
    const L = this.layout, st = this.host.get();
    const inSel = L && st.sel ? this.hits.filter((n) => this.onTrack(n) && n.index >= st.sel!.from && n.index < st.sel!.to) : [];
    if (!L || !inSel.length) { this.handles.start.hidden = true; this.handles.end.hidden = true; return; }
    const a = inSel.reduce((p, n) => (n.index < p.index ? n : p)), b = inSel.reduce((p, n) => (n.index > p.index ? n : p)), sp = L.sp;
    Object.assign(this.handles.start.style, { left: `${a.x - sp * 0.3}px`, top: `${L.lyricY(a.system) + sp * 0.9}px` }); this.handles.start.hidden = false;
    Object.assign(this.handles.end.style, { left: `${b.x + b.w + sp * 0.3}px`, top: `${L.lyricY(b.system) + sp * 0.9}px` }); this.handles.end.hidden = false;
  }
  /** 光标那一行滚进视野（软键盘弹出 / 收起时宿主调）。 */
  followNow(): void { this.follow(); }   // 明着要（撤销把视图带过去等）= 照拉
  /** 光标（或选中）那一行保持在视野里（只滚谱面板自己，页面不滚）。 */
  private follow(): void {
    const L = this.layout, st = this.host.get(); if (!L) return;
    let sys = L.head?.system ?? -1;
    if (sys < 0 && st.sel) sys = this.hits.find((n) => this.onTrack(n) && n.index >= st.sel!.from && n.index < st.sel!.to)?.system ?? -1;
    if (this.lyrics.open) sys = this.lyrics.system;
    if (this.marks.open) sys = this.marks.system;
    const box = L.systems[sys]; if (!box) return;
    const top = this.el.scrollTop, h = this.el.clientHeight, z = this.zoom, off = this.sheet.offsetTop;   // off = 纸上面留给走带胶囊的边距（styles.css .sheet margin-top）
    // 不贴着最下面：下面留出大约一行（user 2026-10-08「打字的自动对齐也不要靠着最下面，而是倒数第二排之类的，打音符也是」）——最多三成屏高
    //   （矮屏 + 软键盘时别把这一行推出上沿）；往上跟的时候上面也留一点。放不下两头 = 这一行的上沿优先看得见
    const a = off + box.top * z, bt = off + box.bottom * z, rowH = bt - a, below = Math.min(rowH, h * 0.3), above = Math.min(rowH * 0.25, h * 0.1);
    if (a - above < top) this.el.scrollTop = Math.max(0, a - above);
    else if (bt + below > top + h) this.el.scrollTop = Math.min(bt + below - h, a - above);
    // 横卷：光标（选中 = 它的第一个音）横着也保持在视野里——左边留一成、右边留两成，出了就把它放到左边三成处（往右写的时候前面能看见几小节）
    if (this.hscroll) {
      const hx = L.head?.x ?? (st.sel ? this.hits.find((n) => this.onTrack(n) && n.index === st.sel!.from)?.x : undefined); if (hx === undefined) return;
      const sx = this.sheet.offsetLeft + (L.pageX.left + hx) * z, vl = this.el.scrollLeft, vw = this.el.clientWidth;
      if (sx < vl + vw * 0.1 || sx > vl + vw * 0.8) this.el.scrollLeft = Math.max(0, sx - vw * 0.3);
    }
  }

  /** 指针 → 纸面坐标（纸可能居中在桌面上：按纸自己的位置算；放大了除回去）。 */
  /** 纸面上的框 → 屏幕坐标（local 的反过来）。 */
  private clientBox(b: { x: number; y: number; w: number; h: number }): { left: number; top: number; right: number; bottom: number } {
    const r = this.sheet.getBoundingClientRect(), ox = this.layout?.pageX.left ?? 0, z = this.zoom;
    return { left: r.left + (b.x + ox) * z, top: r.top + b.y * z, right: r.left + (b.x + b.w + ox) * z, bottom: r.top + (b.y + b.h) * z };
  }
  private local(e: { clientX: number; clientY: number }): { x: number; y: number } {
    const r = this.sheet.getBoundingClientRect(), ox = this.layout?.pageX.left ?? 0;
    return { x: (e.clientX - r.left) / this.zoom - ox, y: (e.clientY - r.top) / this.zoom };
  }
  /** 原大时纸（含边距）有多宽（px，render 里记）：捏合最多放到它和屏幕一样宽。 */
  private paperW = 0;
  /** 最多放大几倍（同 PDF 阅读器：可以比屏幕宽、横着滚；user 2026-10-10「ipad可以放的很大，就和pdf浏览器一样」——取代 v0.9.19 的「最多到纸和屏幕一样宽」）。 */
  private maxZoom(): number { return MAX_ZOOM; }
  private pinchStart(): void {
    const [a, b] = [...this.touches.values()], r = this.sheet.getBoundingClientRect(), z0 = this.zoom, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    if (this.pinch?.raf) cancelAnimationFrame(this.pinch.raf);
    this.pinch = { d0: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), z0, sx: (mx - r.left) / z0, sy: (my - r.top) / z0, left: r.left, top: r.top, k: 1, mx, my, raf: 0 };
    this.sheet.style.transformOrigin = "0 0"; this.sheet.style.willChange = "transform";
  }
  private pinchMove(): void {
    const pi = this.pinch!, [a, b] = [...this.touches.values()], d = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
    pi.k = Math.max(1, Math.min(this.maxZoom(), pi.z0 * (d / pi.d0))) / pi.z0; pi.mx = (a.x + b.x) / 2; pi.my = (a.y + b.y) / 2;
    if (!pi.raf) pi.raf = requestAnimationFrame(() => {   // 一帧最多改一次；中点下面那个纸面点跟着两指走 = 缩放 + 平移一起
      const q = this.pinch; if (!q) return; q.raf = 0;
      const tx = q.mx - q.left - q.k * q.z0 * q.sx, ty = q.my - q.top - q.k * q.z0 * q.sy;
      this.sheet.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${q.k.toFixed(4)})`;
    });
  }
  private pinchEnd(): void {
    const pi = this.pinch; if (!pi) return;
    this.pinch = null; if (pi.raf) cancelAnimationFrame(pi.raf);
    this.sheet.style.transform = ""; this.sheet.style.willChange = ""; this.sheet.style.transformOrigin = "";
    this.setZoom(pi.z0 * pi.k, { x: pi.mx, y: pi.my, cx: pi.sx, cy: pi.sy });   // 落定：重排一次，滚到让那个点还在两指中点下面
  }
  /** 放大 / 缩小到 z（1 = 原大，最多到纸和屏幕一样宽）；anchor = 屏幕上这个点下面的纸面点保持不动（null = 左上角）。 */
  private setZoom(z: number, anchor: { x: number; y: number; cx: number; cy: number } | null): void {
    z = Math.max(1, Math.min(this.maxZoom(), z));
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
    if ((e.target as HTMLElement).closest(".lyric-input, .lyric-merge, .mark-ed, .title-input, .sel-handle")) return;   // 在歌词框 / 记号框 / 把手上点：交给它们
    const L = this.layout; if (!L || e.button === 2) return;   // 右键归 contextmenu
    const p = this.local(e);   // 先算纸面坐标再拿焦点：focus 可能连带滚一下（分页时光标那行在页外），坐标就错了（2026-10-08 E2E 抓到）
    // 笔 / 鼠标：点谱面 = 键盘回到谱上（下面 preventDefault 会拦掉浏览器默认的抢焦点）。手指：按下先不抢——拖 = 滚动，歌词框开着时滚谱不该把它收掉、
    //   把系统键盘收回去（收键盘 → 谱面变高 → 跟随光标又把视图拽回去 = 白滚；user 2026-10-08「每次打日文还是跟八年抗战一样…歌词输入模式滚动会导致键盘弹回来，然后白滚」）；
    //   轻点（up）/ 长按（longPress）才抢
    if (!this.rules.edit) {   // 听模式：只挡写谱。手指照样能滚 / 捏合；轻点 = 看谱的那些（歌手牌 / 翻纸 / 本段…），不跳播；长按 = 小菜单（从这儿放…）
      if (e.pointerType === "touch") {
        this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY }); this.el.setPointerCapture(e.pointerId);
        if (this.touches.size === 2) { this.finger = null; this.cancelPress(); this.pinchStart(); return; }
        if (this.touches.size > 2) return;
        this.finger = { pid: e.pointerId, y0: e.clientY, top0: this.el.scrollTop, x: p.x, y: p.y, moved: false, shift: false, x0: e.clientX, left0: this.el.scrollLeft };
        this.armPress(e, p, null);
        return;
      }
      e.preventDefault(); this.el.setPointerCapture(e.pointerId);
      this.lockTap = { pid: e.pointerId, x: p.x, y: p.y, moved: false };
      this.armPress(e, p, null);
      return;
    }
    if (e.pointerType !== "touch") this.el.focus({ preventScroll: true });
    if (e.pointerType === "touch") {   // 手指：拖 = 滚动；不动 = 轻点；按住不动 = 长按选区；第二根手指落下 = 捏合缩放 / 双指平移
      this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.el.setPointerCapture(e.pointerId);
      if (this.touches.size === 2) {
        this.finger = null; this.cancelPress();
        this.pinchStart();
        return;
      }
      if (this.touches.size > 2) return;
      this.finger = { pid: e.pointerId, y0: e.clientY, top0: this.el.scrollTop, x: p.x, y: p.y, moved: false, shift: e.shiftKey, x0: e.clientX, left0: this.el.scrollLeft };
      const grab = this.grabAt(p.x, p.y, true);   // 按在字 / 力度记号上：长按 = 拿起来拖（之前动了照旧是滚动）
      this.armPress(e, p, grab ? null : this.noteAt(p.x, p.y, true), grab);   // 手指：按指尖大小找音
      return;
    }
    e.preventDefault();
    const grab = this.grabAt(p.x, p.y, false);
    if (grab) {   // 笔 / 鼠标按在字 / 力度记号上：动了 = 直接拖（同拖音）；原地松手 = 轻点（歌词框 / 小菜单）；按住不动到点 = 拿起来
      this.el.setPointerCapture(e.pointerId);
      this.armPress(e, p, null, grab);
      return;
    }
    if (this.tap(p.x, p.y, e.shiftKey, e.pointerId)) return;   // 记号 / 歌词行 / 纸上的小钮（不含音符）
    const hit = this.noteAt(p.x, p.y);
    if (hit) {   // 笔 / 鼠标按在音上：按住就响；0.42 s 内动了 = 拖（改音高 / 时值）；不动到点 = 长按选中；抬手不动 = 轻点（光标到它后面）
      this.host.focus?.("staff");
      const st0 = this.host.get();
      if (!this.onTrack(hit)) this.host.set(this.focusRow(st0, hit.system, hit.index + 1));
      const t = tr(this.host.get())[hit.index] as NoteTok;
      if (this.rules.noteDrag) this.drag = { index: hit.index, d0: hit.d, dur0: t.dur, x0: p.x, y0: p.y, axis: "", pid: e.pointerId, heard: hit.d, ...(e.pointerType === "mouse" ? { wait: true } : {}) };   // 拖音 = 只在「音」里；鼠标要先长按
      this.el.setPointerCapture(e.pointerId);   // 按下不响（轻点 = 光标，不预览；user 2026-10-08「光标点选不标蓝音的话那么也不用 preview 吧」）；开始拖音高才响
      this.armPress(e, p, hit);
      return;
    }
    // 空白处：先不放光标——拖了就是框选，没拖（松开）才放光标
    this.box = { pid: e.pointerId, x0: p.x, y0: p.y, moved: false, st0: this.host.get(), row: this.rowAt(p.y) };
    this.el.setPointerCapture(e.pointerId);
    this.armPress(e, p, null);
  }
  /** 按下：开长按计时（0.42 s 不动 = 长按）。 */
  private armPress(e: PointerEvent, p: { x: number; y: number }, hit: HitNote | null, grab: Grab | null = null): void {
    this.cancelPress();
    const pr = { pid: e.pointerId, type: e.pointerType, x: p.x, y: p.y, cx: e.clientX, cy: e.clientY, hit, grab, timer: 0, shift: e.shiftKey, moved: false, fired: false };
    pr.timer = window.setTimeout(() => this.longPress(), 420);
    this.press = pr;
  }
  private cancelPress(): void { if (this.press) { clearTimeout(this.press.timer); this.press = null; } this.selDrag = null; }
  /** 长按到点：按在音上 = 选中它、进选区态（不抬手接着拖 = 扩选）；空白处 = 光标放到那里 + 小菜单（粘贴 / 插记号 / 全选…；user 2026-10-08「空白长按可以黏贴或者类似的右键上下文菜单」）。 */
  private longPress(): void {
    const pr = this.press; if (!pr || pr.moved) return;
    pr.fired = true;
    if (!this.rules.edit) { this.finger = null; this.lockTap = null; this.listenMenu(pr.x, pr.y, pr.cx, pr.cy); return; }   // 听模式：长按 = 小菜单
    if (pr.type === "touch") this.el.focus({ preventScroll: true });   // 手指按下时没抢焦点（见 down），长按到点才抢
    if (pr.grab) { this.startLift(pr.grab, pr.pid, pr.x, pr.y, pr.cx, pr.cy, pr.type === "touch"); return; }
    if (!pr.hit) { this.blankPress(pr.x, pr.y, pr.cx, pr.cy); return; }
    const cur = this.host.get().sel;
    if (cur && this.onTrack(pr.hit) && pr.hit.index >= cur.from && pr.hit.index < cur.to) {   // 长按已经选中的音：不抬手拖 = 照常从它扩选；原地抬手 = 选区菜单（不重选）
      this.finger = null; if (this.drag) { this.host.release?.(); this.drag = null; }
      this.selDrag = { pid: pr.pid, anchor: pr.hit.index, menu: true };
      this.host.audition?.(pr.hit.index, true); this.holdPid = pr.pid; return;   // 按住已选中的音也听见它
    }
    if (this.drag?.wait) {   // 鼠标长按到点 = 拿起来：接着拖 = 改音高 / 时值；原地松手 = 选中它（up 里）
      this.drag.wait = false; this.host.audition?.(pr.hit.index, true); this.holdPid = pr.pid; return;
    }
    this.selectHeld(pr.pid, pr.hit);
  }
  /** 长按选中按着的那个音（不抬手接着拖 = 扩选）。 */
  private selectHeld(pid: number, hit: HitNote): void {
    this.lyrics.commitAndClose(); this.marks.commitAndClose();
    this.finger = null;   // 手指：长按之后不再当滚动
    if (this.drag) { this.host.release?.(); this.drag = null; }   // 笔：按住出声到此为止
    const st0 = this.host.get(), st = this.onTrack(hit) ? st0 : this.focusRow(st0, hit.system);
    this.host.set(select(st, hit.index, hit.index + 1));
    this.selDrag = { pid, anchor: hit.index };
    this.host.focus?.("staff");
    this.host.audition?.(hit.index, true); this.holdPid = pid;   // 按住音 = 听见它（2026-10-10 user「按住音的时候应该能听到preview」），抬手停
  }
  /** 歌手牌（每张纸第一行各条谱左边的声部名）：开轨的小卡——光标换到那条（setFocus 放在那条的最后），但视图不跟过去
   *  （user 2026-10-08「按vocal字弹track窗的时候页面滚动会乱」）。左键 / 右键（2026-10-10 user「右键歌手名应该也是弹歌手选项，和左键一样」）/ 听模式都走这里。 */
  private openPartAt(x: number, y: number): boolean {
    const L = this.layout; if (!L) return false;
    const pt = L.parts.find((b) => this.inBox(b, x, y)); if (!pt) return false;
    const at = this.clientBox(pt); this.holdView = true; this.host.set(setFocus(this.host.get(), pt.paper, pt.part)); this.holdView = false;
    this.heldBase = this.baseKey();   // 本来就在这条（没重画）也一样：接下来 pad 弹出也不拽
    this.host.onPart?.(pt.paper, pt.part, at); return true;
  }
  /** 这条声部台上那位不唱字？是 = 说一次为什么（同一位歌手只说一次，换了再说）。 */
  private noLyricsSaid = "";
  private noLyricsHere(part: string): boolean {
    const why = this.host.parts().find((p) => p.id === part)?.noLyrics; if (!why) return false;
    if (this.noLyricsSaid !== why) { this.noLyricsSaid = why; this.host.notice?.(why); }
    return true;
  }
  /** 「词」里点了一个音：开它的歌词框（休止没有歌词 = false，照常放光标）。 */
  private openLyricOn(hit: HitNote): boolean {
    const L = this.layout, row = L?.systems[hit.system]; if (!L || !row) return false;
    const t = trackOf(this.host.get().song, row.paper, row.part)[hit.index]; if (t?.kind !== "note") return false;
    if (!t.lyric && this.noLyricsHere(row.part)) return false;   // 不唱字的声部：空着的不开框（照常放光标）
    this.host.set(this.focusRow(this.host.get(), hit.system, this.host.get().caret)); this.lyrics.openAt(hit.index); this.host.focus?.("text");
    return true;
  }
  /** 听模式的长按 / 右键：点在音 / 休止上 = 它；空白 = 那一行光标会落的位置。不改光标、不改谱，只告诉宿主开小菜单。 */
  private listenMenu(x: number, y: number, cx: number, cy: number): void {
    const L = this.layout; if (!L) return;
    const hit = this.noteAt(x, y, true), r = hit ? L.systems[hit.system] : null;
    if (hit && r) { this.host.onListenMenu?.({ x: cx, y: cy }, { paper: r.paper, part: r.part, index: hit.index, caret: hit.index }); return; }
    const s = this.caretAt(x, y);
    this.host.onListenMenu?.({ x: cx, y: cy }, { paper: s.at.paper, part: s.at.part, index: null, caret: s.caret });
  }
  /** 空白处长按 / 右键：收起编辑框、光标放到那里（同轻点空白），再告诉宿主开小菜单。row = 这一行里光标所在 track 的音的下标范围。 */
  private blankPress(x: number, y: number, cx: number, cy: number): void {
    this.lyrics.commitAndClose(); this.marks.commitAndClose();
    this.finger = null; this.box = null; this.boxEl.hidden = true;
    if (this.drag) { this.host.release?.(); this.drag = null; }
    this.placeCaretAt(x, y);
    const L = this.layout!, row = this.rowAt(y), mine = this.hits.filter((n) => n.system === row && this.onTrack(n));
    const range = mine.length ? { from: Math.min(...mine.map((n) => n.index)), to: Math.max(...mine.map((n) => n.index)) + 1 } : null;
    this.host.focus?.("staff");
    this.host.onBlankPress?.({ x: cx, y: cy }, range);
  }
  /** 按在能拿起来拖的东西上：力度记号 / 渐强渐弱（在它的框里）先；歌词的字（不在音上时，同轻点的判法）。记号框开着 = 这一下是收框，不拿。 */
  private grabAt(x: number, y: number, finger: boolean): Grab | null {
    if (!this.layout || this.marks.open) return null;
    const dh = this.rules.symbols ? this.dynHitAt(x, y, finger) : null;   // 记号只在「符」里拿得起来
    if (dh) return { kind: "mark", index: dh.index, system: dh.system };
    if (!this.rules.lyrics || this.noteAt(x, y)) return null;             // 字只在「词」里拿得起来
    const ly = this.lyricAt(x, y), row = ly ? this.layout.systems[ly.system] : null;
    if (!ly || !row) return null;
    const t = trackOf(this.host.get().song, row.paper, row.part)[ly.index];   // 只拿有字的（空着的歌词位 / 拖腔 = 照旧：轻点开歌词框，长按 = 空白处的小菜单）
    return t?.kind === "note" && t.lyric && t.lyric !== MELISMA_MARK ? { kind: "lyric", index: ly.index, system: ly.system } : null;
  }
  /** 歌词那一行上点中的字：按每一行自己的歌词基线找（没写歌词的行比歌词基线矮，光看 rowAt 会落到下一行——2026-10-08 E2E 抓到）。
   *  命中带往下放宽一点：手指点在字下面也算；离最近的字 4 个间距以内。 */
  private lyricAt(x: number, y: number): LyricHit | null {
    const L = this.layout!, sp = L.sp;
    for (let r = 0; r < L.systems.length; r++) {
      const ly = L.lyricY(r);
      if (!(y > ly - sp * 2.2 && y < ly + sp * 2.4)) continue;
      const cands = L.lyrics.filter((h) => h.system === r);
      if (!cands.length) return null;
      const best = cands.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
      return Math.abs(best.x - x) < sp * 4 ? best : null;
    }
    return null;
  }
  /** 点中的力度记号 / 渐强渐弱（手指放宽几个像素）。 */
  private dynHitAt(x: number, y: number, finger: boolean): DynHit | null {
    const L = this.layout; if (!L) return null;
    const pad = finger ? 6 / this.zoom : 0;
    return L.dyns.find((b) => x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad) ?? null;
  }
  /** 力度记号 / 渐强渐弱的小菜单：先把光标换到那条 track，再告诉宿主（开在记号下面）。 */
  private markMenu(h: DynHit): void {
    if (!this.onTrack(h)) this.host.set(this.focusRow(this.host.get(), h.system, this.host.get().caret));
    const b = this.clientBox(h);
    this.host.focus?.("staff");
    this.host.onMarkPress?.(h.index, { x: (b.left + b.right) / 2, y: b.bottom });
  }
  /** 拿起来（长按到点 / 笔鼠标按住动了）：收起编辑框、停掉滚动，记下这条 track 上能落的音。编辑框收起时可能改了谱（贴字 / 插句号）= 按原位置重新找一次。 */
  private startLift(grab0: Grab, pid: number, x: number, y: number, cx: number, cy: number, finger: boolean): void {
    const hadEditor = this.lyrics.open || this.marks.open;
    this.lyrics.commitAndClose(); this.marks.commitAndClose();
    this.finger = null; this.box = null; this.boxEl.hidden = true;
    if (this.drag) { this.host.release?.(); this.drag = null; }
    const grab = hadEditor ? this.grabAt(x, y, finger) : grab0;
    if (!grab || !this.layout) return;
    if (!this.onTrack(grab)) this.host.set(this.focusRow(this.host.get(), grab.system));
    const L = this.layout, st0 = this.host.get(), toks = tr(st0), seen = new Set<number>();
    // 落点：歌词 = 能放字的音；记号 = 音和休止（user 2026-10-08「力度符号应该能拖动到休止符上」）
    const spots = [...L.notes.map((n) => ({ ...n, rest: false })), ...(grab.kind === "mark" ? L.rests.map((r) => ({ ...r, rest: true })) : [])];
    const targets = spots.filter((n) => this.onTrack(n) && (grab.kind === "mark" || lyricSlot(toks[n.index])) && !seen.has(n.index) && (seen.add(n.index), true))
      .map((n) => ({ idx: n.index, x: grab.kind === "lyric" ? n.x + n.w / 2 : n.x, system: n.system })).sort((a, b) => a.idx - b.idx);
    let src: number;
    if (grab.kind === "lyric") src = targets.findIndex((t) => t.idx === grab.index);
    else { let a = grab.index + 1; while (a < toks.length && toks[a].kind !== "note" && toks[a].kind !== "rest") a++; src = targets.findIndex((t) => t.idx >= a); }
    if (grab.kind === "lyric" && src < 0) return;
    this.lift = { pid, grab, st0, targets, src, cur: src, x0: x, y0: y, cx, cy, moved: false, short: false, removed: 0, dx: src >= 0 ? x - targets[src].x : 0 };
    this.el.classList.add("lifting");
    this.hot = new Set([toks[grab.index].id]); this.render();   // 拿起来那一刻就亮（强调色）：知道抓住了
    this.host.focus?.("staff");
  }
  /** 拖着走：指针（减去拿起来时和那个音的错位）最近的那个音 = 落点；换了落点就从拿起来之前的谱重算一次（谱上实时是挪过去的样子）。 */
  private dragLift(p: { x: number; y: number }): void {
    const f = this.lift!;
    if (!f.moved && Math.hypot(p.x - f.x0, p.y - f.y0) < 6) return;
    f.moved = true;
    if (!f.targets.length) return;
    const rows = [...new Set(f.targets.map((t) => t.system))], row = this.rowAt(p.y), sys = rows.includes(row) ? row : rows.reduce((a, b) => (Math.abs(b - row) < Math.abs(a - row) ? b : a));
    let best = -1, bd = Infinity;
    f.targets.forEach((t, k) => { if (t.system !== sys) return; const d = Math.abs(t.x - (p.x - f.dx)); if (d < bd) { bd = d; best = k; } });
    if (best < 0 || best === f.cur) return;
    f.cur = best;
    if (f.grab.kind === "lyric") {
      const want = best - f.src, r = moveSyllable(f.st0, f.grab.index, want);
      f.short = want > 0 ? r.done < want : r.done === 0 && want < 0;
      this.hot = new Set([tr(r.st)[r.at].id]);   // 字挪到哪个音，亮的就跟到哪个音
      this.host.set(r.st, { gesture: "lift" });
    } else {
      const r = moveMark(f.st0, f.grab.index, f.targets[best].idx);
      f.removed = r.removed;
      this.host.set(r.st, { gesture: "lift" });
    }
  }
  /** 松手：没动 = 歌词 → 选中这个音（同长按音；再拖把手扩选），记号 → 小菜单；动了 = 已经挪好了，挪不动 / 顶掉了别的说一声。 */
  private endLift(): void {
    const f = this.lift!; this.lift = null; this.el.classList.remove("lifting"); this.hot = null; this.render();
    if (!f.moved) {
      if (f.grab.kind === "lyric") this.host.set(select(this.host.get(), f.grab.index, f.grab.index + 1));
      else this.host.onMarkPress?.(f.grab.index, { x: f.cx, y: f.cy });
      return;
    }
    if (f.grab.kind === "lyric" && f.short) this.host.notice?.(f.cur > f.src ? "这一句后面没有空着的音了（句号是边界），字只能挪到这儿" : "前面隔着句号（或者没有音了），字挪不过去");
    if (f.grab.kind === "mark" && f.removed) this.host.notice?.(`顺手去掉了 ${f.removed} 个不再管任何音的力度记号 / 渐强渐弱（撤销能找回来）`);
  }
  /** 点中了哪个音（光标所在 track 或别的 track 都算；别的 track 的音 = 先把焦点换过去）。 */
  private noteAt(x: number, y: number, finger = false): HitNote | null {
    const L = this.layout!, row = this.rowAt(y); if (row < 0) return null;
    const sp = L.sp;
    if (!finger) return this.hits.find((n) => n.system === row && x >= n.x - sp * 0.5 && x <= n.x + n.w + sp * 0.5 && Math.abs(y - n.y) <= sp * 0.9) ?? null;   // 笔 / 鼠标：准
    // 手指：指尖比符头大得多（符头 ≈ 1.2 sp，iPad 上十来个像素），原来的碰撞箱贴着符头 = 按偏一点、按在符干上、按叠音下面的音就算空白，长按没反应
    //   （user 2026-10-08「手指，有时候能选中有时候选不中，是不是你碰撞箱literally贴着音符的图像画了？」）→ 这一行里按指尖大小（屏幕上约 22 × 26 px）找最近的音
    const tx = Math.max(sp * 0.5, 22 / this.zoom), ty = Math.max(sp * 0.9, 26 / this.zoom);
    let best: HitNote | null = null, bd = Infinity;
    for (const n of this.hits) {
      if (n.system !== row) continue;
      const dx = x - Math.max(n.x, Math.min(x, n.x + n.w)), dy = y - n.y;
      if (Math.abs(dx) > tx || Math.abs(dy) > ty) continue;
      const d = (dx / tx) ** 2 + (dy / ty) ** 2; if (d < bd) { bd = d; best = n; }
    }
    return best;
  }
  /** 离指针最近的、光标所在 track 上的音（扩选用）：先按行（指针所在行；不是这条 track 的行就取最近的一行），再按 x。 */
  private noteNear(p: { x: number; y: number }): number {
    const L = this.layout!, mine = this.hits.filter((n) => this.onTrack(n)); if (!mine.length) return -1;
    const row = this.rowAt(p.y);
    const rows = [...new Set(mine.map((n) => n.system))], sys = rows.includes(row) ? row : rows.reduce((a, b) => (Math.abs(b - row) < Math.abs(a - row) ? b : a));
    const cands = mine.filter((n) => n.system === sys);
    return cands.reduce((a, b) => (Math.abs(b.x + b.w / 2 - p.x) < Math.abs(a.x + a.w / 2 - p.x) ? b : a)).index;
  }

  private inBox(b: { x: number; y: number; w: number; h: number } | null | undefined, x: number, y: number): boolean { return !!b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }
  /** 一次轻点：记号 → 记号框；歌词行 → 歌词框；音符 → 选中（+ 笔 / 鼠标开始拖）。点中了东西返回 true；落在空白处返回 false（调用方决定放光标还是框选）。 */
  /** view = 听模式：只认看谱的那些（纸的设置 / 翻纸 / 本段 / 歌手牌），写谱的（歌名 / 作者栏 / 编排 / 曲段名 / 纸的菜单 / 新纸）不接。 */
  private tap(x: number, y: number, shift: boolean, pid: number | null, view = false): boolean {
    const L0 = this.layout!, wasMark = this.marks.open, wasLyric = this.lyrics.open;
    this.lyrics.commitAndClose(); this.marks.commitAndClose();
    if (wasMark) { this.host.focus?.("staff"); return true; }   // 点别处 = 先收起记号框（这一下不另做事）
    // 手指（pid === null）：歌词框开着时点谱面 = 只收框、不选中（user 2026-10-08 截图：打歌词时误触把一个音选成蓝的）；笔 / 鼠标照旧可以直接点选
    if (wasLyric && pid === null) { this.host.focus?.("staff"); return true; }
    const L = this.layout ?? L0, sp = L.sp;
    // 0. 纸右上角的小钮（纸张）、旁边的「＋」、歌名左边的「‹ ›」——都在歌名那一条里，先于歌名判
    if (this.inBox(L.paperChip, x, y)) { this.host.onPaper?.(); return true; }
    if (!view && this.inBox(L.addPaper, x, y)) { this.host.onAddPaper?.(); return true; }
    if (this.inBox(L.nav?.prev, x, y)) { this.host.onNav?.(-1); return true; }
    if (this.inBox(L.nav?.next, x, y)) { this.host.onNav?.(1); return true; }
    if (this.inBox(L.nav?.scope, x, y)) { this.host.onScopeToggle?.(); return true; }
    if (!view && this.inBox(L.paperMenu, x, y)) { this.host.onPaperMenu?.(this.host.get().at.paper); return true; }
    // 0⅙. 作词 / 作曲（标题下面靠右）
    if (!view && this.inBox(L.credits, x, y)) { this.host.focus?.("text"); this.host.onCredits?.(); return true; }
    // 0⅛. 歌手牌（每张纸第一行各条谱左边的声部名）：先把光标换到那条，再开歌手牌
    if (this.openPartAt(x, y)) return true;
    // 0¼. 纸面最上面的歌名（可不填）；歌名下面的编排那一行（全部视图里才有）
    if (view) { for (const pp of L.papers) { if (this.inBox(pp.prev ?? null, x, y)) { this.host.onNavFrom?.(pp.id, -1); return true; } if (this.inBox(pp.next ?? null, x, y)) { this.host.onNavFrom?.(pp.id, 1); return true; } if (this.inBox(pp.scope, x, y)) { this.host.onScopeOf?.(pp.id); return true; } } return false; }   // 听：看谱的到此为止
    if (this.inBox(L.title, x, y)) { this.title.openNow(); this.host.focus?.("text"); return true; }
    if (this.inBox(L.arrangement, x, y)) { this.title.openArrangement(); this.host.focus?.("text"); return true; }
    // 0⅜. 纸顶：「⋯」（纸的菜单）、曲段名（就地改）；最底下「＋ 新的纸」
    for (const pp of L.papers) {
      if (this.inBox(pp.menu, x, y)) { this.host.onPaperMenu?.(pp.id); return true; }
      if (this.inBox(pp.prev ?? null, x, y)) { this.host.onNavFrom?.(pp.id, -1); return true; }
      if (this.inBox(pp.next ?? null, x, y)) { this.host.onNavFrom?.(pp.id, 1); return true; }
      if (this.inBox(pp.scope, x, y)) { this.host.onScopeOf?.(pp.id); return true; }
      if (pp.title.shown && this.inBox(pp.title, x, y)) { this.title.openNow(pp.id); this.host.focus?.("text"); return true; }
    }
    const row = this.rowAt(y); if (row < 0) return false;
    // 0¼. 谱号 / 八度线（v0.9.28；user「谱号是高音还是低音以及移动八度应该点谱号就能做，然后每一行的谱号应该都可以点」）：写谱的模式里都认（听模式不接）
    const ch = this.rules.edit ? L.clefs.find((c) => x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) : undefined;
    if (ch) { const b = this.clientBox(ch); this.host.onClef?.(ch, { x: b.left, y: b.bottom }); return true; }
    // 0½. 记号（调号 / 拍号 / 速度）：换到那条 track 再开框——只在「符」里（别的模式点它 = 放光标）
    const mk = this.rules.symbols ? L.marks.find((m) => x >= m.x && x <= m.x + m.w && y >= m.y && y <= m.y + m.h) : undefined;
    if (mk) { this.host.set(this.focusRow(this.host.get(), mk.system, this.host.get().caret)); this.marks.openAt(mk.index); return true; }
    // 0¾. 力度记号 / 渐强渐弱：小菜单（改 / 删）——只在「符」里
    const dh = this.rules.symbols ? this.dynHitAt(x, y, pid === null) : null;
    if (dh) { this.markMenu(dh); return true; }
    // 1. 歌词那一行（音符优先，别抢下一行高音的点）——只在「词」里
    if (this.rules.lyrics && !this.noteAt(x, y)) {
      const ly = this.lyricAt(x, y), lyRow = ly ? L.systems[ly.system] : null;
      if (ly && lyRow && this.noLyricsHere(lyRow.part)) {
        const t = trackOf(this.host.get().song, lyRow.paper, lyRow.part)[ly.index];
        if (t?.kind === "note" && !t.lyric) return false;   // 不唱字的声部：空着的歌词位不开框（照常放光标）
      }
      if (ly) { this.host.set(this.focusRow(this.host.get(), ly.system, this.host.get().caret)); this.lyrics.openAt(ly.index); this.host.focus?.("text"); return true; }
    }
    // 2. 音符：不在这里（轻点 / 长按 / 拖在 down / up / longPress 里分）
    void shift; void pid;
    return false;
  }
  /** 轻点在音上（手指 / 笔 / 鼠标）：光标放到它后面（Shift = 把选中扩到它）。 */
  private tapNote(hit: HitNote, shift: boolean): void {
    this.lyrics.commitAndClose(); this.marks.commitAndClose();
    const st0 = this.host.get(), st = this.onTrack(hit) ? st0 : this.focusRow(st0, hit.system);
    const cur = this.onTrack(hit) ? st.sel : null;
    if (shift && cur) this.host.set(select(st, Math.min(cur.from, hit.index), Math.max(cur.to, hit.index + 1)));
    else this.putCaret(setCaret(st, hit.index + 1), this.endSlotOn(hit.system, hit.index + 1));   // 点的是一行最后一个音 = 光标画在这一行末尾
    this.host.focus?.("staff");
  }
  /** 这一行（谱行）上有没有「行末」落点给这个光标位置（= 它本来画在下一行开头）。 */
  private endSlotOn(row: number, caret: number): boolean {
    return !!this.layout?.slots.some((s) => s.end && s.system === row && s.caret === caret);
  }
  /** 放光标 + 记住画在行末还是行首。状态没变（光标本来就在这儿）但画法变了 = 自己重画。 */
  private putCaret(next: EditorState, end: boolean): void {
    const want = end ? caretKey(next) : null, before = this.host.get(), redraw = want !== this.caretEnd;
    this.caretEnd = want;
    this.host.set(next);
    if (redraw && this.host.get() === before) this.render();
  }
  /** 空白处放光标（轻点 / 长按 / 右键 / 框选没框住）：那条谱最近的落点，行末的落点 = 画在行末。 */
  private placeCaretAt(x: number, y: number, st = this.host.get()): void {
    const s = this.slotAt(x, y);
    this.putCaret(this.caretAt(x, y, st), !!s?.end);
  }
  private slotAt(x: number, y: number): Slot | null {
    const L = this.layout!, row = this.rowAt(y), cands = L.slots.filter((s) => s.system === row);
    return cands.length ? cands.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a)) : null;
  }
  /** 空白处 → 那条谱最近的光标落点（= 写；点哪条谱光标就到哪条）。 */
  private caretAt(x: number, y: number, st = this.host.get()): EditorState {
    const L = this.layout!, row = this.rowAt(y), best = this.slotAt(x, y);
    if (!best) return st;
    const r = L.systems[row];
    const at = r.paper === st.at.paper && r.part === st.at.part ? setCaret(st, best.caret) : setFocus(st, r.paper, r.part, best.caret);
    return best.lead ? setCaretLead(at, best.lead) : at;   // 补齐的淡色小节（v0.10.6）：光标在尾巴、写的时候先补到这个小节开头
  }
  /** 框选：框住的音（音头中心在框里；只算框起点那条谱的）从第一个到最后一个选成一段；一个都没框住 = 回到起点的光标。 */
  private boxSelect(x1: number, y1: number): void {
    const b = this.box!, L = this.layout!, xa = Math.min(b.x0, x1), xb = Math.max(b.x0, x1), ya = Math.min(b.y0, y1), yb = Math.max(b.y0, y1);
    Object.assign(this.boxEl.style, { left: `${xa}px`, top: `${ya}px`, width: `${xb - xa}px`, height: `${yb - ya}px` });
    const inside = this.hits.filter((n) => { const cx = n.x + n.w / 2; return n.system === b.row && cx >= xa && cx <= xb && n.y >= ya && n.y <= yb; }).map((n) => n.index);
    const key = inside.length ? `${Math.min(...inside)}-${Math.max(...inside)}` : "caret";
    if (key === b.last) return;   // 框住的没变 = 不重设（原来每动一下都重排整张谱 = 卡）
    b.last = key;
    if (!inside.length) { this.placeCaretAt(b.x0, b.y0, b.st0); return; }
    const st = this.focusRow(b.st0, b.row, b.st0.caret);
    this.host.set(select(st, Math.min(...inside), Math.max(...inside) + 1));
  }

  private move(e: PointerEvent): void {
    if (this.lockTap && e.pointerId === this.lockTap.pid) { const p = this.local(e); if (Math.hypot(p.x - this.lockTap.x, p.y - this.lockTap.y) > 6) { this.lockTap.moved = true; if (this.press?.pid === e.pointerId) { this.press.moved = true; clearTimeout(this.press.timer); } } return; }
    const pr = this.press;
    if (pr && e.pointerId === pr.pid && !pr.moved && !pr.fired) { const p = this.local(e); if (Math.hypot(p.x - pr.x, p.y - pr.y) > (pr.type === "touch" ? 10 : 6)) { pr.moved = true; clearTimeout(pr.timer); } }   // 手指抖一点也算轻点
    if (pr && pr.grab && e.pointerId === pr.pid && pr.moved && !pr.fired && pr.type === "pen") { pr.fired = true; this.startLift(pr.grab, pr.pid, pr.x, pr.y, pr.cx, pr.cy, false); }   // 笔按住字 / 记号动了 = 直接拖（手指动了 = 滚动；鼠标要先长按，没长按就动 = 不算，v0.9.39）
    // 鼠标在音 / 记号 / 字上没长按就拖了 = 框选（长按之后才是拿起来挪）
    if (pr && e.pointerId === pr.pid && pr.moved && !pr.fired && pr.type === "mouse" && (pr.grab || this.drag?.wait) && !this.box) {
      const st0 = this.host.get(); this.cancelPress(); this.drag = null;
      this.box = { pid: e.pointerId, x0: pr.x, y0: pr.y, moved: false, st0, row: this.rowAt(pr.y) };
    }
    if (this.lift && e.pointerId === this.lift.pid) { this.dragLift(this.local(e)); return; }
    if (this.selDrag && e.pointerId === this.selDrag.pid) {   // 长按之后接着拖 = 扩选到指针下面的音
      const idx = this.noteNear(this.local(e)); if (idx < 0) return;
      if (this.selDrag.menu) { if (idx === this.selDrag.anchor) return; this.selDrag.menu = false; this.lyrics.commitAndClose(); this.marks.commitAndClose(); }   // 选区里长按后拖到别的音 = 从长按的那个重新扩选
      const st = this.host.get(), a = Math.min(idx, this.selDrag.anchor), b = Math.max(idx, this.selDrag.anchor) + 1;
      if (!st.sel || st.sel.from !== a || st.sel.to !== b) this.host.set(select(st, a, b));
      return;
    }
    if (this.touches.has(e.pointerId)) {
      this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pinch && this.touches.size === 2) { this.pinchMove(); return; }
    }
    if (this.finger && e.pointerId === this.finger.pid) {
      const dy = e.clientY - this.finger.y0, dx = e.clientX - this.finger.x0;
      if (Math.hypot(dx, dy) > 10) this.finger.moved = true;
      if (this.finger.moved) { this.userScrollAt = performance.now(); this.el.scrollTop = this.finger.top0 - dy; if (this.zoom > 1.001 || this.hscroll) this.el.scrollLeft = this.finger.left0 - dx; }   // 放大了 / 横卷：单指也能横着滚
      return;
    }
    if (this.box && e.pointerId === this.box.pid && this.layout) {
      const p = this.local(e), b = this.box;
      if (!b.moved && Math.hypot(p.x - b.x0, p.y - b.y0) < 6) return;
      if (!b.moved) { b.moved = true; this.boxEl.hidden = false; }
      b.px = p.x; b.py = p.y;
      if (!b.raf) b.raf = requestAnimationFrame(() => { const bb = this.box; if (!bb || bb !== b) return; bb.raf = 0; this.boxSelect(bb.px!, bb.py!); });   // 每帧最多一次
      return;
    }
    const g = this.drag, L = this.layout; if (!g || !L || e.pointerId !== g.pid || g.wait) return;   // 鼠标还没长按到点 = 不拖
    const p = this.local(e), dx = p.x - g.x0, dy = p.y - g.y0;
    if (!g.axis) {
      if (Math.hypot(dx, dy) < 6) return;
      g.axis = Number.isNaN(g.d0) ? "x" : Math.abs(dy) >= Math.abs(dx) ? "y" : "x";   // 休止没有音高：只能横着拖改时值
      if (g.axis === "y") this.host.audition?.(g.index, true);   // 拖音高：从这一下起一直响、换到新音高就换（改时长不出声）
    }
    const st = this.host.get();
    if (g.axis === "y") {
      const d = g.d0 + Math.round(-dy / (L.sp / 2));
      if (d === g.heard) return;   // 还在同一个音高：不重画、不重新起音
      g.heard = d;
      this.host.set(setNote(st, g.index, { pitch: fromDiatonic(d, keyAt(tr(st), g.index)) }), { gesture: "drag" });
      if (this.host.glide) this.host.glide(g.index); else this.host.audition?.(g.index, true);   // 新音顶掉旧音
    } else {
      const i0 = DUR_LADDER.reduce((bi, v, i) => (Math.abs(v - g.dur0) < Math.abs(DUR_LADDER[bi] - g.dur0) ? i : bi), 0);
      const i = Math.max(0, Math.min(DUR_LADDER.length - 1, i0 + Math.round(dx / (L.sp * 2.2))));
      this.host.set(setDur(st, g.index, DUR_LADDER[i]), { gesture: "drag" });
    }
  }

  private up(e: PointerEvent): void {
    // 手指轻点（没拖、没长按）= 这时才把焦点拿回谱面（down 里手指不抢）；先拿焦点再 tap：tap 打开的歌词框会自己再把焦点拿走
    if (e.pointerType === "touch" && this.press && this.press.pid === e.pointerId && !this.press.moved && !this.press.fired && !this.pinch) this.el.focus({ preventScroll: true });
    if (this.touches.delete(e.pointerId) && this.pinch && this.touches.size < 2) { this.pinchEnd(); this.finger = null; this.cancelPress(); return; }   // 捏合结束：落定缩放；剩下那根手指不接着当滚动（会跳）
    if (this.holdPid === e.pointerId) { this.holdPid = null; this.host.release?.(); }   // 按住音的预览：抬手停
    if (!this.rules.edit) {   // 听模式：没拖、没长按 = 轻点（只认看谱的那些）
      const lt = this.lockTap, f = this.finger, pr = this.press, fired = !!(pr && pr.pid === e.pointerId && pr.fired);
      if (pr && pr.pid === e.pointerId) { this.press = null; clearTimeout(pr.timer); }
      if (lt && e.pointerId === lt.pid) { this.lockTap = null; if (!lt.moved && !fired) this.tap(lt.x, lt.y, false, e.pointerId, true); return; }
      if (f && e.pointerId === f.pid) { this.finger = null; if (!f.moved && !fired) this.tap(f.x, f.y, false, null, true); return; }
      return;
    }
    if (this.lift && e.pointerId === this.lift.pid) { this.cancelPress(); this.finger = null; this.endLift(); return; }
    const pr = this.press;
    if (pr && e.pointerId === pr.pid) {
      this.press = null; clearTimeout(pr.timer);
      const extended = !!this.selDrag, menu = !!this.selDrag?.menu; this.selDrag = null;
      if (pr.grab && pr.type !== "touch") { if (!pr.moved && !pr.fired) this.tap(pr.x, pr.y, pr.shift, pr.pid); return; }   // 笔 / 鼠标轻点字 / 记号 = 歌词框 / 小菜单（手指走下面 finger 那条）
      if (menu) { this.finger = null; this.box = null; this.boxEl.hidden = true; this.host.focus?.("staff"); this.host.onSelPress?.({ x: pr.cx, y: pr.cy }); return; }
      if (pr.fired && pr.hit && this.drag && !this.drag.wait && !this.drag.axis && pr.type === "mouse" && !extended) { this.selectHeld(pr.pid, pr.hit); this.selDrag = null; this.host.release?.(); this.holdPid = null; return; }   // 鼠标长按音、没拖就松手 = 选中它
      if (pr.fired || extended) { this.finger = null; if (this.drag) { this.host.release?.(); this.drag = null; } this.box = null; this.boxEl.hidden = true; return; }   // 长按选过了：抬手到此为止
      if (pr.hit && !pr.moved) {   // 轻点在音上
        this.finger = null; this.box = null;
        if (this.drag) { this.host.release?.(); this.drag = null; }
        if (this.rules.lyrics && !pr.shift && this.openLyricOn(pr.hit)) return;   // 「词」：点音 = 写这个音的歌词
        this.tapNote(pr.hit, pr.shift);   // 轻点 = 光标到它后面，不响、不选中
        return;
      }
    }
    if (this.finger && e.pointerId === this.finger.pid) {
      const f = this.finger; this.finger = null;
      if (!f.moved && this.layout && !this.tap(f.x, f.y, f.shift, null)) { this.placeCaretAt(f.x, f.y); this.host.focus?.("staff"); }
      return;
    }
    if (this.box && e.pointerId === this.box.pid) {
      const b = this.box; this.box = null; this.boxEl.hidden = true;
      if (b.raf) { cancelAnimationFrame(b.raf); if (b.moved && b.px !== undefined) { this.box = b; this.boxSelect(b.px, b.py!); this.box = null; } }   // 最后一下补上
      if (!b.moved && this.layout) this.placeCaretAt(b.x0, b.y0);   // 没拖 = 放光标
      this.host.focus?.("staff");
      return;
    }
    if (this.drag && e.pointerId === this.drag.pid) { if (this.drag.axis !== "x") this.host.release?.(); this.drag = null; }
  }
}
