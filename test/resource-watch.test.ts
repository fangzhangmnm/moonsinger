// 负载 / 内存监控的阶梯（src/app/resource-watch.ts）：守的是「超预算先放块、再减并行；音频线程热 = 明说 + 减并行；预算内什么都不建议；同一首歌里不重开引擎、换歌才还回上一首撑大的堆」。
// created 2026-10-10 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
import { budgetFor, advise, trimOnSongSwitch, describe as describeRes, totalBytes, AUDIO_HOT, type Snapshot } from "../src/app/resource-watch.ts";

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
  const b = budgetFor({ ios: true, cores: 6, deviceMemoryGB: null });   // 600 MB / 块 24
  it("预算内 = 不建议", () => { eq(advise(snap({ lanes: [{ wasm: 200 * MB, cache: 20 * MB }], chunkBytes: 10 * MB, chunks: 8 }), b).length, 0); });
  it("块超了 = 先放块（到预算一半）", () => {
    const a = advise(snap({ lanes: [{ wasm: 200 * MB, cache: 20 * MB }], chunkBytes: 30 * MB, chunks: 20 }), b);
    eq(a.length, 1); eq(a[0].kind, "pruneChunks"); if (a[0].kind === "pruneChunks") eq(a[0].toBytes, 12 * MB);
  });
  it("总量超了、块不多、两条道 = 关一条；一条道 = 什么都不建议（同一首歌里不重开引擎，v0.10.3）", () => {
    const two = advise(snap({ lanes: [{ wasm: 300 * MB, cache: 30 * MB }, { wasm: 280 * MB, cache: 30 * MB }], chunkBytes: 5 * MB, chunks: 4 }), b);
    eq(two.map((x) => x.kind).join(), "fewerLanes");
    eq(advise(snap({ lanes: [{ wasm: 600 * MB, cache: 30 * MB, base: 307 * MB }], chunkBytes: 5 * MB, chunks: 4, soundMem: 200 * MB }), b).length, 0, "堆涨到 600 = 这首歌最长那句要的，重开了下一遍又涨回来");
  });
  it("换歌：比引擎刚起来多涨一大截的道才重开（user「现在还是天天报内存太多的错，有时候月读还会内存不够读不了」）", () => {
    // 实测（Chromium，v0.10.2）：起引擎 307 MB；唱 11 s 一句 332、43 s 一句 437、64 s 一句 527
    eq(trimOnSongSwitch([{ wasm: 332 * MB, cache: 2 * MB, base: 307 * MB }]).join(), "", "上一首句子都短 = 不动");
    eq(trimOnSongSwitch([{ wasm: 437 * MB, cache: 8 * MB, base: 307 * MB }]).join(), "0", "上一首有 43 s 的一句（多涨 130 MB）= 还回去");
    eq(trimOnSongSwitch([null, { wasm: 527 * MB, cache: 8 * MB, base: 307 * MB }]).join(), "1", "下标按道排：没起的道是 null、不挪位");
    eq(trimOnSongSwitch([{ wasm: 527 * MB, cache: 8 * MB }]).join(), "", "没有基线 = 不知道能还多少 = 不动");
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
