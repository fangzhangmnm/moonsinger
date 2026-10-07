// project.ts —— 一首歌 ↔ 一个 .mxl 文件（zip）。created 2026-10-07 by Claude Opus 5.5
// 数据契约草稿（ai-docs/20261007-data-contract-draft.md）§3 的目录表落地，这一版写其中一部分：
//   mimetype（第一个、不压缩）· META-INF/container.xml · score.musicxml（正本）·
//   .moonsinger/manifest.json · .moonsinger/score.json（声部的角色 / 麦克风、人插的小节线、还没写音高的音）·
//   .moonsinger/lounge/<角色 id>.json（休息室快照：角色、候选、上场的是哪个、哼的字）· .moonsinger/studio.json（录音房：麦克风）。
// 规矩（照 CatsUp 立宪）：每份扩展文件自带版本号；读到比这一版新的 = 拒开、明说（打开再存会丢东西）；
//   不认识的文件、不认识的字段（以后的版本、别的工具加的、这台设备用不了的引擎配置）读进来留着、存档时原样写回。
// 无地逃生口（user 2026-10-07「先不急着store。可以先按照无地规范导入导出做逃生口」）：这里只管字节 ↔ 歌，打开 / 存的界面在 app 里。
import { DEFAULT_ROLE, numberParts } from "../score/roles.ts";
import { zipSync, unzipSync, strToU8, strFromU8 } from "../../vendor/fflate/fflate.esm.js";
import type { Song, Hum } from "../score/song.ts";
import { writeMusicXml, readMusicXml, type ReadPart } from "./musicxml.ts";

/** 这一版能读写的各份文件的版本号。改格式 = 这里 +1 并在 src/format/migrate/ 加一条纯函数迁移（现在都是 1，还没有迁移）。 */
export const FORMAT = { manifest: 1, score: 1, lounge: 1, studio: 1 } as const;
const MIMETYPE = "application/vnd.recordare.musicxml";
const DIR = ".moonsinger/";

/** 主唱这个角色上场的是谁：月读完整版 / 月读元音版 / 都不是（别的软件存的谱，原来的乐器这一版没有 → 没人上场，人来选；不自动替补）。 */
export type Quality = "full" | "light" | "none";
type Json = Record<string, unknown>;
/** 文件里我们读进来、这一版不改动的部分（原样写回用）。新建的歌 = 空。 */
export interface Extras {
  scoreExt?: Json;
  lounge: Record<string, Json>;   // 角色 id → 那份 json（整份留着，只改认识的字段）
  studio?: Json;
  manifest?: Json;
  unknown: Record<string, Uint8Array>;   // 不认识的文件
  rootfiles: { path: string; mediaType: string }[];   // container.xml 里除主乐谱外的 rootfile（原样写回）
}
export const emptyExtras = (): Extras => ({ lounge: {}, unknown: {}, rootfiles: [] });

/** 这一版的歌（单声部）在文件里的样子：声部 P1 → 角色 r1（月读）→ 麦克风 m1。 */
const PART = "P1", ROLE = "r1", MIC = "m1";
const CAND = { full: "c1", light: "c2" } as const;
function defaultRole(hum: Hum, quality: Exclude<Quality, "none">): Json {
  return { version: FORMAT.lounge, id: ROLE, name: DEFAULT_ROLE.name, sound: DEFAULT_ROLE.sound, active: CAND[quality], candidates: [
    { id: CAND.full, name: "月读", gm: { program: 55, variant: "tsukuyomi" }, hum, calibrationDb: 0, chain: [], engines: {} },
    { id: CAND.light, name: "月读（元音）", gm: { program: 55, variant: "tsukuyomi-vowels" }, hum, calibrationDb: 0, chain: [], engines: {} },
  ] };
}

