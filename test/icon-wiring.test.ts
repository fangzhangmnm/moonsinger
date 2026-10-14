// 图标 / 根目录静态件的接线守卫（v0.11.0）。created 2026-10-11 by Claude Opus 5.5
// index.html 和 manifest 引用的根目录文件，必须真的在、并且三处都登记了：service-worker.js 的预缓存、
// deploy.yml 拼站点时拷的白名单（漏了 = 线上静默 404，WeebPaint 踩过）、scripts/serve.sh 的本机服务表。
// 档位与规矩见 ai-docs/20261011-icon-tiers.md。
import { describe, it, assert } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL, enc: "utf8"): string; existsSync(u: URL): boolean; readdirSync(u: URL, o: { recursive: true }): string[] };

const at = (f: string) => new URL(`../${f}`, import.meta.url);
const read = (f: string) => fs.readFileSync(at(f), "utf8");
const rootFile = (href: string) => { const m = href.match(/^\.\/([^/?#]+)$/); return m ? m[1] : null; };

describe("图标接线", () => {
  it("index.html / manifest 引用的根目录文件都在，且 SW 预缓存 / deploy 白名单 / serve.sh 都登记了", () => {
    const html = read("index.html"), man = JSON.parse(read("manifest.webmanifest"));
    const refs = new Set<string>();
    for (const m of html.matchAll(/<link\s+rel="(?:icon|apple-touch-icon|manifest)"\s+href="([^"]+)"/g)) { const f = rootFile(m[1]); if (f) refs.add(f); }
    for (const ic of man.icons) { const f = rootFile(ic.src); if (f) refs.add(f); }
    assert(refs.size >= 5, `应当至少有 manifest + 四个图标，拿到 ${[...refs]}`);
    const sw = read("service-worker.js"), deploy = read(".github/workflows/deploy.yml"), serve = read("scripts/serve.sh");
    const deployList = (deploy.match(/for f in ([^;]+); do/) ?? [])[1]?.split(/\s+/) ?? [];  // 第一个 for f = 根目录文件表
    const serveList = (serve.match(/for f in ([^;]+); do/) ?? [])[1]?.split(/\s+/) ?? [];
    for (const f of refs) {
      assert(fs.existsSync(at(f)), `${f} 不存在`);
      assert(sw.includes(`"./${f}"`), `${f} 不在 service-worker.js 的预缓存里`);
      assert(deployList.includes(f), `${f} 不在 deploy.yml 的拷贝白名单里`);
      assert(serveList.includes(f), `${f} 不在 scripts/serve.sh 里`);
    }
  });
  it("分享卡片的 og:image 指的根目录文件在，且在 deploy 白名单里（它是 content= 绝对地址，上面那条看不到它）", () => {
    const html = read("index.html"), deploy = read(".github/workflows/deploy.yml");
    const deployList = (deploy.match(/for f in ([^;]+); do/) ?? [])[1]?.split(/\s+/) ?? [];
    const imgs = [...html.matchAll(/<meta\s+property="og:image"\s+content="https:\/\/sing\.weebpaint\.com\/([^"/?#]+)"/g)].map((m) => m[1]);
    assert(imgs.length === 1, `应当有一个 og:image 指着 sing.weebpaint.com 根目录，拿到 ${imgs}`);
    for (const f of imgs) { assert(fs.existsSync(at(f)), `${f} 不存在`); assert(deployList.includes(f), `${f} 不在 deploy.yml 的拷贝白名单里（线上会 404）`); }
  });
  it("网页标题不跟歌名：运行时不改 document.title（W-22）", () => {
    const hits = fs.readdirSync(at("src"), { recursive: true }).filter((f) => /\.(ts|mjs|js)$/.test(f) && /document\.title\s*=/.test(read(`src/${f}`)));
    assert(hits.length === 0, `这些文件在改 document.title：${hits}`);
  });
  it("标签页走手画的 32 像素档，icon.svg 不挂 rel=icon", () => {
    const html = read("index.html");
    assert(/<link rel="icon" href="\.\/icon-32\.png"/.test(html), "标签页应当是 icon-32.png");
    assert(!/<link rel="icon"[^>]*icon\.svg/.test(html), "icon.svg 挂上 rel=icon 会盖掉手画的 32 档");
  });
});
