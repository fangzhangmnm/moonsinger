// performers.test.ts —— 演奏者注册表（ADR-0004）：注册规则 + 「表说能什么 = 真能什么」的结构核对。created 2026-10-14 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
import { performerOf, performerByGuid, performers, addressOf } from "../src/performers/index.ts";
import { registerPerformer } from "../src/performers/registry.ts";
import { ALL_MARKS } from "../src/score/perform.ts";
import { grooveCategory } from "../src/score/groove.ts";
import { emptyExtras, withSf2Candidate } from "../src/format/project.ts";
import { initState } from "../src/score/song.ts";
import type { InspectorCtx } from "../src/performers/registry.ts";

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
  it("乐器页里插件自报的行（ADR §2.5）：每个按钮的 data-v 都有人接（onInspector 不回 null）；没有候选也不炸", () => {
    const st = initState(), role = st.song.parts[0]!.role;
    const ctx = (extras: ReturnType<typeof emptyExtras>): InspectorCtx => ({ extras, role, hum: "n", catalog: null, esc: (x) => x, chip: (v, label, on) => `<button data-v="${v}"${on ? " class=\"is-on\"" : ""}>${label}</button>`, dynTable: () => "" });
    const vs = (html: string) => [...html.matchAll(/data-v="([^"]+)"/g)].map((m) => m[1]);
    for (const p of performers()) {
      if (!p.inspector) continue;
      assert(!!p.onInspector, `${p.name} 自报了行就得接按钮`);
      const rows = p.inspector(ctx(emptyExtras()));
      for (const r of rows) for (const v of vs(r.control)) assert(p.onInspector!(v, ctx(emptyExtras())) !== null, `${p.name}：${v} 没人接`);
    }
    // SoundFont：真有一位上场时的行（力度 / 修八度）和按钮
    const sf = performerOf("soundfont")!, subset = new Uint8Array([1, 2, 3]);
    const ex = withSf2Candidate(emptyExtras(), role, { name: "Piano", bank: 0, program: 0, subset, sha256: "ab".repeat(32), origin: { name: "x.sf2", fileSha256: "cd".repeat(32), bytes: 3, library: null }, credit: { attribution: [], license: { name: "?", url: null, text: null } }, embed: false } as never, "n");
    const rows = sf.inspector!(ctx(ex)), ids = rows.flatMap((r) => vs(r.control));
    assert(rows.some((r) => r.label === "力度") && rows.some((r) => r.label === "修八度"), `有力度 / 修八度两行：${rows.map((r) => r.label).join(",")}`);
    for (const v of ids) assert(sf.onInspector!(v, ctx(ex)) !== null, `soundfont：${v} 没人接`);
    assert(sf.onInspector!("nope", ctx(ex)) === null, "不认识的 = null");
    // 小月相：高级旋钮进「高级」折叠、分段唱在末尾
    const tk = performerOf("tsukuyomi")!, trows = tk.inspector!(ctx(emptyExtras()));
    assert(trows.some((r) => r.place === "adv") && trows.some((r) => r.place === "tail" && r.label === "分段唱"), "小月相的行分「高级」和末尾");
  });
});
