// lyric-editor.ts —— 在五线谱下面就地写歌词。created 2026-10-07 by Claude Opus 5.5
// user「歌词输入不应该放在键盘上，而是放在五线谱下面点进去一个一个写或者删」；记谱规矩照 MusicXML / MuseScore（user「输入 同意，拖为什么不用~？」）：
//   · 点某个音下面 → 那里出一个输入框（iPad 弹系统键盘，输入法照常用）；
//   · 中文 / 日文：输入法选定一段字（compositionend）就按字往后贴，框跟到下一个空位——一字（一拍）一个音；
//   · 英文：空格 = 这个词完了、跳下一个音；「-」= 音节完了、词没完（谱面画连字符）、跳下一个音；
//   · 「~」（或 _ ー）= 拖腔：这个音延续上一个字；
//   · 空框里退格 = 回到上一个音，把它的字拿出来接着删；回车 / 点别处 = 收起；Esc = 收起不贴；Tab / Shift+Tab = 前后挪。
//   键位在 src/input/keys.ts（一张表）；这里只收路由来的动作（act）。
// 输入法还在拼（isComposing）的时候什么都不做——拼音、假名输入法都不被打断。

import { type EditorState, type NoteTok, tr, withTrack } from "../score/song.ts";
import { splitSyllables, distributeFrom, nextLyricSlot, prevLyricSlot, lyricSlot, MELISMA_MARK, type Syl, joinIntoPrev, lyricEdit, mergeIntoPrev } from "../score/lyrics.ts";
import { insertPhraseAfter } from "../score/song.ts";
/** 歌词里的句读 = 这一句到这儿（插「句」：换行 / 换气 / 「合」的边界；user 2026-10-08「歌词的句号可能需要这个」）。字不进歌词。 */
const PUNCT = /[。．，、,.!！?？;；:：]+$/;
const splitPunct = (v: string): { text: string; phrase: boolean } => { const m = PUNCT.exec(v); return m ? { text: v.slice(0, m.index), phrase: true } : { text: v, phrase: false }; };
import type { Layout } from "../render/engrave.ts";

interface Host { get(): EditorState; set(next: EditorState, opts?: { gesture?: string }): void }   // gesture "lyric"：连打的歌词在 undo 里是一步
const CJK = /[\p{Script=Han}぀-ヿ]/u;

export class LyricEditor {
  private input: HTMLInputElement;
  /** 「合」：这个字并进前一个音（回头改用；打字的时候框在空的音上，它不出来）。 */
  private merge: HTMLButtonElement;
  private index = -1;
  system = 0;

