// worker.ts —— 月读在浏览器后台线程里唱：加载 piper（时长接管模型）+ 日语 / 中文前端 + WORLD + 元音图谱，调共用核心 sing-core.mjs。
// created 2026-10-06 by Claude Opus 5.5
// 家规「重资源要等用户有意图才加载」：第一次点播放才加载（约 40 MB 模型 + 24 MB 日语词典 + 图谱），之后留着复用。
// 第三方字节从 /dev-assets/（scripts/link-dev-assets.sh 软链的检疫桶）运行时动态加载，不打进包；和 Lab 的 Node 命令行是同一批文件，
// piper.run 的喂法照抄 third-party/piper-plus/dur-override-exp/piper-node.mjs 的 run()（逐符号相同的输入 = 浏览器 == Node 的前提）。

import { singCore } from "./sing-core.mjs";
import { wrapWorld } from "./world-wrap.mjs";

export interface SingRequest { type: "sing"; id: number; score: unknown[]; text: string; tempo: number; lang: "ja" | "zh"; opt?: Record<string, number>; atlas?: string; breath?: boolean }
export type SingReply =
  | { type: "progress"; id: number; stage: string }
  | { type: "done"; id: number; samples: Float32Array; sr: number; ms: { load: number; sing: number } }
  | { type: "error"; id: number; message: string };

const base = new URL("../dev-assets/", import.meta.url);
const u = (p: string) => new URL(p, base).href;
async function bytes(p: string): Promise<Uint8Array> {
  const r = await fetch(u(p)); if (!r.ok) throw new Error(`${p}: HTTP ${r.status}（先跑 scripts/link-dev-assets.sh？）`);
  return new Uint8Array(await r.arrayBuffer());
}
const json = async (p: string) => JSON.parse(new TextDecoder().decode(await bytes(p)));
const dyn = (p: string): Promise<any> => import(/* @vite-ignore */ u(p));

const ORT = "piper-plus/work/node_modules/onnxruntime-web/dist/", PACK = "piper-plus/backend/pack/";
const SR = 22050, HOP = 256;

interface Engine { piper: any; world: any; loadAtlas: ((id: string) => Promise<any>) | null; hasAtlas: boolean; ensureZh: () => Promise<void> }
let engine: Promise<Engine> | null = null;

async function loadEngine(say: (s: string) => void): Promise<Engine> {
  say("加载 piper 引擎");
  const ort = await dyn(ORT + "ort.wasm.bundle.min.mjs");
  ort.env.wasm.numThreads = 1; ort.env.wasm.proxy = false;
  ort.env.wasm.wasmBinary = await bytes(ORT + "ort-wasm-simd-threaded.wasm");
  say("加载月读的模型（约 40 MB）");
  const sess = await ort.InferenceSession.create(await bytes("piper-plus/work/model-singing/tsukuyomi-dur-override.onnx"), { executionProviders: ["wasm"], graphOptimizationLevel: "disabled" });
  ort.env.wasm.wasmBinary = undefined;
  say("加载日语前端（词典约 24 MB）");
  const { default: createOjt } = await dyn("piper-plus/ojt/wasm/dist/ojt.mjs");
  const { createJaFrontend, mountDictionaryBytes } = await dyn("piper-plus/backend/ja-frontend.js");
  const { encodeTokens } = await dyn("piper-plus/backend/encode.js");
  const Module = await createOjt({ wasmBinary: await bytes(PACK + "ja/ojt.wasm"), print: () => {}, printErr: () => {} });
  mountDictionaryBytes(Module, { sys: await bytes(PACK + "ja/sys.dic"), matrix: await bytes(PACK + "ja/matrix.bin"), char: await bytes(PACK + "ja/char.bin"), unk: await bytes(PACK + "ja/unk.dic") });
  const ja = createJaFrontend(Module, "/dic", { naniModel: await json(PACK + "ja/nani-model.json") });
  const config = await json(PACK + "config.json");
  let zh: any = null;
  const ensureZh = async () => {
    if (zh) return;
    const { createChineseG2p } = await dyn("piper-plus/backend/zh-g2p.js");
    zh = createChineseG2p({ single: await json(PACK + "zh/pinyin_single.tone3.json"), phrases: await json(PACK + "zh/pinyin_phrases.tone3.json") });
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
  };
  say("加载 WORLD");
  const { default: createWorld } = await dyn("world/world.mjs");
  const world = wrapWorld(await createWorld({ wasmBinary: await bytes("world/world.wasm") }));
  const hasAtlas = (await fetch(u("atlas/atlas.json"), { method: "HEAD" })).ok;
  const loadAtlas = hasAtlas ? async (id: string) => { const meta = await json(`atlas/${id}.json`); const raw = await bytes(`atlas/${id}.f32`);
    return { ...meta, data: new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength >> 2) }; } : null;
  return { piper, world, loadAtlas, hasAtlas, ensureZh };
}

self.onmessage = async (ev: MessageEvent<SingRequest>) => {
  const q = ev.data; if (q.type !== "sing") return;
  const post = (m: SingReply, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(m, transfer);
  const say = (stage: string) => post({ type: "progress", id: q.id, stage });
  try {
    const t0 = performance.now();
    if (!engine) engine = loadEngine(say);
    const e = await engine;
    if (q.lang === "zh") await e.ensureZh();
    const t1 = performance.now();
    say("月读在唱");
    // Lab 命令行的默认：图谱在就开（normal），断气随图谱
    const atlas = q.atlas ?? (e.hasAtlas ? "normal" : "off"), breath = q.breath ?? atlas !== "off";
    const r = await singCore({ score: q.score, text: q.text, tempo: q.tempo, lang: q.lang, atlas, breath, piper: e.piper, world: e.world, loadAtlas: e.loadAtlas, opt: q.opt ?? {} });
    const samples: Float32Array = r.sung;
    post({ type: "done", id: q.id, samples, sr: r.SR, ms: { load: t1 - t0, sing: performance.now() - t1 } }, [samples.buffer]);
  } catch (err) {
    engine = engine && (await engine.catch(() => null)) ? engine : null;   // 加载失败就允许下次重试
    post({ type: "error", id: q.id, message: (err as Error)?.message ?? String(err) });
  }
};
