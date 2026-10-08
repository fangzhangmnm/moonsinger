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
import { FORMAT } from "./contract.ts";   // 形状 = 契约（人读的 .h）；改格式 = FORMAT +1 + migrate + 冻结样本（守卫测试 test/format-guard.test.ts）
import { migrate } from "./migrate/index.ts";
export { FORMAT };
const MIMETYPE = "application/vnd.recordare.musicxml";
const DIR = ".moonsinger/";

/** 主唱这个角色上场的是谁：月读完整版 / 月读元音版 / GM 乐器（歌里嵌的 SF2 子集，2026-10-07 起）/ 都不是（别的软件存的谱，原来的乐器这一版没有 → 没人上场，人来选；不自动替补）。
 *  full / light 对应固定的候选 c1 / c2；gm = role.active 指着一个带 source.kind "sf2" 的候选（哪一个看 role.active）。 */
export type Quality = "full" | "light" | "gm" | "none";
type Json = Record<string, unknown>;
/** 文件里我们读进来、这一版不改动的部分（原样写回用）。新建的歌 = 空。 */
export interface Extras {
  scoreExt?: Json;
  lounge: Record<string, Json>;   // 角色 id → 那份 json（整份留着，只改认识的字段）
  studio?: Json;
  manifest?: Json;
  sounds: Record<string, Uint8Array>;    // 歌里嵌的音源字节（zip 路径 `.moonsinger/sounds/<sha256>.sf2` → 字节；契约 §10.2）；存档只写候选还引用着的
  unknown: Record<string, Uint8Array>;   // 不认识的文件
  rootfiles: { path: string; mediaType: string }[];   // container.xml 里除主乐谱外的 rootfile（原样写回）
}
export const emptyExtras = (): Extras => ({ lounge: {}, sounds: {}, unknown: {}, rootfiles: [] });
const SOUNDS = `${DIR}sounds/`;

/** 这一版的歌（单声部）在文件里的样子：声部 P1 → 角色 r1（月读）→ 麦克风 m1。 */
const PART = "P1", ROLE = "r1", MIC = "m1";
const CAND = { full: "c1", light: "c2" } as const;
/** 月读两个候选的 id（app 换「谁来演」时用）。 */
export const CANDIDATE_ID = CAND;
function defaultRole(hum: Hum, quality: "full" | "light"): Json {
  return { version: FORMAT.lounge, id: ROLE, name: DEFAULT_ROLE.name, sound: DEFAULT_ROLE.sound, active: CAND[quality], candidates: [
    { id: CAND.full, name: "月读", gm: { program: 55, variant: "tsukuyomi" }, hum, calibrationDb: 0, chain: [], engines: {} },
    { id: CAND.light, name: "月读（元音）", gm: { program: 55, variant: "tsukuyomi-vowels" }, hum, calibrationDb: 0, chain: [], engines: {} },
  ] };
}

