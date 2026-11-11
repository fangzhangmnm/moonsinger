// 谱面排版的长期测试（谱面分家 1b 收尾，2026-11-11 Claude Opus 5.5；施工单 ai-docs/20261111-score-surface-construction-plan.md）。
//   user 11-11「开发的时候可以相对细致一点，开发完一块可以收成几个综合的对抗性测试」：1b 开发时的几十份全量快照是脚手架，收成下面这几条。
//   守的是设计稿第 3.9 节（ai-docs/20261111-score-surface-architecture.md）：
//     守卫 1（结构）→「结构」；守卫 2（平数据）→ 前三条每一份版面都过一次拷贝比；守卫 3（版面不变样）→ 前三条和底本比；守卫 8（同样输入同样输出）→「语言」。
//     守卫 6（排版次数）在浏览器那一档：test/e2e/layout-count.mjs。PDF 字节：test/engrave-printable.test.ts（N2）。
//   底本 = 分家之后的代码存的（scripts/freeze-layout-surface.mjs；user「本来就不用太念旧」）。比较按统筹 11-11 的容差：路径里的数字差 ≤ 1e-6、别的数字 ≤ 0.0005 + 1e-6，别的逐个相同。
//   红了 = 先查是不是搬错 / 改坏；版面本来就该变才重冻（第六刀这类看得见的先出样张经统筹给 user 看）。
const fs = (await import("node:fs" as string)) as { readFileSync(p: URL, e?: string): Uint8Array & string; readdirSync(p: URL): string[] };
const { gunzipSync } = (await import("node:zlib" as string)) as { gunzipSync(b: Uint8Array): { toString(e: string): string } };
import { describe, it, assert } from "./runner.mjs";
import { engrave, type Prim } from "../src/render/engrave.ts";
import { _tIn } from "../src/i18n/index.ts";
import { createTextMeasure } from "../src/render/text/index.ts";
import { surfaceCases, surfacePath, fullSnapshotRaw, tolDiffs, PATH_NOISE_MAX, FULL_VIEWS, type SurfaceGroup } from "./fixtures/layout/full.ts";
import { fullSong } from "./fixtures/layout/full-song.ts";

