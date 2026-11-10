// 这台设备上记着的渲好的声音（src/app/render-cache.ts）：两层钥匙、上限、挂名、字节没了就作废。全用内存里的存储口。created 2026-11-10 by Claude Fable 5.2
import { describe, it, eq, assert } from "./runner.mjs";
import { createRenderCache, memoryRenderStore, type RenderCacheStore } from "../src/app/render-cache.ts";

const core = { version: "1", hash: "abc" };
const base = (fp: string, o: { quality?: string; parts?: string[]; title?: string } = {}) => ({ fingerprint: fp, quality: o.quality ?? "standard", parts: o.parts ?? ["P1"], roles: ["r1"], secs: 12.5, kbps: 192, stereo: true, title: o.title ?? "小星星", app: "v0", core });
function make(o: { max?: number; store?: RenderCacheStore } = {}) {
  let t = 1000; const errs: unknown[] = [], store = o.store ?? memoryRenderStore();
  const c = createRenderCache(store, { max: o.max ?? 3, now: () => ++t, report: (e) => errs.push(e) });
  return { c, store, errs };
}
const mp3 = (n: number) => new Uint8Array(n).fill(7);

describe("渲染缓存", () => {
  it("准的一层：内容指纹 + 音质 + 声部 + 歌名都一样才是同一条；声部顺序不算", () => {
    const { c } = make();
    const k = c.keyOf({ fingerprint: "f", quality: "standard", parts: ["P2", "P1"], title: "a" });
    eq(k, c.keyOf({ fingerprint: "f", quality: "standard", parts: ["P1", "P2"], title: "a" }));
    for (const other of [{ fingerprint: "g" }, { quality: "small" }, { parts: ["P1"] }, { title: "b" }]) assert(k !== c.keyOf({ fingerprint: "f", quality: "standard", parts: ["P1", "P2"], title: "a", ...other }), JSON.stringify(other));
  });
  it("记下一份 → 找得到、取得出、字节原样；没记过的 = null", async () => {
    const { c } = make();
    const m = await c.put(base("f1"), mp3(100));
    eq(m.size, 100); assert(c.find(m.key) !== null && c.find("nope") === null);
    const got = await c.take(m.key);
    assert(got !== null && got.bytes.length === 100 && got.meta.fingerprint === "f1");
    eq(await c.take("nope"), null);
    eq(JSON.stringify(c.stats()), JSON.stringify({ count: 1, bytes: 100, max: 3 }));
  });
  it("上限：超了丢最久没用的（用过的往后排），挂在它上面的名一起丢", async () => {
    const { c } = make({ max: 2 });
    const a = await c.put(base("a"), mp3(1)), b = await c.put(base("b"), mp3(2));
    await c.link("default", "a.mxl", a.key, "s1"); await c.link("default", "b.mxl", b.key, "s2");
    await c.take(a.key);   // a 刚用过 → b 成了最久没用的
    const d = await c.put(base("d"), mp3(3));
    assert(c.find(a.key) !== null && c.find(d.key) !== null && c.find(b.key) === null, "丢的是 b");
    assert(c.linkOf("default", "a.mxl") !== null && c.linkOf("default", "b.mxl") === null, "b 的挂名跟着丢");
    eq(c.stats().count, 2);
  });
  it("快的一层（挂名）：身份 → 记录 + 文件戳；分家；记录不在不挂；摘掉 / 改名跟着走", async () => {
    const { c } = make();
    const m = await c.put(base("f"), mp3(5));
    assert(!(await c.link("default", "x.mxl", "没有这条", "s")), "记录不在：不挂");
    assert(await c.link("default", "x.mxl", m.key, "戳1"));
    eq(c.linkOf("default", "x.mxl")?.stamp, "戳1"); eq(c.linkOf("folder-1", "x.mxl"), null, "别的家里同名的歌不是一回事");
    await c.link("default", "x.mxl", m.key, "戳2"); eq(c.linkOf("default", "x.mxl")?.stamp, "戳2", "重新挂 = 换戳");
    await c.renamed("default", "x.mxl", "夹/y.mxl");
    assert(c.linkOf("default", "x.mxl") === null && c.linkOf("default", "夹/y.mxl")?.stamp === "戳2");
    await c.unlink("default", "夹/y.mxl"); eq(c.linkOf("default", "夹/y.mxl"), null);
    assert(c.find(m.key) !== null, "摘名不动记录");
  });
  it("重开（同一个存储）：记录和挂名都还在", async () => {
    const store = memoryRenderStore();
    const one = make({ store });
    const m = await one.c.put(base("f"), mp3(9)); await one.c.link("default", "x.mxl", m.key, "戳");
    const two = make({ store });
    eq(two.c.find(m.key), null, "索引还没装 = 当没记着");
    await two.c.ready();
    assert(two.c.find(m.key) !== null && two.c.linkOf("default", "x.mxl")?.stamp === "戳");
    eq((await two.c.take(m.key))?.bytes.length, 9);
  });
  it("字节没了 / 对不上：这条作废、回 null（清了能重来），挂名一起摘", async () => {
    const store = memoryRenderStore();
    const { c } = make({ store });
    const m = await c.put(base("f"), mp3(9)); await c.link("default", "x.mxl", m.key, "戳");
    store.bytes = async () => null;
    eq(await c.take(m.key), null); eq(c.find(m.key), null); eq(c.linkOf("default", "x.mxl"), null);
  });
  it("存储坏了：读不出来 = 当空的用；记不进去 = 抛给调用方；删不掉 / 挂不上 = 只报不抛", async () => {
    const bad: RenderCacheStore = { ...memoryRenderStore(), load: async () => { throw new Error("idb closed"); } };
    const a = make({ store: bad });
    await a.c.ready(); eq(a.c.stats().count, 0); eq(a.errs.length, 1);
    const full: RenderCacheStore = { ...memoryRenderStore(), put: async () => { throw new Error("quota"); } };
    const b = make({ store: full });
    let threw = false; try { await b.c.put(base("f"), mp3(1)); } catch { threw = true; }
    assert(threw && b.c.stats().count === 0, "没记进去就不算记着");
    const flaky: RenderCacheStore = { ...memoryRenderStore(), putLink: async () => { throw new Error("x"); } };
    const d = make({ store: flaky });
    const m = await d.c.put(base("f"), mp3(1));
    assert(await d.c.link("default", "x.mxl", m.key, "s")); eq(d.errs.length, 1);
  });
  it("索引变了会叫一声（歌库卡片上的 ▶ 靠它重算）；清空 = 全没", async () => {
    const { c } = make(); let n = 0; c.onChange(() => { n++; });
    const m = await c.put(base("f"), mp3(1)); const afterPut = n;
    await c.link("default", "x.mxl", m.key, "s"); assert(n > afterPut);
    const before = n; await c.link("default", "x.mxl", m.key, "s"); eq(n, before, "同一个挂名再挂一次不叫");
    await c.clear(); eq(c.stats().count, 0); eq(c.linkOf("default", "x.mxl"), null);
  });
});