export interface SaveArgs { song: Song; hum: Hum; quality: Quality; extras: Extras; app: string; date: string }   // 歌名 = song.title（可不填）
/** 歌 → .mxl 的字节。 */
export function saveMxl(a: SaveArgs): Uint8Array {
  const role: Json = structuredClone(a.extras.lounge[ROLE] ?? defaultRole(a.hum, a.quality === "light" ? "light" : "full"));
  if (a.quality === "full" || a.quality === "light") role.active = CAND[a.quality];   // gm = role.active 已经指着那个候选；none = 原来那位（这一版没有的乐器）还是上场的那个，原样写回
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
  // 嵌的音源：只写还有候选引用着的（换了音源 = 旧块从歌里丢掉；§10.2）
  const referenced = new Set<string>();
  for (const r of Object.values(lounge)) for (const c of ((r.candidates as Json[] | undefined) ?? [])) { const src = c.source as Json | undefined; if (src?.kind === "sf2" && typeof src.embedded === "string") referenced.add(src.embedded); }
  const sounds = Object.entries(a.extras.sounds).filter(([p]) => referenced.has(p)).sort(([x], [y]) => (x < y ? -1 : 1));
  const manifest: Json = { ...(a.extras.manifest ?? {}), format: "moonsinger", version: FORMAT.manifest, app: a.app, saved: a.date,
    files: { "score.json": FORMAT.score, "studio.json": FORMAT.studio, ...Object.fromEntries(Object.entries(lounge).map(([id, r]) => [`lounge/${id}.json`, Number(r.version ?? 1)])) },
    sounds: sounds.map(([path, b]) => ({ path, sha256: path.slice(SOUNDS.length).replace(/\.sf2$/, ""), bytes: b.length })) };
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
  for (const [path, bytes] of sounds) files[path] = bytes;
  for (const [path, bytes] of Object.entries(a.extras.unknown)) if (!(path in files)) files[path] = bytes;
  const entries: Record<string, [Uint8Array, { level: 0 | 1 | 6 }]> = {};
  for (const [path, bytes] of Object.entries(files)) entries[path] = [bytes, { level: path === "mimetype" ? 0 : path.startsWith(SOUNDS) ? 1 : 6 }];   // mimetype 必须第一个、不压缩（插入顺序 = zip 里的顺序）；采样大、压不动，level 1 省时间
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
  const role = structuredClone(extras.lounge[ROLE] ?? defaultRole(hum, quality === "light" ? "light" : "full"));
  role.name = name;
  if (sound) role.sound = sound;
  return { ...extras, lounge: { ...extras.lounge, [ROLE]: role } };
}
/** 现在上场的候选（乐器）叫什么——只给角色卡里看，不上谱。 */
export function activeCandidateName(extras: Extras): string | null {
  const c = activeCandidate(extras);
  return c ? String(c.name ?? "") : null;
}
/** 现在上场的候选（整份 json）。 */
export function activeCandidate(extras: Extras): Json | null {
  const role = extras.lounge[ROLE]; if (!role) return null;
  return ((role.candidates as Json[] | undefined) ?? []).find((x) => x.id === role.active) ?? null;
}
/** 上场的候选的 id（没有角色快照 = 默认的 c1）。 */
export function activeId(extras: Extras): string { return String(extras.lounge[ROLE]?.active ?? CAND.full); }
export interface GmCandidate { id: string; name: string; bank: number; program: number; path: string; bytes: Uint8Array | null }   // bytes = null：歌里说有这块、文件里却没有
/** 角色的 GM 候选们（带 source.kind "sf2" 的）。 */
export function gmCandidates(extras: Extras): GmCandidate[] {
  const role = extras.lounge[ROLE]; if (!role) return [];
  return ((role.candidates as Json[] | undefined) ?? []).flatMap((c) => {
    const s = c.source as Json | undefined; if (s?.kind !== "sf2") return [];
    const path = String(s.embedded);
    return [{ id: String(c.id), name: String(c.name ?? ""), bank: Number(s.bank), program: Number(s.program), path, bytes: extras.sounds[path] ?? null }];
  });
}
/** 现在上场的 GM 候选（quality 为 gm 时）。 */
export function activeGm(extras: Extras): GmCandidate | null { const id = activeId(extras); return gmCandidates(extras).find((c) => c.id === id) ?? null; }
/** 换上场的候选（人选的；不自动）。 */
export function withActive(extras: Extras, id: string, hum: Hum): Extras {
  const role = structuredClone(extras.lounge[ROLE] ?? defaultRole(hum, "full"));
  role.active = id;
  return { ...extras, lounge: { ...extras.lounge, [ROLE]: role } };
}
export interface Sf2CandidateArgs {
  name: string; bank: number; program: number;
  subset: Uint8Array; sha256: string;                                   // 子集字节 + 它的 sha256（调用方算，crypto.subtle 是异步的）
  origin: { name: string; fileSha256: string; bytes: number; library?: string };   // 从哪个整包切的；library = 家族音源库（pwa-sounds）目录里的 id（官方货架来的才有）
  credit: { attribution: string[]; license: { name: string; url?: string; text?: string } };
}
/** 加一个 GM 候选（样本类音源 by value：子集字节进歌、候选记 source / credit / spec）并让它上场。同一份字节（同 sha256）只存一份。 */
export function withSf2Candidate(extras: Extras, c: Sf2CandidateArgs, hum: Hum): Extras {
  const role = structuredClone(extras.lounge[ROLE] ?? defaultRole(hum, "full"));
  const cands = ((role.candidates as Json[] | undefined) ?? []) as Json[];
  const n = Math.max(0, ...cands.map((x) => Number(/^c(\d+)$/.exec(String(x.id))?.[1] ?? 0))) + 1, id = `c${n}`;
  const path = `${SOUNDS}${c.sha256}.sf2`;
  cands.push({ id, name: c.name, gm: { program: c.bank === 128 ? null : c.program + 1, variant: null }, calibrationDb: 0, chain: [], engines: {},
    source: { kind: "sf2", embedded: path, bank: c.bank, program: c.program, origin: c.origin, subsetBytes: c.subset.length },
    credit: c.credit, spec: { kind: "standard", name: "SoundFont", version: "2.04" } });
  role.candidates = cands; role.active = id;
  return { ...extras, lounge: { ...extras.lounge, [ROLE]: role }, sounds: { ...extras.sounds, [path]: c.subset } };
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
    extras.manifest = migrate("manifest", manifest);
    if (files[`${DIR}score.json`]) {
      const s0 = parse(`${DIR}score.json`); known.add(`${DIR}score.json`); newer("谱的扩展", s0.version, FORMAT.score);
      const s = migrate("score", s0);
      extras.scoreExt = s;
      const part = ((s.parts as Json[] | undefined) ?? [])[0];
      const pid = String(part?.id ?? PART);
      hints = { manualBars: ((s.manualBars as Record<string, number[]> | undefined) ?? {})[pid] ?? [], unwritten: (s.unwritten as string[] | undefined) ?? [] };
    }
    for (const p of Object.keys(files)) {
      const m = /^\.moonsinger\/lounge\/([^/]+)\.json$/.exec(p);
      if (m) { const r = parse(p); newer(`休息室「${r.name ?? m[1]}」`, r.version, FORMAT.lounge); extras.lounge[m[1]] = migrate("lounge", r); known.add(p); }
    }
    if (files[`${DIR}studio.json`]) { const s = parse(`${DIR}studio.json`); known.add(`${DIR}studio.json`); newer("录音房", s.version, FORMAT.studio); extras.studio = migrate("studio", s); }
    for (const p of Object.keys(files)) if (p.startsWith(SOUNDS) && !p.endsWith("/")) { extras.sounds[p] = files[p]; known.add(p); }   // 嵌的音源字节（整份留着；存档只写还引用着的）
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
    const gm = activeGm(extras);
    quality = role.active === CAND.full ? "full" : role.active === CAND.light ? "light" : gm ? "gm" : "none";
    if (gm && !gm.bytes) {   // 歌里说这个候选的声音嵌在某个文件里，文件却不在：没人上场、不出声、报出来（§10：不静默）
      quality = "none";
      notices.push(`「${gm.name}」的声音（${gm.path}）没随这首歌一起带来，所以没人上场。点谱前面的「${role.name ?? ""}」换一个「谁来演」。`);
    }
    const c = ((role.candidates as Json[] | undefined) ?? []).find((x) => x.id === CAND.full);
    const h = c?.hum; if (h === "la" || h === "n" || h === "u" || h === "o" || h === "a") hum = h;
  }
  const stem = name.replace(/\.(mxl|musicxml|xml)$/i, "");
  return { song: { ...r.song, hum }, stem, hum, quality, extras, ours, notices };
}
