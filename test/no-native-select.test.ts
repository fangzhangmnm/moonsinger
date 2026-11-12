// 下拉框一律用界面零件库的下拉标准件，不用原生的（7-T）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）
//   本仓 CLAUDE.md「界面的规矩」（user 2026-11-12「我们的下拉框全都不要用 iPad 默认的，都用我们 UI 库里面自带的」）：
//   src 和 index.html 里不许出现原生下拉框的元素（写进 innerHTML 的字、模板、document.createElement 都算）；要下拉 = src/ui/dropdown.ts（库的 select-field）。
import { describe, it, assert } from "./runner.mjs";
const nodeMod = (m: string) => (globalThis as unknown as { process: { getBuiltinModule(m: string): any } }).process.getBuiltinModule(m);
const fs = nodeMod("node:fs"), path = nodeMod("node:path");
const ROOT = nodeMod("node:url").fileURLToPath(new URL("../", import.meta.url)) as string;

describe("下拉框：不用原生的（7-T）", () => {
  it("src / index.html 里没有原生下拉框的元素（<select / <option / createElement(\"select\")）", () => {
    const files: string[] = ["index.html"];
    const walk = (d: string) => { for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(ts|mjs|js|html)$/.test(e.name)) files.push(p); } };
    walk("src");
    const BAD = /<select\b|<option\b|createElement\(\s*["'](select|option)["']\s*\)/i, hits: string[] = [];
    for (const f of files) (fs.readFileSync(path.join(ROOT, f), "utf8") as string).split("\n").forEach((line, i) => { if (BAD.test(line)) hits.push(`${f}:${i + 1}  ${line.trim().slice(0, 100)}`); });
    assert(files.length > 50, `扫到的文件太少（${files.length}）`);
    assert(!hits.length, `还有原生下拉框（换成 src/ui/dropdown.ts 的 dropdownHtml / dropdown）：\n  ${hits.join("\n  ")}`);
  });
  it("要下拉的地方用的是界面零件库那一个（dropdown.ts 只从库里拿 select-field，不自己画）", () => {
    const s = fs.readFileSync(path.join(ROOT, "src/ui/dropdown.ts"), "utf8") as string;
    assert(/import \{[^}]*mountSelectField[^}]*\} from "@internal\/workbench-elements"/.test(s), "dropdown.ts 从 @internal/workbench-elements 拿 mountSelectField");
  });
});
