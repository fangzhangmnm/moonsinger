// 谱面排版的长期测试（谱面分家 1b 收尾，2026-11-11 Claude Opus 5.5；施工单 ai-docs/20261111-score-surface-construction-plan.md）。
//   user 11-11「开发的时候可以相对细致一点，开发完一块可以收成几个综合的对抗性测试」：1b 开发时的几十份全量快照是脚手架，收成下面这几条。
//   守的是设计稿第 3.9 节（ai-docs/20261111-score-surface-architecture.md）：
//     守卫 1（结构）→「结构」；守卫 2（平数据）→ 前三条每一份版面都过一次拷贝比；守卫 3（版面不变样）→ 前三条和底本比；守卫 8（同样输入同样输出）→「语言」。
//     守卫 6（排版次数）在浏览器那一档：test/e2e/layout-count.mjs。PDF 字节：test/engrave-printable.test.ts（N2）。
//   底本 = 分家之后的代码存的（scripts/freeze-layout-surface.mjs；user「本来就不用太念旧」）。比较按统筹 11-11 的容差：路径里的数字差 ≤ 1e-6、别的数字 ≤ 0.0005 + 1e-6，别的逐个相同。
//   红了 = 先查是不是搬错 / 改坏；版面本来就该变才重冻（第六刀这类看得见的先出样张经统筹给 user 看）。
const fs = (await import("node:fs" as string)) as { readFileSync(p: URL, e?: string): Uint8Array & string; readdirSync(p: URL): string[] };
const { gunzipSync } = (await import("node:zlib" as string)) as { gunzipSync(b: Uint8Array): { toString(e: string): string } };
import { describe, it, assert, eq } from "./runner.mjs";
import { engrave, type Prim, type Layout } from "../src/render/engrave.ts";
import { ARTS, DYNS, type Song, type Token } from "../src/score/song.ts";
import { SIGNS } from "../src/render/signs.ts";
import { NOTATIONS as NOTATION_IDS } from "../src/score/song-view.ts";
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

