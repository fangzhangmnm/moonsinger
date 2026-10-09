// 负载 / 内存监控的阶梯（src/app/resource-watch.ts）：守的是「超预算先放块、再减并行、再重开堆最大的那条道；音频线程热 = 明说 + 减并行；预算内什么都不建议」。
// created 2026-10-10 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
import { budgetFor, advise, describe as describeRes, totalBytes, AUDIO_HOT, type Snapshot } from "../src/app/resource-watch.ts";

const MB = 1e6;
const snap = (o: Partial<Snapshot> = {}): Snapshot => ({ lanes: [], chunkBytes: 0, chunks: 0, soundMem: 0, audioBusy: null, ...o });

describe("资源预算：按设备", () => {
  it("iPad / 小内存 = 一条道、紧预算；桌面多核 = 两条道", () => {
    eq(budgetFor({ ios: true, cores: 8, deviceMemoryGB: null }).lanes, 1);
    eq(budgetFor({ ios: false, cores: 8, deviceMemoryGB: 4 }).lanes, 1);
    eq(budgetFor({ ios: false, cores: 2, deviceMemoryGB: null }).lanes, 1);
    eq(budgetFor({ ios: false, cores: 8, deviceMemoryGB: null }).lanes, 2);
    eq(budgetFor({ ios: false, cores: 8, deviceMemoryGB: 16 }).lanes, 2);
    assert(budgetFor({ ios: true, cores: 8, deviceMemoryGB: null }).total < budgetFor({ ios: false, cores: 8, deviceMemoryGB: null }).total);
  });
});

describe("资源阶梯", () => {
  const b = budgetFor({ ios: true, cores: 6, deviceMemoryGB: null });   // 600 MB / worker 420 / 块 24
  it("预算内 = 不建议", () => { eq(advise(snap({ lanes: [{ wasm: 200 * MB, cache: 20 * MB }], chunkBytes: 10 * MB, chunks: 8 }), b).length, 0); });
  it("块超了 = 先放块（到预算一半）", () => {
    const a = advise(snap({ lanes: [{ wasm: 200 * MB, cache: 20 * MB }], chunkBytes: 30 * MB, chunks: 20 }), b);
    eq(a.length, 1); eq(a[0].kind, "pruneChunks"); if (a[0].kind === "pruneChunks") eq(a[0].toBytes, 12 * MB);
  });
  it("总量超了、块不多、两条道 = 关一条；一条道 = 重开堆最大的那条", () => {
    const two = advise(snap({ lanes: [{ wasm: 300 * MB, cache: 30 * MB }, { wasm: 280 * MB, cache: 30 * MB }], chunkBytes: 5 * MB, chunks: 4 }), b);
    eq(two.map((x) => x.kind).join(), "fewerLanes");
    const one = advise(snap({ lanes: [{ wasm: 380 * MB, cache: 30 * MB }], chunkBytes: 5 * MB, chunks: 4, soundMem: 200 * MB }), b);
    eq(one.map((x) => x.kind).join(), "restartLane"); if (one[0].kind === "restartLane") eq(one[0].lane, 0);
  });
  it("某条道的堆超过单道预算 = 重开它（总量没超也重开）", () => {
    const a = advise(snap({ lanes: [{ wasm: 100 * MB, cache: 1 * MB }, { wasm: 430 * MB, cache: 1 * MB }], chunkBytes: 1 * MB, chunks: 1 }), budgetFor({ ios: false, cores: 8, deviceMemoryGB: 4 }));
    eq(a.length, 1); if (a[0].kind === "restartLane") eq(a[0].lane, 1); else assert(false, "该重开第二条道");
  });
  it("音频线程热 = 明说 + 两条道时减并行；不热不说", () => {
    const hot = advise(snap({ lanes: [{ wasm: 100 * MB, cache: 1 * MB }, { wasm: 100 * MB, cache: 1 * MB }], audioBusy: 0.95 }), budgetFor({ ios: false, cores: 8, deviceMemoryGB: null }));
    eq(hot.map((x) => x.kind).join(), "audioHot,fewerLanes");
    eq(advise(snap({ lanes: [{ wasm: 100 * MB, cache: 1 * MB }], audioBusy: AUDIO_HOT - 0.1 }), b).length, 0);
  });
  it("人话里有总量 / 预算 / 每条道 / 块 / 音频线程", () => {
    const s = snap({ lanes: [{ wasm: 210 * MB, cache: 30 * MB }], chunkBytes: 18 * MB, chunks: 12, soundMem: 32 * MB, audioBusy: 0.3 });
    eq(totalBytes(s), 290 * MB);
    const t = describeRes(s, b);
    for (const w of ["290 MB", "600 MB", "道 1", "12 块", "18 MB", "32 MB", "30%"]) assert(t.includes(w), `${w} ∈ ${t}`);
  });
});
