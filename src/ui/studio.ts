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
import { eqResponseDb } from "../engine/fx.ts";
import { SPEC_BANDS, bandHz, bandsDb, smoothBands, areaPath, xOfHz } from "./spectrum.ts";
const SPEC_TICKS = [100, 1000, 10000];
import { DEFAULT_EQ_ID, PLUGIN_KINDS, freshParams, fullParams, fxSummary, paramsOf, pluginName, fullyWet, paramView, projectToSimple, viewOfFx, type Params } from "./plugins.ts";
import { paramRow, slider, wireParamRows } from "./param-row.ts";
import { stereoShape } from "./scopes.ts";

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
  /** 效果全关（A/B；这次打开里有效）：插件和发送不响，推子 / 声像 / 出到 / 限幅留着。 */
  bypass(): boolean; setBypass(on: boolean): void;
  /** 一条轨的效果链（MASTER = 总轨；别的 = 歌手的 id / 混音轨的 id）。 */
  chain(track: string): FxV2[];
  /** 这一格送进录音房的样子（自动低切换成这位最低的音算出来的 Hz、延迟跟速度换成毫秒）：曲线 / 读数照这个画，和听到的一致。 */
  resolve(track: string, fx: FxV2): FxV2;
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
  /** 歌手往前 / 往后挪一位 = 谱上声部的顺序（混音台和五线谱是同一个顺序；v0.10.17，user「混音台里面还是应该支持歌手顺序排序」）。 */
  movePart(id: string, dir: -1 | 1): void;
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
  /** 换页了（宿主据此开关录音房的频谱：只有 EQ 页看得见才算；user「记得我说的省cpu，只有看见的时候才进行统计和绘制」）。 */
  tabChanged?(tab: MixTab): void;
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
const row = paramRow;   // 一行参数 = 深模块 param-row.ts（名字 + 问号 + 读数 + 控件；滑块的滚轮 / 双击也在那里）
const HINT = {
  gain: "增益（推子）：这条轨整体的音量。混音的第一步 = 先把几条轨的音量摆平",
  pan: "声像：在左右哪个位置。几条轨左右错开一点，就不会都挤在正中间。数字 = 往一边推了多少（等功率：怎么摆总响度不变）：中 = 两个喇叭各 −3 dB；50 = 这边 −0.7 dB、那边 −8.3 dB（差 7.7 dB）；100 = 全在这边，另一边没声",
  masterGain: "总轨增益：所有轨混在一起之后整体再调大调小",
  out: "出到：这条轨的声音最后去哪——直接去总轨，或者先进一条混音轨（在那里一起过效果）",
  send: "发送：推子之后再复制一份给这条混音轨；越大，那边的效果（混响 / 延迟）越多，原声照旧走「出到」",
  limiter: "限幅（总轨最后一道）：超过天花板（−0.18 dBFS）的那一小段很快压下来，不超的地方一个采样都不动，不改音色。关掉 = 超了就削波（爆音、导出的文件里也是）。一般一直开着；想看自己的混音到底多响，可以先关了看峰值",
  peak: "峰值：最近这一下最响的那个采样（dBFS）。0 dB = 满格，再大就削波；限幅开着时最多到 −0.18 dB。顶上的细线是同一个数",
  rms: "平均电平（RMS，最近 0.3 秒，推子之后，dBFS）：比峰值更接近耳朵觉得的响。几条轨摆平音量看这个；顶上的细线（峰值）看会不会爆",
  corr: "左右相关（−1 到 +1）：+1 = 左右一样（单声道）；0 附近 = 很宽；小于 0 = 左右反相，手机外放 / 单声道一合就会变小、变空。背景的图：竖线 = 单声道，越圆越宽，横着 = 反相；往左上斜 = 偏左声道、往右上斜 = 偏右",
  gr: "压了多少：这条轨上第一台压缩此刻把声音压低了几 dB（下面摊开的就是它）。一直压很多 = 阈值太低或比例太大",
  key: "被谁压（侧链）：压缩器不看自己，而看另一条轨有多响——比如月读一唱，伴奏自己让一点",
};
/** 压缩页的波形图存多少段（~21 ms 一段 = ~4 s）。 */
const COMP_HIST = 192;
const RMS_ROW = row("平均", HINT.rms, `<output class="rms-val">—</output>`, "", "strip-row");
const CORR_ROW = row("左右相关", HINT.corr, `<output class="corr-val">—</output>`, "", "strip-row");
/** 李萨如图的底：竖线 = 单声道、横线 = 反相；左上 / 右上 = 只有左 / 右声道。 */
const GONIO_SVG = `<svg class="strip-gonio" viewBox="-1 -1 2 2" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path class="gon-axis" d="M0,-1L0,1M-1,0L1,0"/><path class="gon" d=""/></svg>`;   // 不写「左 / 右」字（v0.10.21，user「李萨如 左字和ui overlap了」）：方向写在「左右相关」的问号里
/** 一格的位置：哪条轨的哪一格（插件格的读写、面板和卡片上摊开的控件都按它找）。 */
interface Target { track: string; fx: string }

