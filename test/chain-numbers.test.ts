// 自动低切 / 跟速度这两个开关（第 16 条 16-5，统筹 2026-11-12 夜）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
//   守：两个开关登记在一处（engine/chain.ts HOST_PARAMS），有默认、没写时补、存的时候明写；开着的那一格存的时候把这一刻算出来的 Hz / 毫秒写进 hpHz / timeMs
//   （和放的时候同一份换算：歌手轨 = 这位全曲最低的音，混音轨 / 总轨 = 没有音 = 0）；读回来放的时候用的数不变（老歌听起来不变）；开关关着的格子写着的数原样。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, type Song, type Token } from "../src/score/song.ts";
import { saveMxl, openBytes, templateExtras, withTrack, withMaster, newBusId, type Extras } from "../src/format/project.ts";
import { HOST_PARAMS, autoLowCutHz, lowestMidiOf, songBpm, writeResolved, resolveChain } from "../src/engine/chain.ts";
import { mixParamsOf } from "../src/core/render.ts";
import { FX_KINDS } from "../src/engine/fx.ts";
import { fullParams } from "../src/ui/plugins.ts";
import { unzipSync, strFromU8 } from "../vendor/fflate/fflate.esm.js";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL, e: "utf8"): string };

/** 一首有音的歌：第一个声部唱 E3（最低）和 C4，速度 120。 */
function song(): Song {
  const s = initState().song, P = s.parts[0]!.id, pa = s.papers[0]!, toks = pa.tracks[P]!;
  const n = (step: "C" | "E", octave: number, id: number): Token => ({ kind: "note", id, pitch: { step, alter: 0, octave }, dur: 480, lyric: null }) as Token;
  const head = toks.map((t) => (t.kind === "tempo" ? { ...t, bpm: 120 } : t));
  return { ...s, papers: [{ ...pa, tracks: { ...pa.tracks, [P]: [...head, n("C", 4, 901), n("E", 3, 902)] } }] };
}
const eqFx = (hpAuto: number, hpHz = 0) => ({ id: "eq", kind: "eq", on: true, params: { hpAuto, hpHz } });
const dlFx = (syncBeats: number, timeMs = 375) => ({ id: "d1", kind: "delay", on: true, params: { syncBeats, timeMs } });
function setup(): { s: Song; x: Extras; bus: string } {
  const s = song(); let x = templateExtras(s); const mic = s.parts[0]!.mic, bus = newBusId(x);
  x = withTrack(x, mic, { chain: [eqFx(1, 0) as never, dlFx(0.5) as never] });
  x = withTrack(x, bus, { kind: "bus", name: "回声", chain: [eqFx(1, 77) as never, dlFx(1) as never] });
  x = withMaster(x, { chain: [eqFx(0, 55) as never, dlFx(0, 400) as never] });
  return { s, x, bus };
}
const studioOf = (b: Uint8Array) => JSON.parse(strFromU8(unzipSync(b)[".moonsinger/studio.json"]!));
const save = (s: Song, x: Extras) => saveMxl({ song: s, extras: x, app: "t", date: "2026-11-12T00:00:00.000Z" });

