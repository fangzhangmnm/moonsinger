// 录音房核心（src/engine/studio.ts）：node 里逐块跑同一份数学。created 2026-10-09 by Claude Fable 5.1
// 守的是：确定性（同样的消息同样的采样）；从中间放把该响的音按下；范围尾 / 循环点不切尾音；块没到 = 冻住等、到了接着放；
//   通道（推子 / 声像 / 静音 / 独奏）和表情曲线播放时才乘；母线绝不超天花板、不超的地方不动；试听绕过限幅。听感归 user，这里只管数学。
import { describe, it, eq, assert } from "./runner.mjs";
import { instantiateTsf } from "../src/gm/tsf-standalone.ts";
import { Studio, BLOCK, CEILING, type StudioOut, type TimelineMsg, type TrackSpec } from "../src/engine/studio.ts";
import { audibleAt, outputClock } from "../src/engine/studio-client.ts";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL | string): Uint8Array };

const SR = 48000;
const wasm = fs.readFileSync(new URL("../vendor/tsf/tsf-standalone.wasm", import.meta.url));
const sf2 = fs.readFileSync(new URL("./fixtures/sf2/gu-square-castanets.sf2", import.meta.url));
const SHA = "fixture";

async function studio(): Promise<{ s: Studio; out: StudioOut[] }> {
  const out: StudioOut[] = [];
  const s = new Studio(SR, await instantiateTsf(wasm), (m) => out.push(m));
  s.handle({ type: "bank", sha: SHA, bytes: sf2 });
  return { s, out };
}
/** 出 secs 秒，返回左右两条。 */
function run(s: Studio, secs: number): { L: Float32Array; R: Float32Array } {
  const n = Math.round(secs * SR), L = new Float32Array(n), R = new Float32Array(n), bl = new Float32Array(BLOCK), br = new Float32Array(BLOCK);
  for (let i = 0; i < n; i += BLOCK) { const c = Math.min(BLOCK, n - i); s.render(bl, br, c); L.set(bl.subarray(0, c), i); R.set(br.subarray(0, c), i); }
  return { L, R };
}
const peak = (a: Float32Array, from = 0, to = a.length) => { let p = 0; for (let i = Math.max(0, Math.round(from)); i < Math.min(a.length, Math.round(to)); i++) p = Math.max(p, Math.abs(a[i])); return p; };
const sec = (t: number) => t * SR;
/** 等功率声像在正中：单声道的内容到左右各 ×0.707（和原 mix.ts 一样）。 */
const PAN0 = Math.SQRT1_2;
const same = (a: Float32Array, b: Float32Array) => a.length === b.length && a.every((v, i) => v === b[i]);
const sfTrack = (id: string, notes: TrackSpec extends { kind: "sf" } ? never : { t0: number; t1: number; key: number; vel?: number }[], gain: TrackSpec["gain"] = null): TrackSpec => ({ id, kind: "sf", sha: SHA, notes: notes.map((n) => ({ ...n, vel: n.vel ?? 0.8, preset: 0 })), gain });
const tl = (tracks: TrackSpec[], range = { from: 0, to: 2 }, loop = false): TimelineMsg => ({ tracks, range, loop });
/** 一块常数（做数学对照）。 */
const flat = (secs: number, v: number, sr = SR) => new Float32Array(Math.round(secs * sr)).fill(v);
const clipTrack = (id: string, key: string, t0: number, dur: number, gain = 1, g: TrackSpec["gain"] = null): TrackSpec => ({ id, kind: "clips", clips: [{ key, t0, dur, gain }], gain: g });

