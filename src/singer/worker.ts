// worker.ts —— 月读在浏览器后台线程里唱：加载 piper（时长接管模型）+ 日语 / 中文前端 + WORLD + 元音图谱，调共用核心 sing-core.mjs。
// created 2026-10-06 by Claude Opus 5.5
// 家规「重资源要等用户有意图才加载」：第一次点播放才加载（约 40 MB 模型 + 24 MB 日语词典 + 图谱），之后留着复用。
// 大字节（模型 / 运行时 / 日中英词典）= 家族模型包（2026-10-07，user「持久化先做不爽的就是每次bump version都得重新下载月读」→「当然a」）：
//   @internal/model-packs 按内嵌清单（packs.gen.ts）下载、逐片 sha256、存进 Cache Storage `pwa-models`——下一次、升版本都不用重下，
//   同域名的 JustReadBooks 也用同一份（user「然后最好jrb和moonsinger只用存一份」）。模型源 = 家族模型仓的 GitHub Pages。
// JS 胶水（2026-10-07 起，user「毕业差的东西做」）：日 / 中 / 英前端、encode、onnxruntime-web 与 OpenJTalk 的胶水 = 朗读库的底层出口
//   `@internal/read-aloud/backend/piper-plus/*`（0.1.22；前端与 ort 胶水和检疫桶那份逐字节相同，ojt 胶水是同一份 C 的纯浏览器构建），打进本 worker；
//   WORLD = 自己编的 WASM，vendored 在 `vendor/world/`。元音图谱那条开发期实验路（只靠兄弟私有仓的软链才通）2026-10-14 删了：公开仓不许依赖私有仓（反弃坑红线）；要再做就走模型包。
// piper.run 的喂法照抄 third-party/piper-plus/dur-override-exp/piper-node.mjs 的 run()（逐符号相同的输入 = 浏览器 == Node 的前提）。

import { _t } from "../i18n/index.ts";
import { singCore, readingCore } from "./sing-core.mjs";
import { wrapWorld } from "./world-wrap.mjs";
import { SpeechCache } from "./speech-cache.ts";
import { openSpeechStore, type SpeechStore } from "./speech-store.ts";
import { makeEnglishFront } from "./en-front.mjs";
import type { SingLang } from "../score/lab-score.ts";
import { createPackStore, Sha256 } from "@internal/model-packs";
import { PACKS, SINGER } from "./packs.gen.ts";
import { CACHE_DBS } from "../config.ts";

export interface SingRequest { type: "sing"; id: number; score: unknown[]; text: string; tempo: number; lang: SingLang; opt?: Record<string, unknown>; breath?: boolean;
  /** true = 回 WORLD 的原样输出（不归一化、不补尾巴）：分段唱时宿主自己拼、整首最后归一化一次（2026-10-08 深夜）。 */
  raw?: boolean;
  /** 模型源，按顺序试（宿主给：同源 pwa-models/ → 设置里的来源）。不给 = 出厂默认。 */
  models?: string[];
  /** 「念」缓存的预算（字节；src/singer/speech-cache.ts）。不给 = 不动。 */
  cacheBytes?: number;
  /** 念缓存持久层（全局池，IndexedDB）的预算（字节）。不给 = 不动。 */
  diskBytes?: number;
  /** 只唱第 entry 个字（按键试听，刀 3）：按下的 midi、唱 secs 秒；回原样（raw）。 */
  only?: { entry: number; midi: number; secs: number } }
