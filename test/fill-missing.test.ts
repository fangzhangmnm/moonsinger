// 乐器页「缺的数」那一行的「补成现在的默认」（src/performers/defaults.ts missingFillPlan / fillMissing；统筹 2026-11-13 第三样，v0.17.47）。
// created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
// 守：只补问题清单里的键、各补成「现在新上场会带着的」那个数；别的键一个不动；补完规格没毛病；一步撤销回到原样；没毛病 / 没人上场 = 没有可补的。
import { describe, it, eq, assert } from "./runner.mjs";
import { missingFillPlan, fillMissing } from "../src/performers/defaults.ts";
import { templateExtras, perfSpecOf, activeCandidate, type Extras } from "../src/format/project.ts";
import { TEMPLATE } from "../src/format/template.ts";
import { createDocument } from "../src/app/document.ts";
import { initState } from "../src/score/song.ts";
import "../src/performers/index.ts";

type Json = Record<string, unknown>;
const song = initState().song, role = song.parts[0]!.role;
/** 小月相身上弄坏三个数：accentDb 写成字、marcatoDb 拿掉、力度表 pp 写成字；另外三个数改得和默认不一样（补多了 = 它们会被改回默认，测试就红）。 */
function broken(): Extras {
  const x = structuredClone(templateExtras(song)) as Extras, c = activeCandidate(x, role)! as Json;
  const a = c.articulation as Json; a.accentDb = "x"; delete a.marcatoDb; (c.dynamicsDb as Json).pp = "y";
  a.staccatoGate = 0.7; c.calibrationDb = -3; (c.dynamicsDb as Json).f = -2;
  return x;
}
/** 拿掉几条路径之后的整位乐手（比「别的键动没动」用）。 */
function without(x: Extras, paths: string[]): string {
  const c = structuredClone(activeCandidate(x, role)) as Json;
  for (const p of paths) { const ks = p.split("."), last = ks.pop()!; let o = c; for (const k of ks) o = o[k] as Json; delete o[last]; }
  return JSON.stringify(c);
}
const PATHS = ["articulation.accentDb", "articulation.marcatoDb", "dynamicsDb.pp"];

describe("补成现在的默认（缺的数）", () => {
  it("补哪几个、各补成多少：问题清单里的那几个，值 = 模板", () => {
    const plan = missingFillPlan(broken(), role, null)!;
    eq(plan.waiting.length, 0);
    eq(plan.fills.map((f) => `${f.key}=${String(f.value)}`).sort().join(","),
      [`accentDb=${TEMPLATE.lounge.articulation.gain.accentDb}`, `dynamicsDb.pp=${TEMPLATE.lounge.dynamicsDb.pp}`, `marcatoDb=${TEMPLATE.lounge.articulation.gain.marcatoDb}`].sort().join(","));
  });

  it("补完：规格没毛病；别的键一个不动", () => {
    const x0 = broken(), x1 = fillMissing(x0, role, null, "n")!;
    assert(!!x1, "有可补的");
    const chk = perfSpecOf(x1, role); assert(!!chk && chk.ok, `补完 ok：${JSON.stringify(chk && !chk.ok ? chk.problems : null)}`);
    eq(without(x1, PATHS), without(x0, PATHS), "除了补的那三个，这位身上别的都没变");
    for (const r of Object.keys(x0.lounge)) if (r !== role) eq(JSON.stringify(x1.lounge[r]), JSON.stringify(x0.lounge[r]), "别的角色不动");
    eq(JSON.stringify(x1.studio), JSON.stringify(x0.studio), "录音房不动");
  });

  it("一步撤销回到原样", () => {
    const x0 = broken(), noop = () => {}, D = createDocument({ st: initState(), extras: x0 }, { now: () => 0, onState: noop, onExtras: noop, onRefused: noop, onRestored: noop });
    D.commit({ extras: fillMissing(x0, role, null, "n")! }, { locus: { kind: "lounge", label: "补成现在的默认" } });
    eq(D.history.past.length, 1, "一步");
    assert(D.undo()); eq(JSON.stringify(D.extras), JSON.stringify(x0), "撤销 = 原样（坏的那三个也回来了）");
  });

  it("没毛病 / 没人上场：没有可补的", () => {
    const ok = templateExtras(song);
    eq(missingFillPlan(ok, role, null), null); eq(fillMissing(ok, role, null, "n"), null);
    eq(missingFillPlan(ok, "r99", null), null);
  });
});