  constructor(private parent: HTMLElement, private host: Host, private layout: () => Layout | null, private rerender: () => void) {
    const i = document.createElement("input");
    i.className = "lyric-input"; i.type = "text"; i.autocomplete = "off"; i.spellcheck = false; i.hidden = true;
    i.setAttribute("autocapitalize", "off"); i.setAttribute("enterkeyhint", "done");
    parent.appendChild(i);
    this.input = i;
    const m = document.createElement("button");
    m.className = "btn lyric-merge"; m.type = "button"; m.textContent = "合"; m.hidden = true;
    m.title = "这个字并进前一个音（一个音上几个字）；这一句后面的字往前挪一个音";
    m.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); this.mergeNow(); });   // 不抢焦点：框照常开着
    parent.appendChild(m);
    this.merge = m;
    i.addEventListener("compositionend", () => this.absorb());
    i.addEventListener("input", (e) => { if (!(e as InputEvent).isComposing) this.absorb(); });
    i.addEventListener("blur", () => { if (this.open) setTimeout(() => { if (document.activeElement !== this.input) this.commitAndClose(); }, 0); });
  }

  get open(): boolean { return this.index >= 0; }

  /** 在下标 i 的音下面打开（框里放着它现在的字，全选，方便直接改写）。 */
  openAt(i: number): void {
    const st = this.host.get(), t = tr(st)[i];
    if (!t || !lyricSlot(t)) return;
    this.index = i;
    this.input.value = this.slotText(i);
    this.input.hidden = false;
    this.reposition();
    this.input.focus({ preventScroll: true });
    this.input.select();
  }

  /** 重画之后把框挪回那个音下面。 */
  reposition(): void {
    if (!this.open) { this.merge.hidden = true; return; }   // 框收了（包括打完最后一个字自己收的）=「合」也收
    const L = this.layout(), at = this.host.get().at, h = L?.lyrics.find((x) => x.index === this.index && L.systems[x.system]?.paper === at.paper && L.systems[x.system]?.part === at.part);
    if (!L || !h) { this.close(); return; }
    this.system = h.system;
    const w = Math.max(48, this.input.value.length * L.sp * 1.6 + 24);
    Object.assign(this.input.style, { left: `${h.x - w / 2}px`, top: `${h.y - L.sp * 2.1}px`, width: `${w}px`, fontSize: `${L.sp * 1.6}px` });
    const can = mergeIntoPrev(this.host.get(), this.index) !== this.host.get(), mh = L.sp * 1.6 * 2;
    this.merge.hidden = !can;
    // 放在框的正下方（不挡前面那几个字——要合的就是它们）
    if (can) Object.assign(this.merge.style, { left: `${h.x - w / 2}px`, top: `${h.y - L.sp * 2.1 + L.sp * 1.6 * 2 + 4}px`, width: `${mh}px`, height: `${mh * 0.8}px` });
  }
  /** 点「合」：框里改过的先贴上，再把这个字并进前一个音、这一句后面的字往前挪；框留在这个音上（现在是挪过来的字）。 */
  private mergeNow(): void {
    if (!this.open) return;
    this.commitOnly();
    const st = this.host.get(), next = mergeIntoPrev(st, this.index);
    if (next === st) return;
    this.host.set(next);
    this.input.value = this.slotText(this.index); this.rerender(); this.input.select();
  }

  /** 把框里的字贴到当前这个音（可能一次贴好几个音节，往后挪），并跳到下一个空位。 */
  private place(text: string, hyphEnd: boolean, phraseEnd = false): void {
    let syl: Syl[] = splitSyllables(text);
    if (!syl.length) { if (phraseEnd) this.endPhraseHere(); return; }
    if (hyphEnd) syl = syl.map((s, k) => (k === syl.length - 1 ? { ...s, hyph: true } : s));
    if (syl[0].joinPrev) {   // 「+」开头：第一个字并进前一个音（框已经跳到这个音了）；剩下的照常从这个音往后贴
      this.host.set(joinIntoPrev(this.host.get(), this.index, syl[0].text));
      syl = syl.slice(1);
      if (!syl.length) { this.input.value = this.slotText(this.index); this.rerender(); this.input.select(); return; }
    }
    const r = distributeFrom(this.host.get(), this.index, syl), st = phraseEnd ? insertPhraseAfter(r.st, r.last) : r.st, last = r.last;
    this.host.set(st, { gesture: "lyric" });
    const nx = nextLyricSlot(tr(st), last);
    this.input.value = "";
    if (nx >= 0) { this.index = nx; this.input.value = this.slotText(nx); this.rerender(); this.input.select(); }
    else { this.index = -1; this.input.hidden = true; this.merge.hidden = true; this.rerender(); }   // 没有下一个音了：收起（多出来的字已经补成新音）
  }
  /** 框是空的、打了个句号：句插在前一个有字位的音后面（框留在原来的音上）。 */
  private endPhraseHere(): void {
    const st = this.host.get(), p = prevLyricSlot(tr(st), this.index);
    if (p < 0) return;
    const st2 = insertPhraseAfter(st, p);
    if (st2 === st) return;
    this.index++;   // 先挪下标再 set：set 会同步重画 → reposition 按下标找框的位置，旧下标现在是「句」那个 token（找不到 = 框会被收掉）
    this.host.set(st2); this.rerender();
  }
  private slotText(i: number): string {
    const t = tr(this.host.get())[i] as NoteTok;
    return t.lyric === MELISMA_MARK ? "~" : lyricEdit(t.lyric ?? "") + (t.hyph ? "-" : "");
  }

  /** 输入法选定 / 直接打字之后：中日文字立刻贴；拖腔记号立刻贴；英文等空格或「-」。 */
  private absorb(): void {
    if (!this.open) return;
    const v = this.input.value;
    if (!v) return;
    if (/^[~～_＿ー]$/.test(v)) { this.place(v, false); return; }
    const { text, phrase } = splitPunct(v);
    if (phrase) { this.input.value = ""; this.place(text, false, true); return; }   // 句读：贴字 + 插「句」（英文的「love,」也在这儿收）
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
      case "next": if (v.trim()) { const { text, phrase } = splitPunct(v.trim()); this.place(text, false, phrase); } else this.step(1); return true;
      case "prev": this.commitOnly(); this.step(-1); return true;
      case "hyphen": if (!/[A-Za-z']$/.test(v)) return false; this.place(v, true); return true;
      case "back": {
        if (v) return false;
        const st = this.host.get(), cur = tr(st)[this.index] as NoteTok;
        if (cur?.lyric) this.host.set({ ...st, song: withTrack(st.song, st.at.paper, st.at.part, tr(st).map((t, k) => (k === this.index ? { ...cur, lyric: null, hyph: undefined } : t))) });
        this.step(-1); return true;
      }
    }
  }

  /** 前后挪一个歌词位（不贴字）。 */
  private step(d: number): void {
    const toks = tr(this.host.get());
    const j = d > 0 ? nextLyricSlot(toks, this.index) : prevLyricSlot(toks, this.index);
    if (j < 0) { this.rerender(); return; }
    this.index = j; this.input.value = this.slotText(j); this.rerender(); this.input.select();
  }

  /** 框里有字就照原样贴到当前这个音（不往后挪）；空框 = 清掉这个音的字。 */
  private commitOnly(): void {
    if (!this.open) return;
    const st = this.host.get(), cur = tr(st)[this.index] as NoteTok, sp = splitPunct(this.input.value.trim()), v = sp.text;
    if (!cur) return;
    if (sp.phrase) { if (v) this.host.set(distributeFrom(st, this.index, splitSyllables(v)).st); this.host.set(insertPhraseAfter(this.host.get(), this.index)); return; }
    if (!v) { if (cur.lyric) this.host.set({ ...st, song: withTrack(st.song, st.at.paper, st.at.part, tr(st).map((t, k) => (k === this.index ? { ...cur, lyric: null, hyph: undefined } : t))) }); return; }
    if (v === this.slotText(this.index)) return;
    const syl = splitSyllables(v.replace(/-$/, "")).map((s, k, a) => (k === a.length - 1 && /-$/.test(v) ? { ...s, hyph: true } : s));
    if (syl.length) this.host.set(distributeFrom(st, this.index, syl).st);
  }

  commitAndClose(): void { if (!this.open) return; this.commitOnly(); this.close(); }
  close(): void { this.index = -1; this.input.value = ""; this.input.hidden = true; this.merge.hidden = true; this.rerender(); }
}
