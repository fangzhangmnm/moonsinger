// notations.ts —— 谱种的表（设计稿第 3.3 节第 2 步、第 7½ 节第 1 条；谱面分家第四刀按五线谱和简谱两个真的实现定的形状）。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，施工单第三节「4」）。框架（engrave.ts）只经过这里拿画法，不直接 import staff/ 或 jianpu/（守卫 = test/score-surface.test.ts「结构」）。
//   两层：① 一种行的画法（RowDrawer：量 / 行首 / 歌词锚点 / 画 / 贴挂件的先后 / 竖向锚点）；② 谱种（Notation：这种谱里，一条轨用哪种行）。
//   建轨（合租叠成虚拟轨、分手、声部 2、谱号、补齐）先照五线谱那一套做（staff/rows.ts）：不会画成数字行的东西（叠音、鼓、叠起来的一家）这一刀照旧排五线谱的行，同一张纸上两种行并排（过渡，退场 = 第五刀）。
import type { NotationId } from "../score/song-view.ts";
import type { ColEntry } from "./frame/arrange.ts";
import type { LaneKind } from "./frame/lanes.ts";
import type { LyricPart } from "./frame/lyric-spots.ts";
import { staffLooks, staffRows, staffTracks, measureTrack, lineStartWidth, lyricAnchors, drawStaff, STAFF_LANES, anchors, type StaffTrack, type StaffDrawCtx, type Unit, type Chunk } from "./staff/index.ts";
import { measureJianpu, jianpuLineStart, jianpuLyricAnchors, drawJianpu, JIANPU_LANES } from "./jianpu/index.ts";
export type { FoldFamily, StaffTrack, StaffDrawCtx, Unit, Chunk } from "./staff/index.ts";

/** 一行用哪种画法（SystemBox.kind，每一行都写）。 */
export type RowKind = "staff" | "jianpu";
/** 一条要排的轨（现在 = 五线谱建轨那一步出的；数字行只用时间那一半和摆好的位置）。 */
export type Track = StaffTrack;
/** 框架交给画法的（两种画法共用一个对象；数字行只用其中一部分）。 */
export type RowDrawCtx = StaffDrawCtx;
export interface LyricAnchor { index: number; system: number; cx: number; lyric: string; hyph: boolean }

/** 一种行的画法（设计稿第 7 节提案里的 RowDrawer，按两个真的实现收成这个形状）。 */
export interface RowDrawer {
  readonly kind: RowKind;
  /** 量（第 3 步）：一条轨 → 列条目 + 每个音的墨往对齐线左边伸多远（光标画在它左边）。纯函数，只看这一条轨。 */
  measure(q: Track): { entries: ColEntry<Unit>[]; inkL: Map<Chunk, number> };
  /** 行首多宽（sp）：base = 框架给的缩进 + 边距；key = 这一行开头生效的调号；first = 这张纸第一行。 */
  lineStart(q: Track, key: number, first: boolean, base: number): number;
  /** 歌词让路要的锚点（字的中心）。 */
  lyricAnchors(q: Track): LyricAnchor[];
  /** 画（第 5 步）：mine = 这种行的那几条轨在 per 里的下标。交回歌词锚点（字归框架）；挂件往道上登记（attach）。 */
  draw(c: RowDrawCtx, mine: readonly number[]): { lyricParts: LyricPart[] };
  /** 贴挂件的先后（道名 = frame/lanes.ts；框架把各种的并起来按先后贴）。 */
  readonly lanes: readonly LaneKind[];
  /** 这一行的竖向锚点（px）：上沿 / 中线 / 下沿。框架的家具（名字、色条、括号、左边的竖线、歌词基线）只认这三个。origin = 这一行的原点（SystemBox.staffTop）。 */
  anchors(origin: number, half: number): { top: number; mid: number; bottom: number };
}
export const DRAWERS: Readonly<Record<RowKind, RowDrawer>> = {
  staff: { kind: "staff", measure: measureTrack, lineStart: lineStartWidth, lyricAnchors, draw: (c, mine) => drawStaff(c, mine), lanes: STAFF_LANES, anchors },
  // 数字行和五线谱用同一个行框（局部 0–4），竖向锚点一样（jianpu/glyphs.ts）
  jianpu: { kind: "jianpu", measure: measureJianpu, lineStart: jianpuLineStart, lyricAnchors: jianpuLyricAnchors, draw: (c, mine) => drawJianpu(c, mine), lanes: JIANPU_LANES, anchors },
};

/** 一种谱：这种谱里一条轨用哪种行。 */
export interface Notation { readonly id: NotationId; rowKindOf(q: Track): RowKind }
/** 数字行这一刀画得了的：有音高、这张纸上没有叠音、不是叠起来的一家（虚拟轨）/ 声部 2、不是鼓、台上那位不是固定敲一个键（× 符头）。别的照旧五线谱的行（第五刀做多声部）。 */
const jianpuCan = (q: Track): boolean => !q.vrt && !q.v2 && !q.hasV2 && !q.pmode && !q.p.perc && !q.p.xHead && !q.tokens.some((t) => t.kind === "note" && !!t.chord?.length);
export const NOTATIONS: Readonly<Record<NotationId, Notation>> = {
  staff: { id: "staff", rowKindOf: () => "staff" },
  jianpu: { id: "jianpu", rowKindOf: (q) => (jianpuCan(q) ? "jianpu" : "staff") },
};
/** 建轨（第 1–2 步的前一半）：合租叠成虚拟轨、分手、声部 2、谱号、补齐——照五线谱那一套（staff/rows.ts）；两种谱都先走这一步，再按谱种分行。 */
export const BUILD = { looks: staffLooks, rows: staffRows, tracks: staffTracks } as const;
