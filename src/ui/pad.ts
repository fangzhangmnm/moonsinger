// pad.ts —— 手指面板 = 一台独立的 MEDO 式输入设备（假设没有谱）：4 个旋钮 + 6 个写字键 + 占满整宽的音键网格（自上而下）。
// created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 改；2026-10-07 晚 改成独立设备（下面）
// 来历（grill 账本 Q10 / Q11 / UX-1 / UX-2 与「pad 简化讨论」）：user「Donner MEDO 是golden ui example…我只是当ocarina来按」；
//   「把pad想成一个独立的medo式的输入设备，假设没有谱」「数字键盘左右左右空间要占满」「退格必须最右边。然后小节线和零和dash也蛮有必要的」
//   「我还需要左右键导航」「弹应该放在顶栏」「写完再改坚决不行…就是设置好duration基线然后用dash」「退格长按可以多删」。
// · 设备只往外发事件（音 / 休止 / — / 小节线 / 退格 / ← →），自己带旋钮：调（1=）、长短基线（含连音）、音域窗口。
//   pad 的「1=」是它自己的，不跟谱上的调号（user「如果一个谱有好几个调怎么算」）；写进谱时按 pad 的调拼写，谱上该加临时记号就加。
// · 旋钮 = 最上面一排（试过放 pad 最下面，user「别扭，还是放在上面吧」）：1= / 长短 / 音域三个分宽度，「⋯」是右边一个小方块；
//   写字键里的 ← → 也是同样大小的方块（user「应该是方形的不应该那么宽。步进也做成固定宽度的，方便肌肉记忆，也许也是同样大小的小方形？」
//   「步进我说的是左右」「...和左右应该宽度和高度差不多，其他的也许adaptive一些」），0 | — ⌫ 分剩下的宽，⌫ 最右。
//   音域写「F3–G5」；旋钮太窄就两行，下面是低的那头（user「G5F3应该是F3-G5吧」「也许上下两个吧，下面是lower bound」）。
//   按住上下滑 = 就在旋钮那一格里滚，像汽车里程表——旋钮变成一扇窗、滚轮藏在后面（user「in place滚的时候应该是原来的钮变成一个窗，
//   滚轮藏在下面，就像汽车里程表一样」）；内容跟着手指走，大的在上——音域就是一张纸：往上推 = 看下面更低的
//   （user「如果键盘是一个可以滑动的纸，那么你往上滑应该是往下看」）；一次最多一格、滑几下就是几格（user「in place的时候一次最多一格，
//   这样方便快速swipe几次就是几格」）；松手立刻停（user「手指松了立刻停，不要顿一下，这是快速输入」）。
//   只是点一下 = 从那一格展开一根同样宽的竖直滚轮（src/ui/drum.ts，原生滚动），点格子或滚到哪就是哪
//   （user「那些上下可以滑或者点开选对吧」「我想的是点了之后变成一个overlay的同样宽度的竖直滚动桶」；长短那根旁边并一根窄的连音滚轮「2好主意」，
//   连音画成真的一组小蝌蚪、跟着长短变：user「三联我是说画具体的小蝌蚪」「三联五联的小蝌蚪应该跟着base时值adaptive的变」）。没有「本调」。
//   移调（有选中时）和「⋯」是一次性的动作、不是选一个值：点了整排换成候选。
// · 音键：按下即写（手感不变）；按着往上 / 往下滑过门槛 = 这一个音升 / 降半音（临时离调，只管这一个音），
//   松手前键上先显示结果、滑回中间 = 还原（user「touchscreen滑动天天做的…上下…滑动会非常适合临时离调」「滑过一定距离才算 + 松手前先显示结果 同意」）。
// · 音键排法：列 × 行（默认 4 × 4），中央 C 那一行在中线下面一行；首调 / 绝对两档（默认绝对，大字永远是简谱数字）；
//   键高 / 键缝照 WXHW 量的 iOS 键盘（平板 55.5 / 9，手机 46 / 6，左右 5）。
// · 「1」不特别标（user「键盘上面的1不用专门强调，这样容易和灰色混淆」）；音域提示改成正面的：月读音域里的键底部一道细条，
//   音域外的键就是普通的键，不变灰（user「灰色也换一个representation，不然容易以为是unavailable，而不是not hinted」）。
// · 「弹」不在 pad 上（顶栏）；弹的时候音键外面不画框（user「弹时候的那圈奇怪的框不要」）。
// · 有选中（改）的时候「1=」旋钮变成「移调」：点了 = 半音 / 全音 / 八度 / 转调…

import { type Pitch, HOME, diatonicIndex, tonicStepIndex, pitchName, alterBy, midiOf, KEY_LABEL } from "../score/pitch.ts";
import { type Scale, SCALES, scaleById, ladderAt, ladderFirstAtOrAbove, ladderHome, degLabel } from "../score/scales.ts";
import type { Command } from "../score/commands.ts";
import { hint } from "../input/keys.ts";
import { type EditorState, inputKey, keyAt, timeAt, tempoAt } from "../score/song.ts";
import { openDrum, type DrumHandle } from "./drum.ts";