/** 只把引擎起起来（打开歌就起，不等第一句）/ 中途取消某一句（在段与段之间认：两遍 piper 之间、分析三段之间、合成前；正在跑的那一段跑完才停）。 */
export interface WarmRequest { type: "warm"; id: number; models?: string[]; diskBytes?: number }
export interface CancelRequest { type: "cancel"; id: number }
/** 念缓存持久层：看大小 / 清空（设置页）。不用起引擎。 */
export interface CacheRequest { type: "cache"; id: number; op: "info" | "clear"; diskBytes?: number }
/** 读音（歌词旁显示引擎念成什么，v0.9.34）：只注音、分音节，不唱。引擎没起来 / 中文前端没载 / 英文 = ready false（不为了看读音去下模型：重资源要等有意图）。 */
export interface ReadRequest { type: "read"; id: number; score: unknown[]; text: string; lang: SingLang }
/** 备用版（file: 双击打开）：线程是 data: 起的，origin 为 null、联不了网——要的文件（WORLD、模型包分片）由主线程经 resources.ts 读好、核过交过来（2026-11-03 家族工单 A）。 */
export interface InitRequest { type: "init"; hostFiles: boolean }
export interface FileReply { type: "file"; nid: number; bytes?: ArrayBuffer; error?: string }
export type SingReply =
  | { type: "need"; nid: number; path: string; sha256?: string }   // worker → 主线程：要一个站点里的文件（只在 hostFiles 时）
  | { type: "progress"; id: number; stage: string }
  | { type: "done"; id: number; samples: Float32Array; sr: number; ms: { load: number; sing: number; boot?: Record<string, number> };
      /** 这条 worker 现在占多少（刀 6 内存监控）：wasm = 三块 WASM 堆（ort / OpenJTalk / WORLD，只涨不落）；cache = 念缓存的字节；
       *  base = 引擎刚加载完那一刻的堆（v0.10.3：worker 自己量——原来主线程拿「第一次回话」当基线，冷启动那次还没唱、唱过的道又已经涨了，两头都不准）。 */
      mem: { wasm: number; cache: number; base?: number } }
  | { type: "error"; id: number; message: string }
  | { type: "cache"; id: number; disk: { bytes: number; entries: number; budget: number } | null }
  | { type: "read"; id: number; ready: boolean; labels: string[] | null; said: string[] };

import * as ortLib from "@internal/read-aloud/backend/piper-plus/vendor/onnxruntime-web/ort.wasm.bundle.min.mjs";
import createOjt from "@internal/read-aloud/backend/piper-plus/vendor/ojt/ojt.mjs";
import { createJaFrontend, mountDictionaryBytes } from "@internal/read-aloud/backend/piper-plus/ja-frontend.js";
import { encodeTokens } from "@internal/read-aloud/backend/piper-plus/encode.js";
import { createChineseG2p } from "@internal/read-aloud/backend/piper-plus/zh-g2p.js";
import { createEnglishG2p } from "@internal/read-aloud/backend/piper-plus/en-g2p.js";

// ── 内存监控（刀 6；user「负载和内存监控防闪退 做」）：WASM 的堆是 WebAssembly.Memory，只涨不落——在实例化那一刻把它记下来，之后随时能读 buffer.byteLength。
//   ort / OpenJTalk / WORLD 三块都经 WebAssembly.instantiate(Streaming) 起来（emscripten 的 memory 走 imports.env.memory，别的走 exports），这里一处全接住。
//   iPad / Safari 没有任何别的办法量到 worker 的内存；这是我们能算的那部分，主线程按设备预算决定放块 / 减并行 / 重开引擎 / 明说。
const wasmMems = new Set<WebAssembly.Memory>();
const captureMem = (imports: unknown, instance: unknown) => {
  for (const ns of Object.values((imports ?? {}) as Record<string, unknown>)) if (ns && typeof ns === "object") for (const v of Object.values(ns as Record<string, unknown>)) if (v instanceof WebAssembly.Memory) wasmMems.add(v);
  const ex = (instance as { exports?: Record<string, unknown> } | null)?.exports; if (ex) for (const v of Object.values(ex)) if (v instanceof WebAssembly.Memory) wasmMems.add(v);
};
{
  const WA = WebAssembly as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>;
  const inst = WA.instantiate, stream = WA.instantiateStreaming;
  WA.instantiate = async function (src: unknown, imports?: unknown) { const r = (await inst.call(WebAssembly, src, imports)) as { instance?: unknown }; captureMem(imports, r.instance ?? r); return r; };
  if (stream) WA.instantiateStreaming = async function (src: unknown, imports?: unknown) { const r = (await stream.call(WebAssembly, src, imports)) as { instance?: unknown }; captureMem(imports, r.instance); return r; };
}
const heapNow = () => { let n = 0; for (const m of wasmMems) n += m.buffer.byteLength; return n; };
/** 引擎刚加载完的堆（模型 + 日语词典 + WORLD 的起始大小；之后涨的 = 唱过的最长那一句要的，只涨不落）。 */
let baseHeap: number | undefined;
const memNow = () => ({ wasm: heapNow(), cache: speech.used, base: baseHeap });

