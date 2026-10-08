// GM 候选进歌（契约 §10.2：样本类音源 by value = SF2 子集嵌进 .mxl）：存 → 开往返、只写还引用着的音源、声音没带来 = 不出声报出来。
// created 2026-10-07 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL): Uint8Array };
import { saveMxl, openBytes, emptyExtras, withSf2Candidate, withActive, withoutCandidate, pruneSounds, activeGm, activeInstrument, gmCandidates, candidates, activeId, CANDIDATE_ID, type Extras } from "../src/format/project.ts";
import { unzipSync, strFromU8 } from "../vendor/fflate/fflate.esm.js";
import { sampleSong } from "./fixtures/format/sample-song.ts";
import { subsetSf2, sf2Info } from "../src/gm/sf2-subset.ts";

const fixture = fs.readFileSync(new URL("./fixtures/sf2/gu-square-castanets.sf2", import.meta.url));
const sha = async (b: Uint8Array) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", b))].map((x) => x.toString(16).padStart(2, "0")).join("");
const sameBytes = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);
const save = (extras: Extras) => saveMxl({ song: sampleSong(), hum: "n", extras, app: "test", date: "2026-10-07T00:00:00.000Z" });
const engineOf = (o: { extras: Extras }) => activeInstrument(o.extras)?.engine ?? "unknown";

async function withSquare(extras = emptyExtras()): Promise<{ extras: Extras; subset: Uint8Array; sha256: string }> {
  const subset = subsetSf2(fixture, [{ bank: 0, program: 80 }]), sha256 = await sha(subset), info = sf2Info(fixture);
  return { subset, sha256, extras: withSf2Candidate(extras, { name: "Square Lead", bank: 0, program: 80, subset, sha256,
    origin: { name: "gu-square-castanets.sf2", fileSha256: await sha(fixture), bytes: fixture.length },
    credit: { attribution: [info.name ?? "", info.copyright ?? ""].filter(Boolean), license: { name: "unknown", text: info.comment } } }, "n") };
}