// ── 守卫 4（全量）/ 守卫 5（点击只指 token 或家具）：谱面分家第四刀 4-7（设计稿第 3.9 节；施工单第三节「4」验收）。created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟）──
//   用全的测试歌 × 两种谱（五线谱 / 切成简谱）× 编辑视图。数字行上的、仍排成五线谱行的都算。
type Where = { paper: string; part: string; index: number; tok: Token };
/** 一个点击框指的是哪条轨的哪个 token（合租叠起来的那一行 = 虚拟轨；合租的声部 2 = hit.part）。 */
function hitTrack(L: Layout, song: Song, h: { system: number; part?: string }): { paper: string; part: string; tokens: Token[] } {
  const row = L.systems[h.system]!, part = h.part ?? row.part, tokens = L.virtual[`${row.paper}:${part}`] ?? song.papers.find((x) => x.id === row.paper)!.tracks[part]!;   // 虚拟轨的键 = 「纸:声部」
  assert(!!tokens, `点击框指的那一行（${row.paper} / ${part}）找不到轨`);
  return { paper: row.paper, part, tokens };
}
/** 轨开头（第一个音 / 休止之前）的那几个 token 的下标。 */
const headIdx = (toks: readonly Token[]) => { const k = toks.findIndex((t) => t.kind === "note" || t.kind === "rest"); return k < 0 ? toks.length : k; };
/** 分家前就有的、两种谱一样的缺口（这一刀不补；要不要补 = 第五节「小弟问（4-7 守卫 4）」等统筹定）。落不进这几类的没图元的 token = 红。 */
function knownGap(w: Where, song: Song, L: Layout, rowKind: string | undefined): string | null {
  const paper = song.papers.find((x) => x.id === w.paper)!, head = w.index < headIdx(paper.tracks[w.part]!), host = song.parts.find((x) => x.id === w.part)?.host;
  if (paper.hidden) return "隐藏的整张纸（不排；细行在覆盖层）";
  if (host !== undefined || song.parts.some((x) => x.host === w.part)) return "合租叠成一行的一家（主人和房客都画在虚拟轨上，token 编号不同）";
  if (head && w.tok.kind === "tempo") return "谱头的速度（画速度的共用挂件不带 token；不在最上面的那几位的谱头速度本来就不画）";
  if (head && w.tok.kind === "clef") return "轨开头的谱号记号（并进了行首谱号）";
  if (rowKind === "staff" && ["key", "time", "clef", "ottava", "bar"].includes(w.tok.kind)) return "五线谱上调号 / 拍号 / 谱号 / 八度线 / 小节线的字形有的不带 token（行首的、行中间换的、段落线 / 终止线…）";
  return null;
}
describe("谱面排版：全量和点击（守卫 4 / 5）", () => {
  const cases = [{ name: "五线谱", song: fullSong() }, { name: "简谱", song: { ...fullSong(), notation: "jianpu" } as Song }];
  const view = FULL_VIEWS.find((v) => v.name === "edit-all")!;
  for (const c of cases) {
    it(`守卫 4（全量）· ${c.name}：每个 token 至少一个图元指着它（落进「分家前就有的缺口」那几类的除外，数字行上只许谱头的速度和轨开头的谱号）；一个图元最多指一个 token`, () => {
      const L = engrave(c.song, view.opts(c.song)), has = new Set<number>(), seen: string[] = [];
      for (const p of L.prims) if (p.tok !== undefined) { assert(typeof p.tok === "number", "图元的 tok 是一个 token 的 id（一个图元最多一个 token）"); has.add(p.tok); }
      const gaps = new Map<string, number>();
      for (const paper of c.song.papers) for (const [part, toks] of Object.entries(paper.tracks)) toks.forEach((tok, index) => {
        if (has.has(tok.id)) return;
        const rowKind = L.systems.find((r) => r.paper === paper.id && r.part === part)?.kind, why = knownGap({ paper: paper.id, part, index, tok }, c.song, L, rowKind);
        if (!why) { seen.push(`${paper.id}/${part} ${tok.kind}#${tok.id}`); return; }
        if (rowKind === "jianpu") assert(/谱头的速度|轨开头的谱号/.test(why), `数字行上的 ${paper.id}/${part} ${tok.kind}#${tok.id} 没图元（${why}）——数字行只许谱头的速度和轨开头的谱号`);
        gaps.set(why, (gaps.get(why) ?? 0) + 1);
      });
      eq(seen.join(" "), "", "说不出原因的没图元的 token");
      assert(gaps.size > 0 || c.name === "简谱", "比较器不是空的");
    });
    it(`守卫 5（点击只指 token 或家具）· ${c.name}：每个带下标的点击框指向对的那条轨里对的那种 token；光标落点在轨长之内`, () => {
      const L = engrave(c.song, view.opts(c.song));
      type H = { index: number; system: number; part?: string; kind?: string };
      const want = (hits: readonly H[], ok: (tok: Token, h: H) => boolean, what: string) => {
        assert(hits.length > 0, `${what}：有点击框（比较器不是空的）`);
        for (const h of hits) { const t = hitTrack(L, c.song, h), tok = t.tokens[h.index]; assert(!!tok && ok(tok, h), `${what} ${t.paper}/${t.part} 第 ${h.index} 个（${h.kind ?? ""}）= ${tok?.kind ?? "没有"}`); }
      };
      const is = (k: string) => (tok: Token) => tok.kind === k;
      want(L.notes, is("note"), "音"); want(L.chordHeads, is("note"), "叠音的符头"); want(L.rests, is("rest"), "休止");
      want(L.lyrics, is("note"), "歌词"); want(L.chordTags, is("note"), "和弦级数");
      want(L.marks, (tok, h) => tok.kind === h.kind, "调号 / 拍号 / 速度");
      // 渐到 = 带 ramp 的力度记号：它的虚线楔形按「发夹」登记、指着那个力度记号（设计如此）
      want(L.dyns, (tok, h) => tok.kind === h.kind || (h.kind === "hairpin" && tok.kind === "dyn" && !!(tok as { ramp?: boolean }).ramp), "力度 / 发夹 / 风格 / 跳转");
      want(L.clefs.filter((h) => h.kind !== "start" && h.index >= 0), (tok, h) => tok.kind === (h.kind === "mid" ? "clef" : "ottava"), "行中间的谱号 / 八度线");
      for (const h of L.clefs.filter((x) => x.kind === "start")) assert(c.song.parts.some((p) => p.id === h.part) || !!L.virtual[h.part], `行首谱号（家具）指的声部 ${h.part} 在`);
      for (const sl of L.slots) { const t = hitTrack(L, c.song, sl); assert(sl.caret >= 0 && sl.caret <= t.tokens.length, `光标落点 ${sl.caret} 在轨长 ${t.tokens.length} 之内`); }
    });
  }
  it("记号表不漏（编译期由 Record<…> 守着；这里核运行时的表：每个演奏法、每个力度一行，每一行每种谱都有一栏画法）", () => {
    const ids = [...ARTS.map((a) => `art:${a}`), ...DYNS.map((d) => `dyn:${d}`)];
    for (const id of ids) { const sg = (SIGNS as Record<string, { draw: Record<string, unknown> }>)[id]; assert(!!sg, `记号表里有 ${id}`); for (const n of NOTATION_IDS) assert(!!sg!.draw[n], `${id} 在${n}里画成什么`); }
  });
});

