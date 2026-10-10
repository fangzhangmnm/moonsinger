// studio.ts —— 混音台（「听」的底座；user 2026-10-10「能不能混音台就是听的键盘」）。谱留着能看。
// created 2026-10-08 by Claude Fable 5.1（一个声部一条：名字 / 谁来演 / 增益 dB / 声像 / 静音 / 独奏 + 总轨）。
// 2026-10-10 v0.10.8（Claude Opus 5.5）：每条轨一排插件格（src/ui/plugins.ts）——歌手轨第一格 = 默认 EQ（没碰过 = 不在文件里 = 平；能关、能换面板，不能删），
//   「＋」= 往这条轨插任何插件（user「插件：可以随便插…用最general最自由的方式」）；点一格 = 混音台顶上展开它的面板：一键 / 全量（同一组参数的两种看法，
//   user「几个不同的面版模式背后都是同一个插件。类似专家模式和一键模式…先做同时新手和全量两个面版」）。数据 = studio.json v2 现成的效果链（FxV2），不升格式。
import type { FxV2 } from "../format/contract.ts";
import { DEFAULT_EQ_ID, PLUGIN_KINDS, SIMPLE, freshParams, fullParams, fxSummary, paramsOf, pluginName, type Params } from "./plugins.ts";
import type { ParamDef } from "../engine/fx.ts";

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
  /** 一条轨的效果链（MASTER = 总轨；别的 = 歌手的 id）。 */
  chain(track: string): FxV2[];
  /** 改一条轨的效果链（进 undo；merge = 连续拖同一个旋钮并成一步的键）。 */
  setChain(track: string, chain: FxV2[], label: string, merge?: string): void;
  /** 压缩「被谁压」能选的轨（除了自己）。 */
  keyTracks(track: string): { id: string; name: string }[];
}
export const MASTER = "__master";
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const panText = (p: number) => (Math.abs(p) < 0.025 ? "中" : p < 0 ? `左 ${Math.round(-p * 100)}` : `右 ${Math.round(p * 100)}`);
const dbText = (d: number) => `${d > 0 ? "+" : ""}${d.toFixed(1)} dB`;

