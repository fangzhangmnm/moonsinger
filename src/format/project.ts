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
import { _t } from "../i18n/index.ts";
import { DEFAULT_ROLE, numberParts } from "../score/roles.ts";
import { zipSync, unzipSync, strToU8, strFromU8 } from "../../vendor/fflate/fflate.esm.js";
import { swellOf, withArt, SWELL_ART, type Swell, type Song, type PartDef, type PaperSeg, type Token, type NoteTok, type ClefName, type PartLook, CLEFS, flattenPart, familyOrder, headClefOf, withLooks, headLen } from "../score/song.ts";
import { resolveSongLooks, displayStates, withAutoOttava, type ResolvedLook } from "../score/clef.ts";
import { percKindOf } from "../gm/percussion.ts";
import { songPlayOrder } from "../score/arrange.ts";
import { writeMusicXml, readMusicXml, type ReadPart, type ReadScore, type PartInfo } from "./musicxml.ts";
import { FORMAT, FORMAT_MINOR, FORMAT_PATCH, type FormatFile, type Dynamic, type FxV2, type Hum, type InstrumentV2, type Credit, type Sf2Source } from "./contract.ts";   // 形状 = 契约（人读的 .h）；改格式 = FORMAT +1 + migrate + 冻结样本（守卫测试 test/format-guard.test.ts）
import { FINAL_MP3_ENTRY, contentFingerprint, parseFinalRecord, type FinalRecord, type FingerprintParts } from "./final.ts";
export { FINAL_MP3_ENTRY, type FinalRecord };
import { migrate } from "./migrate/index.ts";
import { badIds, isSafeId, safePartIds, safeView, type IdKind } from "./ids.ts";
import { sha256HexSync } from "./sha256-sync.ts";
import { DYNAMICS_VEL, ACCENT_VEL, MARCATO_VEL, MARCATO_DB, MARK_DEFAULTS, ROLL_HZ_MIN, ROLL_HZ_MAX, SING_MARKS, type SingMark, ARTICULATION, SOUNDFONT_DEFAULTS, TSUKUYOMI_DEFAULTS, UNWRITTEN_CALIBRATION_DB, BUILTIN_CALIBRATION_DB, TSUKUYOMI_CREDIT, TSUKUYOMI_SPEC, VOWEL_SAMPLER_SPEC, SOUNDFONT_SPEC, TSUKUYOMI_MODEL } from "./performance.ts";
export { FORMAT };
export type { Hum, InstrumentV2 };
const MIMETYPE = "application/vnd.recordare.musicxml";
const DIR = ".moonsinger/";
const SOUNDS = `${DIR}sounds/`;
/** 参考窗（v0.8，2026-10-08 深夜 Opus 5.5；对齐稿 ai-docs/20261008-reference-window-alignment.md）：整个目录归 @internal/reference-window
 *  （manifest.json 自带版本号和迁移 + 每张卡的字节）；这里零知识、原样进出。不放 extras（extras 进撤销，参考窗不进）。 */
export const REFERENCES_DIR = `${DIR}references/`;
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
/** 老文件里带着的那份 mp3（v0.12.18–v0.16.96 的「定稿」把渲好的 mp3 存进歌里：总目录 `manifest.final` + `.moonsinger/final.mp3`）。
 *  定稿 2026-11-10 退役（v0.16.97；user 11-07 定「定稿取消，换修改锁」、11-10「对，以后统一不存mp3，旧的也删掉」）：这一版起**永远不再往歌里写这两样**；
 *  读到老文件里有 = 原样交给宿主（搬进这台设备的渲染缓存，src/app/render-cache.ts），不进 Extras、不写回。记录不像样 / mp3 不在 / 和内容对不上 = 没有这一项（不报错、不拒开）。 */
export interface LegacyMp3 {
  /** 带标签的 mp3 字节（当时发行的那一份）。 */
  bytes: Uint8Array;
  /** 出声内容的指纹，**按这一版写出来的样子**算的（和 contentFingerprintOf 对得上；老写法搬成新写法指纹会变，内容没变）。 */
  fingerprint: string;
  secs: number; kbps: number; stereo: boolean;
  /** 进了这份 mp3 的声部 id。 */
  parts: string[];
  /** 渲的时候的 app 版本 / 渲染核心 / 那首歌的第几版定稿。 */
  app: string; core: { version: string; hash: string }; rev: number;
}
export const THUMBNAIL_ENTRY = "Thumbnails/thumbnail.png";
/** 换封面（null = 去掉）。 */
export const withThumbnail = (extras: Extras, png: Uint8Array | null): Extras => ({ ...extras, thumbnail: png });

/** 新歌默认的两个候选：月读完整 / 月读元音版（轻量）。
 *  显示名 2026-10-13 起叫「小月相」/「小月相（元音）」（W-28，家规「共享叫法」）；旧歌里按值存着的「月读」原样留着——打开时迁移还是显示时换，等 user 定。 */
export const CANDIDATE_ID = { full: "c1", light: "c2" } as const;
export type Engine = InstrumentV2["engine"];
const common = (calibrationDb: number) => ({ calibrationDb, chain: [] as unknown[], dynamicsVel: { ...DYNAMICS_VEL }, articulation: { ...ARTICULATION, gapSec: 0, marcatoDb: MARCATO_DB, ...MARK_DEFAULTS } });   // 记号怎么解读的数全写明（by value）；迁移出来的旧候选不补
/** 新建角色：从 app 内置预设 by value 拷进歌（契约 §8；之后 app 升级改了预设也不影响这首歌）。 */
function defaultRole(hum: Hum, id: string): Json {
  return { version: FORMAT.lounge, id, name: DEFAULT_ROLE.name, sound: DEFAULT_ROLE.sound, active: CANDIDATE_ID.full, candidates: [
    { id: CANDIDATE_ID.full, name: _t("小月相"), instrument: { engine: "tsukuyomi", model: { ...TSUKUYOMI_MODEL }, hum }, gm: { program: 55, variant: "tsukuyomi" }, ...common(BUILTIN_CALIBRATION_DB.tsukuyomi), sing: structuredClone(SING_MARKS), defaults: { ...TSUKUYOMI_DEFAULTS }, credit: structuredClone(TSUKUYOMI_CREDIT), spec: structuredClone(TSUKUYOMI_SPEC) },
    { id: CANDIDATE_ID.light, name: _t("小月相（元音）"), instrument: { engine: "vowel-sampler", table: "builtin", hum }, gm: { program: 55, variant: "tsukuyomi-vowels" }, ...common(BUILTIN_CALIBRATION_DB["vowel-sampler"]), defaults: {}, credit: structuredClone(TSUKUYOMI_CREDIT), spec: structuredClone(VOWEL_SAMPLER_SPEC) },
  ] };
}
const cands = (role: Json | undefined): Json[] => ((role?.candidates as Json[] | undefined) ?? []);
const instrumentOf = (c: Json | null | undefined): InstrumentV2 | null => (c && c.instrument && typeof c.instrument === "object" ? (c.instrument as InstrumentV2) : null);
const isVoice = (i: InstrumentV2 | null): i is Extract<InstrumentV2, { hum: Hum }> => !!i && (i.engine === "tsukuyomi" || i.engine === "vowel-sampler");
const roleOf = (extras: Extras, role: string, hum: Hum): Json => structuredClone(extras.lounge[role] ?? defaultRole(hum, role));
const nextKey = (ids: string[], prefix: string) => `${prefix}${Math.max(0, ...ids.map((x) => Number(new RegExp(`^${prefix}(\\d+)$`).exec(x)?.[1] ?? 0))) + 1}`;

/** 这一版写出的拍子（家族格式版本纪律 2026-10-21，contract.ts）：version = major 照旧，minor / patch 两个可选整数键。写永远只写当前拍。 */
const stampOf = (k: FormatFile): Json => ({ version: FORMAT[k], minor: FORMAT_MINOR[k], patch: FORMAT_PATCH[k] });
/** 指纹用的 JSON 文本 = 去掉 minor / patch 再按写文件同一个样子串化（拍子不是内容：定稿时记的指纹里没有它们，升了 minor 的 app 再存不能把定稿的歌判成「内容变了」；
 *  老文件的原文本来就是这么串出来的，去掉两个不存在的键 = 原文）。读写两边都走这一把。 */
/** score.json 里「这首歌怎么看」的三样（score minor 5）→ 歌字段：只认 notation（非空、不是 staff 的字）/ chordTags: false / viewInC: true，别的值 = 没写（src/score/song-view.ts 的冻住的意思）。 */
const songViewFields = (x: Json | undefined): Pick<Song, "notation" | "chordTags" | "viewInC" | "middleC"> => ({
  ...(typeof x?.notation === "string" && x.notation && x.notation !== "staff" ? { notation: x.notation } : {}),
  ...(x?.chordTags === false ? { chordTags: false as const } : {}),
  ...(x?.viewInC === true ? { viewInC: true as const } : {}),
  ...(typeof x?.middleC === "number" && Number.isInteger(x.middleC) && x.middleC >= 0 && x.middleC <= 9 && x.middleC !== 4 ? { middleC: x.middleC } : {}),   // score minor 6（7-B）：字母谱里中央 C 叫 C 几（没写 = C4）
});
const fpTextOf = (o: Json): string => { const { minor: _m, patch: _p, ...rest } = o; return JSON.stringify(rest, null, 2) + "\n"; };
const KNOWN_SCORE_KEYS = new Set(["version", "minor", "patch", "papers", "parts", "view", "arrangement", "lyricFit", "barNumbers", "spacing", "denseShort", "notation", "chordTags", "viewInC", "middleC"]);
/** papers[] / parts[] 每一条里这一版认得的键（v0.16.88，设计稿第五节）：别的（更新的版本写的）按段 id / 声部 id 原样带回。
 *  phrases / parts.autoOttava 是退役的键（这一版读的时候已经处理了），算认得、不带回。
 *  规矩（Claude Fable 5.2 2026-11-10 定）：
 *   ① 能原样带回的只有 score.json / 总目录 / 休息室 / 录音房里的键。写在每段 MusicXML 里的新东西带不回（这一版是把 MusicXML 读成记号再重新写出去的，不认识的元素读不进来）
 *      ——所以打开更新版本存的歌时那句提示说的是「存一次，其中一部分会丢」，不许说「不会丢」。
 *   ② 以后的版本往这种原样带回的地方放东西，只许按段 id / 声部 id 挂，不许按音的编号挂（音的编号每次读都重编，旧版本改过谱再带回去就挂错音了）。
 *   ③ 已知的边角：段 / 声部的 id 是「现有的最大号 + 1」，删掉最后一个再新建会拿到同一个号——这时带回的东西会落到新建的那个上。只在打开了更新版本存的歌、又删又建的时候才碰得到，先记着。 */
