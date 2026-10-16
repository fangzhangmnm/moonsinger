// 无头渲染核心（src/core/render.ts + offline-studio.ts）在 node 里把冻结样本整首渲出来：不靠浏览器、不靠 worker。created 2026-10-16 by Claude Fable 5.1（W-38 ⑤）
//   守的是：核心能独立跑通（准备 → 时间线 → 混）；确定性（同样的歌同样的采样）；效果全关只管播放（mixParamsOf）；一个都放不了 = 抛。听感零（AI 不听）。
import { describe, it, eq, assert } from "./runner.mjs";
import { renderSong, mixParamsOf, audibleParts, prepareParts, timelineOf, type RenderDeps } from "../src/core/render.ts";
import { OfflineStudio } from "../src/core/offline-studio.ts";
import { sampleSong, sampleExtras } from "./fixtures/format/sample-song.ts";
import { withActive, withoutFinal, type GmCandidate } from "../src/format/project.ts";
import type { VowelTableMsg } from "../src/engine/studio-client.ts";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL): Uint8Array; readFileSync(u: URL, enc: "utf8"): string };

const wasm = fs.readFileSync(new URL("../vendor/tsf/tsf-standalone.wasm", import.meta.url));
const vowels = (): VowelTableMsg => {
  const idx = JSON.parse(fs.readFileSync(new URL("../assets/preview/vowels.json", import.meta.url), "utf8")) as { sr: number; entries: VowelTableMsg["entries"] };
  const pcm = fs.readFileSync(new URL("../assets/preview/vowels.pcm16", import.meta.url));
  return { sr: idx.sr, entries: idx.entries, pcm: new Int16Array(pcm.buffer, pcm.byteOffset, pcm.byteLength >> 1) };
};
function deps(): RenderDeps & { engine: OfflineStudio } {
  const engine = new OfflineStudio(wasm);
  let vowelsIn = false;
  return { engine, sounds: { resolveGmBytes: async (g: GmCandidate) => { if (!g.bytes) throw new Error("test: not embedded"); return g.bytes; }, ensureVowels: async () => { if (!vowelsIn) { engine.vowels(vowels()); vowelsIn = true; } } }, sing: async () => { /* 样本里没有慢引擎 */ } };
}
const peak = (a: Float32Array) => { let p = 0; for (let i = 0; i < a.length; i++) p = Math.max(p, Math.abs(a[i])); return p; };
const sum = (a: Float32Array) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s; };

describe("无头渲染核心", () => {
  it("冻结样本在 node 里整首渲出来：元音版 + 嵌进歌的 SoundFont 都出声、两次逐样本相同", async () => {
    const song = sampleSong(), extras = withoutFinal(sampleExtras(song));
    const plan = { song, extras, hum: song.hum, parts: audibleParts(song, () => ({ muted: false, solo: false })) };
    const r1 = await renderSong(plan, deps(), { sr: 22050 }), r2 = await renderSong(plan, deps(), { sr: 22050 });
    eq(r1.errors.length, 0, JSON.stringify(r1.errors));
    eq(r1.timeline.unplayable.length, 0, JSON.stringify(r1.timeline.unplayable));
    eq(r1.timeline.tracks.length, 2, "两个声部都出声");
    assert(r1.secs > 3 && r1.secs < 60, `secs=${r1.secs}`);
    assert(peak(r1.left) > 0.01 && peak(r1.right) > 0.01, "不是静音");
    eq(r1.left.length, r2.left.length); eq(sum(r1.left), sum(r2.left), "确定性（左）"); eq(sum(r1.right), sum(r2.right), "确定性（右）");
  });
  it("独奏 / 静音筛声部；一个都放不了 = 抛", async () => {
    const song = sampleSong(), extras = withoutFinal(sampleExtras(song));
    eq(audibleParts(song, (id) => ({ muted: id === "P1", solo: false })).map((p) => p.id).join(","), "P2");
    eq(audibleParts(song, (id) => ({ muted: false, solo: id === "P1" })).map((p) => p.id).join(","), "P1");
    let threw = "";
    try { await renderSong({ song, extras, hum: song.hum, parts: [] }, deps()); } catch (e) { threw = (e as Error).message; }
    assert(/没有出声/.test(threw), threw);
  });
  it("效果全关只清插件格和发送，推子 / 声像 / 出到留着", () => {
    const song = sampleSong(), extras = sampleExtras(song), pv = () => ({ muted: false, solo: false });
    const on = mixParamsOf({ song, extras, hum: song.hum, parts: song.parts }, pv), off = mixParamsOf({ song, extras, hum: song.hum, parts: song.parts, mixBypass: true }, pv);
    const m1 = on.channels.find((c) => c.id === "P1")!.p, m1off = off.channels.find((c) => c.id === "P1")!.p;
    assert((m1.chain?.length ?? 0) > 0 || (m1.sends?.length ?? 0) > 0, "样本的 m1 有链 / 发送");
    eq(m1off.chain?.length ?? 0, 0); eq(m1off.sends?.length ?? 0, 0); eq(m1off.gainDb, m1.gainDb); eq(m1off.to, m1.to);
    eq(off.buses[0].chain.length, 0); eq(off.master.chain?.length ?? 0, 0); eq(off.master.limiter, on.master.limiter);
  });
  it("准备：找不到声音 = 那个声部报错、时间线照算其余", async () => {
    const song = sampleSong(), extras = withoutFinal(sampleExtras(song)), d = deps();
    d.sounds.resolveGmBytes = async () => { throw new Error("找不到"); };
    const ex2 = withActive(extras, "r2", "c3", song.hum);   // r2 上场的 SoundFont（嵌进歌的；resolveGmBytes 先看 g.bytes——这里被我们的假实现挡了）
    const errs = await prepareParts(song.parts, ex2, d);
    assert(errs.some((e) => e.part === "P2" && /找不到/.test(e.why)), JSON.stringify(errs));
    const tl = timelineOf({ song, extras: ex2, hum: song.hum, parts: song.parts }, () => -1);
    assert(tl.tracks.some((t) => t.id === "P1"), "P1（元音版）照样出声");
  });
});
