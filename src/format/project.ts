// project.ts —— 一首歌 ↔ 一个 .mxl 文件（zip）。created 2026-10-07 by Claude Opus 5.5；休息室 v2（乐器按引擎分）2026-10-07 深夜 by Claude Fable 5.1；
//   多声部多纸 = 存法 B（契约 §6¾）2026-10-08 by Claude Fable 5.1。
// 数据契约草稿（ai-docs/20261007-data-contract-draft.md）§3 的目录表落地，这一版写其中一部分：
//   mimetype（第一个、不压缩）· META-INF/container.xml · score.musicxml（**派生的压平件**：各声部整首接起来、每张纸起新页 + 排练记号，给别的软件看；自家读时无视）·
//   .moonsinger/papers/<纸 id>.musicxml（**正本**：每张纸一份完整的 MusicXML，这张纸上在场的声部都在里面，曲段名 = <movement-title>）·
//   .moonsinger/manifest.json · .moonsinger/score.json（纸的顺序表 + 声部并集 → 角色 / 麦克风；人插的小节线、还没写音高的音按纸记）·
//   .moonsinger/lounge/<角色 id>.json（休息室快照：角色、候选（乐器按引擎分）、上场的是哪个）· .moonsinger/studio.json（录音房：麦克风）·
//   .moonsinger/sounds/<sha256>.sf2（歌里嵌的音源字节；只写还有候选引用着的）。
// 规矩（照 CatsUp 立宪）：每份扩展文件自带版本号；读到比这一版新的 = 拒开、明说（打开再存会丢东西）；
//   不认识的文件、不认识的字段（以后的版本、别的工具加的、这台设备用不了的引擎配置）读进来留着、存档时原样写回。
// 无地逃生口（user 2026-10-07「先不急着store。可以先按照无地规范导入导出做逃生口」）：这里只管字节 ↔ 歌，打开 / 存的界面在 app 里。
import { DEFAULT_ROLE, numberParts } from "../score/roles.ts";
import { zipSync, unzipSync, strToU8, strFromU8 } from "../../vendor/fflate/fflate.esm.js";
import { type Song, type PartDef, type PaperSeg, type Token, flattenPart } from "../score/song.ts";
import { writeMusicXml, readMusicXml, type ReadPart, type ReadScore, type PartInfo } from "./musicxml.ts";
import { FORMAT, type Hum, type InstrumentV2, type Credit, type Sf2Source } from "./contract.ts";   // 形状 = 契约（人读的 .h）；改格式 = FORMAT +1 + migrate + 冻结样本（守卫测试 test/format-guard.test.ts）
import { migrate } from "./migrate/index.ts";
import { DYNAMICS_DB, ARTICULATION, SOUNDFONT_DEFAULTS, SOUNDFONT_CALIBRATION_DB, TSUKUYOMI_DEFAULTS, TSUKUYOMI_CREDIT, TSUKUYOMI_SPEC, VOWEL_SAMPLER_SPEC, SOUNDFONT_SPEC, TSUKUYOMI_MODEL } from "./performance.ts";
export { FORMAT };
export type { Hum, InstrumentV2 };
const MIMETYPE = "application/vnd.recordare.musicxml";
const DIR = ".moonsinger/";
const SOUNDS = `${DIR}sounds/`;
const PAPERS = `${DIR}papers/`;
const paperFile = (id: string) => `${PAPERS}${id}.musicxml`;

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
  /** 封面 = `Thumbnails/thumbnail.png` 这个 entry 本身（家族既定做法 WXHW ADR-0012 = ORA 同款路径；PNG ≤ 256²、≤ 70 KB；
   *  **永远最后一个 entry、不压缩**——书架靠 store getPeek 尾读一次命中，不是最后就会被别的东西挤出尾窗）。null = 没有封面（书架画自动封面）。 */
  thumbnail: Uint8Array | null;
}
export const emptyExtras = (): Extras => ({ lounge: {}, sounds: {}, unknown: {}, rootfiles: [], thumbnail: null });
export const THUMBNAIL_ENTRY = "Thumbnails/thumbnail.png";
/** 换封面（null = 去掉）。 */
export const withThumbnail = (extras: Extras, png: Uint8Array | null): Extras => ({ ...extras, thumbnail: png });