const KNOWN_PAPER_KEYS = new Set(["id", "file", "manualBars", "unwritten", "swells", "hidden", "autoOttava", "phrases"]);
const KNOWN_PART_KEYS = new Set(["id", "role", "mic", "kind", "clef", "autoOttava", "host", "brokenChords", "chords"]);   // brokenChords = 退役的键（读成 chords: "stacked"，不再写）
const unknownById = (list: unknown, known: ReadonlySet<string>): Map<string, Json> => {
  const out = new Map<string, Json>();
  if (Array.isArray(list)) for (const e of list as Json[]) { if (!e || typeof e !== "object") continue; const rest = Object.fromEntries(Object.entries(e).filter(([k]) => !known.has(k))); if (Object.keys(rest).length) out.set(String(e.id), rest); }
  return out;
};
export interface SaveArgs { song: Song; hum: Hum; extras: Extras; app: string; date: string; view?: Record<string, unknown> | null; references?: Record<string, Uint8Array>;
  /** 渲染核心的版本 + 哈希（src/core/version.ts；每次保存都记——user 2026-10-13「核心的版本号和hash反而是每次保存的时候都要记的。ui壳无所谓」）。不给 = 不写（测试 / 旧调用方）。 */
  core?: { version: string; hash: string } }   // references = 参考窗目录（路径都在 REFERENCES_DIR 下）   // 歌名 = song.title（可不填）；hum = 编辑器里的哼的字（写进月读候选的乐器配置）
/** 歌 → .mxl 的字节。 */
export function saveMxl(a: SaveArgs): Uint8Array { return saveMxlWithFingerprint(a).bytes; }
/** 歌 → .mxl 的字节 + 这份字节里出声内容的指纹（同一趟算出来的；存盘的编码 worker 顺手带回，宿主拿它认「设备上记着的那份声音还是不是这个文件的」）。 */
export function saveMxlWithFingerprint(a: SaveArgs): { bytes: Uint8Array; fingerprint: string } {
  const { out, fingerprint } = buildEntries(a);
  const entries: Record<string, [Uint8Array, { level: 0 | 1 | 6 }]> = {};
  for (const [path, bytes] of Object.entries(out)) entries[path] = [bytes, { level: path === "mimetype" || path === THUMBNAIL_ENTRY || path === FINAL_MP3_ENTRY ? 0 : path.startsWith(SOUNDS) ? 1 : path.startsWith(REFERENCES_DIR) && !path.endsWith(".json") ? 0 : 6 }];   // 参考图本来就压过了：不再压   // mimetype 必须第一个、不压缩（插入顺序 = zip 里的顺序）；封面不压缩（尾读按 entry 名抓原始字节）；定稿 mp3 不压缩（本来就压过、歌库按 entry 名抓）；采样大、压不动，level 1 省时间
  return { bytes: zipSync(entries), fingerprint };
}
/** 出声内容的指纹（渲染缓存的钥匙：内容没变 = 上次渲好的那份还算数）。和 saveMxl 同一条管线、同一份字符串。 */
export function contentFingerprintOf(a: SaveArgs): string { return buildEntries(a).fingerprint; }
/** 写出去之前，把 token 的编号重编成「纸序 × 声部序 × 下标，从 1 起」——和读进来时 songFromReads 编的是同一套（2026-11-10，Claude Fable 5.2）。
 *  文件里的编号只在那一份文件里有用（unwritten / swells 两张表、跨小节拆开的段并回去），读的时候本来就整首重编；所以这里重编不改任何意思，旧版本照样读。
 *  为的是「写出来的谱只看内容」：内存里的编号是按这次打开里先写谁后写谁发的（新歌第一个音 n4、强制补的力度 n5；重开一次就变成力度 4、音 5），
 *  不重编的话，同样的内容存两次、中间重开过 = 两份不一样的谱文本 = 两个指纹——设备上记着的渲好的声音（src/app/render-cache.ts）就认不出「内容没变」。
 *  只动写出去的这一份；内存里的歌不动（撤销栈、光标、唱好的块的键都按内存里的编号）。不在 song.parts 里的 track（不该有）原样带着。 */
