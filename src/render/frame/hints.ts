// hints.ts —— 不印的提示最后贴、只躲不推（第八刀 8-5；施工单第 8 节「不印的提示」）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）
//   统筹定的规矩（2026-11-12）：不印的东西不许占宽、不许推任何印的东西；它有没有图元、点不点得到，和占不占地方是两回事。
//   做法：印的东西全定了位置之后，对着「印的全部墨迹」给每个提示挑地方——按先后试几个位置，取第一个不压墨的；都压 = 用最后一个（不相撞检查会报出来）。
//   贴过的提示也算墨（后贴的提示躲开先贴的）。只管几何：不认字形。
import type { Ink, Part } from "./cell.ts";
import { MAX_CLIMB } from "../../look/order.ts";

export interface Hint { part: Part; /** 依次试的锚点位置（和墨迹同一个坐标；part 的墨迹 / 图元相对锚点）。 */ tries: readonly { x: number; y: number }[]; /** 都压墨时再把这几个位置一格一格往上挪着试（一格多高；没给 = 不挪）。 */ climb?: number }
export interface Placed { x: number; y: number; /** 找到了不压墨的位置（false = 都压，用的是最后一个）。 */ ok: boolean }

const at = (k: Ink, x: number, y: number): Ink => ({ x0: k.x0 + x, x1: k.x1 + x, y0: k.y0 + y, y1: k.y1 + y });
const hit = (a: Ink, b: Ink, pad: number): boolean => a.x0 < b.x1 + pad && b.x0 < a.x1 + pad && a.y0 < b.y1 + pad && b.y0 < a.y1 + pad;

/** printed = 印的墨迹框；pad = 离墨至少多远（同墨迹的单位）。回每个提示落在哪（顺序同 hints）。 */
export function placeHints(printed: readonly Ink[], hints: readonly Hint[], pad = 0): Placed[] {
  const busy: Ink[] = [...printed], out: Placed[] = [];
  for (const h of hints) {
    if (!h.tries.length) { out.push({ x: 0, y: 0, ok: false }); continue; }
    let pick = h.tries[h.tries.length - 1]!, ok = false;
    const free = (t: { x: number; y: number }) => { const k = at(h.part.ink, t.x, t.y); return !busy.some((b) => hit(b, k, pad)); };
    for (const t of h.tries) if (free(t)) { pick = t; ok = true; break; }
    if (!ok && h.climb) for (let n = 1; n <= MAX_CLIMB && !ok; n++) for (const t of h.tries) { const u = { x: t.x, y: t.y - n * h.climb }; if (free(u)) { pick = u; ok = true; break; } }   // 都压墨：往上一格一格找
    busy.push(at(h.part.ink, pick.x, pick.y));
    out.push({ x: pick.x, y: pick.y, ok });
  }
  return out;
}
