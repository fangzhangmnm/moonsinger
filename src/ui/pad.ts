// pad.ts —— 手指面板 = 一台独立的 MEDO 式输入设备（假设没有谱）：4 个旋钮 + 6 个写字键 + 占满整宽的音键网格。
// created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 改；2026-10-07 晚 改成独立设备（下面）
// 来历（grill 账本 Q10 / Q11 / UX-1 / UX-2 与「pad 简化讨论」）：user「Donner MEDO 是golden ui example…我只是当ocarina来按」；
//   「把pad想成一个独立的medo式的输入设备，假设没有谱」「数字键盘左右左右空间要占满」「退格必须最右边。然后小节线和零和dash也蛮有必要的」
//   「我还需要左右键导航」「弹应该放在顶栏」「写完再改坚决不行…就是设置好duration基线然后用dash」。
// · 设备只往外发事件（音 / 休止 / — / 小节线 / 退格 / ← →），自己带旋钮：调（1=）、长短基线（含连音）、音域窗口。
//   pad 的「1=」是它自己的，不跟谱上的调号（user「如果一个谱有好几个调怎么算」）；写进谱时按 pad 的调拼写，谱上该加临时记号就加。
// · 旋钮：上下滑一格走一格（滑过一格的距离才算）；点开 = 从那一格往下展开一根同样宽的竖直滚轮（src/ui/drum.ts），拨到哪就是哪
//   （user「那些上下可以滑或者点开选对吧」「我想的是点了之后变成一个overlay的同样宽度的竖直滚动桶」；长短那根旁边并一根窄的连音滚轮「2好主意」）。没有「本调」。
//   移调（有选中时）和「⋯」是一次性的动作、不是选一个值：照旧整条换成候选。
// · 音键：按下即写（手感不变）；按着往上 / 往下滑过门槛 = 这一个音升 / 降半音（临时离调，只管这一个音），
//   松手前键上先显示结果、滑回中间 = 还原（user「touchscreen滑动天天做的…上下…滑动会非常适合临时离调」「滑过一定距离才算 + 松手前先显示结果 同意」）。
// · 音键排法：列 × 行（默认 4 × 4），中央 C 那一行在中线下面一行；首调 / 绝对两档（默认绝对，大字永远是简谱数字）；
//   键高 / 键缝照 WXHW 量的 iOS 键盘（平板 55.5 / 9，手机 46 / 6，左右 5）。
// · 「1」不特别标（user「键盘上面的1不用专门强调，这样容易和灰色混淆」）；音域提示改成正面的：月读音域里的键底部一道细条，
//   音域外的键就是普通的键，不变灰（user「灰色也换一个representation，不然容易以为是unavailable，而不是not hinted」）。
// · 「弹」不在 pad 上（顶栏）；弹的时候音键外面不画框（user「弹时候的那圈奇怪的框不要」）。
// · 有选中（改）的时候「1=」旋钮变成「移调」：上下滑 = 选中这段升 / 降半音，点开 = 半音 / 全音 / 八度 / 转调…

import { type Pitch, HOME, diatonicIndex, fromDiatonic, tonicStepIndex, pitchName, alterBy, KEY_LABEL } from "../score/pitch.ts";
import type { Command } from "../score/commands.ts";
import { hint } from "../input/keys.ts";
import { type EditorState, inputKey, keyAt } from "../score/song.ts";
import { openDrum } from "./drum.ts";

