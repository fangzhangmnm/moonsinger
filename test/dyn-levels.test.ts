// ppp / fff（v0.9.23，2026-10-10 Opus 5.5；user「wishlist: ppp fff，以及帮我科普这些和db的换算关系，然后应该向用户揭露，方便对比」）：
// 新演奏者 by value 带 ppp / fff；旧演奏者的表里没有这两格 = 按它自己 pp→p / f→ff 的间隔往外推一档（力度夹在 1–127）；出声走同一张表（9-2 起只有力度表）。
import { describe, it, eq } from "./runner.mjs";
import { initState } from "../src/score/song.ts";
import { emptyExtras, withNewRole, activePerfSpec, type Extras } from "../src/format/project.ts";
import { DYNAMICS_DB } from "../src/format/performance.ts";

/** 把歌里所有候选的力度表换成给定的（模拟 v0.9.23 之前存的歌；9-2 起只有力度表）。 */
const withTables = (ex: Extras, vel: Record<string, number> | null): Extras => {
  const walk = (o: unknown): unknown => {
    if (Array.isArray(o)) return o.map(walk);
    if (!o || typeof o !== "object") return o;
    const x = Object.fromEntries(Object.entries(o as Record<string, unknown>).map(([k, v]) => [k, walk(v)]));
    if ("instrument" in x) { if (vel) x.dynamicsVel = vel; else delete x.dynamicsVel; }   // 演奏者：力度表换掉 / 拿掉（16-4 起小月相新建时不带力度表，这里照样塞一张）
    return x;
  };
  return walk(ex) as Extras;
};
describe("ppp / fff", () => {
  const hum = "n";
  it("新演奏者：力度表（按力度敲的用）ppp 16 / fff 126（MuseScore 的经典值）；小月相 / 元音版带的是 dB 表，ppp / fff = 模板（16-4）", () => {
    const sp = activePerfSpec(withNewRole(emptyExtras(), "r", hum), "r");
    eq(sp.dynamicsVel.ppp, 16); eq(sp.dynamicsVel.fff, 126); eq(sp.dynamicsVel.mf, 80);
    eq(sp.dynamicsDb.ppp, DYNAMICS_DB.ppp); eq(sp.dynamicsDb.fff, DYNAMICS_DB.fff); eq(sp.dynamicsDb.mf, DYNAMICS_DB.mf);
  });
  it("旧演奏者（表里没有 ppp / fff）= 那两档用现行默认表的（第 16 条：不再按它自己的间隔往外推）；没带表 = 标准表原样", () => {
    const sp = activePerfSpec(withTables(withNewRole(emptyExtras(), "r", hum), { pp: 30, p: 50, mp: 64, mf: 80, f: 100, ff: 120 }), "r");
    eq(sp.dynamicsVel.ppp, 16, "没写 ppp = 默认表的 16"); eq(sp.dynamicsVel.fff, 126, "没写 fff = 默认表的 126"); eq(sp.dynamicsVel.pp, 30, "写了的照写的");
    const none = activePerfSpec(withTables(withNewRole(emptyExtras(), "r", hum), null), "r");
    eq(JSON.stringify(none.dynamicsVel), JSON.stringify({ ppp: 16, pp: 33, p: 49, mp: 64, mf: 80, f: 96, ff: 112, fff: 126 }), "没带 = 标准表");
  });
});
import { toJianpu, fromJianpu } from "../src/score/clipboard.ts";
describe("ppp / fff：简谱文字往返", () => {
  it("[ppp] 1 [fff] 2 → 读回来还是 ppp / fff", () => {
    const toks = fromJianpu("[ppp] 1 [fff] 2", 0)!;
    eq(toks.filter((t) => t.kind === "dyn").map((t) => (t as { value: string }).value).join(","), "ppp,fff");
    eq(/\[ppp\].*\[fff\]/.test(toJianpu(toks, 0)), true);
  });
});