describe("录音房：确定性 + 走带", () => {
  it("同样的消息 = 逐样本相同（两个实例）", async () => {
    const a = await studio(), b = await studio();
    for (const { s } of [a, b]) { s.handle({ type: "timeline", tl: tl([sfTrack("p", [{ t0: 0.1, t1: 0.6, key: 60 }, { t0: 0.5, t1: 1, key: 67 }])]) }); s.handle({ type: "play" }); }
    const ra = run(a.s, 1.5), rb = run(b.s, 1.5);
    assert(peak(ra.L) > 0.01, "有声"); assert(same(ra.L, rb.L) && same(ra.R, rb.R), "逐样本相同");
  });
  it("从中间放：pos 落在一个音里 = 把它按下（note chase）；pos 之前的音不响", async () => {
    const { s } = await studio();
    s.handle({ type: "timeline", tl: tl([sfTrack("p", [{ t0: 0, t1: 0.3, key: 60 }, { t0: 0.5, t1: 2, key: 64 }])]) });
    s.handle({ type: "play", at: 1 });
    const r = run(s, 0.2);
    assert(peak(r.L, 0, sec(0.05)) > 0.01, "起放马上有声（长音被追上）");
    eq(Math.round(s.position * 100) / 100, 1.2);
  });
  it("范围尾不切尾音：到了尾只停排新音，响完报 ended；之后 playing = false", async () => {
    const { s, out } = await studio();
    s.handle({ type: "timeline", tl: tl([sfTrack("p", [{ t0: 0, t1: 1, key: 60 }, { t0: 1.1, t1: 1.5, key: 72 }])], { from: 0, to: 1 }) });
    s.handle({ type: "play" });
    const r = run(s, 3);
    assert(peak(r.L, sec(1.0), sec(1.05)) > 0.001, "过了范围尾一点还有声（松键的尾巴）");
    const { s: s2 } = await studio();   // 对照：根本没有第二个音 → 逐样本相同 = 范围外的音没按下
    s2.handle({ type: "timeline", tl: tl([sfTrack("p", [{ t0: 0, t1: 1, key: 60 }])], { from: 0, to: 1 }) }); s2.handle({ type: "play" });
    assert(same(r.L, run(s2, 3).L), "范围外的音没按下（和没有它的那次逐样本相同）");
    assert(out.some((m) => m.type === "ended") && !s.isPlaying, "尾巴响完 = ended");
  });
  it("循环：到尾跳回去，正在响的照响；跳回时该响的音重新按下", async () => {
    const { s } = await studio();
    s.handle({ type: "timeline", tl: tl([sfTrack("p", [{ t0: 0, t1: 0.4, key: 60 }, { t0: 0.9, t1: 1.3, key: 72 }])], { from: 0, to: 1 }, true) });
    s.handle({ type: "play" });
    const r = run(s, 1.5);
    assert(peak(r.L, sec(1.0), sec(1.02)) > 0.001, "跳回那一刻前一个音的尾巴还在");
    assert(peak(r.L, sec(1.02), sec(1.1)) > 0.01, "跳回后开头的音又响了");
    assert(Math.abs(s.position - 0.5) < 0.01, "位置绕回去了");
    assert(s.isPlaying, "循环不停");
  });
});

