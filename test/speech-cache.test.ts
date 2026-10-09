// 「念」缓存（src/singer/speech-cache.ts）：同样的歌词 = 第二次不再跑 piper / WORLD 分析，交回去的数一样（拷贝，不共享）；预算 LRU。created 2026-10-09 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
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
    eq([...b.an.sp].join(), [...a.an.sp].join()); assert(b.an.sp !== a.an.sp && b.pred.durations !== a.pred.durations, "交出去的是拷贝");
    eq(c.hits, 3); eq(c.misses, 3);
  });
  it("不同歌词 / 不同 override = 不命中；预算小了最久没用的先走", async () => {
    const c = new SpeechCache(100), f = fakes(), P = c.wrapPiper(f.piper), W = c.wrapWorld(f.world);   // 一段念 ≈ 72 B（分析存 bf16），100 B 只装得下一段
    const r1 = await P.run([1, 2], [[0]], {}); W.analyze(r1.audio, 22050); const r2 = await P.run([3, 4], [[0]], {}); W.analyze(r2.audio, 22050);
    assert(c.used <= 100, `预算内（${c.used}）`);
    await P.run([1, 2], [[0]], {}); eq(f.n().runs, 3, "最早的那段被挤掉了、重跑");
    await P.run([1, 2], [[0]], { override: [1, 1] }); eq(f.n().runs, 4, "override 不同 = 另一键");
  });
});
