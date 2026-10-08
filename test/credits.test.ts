// 署名 / 许可证推演（纯函数）。created 2026-10-08 by Claude Opus 5.5
// user「导出和保存（包括pack, unpack）的时候加一个license和credit推演工具，只用最minimal的。reference里面的东西不算」；口径（当天澄清）：
//   「算出来的是你渲染的mp3用了谁的。所以冷板凳的不算。但是参加了演出的不管是打包的还是弱引用都算。然后打包的关于这个源文件分发的license是另外一回事。可以分开算」「以及有track没出声的不算」。
import { describe, it, eq, assert } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL): Uint8Array };
import { emptyExtras, withSf2Candidate, withActive, withNewRole, withPacked, withUnpacked, CANDIDATE_ID, type Extras } from "../src/format/project.ts";
import { packedLicenses, performerCredits, creditsText, songCreditLine, licenseHints, RIGHTS_PRESETS } from "../src/format/credits.ts";
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

describe("署名推演：演出署名（performerCredits）", () => {
  it("出了声的声部上场那位都算：弱引用的算、月读算", async () => {
    const { extras } = await band();
    const lines = performerCredits(extras, ["r1", "r2"]);
    eq(lines.length, 2);
    assert(lines.some((l) => l.license.name === TSUKUYOMI_CREDIT.license.name && l.who[0] === "月读"), "月读没算进来");
    assert(lines.some((l) => l.who.includes("Square Lead")), "弱引用的 Square 出了声，该算");
  });
  it("打包的也一样算（打包 / 弱引用不影响演出署名）", async () => {
    const { extras, have } = await band();
    const packed = withPacked(extras, (s) => have.get(s)).extras;
    eq(JSON.stringify(performerCredits(packed, ["r2"])), JSON.stringify(performerCredits(extras, ["r2"])));
  });
  it("没出声的声部不算（调用方只给出了声的角色）；冷板凳不算（只取上场那位）", async () => {
    const { extras } = await band();
    assert(!performerCredits(extras, ["r1", "r2"]).some((l) => l.who.includes("Castanets")), "r3 没出声");
    const back = withActive(extras, "r2", CANDIDATE_ID.full, "n");   // r2 换回月读：Square 坐冷板凳
    const lines = performerCredits(back, ["r2"]);
    eq(lines.length, 1); eq(lines[0].who[0], "月读");
  });
});

describe("署名推演：打包分发的许可（packedLicenses）", () => {
  it("全是弱引用 = 文件里没带别人的源文件 = 空", async () => {
    const { extras } = await band();
    eq(packedLicenses(extras).length, 0);
  });
  it("打包之后 = 带着字节的都算（冷板凳的打包字节也在文件里）；同一份署名 + 许可证并成一组；解包回去又空", async () => {
    const { extras, have } = await band();
    const packed = withPacked(withActive(extras, "r2", CANDIDATE_ID.full, "n"), (s) => have.get(s)).extras;   // Square 坐冷板凳但字节打包着
    const lines = packedLicenses(packed);
    eq(lines.length, 2, "GS 两件并一组 + 许可证不明的一组");
    const gs = lines.find((l) => l.license.name === GS.license.name)!;
    eq(JSON.stringify(gs.who), JSON.stringify(["Square Lead", "Castanets"])); eq(JSON.stringify(gs.attribution), JSON.stringify(GS.attribution));
    eq(packedLicenses(withUnpacked(packed).extras).length, 0);
  });
});

describe("署名推演：这首歌自己那一条 + 许可提醒", () => {
  it("作者栏 / 许可都空 = 没有这条（不提醒用户写）；有就排第一条", () => {
    eq(songCreditLine({ title: "うさぎ" }), null);
    const l = songCreditLine({ title: "うさぎ", credits: "某某 词\n某某 曲", rights: "CC BY 4.0 https://creativecommons.org/licenses/by/4.0/" })!;
    eq(l.who[0], "「うさぎ」"); eq(JSON.stringify(l.attribution), JSON.stringify(["某某 词", "某某 曲"])); assert(l.license.name.startsWith("CC BY 4.0"), l.license.name);
    eq(songCreditLine({ credits: "某某" })!.license.name, "（没声明许可）");
  });
  it("允许再利用的许可 + 月读出了声 = 提醒；保留所有权利 / 没有月读 = 不提醒", async () => {
    const { extras } = await band();
    const withVoice = performerCredits(extras, ["r1"]), noVoice = performerCredits(extras, ["r2"]);
    eq(licenseHints("CC BY 4.0", withVoice).length, 1); eq(licenseHints("CC0 1.0", withVoice).length, 1);
    eq(licenseHints("© 2026 保留所有权利", withVoice).length, 0); eq(licenseHints(undefined, withVoice).length, 0);
    eq(licenseHints("CC BY 4.0", noVoice).length, 0);
    eq(licenseHints("CC BY-NC-ND 4.0 https://creativecommons.org/licenses/by-nc-nd/4.0/", withVoice).length, 0, "ND = 不许改编、只原样转发：不提醒");
    eq(licenseHints("© 2026 保留所有权利。仅供个人欣赏，禁止转载、改编、商用。", withVoice).length, 0);
  });
  it("预设：从紧到松，前几个是「保留」类（带年份、没有网址），CC 的都带网址", () => {
    assert(RIGHTS_PRESETS[0].text(2026).includes("2026") && !/https?:/.test(RIGHTS_PRESETS[0].text(2026)), "保留所有权利");
    const cc = RIGHTS_PRESETS.filter((p) => p.label.startsWith("CC"));
    assert(cc.length >= 4 && cc.every((p) => /https:\/\//.test(p.text(2026))), "CC 网址");
    assert(RIGHTS_PRESETS.findIndex((p) => p.label.startsWith("CC")) >= 3, "至少三个不开放的在 CC 前面");
  });
});

describe("署名推演：文字", () => {
  it("每组首行「谁 — 许可证」，署名逐行；许可证不明照样列出", async () => {
    const { extras } = await band();
    const t = creditsText(performerCredits(extras, ["r2", "r4"]));
    assert(t.startsWith(`Square Lead — ${GS.license.name} ${GS.license.url}\n${GS.attribution[0]}`), t);
    assert(t.includes("我的鼓 — 许可证不明\n（没有署名信息）"), t);
    eq(creditsText([]), "");
  });
});