describe("录音房：停 / 再放 / 放着的时候换时间线（2026-10-10）", () => {
  it("尾巴还在响的时候开了循环 = 这一轮照样跳回去（user「中途toggle循环对本轮播放应该生效」）；没开 = 照旧响完报 ended", async () => {
    const { s, out } = await studio(), notes = [{ t0: 0, t1: 0.9, key: 60 }];
    s.handle({ type: "timeline", tl: tl([sfTrack("p", notes)], { from: 0, to: 1 }) }); s.handle({ type: "play" });
    run(s, 1.05);   // 过了范围尾：进尾巴
    assert(s.isPlaying && s.position > 1, "在尾巴里");
    s.handle({ type: "timeline", tl: tl([sfTrack("p", notes)], { from: 0, to: 1 }, true) });
    const r = run(s, 0.3);
    assert(s.isPlaying && s.position < 0.5, `跳回去了（pos ${s.position.toFixed(2)}）`);
    assert(peak(r.L, sec(0.05), sec(0.3)) > 0.01, "跳回去之后第一个音重新响");
    assert(!out.some((m) => m.type === "ended"), "没报 ended");
  });
  it("停 = 释放中的尾巴接着响到静（不是冻住）；再按放 = 上次的音不漏出来（user「每次点play的时候会漏上次的最后一个音」）", async () => {
    const { s } = await studio();
    s.handle({ type: "timeline", tl: tl([sfTrack("p", [{ t0: 0, t1: 1.5, key: 60 }])]) }); s.handle({ type: "play" });
    run(s, 0.3);
    s.handle({ type: "stop" });
    const a = run(s, 0.4);
    assert(peak(a.L, 0, sec(0.01)) > 0.01, `停的一瞬尾巴照响、不是硬切（${peak(a.L, 0, sec(0.01))}）`);
    assert(Math.abs(s.position - 0.3) < 1e-6, "播放头留在停的地方");
    s.handle({ type: "play", at: 1.8 });   // 1.8 s 起没有音：旧代码释放中的音冻着、这时漏出来
    const b = run(s, 0.15);
    assert(peak(b.L, sec(0.02), sec(0.15)) < 1e-4, `再放：上次的音不漏（${peak(b.L, sec(0.02), sec(0.15))}）`);
  });
  it("停：月读的块 30 ms 淡出之后就不出声（原来淡完又全音量放出来；user「按停之后月读不应该把长句念完」）", async () => {
    const { s } = await studio();
    s.handle({ type: "chunk", key: "A", sr: SR, samples: flat(3, 0.5) });
    s.handle({ type: "timeline", tl: tl([clipTrack("v", "A", 0, 3)], { from: 0, to: 3 }) }); s.handle({ type: "play" });
    run(s, 0.5);
    s.handle({ type: "stop" });
    const a = run(s, 0.5);
    assert(peak(a.L, 0, sec(0.01)) > 0.1, "停的一瞬还有声（淡出中）");
    assert(peak(a.L, sec(0.05), sec(0.5)) < 1e-4, `淡完之后安静（${peak(a.L, sec(0.05), sec(0.5))}）`);
  });
  it("放着的时候正在唱的那句换了唱谱：旧块留到响完、走带不冻；响完新块没到才等（user「正在响的那句不换、响完换新」）", async () => {
    const { s, out } = await studio();
    s.handle({ type: "chunk", key: "A", sr: SR, samples: flat(1, 0.5) });
    s.handle({ type: "timeline", tl: tl([clipTrack("v", "A", 0, 1)]) }); s.handle({ type: "play" });
    run(s, 0.3);
    s.handle({ type: "forget", keys: ["A"] });   // 主线程按新时间线清块：hold 着的要留到响完
    s.handle({ type: "timeline", tl: tl([{ id: "v", kind: "clips", clips: [{ key: "B", t0: 0, dur: 1.5, gain: 1 }], gain: null }]) });   // B 还没唱
    const a = run(s, 0.4);
    assert(Math.abs(s.position - 0.7) < 1e-3, `走带没冻（${s.position}）`);
    assert(peak(a.L) > 0.3, `旧块照响（${peak(a.L)}）`);
    assert(out.some((m) => m.type === "missing" && m.keys.includes("B")), "新块报 missing（主线程去唱）");
    run(s, 0.4);
    const w = (s as unknown as { waiting: string | null }).waiting;
    assert(Math.abs(s.position - 1.0) < 0.005 && w === "B", `旧块响完才轮到新块、没到就等（pos ${s.position} waiting ${w}）`);   // 块粒度 2.7 ms
    s.handle({ type: "chunk", key: "B", sr: SR, samples: flat(1.5, 0.25) });
    const c = run(s, 0.2);
    assert(peak(c.L, sec(0.05)) > 0.1 && s.position > 1.1, "新块到了接着放");
  });
  it("时间线带 shift：改了播放头前面的东西，播放头按谱位置挪（等着松开的音一起挪）", async () => {
    const { s } = await studio();
    s.handle({ type: "timeline", tl: tl([sfTrack("p", [{ t0: 0, t1: 0.5, key: 60 }])]) }); s.handle({ type: "play" });
    run(s, 0.3);
    s.handle({ type: "timeline", tl: { ...tl([sfTrack("p", [{ t0: 0.5, t1: 1, key: 60 }])]), shift: 0.5 } });   // 前面插了半秒
    assert(Math.abs(s.position - 0.8) < 1e-3, `0.3 + 0.5 = ${s.position}`);
    const a = run(s, 0.3);
    assert(peak(a.L, 0, sec(0.1)) > 0.01, "正在响的音接着响（没被当成已过去）");
  });
});

