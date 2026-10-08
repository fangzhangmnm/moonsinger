// worker.ts —— 月读在浏览器后台线程里唱：加载 piper（时长接管模型）+ 日语 / 中文前端 + WORLD + 元音图谱，调共用核心 sing-core.mjs。
// created 2026-10-06 by Claude Opus 5.5
// 家规「重资源要等用户有意图才加载」：第一次点播放才加载（约 40 MB 模型 + 24 MB 日语词典 + 图谱），之后留着复用。
// 大字节（模型 / 运行时 / 日中英词典）= 家族模型包（2026-10-07，user「持久化先做不爽的就是每次bump version都得重新下载月读」→「当然a」）：
//   @internal/model-packs 按内嵌清单（packs.gen.ts）下载、逐片 sha256、存进 Cache Storage `pwa-models`——下一次、升版本都不用重下，
//   同域名的 JustReadBooks 也用同一份（user「然后最好jrb和moonsinger只用存一份」）。模型源 = 家族模型仓的 GitHub Pages。
// JS 胶水（2026-10-07 起，user「毕业差的东西做」）：日 / 中 / 英前端、encode、onnxruntime-web 与 OpenJTalk 的胶水 = 朗读库的底层出口
//   `@internal/read-aloud/backend/piper-plus/*`（0.1.22；前端与 ort 胶水和检疫桶那份逐字节相同，ojt 胶水是同一份 C 的纯浏览器构建），打进本 worker；
//   WORLD = 自己编的 WASM，vendored 在 `vendor/world/`。`dev-assets/` 只剩开发期的元音图谱实验（默认关，出货没有）。
// piper.run 的喂法照抄 third-party/piper-plus/dur-override-exp/piper-node.mjs 的 run()（逐符号相同的输入 = 浏览器 == Node 的前提）。

import { singCore } from "./sing-core.mjs";
import { wrapWorld } from "./world-wrap.mjs";
import { wrapTsf, type SfBank } from "../gm/soundfont.ts";
import { makeEnglishFront } from "./en-front.mjs";
import type { SingLang } from "../score/lab-score.ts";
import { createPackStore } from "@internal/model-packs";
import { PACKS, SINGER } from "./packs.gen.ts";

/** GM 候选按谱出声（契约 §10：样本类音源 = 歌里嵌的 SF2 子集；引擎 TinySoundFont 随 app 发，vendor/tsf/）。
 *  sf2 只在第一次发（worker 按 sha256 缓存载好的音色库；重建 worker 后客户端再发一次）。notes 的 preset = [bank, program]（SoundFont 的 0 起编号）。 */
export interface GmRequest { type: "gm"; id: number; sha256: string; sf2?: Uint8Array; sampleRate: number; tail: number; notes: { preset: [number, number]; key: number; vel: number; t0: number; t1: number }[] }
export interface SingRequest { type: "sing"; id: number; score: unknown[]; text: string; tempo: number; lang: SingLang; opt?: Record<string, unknown>; atlas?: string; breath?: boolean;
  /** 模型源，按顺序试（宿主给：同源 pwa-models/ → 设置里的来源）。不给 = 出厂默认。 */
  models?: string[] }
export type SingReply =
  | { type: "progress"; id: number; stage: string }
  | { type: "done"; id: number; samples: Float32Array; sr: number; ms: { load: number; sing: number } }
  | { type: "error"; id: number; message: string };

import * as ortLib from "@internal/read-aloud/backend/piper-plus/vendor/onnxruntime-web/ort.wasm.bundle.min.mjs";
import createOjt from "@internal/read-aloud/backend/piper-plus/vendor/ojt/ojt.mjs";
import { createJaFrontend, mountDictionaryBytes } from "@internal/read-aloud/backend/piper-plus/ja-frontend.js";
import { encodeTokens } from "@internal/read-aloud/backend/piper-plus/encode.js";
import { createChineseG2p } from "@internal/read-aloud/backend/piper-plus/zh-g2p.js";
import { createEnglishG2p } from "@internal/read-aloud/backend/piper-plus/en-g2p.js";