const HER_LOW = 57, HER_HIGH = 76;   // A3 / E5（MIDI；月读音域：键底部画细条提示，音域外不拦、不变灰）
/** 设备形态（同 WXHW src/input/dock.ts）：短边 ≥ 600 且宽 ≥ 700 = 平板。 */
const padForm = (): "tablet" | "phone" => (Math.min(innerWidth, innerHeight) >= 600 && innerWidth >= 700 ? "tablet" : "phone");
/** 键高 + 上下缝（px）= styles.css 的 --key-h / --kgv（照 WXHW 量的 iOS 键盘）。 */
const KEY_METRIC = { tablet: { h: 55.5, gap: 9 }, phone: { h: 46, gap: 6 } } as const;
const SWIPE = 20;       // px：音键上下滑过这么远才算升 / 降
const STEP = 28;        // px：旋钮上滑这么远 = 窗里滚一整格（一次最多一格，过半格就算）
const MOVE = 6;         // px：按下旋钮挪过这么远才算「滑」；没挪就松手 = 点（展开滚轮）
const STACK = 150;      // px：「1=」旋钮比这窄 = 调和调式名分两行写
const NARROW = 96;      // px：音域旋钮比这窄 = 一行写不下「F♯3–G♯5」，改两行
const TIGHT = 130;      // px：音域旋钮比这窄 = 一行字和 ⇅ 挤在一起，这一个不画 ⇅（另外两个旋钮上有，手势一样）
const UNITS = [5, 4, 3, 2, 1, 0];          // 长短，长的在上：全音符 … 三十二分
const TUP = [0, 3, 5, 6, 7] as const;      // 连音：不连 / 3 / 5 / 6 / 7
const SHIFTS = [4, 3, 2, 1, 0, -1, -2, -3, -4];   // 音域窗口，高的在上
/** 简谱的八度点：真的小圆点（数字上方 = 高八度、下方 = 低八度，多个横排）。 */
const octDots = (n: number) => (n > 0 ? `<span class="jp-dots">${"<i></i>".repeat(n)}</span>` : `<span class="jp-dots"></span>`);
/** Bravura 的整个音符字形（SMuFL 预组合音符，符干朝上）：三十二分 … 全音符。 */
const UNIT_GLYPH = ["\uE1DB", "\uE1D9", "\uE1D7", "\uE1D5", "\uE1D3", "\uE1D2"];   // SMuFL note32ndUp / 16thUp / 8thUp / QuarterUp / HalfUp / Whole（写成转义，免得编辑器吞掉私用区字符）
/** 插记号按钮上的音乐符号（Bravura；SMuFL timeSig0–9 = U+E080–E089、metNoteQuarterUp）。写成转义，免得编辑器吞掉私用区字符。 */
const QUARTER = "\uECA5", TS = (n: number) => String.fromCodePoint(0xe080 + n);   // QUARTER = metNoteQuarterUp（速度记号里用的小号音符）
const UNIT_NAME = ["三十二分", "十六分", "八分", "四分", "二分", "全音符"];
const KEY_NAMES = KEY_LABEL;
const KEY_CIRCLE = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];   // 五度圈，♭ 多 → C → ♯ 多
/** 连音的样子 = 真画一组 n 个小蝌蚪，跟着长短基线变：三十二分 3 道横梁、十六分 2 道、八分 1 道、四分只有符干、二分空心、全音符空心没符干；
 *  上面一道括号，中间是连音数字（Bravura tuplet0–9 = U+E880–E889）。user「三联我是说画具体的小蝌蚪」「三联五联的小蝌蚪应该跟着base时值adaptive的变」。 */