describe("播放头 = 听到的地方（2026-10-10，user「ipad后台唤起后音频和动画错位」）", () => {
  it("位置报告带音频时钟：起放那一块就报（at = 块尾的时钟）；之后约 21 ms 一报；跳（seek）那一块立刻报", async () => {
    const { s, out } = await studio();
    s.handle({ type: "timeline", tl: tl([sfTrack("p", [{ t0: 0, t1: 3, key: 60 }])], { from: 0, to: 3 }) }); s.handle({ type: "play" });
    const bl = new Float32Array(BLOCK), br = new Float32Array(BLOCK); let clock = 5;
    const step = () => { s.clock = clock; s.render(bl, br, BLOCK); clock += BLOCK / SR; };
    step();
    const p0 = out.filter((m) => m.type === "pos");
    assert(p0.length === 1 && p0[0].type === "pos" && Math.abs((p0[0].at ?? 0) - (5 + BLOCK / SR)) < 1e-9 && Math.abs(p0[0].sec - BLOCK / SR) < 1e-9, `起放就报：${JSON.stringify(p0)}`);
    for (let i = 0; i < 16; i++) step();
    eq(out.filter((m) => m.type === "pos").length, 3, "之后每 8 块一报");
    s.handle({ type: "seek", at: 2 }); out.length = 0; step();
    const p1 = out.find((m) => m.type === "pos"); assert(p1 && p1.type === "pos" && Math.abs(p1.sec - (2 + BLOCK / SR)) < 1e-9, "跳了那一块就报");
  });
  it("outputClock：时间戳合理 = 往前推；两个时钟对不上（长锁屏回来）= 不推；时间戳冻住 = 估（user「大部分音和动画没对齐都是发生在长锁屏之后回到前台」）", () => {
    const ts = { contextTime: 9.95, performanceTime: 5000 };
    const a = outputClock({ currentTime: 10, ts, perfNow: 5010 })!; eq(a.src, "ts"); assert(Math.abs(a.T - 9.96) < 1e-9, `推 10 ms：${a.T}`);
    const b = outputClock({ currentTime: 10, ts, perfNow: 5000 + 3_600_000 })!; eq(b.src, "ts-ctx", "performance 时钟多走了一小时 = 推出来比 currentTime 还靠前 → 不推"); eq(b.T, 9.95);
    const c = outputClock({ currentTime: 10, ts: { contextTime: 4, performanceTime: 5000 }, perfNow: 5000, baseLatency: 0.01, outputLatency: 0.04 })!; eq(c.src, "estimate", "时间戳停在 6 秒前"); assert(Math.abs(c.T - 9.95) < 1e-9);
    eq(outputClock({ currentTime: 10, ts: null, perfNow: 0, baseLatency: 0.02 })!.src, "estimate", "浏览器不给时间戳");
    eq(outputClock({ currentTime: 0, ts: null, perfNow: 0 }), null, "还没开始走");
  });
  it("audibleAt：扬声器的时钟 T 落在两条报告之间 = 从前一条往前推；在等块 = 不推；比最早一条还早 = 那一条", () => {
    const h = [{ at: 10, sec: 0, run: true }, { at: 10.021, sec: 0.021, run: true }, { at: 10.042, sec: 0.03, run: false }];
    assert(Math.abs(audibleAt(h, 10.01)! - 0.01) < 1e-12, "推 10 ms");
    eq(audibleAt(h, 10.06), 0.03, "在等块：停在那儿");
    eq(audibleAt(h, 9.9), 0, "还没到第一条");
    eq(audibleAt([], 1), null);
  });
});

