// 「鼠标和手指不一样」的地方只许在 src/ui/pointer.ts 里问（设计 = ai-docs/20261114-pointer-rules-design.md 第五节第 3 条）。created 2026-11-14 by Claude Opus 5.5（MoonSinger小弟）。
//   模块外面不许比 e.pointerType、不许 matchMedia("(pointer…)") / "(hover…)"、不许写 "touch" / "pen" / "mouse" 字面量；只许问 caps(p) 或者问 press-rules.ts 要结论。
//   下面的名单 = v0.17.55 还没收进来的老分路（设计稿第六节：键盘、混音台、乐器目录、提示条、记号输入框这一版不收）。每处写了它在管什么、归第三节四件里的哪一件。
//   只许减不许增：名单外新出现一处 = 红；名单上的一处收掉了 = 也红（提醒把这一行删掉，名单不留死行）。
//   styles.css 里的 @media (pointer…) / (hover…) 只许管大小和样子，不许管行为（设计稿第五节第 1 条）。
import { describe, it, eq } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readFileSync(p: string | URL, enc: string): string; readdirSync(p: string | URL, o: { withFileTypes: true }): { name: string; isDirectory(): boolean }[] };

type Bucket = "hover" | "secondary" | "wheel" | "dragScrolls" | "coarse" | "softKeyboard" | "look";
/** 名单：文件 → 这几种问法各几处 + 归哪一件 + 在管什么。 */
const CENSUS: Record<string, { pointerType?: number; media?: number; literal?: number; bucket: Bucket; what: string }[]> = {
  "src/ui/touch-tip.ts": [{ pointerType: 1, literal: 1, bucket: "hover", what: "按钮的说明：鼠标悬停有浏览器自己的 title；手指长按才弹一条（提示条）" }],
  "src/ui/finder.ts": [{ pointerType: 1, literal: 1, bucket: "secondary", what: "乐器目录：手指 / 笔长按 = 置顶菜单；鼠标用右键（contextmenu 那条）" }],
  "src/ui/mark-editor.ts": [{ media: 1, bucket: "softKeyboard", what: "记号输入框：不是粗指针的设备才自动聚焦、全选（按设备问，不按最近一下：iPad 接鼠标也不自动聚焦）" }],
  "src/app/main.ts": [{ media: 1, bucket: "coarse", what: "缩放的默认：细指针的宽屏电脑默认 100%（只管大小）" }],
};
const CSS_MEDIA = 2;   // styles.css：@media (hover: hover) 只给会悬停的画 :hover 灰（样子）；@media (pointer: coarse) 手指的点击区至少 30 px（大小）

const root = new URL("../", import.meta.url);
function files(dir: string): string[] {
  const out: string[] = [];
  for (const d of fs.readdirSync(new URL(dir + "/", root), { withFileTypes: true })) {
    const p = `${dir}/${d.name}`;
    if (d.isDirectory()) out.push(...files(p));
    else if (/\.(ts|mts|mjs|js)$/.test(d.name) && !d.name.endsWith(".d.ts")) out.push(p);
  }
  return out;
}
const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;
const PT = /\.pointerType\b/g;
const MEDIA = /matchMedia\(\s*["'`]\(\s*(any-)?(pointer|hover)\b/g;
const LIT = /["'`](touch|pen|mouse)["'`]/g;

describe("指针分路的名单（只许减不许增）", () => {
  const seen: Record<string, { pointerType: number; media: number; literal: number }> = {};
  for (const f of files("src")) {
    if (f === "src/ui/pointer.ts") continue;
    const s = fs.readFileSync(new URL(f, root), "utf8");
    const c = { pointerType: count(s, PT), media: count(s, MEDIA), literal: count(s, LIT) };
    if (c.pointerType || c.media || c.literal) seen[f] = c;
  }
  it("pointer.ts 之外问指针种类的地方 = 名单上那几处，一处不多一处不少", () => {
    const want: Record<string, { pointerType: number; media: number; literal: number }> = {};
    for (const [f, rows] of Object.entries(CENSUS)) want[f] = rows.reduce((a, r) => ({ pointerType: a.pointerType + (r.pointerType ?? 0), media: a.media + (r.media ?? 0), literal: a.literal + (r.literal ?? 0) }), { pointerType: 0, media: 0, literal: 0 });
    eq(JSON.stringify(seen, Object.keys(seen).sort()), JSON.stringify(want, Object.keys(want).sort()));
  });
  it("谱面（score-view / press-rules / score-overlay）一处都不在名单上", () => {
    for (const f of ["src/ui/score-view.ts", "src/ui/press-rules.ts", "src/ui/score-overlay.ts"]) eq(seen[f], undefined, f);
  });
  it("谱面找谱本身那张 SVG 只走 staffSvg()（ink 层里有选区旁小钮的图标 svg；querySelector(\"svg\") 第一次画时会拿到它、把整张谱写进钮里——v0.17.55 施工时踩到）", () => {
    const s = fs.readFileSync(new URL("src/ui/score-view.ts", root), "utf8");
    eq(count(s, /sheet\.querySelector(<[^>]*>)?\(\s*["'`]svg["'`]\s*\)/g), 0);
  });
  it("styles.css 里按指针分的 @media 只有两处（只管样子和大小）", () => {
    const css = fs.readFileSync(new URL("styles.css", root), "utf8");
    eq(count(css, /@media[^{]*\(\s*(any-)?(pointer|hover)\s*:/g), CSS_MEDIA);
  });
});