export function canonicalIds(song: Song): Song {
  let id = 1, same = true;
  const papers = song.papers.map((p) => {
    const tracks: Record<string, Token[]> = {};
    for (const part of song.parts) { const toks = p.tracks[part.id]; if (!toks) continue; tracks[part.id] = toks.map((t) => { const n = id++; if (t.id === n) return t; same = false; return { ...t, id: n }; }); }
    for (const [pid, toks] of Object.entries(p.tracks)) if (!(pid in tracks)) tracks[pid] = toks;
    if (Object.keys(p.tracks).some((k, i) => Object.keys(tracks)[i] !== k)) same = false;   // 声部在这张纸上的先后和全曲的不一样（表的键序进文件）
    return { ...p, tracks };
  });
  return same ? song : { ...song, papers };
}
/** 歌 → zip 里的每个 entry（顺序 = zip 里的顺序）+ 出声内容的指纹。 */
function buildEntries(a: SaveArgs): { out: Record<string, Uint8Array>; fingerprint: string } {
  const song = canonicalIds(a.song);
  const lounge: Record<string, Json> = { ...a.extras.lounge };
  for (const part of song.parts) {
    const role = roleOf(a.extras, part.role, a.hum);
    for (const c of cands(role)) { const i = instrumentOf(c); if (isVoice(i)) i.hum = a.hum; }   // 哼的字 = 月读候选共用的一个设置
    lounge[part.role] = role;
  }
  const studio: Json = structuredClone(a.extras.studio ?? emptyStudio());
  const tracks = ((studio.tracks as Json[] | undefined) ?? []).slice();
  for (const part of song.parts) if (!tracks.some((m) => m.id === part.mic)) tracks.push(micTrack(part.mic, _t("麦克风 {t}", { t: tracks.filter((t) => t.kind === "mic").length + 1 })));   // 每个声部的麦克风一条轨
  studio.tracks = tracks; if (!studio.master) studio.master = { gainDb: 0, limiter: true, chain: [] };
  const mics = tracks.filter((t) => t.kind === "mic");
  const labels = partLabels(song, { ...a.extras, lounge });
  const infoOf = (part: PartDef, k: number): PartInfo => {
    const role = lounge[part.role], active = cands(role).find((c) => c.id === role.active), mic = mics.find((m) => m.id === part.mic);
    return { id: part.id, name: labels[k], instrumentName: String(active?.name ?? _t("小月相")), sound: String(role.sound ?? DEFAULT_ROLE.sound),
      program: Number((active?.gm as Json | undefined)?.program ?? 55),
      variant: typeof (active?.gm as Json | undefined)?.variant === "string" ? { library: "MoonSinger", name: String((active!.gm as Json).variant) } : undefined,
      pan: mic ? Math.round(Number(mic.pan ?? 0) * 90) : undefined };
  };
  const infos = song.parts.map(infoOf), meta = { software: `MoonSinger ${a.app}`, date: a.date };
  const files: Record<string, Uint8Array> = {};
  // 谱号（v0.9.28；v0.16.88 按段）：每张纸每个声部开头挑好的谱号写进那张纸的第一个 <clef>（自动的照整首挑好的）；手选的谱号 = 纸头的谱号记号（照旧写成第二个 <clef>）。
  //   手选的大谱表 = 那张纸自己的 <staves>2；自动变出来的大谱表不写进每段的正本（那张纸照单谱表写），只在压平件里照着画——旧版本打开不会把整个声部都变成大谱表。
  const perc = new Set(song.parts.filter((part) => { const role = lounge[part.role], gm = cands(role).find((c) => c.id === role.active)?.gm as Json | undefined;
    return !!gm && percKindOf({ bank: Number(gm.bank ?? 0), program: Number(gm.program ?? 0), ...(typeof gm.note === "number" ? { note: gm.note } : {}) }) !== null; }).map((p) => p.id));   // 鼓 / 固定敲一件的不自动变大谱表（和排版同一条规矩）
  const looks = resolveSongLooks(song, perc);
  const lookAt = (paperId: string, partId: string): ResolvedLook | undefined => looks.get(paperId)?.get(partId);
  const autoOtt = (paperId: string, part: PartDef) => { const l = lookAt(paperId, part.id); return !!l && l.grand !== "explicit" && l.autoOtt; };
  const clefInfo = (paperId: string, part: PartDef): { clef?: ClefName; staves?: 2 } => { const l = lookAt(paperId, part.id); if (!l) return {}; if (l.grand === "explicit") return { staves: 2 }; return l.clef !== "G" ? { clef: l.clef } : {}; };
  // 正本：每张纸一份（这张纸上在场的声部）
  const papers = song.papers.map((p) => {
    // 自动八度线（v0.9.37）：临时插成带 ms-auto id 的记号写出去（别的软件照样画；自己读回来跳过、照样自动重算）
    const parts = song.parts.flatMap((part, k) => (p.tracks[part.id] ? [{ info: { ...infos[k], ...clefInfo(p.id, part) }, tokens: autoOtt(p.id, part) ? withAutoOttava(p.tracks[part.id], lookAt(p.id, part.id)?.clef ?? "G") : p.tracks[part.id] }] : []));
    const w = writeMusicXml({ title: song.title, movementTitle: p.name || undefined, paper: song.paper, credits: song.credits, rights: song.rights, parts }, meta);
    files[paperFile(p.id)] = strToU8(w.xml);
    // 音内的力度起伏（MusicXML 表达不了音内的发夹）：声部 → 音的 id → 哪一种
    const swells: Record<string, Record<string, "<" | ">" | "<>">> = {};
    for (const [pid, toks] of Object.entries(p.tracks)) for (const t of toks) { const sw = swellOf(t); if (sw) (swells[pid] ??= {})[String(t.id)] = sw; }   // 演奏法里的音内起伏（v0.9.44）→ 照旧这张表
    // 这一段关了自动八度线的声部（v0.16.88，只写关了的）：声部 id → false
    const aoOff = Object.entries(p.looks ?? {}).filter(([pid, l]) => l.autoOttava === false && p.tracks[pid]).map(([pid]) => [pid, false] as const);
    return { id: p.id, file: paperFile(p.id), manualBars: w.manualBars, unwritten: w.unwritten, ...(Object.keys(swells).length ? { swells } : {}), ...(p.hidden ? { hidden: true } : {}), ...(aoOff.length ? { autoOttava: Object.fromEntries(aoOff) } : {}) };
  });
  // 派生的压平件：各声部整首接起来，每张纸起新页（第一个声部写排练记号 = 曲段名）
  const flat = writeMusicXml({ title: song.title, paper: song.paper, credits: song.credits, rights: song.rights, padMeasures: true, parts: song.parts.map((part, k) => {
    const f = flattenPart(song, part.id, { tempo: k === 0, order: songPlayOrder(song) });   // 照编排的顺序（重复的纸再写一遍；循环段写一遍）   // 第一个声部带速度：它不在的纸上照那张纸最上面在场的歌手补变速（新歌手只在当前纸以后常见）
    // 谱号（v0.9.28）：每张纸开头按它自己挑好的谱号；和前面接下来的不一样 = 在纸界插一个谱号记号（压平件给别的软件看，画法要对）
    let toks = f.tokens.slice(), starts = f.starts.map((x) => ({ ...x }));
    // 有一段是大谱表（手选的或自动变的）= 整首两行写；一行的那几段音都放上面一行（标准写法：下面那行空着）
    const two = starts.some((s0) => lookAt(s0.paper.id, part.id)?.staves === 2);
    if (starts.length) {   // 自动八度线（v0.9.37）：每张纸各自按它的谱号算，插成带 ms-auto id 的记号；整首两行时一行的那几段钉在上面一行
      const out: Token[] = toks.slice(0, starts[0].index), ns = starts.map((x) => ({ ...x }));
      starts.forEach((s0, j) => {
        ns[j].index = out.length;
        const l = lookAt(s0.paper.id, part.id), seg = toks.slice(s0.index, starts[j + 1]?.index ?? toks.length);
        const drawn = !two && l && l.staves === 1 && l.autoOtt ? withAutoOttava(seg, l.clef) : seg;
        out.push(...(two && l?.staves === 1 ? drawn.map((t): Token => (t.kind === "note" || t.kind === "rest" ? { ...t, staff: 1 } : t)) : drawn));
      });
      toks = out; starts = ns;
    }
    // 整首两行写的时候，谱号记号先不带进压平件（和 2026-11-10 之前一样）：要带得对，得在每一段开头把上面那一行的谱号重新交代一遍（一行的段 = 它的谱号、大谱表的段 = 高音），
    //   还没做——记在计划书里。每一段自己的正本（papers/*.musicxml）里这些记号是照写的，不丢。
    if (two) { const keep = toks.map((t) => t.kind !== "clef"), shift = (i: number) => keep.slice(0, i).filter(Boolean).length; starts = starts.map((x) => ({ ...x, index: shift(x.index) })); toks = toks.filter((_, i) => keep[i]); }
    const first = two ? undefined : lookAt(starts[0]?.paper.id ?? "", part.id)?.clef;
    if (first) {
      let off = 0;
      for (let j = 1; j < starts.length; j++) {
        const at = starts[j].index + off, want = lookAt(starts[j].paper.id, part.id)?.clef; starts[j].index = at; if (!want) continue;
        const ds = displayStates(toks.slice(0, at), first), now = at > 0 ? ds.clef[at - 1] : first;
        if (now !== want) { toks.splice(at, 0, { kind: "clef", id: 0, clef: want }); off++; }
      }
    }
    return { info: { ...infos[k], ...(two ? { staves: 2 as const } : first && first !== "G" ? { clef: first } : {}) }, tokens: toks, breaks: new Map(starts.slice(1).map((s) => [s.index, s.paper.name])) };
  }) }, meta);
  const scoreRest = Object.fromEntries(Object.entries((a.extras.scoreExt ?? {}) as Json).filter(([k]) => !KNOWN_SCORE_KEYS.has(k)));   // 不认识的顶层键原样带回（家族纪律「未知键直通」；papers / parts 是从歌重建的）
  const oldExt = (a.extras.scoreExt ?? {}) as Json, paperExtra = unknownById(oldExt.papers, KNOWN_PAPER_KEYS), partExtra = unknownById(oldExt.parts, KNOWN_PART_KEYS);
  const scoreExt: Json = { ...scoreRest, ...stampOf("score"), papers: papers.map((e) => ({ ...(paperExtra.get(String(e.id)) ?? {}), ...e })), parts: song.parts.map((p) => ({ ...(partExtra.get(p.id) ?? {}), id: p.id, role: p.role, mic: p.mic, kind: "pitched", clef: "auto", ...(p.host ? { host: p.host } : {}), ...(p.chords !== undefined ? { chords: p.chords } : {}) })),   // chords（score minor 5）：这条轨的和弦选项，只写不是 auto 的（song-view.ts 写的时候就不留 auto）   // clef（v0.9.28，可选）：声部自己的谱号；auto = 自动（MusicXML 里写的是挑好的那个）
    ...(a.view && Object.keys(a.view).length ? { view: a.view } : {}),   // 视图态（desk）：存时顺手捞进来，全默认不写（契约 ViewV1，2026-10-08）
    ...(song.arrangement?.trim() ? { arrangement: song.arrangement } : {}),   // 编排那一行（可选，2026-10-08 深夜）
    ...(song.lyricFit === "lyrics" ? { lyricFit: "lyrics" } : {}),
    ...(song.barNumbers === "off" ? { barNumbers: "off" } : {}),
    ...(song.spacing === "tight" ? { spacing: "tight" } : {}),
    // 这首歌怎么看（score minor 5，谱面分家第三刀；src/score/song-view.ts）：只写不是「没写的意思」的值，不认识的谱种原样写回
    ...(typeof song.notation === "string" && song.notation ? { notation: song.notation } : {}),
    ...(song.chordTags === false ? { chordTags: false } : {}),
    ...(song.viewInC === true ? { viewInC: true } : {}),
    ...(typeof song.middleC === "number" && song.middleC !== 4 ? { middleC: song.middleC } : {}) };   // 字母谱里中央 C 叫 C 几（score minor 6；没写 = C4）   // 音距紧（可选，v0.16.34；正常 = 不写）   // 小节号不印（可选，v0.9.42）   // 歌词按歌词排（可选，v0.9.40；没写 = 按节奏，默认）
  // 嵌的音源：只写还有候选引用着的（换了音源 = 旧块从歌里丢掉；§10.2）
  const referenced = referencedSounds(lounge);
  const sounds = Object.entries(a.extras.sounds).filter(([p]) => referenced.has(p)).sort(([x], [y]) => (x < y ? -1 : 1));
  const json = (o: unknown) => strToU8(JSON.stringify(o, null, 2) + "\n");
  const jsonText = (o: unknown) => JSON.stringify(o, null, 2) + "\n";
  // 出声内容的指纹（src/format/final.ts）：和写出去的字符串同一份（纸的 MusicXML / score.json / 休息室 / 录音房 / 嵌的音源路径）
  const fpParts: FingerprintParts = { papers: Object.fromEntries(papers.map((p) => [p.id, strFromU8(files[p.file])])), scoreExt: fpTextOf(scoreExt),
    lounge: Object.fromEntries(Object.entries(lounge).map(([id, r]) => [id, fpTextOf(r)])), studio: fpTextOf(studio), sounds: sounds.map(([p]) => p), thumbnail: a.extras.thumbnail };
  const fingerprint = contentFingerprint(fpParts);
  const { final: _f, finalRev: _r, core: _c, ...manifestRest } = (a.extras.manifest ?? {}) as Json;   // 核心按这一次存的写；final / finalRev = 退役的定稿（v0.16.97 起不再写，读进来的总目录里有也不带回去）
  const manifest: Json = { ...manifestRest, format: "moonsinger", ...stampOf("manifest"), app: a.app, saved: a.date,
    files: { "score.json": FORMAT.score, "studio.json": FORMAT.studio, ...Object.fromEntries(Object.entries(lounge).map(([id, r]) => [`lounge/${id}.json`, Number(r.version ?? 1)])),
      ...Object.fromEntries(papers.map((p) => [`papers/${p.id}.musicxml`, 0])) },   // 0 = 标准件（MusicXML），不是我们的版本号
    derived: ["score.musicxml"],
    sounds: sounds.map(([path, b]) => ({ path, sha256: path.slice(SOUNDS.length).replace(/\.sf2$/, ""), bytes: b.length })),
    ...(a.core ? { core: { version: a.core.version, hash: a.core.hash } } : {}) };   // 渲染核心的版本 + 哈希（每次存都记）
  const rootfiles = [`<rootfile full-path="score.musicxml" media-type="application/vnd.recordare.musicxml+xml"/>`,
    ...a.extras.rootfiles.map((r) => `<rootfile full-path="${r.path}" media-type="${r.mediaType}"/>`)].join("\n    ");
  const out: Record<string, Uint8Array> = {};
  out["mimetype"] = strToU8(MIMETYPE);
  out["META-INF/container.xml"] = strToU8(`<?xml version="1.0" encoding="UTF-8"?>\n<container>\n  <rootfiles>\n    ${rootfiles}\n  </rootfiles>\n</container>\n`);
  out["score.musicxml"] = strToU8(flat.xml);
  out[`${DIR}score.json`] = json(scoreExt);
  for (const [path, bytes] of Object.entries(files)) out[path] = bytes;
  for (const [id, r] of Object.entries(lounge)) out[`${DIR}lounge/${id}.json`] = json({ ...r, ...stampOf("lounge") });
  out[`${DIR}studio.json`] = json({ ...studio, ...stampOf("studio") });
  for (const [path, bytes] of sounds) out[path] = bytes;
  for (const [path, bytes] of Object.entries(a.references ?? {})) {
    if (!path.startsWith(REFERENCES_DIR)) throw new Error(_t("参考窗的文件不在 {REFERENCES_DIR} 下：{path}", { REFERENCES_DIR, path }));
    out[path] = bytes;
  }
  for (const [path, bytes] of Object.entries(a.extras.unknown)) if (!(path in out) && path !== THUMBNAIL_ENTRY && path !== FINAL_MP3_ENTRY) out[path] = bytes;
  // 总目录和封面排在最后：歌库尾读一次（store getPeek 128 KB 尾窗）既拿到封面也拿得到总目录（歌库拿它的文本当这个文件的「戳」：每存一次都变，设备上记着的声音靠它认文件）
  out[`${DIR}manifest.json`] = json(manifest);
  if (a.extras.thumbnail) out[THUMBNAIL_ENTRY] = a.extras.thumbnail;   // 封面最后一个（尾读）
  return { out, fingerprint };
}