describe("录音房：负载 / 内存上报（刀 6）", () => {
  it("每秒报一条 load：忙闲在 0–1；块的 Int16 字节数随喂 / 放变", async () => {
    const { s, out } = await studio();
    run(s, 1.1);
    const l0 = out.filter((m) => m.type === "load"); assert(l0.length >= 1, "1 s 内报了"); if (l0[0].type === "load") { assert(l0[0].busy >= 0 && l0[0].busy <= 1, `busy ${l0[0].busy}`); eq(l0[0].chunkBytes, 0); eq(l0[0].chunks, 0); }
    s.handle({ type: "chunk", key: "A", sr: SR, samples: flat(1, 0.5) });   // 48000 个采样 → Int16 96000 B
    out.length = 0; run(s, 1.05);
    const l1 = out.find((m) => m.type === "load"); assert(l1 && l1.type === "load" && l1.chunkBytes === 96000 && l1.chunks === 1, `喂了一块：${JSON.stringify(l1)}`);
    s.handle({ type: "forget", keys: ["A"] });
    out.length = 0; run(s, 1.05);
    const l2 = out.find((m) => m.type === "load"); assert(l2 && l2.type === "load" && l2.chunkBytes === 0 && l2.chunks === 0, `放掉了：${JSON.stringify(l2)}`);
  });
});

describe("录音房：块回放（慢引擎）", () => {
  it("块没到 = 冻在它的头、报 missing；到了接着放；增益乘上去、22050 → 48000 重采样", async () => {
    const { s, out } = await studio();
    s.handle({ type: "timeline", tl: tl([clipTrack("v", "K", 0.5, 1, 2)], { from: 0, to: 2 }) });
    s.handle({ type: "play" });
    const r1 = run(s, 1);
    eq(peak(r1.L), 0, "块没到 = 没声");
    assert(Math.abs(s.position - 0.5) < 1e-6, "冻在块的头"); eq(s.waitingFor, "K");
    assert(out.some((m) => m.type === "missing" && m.keys.includes("K")), "报了缺块");
    s.handle({ type: "chunk", key: "K", sr: 22050, samples: flat(1, 0.25, 22050) });
    const r2 = run(s, 1.2);
    assert(Math.abs(peak(r2.L, sec(0.1), sec(0.9)) - 0.5 * PAN0) < 1e-3, `增益 2 × 0.25 = 0.5 × 声像 0.707（${peak(r2.L, sec(0.1), sec(0.9))}）`);
    assert(Math.abs(s.position - 1.7) < 1e-6, "续放了 1.2 秒");
  });
  it("块轨起放 10 ms 淡入、范围尾 30 ms 淡出，不是硬切", async () => {
    const { s } = await studio();
    s.handle({ type: "chunk", key: "K", sr: SR, samples: flat(3, 0.5) });
    s.handle({ type: "timeline", tl: tl([clipTrack("v", "K", 0, 3)], { from: 0, to: 1 }) });
    s.handle({ type: "play" });
    const r = run(s, 1.2), lat = s.latency;
    assert(Math.abs(r.L[lat + 1]) < 0.1 && Math.abs(r.L[lat + Math.round(0.02 * SR)] - 0.5 * PAN0) < 1e-3, "淡入");
    const tailPk = peak(r.L, sec(1) + lat + sec(0.01), sec(1) + lat + sec(0.02));
    assert(tailPk > 0.03 && tailPk < 0.5 * PAN0, `范围尾淡出中（${tailPk}）`);
  });
});

