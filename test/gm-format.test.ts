// GM 候选进歌（契约 §10.2：样本类音源 by value = SF2 子集嵌进 .mxl）：存 → 开往返、只写还引用着的音源、声音没带来 = 不出声报出来。
// created 2026-10-07 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL): Uint8Array };
import { saveMxl, openBytes, emptyExtras, withSf2Candidate, withActive, activeGm, gmCandidates, activeId, CANDIDATE_ID, type Extras } from "../src/format/project.ts";
import { unzipSync, strFromU8 } from "../vendor/fflate/fflate.esm.js";
import { sampleSong } from "./fixtures/format/sample-song.ts";
import { subsetSf2, sf2Info } from "../src/gm/sf2-subset.ts";

const fixture = fs.readFileSync(new URL("./fixtures/sf2/gu-square-castanets.sf2", import.meta.url));
const sha = async (b: Uint8Array) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", b))].map((x) => x.toString(16).padStart(2, "0")).join("");
const sameBytes = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);
const save = (extras: Extras, quality: "full" | "light" | "gm" | "none" = "gm") => saveMxl({ song: sampleSong(), hum: "n", quality, extras, app: "test", date: "2026-10-07T00:00:00.000Z" });

async function withSquare(extras = emptyExtras()): Promise<{ extras: Extras; subset: Uint8Array; sha256: string }> {
  const subset = subsetSf2(fixture, [{ bank: 0, program: 80 }]), sha256 = await sha(subset), info = sf2Info(fixture);
  return { subset, sha256, extras: withSf2Candidate(extras, { name: "Square Lead", bank: 0, program: 80, subset, sha256,
    origin: { name: "gu-square-castanets.sf2", fileSha256: await sha(fixture), bytes: fixture.length },
    credit: { attribution: [info.name ?? "", info.copyright ?? ""].filter(Boolean), license: { name: "unknown", text: info.comment } } }, "n") };
}

describe("GM 候选进歌", () => {
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
  });
  it("存 → 开：音源在 zip 里（level 1）、manifest.sounds 列着、开回来 quality = gm、字节相同", async () => {
    const { extras, subset, sha256 } = await withSquare();
    const bytes = save(extras), files = unzipSync(bytes);
    const path = `.moonsinger/sounds/${sha256}.sf2`;
    assert(files[path] && sameBytes(files[path], subset), "zip 里没有音源 / 字节不对");
    const manifest = JSON.parse(strFromU8(files[".moonsinger/manifest.json"]));
    eq(JSON.stringify(manifest.sounds), JSON.stringify([{ path, sha256, bytes: subset.length }]));
    const o = openBytes("x.mxl", bytes);
    eq(o.quality, "gm"); eq(activeId(o.extras), "c3");
    const g = activeGm(o.extras)!; assert(g.bytes && sameBytes(g.bytes, subset), "开回来字节不对");
    eq(o.notices.length, 0);
    assert(!(path in o.extras.unknown), "音源被当成了不认识的文件");
    // MusicXML 里给别的软件看的乐器 = 这个候选
    assert(strFromU8(files["score.musicxml"]).includes("<midi-program>81</midi-program>"), "MusicXML 的 GM 号没跟着候选");
  });
  it("换回月读再存：没候选引用的音源不写（§10.2 旧块从歌里丢掉）；候选还在时照写", async () => {
    const { extras, sha256 } = await withSquare();
    const back = withActive(extras, CANDIDATE_ID.full, "n");
    const files = unzipSync(save(back, "full"));
    assert(files[`.moonsinger/sounds/${sha256}.sf2`], "候选还在、字节就该还在");
    const o = openBytes("x.mxl", save(back, "full")); eq(o.quality, "full"); eq(gmCandidates(o.extras).length, 1);
    // 把候选删掉（模拟以后的「删候选」）→ 字节不写
    const gone = structuredClone(back); (gone.lounge.r1.candidates as unknown[]).splice(2, 1);
    const files2 = unzipSync(save(gone, "full"));
    assert(!files2[`.moonsinger/sounds/${sha256}.sf2`], "没人引用还写了");
    eq(JSON.parse(strFromU8(files2[".moonsinger/manifest.json"])).sounds.length, 0);
  });
  it("声音没随歌带来（zip 里少了那块）= 没人上场、报出来，不自动替补", async () => {
    const { extras, sha256 } = await withSquare();
    const files = unzipSync(save(extras));
    delete files[`.moonsinger/sounds/${sha256}.sf2`];
    const { zipSync } = await import("../vendor/fflate/fflate.esm.js");
    const o = openBytes("x.mxl", zipSync(Object.fromEntries(Object.entries(files).map(([p, b]) => [p, [b, { level: p === "mimetype" ? 0 : 6 }]])) as never));
    eq(o.quality, "none");
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
