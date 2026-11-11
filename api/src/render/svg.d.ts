import { type Layout } from "./engrave.ts";
/** 一个图元的 SVG 元素字符串（测试也用它对分组）。 */
export declare function primSvg(p: Layout["prims"][number], fs: string, lfs: string, rx: string): string;
/** 排版结果 → 开标签 + 每组一个 `<g>` + 收尾（W-17 智能重画第一刀，2026-10-14 Claude Fable 5.1）：
 *  图元按落在哪一行谱（Layout.systems 的上下界）分组，不在任何一行里的（歌名 / 作者栏 / 曲段控件 / 页框…）进第 0 组「杂项」；组内保持原来的先后（z 序不变）。
 *  宿主（score-view）拿着上一次的组字符串逐组比，只换变了的那几组——挪一格光标 = 换两组，不再整张 SVG 重建（5000 个节点 / 500 KB）。
 *  z 序唯一的变化：杂项组画在所有行前面（它们本来就是背景 / 不和音符重叠的东西）。 */
export declare function toSvgParts(l: Layout): {
    open: string;
    groups: string[];
    close: string;
};
/** 颜色走 CSS 变量（styles.css 定义）；Node 里离线看图时用 inlineStyle=true 把默认颜色写进去。 */
export declare function toSvg(l: Layout, inlineStyle?: boolean): string;
/** 和 styles.css 里 .staff-svg 那段同义的默认颜色（离线看图用）。 */
export declare const STANDALONE_CSS = "\n.staff-svg{background:#fff}\n.staff-svg line{stroke:#2a2a2a;stroke-linecap:butt}\n.staff-svg text{fill:#2a2a2a}\n.staff-svg path{fill:#2a2a2a}\n.staff-svg line.staff{stroke:#666}\n.staff-svg path.tie{fill:none;stroke:#2a2a2a;stroke-width:1.4}\n.staff-svg .ghost{fill:#a9b4c2;stroke:#a9b4c2}\n.staff-svg path.tie.ghost{fill:none}\n.staff-svg .cur{fill:#2b6cb0;stroke:#2b6cb0}\n.staff-svg path.tie.cur{fill:none}\n.staff-svg line.caret{stroke:#2b6cb0}\n.staff-svg rect.warn{fill:#d9a23a}\n.staff-svg text.lyric{font-family:system-ui,\"Hiragino Sans\",\"Noto Sans CJK JP\",sans-serif}\n.staff-svg line.melisma{stroke:#2a2a2a}\n.staff-svg .sel{fill:#1d5fa8;stroke:#1d5fa8}\n.staff-svg rect.selbox{fill:#e3edf9;opacity:.8}\n.staff-svg path.tuplet-bracket{fill:none;stroke:#2a2a2a;stroke-width:1}\n.staff-svg text.tempo-word{font-weight:600;font-family:system-ui,sans-serif}\n.staff-svg text.tempo-num,.staff-svg text.key-label{font-family:system-ui,sans-serif}\n.staff-svg path.hairpin{fill:none;stroke:#2a2a2a;stroke-width:1.1}\n.staff-svg text.dyn-word{font-style:italic;font-family:\"Times New Roman\",Georgia,serif}\n";
