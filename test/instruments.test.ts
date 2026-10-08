// 挑乐器数据：src/gm/instruments.gen.ts（内嵌的 sha256）= 现在 vendor/instruments/ 算出来的；目录能装、关系对得上。created 2026-10-07 by Claude Fable 5.1
// 不守「vendor = 源仓」：和图标库一样，vendor 是拷来的快照，源仓改了这边想要时跑 node scripts/gen-instruments.mjs 取货（user「和svg一样是拷贝snapshot过来而不是跨项目引用，以后我改那边就是这边取货就行」）。
import { describe, it, eq, assert } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readFileSync(p: string | URL): Uint8Array; existsSync(p: string): boolean };
const g = (await import(new URL("../scripts/gen-instruments.mjs", import.meta.url).href)) as { render(): string | null };
import { INSTRUMENT_FILES } from "../src/gm/instruments.gen.ts";
import { loadCatalogFromJson, providersOf, gmKey, groupConcepts, type Catalog } from "../src/gm/catalog.ts";

describe("挑乐器数据", () => {
  it("instruments.gen.ts 是最新的（不是就跑 node scripts/gen-instruments.mjs）", () => {
    const out = g.render(); if (out === null) return;
    eq(fs.readFileSync(new URL("../src/gm/instruments.gen.ts", import.meta.url)).toString() === out, true);
  });
  it("目录能装：144 个概念、每个本尊 GM 号在映射表里有 self 行；钢琴的提供者 = GS 的两个预设", () => {
    const read = (k: keyof typeof INSTRUMENT_FILES) => JSON.parse(fs.readFileSync(new URL(`../${INSTRUMENT_FILES[k].file}`, import.meta.url)).toString());
    const cat: Catalog = loadCatalogFromJson(read("concepts"), read("gmMap"));
    assert(cat.concepts.length >= 100, `只有 ${cat.concepts.length} 个概念`);
    const piano = cat.byId.get("Q5994")!; assert(piano, "没有钢琴 Q5994");
    const prov = providersOf(cat, piano);
    eq(prov.length, 2); eq(prov[0].kind, "self"); eq(prov[0].program, 0); eq(prov[0].gmName, "Acoustic Grand Piano"); eq(prov[0].sound, "keyboard.piano.grand");
    const band = cat.byId.get("Q215032")!, ps = providersOf(cat, band);   // 班东尼琴：本尊 23 + 平替（同一个号）→ 只列本尊
    assert(ps.length >= 1 && ps[0].kind === "self", "班东尼琴该有本尊");
    for (const c of cat.concepts) for (const gm of c.ids.gm ?? []) assert(cat.gmSelf.has(gmKey(gm)), `${c.names.zh} 的本尊 ${gmKey(gm)} 在映射表里没有 self 行`);
    // 鼓件：47 个都挂在 128:0 下靠 note 区分，名字要各是各的（user「预览的时候有些打击乐会错误」= 以前按 bank:program 建键全被最后一行盖掉）
    const agogo = cat.concepts.find((c) => c.names.zh === "阿哥哥铃")!, ap = providersOf(cat, agogo);
    eq(ap.map((p) => `${p.note ?? p.program}:${p.gmName}`).join(","), "113:Agogo,67:High Agogo,68:Low Agogo");   // 旋律 GM 113 Agogo + 鼓组里的两个鼓件
    const names = new Set(cat.concepts.flatMap((c) => providersOf(cat, c).filter((p) => p.note !== undefined).map((p) => p.gmName)));
    assert(names.size >= 40, `鼓件名只有 ${names.size} 种，还在张冠李戴`);
  });
});

// 按曲风以 GM 音色为单位（2026-10-08 by Claude Opus 5.5；user「音色为单位而不是家族一把捞」「丢了子音的排序和策展」，仓鼠会话转述）
describe("按曲风：成员 / 星级按音色", () => {
  const read = (k: keyof typeof INSTRUMENT_FILES) => JSON.parse(fs.readFileSync(new URL(`../${INSTRUMENT_FILES[k].file}`, import.meta.url)).toString());
  const cat: Catalog = loadCatalogFromJson(read("concepts"), read("gmMap"));
  const groups = groupConcepts(cat, "style");
  it("新世纪风：合成器只列入选的音色（各自的星级），不把整个概念的提供者都捞进来", () => {
    const na = groups.find((g) => g.id === "new-age")!;
    const synthId = na.items.find((x) => x.preset?.gmNumber === 89)!.concept.id;
    const synth = na.items.filter((e) => e.concept.id === synthId);
    const claims = [...cat.gmSelf.values()].filter((r) => r.concept === synthId && r.styles?.some((s) => s.tag === "new-age"));
    eq(synth.map((e) => e.preset?.gmNumber).sort().join(","), claims.map((r) => r.gmNumber).sort().join(","), "合成器名下 = 只有认领了新世纪风的那几个音色");
    assert(synth.length < [...cat.gmSelf.values()].filter((r) => r.concept === synthId).length, "不是合成器名下全部音色");
    assert(synth.every((e) => e.weight === e.preset!.styles!.find((s) => s.tag === "new-age")!.weight), "星级 = 这个音色自己的");
    eq(synth.filter((e) => e.weight === 3).map((e) => e.preset?.gmNumber).join(","), "90,89", "同是 ★★★：Pad 2（warm，1974）比 Pad 1（new age，1987）早");
    const rowsClaiming = [...cat.gmSelf.values()].filter((r) => r.styles?.some((s) => s.tag === "new-age")).length;
    eq(na.items.filter((e) => e.preset).length, rowsClaiming, "音色行数 = 认领了这种风的本尊行数");
  });
  it("组内：承重降序 → 年份升序", () => {
    for (const g of groups) for (let i = 1; i < g.items.length; i++) {
      const a = g.items[i - 1], b = g.items[i], wa = a.weight ?? 0, wb = b.weight ?? 0;
      assert(wa > wb || (wa === wb && (a.preset?.year ?? a.concept.year ?? 1e9) <= (b.preset?.year ?? b.concept.year ?? 1e9)), `${g.id}：${a.concept.names.zh} 排在 ${b.concept.names.zh} 前面不对`);
    }
  });
  it("平替认领带 as；没有 GM 音色的概念照旧按概念列；每个本尊音色在按曲风里都找得到", () => {
    const zh = groups.find((g) => g.id === "chinese")!;
    eq(cat.byId.get(zh.items.find((e) => e.preset?.gmNumber === 41)?.as ?? "")?.names.zh, "二胡", "Violin 在中华风里顶二胡");
    assert(zh.items.some((e) => !e.preset && e.concept.names.zh === "古筝"), "古筝（没有 GM 本尊）按概念列");
    const seen = new Set(groups.flatMap((g) => g.items.filter((e) => e.preset).map((e) => gmKey(e.preset!))));
    const styled = new Set(cat.rows.filter((r) => r.styles?.length).map((r) => r.concept));
    const missing = [...cat.gmSelf.values()].filter((r) => styled.has(r.concept) && !seen.has(gmKey(r)));
    eq(missing.length, 0, missing.map((r) => r.gmName).join(","));
  });
});
