// mark-editor.ts —— 点谱上的记号（调号 / 拍号 / 速度）就地改：一个文本框 + 一排候选。created 2026-10-07 by Claude Opus 5.5
// user「谱子的调号应该也是一个按了可以下拉的文本框。不是全局的，bpm也是，都是token，可以吗」「这么说拍号也是」
//   「速度记号可以用语义+数字吗。绝对零度。」→ 速度候选 = 词 + 数（数据只存数，词按数推）。
// · 点候选 = 立刻改、收起；在框里打字 + 回车 = 改（调号认 1=D / D / Bb / B♭ / 2# / -3；拍号认 3/4；速度认数字或速度词）；
// · Esc / 点别处 = 收起（框里打了合法的值就算改）；新插的记号（pad「＋」插的）没改值就收起 = 撤掉这次插入（打断 = 取消）；
// · 中途的记号多一个「删除」；谱头三个删不掉；
// · 手指（粗指针）不自动弹系统键盘，免得盖住候选；要打字就点框。
// · 速度（2026-10-07 user「选速度的时候能不能有一个文本框旁边的节拍器动画让你参考，然后有一个确认按钮才commit，这样你可以试哪个对」）：
//   点候选 / 打字只改「试听值」，框旁边的节拍器按它摆；按「确定」（或回车）才写进谱；点别处 / Esc = 不改（新插的 = 撤掉）。
//   2026-10-07 加滚轮（user「速度输入框能不能也做成这种能dial的…」；分开每一位的拨法 AI 没做 = 一根滚轮）：
//   候选左边一根 ♩ = TEMPO_MIN～TEMPO_MAX（20～400，和打字同一个范围：user「typing到400的话wheel也到400或者都300…反正对齐一点」）的滚轮
//   （和 pad 弹出的滚轮同一份 mountWheel：慢拖一格 ±1、一甩靠惯性滑一大段），拨到头就停；拨到哪试到哪，同样按「确定」才写；滚轮 / 候选 / 打字三边互相跟。
// 跟踪的是 token id（谱改了下标会变）。

import { type EditorState, type MarkTok, type MarkVal, setMark, deleteMark, headLen, TEMPO_WORDS, tempoWord, TEMPO_MIN, TEMPO_MAX, tr } from "../score/song.ts";
import { KEY_LABEL } from "../score/pitch.ts";
import { markText, parseMark } from "../score/marks.ts";
import type { Layout } from "../render/engrave.ts";
import { mountWheel, type WheelHandle } from "./drum.ts";
import { metroStart, metroStep, type MetroState } from "./metronome.ts";

interface Host { get(): EditorState; set(next: EditorState): void }

const KEY_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, -1, -2, -3, -4, -5, -6, -7];
const TIMES: [number, number][] = [[2, 4], [3, 4], [4, 4], [5, 4], [3, 8], [6, 8], [9, 8], [12, 8], [7, 8], [2, 2]];
const accName = (f: number) => (f > 0 ? `${f}♯` : f < 0 ? `${-f}♭` : "无升降");
const WHEEL_MIN = TEMPO_MIN, WHEEL_MAX = TEMPO_MAX, WHEEL_ROW = 40, WHEEL_VISIBLE = 5;
const WHEEL_ITEMS = Array.from({ length: WHEEL_MAX - WHEEL_MIN + 1 }, (_, i) => String(WHEEL_MIN + i));
const wheelIndex = (bpm: number) => Math.max(WHEEL_MIN, Math.min(WHEEL_MAX, Math.round(bpm))) - WHEEL_MIN;
/** 速度试听值是从哪边改的：那一边自己已经是这个值，别的边跟上。 */
type TempoSrc = "open" | "chip" | "type" | "wheel";

export class MarkEditor {
  private box: HTMLDivElement;
  private input: HTMLInputElement;
  private list: HTMLDivElement;
  private id = -1;
  private fresh = false;
  private initial = "";
  private kind: MarkTok["kind"] | null = null;
  private pending: number | null = null;   // 速度：正在试的 bpm（还没写进谱）
  private metro: HTMLDivElement;
  private ok: HTMLButtonElement;
  private wheelBox: HTMLDivElement;
  private wheel: WheelHandle | null = null;
  /** 节拍器摆杆：一个自激的摆，频率追着试听的速度走（W-12；src/ui/metronome.ts）。raf = 0 = 没在摆。 */
  private metroRaf = 0; private metroS: MetroState | null = null; private metroBpm = 90; private metroLast = 0;
  system = 0;