export class Studio {
  readonly el: HTMLDivElement;
  private tab: MixTab = "basic";
  /** 每一格自己记着用一键还是全量（卡片里切，不是全局切；user「一键和全量应该是卡片内部切，而不是全局切。每个卡片记住自己是一键还是全量」）。
   *  没切过 = 读得回一键就一键、读不回（在全量里调过）就全量；这次打开里有效。 */
  private cardMode = new Map<string, "simple" | "full">();
  /** 「链」页顶上展开着的插件面板：哪条轨的哪一格。 */
  private open: Target | null = null;
  private addFor: string | null = null;   // 「链」页「＋」的小菜单开在哪条轨
  private menuOpen = false;               // 页签那一行的「⋯」
  // 峰值细线：录音房每 ~21 ms 报一次（推子后）；画的时候涨得快、落得慢（每秒 30 dB），只在看得见、有声音时跑动画
  private target = new Map<string, number>();
  private shown = new Map<string, number>();
  private raf = 0; private lastTick = 0; private lastMeter = 0;
  /** EQ 页卡片背景的频谱（v0.10.11）：每条轨平滑后的 96 个频带（dB）。 */
  private specShown = new Map<string, Float32Array>();
  /** 仪表（v0.10.16；user「三个页同意」）：平均电平 = 均方按 0.3 s 平滑；压缩页 = 压了多少（涨得快、每秒回 20 dB）；基础页总轨 / 混音轨 = 李萨如图 + 左右相关。读数一秒刷 4 次（不闪）。 */
  private msTarget = new Map<string, number>(); private msShown = new Map<string, number>();
  private grTarget = new Map<string, number>(); private grShown = new Map<string, number>();
  private corrShown = new Map<string, number>(); private lastText = 0;
  private full = false;
  /** 压缩页：每条轨最近 COMP_HIST 段（~21 ms 一段）的 [进峰值, 出峰值, 压了多少 dB]。 */
  private compHist = new Map<string, [number, number, number][]>();
  /** 差设备（v0.10.17；user「以及注意一下差设备上的性能影响」）：① 只算 / 只画看得见的卡片（混音台里滚出去的不算 FFT、不画李萨如图）；
   *  ② 背景统计按花的时间自己降频：最近平均一次超过 4 ms = 隔一帧画一帧（最多 4 帧画 1 帧），降到 1.5 ms 以下再恢复。 */
  private seen = new Set<string>(); private io: IntersectionObserver | null = null;
  private bgCost = 0; private bgSkip = 0; private bgN = 0;
  private budgeted(f: () => void): void {
    if (this.bgSkip && this.bgN++ % (this.bgSkip + 1)) return;
    const t0 = performance.now(); f(); const dt = performance.now() - t0;
    this.bgCost = this.bgCost * 0.8 + dt * 0.2;
    if (this.bgCost > 4 && this.bgSkip < 3) this.bgSkip++; else if (this.bgCost < 1.5 && this.bgSkip > 0) this.bgSkip--;
  }
  private watchCards(): void {
    if (typeof IntersectionObserver !== "function") return;   // 没有（很老的浏览器）= 当全看得见
    this.io ??= new IntersectionObserver((es) => { for (const e of es) { const id = (e.target as HTMLElement).dataset.id!; if (e.isIntersecting) this.seen.add(id); else this.seen.delete(id); } });
    this.io.disconnect(); this.seen.clear();
    for (const el of this.el.querySelectorAll<HTMLElement>(".studio-strips .strip[data-id]")) this.io.observe(el);
  }
  private shownCard(id: string): boolean { return !this.io || this.seen.has(id); }
  constructor(parent: HTMLElement, private host: StudioHost) {
    this.el = document.createElement("div"); this.el.className = "studio"; this.el.hidden = true;
    this.el.innerHTML = `<div class="finder-bar"><span class="finder-title">混音台</span><button class="btn" data-v="back" title="收起混音台：底座让出来、还在「听」（Esc = 回去写）">收起</button><button class="btn" data-v="play" title="播放（空格）"><svg class="ico"><use href="#play"/></svg></button><button class="btn mix-ab" data-v="bypass"></button><button class="btn mix-full" data-v="full" title="混音台铺满（推到最上面，卡片排成好几列，一眼看全）；再点 = 回到底座">全屏</button></div>` +
      `<div class="mix-tabbar"></div><div class="fx-note mix-ab-note" hidden>效果全关着：插件和发送都不响，只剩推子、声像、出到和总轨限幅——听谱子本身 / 听差别用；再点一下回来。导出照常带效果。</div><div class="mix-menu" hidden></div><div class="fx-panel" data-fxwrap hidden></div><div class="studio-strips"></div>`;
    parent.append(this.el);
    this.el.addEventListener("click", (e) => this.onClick(e));
    this.el.addEventListener("input", (e) => this.onInput(e));
    this.el.addEventListener("change", (e) => this.onChange(e));
    wireParamRows(this.el);   // 滚轮一格一步、双击回默认、问号（v0.10.13）
  }
  get isOpen(): boolean { return !this.el.hidden; }
  get currentTab(): MixTab { return this.tab; }
  show(): void { this.el.hidden = false; this.render(); }
  hide(): void { this.el.hidden = true; this.menuOpen = false; this.io?.disconnect(); this.seen.clear(); }