const base = new URL("../dev-assets/", import.meta.url);   // 开发期：元音图谱（默认关）
const u = (p: string) => new URL(p, base).href;
async function bytes(p: string): Promise<Uint8Array> {
  const r = await fetch(u(p)); if (!r.ok) throw new Error(`${p}: HTTP ${r.status}（先跑 scripts/link-dev-assets.sh？）`);
  return new Uint8Array(await r.arrayBuffer());
}
const json = async (p: string) => JSON.parse(new TextDecoder().decode(await bytes(p)));
const WORLD = new URL("../vendor/world/", import.meta.url);   // 相对 dist/singer-worker.mjs

// ── 模型包 ──
// 模型源 = 宿主随请求给的候选列表（ADR-0006 ③：界面上能改、出厂预填；user 2026-10-07「i might worry about hardcode my gh link…」）；
// 主机只是运输，字节先对内嵌清单的哈希。没给就用出厂默认（家族模型仓，黄线区白名单 ②）。
let bases: string[] = ["https://fangzhangmnm.github.io/pwa-models"];
const store = createPackStore({ packs: PACKS });
/** 这几个包不在缓存里就下（只下这一次）；进度报给界面。 */
async function ensurePacks(slugs: string[], what: string, say: (s: string) => void): Promise<void> {
  if ((await store.status(slugs)).every((s) => s.ready)) return;
  let last: unknown = null;
  for (const base of bases) {   // 按顺序试；已经下好的分片不重取（续传 + 逐片验，从两个来源各拿一部分也没关系）
    try { await store.download(slugs, base, (p) => say(`下载${what}（${(p.total / 1e6).toFixed(0)} MB，只下这一次）${Math.floor((p.done / p.total) * 100)}%`)); return; }
    catch (e) { last = e; }
  }
  throw new Error(`${what}下载不下来（试过 ${bases.join("、")}）：${(last as Error)?.message ?? last}。可以在设置里换模型来源，或从本机文件导入`);
}
/** 包里的一个文件：按清单的偏移切出来，.gz 的解开（包里的压缩文件是 gzip 格式）。 */
async function packFile(slug: string, path: string): Promise<Uint8Array> {
  const files = PACKS[slug].manifest.files as { path: string; offset: number; bytes: number }[];
  const f = files.find((x) => x.path === path); if (!f) throw new Error(`${slug}: 包里没有 ${path}`);
  const piece = new Blob(await store.chunks(slug)).slice(f.offset, f.offset + f.bytes);
  if (!path.endsWith(".gz")) return new Uint8Array(await piece.arrayBuffer());
  return new Uint8Array(await new Response(piece.stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
}
const packJson = async (slug: string, path: string) => JSON.parse(new TextDecoder().decode(await packFile(slug, path)));
const SR = 22050, HOP = 256;

interface Engine { piper: any; world: any; loadAtlas: ((id: string) => Promise<any>) | null; hasAtlas: boolean; ensureZh: (say: (s: string) => void) => Promise<void>; ensureEn: (say: (s: string) => void) => Promise<void>; presetDefault: Record<string, number> }
let engine: Promise<Engine> | null = null;

async function loadEngine(say: (s: string) => void): Promise<Engine> {
  const V = SINGER.voice, JA = SINGER.lang.ja;
  await ensurePacks([V, SINGER.runtime, JA], "月读", say);
  say("加载 piper 引擎");
  const ort: any = ortLib;
  ort.env.wasm.numThreads = 1; ort.env.wasm.proxy = false;
  ort.env.wasm.wasmBinary = await packFile(SINGER.runtime, "ort-wasm-simd-threaded.wasm.gz");
  say("加载月读的模型");
  // 中英增强（zhen）时长接管版：全 0 = 中英增强原包（日 / 中 / 英逐样本相同，2026-10-07 实测），中 / 英按它的预设读——user「中英增强的日文是原版的，理论上我们只需要host这一个模型就行了」
  const sess = await ort.InferenceSession.create(await packFile(V, "model.onnx"), { executionProviders: ["wasm"], graphOptimizationLevel: "disabled" });
  ort.env.wasm.wasmBinary = undefined;
  say("加载日语前端");
  const Module = await createOjt({ wasmBinary: await packFile(JA, "ja/ojt.wasm.gz"), print: () => {}, printErr: () => {} });
  mountDictionaryBytes(Module, { sys: await packFile(JA, "ja/sys.dic.gz"), matrix: await packFile(JA, "ja/matrix.bin.gz"), char: await packFile(JA, "ja/char.bin.gz"), unk: await packFile(JA, "ja/unk.dic.gz") });
  const ja = createJaFrontend(Module, "/dic", { naniModel: await packJson(JA, "ja/nani-model.json.gz") });
  const config = await packJson(V, "config.json");
  let zh: any = null;
  const ensureZh = async (say: (s: string) => void) => {
    if (zh) return;
    const ZH = SINGER.lang.zh;
    await ensurePacks([ZH], "中文前端", say);
    zh = createChineseG2p({ single: await packJson(ZH, "zh/pinyin_single.tone3.json.gz"), phrases: await packJson(ZH, "zh/pinyin_phrases.tone3.json.gz") });
  };
  // 英文前端（朗读库同一份 en-g2p.js + CMUdict 约 3.7 MB）：第一次唱英文才加载（家规：有意图才加载重资源）
  let en: any = null;
  const ensureEn = async (say: (s: string) => void) => {
    if (en) return;
    const EN = SINGER.lang.en;
    await ensurePacks([EN], "英文词典", say);
    en = makeEnglishFront({ g2p: createEnglishG2p({ cmudict: await packJson(EN, "en/cmudict_data.json.gz"), homographs: await packJson(EN, "en/homographs.json.gz") }), encodeTokens, idMap: config.phoneme_id_map });
  };
  // ↓ piper-node.mjs run() 原样（feeds 的名字、类型、形状、默认值）
  async function run(ids: number[], pros: number[][], { noiseScale = 0.667, lengthScale = 1.5, noiseW = 0.5, override = null as number[] | null, lang = "ja", preset = 0 } = {}) {
    const n = ids.length, big = (v: number) => BigInt(v), lid = config.language_id_map?.[lang] ?? 0;
    const feeds: Record<string, any> = { input: new ort.Tensor("int64", BigInt64Array.from(ids, big), [1, n]), input_lengths: new ort.Tensor("int64", BigInt64Array.from([big(n)]), [1]),
      scales: new ort.Tensor("float32", Float32Array.from([noiseScale, lengthScale, noiseW]), [3]), lid: new ort.Tensor("int64", BigInt64Array.from([big(lid)]), [1]),
      prosody_features: new ort.Tensor("int64", BigInt64Array.from(pros.flat(), big), [1, n, 3]),
      speaker_embedding: new ort.Tensor("float32", new Float32Array(256), [1, 256]), speaker_embedding_mask: new ort.Tensor("int64", BigInt64Array.from([0n]), [1, 1]) };
    if (sess.inputNames.includes("preset")) feeds.preset = new ort.Tensor("int64", BigInt64Array.from([big(preset)]), [1]);
    if (sess.inputNames.includes("dur_override")) feeds.dur_override = new ort.Tensor("float32", override ? Float32Array.from(override) : new Float32Array(n), [1, n]);
    const r = await sess.run(feeds);
    return { audio: new Float32Array(r.output.data), durations: Float32Array.from(r.durations.data) };
  }
  const piper = {
    SR, HOP, run,
    phonemize: (text: string) => { const r = ja.phonemize(text); return { tokens: r.tokens, prosody: r.prosody, ...encodeTokens(r.tokens, r.prosody, config.phoneme_id_map) }; },
    phonemizeZh: (text: string) => { const t = zh.phonemize(text), e = zh.encode(text, config.phoneme_id_map); return { tokens: t.tokens, prosody: t.prosody, ids: e.ids, pros: e.pros }; },
    encode: (tokens: string[], prosody: number[][]) => encodeTokens(tokens, prosody, config.phoneme_id_map),
    phonemizeEnWords: (words: string[]) => en.phonemizeWords(words),
  };
  say("加载 WORLD");
  const { default: createWorld } = await import(/* @vite-ignore */ new URL("world.mjs", WORLD).href);   // emscripten 产物带 node 分支，不进打包，运行时按地址载
  const wasm = await fetch(new URL("world.wasm", WORLD)); if (!wasm.ok) throw new Error(`WORLD: HTTP ${wasm.status}`);
  const world = wrapWorld(await createWorld({ wasmBinary: new Uint8Array(await wasm.arrayBuffer()) }));
  const hasAtlas = (await fetch(u("atlas/atlas.json"), { method: "HEAD" })).ok;
  const loadAtlas = hasAtlas ? async (id: string) => { const meta = await json(`atlas/${id}.json`); const raw = await bytes(`atlas/${id}.f32`);
    return { ...meta, data: new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength >> 2) }; } : null;
  return { piper, world, loadAtlas, hasAtlas, ensureZh, ensureEn, presetDefault: config.preset_default ?? {} };
}

const TSF = new URL("../vendor/tsf/", import.meta.url);   // 相对 dist/singer-worker.mjs（同 WORLD 的载法）
let tsf: Promise<ReturnType<typeof wrapTsf>> | null = null;
const banks = new Map<string, SfBank>();   // sha256 → 载好的音色库（子集很小，整首歌几个）
async function renderGm(q: GmRequest): Promise<Float32Array> {
  if (!tsf) tsf = (async () => {
    const { default: createTsf } = await import(/* @vite-ignore */ new URL("tsf.mjs", TSF).href);
    const wasm = await fetch(new URL("tsf.wasm", TSF)); if (!wasm.ok) throw new Error(`TinySoundFont: HTTP ${wasm.status}`);
    return wrapTsf(await createTsf({ wasmBinary: new Uint8Array(await wasm.arrayBuffer()) }));
  })();
  const T = await tsf.catch((e) => { tsf = null; throw e; });
  let bank = banks.get(q.sha256);
  if (!bank || bank.sampleRate !== q.sampleRate) {
    if (!q.sf2) throw new Error("gm: bank not loaded");   // 客户端看到这条会带上字节重发
    bank?.close(); bank = T.load(q.sf2, q.sampleRate); banks.set(q.sha256, bank);
  }
  const b = bank;
  const notes = q.notes.map((n) => { const preset = b.presetIndex(n.preset[0], n.preset[1]); if (preset < 0) throw new Error(`gm: preset ${n.preset[0]}:${n.preset[1]} not in this bank`); return { preset, key: n.key, vel: n.vel, t0: n.t0, t1: n.t1 }; });
  return b.render(notes, q.tail);
}

self.onmessage = async (ev: MessageEvent<SingRequest | GmRequest>) => {
  const q = ev.data;
  const post = (m: SingReply, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(m, transfer);
  if (q.type === "gm") {
    try { const t0 = performance.now(), samples = await renderGm(q); post({ type: "done", id: q.id, samples, sr: q.sampleRate, ms: { load: 0, sing: performance.now() - t0 } }, [samples.buffer]); }
    catch (err) { post({ type: "error", id: q.id, message: (err as Error)?.message ?? String(err) }); }
    return;
  }
  if (q.type !== "sing") return;
  const say = (stage: string) => post({ type: "progress", id: q.id, stage });
  try {
    const t0 = performance.now();
    if (q.models?.length) bases = q.models;
    if (!engine) engine = loadEngine(say);
    const e = await engine;
    if (q.lang === "zh") await e.ensureZh(say);
    if (q.lang === "en") await e.ensureEn(say);
    const t1 = performance.now();
    say("月读在唱");
    // 元音图谱默认关（user 2026-10-06「元音图谱一般般，先不做」）；断气随图谱（和 Lab 命令行的规则一样）。要试图谱就传 atlas: "normal"。
    const atlas = q.atlas ?? "off", breath = q.breath ?? atlas !== "off";
    const preset = e.presetDefault[q.lang] ?? 0;   // 模型配置的 preset_default（中 3、英 9；日语没写 = 0 = 原版），同 Lab piper-node.mjs
    const r = await singCore({ score: q.score, text: q.text, tempo: q.tempo, lang: q.lang, atlas, breath, preset, piper: e.piper, world: e.world, loadAtlas: e.loadAtlas, opt: q.opt ?? {} });
    const samples: Float32Array = r.sung;
    post({ type: "done", id: q.id, samples, sr: r.SR, ms: { load: t1 - t0, sing: performance.now() - t1 } }, [samples.buffer]);
  } catch (err) {
    engine = engine && (await engine.catch(() => null)) ? engine : null;   // 加载失败就允许下次重试
    post({ type: "error", id: q.id, message: (err as Error)?.message ?? String(err) });
  }
};
