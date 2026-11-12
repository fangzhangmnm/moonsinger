// ppp / fff（v0.9.23，2026-10-10 Opus 5.5；user「wishlist: ppp fff，以及帮我科普这些和db的换算关系，然后应该向用户揭露，方便对比」）：
// 新演奏者 by value 带 ppp / fff；旧演奏者的表里没有这两格 = 按它自己 pp→p / f→ff 的间隔往外推一档（力度夹在 1–127）；出声走同一张表（9-2 起只有力度表）。
import { describe, it, eq } from "./runner.mjs";
import { initState } from "../src/score/song.ts";
import { emptyExtras, withNewRole, activePerfSpec, type Extras } from "../src/format/project.ts";

/** 把歌里所有候选的力度表换成给定的（模拟 v0.9.23 之前存的歌；9-2 起只有力度表）。 */
const withTables = (ex: Extras, vel: Record<string, number> | null): Extras => {
  const walk = (o: unknown): unknown => {
    if (Array.isArray(o)) return o.map(walk);
    if (!o || typeof o !== "object") return o;
    const x = Object.fromEntries(Object.entries(o as Record<string, unknown>).map(([k, v]) => [k, walk(v)]));
    if ("dynamicsVel" in x) { if (vel) x.dynamicsVel = vel; else delete x.dynamicsVel; }   // 演奏者：力度表换掉 / 拿掉
    return x;
  };
  return walk(ex) as Extras;
};
describe("ppp / fff", () => {
  const hum = initState().song.hum;
  it("新演奏者（小月相也是，9-2）：表里 by value 有 ppp 16 / fff 126（MuseScore 的经典值）", () => {
    const sp = activePerfSpec(withNewRole(emptyExtras(), "r", hum), "r");
    eq(sp.dynamicsVel.ppp, 16); eq(sp.dynamicsVel.fff, 126); eq(sp.dynamicsVel.mf, 80);
  });
  it("旧演奏者（表里没有 ppp / fff）= 按它自己的间隔往外推一档、力度夹在 1–127；没带表 = 标准表原样（不外推）", () => {
    const sp = activePerfSpec(withTables(withNewRole(emptyExtras(), "r", hum), { pp: 30, p: 50, mp: 64, mf: 80, f: 100, ff: 120 }), "r");
    eq(sp.dynamicsVel.ppp, 10, "pp 30、p 50 → ppp 10"); eq(sp.dynamicsVel.fff, 127, "ff 120、f 100 → 140 → 夹到 127");
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