/** stem = 打开的文件叫什么（去掉扩展名；文件名和歌名分开：歌名在 song.title，可不填）。 */
export interface Opened { song: Song; stem: string; hum: Hum; extras: Extras; ours: boolean; notices: string[]; view: Record<string, unknown> | null; references: Record<string, Uint8Array>; /** 「更新版本写的（minor）」那一句（最多一条）：宿主 info 一次，不是报错、不拦。 */ advice: string[]; /** 老文件里带着的那份 mp3（退役的定稿）：有 = 宿主搬进这台设备的渲染缓存；这一版起不再写回文件。 */ legacyMp3?: LegacyMp3 }   // references = 参考窗目录的原样字节（没有 = {}）   // view = score.json 里的视图态（没有 = null；desk.ts 宽容读）

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
/** 给这个角色里的一位候选记下「当初作为哪件乐器上场」（CandidateV2.castAs；点回它时 withRoleConcept 套回去）。没这位 = 原样返回。 */
export function withCastAs(extras: Extras, role: string, candId: string, castAs: NonNullable<import("./contract.ts").CandidateV2["castAs"]>, hum: Hum): Extras {
  const r = roleOf(extras, role, hum), cs = r.candidates as { id: string }[] | undefined, k = cs?.findIndex((c) => c.id === candId) ?? -1;
  if (!cs || k < 0) return extras;
  r.candidates = cs.map((c, i) => (i === k ? { ...c, castAs } : c));
  return { ...extras, lounge: { ...extras.lounge, [role]: r } };
}
/** 新声部要的角色 id（休息室里没用过的「r<n>」）。 */
export function newRoleId(extras: Extras, song: Song): string { return nextKey([...Object.keys(extras.lounge), ...song.parts.map((p) => p.role)], "r"); }
/** 新声部要的麦克风 id。 */
// ── 录音房 v2：轨（mic / bus）+ 总轨（契约 StudioV2；2026-10-10 刀 4）──────────────────────────────────────────────
export type StudioTrack = { id: string; kind: "mic" | "bus"; name: string; gainDb: number; pan: number; chain: FxV2[]; sends: { to: string; gainDb: number }[]; to: string; bypass: boolean };
const emptyStudio = (): Json => ({ version: FORMAT.studio, tracks: [], master: { gainDb: 0, limiter: true, chain: [] } });
const micTrack = (id: string, name: string): Json => ({ id, kind: "mic", name, gainDb: 0, pan: 0, chain: [], sends: [], to: "master" });
const normTrack = (t: Json): StudioTrack => ({ id: String(t.id), kind: t.kind === "bus" ? "bus" : "mic", name: String(t.name ?? ""), gainDb: Number(t.gainDb ?? 0) || 0, pan: Math.max(-1, Math.min(1, Number(t.pan ?? 0) || 0)),
  chain: Array.isArray(t.chain) ? (t.chain as FxV2[]) : [], sends: Array.isArray(t.sends) ? (t.sends as { to: string; gainDb: number }[]) : [], to: typeof t.to === "string" ? t.to : "master", bypass: t.bypass === true });
/** 录音房里的轨（原样读出；没有录音房 = 空）。 */
export function studioTracks(extras: Extras): StudioTrack[] { return ((extras.studio?.tracks as Json[] | undefined) ?? []).map(normTrack); }
export function studioTrack(extras: Extras, id: string): StudioTrack | null { const t = ((extras.studio?.tracks as Json[] | undefined) ?? []).find((x) => x.id === id); return t ? normTrack(t) : null; }
/** 改一条轨（没有录音房 / 没有这条 = 先建一条 mic 轨）：增益 / 声像 / 名字 / 效果链 / 发送 / 去哪。 */
export function withTrack(extras: Extras, id: string, patch: Partial<Omit<StudioTrack, "id" | "kind">> & { kind?: "mic" | "bus" }): Extras {
  const studio: Json = structuredClone(extras.studio ?? emptyStudio());
  const tracks = ((studio.tracks as Json[] | undefined) ?? []).slice();
  let t = tracks.find((x) => x.id === id);
  if (!t) { t = patch.kind === "bus" ? { ...micTrack(id, patch.name ?? _t("总线")), kind: "bus" } : micTrack(id, patch.name ?? _t("麦克风 {x}", { x: tracks.filter((x) => x.kind === "mic").length + 1 })); tracks.push(t); }
  const { kind: _k, ...rest } = patch; Object.assign(t, structuredClone(rest));
  if (t.bypass !== true) delete t.bypass;   // 旁通只写 true（没开 = 不写这个字段）
  studio.tracks = tracks;
  return { ...extras, studio };
}
/** 删一条总线（mic 轨跟着声部走，这里不删）；指着它的发送 / 去向回总轨。 */
export function withoutBus(extras: Extras, id: string): Extras {
  const studio: Json = structuredClone(extras.studio ?? emptyStudio());
  studio.tracks = ((studio.tracks as Json[] | undefined) ?? []).filter((x) => !(x.id === id && x.kind === "bus")).map((x) => ({ ...x, to: x.to === id ? "master" : x.to, sends: ((x.sends as Json[] | undefined) ?? []).filter((sd) => sd.to !== id) }));
  return { ...extras, studio };
}
/** 混音轨往前 / 往后挪一位（只在混音轨之间换；歌手的麦克风轨不动，它们的顺序跟谱走）。到头 = 原样。v0.10.10，user「混音轨之间还可以排序」。 */
export function moveBus(extras: Extras, id: string, dir: -1 | 1): Extras {
  const tracks = ((extras.studio?.tracks as Json[] | undefined) ?? []).slice(), buses = tracks.map((t, i) => [t, i] as const).filter(([t]) => t.kind === "bus");
  const k = buses.findIndex(([t]) => t.id === id), j = k + dir; if (k < 0 || j < 0 || j >= buses.length) return extras;
  const [a, ia] = buses[k], [b, ib] = buses[j]; tracks[ia] = b; tracks[ib] = a;
  return { ...extras, studio: { ...(extras.studio as Json), tracks } };
}
export function newBusId(extras: Extras): string { return nextKey(studioTracks(extras).map((t) => t.id), "b"); }
/** 总轨（studio.json master；没写 = 0 dB + 限幅开 + 空链）。 */
export function activeMaster(extras: Extras): { gainDb: number; limiter: boolean; chain: FxV2[] } {
  const m = extras.studio?.master as { gainDb?: unknown; limiter?: unknown; chain?: unknown } | undefined;
  const g = Number(m?.gainDb ?? 0);
  return { gainDb: Number.isFinite(g) ? Math.max(-24, Math.min(12, g)) : 0, limiter: m?.limiter === undefined ? true : !!m.limiter, chain: Array.isArray(m?.chain) ? (m!.chain as FxV2[]) : [] };
}
export function withMaster(extras: Extras, patch: { gainDb?: number; limiter?: boolean; chain?: FxV2[] }): Extras {
  const studio: Json = structuredClone(extras.studio ?? emptyStudio());
  studio.master = { ...activeMaster(extras), ...structuredClone(patch) };
  return { ...extras, studio };
}
/** 跟着演奏者走的效果链（CandidateV2.chain；没有 = 空）。 */
export function activeChain(extras: Extras, role: string): FxV2[] { const c = activeCandidate(extras, role); return Array.isArray(c?.chain) ? (c!.chain as FxV2[]) : []; }
export function newMicId(extras: Extras, song: Song): string { return nextKey([...studioTracks(extras).map((m) => m.id), ...song.parts.map((p) => p.mic)], "m"); }
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
export function withMic(extras: Extras, micId: string, patch: { gainDb?: number; pan?: number }): Extras { return withTrack(extras, micId, patch); }
// ── 候选（谁来演；休息室）────────────────────────────────────────────────────────────────
export interface CandidateInfo { id: string; name: string; engine: Engine }
/** 角色的候选们（顺序 = 文件里的顺序）。没有角色快照 = 默认的两个月读。 */
export function candidates(extras: Extras, role: string): CandidateInfo[] {
  return cands(extras.lounge[role] ?? defaultRole("n", role)).map((c) => ({ id: String(c.id), name: String(c.name ?? ""), engine: instrumentOf(c)?.engine ?? "unknown" }));
}
/** 这个角色里 id 那位候选（整份 json；没有 = null）。 */
export function candidateJson(extras: Extras, role: string, id: string): Json | null { return cands(extras.lounge[role] ?? defaultRole("n", role)).find((x) => x.id === id) ?? null; }
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
export function activeCandidateName(extras: Extras, role: string): string | null { const c = activeOrDefaultCandidate(extras, role); return c ? String(c.name ?? "") : null; }   // 没有角色快照 = 默认的月读（和 activeInstrument 一致；新歌的歌手牌 / 录音室别写「没人上场」）
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

// ── 乐器预设的规矩（v0.16.38，2026-11-09 Claude Opus 5.5；施工单 ai-docs/20261109-work-order-instrument-pick-vs-tune.md §5，Fable 写的 R1–R7）──────────
//   界面上的「乐器预设」= 角色里的一位候选。「调过没有」是算出来的（设置指纹），不是到处记得去标一个布尔：
//   旧版 app（或别的设备上没更新的）打开、调了响度、原样写回不认识的字段——布尔会说谎（调过的被当成没调过、换乐器时删掉），指纹不会（设置变了就对不上 = 当作调过 = 留着）。
const isBuiltinId = (id: string): boolean => id === CANDIDATE_ID.full || id === CANDIDATE_ID.light;
/** 键名排好序的 JSON（值是 undefined 的键跳过，同 JSON.stringify）。指纹和键的先后无关。 */
const stableJson = (v: unknown): string => {
  if (Array.isArray(v)) return `[${v.map((x) => (x === undefined ? "null" : stableJson(x))).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).sort().filter((k) => (v as Record<string, unknown>)[k] !== undefined).map((k) => `${JSON.stringify(k)}:${stableJson((v as Record<string, unknown>)[k])}`).join(",")}}`;
  return JSON.stringify(v) ?? "null";
};
/** R1：设置指纹 = 去掉 id / castAs / asCast 三个键之后的 sha256 前 16 位。名字、出声的那一件、响度、移调、每一张表、效果链、署名，连同以后才有的不认识的键，全在里面。 */
export function settingsPrint(c: Json): string {
  const { id: _i, castAs: _c, asCast: _a, ...rest } = c;
  return sha256HexSync(new TextEncoder().encode(stableJson(rest))).slice(0, 16);
}
/** 内置两位的比较：名字（跟界面语言走，app 起的）和哼的字（整首歌一个，存的时候统一写）不算这一位的设置——换界面语言、换哼的字不把它变成「调过」。
 *  （施工单 R1 只说「指纹等于出厂那一位」；这两个键是 Opus 加的例外，等 Fable 审。） */
const builtinPrint = (c: Json): string => { const i = instrumentOf(c); return settingsPrint({ ...c, name: null, ...(isVoice(i) ? { instrument: { ...i, hum: null } } : {}) }); };
/** 这一位换上台以后没调过？内置两位 = 和出厂那一位一样；别的 = asCast 还等于现在的指纹（没有 asCast = 旧歌 / 旧版 app 造的 = 当作调过）。没有这一位 = false。 */
export function isUntouched(extras: Extras, role: string, id: string, hum: Hum): boolean {
  const c = candidateJson(extras, role, id); if (!c) return false;
  if (isBuiltinId(id)) { const f = cands(defaultRole(hum, role)).find((x) => x.id === id); return !!f && builtinPrint(c) === builtinPrint(f); }
  return typeof c.asCast === "string" && c.asCast === settingsPrint(c);
}
/** R2 + R3：换上台。下台的那位没调过、又不是内置的 = 同一次提交里删掉（连同没别人引用的嵌入字节）；fresh = 新造的这位记下 asCast（内置的不记）。
 *  prev = 换之前台上的是谁（新造候选的函数会顺手把台上换掉，所以由调用方在造之前记下）；默认 = 现在台上的。三条换上台的路（目录选 / 点预设 / 自己的 .sf2）都走这里。 */
