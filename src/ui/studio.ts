// studio.ts —— 混音台（「听」的底座；user 2026-10-10「能不能混音台就是听的键盘」）。谱留着能看。
// created 2026-10-08 by Claude Fable 5.1（一个声部一条：名字 / 谁来演 / 增益 dB / 声像 / 静音 / 独奏 + 总轨）。
// 2026-10-10 v0.10.8（Claude Opus 5.5）：每条轨一排插件格（src/ui/plugins.ts）——歌手轨第一格 = 默认 EQ（没碰过 = 不在文件里 = 平；能关、能换面板，不能删），
//   「＋」= 往这条轨插任何插件；面板 = 一键 / 全量（同一组参数的两种看法）。数据 = studio.json v2 现成的效果链（FxV2），不升格式。
// v0.10.9：混音轨（路由轨）——出到 / 发送 / 总线接总线。
// v0.10.10：**按插件分页**（user「把不同插件的tab切换给放在混音台的顶栏上，然后所有卡片统一显示对应插件的操作和仪表盘？比如最基础的模式就是gain和pan
//   然后峰值放在卡片的顶部一条细线，所有插件模式都有…然后不同模式下面具体用哪个插件显示模式可以下拉。然后basic模式下如果有advanced的和basic preset不一样的情况需要披露」→「12都同意」）：
//   页签 = 混音的顺序（基础 = 增益 / 声像 / 静音独奏 → EQ → 压缩 → 发送 → 链 = 全部插件格）；EQ / 压缩页每张卡片直接摊开那一格的控件（一键 / 全量下拉，全部卡片一起换）；
//   每张卡片顶上一条峰值细线（所有页都有；录音房只在混音台开着时报）。加混音轨在页签那一行的「⋯」里（user「混音轨不要用一个单独的空页面，可以在混音台的顶栏上面加一个...的目录，里面有加混音轨。然后混音轨之间还可以排序。然后歌手卡片的排序还是以五线谱为准」）。
import type { FxV2 } from "../format/contract.ts";
import { DEFAULT_EQ_ID, PLUGIN_KINDS, simpleView, freshParams, fullParams, fxSummary, paramsOf, pluginName, fullyWet, paramView, type Params } from "./plugins.ts";

export interface StudioStrip { id: string; name: string; performer: string; gainDb: number; pan: number; muted: boolean; solo: boolean; refs: number; color?: string }   // color = 类别色（卡片顶边，v0.9.31）   // refs = 在几张纸上（0 = 能删）
export interface StudioHost {
  strips(): StudioStrip[];
  setGain(id: string, dB: number): void;
  setPan(id: string, pan: number): void;
  toggleMute(id: string): void;
  toggleSolo(id: string): void;
  play(): void;
  close(): void;
  /** 删一位一张纸都不在的歌手（歌手管理；纸上不删）。 */
  deletePart(id: string): void;
  /** 总轨（2026-10-10 刀 3）：增益 dB + 母线限幅开关；进歌（studio.json master）。 */
  master(): { gainDb: number; limiter: boolean };
  setMasterGain(dB: number): void;
  toggleLimiter(): void;
  /** 一条轨的效果链（MASTER = 总轨；别的 = 歌手的 id / 混音轨的 id）。 */
  chain(track: string): FxV2[];
  /** 改一条轨的效果链（进 undo；merge = 连续拖同一个旋钮并成一步的键）。 */
  setChain(track: string, chain: FxV2[], label: string, merge?: string): void;
  /** 压缩「被谁压」能选的轨（除了自己；没有 = 这条轨上的压缩器只听自己）。 */
  keyTracks(track: string): { id: string; name: string }[];
  // 路由轨（v0.10.9）：歌手轨和输出（总轨）是内置的，混音轨自己加（user「有一个默认总线，就是歌手和输出都是builtin的，但是你可以加混音轨」）
  buses(): { id: string; name: string; gainDb: number; pan: number }[];
  addBus(): string;
  removeBus(id: string): void;
  renameBus(id: string, name: string): void;
  /** 混音轨往前 / 往后挪一位（只在混音轨之间）。 */
  moveBus(id: string, dir: -1 | 1): void;
  setBusGain(id: string, dB: number): void;
  setBusPan(id: string, pan: number): void;
  /** 出到哪（"master" / 路由轨 id）。 */
  outTo(track: string): string;
  setOutTo(track: string, to: string): void;
  /** 推子后发给哪些路由轨。 */
  sends(track: string): { to: string; gainDb: number }[];
  setSends(track: string, sends: { to: string; gainDb: number }[], label: string, merge?: string): void;
  /** 这条轨能出到 / 发给的路由轨（不含自己、不含会接成环的）。 */
  targets(track: string): { id: string; name: string }[];
}
export const MASTER = "__master";
export type MixTab = "basic" | "eq" | "comp" | "send" | "chain";
/** 页签 = 混音的顺序（平衡 / 摆位 → 频率 → 动态 → 空间；最后一页是全部插件格）。 */
const TABS: { id: MixTab; label: string; hint: string }[] = [
  { id: "basic", label: "基础", hint: "增益、声像、静音 / 独奏：先把几条轨的音量摆平、左右摆开（混音的第一步）" },
  { id: "eq", label: "EQ", hint: "每条轨的默认 EQ：两样东西糊在一起、太闷 / 太刺" },
  { id: "comp", label: "压缩", hint: "每条轨上的第一个压缩：把忽大忽小拉平" },
  { id: "send", label: "发送", hint: "出到哪、推子后发给哪几条混音轨（混响 / 延迟放在混音轨上，几条轨共用）" },
  { id: "chain", label: "链", hint: "每条轨上的全部插件格：随便插、开关、拿掉" },
];
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const panText = (p: number) => (Math.abs(p) < 0.025 ? "中" : p < 0 ? `左 ${Math.round(-p * 100)}` : `右 ${Math.round(p * 100)}`);
const dbText = (d: number) => `${d > 0 ? "+" : ""}${d.toFixed(1)} dB`;
const toDb = (x: number) => (x > 1e-5 ? 20 * Math.log10(x) : -60);
/** 一行参数：名字 + 小方块问号（iPad 点了在这一行下面展开说明；桌面悬停也有）+ 读数 + 控件（v0.10.10；user「每个参数能不能加一个tooltip解释一下是干什么用的」「然后参数后面加一个小的方块问号这样ipad也可以点」）。 */
function row(label: string, hint: string, out: string, control: string, cls = "fx-row"): string {
  return `<div class="${cls}" title="${esc(hint)}"><span class="row-lab">${esc(label)}<button class="q" type="button" data-v="help" aria-label="这是什么">?</button> ${out}</span>${control}<div class="row-help">${esc(hint)}</div></div>`;
}
const HINT = {
  gain: "增益（推子）：这条轨整体的音量。混音的第一步 = 先把几条轨的音量摆平",
  pan: "声像：在左右哪个位置。几条轨左右错开一点，就不会都挤在正中间",
  masterGain: "总轨增益：所有轨混在一起之后整体再调大调小",
  out: "出到：这条轨的声音最后去哪——直接去总轨，或者先进一条混音轨（在那里一起过效果）",
  send: "发送：推子之后再复制一份给这条混音轨；越大，那边的效果（混响 / 延迟）越多，原声照旧走「出到」",
  key: "被谁压（侧链）：压缩器不看自己，而看另一条轨有多响——比如月读一唱，伴奏自己让一点",
};
/** 一格的位置：哪条轨的哪一格（插件格的读写、面板和卡片上摊开的控件都按它找）。 */
interface Target { track: string; fx: string }

