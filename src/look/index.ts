// src/look —— 「现在怎么画」只在这里定（施工单第 17 条 17-1；created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟））。
//   user 2026-11-13：「我觉得视图上的默认，我们确实可以做一个深模块和窄接口…这样以后我们调视图，特别是调排版规则…一些脑的文件可以跟着动」（脑 = 老）。
//   夹在「歌」和「排版」之间：给它这首歌，交回一整份「现在怎么画」（每一项都有值）。歌里的显示设置每一项是 "default"（跟着软件）或这首歌选的值；
//   "default" 现在等于什么、每张纸 / 每个声部那几样「没写」是什么意思，都只在这里。排版、屏幕、PDF、存 MusicXML 的 <defaults> 只拿这一份。
//   规矩（守卫 test/look.test.ts）：这个目录之外没有人比较 "default"、没有人写「没写就当成某个值」的退路（song.paper ?? …、autoOttava !== false、和弦选项 ?? "auto"）。
//   方向：src/score 不 import 这里（谱这一层不知道「现在怎么画」）；这里 import 谱那一层的类型和纯函数。
//   这一个模块不改歌（withLook / allDefault 交回新的歌，由宿主走写入口）。
//   17-2：排版规则的数（ai-docs/20261113-view-defaults-recon.md 表二第一类）在这个目录的 paper / layout / spacing / frame / text / marks / order 里——只放数（和造表用的公式），
//   算法留在 src/render；运行时不 import src/render（只要类型）。这些数不按歌选、不进文件，改了老歌跟着变。守卫 test/look-rules.test.ts。
//   以后哪个数要按歌选，再一次一个加进 LOOK_KEYS、由 lookOf 交出、排版从 Look 拿（统筹 2026-11-13）。
//   分界线（统筹「v0.17.22 收」）：一个音自己那一格里面 = 这种谱的字形设计，留在那种谱的目录（render/jianpu/glyphs.ts、place.ts…）；格子之间、行、纸 = 排版规则，在这里。
//   函数里的字面量不全量扫：新写规则的数起名字放这里；哪一轮要调某一块排版，先把那一块的数提出来（单独一个提交、版面底本不变）再调。
import { headClefOf, type Song, type PaperSeg, type Choice, type ClefChoice } from "../score/song.ts";
import { isPaperKind, PAPER_LABEL, DENSITIES, type Paper, type ReadPaper, type PaperKind, type Density, type PaperChoice, type Margins } from "../score/paper.ts";
import { paperOf, marginsOf, sizeOf, staffMmFor, STAFF_MM, STAFF_MM_COMPACT, paperSizeText } from "./paper.ts";
import { isNotation, isMiddleC, isTextLang, IN_C_APPLIES, NOTATIONS, CHORD_TAG_STYLES, type SongView, type ChordsMode, type NotationId, type ChordTagStyle, CHORDS_MODES } from "../score/song-view.ts";
import { _t } from "../i18n/index.ts";
import { BASE_DEFAULTS, defaultsFor, type LookContext, type LookDefaults } from "./habits.ts";

/** 能跟着软件的那几项（歌级；score.json 顶层同名的键）。arrangement 改声音（第 16 条），textLang 的 "ui" 本身就是跟界面，都不在这里。 */
export const LOOK_KEYS = ["notation", "viewInC", "middleC", "chordTags", "chordTagStyle", "expressions", "barNumbers", "lyricFit", "paper", "density", "staffMm", "marginMm"] as const;
export type LookKey = typeof LOOK_KEYS[number];

/** "default" 现在等于什么（只在这里；改了 = 所有跟着软件的歌跟着变）。纸的边距和谱高没有自己的一个数：边距 = 这张纸自己的，谱高 = 这一档的。 */
// "default" 现在等于什么：src/look/habits.ts。设备上没选习惯 = BASE_DEFAULTS（软件的默认）；选了的习惯只盖它自己那一项（第 18 条，随 LookContext 交进来）。纸的边距和谱高没有自己的一个数：边距 = 这张纸自己的，谱高 = 这一档的。
export { BASE_DEFAULTS, HABIT_KEYS, defaultsFor, type HabitKey, type Habits, type LookContext, type LookDefaults } from "./habits.ts";
/** 每张纸 / 每个声部那几样「没写」的意思（第 17 条四问第 2 条：这一轮不加「跟着软件」，但退路收进这里）：自动八度线没写 = 开、大谱表没写 = 一行、和弦选项没写 = 也认拆开弹的。
 *  以后要是想改自动八度线、和弦选项的默认，先把那一项做成三态（"default" / 开 / 关），再改这里（契约 contract.ts 记了这一句）。 */
