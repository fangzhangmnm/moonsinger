// 「自然衰减」名单（v0.17.43；目录 v16 的 ring 栏 + 整套鼓那 11 套）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
// 守：烤进 app 的表（ring.gen.ts）正好是目录里标了 free 的概念的 GS 本尊音色，不多不少、依据中英都有；整套鼓的规矩正好是验过的 11 套；
//   名单外的、自己的音源文件 = 到点释放。名单本身由统筹按 user 的判据定（施工单第 5 节 2e32abc9 / c5c742ac），这里只守「烤的 = 目录写的」。
import { describe, it, eq, assert } from "./runner.mjs";
import { RING_FREE } from "../src/gm/ring.gen.ts";
import { ringFactory, RING_FREE_KITS } from "../src/gm/ring.ts";
import { GS_LIBRARY_ID } from "../src/gm/library-ids.ts";
import { INSTRUMENTS_VERSION } from "../src/gm/instruments.gen.ts";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL, enc: "utf8"): string };
const V = (name: string) => JSON.parse(fs.readFileSync(new URL(`../vendor/instruments/${name}-v${INSTRUMENTS_VERSION}.json`, import.meta.url), "utf8"));

describe("自然衰减的名单（目录 ring 栏 → ring.gen.ts）", () => {
  it("烤出来的表 = 目录里标了 free 的概念的本尊音色（不多不少），依据中英都有", () => {
    const cs = V("instruments").concepts as { id: string; ring?: { kind: string; why: { zh: string; en: string } } }[], rows = V("gm-map").rows as { concept: string; relation: string; bank: number; program: number; note?: number }[];
    const free = new Set(cs.filter((c) => c.ring?.kind === "free").map((c) => c.id));
    eq(free.size, 47, "目录 v16 标了 47 个概念");
    const want = rows.filter((r) => r.relation === "self" && free.has(r.concept)).map((r) => `${r.bank}:${r.program}${typeof r.note === "number" ? `:${r.note}` : ""}`).sort();
    eq(Object.keys(RING_FREE).sort().join(" "), want.join(" "), "烤的 = 目录写的");
    for (const [k, w] of Object.entries(RING_FREE)) assert(!!w.zh && !!w.en, `${k} 依据中英都有`);
  });
  it("出厂值：名单里的 GS 本尊 = 自然衰减；名单外 = 到点释放；自己的音源文件 = 到点释放", () => {
    eq(ringFactory({ library: GS_LIBRARY_ID, bank: 0, program: 46 }).pedal, "down", "竖琴");
    eq(ringFactory({ library: GS_LIBRARY_ID, bank: 128, program: 0, note: 49 }).pedal, "down", "碎音钹（鼓件）");
    eq(ringFactory({ library: GS_LIBRARY_ID, bank: 0, program: 0 }).pedal, "up", "钢琴不在名单");
    eq(ringFactory({ library: GS_LIBRARY_ID, bank: 0, program: 24 }).pedal, "up", "吉他不在名单");
    eq(ringFactory({ library: null, bank: 0, program: 46 }).reason, "own", "自己的 .sf2");
  });
  it("整套鼓（128 号库、没固定键）：只有验过的 11 套是自然衰减；SFX 套、CM-64/32L 套不是", () => {
    eq([...RING_FREE_KITS].join(","), "0,1,2,8,16,24,25,26,32,40,48");
    for (const p of RING_FREE_KITS) { const f = ringFactory({ library: GS_LIBRARY_ID, bank: 128, program: p }); assert(f.pedal === "down" && f.reason === "free" && !!f.why?.zh && !!f.why?.en, `128:${p}`); }
    for (const p of [56, 127]) eq(ringFactory({ library: GS_LIBRARY_ID, bank: 128, program: p }).pedal, "up", `128:${p}`);
  });
});
