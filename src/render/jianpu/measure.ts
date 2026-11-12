// measure.ts —— 简谱数字行的「量」：一条轨 → 列条目（每个排版单元往左 / 往右占多宽、管多长）+ 行首多宽 + 歌词锚点。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第四刀 4-2）。和五线谱同一个形状（staff/measure.ts），纯函数、只看这一条轨。
//   时间那一半（切小节、拆成能记的时值、第几拍、连音比例）= 框架的排版单元（src/render/frame/units.ts；第五刀 5-1 从五线谱那边搬过去，这里不再借五线谱的东西）。
import { TPQ } from "../../score/song.ts";
import { MELISMA_MARK } from "../../score/lyrics.ts";
import type { SpItem } from "../spacing.ts";
import { SLOT, type ColumnKind } from "../frame/columns.ts";
import type { ColEntry } from "../frame/arrange.ts";
import type { Unit, Chunk } from "../frame/units.ts";
import { type JianpuTrack, type JianpuMode, type JianpuAux, foldOf, lettersOf, glyphWOf } from "./chunk.ts";
import { noteCell } from "./note-cell.ts";
import { keyParts, keyLayout } from "./keytext.ts";
export type { JianpuTrack, JianpuMode, JianpuAux } from "./chunk.ts";
import { SP_DEFAULTS } from "../spacing.ts";
import { DIGIT_W, COL_MIN, COL_MIN_SHORT, BAR_W_J, MID_TEXT_EM, MID_TEXT_CH, headTextW } from "./glyphs.ts";

/** 这一段（第一个字形）这一列至少多宽（数字行的单位；样张：四分 / 八分 = 数字宽 + 一点缝，十六分及更短只占字宽——「密的声部自己挤紧」；和弦名 = 名字的宽 + 两边的缝）。 */
/** 左边挂了东西的音：前一个音的墨到这个挂件的空 ≥ 挂件到它自己那个音的空的几倍（第八刀，统筹 2026-11-12 定成规矩，不定成数）。 */
const LEFT_CLEAR = 4;
const core = (u: Chunk, nameW: number): number => (nameW ? Math.max(COL_MIN, 0.1 + nameW + 0.15) : u.base < TPQ / 2 ? COL_MIN_SHORT : COL_MIN);
const COLUMN_KIND: Record<Unit["kind"], ColumnKind> = { bar: "bar", nav: "nav", clef: "clef", key: "key", time: "time", tempo: "tempo", groove: "groove", dyn: "dyn", ottava: "ottava", hairpin: "hairpin", head: "tail", chunk: "note" };
/** 中途换调 / 换拍号写的那几个字（「1=♭B」「3/4」）大约多宽（sp）。 */
export const midTextW = (s: string): number => [...s].length * MID_TEXT_CH * MID_TEXT_EM + 0.6;
/** 不是音的单元在数字行上占多宽（数字行的单位：乘上行里的尺寸比例才是 sp）：小节线一根的宽；换调 / 换拍号 = 写字的宽；谱号 / 八度线（五线谱才有的）= 小灰标的宽；别的（力度、发夹、速度、风格、跳转、写字头）不占地方。 */
function unitW(u: Unit, printKey: boolean): number {
  switch (u.kind) {
    case "bar": return u.repeat ? BAR_W_J + 1.0 : u.style ? BAR_W_J + 0.5 : BAR_W_J;
    case "key": return printKey ? keyLayout(keyParts(u.fifths, u.minor, 0, 4), MID_TEXT_EM).w + 0.6 : 0;   // 字母谱 / 鼓不印调号：只给不印的提示，不占宽（8-5）   // 中途换调写的字「1=♭B₃」（7-Q）：宽从字形算（第八刀 8-4）；八度数字按一位算
    case "time": return headTextW(`${u.beats}/${u.beatType}`, MID_TEXT_EM) + 0.6;
    case "clef": case "ottava": return 0;   // 五线谱才有的记号落在数字行上 = 不印的小灰标：不占宽、最后贴、只躲不推（8-5，统筹定）   // 小灰标「谱号」/「8va」写得下（字号 1 sp，两个汉字 / 四个字母）
    default: return 0;
  }
}