export interface SaveArgs { song: Song; hum: Hum; quality: Quality; extras: Extras; app: string; date: string }   // 歌名 = song.title（可不填）
/** 歌 → .mxl 的字节。 */
export function saveMxl(a: SaveArgs): Uint8Array {
  const role: Json = structuredClone(a.extras.lounge[ROLE] ?? defaultRole(a.hum, a.quality === "none" ? "full" : a.quality));
  if (a.quality !== "none") role.active = CAND[a.quality];   // none = 原来那位（这一版没有的乐器）还是上场的那个，原样写回
  const cands = (role.candidates as Json[] | undefined) ?? [];
  for (const c of cands) if (c.id === CAND.full || c.id === CAND.light) c.hum = a.hum;
  const active = cands.find((c) => c.id === role.active);
  const studio: Json = structuredClone(a.extras.studio ?? { version: FORMAT.studio, mics: [{ id: MIC, name: "麦克风 1", gainDb: 0, pan: 0 }] });
  const mic = ((studio.mics as Json[] | undefined) ?? [])[0];
  const w = writeMusicXml(a.song, {
    id: PART, name: partLabels({ ...a.extras, lounge: { ...a.extras.lounge, [ROLE]: role } })[0], instrumentName: String(active?.name ?? "月读"), sound: String(role.sound ?? DEFAULT_ROLE.sound),
    program: Number((active?.gm as Json | undefined)?.program ?? 55),
    variant: typeof (active?.gm as Json | undefined)?.variant === "string" ? { library: "MoonSinger", name: String((active!.gm as Json).variant) } : undefined,
    pan: mic ? Math.round(Number(mic.pan ?? 0) * 90) : undefined,
  }, { software: `MoonSinger ${a.app}`, date: a.date });
  const scoreExt: Json = { ...(a.extras.scoreExt ?? {}), version: FORMAT.score,
    parts: [{ id: PART, role: ROLE, mic: MIC }], manualBars: { [PART]: w.manualBars }, unwritten: w.unwritten };
  const files: Record<string, Uint8Array> = {};
  const lounge: Record<string, Json> = { ...a.extras.lounge, [ROLE]: role };
  const manifest: Json = { ...(a.extras.manifest ?? {}), format: "moonsinger", version: FORMAT.manifest, app: a.app, saved: a.date,
    files: { "score.json": FORMAT.score, "studio.json": FORMAT.studio, ...Object.fromEntries(Object.entries(lounge).map(([id, r]) => [`lounge/${id}.json`, Number(r.version ?? 1)])) } };
  const json = (o: unknown) => strToU8(JSON.stringify(o, null, 2) + "\n");
  const rootfiles = [`<rootfile full-path="score.musicxml" media-type="application/vnd.recordare.musicxml+xml"/>`,
    ...a.extras.rootfiles.map((r) => `<rootfile full-path="${r.path}" media-type="${r.mediaType}"/>`)].join("\n    ");
  files["mimetype"] = strToU8(MIMETYPE);
  files["META-INF/container.xml"] = strToU8(`<?xml version="1.0" encoding="UTF-8"?>\n<container>\n  <rootfiles>\n    ${rootfiles}\n  </rootfiles>\n</container>\n`);
  files["score.musicxml"] = strToU8(w.xml);
  files[`${DIR}manifest.json`] = json(manifest);
  files[`${DIR}score.json`] = json(scoreExt);
  for (const [id, r] of Object.entries(lounge)) files[`${DIR}lounge/${id}.json`] = json(r);
  files[`${DIR}studio.json`] = json(studio);
  for (const [path, bytes] of Object.entries(a.extras.unknown)) if (!(path in files)) files[path] = bytes;
  const entries: Record<string, [Uint8Array, { level: 0 | 6 }]> = {};
  for (const [path, bytes] of Object.entries(files)) entries[path] = [bytes, { level: path === "mimetype" ? 0 : 6 }];   // mimetype 必须第一个、不压缩（插入顺序 = zip 里的顺序）
  return zipSync(entries);
}

/** stem = 打开的文件叫什么（去掉扩展名；文件名和歌名分开：歌名在 song.title，可不填）。 */
export interface Opened { song: Song; stem: string; hum: Hum; quality: Quality; extras: Extras; ours: boolean; notices: string[] }