  constructor(parent: HTMLElement, private host: Host, private layout: () => Layout | null, private rerender: () => void) {
    this.box = document.createElement("div");
    this.box.className = "mark-ed"; this.box.hidden = true;
    this.box.innerHTML = `<div class="mark-row"><input class="mark-in" type="text" autocomplete="off" spellcheck="false" autocapitalize="off" enterkeyhint="done" />` +
      `<div class="metro" hidden title="按这个速度摆：摆到一头 = 一拍"><div class="metro-arm"></div></div><button class="btn primary mark-ok" hidden>确定</button></div>` +
      `<div class="mark-body"><div class="tempo-wheel" hidden title="拨速度：一格 = 1，一甩滑一大段"></div><div class="mark-cands"></div></div>`;
    parent.appendChild(this.box);
    this.input = this.box.querySelector("input")!;
    this.list = this.box.querySelector(".mark-cands")!;
    this.metro = this.box.querySelector(".metro")!;
    this.ok = this.box.querySelector(".mark-ok")!;
    this.wheelBox = this.box.querySelector(".tempo-wheel")!;
    this.ok.addEventListener("pointerdown", (e) => { e.preventDefault(); this.confirmTempo(); });
    this.input.addEventListener("input", () => {   // 速度：打字就试（合法才换节拍器），不写进谱
      if (this.kind !== "tempo") return;
      const v = parseMark("tempo", this.input.value);
      if (v && v.kind === "tempo") this.setPending(v.bpm, "type");
    });
    // 候选：按下就改（pointerdown，不等 click，免得输入框先失焦）
    this.list.addEventListener("pointerdown", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-v]"); if (!b) return;
      e.preventDefault();
      if (b.dataset.v === "delete") { this.remove(); return; }
      const v = JSON.parse(b.dataset.v!) as MarkVal;
      if (v.kind === "tempo") { this.setPending(v.bpm, "chip"); return; }   // 速度：只试，按「确定」才写
      this.apply(v); this.close();
    });
  }

  get open(): boolean { return this.id >= 0; }
  /** 键盘路由来的动作（src/input/keys.ts 的「记号框」那几行）。 */
  act(a: "commit" | "cancel"): void { if (a !== "commit") this.close(); else if (this.kind === "tempo") this.confirmTempo(); else this.commitAndClose(); }
  private indexNow(): number { return tr(this.host.get()).findIndex((t) => t.id === this.id); }

  /** 打开下标 i 的记号。fresh = 刚插进去的（没改就收起 = 撤掉）。 */
  openAt(i: number, fresh = false): void {
    const st = this.host.get(), t = tr(st)[i];
    if (!t || (t.kind !== "key" && t.kind !== "time" && t.kind !== "tempo")) return;
    this.id = t.id; this.fresh = fresh;
    this.initial = this.input.value = markText(t);
    this.input.inputMode = t.kind === "tempo" ? "numeric" : "text";
    this.input.placeholder = t.kind === "key" ? "1=D / Bb / 2#" : t.kind === "time" ? "3/4" : "90";
    this.kind = t.kind;
    this.fill(t, i >= headLen(tr(st)));
    this.metro.hidden = this.ok.hidden = this.wheelBox.hidden = t.kind !== "tempo";
    this.pending = null; this.wheel = null;
    this.box.hidden = false;
    this.reposition();
    if (t.kind === "tempo") {   // 滚轮要等框露出来才能滚到位
      const col = document.createElement("div"); col.className = "drum-col";
      this.wheelBox.replaceChildren(col);
      this.wheel = mountWheel(col, { items: WHEEL_ITEMS, index: wheelIndex(t.bpm), row: WHEEL_ROW, visible: WHEEL_VISIBLE, onChange: (i) => this.setPending(WHEEL_MIN + i, "wheel") });
      this.setPending(t.bpm, "open");
    }
    // 框比谱的可见区域低（小手机：pad 占了下半屏）：把谱往上滚到框的底露出来（框顶不滚出去）
    const sc = this.box.closest<HTMLElement>(".score");
    if (sc) {
      const b = this.box.getBoundingClientRect(), v = sc.getBoundingClientRect();
      const over = Math.min(b.bottom + 8 - v.bottom, b.top - v.top - 4);
      if (over > 0) sc.scrollTop += over;
    }
    if (!matchMedia("(pointer: coarse)").matches) { this.input.focus({ preventScroll: true }); this.input.select(); }
  }

  private fill(t: MarkTok, deletable: boolean): void {
    const chip = (v: MarkVal, label: string, on: boolean, title = "") => `<button class="btn cand${on ? " is-on" : ""}" data-v='${JSON.stringify(v)}' title="${title}">${label}</button>`;
    let h = "";
    if (t.kind === "key") h = KEY_ORDER.map((f) => chip({ kind: "key", fifths: f }, `1=${KEY_LABEL[f]}`, f === t.fifths, accName(f))).join("");
    else if (t.kind === "time") h = TIMES.map(([b, bt]) => chip({ kind: "time", beats: b, beatType: bt }, `${b}/${bt}`, b === t.beats && bt === t.beatType)).join("");
    else {
      const cur = tempoWord(t.bpm).it;
      h = TEMPO_WORDS.map((w) => chip({ kind: "tempo", bpm: w.typical }, `<b>${w.it}</b><small>${w.zh} ${w.typical}</small>`, w.it === cur, `${w.from} 起`)).join("");
    }
    if (deletable) h += `<button class="btn cand danger" data-v="delete">删除</button>`;
    this.list.innerHTML = h;
    this.list.className = `mark-cands ${t.kind}`;
  }

  /** 速度：换试听值——节拍器按它摆（重新起摆，和数字对得上），候选高亮它那一档；框里的数字、滚轮跟上（改的那一边不动）。 */
  private setPending(bpm: number, src: TempoSrc): void {
    this.pending = bpm;
    if (src === "chip" || src === "wheel") this.input.value = String(bpm);
    if (src !== "wheel") this.wheel?.scrollTo(wheelIndex(bpm));
    // 节拍器：不再重新起摆——摆着的时候换速度 = 摆锤挪了，摆杆连续地追上新速度（2026-10-07 user「小节拍器的动画应该有物理动画…受迫物理模型让小节拍器跟上你的乱调」）
    this.metroBpm = bpm;
    if (!this.metroRaf) this.metroGo();
    const word = tempoWord(bpm).it;
    this.list.querySelectorAll<HTMLElement>("[data-v]").forEach((b) => {
      const v = b.dataset.v === "delete" ? null : (JSON.parse(b.dataset.v!) as MarkVal);
      b.classList.toggle("is-on", v?.kind === "tempo" && tempoWord(v.bpm).it === word);
    });
  }
  /** 速度：「确定」= 把试听值写进谱、收起。 */
  private confirmTempo(): void {
    if (this.pending !== null) {
      const t = tr(this.host.get())[this.indexNow()];
      if (t?.kind === "tempo" && t.bpm !== this.pending) this.apply({ kind: "tempo", bpm: this.pending });
      else if (t?.kind === "tempo") this.fresh = false;   // 新插的、试过以后确定用原值：也留下
    }
    this.close();
  }

  /** 重画之后把框挪回那个记号下面（记号没了 = 收起）。 */
  reposition(): void {
    if (!this.open) return;
    const L = this.layout(), i = this.indexNow(), at = this.host.get().at, h = L?.marks.find((m) => m.index === i && L.systems[m.system]?.paper === at.paper && L.systems[m.system]?.part === at.part);
    if (!L || !h) { this.id = -1; this.box.hidden = true; return; }
    this.system = h.system;
    const parentW = (this.box.parentElement?.clientWidth ?? 400), w = Math.min(340, parentW - 16);
    Object.assign(this.box.style, { left: `${Math.max(8, Math.min(h.x, parentW - w - 8))}px`, top: `${h.y + h.h + 4}px`, width: `${w}px` });
  }

  private apply(v: MarkVal): void {
    const i = this.indexNow(); if (i < 0) return;
    this.fresh = false;   // 改过了：不再是「没改就撤掉」
    this.host.set(setMark(this.host.get(), i, v));
  }
  private remove(): void {
    const i = this.indexNow();
    this.id = -1; this.box.hidden = true;
    if (i >= 0) this.host.set(deleteMark(this.host.get(), i)); else this.rerender();
  }

  /** 收起：框里打了合法的新值就先改（速度例外：没按「确定」= 不改）。 */
  commitAndClose(): void {
    if (!this.open) return;
    if (this.kind === "tempo") { this.close(); return; }
    const t = tr(this.host.get())[this.indexNow()];
    if (t && this.input.value.trim() !== this.initial) {
      const v = parseMark(t.kind as MarkTok["kind"], this.input.value);
      if (v) this.apply(v);
    }
    this.close();
  }
  private metroGo(): void {
    this.metroS ??= metroStart(this.metroBpm); this.metroLast = performance.now();
    const arm = this.metro.firstElementChild as HTMLElement;
    const tick = (now: number) => {
      if (!this.open || this.metro.hidden) { this.metroStop(); return; }
      const dt = Math.min(0.05, Math.max(0, (now - this.metroLast) / 1000)); this.metroLast = now;   // 切后台回来不一口气补几秒
      this.metroS = metroStep(this.metroS!, this.metroBpm, dt);
      arm.style.transform = `rotate(${this.metroS.th.toFixed(2)}deg)`;
      this.metroRaf = requestAnimationFrame(tick);
    };
    this.metroRaf = requestAnimationFrame(tick);
  }
  private metroStop(): void { if (this.metroRaf) cancelAnimationFrame(this.metroRaf); this.metroRaf = 0; this.metroS = null; }
  /** 收起不改；新插的记号没改过 = 撤掉。 */
  close(): void {
    if (!this.open) return;
    this.metroStop(); this.wheel = null;
    if (this.fresh) { this.remove(); return; }
    this.id = -1; this.box.hidden = true; this.rerender();
  }
}
