// plugins.ts —— 混音台的插件格：每格 = 一个效果原语（engine/fx.ts 的 kind）+ 它的全量参数；面板 = 同一组参数的两种看法（一键 / 全量）。纯函数。
// created 2026-10-10 by Claude Opus 5.5（v0.10.8）
// user 2026-10-10：「插件：可以随便插…类似fl的devick stack这种？而不是写死说哪里能放什么。用最general最自由的方式」
//   「如果用的是一个公式的话，那么数据契约一开始就用最详尽的，甚至如果可以的话能不能几个不同的面版模式背后都是同一个插件。类似专家模式和一键模式。然后我建议是先做同时新手和全量两个面版」
//   「基础数学反而不怕不用fable。fable主要承重还是架构设计。下礼拜慢慢理吧，今天先摸ux，大不了以后吃书」
//   → 今天不升格式：一格就是 studio.json v2 现成的 FxV2 { id, kind, on?, params }；params 存全量（原语参数表的每一个），一键面板只是按公式写进去。
//   两个「主线程换算」的参数：eq.hpAuto = 1（低切按这个声部最低的音自动放）、delay.syncBeats > 0（时间按速度算几拍）——录音房收到之前就换成 hpHz / timeMs。
import { FX_KINDS, type ParamDef } from "../engine/fx.ts";
import type { FxV2 } from "../format/contract.ts";

export type Params = Record<string, number>;
/** 「+」里能插的（任何轨、任何位置）。 */
export const PLUGIN_KINDS = ["eq", "comp", "reverb", "delay", "chorus", "gain"] as const;
/** 每条轨默认那一格 EQ 的 id：没碰过 = 不在文件里（引擎没有 = 平）；碰了才写进链的最前面。能关、能换面板，不能删（user「默认会帮你开一个，你可以换但不能删」）。 */
export const DEFAULT_EQ_ID = "eq";
export const pluginName = (kind: string): string => FX_KINDS[kind]?.name ?? kind;

/** 主线程换算的参数（不是原语的，录音房不认）。 */
const HOST_PARAMS: Record<string, ParamDef[]> = {
  eq: [{ id: "hpAuto", unit: "bool", min: 0, max: 1, default: 0, label: "自动低切（按这个声部最低的音）" }],
  delay: [{ id: "syncBeats", unit: "ratio", min: 0, max: 2, default: 0, label: "跟速度（几拍一次；0 = 用上面的毫秒）" }],
};
/** 全量面板：原语参数表的每一个 + 主线程换算的那几个。 */
export function fullParams(kind: string): ParamDef[] { return [...(HOST_PARAMS[kind] ?? []), ...(FX_KINDS[kind]?.params ?? [])]; }
export function defaults(kind: string): Params { const p: Params = {}; for (const d of fullParams(kind)) p[d.id] = d.default; return p; }
/** 一格的参数（缺的补默认）。 */
export const paramsOf = (fx: FxV2): Params => ({ ...defaults(fx.kind), ...fx.params });

export interface SimpleControl { id: string; label: string; hint: string; kind: "knob" | "toggle" | "choice"; min?: number; max?: number; step?: number; choices?: { v: number; label: string }[]; fmt?: (v: number) => string }
export interface SimpleView {
  controls: SimpleControl[];
  /** 全量参数正好落在一键的公式上 = 一键面板的读数；不是（在全量里调过）= null。 */
  read(p: Params): Record<string, number> | null;
  /** 一键面板的值 → 全量参数（只改公式管的那几个，别的照留）。 */
  write(v: Record<string, number>, p: Params): Params;
}
const near = (a: number, b: number, e = 1e-3) => Math.abs(a - b) <= e;
const r1 = (x: number) => Math.round(x * 10) / 10;
const pct = (v: number) => `${Math.round(v * 100)}%`;

