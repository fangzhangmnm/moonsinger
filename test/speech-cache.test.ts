// 「念」缓存（src/singer/speech-cache.ts）：同样的歌词 = 第二次不再跑 piper / WORLD 分析，交回去的数一样（拷贝，不共享）；预算 LRU。created 2026-10-09 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
import { memorySpeechStore } from "../src/singer/speech-store.ts";
import { SpeechCache } from "../src/singer/speech-cache.ts";

function fakes() {
  let runs = 0, analyses = 0;
  const piper = { SR: 22050, HOP: 256, run: async (ids: number[], _p: number[][], o: Record<string, unknown>) => { runs++; return { audio: Float32Array.from(ids, (v) => v * (o.override ? 2 : 1)), durations: Float32Array.from(ids) }; } };
  const world = { analyze: (x: ArrayLike<number>, _fs?: number, _o?: Record<string, unknown>) => { analyses++; return { frames: x.length, fft: 8, bins: 5, framePeriod: 5, fs: 22050, f0: Float64Array.from(x), sp: new Float64Array(x.length * 5).fill(1), ap: new Float64Array(x.length * 5).fill(0.5) }; }, synth: () => new Float64Array(0) };
  return { piper, world, n: () => ({ runs, analyses }) };
}
describe("念缓存", () => {
  it("两遍 piper + 分析：第二次全命中、数一样、不是同一个数组", async () => {
    const c = new SpeechCache(1e9), f = fakes(), P = c.wrapPiper(f.piper), W = c.wrapWorld(f.world);
    const sing = async () => { const pred = await P.run([1, 2, 3], [[0]], { noiseScale: 0 }); const said = await P.run([1, 2, 3], [[0]], { override: [1, 1, 1] }); return { pred, an: W.analyze(said.audio, 22050, { framePeriod: 5 }) }; };
    const a = await sing(); eq(f.n().runs, 2); eq(f.n().analyses, 1);
    const b = await sing(); eq(f.n().runs, 2, "piper 不再跑"); eq(f.n().analyses, 1, "分析不再跑");
    eq([...b.an.sp].join(), [...a.an.sp].join()); assert(b.pred.durations !== a.pred.durations, "念的结果交出去的是拷贝");
    // 分析：最近一句留一份解好码的（hot，2026-10-10 按键再提速）——连着命中同一句交的是同一个对象，不每次 bf16 → f64；换一句再回来 = 重新解码
    assert(b.an === a.an, "同一句连着命中 = 同一份解好码的分析");
    const other = async () => { const said = await P.run([9, 9], [[0]], { override: [1, 1] }); return W.analyze(said.audio, 22050, { framePeriod: 5 }); };
    await other(); const d = await sing();
    assert(d.an !== a.an && [...d.an.sp].join() === [...a.an.sp].join(), "换过一句再回来 = 重新解码、数一样");
    eq(c.hits, 6, "第二、三遍 sing 各命中 3（两遍念 + 分析）"); eq(c.misses, 5, "第一遍 3 + other 2");
  });
  it("不同歌词 / 不同 override = 不命中；预算小了最久没用的先走", async () => {
    const c = new SpeechCache(100), f = fakes(), P = c.wrapPiper(f.piper), W = c.wrapWorld(f.world);   // 一段念 ≈ 72 B（分析存 bf16），100 B 只装得下一段
    const r1 = await P.run([1, 2], [[0]], {}); W.analyze(r1.audio, 22050); const r2 = await P.run([3, 4], [[0]], {}); W.analyze(r2.audio, 22050);
    assert(c.used <= 100, `预算内（${c.used}）`);
    await P.run([1, 2], [[0]], {}); eq(f.n().runs, 3, "最早的那段被挤掉了、重跑");
    await P.run([1, 2], [[0]], { override: [1, 1] }); eq(f.n().runs, 4, "override 不同 = 另一键");
  });
});

