// mark-editor.ts —— 点谱上的记号（调号 / 拍号 / 速度）就地改：一个文本框 + 一排候选。created 2026-10-07 by Claude Opus 5.5
// user「谱子的调号应该也是一个按了可以下拉的文本框。不是全局的，bpm也是，都是token，可以吗」「这么说拍号也是」
//   「速度记号可以用语义+数字吗。绝对零度。」→ 速度候选 = 词 + 数（数据只存数，词按数推）。
// · 点候选 = 立刻改、收起；在框里打字 + 回车 = 改（调号认 1=D / D / Bb / B♭ / 2# / -3；拍号认 3/4；速度认数字或速度词）；
// · Esc / 点别处 = 收起（框里打了合法的值就算改）；新插的记号（pad「＋」插的）没改值就收起 = 撤掉这次插入（打断 = 取消）；
// · 中途的记号多一个「删除」；谱头三个删不掉；
// · 手指（粗指针）不自动弹系统键盘，免得盖住候选；要打字就点框。
// 跟踪的是 token id（谱改了下标会变）。

import { type EditorState, type MarkTok, type MarkVal, setMark, deleteMark, headLen, TEMPO_WORDS, tempoWord } from "../score/song.ts";
import { KEY_LABEL } from "../score/pitch.ts";
import { markText, parseMark } from "../score/marks.ts";
import type { Layout } from "../render/engrave.ts";

interface Host { get(): EditorState; set(next: EditorState): void }

const KEY_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, -1, -2, -3, -4, -5, -6, -7];
const TIMES: [number, number][] = [[2, 4], [3, 4], [4, 4], [5, 4], [3, 8], [6, 8], [9, 8], [12, 8], [7, 8], [2, 2]];
const accName = (f: number) => (f > 0 ? `${f}♯` : f < 0 ? `${-f}♭` : "无升降");

export class MarkEditor {
  private box: HTMLDivElement;
  private input: HTMLInputElement;
  private list: HTMLDivElement;
  private id = -1;
  private fresh = false;
  private initial = "";
  system = 0;

  constructor(parent: HTMLElement, private host: Host, private layout: () => Layout | null, private rerender: () => void) {
    this.box = document.createElement("div");
    this.box.className = "mark-ed"; this.box.hidden = true;
    this.box.innerHTML = `<input class="mark-in" type="text" autocomplete="off" spellcheck="false" autocapitalize="off" enterkeyhint="done" /><div class="mark-cands"></div>`;
    parent.appendChild(this.box);
    this.input = this.box.querySelector("input")!;
    this.list = this.box.querySelector(".mark-cands")!;
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); this.commitAndClose(); }
      else if (e.key === "Escape") { e.preventDefault(); this.close(); }
      e.stopPropagation();
    });
    // 候选：按下就改（pointerdown，不等 click，免得输入框先失焦）
    this.list.addEventListener("pointerdown", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-v]"); if (!b) return;
      e.preventDefault();
      if (b.dataset.v === "delete") { this.remove(); return; }
      const v = JSON.parse(b.dataset.v!) as MarkVal;
      this.apply(v); this.close();
    });
  }

  get open(): boolean { return this.id >= 0; }
  private indexNow(): number { return this.host.get().song.tokens.findIndex((t) => t.id === this.id); }

  /** 打开下标 i 的记号。fresh = 刚插进去的（没改就收起 = 撤掉）。 */
  openAt(i: number, fresh = false): void {
    const st = this.host.get(), t = st.song.tokens[i];
    if (!t || (t.kind !== "key" && t.kind !== "time" && t.kind !== "tempo")) return;
    this.id = t.id; this.fresh = fresh;
    this.initial = this.input.value = markText(t);
    this.input.inputMode = t.kind === "tempo" ? "numeric" : "text";
    this.input.placeholder = t.kind === "key" ? "1=D / Bb / 2#" : t.kind === "time" ? "3/4" : "90";
    this.fill(t, i >= headLen(st.song.tokens));
    this.box.hidden = false;
    this.reposition();
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

  /** 重画之后把框挪回那个记号下面（记号没了 = 收起）。 */
  reposition(): void {
    if (!this.open) return;
    const L = this.layout(), i = this.indexNow(), h = L?.marks.find((m) => m.index === i);
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

  /** 收起：框里打了合法的新值就先改。 */
  commitAndClose(): void {
    if (!this.open) return;
    const t = this.host.get().song.tokens[this.indexNow()];
    if (t && this.input.value.trim() !== this.initial) {
      const v = parseMark(t.kind as MarkTok["kind"], this.input.value);
      if (v) this.apply(v);
    }
    this.close();
  }
  /** 收起不改；新插的记号没改过 = 撤掉。 */
  close(): void {
    if (!this.open) return;
    if (this.fresh) { this.remove(); return; }
    this.id = -1; this.box.hidden = true; this.rerender();
  }
}