export class Studio {
  readonly el: HTMLDivElement;
  private tab: MixTab = "basic";
  /** EQ / 压缩页摊开的控件用一键还是全量（全部卡片一起换；这次打开里有效）。 */
  private panelMode: Record<"eq" | "comp", "simple" | "full"> = { eq: "simple", comp: "simple" };
  /** 「链」页顶上展开着的插件面板：哪条轨的哪一格 + 一键 / 全量。 */
  private open: { track: string; fx: string; mode: "simple" | "full" } | null = null;
  private addFor: string | null = null;   // 「链」页「＋」的小菜单开在哪条轨
  private menuOpen = false;               // 页签那一行的「⋯」
  // 峰值细线：录音房每 ~21 ms 报一次（推子后）；画的时候涨得快、落得慢（每秒 30 dB），只在看得见、有声音时跑动画
  private target = new Map<string, number>();
  private shown = new Map<string, number>();
  private raf = 0; private lastTick = 0; private lastMeter = 0;
  constructor(parent: HTMLElement, private host: StudioHost) {
    this.el = document.createElement("div"); this.el.className = "studio"; this.el.hidden = true;
    this.el.innerHTML = `<div class="finder-bar"><span class="finder-title">混音台</span><button class="btn" data-v="back" title="收起混音台：底座让出来、还在「听」（Esc = 回去写）">收起</button><button class="btn" data-v="play" title="播放（空格）"><svg class="ico"><use href="#play"/></svg></button></div>` +
      `<div class="mix-tabbar"></div><div class="mix-menu" hidden></div><div class="fx-panel" data-fxwrap hidden></div><div class="studio-strips"></div>`;
    parent.append(this.el);
    this.el.addEventListener("click", (e) => this.onClick(e));
    this.el.addEventListener("input", (e) => this.onInput(e));
    this.el.addEventListener("change", (e) => this.onChange(e));
    this.el.addEventListener("dblclick", (e) => {   // 双击推子 = 回到 0
      const t = e.target as HTMLInputElement, strip = t.closest<HTMLElement>(".strip"); if (!strip || t.tagName !== "INPUT") return;
      const id = strip.dataset.id!;
      if (t.dataset.master !== undefined) this.host.setMasterGain(0); else if (t.dataset.gain !== undefined) this.host.setGain(id, 0); else if (t.dataset.pan !== undefined) this.host.setPan(id, 0);
      else if (t.dataset.busgain !== undefined) this.host.setBusGain(id, 0); else if (t.dataset.buspan !== undefined) this.host.setBusPan(id, 0); else return;
      this.render();
    });
  }
  get isOpen(): boolean { return !this.el.hidden; }
  get currentTab(): MixTab { return this.tab; }
  show(): void { this.el.hidden = false; this.render(); }
  hide(): void { this.el.hidden = true; this.menuOpen = false; }