const worldBase = () => new URL("../vendor/world/", import.meta.url);   // 相对 dist/singer-worker.mjs（只在官网 / itch 算：data: 起的线程 import.meta.url 当不了基址）

// ── 备用版：要的文件向主线程要（hostFiles；data: 起的线程联不了网）──
let hostFiles = false, needSeq = 0;
const needs = new Map<number, { ok: (b: Uint8Array) => void; fail: (e: Error) => void }>();
function hostGet(path: string, sha256?: string): Promise<Uint8Array> {
  return new Promise((ok, fail) => { const nid = ++needSeq; needs.set(nid, { ok, fail }); (self as unknown as Worker).postMessage({ type: "need", nid, path, ...(sha256 ? { sha256 } : {}) } satisfies SingReply); });
}
/** 备用版里读过的包（主线程核过 sha256 才交过来）。 */
const hostPacks = new Map<string, Blob[]>();

// ── 模型包 ──
// 模型源 = 宿主随请求给的候选列表（ADR-0006 ③：界面上能改、出厂预填；user 2026-10-07「i might worry about hardcode my gh link…」）；
// 主机只是运输，字节先对内嵌清单的哈希。没给就用出厂默认（家族模型仓，黄线区白名单 ②）。
let bases: string[] = ["https://fangzhangmnm.github.io/pwa-models"];
const store = createPackStore({ packs: PACKS });
/** 这几个包不在缓存里就下（只下这一次）；进度报给界面。 */
async function ensurePacks(slugs: string[], what: string, say: (s: string) => void): Promise<void> {
  if (hostFiles) {   // 备用版：文件夹本身就是缓存（老实脚本，主线程读、核哈希）；不下载、不进 Cache Storage
    for (const slug of slugs) {
      if (hostPacks.has(slug)) continue;
      say(_t("从文件夹读{what}", { what }));
      const blobs: Blob[] = [];
      for (const c of PACKS[slug].manifest.chunks) blobs.push(new Blob([(await hostGet(`pwa-models/packs/${slug}/${c.name}`, c.sha256)) as unknown as BlobPart]));
      hostPacks.set(slug, blobs);
    }
    return;
  }
  if ((await store.status(slugs)).every((s) => s.ready)) return;
  let last: unknown = null;
  for (const base of bases) {   // 按顺序试；已经下好的分片不重取（续传 + 逐片验，从两个来源各拿一部分也没关系）
    try { await store.download(slugs, base, (p) => say(_t("下载{what}（{e6} MB，只下这一次）{total}%", { what, e6: (p.total / 1e6).toFixed(0), total: Math.floor((p.done / p.total) * 100) }))); return; }
    catch (e) { last = e; }
  }
  throw new Error(_t("{what}下载不下来（试过 {p}）：{Error}。可以在设置里换模型来源，或从本机文件导入", { what, p: bases.join("、"), Error: (last as Error)?.message ?? last }));
}
/** 一个包核过的分片。model-packs 0.1.1 起读缓存也逐片重核 sha256（家族规则书 §1 第 7 条）：对不上 = 库已经把坏的那片作废，这里说人话、不替补。 */
async function chunksOf(slug: string): Promise<Blob[]> {
  if (hostFiles) { const b = hostPacks.get(slug); if (!b) throw new Error("pack-missing"); return b; }
  try { return await store.chunks(slug); }
  catch (e) {
    if (/^pack-corrupt/.test((e as Error)?.message ?? "")) throw new Error(_t("缓存里的小月相模型和清单对不上（被改过或坏了），坏的那一片已经丢掉：再唱一次会重新下载（{Error}）", { Error: (e as Error).message }));
    throw e;
  }
}
/** 包里的一个文件：按清单的偏移切出来，.gz 的解开（包里的压缩文件是 gzip 格式）。 */
async function packFile(slug: string, path: string): Promise<Uint8Array> {
  const files = PACKS[slug].manifest.files as { path: string; offset: number; bytes: number }[];
  const f = files.find((x) => x.path === path); if (!f) throw new Error(_t("{slug}: 包里没有 {path}", { slug, path }));
  const piece = new Blob(await chunksOf(slug)).slice(f.offset, f.offset + f.bytes);
  if (!path.endsWith(".gz")) return new Uint8Array(await piece.arrayBuffer());
  return new Uint8Array(await new Response(piece.stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
}
const packJson = async (slug: string, path: string) => JSON.parse(new TextDecoder().decode(await packFile(slug, path)));
const SR = 22050, HOP = 256;

interface Engine { piper: any; world: any; ensureZh: (say: (s: string) => void) => Promise<void>; ensureEn: (say: (s: string) => void) => Promise<void>; zhReady: () => boolean; presetDefault: Record<string, number> }
let engine: Promise<Engine> | null = null;
/** 「念」缓存（两遍 piper + WORLD 分析，只依赖歌词 / 语言 / 哼的参数；刀 2）：命中时只剩按谱重建 + 合成。预算宿主可改（cacheBytes）。 */
const speech = new SpeechCache(32e6);
/** 念缓存的持久层（全局池 `moonsinger-speech`；src/singer/speech-store.ts）。
 *  盘键里的「引擎标签」= 语音包 packId + 运行时包 packId + WORLD wasm 的 sha256（前 16 位各）+ 存法版本——发声引擎哪一块修了（换模型 / 换 ORT / 重编 WORLD）旧键自然不命中、按 LRU 走，不用手动版本号
 *  （user 2026-10-10「修了发声引擎后语音cache应该invalid，你看一下用什么版本号来invalid」）。前端（日 / 中 / 英）的改动已经在内容键里（音素 id / 韵律是键的一部分）。
 *  只有缓存**存法**变了（bf16 → 别的）才手动 bump SPEECH_FORMAT。唱法核心（重建 / 合成）在缓存之后，改它不用失效。 */
const SPEECH_DB = CACHE_DBS.speech, SPEECH_FORMAT = 1;   // 2026-11-03 起带 GUID（原 moonsinger-speech；不搬、老库空闲时由主线程探到就删）
let diskBudget = 512e6, storeP: Promise<SpeechStore | null> | null = null;
const speechStore = () => (storeP ??= (diskBudget <= 0 ? Promise.resolve<SpeechStore | null>(null) : openSpeechStore(SPEECH_DB, diskBudget)).then((st) => { st?.setBudget(diskBudget); return st; }).catch(() => null));
const hex16 = async (bytes: Uint8Array) => {   // data: 起的线程可能不给 crypto.subtle：退回 JS 那份（同一个哈希）
  try { return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes as unknown as BufferSource))].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join(""); }
  catch { return new Sha256().update(bytes).hex().slice(0, 16); }
};

