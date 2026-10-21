// 持久化守卫（CatsUp 立宪在本仓的机械执法）：写出来的键形状 = 冻结快照；写永远只写当前版；迁移链完整；每个冻结样本都能开。
// created 2026-10-07 by Claude Fable 5.1（user「数据结构你来把关」→ 把关做成机器拦：改格式不带版本号 / 迁移 / 冻结样本 = 红）。
import { describe, it, eq, assert } from "./runner.mjs";
// 仓里不装 @types/node（同 test/keys.test.ts）：node:fs 走动态 import，路径用 URL（fs 接受 URL）。
const fs = (await import("node:fs" as string)) as {
  readFileSync(u: URL, enc: "utf8"): string; readFileSync(u: URL): Uint8Array;
  readdirSync(u: URL): string[]; existsSync(u: URL): boolean;
};
import { saveMxl, openBytes, activeInstrument, contentFingerprintOf, FORMAT } from "../src/format/project.ts";
import { FORMAT_MINOR, FORMAT_PATCH } from "../src/format/contract.ts";
import { MIGRATIONS } from "../src/format/migrate/index.ts";
import { unzipSync, zipSync, strFromU8, strToU8 } from "../vendor/fflate/fflate.esm.js";
import { sampleSong, sampleView, sampleExtras, canonTokens, canonTracks, shapeOf, mergeShape } from "./fixtures/format/sample-song.ts";

const DIR = new URL("./fixtures/format/", import.meta.url);
const at = (...parts: string[]) => new URL(parts.join("/"), DIR);
const HOW = "改格式的规矩（src/format/contract.ts 头注释）：只加可选字段 → node scripts/freeze-format-sample.mjs 更新形状快照、审 diff；删 / 改字段 → FORMAT +1 + src/format/migrate/ 一条纯函数 + 旧版冻结样本保留。";
type Json = Record<string, unknown>;
const KINDS = ["manifest", "score", "lounge", "studio"] as const;
function writeNow(): Record<(typeof KINDS)[number], Json> & { loungeAll: Json[] } {
  const song = sampleSong();
  const files = unzipSync(saveMxl({ song, hum: song.hum, extras: sampleExtras(song), app: "guard", date: "2026-10-07T00:00:00.000Z", view: sampleView() }));   // 2026-10-13：样本的休息室 / 录音房把可选字段都摆上（F-18）
  const json = (p: string): Json => JSON.parse(strFromU8(files[p]));
  return { manifest: json(".moonsinger/manifest.json"), score: json(".moonsinger/score.json"), lounge: json(".moonsinger/lounge/r1.json"), studio: json(".moonsinger/studio.json"),
    loungeAll: Object.keys(files).filter((p) => /^\.moonsinger\/lounge\/r\d+\.json$/.test(p)).sort().map(json) };   // 2026-10-13：形状看所有角色的并集（第二位的乐器概念 / SoundFont 演奏者在 r2）
}