const UNWRITTEN_TRACK = { autoOttava: true, grand: false, chords: "auto" as ChordsMode };

/** 一整份「现在怎么画」：SongView 的每一项（排版、PDF、键上的大字、鬼音符都读它）+ 纸（每个字段都有值）+ 每一项是选的还是跟着软件。 */
export interface Look extends SongView {
  /** 这张纸到底多大、边距、舒适 / 紧凑、谱高（每个字段都填好了，没有可选的）。屏幕、PDF、存 MusicXML 的 <defaults> 都用这一份。 */
  readonly paper: Paper;
  /** 每一项是不是跟着软件（true）——页面设置「跟着软件（现在是：X）」那一格亮不亮。模块外面问它，不自己比 "default"。 */
  readonly follows: { readonly [K in LookKey]: boolean };
  /** 这一次「跟着软件」用的那张表（设备上没选习惯 = BASE_DEFAULTS；第 18 条）。 */
  readonly base: LookDefaults;
}

const pick = <T,>(v: Choice<T>, d: T): T => (v === "default" ? d : v);

/** 歌 → 这首歌现在怎么画（纯函数；不读设备、不读界面语言、不读时钟）。认不出来的值（比这一版新的文件带来的）按最基本的那一档画：谱种 = 五线谱、歌词 = 按节奏、小节号 = 印、中央 C = C4、谱上的字 = 跟着界面。 */
export function lookOf(song: Song, ctx: LookContext = {}): Look {   // ctx = 当时的情况（这台设备的习惯）；不给 = 都没选。存文件只用不给的那一份（文件一个字节都不跟着习惯变）
  const D = defaultsFor(ctx);
  const chords = new Map<string, ChordsMode>();
  for (const p of song.parts) if ((CHORDS_MODES as readonly unknown[]).includes(p.chords)) chords.set(p.id, p.chords as ChordsMode);
  const n0 = pick(song.notation, D.notation), notation = isNotation(n0) ? n0 : "staff";
  const viewInC = pick(song.viewInC, D.viewInC) === true, mc = pick(song.middleC, D.middleC);
  const lf = pick(song.lyricFit, D.lyricFit), bn = pick(song.barNumbers, D.barNumbers);
  const follows = Object.fromEntries(LOOK_KEYS.map((k) => [k, song[k] === "default"])) as Look["follows"];
  return {
    notation, viewInC, inCActive: viewInC && IN_C_APPLIES[notation],
    chordTags: pick(song.chordTags, D.chordTags) !== false,
    chordTagStyle: pick(song.chordTagStyle, D.chordTagStyle) === "root" ? "root" : "degree",   // 认不出来的值（比这一版新的文件带来的）按级数画
    chordsOf: (part) => chords.get(part) ?? UNWRITTEN_TRACK.chords,
    density: densityIn(song, D),
    lyricFit: lf === "lyrics" ? "lyrics" : "rhythm",
    barNumbers: bn !== "off",
    middleC: isMiddleC(mc) ? mc : 4,
    expressions: pick(song.expressions, D.expressions) !== false,
    textLang: isTextLang(song.textLang) ? song.textLang : "ui",
    paper: paperIn(song, D),
    follows, base: D,
  };
}
const densityIn = (song: Song, D: LookDefaults): Density => { const d = pick(song.density, D.density); return d === "compact" ? "compact" : "cozy"; };
/** 边距跟着软件时用哪个：这张纸自己的（「其他」大小的纸没有自己的 = 用默认那张纸的）。 */
const ownMargins = (kind: PaperKind | "other", D: LookDefaults): Margins => marginsOf(kind === "other" ? D.paper : kind);
/** 这首歌画的时候用的纸（每个字段都有值）。 */
function paperIn(song: Song, D: LookDefaults): Paper {
  const c: PaperChoice = song.paper === "default" ? { kind: D.paper } : song.paper, density = densityIn(song, D);
  const base = c.kind === "other" ? { kind: "other" as const, widthMm: c.widthMm, heightMm: c.heightMm, marginMm: ownMargins("other", D) } : paperOf(c.kind);
  const marginMm: Margins = song.marginMm === "default" ? base.marginMm : song.marginMm;
  const staffMm = song.staffMm === "default" ? staffMmFor(density) : song.staffMm;
  return { kind: base.kind, widthMm: base.widthMm, heightMm: base.heightMm, marginMm, density, staffMm };
}

