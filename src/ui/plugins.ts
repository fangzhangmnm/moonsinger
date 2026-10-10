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
/** 一格的参数（缺的补默认）。混响 / 延迟 / 合唱没写「原声」的（v0.10.10 之前插的）= 录音房照旧按 1 − 湿 算，这里也如实显示成 1 − 湿。 */
export const paramsOf = (fx: FxV2): Params => {
  const p: Params = { ...defaults(fx.kind), ...fx.params };
  if ((fx.kind === "reverb" || fx.kind === "delay" || fx.kind === "chorus") && fx.params.dry === undefined) p.dry = Math.round((1 - p.mix) * 100) / 100;
  return p;
};
/** 这一格是不是「全湿」（原声 0、湿 100%：当发送的返回轨用；出到它 = 原声没了）。 */
export const fullyWet = (fx: FxV2): boolean => (fx.kind === "reverb" || fx.kind === "delay" || fx.kind === "chorus") && fx.on !== false && paramsOf(fx).dry === 0;

export interface SimpleControl { id: string; label: string; hint: string; kind: "knob" | "toggle" | "choice"; min?: number; max?: number; step?: number; choices?: { v: number; label: string }[]; fmt?: (v: number) => string }
export interface SimpleView {
  controls: SimpleControl[];
  /** 全量参数正好落在一键的公式上 = 一键面板的读数；不是（在全量里调过）= null。 */
  read(p: Params): Record<string, number> | null;
  /** 一键面板的值 → 全量参数（只改公式管的那几个，别的照留）。 */
  write(v: Record<string, number>, p: Params): Params;
  /** 全量参数（落不到公式上）→ 最接近的一键值（v0.10.14；user「basic模式下应该有一个project to basic模式的功能，不然的话basic模式会是被锁住，免得不小心override」）。 */
  project(p: Params): Record<string, number>;
}
const near = (a: number, b: number, e = 1e-3) => Math.abs(a - b) <= e;
const r1 = (x: number) => Math.round(x * 10) / 10;
/** 一键旋钮的格子（0–1，0.05 一格）；几个参数各自反推出的位置取平均 = 离几个都最近。 */
const knob01 = (...xs: number[]) => Math.round(Math.max(0, Math.min(1, xs.reduce((a, b) => a + b, 0) / xs.length)) * 20) / 20;
const nearestBeat = (b: number | undefined) => (b ? [0.5, 0.75, 1].reduce((a, c) => (Math.abs(c - b) < Math.abs(a - b) ? c : a)) : 0.75);
const pct = (v: number) => `${Math.round(v * 100)}%`;
// ── 物理量纲（v0.10.10，user「房间大小为什么是百分比……不是说好都用SI吗？都用可以理解的不依赖与convention的量纲」）──
//   存的还是原语的参数（下礼拜 Fable 理契约时再定存什么），面板上的旋钮和读数一律换算成物理量：秒、kHz、dB。
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
/** Freeverb 八条梳状的平均长度（44.1 kHz 下 1378 个采样 ≈ 31 ms；按采样率缩放 = 时间不变）。 */
const COMB_AVG_S = 1378 / 44100, SR_REF = 48000;
/** 房间大小 → 混响时间 RT60（秒；低频那一截衰减 60 dB 要多久）：反馈 = 0.7 + 0.28·room，每过一遍梳状衰减 20·log10(反馈) dB。 */
export const rt60OfRoom = (room: number): number => (3 * COMB_AVG_S) / -Math.log10(0.7 + 0.28 * clamp01(room));
export const roomOfRt60 = (t: number): number => clamp01((10 ** ((-3 * COMB_AVG_S) / Math.max(0.01, t)) - 0.7) / 0.28);
/** 高频吸收 → 从多少 kHz 开始衰减（梳状里那个一阶低通的截止；按 48 kHz 算，约数）。 */
export const dampKHz = (damp: number): number => { const a = 0.4 * clamp01(damp); return a <= 1e-6 ? Infinity : (-SR_REF * Math.log(a)) / (2 * Math.PI) / 1000; };
export const dampOfKHz = (k: number): number => clamp01(Math.exp((-2 * Math.PI * k * 1000) / SR_REF) / 0.4);
/** 线性倍数 ↔ dB（−60 dB 及以下 = 关）。 */
export const linDb = (x: number): number => (x <= 0.001 ? -60 : 20 * Math.log10(x));
export const dbLin = (d: number): number => (d <= -60 ? 0 : 10 ** (d / 20));
const dbt = (d: number) => (d <= -60 ? "关" : `${d > 0 ? "+" : ""}${d.toFixed(1)} dB`);
/** 每个参数干什么用（面板上的 tooltip + iPad 能点的小问号；user「每个参数能不能加一个tooltip解释一下是干什么用的」「然后参数后面加一个小的方块问号这样ipad也可以点」）。 */
export const PARAM_HINT: Record<string, string> = {
  "eq.hpAuto": "自动低切：按这个声部最低的音放低切（往下大三度），切掉它用不着的低频——隆隆声、和别的轨糊在一起的低频",
  "eq.hpHz": "低切：这个频率以下的都切掉。人声常在 80–120 Hz，铃这类高的乐器可以更高；最左 = 关",
  "eq.lpHz": "高切：这个频率以上的都切掉，去刺耳、嘶嘶声；最左 = 关",
  "eq.lowDb": "低架：转折频率以下整体加 / 减多少。减 = 去闷、给别的轨让出低频；加 = 加厚",
  "eq.lowHz": "低架的转折频率：从这里往下算「低」",
  "eq.midDb": "中峰：在一个频段上推 / 挖多少。两样东西糊在一起时，在其中一个上挖一刀给另一个让位",
  "eq.midHz": "中峰的中心频率：推 / 挖的是哪一段",
  "eq.midQ": "中峰的宽窄：Q 越大越窄（1 ≈ 一个多八度宽，4 ≈ 小半个八度）",
  "eq.highDb": "高架：转折频率以上整体加 / 减多少。加 = 亮、减 = 暗",
  "eq.highHz": "高架的转折频率：从这里往上算「高」",
  "comp.thresholdDb": "阈值：声音超过这个电平才开始压；越低，压到的越多",
  "comp.ratio": "比例：超过阈值的部分压成几分之一（4:1 = 超出 4 dB 的只剩 1 dB）",
  "comp.attackMs": "起压：超过阈值之后多快压下去。短 = 连字头一起压平；长 = 让字头先冲出来、更有劲",
  "comp.releaseMs": "放开：声音落回阈值以下之后多快松开。太短会一抽一抽的，太长下一个字也被压着",
  "comp.kneeDb": "拐点：阈值附近这么宽的一段里慢慢开始压（软）；0 = 一到阈值就压（硬）",
  "comp.makeupDb": "补偿：压完整体加回来多少（压缩会让整体变轻）",
  "reverb.room": "混响时间（RT60）：声音停了之后，尾巴衰减 60 dB 要多久。小房间不到 1 秒，大厅 2–3 秒，教堂更长",
  "reverb.damp": "高频从这里开始衰减：真实的房间里高频被吸收得快，尾巴越往后越暗；数越低越暗",
  "reverb.mix": "湿：混响的声音有多响",
  "reverb.dry": "原声：原来的声音留多少。插在歌手轨上一般 0 dB（不动）；当发送的返回轨用 = 关",
  "reverb.preDelayMs": "预延迟：原声之后过多久混响才进来。拉开一点，人声更清楚、不被糊住",
  "reverb.width": "宽度：混响在左右铺多开",
  "delay.syncBeats": "跟速度：回声隔几拍，按歌的速度算时间；0 = 用下面的毫秒",
  "delay.timeMs": "时间：每次回声隔多久",
  "delay.feedback": "每次回声：每重复一次轻多少 dB；越接近 0，回声越久",
  "delay.mix": "湿：回声有多响",
  "delay.dry": "原声：原来的声音留多少。插在歌手轨上一般 0 dB（不动）；当发送的返回轨用 = 关",
  "delay.dampHz": "反馈高切：每次回声都把这个频率以上的削掉一点，越往后越暗（像真的回声）",
  "chorus.voices": "几条：同时有几个稍微错开的副本",
  "chorus.delayMs": "延迟：副本比原声晚多少",
  "chorus.depthMs": "抖动深度：副本的延迟来回晃多大——晃 = 音高轻微起伏，像好几个人唱不齐",
  "chorus.rateHz": "抖动快慢：每秒晃几次",
  "chorus.spread": "左右铺开：副本摆得多开",
  "chorus.mix": "湿：副本有多响",
  "chorus.dry": "原声：原来的声音留多少。插在歌手轨上一般 0 dB（不动）；当发送的返回轨用 = 关",
  "gain.dB": "增益：单纯调大调小（前面的插件把音量改了，用它补回来）",
};
/** 全量面板里一个参数的旋钮：滑块用的物理量纲 ↔ 存的值。 */
export interface ParamView { hint: string; label: string; min: number; max: number; step: number; toV: (s: number) => number; toS: (v: number) => number; fmt: (v: number) => string }
export function paramView(kind: string, d: ParamDef): ParamView { return { hint: PARAM_HINT[`${kind}.${d.id}`] ?? d.label, ...paramView0(kind, d) }; }
function paramView0(kind: string, d: ParamDef): Omit<ParamView, "hint"> {
  const key = `${kind}.${d.id}`;
  if (key === "reverb.room") return { label: "混响时间（RT60）", min: 0.6, max: 10, step: 0.1, toV: roomOfRt60, toS: rt60OfRoom, fmt: (v) => `${rt60OfRoom(v).toFixed(1)} s` };
  if (key === "reverb.damp") return { label: "高频从这里开始衰减", min: 7, max: 20, step: 0.1, toV: (k) => (k >= 20 ? 0 : dampOfKHz(k)), toS: (v) => Math.min(20, dampKHz(v)), fmt: (v) => (dampKHz(v) >= 20 ? "不衰减（20 kHz 以上）" : `${dampKHz(v).toFixed(1)} kHz`) };
  if (d.id === "mix" || d.id === "dry") return { label: d.id === "mix" ? "湿（效果）" : "原声", min: -60, max: 0, step: 0.5, toV: dbLin, toS: linDb, fmt: (v) => dbt(linDb(v)) };
  if (key === "delay.feedback") return { label: "每次回声", min: -40, max: -0.5, step: 0.5, toV: dbLin, toS: linDb, fmt: (v) => `${linDb(v).toFixed(1)} dB / 次` };
  if (key === "reverb.width") return { label: "宽度（0 = 单声道，100% = 左右铺满）", min: 0, max: 1, step: 0.01, toV: (x) => x, toS: (x) => x, fmt: pct };
  if (key === "chorus.spread") return { label: "左右铺开（0 = 都在中间，100% = 铺到两边）", min: 0, max: 1, step: 0.01, toV: (x) => x, toS: (x) => x, fmt: pct };
  if (d.unit === "Hz") {
    const lo = Math.max(20, d.min || 20), hi = d.max, offable = d.min === 0, L = Math.log(lo), H = Math.log(hi);
    return { label: d.label, min: offable ? -0.02 : 0, max: 1, step: 0.002, toV: (x) => (offable && x < 0 ? 0 : Math.round(Math.exp(L + Math.max(0, x) * (H - L)))), toS: (v) => (offable && v <= 0 ? -0.02 : (Math.log(Math.max(lo, v)) - L) / (H - L)),
      fmt: (v) => (v <= 0 ? "关" : v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 1 : 2)} kHz` : `${Math.round(v)} Hz`) };
  }
  const step = d.unit === "dB" ? 0.5 : d.unit === "ms" ? (d.max > 500 ? 5 : 0.5) : d.unit === "0..1" ? 0.01 : d.unit === "ratio" ? (d.max <= 4 ? 1 : 0.1) : 1;
  const fmt = (v: number) => (d.unit === "dB" ? dbt(v) : d.unit === "ms" ? `${v} ms` : d.unit === "0..1" ? pct(v) : d.unit === "ratio" ? (d.id === "ratio" ? `${v}:1` : d.id === "voices" ? `${v} 条` : d.id === "midQ" ? `Q ${v}` : String(v)) : String(v));
  return { label: d.label, min: d.min, max: d.max, step, toV: (x) => x, toS: (x) => x, fmt };
}

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
  /** 低切开着（自动或手调）= 自动低切；高架减低架的一半 = 倾斜；中峰 / 高切丢掉。 */
  project(p) { return { autoLow: p.hpAuto || p.hpHz > 0 ? 1 : 0, tilt: Math.round(Math.max(-1, Math.min(1, (p.highDb - p.lowDb) / (2 * TILT_DB))) * 20) / 20 }; },
};
/** 压缩一键 = 「压多少」a：阈值 −6 → −36 dB、比例 1.5 → 6，起 10 ms、落 150 ms、拐点 6 dB 固定；补偿 = 压掉的一半补回来。 */
const compOf = (a: number) => { const thr = -6 - 30 * a, ratio = 1.5 + 4.5 * a; return { thresholdDb: r1(thr), ratio: r1(ratio), attackMs: 10, releaseMs: 150, kneeDb: 6, makeupDb: r1(0.5 * -thr * (1 - 1 / ratio) * 0.5) }; };
const COMP_SIMPLE: SimpleView = {
  controls: [{ id: "amount", label: "压多少", hint: "把忽大忽小拉平：往右 = 压得越狠（响的字压下来、轻的相对显出来）", kind: "knob", min: 0, max: 1, step: 0.05, fmt: (a) => { const c = compOf(a); return `${c.thresholdDb} dB 起压 · ${c.ratio}:1`; } }],
  read(p) {
    const a = (-p.thresholdDb - 6) / 30; if (a < -1e-3 || a > 1 + 1e-3) return null;
    const c = compOf(a);
    return near(p.ratio, c.ratio, 0.06) && p.attackMs === c.attackMs && p.releaseMs === c.releaseMs && p.kneeDb === c.kneeDb && near(p.makeupDb, c.makeupDb, 0.06) ? { amount: Math.round(a * 20) / 20 } : null;
  },
  write(v, p) { return { ...p, ...compOf(Math.max(0, Math.min(1, v.amount ?? 0))) }; },
  project(p) { return { amount: knob01((-p.thresholdDb - 6) / 30, (p.ratio - 1.5) / 4.5) }; },
};
/** 混响一键 = 「远近」d：**原声 100% 不动**、湿 8% → 48% 加在上面（v0.10.10 改；原来是原声和湿交叉，往右拧原声就掉 = user「开了混响结果铃声都哑掉了」「有可能是你混响的新手模式Preset不合理」）、
 *  房间 0.3 → 0.95；高频吸收 0.5、预延迟 10 ms、宽度满。 */
const revOf = (d: number) => ({ mix: r1((0.08 + 0.4 * d) * 100) / 100, dry: 1, room: r1((0.3 + 0.65 * d) * 100) / 100, damp: 0.5, preDelayMs: 10, width: 1 });
const REV_SIMPLE: SimpleView = {
  controls: [{ id: "far", label: "远近", hint: "往右 = 越远、越大的房间（铃可以远一点，贴耳的人声近一点）；原声不动，只往上加混响", kind: "knob", min: 0, max: 1, step: 0.05, fmt: (d) => { const c = revOf(d); return `湿 ${dbt(linDb(c.mix))} · ${rt60OfRoom(c.room).toFixed(1)} s`; } }],
  read(p) { const d = (p.mix - 0.08) / 0.4, c = revOf(d); return d >= -1e-3 && d <= 1 + 1e-3 && p.dry === 1 && near(p.room, c.room, 0.006) && p.damp === 0.5 && p.preDelayMs === 10 && p.width === 1 ? { far: Math.round(d * 20) / 20 } : null; },
  write(v, p) { return { ...p, ...revOf(Math.max(0, Math.min(1, v.far ?? 0))) }; },
  project(p) { return { far: knob01((p.mix - 0.08) / 0.4, (p.room - 0.3) / 0.65) }; },
};
/** 延迟一键 = 「回声多少」e + 「几拍一次」：湿 10% → 50%、反馈 0.15 → 0.65；反馈高切 6000 Hz；时间跟速度。 */
const dlyOf = (e: number) => ({ mix: r1((0.1 + 0.4 * e) * 100) / 100, dry: 1, feedback: r1((0.15 + 0.5 * e) * 100) / 100, dampHz: 6000 });   // 原声 100% 不动（同混响，v0.10.10）
const DLY_SIMPLE: SimpleView = {
  controls: [
    { id: "echo", label: "回声多少", hint: "往右 = 回声越响、越久；原声不动", kind: "knob", min: 0, max: 1, step: 0.05, fmt: (e) => { const c = dlyOf(e); return `湿 ${dbt(linDb(c.mix))} · 每次 ${linDb(c.feedback).toFixed(1)} dB`; } },
    { id: "beats", label: "几拍一次", hint: "回声和拍子对齐（跟着歌的速度）", kind: "choice", choices: [{ v: 0.5, label: "八分" }, { v: 0.75, label: "附点八分" }, { v: 1, label: "四分" }] },
  ],
  read(p) { const e = (p.mix - 0.1) / 0.4, c = dlyOf(e); return e >= -1e-3 && e <= 1 + 1e-3 && p.dry === 1 && near(p.feedback, c.feedback, 0.006) && p.dampHz === 6000 && [0.5, 0.75, 1].includes(p.syncBeats) ? { echo: Math.round(e * 20) / 20, beats: p.syncBeats } : null; },
  write(v, p) { return { ...p, ...dlyOf(Math.max(0, Math.min(1, v.echo ?? 0))), syncBeats: [0.5, 0.75, 1].includes(v.beats) ? v.beats : 0.75 }; },
  project(p) { return { echo: knob01((p.mix - 0.1) / 0.4, (p.feedback - 0.15) / 0.5), beats: nearestBeat(p.syncBeats) }; },
};
/** 合唱一键 = 「宽」w：湿 20% → 60%、抖动深度 1 → 5 ms、左右铺开 0.4 → 1；三条、延迟 18 ms、抖动 0.6 Hz。 */
const choOf = (w: number) => ({ mix: r1((0.2 + 0.4 * w) * 100) / 100, dry: 1, depthMs: r1(1 + 4 * w), spread: r1((0.4 + 0.6 * w) * 100) / 100, voices: 3, delayMs: 18, rateHz: 0.6 });   // 原声 100% 不动（同混响，v0.10.10）
const CHO_SIMPLE: SimpleView = {
  controls: [{ id: "wide", label: "宽", hint: "往右 = 越宽、越像好几个人；原声不动", kind: "knob", min: 0, max: 1, step: 0.05, fmt: (w) => { const c = choOf(w); return `湿 ${dbt(linDb(c.mix))} · 抖动 ${c.depthMs} ms`; } }],
  read(p) { const w = (p.mix - 0.2) / 0.4, c = choOf(w); return w >= -1e-3 && w <= 1 + 1e-3 && p.dry === 1 && near(p.depthMs, c.depthMs, 0.06) && near(p.spread, c.spread, 0.006) && p.voices === 3 && p.delayMs === 18 && p.rateHz === 0.6 ? { wide: Math.round(w * 20) / 20 } : null; },
  write(v, p) { return { ...p, ...choOf(Math.max(0, Math.min(1, v.wide ?? 0))) }; },
  project(p) { return { wide: knob01((p.mix - 0.2) / 0.4, (p.depthMs - 1) / 4, (p.spread - 0.4) / 0.6) }; },
};
const GAIN_SIMPLE: SimpleView = {
  controls: [{ id: "dB", label: "增益", hint: "插件链中间单纯调大调小（前面的插件把音量改了，用它补回来）", kind: "knob", min: -24, max: 12, step: 0.5, fmt: (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)} dB` }],
  read(p) { return { dB: p.dB }; },
  write(v, p) { return { ...p, dB: v.dB ?? 0 }; },
  project(p) { return { dB: p.dB }; },
};
export const SIMPLE: Record<string, SimpleView> = { eq: EQ_SIMPLE, comp: COMP_SIMPLE, reverb: REV_SIMPLE, delay: DLY_SIMPLE, chorus: CHO_SIMPLE, gain: GAIN_SIMPLE };
/** 放在路由轨上（发送的返回轨）的混响 / 延迟 / 合唱：混音的老规矩 = 全湿（原声留在歌手自己那条路上，发多少 = 加多少效果；不全湿 = 发得越多原声越响）。
 *  同一个插件、同一组参数，只是一键面板的公式换一套：湿 = 100% 固定，旋钮管房间大小 / 回声长短 / 宽窄（v0.10.9）。 */
