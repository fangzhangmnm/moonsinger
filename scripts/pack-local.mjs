// pack-local.mjs —— 备用版：下载的文件夹双击 index.html 就能用（灾难备份，不是主力）。created 2026-11-03 by Claude Opus 5.5（家族工单 A 第 7 步；规则书 §3.5）
//   user 11-03「我觉得可以用老实脚本」「今天这一轮可以一起做掉」。做法 = 本仓 ai-docs/20261103-itch-zip-feasibility.md §6 做法 A：
//   · 主程序内联进 index.html（<script type="module">，file:// 内联 module 可用），不 import() 旁边的文件；同一个 bundle、不做阉割 build。
//   · 五个线程（小月相 / mp3 / 录音房 worklet / 排版 / 存档编码）各是自给自足的单文件，当字符串烤进 index.html（<script type="application/json" id="ms-local">），
//     src/threads.ts 用 data: 起（起不来换 blob:）。
//   · 运行时要读的文件（模型包分片、GM 音源、元音表、字体、wasm…）各出一个老实脚本 `<站内路径>.data.js`，一行
//     `(self.__pwaData ??= {})["<站内路径>"] = "<base64>";`；大于 24 MiB 的照 pwa-models 切片 `<站内路径>.<k>.data.js`（键 `<站内路径>#<k>`）。
//     src/resources.ts 用到才插 <script>、取完立刻 delete、解码后核哈希（信任根 = app 里钉的清单；app 自带文件的哈希记在 ms-local 里，和代码同一份）。
//   · 目录和官网一样（pwa-models/packs/<包名>/、pwa-sounds/<文件>）；模型包的 manifest.json / LICENSE.txt 原样带着。
//   · 打包自检：每个 .data.js 解码后哈希 = 清单；总大小 / 文件数 / 单文件照 itch 上限（方便将来放进 itch「可下载」条目）。
//   用法：node scripts/pack-local.mjs [输出目录，默认 .local-build/MoonSinger]   → 文件夹 + 同名 .zip
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, rmSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { ROOT, copySite, resourceList, readVerified, bakeMarker, selfCheck, writeFile, die, sha256, LOCAL_APP_FILES, instrumentFiles } from "./pack-site.mjs";

const out = resolve(process.argv[2] || join(ROOT, ".local-build/MoonSinger"));
const PART = 24 * 1024 * 1024;   // 照 pwa-models 的分片大小
copySite(out);
rmSync(join(out, "dist"), { recursive: true, force: true });   // 备用版里主程序和线程都内联进 index.html：dist/ 用不上，不带（免得以为要它）

/** 一个文件 → 一个或几个老实脚本；回清单条目。 */
const files = {};
function emitData(path, buf, sha) {
  if (sha && sha256(buf) !== sha) die(`哈希对不上：${path}`);
  const parts = Math.max(1, Math.ceil(buf.length / PART));
  for (let k = 0; k < parts; k++) {
    const key = parts === 1 ? path : `${path}#${k}`, file = parts === 1 ? `${path}.data.js` : `${path}.${k}.data.js`;
    writeFile(join(out, file), `(self.__pwaData ??= {})[${JSON.stringify(key)}] = "${buf.subarray(k * PART, (k + 1) * PART).toString("base64")}";\n`);
  }
  files[path] = { sha256: sha ?? sha256(buf), bytes: buf.length, parts };
}

// ① app 自带的、运行时要读的文件
for (const p of LOCAL_APP_FILES) emitData(p, readFileSync(join(ROOT, p)), null);
for (const { path, sha256: sha } of await instrumentFiles()) emitData(path, readFileSync(join(ROOT, path)), sha);
// ② 模型包分片 / GM 音源 = 老实脚本（按 app 里钉的哈希核）；清单 / 许可证原样带着
let res = 0;
for (const r of await resourceList()) {
  const buf = readVerified(r);
  if (r.chunk) emitData(r.site, buf, r.sha256); else writeFile(join(out, r.site), buf);
  res++;
}

