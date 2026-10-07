// pad.ts —— 手指面板：4×4 pad（照 Donner MEDO 音符模式 = 音阶 4 个一行往上折，左下是 1，跟着「1=」走）+ 上面一条工具键。
// created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 改
// grill 账本 Q10 / Q11 / UX-1 / UX-2：user「Donner MEDO 是golden ui example…我只是当ocarina来按」「pad 跟着调走 当然可以config」
//   「我反而不喜欢滑音和gyro，反而会误触」→ 只收离散的拍，按下即写；第 16 格（右上）= 0 休止；工具键一行在上面，像拼音候选条；
//   左下永远是不带点的那个 1（「just use the muscle memory of that」），▲▼ 整体挪一个八度。
//   UX-2：从很多里挑一个 = 工具条整条变候选（「1=」12 个调；连音 3 5 6 7），全 app 不用长按（user「可以，用同一个交互范式」）；
//   ♯ / ♭ 像手机 Shift（点一下只管下一个音，连点两下锁住）；「弹」= 即兴：按住临时只唱不写，快速点一下锁住
//   （user「只有「改」和「写」两个模式，即兴做成 pad 上的一个开关（按住时只唱不写）」）。
//   「＋」= 在光标处插记号（调号 / 拍号 / 速度，候选条里挑），插完就地打开它的编辑框（user「…都是token」）。
//   2026-10-07 改版（user「然后键盘可以五row或者更多，0移回上面，16号还是音，然后我说了上下键是移动row而不是八度，就是平移row的窗口，
//   可以调row数量，或者根据设备自己判断。然后键间距和ipad和iphone键盘对齐，可以看一下wxhw怎么做的」「col也可以调，我可以实验一下哈哈」）：
//   网格 = 列 × 行，全是音（0 回到工具条）；▲▼ 整个窗口挪一行；「布局」候选里调行数（自动 / 3–8）和列数（3–7）；
//   键高 / 键缝照 WXHW 量的 iOS 键盘（平板 = iPad mini：键高 55.5、上下缝 9；手机 = iPhone：46、6；左右缝 5；形态判断同 WXHW dock.ts）。
//   布局只在这次打开里有效（持久化还没定）。
//   改（有选中）的时候「1=」那个位子换成「移调」：候选 = ↑↓ 半音 / 全音 / 八度 + 「转调…」（再一层：转到 1=X）
//   （user「然后很快我需要框选和整体移调转调」；写的时候它管输入的调，改的时候它管选中这段的调）。

import { type Pitch, HOME, diatonicIndex, fromDiatonic, tonicStepIndex, pitchName, alterBy, KEY_LABEL } from "../score/pitch.ts";
import type { Command } from "../score/commands.ts";
import { hint } from "../input/keys.ts";
import { type EditorState, inputKey, keyAt } from "../score/song.ts";

const HER_LOW = 26, HER_HIGH = 37;   // A3 / E5 的五线谱位置（她音域外的键变淡，只提示不拦）
/** 设备形态（同 WXHW src/input/dock.ts）：短边 ≥ 600 且宽 ≥ 700 = 平板。 */
const padForm = (): "tablet" | "phone" => (Math.min(innerWidth, innerHeight) >= 600 && innerWidth >= 700 ? "tablet" : "phone");
/** 键高 + 上下缝（px）= styles.css 的 --key-h / --kgv（照 WXHW 量的 iOS 键盘）。 */
const KEY_METRIC = { tablet: { h: 55.5, gap: 9 }, phone: { h: 46, gap: 6 } } as const;
const DOT_UP = "̇", DOT_DOWN = "̣";   // 简谱的上加点 / 下加点
/** Bravura 的整个音符字形（SMuFL 预组合音符，符干朝上）：三十二分 … 全音符。 */
const UNIT_GLYPH = ["", "", "", "", "", ""];
const UNIT_NAME = ["三十二分", "十六分", "八分", "四分", "二分", "全音符"];
const KEY_NAMES = KEY_LABEL;
const KEY_ORDER = [0, 1, 2, 3, 4, 5, 6, -1, -2, -3, -4, -5, -6];