const wet1 = (p: Params) => p.mix === 1 && p.dry === 0;
export const SIMPLE_BUS: Record<string, SimpleView> = {
  reverb: { controls: [{ id: "size", label: "混响时间", hint: "尾巴衰减 60 dB 要多久（RT60）：往右 = 越大的房间（发多少由发送那边的旋钮管）", kind: "knob", min: 0, max: 1, step: 0.05, fmt: (d) => `${rt60OfRoom(0.3 + 0.65 * d).toFixed(1)} s` }],
    read(p) { const d = (p.room - 0.3) / 0.65; return wet1(p) && d >= -1e-3 && d <= 1 + 1e-3 && p.damp === 0.5 && p.preDelayMs === 10 && p.width === 1 ? { size: Math.round(d * 20) / 20 } : null; },
    write(v, p) { const d = Math.max(0, Math.min(1, v.size ?? 0)); return { ...p, room: r1((0.3 + 0.65 * d) * 100) / 100, damp: 0.5, preDelayMs: 10, width: 1, mix: 1, dry: 0 }; },
    project(p) { return { size: knob01((p.room - 0.3) / 0.65) }; } },
  delay: { controls: [{ id: "echo", label: "回声多长", hint: "往右 = 回声重复得越久（发多少由发送那边的旋钮管）", kind: "knob", min: 0, max: 1, step: 0.05, fmt: (e) => `每次 ${linDb(0.15 + 0.5 * e).toFixed(1)} dB` }, DLY_SIMPLE.controls[1]],
    read(p) { const e = (p.feedback - 0.15) / 0.5; return wet1(p) && e >= -1e-3 && e <= 1 + 1e-3 && p.dampHz === 6000 && [0.5, 0.75, 1].includes(p.syncBeats) ? { echo: Math.round(e * 20) / 20, beats: p.syncBeats } : null; },
    write(v, p) { const e = Math.max(0, Math.min(1, v.echo ?? 0)); return { ...p, feedback: r1((0.15 + 0.5 * e) * 100) / 100, dampHz: 6000, mix: 1, dry: 0, syncBeats: [0.5, 0.75, 1].includes(v.beats) ? v.beats : 0.75 }; },
    project(p) { return { echo: knob01((p.feedback - 0.15) / 0.5), beats: nearestBeat(p.syncBeats) }; } },
  chorus: { controls: [{ ...CHO_SIMPLE.controls[0], hint: "往右 = 越宽、越像好几个人（发多少由发送那边的旋钮管）", fmt: (w) => `抖动 ${choOf(w).depthMs} ms` }],
    read(p) { const w = (p.depthMs - 1) / 4; return wet1(p) && w >= -1e-3 && w <= 1 + 1e-3 && near(p.spread, r1((0.4 + 0.6 * w) * 100) / 100, 0.006) && p.voices === 3 && p.delayMs === 18 && p.rateHz === 0.6 ? { wide: Math.round(w * 20) / 20 } : null; },
    write(v, p) { const w = Math.max(0, Math.min(1, v.wide ?? 0)); return { ...p, ...choOf(w), mix: 1, dry: 0 }; },
    project(p) { return { wide: knob01((p.depthMs - 1) / 4, (p.spread - 0.4) / 0.6) }; } },
};
/** 这一格用哪套一键面板（onBus = 在路由轨上）。 */
export const simpleView = (kind: string, onBus = false): SimpleView | undefined => (onBus ? SIMPLE_BUS[kind] : undefined) ?? SIMPLE[kind];
/** 「改成最接近的一键」：全量参数 → 最接近的一键值 → 按一键公式写回（公式不管的参数照留）。结果一定读得回一键（plugins.test 钉着）。 */
export function projectToSimple(kind: string, onBus: boolean, p: Params): Params {
  const v = simpleView(kind, onBus); return v ? v.write(v.project(p), p) : p;
}
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