describe("自动低切 / 跟速度：存的时候写算出来的数（16-5）", () => {
  it("两个开关登记在一处（HOST_PARAMS）：默认关；混音台全量面板也读这一份", () => {
    eq(JSON.stringify(HOST_PARAMS.eq!.map((d) => [d.id, d.default])), JSON.stringify([["hpAuto", 0]]));
    eq(JSON.stringify(HOST_PARAMS.delay!.map((d) => [d.id, d.default])), JSON.stringify([["syncBeats", 0]]));
    assert(fullParams("eq").some((d) => d.id === "hpAuto") && fullParams("delay").some((d) => d.id === "syncBeats"), "全量面板里有");
    const src = fs.readFileSync(new URL("../src/ui/plugins.ts", import.meta.url), "utf8");
    assert(!/id:\s*"hpAuto"|id:\s*"syncBeats"/.test(src), "plugins.ts 里不再另登记一份");
  });
  it("歌手轨开着自动低切 / 跟速度：存出去 hpHz = 这位最低的音往下大三度、timeMs = 几拍 × 60000 ÷ 歌开头的速度；开关照写", () => {
    const { s, x } = setup(), mic = s.parts[0]!.mic, st = studioOf(save(s, x));
    const t = st.tracks.find((y: { id: string }) => y.id === mic), e = t.chain.find((f: { kind: string }) => f.kind === "eq"), d = t.chain.find((f: { kind: string }) => f.kind === "delay");
    eq(lowestMidiOf(s, s.parts[0]!.id), 52, "最低的音 E3"); eq(songBpm(s), 120);
    eq(`${e.params.hpAuto},${e.params.hpHz}`, `1,${autoLowCutHz(52)}`); eq(`${d.params.syncBeats},${d.params.timeMs}`, "0.5,250");
  });
  it("混音轨 / 总轨：自动低切没有音可跟 = 写 0（和放的时候一样）；跟速度照算；开关关着的格子写着的数原样", () => {
    const { s, x, bus } = setup(), st = studioOf(save(s, x));
    const b = st.tracks.find((y: { id: string }) => y.id === bus);
    eq(b.chain.find((f: { kind: string }) => f.kind === "eq").params.hpHz, 0, "混音轨的自动低切：0");
    eq(b.chain.find((f: { kind: string }) => f.kind === "delay").params.timeMs, 500, "混音轨跟速度 1 拍：500 ms");
    eq(st.master.chain.find((f: { kind: string }) => f.kind === "eq").params.hpHz, 55, "开关关着：照写");
    eq(st.master.chain.find((f: { kind: string }) => f.kind === "delay").params.timeMs, 400, "开关关着：照写");
  });
  it("没写开关的 EQ / 延迟：存的时候明写 hpAuto: 0 / syncBeats: 0（参数表的默认）", () => {
    const s = song(); let x = templateExtras(s); x = withTrack(x, s.parts[0]!.mic, { chain: [{ id: "eq", kind: "eq", params: {} } as never, { id: "d1", kind: "delay", params: {} } as never] });
    const t = studioOf(save(s, x)).tracks.find((y: { id: string }) => y.id === s.parts[0]!.mic);
    eq(`${t.chain[0].params.hpAuto},${t.chain[1].params.syncBeats}`, "0,0");
  });
  it("读回来：放的时候用的数和存之前一样（老歌听起来不变）；再存一遍逐字节相同", () => {
    const { s, x } = setup(), b1 = save(s, x), o = openBytes("x.mxl", b1);
    // 录音房实际用的数 = 参数表默认补齐之后的（引擎 createFx 没写的取默认）；按这个比，不按文件里写了几个键比
    const eff = (c: readonly { kind: string; params: Record<string, number> }[]) => c.map((f) => ({ kind: f.kind, ...Object.fromEntries((FX_KINDS[f.kind]?.params ?? []).map((d) => [d.id, d.default])), ...f.params }));
    const pv = () => ({ muted: false, solo: false }), mix = (song: Song, extras: Extras) => { const m = mixParamsOf({ song, extras, parts: song.parts }, pv); return JSON.stringify([m.channels.map((c) => eff((c.p.chain ?? []) as never)), m.buses.map((b) => eff(b.chain as never)), eff(m.master.chain as never)]); };
    eq(mix(o.song, o.extras), mix(s, x), "录音房收到的一样");
    const b2 = save(o.song, o.extras);
    eq(strFromU8(unzipSync(b2)[".moonsinger/studio.json"]!), strFromU8(unzipSync(b1)[".moonsinger/studio.json"]!), "混音台那一份再存逐字节相同");
  });
  it("writeResolved 和 resolveChain 同一份换算：开着的格子写进去的数 = 录音房收到的数", () => {
    const ctx = { lowestMidi: 40, bpm: 96 }, ch = [eqFx(1, 0), dlFx(0.75)] as never[];
    const w = writeResolved(ch, ctx), r = resolveChain(ch, ctx), num = (c: readonly { params: Record<string, number> }[]) => `${c[0]!.params.hpHz},${c[1]!.params.timeMs}`;
    eq(num(w as never), num(r as never)); eq(num(w as never), `${autoLowCutHz(40)},${Math.round((60000 / 96) * 0.75)}`);
  });
});
