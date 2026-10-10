// 乐器页「八度」那一行（v0.9.31；user「几个铃的到底哪个八度算数还是没有弄清楚。不过先向用户披露」）：按仓鼠 v12 的记谱习惯 + GS 实测说。created 2026-10-10 by Claude Opus 5.5
import { describe, it, assert, eq } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readFileSync(p: string | URL, e?: string): string };
import { octaveDisclosure, type Concept, type OctaveCheck } from "../src/gm/catalog.ts";
import { CLEF_LABEL } from "../src/score/clef.ts";

const concepts = JSON.parse(fs.readFileSync(new URL("../vendor/instruments/instruments-v12.json", import.meta.url), "utf8")).concepts as Concept[];
const rows = JSON.parse(fs.readFileSync(new URL("../vendor/instruments/gm-map-v12.json", import.meta.url), "utf8")).rows as { program: number; bank: number; gmName: string; octaveCheck?: OctaveCheck }[];
const C = (en: string) => concepts.find((c) => c.names.en.toLowerCase() === en)!;
const oc = (gm: number) => rows.find((r) => r.bank === 0 && r.program === gm - 1 && r.octaveCheck)?.octaveCheck ?? null;
const lab = (c: string) => CLEF_LABEL[c as keyof typeof CLEF_LABEL] ?? c;
describe("八度披露", () => {
  it("钟琴：谱习惯写低两个八度 + 实测按哪个键听到哪个", () => {
    const t = octaveDisclosure(C("glockenspiel").notation, oc(10), lab)!;
    assert(t.includes("写低 2 个八度") && t.includes("高音 15ma") && t.includes("耳朵听到的就是那个音"), t);
  });
  it("管钟：最强分音高两个八度，但听到的音名还是键名", () => {
    const t = octaveDisclosure(C("tubular bells")?.notation, oc(15), lab)!;
    assert(t.includes("钟的打击音"), t);
  });
  it("钢琴：没有可说的 = null（不多一行）", () => { eq(octaveDisclosure(C("piano").notation, null, lab), null); });
});