/** 字节 → 歌。认 .mxl（zip）和不压缩的 .musicxml / .xml。读不了 = 抛错（错误文字直接给人看）。 */
/** 这个声部的角色名 = 谱前写的、MusicXML 的 <part-name>（user「谱上面显示的不应跟是月读，而是人声，女声 lead bass violin之类功能的东西，
 *  还记得之前说的给role assign 乐器的逻辑吗？…不然的话你fl studio一个乱七八糟的插件，月读会变成c:/apps/…/月度_v1.0_绿色破解版.dll 这个就是我那个窄接口要拦的」）。
 *  乐器（候选）的名字不上谱。 */
export function roleName(extras: Extras): string { return String(extras.lounge[ROLE]?.name ?? DEFAULT_ROLE.name); }
/** 这个声部是什么（MusicXML 官方 <instrument-sound> id，src/score/roles.ts；user「角色名可以和xml的乐器 功能语义对齐，用最官方的正规的」）。 */
export function roleSound(extras: Extras): string { return String(extras.lounge[ROLE]?.sound ?? DEFAULT_ROLE.sound); }
/** 各声部谱上写的名字（同名同种的带号，src/score/roles.ts numberParts）；现在只有一个声部。 */
export function partLabels(extras: Extras): string[] { return numberParts([{ name: roleName(extras), sound: roleSound(extras) }]); }
/** 改角色名（选了预设 = 连官方 id 一起改；自己写的名字 = 官方 id 不变）。还没有角色快照 = 先按默认的建一份。 */
export function withRoleName(extras: Extras, name: string, hum: Hum, quality: Quality, sound?: string): Extras {
  const role = structuredClone(extras.lounge[ROLE] ?? defaultRole(hum, quality === "none" ? "full" : quality));
  role.name = name;
  if (sound) role.sound = sound;
  return { ...extras, lounge: { ...extras.lounge, [ROLE]: role } };
}
/** 现在上场的候选（乐器）叫什么——只给角色卡里看，不上谱。 */
export function activeCandidateName(extras: Extras): string | null {
  const role = extras.lounge[ROLE]; if (!role) return null;
  const c = ((role.candidates as Json[] | undefined) ?? []).find((x) => x.id === role.active);
  return c ? String(c.name ?? "") : null;
}
export function openBytes(name: string, bytes: Uint8Array): Opened {
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (!isZip) {   // 不压缩的 MusicXML：只有谱
    const r = readMusicXml(new TextDecoder().decode(bytes));
    return finish(r, emptyExtras(), false, name);
  }
  let files: Record<string, Uint8Array>;
  try { files = unzipSync(bytes); } catch (e) { throw new Error(`这个文件解不开（不是完整的 .mxl？）：${(e as Error).message}`); }
  const container = files["META-INF/container.xml"];
  if (!container) throw new Error("这个压缩包里没有 META-INF/container.xml，不是 .mxl");
  const paths = [...strFromU8(container).matchAll(/<rootfile\b[^>]*full-path="([^"]+)"[^>]*?(?:media-type="([^"]*)")?[^>]*\/?>/g)].map((m) => ({ path: m[1], mediaType: m[2] ?? "" }));
  const main = paths[0]?.path;
  if (!main || !files[main]) throw new Error("container.xml 指的主乐谱在包里找不到");
  const extras = emptyExtras();
  extras.rootfiles = paths.slice(1);
  const known = new Set(["mimetype", "META-INF/container.xml", main]);
  const manifestBytes = files[`${DIR}manifest.json`];
  const ours = !!manifestBytes;
  let hints: { manualBars?: number[]; unwritten?: string[] } | undefined;
  if (ours) {
    const parse = (p: string): Json => { try { return JSON.parse(strFromU8(files[p])) as Json; } catch { throw new Error(`${p} 读不懂（文件坏了？）`); } };
    const manifest = parse(`${DIR}manifest.json`); known.add(`${DIR}manifest.json`);
    const newer = (what: string, v: unknown, mine: number) => { if (Number(v) > mine) throw new Error(`这首歌是更新版本的 MoonSinger 存的（${what} 第 ${v} 版，这一版只认到第 ${mine} 版），打开再存会丢东西，所以没有打开。请先更新 app。`); };
    newer("总目录", manifest.version, FORMAT.manifest);
    extras.manifest = manifest;
    if (files[`${DIR}score.json`]) {
      const s = parse(`${DIR}score.json`); known.add(`${DIR}score.json`); newer("谱的扩展", s.version, FORMAT.score);
      extras.scoreExt = s;
      const part = ((s.parts as Json[] | undefined) ?? [])[0];
      const pid = String(part?.id ?? PART);
      hints = { manualBars: ((s.manualBars as Record<string, number[]> | undefined) ?? {})[pid] ?? [], unwritten: (s.unwritten as string[] | undefined) ?? [] };
    }
    for (const p of Object.keys(files)) {
      const m = /^\.moonsinger\/lounge\/([^/]+)\.json$/.exec(p);
      if (m) { const r = parse(p); newer(`休息室「${r.name ?? m[1]}」`, r.version, FORMAT.lounge); extras.lounge[m[1]] = r; known.add(p); }
    }
    if (files[`${DIR}studio.json`]) { const s = parse(`${DIR}studio.json`); known.add(`${DIR}studio.json`); newer("录音房", s.version, FORMAT.studio); extras.studio = s; }
  }
  for (const [p, b] of Object.entries(files)) if (!known.has(p) && !p.endsWith("/")) extras.unknown[p] = b;
  const r = readMusicXml(strFromU8(files[main]), hints);
  return finish(r, extras, ours, name);
}