describe("录音房：从某一段放（起点提前给辅音）不带出前一段的音（v0.10.3）", () => {
  // user 2026-10-10「为什么从sheet C播放的时候会带前一个音，也不知道是sheet B的还是stop的时候没弄干净」：起点 1.0（C 段开头），起放在 0.9（PRE_ROLL）
  const first = async (tracks: TrackSpec[], quiet?: number, chunk?: string) => {
    const { s } = await studio(); if (chunk) s.handle({ type: "chunk", key: chunk, sr: SR, samples: flat(3, 0.5) });
    s.handle({ type: "timeline", tl: tl(tracks, { from: 0, to: 3 }) }); s.handle({ type: "play", at: 0.9, ...(quiet !== undefined ? { quiet } : {}) });
    return peak(run(s, 0.08).L);   // 起点之前那一截（0.9 → 0.98）
  };
  it("前一段最后一个音（到 1.0 结束）：带起点 = 不追、不响；不带 = 照旧追（对照）", async () => {
    eq(await first([sfTrack("b", [{ t0: 0, t1: 1.0, key: 60 }])], 1.0), 0, "带起点");
    assert((await first([sfTrack("b", [{ t0: 0, t1: 1.0, key: 60 }])])) > 0.01, "不带起点 = 追上了（原来的样子）");
  });
  it("跨过起点的音（连线连进来 / 长音）照样追", async () => {
    assert((await first([sfTrack("x", [{ t0: 0.5, t1: 1.5, key: 60 }])], 1.0)) > 0.01);
  });
  it("月读：唱完在起点之前的块（带收尾余音）不放；唱到起点之后的照放", async () => {
    eq(await first([{ id: "v", kind: "clips", clips: [{ key: "K", t0: 0.2, dur: 1.4, gain: 1, end: 1.0 }], gain: null }], 1.0, "K"), 0, "前一句");
    assert((await first([{ id: "v", kind: "clips", clips: [{ key: "K", t0: 0.2, dur: 1.4, gain: 1, end: 1.2 }], gain: null }], 1.0, "K")) > 0.1, "跨过起点的一句");
  });
});

describe("录音房：通道 / 表情曲线 / 总轨", () => {
  const prep = async (ch: Parameters<Studio["handle"]>[0][] = []) => {
    const { s, out } = await studio();
    s.handle({ type: "chunk", key: "A", sr: SR, samples: flat(2, 0.4) });
    s.handle({ type: "timeline", tl: tl([clipTrack("a", "A", 0, 2), clipTrack("b", "none", 0, 0)], { from: 0, to: 2 }) });   // b = 空轨（独奏它 = a 不出声）
    for (const m of ch) s.handle(m);
    s.handle({ type: "play" });
    return { s, out, r: run(s, 1) };
  };
  it("推子 −6 dB、声像右 = 左 0 右 ×0.5", async () => {
    const { r } = await prep([{ type: "channel", id: "a", p: { gainDb: -6.0206, pan: 1 } }]);
    assert(peak(r.L, sec(0.5), sec(0.9)) < 1e-6, "左边没有"); assert(Math.abs(peak(r.R, sec(0.5), sec(0.9)) - 0.2) < 2e-3, "右边 0.4 × 0.5");
  });
  it("静音 = 不出声；别的轨独奏 = 这轨不出声；没有独奏 = 照出", async () => {
    eq(peak((await prep([{ type: "channel", id: "a", p: { mute: true } }])).r.L), 0);
    eq(peak((await prep([{ type: "channel", id: "b", p: { solo: true } }])).r.L), 0);
    assert(Math.abs(peak((await prep()).r.L, sec(0.5), sec(0.9)) - 0.4 * PAN0) < 1e-3);
  });
  it("表情曲线（dB 段）播放时乘：−20 dB = ×0.1", async () => {
    const { s } = await studio();
    s.handle({ type: "chunk", key: "A", sr: SR, samples: flat(2, 0.4) });
    s.handle({ type: "timeline", tl: tl([clipTrack("a", "A", 0, 2, 1, [{ t0: 0, t1: 1, dB: -20 }, { t0: 1, t1: 2, dB: 0 }])], { from: 0, to: 2 }) });
    s.handle({ type: "play" });
    const r = run(s, 1.5);
    assert(Math.abs(peak(r.L, sec(0.5), sec(0.9)) - 0.04 * PAN0) < 1e-3, "前半段 ×0.1"); assert(Math.abs(peak(r.L, sec(1.2), sec(1.4)) - 0.4 * PAN0) < 1e-3, "后半段 0 dB");
  });
  it("母线限幅：两块相加 1.6 → 绝不超 0.98；没超的地方逐样本不动；关掉 = 不管", async () => {
    const mk = async (limiter: boolean, loud: boolean) => {
      const { s } = await studio();
      s.handle({ type: "chunk", key: "A", sr: SR, samples: flat(1, loud ? 0.8 : 0.3) }); s.handle({ type: "chunk", key: "B", sr: SR, samples: flat(1, loud ? 0.8 : 0.3) });
      s.handle({ type: "timeline", tl: tl([clipTrack("a", "A", 0, 1), clipTrack("b", "B", 0, 1)], { from: 0, to: 1 }) });
      s.handle({ type: "master", p: { limiter } }); s.handle({ type: "play" });
      return run(s, 0.9);
    };
    const on = await mk(true, true);
    assert(peak(on.L) <= CEILING + 1e-6 && peak(on.L, sec(0.2), sec(0.8)) > 0.9, `限幅：峰 ${peak(on.L)}`);
    const off = await mk(false, true);
    assert(peak(off.L) > 1.1, "关掉 = 1.6 × 0.707 原样出去");
    const quiet = await mk(true, false);
    assert(Math.abs(peak(quiet.L, sec(0.2), sec(0.8)) - 0.6 * PAN0) < 1e-4, "没超 = 不动（0.3 + 0.3）× 0.707；块存 Int16 差一个量化步");
  });
});