/** EQ 一键 = 自动低切 + 「厚 ↔ 亮」：300 Hz 低架和 3 kHz 高架反着动，最多 ±6 dB（tilt −1 = 厚、+1 = 亮）。 */
const TILT_DB = 6, TILT_LO = 300, TILT_HI = 3000;
const EQ_SIMPLE: SimpleView = {
  controls: [
    { id: "autoLow", label: "自动低切", hint: "切掉这个声部用不着的低频：低切放在它最低的音往下一点", kind: "toggle" },
    { id: "tilt", label: "厚 ↔ 亮", hint: "往左 = 厚（低的多一点、高的少一点），往右 = 亮；中间 = 不动", kind: "knob", min: -1, max: 1, step: 0.05, fmt: (v) => (near(v, 0, 0.01) ? "平" : v < 0 ? `厚 ${Math.round(-v * TILT_DB * 10) / 10} dB` : `亮 ${Math.round(v * TILT_DB * 10) / 10} dB`) },
  ],
  read(p) {
    if (p.midDb !== 0 || p.lpHz !== 0 || (!p.hpAuto && p.hpHz !== 0)) return null;
    const flat = p.lowDb === 0 && p.highDb === 0, tilt = near(p.lowHz, TILT_LO) && near(p.highHz, TILT_HI) && near(p.lowDb, -p.highDb);
    if (!flat && !tilt) return null;
    return { autoLow: p.hpAuto ? 1 : 0, tilt: flat ? 0 : p.highDb / TILT_DB };
  },
  write(v, p) { const t = Math.max(-1, Math.min(1, v.tilt ?? 0)); return { ...p, hpAuto: v.autoLow ? 1 : 0, hpHz: 0, lpHz: 0, midDb: 0, lowHz: TILT_LO, highHz: TILT_HI, lowDb: r1(-t * TILT_DB), highDb: r1(t * TILT_DB) }; },
};
/** 压缩一键 = 「压多少」a：阈值 −6 → −36 dB、比例 1.5 → 6，起 10 ms、落 150 ms、拐点 6 dB 固定；补偿 = 压掉的一半补回来。 */
const compOf = (a: number) => { const thr = -6 - 30 * a, ratio = 1.5 + 4.5 * a; return { thresholdDb: r1(thr), ratio: r1(ratio), attackMs: 10, releaseMs: 150, kneeDb: 6, makeupDb: r1(0.5 * -thr * (1 - 1 / ratio) * 0.5) }; };
const COMP_SIMPLE: SimpleView = {
  controls: [{ id: "amount", label: "压多少", hint: "把忽大忽小拉平：往右 = 压得越狠（响的字压下来、轻的相对显出来）", kind: "knob", min: 0, max: 1, step: 0.05, fmt: pct }],
  read(p) {
    const a = (-p.thresholdDb - 6) / 30; if (a < -1e-3 || a > 1 + 1e-3) return null;
    const c = compOf(a);
    return near(p.ratio, c.ratio, 0.06) && p.attackMs === c.attackMs && p.releaseMs === c.releaseMs && p.kneeDb === c.kneeDb && near(p.makeupDb, c.makeupDb, 0.06) ? { amount: Math.round(a * 20) / 20 } : null;
  },
  write(v, p) { return { ...p, ...compOf(Math.max(0, Math.min(1, v.amount ?? 0))) }; },
};
/** 混响一键 = 「远近」d：湿 8% → 48%、房间 0.3 → 0.95；高频吸收 0.5、预延迟 10 ms、宽度满。 */
const revOf = (d: number) => ({ mix: r1((0.08 + 0.4 * d) * 100) / 100, room: r1((0.3 + 0.65 * d) * 100) / 100, damp: 0.5, preDelayMs: 10, width: 1 });
const REV_SIMPLE: SimpleView = {
  controls: [{ id: "far", label: "远近", hint: "往右 = 越远、越大的房间（铃可以远一点，贴耳的人声近一点）", kind: "knob", min: 0, max: 1, step: 0.05, fmt: pct }],
  read(p) { const d = (p.mix - 0.08) / 0.4, c = revOf(d); return d >= -1e-3 && d <= 1 + 1e-3 && near(p.room, c.room, 0.006) && p.damp === 0.5 && p.preDelayMs === 10 && p.width === 1 ? { far: Math.round(d * 20) / 20 } : null; },
  write(v, p) { return { ...p, ...revOf(Math.max(0, Math.min(1, v.far ?? 0))) }; },
};
/** 延迟一键 = 「回声多少」e + 「几拍一次」：湿 10% → 50%、反馈 0.15 → 0.65；反馈高切 6000 Hz；时间跟速度。 */
const dlyOf = (e: number) => ({ mix: r1((0.1 + 0.4 * e) * 100) / 100, feedback: r1((0.15 + 0.5 * e) * 100) / 100, dampHz: 6000 });
const DLY_SIMPLE: SimpleView = {
  controls: [
    { id: "echo", label: "回声多少", hint: "往右 = 回声越响、越久", kind: "knob", min: 0, max: 1, step: 0.05, fmt: pct },
    { id: "beats", label: "几拍一次", hint: "回声和拍子对齐（跟着歌的速度）", kind: "choice", choices: [{ v: 0.5, label: "八分" }, { v: 0.75, label: "附点八分" }, { v: 1, label: "四分" }] },
  ],
  read(p) { const e = (p.mix - 0.1) / 0.4, c = dlyOf(e); return e >= -1e-3 && e <= 1 + 1e-3 && near(p.feedback, c.feedback, 0.006) && p.dampHz === 6000 && [0.5, 0.75, 1].includes(p.syncBeats) ? { echo: Math.round(e * 20) / 20, beats: p.syncBeats } : null; },
  write(v, p) { return { ...p, ...dlyOf(Math.max(0, Math.min(1, v.echo ?? 0))), syncBeats: [0.5, 0.75, 1].includes(v.beats) ? v.beats : 0.75 }; },
};
/** 合唱一键 = 「宽」w：湿 20% → 60%、抖动深度 1 → 5 ms、左右铺开 0.4 → 1；三条、延迟 18 ms、抖动 0.6 Hz。 */
const choOf = (w: number) => ({ mix: r1((0.2 + 0.4 * w) * 100) / 100, depthMs: r1(1 + 4 * w), spread: r1((0.4 + 0.6 * w) * 100) / 100, voices: 3, delayMs: 18, rateHz: 0.6 });
const CHO_SIMPLE: SimpleView = {
  controls: [{ id: "wide", label: "宽", hint: "往右 = 越宽、越像好几个人", kind: "knob", min: 0, max: 1, step: 0.05, fmt: pct }],
  read(p) { const w = (p.mix - 0.2) / 0.4, c = choOf(w); return w >= -1e-3 && w <= 1 + 1e-3 && near(p.depthMs, c.depthMs, 0.06) && near(p.spread, c.spread, 0.006) && p.voices === 3 && p.delayMs === 18 && p.rateHz === 0.6 ? { wide: Math.round(w * 20) / 20 } : null; },
  write(v, p) { return { ...p, ...choOf(Math.max(0, Math.min(1, v.wide ?? 0))) }; },
};
const GAIN_SIMPLE: SimpleView = {
  controls: [{ id: "dB", label: "增益", hint: "插件链中间单纯调大调小（前面的插件把音量改了，用它补回来）", kind: "knob", min: -24, max: 12, step: 0.5, fmt: (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)} dB` }],
  read(p) { return { dB: p.dB }; },
  write(v, p) { return { ...p, dB: v.dB ?? 0 }; },
};
export const SIMPLE: Record<string, SimpleView> = { eq: EQ_SIMPLE, comp: COMP_SIMPLE, reverb: REV_SIMPLE, delay: DLY_SIMPLE, chorus: CHO_SIMPLE, gain: GAIN_SIMPLE };
/** 放在路由轨上（发送的返回轨）的混响 / 延迟 / 合唱：混音的老规矩 = 全湿（原声留在歌手自己那条路上，发多少 = 加多少效果；不全湿 = 发得越多原声越响）。
 *  同一个插件、同一组参数，只是一键面板的公式换一套：湿 = 100% 固定，旋钮管房间大小 / 回声长短 / 宽窄（v0.10.9）。 */
const wet1 = (p: Params) => p.mix === 1;
export const SIMPLE_BUS: Record<string, SimpleView> = {
  reverb: { controls: [{ id: "size", label: "房间大小", hint: "往右 = 越大的房间、尾巴越长（发多少由发送那边的旋钮管）", kind: "knob", min: 0, max: 1, step: 0.05, fmt: pct }],
    read(p) { const d = (p.room - 0.3) / 0.65; return wet1(p) && d >= -1e-3 && d <= 1 + 1e-3 && p.damp === 0.5 && p.preDelayMs === 10 && p.width === 1 ? { size: Math.round(d * 20) / 20 } : null; },
    write(v, p) { const d = Math.max(0, Math.min(1, v.size ?? 0)); return { ...p, room: r1((0.3 + 0.65 * d) * 100) / 100, damp: 0.5, preDelayMs: 10, width: 1, mix: 1 }; } },
  delay: { controls: [{ id: "echo", label: "回声多长", hint: "往右 = 回声重复得越久（发多少由发送那边的旋钮管）", kind: "knob", min: 0, max: 1, step: 0.05, fmt: pct }, DLY_SIMPLE.controls[1]],
    read(p) { const e = (p.feedback - 0.15) / 0.5; return wet1(p) && e >= -1e-3 && e <= 1 + 1e-3 && p.dampHz === 6000 && [0.5, 0.75, 1].includes(p.syncBeats) ? { echo: Math.round(e * 20) / 20, beats: p.syncBeats } : null; },
    write(v, p) { const e = Math.max(0, Math.min(1, v.echo ?? 0)); return { ...p, feedback: r1((0.15 + 0.5 * e) * 100) / 100, dampHz: 6000, mix: 1, syncBeats: [0.5, 0.75, 1].includes(v.beats) ? v.beats : 0.75 }; } },
  chorus: { controls: [CHO_SIMPLE.controls[0]],
    read(p) { const w = (p.depthMs - 1) / 4; return wet1(p) && w >= -1e-3 && w <= 1 + 1e-3 && near(p.spread, r1((0.4 + 0.6 * w) * 100) / 100, 0.006) && p.voices === 3 && p.delayMs === 18 && p.rateHz === 0.6 ? { wide: Math.round(w * 20) / 20 } : null; },
    write(v, p) { const w = Math.max(0, Math.min(1, v.wide ?? 0)); return { ...p, ...choOf(w), mix: 1 }; } },
};
/** 这一格用哪套一键面板（onBus = 在路由轨上）。 */
export const simpleView = (kind: string, onBus = false): SimpleView | undefined => (onBus ? SIMPLE_BUS[kind] : undefined) ?? SIMPLE[kind];
/** 新插一格的初始参数：一键面板的「中间值」（插上就有一点效果，一眼能听出它在干什么）。 */
export function freshParams(kind: string, onBus = false): Params {
  const p = defaults(kind), s = SIMPLE[kind];
  if (onBus && kind === "reverb") return SIMPLE_BUS.reverb.write({ size: 0.5 }, p);
  if (onBus && kind === "delay") return SIMPLE_BUS.delay.write({ echo: 0.3, beats: 0.75 }, p);
  if (onBus && kind === "chorus") return SIMPLE_BUS.chorus.write({ wide: 0.4 }, p);
  if (kind === "eq") return s.write({ autoLow: 0, tilt: 0 }, p);
  if (kind === "comp") return s.write({ amount: 0.3 }, p);
  if (kind === "reverb") return s.write({ far: 0.4 }, p);
  if (kind === "delay") return s.write({ echo: 0.3, beats: 0.75 }, p);
  if (kind === "chorus") return s.write({ wide: 0.4 }, p);
  return p;
}
/** 一格在卡片上的一句话（插件格小钮上的字）。 */
export function fxSummary(fx: FxV2, onBus = false): string {
  const view = simpleView(fx.kind, onBus), p = paramsOf(fx), s = view?.read(p), name = pluginName(fx.kind);
  if (fx.on === false) return `${name}（关）`;
  if (!s) return `${name}（全量）`;
  if (fx.kind === "eq") return `${name}${s.autoLow ? " 低切" : ""}${near(s.tilt, 0, 0.01) ? (s.autoLow ? "" : "（平）") : s.tilt < 0 ? " 厚" : " 亮"}`;
  const c = view!.controls[0];
  return `${name} ${c.fmt ? c.fmt(s[c.id]) : s[c.id]}`;
}

// ── 主线程换算（送进录音房之前） ─────────────────────────────────────────
/** 自动低切的频率：这个声部最低的音往下大三度（约 0.79 倍），夹在 20–300 Hz；没有音 = 0（关）。 */
export function autoLowCutHz(lowestMidi: number | null): number {
  if (lowestMidi === null) return 0;
  const hz = 440 * 2 ** ((lowestMidi - 69 - 4) / 12);
  return Math.round(Math.max(20, Math.min(300, hz)));
}
/** 一条链 → 录音房收的样子：hpAuto / syncBeats 换成 hpHz / timeMs（主线程换算的参数本身不送）。 */
export function resolveChain(chain: readonly FxV2[], ctx: { lowestMidi: number | null; bpm: number }): FxV2[] {
  return chain.map((fx) => {
    if (fx.kind === "eq" && fx.params.hpAuto) { const { hpAuto: _a, ...rest } = fx.params; return { ...fx, params: { ...rest, hpHz: autoLowCutHz(ctx.lowestMidi) } }; }
    if (fx.kind === "delay" && fx.params.syncBeats) { const { syncBeats: _b, ...rest } = fx.params; return { ...fx, params: { ...rest, timeMs: Math.min(2000, Math.round((60000 / ctx.bpm) * fx.params.syncBeats)) } }; }
    return fx;
  });
}
