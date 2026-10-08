// project.ts —— 一首歌 ↔ 一个 .mxl 文件（zip）。created 2026-10-07 by Claude Opus 5.5；休息室 v2（乐器按引擎分）2026-10-07 深夜 by Claude Fable 5.1
// 数据契约草稿（ai-docs/20261007-data-contract-draft.md）§3 的目录表落地，这一版写其中一部分：
//   mimetype（第一个、不压缩）· META-INF/container.xml · score.musicxml（正本）·
//   .moonsinger/manifest.json · .moonsinger/score.json（声部的角色 / 麦克风、人插的小节线、还没写音高的音）·
//   .moonsinger/lounge/<角色 id>.json（休息室快照：角色、候选（乐器按引擎分）、上场的是哪个）· .moonsinger/studio.json（录音房：麦克风）·
//   .moonsinger/sounds/<sha256>.sf2（歌里嵌的音源字节；只写还有候选引用着的）。
// 规矩（照 CatsUp 立宪）：每份扩展文件自带版本号；读到比这一版新的 = 拒开、明说（打开再存会丢东西）；
//   不认识的文件、不认识的字段（以后的版本、别的工具加的、这台设备用不了的引擎配置）读进来留着、存档时原样写回。
// 无地逃生口（user 2026-10-07「先不急着store。可以先按照无地规范导入导出做逃生口」）：这里只管字节 ↔ 歌，打开 / 存的界面在 app 里。
import { DEFAULT_ROLE, numberParts } from "../score/roles.ts";
import { zipSync, unzipSync, strToU8, strFromU8 } from "../../vendor/fflate/fflate.esm.js";
import type { Song } from "../score/song.ts";
import { writeMusicXml, readMusicXml, type ReadPart } from "./musicxml.ts";
import { FORMAT, type Hum, type InstrumentV2, type Credit, type Sf2Source } from "./contract.ts";   // 形状 = 契约（人读的 .h）；改格式 = FORMAT +1 + migrate + 冻结样本（守卫测试 test/format-guard.test.ts）
import { migrate } from "./migrate/index.ts";
import { DYNAMICS_DB, ARTICULATION, SOUNDFONT_DEFAULTS, TSUKUYOMI_DEFAULTS, TSUKUYOMI_CREDIT, TSUKUYOMI_SPEC, VOWEL_SAMPLER_SPEC, SOUNDFONT_SPEC, TSUKUYOMI_MODEL } from "./performance.ts";
export { FORMAT };
export type { Hum, InstrumentV2 };
const MIMETYPE = "application/vnd.recordare.musicxml";
const DIR = ".moonsinger/";
const SOUNDS = `${DIR}sounds/`;

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

/** 这一版的歌（单声部）在文件里的样子：声部 P1 → 角色 r1 → 麦克风 m1。 */
const PART = "P1", ROLE = "r1", MIC = "m1";
/** 新歌默认的两个候选：月读完整 / 月读元音版（轻量）。 */
export const CANDIDATE_ID = { full: "c1", light: "c2" } as const;
export type Engine = InstrumentV2["engine"];
const common = () => ({ calibrationDb: 0, chain: [] as unknown[], dynamicsDb: { ...DYNAMICS_DB }, articulation: { ...ARTICULATION } });
/** 新建角色：从 app 内置预设 by value 拷进歌（契约 §8；之后 app 升级改了预设也不影响这首歌）。 */
function defaultRole(hum: Hum): Json {
  return { version: FORMAT.lounge, id: ROLE, name: DEFAULT_ROLE.name, sound: DEFAULT_ROLE.sound, active: CANDIDATE_ID.full, candidates: [
    { id: CANDIDATE_ID.full, name: "月读", instrument: { engine: "tsukuyomi", model: { ...TSUKUYOMI_MODEL }, hum }, gm: { program: 55, variant: "tsukuyomi" }, ...common(), defaults: { ...TSUKUYOMI_DEFAULTS }, credit: structuredClone(TSUKUYOMI_CREDIT), spec: structuredClone(TSUKUYOMI_SPEC) },
    { id: CANDIDATE_ID.light, name: "月读（元音）", instrument: { engine: "vowel-sampler", table: "builtin", hum }, gm: { program: 55, variant: "tsukuyomi-vowels" }, ...common(), defaults: {}, credit: structuredClone(TSUKUYOMI_CREDIT), spec: structuredClone(VOWEL_SAMPLER_SPEC) },
  ] };
}
const cands = (role: Json | undefined): Json[] => ((role?.candidates as Json[] | undefined) ?? []);
const instrumentOf = (c: Json | null | undefined): InstrumentV2 | null => (c && c.instrument && typeof c.instrument === "object" ? (c.instrument as InstrumentV2) : null);
const isVoice = (i: InstrumentV2 | null): i is Extract<InstrumentV2, { hum: Hum }> => !!i && (i.engine === "tsukuyomi" || i.engine === "vowel-sampler");

