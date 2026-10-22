// 底座在哪（styles.css ↔ src/app/workspace.ts sideDock）：默认贴底；只有贴底之后谱面只剩约一行能看才贴**右边**一栏——判断是 JS 里的纯函数（贴底后剩的高 < 两行谱），
//   CSS 那一档全挂在 #stage[data-side="right"] 上，不许再有按长宽比 / 高度分的底座 @media（不然 CSS 和 JS 各算各的）。created 2026-10-21 by Claude Fable 5.1
//   user 2026-10-21「ui默认键盘在下面，就是很长很宽的屏幕，键盘，混音台，都在下面」→ 同日下午「实在做不到再贴右边。比如只能看到一行谱子」（取代上午的固定阈值「横屏且 ≤ 720 高放左边」）
import { describe, it, eq, assert } from "./runner.mjs";
import { sideDock, SIDE_DOCK_LINES, LINE_SP, SIDE_DOCK_W } from "../src/app/workspace.ts";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL, enc: "utf8"): string; readdirSync(u: URL): string[]; statSync(u: URL): { isDirectory(): boolean } };
const css = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");
function* walk(dir: URL): Generator<URL> { for (const f of fs.readdirSync(dir)) { const u = new URL(f + (fs.statSync(new URL(f, dir)).isDirectory() ? "/" : ""), dir); if (u.pathname.endsWith("/")) yield* walk(u); else if (/\.ts$/.test(f)) yield u; } }

describe("底座在哪：贴底是默认，贴右边只在贴底后只剩约一行时", () => {
  it("styles.css 里没有按长宽比 / 高度分的底座 @media；那一档全挂在 #stage[data-side=\"right\"] 上", () => {
    const lines = css.split("\n").filter((l) => /^@media[^\n]*(aspect-ratio|max-height)/.test(l.trim()));
    eq(lines.join("; "), "", "按长宽比 / 高度分的顶层 @media");
    const n = (css.match(/#stage\[data-side="right"\]/g) ?? []).length;
    assert(n >= 12, `那一档的规则都挂在 data-side 上（${n} 处：舞台 / 工具条折行 / 小条 / 谱让边 / 选区条）`);
  });
  it("基础规则（没有 data-side）= main 上 pad 下；贴边 = 右边一栏（main | pad），小条在键盘左边、谱让右边", () => {
    assert(/^#stage \{[^}]*grid-template-areas: "main" "pad"/m.test(css), "#stage 基础（顶层、不缩进）= 上下两行");
    assert(!/grid-template-areas: "pad main"/.test(css), "左边一栏的旧排法没了（user 2026-10-21 下午：贴右边）");
    assert(/#stage\[data-side="right"\] \{[^}]*grid-template-areas: "main pad"/.test(css), "贴边 = main | pad");
    assert(/#stage\[data-side="right"\] > \.score \{ margin-right: 46px/.test(css), "谱的右边让出小条");
    assert(!/margin-left: 46px/.test(css), "不再让左边");
  });
  it("src 里没有按长宽比 / 高度的 matchMedia（判断只在 workspace.ts sideDock，结果写在 #stage 的 data-side）", () => {
    const bad: string[] = [];
    for (const u of walk(new URL("../src/", import.meta.url))) {
      const t = fs.readFileSync(u, "utf8");
      for (const m of t.matchAll(/matchMedia\(([^)]*)\)/g)) if (/aspect-ratio|max-height|min-height/.test(m[1])) bad.push(`${u.pathname.split("/src/")[1]}: ${m[0]}`);
    }
    eq(bad.join("; "), "", "裸写的长宽比 / 高度 matchMedia");
  });
  it("sideDock：贴底后看不到两行谱 = 贴右边；屏幕不够宽放右边一栏 = 贴底（数 = 2026-10-21 无头 Chromium 量的：顶栏 47、键盘贴底 364、一格 10 px）", () => {
    const sp = 10, pad = 364, two = SIDE_DOCK_LINES * LINE_SP * sp;
    eq(two, 280, "两行谱 = 2 × 14 格 × 10 px");
    assert(!sideDock(1400, 820 - 47, pad, sp), "1400×820 宽屏：剩 409 ≥ 280 → 贴底");
    assert(!sideDock(1180, 820 - 47, pad, sp), "iPad 横屏 1180×820：剩 409 → 贴底");
    assert(!sideDock(1024, 768 - 47, pad, sp), "1024×768：剩 357 → 贴底");
    assert(sideDock(1100, 600 - 47, pad, sp), "1100×600：剩 189 < 280 → 贴右边");
    assert(sideDock(1280, 688 - 47, pad, sp), "winmini 1280×688：剩 277 → 贴右边");
    assert(!sideDock(1280, 720 - 47, pad, sp), "1280×720：剩 309 → 贴底");
    assert(!sideDock(1280, 688 - 47, pad - 100, sp), "键盘少两排（矮 100）：剩 377 → 贴底（键盘排数会挪这个点）");
    assert(!sideDock(SIDE_DOCK_W + 359, 500, pad, sp), "右边放不下一栏（谱会窄于 360）→ 贴底");
    assert(sideDock(844, 390 - 47, pad, sp), "手机横着 844×390：剩不到一行 → 贴右边");
    assert(!sideDock(1100, 600 - 47, pad, sp * 0.6), "谱放不下屏宽时自动缩到 0.6 = 一行矮了：剩 189 ≥ 168 → 贴底");
  });
});