  // ── 峰值 ────────────────────────────────────────────────────────────────
  /** 录音房报的峰值（0–1；总轨 = 出声口；tracks = 每条轨 / 混音轨推子后）。 */
  meter(peak: number, tracks: Record<string, number> = {}, ms: Record<string, number> = {}, gr: Record<string, number> = {}, cl: Record<string, [number, number]> = {}): void {
    // 压缩页的波形图（v0.10.21；user「压缩器做一个波形图和实时的压缩度的可视化」）：每条轨第一台压缩最近 ~4 s 的进 / 出峰值 + 压了多少，只在压缩页、看得见的卡片上画
    if (!this.el.hidden && this.tab === "comp") {
      for (const [id, [i, o]] of Object.entries(cl)) { let h = this.compHist.get(id); if (!h) { h = []; this.compHist.set(id, h); } h.push([i, o, gr[id] ?? 0]); if (h.length > COMP_HIST) h.splice(0, h.length - COMP_HIST); }
      this.budgeted(() => this.drawComp());
    }
    this.target.set(MASTER, peak); for (const [k, v] of Object.entries(tracks)) this.target.set(k, v);
    this.msTarget.clear(); for (const [k, v] of Object.entries(ms)) this.msTarget.set(k, v);
    this.grTarget.clear(); for (const [k, v] of Object.entries(gr)) this.grTarget.set(k, v);
    this.lastMeter = performance.now();
    const val = this.el.querySelector<HTMLElement>(".meter-val"); if (val) { const db = toDb(peak); val.textContent = db <= -59 ? "—" : `${db.toFixed(1)} dB`; }
    if (!this.raf && !this.el.hidden) { this.lastTick = performance.now(); this.raf = requestAnimationFrame(this.tick); }
  }
  /** 录音房拷来的最近一段采样（每条轨 / 混音轨 / 总轨）→ EQ 页卡片背景的频谱面。只在 EQ 页、混音台看得见时录音房才发。 */
  spectrum(sr: number, tracks: Record<string, Float32Array>): void {
    if (this.el.hidden || this.tab !== "eq") return;
    this.budgeted(() => this.drawSpectrum(sr, tracks));
  }
  private drawSpectrum(sr: number, tracks: Record<string, Float32Array>): void {
    for (const [id, x] of Object.entries(tracks)) {
      if (!this.shownCard(id)) continue;
      const path = this.el.querySelector<SVGPathElement>(`.strip[data-id="${CSS.escape(id)}"] .strip-spec .spec`); if (!path) continue;
      const b = smoothBands(this.specShown.get(id), bandsDb(x, sr)); this.specShown.set(id, b);
      path.setAttribute("d", areaPath(b));
    }
  }
  /** 总轨 / 混音轨推子后的左右采样 → 基础页卡片背景的李萨如图 + 左右相关（v0.10.16；user「声像对应的是莉萨如图吗？」「三个页同意」）。
   *  竖着 = 中 (L+R)/√2、横着 = (R−L)/√2（只有左 = 左上斜线）：竖线 = 单声道、越圆越宽、横着 = 反相。形状看的是左右关系，不看多响：按这一帧最大的那下缩放（太小的不放大）。 */
  stereo(tracks: Record<string, { L: Float32Array; R: Float32Array }>): void {
    if (this.el.hidden || this.tab !== "basic") return;
    this.budgeted(() => this.drawStereo(tracks));
  }
  private drawStereo(tracks: Record<string, { L: Float32Array; R: Float32Array }>): void {
    for (const [id, { L, R }] of Object.entries(tracks)) {
      if (!this.shownCard(id)) continue;
      const card = this.el.querySelector<HTMLElement>(`.strip[data-id="${CSS.escape(id)}"]`); if (!card) continue;
      const g = stereoShape(L, R), path = card.querySelector<SVGPathElement>(".strip-gonio .gon"); if (path) path.setAttribute("d", g.path);
      const prev = this.corrShown.get(id), c = g.corr === null ? null : prev === undefined ? g.corr : prev + (g.corr - prev) * 0.3;
      if (c === null) this.corrShown.delete(id); else this.corrShown.set(id, c);
      const out = card.querySelector<HTMLElement>(".corr-val"); if (out) { out.textContent = c === null ? "—" : `${c >= 0 ? "+" : "−"}${Math.abs(c).toFixed(2)}`; out.classList.toggle("neg", c !== null && c < -0.05); }
    }
  }
  /** 压缩页卡片背景：进来的电平 = 底下一片淡的、出去的 = 一根线、压了多少 = 从顶上往下垂的线、阈值 = 虚线（电平 −48…0 dBFS 映到卡片高度；压了多少 0…−24 dB 映到上半截）。 */
  private drawComp(): void {
    for (const [id, h] of this.compHist) {
      if (!this.shownCard(id)) continue;
      const svg = this.el.querySelector<SVGSVGElement>(`.strip[data-id="${CSS.escape(id)}"] .strip-comp`); if (!svg) continue;
      const n = h.length, x = (k: number) => ((100 * (k + COMP_HIST - n)) / (COMP_HIST - 1)).toFixed(2), lv = (v: number) => { const d = v > 1e-6 ? 20 * Math.log10(v) : -96; return (100 * Math.min(1, Math.max(0, -d / 48))).toFixed(2); };
      let a = "", o = "", g = "";
      h.forEach(([i, out, gr], k) => { a += `${k ? "L" : `M${x(0)},100L`}${x(k)},${lv(i)}`; o += `${k ? "L" : "M"}${x(k)},${lv(out)}`; g += `${k ? "L" : "M"}${x(k)},${((Math.min(24, -gr) / 24) * 50).toFixed(2)}`; });
      if (n) a += `L${x(n - 1)},100Z`;
      svg.querySelector(".cin")!.setAttribute("d", a); svg.querySelector(".cout")!.setAttribute("d", o); svg.querySelector(".cgr")!.setAttribute("d", g);
    }
  }
  private compSvg(track: string): string {
    const c = this.slots(track).find((s) => s.fx.kind === "comp")?.fx, thr = c && c.on !== false ? paramsOf(c).thresholdDb : null;
    const ty = thr === null || thr === undefined ? null : (100 * Math.min(1, Math.max(0, -thr / 48))).toFixed(2);
    return `<svg class="strip-comp" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="cin" d=""/><path class="cout" d=""/><path class="cgr" d=""/>${ty ? `<path class="cthr" d="M0,${ty}L100,${ty}"/>` : ""}</svg>`;
  }
  /** 这一格 EQ 的响应曲线（±18 dB 映到卡片高度，中线 = 0 dB）。 */
  private curvePath(track: string, fx: FxV2 | null): string {
    if (!fx || fx.on === false) return "M0,50L100,50";
    const db = eqResponseDb(paramsOf(this.host.resolve(track, fx)), 48000, Array.from({ length: SPEC_BANDS }, (_, k) => bandHz(k)));
    return db.map((d, k) => `${k ? "L" : "M"}${((100 * (k + 0.5)) / SPEC_BANDS).toFixed(2)},${(50 - (Math.max(-18, Math.min(18, d)) / 18) * 45).toFixed(2)}`).join("");
  }
  private specSvg(track: string): string {
    const eq = this.slots(track).find((s) => s.fx.kind === "eq")?.fx ?? null;
    // 频率刻度（user「…可能还是需要频率刻度，很subtle的淡字放在底下？」）：100 / 1k / 10k 三根竖线 + 底下小字；字用 HTML 放（SVG 拉伸了字会变形）
    const ticks = SPEC_TICKS.map((f) => ({ f, x: 100 * xOfHz(f) }));
    return `<svg class="strip-spec" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="grid" d="${ticks.map((t) => `M${t.x.toFixed(2)},0L${t.x.toFixed(2)},100`).join("")}"/><path class="spec" d=""/><path class="eqc" d="${this.curvePath(track, eq)}"/></svg>` +
      `<div class="spec-ticks" aria-hidden="true">${ticks.map((t) => `<span style="left:${t.x.toFixed(2)}%">${t.f >= 1000 ? `${t.f / 1000}k` : t.f}</span>`).join("")}</div>`;
  }
  private tick = (now: number): void => {
    this.raf = 0; if (this.el.hidden) return;
    const dt = Math.min(0.1, (now - this.lastTick) / 1000); this.lastTick = now;
    const stale = now - this.lastMeter > 200;   // 一阵没报了 = 当它静了
    const text = now - this.lastText > 250; if (text) this.lastText = now;
    let alive = false;
    for (const el of this.el.querySelectorAll<HTMLElement>(".strip[data-id]")) {
      const id = el.dataset.id!, raw = stale ? 0 : this.target.get(id) ?? 0, want = toDb(raw), cur = this.shown.get(id) ?? -60;
      const next = want >= cur ? want : Math.max(want, cur - 30 * dt);
      this.shown.set(id, next); if (next > -59.5) alive = true;
      const bar = el.querySelector<HTMLElement>(".strip-meter > i");
      if (bar) { bar.style.width = `${Math.max(0, Math.min(100, ((next + 60) / 60) * 100))}%`; bar.classList.toggle("hot", raw >= 0.98); }
      // 平均电平：均方按 0.3 s 时间常数平滑（RMS）
      const msWant = stale ? 0 : this.msTarget.get(id) ?? 0, msCur = this.msShown.get(id) ?? 0, ms = msCur + (msWant - msCur) * (1 - Math.exp(-dt / 0.3));
      this.msShown.set(id, ms); if (ms > 1e-6) alive = true;
      // 压了多少：一压就到、每秒回 20 dB
      const grWant = stale ? 0 : this.grTarget.get(id) ?? 0, grCur = this.grShown.get(id) ?? 0, gr = grWant <= grCur ? grWant : Math.min(0, grCur + 20 * dt);
      this.grShown.set(id, gr); if (gr < -0.05) alive = true;
      const gb = el.querySelector<HTMLElement>(".gr-bar > i"); if (gb) gb.style.width = `${Math.min(100, (-gr / 20) * 100)}%`;
      if (text) {
        const rv = el.querySelector<HTMLElement>(".rms-val"); if (rv) { const db = ms > 1e-6 ? 10 * Math.log10(ms) : -99; rv.textContent = db <= -59 ? "—" : `${db.toFixed(1)} dB`; }
        const gv = el.querySelector<HTMLElement>(".gr-val"); if (gv) gv.textContent = gr > -0.05 ? "0 dB" : `${gr.toFixed(1)} dB`;
      }
    }
    if (alive || !stale) this.raf = requestAnimationFrame(this.tick);
  };