/** 不带点的那一组 = 她说话的家（HOME = D4）所在的那个「1 到 7」：1=C 时 C4–B4 不带点。 */
function homeTonic(fifths: number): number {
  const t = tonicStepIndex(fifths), h = diatonicIndex(HOME);
  return t + 7 * Math.floor((h - t) / 7);
}
/** 左下永远是不带点的那个 1——照 MEDO 的肌肉记忆，不替她的音域挑位置（user「no. just use the muscle memory of that」）。 */
export function defaultPadBase(fifths: number): number { return homeTonic(fifths); }

export interface PadHost {
  state(): EditorState;
  onPitch(p: Pitch): void;                 // 写（或改：覆盖选中）；即兴时不调
  onCommand(c: Command): void;
  onTuplet(n: 0 | 3 | 5 | 6 | 7): void;
  onInputKey(f: number | null): void;
  onImpro(on: boolean): void;
  onInsertMark(kind: "key" | "time" | "tempo"): void;
  onSoundDown(p: Pitch, id: string): void;   // 试听 / 即兴：按下响（id = 哪根手指，复音）
  onSoundUp(id: string): void;               //              松开停（只停这根手指的）
}

type Mode = "normal" | "key" | "tuplet" | "mark" | "transpose" | "modulate" | "layout";

export class Pad {
  private rowShift = 0;       // ▲▼ 挪过几行
  private cols = 4;           // 每行几个音（MEDO = 4）
  private rowsSetting: number | "auto" = "auto";
  private mode: Mode = "normal";
  private builtFor = "";
  private improLatched = false;
  /** 正按着的音（来源 id → 五线谱位置）：手指和电脑键盘共用，pad 上对应的键按住期间一直亮（user「小键盘的按下弹起也要和触控对齐啦」）。 */
  private held = new Map<string, number>();
  private improHeld = false;

  constructor(private el: HTMLElement, private host: PadHost) { this.render(); addEventListener("resize", () => this.render()); }

  /** 行数：手动设的，或按设备和屏幕剩下的高度算（竖屏 pad 占屏底四成多，横屏占侧栏整高）。 */
  private rows(): number {
    if (this.rowsSetting !== "auto") return this.rowsSetting;
    const m = KEY_METRIC[padForm()], avail = innerHeight >= innerWidth ? innerHeight * 0.45 - 110 : innerHeight - 160;
    return Math.max(4, Math.min(6, Math.floor((avail + m.gap) / (m.h + m.gap))));   // 封顶 6：再多就大半在她的音域外了
  }

  get impro(): boolean { return this.improLatched || this.improHeld; }

  /** 状态变了：结构没变就只改文字和样式（按住的键不会被重建打断）。 */
  render(): void {
    const st = this.host.state(), f = inputKey(st), base = defaultPadBase(f) + this.cols * this.rowShift, rows = this.rows(), form = padForm();
    if ((this.mode === "transpose" || this.mode === "modulate") && !st.sel) this.mode = "normal";   // 选中没了：移调候选收起
    const selKey = st.sel ? keyAt(st.song, st.sel.from) : null;
    const sig = `${this.mode}|${f}|${base}|${selKey}|${rows}x${this.cols}|${form}`;
    if (sig !== this.builtFor) { this.el.dataset.form = form; this.el.style.setProperty("--cols", String(this.cols)); this.build(f, base, selKey, rows); this.builtFor = sig; }
    this.refresh(st);
  }