/** 页面设置「音符密度」那一格（第 17 条 17-2：原来 main.ts 自己拿 STAFF_MM 比）：这首歌选了一个谱高、又不是这一档本来的 = 那个毫米数（下拉里写「自定义（N 毫米）」）；否则 null。 */
export const customStaffMm = (look: Look): number | null => (!look.follows.staffMm && Math.abs(look.paper.staffMm - staffMmFor(look.density)) > 0.01 ? look.paper.staffMm : null);
/** 页面设置「版面」页「边距」那一行（第 17 条 17-2 顺手，统筹 2026-11-13）：边距按值带着（别家的谱、老文件）才有这一行；跟着软件 = null（不显示）。
 *  follow = 第一格「跟着软件（现在是：X）」的 X（这张纸自己的边距）；custom = 另一格「自定义（X）」的 X（这首歌带着的四边）。 */
export function marginRow(look: Look): { follow: string; custom: string } | null {
  if (look.follows.marginMm) return null;
  const n = (v: number) => +v.toFixed(2), sides = (m: Margins) => _t("上 {t} · 下 {b} · 左 {l} · 右 {r} 毫米", { t: n(m.t), b: n(m.b), l: n(m.l), r: n(m.r) });
  const own = ownMargins(look.paper.kind, look.base), even = own.l === own.r && own.l === own.t && own.l === own.b;
  return { follow: even ? _t("{mm} 毫米", { mm: n(own.l) }) : sides(own), custom: sides(look.paper.marginMm) };
}
/** 每张纸 / 每个声部那几样（第 17 条四问第 2 条）：排版、存档都只问这一个口子。文件和内存的写法不动（PaperSeg.looks 只存大谱表 = true、自动八度线 = false）。 */
export interface TrackLook { autoOttava: boolean; grand: boolean }
export function trackLookOf(song: Song): (paperId: string, partId: string) => TrackLook {
  const byId = new Map<string, PaperSeg>(song.papers.map((p) => [p.id, p]));
  return (paperId, partId) => { const l = byId.get(paperId)?.looks?.[partId];
    return { autoOttava: l?.autoOttava === false ? false : UNWRITTEN_TRACK.autoOttava, grand: l?.grand === true ? true : UNWRITTEN_TRACK.grand }; };
}

/** 谱头面板谱号那一格现在是什么（第 17 条 17-1 从 song.ts 搬来）：手选的大谱表 / 纸头写的谱号记号 / 自动。 */
export function clefChoiceOf(paper: PaperSeg, partId: string): ClefChoice {
  if (paper.looks?.[partId]?.grand === true) return "grand";
  return headClefOf(paper.tracks[partId]) ?? "auto";
}
/** 页面设置里一项选「跟着软件」：这一项写回 "default"。纸跟着软件 = 边距也跟着（边距跟着纸，同 setPaper）；舒适 / 紧凑跟着软件 = 谱高也跟着（同 setDensity）。都已经是 = 原样。 */
export function followDefault(song: Song, key: LookKey): Song {
  const also: LookKey[] = key === "paper" ? ["marginMm"] : key === "density" ? ["staffMm"] : [];
  if ([key, ...also].every((k) => song[k] === "default")) return song;
  return { ...song, ...Object.fromEntries([key, ...also].map((k) => [k, "default"])) } as Song;
}
/** 「全部跟着软件」：把这首歌里选过的每一项都改回 "default"（一步撤销由宿主走写入口）。都已经是 = 原样。 */
export function allDefault(song: Song): Song {
  if (LOOK_KEYS.every((k) => song[k] === "default")) return song;
  return { ...song, ...Object.fromEntries(LOOK_KEYS.map((k) => [k, "default"])) } as Song;
}
/** 这首歌里选过的有几项（歌库核对 / 页面设置「全部跟着软件」亮不亮）。 */
export const chosenCount = (song: Song): number => LOOK_KEYS.filter((k) => song[k] !== "default").length;