// ③ 线程：dist/ 里这一版的五个文件（主 bundle 的 --define 记着名字；按前缀找、只该有一个）
const dist = readdirSync(join(ROOT, "dist"));
const one = (prefix) => { const f = dist.filter((x) => x.startsWith(`${prefix}-`) && x.endsWith(".mjs")); if (f.length !== 1) die(`dist/ 里 ${prefix}-*.mjs 有 ${f.length} 个（先 npm run build）`); return f[0]; };
const threads = {};
for (const name of ["singer-worker", "mp3-worker", "studio-worklet", "layout-worker", "encode-worker"]) threads[name] = readFileSync(join(ROOT, "dist", one(name)), "utf8").replace(/\n\/\/# sourceMappingURL=.*\s*$/, "\n");

// ④ index.html：烤标记、主程序内联、清单 + 线程烤进去；去掉 file: 用不上的 manifest 链接
let html = readFileSync(join(ROOT, "index.html"), "utf8");
const mainSrc = /<script type="module" src="\.\/dist\/(moonsinger-[a-z0-9]+\.mjs)"[^>]*><\/script>/.exec(html);
if (!mainSrc) die("index.html 里找不到主 bundle 的 <script type=module src>");
const mainJs = readFileSync(join(ROOT, "dist", mainSrc[1]), "utf8").replace(/\n\/\/# sourceMappingURL=.*\s*$/, "\n");
if (/\bimport\s*\(\s*["'`]\.\.?\//.test(mainJs)) die("主程序里有 import() 旁边的文件——备用版里载不到（规则书 §3.5：不许 import() 旁边的文件）");
const safeJs = (js) => js.replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "<\\!--");   // 内联进 <script> 时不许提前收尾
const bundleJson = JSON.stringify({ files, threads }).replace(/<\//g, "<\\/").replace(/<!--/g, "<\\u0021--");
if (!/<meta http-equiv="Content-Security-Policy"/.test(html)) die("index.html 里找不到页面安全策略那一行（备用版要去掉它；它没了 = 正式站也没了）");
html = bakeMarker(html, "local")
  .replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*>/, "")   // 备用版的主程序和线程是内联 / blob 起的，页面安全策略（script-src 'self'）放不行；双击打开的文件夹里也没有别人能塞脚本的路——去掉（2026-11-10）
  .replace(/\s*<link rel="manifest"[^>]*>/, "")
  .replace(mainSrc[0], () => `<script type="application/json" id="ms-local">${bundleJson}</script>\n    <script type="module">${safeJs(mainJs)}</script>`);
if (/Content-Security-Policy"/.test(html.replace(/<!--[\s\S]*?-->/g, ""))) die("备用版的 index.html 里还留着页面安全策略");
writeFile(join(out, "index.html"), html);
console.log(`[pack] 主程序内联 ${(mainJs.length / 1e6).toFixed(1)} MB；线程 ${Object.keys(threads).length} 个；老实脚本 ${Object.keys(files).length} 个文件；资源 ${res} 个`);

// ⑤ 自检：每个老实脚本解码后哈希 = 清单
for (const [path, e] of Object.entries(files)) {
  const bufs = [];
  for (let k = 0; k < e.parts; k++) {
    const txt = readFileSync(join(out, e.parts === 1 ? `${path}.data.js` : `${path}.${k}.data.js`), "utf8");
    const m = /^\(self\.__pwaData \?\?= \{\}\)\[("(?:[^"\\]|\\.)*")\] = "([A-Za-z0-9+/=]*)";\n$/.exec(txt);
    if (!m || JSON.parse(m[1]) !== (e.parts === 1 ? path : `${path}#${k}`)) die(`老实脚本格式不对：${path}`);
    bufs.push(Buffer.from(m[2], "base64"));
  }
  const all = Buffer.concat(bufs);
  if (all.length !== e.bytes || sha256(all) !== e.sha256) die(`老实脚本解码后哈希对不上：${path}`);
}
console.log(`[pack] 自检：${Object.keys(files).length} 个文件的老实脚本解码后哈希都 = 清单`);
selfCheck(out, "备用版");

const zip = `${out}.zip`;
rmSync(zip, { force: true });
try { execFileSync("zip", ["-qrX", zip, basename(out)], { cwd: resolve(out, "..") }); } catch (e) { die(`zip 失败：${e.message}`); }   // zip 里带一层 MoonSinger/（解开就是一个文件夹）
console.log(`[pack] ✓ ${out}\n[pack] ✓ ${zip}`);
