// finder.ts —— 找人视图：全屏（替掉谱区，pad 留着当试听键盘），按**乐器概念**浏览百科目录，点一个提供者 = 载进实时合成器、pad 直接弹它；「上场」= 角色改成这个概念 + 造演奏者。
// created 2026-10-07 by Claude Fable 5.1。user 2026-10-07「找人视图同意，然后最好是全屏的而不是弹出窗口，类似gallery，然后能用这个音乐键盘」「默认按年代排哈哈哈」
//   「试听不生成演奏者」（试听台 = 临时槽；只在「上场」时才 by value 造演奏者）「顺序本来就是先选概念再选演奏者」。
// 数据 = src/gm/catalog.ts（vendor/instruments/ 的两张表 + 图标 sprite）；音频 / 选角归 host（src/app/main.ts）。
import { dropdownHtml, mountDropdowns, setDropdown } from "./dropdown.ts";
import { conceptName, conceptAlt, defLabel, zhOnly } from "../gm/catalog-i18n.ts";
import { freshFinderMemo, type FinderMemo } from "../score/desk.ts";
import { _t, lang } from "../i18n/index.ts";
import { deviceKvGet, deviceKvSet } from "../device-kv.ts";
import { loadCatalog, loadIconSprite, groupConcepts, providersOf, roleNameOf, eraLabel, fmtYear, gmKey, weightLabel, SORT_LABEL, type Catalog, type Concept, type Entry, type Provider, type SortMode } from "../gm/catalog.ts";

export type FinderPick = { kind: "gs"; concept: Concept; provider: Provider } | { kind: "voice"; concept: Concept; light?: true } | OwnPick;   // light = 小月相（元音）
/** 自己的 .sf2 文件里的一件（v0.16.37，施工单 §4.3）：字节留在宿主，目录只拿预设清单。没有乐器概念（目录不认识这件），谱上的名字不跟着换。 */
export interface OwnPick { kind: "sf2"; bank: number; program: number; name: string }
/** 打开的 .sf2 文件：文件名 + 里面的预设（bank 128 = 鼓组）。 */
export interface OwnFile { name: string; presets: { bank: number; program: number; name: string }[] }
/** 点开的那件乐器目录里没有谁能演 = 试听键盘静音（不是还弹着上一件的声音；v0.15.7，家族周账 F-210，user 11-07「如果选中的那个类别里面没有合适的音源的时候，我在即兴的时候应该是静音，而不是显示弹在上一个音源」）。 */
export type FinderNobody = { kind: "none"; concept: Concept };
export interface FinderHost {
  roleName(): string;                                          // 现在的角色名（顶条写「找人给「X」」）
  audition(p: FinderPick | FinderNobody | null): Promise<void>;     // 试听台：载进实时合成器（pad 弹它）；none = 静音；null = 停（回到默认的哼）
  playHead(p: FinderPick): Promise<void>;                            // 用它放本声部开头
  cast(p: FinderPick): Promise<void>;                                // 上场（声音默认弱引用：歌里只记来源，要带着走 = 文件菜单「全部打包进歌」）
  /** 先不换，加成新声部试试（v0.16.63，user 11-09 定的：「台下」不做，只补这颗小钮）：加一个声部放它、开「弹」。没有 = 不出这颗钮（「＋ 新声部」那一路本来就是新的）。 */
  tryNew?(p: FinderPick): Promise<void>;
  canTryNew?(): boolean;
  close(): void;
  togglePad(): void;                                                 // 顶条「键盘」：开 / 关试听键盘（user 2026-10-08「音色预览也应该能toggle键盘，免得没弹出来」）
  /** 关目录时：这一份记忆（翻到哪）变了。即兴 = 宿主存到设备上；歌里的 = 宿主存歌时顺手带（v0.16.6）。 */
  memoChanged?(ctx: FinderCtx, m: FinderMemo): void;
  /** 这首歌的乐器预设（目录顶上第二排；v0.16.38 = 施工单 §5 R4：本声部台上那位 + 调过的，别的声部调过的）。on = 正在台上；here = 本声部的；
   *  from = 在哪个声部上（别的声部的格子角上写）；removable = 能删；icon = 乐器图标的编号（目录 sprite 里的，没有 = 首字）。 */
  used?(): PresetTile[];
  /** 点了本声部的一位 = 换上（角色名 / 乐器跟着换回，同 v0.16.15）。 */
  useCandidate?(id: string): void;
  /** 拷一份到本声部、换上（别的声部的 = R5；本声部的「复制一份」= R6）。 */
  copyPreset?(role: string, id: string): void;
  /** 删本声部的一位（R7：台上的、内置的不能删；它嵌在歌里的声音一起丢；能撤销）。 */
  removeCandidate?(id: string): void;
  /** 顶条「打开 .sf2…」：宿主开选文件框；读好了调 setOwnFile 把清单交回来。 */
  ownSf2?(): void;
  /** 常用一行（设备设置；没有 = DEFAULT_PINS）/ 改了存回去。 */
  pins?(): PinTile[];
  setPins?(p: PinTile[]): void;
}
/** 常用一行的一格（v0.16.36；施工单 ai-docs/20261109-work-order-instrument-pick-vs-tune.md §4.1 / §9）：c = 乐器概念的编号，job = 它管哪一层（只有默认那几格写）。
 *  记在设备上、跟人走，不跟歌走（user 11-09「置顶…跟着用户设置走，就不跟着歌走」）；每一格能换成任何乐器、能拿掉，不按种类拦（「用哪个你别护栏」）。 */