/** 页面设置第一格「跟着软件（现在是：X）」的 X。 */
/** 谱种的名字（页面设置的下拉、设置「习惯看的谱」那一行、第一次打开的卡都从这里拿；加一种谱 = Record 逼着这里多一个名字，几处自动多一格）。 */
export const notationName = (id: NotationId): string => ({ staff: _t("五线谱"), jianpu: _t("简谱"), letters: _t("字母谱") } as Record<NotationId, string>)[id];
/** 每种谱一句说明（页面设置的问号、第一次打开的卡）；字母谱那句的中央 C 跟着叫法。 */
export const NOTATION_NOTE: Record<NotationId, (middleC: number) => string> = {
  staff: () => _t("按音高画在五条线上"),
  jianpu: () => _t("数字 1–7（首调）"),
  letters: (mc) => _t("实际的音名 C D E F G A B，右上角写升降号、右下角写八度（中央 C = C{n}）", { n: mc }),
};
/** 「中央 C 叫」的选项上写什么（页面设置、设置「界面」页、第一次打开的卡同一份）。 */
export const middleCLabel = (n: number): string => (n === 4 ? _t("C{n}（国际通用）", { n }) : `C${n}`);
/** 和弦写法（第 19 条；统筹 0d97f07a：「和弦辅助」管标不标、「和弦写法」管标成什么样，一行一个键）：页面设置、设置「界面」页、「初始设置」卡同一份名字。 */
export const CHORD_TAG_STYLE_LABEL: Record<ChordTagStyle, () => string> = { degree: () => _t("级数（I、V7）"), root: () => _t("根音（C、G7）") };
/** 「和弦写法」是什么（一句；三处同一份）。 */
export const CHORD_TAG_STYLE_NOTE = (): string => _t("和弦辅助标出来的字写成级数还是根音。开着移调辅助时根音照换到 C 调之后的写，和眼前的谱对得上。");
/** 「移调辅助」是什么（一句；设置「界面」页、页面设置、「初始设置」卡同一份）。后半句 = 第 19 条第 7 点的披露之一：键上的字也按 C 调写。 */
export const TRANSPOSE_AID_NOTE = (): string => _t("调号多的时候把谱换到 C 调来画，只改显示、声音不变；看五线谱时起作用。键上的大字也按 C 调写，小字是实际的音。");
/** 「中央 C 叫」是什么（一句；三处同一份）。 */
export const MIDDLE_C_NOTE = (): string => _t("八度的数字从哪儿数：字母谱、简谱谱头、键上的字、音域旋钮都照它写。只改叫法，文件里、声音里的八度不变。");
export function defaultText(key: LookKey, ctx: LookContext = {}): string {   // X 跟着这台设备的习惯（第 18 条）
  const D = defaultsFor(ctx);
  switch (key) {
    case "notation": return notationName(D.notation);
    case "viewInC": return D.viewInC ? _t("按 C 调看") : _t("不用");   // 第一格是「跟着软件（现在是：X）」，X 里不再套括号（17-2 顺手）
    case "middleC": return `C${D.middleC}`;
    case "chordTags": return D.chordTags ? _t("标") : _t("不标");
    case "chordTagStyle": return CHORD_TAG_STYLE_LABEL[D.chordTagStyle]();
    case "expressions": return D.expressions ? _t("显示") : _t("不显示");
    case "barNumbers": return D.barNumbers === "line" ? _t("每行开头") : _t("不印");
    case "lyricFit": return D.lyricFit === "rhythm" ? _t("按节奏") : _t("按歌词");
    case "paper": return PAPER_LABEL[D.paper];
    case "density": return DENSITIES.find((z) => z.id === D.density)?.label ?? D.density;
    case "staffMm": return _t("跟着音符密度");
    case "marginMm": return _t("这张纸自己的");
  }
}
/** 纸张那一格的字（选的是「其他」时写大小）。 */
export const paperChoiceText = (c: PaperChoice): string => (c.kind === "other" ? paperSizeText(c) : PAPER_LABEL[c.kind]);

/** 读文件的门口（17-1）：score.json 里没有纸张那几项（老文件、别家的谱）时，从 MusicXML <defaults> 认出来的纸认一次——
 *  认成四种之一的算选过的；认成「A5 舒适、边距和谱高都是那一档的」的算 "default"；舒适算跟着软件（老文件里舒适就是没写）；边距 / 谱高和这张纸、这一档自己的一样 = "default"，不一样 = 按值带着。没有 <defaults> = 全部 "default"。 */
