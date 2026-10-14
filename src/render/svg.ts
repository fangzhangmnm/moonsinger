// svg.ts —— 排版结果 → SVG 字符串（浏览器 innerHTML 用；Node 里也能直接写文件看图）。created 2026-10-06 by Claude Opus 5.5
import { type Layout, LYRIC_EM } from "./engrave.ts";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const n = (v: number) => (Math.round(v * 100) / 100).toString();

/** 一个图元的 SVG 元素字符串（测试也用它对分组）。 */
export function primSvg(p: Layout["prims"][number], fs: string, lfs: string, rx: string): string {
  const c = (p.cls ? ` class="${p.cls}"` : "") + (p.tok !== undefined ? ` data-tok="${p.tok}"` : "");   // data-tok：score-view 按它开关写字头 / 选区 / 强调色的 class（W-17 第 1 刀）
  switch (p.t) {
    case "line": return `<line${c} x1="${n(p.x1)}" y1="${n(p.y1)}" x2="${n(p.x2)}" y2="${n(p.y2)}" stroke-width="${n(p.w)}"/>`;
    case "glyph": return `<text${c} x="${n(p.x)}" y="${n(p.y)}" font-family="Bravura" font-size="${p.size ? n(p.size) : fs}">${p.ch}</text>`;
    case "text": return `<text${c} x="${n(p.x)}" y="${n(p.y)}" font-size="${p.size ? n(p.size) : lfs}" text-anchor="${p.anchor ?? "middle"}">${esc(p.s)}</text>`;
    case "path": return `<path${c} d="${p.d}"/>`;
    case "rect": return `<rect${c} x="${n(p.x)}" y="${n(p.y)}" width="${n(p.w)}" height="${n(p.h)}" rx="${rx}"/>`;
    case "icon": return `<use${c} href="#${p.id}" x="${n(p.x)}" y="${n(p.y)}" width="${n(p.size)}" height="${n(p.size)}">${p.title ? `<title>${esc(p.title)}</title>` : ""}</use>`;
  }
}
/** 一个图元大概在哪个 y（分组用）：线取中点、矩形取中心、路径取第一个点；拿不到 = null（进杂项组）。 */
function yOfPrim(p: Layout["prims"][number]): number | null {
  switch (p.t) {
    case "line": return (p.y1 + p.y2) / 2;
    case "glyph": case "text": return p.y;
    case "rect": return p.y + p.h / 2;
    case "icon": return p.y + p.size / 2;
    case "path": { const m = /^\s*M\s*-?[\d.]+[\s,]+(-?[\d.]+)/.exec(p.d); return m ? Number(m[1]) : null; }
  }
}
/** 排版结果 → 开标签 + 每组一个 `<g>` + 收尾（W-17 智能重画第一刀，2026-10-14 Claude Fable 5.1）：
 *  图元按落在哪一行谱（Layout.systems 的上下界）分组，不在任何一行里的（歌名 / 作者栏 / 曲段控件 / 页框…）进第 0 组「杂项」；组内保持原来的先后（z 序不变）。
 *  宿主（score-view）拿着上一次的组字符串逐组比，只换变了的那几组——挪一格光标 = 换两组，不再整张 SVG 重建（5000 个节点 / 500 KB）。
 *  z 序唯一的变化：杂项组画在所有行前面（它们本来就是背景 / 不和音符重叠的东西）。 */
export function toSvgParts(l: Layout): { open: string; groups: string[]; close: string } {
  const L = l.pageX?.left ?? 0, R = l.pageX?.right ?? 0, W = l.width + L + R;   // 分页：版心左右留边距，页框画在负 x
  const open = `<svg xmlns="http://www.w3.org/2000/svg" class="staff-svg" width="${n(W)}" height="${n(l.height)}" viewBox="${n(-L)} 0 ${n(W)} ${n(l.height)}">`;
  const fs = n(4 * l.sp), lfs = n(LYRIC_EM * l.sp), rx = n(l.sp * 0.6);
  const boxes = l.systems.map((s) => [s.top, s.bottom] as const);
  const buckets: string[][] = Array.from({ length: boxes.length + 1 }, () => []);
  for (const p of l.prims) {
    const y = yOfPrim(p); let k = 0;
    if (y !== null) for (let i = 0; i < boxes.length; i++) if (y >= boxes[i][0] && y < boxes[i][1]) { k = i + 1; break; }
    buckets[k].push(primSvg(p, fs, lfs, rx));
  }
  return { open, groups: buckets.map((b, k) => `<g data-sys="${k - 1}">${b.join("")}</g>`), close: "</svg>" };
}
/** 颜色走 CSS 变量（styles.css 定义）；Node 里离线看图时用 inlineStyle=true 把默认颜色写进去。 */
export function toSvg(l: Layout, inlineStyle = false): string {
  const { open, groups, close } = toSvgParts(l);
  return open + (inlineStyle ? `<style>${STANDALONE_CSS}</style>` : "") + groups.join("") + close;
}

/** 和 styles.css 里 .staff-svg 那段同义的默认颜色（离线看图用）。 */
export const STANDALONE_CSS = `
.staff-svg{background:#fff}
.staff-svg line{stroke:#2a2a2a;stroke-linecap:butt}
.staff-svg text{fill:#2a2a2a}
.staff-svg path{fill:#2a2a2a}
.staff-svg line.staff{stroke:#666}
.staff-svg path.tie{fill:none;stroke:#2a2a2a;stroke-width:1.4}
.staff-svg .ghost{fill:#a9b4c2;stroke:#a9b4c2}
.staff-svg path.tie.ghost{fill:none}
.staff-svg .cur{fill:#2b6cb0;stroke:#2b6cb0}
.staff-svg path.tie.cur{fill:none}
.staff-svg line.caret{stroke:#2b6cb0}
.staff-svg rect.warn{fill:#d9a23a}
.staff-svg text.lyric{font-family:system-ui,"Hiragino Sans","Noto Sans CJK JP",sans-serif}
.staff-svg line.melisma{stroke:#2a2a2a}
.staff-svg .sel{fill:#1d5fa8;stroke:#1d5fa8}
.staff-svg rect.selbox{fill:#e3edf9;opacity:.8}
.staff-svg path.tuplet-bracket{fill:none;stroke:#2a2a2a;stroke-width:1}
.staff-svg text.tempo-word{font-weight:600;font-family:system-ui,sans-serif}
.staff-svg text.tempo-num,.staff-svg text.key-label{font-family:system-ui,sans-serif}
.staff-svg path.hairpin{fill:none;stroke:#2a2a2a;stroke-width:1.1}
.staff-svg text.dyn-word{font-style:italic;font-family:"Times New Roman",Georgia,serif}
`;
