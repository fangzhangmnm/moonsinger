// csp-guard.test.mjs —— 页面安全策略（index.html 的 Content-Security-Policy）逐条钉死 + 它要成立的几个前提。created 2026-11-10 by Claude Fable 5.2（总表第 5 条「读文件时的安全」的后一半）。
//   家族同款（WXHW / WeebPaint / CatsUp 各有一份这样的守卫）。要放宽任何一条：先在 ai-docs 写清为什么，再改这里。
import { describe, it, eq, assert } from "./runner.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const html = read("index.html"), bare = html.replace(/<!--[\s\S]*?-->/g, "");

const WANT = {
  "default-src": "'self'",
  "script-src": "'self' 'wasm-unsafe-eval'",          // 只许本站的脚本文件 + 编译 WASM（唱法 / 合成器 / mp3）；没有 'unsafe-inline'、没有 'unsafe-eval'
  "worker-src": "'self' blob:",
  "connect-src": "'self' https: blob: data:",         // 模型 / 音源的镜像地址人能改、网盘的上传下载主机不固定 → 不收白名单；只许 https（和同源）
  "img-src": "'self' data: blob:",
  "media-src": "'self' data: blob:",
  "font-src": "'self' data: blob:",
  "style-src": "'self' 'unsafe-inline'",              // 界面里到处是 style="…"；样式注入偷不了东西、跑不了脚本
  "frame-src": "'self' https://login.microsoftonline.com https://login.live.com",   // 微软登录后台续期的隐藏 iframe
  "object-src": "'none'",
  "base-uri": "'self'",
  "form-action": "'self'",
  "manifest-src": "'self'",
};

describe("页面安全策略", () => {
  const m = /<meta http-equiv="Content-Security-Policy" content="([^"]*)"\s*\/?>/.exec(bare);
  it("index.html 里有，而且排在任何脚本、样式表前面", () => {
    assert(m, "没有 <meta http-equiv=Content-Security-Policy>");
    const at = bare.indexOf(m[0]), first = Math.min(...["<script", "<link rel=\"stylesheet\""].map((x) => bare.indexOf(x)).filter((i) => i >= 0));
    assert(at < first, "策略得写在第一个 <script> / 样式表之前（写在后面的管不到前面的）");
  });
  it("逐条和钉死的一样（不多不少）", () => {
    const got = Object.fromEntries(m[1].split(";").map((x) => x.trim()).filter(Boolean).map((x) => { const i = x.indexOf(" "); return [x.slice(0, i), x.slice(i + 1).trim()]; }));
    eq(JSON.stringify(Object.keys(got).sort()), JSON.stringify(Object.keys(WANT).sort()), "有哪几条");
    for (const [k, v] of Object.entries(WANT)) eq(got[k], v, k);
  });
  it("没有内联脚本（数据块除外）、没有内联事件处理器——有了就会被策略拦下、那个功能静悄悄地不灵", () => {
    for (const s of bare.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      const attrs = s[1], body = s[2].trim();
      if (/type="application\/(ld\+)?json"/.test(attrs)) continue;   // 数据块不执行，不归策略管
      assert(/\bsrc="/.test(attrs) && body === "", `内联脚本：<script${attrs}>…`);
    }
    const on = bare.match(/<[a-z][^>]*\son[a-z]+\s*=/gi);
    assert(!on, `内联事件处理器：${on?.[0]?.slice(0, 80)}`);
  });
  it("歌库：整个 Vue 模块递给图库（只递一部分 = 图库退回运行时编译模板 = 要 eval，被策略拦下、歌库打不开）", () => {
    const g = read("src/gallery-host.ts");
    assert(/import \* as VueAll from "\.\.\/vendor\/vue\/vue\.esm-browser\.prod\.js"/.test(g) && /const vue = VueAll as unknown as VueRuntime/.test(g), "gallery-host.ts 得把整个 Vue 模块递进去");
  });
  it("自己的代码里没有要运行时编译的 Vue 模板（template:）、没有 eval / new Function", () => {
    const walk = (d) => fs.readdirSync(path.join(ROOT, d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : /\.(ts|mjs|js)$/.test(e.name) && !e.name.endsWith(".d.ts") ? [`${d}/${e.name}`] : []));
    for (const f of walk("src")) {
      const code = read(f).replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
      assert(!/\btemplate\s*:\s*[`"']/.test(code), `${f} 里有 Vue 的 template:`);
      assert(!/\bnew Function\s*\(/.test(code) && !/(^|[^\w.$])eval\s*\(/.test(code), `${f} 里有 eval / new Function`);
    }
  });
});

describe("开机兜底脚本搬成了文件：它得跟着进每一份清单", () => {
  it("index.html 在主程序之前载它", () => { const a = bare.indexOf('<script src="./boot-guard.js'), b = bare.indexOf('<script type="module"'); assert(a >= 0 && a < b); });
  it("离线壳预缓存 / 部署清单 / 本地服务 / itch 和备用版的站点清单 / 两份冒烟", () => {
    for (const f of ["service-worker.js", ".github/workflows/deploy.yml", "scripts/serve.sh", "scripts/pack-site.mjs", "test/shell-smoke.mjs", "test/file-smoke.mjs"]) assert(read(f).includes("boot-guard.js"), `${f} 里没有 boot-guard.js`);
  });
  it("备用版打包时去掉策略（它的主程序是内联的）并自检", () => { const s = read("scripts/pack-local.mjs"); assert(/Content-Security-Policy/.test(s) && /还留着页面安全策略/.test(s)); });
});