describe("持久化守卫", () => {
  it("写出来的各份 JSON 的键形状 = 冻结的形状快照（形状变了就红）", () => {
    const w = writeNow();
    const now = { versions: FORMAT, shapes: Object.fromEntries(KINDS.map((k) => [k, k === "lounge" ? w.loungeAll.map(shapeOf).reduce(mergeShape) : shapeOf(w[k])])) };
    const frozen = JSON.parse(fs.readFileSync(at("shape.json"), "utf8"));
    eq(JSON.stringify(now), JSON.stringify(frozen), `形状变了。${HOW}`);
  });
  it("写永远只写当前版：每份 version = FORMAT，manifest.files 列的版本也对", () => {
    const w = writeNow();
    for (const k of KINDS) { eq(w[k].version, FORMAT[k], `${k}.version`); eq(w[k].minor, FORMAT_MINOR[k], `${k}.minor`); eq(w[k].patch, FORMAT_PATCH[k], `${k}.patch`); }   // 三级拍子（2026-10-21）
    for (const r of w.loungeAll) { eq(r.minor, FORMAT_MINOR.lounge); eq(r.patch, FORMAT_PATCH.lounge); }
    const files = w.manifest.files as Record<string, number>;
    eq(files["score.json"], FORMAT.score); eq(files["studio.json"], FORMAT.studio); eq(files["lounge/r1.json"], FORMAT.lounge); eq(files["lounge/r2.json"], FORMAT.lounge);
    eq(files["papers/p1.musicxml"], 0); eq(files["papers/p2.musicxml"], 0);   // 标准件记 0
    eq(JSON.stringify(w.manifest.derived), JSON.stringify(["score.musicxml"]));
  });
  /** 拿当前冻结样本、改掉某份 JSON 的拍子再打包回去（别的 entry 原样）。 */
  const sampleWith = (file: string, patch: (j: Json) => Json): Uint8Array => {
    const tag = `v${Object.values(FORMAT).join("-")}`;
    const files = unzipSync(new Uint8Array(fs.readFileSync(at(tag, "sample.mxl"))));
    files[file] = strToU8(JSON.stringify(patch(JSON.parse(strFromU8(files[file]))), null, 2) + "\n");
    return zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, [v, { level: k === "mimetype" ? 0 : 6 }] as [Uint8Array, { level: 0 | 6 }]])));
  };
  it("三级拍子读取（家族格式版本纪律 2026-10-21）：minor 比自己新 = 能开 + advice 一句；patch 比自己新 = 静默；major 比自己新 = 拒开", () => {
    const o1 = openBytes("x.mxl", sampleWith(".moonsinger/score.json", (j) => ({ ...j, minor: FORMAT_MINOR.score + 1 })));
    eq(o1.advice.length, 1, "minor 更新 = 一句 advice"); assert(o1.advice[0].includes("谱的扩展"), o1.advice[0]); eq(o1.notices.length, 0, "不是报错");
    eq((o1.extras.scoreExt as Json).minor, FORMAT_MINOR.score + 1, "读进来的拍子原样留着（写出去时换成自己的）");
    const o2 = openBytes("x.mxl", sampleWith(".moonsinger/studio.json", (j) => ({ ...j, patch: FORMAT_PATCH.studio + 7 })));
    eq(o2.advice.length, 0, "patch 更新 = 静默");
    const o3 = openBytes("x.mxl", sampleWith(".moonsinger/lounge/r1.json", (j) => ({ ...j, minor: FORMAT_MINOR.lounge + 1 })));
    eq(o3.advice.length, 1); assert(o3.advice[0].includes("休息室"), o3.advice[0]);
    let threw = "";
    try { openBytes("x.mxl", sampleWith(".moonsinger/manifest.json", (j) => ({ ...j, version: FORMAT.manifest + 1 }))); } catch (e) { threw = (e as Error).message; }
    assert(/更新版本/.test(threw), `major 更新 = 拒开：${threw}`);
    // 再存：写出去的拍子是自己的（不是读进来的更高 minor）
    const files = unzipSync(saveMxl({ song: o1.song, hum: o1.hum, extras: o1.extras, app: "guard", date: "2026-10-21T00:00:00.000Z", view: null }));
    eq(JSON.parse(strFromU8(files[".moonsinger/score.json"])).minor, FORMAT_MINOR.score, "写永远只写当前拍");
  });
  it("定稿的指纹不看 minor / patch（升 minor 之后再存，定稿的歌不能被判成「内容变了」）；老样本读进来的指纹 = 这一版重新写出去的指纹", () => {
    const song = sampleSong(), extras = sampleExtras(song);
    const base = { song, hum: song.hum, extras, app: "guard", date: "2026-10-21T00:00:00.000Z", view: sampleView() };
    const fp0 = contentFingerprintOf(base);
    const bumped = { ...extras, scoreExt: { ...((extras.scoreExt ?? {}) as Json), minor: 9, patch: 9 }, studio: { ...((extras.studio ?? {}) as Json), minor: 3 }, lounge: Object.fromEntries(Object.entries(extras.lounge).map(([k, r]) => [k, { ...r, patch: 5 }])) };
    eq(contentFingerprintOf({ ...base, extras: bumped as typeof extras }), fp0, "拍子变了指纹不变");
    // 读进来再写出去：指纹相同（读侧按去掉拍子的文本算，写侧同一把尺）
    const o = openBytes("x.mxl", saveMxl(base));
    eq(contentFingerprintOf({ song: o.song, hum: o.hum, extras: o.extras, app: "guard", date: "2026-10-21T00:00:00.000Z", view: o.view }), fp0, "读写往返指纹不变");
  });
  it("score.json 不认识的顶层键原样带回（未知键直通）", () => {
    const o = openBytes("x.mxl", sampleWith(".moonsinger/score.json", (j) => ({ ...j, futureThing: { a: 1 } })));
    eq(o.advice.length, 0, "只是多了个键、拍子没变 = 不提示");
    const files = unzipSync(saveMxl({ song: o.song, hum: o.hum, extras: o.extras, app: "guard", date: "2026-10-21T00:00:00.000Z", view: null }));
    eq(JSON.stringify(JSON.parse(strFromU8(files[".moonsinger/score.json"])).futureThing), JSON.stringify({ a: 1 }), "再存还在");
  });
  it("迁移链完整：MIGRATIONS[kind].length === FORMAT[kind] - 1（升了版本没写迁移 = 红）", () => {
    for (const k of KINDS) eq(MIGRATIONS[k].length, FORMAT[k] - 1, `${k}：第 1 版升到第 ${FORMAT[k]} 版要 ${FORMAT[k] - 1} 步纯函数（src/format/migrate/index.ts）`);
  });
  it("当前 FORMAT 有冻结样本（升版本先 node scripts/freeze-format-sample.mjs；旧版目录不删）", () => {
    const tag = `v${Object.values(FORMAT).join("-")}`;
    assert(fs.existsSync(at(tag, "sample.mxl")) && fs.existsSync(at(tag, "expected.json")), `缺 test/fixtures/format/${tag}/。${HOW}`);
  });
  it("每个冻结样本都能开、读出来和冻结时一样（老文件永远能开；只拒开比 app 新的）", () => {
    const dirs = fs.readdirSync(DIR).filter((d: string) => /^v\d+(-\d+)*$/.test(d));
    assert(dirs.length >= 1, "至少一个冻结样本");
    for (const d of dirs) {
      const exp = JSON.parse(fs.readFileSync(at(d, "expected.json"), "utf8"));
      for (const k of KINDS) assert(Number(exp.versions[k]) <= FORMAT[k], `${d} 的 ${k} 比这一版新？冻结样本不该比 app 新`);
      const o = openBytes("sample.mxl", new Uint8Array(fs.readFileSync(at(d, "sample.mxl"))));
      eq(o.notices.length, 0, `${d}：自家样本不该有提示`);
      eq(JSON.stringify(canonTokens(o.song)), JSON.stringify(exp.tokens), `${d}：tokens（第一张纸第一个声部）`);
      if (exp.tracks) eq(JSON.stringify(canonTracks(o.song)), JSON.stringify(exp.tracks), `${d}：所有纸 × 声部`);   // 0.5.0 起的样本
      if (exp.papers) eq(JSON.stringify(o.song.papers.map((p) => ({ id: p.id, name: p.name }))), JSON.stringify(exp.papers), `${d}：纸`);
      if (exp.parts) eq(JSON.stringify(o.song.parts.map((p) => p.id)), JSON.stringify(exp.parts), `${d}：声部`);
      else { eq(o.song.papers.length, 1, `${d}：第 1 版文件 = 一张纸`); eq(o.song.parts.length, 1, `${d}：第 1 版文件 = 一个声部`); }
      eq(o.song.title, exp.title, `${d}：歌名`); eq(o.hum, exp.hum, `${d}：哼的字`);
      // 上场的引擎：第 1 版样本记的是 quality（full / light / none），第 2 版起记 engine
      const engine = activeInstrument(o.extras, "r1")?.engine ?? "unknown", want = exp.engine ?? ({ full: "tsukuyomi", light: "vowel-sampler", none: "unknown" } as Record<string, string>)[exp.quality];
      eq(engine, want, `${d}：上场的引擎`);
      const role = o.extras.lounge["r1"] as Json;
      eq(role.name, exp.role.name, `${d}：角色名`); eq(role.sound, exp.role.sound, `${d}：角色语义`); eq(role.active, exp.role.active, `${d}：上场候选`);
      eq(JSON.stringify((role.candidates as Json[]).map((c) => c.id)), JSON.stringify(exp.role.candidates), `${d}：候选 id`);
      eq(JSON.stringify(((o.extras.studio as Json).tracks as Json[]).filter((t) => t.kind === "mic").map((m) => m.id)), JSON.stringify(exp.mics), `${d}：麦克风 id（v2 起 = tracks 里 kind mic 的）`);
      // 读进来的都已升到这一版（migrate 链跑过）
      eq((o.extras.manifest as Json).version, FORMAT.manifest, `${d}：manifest 升到当前版`);
      eq((o.extras.scoreExt as Json).version, FORMAT.score, `${d}：score 升到当前版`);
      eq(role.version, FORMAT.lounge, `${d}：lounge 升到当前版`); eq((o.extras.studio as Json).version, FORMAT.studio, `${d}：studio 升到当前版`);
    }
  });
});
