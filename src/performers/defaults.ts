// defaults.ts —— 乐手身上按值带着的数，和「现在的默认」比（第 16 条 16-6，统筹 2026-11-13「16-6 摆法」；user 11-12 晚「你每个…乐手设定里面就能看到，
//   如果你打开的时候，就正好能看到它们的区别」）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
// 只有这一处算：乐器页（每一行打点 / 「现在的默认」那一句 / 「默认」钮 / 顶上那一句）和混音台卡片（「乐手 N 处不同」）都问它。
//   「现在的默认」= 这位现在新上场会带着的（插件 castNow：模板 + 音乐目录按值抄的 + 库报的响度）；只陈述「不一样」，不猜谁改的。
//   行 = 乐器页上的一行：通用的在下面 ROWS（按插件的能力字段挑，不按引擎名），这位自己的在插件的 defaultRows。每个会改这位声音的键恰好落在一行上；
//   不改这位声音的键不比、不露（统筹四问第 4 条）。守卫 test/performer-defaults.test.ts 按「这位的声音变不变」核（统筹补的第一条）。
// 出声的代码不 import 这里（它问模板；守卫 test/template.test.ts 管 src/score、src/engine、src/core）。
import { _t } from "../i18n/index.ts";
import { activeCandidate, candPath, withActiveKeys, type Extras } from "../format/project.ts";
import type { Hum } from "../format/contract.ts";
import type { Catalog } from "../gm/catalog.ts";
import { performerOf, type DefaultRowDef, type PerformerPlugin } from "./registry.ts";

type Json = Record<string, unknown>;
const art = (k: string) => `articulation.${k}`;
/** 这一路的键（音量那一路 = Db，力度那一路 = Vel）。 */
const byPath = (gain: string, vel: string) => (p: PerformerPlugin) => (p.dynamics === "gain" ? gain : vel);
type Row = Omit<DefaultRowDef, "keys"> & { keys: readonly string[] | ((p: PerformerPlugin) => readonly string[]) };
const honors = (...m: string[]) => (p: PerformerPlugin) => m.some((x) => (p.honors as readonly string[]).includes(x));

/** 通用的行（乐器页「怎么演」那一格 + 「记号怎么演」那张表），按能力字段挑。id 和页面上的 data-row 对上。 */
const ROWS: readonly Row[] = [
  { id: "cal", label: () => _t("响度"), keys: ["calibrationDb"] },
  { id: "chain", label: () => _t("这位自己的效果"), keys: ["chain"], resettable: false },
  { id: "gap", label: () => _t("音和音之间"), keys: [art("gapSec")], when: (p) => p.sound === "notes" },
  { id: "roll", label: () => _t("滚奏"), keys: [art("rollHz")], when: honors("roll") },
  { id: "swell", label: () => _t("音内起伏多深"), keys: [art("swellDb")], when: honors("swellGrow", "swellFade") },
  { id: "dyn", label: () => _t("力度记号"), keys: (p) => [p.dynamics === "gain" ? "dynamicsDb" : "dynamicsVel"] },
  { id: "sing", label: () => _t("记号怎么唱"), keys: ["sing"], when: (p) => p.sound === "chunks" },
  { id: "hum", label: () => _t("哼的字"), keys: ["instrument.hum"], when: (p) => p.lyrics !== "none" },
  // 「记号怎么演」那张表
  { id: "m:wedge", label: () => _t("渐强渐弱没写终点"), keys: [art("wedgeStepVel")], when: (p) => p.dynamics === "velocity" },
  { id: "m:ghost", label: () => _t("幽灵音"), keys: (p) => [art(byPath("ghostDb", "ghostVel")(p))], when: honors("ghost") },
  { id: "m:unstress", label: () => _t("弱化"), keys: (p) => [art(byPath("unstressDb", "unstressVel")(p))], when: honors("unstress") },
  { id: "m:stress", label: () => _t("次重音"), keys: (p) => [art(byPath("stressDb", "stressVel")(p))], when: honors("stress") },
  { id: "m:accent", label: () => _t("重音"), keys: (p) => (p.dynamics === "gain" ? [art("accentDb"), art("accentSec")] : [art("accentVel")]), when: honors("accent") },
  { id: "m:marcato", label: () => _t("强音"), keys: (p) => [art(byPath("marcatoDb", "marcatoVel")(p))], when: honors("marcato") },
  { id: "m:sfz", label: () => _t("突强 sfz"), keys: (p) => (p.dynamics === "gain" ? [art("sfzDb"), art("sfzSec")] : [art("sfzVel")]), when: honors("sfz") },
  { id: "m:fp", label: () => _t("强后即弱 fp"), keys: [art("fpSec")], when: honors("fp") },
  { id: "m:swellGrow", label: () => _t("音内渐强 / 鼓起"), keys: [art("canSwell")], when: honors("swellGrow") },
  { id: "m:staccato", label: () => _t("跳音"), keys: [art("staccatoGate")], when: (p) => p.sound === "notes" && honors("staccato")(p) },
  { id: "m:breath", label: () => _t("呼吸"), keys: [art("breathSec"), art("breathShare")], when: (p) => p.sound === "notes" && honors("breath")(p) },
  { id: "m:gap", label: () => _t("音和音之间（最多）"), keys: [art("gapShare")], when: (p) => p.sound === "notes" },
  { id: "m:arpeggio", label: () => _t("琶音"), keys: [art("arpeggioSec")], when: honors("arpeggio") },
];