  // ── 事件 ────────────────────────────────────────────────────────────────
  private targetOf(el: Element): Target | null { const w = el.closest<HTMLElement>("[data-fxwrap]"); return w?.dataset.track && w.dataset.fx ? { track: w.dataset.track, fx: w.dataset.fx } : null; }
  private onClick(e: Event): void {
    const t = e.target as HTMLElement, v = t.closest<HTMLElement>("[data-v]")?.dataset.v, strip = t.closest<HTMLElement>(".strip")?.dataset.id, tg = this.targetOf(t);
    if (!v) return;
    if (v === "back") this.host.close();
    else if (v === "play") this.host.play();
    else if (v === "bypass") { this.host.setBypass(!this.host.bypass()); this.render(); }
    else if (v === "full") { this.full = !this.full; this.el.classList.toggle("full", this.full); this.render(); }   // 混音台全屏（user「混音台可以切全屏（就是推到最上面」）：这次打开里有效
    else if (v === "tab") { this.tab = t.closest<HTMLElement>("[data-tab]")!.dataset.tab as MixTab; this.menuOpen = false; this.addFor = null; this.specShown.clear(); this.compHist.clear(); this.render(); this.host.tabChanged?.(this.tab); }
    else if (v === "more") { this.menuOpen = !this.menuOpen; this.render(); }
    else if (v === "addbus") { this.menuOpen = false; const id = this.host.addBus(); this.render(); this.el.querySelector<HTMLElement>(`.strip[data-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: "nearest" }); }
    else if (v === "mute" && strip) { this.host.toggleMute(strip); this.render(); }
    else if (v === "solo" && strip) { this.host.toggleSolo(strip); this.render(); }
    else if ((v === "partleft" || v === "partright") && strip) { this.host.movePart(strip, v === "partleft" ? -1 : 1); this.render(); }
    else if (v === "delpart" && strip) this.host.deletePart(strip);
    else if (v === "limiter") { this.host.toggleLimiter(); this.render(); }
    else if (v === "delbus" && strip) { if (this.open?.track === strip) this.open = null; this.host.removeBus(strip); this.render(); }
    else if ((v === "busleft" || v === "busright") && strip) { this.host.moveBus(strip, v === "busleft" ? -1 : 1); this.render(); }
    else if (v === "sendx" && strip) { const to = t.closest<HTMLElement>("[data-to]")!.dataset.to!; this.host.setSends(strip, this.host.sends(strip).filter((x) => x.to !== to), `不再发给 ${this.trackName(to)}`); this.render(); }
    else if (v === "fx" && strip) { const id = t.closest<HTMLElement>("[data-fx]")!.dataset.fx!; this.toggleOpen(strip, id); }
    else if (v === "fxadd" && strip) { this.addFor = this.addFor === strip ? null : strip; this.render(); }
    else if (v === "fxpick" && strip) this.addFx(strip, t.closest<HTMLElement>("[data-kind]")!.dataset.kind!, true);
    else if (v === "fxaddkind" && strip) this.addFx(strip, t.closest<HTMLElement>("[data-kind]")!.dataset.kind!, false);
    else if (v === "fxmode" && tg) { this.cardMode.set(`${tg.track}\n${tg.fx}`, t.closest<HTMLElement>("[data-mode]")!.dataset.mode as "simple" | "full"); this.render(); }
    else if (v === "fxclose") { this.open = null; this.render(); }
    else if (v === "fxdel" && tg) this.deleteFx(tg);
    else if (v === "fxon" && tg) { this.patch(tg, (fx) => ({ ...fx, on: fx.on === false }), "开 / 关"); this.render(); }
    else if (v === "fxtoggle" && tg) { const id = t.closest<HTMLElement>("[data-c]")!.dataset.c!; this.simpleSet(tg, id, (this.simpleNow(tg)?.[id] ?? 0) ? 0 : 1, false); this.render(); }
    else if (v === "fxchoice" && tg) { const b = t.closest<HTMLElement>("[data-c]")!; this.simpleSet(tg, b.dataset.c!, Number(b.dataset.val), false); this.render(); }
    else if (v === "fxproject" && tg) { this.patch(tg, (fx) => ({ ...fx, params: projectToSimple(fx.kind, this.onBus(tg.track), paramsOf(fx), !!fx.key) }), "改成最接近的一键"); this.render(); }
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
    if (strip && t.dataset.out !== undefined) { this.host.setOutTo(strip, t.value); this.render(); return; }
    if (strip && t.dataset.sendadd !== undefined && t.value) { this.host.setSends(strip, [...this.host.sends(strip), { to: t.value, gainDb: -12 }], `发给 ${this.trackName(t.value)}`); this.render(); return; }
    if (strip && t.classList.contains("bus-name")) { const name = t.value.trim(); if (name) this.host.renameBus(strip, name); this.render(); return; }
    if (tg && t.dataset.key !== undefined) {   // 换「被谁压」：原来是一键的样子 = 换成另一套公式（侧链不补偿）照旧是一键，「压多少」不变
      const v = t.value, bus = this.onBus(tg.track);
      this.patch(tg, (fx) => { const { key: _k, ...rest } = fx, nx: FxV2 = v ? { ...rest, key: v } : rest, was = viewOfFx(fx, bus)?.read(paramsOf(fx)), view = viewOfFx(nx, bus);
        return was && view ? { ...nx, params: view.write(was, paramsOf(nx)) } : nx; }, "被谁压"); this.render(); }
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
    this.open = this.open && this.open.track === track && this.open.fx === fx ? null : { track, fx };
    this.addFor = null; this.render();
  }
  private modeOf(tg: Target): "simple" | "full" {
    const m = this.cardMode.get(`${tg.track}\n${tg.fx}`); if (m) return m;
    const s = this.slotOf(tg); return s && viewOfFx(s.fx, this.onBus(tg.track))?.read(paramsOf(s.fx)) ? "simple" : "full";
  }
  /** 一键 | 全量 两个小钮（卡片上摊开的那一块、「链」页顶上的面板都用这一份）。 */
  private modeSeg(tg: Target): string {
    const m = this.modeOf(tg);
    return `<span class="fx-seg"><button class="btn${m === "simple" ? " is-on" : ""}" data-v="fxmode" data-mode="simple" title="几个大旋钮，按公式调下面全量的参数（只换这一格）">一键</button><button class="btn${m === "full" ? " is-on" : ""}" data-v="fxmode" data-mode="full" title="每一个参数都摊开（只换这一格）">全量</button></span>`;
  }
  private addFx(track: string, kind: string, openPanel: boolean): void {
    const ch = this.host.chain(track), used = new Set(ch.map((f) => f.id)); let n = 1; while (used.has(`${kind}${n}`)) n++;
    const fx: FxV2 = { id: `${kind}${n}`, kind, params: freshParams(kind, this.onBus(track)) };
    this.host.setChain(track, [...ch, fx], `${this.trackName(track)} 插上${pluginName(kind)}`);
    this.addFor = null; if (openPanel) this.open = { track, fx: fx.id }; this.render();
  }
  /** 改一格（虚的默认 EQ = 第一次改的时候写进链的最前面）。 */
  private patch(tg: Target, f: (fx: FxV2) => FxV2, what: string, merge = false): void {
    const s = this.slotOf(tg); if (!s) return;
    const ch = this.host.chain(tg.track), nx = f(s.fx);
    const next = s.virtual ? [nx, ...ch] : ch.map((x) => (x.id === tg.fx ? nx : x));
    this.host.setChain(tg.track, next, `${this.trackName(tg.track)} ${pluginName(nx.kind)} ${what}`, merge ? `fx:${tg.track}:${tg.fx}:${what}` : undefined);
    const b = this.el.querySelector<HTMLElement>(`.strip[data-id="${CSS.escape(tg.track)}"] .fx-chip[data-fx="${CSS.escape(nx.id)}"]`);   // 只找「链」页的小钮（EQ / 压缩页摊开的那一块也带 data-fx，别把它整块换成一行字）
    if (b) { b.textContent = fxSummary(nx, this.onBus(tg.track)); b.classList.toggle("off", nx.on === false); }
    if (nx.kind === "eq") { const c = this.el.querySelector(`.strip[data-id="${CSS.escape(tg.track)}"] .strip-spec .eqc`); if (c) c.setAttribute("d", this.curvePath(tg.track, nx)); }   // EQ 页的曲线跟着拧
  }
  private deleteFx(tg: Target): void {
    if (tg.fx === DEFAULT_EQ_ID) return;
    const ch = this.host.chain(tg.track), gone = ch.find((x) => x.id === tg.fx);
    this.host.setChain(tg.track, ch.filter((x) => x.id !== tg.fx), `${this.trackName(tg.track)} 拿掉${pluginName(gone?.kind ?? "")}`);
    if (this.open && this.open.track === tg.track && this.open.fx === tg.fx) this.open = null;
    this.render();
  }
  private simpleNow(tg: Target): Record<string, number> | null { const s = this.slotOf(tg); return s ? viewOfFx(s.fx, this.onBus(tg.track))?.read(paramsOf(s.fx)) ?? null : null; }
  /** 一键改一个控件：在当前读数上改这一个（读不出 = 在全量里调过 = 从一键的默认起），按公式写回全量参数。 */
  private simpleSet(tg: Target, id: string, v: number, live: boolean, input?: HTMLElement): void {
    const s = this.slotOf(tg); if (!s) return;
    const bus = this.onBus(tg.track), view = viewOfFx(s.fx, bus)!, base = view.read(paramsOf(s.fx)); if (!base) return;   // 锁着（在全量里调过）：只有「改成最接近的一键」能动
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
    const bus = this.onBus(tg.track), p = paramsOf(fx), view = viewOfFx(fx, bus), read = view?.read(p) ?? null;
    const keyOpts = fx.kind === "comp" ? this.host.keyTracks(tg.track) : [];
    const keyRow = keyOpts.length ? row("被谁压", HINT.key, "", `<select data-key><option value="">不用（自己压自己）</option>${keyOpts.map((x) => `<option value="${esc(x.id)}"${fx.key === x.id ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select>`) : "";
    if (mode === "simple" && view) {
      // 在全量里调过（落不到一键公式上）= 一键锁着、旋钮不摆出来（user「没法用一键的时候那些一键的invalid slider可以不显示哈哈」），要改先点「改成最接近的一键」（v0.10.14；user「basic模式下应该有一个project to basic模式的功能，不然的话basic模式会是被锁住，免得不小心override」）
      const fp = freshParams(fx.kind, bus), fresh = view.read(fp) ?? view.project(fp), locked = !read, cur = read ?? {};
      return (locked ? `<div class="fx-note">在全量里调过，一键表达不了：一键先锁着，免得一碰就盖掉。<button class="btn cand" data-v="fxproject" title="按最接近的一键数值改写——全量里多调的会丢掉（比如中频那一刀）；能撤销">改成最接近的一键</button></div>` + keyRow : "") + (locked ? "" : view.controls.map((c) => {
        const v = cur[c.id] ?? 0;
        if (c.id === "autoLow" && !this.host.strips().some((x) => x.id === tg.track)) return row(c.label, c.hint, "", `<span class="fx-dim">混音轨 / 总轨上没有音，用不上${v ? "（开着也不切）" : ""}</span>`);   // 自动低切按这一轨最低的音算：没有音 = 不起作用（v0.10.15）
        if (c.kind === "toggle") return row(c.label, c.hint, "", `<button class="btn cand${v ? " is-on" : ""}" data-v="fxtoggle" data-c="${c.id}">${v ? "开" : "关"}</button>`);
        if (c.kind === "choice") return row(c.label, c.hint, "", `<span class="fx-seg">${c.choices!.map((x) => `<button class="btn${Math.abs(v - x.v) < 1e-6 ? " is-on" : ""}" data-v="fxchoice" data-c="${c.id}" data-val="${x.v}">${esc(x.label)}</button>`).join("")}</span>`);
        return row(c.label, c.hint, `<output data-c="${c.id}">${c.fmt ? c.fmt(v) : v}</output>`, slider({ min: c.min!, max: c.max!, step: c.step!, value: v, attrs: `data-c="${c.id}"`, def: fresh[c.id], defText: fresh[c.id] == null ? undefined : c.fmt ? c.fmt(fresh[c.id]) : String(fresh[c.id]), }));
      }).join("") + keyRow);
    }
    const fresh = freshParams(fx.kind, bus);
    return fullParams(fx.kind).map((d) => {
      const sl = paramView(fx.kind, d);
      if (d.unit === "bool") return row(sl.label, sl.hint, "", `<button class="btn cand${p[d.id] ? " is-on" : ""}" data-v="fxbool" data-p="${d.id}">${p[d.id] ? "开" : "关"}</button>`);
      if (fx.kind === "eq" && d.id === "hpHz" && p.hpAuto) { const hz = this.host.resolve(tg.track, fx).params.hpHz ?? 0; return row(sl.label, sl.hint, "", `<span class="fx-dim">${hz > 0 ? `自动：${hz} Hz（这位最低的音往下四个半音）` : "自动（这条轨没有音 = 不切）"}</span>`); }
      return row(sl.label, sl.hint, `<output>${sl.fmt(p[d.id])}</output>`, slider({ min: sl.min, max: sl.max, step: sl.step, value: sl.toS(p[d.id]), attrs: `data-p="${d.id}"`, def: sl.toS(fresh[d.id]), defText: sl.fmt(fresh[d.id]) }));
    }).join("") + keyRow;
  }
  /** EQ / 压缩页：这条轨上第一格这种插件，摊在卡片上（没有 = 「＋」）。 */
  private inlineHtml(track: string, kind: "eq" | "comp"): string {
    const all = this.slots(track).filter((s) => s.fx.kind === kind), s = all[0];
    if (!s) return `<button class="btn cand" data-v="fxaddkind" data-kind="${kind}" title="往这条轨上插一个${pluginName(kind)}">＋ ${esc(pluginName(kind))}</button>`;
    const fx = s.fx, tg = { track, fx: fx.id };
    return `<div class="fx-inline${fx.on === false ? " off" : ""}" data-fxwrap data-track="${esc(track)}" data-fx="${esc(fx.id)}">` +
      `<div class="fx-inline-head"><button class="btn cand${fx.on === false ? "" : " is-on"}" data-v="fxon" title="关 = 这一格跳过（参数留着）">${fx.on === false ? "关着" : "开着"}</button>${all.length > 1 ? `<span class="fx-dim">还有 ${all.length - 1} 个${esc(pluginName(kind))}在「链」里</span>` : ""}${this.modeSeg(tg)}</div>` +
      (kind === "comp" ? row("压了", HINT.gr, `<output class="gr-val">0 dB</output>`, `<span class="gr-bar"><i></i></span>`, "strip-row gr-row") : "") +
      `<div class="fx-body">${this.controlsHtml(tg, fx, this.modeOf(tg))}</div></div>`;
  }
  /** 出到 + 发送（歌手轨和路由轨都有；总轨没有）。 */
  private routeHtml(track: string): string {
    const out = this.host.outTo(track), tg = this.host.targets(track), sends = this.host.sends(track), name = (id: string) => esc(this.trackName(id));
    const outSel = row("出到", HINT.out, "", `<select data-out>${[{ id: "master", name: "总轨" }, ...tg].map((x) => `<option value="${esc(x.id)}"${out === x.id ? " selected" : ""}>${esc(x.name)}</option>`).join("")}${out !== "master" && !tg.some((x) => x.id === out) ? `<option value="${esc(out)}" selected>${name(out)}（接不上）</option>` : ""}</select>`, "strip-row");
    const rows = sends.map((sd) => `<div class="strip-send">${row(`发给 ${this.trackName(sd.to)}`, HINT.send, `<output>${dbText(sd.gainDb)}</output>`, slider({ min: -40, max: 6, step: 0.5, value: sd.gainDb, attrs: `data-send="${esc(sd.to)}"`, def: -12, defText: "−12 dB" }), "strip-row")}<button class="btn" data-v="sendx" data-to="${esc(sd.to)}" title="不再发给它">✕</button></div>`).join("");
    const free = tg.filter((x) => !sends.some((sd) => sd.to === x.id));
    const add = free.length ? `<select class="send-add" data-sendadd title="推子之后发一份到一条混音轨（混响 / 延迟这类放在混音轨上，几条轨共用）"><option value="">＋ 发送到…</option>${free.map((x) => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join("")}</select>` : (tg.length ? "" : `<div class="fx-dim">还没有混音轨（「⋯」里加）</div>`);
    // 出到一条带全湿效果的混音轨 = 原声没了：明说（v0.10.10；user「开了混响结果铃声都哑掉了」）
    const wet = out !== "master" ? this.host.chain(out).find(fullyWet) : undefined;
    const warn = wet ? `<div class="fx-note">「${name(out)}」上的${esc(pluginName(wet.kind))}是全湿的：出到它 = 原声没了，只剩${esc(pluginName(wet.kind))}。要原声加${esc(pluginName(wet.kind))}：出到总轨，用下面的「发送」。</div>` : "";
    // 出到一条带混响 / 延迟 / 合唱（插在上面、不是全湿）的混音轨：几条轨效果一样多、原声被它关小（v0.10.15；查 user 的 団子大家族 时发现：五条轨出到「空间感」，混响原声 0.67 = 悄悄 −3.5 dB）
    const shared = !wet && out !== "master" ? this.host.chain(out).find((f) => (f.kind === "reverb" || f.kind === "delay" || f.kind === "chorus") && f.on !== false) : undefined;
    const sharedDry = shared ? paramsOf(shared).dry : 1, dryDb = 20 * Math.log10(Math.max(1e-6, sharedDry));
    const note = shared ? `<div class="fx-note">出到「${name(out)}」= 整条声音都过它的${esc(pluginName(shared.kind))}：出到它的几条轨${esc(pluginName(shared.kind))}一样多${sharedDry < 0.999 ? `，原声也被它关小 ${dbText(dryDb)}（推子上看不出来）` : ""}。想每条轨各自多少：出到总轨、用下面的「发送」，那条混音轨上的${esc(pluginName(shared.kind))}改成全湿。</div>` : "";
    return outSel + warn + note + rows + add;
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
      this.modeSeg(o) +
      `<button class="btn cand${fx.on === false ? "" : " is-on"}" data-v="fxon" title="关 = 这一格跳过（参数留着）">${fx.on === false ? "关着" : "开着"}</button>` +
      (isDefault ? "" : `<button class="btn cand danger" data-v="fxdel" title="从这条轨上拿掉（能撤销）">拿掉</button>`) +
      `<button class="btn" data-v="fxclose" title="收起">✕</button></div>`;
    box.innerHTML = head + `<div class="fx-body">${this.controlsHtml(o, fx, this.modeOf(o))}</div>`; box.hidden = false;
  }
  private renderBar(): void {
    const bar = this.el.querySelector<HTMLElement>(".mix-tabbar")!;
    bar.innerHTML = `<span class="fx-seg mix-tabs" role="tablist">${TABS.map((x) => `<button class="btn${this.tab === x.id ? " is-on" : ""}" data-v="tab" data-tab="${x.id}" role="tab" title="${esc(x.hint)}">${esc(x.label)}</button>`).join("")}</span>` +
      `<button class="btn mix-more${this.menuOpen ? " is-on" : ""}" data-v="more" title="更多：加混音轨…">⋯</button>`;
    const menu = this.el.querySelector<HTMLElement>(".mix-menu")!;
    menu.hidden = !this.menuOpen;
    menu.innerHTML = this.menuOpen ? `<button class="btn cand" data-v="addbus" title="加一条混音轨（路由轨）：几条轨发过来一起过效果，比如共用一个混响">＋ 混音轨</button>` : "";
  }
  /** 一张卡片：顶上一条峰值细线 + 名字 + 这一页的内容。 */
  private card(id: string, cls: string, name: string, who: string, body: string, color?: string): string {
    const spec = this.tab === "eq" ? this.specSvg(id) : this.tab === "basic" ? GONIO_SVG : this.tab === "comp" ? this.compSvg(id) : "";   // EQ 页：卡片背景 = 频谱 + 这一格 EQ 的曲线；基础页 = 每张卡都有李萨如图（单声道轨 = 声像角度的一根线）
    // 卡片一样高（= 基础页的那么高；v0.10.21，user「混音台能解决卡片太长的问题吗？不方便纵览。能不能约定一个卡片的fixed的大小，然后里面自己想办法」「我比较喜欢基础模式的卡片大小」）：名字钉在上面，下面的放不下 = 卡片里自己滚
    return `<div class="strip${cls}" data-id="${esc(id)}"${color ? ` data-color style="--cat:${esc(color)}"` : ""}>${spec}<div class="strip-meter"><i></i></div>${name}${who ? `<div class="strip-who">${esc(who)}</div>` : ""}<div class="strip-body">${body}</div></div>`;
  }
  render(): void {
    const box = this.el.querySelector(".studio-strips")!, m = this.host.master(), tab = this.tab, off = this.host.bypass();
    const ab = this.el.querySelector<HTMLElement>(".mix-ab")!;   // A/B：效果开着 / 全关（user「混音台加一个暂时禁用所有魔法的toggle」）
    ab.textContent = off ? "效果全关" : "效果开着"; ab.classList.toggle("is-on", !off); ab.classList.toggle("ab-off", off);
    ab.title = off ? "现在：插件和发送都不响（推子 / 声像留着）。点 = 效果回来" : "点 = 暂时关掉全部效果（插件 + 发送），听谱子本身 / 听差别；推子、声像留着";
    this.el.querySelector<HTMLElement>(".mix-ab-note")!.hidden = !off; this.el.classList.toggle("bypassed", off);
    const fb = this.el.querySelector<HTMLElement>(".mix-full")!; fb.textContent = this.full ? "还原" : "全屏"; fb.classList.toggle("is-on", this.full);
    if (this.open && !this.slotOf(this.open)) this.open = null;   // 撤销把这一格撤没了
    this.renderBar();
    const nameDiv = (s: string) => `<div class="strip-name">${esc(s)}</div>`;
    // 总轨
    const masterBody = tab === "basic" ? row("增益", HINT.masterGain, `<output>${dbText(m.gainDb)}</output>`, slider({ min: -24, max: 12, step: 0.5, value: m.gainDb, attrs: "data-master", def: 0, defText: "0 dB" }), "strip-row") +
        row("限幅", HINT.limiter, "", `<button class="btn cand${m.limiter ? " is-on" : ""}" data-v="limiter">${m.limiter ? "开着" : "关着（可能削波）"}</button>`, "strip-row") +
        row("峰值", HINT.peak, `<span class="meter-val">—</span>`, "", "strip-row") + RMS_ROW + CORR_ROW
      : tab === "eq" || tab === "comp" ? this.inlineHtml(MASTER, tab) : tab === "send" ? `<div class="fx-dim">总轨就是输出，不再发给别处</div>` : this.chipsHtml(MASTER);
    const master = this.card(MASTER, " master", nameDiv("总轨"), "所有声部混在一起之后", masterBody);
    // 混音轨（自己加的路由轨，普通的轨）：排在总轨后面、歌手前面（user「你自己加的中间的路由轨也是普通的轨道，排在总轨后面，歌手前面」）
    const buses = this.host.buses(), busCards = buses.map((b, k) => {
      const body = tab === "basic" ? row("增益", HINT.gain, `<output>${dbText(b.gainDb)}</output>`, slider({ min: -24, max: 12, step: 0.5, value: b.gainDb, attrs: "data-busgain", def: 0, defText: "0 dB" }), "strip-row") +
          row("声像", HINT.pan, `<output>${panText(b.pan)}</output>`, slider({ min: -1, max: 1, step: 0.05, value: b.pan, attrs: "data-buspan", def: 0, defText: "中" }), "strip-row") + RMS_ROW + CORR_ROW +
          `<div class="strip-btns"><button class="btn" data-v="busleft" title="往前挪一位"${k === 0 ? " disabled" : ""}>‹</button><button class="btn" data-v="busright" title="往后挪一位"${k === buses.length - 1 ? " disabled" : ""}>›</button><button class="btn cand danger" data-v="delbus" title="删掉这条混音轨（发给它的、出到它的都改回总轨；能撤销）">删掉</button></div>`
        : tab === "eq" || tab === "comp" ? this.inlineHtml(b.id, tab) : tab === "send" ? this.routeHtml(b.id) : this.chipsHtml(b.id);
      const name = tab === "basic" ? `<input class="bus-name" value="${esc(b.name)}" title="名字（点了改）" />` : nameDiv(b.name);
      return this.card(b.id, " bus", name, "混音轨", body);
    }).join("");
    // 歌手：顺序跟谱上的声部（user「歌手卡片的排序还是以五线谱为准」）
    const strips = this.host.strips(), singers = strips.map((s, k) => {
      const body = tab === "basic" ? row("增益", HINT.gain, `<output>${dbText(s.gainDb)}</output>`, slider({ min: -24, max: 12, step: 0.5, value: s.gainDb, attrs: "data-gain", def: 0, defText: "0 dB" }), "strip-row") +
          row("声像", HINT.pan, `<output>${panText(s.pan)}</output>`, slider({ min: -1, max: 1, step: 0.05, value: s.pan, attrs: "data-pan", def: 0, defText: "中" }), "strip-row") + RMS_ROW +
          `<div class="strip-btns"><button class="btn cand${s.muted ? " is-on" : ""}" data-v="mute">静音</button><button class="btn cand${s.solo ? " is-on" : ""}" data-v="solo">独奏</button>` +
            `<button class="btn" data-v="partleft" title="往前挪一位（谱上这个声部也往上挪）"${k === 0 ? " disabled" : ""}>‹</button><button class="btn" data-v="partright" title="往后挪一位（谱上这个声部也往下挪）"${k === strips.length - 1 ? " disabled" : ""}>›</button></div>` +
          // 歌手管理（2026-10-08 深夜，user「只有没引用的时候才可以在歌手管理里面删」）：在几张纸上；一张都不在 = 能删
          (s.refs ? `<div class="strip-refs">在 ${s.refs} 张纸上</div>` : `<div class="strip-refs">哪张纸上都没有 <button class="btn cand danger" data-v="delpart" title="删掉这位歌手（休息室里它的配置一起删；能撤销）">删掉这位歌手</button></div>`)
        : tab === "eq" || tab === "comp" ? this.inlineHtml(s.id, tab) : tab === "send" ? this.routeHtml(s.id) : this.chipsHtml(s.id);
      return this.card(s.id, "", nameDiv(s.name), s.performer, body, s.color);
    }).join("");
    box.innerHTML = master + busCards + singers;
    this.watchCards();   // 卡片重画了：重新看哪些在屏幕里
    box.classList.toggle("wide", tab === "eq" || tab === "comp");
    this.renderPanel();
  }
}
// 参数的类型（给宿主用）
export type { Params };