export function withSwap(extras: Extras, role: string, nextActive: string, hum: Hum, o: { prev?: string; fresh?: boolean; before?: Extras } = {}): Extras {
  const prev = o.prev ?? activeId(extras, role), judge = o.before ?? extras;
  let next = withActive(extras, role, nextActive, hum);
  if (o.fresh && !isBuiltinId(nextActive)) {
    const r = roleOf(next, role, hum);
    r.candidates = cands(r).map((c) => (c.id === nextActive ? { ...c, asCast: settingsPrint(c) } : c));
    next = { ...next, lounge: { ...next.lounge, [role]: r } };
  }
  if (prev !== nextActive && !isBuiltinId(prev) && isUntouched(judge, role, prev, hum)) {
    const r = roleOf(next, role, hum); r.candidates = cands(r).filter((c) => c.id !== prev);
    next = pruneSounds({ ...next, lounge: { ...next.lounge, [role]: r } });
  }
  return next;
}
/** R5 / R6：把 fromRole 里的 fromId 拷一份到 toRole、换上台。新 id、不带 asCast（拷来的是调过的，留着）、castAs 一起拷（声部的名字 / 乐器概念跟着换）；
 *  嵌入的字节按 sha256 本来就共用一份。原来那一位一个字节不动；永远是新加一位，不覆盖已有的任何候选。同一个声部里 = 「复制一份」：名字后面加「 2」，原来那位留着。 */
export function withCandidateCopy(extras: Extras, fromRole: string, fromId: string, toRole: string, hum: Hum): Extras {
  const src = candidateJson(extras, fromRole, fromId); if (!src) return extras;
  const r = roleOf(extras, toRole, hum), list = cands(r), id = nextKey(list.map((c) => String(c.id)), "c");
  const { asCast: _a, ...copy } = structuredClone(src);
  const same = fromRole === toRole;
  if (same) copy.name = `${String(copy.name ?? "")} 2`;
  r.candidates = [...list, { ...copy, id }];
  const prev = activeId(extras, toRole);
  let next: Extras = { ...extras, lounge: { ...extras.lounge, [toRole]: r } };
  const ca = copy.castAs as import("./contract.ts").CandidateV2["castAs"];
  if (ca && typeof ca === "object") next = withRoleConcept(next, toRole, ca, hum);
  return same && prev === fromId ? withActive(next, toRole, id, hum) : withSwap(next, toRole, id, hum, { prev, before: extras });
}
/** R4：目录顶上「这首歌的乐器预设」一行列谁。本声部：台上那位 + 所有调过的；别的声部：调过的，指纹和已经列出来的一样的不再列；内置两位没调过 = 不列（它们在「常用」一行）。
 *  parts = 歌里声部的顺序（角色 id + 谱上叫什么）。 */
export interface PresetEntry { role: string; id: string; name: string; on: boolean; here: boolean; from: string; removable: boolean }
export function songPresets(extras: Extras, parts: { role: string; label: string }[], role: string, hum: Hum): PresetEntry[] {
  const out: PresetEntry[] = [], seen = new Set<string>(), act = activeId(extras, role);
  const printOf = (c: Json) => (isBuiltinId(String(c.id)) ? `b:${builtinPrint(c)}` : settingsPrint(c));
  const here = parts.find((x) => x.role === role)?.label ?? "";
  for (const c of cands(extras.lounge[role] ?? defaultRole(hum, role))) {
    const id = String(c.id), on = id === act;
    if (!on && isUntouched(extras, role, id, hum)) continue;
    seen.add(printOf(c));
    out.push({ role, id, name: String(c.name ?? ""), on, here: true, from: here, removable: !on && !isBuiltinId(id) });
  }
  const done = new Set([role]);
  for (const p of parts) {
    if (done.has(p.role)) continue; done.add(p.role);
    for (const c of cands(extras.lounge[p.role])) {
      const id = String(c.id); if (isUntouched(extras, p.role, id, hum)) continue;
      const k = printOf(c); if (seen.has(k)) continue; seen.add(k);
      out.push({ role: p.role, id, name: String(c.name ?? ""), on: false, here: false, from: p.label, removable: false });
    }
  }
  return out;
}

