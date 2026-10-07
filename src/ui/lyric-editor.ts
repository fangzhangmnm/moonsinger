// lyric-editor.ts —— 在五线谱下面就地写歌词。created 2026-10-07 by Claude Opus 5.5
// user「歌词输入不应该放在键盘上，而是放在五线谱下面点进去一个一个写或者删」；记谱规矩照 MusicXML / MuseScore（user「输入 同意，拖为什么不用~？」）：
//   · 点某个音下面 → 那里出一个输入框（iPad 弹系统键盘，输入法照常用）；
//   · 中文 / 日文：输入法选定一段字（compositionend）就按字往后贴，框跟到下一个空位——一字（一拍）一个音；
//   · 英文：空格 = 这个词完了、跳下一个音；「-」= 音节完了、词没完（谱面画连字符）、跳下一个音；
//   · 「~」（或 _ ー）= 拖腔：这个音延续上一个字；
//   · 空框里退格 = 回到上一个音，把它的字拿出来接着删；回车 / 点别处 = 收起；Esc = 收起不贴；Tab / Shift+Tab = 前后挪。
//   键位在 src/input/keys.ts（一张表）；这里只收路由来的动作（act）。
// 输入法还在拼（isComposing）的时候什么都不做——拼音、假名输入法都不被打断。

import { type EditorState, type NoteTok } from "../score/song.ts";
import { splitSyllables, distributeFrom, nextLyricSlot, prevLyricSlot, lyricSlot, MELISMA_MARK, type Syl } from "../score/lyrics.ts";
import type { Layout } from "../render/engrave.ts";

interface Host { get(): EditorState; set(next: EditorState): void }
const CJK = /[\p{Script=Han}぀-ヿ]/u;

export class LyricEditor {
  private input: HTMLInputElement;
  private index = -1;
  system = 0;

  constructor(private parent: HTMLElement, private host: Host, private layout: () => Layout | null, private rerender: () => void) {
    const i = document.createElement("input");
    i.className = "lyric-input"; i.type = "text"; i.autocomplete = "off"; i.spellcheck = false; i.hidden = true;
    i.setAttribute("autocapitalize", "off"); i.setAttribute("enterkeyhint", "done");
    parent.appendChild(i);
    this.input = i;
    i.addEventListener("compositionend", () => this.absorb());
    i.addEventListener("input", (e) => { if (!(e as InputEvent).isComposing) this.absorb(); });
    i.addEventListener("blur", () => { if (this.open) setTimeout(() => { if (document.activeElement !== this.input) this.commitAndClose(); }, 0); });
  }

  get open(): boolean { return this.index >= 0; }

  /** 在下标 i 的音下面打开（框里放着它现在的字，全选，方便直接改写）。 */
  openAt(i: number): void {
    const st = this.host.get(), t = st.song.tokens[i];
    if (!t || !lyricSlot(t)) return;
    this.index = i;
    this.input.value = t.lyric === MELISMA_MARK ? "~" : (t.lyric ?? "") + (t.hyph ? "-" : "");
    this.input.hidden = false;
    this.reposition();
    this.input.focus({ preventScroll: true });
    this.input.select();
  }

  /** 重画之后把框挪回那个音下面。 */
  reposition(): void {
    if (!this.open) return;
    const L = this.layout(), h = L?.lyrics.find((x) => x.index === this.index);
    if (!L || !h) { this.close(); return; }
    this.system = h.system;
    const w = Math.max(48, this.input.value.length * L.sp * 1.6 + 24);
    Object.assign(this.input.style, { left: `${h.x - w / 2}px`, top: `${h.y - L.sp * 2.1}px`, width: `${w}px`, fontSize: `${L.sp * 1.6}px` });
  }