describe("GM 候选进歌", () => {
  it("弱引用：不嵌字节，歌里只记来源 + 子集 sha256；存 → 开保留；GC 不碰它", async () => {
    const subset = subsetSf2(fixture, [{ bank: 0, program: 80 }]), sha256 = await sha(subset);
    const ex = withSf2Candidate(emptyExtras(), { name: "Square (weak)", bank: 0, program: 80, subset, sha256, embed: false, origin: { name: "gu.sf2", fileSha256: await sha(fixture), bytes: fixture.length, library: "x" }, credit: { attribution: [], license: { name: "unknown" } } }, "n");
    eq(Object.keys(ex.sounds).length, 0);
    const g = activeGm(ex)!; eq(g.path, null); eq(g.bytes, null); eq(g.subsetSha256, sha256); eq(g.origin.library, "x");
    const o = openBytes("x.mxl", save(ex));
    eq(engineOf(o), "soundfont"); eq(o.notices.length, 0, "弱引用不是「没带来」：要出声时才去找");
    const g2 = activeGm(o.extras)!; eq(g2.path, null); eq(g2.subsetSha256, sha256); eq(g2.origin.fileSha256, await sha(fixture));
    eq(JSON.parse(strFromU8(unzipSync(save(ex))[".moonsinger/manifest.json"])).sounds.length, 0);
    eq(pruneSounds(ex), ex);
  });
  it("加候选 = 它上场、字节进 extras.sounds、候选带 source / credit / spec", async () => {
    const { extras, subset, sha256 } = await withSquare();
    const g = activeGm(extras)!;
    eq(g.name, "Square Lead"); eq(g.bank, 0); eq(g.program, 80); eq(g.path, `.moonsinger/sounds/${sha256}.sf2`);
    assert(g.bytes && sameBytes(g.bytes, subset), "字节不对");
    eq(activeId(extras), "c3");   // c1 / c2 是月读
    const c = (extras.lounge.r1.candidates as Record<string, unknown>[]).find((x) => x.id === "c3")!;
    eq(JSON.stringify(c.spec), JSON.stringify({ kind: "standard", name: "SoundFont", version: "2.04" }));
    eq((c.gm as { program: number }).program, 81);   // MusicXML 的 1 起编号
    assert(String((c.credit as { license: { text?: string } }).license.text).includes("GeneralUser GS"), "许可证快照没从 INFO 抄过来");
    // 乐器按引擎分（休息室 v2）：by value 的力度表 / 演奏法 / 默认数都在；月读的哼的字只在月读的乐器里
    const inst = c.instrument as { engine: string; bank: number; program: number; source: { embedded: string | null; subsetSha256: string } };
    eq(inst.engine, "soundfont"); eq(inst.bank, 0); eq(inst.program, 80); eq(inst.source.subsetSha256, sha256);
    assert(typeof (c.dynamicsDb as Record<string, number>).mf === "number" && typeof (c.articulation as { accentDb: number }).accentDb === "number" && typeof (c.defaults as Record<string, number>).velocity === "number", "by value 的默认数没抄进来");
    assert(!("hum" in c), "SoundFont 候选不该有哼的字");
    eq(JSON.stringify(candidates(extras).map((x) => x.engine)), JSON.stringify(["tsukuyomi", "vowel-sampler", "soundfont"]));
  });
  it("存 → 开：音源在 zip 里（level 1）、manifest.sounds 列着、开回来 quality = gm、字节相同", async () => {
    const { extras, subset, sha256 } = await withSquare();
    const bytes = save(extras), files = unzipSync(bytes);
    const path = `.moonsinger/sounds/${sha256}.sf2`;
    assert(files[path] && sameBytes(files[path], subset), "zip 里没有音源 / 字节不对");
    const manifest = JSON.parse(strFromU8(files[".moonsinger/manifest.json"]));
    eq(JSON.stringify(manifest.sounds), JSON.stringify([{ path, sha256, bytes: subset.length }]));
    const o = openBytes("x.mxl", bytes);
    eq(engineOf(o), "soundfont"); eq(activeId(o.extras), "c3");
    const g = activeGm(o.extras)!; assert(g.bytes && sameBytes(g.bytes, subset), "开回来字节不对");
    eq(o.notices.length, 0);
    assert(!(path in o.extras.unknown), "音源被当成了不认识的文件");
    // MusicXML 里给别的软件看的乐器 = 这个候选
    assert(strFromU8(files["score.musicxml"]).includes("<midi-program>81</midi-program>"), "MusicXML 的 GM 号没跟着候选");
  });
  it("换回月读再存：没候选引用的音源不写（§10.2 旧块从歌里丢掉）；候选还在时照写", async () => {
    const { extras, sha256 } = await withSquare();
    const back = withActive(extras, CANDIDATE_ID.full, "n");
    const files = unzipSync(save(back));
    assert(files[`.moonsinger/sounds/${sha256}.sf2`], "候选还在、字节就该还在");
    const o = openBytes("x.mxl", save(back)); eq(engineOf(o), "tsukuyomi"); eq(gmCandidates(o.extras).length, 1);
    // 删候选（withoutCandidate）= 内存里立刻 GC，存档也不写（user「需要严格的 GC」）
    const gone = withoutCandidate(back, "c3");
    eq(Object.keys(gone.sounds).length, 0, "内存里的块没立刻丢");
    const files2 = unzipSync(save(gone));
    assert(!files2[`.moonsinger/sounds/${sha256}.sf2`], "没人引用还写了");
    eq(JSON.parse(strFromU8(files2[".moonsinger/manifest.json"])).sounds.length, 0);
    let msg = ""; try { withoutCandidate(extras, "c3"); } catch (e) { msg = (e as Error).message; } assert(msg.includes("上场"), "上场的候选不该能删");
  });
  it("声音没随歌带来（zip 里少了那块）= 没人上场、报出来，不自动替补", async () => {
    const { extras, sha256 } = await withSquare();
    const files = unzipSync(save(extras));
    delete files[`.moonsinger/sounds/${sha256}.sf2`];
    const { zipSync } = await import("../vendor/fflate/fflate.esm.js");
    const o = openBytes("x.mxl", zipSync(Object.fromEntries(Object.entries(files).map(([p, b]) => [p, [b, { level: p === "mimetype" ? 0 : 6 }]])) as never));
    eq(engineOf(o), "soundfont"); eq(activeGm(o.extras)?.bytes, null);   // 候选还在、上场的还是它，只是声音没来
    assert(o.notices.some((n) => n.includes("没随这首歌一起带来")), o.notices.join(" | "));
    eq(activeId(o.extras), "c3");   // 候选没被删：人来换
  });
  it("同一份字节两个候选只存一份；旧版 app 打开 = 不认识的候选不出声（c3 不是 c1 / c2）", async () => {
    const a = await withSquare();
    const b = await withSquare(a.extras);   // 再加一遍同样的子集
    eq(gmCandidates(b.extras).length, 2); eq(activeId(b.extras), "c4");
    eq(Object.keys(b.extras.sounds).length, 1);
    eq(unzipSync(save(b.extras))[`.moonsinger/sounds/${a.sha256}.sf2`].length, a.subset.length);
  });
});
