// 录音房核心（src/engine/studio.ts）：node 里逐块跑同一份数学。created 2026-10-09 by Claude Fable 5.1
// 守的是：确定性（同样的消息同样的采样）；从中间放把该响的音按下；范围尾 / 循环点不切尾音；块没到 = 冻住等、到了接着放；
//   通道（推子 / 声像 / 静音 / 独奏）和表情曲线播放时才乘；母线绝不超天花板、不超的地方不动；试听绕过限幅。听感归 user，这里只管数学。
import { describe, it, eq, assert } from "./runner.mjs";
import { instantiateTsf } from "../src/gm/tsf-standalone.ts";
import { Studio, BLOCK, CEILING, type StudioOut, type TimelineMsg, type TrackSpec } from "../src/engine/studio.ts";
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
    assert(Math.abs(peak(quiet.L, sec(0.2), sec(0.8)) - 0.6 * PAN0) < 1e-6, "没超 = 不动（0.3 + 0.3）× 0.707");
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