  // ── 峰值 ────────────────────────────────────────────────────────────────
  /** 录音房报的峰值（0–1；总轨 = 出声口；tracks = 每条轨 / 混音轨推子后）。 */
  meter(peak: number, tracks: Record<string, number> = {}): void {
    this.target.set(MASTER, peak); for (const [k, v] of Object.entries(tracks)) this.target.set(k, v);
    this.lastMeter = performance.now();
    const val = this.el.querySelector<HTMLElement>(".meter-val"); if (val) { const db = toDb(peak); val.textContent = db <= -59 ? "—" : `${db.toFixed(1)} dB`; }
    if (!this.raf && !this.el.hidden) { this.lastTick = performance.now(); this.raf = requestAnimationFrame(this.tick); }
  }
  private tick = (now: number): void => {
    this.raf = 0; if (this.el.hidden) return;
    const dt = Math.min(0.1, (now - this.lastTick) / 1000); this.lastTick = now;
    const stale = now - this.lastMeter > 200;   // 一阵没报了 = 当它静了
    let alive = false;
    for (const el of this.el.querySelectorAll<HTMLElement>(".strip[data-id]")) {
      const id = el.dataset.id!, raw = stale ? 0 : this.target.get(id) ?? 0, want = toDb(raw), cur = this.shown.get(id) ?? -60;
      const next = want >= cur ? want : Math.max(want, cur - 30 * dt);
      this.shown.set(id, next); if (next > -59.5) alive = true;
      const bar = el.querySelector<HTMLElement>(".strip-meter > i");
      if (bar) { bar.style.width = `${Math.max(0, Math.min(100, ((next + 60) / 60) * 100))}%`; bar.classList.toggle("hot", raw >= 0.98); }
    }
    if (alive || !stale) this.raf = requestAnimationFrame(this.tick);
  };

