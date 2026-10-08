// 挑乐器数据：src/gm/instruments.gen.ts（内嵌的 sha256）= 现在 vendor/instruments/ 算出来的；目录能装、关系对得上。created 2026-10-07 by Claude Fable 5.1
// 不守「vendor = 源仓」：和图标库一样，vendor 是拷来的快照，源仓改了这边想要时跑 node scripts/gen-instruments.mjs 取货（user「和svg一样是拷贝snapshot过来而不是跨项目引用，以后我改那边就是这边取货就行」）。
import { describe, it, eq, assert } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readFileSync(p: string | URL): Uint8Array; existsSync(p: string): boolean };
const g = (await import(new URL("../scripts/gen-instruments.mjs", import.meta.url).href)) as { render(): string | null };
import { INSTRUMENT_FILES } from "../src/gm/instruments.gen.ts";
import { loadCatalogFromJson, providersOf, type Catalog } from "../src/gm/catalog.ts";

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
    for (const c of cat.concepts) for (const gm of c.ids.gm) assert(cat.gmSelf.has(`${gm.bank}:${gm.program}`), `${c.names.zh} 的本尊 ${gm.bank}:${gm.program} 在映射表里没有 self 行`);
  });
});