export function paperChoicesOf(p: ReadPaper | undefined): Pick<Song, "paper" | "density" | "staffMm" | "marginMm"> {
  const all = { paper: "default", density: "default", staffMm: "default", marginMm: "default" } as const;
  if (!p) return { ...all };
  const density: Choice<Density> = p.density === "compact" ? "compact" : "default", want = staffMmFor(p.density === "compact" ? "compact" : "cozy");
  const staffMm: Choice<number> = p.staffMm === undefined || Math.abs(p.staffMm - want) < 0.05 ? "default" : p.staffMm;
  const own = p.kind === "other" ? null : marginsOf(p.kind), same = (a: Margins, b: Margins) => (["l", "r", "t", "b"] as const).every((k) => Math.abs(a[k] - b[k]) < 0.05);
  const marginMm: Choice<Margins> = own && same(p.marginMm, own) ? "default" : { ...p.marginMm };
  const plain = p.kind === BASE_DEFAULTS.paper &&   // 读文件认「跟着软件」只用软件的默认（文件的意思不跟着设备的习惯变）
    density === "default" && staffMm === "default" && marginMm === "default";
  const paper: Choice<PaperChoice> = plain ? "default" : p.kind === "other" ? { kind: "other", widthMm: p.widthMm, heightMm: p.heightMm } : { kind: p.kind };
  return { paper, density, staffMm, marginMm };
}
/** 读文件的门口（17-1）：score.json 顶层这几项 → 歌字段。没写 / 写坏了 = "default"（补的是这个字，不是当时的默认值）；认得的值原样；
 *  比这一版新的文件里键认识、值不认识的字（以后的谱种 / 排法…）原样留在歌里、存的时候照写，记进 odd（打开时说一句）——画的时候 lookOf 按最基本的那一档。
 *  纸张那四项：score.json 里有任何一项 = 以它为准（缺的那几项 = "default"）；一项都没有（老文件、别家的谱）= 从 MusicXML <defaults> 认一次（paperChoicesOf）。 */
export function lookFromFile(x: Record<string, unknown> | undefined, xmlPaper: ReadPaper | undefined, newer: boolean, odd: string[]): Pick<Song, LookKey> {
  const g = (k: string): unknown => x?.[k];
  const word = (k: "notation" | "barNumbers" | "lyricFit" | "chordTagStyle", allowed: readonly string[]): string => { const v = g(k);
    if (v === "default" || (typeof v === "string" && allowed.includes(v))) return v as string;
    if (newer && typeof v === "string" && v) { odd.push(k); return v; }
    return "default"; };
  const bool = (k: "viewInC" | "chordTags" | "expressions"): Choice<boolean> => { const v = g(k); return typeof v === "boolean" ? v : "default"; };
  const mc = g("middleC");
  const paperKeys = ["paper", "density", "staffMm", "marginMm"].some((k) => x !== undefined && k in x);
  const paper = paperKeys ? { paper: readPaperChoice(g("paper")) ?? "default", density: g("density") === "compact" || g("density") === "cozy" ? (g("density") as Density) : "default",
    staffMm: typeof g("staffMm") === "number" && (g("staffMm") as number) > 0 ? (g("staffMm") as number) : "default", marginMm: readMargins(g("marginMm")) ?? "default" } as Pick<Song, "paper" | "density" | "staffMm" | "marginMm">
    : paperChoicesOf(xmlPaper);
  return { notation: word("notation", NOTATIONS), barNumbers: word("barNumbers", ["line", "off"]), lyricFit: word("lyricFit", ["rhythm", "lyrics"]), chordTagStyle: word("chordTagStyle", CHORD_TAG_STYLES),
    viewInC: bool("viewInC"), chordTags: bool("chordTags"), expressions: bool("expressions"), middleC: isMiddleC(mc) ? mc : "default", ...paper };
}
/** score.json 里读到的一项纸张的选择（门口）：认不出来 = null（宽容：当没写）。 */
export function readPaperChoice(v: unknown): Choice<PaperChoice> | null {
  if (v === "default") return "default";
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (isPaperKind(o.kind)) return { kind: o.kind };
  if (o.kind === "other" && typeof o.widthMm === "number" && typeof o.heightMm === "number" && o.widthMm > 0 && o.heightMm > 0) return { kind: "other", widthMm: o.widthMm, heightMm: o.heightMm };
  return null;
}
export function readMargins(v: unknown): Choice<Margins> | null {
  if (v === "default") return "default";
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>, ks = ["l", "r", "t", "b"] as const;
  return ks.every((k) => typeof o[k] === "number" && (o[k] as number) >= 0) ? { l: o.l as number, r: o.r as number, t: o.t as number, b: o.b as number } : null;
}
/** 四种纸的宽高（纸的设置面板写大小用）。 */
export const kindSize = (k: PaperKind): { w: number; h: number } => sizeOf(k);