describe("录音房：按键试听 + 元音采样器", () => {
  it("试听 SoundFont：不在放也出声；松开后收尾", async () => {
    const { s } = await studio();
    s.handle({ type: "audition", src: "f1", ev: "on", inst: { kind: "sf", sha: SHA, preset: 0 }, key: 60, vel: 0.8, gainDb: 0, pan: 0 });
    const r = run(s, 0.2); assert(peak(r.L) > 0.01, "按下就响");
    s.handle({ type: "audition", src: "f1", ev: "off" });
    const r2 = run(s, 2); assert(peak(r2.L, sec(1.5), sec(2)) < 0.01, "松开后收尾");
  });
  it("元音采样器：时间线上的音按表出声、试听能滑音", async () => {
    const { s } = await studio();
    const len = 2205, pcm = new Int16Array(len); for (let i = 0; i < len; i++) pcm[i] = Math.round(Math.sin((2 * Math.PI * 261.63 * i) / 22050) * 16000);
    s.handle({ type: "vowels", sr: 22050, entries: [{ kana: "ん", midi: 60, start: 0, len, loopStart: 441, loopEnd: len }], pcm });
    s.handle({ type: "timeline", tl: tl([{ id: "v", kind: "vowel", kana: "ん", notes: [{ t0: 0, t1: 0.5, key: 67, vel: 1, preset: 0 }], gain: null }], { from: 0, to: 1 }) });
    s.handle({ type: "play" });
    const r = run(s, 0.4); assert(peak(r.L, sec(0.1), sec(0.3)) > 0.3, "唱了");
    s.handle({ type: "audition", src: "a", ev: "on", inst: { kind: "vowel", kana: "ん" }, key: 60, vel: 1, gainDb: 0, pan: 0 });
    s.handle({ type: "audition", src: "a", ev: "glide", key: 62 });
    const r2 = run(s, 0.2); assert(peak(r2.L) > 0.3, "试听也响");
  });
});

