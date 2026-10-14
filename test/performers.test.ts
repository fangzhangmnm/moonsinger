// performers.test.ts —— 演奏者注册表（ADR-0004）：注册规则 + 「表说能什么 = 真能什么」的结构核对。created 2026-10-14 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
import { performerOf, performerByGuid, performers, addressOf } from "../src/performers/index.ts";
import { registerPerformer } from "../src/performers/registry.ts";
import { ALL_MARKS } from "../src/score/perform.ts";
import { grooveCategory } from "../src/score/groove.ts";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const throws = (fn: () => void, re: RegExp, msg: string) => { let m = ""; try { fn(); } catch (e) { m = String(e); } assert(re.test(m), `${msg}: ${m || "没抛"}`); };

describe("演奏者注册表", () => {
  it("三位在表里；英文名 / guid 唯一；地址 = performer:<name>@<version>；认不出 = null", () => {
    const all = performers();
    eq(all.map((p) => p.name).sort().join(","), "soundfont,tsukuyomi,vowel-sampler");
    eq(new Set(all.map((p) => p.guid)).size, all.length);
    for (const p of all) {
      assert(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(p.guid), `${p.name} guid`);
      eq(performerOf(p.name), p); eq(performerByGuid(p.guid), p);
      eq(addressOf(p), `performer:${p.name}@${p.version}`);
      assert(Number.isInteger(p.version) && p.version >= 1, `${p.name} version`);
    }
    eq(performerOf("unknown"), null); eq(performerOf(null), null); eq(performerOf(undefined), null); eq(performerByGuid("nope"), null);
  });
  it("同名 / 同 guid 注册两次 = 抛（不静默盖掉）", () => {
    const t = performerOf("tsukuyomi")!;
    throws(() => registerPerformer({ ...t, guid: "00000000-0000-4000-8000-000000000000" }), /registered twice/, "同名");
    throws(() => registerPerformer({ ...t, name: "someone-else" }), /registered twice/, "同 guid");
    eq(performers().length, 3);
  });
  it("能力字段之间自洽：按句出块的没有 track()、按音符表的有；琶音只有能叠音的认；唱字的走唱法核心；连着唱的也是；honors ⊆ 记号全集；都能试听", () => {
    for (const p of performers()) {
      eq(p.track === undefined, p.sound === "chunks", `${p.name} track`);
      eq(p.honors.includes("arpeggio"), p.poly, `${p.name} 琶音`);
      if (p.lyrics === "words") eq(p.sound, "chunks", `${p.name} 唱字`);
      if (p.connected) eq(p.sound, "chunks", `${p.name} 连着唱`);
      for (const m of p.honors) assert((ALL_MARKS as readonly string[]).includes(m), `${p.name} honors ${m}`);
      assert(!!grooveCategory(p.grooveCategory, { bank: 0, program: 0 }), `${p.name} 拍子轻重类别`);
      assert(!!p.audition, `${p.name} 能试听`);
    }
  });
  it("守卫（ADR-0004 §2.4）：src 里不许再按引擎名分支——`=== \"tsukuyomi\"` 这类只许出现在 src/performers/（表本身）和 src/format/（格式层的判别联合）", () => {
    const root = join(import.meta.dirname, "..", "src"), bad: string[] = [];
    const walk = (d: string) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(ts|mjs)$/.test(f)) check(p); } };
    const re = /(===|!==|case)\s*"(tsukuyomi|soundfont|vowel-sampler)"|"(tsukuyomi|soundfont|vowel-sampler)"\s*(===|!==)/;
    const check = (p: string) => { const rel = relative(join(root, ".."), p).replaceAll("\\", "/"); if (rel.startsWith("src/performers/") || rel.startsWith("src/format/")) return;
      readFileSync(p, "utf8").split("\n").forEach((line, i) => { if (re.test(line)) bad.push(`${rel}:${i + 1}`); }); };
    walk(root);
    eq(bad.join("\n"), "", "按引擎名的分支要改成问注册表（performerOf(...) 的能力字段 / 方法）");
  });
});