export interface PinTile { c: string; job?: PinJob }
/** 「这首歌的乐器预设」一格。 */
export interface PresetTile { role: string; id: string; name: string; on: boolean; here: boolean; from: string; removable: boolean; icon?: string }
export type PinJob = "melody" | "harmony" | "melody2" | "accomp" | "pad" | "rhythm" | "bass";
/** 默认七格 = 摸每一层最顺手的那件（user 11-09「那几个钦定的乐器，实际上就是摸某个东西最有用的」「合成器就是弦乐…还是用最经典的」）。
 *  节奏那一格：目录里还没有「整套鼓组」这一条（鼓的设计排在后面），先放小鼓。 */
export const DEFAULT_PINS: readonly PinTile[] = [
  { c: "Q7390", job: "melody" }, { c: "Q5994", job: "harmony" }, { c: "Q209554", job: "melody2" }, { c: "Q2563510", job: "accomp" },
  { c: "Q2997126", job: "pad" }, { c: "Q208421", job: "rhythm" }, { c: "Q46185", job: "bass" },
];
const JOB_LABEL = (j: PinJob): string => ({ melody: _t("旋律"), harmony: _t("和弦"), melody2: _t("第二旋律"), accomp: _t("伴奏"), pad: _t("铺底"), rhythm: _t("节奏"), bass: _t("低音") })[j];
/** 记忆归谁：歌里打开的 = 这首歌（文件里）；歌库「即兴」打开的 = 这台设备（app）。user 11-07「即兴的滚动归 App 记，然后文件内的滚动归文件记」。 */
export type FinderCtx = "song" | "impro";
const HINT = _t("点一件乐器 → 挑谁来演 → 用右边的键盘试 → 「选这个」= 换上。目录不关，放着歌也能接着换；回谱点「← 谱」。谱上的名字跟着换成那件乐器。");   // 不叫「上场」：user 2026-10-10「选乐器不要用上场这个词不然让会让人以为直接跳回主界面，但是实际上我们还是回到乐器配置界面」
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
  private swallow = false;                  // 长按开了小菜单：接下来那一下 click 不算点
  private replacing: number | null = null;  // 常用一行「换成…」：下一下点列表里的哪件 = 换进第几格
  private own: OwnFile | null = null;       // 打开的 .sf2（列表最上面一组；关目录 = 没了）
  /** 隐藏找不到的乐器（目录里没有谁能演它、平替也没有 = 不列）；记在这台设备上，默认开（v0.16.56，user 11-09「选乐器的时候加一个隐藏找不到（包括平替）的乐器的选项。然后默认开」「免得一开始几个都是not avaliable now」）。 */
  private hideNone = deviceKvGet("finder-hide-none") !== "0";
  constructor(parent: HTMLElement, host: FinderHost) {
    this.host = host;
    this.el = document.createElement("div"); this.el.className = "finder"; this.el.hidden = true;
    this.el.innerHTML = `<div class="finder-bar"><button class="btn" data-v="back" title="${_t("回到谱（Esc）")}">${_t("← 谱")}</button><span class="finder-title"></span>` +
      `<input class="finder-q" type="search" placeholder="${_t("搜乐器（中 / 英 / 日）")}" spellcheck="false" autocomplete="off" />` +
      dropdownHtml((Object.keys(SORT_LABEL) as SortMode[]).map((m) => ({ value: m, label: SORT_LABEL[m] })), this.mode, { cls: "finder-sort" }) +   // 下拉 = 界面零件库的标准件（7-T）
      `<button class="btn finder-file" data-v="ownsf2" title="${_t("自己的 .sf2 文件：选中的那一件切出来留在这台设备上，歌里只记来源")}" hidden>${_t("打开 .sf2…")}</button>` +   // v0.16.36：从预设那一排挪到顶条（user 11-09「自己的 SF2 的入口感觉不应该放在这儿」）
      `<button class="btn finder-pad" data-v="pad" title="${_t("试听键盘：开 / 关")}"><svg class="ico"><use href="#piano-keys"/></svg><span>${_t("键盘")}</span></button></div>` +
      `<div class="finder-hint">${HINT}</div><div class="finder-pins" hidden></div><div class="finder-used" hidden></div>` +
      `<div class="finder-jump" hidden><span class="finder-jump-go"><span>${_t("跳到")}</span>${dropdownHtml([], "0", { cls: "finder-jump-sel", title: _t("列表滚到这一组") })}</span>` +
      `<button class="btn finder-hide" aria-pressed="false">${_t("隐藏找不到的")}</button></div>` +   // 开关放第二排右端（v0.16.56）：顶条在窄屏 / 英文已经满了
      `<div class="finder-list"><div class="finder-empty">${_t("加载目录…")}</div></div>`;
    parent.append(this.el);   // 位置由 #stage 的 grid 命名区域钉死（.finder 占 main、pad 占 pad），和节点顺序无关（user「keyboard不应该用flex，这是一个很固定的有着很严密逻辑的东西」）
    this.el.querySelector<HTMLInputElement>(".finder-q")!.addEventListener("input", (e) => { this.q = (e.target as HTMLInputElement).value; this.render(); });
    mountDropdowns(this.el);
    this.el.querySelector<HTMLButtonElement>(".finder-sort")!.addEventListener("change", (e) => { this.mode = (e.target as HTMLButtonElement).value as SortMode; this.render(); });
    this.el.querySelector<HTMLElement>(".finder-hide")!.addEventListener("click", (e) => { e.stopPropagation(); this.hideNone = !this.hideNone; deviceKvSet("finder-hide-none", this.hideNone ? null : "0"); this.render(); });
    this.el.querySelector<HTMLButtonElement>(".finder-jump-sel")!.addEventListener("change", (e) => this.jumpTo(Number((e.target as HTMLButtonElement).value)));
    this.el.addEventListener("click", (e) => { if (this.swallow) { this.swallow = false; e.preventDefault(); e.stopPropagation(); return; } void this.onClick(e); });
    // 长按（手指 / 笔）或右键：常用一格 = 换成… / 拿掉；列表里一件乐器 = 置顶 / 取消置顶（v0.16.36）
    this.el.addEventListener("contextmenu", (e) => { const t = this.pinTarget(e.target as HTMLElement); if (!t) return; e.preventDefault(); this.pinMenu(t); });
    this.el.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return;
      const t = this.pinTarget(e.target as HTMLElement); if (!t) return;
      const x0 = e.clientX, y0 = e.clientY, id = e.pointerId;
      const stop = () => { clearTimeout(timer); removeEventListener("pointermove", mv, true); removeEventListener("pointerup", stop, true); removeEventListener("pointercancel", stop, true); };
      const mv = (m: PointerEvent) => { if (m.pointerId === id && Math.hypot(m.clientX - x0, m.clientY - y0) > 10) stop(); };
      const timer = window.setTimeout(() => { stop(); this.swallow = true; this.pinMenu(t); }, 480);
      addEventListener("pointermove", mv, true); addEventListener("pointerup", stop, true); addEventListener("pointercancel", stop, true);
    });
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
    this.mode = (["year", "style", "kind", "family", "hs"] as const).find((x) => x === m.mode) ?? "year";
    this.openG = new Map(Object.entries(m.open) as [SortMode, string][]); this.scrollY = m.scroll; this.opened = m.row; this.selected = m.pick;
  }
  /** 宿主存歌 / 存设备时取（开着的话先把现在翻到哪收进来）。 */
  memo(ctx: FinderCtx): FinderMemo { if (ctx === this.ctx) this.stash(); return this.memos[ctx]; }
  /** 换歌 / 开机时放回（null = 新的：按年代、全收着、在顶上）。 */
  restore(ctx: FinderCtx, m: FinderMemo | null): void {
    this.memos[ctx] = m ?? freshFinderMemo();
    if (ctx !== this.ctx) return;
    this.unstash();
    if (this.isOpen && this.cat) { setDropdown(this.el.querySelector<HTMLElement>(".finder-sort")!, { value: this.mode }); this.render(); this.el.querySelector<HTMLElement>(".finder-list")!.scrollTop = this.scrollY; this.markJump(); }
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
    setDropdown(this.el.querySelector<HTMLElement>(".finder-sort")!, { value: this.mode });
    this.el.querySelector<HTMLElement>(".finder-file")!.hidden = this.playOnly || !this.host.ownSf2;
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
  /** 换上一件乐器之后（目录不关，v0.16.35）：顶条的名字和「这首歌里用过的」那一排跟着变。 */
  refresh(): void { if (this.el.hidden) return; if (!this.playOnly) this.el.querySelector(".finder-title")!.textContent = _t("找人给「{p}」", { p: this.host.roleName() }); this.renderUsed(); }
  hide(): void {
    if (this.el.hidden) return;
    if (this.selected.startsWith("sf2|")) this.selected = "";   // 自己文件里的那件：关目录 = 字节放掉，下次开不再指着它
    this.own = null; this.stash(); this.el.hidden = true; this.host.memoChanged?.(this.ctx, this.memos[this.ctx]);
  }
  /** 宿主读好了一个 .sf2（null = 收起这一组）：列表最上面出现「⟨文件名⟩（N 件）」，滚到顶上。 */
  setOwnFile(f: OwnFile | null): void {
    this.own = f && f.presets.length ? f : null;
    if (!this.own && this.selected.startsWith("sf2|")) this.selected = "";
    if (this.el.hidden) return;
    this.render();
    if (this.own) this.el.querySelector<HTMLElement>(".finder-list")!.scrollTop = 0;
  }
  private pickOf(key: string): FinderPick | null {
    if (key.startsWith("sf2|")) { const [b, pr] = key.slice(4).split(":").map(Number), x = this.own?.presets.find((q) => q.bank === b && q.program === pr); return x ? { kind: "sf2", bank: x.bank, program: x.program, name: x.name } : null; }
    if (!this.cat) return null;
    const [cid, rest] = key.split("|"), c = this.cat.byId.get(cid); if (!c) return null;
    if (rest === "voice") return { kind: "voice", concept: c };
    if (rest === "vowel") return { kind: "voice", concept: c, light: true };
    const p = providersOf(this.cat, c).find((x) => gmKey(x) === rest);
    return p ? { kind: "gs", concept: c, provider: p } : null;
  }
  private async onClick(e: Event): Promise<void> {
    const t = e.target as HTMLElement, btn = t.closest<HTMLElement>("[data-v]"), row = t.closest<HTMLElement>(".inst-row"), prov = t.closest<HTMLElement>(".prov");
    const rowOf = (el: HTMLElement) => (el.closest(".inst-prov")?.previousElementSibling as HTMLElement | null)?.dataset.o ?? "";   // 提供者所在的那一行（组::概念）
    const v = btn?.dataset.v;
    if (v === "back") { this.host.close(); return; }
    if (v === "pad") { this.host.togglePad(); return; }
    if (v === "use" && btn) { const t = this.presetOf(btn); if (!t) return; if (t.here) { if (!t.on) this.host.useCandidate?.(t.id); } else this.host.copyPreset?.(t.role, t.id); this.renderUsed(); return; }
    if (v === "ownsf2") { this.host.ownSf2?.(); return; }
    if (v === "owndrop") { this.setOwnFile(null); void this.host.audition(null); return; }
    if (v === "group" && btn) { this.toggleGroup(btn.closest<HTMLElement>("[data-gid]")!.dataset.gid!); return; }
    if (v === "pin" && btn) { await this.tapPin(Number(btn.dataset.pin)); return; }
    if (v === "pinmenu" && btn) { this.pinAct(btn.dataset.act!, btn.dataset.arg!); return; }
    if (v === "unreplace") { this.replacing = null; this.renderPins(); return; }
    if (v && btn) {
      const key = btn.closest<HTMLElement>("[data-p]")?.dataset.p ?? "", pick = this.pickOf(key); if (!pick) return;
      if (v === "play") { await this.host.playHead(pick); return; }
      if (v === "cast") { await this.host.cast(pick); return; }
      if (v === "trynew") { await this.host.tryNew?.(pick); return; }
    }
    if (prov) { const key = prov.dataset.p!; if (this.selected !== key) { this.selected = key; if (key.startsWith("sf2|")) this.renderPinned(`.prov[data-p="${CSS.escape(key)}"]`); else this.renderAnchored(rowOf(prov)); await this.host.audition(this.pickOf(key)); } return; }
    if (row && this.replacing !== null && this.host.setPins) {   // 「换成…」：点的这件换进那一格（不按种类拦）
      const pins = this.pinsNow(), k = this.replacing; this.replacing = null;
      if (pins[k]) { pins[k] = { ...pins[k], c: row.dataset.c! }; this.host.setPins(pins); }
      this.renderPins(); return;
    }
    if (row) {
      const id = row.dataset.c!, o = row.dataset.o!;
      this.openG.set(this.mode, o.split("::")[0]);   // 搜索时点开的那件：清掉搜索后展开的就是它那一组
      if (this.opened === o) this.opened = null;
      else { this.opened = o; const c = this.cat!.byId.get(id)!, pk = row.dataset.k, first = providersOf(this.cat!, c).find((x) => !pk || gmKey(x) === pk); /* 音色行 = 试听它自己 */ const key = first ? `${id}|${gmKey(first)}` : c.kind === "voice" ? `${id}|voice` : ""; this.selected = key; this.renderAnchored(o, true); await this.host.audition(key ? this.pickOf(key) : { kind: "none", concept: c }); return; }
      this.renderAnchored(o);
    }
  }
  private pinsNow(): PinTile[] { const p = this.host.pins?.(); return (p && p.length ? p : DEFAULT_PINS).map((x) => ({ ...x })); }
  /** 一格点下去用谁：人声类 = 小月相；别的 = 目录里第一位能演的（本尊在前）；都没有 = null。 */
  private pinPick(c: Concept): FinderPick | null { if (c.kind === "voice") return { kind: "voice", concept: c }; const p = providersOf(this.cat!, c)[0]; return p ? { kind: "gs", concept: c, provider: p } : null; }
  private pinKey(c: Concept): string { const p = this.pinPick(c); return !p ? "" : p.kind === "gs" ? `${c.id}|${gmKey(p.provider)}` : `${c.id}|voice`; }
  /** 常用一行（v0.16.36）：一样大的格子横着排（放不下横着滑；家规：按钮堆看到就改成格子）——图标 + 名字 + 管哪一层。点 = 换上（弹着玩 = 试听）。 */
  renderPins(): void {
    const box = this.el.querySelector<HTMLElement>(".finder-pins")!; box.hidden = !this.cat || !this.host.pins; if (box.hidden) return;
    const cat = this.cat!, pins = this.pinsNow();
    box.innerHTML = (this.replacing !== null ? `<div class="fp-replacing">${_t("点下面一件乐器，换进这一格")}<button class="btn" data-v="unreplace">${_t("算了")}</button></div>` : "") +
      `<div class="fp-row">${pins.map((pin, k) => {
        const c = cat.byId.get(pin.c); if (!c) return "";
        const name = c.kind === "voice" ? _t("小月相") : lang() === "zh" ? conceptName(c.names) : roleNameOf(c), icon = c.icon?.id, on = this.playOnly && this.selected === this.pinKey(c);   // 英文界面用谱上那种短名字（Flute，不是 Western concert flute）
        return `<button class="fp-tile${on ? " is-on" : ""}${this.replacing === k ? " is-replacing" : ""}" data-v="pin" data-pin="${k}" title="${esc(_t("点 = 换上「{name}」；长按（右键）= 换成别的 / 拿掉", { name }))}">` +
          (icon ? `<svg class="fp-ico" aria-hidden="true"><use href="#${esc(icon)}"/></svg>` : `<span class="fp-ico none">${esc(name.slice(0, 1))}</span>`) +
          `<span class="fp-name">${esc(name)}</span>${pin.job ? `<span class="fp-job">${esc(JOB_LABEL(pin.job))}</span>` : ""}</button>`;
      }).join("")}</div>`;
  }
  private async tapPin(k: number): Promise<void> {
    if (this.replacing !== null) { this.replacing = null; this.renderPins(); return; }
    const pin = this.pinsNow()[k], c = pin && this.cat?.byId.get(pin.c); if (!c) return;
    const pick = this.pinPick(c);
    if (!pick) { await this.host.audition({ kind: "none", concept: c }); return; }
    this.selected = this.pinKey(c);
    if (this.playOnly) { this.renderPins(); this.render(); await this.host.audition(pick); return; }
    await this.host.cast(pick);
  }
  private presetOf(el: HTMLElement): PresetTile | null { const k = Number(el.closest<HTMLElement>("[data-preset]")?.dataset.preset ?? -1); return this.presets[k] ?? null; }
  private presets: PresetTile[] = [];
  private pinTarget(t: HTMLElement): { kind: "tile"; k: number; el: HTMLElement } | { kind: "row"; c: string; el: HTMLElement } | { kind: "preset"; t: PresetTile; el: HTMLElement } | null {
    const pre = t.closest<HTMLElement>("[data-preset]"); if (pre) { const x = this.presetOf(pre); return x ? { kind: "preset", t: x, el: pre } : null; }
    if (!this.host.setPins) return null;
    const tile = t.closest<HTMLElement>("[data-pin]"); if (tile) return { kind: "tile", k: Number(tile.dataset.pin), el: tile };
    const row = t.closest<HTMLElement>(".inst-row"); if (row) return { kind: "row", c: row.dataset.c!, el: row };
    return null;
  }
  /** 长按 / 右键的小菜单（浮在那一格 / 那一行下面）。 */
  private pinMenu(t: NonNullable<ReturnType<Finder["pinTarget"]>>): void {
    this.el.querySelector(".finder-pinmenu")?.remove();
    const pins = this.pinsNow(), items: [string, string, string][] = t.kind === "preset"
      ? [["pcopy", String(this.presets.indexOf(t.t)), t.t.here ? _t("复制一份") : _t("拷到这个声部")], ...(t.t.removable ? [["pdel", String(this.presets.indexOf(t.t)), _t("删掉")] as [string, string, string]] : [])]
      : t.kind === "tile"
      ? [["replace", String(t.k), _t("换成…")], ["unpin", String(t.k), _t("拿掉")]]
      : pins.some((p) => p.c === t.c) ? [["unpinc", t.c, _t("取消置顶")]] : [["pinc", t.c, _t("置顶到常用")]];
    const m = document.createElement("div"); m.className = "finder-pinmenu";
    m.innerHTML = items.map(([act, arg, label]) => `<button class="btn ctx-item" data-v="pinmenu" data-act="${act}" data-arg="${esc(arg)}">${esc(label)}</button>`).join("");
    const r = t.el.getBoundingClientRect(); m.style.left = `${Math.max(8, Math.min(r.left, innerWidth - 180))}px`; m.style.top = `${Math.min(r.bottom + 4, innerHeight - 90)}px`;
    this.el.append(m);
    const off = (e: PointerEvent) => { if (!m.contains(e.target as Node)) { m.remove(); removeEventListener("pointerdown", off, true); } };
    setTimeout(() => addEventListener("pointerdown", off, true), 0);
  }
  private pinAct(act: string, arg: string): void {
    this.el.querySelector(".finder-pinmenu")?.remove();
    if (act === "pcopy" || act === "pdel") {
      const x = this.presets[Number(arg)]; if (!x) return;
      if (act === "pcopy") this.host.copyPreset?.(x.role, x.id); else this.host.removeCandidate?.(x.id);
      this.renderUsed(); return;
    }
    const pins = this.pinsNow();
    if (act === "replace") { this.replacing = Number(arg); this.renderPins(); return; }
    if (act === "unpin") pins.splice(Number(arg), 1);
    else if (act === "unpinc") { const k = pins.findIndex((p) => p.c === arg); if (k >= 0) pins.splice(k, 1); }
    else if (act === "pinc") pins.push({ c: arg });
    this.host.setPins?.(pins); this.renderPins();
  }
  /** 顶上第二排「这首歌的乐器预设」（歌里打开的才有；弹着玩没有）：和常用一行一样大的格子（图标 + 名字）。
   *  点本声部的一格 = 换上；点别的声部的（角上写「在 ⟨声部⟩ 上」）= 拷一份过来换上，那边不动；长按 / 右键 = 复制一份 / 删掉（v0.16.38，施工单 §4.1 / §5）。 */
  renderUsed(): void {
    const box = this.el.querySelector<HTMLElement>(".finder-used")!;
    box.hidden = this.playOnly || !this.host.used;
    if (box.hidden) { this.presets = []; return; }
    const used = (this.presets = this.host.used?.() ?? []);
    box.innerHTML = `<div class="fu-k">${_t("这首歌的乐器预设")}</div><div class="fp-row">${used.map((u, k) => {
      const tip = u.on ? _t("正在台上；长按（右键）= 复制一份") : u.here ? _t("点 = 换上；长按（右键）= 复制一份 / 删掉") : _t("点 = 拷一份到这个声部、换上（「{from}」那边不动）", { from: u.from });
      return `<button class="fp-tile${u.on ? " is-on" : ""}${u.here ? "" : " is-other"}" data-v="use" data-preset="${k}" title="${esc(tip)}">` +
        (u.icon ? `<svg class="fp-ico" aria-hidden="true"><use href="#${esc(u.icon)}"/></svg>` : `<span class="fp-ico none">${esc(u.name.slice(0, 1))}</span>`) +
        `<span class="fp-name">${esc(u.name)}</span>${u.here ? "" : `<span class="fp-job">${esc(_t("在 {from} 上", { from: u.from }))}</span>`}</button>`;
    }).join("")}</div>`;
  }
  render(): void {
    this.renderPins(); this.renderUsed();
    const list = this.el.querySelector(".finder-list")!; if (!this.cat) return;
    // 隐藏找不到的（开关在顶条）：没有谁能演它（目录里的提供者连平替都没有、也不是人声）= 不列；音色行本来就有人演。同一件在几个组里都有 = 只算一件
    const cat = this.cat, hiddenIds = new Set<string>();
    const playable = (e: Entry) => !!e.preset || e.concept.kind === "voice" || providersOf(cat, e.concept).length > 0;
    const groups = groupConcepts(cat, this.mode, this.q).map((g) => {
      if (!this.hideNone) return g;
      const items = g.items.filter((e) => playable(e) || (hiddenIds.add(e.concept.id), false));
      return items.length === g.items.length ? g : { ...g, items };
    }).filter((g) => g.items.length), jump = this.el.querySelector<HTMLElement>(".finder-jump")!;
    const hb = this.el.querySelector<HTMLElement>(".finder-hide")!;
    hb.classList.toggle("is-on", this.hideNone); hb.setAttribute("aria-pressed", String(this.hideNone));
    hb.title = this.hideNone ? _t("开着：目录里没有谁能演（连平替也没有）的乐器不列出来（这一页藏了 {n} 件）。点一下 = 全列出来", { n: hiddenIds.size }) : _t("关着：所有乐器都列出来，没有谁能演的也在。点一下 = 藏起来");
    // 类级跳转（user 2026-10-08「分类能不能有一个类级别的跳转功能，不然一个一个下拉很累」）：一组一项，选了列表滚到那组；只有一组就不出。
    //   做成下拉（user 同日「category选项能做成下拉而不是滑动吗」；原来是横着滑的一排粒）
    jump.hidden = false; jump.querySelector<HTMLElement>(".finder-jump-go")!.hidden = groups.length < 2;   // 这一排一直在（右端是「隐藏找不到的」）；只有一组 / 搜索时只藏「跳到」
    setDropdown(jump.querySelector<HTMLElement>(".finder-jump-sel")!, { items: groups.map((g, k) => ({ value: String(k), label: _t("{label} · {n} 件", { label: g.label, n: g.items.length }) })), value: "0" });
    const own = this.ownHtml();
    if (!groups.length) { list.innerHTML = own + (own ? "" : `<div class="finder-empty">${hiddenIds.size ? _t("没有叫「{q}」的能演的乐器（藏着 {n} 件没有谁能演的：关掉「隐藏找不到的」能看到）", { q: esc(this.q), n: hiddenIds.size }) : _t("没有叫「{q}」的", { q: esc(this.q) })}</div>`); return; }
    // 多列（2026-10-09，user「挑乐曲界面到时候屏幕空间够的话做成多列的，好挑一点」）：每组里的行放进自适应网格（styles.css .finder-items：每格至少 320 px，窄屏一列）；
    //   点开的「谁能演」紧跟在行后面（DOM 顺序不变），横跨整行、落在那件乐器所在那一行的下面（grid dense，同一行别的格子不被挤走）
    // 手风琴（v0.16.3，user 11-07「选乐器的每个category自动collapse，而且只能expand一个」）：默认全收着、只露组头（名字 + 件数）；点组头 = 展开它、别的收起，再点 = 收起。
    //   搜索时（框里有字）不收、只有一组也不收；收着的组不画里面的行（DOM 少，大目录也轻）
    const acc = !this.q.trim() && groups.length > 1, openId = this.openG.get(this.mode);
    list.innerHTML = own + groups.map((g, k) => {
      const on = !acc || g.id === openId;
      return `<div class="finder-group${acc ? " acc" : ""}${on ? " is-open" : ""}" data-g="${k}" data-gid="${esc(g.id)}"><div class="finder-group-h"${acc ? ` data-v="group" role="button" aria-expanded="${on}" title="${on ? _t("收起这一组") : _t("展开这一组（别的收起）")}"` : ""}>` +
        `${acc ? `<svg class="ico fg-chev" aria-hidden="true"><use href="#chevron-down"/></svg>` : ""}<span class="fg-label">${esc(g.label)}</span><span>${g.items.length}</span></div>` +
        (on ? `<div class="finder-items">${g.items.map((e) => this.rowHtml(e, g.id)).join("")}</div>` : "") + `</div>`;
    }).join("");
    this.markJump();
  }
  /** 一位能演的（一行）：名字 + 小字 + 「▶ 听开头」「选这个」。目录里的提供者和自己文件里的那几件共用（v0.16.37）。 */
  private provHtml(key: string, label: string, note: string, playable: boolean, sub = false): string {
    return `<div class="prov${this.selected === key ? " is-on" : ""}${sub ? " sub" : ""}" data-p="${esc(key)}"><div class="prov-l"><b>${sub ? `<span class="prov-tag">${_t("顶替")}</span>` : ""}${label}</b>${note ? `<small>${note}</small>` : ""}</div>` +
      `<div class="prov-b">${playable ? `<button class="btn" data-v="play" title="${_t("用它放这条声部的开头")}">${_t("▶ 听开头")}</button>` : ""}${this.playOnly || !this.host.tryNew || !this.host.canTryNew?.() ? "" : `<button class="btn prov-try" data-v="trynew" title="${_t("先不换：加一个新声部放它，开「弹」看着谱弹着试（台上这位不动）")}" aria-label="${_t("加成新声部试试")}">${_t("＋ 声部")}</button>`}${this.playOnly ? "" : `<button class="btn primary" data-v="cast" title="${_t("选它来演这个声部（目录不关，可以接着换）")}">${_t("选这个")}</button>`}</div></div>`;
  }
  /** 打开的 .sf2 那一组（列表最上面；施工单 §4.3）：按 乐器 / 变体 / 鼓组 分小节，一件一行；点一行 = 试听，「选这个」= 换上。
   *  搜索框里有字 = 只列名字里有它的。组头的 × = 收起这一组（字节一起放掉）。 */
  private ownHtml(): string {
    const f = this.own; if (!f) return "";
    const q = this.q.trim().toLowerCase(), ps = q ? f.presets.filter((x) => x.name.toLowerCase().includes(q)) : f.presets;
    if (q && !ps.length) return "";
    const banks = [...new Set(ps.map((x) => x.bank))].sort((a, b) => a - b);
    const label = (b: number) => (b === 128 ? _t("鼓组") : b === 0 ? _t("乐器") : _t("变体（bank {b}）", { b }));
    return `<div class="finder-group finder-own is-open"><div class="finder-group-h"><span class="fg-label">${esc(_t("{name}（{n} 件）", { name: f.name, n: f.presets.length }))}</span>` +
      `<button class="btn fo-drop" data-v="owndrop" title="${_t("收起这个文件（字节放掉，要再用就重新打开）")}" aria-label="${_t("收起这个文件")}">×</button></div>` +
      `<div class="fo-note">${_t("选的那一件切出来留在这台设备上，歌里只记来源（歌小）。要歌自己带着声音 = 文件菜单「全部打包进歌」，或导出「打包音源」的副本。")}</div>` +
      banks.map((b) => `<div class="fo-sub">${label(b)}</div><div class="inst-prov fo-list">${ps.filter((x) => x.bank === b).map((x) =>
        this.provHtml(`sf2|${x.bank}:${x.program}`, `${String(x.program).padStart(3, "0")} ${esc(x.name)}`, "", true)).join("")}</div>`).join("") + `</div>`;
  }
  /** 重画，把 sel 选中的那个元素钉在屏幕上原来的位置（只滚列表自己）。 */
  private renderPinned(sel: string): void {
    const list = this.el.querySelector<HTMLElement>(".finder-list")!, before = list.querySelector<HTMLElement>(sel)?.getBoundingClientRect().top;
    this.render();
    const el = list.querySelector<HTMLElement>(sel); if (el && before !== undefined) list.scrollTop += el.getBoundingClientRect().top - before;
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
    const list = this.el.querySelector<HTMLElement>(".finder-list")!, jump = this.el.querySelector<HTMLElement>(".finder-jump")!; if (jump.hidden || jump.querySelector<HTMLElement>(".finder-jump-go")!.hidden) return;
    const sel = jump.querySelector<HTMLButtonElement>(".finder-jump-sel")!, top = list.getBoundingClientRect().top + 1;
    let cur = 0;
    for (const g of list.querySelectorAll<HTMLElement>("[data-g]")) { if (g.getBoundingClientRect().top <= top) cur = Number(g.dataset.g); else break; }
    const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 2;
    if (atBottom && Number(sel.value) > cur) return;
    if (sel.value !== String(cur)) setDropdown(sel, { value: String(cur) });
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
      const prov = (key: string, label: string, note: string, playable: boolean, sub = false) => this.provHtml(key, label, note, playable, sub);
      body = `<div class="inst-prov">` +
        (pitched ? prov(`${c.id}|voice`, _t("小月相"), _t("唱歌词；没写歌词的音按「哼的字」唱"), false) : "") +   // 人声里小月相排第一（v0.16.36；user「小月相的优先级肯定是高于那两个 O 和 A」）
        // 元音版紧跟着（v0.16.38）：没调过的内置两位不进「这首歌的乐器预设」（施工单 §5 R4），常用一行只有完整版——元音版（破设备兜底）放在这里才点得到
        (pitched ? prov(`${c.id}|vowel`, _t("小月相（元音）"), _t("只哼「哼的字」、不唱歌词；轻，破设备也带得动"), false) : "") +
        provs.map((p) => prov(`${c.id}|${gmKey(p)}`, `${p.note !== undefined ? _t("鼓件 · {gmName}（Standard 鼓组的 {note} 号键）", { gmName: esc(p.gmName), note: p.note }) : p.bank === 128 ? _t("鼓组 · {gmName}", { gmName: esc(p.gmName) }) : `GeneralUser GS · ${esc(p.gmName)}`}`, p.kind === "substitute" ? _t("顶替{p}{reason}", { p: p.basis === "official" ? _t("（GM 原文认可）") : p.basis === "lineage" ? _t("（前身）") : p.basis === "imitation" ? _t("（仿声）") : p.basis === "family" ? _t("（同类）") : _t("（只是同名）"), reason: p.reason && zhOnly(p.reason) ? `：${esc(p.reason)}` : "" }) : "", true, p.kind === "substitute")).join("") +

        (!provs.length && !pitched ? `<div class="prov-none">${_t("目录里还没有谁能演它")}</div>` : "") + `</div>`;
    }
    return `<div class="inst-row${open ? " is-open" : ""}" data-c="${esc(c.id)}" data-o="${esc(o)}"${pk ? ` data-k="${esc(pk)}"` : ""}>` +
      (icon ? `<svg class="inst-ico" aria-hidden="true"><use href="#${esc(icon)}"/></svg>` : `<span class="inst-ico none">${esc(conceptName(c.names).slice(0, 1))}</span>`) +
      `<div class="inst-name"><b><span class="zh">${esc(conceptName(c.names))}</span>${e.preset ? `<span class="inst-preset"> · ${esc(e.preset.gmName)}</span>` : ""}${asTag}</b>${stars}<span data-i18n-skip>${esc(conceptAlt(roleNameOf(c), c.names))}</span></div><div class="inst-meta">${esc(meta)}</div></div>` + body;
  }
}
