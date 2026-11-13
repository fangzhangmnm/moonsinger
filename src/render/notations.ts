// notations.ts —— 谱种的表（设计稿第 3.3 节第 2 步、第 7½ 节第 1 条；谱面分家第四刀按五线谱和简谱两个真的实现定的形状）。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，施工单第三节「4」）。框架（engrave.ts）只经过这里拿画法，不直接 import staff/ 或 jianpu/（守卫 = test/score-surface.test.ts「结构」）。
//   两层：① 一种行的画法（RowDrawer：量 / 行首 / 歌词锚点 / 画 / 贴挂件的先后 / 竖向锚点）；② 谱种（Notation：这种谱里，一条轨用哪种行）。
//   建轨（合租叠成虚拟轨、分手、声部 2、谱号、补齐）先照五线谱那一套做（staff/rows.ts）：不会画成数字行的东西（叠音、鼓、叠起来的一家）这一刀照旧排五线谱的行，同一张纸上两种行并排（过渡，退场 = 第五刀）。
import type { NotationId } from "../score/song-view.ts";
import type { ColEntry } from "./frame/arrange.ts";
import type { LaneKind } from "./frame/lanes.ts";
import type { LyricPart } from "./frame/lyric-spots.ts";
import { staffLooks, staffRows, staffTracks, measureTrack, lineStartWidth, lyricAnchors, drawStaff, anchors, caretSpan, bandTop, pitchAxis, staffGhost, type StaffTrack, type StaffDrawCtx, type Unit, type Chunk } from "./staff/index.ts";
import { STAFF_LANES } from "../look/order.ts";
import { measureJianpu, jianpuLineStart, jianpuLyricAnchors, drawJianpu, kitLegendMin, jianpuAnchors, jianpuCaretSpan, jianpuBandTop, jianpuGhost, jianpuXGhost, type JianpuTrack } from "./jianpu/index.ts";
import { JIANPU_LANES } from "../look/order.ts";
import type { SystemBox } from "./engrave.ts";
import type { TextRole } from "./text/index.ts";
import type { GhostNote } from "./frame/ghost.ts";
export type { GhostNote } from "./frame/ghost.ts";
import type { FoldFamily } from "./staff/index.ts";
export type { FoldFamily, StaffTrack, StaffDrawCtx, Unit, Chunk } from "./staff/index.ts";

/** 一行用哪种画法（SystemBox.kind，每一行都写）。jianpuX = 简谱里鼓的那种行（UX 稿第 7 节「鼓 = X」：数字行的节奏写法，音画成 X；第五刀 5-4）。 */
export type RowKind = "staff" | "jianpu" | "jianpuX";
/** 一条要排的轨（现在 = 五线谱建轨那一步出的；数字行只用时间那一半和摆好的位置）。 */
export type Track = StaffTrack;
/** 框架交给画法的（两种画法共用一个对象；数字行只用其中一部分）。 */
export type RowDrawCtx = StaffDrawCtx;
export interface LyricAnchor { index: number; system: number; cx: number; lyric: string; hyph: boolean }
/** 框架交给画法的这一条轨的预处理（和谱种无关，画法用得上就用）：
 *  labels = 出声的换气那行小字（「吸」「深吸」，按界面语言）：字、字号、写出来多宽，单位 = 这一种行自己的单位（sp ÷ 行里的尺寸比例）；量和画用同一份（第八刀守卫 2：量 = 画，不估）。数字行才有。 */
export interface TrackAux { labels?: { readonly inhale: Readonly<Record<"soft" | "big", RowLabel>> } }
/** 一行小字：字、字号、写出来多宽（前进宽）。 */
export interface RowLabel { readonly text: string; readonly size: number; readonly w: number }

