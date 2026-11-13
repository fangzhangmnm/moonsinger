// 乐手「响度」的默认只有一处（施工单第 14 条，2026-11-12）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
//   守的是：新建写进去的 / 插件报的 / 文件里没写时用的 / 别家谱进门造的乐手，都是同一个 CALIBRATION_DEFAULT_DB（= 0，满音量不加不减）；
//   老歌里明写着的数照读照写（−6 还是 −6，不换算）；出声上「没写」= 写了 0、比明写 −6 整体响 6 dB，别的一个样本都不差；
//   src 里没有哪一处在乐手的响度上默认减 6。
import { describe, it, eq, assert } from "./runner.mjs";
import { CALIBRATION_DEFAULT_DB } from "../src/format/performance.ts";
import { saveMxl, openBytes, emptyExtras, withNewRole, withCalibration, activeCalibrationDb, activeId, templateExtras, type Extras } from "../src/format/project.ts";
import { performers } from "../src/performers/index.ts";
import { renderSong, audibleParts, type RenderDeps } from "../src/core/render.ts";
import { OfflineStudio } from "../src/core/offline-studio.ts";
import { sampleSong, sampleExtras } from "./fixtures/format/sample-song.ts";
import { strToU8, strFromU8, unzipSync } from "../vendor/fflate/fflate.esm.js";
import type { GmCandidate } from "../src/format/project.ts";
import type { VowelTableMsg } from "../src/engine/studio-client.ts";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL): Uint8Array; readFileSync(u: URL, enc: "utf8"): string; readdirSync(u: URL, o: { withFileTypes: true }): { name: string; isDirectory(): boolean }[] };

type Json = Record<string, unknown>;
const cands = (ex: Extras, role: string) => ((ex.lounge[role] as Json | undefined)?.candidates ?? []) as Json[];
const save = (song: ReturnType<typeof sampleSong>, extras: Extras) => saveMxl({ song, extras, app: "test", date: "2026-11-12T00:00:00.000Z" });
/** 存出去的文件里，这个角色每位候选写着的响度（读原文，不经过 activeCalibrationDb）。 */
const written = (bytes: Uint8Array, role: string): unknown[] => {
  const z = unzipSync(bytes), f = z[`.moonsinger/lounge/${role}.json`]; if (!f) return [];
  return ((JSON.parse(strFromU8(f)) as Json).candidates as Json[]).map((c) => c.calibrationDb);
};

