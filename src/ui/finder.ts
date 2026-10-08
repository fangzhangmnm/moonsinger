// finder.ts —— 找人视图：全屏（替掉谱区，pad 留着当试听键盘），按**乐器概念**浏览百科目录，点一个提供者 = 载进实时合成器、pad 直接弹它；「上场」= 角色改成这个概念 + 造演奏者。
// created 2026-10-07 by Claude Fable 5.1。user 2026-10-07「找人视图同意，然后最好是全屏的而不是弹出窗口，类似gallery，然后能用这个音乐键盘」「默认按年代排哈哈哈」
//   「试听不生成演奏者」（试听台 = 临时槽；只在「上场」时才 by value 造演奏者）「顺序本来就是先选概念再选演奏者」。
// 数据 = src/gm/catalog.ts（vendor/instruments/ 的两张表 + 图标 sprite）；音频 / 选角归 host（src/app/main.ts）。
import { loadCatalog, loadIconSprite, groupConcepts, providersOf, roleNameOf, eraLabel, fmtYear, gmKey, weightLabel, SORT_LABEL, type Catalog, type Concept, type Entry, type Provider, type SortMode } from "../gm/catalog.ts";

export type FinderPick = { kind: "gs"; concept: Concept; provider: Provider } | { kind: "voice"; concept: Concept };
export interface FinderHost {
  base: URL;                                                   // 主 bundle 的 import.meta.url（找 vendor/）
  roleName(): string;                                          // 现在的角色名（顶条写「找人给「X」」）
  audition(p: FinderPick | null): Promise<void>;                     // 试听台：载进实时合成器（pad 弹它）；null = 停
  playHead(p: FinderPick): Promise<void>;                            // 用它放本声部开头
  cast(p: FinderPick): Promise<void>;                                // 上场（声音默认弱引用：歌里只记来源，要带着走 = 文件菜单「全部打包进歌」）
  close(): void;
  togglePad(): void;                                                 // 顶条「键盘」：开 / 关试听键盘（user 2026-10-08「音色预览也应该能toggle键盘，免得没弹出来」）
}
const HINT = "点一件乐器 → 挑谁来演 → 用右边的键盘试 → 「上场」。角色会改成那件乐器（谱上写它的名字）；谁来演才进休息室。";
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export class Finder {
  readonly el: HTMLDivElement;
  private cat: Catalog | null = null;
  private mode: SortMode = "style";         // 默认按〇〇风（user 2026-10-08「然后音色排序默认还是画风吧。年代好玩但其实每次都要多点一次哈哈」；此前 10-07「默认按年代排哈哈哈」）
  private q = "";
  private opened: string | null = null;     // 展开的那一行 = 「组 id::概念 id」（一次只开一件：展开第二件第一件自动收——user「老问题，展开第二个乐器之后第一个应该收」）。
                                            // 记组：按曲风排时同一件乐器在好几个组里都有，只记概念 = 每个组里的它都展开、滚去第一个（user 2026-10-08「在一个category里面选择一个乐器，会跳到第一个出现这个乐器的category」）
  private selected = "";                    // 试听台上的提供者（`${概念 id}|${bank}:${program}` / `${概念 id}|voice`）
  private loading: Promise<void> | null = null;
  private playOnly = false;                 // 从歌库进的 = 只弹着玩：不出「上场」，返回回歌库
  private host: FinderHost;
  constructor(parent: HTMLElement, host: FinderHost) {
    this.host = host;
    this.el = document.createElement("div"); this.el.className = "finder"; this.el.hidden = true;
    this.el.innerHTML = `<div class="finder-bar"><button class="btn" data-v="back" title="回到谱（Esc）">← 谱</button><span class="finder-title"></span>` +
      `<input class="finder-q" type="search" placeholder="搜乐器（中 / 英 / 日）" spellcheck="false" autocomplete="off" />` +
      `<select class="finder-sort">${(Object.keys(SORT_LABEL) as SortMode[]).map((m) => `<option value="${m}">${SORT_LABEL[m]}</option>`).join("")}</select>` +
      `<button class="btn finder-pad" data-v="pad" title="试听键盘：开 / 关"><svg class="ico"><use href="#grid"/></svg><span>键盘</span></button></div>` +
      `<div class="finder-hint">${HINT}</div>` +
      `<div class="finder-jump" hidden><span>跳到</span><select class="finder-jump-sel" title="列表滚到这一组"></select></div>` +
      `<div class="finder-list"><div class="finder-empty">加载目录…</div></div>`;
    parent.append(this.el);   // 位置由 #stage 的 grid 命名区域钉死（.finder 占 main、pad 占 pad），和节点顺序无关（user「keyboard不应该用flex，这是一个很固定的有着很严密逻辑的东西」）
    this.el.querySelector<HTMLInputElement>(".finder-q")!.addEventListener("input", (e) => { this.q = (e.target as HTMLInputElement).value; this.render(); });
    this.el.querySelector<HTMLSelectElement>(".finder-sort")!.addEventListener("change", (e) => { this.mode = (e.target as HTMLSelectElement).value as SortMode; this.render(); });
    this.el.querySelector<HTMLSelectElement>(".finder-jump-sel")!.addEventListener("change", (e) => this.jumpTo(Number((e.target as HTMLSelectElement).value)));
    this.el.addEventListener("click", (e) => void this.onClick(e));
    // 滚动时跳转下拉跟着显示「现在在哪一组」（一帧最多算一次）
    let raf = 0;
    this.el.querySelector(".finder-list")!.addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; this.markJump(); }); }, { passive: true });
  }
  get isOpen(): boolean { return !this.el.hidden; }
  /** 顶条「键盘」钮亮不亮（宿主在键盘开 / 关时告诉它）。 */
  setPadShown(on: boolean): void { this.el.querySelector(".finder-pad")?.classList.toggle("is-on", on); }
  async show(o: { playOnly?: boolean } = {}): Promise<void> {
    this.el.hidden = false; this.playOnly = !!o.playOnly;
    this.el.querySelector(".finder-title")!.textContent = this.playOnly ? "乐器目录（弹着玩）" : `找人给「${this.host.roleName()}」`;
    this.el.querySelector('[data-v="back"]')!.textContent = this.playOnly ? "← 歌库" : "← 谱";
    this.el.querySelector(".finder-hint")!.textContent = this.playOnly ? "点一件乐器 → 挑谁来演 → 用键盘弹着玩。要给歌里的声部选乐器：开一首歌，点谱前面的声部名。" : HINT;
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
  hide(): void { this.el.hidden = true; }
  private pickOf(key: string): FinderPick | null {
    if (!this.cat) return null;
    const [cid, rest] = key.split("|"), c = this.cat.byId.get(cid); if (!c) return null;
    if (rest === "voice") return { kind: "voice", concept: c };
    const p = providersOf(this.cat, c).find((x) => gmKey(x) === rest);
    return p ? { kind: "gs", concept: c, provider: p } : null;
  }
  private async onClick(e: Event): Promise<void> {
    const t = e.target as HTMLElement, btn = t.closest<HTMLElement>("[data-v]"), row = t.closest<HTMLElement>(".inst-row"), prov = t.closest<HTMLElement>(".prov");
    const rowOf = (el: HTMLElement) => (el.closest(".inst-prov")?.previousElementSibling as HTMLElement | null)?.dataset.o ?? "";   // 提供者所在的那一行（组::概念）
    const v = btn?.dataset.v;
    if (v === "back") { this.host.close(); return; }
    if (v === "pad") { this.host.togglePad(); return; }
    if (v && btn) {
      const key = btn.closest<HTMLElement>("[data-p]")?.dataset.p ?? "", pick = this.pickOf(key); if (!pick) return;
      if (v === "play") { await this.host.playHead(pick); return; }
      if (v === "cast") { await this.host.cast(pick); return; }
    }
    if (prov) { const key = prov.dataset.p!; if (this.selected !== key) { this.selected = key; this.renderAnchored(rowOf(prov)); await this.host.audition(this.pickOf(key)); } return; }
    if (row) {
      const id = row.dataset.c!, o = row.dataset.o!;
      if (this.opened === o) this.opened = null;
      else { this.opened = o; const c = this.cat!.byId.get(id)!, pk = row.dataset.k, first = providersOf(this.cat!, c).find((x) => !pk || gmKey(x) === pk); /* 音色行 = 试听它自己 */ const key = first ? `${id}|${gmKey(first)}` : c.kind === "voice" ? `${id}|voice` : ""; this.selected = key; this.renderAnchored(o, true); if (key) await this.host.audition(this.pickOf(key)); return; }
      this.renderAnchored(o);
    }
  }
  render(): void {
    const list = this.el.querySelector(".finder-list")!; if (!this.cat) return;
    const groups = groupConcepts(this.cat, this.mode, this.q), jump = this.el.querySelector<HTMLElement>(".finder-jump")!;
    // 类级跳转（user 2026-10-08「分类能不能有一个类级别的跳转功能，不然一个一个下拉很累」）：一组一项，选了列表滚到那组；只有一组就不出。
    //   做成下拉（user 同日「category选项能做成下拉而不是滑动吗」；原来是横着滑的一排粒）
    jump.hidden = groups.length < 2;
    jump.querySelector("select")!.innerHTML = groups.map((g, k) => `<option value="${k}">${esc(g.label)} · ${g.items.length} 件</option>`).join("");
    if (!groups.length) { list.innerHTML = `<div class="finder-empty">没有叫「${esc(this.q)}」的</div>`; return; }
    list.innerHTML = groups.map((g, k) => `<div class="finder-group" data-g="${k}"><div class="finder-group-h">${esc(g.label)}<span>${g.items.length}</span></div>${g.items.map((e) => this.rowHtml(e, g.id)).join("")}</div>`).join("");
    this.markJump();
  }
  /** 重画，但把 anchor 这件乐器的那一行钉在屏幕上原来的位置（user 2026-10-08「换乐器玩，弹几下，选乐器滚动会跳到别的地方去」：
   *  点另一件 = 上面展开的那件收起，整张列表往上缩，原来又用 scrollIntoView 去追选中项、在 iPad 上还会连外层一起滚——手指底下那行就跑了）。
   *  reveal = 刚展开的：它的「谁能演」露不全就往上挪一点，但这一行不挪到组头底下。只滚列表自己。 */
  private renderAnchored(anchor: string, reveal = false): void {
    const list = this.el.querySelector<HTMLElement>(".finder-list")!, sel = `.inst-row[data-o="${CSS.escape(anchor)}"]`;
    const before = list.querySelector<HTMLElement>(sel)?.getBoundingClientRect().top;
    this.render();
    const row = list.querySelector<HTMLElement>(sel); if (!row || before === undefined) return;
    list.scrollTop += row.getBoundingClientRect().top - before;
    if (!reveal) return;
    const body = row.nextElementSibling as HTMLElement | null; if (!body?.classList.contains("inst-prov")) return;
    const lr = list.getBoundingClientRect(), hdr = (row.closest(".finder-group")?.querySelector<HTMLElement>(".finder-group-h")?.offsetHeight ?? 0);
    const over = body.getBoundingClientRect().bottom - lr.bottom, room = row.getBoundingClientRect().top - (lr.top + hdr);
    if (over > 0 && room > 0) list.scrollTop += Math.min(over, room);
    this.markJump();
  }
  /** 列表滚到第 k 组的组头（只滚列表自己，不用 scrollIntoView——它会连带滚外层）。 */
  private jumpTo(k: number): void {
    const list = this.el.querySelector<HTMLElement>(".finder-list")!, g = list.querySelector<HTMLElement>(`[data-g="${k}"]`); if (!g) return;
    list.scrollTop += g.getBoundingClientRect().top - list.getBoundingClientRect().top;
    this.markJump();
  }
  /** 跳转下拉显示「现在在哪一组」（组头顶到列表顶的最后一组）。滚到底时：最后几组短、组头顶不到列表顶——人刚选的那组比算出来的靠后就留着它，不往回弹。 */
  private markJump(): void {
    const list = this.el.querySelector<HTMLElement>(".finder-list")!, jump = this.el.querySelector<HTMLElement>(".finder-jump")!; if (jump.hidden) return;
    const sel = jump.querySelector("select")!, top = list.getBoundingClientRect().top + 1;
    let cur = 0;
    for (const g of list.querySelectorAll<HTMLElement>("[data-g]")) { if (g.getBoundingClientRect().top <= top) cur = Number(g.dataset.g); else break; }
    const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 2;
    if (atBottom && Number(sel.value) > cur) return;
    if (sel.value !== String(cur)) sel.value = String(cur);
  }
  private rowHtml(e: Entry, groupId: string): string {
    const cat = this.cat!, c = e.concept, pk = e.preset ? gmKey(e.preset) : "", o = `${groupId}::${c.id}${pk ? `::${pk}` : ""}`, open = this.opened === o, icon = c.icon?.id;
    // 按曲风显示承重：★★★ 承重 / ★★ 常用 / ★ 点缀（仓鼠 v3；user「每个风里面按照承重排…让他ui里面显示出来」）；音色行 = 这个音色自己的（v8 起逐个音色判）
    const w = e.weight ?? 0, stars = w ? `<span class="inst-w" title="${esc(weightLabel(cat, w))}">${"★".repeat(w)}</span>` : "";
    const asName = e.as ? (cat.byId.get(e.as)?.names.zh ?? e.as) : "", asTag = asName ? `<span class="inst-as" title="在这种风里顶替「${esc(asName)}」">顶 ${esc(asName)}</span>` : "";
    const year = e.preset?.year ?? c.year, approx = e.preset ? !!(e.preset as { yearApprox?: boolean }).yearApprox : c.yearApprox;
    const meta = [eraLabel(cat, c), year !== null && year !== undefined ? `${approx ? "约 " : ""}${fmtYear(year)}` : ""].filter(Boolean).join(" · ");
    let body = "";
    if (open) {
      // 月读只在人声类概念下面（user 2026-10-07「为什么月读可以全量平替所有乐器…也许不大合适」：她实现的是人声，不是小提琴；
      //   「让她哼一下这条线听听」归监听方式（草稿听，契约 §1），不是选角）
      const provs = providersOf(cat, c).filter((x) => !pk || gmKey(x) === pk), pitched = c.kind === "voice";   // 音色行 = 只列它自己
      // 平替弱化显示（user「平替换的ui也需要弄出区别」「也许需要弱化显示」）：虚线框、灰字、「顶替」标
      const prov = (key: string, label: string, note: string, playable: boolean, sub = false) => `<div class="prov${this.selected === key ? " is-on" : ""}${sub ? " sub" : ""}" data-p="${esc(key)}"><div class="prov-l"><b>${sub ? `<span class="prov-tag">顶替</span>` : ""}${label}</b>${note ? `<small>${note}</small>` : ""}</div>` +
        `<div class="prov-b">${playable ? `<button class="btn" data-v="play" title="用它放这条声部的开头">▶ 听开头</button>` : ""}${this.playOnly ? "" : `<button class="btn primary" data-v="cast">上场</button>`}</div></div>`;
      body = `<div class="inst-prov">` +
        provs.map((p) => prov(`${c.id}|${gmKey(p)}`, `${p.note !== undefined ? `鼓件 · ${esc(p.gmName)}（Standard 鼓组的 ${p.note} 号键）` : p.bank === 128 ? `鼓组 · ${esc(p.gmName)}` : `GeneralUser GS · ${esc(p.gmName)}`}`, p.kind === "substitute" ? `顶替${p.basis === "official" ? "（GM 原文认可）" : p.basis === "lineage" ? "（前身）" : p.basis === "imitation" ? "（仿声）" : p.basis === "family" ? "（同类）" : "（只是同名）"}${p.reason ? `：${esc(p.reason)}` : ""}` : "", true, p.kind === "substitute")).join("") +
        (pitched ? prov(`${c.id}|voice`, "月读", "唱歌词；没写歌词的音按「哼的字」唱", false) : "") +
        (!provs.length && !pitched ? `<div class="prov-none">目录里还没有谁能演它</div>` : "") + `</div>`;
    }
    return `<div class="inst-row${open ? " is-open" : ""}" data-c="${esc(c.id)}" data-o="${esc(o)}"${pk ? ` data-k="${esc(pk)}"` : ""}>` +
      (icon ? `<svg class="inst-ico" aria-hidden="true"><use href="#${esc(icon)}"/></svg>` : `<span class="inst-ico none">${esc(c.names.zh.slice(0, 1))}</span>`) +
      `<div class="inst-name"><b>${esc(c.names.zh)}${e.preset ? `<span class="inst-preset"> · ${esc(e.preset.gmName)}</span>` : ""}${asTag}</b>${stars}<span>${esc(roleNameOf(c))}${c.names.ja ? ` · ${esc(c.names.ja)}` : ""}</span></div><div class="inst-meta">${esc(meta)}</div></div>` + body;
  }
}