/** 一种行的画法（设计稿第 7 节提案里的 RowDrawer，按两个真的实现收成这个形状）。 */
export interface RowDrawer {
  readonly kind: RowKind;
  /** 量（第 3 步）：一条轨 → 列条目 + 每个音的墨往对齐线左边伸多远（光标画在它左边）。纯函数，只看这一条轨。 */
  measure(q: Track, scale: number, aux?: TrackAux): { entries: ColEntry<Unit>[]; inkL: Map<Chunk, number> };
  /** 行首多宽（sp）：base = 框架给的缩进 + 边距；key = 这一行开头生效的调号；first = 这张纸第一行。 */
  lineStart(q: Track, key: number, first: boolean, base: number, scale: number): number;
  /** 歌词让路要的锚点（字的中心）。 */
  lyricAnchors(q: Track, scale: number, aux?: TrackAux): LyricAnchor[];   // scale = 行里的尺寸比例（排版参数表行一级；五线谱 = 1、不用）
  /** 画（第 5 步）：mine = 这种行的那几条轨在 per 里的下标。交回歌词锚点（字归框架）；挂件往道上登记（attach）。 */
  draw(c: RowDrawCtx, mine: readonly number[]): { lyricParts: LyricPart[] };
  /** 贴挂件的先后（道名 = frame/lanes.ts；框架把各种的并起来按先后贴）。 */
  readonly lanes: readonly LaneKind[];
  /** 这一行的竖向锚点（px）：上沿 / 中线 / 下沿 = 行身。框架的家具（名字、色条、括号、左边的竖线、歌词基线）和行距只认这三个（不假设行身是 0–4）。
   *  origin = 这一行的原点（SystemBox.staffTop）；anchors(0, 0.5) = 行身在局部坐标里的上下沿（sp）。 */
  anchors(origin: number, half: number): { top: number; mid: number; bottom: number };
  /** 这种行一条轨只占一行（没有大谱表的上下两条）：框架排之前把这条轨的谱表数当 1。 */
  readonly oneRow?: true;
  /** 这条轨在名字那一栏里还要画的东西（鼓的图例）要多宽（sp）；没有 = 0。框架的名字一栏 = 最宽的名字和它取大（施工单第 12 条 12-2：栏宽只看谱上真有的字）。 */
  nameMin?(q: Track, mw: (role: TextRole, s: string) => number): number;
}
export const DRAWERS: Readonly<Record<RowKind, RowDrawer>> = {
  staff: { kind: "staff", measure: measureTrack, lineStart: lineStartWidth, lyricAnchors, draw: (c, mine) => drawStaff(c, mine), lanes: STAFF_LANES, anchors },
  // 数字行的行身 = 小节线那一段（jianpu/glyphs.ts JP_BODY；第四刀 4-5 起不再借五线谱的 0–4）
  jianpu: { kind: "jianpu", measure: (q, k, aux) => measureJianpu(q, k, "digits", aux), lineStart: jianpuLineStart, lyricAnchors: jianpuLyricAnchors, draw: (c, mine) => drawJianpu(c, mine), lanes: JIANPU_LANES, anchors: jianpuAnchors, oneRow: true },
  // 鼓的 X 行：和数字行同一套量和画（节奏的写法一样），音画成 X、不写升降号 / 八度点 / 琶音（jianpu/draw.ts 的 x 那一路）
  jianpuX: { kind: "jianpuX", measure: (q, k, aux) => measureJianpu(q, k, "x", aux), lineStart: jianpuLineStart, lyricAnchors: jianpuLyricAnchors, draw: (c, mine) => drawJianpu(c, mine, "x"), lanes: JIANPU_LANES, anchors: jianpuAnchors, oneRow: true, nameMin: (q, mw) => kitLegendMin(q as JianpuTrack, mw) },
};

/** 一种行在主线程上的几何（设计稿第 3.3 节末；统筹审第四刀接口第 2 条：和 DRAWERS 并排、按行的种类查）。谱面（score-view）只查这张表，不写「如果是简谱」。
 *  row = 排好的那一行（Layout.systems[行]），half = 半个线间距（px）。 */
export interface RowGeometry {
  /** 光标长什么样：一根竖线从哪画到哪（px）。 */
  caretSpan(row: SystemBox, half: number): { y1: number; y2: number };
  /** 选区带的上沿（px）。 */
  bandTop(row: SystemBox, half: number): number;
  /** 鬼音符：x = 那个音的位置（atCaret = 光标处，下一个音要写进去的地方）；交回盖在谱上的 svg 片段（不占排版）。 */
  ghost(row: SystemBox, x: number, notes: readonly GhostNote[], half: number, atCaret: boolean): string;
  /** 纵向 = 音高（可选）：这个 y 是第几级、竖着拖了 dy 是几级。没有 = 谱面不提供竖着拖改音高、鬼音符不看谱号位移（数字行）。 */
  readonly pitchAxis?: { stepAt(row: SystemBox, y: number, half: number): number; stepsOfDrag(dy: number, half: number): number };
}
export const GEOMETRY: Readonly<Record<RowKind, RowGeometry>> = {
  // 五线谱：光标处的鬼音符往右挪 0.35 个线间距（= 下一个音的符头在那儿；原来写在 score-view 里）
  staff: { caretSpan, bandTop, ghost: (row, x, notes, half, atCaret) => staffGhost(row, atCaret ? x + 0.7 * half : x, notes, half), pitchAxis },
  jianpu: { caretSpan: jianpuCaretSpan, bandTop: jianpuBandTop, ghost: (row, x, notes, half) => jianpuGhost(row, x, notes, half) },
  jianpuX: { caretSpan: jianpuCaretSpan, bandTop: jianpuBandTop, ghost: (row, x, notes, half) => jianpuXGhost(row, x, notes, half) },
};