describe("乐手响度的默认只有一处（第 14 条）", () => {
  it("一个数：0；每个插件对每个库报的都是它", () => {
    eq(CALIBRATION_DEFAULT_DB, 0);
    for (const p of performers()) for (const lib of [null, "generaluser-gs-2.0.3", "别的库"]) eq(p.defaultCalibrationDb(lib), CALIBRATION_DEFAULT_DB, `${p.name} ${lib}`);
  });
  it("没写 = 新建写进去的 = 同一个数：新歌按模板写进去的、存出去的文件里明写的、乐手在但没写这个数时用的，都是它（第 16 条起新歌创建时就写了乐手）", () => {
    const song = sampleSong(), role = song.parts[0].role;
    const bytes = save(song, templateExtras(song));   // 新歌 = 按模板把乐手写进去
    const w = written(bytes, role); assert(w.length >= 2, `写了两位：${JSON.stringify(w)}`);
    for (const x of w) eq(x, CALIBRATION_DEFAULT_DB, "文件里明写的");
    eq(activeCalibrationDb(openBytes("x.mxl", bytes).extras, role), CALIBRATION_DEFAULT_DB, "存了再开");
    const made = withNewRole(emptyExtras(), "r7", "n");
    for (const c of cands(made, "r7")) eq(c.calibrationDb, CALIBRATION_DEFAULT_DB, `新建的 ${String(c.name)}`);
  });
  it("候选在、只是没写这个键（手改过的文件）= 同一个默认", () => {
    const ex = structuredClone(withNewRole(emptyExtras(), "r1", "n"));
    for (const c of cands(ex, "r1")) delete c.calibrationDb;
    eq(activeCalibrationDb(ex, "r1"), CALIBRATION_DEFAULT_DB);
  });
  it("别家的谱进门：造的那位「不认识的」乐手也是同一个默认", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>Flute</part-name><score-instrument id="P1-I1"><instrument-name>Flute</instrument-name></score-instrument><midi-instrument id="P1-I1"><midi-program>74</midi-program></midi-instrument></score-part></part-list>` +
      `<part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><note><pitch><step>C</step><octave>5</octave></pitch><duration>4</duration><type>whole</type></note></measure></part></score-partwise>`;
    const o = openBytes("flute.musicxml", strToU8(xml)), role = o.song.parts[0].role;
    eq(activeId(o.extras, role), "c0", "上场的是那位不认识的");
    eq(activeCalibrationDb(o.extras, role), CALIBRATION_DEFAULT_DB);
  });
  it("老歌里明写着的数照读照写（不换算）：−6 还是 −6、−3 还是 −3", () => {
    const song = sampleSong(), ex = sampleExtras(song);   // 样本：r1 明写 −3、r2（SoundFont）明写 −6
    eq(activeCalibrationDb(ex, "r1"), -3); eq(activeCalibrationDb(ex, "r2"), -6);
    const back = openBytes("x.mxl", save(song, ex)).extras;
    eq(activeCalibrationDb(back, "r1"), -3); eq(activeCalibrationDb(back, "r2"), -6);
    const c = cands(back, "r2").find((x) => x.id === activeId(back, "r2"))!; eq(c.calibrationDb, -6, "文件里写的还是 −6");
  });
  it("出声：明写 −6 和没写（= 0）只差一个整体的 6 dB，别的每个样本都对得上；没写 = 明写 0，逐样本相同", async () => {
    // 用样本的第一个声部（元音版，确定性）：它走混音轨（混响）再到总轨；样本关着限幅、总轨链只有一个增益 = 整条是线性的。
    //   第二个声部（SoundFont）在样本里不出声（选的音色样本库里没有），不拿它比。
    const wasm = fs.readFileSync(new URL("../vendor/tsf/tsf-standalone.wasm", import.meta.url));
    const vowels = (): VowelTableMsg => {
      const idx = JSON.parse(fs.readFileSync(new URL("../assets/preview/vowels.json", import.meta.url), "utf8")) as { sr: number; entries: VowelTableMsg["entries"] };
      const pcm = fs.readFileSync(new URL("../assets/preview/vowels.pcm16", import.meta.url));
      return { sr: idx.sr, entries: idx.entries, pcm: new Int16Array(pcm.buffer, pcm.byteOffset, pcm.byteLength >> 1) };
    };
    const deps = (): RenderDeps => { const engine = new OfflineStudio(wasm); let v = false;
      return { engine, sounds: { resolveGmBytes: async (g: GmCandidate) => { if (!g.bytes) throw new Error("test: not embedded"); return g.bytes; }, ensureVowels: async () => { if (!v) { engine.vowels(vowels()); v = true; } } }, sing: async () => { /* 样本里没有慢引擎 */ } } as unknown as RenderDeps; };
    const song = sampleSong(), hum = "n", minus6 = withCalibration(sampleExtras(song), "r1", -6, hum);
    const only = (extras: Extras) => ({ song, extras, hum: "n", parts: audibleParts(song, (id) => ({ muted: id !== "P1", solo: false })) });
    const unwritten = structuredClone(minus6); for (const c of cands(unwritten, "r1")) delete c.calibrationDb;
    const zero = withCalibration(minus6, "r1", 0, hum);
    const [a, b, z] = [await renderSong(only(minus6), deps(), { sr: 22050 }), await renderSong(only(unwritten), deps(), { sr: 22050 }), await renderSong(only(zero), deps(), { sr: 22050 })];
    eq(a.errors.length + b.errors.length + z.errors.length, 0, JSON.stringify([a.errors, b.errors, z.errors]));
    // 长度不比：响 6 dB 的那份混响尾巴掉到「没声了」（−80 dBFS）要晚一点，结尾还有半秒淡出（录音房 QUIET / TAIL_FADE）——只比两份都还没进尾巴的那一段
    eq(z.left.length, b.left.length, "没写 = 明写 0：一样长");
    const upto = a.left.length - Math.round(0.6 * 22050), g = 10 ** (6 / 20); let n = 0, worst = 0, same = true;
    for (const [x, y] of [[a.left, b.left], [a.right, b.right]] as const) for (let i = 0; i < upto; i++) {
      if (Math.abs(x[i]) > 1e-4) { n++; worst = Math.max(worst, Math.abs(y[i] / x[i] / g - 1)); }
    }
    for (const [x, y] of [[b.left, z.left], [b.right, z.right]] as const) for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) { same = false; break; }
    assert(n > 1000, `有声的样本够多：${n}`);
    assert(worst < 1e-3, `没写 ÷ 明写 −6 = 10^(6/20)，最差相对误差 ${worst}`);
    assert(same, "没写 = 明写 0，逐样本相同");
  });
  it("结构：src 里没有哪一处在乐手的响度上默认写负数（退场的四个名字也不在了，见 library-calibration）", () => {
    const walk = (d: string): string[] => fs.readdirSync(new URL(`../src/${d}`, import.meta.url), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}${e.name}/`) : /\.(ts|mjs)$/.test(e.name) ? [`${d}${e.name}`] : []));
    const bad: string[] = [];
    for (const f of walk("")) {
      const c = (fs.readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8")).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      if (/calibrationDb\s*\?\?\s*-\s*\d/.test(c)) bad.push(`${f}：calibrationDb 没写 = 负数`);
      if (/CALIBRATION[A-Z_]*\s*(?::\s*[A-Za-z<>,\s[\]]+)?=\s*-\s*\d/.test(c)) bad.push(`${f}：响度常数是负数`);
      if (/calibrationDb\s*:\s*-\s*\d/.test(c)) bad.push(`${f}：写死了负的 calibrationDb`);
    }
    assert(!bad.length, bad.join("；"));
  });
});
