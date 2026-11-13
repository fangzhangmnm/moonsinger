// studio.ts —— 混音台（「听」的底座；user 2026-10-10「能不能混音台就是听的键盘」）。谱留着能看。
// created 2026-10-08 by Claude Fable 5.1（一个声部一条：名字 / 谁来演 / 增益 dB / 声像 / 静音 / 独奏 + 总轨）。
// 2026-10-10 v0.10.8（Claude Opus 5.5）：每条轨一排插件格（src/ui/plugins.ts）——歌手轨第一格 = 默认 EQ（没碰过 = 不在文件里 = 平；能关、能换面板，不能删），
//   「＋」= 往这条轨插任何插件；面板 = 一键 / 全量（同一组参数的两种看法）。数据 = studio.json v2 现成的效果链（FxV2），不升格式。
// v0.10.9：混音轨（路由轨）——出到 / 发送 / 总线接总线。
// v0.10.10：**按插件分页**（user「把不同插件的tab切换给放在混音台的顶栏上，然后所有卡片统一显示对应插件的操作和仪表盘？比如最基础的模式就是gain和pan
//   然后峰值放在卡片的顶部一条细线，所有插件模式都有…然后不同模式下面具体用哪个插件显示模式可以下拉。然后basic模式下如果有advanced的和basic preset不一样的情况需要披露」→「12都同意」）：
//   页签 = 混音的顺序（基础 = 增益 / 声像 / 静音独奏 → EQ → 压缩 → 发送 → 链 = 全部插件格）；EQ / 压缩页每张卡片直接摊开那一格的控件（一键 / 全量下拉，全部卡片一起换）；
//   每张卡片顶上一条峰值细线（所有页都有；录音房只在混音台开着时报）。加混音轨在页签那一行的「⋯」里（user「混音轨不要用一个单独的空页面，可以在混音台的顶栏上面加一个...的目录，里面有加混音轨。然后混音轨之间还可以排序。然后歌手卡片的排序还是以五线谱为准」）。
import { dropdownHtml, mountDropdowns } from "./dropdown.ts";
import { _t } from "../i18n/index.ts";
import type { FxV2, LimiterParamsV2 } from "../format/contract.ts";
import { TEMPLATE } from "../format/template.ts";   // 推子 / 声像 / 发送「双击回默认」= 模板（16-4 A2）
import { eqResponseDb } from "../engine/fx.ts";
import { busLinkStates, type LinkState } from "../engine/studio.ts";
import { SPEC_BANDS, bandHz, bandsDb, smoothBands, areaPath, xOfHz } from "./spectrum.ts";
const SPEC_TICKS = [100, 1000, 10000];
import { keepShownOnOff, DEFAULT_EQ_ID, PLUGIN_KINDS, freshParams, fullParams, fxSummary, paramsOf, pluginName, fullyWet, paramView, projectToSimple, viewOfFx, type Params } from "./plugins.ts";
import { paramRow, slider, wireParamRows } from "../keyboard/param-row.ts";
import { stereoShape } from "./scopes.ts";
import { sideDocked } from "../app/workspace.ts";

export interface StudioStrip { id: string; name: string; performer: string; gainDb: number; pan: number; muted: boolean; solo: boolean; refs: number; color?: string;   // color = 类别色（卡片顶边，v0.9.31）
  /** 上场那位乐手自己的「响度」（dB，候选的 calibrationDb；乐器页「响度」那一行）：渲染时和推子相加。不是 0 = 推子旁边照实写出来（第 14 条：推子写 0、实际轻 6 dB 是看不见的那一处）。 */
  performerDb: number;
  /** 上场那位乐手身上除了「响度」以外和现在的默认不一样的有几处（16-6，performers/defaults.ts 一处算）：不是 0 = 推子旁边「乐手 N 处不同」，点了去乐器页顶上那一句。 */
  performerDiffs: number }   // refs = 在几张纸上（0 = 能删）
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
  /** 去这位歌手的乐器页：at = "cal" 落在「响度」那一行（推子旁边「乐手 −6 dB」那颗钮）；"sum" 落在顶上「和现在的默认不一样的有几处」那一句（「乐手 N 处不同」，16-6）。 */
  openPerformer(id: string, at: "cal" | "sum"): void;
  /** 总轨（2026-10-10 刀 3）：增益 dB + 母线限幅开关；进歌（studio.json master）。 */
  master(): { gainDb: number; limiter: boolean; limiterParams: LimiterParamsV2 };
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
  buses(): { id: string; name: string; gainDb: number; pan: number; bypass: boolean; muted?: boolean }[];
  /** 混音轨静音（v0.10.35，视图态；不进文件）。 */
  toggleBusMute?(id: string): void;
  /** 混音轨整条旁通（插件全跳过，推子 / 声像 / 发送照旧；v0.10.23）。 */
  setBusBypass(id: string, on: boolean): void;
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
  /** 贴底时显示几排卡片（v0.16.14，同小键盘的「行」；user 11-07「混音应该和键盘一样，也可以显示能显示几列卡，但是看一下屏幕高度上限」）：
   *  "auto" = 半屏放得下的最多排（原来的样子）；数字 = 就这么多排，但最多到屏幕高度上限（谱至少还露一条）。宿主记在设备上。 */
  rowsPref?(): number | "auto";
  setRowsPref?(v: number | "auto"): void;
}
/** 手动排数的高度上限：舞台高减去这么多（px）= 谱至少还露一条、能看见在哪。 */
const SCORE_SLIVER = 96;
export const MASTER = "__master";
export type MixTab = "basic" | "eq" | "comp" | "send" | "chain";
/** 页签 = 混音的顺序（平衡 / 摆位 → 频率 → 动态 → 空间；最后一页是全部插件格）。 */
const TABS: { id: MixTab; label: string; hint: string }[] = [
  { id: "basic", label: _t("基础"), hint: _t("增益、声像、静音 / 独奏：先把几条轨的音量摆平、左右摆开（混音的第一步）") },
  { id: "eq", label: "EQ", hint: _t("每条轨的默认 EQ：两样东西糊在一起、太闷 / 太刺") },
  { id: "comp", label: _t("压缩"), hint: _t("每条轨上的第一个压缩：把忽大忽小拉平") },
  { id: "send", label: _t("发送"), hint: _t("出到哪、推子后发给哪几条混音轨（混响 / 延迟放在混音轨上，几条轨共用）") },
  { id: "chain", label: _t("链"), hint: _t("每条轨上的全部插件格：随便插、开关、拿掉") },
];
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const panText = (p: number) => (Math.abs(p) < 0.025 ? _t("中") : p < 0 ? _t("左 {p}", { p: Math.round(-p * 100) }) : _t("右 {p}", { p: Math.round(p * 100) }));
const dbText = (d: number) => `${d > 0 ? "+" : ""}${d.toFixed(1)} dB`;
const toDb = (x: number) => (x > 1e-5 ? 20 * Math.log10(x) : -60);
const row = paramRow;   // 一行参数 = 深模块 param-row.ts（名字 + 问号 + 读数 + 控件；滑块的滚轮 / 双击也在那里）
const HINT = {
  gain: _t("增益（推子）：这条轨整体的音量。混音的第一步 = 先把几条轨的音量摆平"),
  pan: _t("声像：在左右哪个位置。几条轨左右错开一点，就不会都挤在正中间。数字 = 往一边推了多少（等功率：怎么摆总响度不变）：中 = 两个喇叭各 −3 dB；50 = 这边 −0.7 dB、那边 −8.3 dB（差 7.7 dB）；100 = 全在这边，另一边没声"),
  masterGain: _t("总轨增益：所有轨混在一起之后整体再调大调小"),
  out: _t("出到：这条轨的声音最后去哪——直接去总轨，或者先进一条混音轨（在那里一起过效果）"),
  send: _t("发送：推子之后再复制一份给这条混音轨——跟着这条轨的增益和声像走：推子拉低 3 dB，发过去的也低 3 dB（原声和效果的比例不变）；静音了就不发。这里的数 = 这一位进那边的量，越大那边的效果（混响 / 延迟）越多；原声照旧走「出到」"),
  busGain: _t("混音轨增益：从这条混音轨出来的总量。混响 / 延迟这类全湿的混音轨 = 那边的效果有多大，发给它的几位一起变（每位单独多少看各自的「发送」）。要是有几位是「出到」它（原声也进来），那这个推子连原声一起调"),
  peak: _t("峰值：最近这一下最响的那个采样（dBFS）。0 dB = 满格，再大就削波；限幅开着时最多到天花板。顶上的细线是同一个数"),
  rms: _t("平均电平（RMS，最近 0.3 秒，推子之后，dBFS）：比峰值更接近耳朵觉得的响。几条轨摆平音量看这个；顶上的细线（峰值）看会不会爆"),
  corr: _t("左右相关（−1 到 +1）：+1 = 左右一样（单声道）；0 附近 = 很宽；小于 0 = 左右反相，手机外放 / 单声道一合就会变小、变空。背景的图：竖线 = 单声道，越圆越宽，横着 = 反相；往左上斜 = 偏左声道、往右上斜 = 偏右"),
  gr: _t("压了多少：这条轨上第一台压缩此刻把声音压低了几 dB（下面摊开的就是它）。一直压很多 = 阈值太低或比例太大"),
  key: _t("被谁压（侧链）：压缩器不看自己，而看另一条轨有多响——比如小月相一唱，伴奏自己让一点"),
};
/** 压缩页的波形图存多少段（~21 ms 一段 = ~4 s）。 */
const COMP_HIST = 192;
const RMS_ROW = row(_t("平均"), HINT.rms, `<output class="rms-val">—</output>`, "", "strip-row");
const CORR_ROW = row(_t("左右相关"), HINT.corr, `<output class="corr-val">—</output>`, "", "strip-row");
/** 李萨如图的底：竖线 = 单声道、横线 = 反相；左上 / 右上 = 只有左 / 右声道。 */
/** 卡片背景画李萨如图的几页（基础 / 发送 / 链；v0.16.82，user「发送」「链」两页也要）。统计照旧只在混音台开着、页面看得见、在这几页时算（main.ts syncSpectrum）。 */
export const STEREO_TABS: ReadonlySet<string> = new Set(["basic", "send", "chain"]);
const GONIO_SVG = `<svg class="strip-gonio" viewBox="-1 -1 2 2" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path class="gon-axis" d="M0,-1L0,1M-1,0L1,0"/><path class="gon" d=""/></svg>`;   // 不写「左 / 右」字（v0.10.21，user「李萨如 左字和ui overlap了」）：方向写在「左右相关」的问号里
/** 一格的位置：哪条轨的哪一格（插件格的读写、面板和卡片上摊开的控件都按它找）。 */
interface Target { track: string; fx: string }

