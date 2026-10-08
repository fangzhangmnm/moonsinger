// finder.ts —— 找人视图：全屏（替掉谱区，pad 留着当试听键盘），按**乐器概念**浏览百科目录，点一个提供者 = 载进实时合成器、pad 直接弹它；「上场」= 角色改成这个概念 + 造演奏者。
// created 2026-10-07 by Claude Fable 5.1。user 2026-10-07「找人视图同意，然后最好是全屏的而不是弹出窗口，类似gallery，然后能用这个音乐键盘」「默认按年代排哈哈哈」
//   「试听不生成演奏者」（试听台 = 临时槽；只在「上场」时才 by value 造演奏者）「顺序本来就是先选概念再选演奏者」。
// 数据 = src/gm/catalog.ts（vendor/instruments/ 的两张表 + 图标 sprite）；音频 / 选角归 host（src/app/main.ts）。
import { loadCatalog, loadIconSprite, groupConcepts, providersOf, roleNameOf, eraLabel, fmtYear, SORT_LABEL, type Catalog, type Concept, type Provider, type SortMode } from "../gm/catalog.ts";

export type FinderPick = { kind: "gs"; concept: Concept; provider: Provider } | { kind: "voice"; concept: Concept };
export interface FinderHost {
  base: URL;                                                   // 主 bundle 的 import.meta.url（找 vendor/）
  roleName(): string;                                          // 现在的角色名（顶条写「找人给「X」」）
  audition(p: FinderPick | null): Promise<void>;                     // 试听台：载进实时合成器（pad 弹它）；null = 停
  playHead(p: FinderPick): Promise<void>;                            // 用它放本声部开头
  cast(p: FinderPick, mode: "auto" | "embed" | "weak"): Promise<"done" | "over">;   // 上场；"over" = 超软上限，视图显示三选一
  close(): void;
}
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export class Finder {
  readonly el: HTMLDivElement;
  private cat: Catalog | null = null;
  private mode: SortMode = "year";          // user「默认按年代排哈哈哈」
  private q = "";
  private opened = new Set<string>();       // 展开的概念
  private selected = "";                    // 试听台上的提供者（`${概念 id}|${bank}:${program}` / `${概念 id}|voice`）
  private over: { key: string; pick: FinderPick } | null = null;   // 超软上限等三选一
  private loading: Promise<void> | null = null;
  private host: FinderHost;
  constructor(parent: HTMLElement, host: FinderHost) {
    this.host = host;
    this.el = document.createElement("div"); this.el.className = "finder"; this.el.hidden = true;
    this.el.innerHTML = `<div class="finder-bar"><button class="btn" data-v="back" title="回到谱（Esc）">← 谱</button><span class="finder-title"></span>` +
      `<input class="finder-q" type="search" placeholder="搜乐器（中 / 英 / 日）" spellcheck="false" autocomplete="off" />` +
      `<select class="finder-sort">${(Object.keys(SORT_LABEL) as SortMode[]).map((m) => `<option value="${m}">${SORT_LABEL[m]}</option>`).join("")}</select></div>` +
      `<div class="finder-hint">点一件乐器 → 挑谁来演 → 用右边的键盘试 → 「上场」。角色会改成那件乐器（谱上写它的名字）；谁来演才进休息室。</div>` +
      `<div class="finder-list"><div class="finder-empty">加载目录…</div></div>`;
    parent.append(this.el);
    this.el.querySelector<HTMLInputElement>(".finder-q")!.addEventListener("input", (e) => { this.q = (e.target as HTMLInputElement).value; this.render(); });
    this.el.querySelector<HTMLSelectElement>(".finder-sort")!.addEventListener("change", (e) => { this.mode = (e.target as HTMLSelectElement).value as SortMode; this.render(); });
    this.el.addEventListener("click", (e) => void this.onClick(e));
  }
  get isOpen(): boolean { return !this.el.hidden; }
  async show(): Promise<void> {
    this.el.hidden = false;
    this.el.querySelector(".finder-title")!.textContent = `找人给「${this.host.roleName()}」`;
    this.el.querySelector<HTMLSelectElement>(".finder-sort")!.value = this.mode;
    if (!this.cat) {
      this.loading ??= (async () => {
        const [cat, sprite] = await Promise.all([loadCatalog(this.host.base), loadIconSprite(this.host.base)]);
        const doc = new DOMParser().parseFromString(sprite, "image/svg+xml"), svg = doc.documentElement;
        if (svg.tagName.toLowerCase() === "svg") { const node = document.importNode(svg, true) as unknown as SVGElement; node.setAttribute("style", "display:none"); this.el.prepend(node); }
        this.cat = cat;
      })().catch((e) => { this.el.querySelector(".finder-list")!.innerHTML = `<div class="finder-empty">目录加载不了：${esc((e as Error).message)}</div>`; throw e; }).finally(() => { this.loading = null; });
      await this.loading;
    }
    this.render();
  }
  hide(): void { this.el.hidden = true; this.over = null; }
  private pickOf(key: string): FinderPick | null {
    if (!this.cat) return null;
    const [cid, rest] = key.split("|"), c = this.cat.byId.get(cid); if (!c) return null;
    if (rest === "voice") return { kind: "voice", concept: c };
    const [bank, program] = rest.split(":").map(Number), p = providersOf(this.cat, c).find((x) => x.bank === bank && x.program === program);
    return p ? { kind: "gs", concept: c, provider: p } : null;
  }
  private async onClick(e: Event): Promise<void> {
    const t = e.target as HTMLElement, btn = t.closest<HTMLElement>("[data-v]"), row = t.closest<HTMLElement>(".inst-row"), prov = t.closest<HTMLElement>(".prov");
    const v = btn?.dataset.v;
    if (v === "back") { this.host.close(); return; }
    if (v && btn) {
      const key = btn.closest<HTMLElement>("[data-p]")?.dataset.p ?? this.over?.key ?? "", pick = this.pickOf(key); if (!pick) return;
      if (v === "play") { await this.host.playHead(pick); return; }
      if (v === "cast" || v === "embed" || v === "weak") {
        const r = await this.host.cast(pick, v === "cast" ? "auto" : v);
        if (r === "over") { this.over = { key, pick }; this.render(); }
        else this.over = null;
        return;
      }
      if (v === "cancel") { this.over = null; this.render(); return; }
    }
    if (prov) { const key = prov.dataset.p!; if (this.selected !== key) { this.selected = key; this.render(); await this.host.audition(this.pickOf(key)); } return; }
    if (row) {
      const id = row.dataset.c!;
      if (this.opened.has(id)) this.opened.delete(id);
      else { this.opened.add(id); const c = this.cat!.byId.get(id)!, first = providersOf(this.cat!, c)[0]; const key = first ? `${id}|${first.bank}:${first.program}` : `${id}|voice`; this.selected = key; this.render(); await this.host.audition(this.pickOf(key)); return; }
      this.render();
    }
  }
  render(): void {
    const list = this.el.querySelector(".finder-list")!; if (!this.cat) return;
    const groups = groupConcepts(this.cat, this.mode, this.q);
    if (!groups.length) { list.innerHTML = `<div class="finder-empty">没有叫「${esc(this.q)}」的</div>`; return; }
    list.innerHTML = groups.map((g) => `<div class="finder-group"><div class="finder-group-h">${esc(g.label)}<span>${g.concepts.length}</span></div>${g.concepts.map((c) => this.rowHtml(c)).join("")}</div>`).join("");
    list.querySelector(".prov.is-on")?.scrollIntoView({ block: "nearest" });
  }
  private rowHtml(c: Concept): string {
    const cat = this.cat!, open = this.opened.has(c.id), icon = c.icon?.id;
    const meta = [eraLabel(cat, c), c.year !== null ? `${c.yearApprox ? "约 " : ""}${fmtYear(c.year)}` : ""].filter(Boolean).join(" · ");
    let body = "";
    if (open) {
      const provs = providersOf(cat, c), pitched = c.kind !== "sound" && !(c.ids.gm ?? []).some((g) => g.bank === 128);
      const prov = (key: string, label: string, note: string, playable: boolean) => `<div class="prov${this.selected === key ? " is-on" : ""}" data-p="${esc(key)}"><div class="prov-l"><b>${label}</b>${note ? `<small>${note}</small>` : ""}</div>` +
        `<div class="prov-b">${playable ? `<button class="btn" data-v="play" title="用它放这条声部的开头">▶ 听开头</button>` : ""}<button class="btn primary" data-v="cast">上场</button></div></div>` +
        (this.over?.key === key ? `<div class="prov-over">「${esc(this.over.pick.kind === "gs" ? this.over.pick.provider.gmName : "")}」的声音超过了嵌入的软上限：<button class="btn primary" data-v="embed">嵌进歌</button><button class="btn" data-v="weak">不嵌，只记来源</button><button class="btn" data-v="cancel">算了</button></div>` : "");
      body = `<div class="inst-prov">` +
        provs.map((p) => prov(`${c.id}|${p.bank}:${p.program}`, `${p.bank === 128 ? "鼓组" : "GeneralUser GS"} · ${esc(p.gmName)}`, p.kind === "substitute" ? `顶替${p.basis === "official" ? "（GM 原文认可）" : p.basis === "lineage" ? "（前身）" : p.basis === "family" ? "（同类）" : "（只是同名）"}${p.reason ? `：${esc(p.reason)}` : ""}` : "", true)).join("") +
        (pitched ? prov(`${c.id}|voice`, "月读（哼）", "没写歌词的音按「哼的字」唱；写了歌词就唱歌词", false) : "") +
        (!provs.length && !pitched ? `<div class="prov-none">目录里还没有谁能演它</div>` : "") + `</div>`;
    }
    return `<div class="inst-row${open ? " is-open" : ""}" data-c="${esc(c.id)}">` +
      (icon ? `<svg class="inst-ico" aria-hidden="true"><use href="#${esc(icon)}"/></svg>` : `<span class="inst-ico none">${esc(c.names.zh.slice(0, 1))}</span>`) +
      `<div class="inst-name"><b>${esc(c.names.zh)}</b><span>${esc(roleNameOf(c))}${c.names.ja ? ` · ${esc(c.names.ja)}` : ""}</span></div><div class="inst-meta">${esc(meta)}</div></div>` + body;
  }
}