// ── SoundFont 候选（契约 §10.2：子集 by value 嵌进歌；弱引用 = 只记来源）────────────────────
export interface GmCandidate {
  id: string; name: string; bank: number; program: number;
  note?: number;                       // 每个音都敲这个键：鼓件 / 音效固定原速
  sfx?: { key: number; midi?: number; centsPerKey?: number; align?: boolean };   // 音效（上场时从目录按值抄的原速键 / 音高锚点；src/gm/sf-key.ts）
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
    return [{ id: String(c.id), name: String(c.name ?? ""), bank: i.bank, program: i.program, ...(i.note !== undefined ? { note: i.note } : {}), ...(i.sfx ? { sfx: i.sfx } : {}), path: s.embedded, bytes: s.embedded ? extras.sounds[s.embedded] ?? null : null, origin: s.origin, subsetSha256: s.subsetSha256 }];
  });
}
/** 现在上场的 SoundFont 候选（上场的不是它 = null）。 */
export function activeGm(extras: Extras, role: string): GmCandidate | null { const id = activeId(extras, role); return gmCandidates(extras, role).find((c) => c.id === id) ?? null; }
export interface Sf2CandidateArgs {
  name: string; bank: number; program: number; note?: number;
  sfx?: { key: number; midi?: number; centsPerKey?: number; align?: boolean };   // 音效：原速键 / 音高锚点（从目录按值抄；note 设成 sfx.key = 固定原速，默认）
  subset: Uint8Array; sha256: string;                                   // 子集字节 + 它的 sha256（调用方算，crypto.subtle 是异步的）
  embed?: boolean;                                                      // 默认 true = 字节进歌；false = 弱引用（只记来源 + 子集 sha256，歌里不带声音）
  origin: Sf2Source["origin"];                                          // 从哪个整包切的
  credit: Credit;
  calibrationDb: number;                                                // 响度校准（dB）：调用方问插件（registry.ts defaultCalibrationDb，按库；9-3）；乐器页看得见、能调
  gapSec?: number;                                                      // 连断的底色（秒）：调用方从目录（仓鼠 v11 的 joint，按 GM 号逐个）按值给；没给 = 0（不留缝）
  canSwell?: boolean;                                                   // 能不能在一个音里面变强（仓鼠 v11 的 sustain = sustained）；没给 = 能
}
/** 加一个 SoundFont 候选并让它上场。同一份字节（同 sha256）只存一份。 */
export function withSf2Candidate(extras: Extras, role: string, c: Sf2CandidateArgs, hum: Hum): Extras {
  const r = roleOf(extras, role, hum);
  const list = cands(r);
  const n = Math.max(0, ...list.map((x) => Number(/^c(\d+)$/.exec(String(x.id))?.[1] ?? 0))) + 1, id = `c${n}`;
  const embed = c.embed !== false, path = embed ? `${SOUNDS}${c.sha256}.sf2` : null;
  const instrument: InstrumentV2 = { engine: "soundfont", bank: c.bank, program: c.program, ...(c.note !== undefined ? { note: c.note } : {}), ...(c.sfx ? { sfx: { ...c.sfx } } : {}), source: { embedded: path, subsetBytes: c.subset.length, subsetSha256: c.sha256, origin: c.origin } };
  list.push({ id, name: c.name, instrument, gm: { program: c.bank === 128 ? null : c.program + 1, variant: null }, ...common(c.calibrationDb), articulation: { ...ARTICULATION, gapSec: Math.max(0, Math.min(GAP_MAX_SEC, c.gapSec ?? 0)), marcatoDb: MARCATO_DB, accentVel: ACCENT_VEL, marcatoVel: MARCATO_VEL, ...MARK_DEFAULTS, ...(c.canSwell === false ? { canSwell: false } : {}) }, dynamicsVel: { ...DYNAMICS_VEL }, defaults: { ...SOUNDFONT_DEFAULTS, velocity: DYNAMICS_VEL.mf / 127 }, credit: c.credit, spec: structuredClone(SOUNDFONT_SPEC) });
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
  if (r.active === id) throw new Error(_t("上场的候选不能删，先换一个「谁来演」"));
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
/** 上场那位的力度表（力度记号 → 力度；9-2 起全体一张，没带 = 标准表 DYNAMICS_VEL）/ 跳音吃掉多少 / 重音加多少。没有角色快照或字段缺 = app 内置那份（ARTICULATION…）。 */
export function activePerfSpec(extras: Extras, role: string): { staccatoGate: number; accentDb: number; gapSec: number;
  marcatoDb: number; dynamicsVel: Record<Dynamic, number>; accentVel: number; marcatoVel: number;
  stressDb: number; stressVel: number; unstressDb: number; unstressVel: number; ghostDb: number; ghostVel: number;
  accentSec: number; breathSec: number; breathShare: number; gapShare: number; wedgeStepVel: number; sfzDb: number; sfzVel: number; sfzSec: number; fpSec: number; swellDb: number; canSwell: boolean; sing: Record<string, SingMark | null>; rollHz: number | null } {
  const c = activeCandidate(extras, role), a = (c?.articulation ?? {}) as Partial<Record<string, number>>;
  const num = (v: unknown, dflt: number) => (typeof v === "number" && Number.isFinite(v) ? v : dflt);
  // 力度表：pp…ff 没写 = 默认；ppp / fff 没写（v0.9.23 之前的演奏者）= 按这位自己 pp→p / f→ff 的间隔往外推一档（不是拿默认表硬塞，免得和它自己的表不成比例）
  const ladder = (got: Partial<Record<string, number>>, dflt: Record<Dynamic, number>, clamp: (v: number) => number = (v) => v): Record<Dynamic, number> => {
    const o = {} as Record<Dynamic, number>;
    for (const k of ["pp", "p", "mp", "mf", "f", "ff"] as const) o[k] = clamp(num(got[k], dflt[k]));
    o.ppp = clamp(num(got.ppp, o.pp - (o.p - o.pp))); o.fff = clamp(num(got.fff, o.ff + (o.ff - o.f)));
    return o;
  };
  return { staccatoGate: Math.max(0.05, Math.min(1, num(a.staccatoGate, ARTICULATION.staccatoGate))), accentDb: num(a.accentDb, ARTICULATION.accentDb), gapSec: Math.max(0, Math.min(GAP_MAX_SEC, num(a.gapSec, 0))),
    marcatoDb: num(a.marcatoDb, MARCATO_DB), accentVel: num(a.accentVel, ACCENT_VEL), marcatoVel: num(a.marcatoVel, MARCATO_VEL),
    accentSec: Math.max(0, num(a.accentSec, MARK_DEFAULTS.accentSec)), breathSec: Math.max(0, num(a.breathSec, MARK_DEFAULTS.breathSec)), breathShare: Math.max(0, Math.min(1, num(a.breathShare, MARK_DEFAULTS.breathShare))),
    gapShare: Math.max(0, Math.min(1, num(a.gapShare, MARK_DEFAULTS.gapShare))), wedgeStepVel: num(a.wedgeStepVel, MARK_DEFAULTS.wedgeStepVel),
    sfzDb: num(a.sfzDb, MARK_DEFAULTS.sfzDb), sfzVel: num(a.sfzVel, MARK_DEFAULTS.sfzVel), sfzSec: Math.max(0.01, num(a.sfzSec, MARK_DEFAULTS.sfzSec)), fpSec: Math.max(0.01, num(a.fpSec, MARK_DEFAULTS.fpSec)),
    swellDb: num(a.swellDb, MARK_DEFAULTS.swellDb), canSwell: (a as Json).canSwell !== false,
    stressDb: num(a.stressDb, MARK_DEFAULTS.stressDb), stressVel: num(a.stressVel, MARK_DEFAULTS.stressVel), unstressDb: num(a.unstressDb, MARK_DEFAULTS.unstressDb),
    unstressVel: num(a.unstressVel, MARK_DEFAULTS.unstressVel), ghostDb: num(a.ghostDb, MARK_DEFAULTS.ghostDb), ghostVel: num(a.ghostVel, MARK_DEFAULTS.ghostVel),
    sing: { ...SING_MARKS, ...((c?.sing ?? {}) as Record<string, SingMark | null>) },
    rollHz: typeof a.rollHz === "number" && Number.isFinite(a.rollHz) ? Math.max(ROLL_HZ_MIN, Math.min(ROLL_HZ_MAX, a.rollHz)) : null,   // 滚奏每秒几下（v0.16.64）；没写 = 按乐器默认
    dynamicsVel: c?.dynamicsVel ? ladder(c.dynamicsVel as Partial<Record<string, number>>, DYNAMICS_VEL, (v) => Math.max(1, Math.min(127, v))) : { ...DYNAMICS_VEL } };   // 没带 = 标准表原样（9-2；不外推）
}
/** 连断底色能调到多大（秒）。 */
export const GAP_MAX_SEC = 0.2;
/** 改上场那位的滚奏密度（乐器页；每秒几下，ROLL_HZ_MIN … ROLL_HZ_MAX；null = 去掉、回到乐器默认）。没人上场 = 原样。v0.16.64 */
export function withRollHz(extras: Extras, role: string, hz: number | null, hum: Hum): Extras {
  const r = roleOf(extras, role, hum), c = cands(r).find((x) => x.id === r.active); if (!c) return extras;
  const { rollHz: _old, ...rest } = (c.articulation ?? {}) as Json;
  c.articulation = hz === null ? rest : { ...rest, rollHz: Math.round(Math.max(ROLL_HZ_MIN, Math.min(ROLL_HZ_MAX, hz))) };
  return { ...extras, lounge: { ...extras.lounge, [role]: r } };
}
/** 改上场那位的连断底色（乐器页；秒，0 … GAP_MAX_SEC，记到毫秒）。没人上场 = 原样。 */
export function withGapSec(extras: Extras, role: string, sec: number, hum: Hum): Extras {
  const r = roleOf(extras, role, hum), c = cands(r).find((x) => x.id === r.active); if (!c) return extras;
  c.articulation = { ...((c.articulation ?? {}) as Json), gapSec: Math.round(Math.max(0, Math.min(GAP_MAX_SEC, sec)) * 1000) / 1000 };
  return { ...extras, lounge: { ...extras.lounge, [role]: r } };
}

// ── 响度校准（候选的 calibrationDb：契约「看得见、能调的默认，不偷偷自动」；user「不太建议自动校准，除非是可调的默认。不然就是不透明了」）──
/** 上场那位的校准（dB；没写 = UNWRITTEN_CALIBRATION_DB，格式的意思）。渲染时乘在这个声部上，和录音室推子相加（推子 = 混音决定，校准 = 演奏者自己的响度）。 */
export function activeCalibrationDb(extras: Extras, role: string): number { const c = activeCandidate(extras, role); const v = Number(c?.calibrationDb ?? UNWRITTEN_CALIBRATION_DB); return Number.isFinite(v) ? v : UNWRITTEN_CALIBRATION_DB; }   // 旧歌里存的数照旧
// ── 力度（候选的 defaults.velocity：没画曲线的音用的默认数，by value；SoundFont = MIDI 力度 ÷ 127）──
//   2026-10-08 Opus 5.5；user「接啊，但是接的不是mp mf，而就是力度的这个旋钮」：渲染 / pad 试弹读这一个数（原来写死 0.8，候选里存的没人读）。
//   GS 很多音色按力度换录音层（仓鼠 v11 velLayers 实测）= 音色会变，不只是响度；谱上的 mp / mf 照旧只改音量。
/** 上场那位的力度（0–1，= MIDI 力度 ÷ 127）；没写 = SOUNDFONT_DEFAULTS.velocity。 */
export function activeVelocity(extras: Extras, role: string): number {
  const c = activeCandidate(extras, role), v = Number(((c?.defaults ?? {}) as Json).velocity ?? SOUNDFONT_DEFAULTS.velocity);
  return Number.isFinite(v) ? Math.max(1 / 127, Math.min(1, v)) : SOUNDFONT_DEFAULTS.velocity;
}
/** 改上场那位的力度（记到 MIDI 整数格：k / 127）。没人上场 = 原样。 */
export function withVelocity(extras: Extras, role: string, v: number, hum: Hum): Extras {
  const r = roleOf(extras, role, hum), c = cands(r).find((x) => x.id === r.active); if (!c) return extras;
  c.defaults = { ...((c.defaults ?? {}) as Json), velocity: Math.max(1, Math.min(127, Math.round(v * 127))) / 127 };
  return { ...extras, lounge: { ...extras.lounge, [role]: r } };
}
/** 改上场那位的校准。 */
export function withCalibration(extras: Extras, role: string, dB: number, hum: Hum): Extras {
  const r = roleOf(extras, role, hum), c = cands(r).find((x) => x.id === r.active); if (!c) return extras;
  c.calibrationDb = Math.round(dB * 10) / 10;
  return { ...extras, lounge: { ...extras.lounge, [role]: r } };
}
// ── 音效：固定原速 / 音高对齐（上场那位的 instrument.note / sfx.align；2026-10-08 by Claude Opus 5.5；user「固定原速同意，默认开。碰到猫叫歌才关，但这个时候也许需要音高修正」）──
/** 固定原速开 / 关：开 = 每个音都敲原速键（note = sfx.key）；关 = 按写的音敲（可再开音高对齐）。不是音效 = 原样。 */
export function withSfxFixed(extras: Extras, role: string, on: boolean, hum: Hum): Extras {
  const r = roleOf(extras, role, hum), i = instrumentOf(cands(r).find((x) => x.id === r.active));
  if (i?.engine !== "soundfont" || !i.sfx) return extras;
  if (on) i.note = i.sfx.key; else delete i.note;
  return { ...extras, lounge: { ...extras.lounge, [role]: r } };
}
/** 月读分段唱的粒度（上场那位；没写 = 每句）。user「开关是歌手的属性，可以有不同的粒度」。 */
export function activeSingChunk(extras: Extras, role: string): "phrase" | "sheet" | "whole" {
  const i = activeInstrument(extras, role);
  return i?.engine === "tsukuyomi" && (i.chunk === "sheet" || i.chunk === "whole") ? i.chunk : "phrase";
}
/** 小月相唱法核心的旋钮（存在候选 defaults 里，by value；没写 = TSUKUYOMI_DEFAULTS；2026-10-15 user「齐平和其他的也都放在高级设置里面可以持久化」）。 */
export const SING_CORE_KEYS = ["level", "levelContinuous", "levelMaxDb", "cleanMax", "breath"] as const;
export type SingCoreKey = (typeof SING_CORE_KEYS)[number];
export function activeSingCore(extras: Extras, role: string): Record<SingCoreKey, number> {
  const c = activeCandidate(extras, role), d = (c?.defaults ?? {}) as Record<string, unknown>, out = { ...TSUKUYOMI_DEFAULTS } as Record<SingCoreKey, number>;
  if (instrumentOf(c)?.engine === "tsukuyomi") for (const k of SING_CORE_KEYS) if (typeof d[k] === "number") out[k] = d[k] as number;
  return out;
}
export function withSingCore(extras: Extras, role: string, key: SingCoreKey, value: number, hum: Hum): Extras {
  const r = roleOf(extras, role, hum), c = cands(r).find((x) => x.id === r.active);
  if (!c || instrumentOf(c)?.engine !== "tsukuyomi") return extras;
  c.defaults = { ...((c.defaults ?? {}) as Record<string, number>), [key]: value };
  return { ...extras, lounge: { ...extras.lounge, [role]: r } };
}
export function withSingChunk(extras: Extras, role: string, v: "phrase" | "sheet" | "whole", hum: Hum): Extras {
  const r = roleOf(extras, role, hum), i = instrumentOf(cands(r).find((x) => x.id === r.active));
  if (i?.engine !== "tsukuyomi") return extras;
  if (v === "phrase") delete i.chunk; else i.chunk = v;
  return { ...extras, lounge: { ...extras.lounge, [role]: r } };
}
/** 音高对齐开 / 关（只在没固定原速、原速时听得出音高时有意义）。 */
export function withSfxAlign(extras: Extras, role: string, on: boolean, hum: Hum): Extras {
  const r = roleOf(extras, role, hum), i = instrumentOf(cands(r).find((x) => x.id === r.active));
  if (i?.engine !== "soundfont" || !i.sfx) return extras;
  if (on) i.sfx.align = true; else delete i.sfx.align;
  return { ...extras, lounge: { ...extras.lounge, [role]: r } };
}
// ── 修八度 / 移调（候选的 transpose，半音；2026-10-08 by Claude Opus 5.5；user「修八度和移调的音色级别的选项…大部分情况不应该动，是worst case兜底」）──
/** 上场那位的移调（半音；没写 = 0）。 */
export function activeTranspose(extras: Extras, role: string): number { const v = Number(activeCandidate(extras, role)?.transpose ?? 0); return Number.isInteger(v) ? v : 0; }
/** 改上场那位的移调（夹在 ±48；0 = 去掉字段，存档不多出 0）。 */
export function withTranspose(extras: Extras, role: string, semis: number, hum: Hum): Extras {
  const r = roleOf(extras, role, hum), c = cands(r).find((x) => x.id === r.active); if (!c) return extras;
  const t = Math.max(-48, Math.min(48, Math.round(semis)));
  if (t) c.transpose = t; else delete c.transpose;
  return { ...extras, lounge: { ...extras.lounge, [role]: r } };
}

// ── 读 ─────────────────────────────────────────────────────────────────────────────────
/** 别的软件存的单份谱：没有 <work-title> 就拿 <movement-title> 当歌名（不当曲段名）。 */
const foreign = (r0: ReadScore): ReadScore => { const r = { ...r0, parts: safePartIds(r0.parts) }; return r.title || !r.movementTitle ? r : { ...r, title: r.movementTitle, movementTitle: "" }; };   // 声部编号先过 ids.ts 那一关（不合规矩的换成 P<n>）
/** 自家文件里的编号不合规矩 = 拒开、明说哪一类有几个（不把那个编号本身抄出来：它可能就是有人故意写坏的那一串）。 */
const ID_KIND = (): Record<IdKind, string> => ({ paper: _t("曲段"), part: _t("声部"), role: _t("角色"), track: _t("混音轨"), candidate: _t("演奏者"), fx: _t("效果格"), fxKind: _t("效果的种类") });
function refuseBadIds(bad: Partial<Record<IdKind, number>>): void {
  const l = Object.entries(bad) as [IdKind, number][]; if (!l.length) return;
  const names = ID_KIND();
  throw new Error(_t("这首歌的文件里有不合规矩的编号（{what}）：多半是被别的工具改过或者文件坏了，没有打开。", { what: l.map(([k, n]) => _t("{k} {n} 个", { k: names[k], n })).join(_t("、")) }));
}
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
  try { files = unzipSync(bytes); } catch (e) { throw new Error(_t("这个文件解不开（不是完整的 .mxl？）：{Error}", { Error: (e as Error).message })); }
  const container = files["META-INF/container.xml"];
  if (!container) throw new Error(_t("这个压缩包里没有 META-INF/container.xml，不是 .mxl"));
  const paths = [...strFromU8(container).matchAll(/<rootfile\b[^>]*full-path="([^"]+)"[^>]*?(?:media-type="([^"]*)")?[^>]*\/?>/g)].map((m) => ({ path: m[1], mediaType: m[2] ?? "" }));
  const main = paths[0]?.path;
  if (!main || !files[main]) throw new Error(_t("container.xml 指的主乐谱在包里找不到"));
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
  const parse = (p: string): Json => { try { return JSON.parse(strFromU8(files[p])) as Json; } catch { throw new Error(_t("{p} 读不懂（文件坏了？）", { p })); } };
  const manifest = parse(`${DIR}manifest.json`); known.add(`${DIR}manifest.json`);
  const references: Record<string, Uint8Array> = {};   // 参考窗：整个目录原样拿出来（库去解）
  for (const [p, b] of Object.entries(files)) if (p.startsWith(REFERENCES_DIR) && !p.endsWith("/")) { references[p] = b; known.add(p); }
  // 三级拍子（家族格式版本纪律 2026-10-21）：major 比自己新 = 拒开（不降级不猜）；minor 比自己新 = 能开能改能存、未知键原样带回、告诉用户一次（advice，不是报错不拦）；patch 比自己新 = 静默
  const newerMinor: string[] = [];
  const newer = (what: string, j: Json, kind: FormatFile) => {
    const major = Number(j.version ?? 1), minor = Number(j.minor ?? 0);
    if (major > FORMAT[kind]) throw new Error(_t("这首歌是更新版本的 MoonSinger 存的（{what} 第 {major} 版，这一版只认到第 {p} 版），打开再存会丢东西，所以没有打开。请先更新 app。", { what, major, p: FORMAT[kind] }));
    if (major === FORMAT[kind] && minor > FORMAT_MINOR[kind]) newerMinor.push(what);
  };
  newer(_t("总目录"), manifest, "manifest");
  extras.manifest = migrate("manifest", manifest);
  const rawLounge: Record<string, string> = {};   // 指纹用：文件里的原文（读进来的和写出去的同一份字符串）
  let scoreExt: Json | null = null;
  if (files[`${DIR}score.json`]) {
    const s0 = parse(`${DIR}score.json`); known.add(`${DIR}score.json`); newer(_t("谱的扩展"), s0, "score");
    scoreExt = migrate("score", s0); extras.scoreExt = scoreExt;
  }
  for (const p of Object.keys(files)) {
    const m = /^\.moonsinger\/lounge\/([^/]+)\.json$/.exec(p);
    if (m) { const r = parse(p); newer(_t("休息室「{name}」", { name: r.name ?? m[1] }), r, "lounge"); extras.lounge[m[1]] = migrate("lounge", r); known.add(p); rawLounge[m[1]] = fpTextOf(r); }
  }
  if (files[`${DIR}studio.json`]) { const s = parse(`${DIR}studio.json`); known.add(`${DIR}studio.json`); newer(_t("录音房"), s, "studio"); extras.studio = migrate("studio", s); }
  for (const p of Object.keys(files)) if (p.startsWith(SOUNDS) && !p.endsWith("/")) { extras.sounds[p] = files[p]; known.add(p); }   // 嵌的音源字节（整份留着；存档只写还引用着的）
  refuseBadIds(badIds(scoreExt, extras.lounge, extras.studio));   // 读入边界：当编号用的字段都过 ids.ts 那一关，往下的代码（含把编号拼进页面的界面）拿到的都是合规矩的
  // 老文件里带着的那份 mp3（退役的定稿，见 LegacyMp3）：总目录里的记录 + mp3 entry。记录像样 ∧ mp3 在 ∧ 和文件里的内容对得上 = 交给宿主搬进设备缓存；
  //   别的情况（记录读不懂 / mp3 不在 / 定稿后被旧版 app 或别的软件改过）= 当它不存在，不报错、不拒开（老文件永远读得开）。两种情况那两个 entry 都算认识的：不进 unknown、不写回。
  let legacyRec: FinalRecord | null = null, legacyBytes: Uint8Array | null = null;
  if (files[FINAL_MP3_ENTRY]) known.add(FINAL_MP3_ENTRY);
  if (manifest.final !== undefined) {
    const rec = parseFinalRecord(manifest.final), mp3 = rec ? files[rec.mp3.path] : undefined;
    if (rec && rec.mp3.path !== FINAL_MP3_ENTRY) known.add(rec.mp3.path);
    const paperList = ((scoreExt?.papers as Json[] | undefined) ?? []);
    const papersRaw: Record<string, string> = {};
    for (const p of paperList) { const f = String(p.file ?? paperFile(String(p.id))); if (files[f]) papersRaw[String(p.id)] = strFromU8(files[f]); }
    const fp = rec && files[`${DIR}score.json`] && files[`${DIR}studio.json`]
      ? contentFingerprint({ papers: papersRaw, scoreExt: fpTextOf(parse(`${DIR}score.json`)), lounge: rawLounge, studio: fpTextOf(parse(`${DIR}studio.json`)), sounds: Object.keys(extras.sounds), thumbnail: files[THUMBNAIL_ENTRY] ?? null })
      : null;
    if (rec && mp3 && mp3.length === rec.mp3.bytes && fp === rec.fingerprint) { legacyRec = rec; legacyBytes = mp3; }
  }
  // 纸：按 score.json 的顺序表逐张读；第 1 版存的（迁移后 papers = [p1]，文件指向 papers/p1.musicxml）包里没那份 = 读 score.musicxml（文件级迁移在这里做，migrate() 只管 JSON）
  const list = ((scoreExt?.papers as Json[] | undefined) ?? [{ id: "p1", file: paperFile("p1"), manualBars: {}, unwritten: [] }]);
  // score minor < 4 = 谱号 / 大谱表 / 自动八度线还挂在声部上的老写法（v0.16.88 起按段；v0.16.83–87 已经是 minor 3，所以分界在 4）
  const legacyLooks = Number(scoreExt?.minor ?? 0) < 4;
  const reads: ReadScore[] = [];
  const papers: PaperSeg[] = [];
  list.forEach((p, k) => {
    const file = String(p.file ?? paperFile(String(p.id)));
    const b = files[file] ?? (k === 0 ? files[main] : undefined);
    if (!b) throw new Error(_t("纸「{id}」的谱（{file}）在包里找不到", { id: p.id, file }));
    known.add(file);
    const r = readMusicXml(strFromU8(b), { manualBars: (p.manualBars as Record<string, number[]> | undefined) ?? {}, unwritten: (p.unwritten as string[] | undefined) ?? [] });
    refuseBadIds({ ...(r.parts.some((x) => !isSafeId(x.info.id)) ? { part: r.parts.filter((x) => !isSafeId(x.info.id)).length } : {}) });   // 每张纸的谱里的声部编号也过一遍
    reads.push(r);
    const seg = paperOfRead(String(p.id), r); if (p.hidden === true) seg.hidden = true;
    // papers[].phrases（老歌里的句号，v0.16.86 去掉了）：不读，丢掉——歌词、音一个不动（user 11-10「好，整个去掉」）
    // 这一段关了自动八度线的声部（v0.16.88 起写；更早的歌在 songFromReads 里从声部上搬过来）
    const aoOff = p.autoOttava as Record<string, unknown> | undefined;
    if (!legacyLooks && aoOff && typeof aoOff === "object") seg.looks = Object.fromEntries(Object.entries(aoOff).filter(([pid, v]) => v === false && seg.tracks[pid]).map(([pid]) => [pid, { autoOttava: false as const }]));
    const sw = p.swells as Record<string, Record<string, string>> | undefined;   // 音内的力度起伏：按音的 id 挂回去（认不出的种类不挂）
    if (sw) for (const [pid, m] of Object.entries(sw)) { const toks = seg.tracks[pid]; if (!toks) continue; for (const [id, v] of Object.entries(m)) { if (v !== "<" && v !== ">" && v !== "<>") continue; const k = toks.findIndex((t) => t.kind === "note" && t.id === Number(id)); if (k >= 0) toks[k] = withArt(toks[k] as NoteTok, SWELL_ART[v as Swell], true); } }
    papers.push(seg);
  });
  for (const [p, b] of Object.entries(files)) if (!known.has(p) && !p.endsWith("/")) extras.unknown[p] = b;
  const song = songFromReads(reads, papers, (scoreExt?.parts as Json[] | undefined) ?? null, legacyLooks);
  const o = finish(reads, song, pruneSounds(extras), ours, name);
  // 老文件里的 mp3 上面已经按文件原文核过是这份内容的。这一版读进来再写出去的样子可能和原文不一样（音的编号重编：旧版本写的是内存里的编号，这一版起写的是重编过的，见 canonicalIds；老写法搬成新写法：句号去掉、声部上的谱号 / 自动八度线搬到每一段）——
  //   内容没变，只是写法变了。交给宿主的指纹 = 「这一版写出来的样子」的（宿主之后拿 contentFingerprintOf 来对的就是这个）。
  const legacyMp3: LegacyMp3 | undefined = legacyRec && legacyBytes
    ? { bytes: legacyBytes, fingerprint: buildEntries({ song: o.song, hum: o.hum, extras: o.extras, app: "", date: "" }).fingerprint, secs: legacyRec.mp3.secs, kbps: legacyRec.mp3.kbps, stereo: legacyRec.mp3.stereo,
        parts: legacyRec.parts, app: legacyRec.app, core: legacyRec.core, rev: legacyRec.rev }
    : undefined;
  const advice = newerMinor.length ? [_t("这首歌是更新版本的 MoonSinger 存的（{p}里有这一版还没有的东西）：照样能开能改能存，只是那些东西这一版看不到，在这一版里存一次，其中一部分会丢。想原样留着，先更新 app 再改。", { p: newerMinor.join("、") })] : [];
  return { ...o, references, advice, ...(legacyMp3 ? { legacyMp3 } : {}) };
}

