// collide.ts —— 版面上「谁和谁叠在一起了」（7-K，2026-11-12；user「各种打架」）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
//   施工单 ai-docs/20261111-score-surface-construction-plan.md 7-K：拿用全的测试歌在三种谱里各排一遍，算出每个图元的墨迹框，找出所有两两相叠的；
//   本来就该叠的列成一张明着的名单（ALLOWED），名单之外的相叠 = 红。行首的家具、歌词、挂件、角标、注解（ann）都算。
//   墨迹：Bravura 字形 / 线 / 方块 / 路径照 src/render/skyline.ts primInk（路径切成小段，斜线不会把整块都算进去）；
//   字比 primInk 收紧——primInk 给天际线用，上 0.8、下 0.22 字号一律估；这里按字符分类（数字 / 大写只有上半、带下伸的小写才往下……），
//   不然「数字和它下面的下划线」这种贴着不叠的全会报出来。字的横向照 SVG / PDF：没写 anchor = 居中。
import type { Layout, Prim } from "../../../src/render/engrave.ts";
import { primInk } from "../../../src/render/skyline.ts";
import { LYRIC_EM } from "../../../src/render/text/index.ts";
import type { TtfFont } from "../../../src/export/ttf.ts";

export interface Ink { i: number; x0: number; x1: number; y0: number; y1: number }
/** 一个字的上下沿（字号的几成；从基线往上为正 a、往下为正 d）。 */
function charVert(ch: string): [number, number] {
  if (/[0-9A-Z]/.test(ch)) return [0.72, 0];
  if (/[bdfhklt]/.test(ch)) return [0.74, 0];
  if (/[gpqy]/.test(ch)) return [0.53, 0.22];
  if (ch === "j") return [0.74, 0.22];
  if (/[a-z]/.test(ch)) return [0.53, 0];
  if (/[♯♭♮𝄪𝄫#]/.test(ch)) return [0.78, 0.22];
  if (/[()[\]{}|/]/.test(ch)) return [0.76, 0.2];
  if (/[.,·:;'"`‘’“”]/.test(ch)) return [ch === "." || ch === "," ? 0.12 : 0.72, ch === "," ? 0.15 : 0];
  if (/[-–—=+~<>]/.test(ch)) return [0.5, 0];
  if (/\s/.test(ch)) return [0, 0];
  if (ch.charCodeAt(0) > 0x2e80) return [0.82, 0.1];   // 方块字
  return [0.75, 0.2];   // 别的符号：宽一点估
}
/** 一个图元的墨迹块（px）。measure(s, size) = 这串字在 size px 下多宽。给了 font = 字按这款字体逐个字形放、取字形真的墨迹框（PDF 印的就是这款）；没给 = 按字符分类估。 */
export function primBoxes(p: Prim, sp: number, measure: (s: string, size: number) => number, out: (x0: number, x1: number, y0: number, y1: number) => void, font?: TtfFont): void {
  if (p.t === "text") {
    const size = p.size ?? LYRIC_EM * sp, w = measure(p.s, size) * (p.sx ?? 1), anchor = p.anchor ?? "middle";
    const x0 = anchor === "middle" ? p.x - w / 2 : anchor === "end" ? p.x - w : p.x;
    if (font) {   // 真字形：前进宽一个个累加（和 measure 同一款字体时 = w），每个字形的墨迹框各报一块
      const k = (size / font.unitsPerEm) * (p.sx ?? 1), ky = size / font.unitsPerEm;
      let x = x0; for (const g of font.shape(p.s)) { const b = font.inkOf(g); if (b) out(x + b[0] * k, x + b[2] * k, p.y - b[3] * ky, p.y - b[1] * ky); x += font.advance(g) * k; }
      return;
    }
    let a = 0, d = 0; for (const ch of p.s) { const [ca, cd] = charVert(ch); if (ca > a) a = ca; if (cd > d) d = cd; }
    if (a + d <= 0) return;
    const inset = Math.min(0.05 * size, w * 0.1);   // 字形两边自带的留白
    out(x0 + inset, x0 + w - inset, p.y - size * a, p.y + size * d); return;
  }
  if (p.t === "line" && (p.y1 === p.y2 || p.x1 === p.x2)) {   // 横线 / 竖线：平头线帽（SVG stroke-linecap: butt），只往线宽方向伸出半个线宽，两端不伸（primInk 给天际线用，四边都扩）
    const h = p.w / 2; if (p.y1 === p.y2) out(Math.min(p.x1, p.x2), Math.max(p.x1, p.x2), p.y1 - h, p.y1 + h); else out(p.x1 - h, p.x1 + h, Math.min(p.y1, p.y2), Math.max(p.y1, p.y2));
    return;
  }
  primInk(p, sp, measure, out);
}
/** 要查的东西 = 图元 + 覆盖层照排版给的锚点写在谱上的字（现在只有调号的淡提示 keyHints：src/ui/score-overlay.ts ⑥，anchor start）。下标就是 inkOf / overlaps 里的 i。 */
export function allPrims(L: Layout): Prim[] {
  return [...L.prims, ...L.keyHints.map((k): Prim => ({ t: "text", x: k.x, y: k.y, s: k.s, size: k.size, anchor: "start", cls: "key-hint ann" }))];
}
/** 所有图元（含 allPrims 里的提示）的墨迹块。skip(p) = 不查的（底色之类）。 */
export function inkOf(L: Layout, measure: (s: string, size: number) => number, skip: (p: Prim) => boolean = () => false, font?: TtfFont): Ink[] {
  const out: Ink[] = [];
  allPrims(L).forEach((p, i) => { if (!skip(p)) primBoxes(p, L.sp, measure, (x0, x1, y0, y1) => { if (x1 > x0 || y1 > y0) out.push({ i, x0, x1, y0, y1 }); }, font); });
  return out;
}
/** 两两相叠（按图元成对，每对只报一次）：两块在横竖两个方向都叠进去超过 eps px。 */
export function overlaps(ink: Ink[], eps: number): Map<string, { a: number; b: number; x: number; y: number; dx: number; dy: number }> {
  const s = [...ink].sort((p, q) => p.x0 - q.x0), act: Ink[] = [], res = new Map<string, { a: number; b: number; x: number; y: number; dx: number; dy: number }>();
  for (const b of s) {
    for (let k = act.length - 1; k >= 0; k--) if (act[k]!.x1 <= b.x0 + eps) act.splice(k, 1);
    for (const a of act) {
      if (a.i === b.i) continue;
      const dx = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), dy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
      if (dx > eps && dy > eps) {
        const lo = Math.min(a.i, b.i), hi = Math.max(a.i, b.i), key = `${lo}:${hi}`, cur = res.get(key);
        if (!cur || dx * dy > cur.dx * cur.dy) res.set(key, { a: lo, b: hi, x: Math.max(a.x0, b.x0), y: Math.max(a.y0, b.y0), dx, dy });
      }
    }
    act.push(b);
  }
  return res;
}
/** 一个图元的「种类」（报告和名单用）：类名里第一个词 + 图元种类；没有类名 = 图元种类。 */
export const kindOf = (p: Prim): string => `${p.t}:${(p.cls ?? "").split(/\s+/).filter(Boolean).join(".") || "-"}`;