export interface SaveArgs { song: Song; hum: Hum; extras: Extras; app: string; date: string }   // 歌名 = song.title（可不填）；hum = 编辑器里的哼的字（写进月读候选的乐器配置）
/** 歌 → .mxl 的字节。 */
export function saveMxl(a: SaveArgs): Uint8Array {
  const role: Json = structuredClone(a.extras.lounge[ROLE] ?? defaultRole(a.hum));
  for (const c of cands(role)) { const i = instrumentOf(c); if (isVoice(i)) i.hum = a.hum; }   // 哼的字 = 月读两个候选共用的一个设置
  const active = cands(role).find((c) => c.id === role.active);
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
  const referenced = referencedSounds(lounge);
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
export interface Opened { song: Song; stem: string; hum: Hum; extras: Extras; ours: boolean; notices: string[] }

// ── 角色（谱上的功能位）──────────────────────────────────────────────────────────────────
/** 这个声部的角色名 = 谱前写的、MusicXML 的 <part-name>（user「谱上面显示的不应跟是月读，而是人声，女声 lead bass violin之类功能的东西，
 *  还记得之前说的给role assign 乐器的逻辑吗？…不然的话你fl studio一个乱七八糟的插件，月读会变成c:/apps/…/月度_v1.0_绿色破解版.dll 这个就是我那个窄接口要拦的」）。
 *  乐器（候选）的名字不上谱。 */
export function roleName(extras: Extras): string { return String(extras.lounge[ROLE]?.name ?? DEFAULT_ROLE.name); }
/** 这个声部是什么（MusicXML 官方 <instrument-sound> id，src/score/roles.ts；user「角色名可以和xml的乐器 功能语义对齐，用最官方的正规的」）。 */
export function roleSound(extras: Extras): string { return String(extras.lounge[ROLE]?.sound ?? DEFAULT_ROLE.sound); }
/** 各声部谱上写的名字（同名同种的带号，src/score/roles.ts numberParts）；现在只有一个声部。 */
export function partLabels(extras: Extras): string[] { return numberParts([{ name: roleName(extras), sound: roleSound(extras) }]); }
/** 改角色名（选了预设 = 连官方 id 一起改；自己写的名字 = 官方 id 不变）。还没有角色快照 = 先按默认的建一份。 */
export function withRoleName(extras: Extras, name: string, hum: Hum, sound?: string): Extras {
  const role = structuredClone(extras.lounge[ROLE] ?? defaultRole(hum));
  role.name = name;
  if (sound) role.sound = sound;
  return { ...extras, lounge: { ...extras.lounge, [ROLE]: role } };
}

/** 角色改成某个乐器概念（找人视图里挑了）：名字 + 官方 id + id 束 by value。 */
export function withRoleConcept(extras: Extras, c: { name: string; sound: string | null; concept: NonNullable<import("./contract.ts").LoungeRoleV2["concept"]> }, hum: Hum): Extras {
  const role = structuredClone(extras.lounge[ROLE] ?? defaultRole(hum));
  role.name = c.name; if (c.sound) role.sound = c.sound; role.concept = c.concept;
  return { ...extras, lounge: { ...extras.lounge, [ROLE]: role } };
}
// ── 候选（谁来演；休息室）────────────────────────────────────────────────────────────────
export interface CandidateInfo { id: string; name: string; engine: Engine }
/** 角色的候选们（顺序 = 文件里的顺序）。 */
export function candidates(extras: Extras): CandidateInfo[] {
  return cands(extras.lounge[ROLE]).map((c) => ({ id: String(c.id), name: String(c.name ?? ""), engine: instrumentOf(c)?.engine ?? "unknown" }));
}
/** 上场的候选的 id（没有角色快照 = 默认的 c1）。 */
export function activeId(extras: Extras): string { return String(extras.lounge[ROLE]?.active ?? CANDIDATE_ID.full); }
/** 现在上场的候选（整份 json）。 */
export function activeCandidate(extras: Extras): Json | null {
  const role = extras.lounge[ROLE]; if (!role) return null;
  return cands(role).find((x) => x.id === role.active) ?? null;
}
/** 现在上场的候选（乐器）叫什么——只给角色卡里看，不上谱。 */
export function activeCandidateName(extras: Extras): string | null { const c = activeCandidate(extras); return c ? String(c.name ?? "") : null; }
/** 上场的那位的乐器（按引擎分）；没有角色快照 = 默认的月读完整版。 */
export function activeInstrument(extras: Extras): InstrumentV2 | null {
  if (!extras.lounge[ROLE]) return { engine: "tsukuyomi", model: { ...TSUKUYOMI_MODEL }, hum: "n" };
  return instrumentOf(activeCandidate(extras));
}
/** 哼的字（月读两个候选共用）；没有月读候选 = 默认「嗯」。 */
export function humOf(extras: Extras): Hum {
  for (const c of cands(extras.lounge[ROLE])) { const i = instrumentOf(c); if (isVoice(i)) return i.hum; }
  return "n";
}
/** 换上场的候选（人选的；不自动）。 */
export function withActive(extras: Extras, id: string, hum: Hum): Extras {
  const role = structuredClone(extras.lounge[ROLE] ?? defaultRole(hum));
  role.active = id;
  return { ...extras, lounge: { ...extras.lounge, [ROLE]: role } };
}

// ── SoundFont 候选（契约 §10.2：子集 by value 嵌进歌；弱引用 = 只记来源）────────────────────
export interface GmCandidate {
  id: string; name: string; bank: number; program: number;
  path: string | null;                 // 字节在歌里的路径；null = 弱引用（歌里不带声音）
  bytes: Uint8Array | null;            // 歌里带的字节；null = 弱引用，或强引用但文件里少了那块
  origin: Sf2Source["origin"];
  subsetSha256: string;                // 弱引用重新切出来时核对用
}
/** 角色的 SoundFont 候选们。 */
export function gmCandidates(extras: Extras): GmCandidate[] {
  return cands(extras.lounge[ROLE]).flatMap((c) => {
    const i = instrumentOf(c); if (i?.engine !== "soundfont") return [];
    const s = i.source;
    return [{ id: String(c.id), name: String(c.name ?? ""), bank: i.bank, program: i.program, path: s.embedded, bytes: s.embedded ? extras.sounds[s.embedded] ?? null : null, origin: s.origin, subsetSha256: s.subsetSha256 }];
  });
}
/** 现在上场的 SoundFont 候选（上场的不是它 = null）。 */
export function activeGm(extras: Extras): GmCandidate | null { const id = activeId(extras); return gmCandidates(extras).find((c) => c.id === id) ?? null; }
export interface Sf2CandidateArgs {
  name: string; bank: number; program: number;
  subset: Uint8Array; sha256: string;                                   // 子集字节 + 它的 sha256（调用方算，crypto.subtle 是异步的）
  embed?: boolean;                                                      // 默认 true = 字节进歌；false = 弱引用（只记来源 + 子集 sha256，歌里不带声音）
  origin: Sf2Source["origin"];                                          // 从哪个整包切的
  credit: Credit;
}
/** 加一个 SoundFont 候选并让它上场。同一份字节（同 sha256）只存一份。 */
export function withSf2Candidate(extras: Extras, c: Sf2CandidateArgs, hum: Hum): Extras {
  const role = structuredClone(extras.lounge[ROLE] ?? defaultRole(hum));
  const list = cands(role);
  const n = Math.max(0, ...list.map((x) => Number(/^c(\d+)$/.exec(String(x.id))?.[1] ?? 0))) + 1, id = `c${n}`;
  const embed = c.embed !== false, path = embed ? `${SOUNDS}${c.sha256}.sf2` : null;
  const instrument: InstrumentV2 = { engine: "soundfont", bank: c.bank, program: c.program, source: { embedded: path, subsetBytes: c.subset.length, subsetSha256: c.sha256, origin: c.origin } };
  list.push({ id, name: c.name, instrument, gm: { program: c.bank === 128 ? null : c.program + 1, variant: null }, ...common(), defaults: { ...SOUNDFONT_DEFAULTS }, credit: c.credit, spec: structuredClone(SOUNDFONT_SPEC) });
  role.candidates = list; role.active = id;
  return { ...extras, lounge: { ...extras.lounge, [ROLE]: role }, sounds: path ? { ...extras.sounds, [path]: c.subset } : extras.sounds };
}
/** 哪些嵌入块还有候选引用着（GC 的根 = 休息室里所有候选，不只上场的——「下线的候选留着不删」）。 */
function referencedSounds(lounge: Record<string, Json>): Set<string> {
  const refs = new Set<string>();
  for (const r of Object.values(lounge)) for (const c of cands(r)) { const i = instrumentOf(c); if (i?.engine === "soundfont" && typeof i.source?.embedded === "string") refs.add(i.source.embedded); }
  return refs;
}
/** 内存里的 GC：丢掉没人引用的嵌入块（删候选 / 换嵌入块之后立刻做，不等存档——user「需要严格的 GC」）。 */
export function pruneSounds(extras: Extras): Extras {
  const refs = referencedSounds(extras.lounge), keep = Object.entries(extras.sounds).filter(([p]) => refs.has(p));
  return keep.length === Object.keys(extras.sounds).length ? extras : { ...extras, sounds: Object.fromEntries(keep) };
}
/** 删一个候选（人删的；上场的那个不许删——先换人）。它的嵌入块没别人引用 = 一起丢。 */
export function withoutCandidate(extras: Extras, id: string): Extras {
  const role = structuredClone(extras.lounge[ROLE]); if (!role) return extras;
  if (role.active === id) throw new Error("上场的候选不能删，先换一个「谁来演」");
  role.candidates = cands(role).filter((c) => c.id !== id);
  return pruneSounds({ ...extras, lounge: { ...extras.lounge, [ROLE]: role } });
}

// ── 读 ─────────────────────────────────────────────────────────────────────────────────
/** 字节 → 歌。认 .mxl（zip）和不压缩的 .musicxml / .xml。读不了 = 抛错（错误文字直接给人看）。 */
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
  return finish(r, pruneSounds(extras), ours, name);
}