const RENDER = new URL("../src/render/", import.meta.url);
const read = (rel: string) => fs.readFileSync(new URL(rel, RENDER), "utf8") as string;
const importsOf = (src: string) => [...src.matchAll(/^\s*import\s[^;]*?from\s*"([^"]+)"/gm)].map((m) => m[1]!);
const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "").replace(/"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g, '""');
const NO_UI = /(^|\/)(keyboard|ui|app)\//;
describe("谱面排版：结构和语言", () => {
  it("结构（守卫 1 这一半）：框架（frame/、engrave.ts）不认字形和纵向、只经过谱种的表（notations.ts）拿画法；表只从两种画法的入口（staff/index.ts、jianpu/index.ts）拿；两种画法互不知道（排版单元的时间那一半在框架，第五刀 5-1）；框架和画法都不碰键盘 / 界面 / app；排版不读界面语言（只用 _tIn）", () => {
    const frame = fs.readdirSync(new URL("frame/", RENDER)).filter((f) => f.endsWith(".ts")).map((f) => `frame/${f}`);
    for (const f of frame) for (const p of importsOf(read(f))) assert(!/staff\/|jianpu\/|notations|smufl|stems|glyph-box|score\/clef/.test(p) && !NO_UI.test(p), `${f} import 了 ${p}`);
    for (const p of importsOf(read("engrave.ts"))) assert(!/staff\/|jianpu\/|smufl|stems|glyph-box|score\/clef/.test(p) && !NO_UI.test(p), `engrave.ts import 了 ${p}（画法只经过谱种的表 notations.ts）`);
    for (const p of importsOf(read("notations.ts"))) if (/staff\/|jianpu\//.test(p)) assert(p === "./staff/index.ts" || p === "./jianpu/index.ts", `notations.ts 绕过入口 import 了 ${p}`);
    const jp = fs.readdirSync(new URL("jianpu/", RENDER)).filter((x) => x.endsWith(".ts"));
    assert(jp.includes("index.ts"), "简谱有一个入口文件");
    for (const f of jp) for (const m of read(`jianpu/${f}`).matchAll(/^\s*import\s(type\s)?[^;]*?from\s*"([^"]+)"/gm)) {
      const p = m[2]!;
      assert(!NO_UI.test(p) && !/smufl|stems|glyph-box|score\/clef/.test(p), `jianpu/${f} import 了 ${p}`);
      assert(!p.includes("staff/"), `jianpu/${f} import 了五线谱的 ${p}（两种画法互不知道；排版单元在框架 frame/units.ts，第五刀 5-1）`);
    }
    for (const f of ["engrave.ts", ...frame]) { const c = code(read(f)); for (const w of ["TOP_LINE", "MID_LINE", "BOTTOM_LINE", "GLYPH", "ENGRAVE", "notehead", "ledger", "CLEF_", "PERC_"]) assert(!c.includes(w), `${f} 里有 ${w}`); }
    for (const f of fs.readdirSync(new URL("staff/", RENDER)).filter((x) => x.endsWith(".ts"))) for (const p of importsOf(read(`staff/${f}`))) assert(!NO_UI.test(p), `staff/${f} import 了 ${p}`);
    const all = fs.readdirSync(RENDER).filter((x) => x.endsWith(".ts")).concat(["frame/", "staff/", "jianpu/", "text/"].flatMap((d) => fs.readdirSync(new URL(d, RENDER)).filter((x) => x.endsWith(".ts")).map((x) => d + x)));
    for (const f of all) {
      const src = read(f);
      // 这首歌怎么看只此一处读（设计稿第 3.7 节；第四刀 4-5 收了版式 / 歌词排法 / 小节号）：排版不直接读歌的显示字段，只经过 songViewOf（engrave 读一次，传给画法）
      assert(!/\b(song|s)\.(notation|chordTags|viewInC|lyricFit|barNumbers|spacing|paper)\b|\bdensityOf\(|\.chords\b/.test(code(src)), `${f} 直接读了歌的显示字段（只许 songViewOf）`);
      for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*"[^"]*i18n\/index\.ts"/g)) for (const n of m[1]!.split(",").map((x) => x.trim().replace(/^type\s+/, "")).filter(Boolean)) assert(n === "_tIn" || n === "Lang", `${f} 从 i18n 拿了 ${n}`);
      assert(!/\b_t\(/.test(code(src)), `${f} 里调了 _t()`);
    }
    const v = FULL_VIEWS.find((x) => x.name === "edit-all")!, song = fullSong(), D = engrave(song, v.opts(song)) as unknown as Record<string, unknown>;
    for (const k of Object.keys(D)) assert(typeof D[k] !== "function", `排版交出去的 ${k} 是函数（worker 原样回它）`);
  });
  it("结构（守卫 1 谱面这一半，第二刀 / 第四刀）：谱面（谱面视图 + 它开的歌词框 / 记号框 / 标题框 + 上面那一层）不碰键盘、不认乐器是谁（设计稿第 3.1 节：谱面「不许知道：键；乐器是谁」）；行的几何只查谱种表旁边那张几何表（notations.ts GEOMETRY），不直接 import 哪一种画法、不按谱种分支（统筹审第四刀接口第 2 条）", () => {
    const UI = new URL("../src/ui/", import.meta.url), readUi = (f: string) => fs.readFileSync(new URL(f, UI), "utf8") as string;
    const SURFACE = ["score-view.ts", "lyric-editor.ts", "mark-editor.ts", "title-editor.ts", "score-overlay.ts"];
    for (const f of SURFACE) for (const p of importsOf(readUi(f))) {
      assert(!/(^|\/)keyboard\//.test(p), `谱面 ${f} import 了键盘模块 ${p}`);
      assert(!/(^|\/)(performers|gm|singer)\//.test(p), `谱面 ${f} import 了 ${p}（乐器是谁由宿主告诉它）`);
      assert(!/render\/(staff|jianpu)\//.test(p), `谱面 ${f} 直接 import 了一种画法 ${p}（行的几何只查 notations.ts 的 GEOMETRY）`);
    }
    const noComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    // 「jianpu」作为一个词（图标名 jianpu-staff 这种连着别的字的不算）、按谱种指名查表、拿行的种类和 "staff" / "jianpu" 比
    for (const f of SURFACE) assert(!/(?<![-\w])jianpu(?![-\w])|GEOMETRY\.(staff|jianpu)|\.kind\s*[!=]==?\s*"(staff|jianpu)"/.test(noComments(readUi(f))), `谱面 ${f} 按谱种分支了（只许按这一行的种类查 GEOMETRY）`);
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