/** 读进来的几张纸 → 歌。parts = score.json 的声部并集（没有 = 按纸里出现的声部 P1…）。
 *  token id 统一重编（纸序 × 声部序 × 下标，从 1 起）：全歌唯一、确定；文件里的 id 只在读那份文件时有用（unwritten / 拆段并回）。 */
function songFromReads(reads: ReadScore[], papers: PaperSeg[] | null, partList: Json[] | null = null, legacyLooks = true): Song {
  const ps = papers ?? [paperOfRead("p1", reads[0])];
  const seen = new Map<string, PartDef>();
  const clefFromScore = new Set<string>();   // score.json 里写了 clef 的声部（v0.9.28 起都写：auto = 自动）：不再看 MusicXML 的第一个 <clef>
  const oldClef = new Map<string, ClefName>(), oldAoOff = new Set<string>();   // 老写法（score minor < 4）：声部上的默认谱号 / 关了自动八度线
  for (const p of partList ?? []) {
    const d: PartDef = { id: String(p.id), role: String(p.role ?? `r${seen.size + 1}`), mic: String(p.mic ?? `m${seen.size + 1}`) };
    if ("clef" in p) { clefFromScore.add(d.id); if (legacyLooks && (CLEFS as readonly unknown[]).includes(p.clef)) oldClef.set(d.id, p.clef as ClefName); }
    if (legacyLooks && p.autoOttava === false) oldAoOff.add(d.id);   // 这位不要自动八度线（v0.9.37，老写法）
    if (typeof p.chords === "string" && p.chords && p.chords !== "auto") d.chords = p.chords;   // 这条轨的和弦选项（score minor 5；不认识的值原样留着）
    else if (p.chords === undefined && p.brokenChords === false) d.chords = "stacked";   // 老写法（v0.16.73–score minor 4）：这位不认分解和弦 = 只认叠在一起的
    if (typeof p.host === "string" && p.host) d.host = p.host;   // 合租（v0.10.24）：下面核一遍
    seen.set(d.id, d);
  }
  for (const d of seen.values()) { const h = d.host ? seen.get(d.host) : undefined; if (d.host && (!h || h.id === d.id || h.host)) delete d.host; }   // 主人不在 / 挂自己 / 主人也是房客 = 不合租
  for (const p of ps) for (const id of Object.keys(p.tracks)) if (!seen.has(id)) seen.set(id, { id, role: `r${seen.size + 1}`, mic: `m${seen.size + 1}` });
  // 谱号 / 大谱表 / 自动八度线按段（v0.16.88，user 11-09「收到前面的per sheet而不是跟着歌手」）。读的时候：
  //   ① 每张纸自己的 <staves>2 = 那一段大谱表；老写法（minor < 4）每张纸都写了 = 这个声部在的每一段都是（和原来画的一样）
  //   ② 老写法的声部默认谱号 X = 没写纸头谱号的那几段各补一个纸头谱号 X；score.json 没写 clef 的（v0.9.28 以前 / 别家的谱）= 那张纸第一个 <clef> 不是普通高音谱号的，补成那一段的纸头谱号
  //   ③ 老写法的「这位不要自动八度线」= 它在的每一段都关
  const grandAt = new Set<string>();   // "纸 id\n声部 id"
  ps.forEach((seg, k) => { for (const rp of reads[k]?.parts ?? []) if (rp.info.staves === 2 && seg.tracks[rp.info.id]) grandAt.add(`${seg.id}\n${rp.info.id}`); });
  if (legacyLooks) for (const id of seen.keys()) if (ps.some((seg) => grandAt.has(`${seg.id}\n${id}`))) for (const seg of ps) if (seg.tracks[id]) grandAt.add(`${seg.id}\n${id}`);
  ps.forEach((seg, k) => {
    const lk: Record<string, PartLook> = { ...(seg.looks ?? {}) };
    for (const id of Object.keys(seg.tracks)) {
      const grand = grandAt.has(`${seg.id}\n${id}`);
      if (grand) lk[id] = { ...lk[id], grand: true };
      if (oldAoOff.has(id)) lk[id] = { ...lk[id], autoOttava: false };
      if (grand) continue;
      const fileClef = reads[k]?.parts.find((rp) => rp.info.id === id)?.info.clef;
      // 第一个 <clef> 当成手选的谱号，只对老写法里 score.json 没写 clef 的声部（v0.9.28 以前 / 别家的谱）；新写法（minor ≥ 4）手选的一律是纸头的谱号记号，
      //   不看 parts[].clef 这个键在不在（它现在只是写给旧版本看的）。
      const want = oldClef.get(id) ?? (legacyLooks && !clefFromScore.has(id) && fileClef && fileClef !== "G" ? fileClef : undefined);
      const toks = seg.tracks[id];
      if (want && !headClefOf(toks)) { const at = headLen(toks); seg.tracks[id] = [...toks.slice(0, at), { kind: "clef", id: 0, clef: want }, ...toks.slice(at)]; }
    }
    const clean = withLooks(seg, lk); if (clean.looks) seg.looks = clean.looks; else delete seg.looks;
  });
  const parts = familyOrder([...seen.values()]);   // 一家挨在一起（v0.10.36：旧文件里房客可能没挨着主人）
  let id = 1;
  const renumbered = ps.map((p) => ({ ...p, tracks: Object.fromEntries(parts.flatMap((part) => (p.tracks[part.id] ? [[part.id, p.tracks[part.id].map((t) => ({ ...t, id: id++ }))]] : []))) }));
  const r0 = reads[0];
  return { ...(r0.title ? { title: r0.title } : {}), ...(r0.paper ? { paper: r0.paper } : {}), ...(r0.credits ? { credits: r0.credits } : {}), ...(r0.rights ? { rights: r0.rights } : {}), hum: "n", parts, papers: renumbered };
}