  private build(f: number, base: number, selKey: number | null, rows: number): void {
    const tools = this.mode === "layout"
      ? [`<button class="btn cand${this.rowsSetting === "auto" ? " is-on" : ""}" data-rows="auto">行 自动（${rows}）</button>`,
         ...[3, 4, 5, 6, 7, 8].map((n) => `<button class="btn cand${this.rowsSetting === n ? " is-on" : ""}" data-rows="${n}">${n} 行</button>`),
         ...[3, 4, 5, 6, 7].map((n) => `<button class="btn cand${this.cols === n ? " is-on" : ""}" data-cols="${n}">${n} 列</button>`),
         `<button class="btn cand" data-back="1">返回</button>`].join("")
      : this.mode === "transpose"
      ? `<button class="btn cand" data-tr="1">↑ 半音</button><button class="btn cand" data-tr="-1">↓ 半音</button>` +
        `<button class="btn cand" data-tr="2">↑ 全音</button><button class="btn cand" data-tr="-2">↓ 全音</button>` +
        `<button class="btn cand" data-toct="1">↑ 八度</button><button class="btn cand" data-toct="-1">↓ 八度</button>` +
        `<button class="btn cand" data-open="modulate" title="整段转到另一个调：音按两个主音之间的音程挪，调号跟着换">转调…</button><button class="btn cand" data-back="1">返回</button>`
      : this.mode === "modulate"
      ? KEY_ORDER.map((k) => `<button class="btn cand${k === selKey ? " is-on" : ""}" data-mod="${k}">转到 1=${KEY_NAMES[k]}</button>`).join("") +
        `<button class="btn cand" data-back="1">返回</button>`
      : this.mode === "key"
      ? KEY_ORDER.map((k) => `<button class="btn cand" data-key="${k}">1=${KEY_NAMES[k]}</button>`).join("") +
        `<button class="btn cand" data-key="follow">跟调号</button><button class="btn cand" data-back="1">返回</button>`
      : this.mode === "mark"
      ? `<button class="btn cand" data-mark="key">调号</button><button class="btn cand" data-mark="time">拍号</button><button class="btn cand" data-mark="tempo">速度</button>` +
        `<button class="btn cand" data-back="1">返回</button>`
      : this.mode === "tuplet"
      ? [3, 5, 6, 7].map((n) => `<button class="btn cand" data-tup="${n}">${n} 连</button>`).join("") +
        `<button class="btn cand" data-tup="0">关</button><button class="btn cand" data-back="1">返回</button>`
      : (selKey !== null ? `<button class="btn t-tr" data-open="transpose" title="移调 / 转调（选中的这段）">移调</button>` : `<button class="btn t-key" data-open="key" title="1=（只管输入）"></button>`) +
        `<button class="btn t-sharp" data-acc="1" title="♯（点一下管下一个音，连点两下锁住；${hint("sharp")}）">♯</button>` +
        `<button class="btn t-flat" data-acc="-1" title="♭（点一下管下一个音，连点两下锁住；${hint("flat")}）">♭</button>` +
        `<button class="btn" data-cmd="shorter" title="短（${hint("shorter")}）">短</button>` +
        `<span class="t-unit" title="下一个音的时值"></span>` +
        `<button class="btn" data-cmd="longer" title="长（${hint("longer")}）">长</button>` +
        `<button class="btn t-tup" data-open="tuplet" title="连音（开着再点 = 选 3 5 6 7）">连</button>` +
        `<button class="btn" data-cmd="extend" title="拉长一份（${hint("extend")}）">－</button>` +
        `<button class="btn" data-cmd="rest" title="休止（${hint("rest")}）">0</button>` +
        `<button class="btn" data-cmd="bar" title="小节线（${hint("bar")}）">|</button>` +
        `<button class="btn" data-open="mark" title="在光标处插记号：调号 / 拍号 / 速度">＋</button>` +
        `<button class="btn" data-cmd="backspace" title="退格（${hint("backspace")}）"><svg class="ico"><use href="#backspace"/></svg></button>` +
        `<button class="btn t-impro" data-impro="1" title="弹：按住只唱不写，快速点一下锁住（${hint("impro")}）">弹</button>` +
        `<button class="btn" data-open="layout" title="pad 布局：几行几列">布局</button>` +
        `<button class="btn" data-row="-1" title="整个 pad 往下挪一行"><svg class="ico"><use href="#caret-down"/></svg></button>` +
        `<button class="btn" data-row="1" title="整个 pad 往上挪一行"><svg class="ico"><use href="#caret-up"/></svg></button>`;
    const cells: string[] = [], ht = homeTonic(f);
    for (let row = rows - 1; row >= 0; row--) {
      for (let col = 0; col < this.cols; col++) {
        const d = base + row * this.cols + col, p = fromDiatonic(d, f);
        const deg = ((((d - ht) % 7) + 7) % 7) + 1, oct = Math.floor((d - ht) / 7);
        const dots = oct > 0 ? DOT_UP.repeat(oct) : DOT_DOWN.repeat(-oct);
        const inRange = d >= HER_LOW && d <= HER_HIGH;
        cells.push(`<button class="pad-key${inRange ? "" : " out"}${deg === 1 ? " tonic" : ""}" data-d="${d}">` +
          `<span class="deg"><span class="acc"></span>${deg}${dots}</span><span class="abs">${pitchName(p).replace("#", "♯").replace(/b(?=\d)/, "♭")}</span></button>`);
      }
    }
    this.el.innerHTML = `<div class="pad-tools${this.mode === "normal" ? "" : " cands"}">${tools}</div><div class="pad-grid">${cells.join("")}</div>`;
    this.wire();
  }

