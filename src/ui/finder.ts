// finder.ts —— 找人视图：全屏（替掉谱区，pad 留着当试听键盘），按**乐器概念**浏览百科目录，点一个提供者 = 载进实时合成器、pad 直接弹它；「上场」= 角色改成这个概念 + 造演奏者。
// created 2026-10-07 by Claude Fable 5.1。user 2026-10-07「找人视图同意，然后最好是全屏的而不是弹出窗口，类似gallery，然后能用这个音乐键盘」「默认按年代排哈哈哈」
//   「试听不生成演奏者」（试听台 = 临时槽；只在「上场」时才 by value 造演奏者）「顺序本来就是先选概念再选演奏者」。
// 数据 = src/gm/catalog.ts（vendor/instruments/ 的两张表 + 图标 sprite）；音频 / 选角归 host（src/app/main.ts）。
import { conceptName, conceptAlt, defLabel, zhOnly } from "../gm/catalog-i18n.ts";
import { freshFinderMemo, type FinderMemo } from "../score/desk.ts";
import { _t } from "../i18n/index.ts";
import { loadCatalog, loadIconSprite, groupConcepts, providersOf, roleNameOf, eraLabel, fmtYear, gmKey, weightLabel, SORT_LABEL, type Catalog, type Concept, type Entry, type Provider, type SortMode } from "../gm/catalog.ts";