/** 新歌默认的两个候选：月读完整 / 月读元音版（轻量）。 */
export const CANDIDATE_ID = { full: "c1", light: "c2" } as const;
export type Engine = InstrumentV2["engine"];
const common = () => ({ calibrationDb: 0, chain: [] as unknown[], dynamicsDb: { ...DYNAMICS_DB }, articulation: { ...ARTICULATION } });
/** 新建角色：从 app 内置预设 by value 拷进歌（契约 §8；之后 app 升级改了预设也不影响这首歌）。 */
function defaultRole(hum: Hum, id: string): Json {
  return { version: FORMAT.lounge, id, name: DEFAULT_ROLE.name, sound: DEFAULT_ROLE.sound, active: CANDIDATE_ID.full, candidates: [
    { id: CANDIDATE_ID.full, name: "月读", instrument: { engine: "tsukuyomi", model: { ...TSUKUYOMI_MODEL }, hum }, gm: { program: 55, variant: "tsukuyomi" }, ...common(), defaults: { ...TSUKUYOMI_DEFAULTS }, credit: structuredClone(TSUKUYOMI_CREDIT), spec: structuredClone(TSUKUYOMI_SPEC) },
    { id: CANDIDATE_ID.light, name: "月读（元音）", instrument: { engine: "vowel-sampler", table: "builtin", hum }, gm: { program: 55, variant: "tsukuyomi-vowels" }, ...common(), defaults: {}, credit: structuredClone(TSUKUYOMI_CREDIT), spec: structuredClone(VOWEL_SAMPLER_SPEC) },
  ] };
}
const cands = (role: Json | undefined): Json[] => ((role?.candidates as Json[] | undefined) ?? []);
const instrumentOf = (c: Json | null | undefined): InstrumentV2 | null => (c && c.instrument && typeof c.instrument === "object" ? (c.instrument as InstrumentV2) : null);
const isVoice = (i: InstrumentV2 | null): i is Extract<InstrumentV2, { hum: Hum }> => !!i && (i.engine === "tsukuyomi" || i.engine === "vowel-sampler");
const roleOf = (extras: Extras, role: string, hum: Hum): Json => structuredClone(extras.lounge[role] ?? defaultRole(hum, role));
const nextKey = (ids: string[], prefix: string) => `${prefix}${Math.max(0, ...ids.map((x) => Number(new RegExp(`^${prefix}(\\d+)$`).exec(x)?.[1] ?? 0))) + 1}`;

export interface SaveArgs { song: Song; hum: Hum; extras: Extras; app: string; date: string; view?: Record<string, unknown> | null }   // 歌名 = song.title（可不填）；hum = 编辑器里的哼的字（写进月读候选的乐器配置）
/** 歌 → .mxl 的字节。 */
export function saveMxl(a: SaveArgs): Uint8Array {
  const song = a.song;
  const lounge: Record<string, Json> = { ...a.extras.lounge };
  for (const part of song.parts) {
    const role = roleOf(a.extras, part.role, a.hum);
    for (const c of cands(role)) { const i = instrumentOf(c); if (isVoice(i)) i.hum = a.hum; }   // 哼的字 = 月读候选共用的一个设置
    lounge[part.role] = role;
  }
  const studio: Json = structuredClone(a.extras.studio ?? { version: FORMAT.studio, mics: [] });
  const mics = ((studio.mics as Json[] | undefined) ?? []).slice();
  for (const part of song.parts) if (!mics.some((m) => m.id === part.mic)) mics.push({ id: part.mic, name: `麦克风 ${mics.length + 1}`, gainDb: 0, pan: 0 });
  studio.mics = mics;
  const labels = partLabels(song, { ...a.extras, lounge });
  const infoOf = (part: PartDef, k: number): PartInfo => {
    const role = lounge[part.role], active = cands(role).find((c) => c.id === role.active), mic = mics.find((m) => m.id === part.mic);
    return { id: part.id, name: labels[k], ...(part.clef && part.clef !== "G" ? { clef: part.clef } : {}), ...(part.staves === 2 ? { staves: 2 as const } : {}), instrumentName: String(active?.name ?? "月读"), sound: String(role.sound ?? DEFAULT_ROLE.sound),
      program: Number((active?.gm as Json | undefined)?.program ?? 55),
      variant: typeof (active?.gm as Json | undefined)?.variant === "string" ? { library: "MoonSinger", name: String((active!.gm as Json).variant) } : undefined,
      pan: mic ? Math.round(Number(mic.pan ?? 0) * 90) : undefined };
  };
  const infos = song.parts.map(infoOf), meta = { software: `MoonSinger ${a.app}`, date: a.date };
  const files: Record<string, Uint8Array> = {};
  // 正本：每张纸一份（这张纸上在场的声部）
  const papers = song.papers.map((p) => {
    const parts = song.parts.flatMap((part, k) => (p.tracks[part.id] ? [{ info: infos[k], tokens: p.tracks[part.id] }] : []));
    const w = writeMusicXml({ title: song.title, movementTitle: p.name || undefined, paper: song.paper, credits: song.credits, rights: song.rights, parts }, meta);
    files[paperFile(p.id)] = strToU8(w.xml);
    // 句号（不算打谱符号，不进 MusicXML）：每个声部里「句号跟在哪个 token 后面」（那个 token 的 id）
    const phrases: Record<string, number[]> = {};
    for (const [pid, toks] of Object.entries(p.tracks)) { const ids = toks.flatMap((t, k) => (t.kind === "phrase" && k > 0 ? [toks[k - 1].id] : [])); if (ids.length) phrases[pid] = ids; }
    return { id: p.id, file: paperFile(p.id), manualBars: w.manualBars, unwritten: w.unwritten, ...(Object.keys(phrases).length ? { phrases } : {}), ...(p.hidden ? { hidden: true } : {}) };
  });
  // 派生的压平件：各声部整首接起来，每张纸起新页（第一个声部写排练记号 = 曲段名）
  const flat = writeMusicXml({ title: song.title, paper: song.paper, credits: song.credits, rights: song.rights, padMeasures: true, parts: song.parts.map((part, k) => {
    const f = flattenPart(song, part.id);
    return { info: infos[k], tokens: f.tokens, breaks: new Map(f.starts.slice(1).map((s) => [s.index, s.paper.name])) };
  }) }, meta);
  const scoreExt: Json = { version: FORMAT.score, papers, parts: song.parts.map((p) => ({ id: p.id, role: p.role, mic: p.mic, kind: "pitched" })),
    ...(a.view && Object.keys(a.view).length ? { view: a.view } : {}) };   // 视图态（desk）：存时顺手捞进来，全默认不写（契约 ViewV1，2026-10-08）
  // 嵌的音源：只写还有候选引用着的（换了音源 = 旧块从歌里丢掉；§10.2）
  const referenced = referencedSounds(lounge);
  const sounds = Object.entries(a.extras.sounds).filter(([p]) => referenced.has(p)).sort(([x], [y]) => (x < y ? -1 : 1));
  const manifest: Json = { ...(a.extras.manifest ?? {}), format: "moonsinger", version: FORMAT.manifest, app: a.app, saved: a.date,
    files: { "score.json": FORMAT.score, "studio.json": FORMAT.studio, ...Object.fromEntries(Object.entries(lounge).map(([id, r]) => [`lounge/${id}.json`, Number(r.version ?? 1)])),
      ...Object.fromEntries(papers.map((p) => [`papers/${p.id}.musicxml`, 0])) },   // 0 = 标准件（MusicXML），不是我们的版本号
    derived: ["score.musicxml"],
    sounds: sounds.map(([path, b]) => ({ path, sha256: path.slice(SOUNDS.length).replace(/\.sf2$/, ""), bytes: b.length })) };
  const json = (o: unknown) => strToU8(JSON.stringify(o, null, 2) + "\n");
  const rootfiles = [`<rootfile full-path="score.musicxml" media-type="application/vnd.recordare.musicxml+xml"/>`,
    ...a.extras.rootfiles.map((r) => `<rootfile full-path="${r.path}" media-type="${r.mediaType}"/>`)].join("\n    ");
  const out: Record<string, Uint8Array> = {};
  out["mimetype"] = strToU8(MIMETYPE);
  out["META-INF/container.xml"] = strToU8(`<?xml version="1.0" encoding="UTF-8"?>\n<container>\n  <rootfiles>\n    ${rootfiles}\n  </rootfiles>\n</container>\n`);
  out["score.musicxml"] = strToU8(flat.xml);
  out[`${DIR}manifest.json`] = json(manifest);
  out[`${DIR}score.json`] = json(scoreExt);
  for (const [path, bytes] of Object.entries(files)) out[path] = bytes;
  for (const [id, r] of Object.entries(lounge)) out[`${DIR}lounge/${id}.json`] = json(r);
  out[`${DIR}studio.json`] = json(studio);
  for (const [path, bytes] of sounds) out[path] = bytes;
  for (const [path, bytes] of Object.entries(a.extras.unknown)) if (!(path in out) && path !== THUMBNAIL_ENTRY) out[path] = bytes;
  if (a.extras.thumbnail) out[THUMBNAIL_ENTRY] = a.extras.thumbnail;   // 封面最后一个（尾读）
  const entries: Record<string, [Uint8Array, { level: 0 | 1 | 6 }]> = {};
  for (const [path, bytes] of Object.entries(out)) entries[path] = [bytes, { level: path === "mimetype" || path === THUMBNAIL_ENTRY ? 0 : path.startsWith(SOUNDS) ? 1 : 6 }];   // mimetype 必须第一个、不压缩（插入顺序 = zip 里的顺序）；封面不压缩（尾读按 entry 名抓原始字节）；采样大、压不动，level 1 省时间
  return zipSync(entries);
}