describe("录音房：路由（刀 4：每轨链 / 侧链 / 发送 / 总线 / 总轨链）", () => {
  const clipS = async (specs: { id: string; v: number }[]) => {
    const { s, out } = await studio();
    for (const c of specs) s.handle({ type: "chunk", key: c.id, sr: SR, samples: flat(1, c.v) });
    s.handle({ type: "timeline", tl: tl(specs.map((c) => clipTrack(c.id, c.id, 0, 1)), { from: 0, to: 1 }) });
    return { s, out };
  };
  it("通道链：EQ 低切把 100 Hz 的轨压掉；总轨链：增益 −6 dB 整体减半", async () => {
    const { s } = await studio();
    const x = Float32Array.from({ length: SR }, (_, i) => 0.3 * Math.sin((2 * Math.PI * 100 * i) / SR));
    s.handle({ type: "chunk", key: "A", sr: SR, samples: x });
    s.handle({ type: "timeline", tl: tl([clipTrack("a", "A", 0, 1)], { from: 0, to: 1 }) });
    s.handle({ type: "channel", id: "a", p: { chain: [{ id: "e", kind: "eq", params: { hpHz: 2000 } }] } });
    s.handle({ type: "play" });
    const r = run(s, 1);
    assert(peak(r.L, sec(0.5), sec(0.9)) < 0.3 * PAN0 * 0.1, `低切后 ${peak(r.L, sec(0.5), sec(0.9))}`);
    const { s: s2 } = await clipS([{ id: "A", v: 0.4 }]);
    s2.handle({ type: "master", p: { chain: [{ id: "g", kind: "gain", params: { dB: -6.0206 } }] } }); s2.handle({ type: "play" });
    assert(Math.abs(peak(run(s2, 1).L, sec(0.5), sec(0.9)) - 0.4 * PAN0 * 0.5) < 1e-3, "总轨链 −6 dB");
  });
  it("侧链：B 轨很响时 A 轨上的压缩器（key = B）把 A 压下去；没有 key 时 A 自己很轻不压", async () => {
    const mk = async (key: string | undefined) => {
      const { s } = await clipS([{ id: "A", v: 0.05 }, { id: "B", v: 0.8 }]);
      s.handle({ type: "channel", id: "A", p: { chain: [{ id: "c", kind: "comp", params: { thresholdDb: -20, ratio: 8, attackMs: 1, releaseMs: 50, kneeDb: 0 }, ...(key ? { key } : {}) }] } });
      s.handle({ type: "channel", id: "B", p: { mute: true } });   // B 自己不出声，只当 key
      s.handle({ type: "play" }); return peak(run(s, 1).L, sec(0.5), sec(0.9));
    };
    const ducked = await mk("B"), plain = await mk(undefined);
    assert(Math.abs(plain - 0.05 * PAN0) < 1e-3, `不侧链 = 原样（${plain}）`); assert(ducked < plain * 0.3, `侧链压下去（${ducked} vs ${plain}）`);
  });
  it("发送到混响总线：块停了之后总线上还有尾巴；总线增益 / 删了总线 = 发送落空不出声", async () => {
    const { s } = await clipS([{ id: "A", v: 0.3 }]);
    s.handle({ type: "buses", buses: [{ id: "b1", gainDb: 0, pan: 0, chain: [{ id: "r", kind: "reverb", params: { room: 0.7, damp: 0.2, mix: 1, preDelayMs: 0 } }] }] });
    s.handle({ type: "channel", id: "A", p: { sends: [{ to: "b1", gainDb: 0 }] } });
    s.handle({ type: "play" });
    const r = run(s, 2.5);
    assert(peak(r.L, sec(1.3), sec(1.6)) > 1e-3, `块 1 s 就完了，1.3–1.6 s 还有混响尾巴（${peak(r.L, sec(1.3), sec(1.6))}）`);
    const { s: s2 } = await clipS([{ id: "A", v: 0.3 }]);
    s2.handle({ type: "channel", id: "A", p: { to: "nope", sends: [] } }); s2.handle({ type: "play" });
    assert(Math.abs(peak(run(s2, 1).L, sec(0.5), sec(0.9)) - 0.3 * PAN0) < 1e-3, "去向找不到的总线 = 照旧进总轨（不丢声）");
  });
  it("演奏者的链（时间线 chain）在通道链之前；两趟都确定性", async () => {
    const mk = async () => { const { s } = await clipS([{ id: "A", v: 0.4 }]); s.handle({ type: "timeline", tl: tl([{ ...clipTrack("A", "A", 0, 1), chain: [{ id: "g", kind: "gain", params: { dB: -6.0206 } }] }], { from: 0, to: 1 }) }); s.handle({ type: "play" }); return run(s, 1).L; };
    const a = await mk(), b = await mk();
    assert(Math.abs(peak(a, sec(0.5), sec(0.9)) - 0.4 * PAN0 * 0.5) < 1e-3, "演奏者链 −6 dB"); assert(same(a, b), "确定性");
  });
});
