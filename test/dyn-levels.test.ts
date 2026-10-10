// ppp / fff（v0.9.23，2026-10-10 Opus 5.5；user「wishlist: ppp fff，以及帮我科普这些和db的换算关系，然后应该向用户揭露，方便对比」）：
// 新演奏者 by value 带 ppp / fff；旧演奏者的表里没有这两格 = 按它自己 pp→p / f→ff 的间隔往外推一档（力度夹在 1–127）；出声走同一张表。
import { describe, it, eq } from "./runner.mjs";
import { initState } from "../src/score/song.ts";
import { emptyExtras, withNewRole, activePerfSpec, type Extras } from "../src/format/project.ts";

/** 把歌里所有候选的力度表换成给定的（模拟 v0.9.23 之前存的歌）。 */
const withTables = (ex: Extras, db: Record<string, number>, vel: Record<string, number> | null): Extras => {
  const walk = (o: unknown): unknown => {
    if (Array.isArray(o)) return o.map(walk);
    if (!o || typeof o !== "object") return o;
    const x = Object.fromEntries(Object.entries(o as Record<string, unknown>).map(([k, v]) => [k, walk(v)]));
    if ("dynamicsDb" in x) { x.dynamicsDb = db; if (vel) x.dynamicsVel = vel; else delete x.dynamicsVel; }   // 演奏者：两张表都换
    return x;
  };
  return walk(ex) as Extras;
};
describe("ppp / fff", () => {
  const hum = initState().song.hum;
  it("新演奏者：表里 by value 有 ppp −24 / fff +18（一档 6 dB）", () => {
    const sp = activePerfSpec(withNewRole(emptyExtras(), "r", hum), "r");
    eq(sp.dynamicsDb.ppp, -24); eq(sp.dynamicsDb.fff, 18); eq(sp.dynamicsDb.mf, 0);
  });
  it("旧演奏者（表里没有 ppp / fff）= 按它自己的间隔往外推一档；力度夹在 1–127", () => {
    const ex = withTables(withNewRole(emptyExtras(), "r", hum), { pp: -20, p: -10, mp: -5, mf: 0, f: 4, ff: 9 }, { pp: 30, p: 50, mp: 64, mf: 80, f: 100, ff: 120 });
    const sp = activePerfSpec(ex, "r");
    eq(sp.dynamicsDb.ppp, -30, "pp −20、p −10 → ppp −30"); eq(sp.dynamicsDb.fff, 14, "f 4、ff 9 → fff 14");
    eq(sp.dynamicsVel?.ppp, 10, "pp 30、p 50 → ppp 10"); eq(sp.dynamicsVel?.fff, 127, "ff 120、f 100 → 140 → 夹到 127");
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
