// svg.ts —— 排版结果 → SVG 字符串（浏览器 innerHTML 用；Node 里也能直接写文件看图）。created 2026-10-06 by Claude Opus 5.5
import { type Layout, LYRIC_EM } from "./engrave.ts";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const n = (v: number) => (Math.round(v * 100) / 100).toString();

/** 颜色走 CSS 变量（styles.css 定义）；Node 里离线看图时用 inlineStyle=true 把默认颜色写进去。 */
export function toSvg(l: Layout, inlineStyle = false): string {
  const out: string[] = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" class="staff-svg" width="${n(l.width)}" height="${n(l.height)}" viewBox="0 0 ${n(l.width)} ${n(l.height)}">`);
  if (inlineStyle) out.push(`<style>${STANDALONE_CSS}</style>`);
  const fs = n(4 * l.sp), lfs = n(LYRIC_EM * l.sp);
  for (const p of l.prims) {
    const c = p.cls ? ` class="${p.cls}"` : "";
    switch (p.t) {
      case "line": out.push(`<line${c} x1="${n(p.x1)}" y1="${n(p.y1)}" x2="${n(p.x2)}" y2="${n(p.y2)}" stroke-width="${n(p.w)}"/>`); break;
      case "glyph": out.push(`<text${c} x="${n(p.x)}" y="${n(p.y)}" font-family="Bravura" font-size="${p.size ? n(p.size) : fs}">${p.ch}</text>`); break;
      case "text": out.push(`<text${c} x="${n(p.x)}" y="${n(p.y)}" font-size="${p.size ? n(p.size) : lfs}" text-anchor="${p.anchor ?? "middle"}">${esc(p.s)}</text>`); break;
      case "path": out.push(`<path${c} d="${p.d}"/>`); break;
      case "rect": out.push(`<rect${c} x="${n(p.x)}" y="${n(p.y)}" width="${n(p.w)}" height="${n(p.h)}" rx="${n(l.sp * 0.6)}"/>`); break;
    }
  }
  out.push("</svg>");
  return out.join("");
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
.staff-svg rect.head{fill:#e3edf9;opacity:.7}
.staff-svg line.caret{stroke:#2b6cb0}
.staff-svg rect.warn{fill:#d9a23a}
.staff-svg text.lyric{font-family:system-ui,"Hiragino Sans","Noto Sans CJK JP",sans-serif}
.staff-svg line.melisma{stroke:#2a2a2a}
.staff-svg .preview{fill:#2b6cb0;stroke:#2b6cb0;opacity:.45}
.staff-svg .sel{fill:#1d5fa8;stroke:#1d5fa8}
.staff-svg rect.selbox{fill:#e3edf9;opacity:.8}
.staff-svg path.tuplet-bracket{fill:none;stroke:#2a2a2a;stroke-width:1}
.staff-svg text.tempo-word{font-weight:600;font-family:system-ui,sans-serif}
.staff-svg text.tempo-num,.staff-svg text.key-label{font-family:system-ui,sans-serif}
`;