let bootMs: Record<string, number> = {};   // 冷启动各段多久（刀 5；诊断用）
async function loadEngine(say: (s: string) => void): Promise<Engine> {
  const V = SINGER.voice, JA = SINGER.lang.ja;
  let tk = performance.now(); const lap = (name: string) => { const t = performance.now(); bootMs[name] = Math.round(t - tk); tk = t; };
  await ensurePacks([V, SINGER.runtime, JA], _t("小月相"), say); lap("packs");
  const store = await speechStore();   // 持久层（没有 IndexedDB = 只用内存）；引擎标签等 WORLD 的字节到手再算
  say(_t("加载 piper 引擎"));
  const ort: any = ortLib;
  ort.env.wasm.numThreads = 1; ort.env.wasm.proxy = false;
  ort.env.wasm.wasmBinary = await packFile(SINGER.runtime, "ort-wasm-simd-threaded.wasm.gz"); lap("ortWasm");
  say(_t("加载小月相的模型"));
  // 中英增强（zhen）时长接管版：全 0 = 中英增强原包（日 / 中 / 英逐样本相同，2026-10-07 实测），中 / 英按它的预设读——user「中英增强的日文是原版的，理论上我们只需要host这一个模型就行了」
  const sess = await ort.InferenceSession.create(await packFile(V, "model.onnx"), { executionProviders: ["wasm"], graphOptimizationLevel: "disabled" });
  ort.env.wasm.wasmBinary = undefined; lap("session");
  say(_t("加载日语前端"));
  // 备用版：线程是 data: 起的，胶水的 findWasmBinary() 不管给没给字节都按 import.meta.url 拼网址（data: 当不了基址）→ 给 locateFile 绕开（字节照样从包里给）
  const Module = await createOjt({ wasmBinary: await packFile(JA, "ja/ojt.wasm.gz"), print: () => {}, printErr: () => {}, ...(hostFiles ? { locateFile: (p: string) => p } : {}) });
  mountDictionaryBytes(Module, { sys: await packFile(JA, "ja/sys.dic.gz"), matrix: await packFile(JA, "ja/matrix.bin.gz"), char: await packFile(JA, "ja/char.bin.gz"), unk: await packFile(JA, "ja/unk.dic.gz") });
  const ja = createJaFrontend(Module, "/dic", { naniModel: await packJson(JA, "ja/nani-model.json.gz") }); lap("jaFrontend");
  const config = await packJson(V, "config.json");
  let zh: any = null;
  const ensureZh = async (say: (s: string) => void) => {
    if (zh) return;
    const ZH = SINGER.lang.zh;
    await ensurePacks([ZH], _t("中文前端"), say);
    zh = createChineseG2p({ single: await packJson(ZH, "zh/pinyin_single.tone3.json.gz"), phrases: await packJson(ZH, "zh/pinyin_phrases.tone3.json.gz") });
  };
  // 英文前端（朗读库同一份 en-g2p.js + CMUdict 约 3.7 MB）：第一次唱英文才加载（家规：有意图才加载重资源）
  let en: any = null;
  const ensureEn = async (say: (s: string) => void) => {
    if (en) return;
    const EN = SINGER.lang.en;
    await ensurePacks([EN], _t("英文词典"), say);
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
  const piper = speech.wrapPiper({
    SR, HOP, run,
    phonemize: (text: string) => { const r = ja.phonemize(text); return { tokens: r.tokens, prosody: r.prosody, ...encodeTokens(r.tokens, r.prosody, config.phoneme_id_map) }; },
    phonemizeZh: (text: string) => { const t = zh.phonemize(text), e = zh.encode(text, config.phoneme_id_map); return { tokens: t.tokens, prosody: t.prosody, ids: e.ids, pros: e.pros }; },
    encode: (tokens: string[], prosody: number[][]) => encodeTokens(tokens, prosody, config.phoneme_id_map),
    phonemizeEnWords: (words: string[]) => en.phonemizeWords(words),
  });
  say(_t("加载 WORLD"));
  let createWorld: (o: unknown) => Promise<unknown>, worldBytes: Uint8Array;
  if (hostFiles) {   // 备用版：胶水和 wasm 都由主线程读好交过来；胶水从 blob: 载（data: 起的线程里 import(blob:) 可用，§2.2 实测）
    const js = await hostGet("vendor/world/world.mjs"), url = URL.createObjectURL(new Blob([js as unknown as BlobPart], { type: "text/javascript" }));
    try { ({ default: createWorld } = await import(/* @vite-ignore */ url)); } finally { URL.revokeObjectURL(url); }
    worldBytes = await hostGet("vendor/world/world.wasm");
  } else {
    ({ default: createWorld } = await import(/* @vite-ignore */ new URL("world.mjs", worldBase()).href));   // emscripten 产物带 node 分支，不进打包，运行时按地址载
    const wasm = await fetch(new URL("world.wasm", worldBase())); if (!wasm.ok) throw new Error(`WORLD: HTTP ${wasm.status}`);
    worldBytes = new Uint8Array(await wasm.arrayBuffer());
  }
  if (store) speech.attachStore(store, `${PACKS[V].packId.slice(0, 16)}:${PACKS[SINGER.runtime].packId.slice(0, 16)}:w${await hex16(worldBytes)}:v${SPEECH_FORMAT}`);
  // 备用版：胶水从 blob: 载——这版 emscripten 胶水不读 wasmBinary（官网上它其实一直自己按网址取 world.wasm），只认 instantiateWasm / locateFile：字节自己实例化交给它，
  //   locateFile 让 findWasmBinary() 别按 import.meta.url 拼网址（blob: 当不了基址）。经 WebAssembly.instantiate 走 = 上面的内存登记照样记到 WORLD 的堆。
  const world = speech.wrapWorld(wrapWorld(await createWorld(hostFiles
    ? { locateFile: (p: string) => p, instantiateWasm: (imports: WebAssembly.Imports, done: (inst: WebAssembly.Instance) => void) => { void WebAssembly.instantiate(worldBytes as unknown as BufferSource, imports).then((r) => done(r.instance)); return {}; } }
    : { wasmBinary: worldBytes })));   // 「念」缓存：分析按它来自哪段 piper 输出记
  lap("world");
  baseHeap = heapNow();
  return { piper, world, ensureZh, ensureEn, zhReady: () => !!zh, presetDefault: config.preset_default ?? {} };
}

const cancelled = new Set<number>();
self.onmessage = async (ev: MessageEvent<SingRequest | WarmRequest | CancelRequest | CacheRequest | ReadRequest | InitRequest | FileReply>) => {
  const q = ev.data;
  if (q.type === "init") { hostFiles = q.hostFiles; return; }
  if (q.type === "file") { const n = needs.get(q.nid); needs.delete(q.nid); if (!n) return; if (q.bytes) n.ok(new Uint8Array(q.bytes)); else n.fail(new Error(q.error ?? _t("主线程没读到这个文件"))); return; }
  const post = (m: SingReply, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(m, transfer);
  if (q.type === "cancel") { cancelled.add(q.id); return; }
  if (q.type === "cache") {
    try { if (q.diskBytes !== undefined) { diskBudget = q.diskBytes; (await storeP)?.setBudget(diskBudget); } const st = await speechStore(); if (q.op === "clear") { await st?.clear(); speech.clear(); } post({ type: "cache", id: q.id, disk: st ? await st.info() : null }); }
    catch (err) { post({ type: "error", id: q.id, message: (err as Error)?.message ?? String(err) }); }
    return;
  }
  if (q.type === "read") {
    try {
      const e = engine ? await engine.catch(() => null) : null;
      if (!e || q.lang === "en" || (q.lang === "zh" && !e.zhReady())) { post({ type: "read", id: q.id, ready: false, labels: null, said: [] }); return; }
      post({ type: "read", id: q.id, ready: true, ...readingCore({ score: q.score, text: q.text, lang: q.lang, piper: e.piper }) });
    } catch (err) { post({ type: "error", id: q.id, message: (err as Error)?.message ?? String(err) }); }
    return;
  }
  if (q.type === "warm") {
    const say = (stage: string) => post({ type: "progress", id: q.id, stage });
    try { if (q.models?.length) bases = q.models; if (q.diskBytes !== undefined) diskBudget = q.diskBytes; if (!engine) engine = loadEngine(say).catch((e) => { engine = null; throw e; }); await engine; post({ type: "done", id: q.id, samples: new Float32Array(0), sr: SR, mem: memNow(), ms: { load: 0, sing: 0, ...(Object.keys(bootMs).length ? { boot: bootMs } : {}) } }); bootMs = {}; }
    catch (err) { post({ type: "error", id: q.id, message: (err as Error)?.message ?? String(err) }); }
    return;
  }
  if (q.type !== "sing") return;
  const say = (stage: string) => post({ type: "progress", id: q.id, stage });
  const check = () => { if (cancelled.has(q.id)) { cancelled.delete(q.id); throw new Error("cancelled"); } };
  try {
    const t0 = performance.now();
    if (q.models?.length) bases = q.models;
    if (q.cacheBytes !== undefined) speech.setBudget(q.cacheBytes);
    if (q.diskBytes !== undefined) { diskBudget = q.diskBytes; (await storeP)?.setBudget(diskBudget); }
    if (!engine) engine = loadEngine(say).catch((e) => { engine = null; throw e; });   // 起不来不缓存失败（原来缓存了被拒的 promise = 之后每次播放都报同一个错，直到重开 app）
    const e = await engine;
    if (q.lang === "zh") await e.ensureZh(say);
    if (q.lang === "en") await e.ensureEn(say);
    const t1 = performance.now();
    say(_t("小月相在唱"));
    // 元音图谱：关（user 2026-10-06「元音图谱一般般，先不做」；它那条开发期的路 2026-10-14 删了）；断气默认关（原来随图谱）
    const breath = q.breath ?? false;
    const preset = e.presetDefault[q.lang] ?? 0;   // 模型配置的 preset_default（中 3、英 9；日语没写 = 0 = 原版），同 Lab piper-node.mjs
    // 这一句自己的 piper / WORLD 视图：段与段之间报进度、认取消（sing-core 一行不动）
    let runs = 0;
    const piper = { ...e.piper, run: async (ids: number[], pros: number[][], o: Record<string, unknown>) => { check(); say(runs++ === 0 ? _t("念（1/2）") : _t("念（2/2）")); const r = await e.piper.run(ids, pros, o); check(); return r; } };
    const names: Record<string, string> = { f0: _t("分析（1/3 音高）"), sp: _t("分析（2/3 谱包络）"), ap: _t("分析（3/3 气声）"), cached: _t("分析（缓存）") };
    const world = { ...e.world, analyze: (x: ArrayLike<number>, fs: number, o?: Record<string, unknown>) => e.world.analyze(x, fs, o, { stage: (n: string) => say(names[n] ?? n), check }), synth: (a: unknown) => { check(); say(_t("合成")); return e.world.synth(a); } };
    check();   // W-37（2026-10-13）：开唱前认一次取消——拍数对不上这类检查在第一次 piper.run 之前就抛，等到检查点才认 = 一句已经取消的请求回去的是「32 sung syllables…」不是 cancelled
    const r = await singCore({ score: q.score, text: q.text, tempo: q.tempo, lang: q.lang, atlas: "off", breath, preset, piper, world, loadAtlas: null, opt: q.opt ?? {}, only: q.only ?? null });
    check();
    const samples: Float32Array = q.raw || q.only ? Float32Array.from(r.y as ArrayLike<number>) : r.sung;
    post({ type: "done", id: q.id, samples, sr: r.SR, mem: memNow(), ms: { load: t1 - t0, sing: performance.now() - t1, ...(Object.keys(bootMs).length ? { boot: bootMs } : {}) } }, [samples.buffer]); bootMs = {};
  } catch (err) {
    cancelled.delete(q.id);
    engine = engine && (await engine.catch(() => null)) ? engine : null;   // 加载失败就允许下次重试
    post({ type: "error", id: q.id, message: (err as Error)?.message ?? String(err) });
  }
};