function finish(reads: ReadScore[], song0: Song, extras: Extras, ours: boolean, name: string): Opened {
  const notices: string[] = [];
  // 声部就是歌手（2026-10-08，user「嗯声部就是歌手」）：一个角色只归一个声部（跨纸按声部连、麦克风由歌手认领）。两个声部共用一个角色（手改过的文件）=
  //   后面那个拆成一位新歌手：休息室那份原样复制给它（谁来演、怎么演都一样），麦克风照旧共用（几位歌手可以认领同一个麦克风）。什么都不丢，说一声。
  const usedRoles = new Set<string>();
  song0 = { ...song0, parts: song0.parts.map((part) => {
    if (!usedRoles.has(part.role)) { usedRoles.add(part.role); return part; }
    const nr = newRoleId(extras, { ...song0, parts: [...song0.parts, ...[...usedRoles].map((r) => ({ id: "", role: r, mic: "" }))] });   // 这一轮已经分出去的也算占用
    if (extras.lounge[part.role]) { extras.lounge[nr] = structuredClone(extras.lounge[part.role]); notices.push(_t("声部「{name}」和别的声部共用一份乐器设置；每个声部有自己的乐器，所以拆成了两份（乐器和设置都照抄）。", { name: String(extras.lounge[part.role].name ?? part.id) })); }
    usedRoles.add(nr);
    return { ...part, role: nr };
  }) };
  const dropped: Record<string, number> = {};
  for (const r of reads) for (const [k, n] of Object.entries(r.dropped)) dropped[k] = (dropped[k] ?? 0) + n;
  const dl = Object.entries(dropped);
  if (dl.length) notices.push(_t("这份谱里有这一版还不支持的东西，没有读进来：{k}。存的时候它们不会在新文件里——要留原样，请「另存为」新文件。", { k: dl.map(([k, n]) => _t("{k} {n} 处", { k, n })).join("、") }));
  const infos = new Map<string, ReadPart>();
  for (const r of reads) for (const p of r.parts) if (!infos.has(p.info.id)) infos.set(p.info.id, p.info);
  for (const part of song0.parts) {
    if (extras.lounge[part.role] || ours) continue;
    // 别的软件存的谱：声部原来的乐器记成这个角色的候选（引擎 unknown）、就是它上场；这一版没有那件乐器 → 没人上场，人来选（user「不出声，报错，人类手动换」）
    const p = infos.get(part.id);
    const was = p?.instrumentName || p?.name || _t("原来的乐器");
    const gm = p?.program;
    const role = defaultRole("n", part.role);
    role.name = p?.name || DEFAULT_ROLE.name;
    if (p?.sound) role.sound = p.sound;
    role.active = "c0";
    cands(role).unshift({ id: "c0", name: was, instrument: { engine: "unknown", midi: { program: gm ?? null, variant: p?.variant ?? null } }, gm: { program: gm ?? null, variant: p?.variant ?? null }, ...common(UNWRITTEN_CALIBRATION_DB), defaults: {}, credit: { attribution: [], license: { name: "unknown" } }, spec: { kind: "unknown" } });
    extras.lounge[part.role] = role;
    notices.push(_t("声部「{name}」原来是{was}{gm}；这一版没有这件乐器，所以还没人上场。要小月相来唱，点谱前面的「{name2}」，在「谁来演」选小月相。", { name: role.name, was, gm: gm ? _t("（GM {gm} 号）", { gm }) : "", name2: role.name }));
  }
  for (const part of song0.parts) {
    const role = extras.lounge[part.role]; if (!role) continue;
    const gm = activeGm(extras, part.role);
    if (gm && gm.path && !gm.bytes) notices.push(_t("「{name}」的声音（{path}）没随这首歌一起带来，所以没人上场。点谱前面的「{name2}」换一个「谁来演」。", { name: gm.name, path: gm.path, name2: role.name ?? "" }));   // 强引用、文件里却少了那块：不静默（§10）。弱引用（path = null）要出声时去找，找不到再报
  }
  const stem = name.replace(/\.(mxl|musicxml|xml)$/i, "");
  const hum = humOf(extras);
  const arr = extras.scoreExt?.arrangement;   // 编排那一行（只有我们自己的文件有）
  return { song: { ...song0, hum, ...(typeof arr === "string" && arr.trim() ? { arrangement: arr } : {}), ...(extras.scoreExt?.lyricFit === "lyrics" ? { lyricFit: "lyrics" as const } : {}), ...(extras.scoreExt?.barNumbers === "off" ? { barNumbers: "off" as const } : {}), ...(extras.scoreExt?.spacing === "tight" ? { spacing: "tight" as const } : {}), ...songViewFields(extras.scoreExt) }, stem, hum, extras, ours, notices, view: safeView((extras.scoreExt?.view as Record<string, unknown> | undefined) ?? null), references: {}, advice: [] };
}
