// 音源打包 / 解包 + 响度校准（纯函数）。created 2026-10-08 by Claude Opus 5.5
// 守的不变量（交接 §2½）：打包 = 填字节、解包 = 去字节，**两边都不碰 sha256 / origin**；月读 / 元音版永不进歌；往返存 → 开不丢东西。
import { describe, it, eq, assert } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL): Uint8Array };
import { saveMxl, openBytes, emptyExtras, withSf2Candidate, withActive, activeGm, soundUses, withPacked, withUnpacked, activeCalibrationDb, withCalibration, CANDIDATE_ID, type Extras } from "../src/format/project.ts";
import { SOUNDFONT_CALIBRATION_DB, DEFAULT_CALIBRATION_DB } from "../src/format/performance.ts";
import { unzipSync } from "../vendor/fflate/fflate.esm.js";
import { sampleSong } from "./fixtures/format/sample-song.ts";
import { subsetSf2 } from "../src/gm/sf2-subset.ts";

const fixture = fs.readFileSync(new URL("./fixtures/sf2/gu-square-castanets.sf2", import.meta.url));
const sha = async (b: Uint8Array) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", b))].map((x) => x.toString(16).padStart(2, "0")).join("");
const save = (extras: Extras) => saveMxl({ song: sampleSong(), hum: "n", extras, app: "test", date: "2026-10-08T00:00:00.000Z" });
const sources = (ex: Extras) => JSON.stringify(Object.values(ex.lounge).flatMap((r) => (r.candidates as { instrument: { engine: string; source?: { subsetSha256: string; origin: unknown; subsetBytes: number } } }[]).filter((c) => c.instrument.engine === "soundfont").map((c) => [c.instrument.source!.subsetSha256, c.instrument.source!.origin, c.instrument.source!.subsetBytes])));

async function twoWeak(): Promise<{ extras: Extras; a: { subset: Uint8Array; sha256: string }; b: { subset: Uint8Array; sha256: string } }> {
  const fileSha256 = await sha(fixture), origin = { name: "gu.sf2", fileSha256, bytes: fixture.length };
  const sa = subsetSf2(fixture, [{ bank: 0, program: 80 }]), sb = subsetSf2(fixture, [{ bank: 8, program: 115 }]);
  const a = { subset: sa, sha256: await sha(sa) }, b = { subset: sb, sha256: await sha(sb) };
  let ex = withSf2Candidate(emptyExtras(), "r1", { name: "Square", bank: 0, program: 80, ...a, embed: false, origin, credit: { attribution: [], license: { name: "unknown" } } }, "n");
  ex = withSf2Candidate(ex, "r2", { name: "Castanets", bank: 8, program: 115, ...b, embed: false, origin, credit: { attribution: [], license: { name: "unknown" } } }, "n");
  return { extras: ex, a, b };
}