  // ── 事件 ────────────────────────────────────────────────────────────────
  private targetOf(el: Element): Target | null { const w = el.closest<HTMLElement>("[data-fxwrap]"); return w?.dataset.track && w.dataset.fx ? { track: w.dataset.track, fx: w.dataset.fx } : null; }
  private onClick(e: Event): void {
    const t = e.target as HTMLElement, v = t.closest<HTMLElement>("[data-v]")?.dataset.v, strip = t.closest<HTMLElement>(".strip")?.dataset.id, tg = this.targetOf(t);
    if (!v) return;
    if (v === "help") { t.closest(".fx-row, .strip-row")?.classList.toggle("show-help"); return; }   // 小问号：这一行下面展开 / 收起说明
    if (v === "back") this.host.close();
    else if (v === "play") this.host.play();
    else if (v === "tab") { this.tab = t.closest<HTMLElement>("[data-tab]")!.dataset.tab as MixTab; this.menuOpen = false; this.addFor = null; this.render(); }
    else if (v === "more") { this.menuOpen = !this.menuOpen; this.render(); }
    else if (v === "addbus") { this.menuOpen = false; const id = this.host.addBus(); this.render(); this.el.querySelector<HTMLElement>(`.strip[data-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: "nearest" }); }
    else if (v === "mute" && strip) { this.host.toggleMute(strip); this.render(); }
    else if (v === "solo" && strip) { this.host.toggleSolo(strip); this.render(); }
    else if (v === "delpart" && strip) this.host.deletePart(strip);
    else if (v === "limiter") { this.host.toggleLimiter(); this.render(); }
    else if (v === "delbus" && strip) { if (this.open?.track === strip) this.open = null; this.host.removeBus(strip); this.render(); }
    else if ((v === "busleft" || v === "busright") && strip) { this.host.moveBus(strip, v === "busleft" ? -1 : 1); this.render(); }
    else if (v === "sendx" && strip) { const to = t.closest<HTMLElement>("[data-to]")!.dataset.to!; this.host.setSends(strip, this.host.sends(strip).filter((x) => x.to !== to), `不再发给 ${this.trackName(to)}`); this.render(); }
    else if (v === "fx" && strip) { const id = t.closest<HTMLElement>("[data-fx]")!.dataset.fx!; this.toggleOpen(strip, id); }
    else if (v === "fxadd" && strip) { this.addFor = this.addFor === strip ? null : strip; this.render(); }
    else if (v === "fxpick" && strip) this.addFx(strip, t.closest<HTMLElement>("[data-kind]")!.dataset.kind!, true);
    else if (v === "fxaddkind" && strip) this.addFx(strip, t.closest<HTMLElement>("[data-kind]")!.dataset.kind!, false);
    else if (v === "fxmode" && this.open) { this.open.mode = t.closest<HTMLElement>("[data-mode]")!.dataset.mode as "simple" | "full"; this.renderPanel(); }
    else if (v === "fxclose") { this.open = null; this.render(); }
    else if (v === "fxdel" && tg) this.deleteFx(tg);
    else if (v === "fxon" && tg) { this.patch(tg, (fx) => ({ ...fx, on: fx.on === false }), "开 / 关"); this.render(); }
    else if (v === "fxtoggle" && tg) { const id = t.closest<HTMLElement>("[data-c]")!.dataset.c!; this.simpleSet(tg, id, (this.simpleNow(tg)?.[id] ?? 0) ? 0 : 1, false); this.render(); }
    else if (v === "fxchoice" && tg) { const b = t.closest<HTMLElement>("[data-c]")!; this.simpleSet(tg, b.dataset.c!, Number(b.dataset.val), false); this.render(); }
    else if (v === "fxbool" && tg) { const id = t.closest<HTMLElement>("[data-p]")!.dataset.p!; this.patch(tg, (fx) => ({ ...fx, params: { ...paramsOf(fx), [id]: paramsOf(fx)[id] ? 0 : 1 } }), id); this.render(); }
  }
  private onInput(e: Event): void {
    const t = e.target as HTMLInputElement, tg = this.targetOf(t);
    if (tg && t.dataset.c !== undefined) { this.simpleSet(tg, t.dataset.c, Number(t.value), true, t); return; }   // 一键的旋钮
    if (tg && t.dataset.p !== undefined) { this.fullSet(tg, t); return; }                                       // 全量的参数
    const strip = t.closest<HTMLElement>(".strip"); if (!strip) return;
    const id = strip.dataset.id!, out = t.parentElement?.querySelector("output"), v = Number(t.value);
    if (t.dataset.send !== undefined) { const to = t.dataset.send; this.host.setSends(id, this.host.sends(id).map((x) => (x.to === to ? { ...x, gainDb: v } : x)), `发给 ${this.trackName(to)} ${dbText(v)}`, `send:${id}:${to}`); if (out) out.textContent = dbText(v); }
    else if (t.dataset.busgain !== undefined) { this.host.setBusGain(id, v); if (out) out.textContent = dbText(v); }
    else if (t.dataset.buspan !== undefined) { this.host.setBusPan(id, v); if (out) out.textContent = panText(v); }
    else if (t.dataset.master !== undefined) { this.host.setMasterGain(v); if (out) out.textContent = dbText(v); }
    else if (t.dataset.gain !== undefined) { this.host.setGain(id, v); if (out) out.textContent = dbText(v); }
    else if (t.dataset.pan !== undefined) { this.host.setPan(id, v); if (out) out.textContent = panText(v); }
  }
  private onChange(e: Event): void {
    const t = e.target as HTMLSelectElement & HTMLInputElement, strip = t.closest<HTMLElement>(".strip")?.dataset.id, tg = this.targetOf(t);
    if (t.dataset.panelmode !== undefined && (this.tab === "eq" || this.tab === "comp")) { this.panelMode[this.tab] = t.value as "simple" | "full"; this.render(); return; }
    if (strip && t.dataset.out !== undefined) { this.host.setOutTo(strip, t.value); this.render(); return; }
    if (strip && t.dataset.sendadd !== undefined && t.value) { this.host.setSends(strip, [...this.host.sends(strip), { to: t.value, gainDb: -12 }], `发给 ${this.trackName(t.value)}`); this.render(); return; }
    if (strip && t.classList.contains("bus-name")) { const name = t.value.trim(); if (name) this.host.renameBus(strip, name); this.render(); return; }
    if (tg && t.dataset.key !== undefined) { const v = t.value; this.patch(tg, (fx) => { const { key: _k, ...rest } = fx; return v ? { ...rest, key: v } : rest; }, "被谁压"); this.render(); }
  }

  // ── 插件格 ──────────────────────────────────────────────────────────────
  /** 一条轨显示的格子：歌手轨 / 混音轨没有默认 EQ 那一格 = 补一个虚的（平，不在文件里）。 */
  private slots(track: string): { fx: FxV2; virtual: boolean }[] {
    const ch = this.host.chain(track), out = ch.map((fx) => ({ fx, virtual: false }));
    if (track !== MASTER && !ch.some((f) => f.id === DEFAULT_EQ_ID)) out.unshift({ fx: { id: DEFAULT_EQ_ID, kind: "eq", params: freshParams("eq") }, virtual: true });
    return out;
  }
  private slotOf(tg: Target): { fx: FxV2; virtual: boolean } | null { return this.slots(tg.track).find((s) => s.fx.id === tg.fx) ?? null; }
  private onBus(track: string): boolean { return this.host.buses().some((b) => b.id === track); }
  private trackName(track: string): string { return track === MASTER || track === "master" ? "总轨" : this.host.strips().find((s) => s.id === track)?.name ?? this.host.buses().find((b) => b.id === track)?.name ?? track; }
  private toggleOpen(track: string, fx: string): void {
    if (this.open && this.open.track === track && this.open.fx === fx) this.open = null;
    else { const s = this.slotOf({ track, fx }); this.open = { track, fx, mode: s && simpleView(s.fx.kind, this.onBus(track))?.read(paramsOf(s.fx)) ? "simple" : "full" }; }
    this.addFor = null; this.render();
  }
  private addFx(track: string, kind: string, openPanel: boolean): void {
    const ch = this.host.chain(track), used = new Set(ch.map((f) => f.id)); let n = 1; while (used.has(`${kind}${n}`)) n++;
    const fx: FxV2 = { id: `${kind}${n}`, kind, params: freshParams(kind, this.onBus(track)) };
    this.host.setChain(track, [...ch, fx], `${this.trackName(track)} 插上${pluginName(kind)}`);
    this.addFor = null; if (openPanel) this.open = { track, fx: fx.id, mode: "simple" }; this.render();
  }
  /** 改一格（虚的默认 EQ = 第一次改的时候写进链的最前面）。 */
  private patch(tg: Target, f: (fx: FxV2) => FxV2, what: string, merge = false): void {
    const s = this.slotOf(tg); if (!s) return;
    const ch = this.host.chain(tg.track), nx = f(s.fx);
    const next = s.virtual ? [nx, ...ch] : ch.map((x) => (x.id === tg.fx ? nx : x));
    this.host.setChain(tg.track, next, `${this.trackName(tg.track)} ${pluginName(nx.kind)} ${what}`, merge ? `fx:${tg.track}:${tg.fx}:${what}` : undefined);
    const b = this.el.querySelector<HTMLElement>(`.strip[data-id="${CSS.escape(tg.track)}"] [data-fx="${CSS.escape(nx.id)}"]`);
    if (b) { b.textContent = fxSummary(nx, this.onBus(tg.track)); b.classList.toggle("off", nx.on === false); }
  }
  private deleteFx(tg: Target): void {
    if (tg.fx === DEFAULT_EQ_ID) return;
    const ch = this.host.chain(tg.track), gone = ch.find((x) => x.id === tg.fx);
    this.host.setChain(tg.track, ch.filter((x) => x.id !== tg.fx), `${this.trackName(tg.track)} 拿掉${pluginName(gone?.kind ?? "")}`);
    if (this.open && this.open.track === tg.track && this.open.fx === tg.fx) this.open = null;
    this.render();
  }
  private simpleNow(tg: Target): Record<string, number> | null { const s = this.slotOf(tg); return s ? simpleView(s.fx.kind, this.onBus(tg.track))?.read(paramsOf(s.fx)) ?? null : null; }
  /** 一键改一个控件：在当前读数上改这一个（读不出 = 在全量里调过 = 从一键的默认起），按公式写回全量参数。 */
  private simpleSet(tg: Target, id: string, v: number, live: boolean, input?: HTMLElement): void {
    const s = this.slotOf(tg); if (!s) return;
    const bus = this.onBus(tg.track), view = simpleView(s.fx.kind, bus)!, base = view.read(paramsOf(s.fx)) ?? view.read(freshParams(s.fx.kind, bus)) ?? {};
    const ctl = view.controls.find((c) => c.id === id);
    this.patch(tg, (fx) => ({ ...fx, params: view.write({ ...base, [id]: v }, paramsOf(fx)) }), ctl?.label ?? id, live);
    if (live && input) { const w = input.closest("[data-fxwrap]"); const out = w?.querySelector<HTMLElement>(`output[data-c="${id}"]`); if (out && ctl?.fmt) out.textContent = ctl.fmt(v); w?.querySelector(".fx-note")?.remove(); }
  }
  private fullSet(tg: Target, t: HTMLInputElement): void {
    const s = this.slotOf(tg); if (!s) return;
    const id = t.dataset.p!, d = fullParams(s.fx.kind).find((x) => x.id === id); if (!d) return;
    const sl = paramView(s.fx.kind, d), v = sl.toV(Number(t.value));
    this.patch(tg, (fx) => ({ ...fx, params: { ...paramsOf(fx), [id]: v } }), d.label, true);
    const out = t.parentElement?.querySelector("output"); if (out) out.textContent = sl.fmt(v);
  }

  // ── 画 ──────────────────────────────────────────────────────────────────
  /** 一格的控件（一键 / 全量）：「链」页顶上的面板和 EQ / 压缩页卡片上摊开的共用。 */
  private controlsHtml(tg: Target, fx: FxV2, mode: "simple" | "full"): string {
    const bus = this.onBus(tg.track), p = paramsOf(fx), view = simpleView(fx.kind, bus), read = view?.read(p) ?? null;
    const keyOpts = fx.kind === "comp" ? this.host.keyTracks(tg.track) : [];
    const keyRow = keyOpts.length ? row("被谁压", HINT.key, "", `<select data-key><option value="">不用（自己压自己）</option>${keyOpts.map((x) => `<option value="${esc(x.id)}"${fx.key === x.id ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select>`) : "";
    if (mode === "simple" && view) {
      const cur = read ?? view.read(freshParams(fx.kind, bus)) ?? {};
      return (read ? "" : `<div class="fx-note">在全量里调过（不是一键的样子）；动这里会改回一键的样子。</div>`) + view.controls.map((c) => {
        const v = cur[c.id] ?? 0;
        if (c.kind === "toggle") return row(c.label, c.hint, "", `<button class="btn cand${v ? " is-on" : ""}" data-v="fxtoggle" data-c="${c.id}">${v ? "开" : "关"}</button>`);
        if (c.kind === "choice") return row(c.label, c.hint, "", `<span class="fx-seg">${c.choices!.map((x) => `<button class="btn${Math.abs(v - x.v) < 1e-6 ? " is-on" : ""}" data-v="fxchoice" data-c="${c.id}" data-val="${x.v}">${esc(x.label)}</button>`).join("")}</span>`);
        return row(c.label, c.hint, `<output data-c="${c.id}">${c.fmt ? c.fmt(v) : v}</output>`, `<input type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${v}" data-c="${c.id}" />`);
      }).join("") + keyRow;
    }
    return fullParams(fx.kind).map((d) => {
      const sl = paramView(fx.kind, d);
      if (d.unit === "bool") return row(sl.label, sl.hint, "", `<button class="btn cand${p[d.id] ? " is-on" : ""}" data-v="fxbool" data-p="${d.id}">${p[d.id] ? "开" : "关"}</button>`);
      if (fx.kind === "eq" && d.id === "hpHz" && p.hpAuto) return row(sl.label, sl.hint, "", `<span class="fx-dim">自动（按这个声部最低的音）</span>`);
      return row(sl.label, sl.hint, `<output>${sl.fmt(p[d.id])}</output>`, `<input type="range" min="${sl.min}" max="${sl.max}" step="${sl.step}" value="${sl.toS(p[d.id])}" data-p="${d.id}" />`);
    }).join("") + keyRow;
  }
  /** EQ / 压缩页：这条轨上第一格这种插件，摊在卡片上（没有 = 「＋」）。 */
  private inlineHtml(track: string, kind: "eq" | "comp"): string {
    const all = this.slots(track).filter((s) => s.fx.kind === kind), s = all[0];
    if (!s) return `<button class="btn cand" data-v="fxaddkind" data-kind="${kind}" title="往这条轨上插一个${pluginName(kind)}">＋ ${esc(pluginName(kind))}</button>`;
    const fx = s.fx, tg = { track, fx: fx.id };
    return `<div class="fx-inline${fx.on === false ? " off" : ""}" data-fxwrap data-track="${esc(track)}" data-fx="${esc(fx.id)}">` +
      `<div class="fx-inline-head"><button class="btn cand${fx.on === false ? "" : " is-on"}" data-v="fxon" title="关 = 这一格跳过（参数留着）">${fx.on === false ? "关着" : "开着"}</button>${all.length > 1 ? `<span class="fx-dim">还有 ${all.length - 1} 个${esc(pluginName(kind))}在「链」里</span>` : ""}</div>` +
      `<div class="fx-body">${this.controlsHtml(tg, fx, this.panelMode[kind])}</div></div>`;
  }
  /** 出到 + 发送（歌手轨和路由轨都有；总轨没有）。 */
  private routeHtml(track: string): string {
    const out = this.host.outTo(track), tg = this.host.targets(track), sends = this.host.sends(track), name = (id: string) => esc(this.trackName(id));
    const outSel = row("出到", HINT.out, "", `<select data-out>${[{ id: "master", name: "总轨" }, ...tg].map((x) => `<option value="${esc(x.id)}"${out === x.id ? " selected" : ""}>${esc(x.name)}</option>`).join("")}${out !== "master" && !tg.some((x) => x.id === out) ? `<option value="${esc(out)}" selected>${name(out)}（接不上）</option>` : ""}</select>`, "strip-row");
    const rows = sends.map((sd) => `<div class="strip-send">${row(`发给 ${this.trackName(sd.to)}`, HINT.send, `<output>${dbText(sd.gainDb)}</output>`, `<input type="range" min="-40" max="6" step="0.5" value="${sd.gainDb}" data-send="${esc(sd.to)}" />`, "strip-row")}<button class="btn" data-v="sendx" data-to="${esc(sd.to)}" title="不再发给它">✕</button></div>`).join("");
    const free = tg.filter((x) => !sends.some((sd) => sd.to === x.id));
    const add = free.length ? `<select class="send-add" data-sendadd title="推子之后发一份到一条混音轨（混响 / 延迟这类放在混音轨上，几条轨共用）"><option value="">＋ 发送到…</option>${free.map((x) => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join("")}</select>` : (tg.length ? "" : `<div class="fx-dim">还没有混音轨（「⋯」里加）</div>`);
    // 出到一条带全湿效果的混音轨 = 原声没了：明说（v0.10.10；user「开了混响结果铃声都哑掉了」）
    const wet = out !== "master" ? this.host.chain(out).find(fullyWet) : undefined;
    const warn = wet ? `<div class="fx-note">「${name(out)}」上的${esc(pluginName(wet.kind))}是全湿的：出到它 = 原声没了，只剩${esc(pluginName(wet.kind))}。要原声加${esc(pluginName(wet.kind))}：出到总轨，用下面的「发送」。</div>` : "";
    return outSel + warn + rows + add;
  }
  private chipsHtml(track: string): string {
    const chips = this.slots(track).map(({ fx }) => `<button class="btn fx-chip${this.open?.track === track && this.open.fx === fx.id ? " is-on" : ""}${fx.on === false ? " off" : ""}" data-v="fx" data-fx="${esc(fx.id)}" title="${esc(pluginName(fx.kind))}：点开调${fx.id === DEFAULT_EQ_ID ? "（默认那一格：能关、能换面板，不能删）" : ""}">${esc(fxSummary(fx, this.onBus(track)))}</button>`).join("");
    const menu = this.addFor === track ? `<div class="fx-add-menu">${PLUGIN_KINDS.map((k) => `<button class="btn cand" data-v="fxpick" data-kind="${k}">${esc(pluginName(k))}</button>`).join("")}</div>` : "";
    return `<div class="strip-fx">${chips}<button class="btn fx-add${this.addFor === track ? " is-on" : ""}" data-v="fxadd" title="插一个插件（任何插件都能插在任何轨上）">＋</button>${menu}</div>`;
  }
  private renderPanel(): void {
    const box = this.el.querySelector<HTMLElement>(".fx-panel")!, o = this.tab === "chain" ? this.open : null, s = o ? this.slotOf(o) : null;
    if (!o || !s) { box.hidden = true; box.innerHTML = ""; delete box.dataset.track; delete box.dataset.fx; return; }
    const fx = s.fx, isDefault = fx.id === DEFAULT_EQ_ID;
    box.dataset.track = o.track; box.dataset.fx = o.fx;
    const head = `<div class="fx-head"><span class="fx-title">${esc(this.trackName(o.track))} · ${esc(pluginName(fx.kind))}${s.virtual ? "（平）" : ""}</span>` +
      `<span class="fx-seg"><button class="btn${o.mode === "simple" ? " is-on" : ""}" data-v="fxmode" data-mode="simple" title="几个大旋钮，按公式调下面全量的参数">一键</button><button class="btn${o.mode === "full" ? " is-on" : ""}" data-v="fxmode" data-mode="full" title="每一个参数都摊开">全量</button></span>` +
      `<button class="btn cand${fx.on === false ? "" : " is-on"}" data-v="fxon" title="关 = 这一格跳过（参数留着）">${fx.on === false ? "关着" : "开着"}</button>` +
      (isDefault ? "" : `<button class="btn cand danger" data-v="fxdel" title="从这条轨上拿掉（能撤销）">拿掉</button>`) +
      `<button class="btn" data-v="fxclose" title="收起">✕</button></div>`;
    box.innerHTML = head + `<div class="fx-body">${this.controlsHtml(o, fx, o.mode)}</div>`; box.hidden = false;
  }
  private renderBar(): void {
    const bar = this.el.querySelector<HTMLElement>(".mix-tabbar")!, modeKind = this.tab === "eq" || this.tab === "comp" ? this.tab : null;
    bar.innerHTML = `<span class="fx-seg mix-tabs" role="tablist">${TABS.map((x) => `<button class="btn${this.tab === x.id ? " is-on" : ""}" data-v="tab" data-tab="${x.id}" role="tab" title="${esc(x.hint)}">${esc(x.label)}</button>`).join("")}</span>` +
      (modeKind ? `<select class="mix-mode" data-panelmode title="卡片上摊开的${esc(pluginName(modeKind))}用哪种面板（全部卡片一起换）"><option value="simple"${this.panelMode[modeKind] === "simple" ? " selected" : ""}>一键</option><option value="full"${this.panelMode[modeKind] === "full" ? " selected" : ""}>全量</option></select>` : "") +
      `<button class="btn mix-more${this.menuOpen ? " is-on" : ""}" data-v="more" title="更多：加混音轨…">⋯</button>`;
    const menu = this.el.querySelector<HTMLElement>(".mix-menu")!;
    menu.hidden = !this.menuOpen;
    menu.innerHTML = this.menuOpen ? `<button class="btn cand" data-v="addbus" title="加一条混音轨（路由轨）：几条轨发过来一起过效果，比如共用一个混响">＋ 混音轨</button>` : "";
  }
  /** 一张卡片：顶上一条峰值细线 + 名字 + 这一页的内容。 */
  private card(id: string, cls: string, name: string, who: string, body: string, color?: string): string {
    return `<div class="strip${cls}" data-id="${esc(id)}"${color ? ` data-color style="--cat:${esc(color)}"` : ""}><div class="strip-meter"><i></i></div>${name}${who ? `<div class="strip-who">${esc(who)}</div>` : ""}${body}</div>`;
  }
  render(): void {
    const box = this.el.querySelector(".studio-strips")!, m = this.host.master(), tab = this.tab;
    if (this.open && !this.slotOf(this.open)) this.open = null;   // 撤销把这一格撤没了
    this.renderBar();
    const nameDiv = (s: string) => `<div class="strip-name">${esc(s)}</div>`;
    // 总轨
    const masterBody = tab === "basic" ? row("增益", HINT.masterGain, `<output>${dbText(m.gainDb)}</output>`, `<input type="range" min="-24" max="12" step="0.5" value="${m.gainDb}" data-master title="双击回 0" />`, "strip-row") +
        `<div class="strip-btns"><button class="btn cand${m.limiter ? " is-on" : ""}" data-v="limiter" title="母线限幅：超过天花板（−0.18 dBFS）的那一小段压下来，不超的地方不动；关掉 = 可能削波">限幅${m.limiter ? "" : "（关：可能削波）"}</button></div>` +
        `<div class="strip-row">峰值 <span class="meter-val">—</span></div>`
      : tab === "eq" || tab === "comp" ? this.inlineHtml(MASTER, tab) : tab === "send" ? `<div class="fx-dim">总轨就是输出，不再发给别处</div>` : this.chipsHtml(MASTER);
    const master = this.card(MASTER, " master", nameDiv("总轨"), "所有声部混在一起之后", masterBody);
    // 混音轨（自己加的路由轨，普通的轨）：排在总轨后面、歌手前面（user「你自己加的中间的路由轨也是普通的轨道，排在总轨后面，歌手前面」）
    const buses = this.host.buses(), busCards = buses.map((b, k) => {
      const body = tab === "basic" ? row("增益", HINT.gain, `<output>${dbText(b.gainDb)}</output>`, `<input type="range" min="-24" max="12" step="0.5" value="${b.gainDb}" data-busgain title="双击回 0" />`, "strip-row") +
          row("声像", HINT.pan, `<output>${panText(b.pan)}</output>`, `<input type="range" min="-1" max="1" step="0.05" value="${b.pan}" data-buspan title="双击回中" />`, "strip-row") +
          `<div class="strip-btns"><button class="btn" data-v="busleft" title="往前挪一位"${k === 0 ? " disabled" : ""}>‹</button><button class="btn" data-v="busright" title="往后挪一位"${k === buses.length - 1 ? " disabled" : ""}>›</button><button class="btn cand danger" data-v="delbus" title="删掉这条混音轨（发给它的、出到它的都改回总轨；能撤销）">删掉</button></div>`
        : tab === "eq" || tab === "comp" ? this.inlineHtml(b.id, tab) : tab === "send" ? this.routeHtml(b.id) : this.chipsHtml(b.id);
      const name = tab === "basic" ? `<input class="bus-name" value="${esc(b.name)}" title="名字（点了改）" />` : nameDiv(b.name);
      return this.card(b.id, " bus", name, "混音轨", body);
    }).join("");
    // 歌手：顺序跟谱上的声部（user「歌手卡片的排序还是以五线谱为准」）
    const singers = this.host.strips().map((s) => {
      const body = tab === "basic" ? row("增益", HINT.gain, `<output>${dbText(s.gainDb)}</output>`, `<input type="range" min="-24" max="12" step="0.5" value="${s.gainDb}" data-gain title="双击回 0" />`, "strip-row") +
          row("声像", HINT.pan, `<output>${panText(s.pan)}</output>`, `<input type="range" min="-1" max="1" step="0.05" value="${s.pan}" data-pan title="双击回中" />`, "strip-row") +
          `<div class="strip-btns"><button class="btn cand${s.muted ? " is-on" : ""}" data-v="mute">静音</button><button class="btn cand${s.solo ? " is-on" : ""}" data-v="solo">独奏</button></div>` +
          // 歌手管理（2026-10-08 深夜，user「只有没引用的时候才可以在歌手管理里面删」）：在几张纸上；一张都不在 = 能删
          (s.refs ? `<div class="strip-refs">在 ${s.refs} 张纸上</div>` : `<div class="strip-refs">哪张纸上都没有 <button class="btn cand danger" data-v="delpart" title="删掉这位歌手（休息室里它的配置一起删；能撤销）">删掉这位歌手</button></div>`)
        : tab === "eq" || tab === "comp" ? this.inlineHtml(s.id, tab) : tab === "send" ? this.routeHtml(s.id) : this.chipsHtml(s.id);
      return this.card(s.id, "", nameDiv(s.name), s.performer, body, s.color);
    }).join("");
    box.innerHTML = master + busCards + singers;
    box.classList.toggle("wide", tab === "eq" || tab === "comp");
    this.renderPanel();
  }
}
// 参数的类型（给宿主用）
export type { Params };