/** stem = 打开的文件叫什么（去掉扩展名；文件名和歌名分开：歌名在 song.title，可不填）。 */
export interface Opened { song: Song; stem: string; hum: Hum; extras: Extras; ours: boolean; notices: string[]; view: Record<string, unknown> | null }   // view = score.json 里的视图态（没有 = null；desk.ts 宽容读）

// ── 角色（谱上的功能位；一个声部一个角色 id）────────────────────────────────────────────
/** 这个角色谱上写的名字 = MusicXML 的 <part-name>（user「谱上面显示的不应跟是月读，而是人声，女声 lead bass violin之类功能的东西，
 *  还记得之前说的给role assign 乐器的逻辑吗？…不然的话你fl studio一个乱七八糟的插件，月读会变成c:/apps/…/月度_v1.0_绿色破解版.dll 这个就是我那个窄接口要拦的」）。
 *  乐器（候选）的名字不上谱。 */
export function roleName(extras: Extras, role: string): string { return String(extras.lounge[role]?.name ?? DEFAULT_ROLE.name); }
/** 这个角色是什么（MusicXML 官方 <instrument-sound> id，src/score/roles.ts；user「角色名可以和xml的乐器 功能语义对齐，用最官方的正规的」）。 */
export function roleSound(extras: Extras, role: string): string { return String(extras.lounge[role]?.sound ?? DEFAULT_ROLE.sound); }
/** 各声部谱上写的名字（和 song.parts 一一对应；同名同种的带号，src/score/roles.ts numberParts）。 */
export function partLabels(song: Song, extras: Extras): string[] { return numberParts(song.parts.map((p) => ({ name: roleName(extras, p.role), sound: roleSound(extras, p.role) }))); }
/** 改角色名（选了预设 = 连官方 id 一起改；自己写的名字 = 官方 id 不变）。还没有角色快照 = 先按默认的建一份。 */
export function withRoleName(extras: Extras, role: string, name: string, hum: Hum, sound?: string): Extras {
  const r = roleOf(extras, role, hum);
  r.name = name;
  if (sound) r.sound = sound;
  return { ...extras, lounge: { ...extras.lounge, [role]: r } };
}
/** 角色改成某个乐器概念（找人视图里挑了）：名字 + 官方 id + id 束 by value。 */
export function withRoleConcept(extras: Extras, role: string, c: { name: string; sound: string | null; concept: NonNullable<import("./contract.ts").LoungeRoleV2["concept"]> }, hum: Hum): Extras {
  const r = roleOf(extras, role, hum);
  r.name = c.name; if (c.sound) r.sound = c.sound; r.concept = c.concept;
  return { ...extras, lounge: { ...extras.lounge, [role]: r } };
}
/** 新声部要的角色 id（休息室里没用过的「r<n>」）。 */
export function newRoleId(extras: Extras, song: Song): string { return nextKey([...Object.keys(extras.lounge), ...song.parts.map((p) => p.role)], "r"); }
/** 新声部要的麦克风 id。 */
export function newMicId(extras: Extras, song: Song): string { return nextKey([...((extras.studio?.mics as Json[] | undefined) ?? []).map((m) => String(m.id)), ...song.parts.map((p) => p.mic)], "m"); }
/** 给新声部在休息室里建一份默认角色（月读两个候选；名字可给）。 */
export function withNewRole(extras: Extras, role: string, hum: Hum, name?: string, sound?: string): Extras {
  if (extras.lounge[role]) return extras;
  const r = defaultRole(hum, role); if (name) r.name = name; if (sound) r.sound = sound;
  return { ...extras, lounge: { ...extras.lounge, [role]: r } };
}
/** 删一个声部之后：它的角色从休息室拿掉（嵌的音源没别人引用 = 一起丢）。 */
export function withoutRole(extras: Extras, role: string): Extras {
  const lounge = { ...extras.lounge }; delete lounge[role];
  return pruneSounds({ ...extras, lounge });
}
// ── 录音房（麦克风）────────────────────────────────────────────────────────────────────────
/** 改一个麦克风的增益 / 声像（没有录音房 / 没有这个麦克风 = 先建）。 */
export function withMic(extras: Extras, micId: string, patch: { gainDb?: number; pan?: number }): Extras {
  const studio: Json = structuredClone(extras.studio ?? { version: FORMAT.studio, mics: [] });
  const mics = ((studio.mics as Json[] | undefined) ?? []).slice();
  let m = mics.find((x) => x.id === micId);
  if (!m) { m = { id: micId, name: `麦克风 ${mics.length + 1}`, gainDb: 0, pan: 0 }; mics.push(m); }
  if (patch.gainDb !== undefined) m.gainDb = patch.gainDb; if (patch.pan !== undefined) m.pan = patch.pan;
  studio.mics = mics;
  return { ...extras, studio };
}
// ── 候选（谁来演；休息室）────────────────────────────────────────────────────────────────
export interface CandidateInfo { id: string; name: string; engine: Engine }
/** 角色的候选们（顺序 = 文件里的顺序）。没有角色快照 = 默认的两个月读。 */
export function candidates(extras: Extras, role: string): CandidateInfo[] {
  return cands(extras.lounge[role] ?? defaultRole("n", role)).map((c) => ({ id: String(c.id), name: String(c.name ?? ""), engine: instrumentOf(c)?.engine ?? "unknown" }));
}
/** 上场的候选的 id（没有角色快照 = 默认的 c1）。 */
export function activeId(extras: Extras, role: string): string { return String(extras.lounge[role]?.active ?? CANDIDATE_ID.full); }
/** 现在上场的候选（整份 json）。 */
export function activeCandidate(extras: Extras, role: string): Json | null {
  const r = extras.lounge[role]; if (!r) return null;
  return cands(r).find((x) => x.id === r.active) ?? null;
}
/** 上场那位（整份 json）；没有角色快照 = 默认角色里上场的（月读）——署名推演要它：新歌没动过「谁来演」的声部也是月读在唱（2026-10-08 by Claude Opus 5.5）。 */
export function activeOrDefaultCandidate(extras: Extras, role: string): Json | null {
  const r = extras.lounge[role] ?? defaultRole("n", role);
  return cands(r).find((x) => x.id === r.active) ?? null;
}
/** 现在上场的候选（乐器）叫什么——只给角色卡里看，不上谱。 */
export function activeCandidateName(extras: Extras, role: string): string | null { const c = activeCandidate(extras, role); return c ? String(c.name ?? "") : null; }
/** 上场的那位的乐器（按引擎分）；没有角色快照 = 默认的月读完整版。 */
export function activeInstrument(extras: Extras, role: string): InstrumentV2 | null {
  if (!extras.lounge[role]) return { engine: "tsukuyomi", model: { ...TSUKUYOMI_MODEL }, hum: "n" };
  return instrumentOf(activeCandidate(extras, role));
}
/** 哼的字（月读候选共用）：休息室里第一个月读候选的；没有 = 默认「嗯」。 */
export function humOf(extras: Extras): Hum {
  for (const r of Object.values(extras.lounge)) for (const c of cands(r)) { const i = instrumentOf(c); if (isVoice(i)) return i.hum; }
  return "n";
}
/** 换上场的候选（人选的；不自动）。 */
export function withActive(extras: Extras, role: string, id: string, hum: Hum): Extras {
  const r = roleOf(extras, role, hum);
  r.active = id;
  return { ...extras, lounge: { ...extras.lounge, [role]: r } };
}