describe("音源打包 / 解包（project.ts）", () => {
  it("soundUses：两个弱引用 = 两条、都没打包；月读不算", async () => {
    const { extras, a, b } = await twoWeak();
    const u = soundUses(extras);
    eq(u.length, 2); eq(u.every((x) => !x.packed), true);
    eq(JSON.stringify(u.map((x) => x.subsetSha256).sort()), JSON.stringify([a.sha256, b.sha256].sort()));
  });
  it("打包全部：字节进歌、embedded 指过去；sha256 / origin / subsetBytes 不变；存 → 开字节还在", async () => {
    const { extras, a, b } = await twoWeak();
    const have = new Map([[a.sha256, a.subset], [b.sha256, b.subset]]);
    const r = withPacked(extras, (s) => have.get(s));
    eq(r.packed.length, 2); eq(r.missing.length, 0);
    eq(sources(r.extras), sources(extras), "sha256 / origin 被动了");
    eq(Object.keys(r.extras.sounds).length, 2);
    const g = activeGm(r.extras, "r1")!; eq(g.path, `.moonsinger/sounds/${a.sha256}.sf2`); assert(!!g.bytes, "字节没进歌");
    const o = openBytes("x.mxl", save(r.extras));
    eq(soundUses(o.extras).filter((x) => x.packed).length, 2, "存 → 开之后不是打包着");
    eq(sources(o.extras), sources(extras));
  });
  it("拿不到字节的：保持弱引用、报在 missing 里，别的照打包", async () => {
    const { extras, a, b } = await twoWeak();
    const r = withPacked(extras, (s) => (s === a.sha256 ? a.subset : undefined));
    eq(JSON.stringify(r.packed), JSON.stringify([a.sha256])); eq(JSON.stringify(r.missing), JSON.stringify([b.sha256]));
    eq(activeGm(r.extras, "r2")!.path, null, "拿不到的不该假装打包了");
  });
  it("都打包着再打包 = 原样返回（同一个对象）", async () => {
    const { extras, a, b } = await twoWeak();
    const have = new Map([[a.sha256, a.subset], [b.sha256, b.subset]]);
    const once = withPacked(extras, (s) => have.get(s)).extras;
    eq(withPacked(once, () => undefined).extras, once);
  });
  it("解包全部：字节离开歌、交还给调用方；sha256 / origin 不变；zip 里没有 sounds/", async () => {
    const { extras, a, b } = await twoWeak();
    const have = new Map([[a.sha256, a.subset], [b.sha256, b.subset]]);
    const packed = withPacked(extras, (s) => have.get(s)).extras;
    const r = withUnpacked(packed);
    eq(r.removed.size, 2); assert(r.removed.get(a.sha256) === a.subset, "交还的字节不对");
    eq(Object.keys(r.extras.sounds).length, 0); eq(activeGm(r.extras, "r1")!.path, null);
    eq(sources(r.extras), sources(extras));
    eq(Object.keys(unzipSync(save(r.extras))).filter((p) => p.startsWith(".moonsinger/sounds/")).length, 0);
    // 解包 → 再打包（字节从设备缓存回来）= 回到打包着的样子
    const back = withPacked(r.extras, (s) => r.removed.get(s)).extras;
    eq(JSON.stringify(Object.keys(back.sounds).sort()), JSON.stringify(Object.keys(packed.sounds).sort()));
  });
  it("只解一部分（only）：没选中的照旧打包着", async () => {
    const { extras, a, b } = await twoWeak();
    const have = new Map([[a.sha256, a.subset], [b.sha256, b.subset]]);
    const packed = withPacked(extras, (s) => have.get(s)).extras;
    const r = withUnpacked(packed, (s) => s === a.sha256);
    eq(JSON.stringify([...r.removed.keys()]), JSON.stringify([a.sha256]));
    eq(activeGm(r.extras, "r1")!.path, null); eq(activeGm(r.extras, "r2")!.path, `.moonsinger/sounds/${b.sha256}.sf2`, "没选中的被解了");
    eq(Object.keys(r.extras.sounds).length, 1);
    eq(withUnpacked(packed, () => false).extras, packed, "一个都不解 = 原样");
  });
  it("没有嵌的 = 解包原样返回；只有月读的歌 = 打包 / 解包都不动", async () => {
    const { extras } = await twoWeak();
    eq(withUnpacked(extras).extras, extras);
    const voiceOnly = withActive(emptyExtras(), "r1", CANDIDATE_ID.full, "n");
    eq(soundUses(voiceOnly).length, 0); eq(withPacked(voiceOnly, () => new Uint8Array(1)).extras, voiceOnly); eq(withUnpacked(voiceOnly).extras, voiceOnly);
  });
});

describe("响度校准（候选 calibrationDb）", () => {
  it("新的 SoundFont 候选 = SOUNDFONT_CALIBRATION_DB；月读 = 0；改了进歌、存 → 开还在", async () => {
    const { extras } = await twoWeak();
    eq(activeCalibrationDb(extras, "r1"), SOUNDFONT_CALIBRATION_DB);
    const voice = withActive(extras, "r1", CANDIDATE_ID.full, "n"); eq(activeCalibrationDb(voice, "r1"), DEFAULT_CALIBRATION_DB, "新建的月读也是 −6（user「月读也得-6db」）");
    eq(activeCalibrationDb(emptyExtras(), "r9"), DEFAULT_CALIBRATION_DB, "没有角色快照 = 默认 −6");
    const ch = withCalibration(extras, "r1", -3.26, "n"); eq(activeCalibrationDb(ch, "r1"), -3.3);
    eq(activeCalibrationDb(ch, "r2"), SOUNDFONT_CALIBRATION_DB, "只改这个角色上场的那位");
    eq(activeCalibrationDb(openBytes("x.mxl", save(ch)).extras, "r1"), -3.3);
  });
});
