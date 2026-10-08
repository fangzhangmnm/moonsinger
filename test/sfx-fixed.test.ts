// 音效的固定原速 / 音高对齐 / 修八度（演奏者级设置，纯函数 + 存 → 开往返）。created 2026-10-08 by Claude Opus 5.5
// 守的不变量：这些设置只改演奏者（休息室里那位），**谱上写的音一个都不动**；存 → 开不丢；不是音效的候选拿这些开关 = 原样返回。
import { describe, it, eq, assert } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL): Uint8Array };
import { saveMxl, openBytes, emptyExtras, withSf2Candidate, activeGm, withSfxFixed, withSfxAlign, withTranspose, activeTranspose, type Extras } from "../src/format/project.ts";
import { sampleSong } from "./fixtures/format/sample-song.ts";
import { subsetSf2 } from "../src/gm/sf2-subset.ts";
import { sfKey } from "../src/gm/sf-key.ts";

const fixture = fs.readFileSync(new URL("./fixtures/sf2/gu-square-castanets.sf2", import.meta.url));
const sha = async (b: Uint8Array) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", b))].map((x) => x.toString(16).padStart(2, "0")).join("");
const save = (extras: Extras) => saveMxl({ song: sampleSong(), hum: "n", extras, app: "test", date: "2026-10-08T00:00:00.000Z" });
const PHONE = { key: 64, midi: 96, centsPerKey: 50 };

/** r1 = 「音效」（拿方波的字节冒充：这里只测设置的读写，不测声音），按上场时的默认 = 固定原速；r2 = 普通乐器。 */
async function setup(): Promise<Extras> {
  const origin = { name: "gu.sf2", fileSha256: await sha(fixture), bytes: fixture.length, library: "generaluser-gs-2.0.3" };
  const s = subsetSf2(fixture, [{ bank: 0, program: 80 }]), credit = { attribution: [], license: { name: "unknown" } };
  let ex = withSf2Candidate(emptyExtras(), "r1", { name: "Telephone", bank: 0, program: 80, note: PHONE.key, sfx: PHONE, subset: s, sha256: await sha(s), embed: false, origin, credit }, "n");
  ex = withSf2Candidate(ex, "r2", { name: "Square", bank: 0, program: 80, subset: s, sha256: await sha(s), embed: false, origin, credit }, "n");
  return ex;
}

describe("音效：固定原速 / 音高对齐（project.ts + sf-key.ts）", () => {
  it("上场默认固定原速：写什么音都敲原速键；存 → 开还是", async () => {
    const ex = await setup(), g = activeGm(ex, "r1")!;
    eq(g.note, 64); eq(JSON.stringify(g.sfx), JSON.stringify(PHONE));
    eq(sfKey(60, g), 64); eq(sfKey(72, g), 64, "不同的音也都是原速键");
    const o = activeGm(openBytes("x.mxl", save(ex)).extras, "r1")!;
    eq(o.note, 64); eq(JSON.stringify(o.sfx), JSON.stringify(PHONE));
  });
  it("关掉固定 = 按写的音变调；音高对齐只在关掉固定后起作用；存 → 开都留着", async () => {
    let ex = withSfxFixed(await setup(), "r1", false, "n");
    let g = activeGm(ex, "r1")!;
    eq(g.note, undefined); eq(sfKey(60, g), 60); eq(g.sfx?.key, 64, "原速键（按值抄的）不该跟着丢");
    ex = withSfxAlign(ex, "r1", true, "n"); g = activeGm(ex, "r1")!;
    eq(sfKey(96, g), 64, "写原速时听到的那个音 = 敲原速键");
    const o = openBytes("x.mxl", save(ex)).extras, og = activeGm(o, "r1")!;
    eq(og.note, undefined); eq(og.sfx?.align, true);
    const back = activeGm(withSfxFixed(o, "r1", true, "n"), "r1")!;
    eq(back.note, 64); eq(sfKey(96, back), 64, "再固定：align 留着也不起作用");
  });
  it("不是音效的候选：开关原样返回（同一个对象）", async () => {
    const ex = await setup();
    eq(withSfxFixed(ex, "r2", false, "n"), ex); eq(withSfxAlign(ex, "r2", true, "n"), ex);
  });
  it("修八度：0 = 不写字段；夹在 ±48；存 → 开留着", async () => {
    let ex = withTranspose(await setup(), "r2", -24, "n");
    eq(activeTranspose(ex, "r2"), -24);
    eq(activeTranspose(openBytes("x.mxl", save(ex)).extras, "r2"), -24);
    eq(activeTranspose(withTranspose(ex, "r2", 99, "n"), "r2"), 48);
    ex = withTranspose(ex, "r2", 0, "n");
    assert(!JSON.stringify(ex.lounge.r2).includes("transpose"), "0 应该去掉字段");
  });
  it("这些开关都不碰谱：存出来的 MusicXML 谱面一样", async () => {
    const ex = await setup();
    const score = (b: Uint8Array) => JSON.stringify(openBytes("x.mxl", b).song.papers);
    const a = score(save(ex)), b = score(save(withSfxAlign(withSfxFixed(withTranspose(ex, "r1", 12, "n"), "r1", false, "n"), "r1", true, "n")));
    eq(a, b);
  });
});