function tupletMark(n: number, unit: number): string {
  const S = 7, M = 1.5, HY = 25, TOP = 11.5, hx = (i: number) => M + 3 + i * S, sx = (i: number) => hx(i) + 2.35;
  const W = hx(n - 1) + 3 + M, hollow = unit >= 4, beams = Math.max(0, 3 - unit), cx = W / 2, by = 4.5;
  const heads = Array.from({ length: n }, (_, i) =>
    `<ellipse class="${hollow ? "ho" : "fi"}" cx="${hx(i)}" cy="${HY}" rx="${unit === 5 ? 3 : 2.6}" ry="1.85" transform="rotate(-20 ${hx(i)} ${HY})"/>`).join("");
  const stems = unit <= 4 ? Array.from({ length: n }, (_, i) => `<line x1="${sx(i)}" y1="${HY - 0.5}" x2="${sx(i)}" y2="${TOP}"/>`).join("") : "";
  const beam = Array.from({ length: beams }, (_, k) => `<rect x="${sx(0) - 0.45}" y="${TOP + k * 3}" width="${sx(n - 1) - sx(0) + 0.9}" height="1.8"/>`).join("");
  return `<svg class="tupsvg" viewBox="0 0 ${W} 28.5" width="${((W * 32) / 28.5).toFixed(1)}" height="32" aria-label="${n} 连音">` +
    `<path class="br" d="M${M} ${by + 2.5}V${by}H${cx - 3.6}M${cx + 3.6} ${by}H${W - M}V${by + 2.5}"/>` +
    `<text x="${cx}" y="${by + 3}" text-anchor="middle">${String.fromCodePoint(0xe880 + n)}</text>${stems}${beam}${heads}</svg>`;
}
/** 「1=」旋钮上的字：调 + 调式名（小字）。 */
const keyLabel = (f: number, sc: Scale) => `<span class="kk">1=${KEY_LABEL[f] ?? "?"}</span><small>${sc.name}</small>`;
const pretty = (p: Pitch) => pitchName(p).replace(/#/g, "♯").replace(/b(?=\d)|b(?=b)/g, "♭");

/** 不带点的那一组 = 她说话的家（HOME = D4）所在的那个「1 到 7」：1=C 时 C4–B4 不带点。 */
function homeTonic(fifths: number): number {
  const t = tonicStepIndex(fifths), h = diatonicIndex(HOME);
  return t + 7 * Math.floor((h - t) / 7);
}
/** 调式在滚轮里的样子：名字 + 从主音起的音级（羽调式 = 6 1 2 3 5）。 */
const scaleItem = (sc: Scale) => `<span class="sc"><b>${sc.name}</b><small>${[...sc.degs.slice(sc.home), ...sc.degs.slice(0, sc.home)].map(degLabel).join(" ")}</small></span>`;

export interface PadHost {
  state(): EditorState;
  isImpro(): boolean;                      // 「弹」（顶栏）开着 = 音键只唱不写
  accept(id: string): boolean;             // 写之前问一声：单音乐器和别的手指几乎同时按下 = false（这一下不写、不响、不亮）
  onPitch(p: Pitch, id: string): void;     // 写（或改：覆盖选中）；弹的时候不调。id = 哪根手指
  onAlter(id: string, alt: -1 | 0 | 1): void;   // 按着的这根手指滑过门槛：刚写的音（弹 = 正在响的音）升 / 降 / 还原
  onCommand(c: Command): void;
  onUnit(unit: number): void;
  onTuplet(n: 0 | 3 | 5 | 6 | 7): void;
  onInputKey(f: number): void;
  onInputScale(id: string): void;
  autoBars(): boolean;                     // 谱面按拍号自动画小节线开着没有
  onAutoBars(on: boolean): void;
  onHide(): void;                          // 收起键盘（pad）
  onInsertMark(kind: "key" | "time" | "tempo"): void;
  onSoundDown(p: Pitch, id: string): void;   // 试听 / 弹：按下响（复音：每根手指一个声音）
  onSoundUp(id: string): void;
}

type Mode = "normal" | "more" | "transpose" | "modulate" | "layout";   // 选调 / 长短 / 音域 = 旋钮（原地滚 / 点开滚轮），不在这里

export class Pad {
  private rowShift = 0;       // 音域窗口挪过几行
  private cols = 4;           // 每行几个音（MEDO = 4）
  private rowsSetting: number | "auto" = 4;   // 默认 4 行（user「默认还是四行」）；「自动」= 按设备和屏幕剩下的高度算
  private layoutMode: "movable" | "absolute" = "absolute";   // 首调 / 绝对；默认绝对（user「键盘默认绝对布局」）
  private mode: Mode = "normal";
  private gridFor = "";
  private toolsFor = "";
  /** 正按着的音（来源 id → 五线谱位置）：手指和电脑键盘共用，pad 上对应的键按住期间一直亮。 */
  private held = new Map<string, number>();
  /** 正在音键上滑的手指（pointerId → 起点 y、当前升降、哪个键）。 */
  private swipes = new Map<number, { y0: number; alt: -1 | 0 | 1; key: HTMLElement }>();
  /** 网格上每个键（调式梯子上的第 k 级）的音高。 */
  private keys = new Map<number, Pitch>();

  constructor(private el: HTMLElement, private host: PadHost) { this.render(); addEventListener("resize", () => this.render()); }

  private rows(): number {
    if (this.rowsSetting !== "auto") return this.rowsSetting;
    const m = KEY_METRIC[padForm()], avail = innerHeight >= innerWidth ? innerHeight * 0.45 - 110 : innerHeight - 160;
    return Math.max(4, Math.min(6, Math.floor((avail + m.gap) / (m.h + m.gap))));   // 封顶 6：再多就大半在她的音域外了
  }
  /** 音域窗口第 shift 档的范围文字「最低–最高」（user「G4也谜语人，应该是xx-xx」）。 */
  private spanText(shift: number, f: number, rows: number): string {
    const lo = this.baseAt(shift, f, rows), hi = lo + rows * this.cols - 1;
    return `${pretty(this.pitchAt(lo, f))}–${pretty(this.pitchAt(hi, f))}`;
  }
  /** 同上，画在旋钮 / 滚轮里：放得下就一行「F3–G5」；太窄就两行，下面那行是低的那头（user「也许上下两个吧，下面是lower bound」）。 */
  private spanHtml(shift: number, f: number, rows: number, narrow: boolean): string {
    if (!narrow) return this.spanText(shift, f, rows);
    const lo = this.baseAt(shift, f, rows), hi = lo + rows * this.cols - 1;
    return `<span class="rg"><span>${pretty(this.pitchAt(hi, f))}</span><span>${pretty(this.pitchAt(lo, f))}</span></span>`;
  }
  /** 音域旋钮窄到一行写不下（手机 / 桌面的窄 pad）。 */
  private rangeNarrow(): boolean { const b = this.el.querySelector<HTMLElement>(".k-range"); return !!b && b.clientWidth < NARROW; }
  private scale(): Scale { return scaleById(this.host.state().input.inputScale); }
  /** 调式梯子上第 k 级的音高（k = 0 是 do；pad 的「1=」+ 调式定）。 */
  private pitchAt(k: number, f: number): Pitch { return ladderAt(this.scale(), k, homeTonic(f), f).pitch; }
  /** 音域窗口第 shift 档时，左下那个键在调式梯子上是第几级：绝对 = 那一行从 C4（或它上面第一个调式音）起；
   *  首调 = 从主音起（小调 / 羽调式从 6 起）；中央那一行默认在中线下面一行。 */
  private baseAt(shift: number, f: number, rows: number): number {
    const sc = this.scale(), t = homeTonic(f);
    const anchor = this.layoutMode === "absolute" ? ladderFirstAtOrAbove(sc, 60, t, f) : ladderHome(sc, t, f);
    return anchor + this.cols * (shift - Math.floor((rows - 1) / 2));
  }

  /** 状态变了：结构没变就只改文字和样式（按住的键不会被重建打断）。
   *  三块各管各的：最上面一排旋钮或候选（模式 / 有没有选中变了才重建）、写字键一排（只建一次）、音键网格（调 / 音域 / 布局变了才重建）——
   *  旋钮上滑着的时候值一直在变、网格跟着重建，旋钮那个元素不动，手指不会丢。 */
  render(): void {
    const st = this.host.state(), f = inputKey(st), rows = this.rows(), form = padForm();
    const base = this.baseAt(this.rowShift, f, rows);
    if ((this.mode === "transpose" || this.mode === "modulate") && !st.sel) this.mode = "normal";   // 选中没了：移调候选收起
    const selKey = st.sel ? keyAt(st.song, st.sel.from) : null;
    this.el.dataset.form = form; this.el.style.setProperty("--cols", String(this.cols));
    if (!this.el.querySelector(".pad-grid")) {
      this.el.innerHTML = `<div class="pad-head"></div><div class="pad-tools writes">` +
        `<button class="btn" data-caret="-1" title="光标左移（${hint("left")}）">←</button>` +
        `<button class="btn" data-caret="1" title="光标右移（${hint("right")}）">→</button>` +
        `<button class="btn wk" data-cmd="rest" title="休止（${hint("rest")}）"><span>0</span><small>休止</small></button>` +
        `<button class="btn wk" data-cmd="bar" title="小节线（${hint("bar")}）"><span>|</span><small>小节线</small></button>` +
        `<button class="btn wk" data-cmd="extend" title="拉长一份（${hint("extend")}）"><span>—</span><small>拉长</small></button>` +
        `<button class="btn" data-cmd="backspace" title="退格（${hint("backspace")}）"><svg class="ico"><use href="#backspace"/></svg></button></div>` +
        `<div class="pad-grid"></div>`;
      const w = this.el.querySelector<HTMLElement>(".writes")!;
      this.on(w, "[data-caret]", (b) => this.host.onCommand({ k: "caret", d: Number(b.dataset.caret) }));
      this.on(w, "[data-cmd]:not([data-cmd=backspace])", (b) => this.host.onCommand({ k: b.dataset.cmd } as Command));
      // 退格：按下删一个，按住 420 ms 后每 70 ms 再删一个，松手停（user「退格长按可以多删」；节奏同 WXHW src/input/soft-keyboard.ts）
      const bs = w.querySelector<HTMLElement>('[data-cmd="backspace"]')!;
      let timer = 0;
      const stop = () => clearTimeout(timer), del = () => this.host.onCommand({ k: "backspace" });
      bs.addEventListener("pointerdown", (e) => {
        e.preventDefault(); try { bs.setPointerCapture(e.pointerId); } catch { /* 合成事件：没有捕获也能用 */ }
        stop(); del();
        const tick = () => { del(); timer = window.setTimeout(tick, 70); };
        timer = window.setTimeout(tick, 420);
      });
      for (const t of ["pointerup", "pointercancel", "lostpointercapture"]) bs.addEventListener(t, stop);
      addEventListener("blur", stop);
    }
    const gridSig = `${f}|${st.input.inputScale}|${base}|${rows}x${this.cols}|${this.layoutMode}`;
    if (gridSig !== this.gridFor) { this.buildGrid(f, base, rows); this.gridFor = gridSig; }
    const toolSig = this.mode === "normal" ? `normal|${selKey !== null}` : `${this.mode}|${selKey}|${rows}|${this.cols}|${this.rowsSetting}|${this.layoutMode}|${this.mode === "more" ? JSON.stringify(this.marksHere(st)) : ""}`;
    if (toolSig !== this.toolsFor) { this.buildHead(selKey, rows); this.toolsFor = toolSig; }
    this.refresh(st);
  }

  /** 光标处正生效的调号 / 拍号 / 速度（插记号按钮上写的就是它：插进去的默认值）。 */
  private marksHere(st: EditorState): { key: number; time: { beats: number; beatType: number }; bpm: number } {
    const at = st.sel ? st.sel.from : st.caret;
    return { key: keyAt(st.song, at), time: timeAt(st.song, at), bpm: tempoAt(st.song, at) };
  }
  private cands(selKey: number | null, rows: number): string {
    const back = `<button class="btn cand" data-back="1">返回</button>`;
    const c = (attrs: string, label: string, on = false, title = "") => `<button class="btn cand${on ? " is-on" : ""}" ${attrs}${title ? ` title="${title}"` : ""}>${label}</button>`;
    switch (this.mode) {
      // 「⋯」里可以多行：插记号直接展开（user「...里面可以多行，放很多东西。所以插记号可以展开，然后应该也是用音乐符号？也许用一个加号？」）；
      // 按钮上写光标处正生效的那个（插进去的默认值），调号写「1=G」不写 ♯♭（user「+1=G才比较好懂吧，+#b只会让人觉得是加升降号」）；
      // 「+」在符号左边、小一号浅一色（user「不过加号和后面的东西也许需要分开来」→ 试过左上角角标 →「太不显眼了，能不能放在符号左边，只是字号和颜色拉开差距」）
      case "more": {
        const m = this.marksHere(this.host.state()), plus = `<span class="plus">+</span>`;
        const digits = (n: number) => [...String(n)].map((ch) => TS(Number(ch))).join("");
        return c(`data-mark="key"`, `${plus}1=${KEY_NAMES[m.key] ?? "?"}`, false, "插调号（在光标处；先填现在的，插了再改）") +
          c(`data-mark="time"`, `${plus}<span class="mg ts"><span>${digits(m.time.beats)}</span><span>${digits(m.time.beatType)}</span></span>`, false, "插拍号（在光标处；先填现在的，插了再改）") +
          c(`data-mark="tempo"`, `${plus}<span class="mg met">${QUARTER}</span><span class="eq">=${m.bpm}</span>`, false, "插速度（在光标处；先填现在的，插了再改）") +
          c(`data-autobars="1"`, "自动小节线", this.host.autoBars(), "按拍号自动画小节线（只画、不进数据）；手插的「|」= 从那里重新数，弱起 = 写完弱起的音按一下「|」") +
          c(`data-open="layout"`, "布局…", false, "几行几列、首调 / 绝对") + back;
      }
      case "layout":
        return [c(`data-rows="auto"`, `行 自动（${rows}）`, this.rowsSetting === "auto"),
          ...[3, 4, 5, 6, 7, 8].map((n) => c(`data-rows="${n}"`, `${n} 行`, this.rowsSetting === n)),
          ...[3, 4, 5, 6, 7].map((n) => c(`data-cols="${n}"`, `${n} 列`, this.cols === n)),
          c(`data-pl="movable"`, "首调", this.layoutMode === "movable", "每行从 1 起，跟着「1=」走"),
          c(`data-pl="absolute"`, "绝对", this.layoutMode === "absolute", "每行从 C 起（不跟着「1=」挪）"), back].join("");
      case "transpose":
        return c(`data-tr="1"`, "↑ 半音") + c(`data-tr="-1"`, "↓ 半音") + c(`data-tr="2"`, "↑ 全音") + c(`data-tr="-2"`, "↓ 全音") +
          c(`data-toct="1"`, "↑ 八度") + c(`data-toct="-1"`, "↓ 八度") + c(`data-open="modulate"`, "转调…", false, "整段转到另一个调：音按两个主音之间的音程挪，调号跟着换") + back;
      case "modulate": return KEY_CIRCLE.map((k) => c(`data-mod="${k}"`, `转到 1=${KEY_NAMES[k]}`, k === selKey)).join("") + back;
      default: return "";
    }
  }

  /** 最上面一排：1= / 长短 / 音域三个分宽度，「⋯」是右边一个小方块（user「...和左右应该宽度和高度差不多，其他的也许adaptive一些」）；
   *  「⋯」/ 移调点开后整排换成候选。（试过放 pad 最下面，user「别扭，还是放在上面吧」） */
  private buildHead(selKey: number | null, rows: number): void {
    const box = this.el.querySelector<HTMLElement>(".pad-head")!;
    box.className = `pad-head pad-tools ${this.mode === "normal" ? "knobs" : `cands m-${this.mode}`}`;
    box.innerHTML = this.mode !== "normal" ? this.cands(selKey, rows) :
      (selKey !== null
        ? `<button class="btn knob k-key" data-knob="key" title="移调（选中的这段）：点开 = 半音 / 全音 / 八度 / 转调"><span class="kl">移调</span></button>`
        : `<button class="btn knob k-key" data-knob="key" title="1=（pad 自己的调）：按住上下滑 / 点开选（五度圈）"><span class="kl"></span><span class="kh">⇅</span></button>`) +
      `<button class="btn knob k-unit" data-knob="unit" title="长短基线：按住上下滑 / 点开选（含连音）"><span class="kl"></span><span class="kh">⇅</span></button>` +
      `<button class="btn knob k-range" data-knob="range" title="音域（这块 pad 从哪个音到哪个音）：按住上下滑 / 点开选——像推一张纸，往上推 = 看下面更低的"><span class="kl"></span><span class="kh">⇅</span></button>` +
      `<button class="btn hide-pad" data-hide="1" title="收起键盘（点五线谱再弹出来）">收起</button>` +
      `<button class="btn knob k-more" data-knob="more" title="更多：布局、插记号"><span class="kl">⋯</span></button>`;
    box.querySelectorAll<HTMLElement>("[data-knob]").forEach((b) => b.addEventListener("pointerdown", (e) => { e.preventDefault(); this.knobDown(b, e); }));
    // 候选
    this.on(box, "[data-open]", (b) => { this.mode = b.dataset.open as Mode; this.render(); });
    this.on(box, "[data-mark]", (b) => { this.back(); this.host.onInsertMark(b.dataset.mark as "key" | "time" | "tempo"); });
    // 布局：点了不收（好试），按「返回」回去
    this.on(box, "[data-rows]", (b) => { this.rowsSetting = b.dataset.rows === "auto" ? "auto" : Number(b.dataset.rows); this.render(); });
    this.on(box, "[data-cols]", (b) => { this.cols = Number(b.dataset.cols); this.render(); });
    this.on(box, "[data-pl]", (b) => { this.layoutMode = b.dataset.pl === "absolute" ? "absolute" : "movable"; this.render(); });
    // 移调：点了不收（可以连着点几下）；转调：选了就回去
    this.on(box, "[data-tr]", (b) => this.host.onCommand({ k: "transpose", semis: Number(b.dataset.tr) }));
    this.on(box, "[data-toct]", (b) => this.host.onCommand({ k: "octave", d: Number(b.dataset.toct) }));
    this.on(box, "[data-mod]", (b) => { this.back(); this.host.onCommand({ k: "modulate", fifths: Number(b.dataset.mod) }); });
    this.on(box, "[data-back]", () => this.back());
    this.on(box, "[data-hide]", () => this.host.onHide());   // 「⋯」左边的收起键盘（user「...左边加一个hide keyboard的方形小按钮」）
    this.on(box, "[data-autobars]", () => { this.host.onAutoBars(!this.host.autoBars()); this.toolsFor = ""; this.render(); });   // 开关：点了不收，钮上亮 / 灭
  }

  private buildGrid(f: number, base: number, rows: number): void {
    const cells: string[] = [], sc = this.scale(), ht = homeTonic(f);
    this.keys.clear();
    for (let row = rows - 1; row >= 0; row--) {
      for (let col = 0; col < this.cols; col++) {
        const k = base + row * this.cols + col, { pitch: p, deg, oct } = ladderAt(sc, k, ht, f), m = midiOf(p);
        const inRange = m >= HER_LOW && m <= HER_HIGH;
        this.keys.set(k, p);
        cells.push(`<button class="pad-key${inRange ? " hint" : ""}" data-k="${k}" title="${inRange ? "月读的音域里" : ""}">` +
          `<span class="deg">${octDots(Math.max(0, oct))}<span class="num"><span class="acc"></span>${degLabel(deg)}</span>${octDots(Math.max(0, -oct))}</span><span class="abs">${pretty(p)}</span></button>`);
      }
    }
    const grid = this.el.querySelector<HTMLElement>(".pad-grid")!;
    grid.innerHTML = cells.join("");
    this.swipes.clear();   // 键换了：旧键上的滑动作废（声音照常由 pointerup 停）
    // 音键：按下 = 写（或改）+ 响；弹 = 只响；按着上下滑过门槛 = 这个音升 / 降（键上先显示）；松开 = 停
    grid.querySelectorAll<HTMLElement>(".pad-key[data-k]").forEach((b) => {
      b.addEventListener("pointerdown", (e) => {
        e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch { /* 指针已经没了：照样响 */ }
        const p = this.keys.get(Number(b.dataset.k))!, id = `pad${e.pointerId}`;
        if (!this.host.isImpro() && !this.host.accept(id)) return;   // 单音乐器：同时多按只写第一个（模糊护栏在宿主）
        this.swipes.set(e.pointerId, { y0: e.clientY, alt: 0, key: b });
        this.showDown(p, id);
        if (!this.host.isImpro()) this.host.onPitch(p, id);
        this.host.onSoundDown(p, id);
      });
      b.addEventListener("pointermove", (e) => {
        const s = this.swipes.get(e.pointerId); if (!s) return;
        const dy = s.y0 - e.clientY, alt: -1 | 0 | 1 = dy > SWIPE ? 1 : dy < -SWIPE ? -1 : 0;
        if (alt === s.alt) return;
        s.alt = alt;
        this.host.onAlter(`pad${e.pointerId}`, alt);
        this.refresh(this.host.state());
      });
      const up = (e: PointerEvent) => { this.swipes.delete(e.pointerId); this.showUp(`pad${e.pointerId}`); this.host.onSoundUp(`pad${e.pointerId}`); };
      b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up);
    });
  }

  private refresh(st: EditorState): void {
    const q = <T extends HTMLElement>(s: string) => this.el.querySelector<T>(s);
    const i = st.input, f = inputKey(st);
    const k = q(".k-key .kl");
    if (k && !st.sel) { const sc = this.scale(); k.innerHTML = keyLabel(f, sc); k.parentElement!.classList.toggle("stack", k.parentElement!.clientWidth < STACK); k.parentElement!.title = `1=${KEY_NAMES[f]} ${sc.name}（pad 自己的调和调式）：按住上下滑换调 / 点开选调和调式`; }
    const u = q(".k-unit .kl");
    if (u) { u.innerHTML = `<span class="smufl">${UNIT_GLYPH[i.unit]}</span>${i.tuplet ? `<sup>${i.tuplet}</sup>` : ""}`; u.parentElement!.title = `长短基线：${UNIT_NAME[i.unit]}${i.tuplet ? `（${i.tuplet} 连音）` : ""}——按住上下滑 / 点开选`; }
    const r = q(".k-range .kl");
    if (r) { const nr = this.rangeNarrow(); r.parentElement!.classList.toggle("narrow", nr); r.parentElement!.classList.toggle("tight", r.parentElement!.clientWidth < TIGHT); r.innerHTML = this.spanHtml(this.rowShift, f, this.rows(), nr); r.parentElement!.title = `音域 ${this.spanText(this.rowShift, f, this.rows())}：按住上下滑 / 点开选——像推一张纸，往上推 = 看下面更低的`; }
    // 电脑键盘挂着 ♯ / ♭（Shift）：音键显示升 / 降之后的样子；手指正在滑的那个键显示它自己的
    this.el.querySelectorAll<HTMLElement>(".pad-key[data-k]").forEach((b) => {
      const sw = [...this.swipes.values()].find((s) => s.key === b), a = sw ? sw.alt : i.acc;
      const p0 = this.keys.get(Number(b.dataset.k))!, p = a ? alterBy(p0, a) : p0;
      b.querySelector(".acc")!.textContent = a > 0 ? "♯" : a < 0 ? "♭" : "";
      b.querySelector(".abs")!.textContent = pretty(p);
      b.classList.toggle("swiping", !!sw && sw.alt !== 0);
    });
    this.el.querySelector(".pad-grid")?.classList.toggle("acc-armed", !!i.acc);
    const down = new Set(this.held.values());
    this.el.querySelectorAll<HTMLElement>(".pad-key[data-k]").forEach((b) => b.classList.toggle("down", down.has(midiOf(this.keys.get(Number(b.dataset.k))!))));
  }

  private on(root: HTMLElement, sel: string, fn: (b: HTMLElement) => void): void {
    root.querySelectorAll<HTMLElement>(sel).forEach((b) => b.addEventListener("pointerdown", (e) => { e.preventDefault(); fn(b); }));
  }
  private back(): void { this.mode = "normal"; this.render(); }

  /** 值旋钮的一串值，大的在上（升号多 / 长的 / 音域高的在上）+ 现在是第几个 + 选第 i 个（立刻生效）。 */
  private knobList(knob: string, narrow = this.rangeNarrow()): { items: string[]; index: number; title: string; set(i: number): void; loop?: boolean } {
    const st = this.host.state(), f = inputKey(st);
    if (knob === "key") {
      const K = [...KEY_CIRCLE].reverse();   // 1=F♯ … 1=C … 1=G♭
      const sc = this.scale();
      return { items: K.map((k) => keyLabel(k, sc)), index: Math.max(0, K.indexOf(f)), title: "pad 的调（五度圈）", set: (i) => this.host.onInputKey(K[i]), loop: true };
    }
    if (knob === "unit") return { items: UNITS.map((u) => `<span class="smufl">${UNIT_GLYPH[u]}</span>`), index: Math.max(0, UNITS.indexOf(st.input.unit)), title: "长短基线", set: (i) => this.host.onUnit(UNITS[i]) };
    const rows = this.rows();   // 音域：高的在上（一张纸：往上推 = 看下面更低的）
    return { items: SHIFTS.map((sh) => this.spanHtml(sh, f, rows, narrow)), index: Math.max(0, SHIFTS.indexOf(Math.max(-4, Math.min(4, this.rowShift)))), title: "音域窗口",
      set: (i) => { this.rowShift = SHIFTS[i]; this.render(); } };
  }

  /** 按下一个旋钮。「⋯」/ 移调（有选中）= 整排换成候选。值旋钮：
   *  · 按住上下滑 = 就在这一格里滚，像汽车里程表——旋钮变成一扇窗，滚轮藏在后面，窗里只露一格，滚的时候上下格从窗边滑进来；
   *    内容跟着手指走（往下拉 = 上面大的进窗）；**一次最多一格**，滑过半格值就生效；松手立刻停，不吸附、不放动画
   *    （user「in place的时候一次最多一格，这样方便快速swipe几次就是几格」）
   *    （user「我希望手指松了立刻停，不要顿一下，这是快速输入。要不还是做成in place 滑动只在窗格里面预览？」
   *     「in place滚的时候应该是原来的钮变成一个窗，滚轮藏在下面，就像汽车里程表一样」）。
   *  · 只是点一下（没滑）= 松手时展开滚轮（drum.ts）点选 / 原生滚动。 */
  private knobDown(b: HTMLElement, e: PointerEvent): void {
    const knob = b.dataset.knob!;
    if (knob === "more" || (knob === "key" && this.host.state().sel)) { this.mode = knob === "more" ? "more" : "transpose"; this.render(); return; }
    try { b.setPointerCapture(e.pointerId); } catch { /* 指针已经没了 */ }
    const v = this.knobList(knob), n = v.items.length, pid = e.pointerId, y0 = e.clientY;
    // 环（五度圈）：滚轮两头各多摆一格（接着另一头），一格就能绕过去
    const rollItems = v.loop ? [v.items[n - 1], ...v.items, v.items[0]] : v.items, at0 = v.loop ? v.index + 1 : v.index;
    let moved = false, cur = v.index, roll: HTMLElement | null = null, H = 0;
    // 一次最多一格：窗里最多滚到下一格；滑过半格 = 下一格在窗里占了多半 = 就是它（到头了只让它稍微晃一下）
    const room = (dir: number) => (v.loop || (v.index + dir >= 0 && v.index + dir < n) ? STEP : STEP * 0.3);   // dir = -1：往下拉（上面大的进窗）；+1：往上推
    const paint = (dy: number) => {
      const off = Math.max(-room(1), Math.min(room(-1), dy));
      roll!.style.transform = `translateY(${(-at0 * STEP + off) * (H / STEP)}px)`;   // 窗里一格 = 方块那么高；手指走 STEP = 窗里滚一整格
      return Math.abs(off) >= STEP / 2 ? (v.index - Math.sign(off) + n) % n : v.index;
    };
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pid) return;
      const dy = ev.clientY - y0;
      if (!moved) {
        if (Math.abs(dy) < MOVE) return;
        moved = true; H = b.clientHeight;
        roll = document.createElement("div"); roll.className = "kroll";
        roll.innerHTML = rollItems.map((h) => `<div class="kroll-i" style="height:${H}px">${h}</div>`).join("");
        b.appendChild(roll); b.classList.add("rolling");
      }
      const i = paint(dy);
      if (i !== cur) { cur = i; v.set(i); }
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== pid) return;
      removeEventListener("pointermove", move); removeEventListener("pointerup", up); removeEventListener("pointercancel", up);
      roll?.remove(); b.classList.remove("rolling");   // 松手立刻停：窗关上，旋钮上已经是新值
      if (!moved && ev.type === "pointerup") this.openDrumFor(knob, b);
    };
    addEventListener("pointermove", move); addEventListener("pointerup", up); addEventListener("pointercancel", up);
  }

  /** 点一下值旋钮：在它上面展开滚轮。旋钮够宽（iPad）= 几列分旋钮的宽；太窄（iPhone）= 每列按放得下的宽来，比旋钮宽
   *  （user「如果是iphone等太窄的时候弹出来的窗可以宽一点」）。长短那根旁边并一根连音的，连音画成真的一组小蝌蚪、跟着长短变。 */
  private openDrumFor(knob: string, anchor: HTMLElement): void {
    const w = anchor.getBoundingClientRect().width;
    if (knob === "unit") {
      const st = this.host.state();
      // 宽的旋钮：两列分它的宽度（user「能不能共用原来的宽度」），连音那列占一半多一点；窄的：长短 56 + 连音 84
      const [wu, wt] = w >= 142 ? [w - Math.round(w * 0.55) - 2, Math.round(w * 0.55)] : [56, 84];   // 2 = 两列之间的缝
      const tups = (u: number) => TUP.map((n) => (n ? tupletMark(n, u) : `<span class="plain">不连</span>`));
      const h: DrumHandle = openDrum(anchor, [
        { items: UNITS.map((u) => `<span class="smufl">${UNIT_GLYPH[u]}</span>${wu >= 100 ? `<small>${UNIT_NAME[u]}</small>` : ""}`), index: Math.max(0, UNITS.indexOf(st.input.unit)), width: wu, title: "长短基线" },
        { items: tups(st.input.unit), index: Math.max(0, TUP.indexOf(st.input.tuplet)), width: wt, title: "连音" },
      ], { onChange: (c, i) => { if (c === 0) { this.host.onUnit(UNITS[i]); h.setItems(1, tups(UNITS[i])); } else this.host.onTuplet(TUP[i]); } });
      return;
    }
    if (knob === "key") {   // 两列：调（五度圈）+ 调式（user「1=F能不能也做成两个的滚轮，右边可以换调性」）
      const st = this.host.state(), K = [...KEY_CIRCLE].reverse();
      const [wk, ws] = w >= 210 ? [Math.round(w * 0.36), w - Math.round(w * 0.36) - 2] : [72, 136];
      openDrum(anchor, [
        { items: K.map((k) => `1=${KEY_NAMES[k]}`), index: Math.max(0, K.indexOf(inputKey(st))), width: wk, title: "pad 的调（五度圈）", loop: true },
        { items: SCALES.map(scaleItem), index: Math.max(0, SCALES.findIndex((x) => x.id === st.input.inputScale)), width: ws, title: "调式：pad 上排哪些音" },
      ], { onChange: (c, i) => { if (c === 0) this.host.onInputKey(K[i]); else this.host.onInputScale(SCALES[i].id); } });
      return;
    }
    const v = this.knobList(knob, false), wr = Math.max(w, 120);   // 音域：滚轮至少 120 宽，一行写得下「F♯3–G♯5」
    openDrum(anchor, [{ items: v.items, index: v.index, width: wr, title: v.title }], { onChange: (_c, i) => v.set(i) });
  }
  /** 某个来源（手指 / 电脑键盘的键）按下了音高 p：pad 上同音高的键亮着，直到 showUp（调式里没有这个音 = 不亮）。 */
  showDown(p: Pitch, id: string): void { this.held.set(id, midiOf(p)); this.refresh(this.host.state()); }
  showUp(id: string): void { if (this.held.delete(id)) this.refresh(this.host.state()); }
  clearHeld(): void { if (this.held.size || this.swipes.size) { this.held.clear(); this.swipes.clear(); this.refresh(this.host.state()); } }
}