// ── SoundFont 候选（契约 §10.2：子集 by value 嵌进歌；弱引用 = 只记来源）────────────────────
export interface GmCandidate {
  id: string; name: string; bank: number; program: number;
  note?: number;                       // 鼓件：每个音都敲这个键
  path: string | null;                 // 字节在歌里的路径；null = 弱引用（歌里不带声音）
  bytes: Uint8Array | null;            // 歌里带的字节；null = 弱引用，或强引用但文件里少了那块
  origin: Sf2Source["origin"];
  subsetSha256: string;                // 弱引用重新切出来时核对用
}
/** 角色的 SoundFont 候选们。 */
export function gmCandidates(extras: Extras, role: string): GmCandidate[] {
  return cands(extras.lounge[role]).flatMap((c) => {
    const i = instrumentOf(c); if (i?.engine !== "soundfont") return [];
    const s = i.source;
    return [{ id: String(c.id), name: String(c.name ?? ""), bank: i.bank, program: i.program, ...(i.note !== undefined ? { note: i.note } : {}), path: s.embedded, bytes: s.embedded ? extras.sounds[s.embedded] ?? null : null, origin: s.origin, subsetSha256: s.subsetSha256 }];
  });
}
/** 现在上场的 SoundFont 候选（上场的不是它 = null）。 */
export function activeGm(extras: Extras, role: string): GmCandidate | null { const id = activeId(extras, role); return gmCandidates(extras, role).find((c) => c.id === id) ?? null; }
export interface Sf2CandidateArgs {
  name: string; bank: number; program: number; note?: number;
  subset: Uint8Array; sha256: string;                                   // 子集字节 + 它的 sha256（调用方算，crypto.subtle 是异步的）
  embed?: boolean;                                                      // 默认 true = 字节进歌；false = 弱引用（只记来源 + 子集 sha256，歌里不带声音）
  origin: Sf2Source["origin"];                                          // 从哪个整包切的
  credit: Credit;
  calibrationDb?: number;                                               // 响度校准；默认 SOUNDFONT_CALIBRATION_DB（performance.ts；歌手牌上看得见、能调）
}
/** 加一个 SoundFont 候选并让它上场。同一份字节（同 sha256）只存一份。 */
export function withSf2Candidate(extras: Extras, role: string, c: Sf2CandidateArgs, hum: Hum): Extras {
  const r = roleOf(extras, role, hum);
  const list = cands(r);
  const n = Math.max(0, ...list.map((x) => Number(/^c(\d+)$/.exec(String(x.id))?.[1] ?? 0))) + 1, id = `c${n}`;
  const embed = c.embed !== false, path = embed ? `${SOUNDS}${c.sha256}.sf2` : null;
  const instrument: InstrumentV2 = { engine: "soundfont", bank: c.bank, program: c.program, ...(c.note !== undefined ? { note: c.note } : {}), source: { embedded: path, subsetBytes: c.subset.length, subsetSha256: c.sha256, origin: c.origin } };
  list.push({ id, name: c.name, instrument, gm: { program: c.bank === 128 ? null : c.program + 1, variant: null }, ...common(), calibrationDb: c.calibrationDb ?? SOUNDFONT_CALIBRATION_DB, defaults: { ...SOUNDFONT_DEFAULTS }, credit: c.credit, spec: structuredClone(SOUNDFONT_SPEC) });
  r.candidates = list; r.active = id;
  return { ...extras, lounge: { ...extras.lounge, [role]: r }, sounds: path ? { ...extras.sounds, [path]: c.subset } : extras.sounds };
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
export function withoutCandidate(extras: Extras, role: string, id: string): Extras {
  const r = structuredClone(extras.lounge[role]); if (!r) return extras;
  if (r.active === id) throw new Error("上场的候选不能删，先换一个「谁来演」");
  r.candidates = cands(r).filter((c) => c.id !== id);
  return pruneSounds({ ...extras, lounge: { ...extras.lounge, [role]: r } });
}

// ── 打包 / 解包（2026-10-08 by Claude Opus 5.5；user「我后悔自动embed音源了，改成弱引用吧，app可以自己找吗，然后类似blender，
//    可以pack all packable resources或者unpack all。然后导出的时候可以选导出packed版本的。不过月读不能pack吧」）──────────
// 只动 source.embedded（字节来去），**sha256 / origin 一律不碰**：解析链按子集 sha256 认人（契约 Sf2Source）。
// 能打包的只有 SoundFont 子集（样本类，契约 §10.2）；月读 / 元音版是家族模型包 / app 随带的表，钉哈希，永不进歌。
export interface SoundUse { subsetSha256: string; packed: boolean; bytes: number; origin: Sf2Source["origin"]; names: string[] }
/** 歌里所有 SoundFont 候选用到的声音（台上 + 候补都算；同一份子集只算一次）。packed = 字节在歌里。 */
export function soundUses(extras: Extras): SoundUse[] {
  const out = new Map<string, SoundUse>();
  for (const r of Object.values(extras.lounge)) for (const c of cands(r)) {
    const i = instrumentOf(c); if (i?.engine !== "soundfont") continue;
    const s = i.source, had = out.get(s.subsetSha256), packed = !!(s.embedded && extras.sounds[s.embedded]);
    if (had) { had.packed ||= packed; if (!had.names.includes(String(c.name ?? ""))) had.names.push(String(c.name ?? "")); continue; }
    out.set(s.subsetSha256, { subsetSha256: s.subsetSha256, packed, bytes: Number(s.subsetBytes ?? 0), origin: s.origin, names: [String(c.name ?? "")] });
  }
  return [...out.values()];
}
const soundPath = (sha256: string) => `${SOUNDS}${sha256}.sf2`;
/** 打包：没在歌里的 SoundFont 候选（弱引用，或强引用但文件里少了那块），have(子集 sha256) 给得出字节的 → 嵌进歌。
 *  调用方保证 have 给的字节核过 sha256。返回打包了哪些、哪些拿不到（拿不到的保持原样，不静默：调用方报出来）。 */
export function withPacked(extras: Extras, have: (subsetSha256: string) => Uint8Array | undefined): { extras: Extras; packed: string[]; missing: string[] } {
  const lounge: Record<string, Json> = {}, sounds = { ...extras.sounds }, packed = new Set<string>(), missing = new Set<string>();
  for (const [id, r0] of Object.entries(extras.lounge)) {
    const r = structuredClone(r0);
    for (const c of cands(r)) {
      const i = instrumentOf(c); if (i?.engine !== "soundfont") continue;
      const s = i.source; if (s.embedded && sounds[s.embedded]) continue;
      const path = soundPath(s.subsetSha256), b = sounds[path] ?? have(s.subsetSha256);
      if (!b) { missing.add(s.subsetSha256); continue; }
      sounds[path] = b; s.embedded = path; packed.add(s.subsetSha256);
    }
    lounge[id] = r;
  }
  return packed.size ? { extras: { ...extras, lounge, sounds }, packed: [...packed], missing: [...missing] } : { extras, packed: [], missing: [...missing] };
}
/** 解包：嵌着的 SoundFont 候选改弱引用（embedded = null），字节从歌里拿掉；only = 只解这些子集（调用方先确认字节留得住，留不住的别解——解了就找不回来）。
 *  返回拿掉的字节（子集 sha256 → 字节）：调用方留到设备上，这台设备照样能响（Blender 的 unpack = 写到旁边的文件，这里 = 设备的音源缓存）。 */
export function withUnpacked(extras: Extras, only?: (subsetSha256: string) => boolean): { extras: Extras; removed: Map<string, Uint8Array> } {
  const lounge: Record<string, Json> = {}, removed = new Map<string, Uint8Array>();
  let changed = false;
  for (const [id, r0] of Object.entries(extras.lounge)) {
    const r = structuredClone(r0);
    for (const c of cands(r)) {
      const i = instrumentOf(c); if (i?.engine !== "soundfont" || !i.source.embedded || (only && !only(i.source.subsetSha256))) continue;
      const b = extras.sounds[i.source.embedded]; if (b) removed.set(i.source.subsetSha256, b);
      i.source.embedded = null; changed = true;
    }
    lounge[id] = r;
  }
  return changed ? { extras: pruneSounds({ ...extras, lounge }), removed } : { extras, removed };
}

// ── 演奏规格（修的记号怎么出声：上场那位 by value 带着的力度表 + 演奏法；src/score/perform.ts 用；2026-10-08 by Claude Opus 5.5）──
/** 上场那位的力度表（mf = 0 dB）/ 跳音吃掉多少 / 重音加多少。没有角色快照或字段缺 = app 内置那份（DYNAMICS_DB / ARTICULATION）。 */
export function activePerfSpec(extras: Extras, role: string): { dynamicsDb: Record<"pp" | "p" | "mp" | "mf" | "f" | "ff", number>; staccatoGate: number; accentDb: number } {
  const c = activeCandidate(extras, role), d = (c?.dynamicsDb ?? {}) as Partial<Record<string, number>>, a = (c?.articulation ?? {}) as Partial<Record<string, number>>;
  const num = (v: unknown, dflt: number) => (typeof v === "number" && Number.isFinite(v) ? v : dflt);
  const dynamicsDb = Object.fromEntries((Object.keys(DYNAMICS_DB) as (keyof typeof DYNAMICS_DB)[]).map((k) => [k, num(d[k], DYNAMICS_DB[k])])) as Record<keyof typeof DYNAMICS_DB, number>;
  return { dynamicsDb, staccatoGate: Math.max(0.05, Math.min(1, num(a.staccatoGate, ARTICULATION.staccatoGate))), accentDb: num(a.accentDb, ARTICULATION.accentDb) };
}

// ── 响度校准（候选的 calibrationDb：契约「看得见、能调的默认，不偷偷自动」；user「不太建议自动校准，除非是可调的默认。不然就是不透明了」）──
/** 上场那位的校准（dB；没有角色快照 / 没写 = 0）。渲染时乘在这个声部上，和录音室推子相加（推子 = 混音决定，校准 = 演奏者自己的响度）。 */
export function activeCalibrationDb(extras: Extras, role: string): number { const c = activeCandidate(extras, role); const v = Number(c?.calibrationDb ?? 0); return Number.isFinite(v) ? v : 0; }
/** 改上场那位的校准。 */
export function withCalibration(extras: Extras, role: string, dB: number, hum: Hum): Extras {
  const r = roleOf(extras, role, hum), c = cands(r).find((x) => x.id === r.active); if (!c) return extras;
  c.calibrationDb = Math.round(dB * 10) / 10;
  return { ...extras, lounge: { ...extras.lounge, [role]: r } };
}

// ── 读 ─────────────────────────────────────────────────────────────────────────────────
/** 别的软件存的单份谱：没有 <work-title> 就拿 <movement-title> 当歌名（不当曲段名）。 */
const foreign = (r: ReadScore): ReadScore => (r.title || !r.movementTitle ? r : { ...r, title: r.movementTitle, movementTitle: "" });
/** 一份读进来的 MusicXML → 一张纸（token id 之后在 songFromReads 里统一重编）。 */
function paperOfRead(id: string, r: ReadScore): PaperSeg {
  const tracks: Record<string, Token[]> = {};
  for (const p of r.parts) tracks[p.info.id] = p.tokens;
  return { id, name: r.movementTitle, tracks };
}
/** 字节 → 歌。认 .mxl（zip）和不压缩的 .musicxml / .xml。读不了 = 抛错（错误文字直接给人看）。 */
export function openBytes(name: string, bytes: Uint8Array): Opened {
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (!isZip) {   // 不压缩的 MusicXML：只有谱（一张纸，声部照文件里的）
    const r = foreign(readMusicXml(new TextDecoder().decode(bytes)));
    return finish([r], songFromReads([r], null), emptyExtras(), false, name);
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
  if (files[THUMBNAIL_ENTRY]) { extras.thumbnail = files[THUMBNAIL_ENTRY]; known.add(THUMBNAIL_ENTRY); }   // 封面 entry（别家 zip 里有同名的也照收）
  const manifestBytes = files[`${DIR}manifest.json`];
  const ours = !!manifestBytes;
  if (!ours) {
    for (const [p, b] of Object.entries(files)) if (!known.has(p) && !p.endsWith("/")) extras.unknown[p] = b;
    const r = foreign(readMusicXml(strFromU8(files[main])));
    return finish([r], songFromReads([r], null), extras, false, name);
  }
  const parse = (p: string): Json => { try { return JSON.parse(strFromU8(files[p])) as Json; } catch { throw new Error(`${p} 读不懂（文件坏了？）`); } };
  const manifest = parse(`${DIR}manifest.json`); known.add(`${DIR}manifest.json`);
  const newer = (what: string, v: unknown, mine: number) => { if (Number(v) > mine) throw new Error(`这首歌是更新版本的 MoonSinger 存的（${what} 第 ${v} 版，这一版只认到第 ${mine} 版），打开再存会丢东西，所以没有打开。请先更新 app。`); };
  newer("总目录", manifest.version, FORMAT.manifest);
  extras.manifest = migrate("manifest", manifest);
  let scoreExt: Json | null = null;
  if (files[`${DIR}score.json`]) {
    const s0 = parse(`${DIR}score.json`); known.add(`${DIR}score.json`); newer("谱的扩展", s0.version, FORMAT.score);
    scoreExt = migrate("score", s0); extras.scoreExt = scoreExt;
  }
  for (const p of Object.keys(files)) {
    const m = /^\.moonsinger\/lounge\/([^/]+)\.json$/.exec(p);
    if (m) { const r = parse(p); newer(`休息室「${r.name ?? m[1]}」`, r.version, FORMAT.lounge); extras.lounge[m[1]] = migrate("lounge", r); known.add(p); }
  }
  if (files[`${DIR}studio.json`]) { const s = parse(`${DIR}studio.json`); known.add(`${DIR}studio.json`); newer("录音房", s.version, FORMAT.studio); extras.studio = migrate("studio", s); }
  for (const p of Object.keys(files)) if (p.startsWith(SOUNDS) && !p.endsWith("/")) { extras.sounds[p] = files[p]; known.add(p); }   // 嵌的音源字节（整份留着；存档只写还引用着的）
  // 纸：按 score.json 的顺序表逐张读；第 1 版存的（迁移后 papers = [p1]，文件指向 papers/p1.musicxml）包里没那份 = 读 score.musicxml（文件级迁移在这里做，migrate() 只管 JSON）
  const list = ((scoreExt?.papers as Json[] | undefined) ?? [{ id: "p1", file: paperFile("p1"), manualBars: {}, unwritten: [] }]);
  const reads: ReadScore[] = [];
  const papers: PaperSeg[] = [];
  list.forEach((p, k) => {
    const file = String(p.file ?? paperFile(String(p.id)));
    const b = files[file] ?? (k === 0 ? files[main] : undefined);
    if (!b) throw new Error(`纸「${p.id}」的谱（${file}）在包里找不到`);
    known.add(file);
    const r = readMusicXml(strFromU8(b), { manualBars: (p.manualBars as Record<string, number[]> | undefined) ?? {}, unwritten: (p.unwritten as string[] | undefined) ?? [] });
    reads.push(r);
    const seg = paperOfRead(String(p.id), r); if (p.hidden === true) seg.hidden = true;
    const ph = p.phrases as Record<string, number[]> | undefined;   // 句号：插回那些 token 后面（id 读的时候保留着；句号 token 本身 id 0 = 之后重编）
    if (ph) for (const [pid, ids] of Object.entries(ph)) { const toks = seg.tracks[pid]; if (!toks) continue; for (const id of ids) { const k = toks.findIndex((t) => t.id === id); if (k >= 0 && toks[k + 1]?.kind !== "phrase") toks.splice(k + 1, 0, { kind: "phrase", id: 0 }); } }
    papers.push(seg);
  });
  for (const [p, b] of Object.entries(files)) if (!known.has(p) && !p.endsWith("/")) extras.unknown[p] = b;
  const song = songFromReads(reads, papers, (scoreExt?.parts as Json[] | undefined) ?? null);
  return finish(reads, song, pruneSounds(extras), ours, name);
}

/** 读进来的几张纸 → 歌。parts = score.json 的声部并集（没有 = 按纸里出现的声部 P1…）。
 *  token id 统一重编（纸序 × 声部序 × 下标，从 1 起）：全歌唯一、确定；文件里的 id 只在读那份文件时有用（unwritten / 拆段并回）。 */
function songFromReads(reads: ReadScore[], papers: PaperSeg[] | null, partList: Json[] | null = null): Song {
  const ps = papers ?? [paperOfRead("p1", reads[0])];
  const seen = new Map<string, PartDef>();
  for (const p of partList ?? []) seen.set(String(p.id), { id: String(p.id), role: String(p.role ?? `r${seen.size + 1}`), mic: String(p.mic ?? `m${seen.size + 1}`) });
  for (const p of ps) for (const id of Object.keys(p.tracks)) if (!seen.has(id)) seen.set(id, { id, role: `r${seen.size + 1}`, mic: `m${seen.size + 1}` });
  // 谱号：MusicXML 里这个声部第一个 <clef>（任何一张纸上的）是 F = 低音谱号
  for (const r of reads) for (const p of r.parts) { const d = seen.get(p.info.id); if (!d) continue; if (p.info.clef === "F" && !d.clef) d.clef = "F"; if (p.info.staves === 2) d.staves = 2; }
  const parts = [...seen.values()];
  let id = 1;
  const renumbered = ps.map((p) => ({ ...p, tracks: Object.fromEntries(parts.flatMap((part) => (p.tracks[part.id] ? [[part.id, p.tracks[part.id].map((t) => ({ ...t, id: id++ }))]] : []))) }));
  const r0 = reads[0];
  return { ...(r0.title ? { title: r0.title } : {}), ...(r0.paper ? { paper: r0.paper } : {}), ...(r0.credits ? { credits: r0.credits } : {}), ...(r0.rights ? { rights: r0.rights } : {}), hum: "n", parts, papers: renumbered };
}

function finish(reads: ReadScore[], song0: Song, extras: Extras, ours: boolean, name: string): Opened {
  const notices: string[] = [];
  const dropped: Record<string, number> = {};
  for (const r of reads) for (const [k, n] of Object.entries(r.dropped)) dropped[k] = (dropped[k] ?? 0) + n;
  const dl = Object.entries(dropped);
  if (dl.length) notices.push(`这份谱里有这一版还不支持的东西，没有读进来：${dl.map(([k, n]) => `${k} ${n} 处`).join("、")}。存的时候它们不会在新文件里——要留原样，请「另存为」新文件。`);
  const infos = new Map<string, ReadPart>();
  for (const r of reads) for (const p of r.parts) if (!infos.has(p.info.id)) infos.set(p.info.id, p.info);
  for (const part of song0.parts) {
    if (extras.lounge[part.role] || ours) continue;
    // 别的软件存的谱：声部原来的乐器记成这个角色的候选（引擎 unknown）、就是它上场；这一版没有那件乐器 → 没人上场，人来选（user「不出声，报错，人类手动换」）
    const p = infos.get(part.id);
    const was = p?.instrumentName || p?.name || "原来的乐器";
    const gm = p?.program;
    const role = defaultRole("n", part.role);
    role.name = p?.name || DEFAULT_ROLE.name;
    if (p?.sound) role.sound = p.sound;
    role.active = "c0";
    cands(role).unshift({ id: "c0", name: was, instrument: { engine: "unknown", midi: { program: gm ?? null, variant: p?.variant ?? null } }, gm: { program: gm ?? null, variant: p?.variant ?? null }, ...common(), defaults: {}, credit: { attribution: [], license: { name: "unknown" } }, spec: { kind: "unknown" } });
    extras.lounge[part.role] = role;
    notices.push(`声部「${role.name}」原来是${was}${gm ? `（GM ${gm} 号）` : ""}；这一版没有这件乐器，所以还没人上场。要月读来唱，点谱前面的「${role.name}」，在「谁来演」选月读。`);
  }
  for (const part of song0.parts) {
    const role = extras.lounge[part.role]; if (!role) continue;
    const gm = activeGm(extras, part.role);
    if (gm && gm.path && !gm.bytes) notices.push(`「${gm.name}」的声音（${gm.path}）没随这首歌一起带来，所以没人上场。点谱前面的「${role.name ?? ""}」换一个「谁来演」。`);   // 强引用、文件里却少了那块：不静默（§10）。弱引用（path = null）要出声时去找，找不到再报
  }
  const stem = name.replace(/\.(mxl|musicxml|xml)$/i, "");
  const hum = humOf(extras);
  return { song: { ...song0, hum }, stem, hum, extras, ours, notices, view: (extras.scoreExt?.view as Record<string, unknown> | undefined) ?? null };
}