  /** 把框里的字贴到当前这个音（可能一次贴好几个音节，往后挪），并跳到下一个空位。 */
  private place(text: string, hyphEnd: boolean): void {
    let syl: Syl[] = splitSyllables(text);
    if (!syl.length) return;
    if (hyphEnd) syl = syl.map((s, k) => (k === syl.length - 1 ? { ...s, hyph: true } : s));
    const { st, last } = distributeFrom(this.host.get(), this.index, syl);
    this.host.set(st);
    const nx = nextLyricSlot(st.song.tokens, last);
    this.input.value = "";
    if (nx >= 0) { this.index = nx; this.input.value = this.slotText(nx); this.rerender(); this.input.select(); }
    else { this.index = -1; this.input.hidden = true; this.rerender(); }   // 没有下一个音了：收起（多出来的字已经补成新音）
  }
  private slotText(i: number): string {
    const t = this.host.get().song.tokens[i] as NoteTok;
    return t.lyric === MELISMA_MARK ? "~" : (t.lyric ?? "") + (t.hyph ? "-" : "");
  }

  /** 输入法选定 / 直接打字之后：中日文字立刻贴；拖腔记号立刻贴；英文等空格或「-」。 */
  private absorb(): void {
    if (!this.open) return;
    const v = this.input.value;
    if (!v) return;
    if (/^[~～_＿ー]$/.test(v)) { this.place(v, false); return; }
    if (CJK.test(v) && !/[A-Za-z]/.test(v)) { this.place(v, false); return; }
    this.reposition();
  }

  /** 键盘路由来的动作（src/input/keys.ts 的「歌词框」那几行）。返回 false = 这一下不归歌词框管（让输入框照常打字）。 */
  act(a: "commit" | "cancel" | "next" | "prev" | "hyphen" | "back"): boolean {
    if (!this.open) return false;
    const v = this.input.value;
    switch (a) {
      case "commit": this.commitAndClose(); return true;
      case "cancel": this.close(); return true;
      case "next": if (v.trim()) this.place(v.trim(), false); else this.step(1); return true;
      case "prev": this.commitOnly(); this.step(-1); return true;
      case "hyphen": if (!/[A-Za-z']$/.test(v)) return false; this.place(v, true); return true;
      case "back": {
        if (v) return false;
        const st = this.host.get(), cur = st.song.tokens[this.index] as NoteTok;
        if (cur?.lyric) this.host.set({ ...st, song: { ...st.song, tokens: st.song.tokens.map((t, k) => (k === this.index ? { ...cur, lyric: null, hyph: undefined } : t)) } });
        this.step(-1); return true;
      }
    }
  }

  /** 前后挪一个歌词位（不贴字）。 */
  private step(d: number): void {
    const toks = this.host.get().song.tokens;
    const j = d > 0 ? nextLyricSlot(toks, this.index) : prevLyricSlot(toks, this.index);
    if (j < 0) { this.rerender(); return; }
    this.index = j; this.input.value = this.slotText(j); this.rerender(); this.input.select();
  }

  /** 框里有字就照原样贴到当前这个音（不往后挪）；空框 = 清掉这个音的字。 */
  private commitOnly(): void {
    if (!this.open) return;
    const st = this.host.get(), cur = st.song.tokens[this.index] as NoteTok, v = this.input.value.trim();
    if (!cur) return;
    if (!v) { if (cur.lyric) this.host.set({ ...st, song: { ...st.song, tokens: st.song.tokens.map((t, k) => (k === this.index ? { ...cur, lyric: null, hyph: undefined } : t)) } }); return; }
    if (v === this.slotText(this.index)) return;
    const syl = splitSyllables(v.replace(/-$/, "")).map((s, k, a) => (k === a.length - 1 && /-$/.test(v) ? { ...s, hyph: true } : s));
    if (syl.length) this.host.set(distributeFrom(st, this.index, syl).st);
  }

  commitAndClose(): void { if (!this.open) return; this.commitOnly(); this.close(); }
  close(): void { this.index = -1; this.input.value = ""; this.input.hidden = true; this.rerender(); }
}
