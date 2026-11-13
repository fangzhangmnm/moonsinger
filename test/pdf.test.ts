// 乐谱 PDF（src/export/pdf.ts + score-pdf.ts + vendor/fonts）。created 2026-10-09 by Claude Opus 5.5（user「自己写pdf…歌词用字体」）
import { describe, it, eq, assert } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readFileSync(p: string | URL, e?: string): Uint8Array & string; readdirSync(p: string | URL, o?: unknown): string[]; statSync(p: string | URL): { isDirectory(): boolean } };
const { createHash } = (await import("node:crypto" as string)) as { createHash(a: string): { update(b: Uint8Array): { digest(e: string): string } } };
import { svgToPdfPath } from "../src/export/pdf.ts";
import { segsOf } from "../src/export/score-pdf.ts";
const root = new URL("../", import.meta.url);

describe("PDF：路径", () => {
  it("字形轮廓（M L H V Q C Z）→ PDF 指令；H / V 不丢（2026-10-09 抓到：漏了 V，四分音符没了符干、拍号数字没了）", () => {
    eq(svgToPdfPath("M0 0H10V20L5 5Z").trim(), "0 0 m 10 0 l 10 20 l 5 5 l h");
    assert(svgToPdfPath("M0 0Q10 10 20 0").includes(" c "), "二次曲线转三次");
    let threw = false; try { svgToPdfPath("M0 0A1 1 0 0 1 2 2"); } catch { threw = true; }
    assert(threw, "认不出的命令 = 报错（不静默画缺一笔）");
  });
  it("谱面的路径（逗号分隔、绝对坐标）→ 页面坐标的段（平移）", () => {
    const s = segsOf("M1,2L3,4Q5,6 7,8Z", 10, -1);
    eq(JSON.stringify(s.map((x) => x.k)), JSON.stringify(["M", "L", "C", "Z"]));
    eq(JSON.stringify(s[0]), JSON.stringify({ k: "M", x: 11, y: 1 }));
  });
});

describe("PDF：资产", () => {
  it("画谱用到的每个 SMuFL 码位在 Bravura 轮廓里都有（缺了就跑 scripts/gen-bravura-outlines.py）", () => {
    const out = JSON.parse(fs.readFileSync(new URL("vendor/fonts/bravura/outlines.json", root), "utf8") as string) as { glyphs: Record<string, unknown> };
    const need = new Set<number>([...Array(10).keys()].flatMap((d) => [0xe080 + d, 0xe880 + d]));
    const walk = (u: URL): string[] => fs.readdirSync(u).flatMap((f) => { const v = new URL(f + (fs.statSync(new URL(f, u)).isDirectory() ? "/" : ""), u); return fs.statSync(v).isDirectory() ? walk(v) : f.endsWith(".ts") ? [v.href] : []; });
    for (const f of walk(new URL("src/render/", root))) {
      const s = fs.readFileSync(new URL(f), "utf8") as string;
      for (const m of s.matchAll(/\\u\{([0-9A-Fa-f]{4,5})\}|\\u([0-9A-Fa-f]{4})/g)) { const cp = parseInt(m[1] ?? m[2]!, 16); if (cp >= 0xe000 && cp <= 0xf8ff) need.add(cp); }
    }
    const miss = [...need].map((c) => c.toString(16).toUpperCase()).filter((h) => !out.glyphs[h]);
    eq(miss.join(" "), "", "缺的码位");
  });
  it("和弦标会用到的每个字符在衬线字轮廓里都有（v0.16.34；v0.17.34 起两种写法 + 根音字母 + 「·」「?」，♭ ♯ 不是字、是 Bravura 字形；缺了就跑 scripts/gen-chord-outlines.py）", async () => {
    const out = JSON.parse(fs.readFileSync(new URL("vendor/fonts/serif/chord-outlines.json", root), "utf8") as string) as { unitsPerEm: number; glyphs: Record<string, { adv: number }> };
    eq(out.unitsPerEm, 1000, "和 Bravura 一样 1000 单位一个 em（PDF 里同一个 em 换算）");
    const src = fs.readFileSync(new URL("src/theory/western.ts", root), "utf8") as string;
    const chars = new Set([...[...src.matchAll(/(?:rs|sym): "([^"]*)"/g)].map((m) => m[1]!).join(""), ..."IVXivx0123456789/() ABCDEFG·?"]);
    chars.delete("♭"); chars.delete("♯");
    const key = (c: string) => `T${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`;
    eq([...chars].filter((c) => !out.glyphs[key(c)]).join(""), "", "缺的字");
    assert(!out.glyphs[key("♭")] && !out.glyphs[key("♯")], "♭ ♯ 不再借进衬线字（和弦标里的升降号是谱上的 Bravura 字形，src/render/chord-text.ts）");
    // 排版用的字宽表和轮廓同一次生成：字一样、字宽一样（屏幕排的宽 = PDF 画出来的宽）
    const G = await import("../src/render/chord-text.gen.ts");
    eq(Object.keys(G.CHORD_ADV).sort().join(""), Object.keys(out.glyphs).map((k) => String.fromCodePoint(parseInt(k.slice(1), 16))).sort().join(""), "字宽表和轮廓的字一样");
    for (const [c, a] of Object.entries(G.CHORD_ADV)) eq(a, out.glyphs[key(c)]!.adv / 1000, `「${c}」的字宽`);
  });
  it("字体（思源黑体）= 从 WXHW 拷来的那份（逐字节）；拼音字体退役了（7-J）", () => {
    const sha = (p: string) => createHash("sha256").update(fs.readFileSync(new URL(p, root))).digest("hex");
    eq(sha("vendor/fonts/sans.ttf.gz"), "e29b80bf17ad17bbd07b59642a817b04075b5a9001c53f4783e42c82188d575a");
    let gone = false; try { fs.readFileSync(new URL("vendor/fonts/pinyin.ttf.gz", root)); } catch { gone = true; }
    assert(gone, "拼音字体 7-J 退役：仓里不再有这个文件");
  });
});