export type FinderPick = { kind: "gs"; concept: Concept; provider: Provider } | { kind: "voice"; concept: Concept };
/** 点开的那件乐器目录里没有谁能演 = 试听键盘静音（不是还弹着上一件的声音；v0.15.7，家族周账 F-210，user 11-07「如果选中的那个类别里面没有合适的音源的时候，我在即兴的时候应该是静音，而不是显示弹在上一个音源」）。 */
export type FinderNobody = { kind: "none"; concept: Concept };
export interface FinderHost {
  roleName(): string;                                          // 现在的角色名（顶条写「找人给「X」」）
  audition(p: FinderPick | FinderNobody | null): Promise<void>;     // 试听台：载进实时合成器（pad 弹它）；none = 静音；null = 停（回到默认的哼）
  playHead(p: FinderPick): Promise<void>;                            // 用它放本声部开头
  cast(p: FinderPick): Promise<void>;                                // 上场（声音默认弱引用：歌里只记来源，要带着走 = 文件菜单「全部打包进歌」）
  close(): void;
  togglePad(): void;                                                 // 顶条「键盘」：开 / 关试听键盘（user 2026-10-08「音色预览也应该能toggle键盘，免得没弹出来」）
  /** 关目录时：这一份记忆（翻到哪）变了。即兴 = 宿主存到设备上；歌里的 = 宿主存歌时顺手带（v0.16.6）。 */
  memoChanged?(ctx: FinderCtx, m: FinderMemo): void;
}
/** 记忆归谁：歌里打开的 = 这首歌（文件里）；歌库「即兴」打开的 = 这台设备（app）。user 11-07「即兴的滚动归 App 记，然后文件内的滚动归文件记」。 */
export type FinderCtx = "song" | "impro";
const HINT = _t("点一件乐器 → 挑谁来演 → 用右边的键盘试 → 「选这个」（回到乐器页）。角色会改成那件乐器（谱上写它的名字）；谁来演才进休息室。");   // 不叫「上场」：user 2026-10-10「选乐器不要用上场这个词不然让会让人以为直接跳回主界面，但是实际上我们还是回到乐器配置界面」
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export class Finder {
  readonly el: HTMLDivElement;
  private cat: Catalog | null = null;
  private mode: SortMode = "year";          // 默认按年代（v0.15.7，家族周账 F-205，user 11-05「顺便记账还是默认年代排序的那个order」）；此前 10-08 改过按曲风（「年代好玩但其实每次都要多点一次哈哈」），10-07 起手就是按年代（「默认按年代排哈哈哈」）
  private scrollY = 0;                      // 上次翻到哪（列表的 scrollTop；关目录时记、开目录时放回去——同一页里有效，重开 app 从头。v0.15.7，F-197，user 11-05「选乐器应该能记住上次翻到哪里了」）
  private q = "";
  private openG = new Map<SortMode, string>();   // 手风琴：每种排序各记一个展开的组（没有 = 全收着；v0.16.3，user 11-07「选乐器的每个category自动collapse，而且只能expand一个」）。搜索时不收（结果全露出来）
  private opened: string | null = null;     // 展开的那一行 = 「组 id::概念 id」（一次只开一件：展开第二件第一件自动收——user「老问题，展开第二个乐器之后第一个应该收」）。
                                            // 记组：按曲风排时同一件乐器在好几个组里都有，只记概念 = 每个组里的它都展开、滚去第一个（user 2026-10-08「在一个category里面选择一个乐器，会跳到第一个出现这个乐器的category」）
  private selected = "";                    // 试听台上的提供者（`${概念 id}|${bank}:${program}` / `${概念 id}|voice`）
  private loading: Promise<void> | null = null;
  private playOnly = false;                 // 从歌库进的 = 只弹着玩：不出「上场」，返回回歌库
  private ctx: FinderCtx = "song";          // 现在这几个字段（mode / openG / scrollY / opened / selected）是哪一份记忆的（v0.16.6）
  private memos: Record<FinderCtx, FinderMemo> = { song: freshFinderMemo(), impro: freshFinderMemo() };
  private host: FinderHost;
  constructor(parent: HTMLElement, host: FinderHost) {
    this.host = host;
    this.el = document.createElement("div"); this.el.className = "finder"; this.el.hidden = true;
    this.el.innerHTML = `<div class="finder-bar"><button class="btn" data-v="back" title="${_t("回到谱（Esc）")}">${_t("← 谱")}</button><span class="finder-title"></span>` +
      `<input class="finder-q" type="search" placeholder="${_t("搜乐器（中 / 英 / 日）")}" spellcheck="false" autocomplete="off" />` +
      `<select class="finder-sort">${(Object.keys(SORT_LABEL) as SortMode[]).map((m) => `<option value="${m}">${SORT_LABEL[m]}</option>`).join("")}</select>` +
      `<button class="btn finder-pad" data-v="pad" title="${_t("试听键盘：开 / 关")}"><svg class="ico"><use href="#grid"/></svg><span>${_t("键盘")}</span></button></div>` +
      `<div class="finder-hint">${HINT}</div>` +
      `<div class="finder-jump" hidden><span>${_t("跳到")}</span><select class="finder-jump-sel" title="${_t("列表滚到这一组")}"></select></div>` +
      `<div class="finder-list"><div class="finder-empty">${_t("加载目录…")}</div></div>`;
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
  /** 把现在的字段收进这一份记忆 / 从记忆放回字段。 */
  private stash(): void {
    if (this.isOpen) this.scrollY = this.el.querySelector<HTMLElement>(".finder-list")!.scrollTop;
    this.memos[this.ctx] = { mode: this.mode, open: Object.fromEntries(this.openG), scroll: this.scrollY, row: this.opened, pick: this.selected };
  }
  private unstash(): void {
    const m = this.memos[this.ctx];
    this.mode = (["year", "style", "family", "hs"] as const).find((x) => x === m.mode) ?? "year";
    this.openG = new Map(Object.entries(m.open) as [SortMode, string][]); this.scrollY = m.scroll; this.opened = m.row; this.selected = m.pick;
  }
  /** 宿主存歌 / 存设备时取（开着的话先把现在翻到哪收进来）。 */
  memo(ctx: FinderCtx): FinderMemo { if (ctx === this.ctx) this.stash(); return this.memos[ctx]; }
  /** 换歌 / 开机时放回（null = 新的：按年代、全收着、在顶上）。 */
  restore(ctx: FinderCtx, m: FinderMemo | null): void {
    this.memos[ctx] = m ?? freshFinderMemo();
    if (ctx !== this.ctx) return;
    this.unstash();
    if (this.isOpen && this.cat) { this.el.querySelector<HTMLSelectElement>(".finder-sort")!.value = this.mode; this.render(); this.el.querySelector<HTMLElement>(".finder-list")!.scrollTop = this.scrollY; this.markJump(); }
  }
  /** 顶条「键盘」钮亮不亮（宿主在键盘开 / 关时告诉它）。 */
  setPadShown(on: boolean): void { this.el.querySelector(".finder-pad")?.classList.toggle("is-on", on); }
  async show(o: { playOnly?: boolean } = {}): Promise<void> {
    const ctx: FinderCtx = o.playOnly ? "impro" : "song";
    if (ctx !== this.ctx) { this.stash(); this.ctx = ctx; this.unstash(); }   // 歌里 ↔ 即兴：各记各的
    this.el.hidden = false; this.playOnly = !!o.playOnly;
    this.el.querySelector(".finder-title")!.textContent = this.playOnly ? _t("乐器目录（弹着玩）") : _t("找人给「{p}」", { p: this.host.roleName() });
    this.el.querySelector('[data-v="back"]')!.textContent = this.playOnly ? _t("← 歌库") : _t("← 谱");
    this.el.querySelector(".finder-hint")!.textContent = this.playOnly ? _t("点一件乐器 → 挑谁来演 → 用键盘弹着玩。要给歌里的声部选乐器：开一首歌，点谱前面的声部名。") : HINT;
    this.el.querySelector<HTMLSelectElement>(".finder-sort")!.value = this.mode;
    if (!this.cat) {
      this.loading ??= (async () => {
        const [cat, sprite] = await Promise.all([loadCatalog(), loadIconSprite()]);
        const doc = new DOMParser().parseFromString(sprite, "image/svg+xml"), svg = doc.documentElement;
        if (svg.tagName.toLowerCase() === "svg") { const node = document.importNode(svg, true) as unknown as SVGElement; node.setAttribute("style", "display:none"); this.el.prepend(node); }
        this.cat = cat;
      })().catch((e) => { this.el.querySelector(".finder-list")!.innerHTML = `<div class="finder-empty">${_t("目录加载不了：{Error}", { Error: esc((e as Error).message) })}</div>`; throw e; }).finally(() => { this.loading = null; });
      await this.loading;
    }
    this.render();
    // 回到上次翻到的地方（F-197）；试听跟着亮着的那一项（关掉再开：亮着的是上次选的，键盘就弹它；点开的那件没人能演 = 静音。原来关目录 = 试听清空、键盘回到哼，和亮着的对不上）
    const list = this.el.querySelector<HTMLElement>(".finder-list")!; list.scrollTop = this.scrollY; this.markJump();
    const openedC = this.opened ? this.cat!.byId.get(this.opened.split("::")[1]) : undefined;
    if (this.selected) void this.host.audition(this.pickOf(this.selected));
    else if (openedC) void this.host.audition({ kind: "none", concept: openedC });
  }
  hide(): void { if (this.el.hidden) return; this.stash(); this.el.hidden = true; this.host.memoChanged?.(this.ctx, this.memos[this.ctx]); }
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
    if (v === "group" && btn) { this.toggleGroup(btn.closest<HTMLElement>("[data-gid]")!.dataset.gid!); return; }
    if (v && btn) {
      const key = btn.closest<HTMLElement>("[data-p]")?.dataset.p ?? "", pick = this.pickOf(key); if (!pick) return;
      if (v === "play") { await this.host.playHead(pick); return; }
      if (v === "cast") { await this.host.cast(pick); return; }
    }
    if (prov) { const key = prov.dataset.p!; if (this.selected !== key) { this.selected = key; this.renderAnchored(rowOf(prov)); await this.host.audition(this.pickOf(key)); } return; }
    if (row) {
      const id = row.dataset.c!, o = row.dataset.o!;
      this.openG.set(this.mode, o.split("::")[0]);   // 搜索时点开的那件：清掉搜索后展开的就是它那一组
      if (this.opened === o) this.opened = null;
      else { this.opened = o; const c = this.cat!.byId.get(id)!, pk = row.dataset.k, first = providersOf(this.cat!, c).find((x) => !pk || gmKey(x) === pk); /* 音色行 = 试听它自己 */ const key = first ? `${id}|${gmKey(first)}` : c.kind === "voice" ? `${id}|voice` : ""; this.selected = key; this.renderAnchored(o, true); await this.host.audition(key ? this.pickOf(key) : { kind: "none", concept: c }); return; }
      this.renderAnchored(o);
    }
  }
  render(): void {
    const list = this.el.querySelector(".finder-list")!; if (!this.cat) return;
    const groups = groupConcepts(this.cat, this.mode, this.q), jump = this.el.querySelector<HTMLElement>(".finder-jump")!;
    // 类级跳转（user 2026-10-08「分类能不能有一个类级别的跳转功能，不然一个一个下拉很累」）：一组一项，选了列表滚到那组；只有一组就不出。
    //   做成下拉（user 同日「category选项能做成下拉而不是滑动吗」；原来是横着滑的一排粒）
    jump.hidden = groups.length < 2;
    jump.querySelector("select")!.innerHTML = groups.map((g, k) => `<option value="${k}">${_t("{label} · {n} 件", { label: esc(g.label), n: g.items.length })}</option>`).join("");
    if (!groups.length) { list.innerHTML = `<div class="finder-empty">${_t("没有叫「{q}」的", { q: esc(this.q) })}</div>`; return; }
    // 多列（2026-10-09，user「挑乐曲界面到时候屏幕空间够的话做成多列的，好挑一点」）：每组里的行放进自适应网格（styles.css .finder-items：每格至少 320 px，窄屏一列）；
    //   点开的「谁能演」紧跟在行后面（DOM 顺序不变），横跨整行、落在那件乐器所在那一行的下面（grid dense，同一行别的格子不被挤走）
    // 手风琴（v0.16.3，user 11-07「选乐器的每个category自动collapse，而且只能expand一个」）：默认全收着、只露组头（名字 + 件数）；点组头 = 展开它、别的收起，再点 = 收起。
    //   搜索时（框里有字）不收、只有一组也不收；收着的组不画里面的行（DOM 少，大目录也轻）
    const acc = !this.q.trim() && groups.length > 1, openId = this.openG.get(this.mode);
    list.innerHTML = groups.map((g, k) => {
      const on = !acc || g.id === openId;
      return `<div class="finder-group${acc ? " acc" : ""}${on ? " is-open" : ""}" data-g="${k}" data-gid="${esc(g.id)}"><div class="finder-group-h"${acc ? ` data-v="group" role="button" aria-expanded="${on}" title="${on ? _t("收起这一组") : _t("展开这一组（别的收起）")}"` : ""}>` +
        `${acc ? `<svg class="ico fg-chev" aria-hidden="true"><use href="#chevron-down"/></svg>` : ""}<span class="fg-label">${esc(g.label)}</span><span>${g.items.length}</span></div>` +
        (on ? `<div class="finder-items">${g.items.map((e) => this.rowHtml(e, g.id)).join("")}</div>` : "") + `</div>`;
    }).join("");
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
  /** 手风琴：展开 / 收起一组（只能开一组）。展开 = 那一组的组头滚到列表顶上；收起 = 组头留在屏幕上原来的位置。 */
  private toggleGroup(gid: string): void {
    const list = this.el.querySelector<HTMLElement>(".finder-list")!, sel = `[data-gid="${CSS.escape(gid)}"]`;
    const closing = this.openG.get(this.mode) === gid, before = list.querySelector<HTMLElement>(sel)?.getBoundingClientRect().top;
    if (closing) this.openG.delete(this.mode); else this.openG.set(this.mode, gid);
    this.render();
    const g = list.querySelector<HTMLElement>(sel); if (!g) return;
    list.scrollTop += g.getBoundingClientRect().top - (closing && before !== undefined ? before : list.getBoundingClientRect().top);
    this.markJump();
  }
  /** 列表滚到第 k 组的组头（只滚列表自己，不用 scrollIntoView——它会连带滚外层）；收着的先展开（手风琴）。 */
  private jumpTo(k: number): void {
    const list = this.el.querySelector<HTMLElement>(".finder-list")!;
    const g0 = list.querySelector<HTMLElement>(`[data-g="${k}"]`);
    if (g0?.classList.contains("acc") && !g0.classList.contains("is-open")) { this.openG.set(this.mode, g0.dataset.gid!); this.render(); }
    const g = list.querySelector<HTMLElement>(`[data-g="${k}"]`); if (!g) return;
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
    const asConcept = e.as ? cat.byId.get(e.as) : null, asName = e.as ? (asConcept ? conceptName(asConcept.names) : e.as) : "", asTag = asName ? `<span class="inst-as" title="${_t("在这种风里顶替「{asName}」", { asName: esc(asName) })}">${_t("顶 {asName}", { asName: esc(asName) })}</span>` : "";
    const year = e.preset?.year ?? c.year, approx = e.preset ? !!(e.preset as { yearApprox?: boolean }).yearApprox : c.yearApprox;
    const meta = [eraLabel(cat, c), year !== null && year !== undefined ? `${approx ? _t("约 ") : ""}${fmtYear(year)}` : ""].filter(Boolean).join(" · ");
    let body = "";
    if (open) {
      // 月读只在人声类概念下面（user 2026-10-07「为什么月读可以全量平替所有乐器…也许不大合适」：她实现的是人声，不是小提琴；
      //   「让她哼一下这条线听听」归监听方式（草稿听，契约 §1），不是选角）
      const provs = providersOf(cat, c).filter((x) => !pk || gmKey(x) === pk), pitched = c.kind === "voice";   // 音色行 = 只列它自己
      // 平替弱化显示（user「平替换的ui也需要弄出区别」「也许需要弱化显示」）：虚线框、灰字、「顶替」标
      const prov = (key: string, label: string, note: string, playable: boolean, sub = false) => `<div class="prov${this.selected === key ? " is-on" : ""}${sub ? " sub" : ""}" data-p="${esc(key)}"><div class="prov-l"><b>${sub ? `<span class="prov-tag">${_t("顶替")}</span>` : ""}${label}</b>${note ? `<small>${note}</small>` : ""}</div>` +
        `<div class="prov-b">${playable ? `<button class="btn" data-v="play" title="${_t("用它放这条声部的开头")}">${_t("▶ 听开头")}</button>` : ""}${this.playOnly ? "" : `<button class="btn primary" data-v="cast" title="${_t("选它来演这个声部，回到乐器页")}">${_t("选这个")}</button>`}</div></div>`;
      body = `<div class="inst-prov">` +
        provs.map((p) => prov(`${c.id}|${gmKey(p)}`, `${p.note !== undefined ? _t("鼓件 · {gmName}（Standard 鼓组的 {note} 号键）", { gmName: esc(p.gmName), note: p.note }) : p.bank === 128 ? _t("鼓组 · {gmName}", { gmName: esc(p.gmName) }) : `GeneralUser GS · ${esc(p.gmName)}`}`, p.kind === "substitute" ? _t("顶替{p}{reason}", { p: p.basis === "official" ? _t("（GM 原文认可）") : p.basis === "lineage" ? _t("（前身）") : p.basis === "imitation" ? _t("（仿声）") : p.basis === "family" ? _t("（同类）") : _t("（只是同名）"), reason: p.reason && zhOnly(p.reason) ? `：${esc(p.reason)}` : "" }) : "", true, p.kind === "substitute")).join("") +
        (pitched ? prov(`${c.id}|voice`, _t("小月相"), _t("唱歌词；没写歌词的音按「哼的字」唱"), false) : "") +
        (!provs.length && !pitched ? `<div class="prov-none">${_t("目录里还没有谁能演它")}</div>` : "") + `</div>`;
    }
    return `<div class="inst-row${open ? " is-open" : ""}" data-c="${esc(c.id)}" data-o="${esc(o)}"${pk ? ` data-k="${esc(pk)}"` : ""}>` +
      (icon ? `<svg class="inst-ico" aria-hidden="true"><use href="#${esc(icon)}"/></svg>` : `<span class="inst-ico none">${esc(conceptName(c.names).slice(0, 1))}</span>`) +
      `<div class="inst-name"><b><span class="zh">${esc(conceptName(c.names))}</span>${e.preset ? `<span class="inst-preset"> · ${esc(e.preset.gmName)}</span>` : ""}${asTag}</b>${stars}<span data-i18n-skip>${esc(conceptAlt(roleNameOf(c), c.names))}</span></div><div class="inst-meta">${esc(meta)}</div></div>` + body;
  }
}