/** 量（设计稿第 3.3 节第 3 步）：这条轨的每个排版单元 → 一个列条目。道号：数字那一道 = 0、歌词那一道 = 1（框架加上这条轨的道基数）。
 *  inkL = 这个音的墨往对齐线左边伸多远（sp；升降号）：光标画在它左边。k = 行里的尺寸比例（排版参数表行一级；数字行自己的宽都乘它，第五刀 5-0c）。 */
export function measureJianpu(q: JianpuTrack, k = 1, mode: JianpuMode = "digits", aux?: JianpuAux): { entries: ColEntry<Unit>[]; inkL: Map<Chunk, number> } {
  const inkL = new Map<Chunk, number>();
  let fifths = q.head.key;   // 升降号写几个（♯ / ♯♯）跟着这一处的调：和画的时候一样一路记着
  const spItems = (u: Chunk): SpItem[] => {
    if (u.pad) return [];   // 补齐的淡色小节不画、不参加间距（同五线谱）
    // 量 = 画（第八刀 8-2）：和 draw.ts 用同一个盒子（note-cell.ts），往左 = 盒子左边伸出对齐线多远（升降号、琶音），往右 = 这一列至少多宽 + 盒子比第一个字形多出来的（横线、×、附点、换气）
    const nc = noteCell({ u, q, mode, ...(aux ? { aux } : {}), fifths, base: 0, step: null }), b = nc.cell.box(), gw = nc.glyphW;
    const fd = mode === "digits" ? foldOf(u, aux) : undefined, lt = lettersOf(q, u, mode, aux);
    const left = -b.x0 * k, right = Math.max(0, (core(u, fd || (lt && gw > DIGIT_W) ? gw : 0) + 0.1 + Math.max(0, b.x1 - (nc.x0 + gw))) * k - SP_DEFAULTS.pad);   // 顶杆 = 前一个的右伸 + 后一个的左伸 + 缝
    inkL.set(u, Math.max(0, left));
    const out: SpItem[] = [{ row: 0, left, right, dur: u.ticks, inkR: b.x1 * k, ...(nc.leftGap !== undefined ? { clear: LEFT_CLEAR * nc.leftGap * k } : {}) }];   // 左边挂了东西：前一个音的墨到它 ≥ 它离自己的音的 4 倍（统筹定的规矩，框架的顶杆管）
    const cx = (0.1 + gw / 2) * k;
    if (u.lyW !== undefined) out.push({ row: 1, left: u.lyW / 2 - cx, right: cx + u.lyW / 2 + 0.4 + (u.hyph ? 0.7 : 0) });   // 按歌词排：字和字之间不撞（同一套顶杆）
    return out;
  };
  const entries = q.units.map((u): ColEntry<Unit> => { if (u.kind === "key") fifths = u.fifths; return ({ tick: u.tick, slot: u.kind === "nav" ? u.slot : SLOT[COLUMN_KIND[u.kind]], w: u.kind === "chunk" ? u.w : unitW(u, mode === "digits" && q.letters === undefined) * k, ...(u.kind === "bar" ? { bar: true } : {}), ...(u.kind === "chunk" ? { chunk: { items: spItems(u), span: u.ticks } } : {}), ref: u }); });
  return { entries, inkL };
}
/** 行首多宽（sp）：base = 框架给的（名字一栏的缩进 + 边距）；数字行行首不画谱号 / 调号（谱头「1=C 4/4」写在第一行上方），只留一点空。 */
export const jianpuLineStart = (_q: JianpuTrack, _key: number, _first: boolean, base: number, k = 1): number => base + 0.6 * k;
/** 歌词锚点：每个带字的音在第几行、字的中心在哪（sp：数字的中心）。拖腔线不算。 */
export const jianpuLyricAnchors = (q: JianpuTrack, k = 1, aux?: JianpuAux): { index: number; system: number; cx: number; lyric: string; hyph: boolean }[] =>
  q.units.filter((u): u is Chunk => u.kind === "chunk" && !!u.lyric && u.lyric !== MELISMA_MARK).map((u) => ({ index: u.index, system: u.system, cx: u.x + (0.1 + glyphWOf(u, aux, q) / 2) * k, lyric: u.lyric!, hyph: u.hyph }));