/** 建轨（第 1–2 步的前一半）：谁的谱号 / 大谱表、要排哪几条轨（合租叠不叠、分手、声部 2、鼓并成一套）、每条轨的排版单元。第五刀 5-2 起是谱种表里的一项（统筹审第四刀接口第 7 条）。 */
export interface Build {
  looks: typeof staffLooks;
  /** fold = 框架挑的「这次能叠的那几家」；叠不叠由这种谱定。 */
  rows(paper: Parameters<typeof staffRows>[0], visible: Parameters<typeof staffRows>[1], fold: readonly FoldFamily[], lookAt: Parameters<typeof staffRows>[3]): ReturnType<typeof staffRows>;
  tracks: typeof staffTracks;
}
/** 一种谱：这种谱里怎么建轨、一条轨用哪种行；home = 这种谱的主行（一行都没有的纸按它留高）。 */
export interface Notation { readonly id: NotationId; readonly home: RowKind; readonly build: Build; rowKindOf(q: Track): RowKind;
  /** 合租的一家怎么露：fold = 没人在写就叠成一行，展开着时编辑器里一条能点的括号（点 = 叠回去）；line = 不叠，一家左边一条印出来的竖线包住（简谱，UX 稿第 7 节）。 */
  readonly families: "fold" | "line" }
/** 简谱里排得了的：不是五线谱叠起来的一家（虚拟轨）/ 声部 2（简谱不叠，这两种本来就不会出现）。 */
const jianpuCan = (q: Track): boolean => !q.vrt && !q.v2 && !q.hasV2;
/** 不分音高的「一下」= 五线谱里画成鼓谱 / 一线谱的（鼓：pmode / perc）→ 简谱里 X 行；写的音高留在数据里，换成有音高的乐器就变回数字行。
 *  简谱跟五线谱的分法一一对上（统筹 5-6 更正 5-4 ⑨，2026-11-11）：五线谱里画在五线上、符头是 × 的（台上那位固定敲一个键，音效固定原速这类）
 *  → 数字行、每个数字旁边一个 ×（同气声：五线谱里两者本来就是同一个 × 符头、同一个意思 = 写的音高不拿来出声）。 */
const unpitched = (q: Track): boolean => !!(q.pmode || q.p.perc);
const jianpuRowOf = (q: Track): RowKind => (!jianpuCan(q) ? "staff" : unpitched(q) ? "jianpuX" : "jianpu");
export const NOTATIONS: Readonly<Record<NotationId, Notation>> = {
  staff: { id: "staff", home: "staff", build: { looks: staffLooks, rows: staffRows, tracks: staffTracks }, rowKindOf: () => "staff", families: "fold" },
  // 简谱：合租不叠成一行（每位自己一行；一家左边一条竖线 = families "line"），别的照五线谱那一套切单元（数字行自己量宽，用不上单元里的宽）。
  //   有叠音的声部 = 数字竖着叠（数字行）；鼓 = X 行；固定敲一个键的 = 数字 + ×；简谱的歌里没有五线谱的行（第五刀 5-4 ⑨ 过渡退场）。
  jianpu: { id: "jianpu", home: "jianpu", build: { looks: staffLooks, rows: (paper, visible, _fold, lookAt) => staffRows(paper, visible, [], lookAt), tracks: (rows, c) => staffTracks(rows, { ...c, restBeats: true }) }, rowKindOf: jianpuRowOf, families: "line" },
  // 字母谱（7-B，user「字母版本的变体的，别人还在等着要用呢」「这个就是用tracker的格式写」）：简谱的变体——同一种数字行，建轨时给每条轨标上「写字母」（带着中央 C 叫 C 几；字母 + 右上升降号 + 右下八度数字，user「下标放数字上标放升降号」），量和画只换「数字」那一栏
  letters: { id: "letters", home: "jianpu", build: { looks: staffLooks, rows: (paper, visible, _fold, lookAt) => staffRows(paper, visible, [], lookAt), tracks: (rows, c) => { const t = staffTracks(rows, { ...c, restBeats: true }); return { ...t, per: t.per.map((q) => ({ ...q, letters: c.look.middleC })) }; } }, rowKindOf: jianpuRowOf, families: "line" },
};