/** 逐字段相等（NaN = NaN；碰到函数 = 不是平数据）。 */
const deepEq = (a: unknown, b: unknown, path: string): string | null => {
  if (typeof a === "function" || typeof b === "function") return `${path}：有函数`;
  if (Number.isNaN(a) && Number.isNaN(b)) return null;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return Object.is(a, b) ? null : `${path}：${String(a)} ≠ ${String(b)}`;
  if (Array.isArray(a) !== Array.isArray(b)) return `${path}：数组 / 对象不一样`;
  const ka = Object.keys(a as object), kb = Object.keys(b as object);
  if (ka.length !== kb.length) return `${path}：键数 ${ka.length} ≠ ${kb.length}`;
  for (const k of ka) { const d = deepEq((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}.${k}`); if (d) return d; }
  return null;
};
/** 一组：每一份版面 ① 和底本比（守卫 3）② 平的那一份过一次拷贝逐字段相等（守卫 2）。 */
function checkGroup(group: SurfaceGroup): void {
  const bad: string[] = []; let n = 0;
  for (const c of surfaceCases()) {
    if (c.group !== group) continue; n++;
    const L = c.layout();
    const want = JSON.parse(gunzipSync(fs.readFileSync(surfacePath(c.song, c.view))).toString("utf8"));
    const d = tolDiffs(want, JSON.parse(JSON.stringify(fullSnapshotRaw(L))));
    if (d.out.length) bad.push(`${c.song} · ${c.view}：\n      ${d.out.join("\n      ")}`);
    if (!(d.maxPath <= PATH_NOISE_MAX)) bad.push(`${c.song} · ${c.view}：路径里的数字差 ${d.maxPath} px（不是浮点尾数）`);
    const g = deepEq(L, structuredClone(L), "Layout"); if (g) bad.push(`${c.song} · ${c.view}：平数据过拷贝不相等 ${g}`);
  }
  assert(n > 0, "这一组没有用例");
  assert(bad.length === 0, `版面和底本不一样 / 不是平数据（真该变 = node scripts/freeze-layout-surface.mjs 重冻，先找统筹）：\n    ${bad.join("\n    ")}`);
}

describe("谱面排版：版面和底本逐个相同 + 平数据", () => {
  it("用全的测试歌 × 十种视图（鼓 / 一线谱 / 合租 / 大谱表 / 八度线 / 反复 / 歌词…；按 C 调看 + 级数、横卷、拼音让位、隐藏、紧凑）；比较器不是空的", () => {
    checkGroup("full");
    // 反证：挪一个图元 0.01 px、改路径里一个数 1e-5 = 必须报
    const c = [...surfaceCases()].find((x) => x.group === "full" && x.view === "edit-all")!;
    const want = JSON.parse(gunzipSync(fs.readFileSync(surfacePath(c.song, c.view))).toString("utf8")), got = JSON.parse(JSON.stringify(fullSnapshotRaw(c.layout())));
    const g1 = structuredClone(got); g1.prims[g1.prims.findIndex((p: { t: string }) => p.t === "glyph")].x += 0.01;
    const g2 = structuredClone(got); const k = g2.prims.findIndex((p: { t: string }) => p.t === "path"); g2.prims[k].d = g2.prims[k].d.replace(/-?\d+\.?\d*/, (m: string) => String(Number(m) + 1e-5));
    assert(tolDiffs(want, g1).out.length > 0 && tolDiffs(want, g2).out.length > 0, "比较器放过了挪动：它是空的");
  });
  it("真实密度的大歌（Once upon a Tale，895 个 token、7 声部、合租）× 印 / 全部 / 听", () => { checkGroup("dense"); });
  it("边界情形：空纸 / 全隐藏、只有谱头的轨（补齐）、跨好几行的长音 + 弱起 + 整小节休止、窄到小节里逐列切开", () => { checkGroup("edge"); });
});

const RENDER = new URL("../src/render/", import.meta.url);
const read = (rel: string) => fs.readFileSync(new URL(rel, RENDER), "utf8") as string;
const importsOf = (src: string) => [...src.matchAll(/^\s*import\s[^;]*?from\s*"([^"]+)"/gm)].map((m) => m[1]!);
const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "").replace(/"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g, '""');
const NO_UI = /(^|\/)(keyboard|ui|app)\//;
describe("谱面排版：结构和语言", () => {
  it("结构（守卫 1 这一半）：框架（frame/、engrave.ts）不认字形和纵向、五线谱只经过 staff/index.ts；框架和画法都不碰键盘 / 界面 / app；排版不读界面语言（只用 _tIn）", () => {
    const frame = fs.readdirSync(new URL("frame/", RENDER)).filter((f) => f.endsWith(".ts")).map((f) => `frame/${f}`);
    for (const f of frame) for (const p of importsOf(read(f))) assert(!/staff\/|smufl|stems|glyph-box|score\/clef/.test(p) && !NO_UI.test(p), `${f} import 了 ${p}`);
    for (const p of importsOf(read("engrave.ts"))) {
      assert(!/smufl|stems|glyph-box|score\/clef/.test(p) && !NO_UI.test(p), `engrave.ts import 了 ${p}`);
      if (p.includes("staff/")) assert(p === "./staff/index.ts", `engrave.ts 绕过入口 import 了 ${p}`);
    }
    for (const f of ["engrave.ts", ...frame]) { const c = code(read(f)); for (const w of ["TOP_LINE", "MID_LINE", "BOTTOM_LINE", "GLYPH", "ENGRAVE", "notehead", "ledger", "CLEF_", "PERC_"]) assert(!c.includes(w), `${f} 里有 ${w}`); }
    for (const f of fs.readdirSync(new URL("staff/", RENDER)).filter((x) => x.endsWith(".ts"))) for (const p of importsOf(read(`staff/${f}`))) assert(!NO_UI.test(p), `staff/${f} import 了 ${p}`);
    const all = fs.readdirSync(RENDER).filter((x) => x.endsWith(".ts")).concat(["frame/", "staff/", "text/"].flatMap((d) => fs.readdirSync(new URL(d, RENDER)).filter((x) => x.endsWith(".ts")).map((x) => d + x)));
    for (const f of all) {
      const src = read(f);
      for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*"[^"]*i18n\/index\.ts"/g)) for (const n of m[1]!.split(",").map((x) => x.trim().replace(/^type\s+/, "")).filter(Boolean)) assert(n === "_tIn" || n === "Lang", `${f} 从 i18n 拿了 ${n}`);
      assert(!/\b_t\(/.test(code(src)), `${f} 里调了 _t()`);
    }
    const v = FULL_VIEWS.find((x) => x.name === "edit-all")!, song = fullSong(), D = engrave(song, v.opts(song)) as unknown as Record<string, unknown>;
    for (const k of Object.keys(D)) assert(typeof D[k] !== "function", `排版交出去的 ${k} 是函数（worker 原样回它）`);
  });
  it("结构（守卫 1 谱面这一半，第二刀）：谱面（谱面视图 + 它开的歌词框 / 记号框 / 标题框 + 上面那一层）不碰键盘、不认乐器是谁（设计稿第 3.1 节：谱面「不许知道：键；乐器是谁」）；五线谱只经过 staff/index.ts", () => {
    const UI = new URL("../src/ui/", import.meta.url), readUi = (f: string) => fs.readFileSync(new URL(f, UI), "utf8") as string;
    const SURFACE = ["score-view.ts", "lyric-editor.ts", "mark-editor.ts", "title-editor.ts", "score-overlay.ts"];
    for (const f of SURFACE) for (const p of importsOf(readUi(f))) {
      assert(!/(^|\/)keyboard\//.test(p), `谱面 ${f} import 了键盘模块 ${p}`);
      assert(!/(^|\/)(performers|gm|singer)\//.test(p), `谱面 ${f} import 了 ${p}（乐器是谁由宿主告诉它）`);
      if (p.includes("render/staff/")) assert(p === "../render/staff/index.ts", `谱面 ${f} 绕过五线谱的入口 import 了 ${p}`);
    }
  });
  it("结构（小控件）：src/widgets/ 是叶子——里面的文件不 import src/ 里别的文件夹，谁都可以 import 它（统筹裁定 2026-11-11：滚轮不属于键盘也不属于谱面）", () => {
    const W = new URL("../src/widgets/", import.meta.url), files = fs.readdirSync(W).filter((f) => f.endsWith(".ts"));
    assert(files.length > 0, "src/widgets/ 是空的");
    for (const f of files) for (const p of importsOf(fs.readFileSync(new URL(f, W), "utf8") as string)) assert(p.startsWith("./"), `src/widgets/${f} import 了 ${p}（小控件是叶子，只许 import 同一个文件夹里的）`);
  });
  it("语言（守卫 8）：同一首歌 locale 换了只换那几个字（编排、吸 / 深吸），别的图元一个不变；没给 locale = 报错", () => {
    const song = fullSong();
    const base = { width: 600, sp: 10, at: { paper: song.papers[0]!.id, part: song.parts[0]!.id }, parts: song.parts.map((p, k) => ({ id: p.id, name: p.id, first: k === 0 })), measure: createTextMeasure((s: string) => s.length * 8), autoBars: true };
    const zh = engrave(song, { ...base, locale: "zh" }).prims, en = engrave(song, { ...base, locale: "en" }).prims;
    const words = (ps: Prim[]) => ps.filter((p): p is Extract<Prim, { t: "text" }> => p.t === "text").map((p) => p.s);
    const want = (l: "zh" | "en") => ({ arr: _tIn(l, "编排　"), inh: [_tIn(l, "吸##记号"), _tIn(l, "深吸##记号")] });   // 期望值照翻译表算（英文那条后面是 EN 空格 U+2002）
    const wz = want("zh"), we = want("en");
    assert(wz.arr !== we.arr && wz.inh[0] !== we.inh[0], "翻译表里这几个字中英不一样（不然这条测不出东西）");
    assert(words(zh).includes(wz.arr) && words(zh).some((s) => wz.inh.includes(s)), "中文：编排 / 吸 都在");
    assert(words(en).includes(we.arr) && words(en).some((s) => we.inh.includes(s)), "英文：Arrangement / in 都在");
    assert(en.length === zh.length, "图元个数一样");
    let diff = 0; zh.forEach((p, i) => { if (JSON.stringify(p) !== JSON.stringify(en[i])) diff++; });
    assert(diff > 0 && diff <= 8, `只有那几个字不一样（实际 ${diff} 个）`);
    let threw = false; try { engrave(song, { ...base } as never); } catch { threw = true; }
    assert(threw, "没给 locale = 报错，不偷偷读当前语言");
  });
});