function finish(r: ReturnType<typeof readMusicXml>, extras: Extras, ours: boolean, name: string): Opened {
  const notices: string[] = [];
  const dropped = Object.entries(r.dropped);
  if (dropped.length) notices.push(`这份谱里有这一版还不支持的东西，没有读进来：${dropped.map(([k, n]) => `${k} ${n} 处`).join("、")}。存的时候它们不会在新文件里——要留原样，请「另存为」新文件。`);
  let hum: Hum = "n", quality: Quality = "full";
  if (!extras.lounge[ROLE] && !ours) {
    // 别的软件存的谱：声部原来的乐器记成这个角色的候选、就是它上场；这一版没有那件乐器 → 没人上场，人来选（user「不出声，报错，人类手动换」）
    const p: ReadPart | undefined = r.parts[0];
    const was = p?.instrumentName || p?.name || "原来的乐器";
    const gm = p?.program;
    const role = defaultRole("n", "full");
    role.name = p?.name || DEFAULT_ROLE.name;
    if (p?.sound) role.sound = p.sound;
    role.active = "c0";
    (role.candidates as Json[]).unshift({ id: "c0", name: was, gm: { program: gm ?? null, variant: p?.variant ?? null }, calibrationDb: 0, chain: [], engines: {} });
    extras.lounge[ROLE] = role;
    notices.push(`声部「${role.name}」原来是${was}${gm ? `（GM ${gm} 号）` : ""}；这一版没有这件乐器，所以还没人上场。要月读来唱，点谱前面的「${role.name}」，在「谁来演」选月读。`);
  }
  const role = extras.lounge[ROLE];
  if (role) {
    quality = role.active === CAND.full ? "full" : role.active === CAND.light ? "light" : "none";
    const c = ((role.candidates as Json[] | undefined) ?? []).find((x) => x.id === CAND.full);
    const h = c?.hum; if (h === "la" || h === "n" || h === "u" || h === "o" || h === "a") hum = h;
  }
  const stem = name.replace(/\.(mxl|musicxml|xml)$/i, "");
  return { song: { ...r.song, hum }, stem, hum, quality, extras, ours, notices };
}