/** 全量面板的一个参数：滑块的位置 ↔ 值（Hz 走对数；0 = 关的那种 Hz 参数，最左一格 = 关）。 */
function sliderOf(d: ParamDef): { min: number; max: number; step: number; toV: (s: number) => number; toS: (v: number) => number; fmt: (v: number) => string } {
  if (d.unit === "Hz") {
    const lo = Math.max(20, d.min || 20), hi = d.max, offable = d.min === 0, L = Math.log(lo), H = Math.log(hi);
    return { min: offable ? -0.02 : 0, max: 1, step: 0.002, toV: (s) => (offable && s < 0 ? 0 : Math.round(Math.exp(L + Math.max(0, s) * (H - L)))), toS: (v) => (offable && v <= 0 ? -0.02 : (Math.log(Math.max(lo, v)) - L) / (H - L)),
      fmt: (v) => (v <= 0 ? "关" : v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 1 : 2)} kHz` : `${Math.round(v)} Hz`) };
  }
  const step = d.unit === "dB" ? 0.5 : d.unit === "ms" ? (d.max > 500 ? 5 : 0.5) : d.unit === "0..1" ? 0.01 : d.unit === "ratio" ? (d.max <= 4 ? 1 : 0.1) : 1;
  const fmt = (v: number) => (d.unit === "dB" ? dbText(v) : d.unit === "ms" ? `${v} ms` : d.unit === "0..1" ? `${Math.round(v * 100)}%` : d.unit === "ratio" ? (d.id === "ratio" ? `${v}:1` : String(v)) : String(v));
  return { min: d.min, max: d.max, step, toV: (s) => s, toS: (v) => v, fmt };
}

export class Studio {
  readonly el: HTMLDivElement;
  /** 展开着的插件面板：哪条轨的哪一格 + 一键 / 全量（只在这次打开里）。 */
  private open: { track: string; fx: string; mode: "simple" | "full" } | null = null;
  private addFor: string | null = null;   // 「＋」的小菜单开在哪条轨
  constructor(parent: HTMLElement, private host: StudioHost) {
    this.el = document.createElement("div"); this.el.className = "studio"; this.el.hidden = true;
    this.el.innerHTML = `<div class="finder-bar"><span class="finder-title">混音台</span><button class="btn" data-v="back" title="收起混音台：底座让出来、还在「听」（Esc = 回去写）">收起</button><button class="btn" data-v="play" title="播放（空格）"><svg class="ico"><use href="#play"/></svg></button></div>` +
      `<div class="fx-panel" hidden></div><div class="studio-strips"></div>`;
    parent.append(this.el);
    this.el.addEventListener("click", (e) => {
      const t = e.target as HTMLElement, v = t.closest<HTMLElement>("[data-v]")?.dataset.v, strip = t.closest<HTMLElement>(".strip")?.dataset.id;
      if (v === "back") this.host.close();
      else if (v === "play") this.host.play();
      else if (v === "mute" && strip) { this.host.toggleMute(strip); this.render(); }
      else if (v === "solo" && strip) { this.host.toggleSolo(strip); this.render(); }
      else if (v === "delpart" && strip) this.host.deletePart(strip);
      else if (v === "limiter") { this.host.toggleLimiter(); this.render(); }
      else if (v === "fx" && strip) { const id = t.closest<HTMLElement>("[data-fx]")!.dataset.fx!; this.toggleOpen(strip, id); }
      else if (v === "fxadd" && strip) { this.addFor = this.addFor === strip ? null : strip; this.render(); }
      else if (v === "fxpick" && strip) { this.addFx(strip, t.closest<HTMLElement>("[data-kind]")!.dataset.kind!); }
      else if (v === "fxmode" && this.open) { this.open.mode = t.closest<HTMLElement>("[data-mode]")!.dataset.mode as "simple" | "full"; this.renderPanel(); }
      else if (v === "fxon") this.patchOpen((fx) => ({ ...fx, on: fx.on === false }), "开 / 关");
      else if (v === "fxdel") this.deleteOpen();
      else if (v === "fxclose") { this.open = null; this.render(); }
      else if (v === "fxtoggle") { const id = t.closest<HTMLElement>("[data-c]")!.dataset.c!; this.simpleSet(id, (this.simpleNow()?.[id] ?? 0) ? 0 : 1, false); this.renderPanel(); }
      else if (v === "fxchoice") { const b = t.closest<HTMLElement>("[data-c]")!; this.simpleSet(b.dataset.c!, Number(b.dataset.val), false); this.renderPanel(); }
      else if (v === "fxbool") { const id = t.closest<HTMLElement>("[data-p]")!.dataset.p!; this.patchOpen((fx) => ({ ...fx, params: { ...paramsOf(fx), [id]: paramsOf(fx)[id] ? 0 : 1 } }), id); this.renderPanel(); }
    });
    this.el.addEventListener("input", (e) => {
      const t = e.target as HTMLInputElement;
      if (t.dataset.c !== undefined) { this.simpleSet(t.dataset.c, Number(t.value), true); return; }   // 一键面板的旋钮
      if (t.dataset.p !== undefined) { this.fullSet(t, true); return; }                                  // 全量面板的参数
      const strip = t.closest<HTMLElement>(".strip"); if (!strip) return;
      const id = strip.dataset.id!, out = t.parentElement?.querySelector("output");
      if (t.dataset.master !== undefined) { this.host.setMasterGain(Number(t.value)); if (out) out.textContent = dbText(Number(t.value)); }
      else if (t.dataset.gain !== undefined) { this.host.setGain(id, Number(t.value)); if (out) out.textContent = dbText(Number(t.value)); }
      else if (t.dataset.pan !== undefined) { this.host.setPan(id, Number(t.value)); if (out) out.textContent = panText(Number(t.value)); }
    });
    this.el.addEventListener("change", (e) => {
      const t = e.target as HTMLSelectElement;
      if (t.dataset.key !== undefined) { const v = t.value; this.patchOpen((fx) => { const { key: _k, ...rest } = fx; return v ? { ...rest, key: v } : rest; }, "被谁压"); this.renderPanel(); }
    });
    this.el.addEventListener("dblclick", (e) => {   // 双击推子 = 回到 0
      const t = e.target as HTMLInputElement, strip = t.closest<HTMLElement>(".strip"); if (!strip || t.tagName !== "INPUT") return;
      if (t.dataset.master !== undefined) this.host.setMasterGain(0); else if (t.dataset.gain !== undefined) this.host.setGain(strip.dataset.id!, 0); else if (t.dataset.pan !== undefined) this.host.setPan(strip.dataset.id!, 0);
      this.render();
    });
  }
  get isOpen(): boolean { return !this.el.hidden; }
  show(): void { this.el.hidden = false; this.render(); }
  hide(): void { this.el.hidden = true; }
  /** 峰值表（播放 / 试听时录音房每 1024 帧报一次；0–1）。 */
  meter(peak: number): void {
    const bar = this.el.querySelector<HTMLElement>(".meter-fill"), val = this.el.querySelector<HTMLElement>(".meter-val"); if (!bar) return;
    const db = peak > 1e-5 ? 20 * Math.log10(peak) : -60, w = Math.max(0, Math.min(100, ((db + 60) / 60) * 100));
    bar.style.width = `${w}%`; bar.classList.toggle("hot", peak >= 0.98); if (val) val.textContent = db <= -59 ? "—" : `${db.toFixed(1)} dB`;
  }

  // ── 插件格 ──────────────────────────────────────────────────────────────
  /** 一条轨显示的格子：歌手轨没有默认 EQ 那一格 = 补一个虚的（平，不在文件里）。 */
  private slots(track: string): { fx: FxV2; virtual: boolean }[] {
    const ch = this.host.chain(track), out = ch.map((fx) => ({ fx, virtual: false }));
    if (track !== MASTER && !ch.some((f) => f.id === DEFAULT_EQ_ID)) out.unshift({ fx: { id: DEFAULT_EQ_ID, kind: "eq", params: freshParams("eq") }, virtual: true });
    return out;
  }
  private trackName(track: string): string { return track === MASTER ? "总轨" : this.host.strips().find((s) => s.id === track)?.name ?? track; }
  private openFx(): { fx: FxV2; virtual: boolean } | null { const o = this.open; return o ? this.slots(o.track).find((s) => s.fx.id === o.fx) ?? null : null; }
  private toggleOpen(track: string, fx: string): void {
    if (this.open && this.open.track === track && this.open.fx === fx) this.open = null;
    else { const s = this.slots(track).find((x) => x.fx.id === fx); this.open = { track, fx, mode: s && SIMPLE[s.fx.kind]?.read(paramsOf(s.fx)) ? "simple" : "full" }; }
    this.addFor = null; this.render();
  }
  private addFx(track: string, kind: string): void {
    const ch = this.host.chain(track), used = new Set(ch.map((f) => f.id)); let n = 1; while (used.has(`${kind}${n}`)) n++;
    const fx: FxV2 = { id: `${kind}${n}`, kind, params: freshParams(kind) };
    this.host.setChain(track, [...ch, fx], `${this.trackName(track)} 插上${pluginName(kind)}`);
    this.addFor = null; this.open = { track, fx: fx.id, mode: "simple" }; this.render();
  }
  /** 改展开着的那一格（虚的默认 EQ = 第一次改的时候写进链的最前面）。 */
  private patchOpen(f: (fx: FxV2) => FxV2, what: string, merge = false): void {
    const o = this.open, s = this.openFx(); if (!o || !s) return;
    const ch = this.host.chain(o.track), nx = f(s.fx);
    const next = s.virtual ? [nx, ...ch] : ch.map((x) => (x.id === o.fx ? nx : x));
    this.host.setChain(o.track, next, `${this.trackName(o.track)} ${pluginName(nx.kind)} ${what}`, merge ? `fx:${o.track}:${o.fx}:${what}` : undefined);
    this.refreshChip(o.track, nx);
  }
  private deleteOpen(): void {
    const o = this.open; if (!o || o.fx === DEFAULT_EQ_ID) return;
    const ch = this.host.chain(o.track), gone = ch.find((x) => x.id === o.fx);
    this.host.setChain(o.track, ch.filter((x) => x.id !== o.fx), `${this.trackName(o.track)} 拿掉${pluginName(gone?.kind ?? "")}`);
    this.open = null; this.render();
  }
  private simpleNow(): Record<string, number> | null { const s = this.openFx(); return s ? SIMPLE[s.fx.kind]?.read(paramsOf(s.fx)) ?? null : null; }
  /** 一键面板改一个控件：在当前读数上改这一个（读不出 = 在全量里调过 = 从一键的默认起），按公式写回全量参数。 */
  private simpleSet(id: string, v: number, live: boolean): void {
    const s = this.openFx(); if (!s) return;
    const view = SIMPLE[s.fx.kind], base = view.read(paramsOf(s.fx)) ?? view.read(freshParams(s.fx.kind)) ?? {};
    const ctl = view.controls.find((c) => c.id === id);
    this.patchOpen((fx) => ({ ...fx, params: view.write({ ...base, [id]: v }, paramsOf(fx)) }), ctl?.label ?? id, live);
    if (live) { const out = this.el.querySelector<HTMLElement>(`.fx-panel output[data-c="${id}"]`); if (out && ctl?.fmt) out.textContent = ctl.fmt(v); this.el.querySelector(".fx-panel .fx-note")?.remove(); }
  }
  private fullSet(t: HTMLInputElement, live: boolean): void {
    const s = this.openFx(); if (!s) return;
    const id = t.dataset.p!, d = fullParams(s.fx.kind).find((x) => x.id === id); if (!d) return;
    const sl = sliderOf(d), v = sl.toV(Number(t.value));
    this.patchOpen((fx) => ({ ...fx, params: { ...paramsOf(fx), [id]: v } }), d.label, live);
    const out = t.parentElement?.querySelector("output"); if (out) out.textContent = sl.fmt(v);
  }
  /** 卡片上那一格的字跟着改（拖旋钮时不重画整张卡片，免得滑块被换掉）。 */
  private refreshChip(track: string, fx: FxV2): void {
    const b = this.el.querySelector<HTMLElement>(`.strip[data-id="${CSS.escape(track)}"] [data-fx="${CSS.escape(fx.id)}"]`);
    if (b) { b.textContent = fxSummary(fx); b.classList.toggle("off", fx.on === false); }
  }
  private chipsHtml(track: string): string {
    const chips = this.slots(track).map(({ fx }) => `<button class="btn fx-chip${this.open?.track === track && this.open.fx === fx.id ? " is-on" : ""}${fx.on === false ? " off" : ""}" data-v="fx" data-fx="${esc(fx.id)}" title="${esc(pluginName(fx.kind))}：点开调${fx.id === DEFAULT_EQ_ID ? "（默认那一格：能关、能换面板，不能删）" : ""}">${esc(fxSummary(fx))}</button>`).join("");
    const menu = this.addFor === track ? `<div class="fx-add-menu">${PLUGIN_KINDS.map((k) => `<button class="btn cand" data-v="fxpick" data-kind="${k}">${esc(pluginName(k))}</button>`).join("")}</div>` : "";
    return `<div class="strip-fx">${chips}<button class="btn fx-add${this.addFor === track ? " is-on" : ""}" data-v="fxadd" title="插一个插件（任何插件都能插在任何轨上）">＋</button>${menu}</div>`;
  }
  private renderPanel(): void {
    const box = this.el.querySelector<HTMLElement>(".fx-panel")!, o = this.open, s = this.openFx();
    if (!o || !s) { box.hidden = true; box.innerHTML = ""; return; }
    const fx = s.fx, p = paramsOf(fx), view = SIMPLE[fx.kind], read = view?.read(p) ?? null, isDefault = fx.id === DEFAULT_EQ_ID;
    const head = `<div class="fx-head"><span class="fx-title">${esc(this.trackName(o.track))} · ${esc(pluginName(fx.kind))}${s.virtual ? "（平）" : ""}</span>` +
      `<span class="fx-seg"><button class="btn${o.mode === "simple" ? " is-on" : ""}" data-v="fxmode" data-mode="simple" title="几个大旋钮，按公式调下面全量的参数">一键</button><button class="btn${o.mode === "full" ? " is-on" : ""}" data-v="fxmode" data-mode="full" title="每一个参数都摊开">全量</button></span>` +
      `<button class="btn cand${fx.on === false ? "" : " is-on"}" data-v="fxon" title="关 = 这一格跳过（参数留着）">${fx.on === false ? "关着" : "开着"}</button>` +
      (isDefault ? "" : `<button class="btn cand danger" data-v="fxdel" title="从这条轨上拿掉（能撤销）">拿掉</button>`) +
      `<button class="btn" data-v="fxclose" title="收起">✕</button></div>`;
    const keyRow = fx.kind === "comp" ? `<label class="fx-row">被谁压 <select data-key><option value="">不用（自己压自己）</option>${this.host.keyTracks(o.track).map((t) => `<option value="${esc(t.id)}"${fx.key === t.id ? " selected" : ""}>${esc(t.name)}</option>`).join("")}</select></label>` : "";
    let body = "";
    if (o.mode === "simple" && view) {
      const cur = read ?? view.read(freshParams(fx.kind)) ?? {};
      body = (read ? "" : `<div class="fx-note">这一格在全量里调过（不是一键的样子）；动这里会改回一键的样子。</div>`) + view.controls.map((c) => {
        const v = cur[c.id] ?? 0;
        if (c.kind === "toggle") return `<div class="fx-row"><span title="${esc(c.hint)}">${esc(c.label)}</span><button class="btn cand${v ? " is-on" : ""}" data-v="fxtoggle" data-c="${c.id}" title="${esc(c.hint)}">${v ? "开" : "关"}</button></div>`;
        if (c.kind === "choice") return `<div class="fx-row"><span title="${esc(c.hint)}">${esc(c.label)}</span><span class="fx-seg">${c.choices!.map((x) => `<button class="btn${Math.abs(v - x.v) < 1e-6 ? " is-on" : ""}" data-v="fxchoice" data-c="${c.id}" data-val="${x.v}">${esc(x.label)}</button>`).join("")}</span></div>`;
        return `<label class="fx-row" title="${esc(c.hint)}">${esc(c.label)} <output data-c="${c.id}">${c.fmt ? c.fmt(v) : v}</output><input type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${v}" data-c="${c.id}" /></label>`;
      }).join("") + keyRow;
    } else {
      body = fullParams(fx.kind).map((d) => {
        if (d.unit === "bool") return `<div class="fx-row"><span>${esc(d.label)}</span><button class="btn cand${p[d.id] ? " is-on" : ""}" data-v="fxbool" data-p="${d.id}">${p[d.id] ? "开" : "关"}</button></div>`;
        if (fx.kind === "eq" && d.id === "hpHz" && p.hpAuto) return `<div class="fx-row"><span>${esc(d.label)}</span><span class="fx-dim">自动（按这个声部最低的音）</span></div>`;
        const sl = sliderOf(d);
        return `<label class="fx-row">${esc(d.label)} <output>${sl.fmt(p[d.id])}</output><input type="range" min="${sl.min}" max="${sl.max}" step="${sl.step}" value="${sl.toS(p[d.id])}" data-p="${d.id}" /></label>`;
      }).join("") + keyRow;
    }
    box.innerHTML = head + `<div class="fx-body">${body}</div>`; box.hidden = false;
  }

  render(): void {
    const box = this.el.querySelector(".studio-strips")!, m = this.host.master();
    if (this.open && !this.openFx()) this.open = null;   // 撤销把这一格撤没了
    // 总轨（刀 3；user「总轨和常见的几个混音的东西」）：推子 + 限幅开关 + 峰值表 + 总轨链。按键试听不走总轨链和限幅。
    const master = `<div class="strip master" data-id="${MASTER}"><div class="strip-name">总轨</div><div class="strip-who">所有声部混在一起之后</div>` +
      `<label class="strip-row">增益 <output>${dbText(m.gainDb)}</output><input type="range" min="-24" max="12" step="0.5" value="${m.gainDb}" data-master title="双击回 0" /></label>` +
      `<div class="strip-btns"><button class="btn cand${m.limiter ? " is-on" : ""}" data-v="limiter" title="母线限幅：超过天花板（−0.18 dBFS）的那一小段压下来，不超的地方不动；关掉 = 可能削波">限幅${m.limiter ? "" : "（关：可能削波）"}</button></div>` +
      this.chipsHtml(MASTER) +
      `<div class="strip-row meter"><span>峰值 <span class="meter-val">—</span></span><div class="meter-bar"><div class="meter-fill"></div></div></div></div>`;
    box.innerHTML = master + this.host.strips().map((s) => `<div class="strip" data-id="${esc(s.id)}"${s.color ? ` data-color style="--cat:${esc(s.color)}"` : ""}><div class="strip-name">${esc(s.name)}</div><div class="strip-who">${esc(s.performer)}</div>` +
      `<label class="strip-row">增益 <output>${dbText(s.gainDb)}</output><input type="range" min="-24" max="12" step="0.5" value="${s.gainDb}" data-gain title="双击回 0" /></label>` +
      `<label class="strip-row">声像 <output>${panText(s.pan)}</output><input type="range" min="-1" max="1" step="0.05" value="${s.pan}" data-pan title="双击回中" /></label>` +
      this.chipsHtml(s.id) +
      `<div class="strip-btns"><button class="btn cand${s.muted ? " is-on" : ""}" data-v="mute">静音</button><button class="btn cand${s.solo ? " is-on" : ""}" data-v="solo">独奏</button></div>` +
      // 歌手管理（2026-10-08 深夜，user「只有没引用的时候才可以在歌手管理里面删」）：在几张纸上；一张都不在 = 能删
      (s.refs ? `<div class="strip-refs">在 ${s.refs} 张纸上</div>` : `<div class="strip-refs">哪张纸上都没有 <button class="btn cand danger" data-v="delpart" title="删掉这位歌手（休息室里它的配置一起删；能撤销）">删掉这位歌手</button></div>`) + `</div>`).join("");
    this.renderPanel();
  }
}
// 参数的类型（给宿主用）
export type { Params };