function finish(r: ReturnType<typeof readMusicXml>, extras: Extras, ours: boolean, name: string): Opened {
  const notices: string[] = [];
  const dropped = Object.entries(r.dropped);
  if (dropped.length) notices.push(`这份谱里有这一版还不支持的东西，没有读进来：${dropped.map(([k, n]) => `${k} ${n} 处`).join("、")}。存的时候它们不会在新文件里——要留原样，请「另存为」新文件。`);
  if (!extras.lounge[ROLE] && !ours) {
    // 别的软件存的谱：声部原来的乐器记成这个角色的候选（引擎 unknown）、就是它上场；这一版没有那件乐器 → 没人上场，人来选（user「不出声，报错，人类手动换」）
    const p: ReadPart | undefined = r.parts[0];
    const was = p?.instrumentName || p?.name || "原来的乐器";
    const gm = p?.program;
    const role = defaultRole("n");
    role.name = p?.name || DEFAULT_ROLE.name;
    if (p?.sound) role.sound = p.sound;
    role.active = "c0";
    cands(role).unshift({ id: "c0", name: was, instrument: { engine: "unknown", midi: { program: gm ?? null, variant: p?.variant ?? null } }, gm: { program: gm ?? null, variant: p?.variant ?? null }, ...common(), defaults: {}, credit: { attribution: [], license: { name: "unknown" } }, spec: { kind: "unknown" } });
    extras.lounge[ROLE] = role;
    notices.push(`声部「${role.name}」原来是${was}${gm ? `（GM ${gm} 号）` : ""}；这一版没有这件乐器，所以还没人上场。要月读来唱，点谱前面的「${role.name}」，在「谁来演」选月读。`);
  }
  const role = extras.lounge[ROLE];
  if (role) {
    const gm = activeGm(extras);
    if (gm && gm.path && !gm.bytes) notices.push(`「${gm.name}」的声音（${gm.path}）没随这首歌一起带来，所以没人上场。点谱前面的「${role.name ?? ""}」换一个「谁来演」。`);   // 强引用、文件里却少了那块：不静默（§10）。弱引用（path = null）要出声时去找，找不到再报
  }
  const stem = name.replace(/\.(mxl|musicxml|xml)$/i, "");
  const hum = humOf(extras);
  return { song: { ...r.song, hum }, stem, hum, extras, ours, notices };
}