const HER_LOW = 26, HER_HIGH = 37;   // A3 / E5 的五线谱位置（月读音域：键底部画细条提示，音域外不拦、不变灰）
/** 设备形态（同 WXHW src/input/dock.ts）：短边 ≥ 600 且宽 ≥ 700 = 平板。 */
const padForm = (): "tablet" | "phone" => (Math.min(innerWidth, innerHeight) >= 600 && innerWidth >= 700 ? "tablet" : "phone");
/** 键高 + 上下缝（px）= styles.css 的 --key-h / --kgv（照 WXHW 量的 iOS 键盘）。 */
const KEY_METRIC = { tablet: { h: 55.5, gap: 9 }, phone: { h: 46, gap: 6 } } as const;
const SWIPE = 20;       // px：音键上下滑过这么远才算升 / 降
const KNOB_STEP = 26;   // px：旋钮上下滑一格的距离
/** 简谱的八度点：真的小圆点（数字上方 = 高八度、下方 = 低八度，多个横排）。 */
const octDots = (n: number) => (n > 0 ? `<span class="jp-dots">${"<i></i>".repeat(n)}</span>` : `<span class="jp-dots"></span>`);
/** Bravura 的整个音符字形（SMuFL 预组合音符，符干朝上）：三十二分 … 全音符。 */
const UNIT_GLYPH = ["\uE1DB", "\uE1D9", "\uE1D7", "\uE1D5", "\uE1D3", "\uE1D2"];   // SMuFL note32ndUp / 16thUp / 8thUp / QuarterUp / HalfUp / Whole（写成转义，免得编辑器吞掉私用区字符）
const UNIT_NAME = ["三十二分", "十六分", "八分", "四分", "二分", "全音符"];
const KEY_NAMES = KEY_LABEL;
const KEY_CIRCLE = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];   // 五度圈，♭ 多 → C → ♯ 多
const pretty = (p: Pitch) => pitchName(p).replace(/#/g, "♯").replace(/b(?=\d)|b(?=b)/g, "♭");

/** 不带点的那一组 = 她说话的家（HOME = D4）所在的那个「1 到 7」：1=C 时 C4–B4 不带点。 */
function homeTonic(fifths: number): number {
  const t = tonicStepIndex(fifths), h = diatonicIndex(HOME);
  return t + 7 * Math.floor((h - t) / 7);
}
export function defaultPadBase(fifths: number): number { return homeTonic(fifths); }

export interface PadHost {
  state(): EditorState;
  isImpro(): boolean;                      // 「弹」（顶栏）开着 = 音键只唱不写
  onPitch(p: Pitch, id: string): void;     // 写（或改：覆盖选中）；弹的时候不调。id = 哪根手指
  onAlter(id: string, alt: -1 | 0 | 1): void;   // 按着的这根手指滑过门槛：刚写的音（弹 = 正在响的音）升 / 降 / 还原
  onCommand(c: Command): void;
  onUnit(unit: number): void;
  onTuplet(n: 0 | 3 | 5 | 6 | 7): void;
  onInputKey(f: number): void;
  onInsertMark(kind: "key" | "time" | "tempo"): void;
  onSoundDown(p: Pitch, id: string): void;   // 试听 / 弹：按下响（复音：每根手指一个声音）
  onSoundUp(id: string): void;
}

type Mode = "normal" | "more" | "mark" | "transpose" | "modulate" | "layout";   // 选调 / 长短 / 音域 = 滚轮（drum.ts），不在这里

export class Pad {
  private rowShift = 0;       // 音域窗口挪过几行
  private cols = 4;           // 每行几个音（MEDO = 4）
  private rowsSetting: number | "auto" = 4;   // 默认 4 行（user「默认还是四行」）；「自动」= 按设备和屏幕剩下的高度算
  private layoutMode: "movable" | "absolute" = "absolute";   // 首调 / 绝对；默认绝对（user「键盘默认绝对布局」）
  private mode: Mode = "normal";
  private builtFor = "";
  /** 正按着的音（来源 id → 五线谱位置）：手指和电脑键盘共用，pad 上对应的键按住期间一直亮。 */
  private held = new Map<string, number>();
  /** 正在音键上滑的手指（pointerId → 起点 y、当前升降、哪个键）。 */
  private swipes = new Map<number, { y0: number; alt: -1 | 0 | 1; d: number; key: HTMLElement }>();

  constructor(private el: HTMLElement, private host: PadHost) { this.render(); addEventListener("resize", () => this.render()); }

  private rows(): number {
    if (this.rowsSetting !== "auto") return this.rowsSetting;
    const m = KEY_METRIC[padForm()], avail = innerHeight >= innerWidth ? innerHeight * 0.45 - 110 : innerHeight - 160;
    return Math.max(4, Math.min(6, Math.floor((avail + m.gap) / (m.h + m.gap))));   // 封顶 6：再多就大半在她的音域外了
  }
  /** 音域窗口第 shift 档时，左下那个键的五线谱位置（中央 C 那一行默认在中线下面一行）。 */
  private baseAt(shift: number, f: number, rows: number): number {
    const home = this.layoutMode === "absolute" ? diatonicIndex({ step: "C", alter: 0, octave: 4 }) : defaultPadBase(f);
    return home + this.cols * (shift - Math.floor((rows - 1) / 2));
  }

  /** 状态变了：结构没变就只改文字和样式（按住的键不会被重建打断）。 */
  render(): void {
    const st = this.host.state(), f = inputKey(st), rows = this.rows(), form = padForm();
    const base = this.baseAt(this.rowShift, f, rows);
    if ((this.mode === "transpose" || this.mode === "modulate") && !st.sel) this.mode = "normal";   // 选中没了：移调候选收起
    const selKey = st.sel ? keyAt(st.song, st.sel.from) : null;
    const sig = `${this.mode}|${f}|${base}|${selKey}|${rows}x${this.cols}|${form}|${this.layoutMode}`;
    if (sig !== this.builtFor) { this.el.dataset.form = form; this.el.style.setProperty("--cols", String(this.cols)); this.build(f, base, selKey, rows, st); this.builtFor = sig; }
    this.refresh(st);
  }

  private cands(f: number, selKey: number | null, rows: number, st: EditorState): string {
    const back = `<button class="btn cand" data-back="1">返回</button>`;
    const c = (attrs: string, label: string, on = false, title = "") => `<button class="btn cand${on ? " is-on" : ""}" ${attrs}${title ? ` title="${title}"` : ""}>${label}</button>`;
    switch (this.mode) {
      case "more": return c(`data-open="layout"`, "布局…", false, "几行几列、首调 / 绝对") + c(`data-open="mark"`, "插记号…", false, "在光标处插调号 / 拍号 / 速度") + back;
      case "layout":
        return [c(`data-rows="auto"`, `行 自动（${rows}）`, this.rowsSetting === "auto"),
          ...[3, 4, 5, 6, 7, 8].map((n) => c(`data-rows="${n}"`, `${n} 行`, this.rowsSetting === n)),
          ...[3, 4, 5, 6, 7].map((n) => c(`data-cols="${n}"`, `${n} 列`, this.cols === n)),
          c(`data-pl="movable"`, "首调", this.layoutMode === "movable", "每行从 1 起，跟着「1=」走"),
          c(`data-pl="absolute"`, "绝对", this.layoutMode === "absolute", "每行从 C 起（不跟着「1=」挪）"), back].join("");
      case "mark": return c(`data-mark="key"`, "调号") + c(`data-mark="time"`, "拍号") + c(`data-mark="tempo"`, "速度") + back;
      case "transpose":
        return c(`data-tr="1"`, "↑ 半音") + c(`data-tr="-1"`, "↓ 半音") + c(`data-tr="2"`, "↑ 全音") + c(`data-tr="-2"`, "↓ 全音") +
          c(`data-toct="1"`, "↑ 八度") + c(`data-toct="-1"`, "↓ 八度") + c(`data-open="modulate"`, "转调…", false, "整段转到另一个调：音按两个主音之间的音程挪，调号跟着换") + back;
      case "modulate": return KEY_CIRCLE.map((k) => c(`data-mod="${k}"`, `转到 1=${KEY_NAMES[k]}`, k === selKey)).join("") + back;
      default: return "";
    }
  }

  private build(f: number, base: number, selKey: number | null, rows: number, st: EditorState): void {
    const tools = this.mode !== "normal"
      ? `<div class="pad-tools cands">${this.cands(f, selKey, rows, st)}</div>`
      : `<div class="pad-tools knobs">` +
        (selKey !== null
          ? `<button class="btn knob k-key" data-knob="key" title="移调：上下滑 = 选中这段升 / 降半音；点开 = 半音 / 全音 / 八度 / 转调"><span class="kl">移调</span><span class="kh">⇅</span></button>`
          : `<button class="btn knob k-key" data-knob="key" title="1=（pad 自己的调）：上下滑 = 五度圈走一格；点开选"><span class="kl"></span><span class="kh">⇅</span></button>`) +
        `<button class="btn knob k-unit" data-knob="unit" title="长短基线：上下滑 = 长 / 短一档；点开选（含连音）"><span class="kl"></span><span class="kh">⇅</span></button>` +
        `<button class="btn knob k-range" data-knob="range" title="音域：上下滑 = 窗口挪一行；点开选"><span class="kl"></span><span class="kh">⇅</span></button>` +
        `<button class="btn knob" data-knob="more" title="更多：布局、插记号"><span class="kl">⋯</span></button></div>` +
        `<div class="pad-tools writes">` +
        `<button class="btn" data-caret="-1" title="光标左移（${hint("left")}）">←</button>` +
        `<button class="btn" data-caret="1" title="光标右移（${hint("right")}）">→</button>` +
        `<button class="btn" data-cmd="rest" title="休止（${hint("rest")}）">0</button>` +
        `<button class="btn" data-cmd="bar" title="小节线（${hint("bar")}）">|</button>` +
        `<button class="btn" data-cmd="extend" title="拉长一份（${hint("extend")}）">—</button>` +
        `<button class="btn" data-cmd="backspace" title="退格（${hint("backspace")}）"><svg class="ico"><use href="#backspace"/></svg></button></div>`;
    const cells: string[] = [], ht = homeTonic(f);
    for (let row = rows - 1; row >= 0; row--) {
      for (let col = 0; col < this.cols; col++) {
        const d = base + row * this.cols + col, p = fromDiatonic(d, f);
        const deg = ((((d - ht) % 7) + 7) % 7) + 1, oct = Math.floor((d - ht) / 7);
        const inRange = d >= HER_LOW && d <= HER_HIGH;
        cells.push(`<button class="pad-key${inRange ? " hint" : ""}" data-d="${d}" title="${inRange ? "月读的音域里" : ""}">` +
          `<span class="deg">${octDots(Math.max(0, oct))}<span class="num"><span class="acc"></span>${deg}</span>${octDots(Math.max(0, -oct))}</span><span class="abs">${pretty(p)}</span></button>`);
      }
    }
    this.el.innerHTML = `${tools}<div class="pad-grid">${cells.join("")}</div>`;
    this.wire();
  }

  private refresh(st: EditorState): void {
    const q = <T extends HTMLElement>(s: string) => this.el.querySelector<T>(s);
    const i = st.input, f = inputKey(st);
    const k = q(".k-key .kl"); if (k && !st.sel) k.textContent = `1=${KEY_NAMES[f] ?? "?"}`;
    const u = q(".k-unit .kl");
    if (u) { u.innerHTML = `<span class="smufl">${UNIT_GLYPH[i.unit]}</span>${i.tuplet ? `<sup>${i.tuplet}</sup>` : ""}`; u.parentElement!.title = `长短基线：${UNIT_NAME[i.unit]}${i.tuplet ? `（${i.tuplet} 连音）` : ""}——上下滑 = 长 / 短一档；点开选`; }
    const r = q(".k-range .kl");
    if (r) { const low = pretty(fromDiatonic(this.baseAt(this.rowShift, f, this.rows()), f)); r.innerHTML = `音域<small>${low}</small>`; }
    // 电脑键盘挂着 ♯ / ♭（Shift）：音键显示升 / 降之后的样子；手指正在滑的那个键显示它自己的
    this.el.querySelectorAll<HTMLElement>(".pad-key[data-d]").forEach((b) => {
      const sw = [...this.swipes.values()].find((s) => s.key === b), a = sw ? sw.alt : i.acc;
      const d = Number(b.dataset.d), p0 = fromDiatonic(d, f), p = a ? alterBy(p0, a) : p0;
      b.querySelector(".acc")!.textContent = a > 0 ? "♯" : a < 0 ? "♭" : "";
      b.querySelector(".abs")!.textContent = pretty(p);
      b.classList.toggle("swiping", !!sw && sw.alt !== 0);
    });
    this.el.querySelector(".pad-grid")?.classList.toggle("acc-armed", !!i.acc);
    const down = new Set(this.held.values());
    this.el.querySelectorAll<HTMLElement>(".pad-key[data-d]").forEach((b) => b.classList.toggle("down", down.has(Number(b.dataset.d))));
  }

  private wire(): void {
    const on = (sel: string, fn: (b: HTMLElement, e: PointerEvent) => void) =>
      this.el.querySelectorAll<HTMLElement>(sel).forEach((b) => b.addEventListener("pointerdown", (e) => { e.preventDefault(); fn(b, e); }));
    // 音键：按下 = 写（或改）+ 响；弹 = 只响；按着上下滑过门槛 = 这个音升 / 降（键上先显示）；松开 = 停
    this.el.querySelectorAll<HTMLElement>(".pad-key[data-d]").forEach((b) => {
      b.addEventListener("pointerdown", (e) => {
        e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch { /* 指针已经没了：照样响 */ }
        const st = this.host.state(), d = Number(b.dataset.d), p = fromDiatonic(d, inputKey(st)), id = `pad${e.pointerId}`;
        this.swipes.set(e.pointerId, { y0: e.clientY, alt: 0, d, key: b });
        this.showDown(d, id);
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
    // 旋钮：上下滑一格走一格；没滑 = 点开选
    this.el.querySelectorAll<HTMLElement>("[data-knob]").forEach((b) => {
      let y0 = 0, steps = 0, moved = false, pid = -1;
      b.addEventListener("pointerdown", (e) => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch { /* 没了 */ } pid = e.pointerId; y0 = e.clientY; steps = 0; moved = false; });
      b.addEventListener("pointermove", (e) => {
        if (e.pointerId !== pid) return;
        const dy = y0 - e.clientY;
        if (Math.abs(dy) > 8) moved = true;
        const k = Math.trunc(dy / KNOB_STEP);
        if (k !== steps) { this.step(b.dataset.knob!, k - steps); steps = k; }
      });
      const end = (e: PointerEvent, tap: boolean) => { if (e.pointerId !== pid) return; pid = -1; if (tap && !moved) this.tap(b.dataset.knob!); };
      b.addEventListener("pointerup", (e) => end(e, true)); b.addEventListener("pointercancel", (e) => end(e, false));
    });
    on("[data-caret]", (b) => this.host.onCommand({ k: "caret", d: Number(b.dataset.caret) }));
    on("[data-cmd]", (b) => this.host.onCommand({ k: b.dataset.cmd } as Command));
    // 候选
    on("[data-open]", (b) => { this.mode = b.dataset.open as Mode; this.render(); });
    on("[data-mark]", (b) => { this.back(); this.host.onInsertMark(b.dataset.mark as "key" | "time" | "tempo"); });
    // 布局：点了不收（好试），按「返回」回去
    on("[data-rows]", (b) => { this.rowsSetting = b.dataset.rows === "auto" ? "auto" : Number(b.dataset.rows); this.render(); });
    on("[data-cols]", (b) => { this.cols = Number(b.dataset.cols); this.render(); });
    on("[data-pl]", (b) => { this.layoutMode = b.dataset.pl === "absolute" ? "absolute" : "movable"; this.render(); });
    // 移调：点了不收（可以连着点几下）；转调：选了就回去
    on("[data-tr]", (b) => this.host.onCommand({ k: "transpose", semis: Number(b.dataset.tr) }));
    on("[data-toct]", (b) => this.host.onCommand({ k: "octave", d: Number(b.dataset.toct) }));
    on("[data-mod]", (b) => { this.back(); this.host.onCommand({ k: "modulate", fifths: Number(b.dataset.mod) }); });
    on("[data-back]", () => this.back());
  }
  private back(): void { this.mode = "normal"; this.render(); }
  /** 旋钮走 n 格（上 = 正）。 */
  private step(knob: string, n: number): void {
    const st = this.host.state();
    if (knob === "key") { if (st.sel) this.host.onCommand({ k: "transpose", semis: n }); else this.host.onInputKey(inputKey(st) + n); }
    else if (knob === "unit") for (let i = 0; i < Math.abs(n); i++) this.host.onCommand({ k: n > 0 ? "longer" : "shorter" });
    else if (knob === "range") { this.rowShift = Math.max(-8, Math.min(8, this.rowShift + n)); this.render(); }
  }
  private tap(knob: string): void {
    const st = this.host.state(), anchor = this.el.querySelector<HTMLElement>(`[data-knob="${knob}"]`);
    if (!anchor || knob === "more" || (knob === "key" && st.sel)) { this.mode = knob === "more" ? "more" : "transpose"; this.render(); return; }
    const w = anchor.getBoundingClientRect().width, f = inputKey(st);
    if (knob === "key") {
      openDrum(anchor, [{ items: KEY_CIRCLE.map((k) => `1=${KEY_NAMES[k]}`), index: KEY_CIRCLE.indexOf(f), width: w, title: "pad 的调（五度圈）" }],
        { onChange: (_c, i) => this.host.onInputKey(KEY_CIRCLE[i]) });
    } else if (knob === "unit") {
      const TUP = [0, 3, 5, 6, 7] as const;
      openDrum(anchor, [
        { items: UNIT_GLYPH.map((g, i) => `<span class="smufl">${g}</span><small>${UNIT_NAME[i]}</small>`), index: st.input.unit, width: w, title: "长短基线" },
        { items: TUP.map((n) => (n ? `${n} 连` : "不连")), index: Math.max(0, TUP.indexOf(st.input.tuplet as 0 | 3 | 5 | 6 | 7)), width: 64, title: "连音" },
      ], { onChange: (c, i) => { if (c === 0) this.host.onUnit(i); else this.host.onTuplet(TUP[i]); } });
    } else if (knob === "range") {
      const rows = this.rows(), S = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
      openDrum(anchor, [{ items: S.map((s) => `${s === 0 ? "中央 C" : s > 0 ? `高 ${s} 行` : `低 ${-s} 行`}<small>${pretty(fromDiatonic(this.baseAt(s, f, rows), f))} 起</small>`),
        index: Math.max(0, S.indexOf(Math.max(-4, Math.min(4, this.rowShift)))), width: w, title: "音域窗口" }],
        { onChange: (_c, i) => { this.rowShift = S[i]; this.render(); } });
    }
  }
  /** 某个来源（手指 / 电脑键盘的键）按下了五线谱位置 d 的音：pad 上那个键亮着，直到 showUp。 */
  showDown(d: number, id: string): void { this.held.set(id, d); this.refresh(this.host.state()); }
  showUp(id: string): void { if (this.held.delete(id)) this.refresh(this.host.state()); }
  clearHeld(): void { if (this.held.size || this.swipes.size) { this.held.clear(); this.swipes.clear(); this.refresh(this.host.state()); } }
}
