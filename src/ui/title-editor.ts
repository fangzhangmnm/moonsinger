// title-editor.ts —— 点纸面最上面的歌名就地改（可不填）；2026-10-08 起也管每张纸顶上的曲段名（Claude Fable 5.1）。created 2026-10-07 by Claude Opus 5.5
// user 2026-10-07「纸张的最上面加一个可选的歌名吧，未来也是文件名」。
// 回车 / 点别处 = 写进谱（空 = 不填）；Esc = 不改。歌名是谱上的（存档 = MusicXML <work-title>），改了就算改过没存。
import { type EditorState, setTitle, setPaperName } from "../score/song.ts";
import type { Layout } from "../render/engrave.ts";

interface Host { get(): EditorState; set(next: EditorState): void }

export class TitleEditor {
  private input: HTMLInputElement;
  open = false;
  private paper: string | null = null;   // 正在改哪张纸的曲段名；null = 歌名

  constructor(parent: HTMLElement, private host: Host, private layout: () => Layout | null) {
    this.input = document.createElement("input");
    this.input.className = "title-input"; this.input.type = "text"; this.input.hidden = true;
    this.input.placeholder = "";   // 空框本身就是提示（user「dashed boxes就不用字了哈哈」） this.input.autocomplete = "off"; this.input.spellcheck = false; this.input.enterKeyHint = "done";
    parent.appendChild(this.input);
    this.input.addEventListener("keydown", (e) => {
      if (e.isComposing) return;
      if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); this.commitAndClose(); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); this.close(); }
    });
    this.input.addEventListener("blur", () => { if (this.open) this.commitAndClose(); });
  }

  /** 开框：不给 paperId = 歌名；给了 = 那张纸的曲段名。 */
  openNow(paperId: string | null = null): void {
    this.open = true; this.paper = paperId;
    const song = this.host.get().song;
    this.input.value = (paperId ? song.papers.find((p) => p.id === paperId)?.name : song.title) ?? "";
    this.input.classList.toggle("paper", !!paperId);
    this.input.hidden = false;
    this.reposition();
    this.input.focus({ preventScroll: true }); this.input.select();
  }
  commitAndClose(): void {
    if (!this.open) return;
    const v = this.input.value, paper = this.paper;
    this.close();
    this.host.set(paper ? setPaperName(this.host.get(), paper, v) : setTitle(this.host.get(), v));
  }
  private close(): void { this.open = false; this.input.hidden = true; }
  reposition(): void {
    const L = this.layout(); if (!this.open || !L) return;
    const t = this.paper ? L.papers.find((p) => p.id === this.paper)?.title : L.title;
    if (!t) { this.close(); return; }
    Object.assign(this.input.style, { left: `${t.x}px`, top: `${t.y}px`, width: `${t.w}px`, height: `${t.h}px`, fontSize: `${t.size}px` });
  }
}