/** 总轨「限幅」的问号（16-4 C）：四个数照这首歌文件里写的说。 */
function limiterHint(p: LimiterParamsV2): string {
  return _t("限幅（总轨最后一道）：前瞻 {la} ms 看见要超过天花板（{c} dBFS = 满幅的 {lin}）的那一下，按「起」{a} ms 提前把它压下来，过了按「放」{r} ms 慢慢松开；不超的地方一个采样都不动，不改音色。输出因此晚 {la} ms（导出时扣掉）。这四个数存在这首歌里，这一版没有调节的钮。关掉 = 超了就削波（爆音、导出的文件里也是）。一般一直开着；想看自己的混音到底多响，可以先关了看峰值",
    { la: p.lookaheadMs, c: (20 * Math.log10(p.ceiling)).toFixed(2), lin: p.ceiling, a: p.attackMs, r: p.releaseMs });
}
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
  private shownRows = 0; private capRows = 1;   // 这会儿显示了几排 / 屏幕最多放得下几排（fitHeight 算；「⋯」里排数的 − + 用）
  /** 插件参数的剪贴板（v0.10.23；user「待会：效果器预设可以拷贝，类似Unity的component，尽量严格一点避免混淆。不读快捷键」）：
   *  拷 = 这一格的种类 + 全部参数（不拷开 / 关、不拷「被谁压」）；粘参数 = 只能粘到同一种插件上（覆盖参数，开关 / 被谁压照旧）；粘成新的一格 = 链尾加一格。这次打开里有效、没有快捷键。 */
  private fxClip: { kind: string; params: Params; from: string } | null = null;
  private clipBtns(tg: Target, fx: FxV2): string {
    const c = this.fxClip, here = `${this.trackName(tg.track)} · ${pluginName(fx.kind)}`;
    const copy = `<button class="btn" data-v="fxcopy" title="${_t("拷这一格的参数（种类 + 全部参数；不拷开关、不拷被谁压）")}">${_t("拷参数")}</button>`;
    const paste = c && c.kind === fx.kind ? `<button class="btn" data-v="fxpaste" title="${_t("把拷的参数（来自「{from}」）盖到这一格上；开关 / 被谁压照旧；能撤销", { from: esc(c.from) })}">${_t("粘参数")}</button>` : "";
    return copy + (c && c.from === here && paste ? "" : paste);
  }
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
    addEventListener("resize", () => this.fitHeight());   // 转屏 / 窗口变了：重新按整排对齐
    this.el = document.createElement("div"); this.el.className = "studio"; this.el.hidden = true;
    this.el.innerHTML = `<div class="finder-bar"><span class="finder-title">${_t("混音台")}</span><button class="btn" data-v="play" title="${_t("播放（空格）")}"><svg class="ico"><use href="#play"/></svg></button><button class="btn mix-ab" data-v="bypass"></button>` +
      // 右边这一组（v0.16.82，总表第 9 条 ①②③，从右往左）：收起（和键盘的收起钮同一个位置）· ⋯ 设置 ·「＋ 混音轨」· 全屏（图标）
      `<span class="mix-right"><button class="btn mix-full" data-v="full"><svg class="ico"><use href="#maximize-viewport"/></svg></button>` +
      `<button class="btn mix-addbus" data-v="addbus" title="${_t("加一条混音轨（路由轨）：几条轨发过来一起过效果，比如共用一个混响")}">${_t("＋ 混音轨")}</button>` +
      `<button class="btn mix-more" data-v="more" title="${_t("更多：排数…")}">⋯</button>` +
      `<button class="btn mix-hide" data-v="back" title="${_t("收起混音台：底座让出来、还在「听」（Esc = 回去写）")}" aria-label="${_t("收起")}"><svg class="ico"><use href="#mixer-collapse"/></svg></button></span></div>` +
      `<div class="mix-tabbar"></div><div class="fx-note mix-ab-note" hidden>${_t("效果全关着：插件和发送都不响，只剩推子、声像、出到和总轨限幅——听谱子本身 / 听差别用；再点一下回来。导出照常带效果。")}</div><div class="mix-menu" hidden></div><div class="fx-panel" data-fxwrap hidden></div><div class="studio-strips"></div>`;
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
    if (this.el.hidden || !STEREO_TABS.has(this.tab)) return;
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
    const hotAt = this.host.master().limiterParams.ceiling;   // 到了总轨限幅的天花板 = 标红（16-4 C：天花板是文件里的数）
    for (const el of this.el.querySelectorAll<HTMLElement>(".strip[data-id]")) {
      const id = el.dataset.id!, raw = stale ? 0 : this.target.get(id) ?? 0, want = toDb(raw), cur = this.shown.get(id) ?? -60;
      const next = want >= cur ? want : Math.max(want, cur - 30 * dt);
      this.shown.set(id, next); if (next > -59.5) alive = true;
      const bar = el.querySelector<HTMLElement>(".strip-meter > i");
      if (bar) { bar.style.width = `${Math.max(0, Math.min(100, ((next + 60) / 60) * 100))}%`; bar.classList.toggle("hot", raw >= hotAt); bar.parentElement!.classList.toggle("hot", raw >= hotAt); }
      // 平均电平：均方按 0.3 s 时间常数平滑（RMS）
      const msWant = stale ? 0 : this.msTarget.get(id) ?? 0, msCur = this.msShown.get(id) ?? 0, ms = msCur + (msWant - msCur) * (1 - Math.exp(-dt / 0.3));
      this.msShown.set(id, ms); if (ms > 1e-6) alive = true;
      { const rb = el.querySelector<HTMLElement>(".strip-meter > b"); if (rb) { const d = ms > 1e-9 ? 10 * Math.log10(ms) : -120; rb.style.width = `${Math.max(0, Math.min(100, ((d + 60) / 60) * 100))}%`; } }   // 电平条的实心段 = 平均（同一把 −60…0 dB 尺子）
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
    else if (v === "rows:-" || v === "rows:+" || v === "rows:auto") {   // 排数（v0.16.14）：从现在显示的那么多排起加减；到屏幕高度上限为止
      const pref = this.host.rowsPref?.() ?? "auto", base = pref === "auto" ? this.shownRows : Math.min(pref, this.capRows);
      this.host.setRowsPref?.(v === "rows:auto" ? "auto" : Math.max(1, Math.min(this.capRows, base + (v === "rows:+" ? 1 : -1))));
      this.fitHeight();
    }
    else if (v === "addbus") { this.menuOpen = false; const id = this.host.addBus(); this.render(); this.el.querySelector<HTMLElement>(`.strip[data-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: "nearest" }); }
    else if (v === "mute" && strip) { this.host.toggleMute(strip); this.render(); }
    else if (v === "solo" && strip) { this.host.toggleSolo(strip); this.render(); }
    else if (v === "busmute" && strip) { this.host.toggleBusMute?.(strip); this.render(); }
    else if (v === "busbypass" && strip) { const b = this.host.buses().find((x) => x.id === strip); if (b) { this.host.setBusBypass(strip, !b.bypass); this.render(); } }
    else if ((v === "partleft" || v === "partright") && strip) { this.host.movePart(strip, v === "partleft" ? -1 : 1); this.render(); }
    else if (v === "delpart" && strip) this.host.deletePart(strip);
    else if (v === "broken" && strip) {   // 去第一处断了的那一页（被谁压 = 链页、打开那一格）
      const b = this.brokenOf(strip)[0]; if (!b) return;
      this.tab = b.page; this.menuOpen = false; this.addFor = null; this.specShown.clear(); this.compHist.clear();
      if (b.where.startsWith("key:")) this.open = { track: strip, fx: b.where.slice(4) };
      this.render(); this.host.tabChanged?.(this.tab);
    }
    else if (v === "perfdb" && strip) this.host.openPerformer(strip, "cal");
    else if (v === "perfdiff" && strip) this.host.openPerformer(strip, "sum");
    else if (v === "limiter") { this.host.toggleLimiter(); this.render(); }
    else if (v === "delbus" && strip) { if (this.open?.track === strip) this.open = null; this.host.removeBus(strip); this.render(); }
    else if ((v === "busleft" || v === "busright") && strip) { this.host.moveBus(strip, v === "busleft" ? -1 : 1); this.render(); }
    else if (v === "sendx" && strip) { const to = t.closest<HTMLElement>("[data-to]")!.dataset.to!; this.host.setSends(strip, this.host.sends(strip).filter((x) => x.to !== to), _t("不再发给 {to}", { to: this.trackName(to) })); this.render(); }
    else if (v === "fx" && strip) { const id = t.closest<HTMLElement>("[data-fx]")!.dataset.fx!; this.toggleOpen(strip, id); }
    else if (v === "fxadd" && strip) { this.addFor = this.addFor === strip ? null : strip; this.render(); }
    else if (v === "fxpick" && strip) this.addFx(strip, t.closest<HTMLElement>("[data-kind]")!.dataset.kind!, true);
    else if (v === "fxaddkind" && strip) this.addFx(strip, t.closest<HTMLElement>("[data-kind]")!.dataset.kind!, false);
    else if (v === "fxmode" && tg) { this.cardMode.set(`${tg.track}\n${tg.fx}`, t.closest<HTMLElement>("[data-mode]")!.dataset.mode as "simple" | "full"); this.render(); }
    else if (v === "fxclose") { this.open = null; this.render(); }
    else if (v === "fxdel" && tg) this.deleteFx(tg);
    else if (v === "fxon" && tg) { this.patch(tg, (fx) => ({ ...fx, on: fx.on === false }), _t("开 / 关")); this.render(); }
    else if (v === "fxtoggle" && tg) { const id = t.closest<HTMLElement>("[data-c]")!.dataset.c!; this.simpleSet(tg, id, (this.simpleNow(tg)?.[id] ?? 0) ? 0 : 1, false); this.render(); }
    else if (v === "fxchoice" && tg) { const b = t.closest<HTMLElement>("[data-c]")!; this.simpleSet(tg, b.dataset.c!, Number(b.dataset.val), false); this.render(); }
    else if (v === "fxcopy" && tg) { const sl = this.slotOf(tg); if (sl) { this.fxClip = { kind: sl.fx.kind, params: structuredClone(paramsOf(sl.fx)), from: `${this.trackName(tg.track)} · ${pluginName(sl.fx.kind)}` }; this.render(); } }
    else if (v === "fxpaste" && tg && this.fxClip) { const c = this.fxClip, sl = this.slotOf(tg); if (sl && sl.fx.kind === c.kind) { this.patch(tg, (fx) => ({ ...fx, params: structuredClone(c.params) }), _t("粘参数")); this.render(); } }   // 严格：种类不同不粘
    else if (v === "fxpastenew" && strip && this.fxClip) { const c = this.fxClip, ch = this.host.chain(strip), used = new Set(ch.map((f) => f.id)); let n = 1; while (used.has(`${c.kind}${n}`)) n++;
      const fx: FxV2 = { id: `${c.kind}${n}`, kind: c.kind, params: structuredClone(c.params), on: true };   // 新插的一格明写开着（16-4 A2：出声那一层照写的读开关）
      this.host.setChain(strip, [...ch, fx], _t("{strip} 粘成新的一格：{kind}", { strip: this.trackName(strip), kind: pluginName(c.kind) })); this.addFor = null; this.open = { track: strip, fx: fx.id }; this.render(); }
    else if (v === "fxproject" && tg) { this.patch(tg, (fx) => ({ ...fx, params: projectToSimple(fx.kind, this.onBus(tg.track), paramsOf(fx), !!fx.key) }), _t("改成最接近的一键")); this.render(); }
    else if (v === "fxbool" && tg) { const id = t.closest<HTMLElement>("[data-p]")!.dataset.p!; this.patch(tg, (fx) => ({ ...fx, params: this.keepShown(tg, fx, { ...paramsOf(fx), [id]: paramsOf(fx)[id] ? 0 : 1 }) }), id); this.render(); }
  }
  private onInput(e: Event): void {
    const t = e.target as HTMLInputElement, tg = this.targetOf(t);
    if (tg && t.dataset.c !== undefined) { this.simpleSet(tg, t.dataset.c, Number(t.value), true, t); return; }   // 一键的旋钮
    if (tg && t.dataset.p !== undefined) { this.fullSet(tg, t); return; }                                       // 全量的参数
    const strip = t.closest<HTMLElement>(".strip"); if (!strip) return;
    const id = strip.dataset.id!, out = t.parentElement?.querySelector("output"), v = Number(t.value);
    if (t.dataset.send !== undefined) { const to = t.dataset.send; this.host.setSends(id, this.host.sends(id).map((x) => (x.to === to ? { ...x, gainDb: v } : x)), _t("发给 {to} {v}", { to: this.trackName(to), v: dbText(v) }), `send:${id}:${to}`); if (out) out.textContent = dbText(v); }
    else if (t.dataset.busgain !== undefined) { this.host.setBusGain(id, v); if (out) out.textContent = dbText(v); }
    else if (t.dataset.buspan !== undefined) { this.host.setBusPan(id, v); if (out) out.textContent = panText(v); }
    else if (t.dataset.master !== undefined) { this.host.setMasterGain(v); if (out) out.textContent = dbText(v); }
    else if (t.dataset.gain !== undefined) { this.host.setGain(id, v); if (out) out.textContent = dbText(v); }
    else if (t.dataset.pan !== undefined) { this.host.setPan(id, v); if (out) out.textContent = panText(v); }
  }
  private onChange(e: Event): void {
    const t = e.target as HTMLButtonElement & HTMLInputElement, strip = t.closest<HTMLElement>(".strip")?.dataset.id, tg = this.targetOf(t);
    if (strip && t.dataset.out !== undefined) { this.host.setOutTo(strip, t.value); this.render(); return; }
    if (strip && t.dataset.sendadd !== undefined && t.value) { this.host.setSends(strip, [...this.host.sends(strip), { to: t.value, gainDb: TEMPLATE.studio.sendGainDb }], _t("发给 {value}", { value: this.trackName(t.value) })); this.render(); return; }
    if (strip && t.classList.contains("bus-name")) { const name = t.value.trim(); if (name) this.host.renameBus(strip, name); this.render(); return; }
    if (tg && t.dataset.key !== undefined) {   // 换「被谁压」：原来是一键的样子 = 换成另一套公式（侧链不补偿）照旧是一键，「压多少」不变
      const v = t.value, bus = this.onBus(tg.track);
      this.patch(tg, (fx) => { const { key: _k, ...rest } = fx, nx: FxV2 = v ? { ...rest, key: v } : rest, was = viewOfFx(fx, bus)?.read(paramsOf(fx)), view = viewOfFx(nx, bus);
        return was && view ? { ...nx, params: view.write(was, paramsOf(nx)) } : nx; }, _t("被谁压")); this.render(); }
  }

  // ── 插件格 ──────────────────────────────────────────────────────────────
  /** 一条轨显示的格子：歌手轨 / 混音轨没有默认 EQ 那一格 = 补一个虚的（平，不在文件里）。 */
  private slots(track: string): { fx: FxV2; virtual: boolean }[] {
    const ch = this.host.chain(track), out = ch.map((fx) => ({ fx, virtual: false }));
    if (track !== MASTER && !ch.some((f) => f.id === DEFAULT_EQ_ID)) out.unshift({ fx: { id: DEFAULT_EQ_ID, kind: "eq", params: freshParams("eq"), on: true }, virtual: true });
    return out;
  }
  private slotOf(tg: Target): { fx: FxV2; virtual: boolean } | null { return this.slots(tg.track).find((s) => s.fx.id === tg.fx) ?? null; }
  private onBus(track: string): boolean { return this.host.buses().some((b) => b.id === track); }
  private trackName(track: string): string { return track === MASTER || track === "master" ? _t("总轨") : this.host.strips().find((s) => s.id === track)?.name ?? this.host.buses().find((b) => b.id === track)?.name ?? track; }
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
    return `<span class="fx-seg"><button class="btn${m === "simple" ? " is-on" : ""}" data-v="fxmode" data-mode="simple" title="${_t("几个大旋钮，按公式调下面全量的参数（只换这一格）")}">${_t("一键")}</button><button class="btn${m === "full" ? " is-on" : ""}" data-v="fxmode" data-mode="full" title="${_t("每一个参数都摊开（只换这一格）")}">${_t("全量")}</button></span>`;
  }
  private addFx(track: string, kind: string, openPanel: boolean): void {
    const ch = this.host.chain(track), used = new Set(ch.map((f) => f.id)); let n = 1; while (used.has(`${kind}${n}`)) n++;
    const fx: FxV2 = { id: `${kind}${n}`, kind, params: freshParams(kind, this.onBus(track)), on: true };
    this.host.setChain(track, [...ch, fx], _t("{track} 插上{kind}", { track: this.trackName(track), kind: pluginName(kind) }));
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
    this.host.setChain(tg.track, ch.filter((x) => x.id !== tg.fx), _t("{track} 拿掉{gone}", { track: this.trackName(tg.track), gone: pluginName(gone?.kind ?? "") }));
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
  /** 全量面板里关掉「自动低切」/ 把「跟速度」拨到 0 的那一刻（统筹 2026-11-12 夜「v0.17.14 收」补的一件）：把关之前面板上正显示的那个算出来的数写进 hpHz / timeMs，
   *  和关开关同一步撤销——不然这次打开里刚开的、没存过的那一格，关掉后会落回内存里一个没在用的旧数（存过再开的则停在存的时候写的数上：同一个动作两种结果）。一键面板不走这里。 */
  private keepShown(tg: Target, fx: FxV2, next: Record<string, number>): Record<string, number> { return keepShownOnOff(fx, next, this.host.resolve(tg.track, fx)); }
  private fullSet(tg: Target, t: HTMLInputElement): void {
    const s = this.slotOf(tg); if (!s) return;
    const id = t.dataset.p!, d = fullParams(s.fx.kind).find((x) => x.id === id); if (!d) return;
    const sl = paramView(s.fx.kind, d), v = sl.toV(Number(t.value));
    this.patch(tg, (fx) => ({ ...fx, params: this.keepShown(tg, fx, { ...paramsOf(fx), [id]: v }) }), d.label, true);
    const out = t.parentElement?.querySelector("output"); if (out) out.textContent = sl.fmt(v);
  }

  // ── 画 ──────────────────────────────────────────────────────────────────
  /** 一格的控件（一键 / 全量）：「链」页顶上的面板和 EQ / 压缩页卡片上摊开的共用。 */
  private controlsHtml(tg: Target, fx: FxV2, mode: "simple" | "full"): string {
    const bus = this.onBus(tg.track), p = paramsOf(fx), view = viewOfFx(fx, bus), read = view?.read(p) ?? null;
    const keyOpts = fx.kind === "comp" ? this.host.keyTracks(tg.track) : [];
    const keyBroken = fx.kind === "comp" && !!fx.key && !keyOpts.some((x) => x.id === fx.key);   // 被谁压的那条轨不在（第 16 条：照写原来的去处 + 断了）
    const keyRow = keyOpts.length || keyBroken ? row(_t("被谁压"), HINT.key, "", dropdownHtml([{ value: "", label: _t("不用（自己压自己）") }, ...keyOpts.map((x) => ({ value: x.id, label: x.name })), ...(keyBroken ? [{ value: fx.key!, label: _t("{key}（断了）", { key: fx.key! }) }] : [])], keyOpts.some((x) => x.id === fx.key) || keyBroken ? fx.key! : "", { attrs: "data-key" })) +
      (keyBroken ? `<div class="fx-note strip-broken-note">${esc(_t("被谁压：断了，「{key}」这条轨不在（现在听自己）", { key: fx.key! }))}</div>` : "") : "";   // 下拉 = 界面零件库的标准件（7-T）
    if (mode === "simple" && view) {
      // 在全量里调过（落不到一键公式上）= 一键锁着、旋钮不摆出来（user「没法用一键的时候那些一键的invalid slider可以不显示哈哈」），要改先点「改成最接近的一键」（v0.10.14；user「basic模式下应该有一个project to basic模式的功能，不然的话basic模式会是被锁住，免得不小心override」）
      const fp = freshParams(fx.kind, bus), fresh = view.read(fp) ?? view.project(fp), locked = !read, cur = read ?? {};
      return (locked ? `<div class="fx-note">${_t("在全量里调过，一键表达不了：一键先锁着，免得一碰就盖掉。")}<button class="btn cand" data-v="fxproject" title="${_t("按最接近的一键数值改写——全量里多调的会丢掉（比如中频那一刀）；能撤销")}">${_t("改成最接近的一键")}</button></div>` + keyRow : "") + (locked ? "" : view.controls.map((c) => {
        const v = cur[c.id] ?? 0;
        if (c.id === "autoLow" && !this.host.strips().some((x) => x.id === tg.track)) return row(c.label, c.hint, "", `<span class="fx-dim">${_t("混音轨 / 总轨上没有音，用不上{v}", { v: v ? _t("（开着也不切）") : "" })}</span>`);   // 自动低切按这一轨最低的音算：没有音 = 不起作用（v0.10.15）
        if (c.kind === "toggle") return row(c.label, c.hint, "", `<button class="btn cand${v ? " is-on" : ""}" data-v="fxtoggle" data-c="${c.id}">${v ? _t("开") : _t("关")}</button>`);
        if (c.kind === "choice") return row(c.label, c.hint, "", `<span class="fx-seg">${c.choices!.map((x) => `<button class="btn${Math.abs(v - x.v) < 1e-6 ? " is-on" : ""}" data-v="fxchoice" data-c="${c.id}" data-val="${x.v}">${esc(x.label)}</button>`).join("")}</span>`);
        return row(c.label, c.hint, `<output data-c="${c.id}">${c.fmt ? c.fmt(v) : v}</output>`, slider({ min: c.min!, max: c.max!, step: c.step!, value: v, attrs: `data-c="${c.id}"`, def: fresh[c.id], defText: fresh[c.id] == null ? undefined : c.fmt ? c.fmt(fresh[c.id]) : String(fresh[c.id]), }));
      }).join("") + keyRow);
    }
    const fresh = freshParams(fx.kind, bus);
    return fullParams(fx.kind).map((d) => {
      const sl = paramView(fx.kind, d);
      if (d.unit === "bool") return row(sl.label, sl.hint, "", `<button class="btn cand${p[d.id] ? " is-on" : ""}" data-v="fxbool" data-p="${d.id}">${p[d.id] ? _t("开") : _t("关")}</button>`);
      if (fx.kind === "eq" && d.id === "hpHz" && p.hpAuto) { const hz = this.host.resolve(tg.track, fx).params.hpHz ?? 0; return row(sl.label, sl.hint, "", `<span class="fx-dim">${hz > 0 ? _t("自动：{hz} Hz（这位最低的音往下四个半音）", { hz }) : _t("自动（这条轨没有音 = 不切）")}</span>`); }
      return row(sl.label, sl.hint, `<output>${sl.fmt(p[d.id])}</output>`, slider({ min: sl.min, max: sl.max, step: sl.step, value: sl.toS(p[d.id]), attrs: `data-p="${d.id}"`, def: sl.toS(fresh[d.id]), defText: sl.fmt(fresh[d.id]) }));
    }).join("") + keyRow;
  }
  /** EQ / 压缩页：这条轨上第一格这种插件，摊在卡片上（没有 = 「＋」）。 */
  private inlineHtml(track: string, kind: "eq" | "comp"): string {
    const all = this.slots(track).filter((s) => s.fx.kind === kind), s = all[0];
    if (!s) return `<button class="btn cand" data-v="fxaddkind" data-kind="${kind}" title="${_t("往这条轨上插一个{kind}", { kind: pluginName(kind) })}">＋ ${esc(pluginName(kind))}</button>`;
    const fx = s.fx, tg = { track, fx: fx.id };
    return `<div class="fx-inline${fx.on === false ? " off" : ""}" data-fxwrap data-track="${esc(track)}" data-fx="${esc(fx.id)}">` +
      `<div class="fx-inline-head"><button class="btn cand${fx.on === false ? "" : " is-on"}" data-v="fxon" title="${_t("关 = 这一格跳过（参数留着）")}">${fx.on === false ? _t("关着") : _t("开着")}</button>${all.length > 1 ? `<span class="fx-dim">${_t("还有 {p} 个{kind}在「链」里", { p: all.length - 1, kind: esc(pluginName(kind)) })}</span>` : ""}${this.modeSeg(tg)}${this.clipBtns(tg, fx)}</div>` +
      (kind === "comp" ? row(_t("压了"), HINT.gr, `<output class="gr-val">0 dB</output>`, `<span class="gr-bar"><i></i></span>`, "strip-row gr-row") : "") +
      `<div class="fx-body">${this.controlsHtml(tg, fx, this.modeOf(tg))}</div></div>`;
  }
  /** 出到 + 发送（歌手轨和路由轨都有；总轨没有）。 */
  /** 这条轨上断了的引用（第 16 条「断了要看得见」，统筹 2026-11-12：在人会去修它的那一页那一格写清；卡片上只一行「有 N 处断了」）：
   *  出到 / 发送去的混音轨不在或接成环（判法和录音房同一个 busLinkStates）、被谁压的那条轨不在。page = 去哪一页修。 */
  private brokenOf(track: string): { page: MixTab; where: string; why: string }[] {
    const buses = this.host.buses(), isBus = (id: string) => buses.some((b) => b.id === id), out: { page: MixTab; where: string; why: string }[] = [];
    const why = (st: LinkState, to: string) => (st === "missing" ? _t("断了：「{to}」这条混音轨不在", { to }) : _t("接成环了，没接上"));
    const onBus = isBus(track), states = onBus ? busLinkStates(buses.map((b) => ({ id: b.id, to: this.host.outTo(b.id), sends: this.host.sends(b.id) })), isBus).get(track) : undefined;
    const to = this.host.outTo(track), toSt: LinkState | null = states ? states.to : to !== "master" ? (isBus(to) ? "ok" : "missing") : null;
    if (toSt && toSt !== "ok") out.push({ page: "send", where: "out", why: `${why(toSt, to)}${_t("，现在出到总轨")}` });
    this.host.sends(track).forEach((sd, k) => { const st: LinkState = states ? states.sends[k] ?? "ok" : isBus(sd.to) ? "ok" : "missing"; if (st !== "ok") out.push({ page: "send", where: `send:${sd.to}`, why: `${why(st, sd.to)}${_t("，这一条不发")}` }); });
    const keys = new Set(this.host.keyTracks(track).map((x) => x.id));
    for (const fx of this.host.chain(track)) if (fx.kind === "comp" && fx.key && !keys.has(fx.key)) out.push({ page: "chain", where: `key:${fx.id}`, why: _t("被谁压：断了，「{key}」这条轨不在（现在听自己）", { key: fx.key }) });
    return out;
  }
  /** 卡片名字下面一行「有 N 处断了」（三种算进同一个数）；点了 = 去第一处所在的页。没有 = 不写。 */
  private brokenLine(track: string): string {
    const n = this.brokenOf(track).length;
    return n ? `<button class="btn strip-broken" data-v="broken" title="${esc(this.brokenOf(track).map((b) => b.why).join("；"))}">${_t("有 {n} 处断了", { n })}</button>` : "";
  }
  private routeHtml(track: string): string {
    const out = this.host.outTo(track), tg = this.host.targets(track), sends = this.host.sends(track), name = (id: string) => esc(this.trackName(id));
    const outSel = row(_t("出到"), HINT.out, "", dropdownHtml([...[{ id: "master", name: _t("总轨") }, ...tg].map((x) => ({ value: x.id, label: x.name })), ...(out !== "master" && !tg.some((x) => x.id === out) ? [{ value: out, label: _t("{out}（接不上）", { out: name(out) }) }] : [])], out, { attrs: "data-out" }), "strip-row");
    const rows = sends.map((sd) => `<div class="strip-send">${row(_t("发给 {to}", { to: this.trackName(sd.to) }), HINT.send, `<output>${dbText(sd.gainDb)}</output>`, slider({ min: -40, max: 6, step: 0.5, value: sd.gainDb, attrs: `data-send="${esc(sd.to)}"`, def: TEMPLATE.studio.sendGainDb, defText: dbText(TEMPLATE.studio.sendGainDb) }), "strip-row")}<button class="btn" data-v="sendx" data-to="${esc(sd.to)}" title="${_t("不再发给它")}">✕</button></div>`);
    const free = tg.filter((x) => !sends.some((sd) => sd.to === x.id));
    const add = free.length ? dropdownHtml([{ value: "", label: _t("＋ 发送到…") }, ...free.map((x) => ({ value: x.id, label: x.name }))], "", { cls: "send-add", attrs: "data-sendadd", title: _t("推子之后发一份到一条混音轨（混响 / 延迟这类放在混音轨上，几条轨共用）") }) : (tg.length ? "" : `<div class="fx-dim">${_t("还没有混音轨（顶栏「＋ 混音轨」加）")}</div>`);
    // 出到一条带全湿效果的混音轨 = 原声没了：明说（v0.10.10；user「开了混响结果铃声都哑掉了」）
    const wet = out !== "master" ? this.host.chain(out).find(fullyWet) : undefined;
    const warn = wet ? `<div class="fx-note">${_t("「{out}」上的{kind}是全湿的：出到它 = 原声没了，只剩{kind2}。要原声加{kind3}：出到总轨，用下面的「发送」。", { out: name(out), kind: esc(pluginName(wet.kind)), kind2: esc(pluginName(wet.kind)), kind3: esc(pluginName(wet.kind)) })}</div>` : "";
    // 出到一条带混响 / 延迟 / 合唱（插在上面、不是全湿）的混音轨：几条轨效果一样多、原声被它关小（v0.10.15；查 user 的 団子大家族 时发现：五条轨出到「空间感」，混响原声 0.67 = 悄悄 −3.5 dB）
    const shared = !wet && out !== "master" ? this.host.chain(out).find((f) => (f.kind === "reverb" || f.kind === "delay" || f.kind === "chorus") && f.on !== false) : undefined;
    const sharedDry = shared ? paramsOf(shared).dry : 1, dryDb = 20 * Math.log10(Math.max(1e-6, sharedDry));
    const note = shared ? `<div class="fx-note">${_t("出到「{out}」= 整条声音都过它的{kind}：出到它的几条轨{kind2}一样多{dryDb}。想每条轨各自多少：出到总轨、用下面的「发送」，那条混音轨上的{kind3}改成全湿。", { out: name(out), kind: esc(pluginName(shared.kind)), kind2: esc(pluginName(shared.kind)), dryDb: sharedDry < 0.999 ? _t("，原声也被它关小 {dryDb}（推子上看不出来）", { dryDb: dbText(dryDb) }) : "", kind3: esc(pluginName(shared.kind)) })}</div>` : "";
    const br = this.brokenOf(track), brokenNote = (where: string) => { const b = br.find((x) => x.where === where); return b ? `<div class="fx-note strip-broken-note">${esc(b.why)}</div>` : ""; };
    return outSel + brokenNote("out") + warn + note + sends.map((sd, k) => rows[k] + brokenNote(`send:${sd.to}`)).join("") + add;
  }
  private chipsHtml(track: string): string {
    const chips = this.slots(track).map(({ fx }) => `<button class="btn fx-chip${this.open?.track === track && this.open.fx === fx.id ? " is-on" : ""}${fx.on === false ? " off" : ""}" data-v="fx" data-fx="${esc(fx.id)}" title="${_t("{kind}：点开调{DEFAULT_EQ_ID}", { kind: esc(pluginName(fx.kind)), DEFAULT_EQ_ID: fx.id === DEFAULT_EQ_ID ? _t("（默认那一格：能关、能换面板，不能删）") : "" })}">${esc(fxSummary(fx, this.onBus(track)))}</button>`).join("");
    const clip = this.fxClip ? `<button class="btn cand fx-paste-new" data-v="fxpastenew" title="${_t("链尾加一格：拷的那一格（来自「{from}」）的种类和参数", { from: esc(this.fxClip.from) })}">${_t("粘成新的一格：{kind}", { kind: esc(pluginName(this.fxClip.kind)) })}</button>` : "";
    const menu = this.addFor === track ? `<div class="fx-add-menu">${clip}${PLUGIN_KINDS.map((k) => `<button class="btn cand" data-v="fxpick" data-kind="${k}">${esc(pluginName(k))}</button>`).join("")}</div>` : "";
    return `<div class="strip-fx">${chips}<button class="btn fx-add${this.addFor === track ? " is-on" : ""}" data-v="fxadd" title="${_t("插一个插件（任何插件都能插在任何轨上）")}">＋</button>${menu}</div>`;
  }
  private renderPanel(): void {
    const box = this.el.querySelector<HTMLElement>(".fx-panel")!, o = this.tab === "chain" ? this.open : null, s = o ? this.slotOf(o) : null;
    if (!o || !s) { box.hidden = true; box.innerHTML = ""; delete box.dataset.track; delete box.dataset.fx; return; }
    const fx = s.fx, isDefault = fx.id === DEFAULT_EQ_ID;
    box.dataset.track = o.track; box.dataset.fx = o.fx;
    const head = `<div class="fx-head"><span class="fx-title">${esc(this.trackName(o.track))} · ${esc(pluginName(fx.kind))}${s.virtual ? _t("（平）") : ""}</span>` +
      this.modeSeg(o) +
      `<button class="btn cand${fx.on === false ? "" : " is-on"}" data-v="fxon" title="${_t("关 = 这一格跳过（参数留着）")}">${fx.on === false ? _t("关着") : _t("开着")}</button>` +
      this.clipBtns(o, fx) +
      (isDefault ? "" : `<button class="btn cand danger" data-v="fxdel" title="${_t("从这条轨上拿掉（能撤销）")}">${_t("拿掉")}</button>`) +
      `<button class="btn" data-v="fxclose" title="${_t("收起")}">✕</button></div>`;
    box.innerHTML = head + `<div class="fx-body">${this.controlsHtml(o, fx, this.modeOf(o))}</div>`; box.hidden = false; mountDropdowns(box);
  }
  private renderBar(): void {
    const bar = this.el.querySelector<HTMLElement>(".mix-tabbar")!;
    bar.innerHTML = `<span class="fx-seg mix-tabs" role="tablist">${TABS.map((x) => `<button class="btn${this.tab === x.id ? " is-on" : ""}" data-v="tab" data-tab="${x.id}" role="tab" title="${esc(x.hint)}">${esc(x.label)}</button>`).join("")}</span>` +
      "";
    this.el.querySelector(".mix-more")?.classList.toggle("is-on", this.menuOpen);
    const menu = this.el.querySelector<HTMLElement>(".mix-menu")!;
    menu.hidden = !this.menuOpen;
    menu.innerHTML = this.menuOpen ? `<span class="mix-rows" title="${_t("贴在底下时显示几排卡片（同小键盘的「行」）：自动 = 半屏放得下的最多排；手动最多到屏幕放得下、谱还露一条为止。横着放 / 全屏时不管")}">${_t("排数")}` +
        `<button class="btn" data-v="rows:-" aria-label="${_t("少一排")}">−</button><b class="mix-rows-n"></b><button class="btn" data-v="rows:+" aria-label="${_t("多一排")}">+</button>` +
        `<button class="btn chip" data-v="rows:auto">${_t("自动")}</button></span>` : "";
    this.syncRowsCtl();
  }
  /** 「⋯」里排数那一行的字和能不能按（fitHeight 算完 / 菜单画完都调）。 */
  private syncRowsCtl(): void {
    const m = this.el.querySelector<HTMLElement>(".mix-menu .mix-rows"); if (!m) return;
    const pref = this.host.rowsPref?.() ?? "auto", n = pref === "auto" ? this.shownRows : Math.min(pref, this.capRows);
    m.querySelector(".mix-rows-n")!.textContent = String(n);
    m.querySelector<HTMLButtonElement>('[data-v="rows:-"]')!.disabled = n <= 1;
    m.querySelector<HTMLButtonElement>('[data-v="rows:+"]')!.disabled = n >= this.capRows;
    m.querySelector('[data-v="rows:auto"]')!.classList.toggle("is-on", pref === "auto");
  }
  /** 一张卡片：顶上一条峰值细线 + 名字 + 这一页的内容。 */
  private card(id: string, cls: string, name: string, who: string, body: string, color?: string): string {
    const spec = this.tab === "eq" ? this.specSvg(id) : STEREO_TABS.has(this.tab) ? GONIO_SVG : this.tab === "comp" ? this.compSvg(id) : "";   // v0.16.82：发送 / 链两页也画李萨如图（总表第 9 条 ④）   // EQ 页：卡片背景 = 频谱 + 这一格 EQ 的曲线；基础页 = 每张卡都有李萨如图（单声道轨 = 声像角度的一根线）
    // 卡片一样高（= 基础页的那么高；v0.10.21，user「混音台能解决卡片太长的问题吗？不方便纵览。能不能约定一个卡片的fixed的大小，然后里面自己想办法」「我比较喜欢基础模式的卡片大小」）：名字钉在上面，下面的放不下 = 卡片里自己滚
    return `<div class="strip${cls}" data-id="${esc(id)}"${color ? ` data-color style="--cat:${esc(color)}"` : ""}>${spec}<div class="strip-meter"><i></i><b></b></div>${name}${who ? `<div class="strip-who">${esc(who)}</div>` : ""}<div class="strip-body">${body}</div></div>`;
  }
  /** 贴底（混音台在底下，默认）：高度 = 顶上两条 + 正好 N 排卡片（N = 半屏放得下的最多排，至少一排；卡片不多 = 有几排就几排），不再切在第二排中间。
   *  v0.10.38；user「混音台的高度是怎么决定的，现在怎么不三不四的」→「按整排卡片对齐，最高半屏；iPad mini 上就是一排」「好」。横屏 / 全屏 = 不管（CSS）。 */
  private fitHeight(): void {
    const el = this.el; el.style.maxHeight = "";
    if (this.full || el.hidden || sideDocked(el.closest("#stage") as HTMLElement | null)) return;   // 贴底（默认）才按整排算；贴右边那一档 = CSS 管
    const box = el.querySelector<HTMLElement>(".studio-strips"), card = box?.querySelector<HTMLElement>(".strip"); if (!box || !card) return;
    const cs = getComputedStyle(box), gap = parseFloat(cs.rowGap) || 0, pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const head = [...el.children].filter((c) => c !== box && !(c as HTMLElement).hidden).reduce((n, c) => n + (c as HTMLElement).getBoundingClientRect().height, 0);
    const H = card.getBoundingClientRect().height, cols = cs.gridTemplateColumns.split(" ").filter(Boolean).length || 1, rows = Math.ceil(box.querySelectorAll(".strip").length / cols);
    const rowsFor = (h: number) => Math.max(1, Math.floor((h - head - pad + gap) / (H + gap)));
    const stageH = (el.closest("#stage") as HTMLElement | null)?.clientHeight ?? innerHeight;
    this.capRows = rowsFor(stageH - SCORE_SLIVER);   // 屏幕高度上限：谱至少还露一条
    const pref = this.host.rowsPref?.() ?? "auto", want = pref === "auto" ? Math.min(rowsFor(innerHeight * 0.5), this.capRows) : Math.min(pref, this.capRows);
    const n = Math.min(rows, want); this.shownRows = want;
    el.style.maxHeight = `${Math.ceil(head + pad + n * H + (n - 1) * gap + 2)}px`;
    this.syncRowsCtl();
  }
  /** 底座贴底 ↔ 贴右边翻了（main.ts syncDock）：重新按整排对齐 / 放开。 */
  relayout(): void { this.fitHeight(); }
  render(): void {
    const box = this.el.querySelector(".studio-strips")!, m = this.host.master(), tab = this.tab, off = this.host.bypass();
    const ab = this.el.querySelector<HTMLElement>(".mix-ab")!;   // A/B：效果开着 / 全关（user「混音台加一个暂时禁用所有魔法的toggle」）
    ab.textContent = off ? _t("效果全关") : _t("效果开着"); ab.classList.toggle("is-on", !off); ab.classList.toggle("ab-off", off);
    ab.title = off ? _t("现在：插件和发送都不响（推子 / 声像留着）。点 = 效果回来") : _t("点 = 暂时关掉全部效果（插件 + 发送），听谱子本身 / 听差别；推子、声像留着");
    this.el.querySelector<HTMLElement>(".mix-ab-note")!.hidden = !off; this.el.classList.toggle("bypassed", off);
    const fb = this.el.querySelector<HTMLElement>(".mix-full")!; fb.classList.toggle("is-on", this.full);
    fb.title = this.full ? _t("还原：回到底座") : _t("混音台铺满（推到最上面，卡片排成好几列，一眼看全）；再点 = 回到底座"); fb.setAttribute("aria-label", this.full ? _t("还原") : _t("全屏"));
    if (this.open && !this.slotOf(this.open)) this.open = null;   // 撤销把这一格撤没了
    this.renderBar();
    const nameDiv = (s: string) => `<div class="strip-name">${esc(s)}</div>`;
    // 发送页每张卡顶上带这条轨自己的增益推子（v0.16.82，总表第 9 条 ⑤：调平衡用；和基础页那根是同一个值）
    const gainRow = (attrs: string, hint: string, db: number, extra = "") => row(_t("增益"), hint, `<output>${dbText(db)}</output>${extra}`, slider({ min: -24, max: 12, step: 0.5, value: db, attrs, def: TEMPLATE.studio.track.gainDb, defText: dbText(TEMPLATE.studio.track.gainDb) }), "strip-row");
    // 总轨
    const masterBody = tab === "basic" ? row(_t("增益"), HINT.masterGain, `<output>${dbText(m.gainDb)}</output>`, slider({ min: -24, max: 12, step: 0.5, value: m.gainDb, attrs: "data-master", def: TEMPLATE.studio.master.gainDb, defText: dbText(TEMPLATE.studio.master.gainDb) }), "strip-row") +
        row(_t("限幅"), limiterHint(m.limiterParams), "", `<button class="btn cand${m.limiter ? " is-on" : ""}" data-v="limiter">${m.limiter ? _t("开着") : _t("关着（可能削波）")}</button>`, "strip-row") +
        row(_t("峰值"), HINT.peak, `<span class="meter-val">—</span>`, "", "strip-row") + RMS_ROW + CORR_ROW
      : tab === "eq" || tab === "comp" ? this.inlineHtml(MASTER, tab) : tab === "send" ? gainRow("data-master", HINT.masterGain, m.gainDb) + `<div class="fx-dim">${_t("总轨就是输出，不再发给别处")}</div>` : this.chipsHtml(MASTER);
    const master = this.card(MASTER, " master", nameDiv(_t("总轨")), _t("所有声部混在一起之后"), masterBody);
    // 混音轨（自己加的路由轨，普通的轨）：排在总轨后面、歌手前面（user「你自己加的中间的路由轨也是普通的轨道，排在总轨后面，歌手前面」）
    const buses = this.host.buses(), busCards = buses.map((b, k) => {
      const body = tab === "basic" ? row(_t("增益"), HINT.busGain, `<output>${dbText(b.gainDb)}</output>`, slider({ min: -24, max: 12, step: 0.5, value: b.gainDb, attrs: "data-busgain", def: TEMPLATE.studio.track.gainDb, defText: dbText(TEMPLATE.studio.track.gainDb) }), "strip-row") +
          row(_t("声像"), HINT.pan, `<output>${panText(b.pan)}</output>`, slider({ min: -1, max: 1, step: 0.05, value: b.pan, attrs: "data-buspan", def: TEMPLATE.studio.track.pan, defText: panText(TEMPLATE.studio.track.pan) }), "strip-row") + RMS_ROW + CORR_ROW +
          `<div class="btn-row"><button class="btn cand${b.bypass ? " is-on" : ""}" data-v="busbypass" title="${_t("旁通：这条混音轨上的插件全跳过（推子 / 声像 / 出到 / 发送照旧）；再点 = 回来")}">${b.bypass ? _t("旁通中") : _t("旁通")}</button><button class="btn" data-v="busleft" title="${_t("往前挪一位")}"${k === 0 ? " disabled" : ""}>‹</button><button class="btn" data-v="busright" title="${_t("往后挪一位")}"${k === buses.length - 1 ? " disabled" : ""}>›</button><button class="btn cand danger" data-v="delbus" title="${_t("删掉这条混音轨（发给它的、出到它的都改回总轨；能撤销）")}">${_t("删掉")}</button></div>`
        : tab === "eq" || tab === "comp" ? this.inlineHtml(b.id, tab) : tab === "send" ? gainRow("data-busgain", HINT.busGain, b.gainDb) + this.routeHtml(b.id) : this.chipsHtml(b.id);
      const name = `<input class="bus-name" value="${esc(b.name)}" title="${_t("名字（点了改）")}" />`;   // 每一页都能改名（v0.16.82，总表第 9 条 ⑥；原来只在基础页）
      // 混音轨也能静音（不能独奏：独奏是挑歌手听；user「哦，混音轨也要mute，（不过可能不能solo了」）——钉在名字右边，同歌手卡
      const ms = `<span class="strip-ms"><button class="btn${b.muted ? " is-on mute" : ""}" data-v="busmute" title="${_t("静音：这条混音轨不出声、也不往下发（发给它的那几位原声照旧）")}">${_t("静")}</button></span>`;
      return this.card(b.id, ` bus${b.bypass ? " bypassed" : ""}`, `<div class="strip-head">${name}${ms}</div>${this.brokenLine(b.id)}`, b.bypass ? _t("混音轨 · 旁通中（插件全跳过）") : _t("混音轨"), body);
    }).join("");
    // 歌手：顺序跟谱上的声部（user「歌手卡片的排序还是以五线谱为准」）
    const strips = this.host.strips(), singers = strips.map((s, k) => {
      // 乐手自己的响度不是 0 = 推子旁边照实写出来，点它去乐器页那一行（第 14 条，2026-11-12）；是 0 = 不写
      const perf = s.performerDb ? `<button class="btn strip-perfdb" data-v="perfdb" title="${_t("这位乐手自己的响度（乐器页「响度」那一行），和推子相加：推子 {g}、乐手 {p} = 这条轨一共 {t}。点这里去乐器页改", { g: dbText(s.gainDb), p: dbText(s.performerDb), t: dbText(s.gainDb + s.performerDb) })}">${_t("乐手 {p}", { p: dbText(s.performerDb) })}</button>` : "";
      // 乐手身上别的几处和现在的默认不一样（16-6，照「乐手 −6 dB」那一颗的样子）：只数响度以外的，点了去乐器页顶上那一句
      const perfDiff = s.performerDiffs ? `<button class="btn strip-perfdiff" data-v="perfdiff" title="${_t("这位乐手身上有 {n} 处和现在的默认不一样（响度另算）。点这里去乐器页看是哪几处", { n: s.performerDiffs })}">${_t("乐手 {n} 处不同", { n: s.performerDiffs })}</button>` : "";
      const body = tab === "basic" ? row(_t("增益"), HINT.gain, `<output>${dbText(s.gainDb)}</output>${perf}${perfDiff}`, slider({ min: -24, max: 12, step: 0.5, value: s.gainDb, attrs: "data-gain", def: TEMPLATE.studio.track.gainDb, defText: dbText(TEMPLATE.studio.track.gainDb) }), "strip-row") +
          row(_t("声像"), HINT.pan, `<output>${panText(s.pan)}</output>`, slider({ min: -1, max: 1, step: 0.05, value: s.pan, attrs: "data-pan", def: TEMPLATE.studio.track.pan, defText: panText(TEMPLATE.studio.track.pan) }), "strip-row") + RMS_ROW +
          `<div class="btn-row">` +
            `<button class="btn" data-v="partleft" title="${_t("往前挪一位（谱上这个声部也往上挪）")}"${k === 0 ? " disabled" : ""}>‹</button><button class="btn" data-v="partright" title="${_t("往后挪一位（谱上这个声部也往下挪）")}"${k === strips.length - 1 ? " disabled" : ""}>›</button></div>` +
          // 歌手管理（2026-10-08 深夜，user「只有没引用的时候才可以在歌手管理里面删」）：在几张纸上；一张都不在 = 能删
          (s.refs ? `<div class="strip-refs">${_t("在 {refs} 张纸上", { refs: s.refs })}</div>` : `<div class="strip-refs">${_t("哪张纸上都没有")} <button class="btn cand danger" data-v="delpart" title="${_t("删掉这个声部（它的乐器设置一起删；能撤销）")}">${_t("删掉这个声部")}</button></div>`)
        : tab === "eq" || tab === "comp" ? this.inlineHtml(s.id, tab) : tab === "send" ? gainRow("data-gain", HINT.gain, s.gainDb, perf) + this.routeHtml(s.id) : this.chipsHtml(s.id);
      // 静音 / 独奏 钉在名字右边、每一页都在（v0.10.34；原来在基础页卡片最底下，卡片定高 = 要在卡片里滚才看得到；user「混音台基础里面应该有mute和solo，和我们已经有的mute和solo绑定」）——
      //   和谱上歌手名下面的「静 / 独」、歌手牌里的是同一个开关（host.toggleMute / toggleSolo → 视图态）
      const ms = `<span class="strip-ms"><button class="btn${s.muted ? " is-on mute" : ""}" data-v="mute" title="${_t("静音（这位不出声；和谱上声部名下面的「静」是同一个）")}">${_t("静")}</button><button class="btn${s.solo ? " is-on solo" : ""}" data-v="solo" title="${_t("独奏（只听独奏的几位；和谱上的「独」是同一个）")}">${_t("独")}</button></span>`;
      return this.card(s.id, "", `<div class="strip-head">${nameDiv(s.name)}${ms}</div>${this.brokenLine(s.id)}`, s.performer, body, s.color);
    }).join("");
    box.innerHTML = master + busCards + singers; mountDropdowns(box);
    this.watchCards();   // 卡片重画了：重新看哪些在屏幕里
    this.renderPanel();
    this.fitHeight();
  }
}
// 参数的类型（给宿主用）
export type { Params };
