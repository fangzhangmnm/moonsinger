// 署名 / 许可证推演（纯函数）。created 2026-10-08 by Claude Opus 5.5
// user「导出和保存（包括pack, unpack）的时候加一个license和credit推演工具，只用最minimal的。reference里面的东西不算」。
import { describe, it, eq, assert } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL): Uint8Array };
import { emptyExtras, withSf2Candidate, withActive, withNewRole, withPacked, withUnpacked, CANDIDATE_ID, type Extras } from "../src/format/project.ts";
import { fileCredits, audioCredits, creditsText } from "../src/format/credits.ts";
import { TSUKUYOMI_CREDIT } from "../src/format/performance.ts";
import { subsetSf2 } from "../src/gm/sf2-subset.ts";

const fixture = fs.readFileSync(new URL("./fixtures/sf2/gu-square-castanets.sf2", import.meta.url));
const sha = async (b: Uint8Array) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", b))].map((x) => x.toString(16).padStart(2, "0")).join("");
const GS = { attribution: ["GeneralUser GS 2.0.3 by S. Christian Collins"], license: { name: "GeneralUser GS License v2.0", url: "https://www.schristiancollins.com/generaluser.php" } };

/** r1 = 月读唱；r2 = Square（GS）；r3 = Castanets（GS）；r4 = 自己的文件、许可证不明。全部弱引用。 */
async function band(): Promise<{ extras: Extras; have: Map<string, Uint8Array> }> {
  const origin = { name: "gu.sf2", fileSha256: await sha(fixture), bytes: fixture.length }, have = new Map<string, Uint8Array>();
  let ex = withNewRole(emptyExtras(), "r1", "n");
  const add = async (role: string, name: string, bank: number, program: number, credit: typeof GS | { attribution: string[]; license: { name: string } }) => {
    const subset = subsetSf2(fixture, [{ bank, program }]), sha256 = await sha(subset); have.set(sha256, subset);
    ex = withSf2Candidate(ex, role, { name, bank, program, subset, sha256, embed: false, origin, credit }, "n");
  };
  await add("r2", "Square Lead", 0, 80, GS);
  await add("r3", "Castanets", 8, 115, GS);
  await add("r4", "我的鼓", 8, 115, { attribution: [], license: { name: "unknown" } });
  return { extras: ex, have };
}

describe("署名推演（credits.ts）", () => {
  it("文件：全是弱引用 = 什么都不算（引用不算）；月读也不算", async () => {
    const { extras } = await band();
    eq(fileCredits(extras).length, 0);
  });
  it("文件：打包之后 = 带着字节的才算；同一份署名 + 许可证并成一组", async () => {
    const { extras, have } = await band();
    const packed = withPacked(extras, (s) => have.get(s)).extras;
    const lines = fileCredits(packed);
    eq(lines.length, 2, "GS 两件并一组 + 许可证不明的一组");
    const gs = lines.find((l) => l.license.name === GS.license.name)!;
    eq(JSON.stringify(gs.who), JSON.stringify(["Square Lead", "Castanets"])); eq(JSON.stringify(gs.attribution), JSON.stringify(GS.attribution));
    // 解包回去 = 又什么都不算
    eq(fileCredits(withUnpacked(packed).extras).length, 0);
  });
  it("音频：只算出了声的声部上场那位；月读在里面", async () => {
    const { extras } = await band();
    const lines = audioCredits(extras, ["r1", "r2"]);
    eq(lines.length, 2);
    assert(lines.some((l) => l.license.name === TSUKUYOMI_CREDIT.license.name && l.who[0] === "月读"), "月读没算进来");
    assert(lines.some((l) => l.who.includes("Square Lead")), "Square 没算进来");
    assert(!lines.some((l) => l.who.includes("Castanets")), "没出声的声部不该算");
  });
  it("音频：候补不算（只算上场那位）", async () => {
    const { extras } = await band();
    const back = withActive(extras, "r2", CANDIDATE_ID.full, "n");   // r2 换回月读：Square 退到候补
    const lines = audioCredits(back, ["r2"]);
    eq(lines.length, 1); eq(lines[0].who[0], "月读");
  });
  it("文字：每组首行「谁 — 许可证」，署名逐行；许可证不明照样列出", async () => {
    const { extras } = await band();
    const t = creditsText(audioCredits(extras, ["r2", "r4"]));
    assert(t.startsWith(`Square Lead — ${GS.license.name} ${GS.license.url}\n${GS.attribution[0]}`), t);
    assert(t.includes("我的鼓 — 许可证不明\n（没有署名信息）"), t);
    eq(creditsText([]), "");
  });
});