export interface DefaultDiff {
  id: string; label: string; keys: readonly string[];
  resettable: boolean;
}
export interface DefaultsReport {
  /** 和现在的默认不一样的行（页面上从上往下的顺序：通用的、这位自己的）。 */
  rows: DefaultDiff[];
  /** 要问音乐目录、目录还没载的行数（先不比；乐器页写「目录载好后再比 n 行」、宿主去载）。 */
  pending: number;
  /** 「现在新上场」那一位（页面拿它算「现在的默认」那一句；没人上场 / 这一版不认识的引擎 = null）。 */
  def: Json | null;
}
/** 这位（台上那位）有哪几行能比：通用的 + 插件自己的，按 when 挑；keys 摊开成路径。 */
export function rowsFor(p: PerformerPlugin, cur: Json): (DefaultRowDef & { keys: readonly string[] })[] {
  const all = [...ROWS, ...(p.defaultRows ?? [])] as Row[];
  return all.filter((r) => !r.when || r.when(p, cur)).map((r) => ({ ...r, keys: typeof r.keys === "function" ? r.keys(p) : r.keys }));
}
const sameJson = (cur: Json, def: Json, keys: readonly string[]) => keys.every((k) => JSON.stringify(candPath(cur, k) ?? null) === JSON.stringify(candPath(def, k) ?? null));
/** 台上那位和现在的默认比（一处）。没人上场 / 读不懂的引擎 = 空。catalog = 音乐目录（没载 = null）。 */
export function defaultsReport(extras: Extras, role: string, catalog: Catalog | null): DefaultsReport {
  const cur = activeCandidate(extras, role), p = performerOf((cur?.instrument as Json | undefined)?.engine as string | undefined);
  if (!cur || !p) return { rows: [], pending: 0, def: null };
  const { cand: def, pending } = p.castNow(cur, catalog), wait = new Set(pending);
  const rows: DefaultDiff[] = []; let n = 0;
  for (const r of rowsFor(p, cur)) {
    if (r.keys.some((k) => wait.has(k))) { n++; continue; }
    if (r.same ? r.same(cur, def) : sameJson(cur, def, r.keys)) continue;
    rows.push({ id: r.id, label: r.label(), keys: r.keys, resettable: r.resettable !== false });
  }
  return { rows, pending: n, def };
}
/** 乐器页「默认」钮：这一行改回现在的默认（按值抄进文件，一步撤销）。没有这一行 / 只读的那一行 / 要的目录没载 = 原样（null）。 */
export function resetRow(extras: Extras, role: string, id: string, catalog: Catalog | null, hum: Hum): Extras | null {
  const cur = activeCandidate(extras, role), p = performerOf((cur?.instrument as Json | undefined)?.engine as string | undefined);
  if (!cur || !p) return null;
  const r = rowsFor(p, cur).find((x) => x.id === id); if (!r || r.resettable === false) return null;
  const { cand: def, pending } = p.castNow(cur, catalog); if (r.keys.some((k) => pending.includes(k))) return null;
  return r.reset ? r.reset(extras, role, def, hum) : withActiveKeys(extras, role, def, r.keys, hum);
}
/** 把台上那位整个换成「现在的默认」那一位的休息室（只给页面算「现在的默认」那一句用：同一个显示函数在它上面再跑一次；不进文件）。 */
export function defaultExtras(extras: Extras, role: string, def: Json, hum: Hum): Extras {
  const cur = activeCandidate(extras, role), p = performerOf((cur?.instrument as Json | undefined)?.engine as string | undefined);
  if (!cur || !p) return extras;
  return withActiveKeys(extras, role, def, rowsFor(p, cur).flatMap((r) => r.keys), hum);
}
