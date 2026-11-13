// ppp / fff（v0.9.23，2026-10-10 Opus 5.5；user「wishlist: ppp fff，以及帮我科普这些和db的换算关系，然后应该向用户揭露，方便对比」）：
// 新演奏者 by value 带 ppp / fff；旧演奏者的表里没有这两格 = 按它自己 pp→p / f→ff 的间隔往外推一档（力度夹在 1–127）；出声走同一张表（9-2 起只有力度表）。
import { describe, it, eq } from "./runner.mjs";
import { initState } from "../src/score/song.ts";
import { emptyExtras, withNewRole, activePerfSpec, withSf2Candidate, saveMxl, openBytes, type Extras } from "../src/format/project.ts";
import { DYNAMICS_DB, DYNAMICS_VEL } from "../src/format/template.ts";

/** 一首歌、一位 SoundFont 乐手上场；vel = 把她身上的力度表换成给定的（null = 拿掉），模拟老歌；存出去再从读文件的门口读回来（16-4 A：缺的档在门口补）。 */
const throughDoor = (vel: Record<string, number> | null) => {
  const song = initState().song, role = song.parts[0]!.role;
  let ex: Extras = withSf2Candidate(withNewRole(emptyExtras(), role, "n"), role, { name: "Sine", bank: 0, program: 80, subset: new Uint8Array([1, 2, 3]), sha256: "1".repeat(64), embed: false, origin: { name: "t.sf2", fileSha256: "0".repeat(64), bytes: 3, library: "t" }, credit: { attribution: [], license: { name: "unknown" } }, calibrationDb: 0 }, "n");
  const r = structuredClone(ex.lounge[role]) as { candidates: Record<string, unknown>[]; active: string }, c = r.candidates.find((x) => x.id === r.active)!;
  if (vel) c.dynamicsVel = vel; else delete c.dynamicsVel;
  ex = { ...ex, lounge: { ...ex.lounge, [role]: r as never } };
  const o = openBytes("x.mxl", saveMxl({ song, extras: ex, app: "t", date: "2026-11-12T00:00:00.000Z" }));
  return activePerfSpec(o.extras, role)!;
};
describe("ppp / fff", () => {
  const hum = "n";
  it("新演奏者：小月相 / 元音版带的是 dB 表，八档 = 模板（16-4）；SoundFont 带力度表 ppp 16 / fff 126（MuseScore 的经典值）", () => {
    const sp = activePerfSpec(withNewRole(emptyExtras(), "r", hum), "r")!;
    eq(sp.path, "gain"); if (sp.path !== "gain") return;
    eq(sp.dynamicsDb.ppp, DYNAMICS_DB.ppp); eq(sp.dynamicsDb.fff, DYNAMICS_DB.fff); eq(sp.dynamicsDb.mf, DYNAMICS_DB.mf);
    const sf = throughDoor(DYNAMICS_VEL); eq(sf.path, "velocity"); if (sf.path !== "velocity") return;
    eq(sf.dynamicsVel.ppp, 16); eq(sf.dynamicsVel.fff, 126); eq(sf.dynamicsVel.mf, 80);
  });
  it("老歌（表里没有 ppp / fff）= 读文件的门口把那两档用模板的补上（第 16 条：不按它自己的间隔往外推）；没带表 = 模板那一张", () => {
    const sp = throughDoor({ pp: 30, p: 50, mp: 64, mf: 80, f: 100, ff: 120 }); if (sp.path !== "velocity") throw new Error("应该是力度那一路");
    eq(sp.dynamicsVel.ppp, 16, "没写 ppp = 模板的 16"); eq(sp.dynamicsVel.fff, 126, "没写 fff = 模板的 126"); eq(sp.dynamicsVel.pp, 30, "写了的照写的");
    const none = throughDoor(null); if (none.path !== "velocity") throw new Error("应该是力度那一路");
    eq(JSON.stringify(none.dynamicsVel), JSON.stringify({ ppp: 16, pp: 33, p: 49, mp: 64, mf: 80, f: 96, ff: 112, fff: 126 }), "没带 = 模板");
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