describe("念缓存：分析是共享的只读对象", () => {
  it("唱法核心不就地改 an.f0 / an.sp / an.ap（hot 命中交的是同一个对象，改了 = 污染缓存）", async () => {
    const fs = (await import("node:fs" as string)) as { readFileSync(u: URL, e: string): string };
    const src = fs.readFileSync(new URL("../src/singer/sing-core.mjs", import.meta.url), "utf8");
    const writes = src.match(/\ban\.(?:sp|ap|f0)(?:\[[^\]]*\]\s*[-+*/]?=[^=]|\.(?:set|fill|copyWithin|reverse|sort)\()/g) ?? [];
    eq(writes.length, 0, `sing-core.mjs 里不许写分析数组：${writes.join(" | ")}`);
  });
});

// 持久层 = 全局池（2026-10-10，user「建议一个全局池by key and model config hash而不是每首歌」）：内存没有去盘上拿；念回来那一刻把同一句的分析预取进内存（analyze 是同步的）；
//   未命中后台写盘；模型标签不同 = 另一组键；预算按最久没用淘汰；清空。
describe("念缓存：持久层（全局池）", () => {
  const settle = () => new Promise((r) => setTimeout(r, 0));
  const sing = async (c: SpeechCache, f: ReturnType<typeof fakes>) => { const P = c.wrapPiper(f.piper), W = c.wrapWorld(f.world); const pred = await P.run([1, 2, 3], [[0]], { noiseScale: 0 }); const said = await P.run([1, 2, 3], [[0]], { override: [1, 1, 1] }); return { pred, an: W.analyze(said.audio, 22050, { framePeriod: 5 }) }; };
  it("第二个 cache 实例（内存空）+ 同一个池：念从盘上来、分析预取进内存 = 一次都不算", async () => {
    const pool = memorySpeechStore(1e9), f = fakes();
    const a = new SpeechCache(1e9); a.attachStore(pool, "m1");
    const r1 = await sing(a, f); eq(f.n().runs, 2); eq(f.n().analyses, 1);
    for (let i = 0; i < 5; i++) await settle();   // 后台写盘
    eq((await pool.info()).entries, 3, "两遍念 + 一份分析都进了池");
    const b = new SpeechCache(1e9); b.attachStore(pool, "m1");
    const r2 = await sing(b, f);
    eq(f.n().runs, 2, "念没再跑"); eq(f.n().analyses, 1, "分析没再跑（预取命中）");
    eq([...r2.an.sp].join(), [...r1.an.sp].join()); eq([...r2.pred.durations!].join(), [...r1.pred.durations!].join());
    assert(b.diskHits >= 3, `盘上命中 ${b.diskHits}`);
  });
  it("模型标签不同 = 另一组键（旧模型的不命中）；清空后重算", async () => {
    const pool = memorySpeechStore(1e9), f = fakes();
    const a = new SpeechCache(1e9); a.attachStore(pool, "m1"); await sing(a, f); for (let i = 0; i < 5; i++) await settle();
    const b = new SpeechCache(1e9); b.attachStore(pool, "m2"); await sing(b, f);
    eq(f.n().runs, 4, "换了模型标签 = 重念"); eq(f.n().analyses, 2);
    for (let i = 0; i < 5; i++) await settle();
    eq((await pool.info()).entries, 6);
    await pool.clear(); eq((await pool.info()).entries, 0); eq((await pool.info()).bytes, 0);
    const c = new SpeechCache(1e9); c.attachStore(pool, "m1"); await sing(c, f); eq(f.n().runs, 6, "清空了 = 重念");
  });
  it("池的预算：超了按最久没用淘汰、刚写的留着；总字节对得上", async () => {
    const pool = memorySpeechStore(100);
    await pool.put("k1", { kind: "p", k: "a", bytes: 60, audio: new Float32Array(15) });
    await pool.put("k2", { kind: "p", k: "b", bytes: 60, audio: new Float32Array(15) });
    const i = await pool.info(); eq(i.entries, 1); eq(i.bytes, 60); eq(await pool.get("k1"), null); assert((await pool.get("k2")) !== null, "刚写的留着");
  });
});
