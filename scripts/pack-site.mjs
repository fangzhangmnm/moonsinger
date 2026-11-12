// pack-site.mjs —— itch 版 / 备用版共用的打包件：拷站点、按 app 内钉的哈希拷资源子集、自检。created 2026-11-03 by Claude Opus 5.5（家族工单 A 第 3 / 7 步）
//   家族规则书 §1 第 7 条 / §3.5：目录和官网一模一样（pwa-models/packs/<包名>/<分片>、pwa-sounds/<文件>），信任根 = app 里钉的清单哈希；
//   资源从兄弟仓拷（模型仓 ../20260903 PWA Models、音源仓 ../20261007 PWA Sounds；环境变量 MS_MODELS_DIR / MS_SOUNDS_DIR 可改），拷之前逐个核哈希。
//   不联网。用法见 scripts/pack-itch.mjs / scripts/pack-local.mjs。
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const MODELS_DIR = process.env.MS_MODELS_DIR || join(ROOT, "../20260903 PWA Models");
export const SOUNDS_DIR = process.env.MS_SOUNDS_DIR || join(ROOT, "../20261007 PWA Sounds");
/** itch HTML5 上限（https://itch.io/docs/creators/html5，2026-11-03 查）。 */
export const ITCH_LIMITS = { totalBytes: 500e6, files: 1000, fileBytes: 200e6 };

export const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
export const die = (msg) => { console.error(`[pack] ✗ ${msg}`); process.exit(1); };

/** 站点本身（同 .github/workflows/deploy.yml 的白名单），去掉 itch / 备用版用不上的：service-worker.js（不注册离线壳）、dist/*.map（8 MB 调试件）、vendor/msal（不登录网盘，不载）。 */
export const SITE_FILES = ["index.html", "manifest.webmanifest", "styles.css", "boot-guard.js", "icon.svg", "icon-192.png", "icon-512.png", "icon-32.png", "apple-touch-icon-180.png"];
export const SITE_DIRS = ["vendor", "dist", "assets"];
const skipSite = (rel) => /\.map$/.test(rel) || rel.startsWith("vendor/msal/") || /(^|\/)\./.test(rel);

export function copySite(out) {
  rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
  for (const f of SITE_FILES) { if (!existsSync(join(ROOT, f))) die(`站点少了 ${f}`); cpSync(join(ROOT, f), join(out, f)); }
  for (const d of SITE_DIRS) cpSync(join(ROOT, d), join(out, d), { recursive: true, filter: (src) => !skipSite(relative(ROOT, src).replace(/\\/g, "/")) });
}

/** 模型 / 音源子集：[{ site: 站内路径, src: 源文件, sha256: 钉的哈希 | null（附带文件：清单 / 许可证，按清单里的哈希核） }]。 */
export async function resourceList() {
  const { PACKS } = await import(join(ROOT, "src/singer/packs.gen.ts"));
  const { SOUNDS } = await import(join(ROOT, "src/gm/sounds.gen.ts"));
  const out = [];
  for (const [slug, { packId, manifest }] of Object.entries(PACKS)) {
    const dir = join(MODELS_DIR, "packs", slug);
    out.push({ site: `pwa-models/packs/${slug}/manifest.json`, src: join(dir, "manifest.json"), sha256: packId });   // packId = sha256(manifest.json 原字节)
    for (const c of manifest.chunks) out.push({ site: `pwa-models/packs/${slug}/${c.name}`, src: join(dir, c.name), sha256: c.sha256, chunk: true });
    if (manifest.license?.file) out.push({ site: `pwa-models/packs/${slug}/${manifest.license.file}`, src: join(dir, manifest.license.file), sha256: manifest.license.sha256 ?? null });
  }
  for (const e of Object.values(SOUNDS)) {
    out.push({ site: `pwa-sounds/${e.file}`, src: join(SOUNDS_DIR, e.file), sha256: e.sha256, chunk: true });
    if (e.license?.file) out.push({ site: `pwa-sounds/${e.license.file}`, src: join(SOUNDS_DIR, e.license.file), sha256: e.license.sha256 ?? null });   // 目录条目里的许可证路径相对音源库根
  }
  return out;
}

/** 读一个资源并核哈希（核不过 = 停，不打包）。 */
export function readVerified(r) {
  if (!existsSync(r.src)) die(`资源不在：${r.src}（MS_MODELS_DIR / MS_SOUNDS_DIR 可改源目录）`);
  const buf = readFileSync(r.src);
  if (r.sha256 && sha256(buf) !== r.sha256) die(`哈希对不上：${r.site}（源 ${r.src}）`);
  return buf;
}

/** 往 index.html 的 <head> 里烤部署标记（deployment.ts 认它）。 */
export function bakeMarker(html, shape) {
  if (/<meta name="deployment"/.test(html)) die("index.html 里已经有部署标记了");
  const out = html.replace(/<meta charset="UTF-8" \/>/, `<meta charset="UTF-8" />\n    <meta name="deployment" content="${shape}" />`);
  if (out === html) die("index.html 里找不到 <meta charset> 来挂部署标记");
  return out;
}

export function* walkFiles(dir) { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) yield* walkFiles(p); else yield p; } }

/** 自检：总大小 / 文件数 / 单文件上限（itch 的规矩；备用版也照这个数，方便将来放进 itch「可下载」条目）。 */
export function selfCheck(out, label) {
  let total = 0, n = 0, biggest = { p: "", b: 0 };
  for (const p of walkFiles(out)) { const b = statSync(p).size; total += b; n++; if (b > biggest.b) biggest = { p: relative(out, p), b }; }
  const L = ITCH_LIMITS, bad = [];
  if (total > L.totalBytes) bad.push(`总大小 ${(total / 1e6).toFixed(1)} MB > ${L.totalBytes / 1e6} MB`);
  if (n > L.files) bad.push(`文件数 ${n} > ${L.files}`);
  if (biggest.b > L.fileBytes) bad.push(`单文件 ${biggest.p} ${(biggest.b / 1e6).toFixed(1)} MB > ${L.fileBytes / 1e6} MB`);
  console.log(`[pack] ${label}：${n} 个文件 · ${(total / 1e6).toFixed(1)} MB · 最大 ${biggest.p} ${(biggest.b / 1e6).toFixed(1)} MB`);
  if (bad.length) die(`超出 itch 上限：${bad.join("；")}`);
  return { total, n, biggest };
}

/** 备用版里运行时要读的 app 自带文件（resources.ts getBytes 的那些路径 + 线程向主线程要的 WORLD / LAME）。乐器目录的三个文件按 instruments.gen.ts 另外加。
 *  test/local-files.test.mjs 守着：源码里出现的 vendor/… assets/… 读取路径都得在这里（漏了 = 备用版里那一处读不到）。 */
export const LOCAL_APP_FILES = [
  "assets/preview/vowels.json", "assets/preview/vowels.pcm16",
  "vendor/tsf/tsf-standalone.wasm",
  "vendor/fonts/sans.ttf.gz", "vendor/fonts/bravura/outlines.json", "vendor/fonts/serif/chord-outlines.json",
  "vendor/world/world.mjs", "vendor/world/world.wasm",
  "vendor/lame/lame.mjs", "vendor/lame/lame.wasm",
];
export async function instrumentFiles() {
  const { INSTRUMENT_FILES } = await import(join(ROOT, "src/gm/instruments.gen.ts"));
  return Object.values(INSTRUMENT_FILES).map((e) => ({ path: e.file, sha256: e.sha256 }));
}

export const writeFile = (p, data) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, data); };