  private refresh(st: EditorState): void {
    const q = <T extends HTMLElement>(s: string) => this.el.querySelector<T>(s);
    const i = st.input, k = q(".t-key");
    if (k) { k.textContent = `1=${KEY_NAMES[inputKey(st)] ?? "?"}`; k.classList.toggle("manual", i.inputFifths !== null); }
    q(".t-sharp")?.classList.toggle("once", i.acc === 1 && i.accMode === "once");
    q(".t-sharp")?.classList.toggle("lock", i.acc === 1 && i.accMode === "lock");
    q(".t-flat")?.classList.toggle("once", i.acc === -1 && i.accMode === "once");
    q(".t-flat")?.classList.toggle("lock", i.acc === -1 && i.accMode === "lock");
    const u = q(".t-unit");
    if (u) { u.innerHTML = `<span class="smufl">${UNIT_GLYPH[i.unit]}</span>${i.tuplet ? `<sup>${i.tuplet}</sup>` : ""}`; u.title = `下一个音：${UNIT_NAME[i.unit]}${i.tuplet ? `（${i.tuplet} 连音）` : ""}`; }
    const t = q(".t-tup"); if (t) { t.textContent = i.tuplet ? String(i.tuplet) : "连"; t.classList.toggle("is-on", !!i.tuplet); }
    q(".t-impro")?.classList.toggle("is-on", this.impro);
    // 挂着 ♯ / ♭：音键显示升 / 降之后的样子（数字前加 ♯ ♭、音名跟着换）——按下去会是什么一眼看得见
    const f = inputKey(st);
    this.el.querySelector(".pad-grid")?.classList.toggle("acc-armed", !!i.acc);
    this.el.querySelectorAll<HTMLElement>(".pad-key[data-d]").forEach((b) => {
      const d = Number(b.dataset.d), p0 = fromDiatonic(d, f), p = i.acc ? alterBy(p0, i.acc) : p0;
      b.querySelector(".acc")!.textContent = i.acc > 0 ? "♯" : i.acc < 0 ? "♭" : "";
      b.querySelector(".abs")!.textContent = pitchName(p).replace(/#/g, "♯").replace(/b(?=\d)|b(?=b)/g, "♭");
    });
    const down = new Set(this.held.values());
    this.el.querySelectorAll<HTMLElement>(".pad-key[data-d]").forEach((b) => b.classList.toggle("down", down.has(Number(b.dataset.d))));
    this.el.querySelectorAll<HTMLElement>(".pad-key[data-d]").forEach((b) => b.classList.toggle("impro", this.impro));
  }

  private wire(): void {
    const on = (sel: string, fn: (b: HTMLElement, e: PointerEvent) => void) =>
      this.el.querySelectorAll<HTMLElement>(sel).forEach((b) => b.addEventListener("pointerdown", (e) => { e.preventDefault(); fn(b, e); }));
    const flash = (b: HTMLElement) => { b.classList.add("hit"); setTimeout(() => b.classList.remove("hit"), 120); };
    // 音键：按下 = 写（或改）+ 响；即兴 = 只响；松开 = 停
    this.el.querySelectorAll<HTMLElement>(".pad-key[data-d]").forEach((b) => {
      b.addEventListener("pointerdown", (e) => {
        e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch { /* 指针已经没了：照样响，松手靠 pointerup / cancel */ }
        const st = this.host.state(), d = Number(b.dataset.d), p = fromDiatonic(d, inputKey(st));
        this.showDown(d, `pad${e.pointerId}`);
        if (!this.impro) this.host.onPitch(p);
        this.host.onSoundDown(p, `pad${e.pointerId}`);
      });
      const up = (e: PointerEvent) => { this.showUp(`pad${e.pointerId}`); this.host.onSoundUp(`pad${e.pointerId}`); };
      b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up);
    });
    on("[data-cmd]", (b) => { if (b.classList.contains("pad-key")) flash(b); this.host.onCommand({ k: b.dataset.cmd } as Command); });
    on("[data-acc]", (b) => this.host.onCommand({ k: "acc", acc: Number(b.dataset.acc) as 1 | -1 }));
    on("[data-row]", (b) => { this.rowShift = Math.max(-8, Math.min(8, this.rowShift + Number(b.dataset.row))); this.render(); });
    // 布局：点了不收（好试），按「返回」回去
    on("[data-rows]", (b) => { this.rowsSetting = b.dataset.rows === "auto" ? "auto" : Number(b.dataset.rows); this.render(); });
    on("[data-cols]", (b) => { this.cols = Number(b.dataset.cols); this.render(); });
    on("[data-open]", (b) => {
      if (b.dataset.open === "key" || b.dataset.open === "mark" || b.dataset.open === "transpose" || b.dataset.open === "modulate" || b.dataset.open === "layout") { this.mode = b.dataset.open; this.render(); return; }
      const st = this.host.state();   // 连音：没开 → 开三连；开着 → 弹候选
      if (!st.input.tuplet) this.host.onTuplet(3); else { this.mode = "tuplet"; this.render(); }
    });
    on("[data-key]", (b) => { this.host.onInputKey(b.dataset.key === "follow" ? null : Number(b.dataset.key)); this.mode = "normal"; this.render(); });
    on("[data-tup]", (b) => { this.host.onTuplet(Number(b.dataset.tup) as 0 | 3 | 5 | 6 | 7); this.mode = "normal"; this.render(); });
    on("[data-back]", () => { this.mode = "normal"; this.render(); });
    // 移调：点了不收（可以连着点几下）；转调：选了就回到普通工具条
    on("[data-tr]", (b) => this.host.onCommand({ k: "transpose", semis: Number(b.dataset.tr) }));
    on("[data-toct]", (b) => this.host.onCommand({ k: "octave", d: Number(b.dataset.toct) }));
    on("[data-mod]", (b) => { this.mode = "normal"; this.host.onCommand({ k: "modulate", fifths: Number(b.dataset.mod) }); this.render(); });
    on("[data-mark]", (b) => { this.mode = "normal"; this.render(); this.host.onInsertMark(b.dataset.mark as "key" | "time" | "tempo"); });
    // 弹：按住临时、快速点一下锁住 / 解开
    const imp = this.el.querySelector<HTMLElement>("[data-impro]");
    if (imp) {
      let t0 = 0, was = false;
      imp.addEventListener("pointerdown", (e) => { e.preventDefault(); try { imp.setPointerCapture(e.pointerId); } catch { /* 指针已经没了 */ } t0 = performance.now(); was = this.improLatched; this.improHeld = true; this.changed(); });
      const release = () => { if (!this.improHeld) return; this.improHeld = false; if (performance.now() - t0 < 250) this.improLatched = !was; this.changed(); };
      imp.addEventListener("pointerup", release); imp.addEventListener("pointercancel", release);
    }
  }
  private changed(): void { this.host.onImpro(this.impro); this.refresh(this.host.state()); }
  /** 某个来源（手指 / 电脑键盘的键）按下了五线谱位置 d 的音：pad 上那个键亮着，直到 showUp。 */
  showDown(d: number, id: string): void { this.held.set(id, d); this.refresh(this.host.state()); }
  showUp(id: string): void { if (this.held.delete(id)) this.refresh(this.host.state()); }
  clearHeld(): void { if (this.held.size) { this.held.clear(); this.refresh(this.host.state()); } }
  /** 键盘的 ` 键：锁住 / 解开即兴。 */
  toggleImpro(): void { this.improLatched = !this.improLatched; this.changed(); }
}
