// 红线守卫（结构性，非行为）：接缝之外不得出现第二条存储 / 云路径。created 2026-10-08 by Claude Fable 5.1（抄 WebXiaoHeiWu test/redline-guard.test.mjs）
//   白名单：src/app-store.ts（store 接缝）、src/device-kv.ts（localStorage 唯一器官）、src/config.ts（常量 SSoT：URL / 路径字符串，不是访问）。
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, assert } from "./runner.mjs";

const SEAM = new Set(["src/app-store.ts", "src/device-kv.ts", "src/config.ts"]);
// @internal/gallery 的值级 import 点（图库屏 / 纯函数缩图 / store 的 ui 接线器 storeUIFor / 黑匣子 diagLog）
const GALLERY_OK = new Set(["src/gallery-host.ts", "src/image/cover.ts", "src/store-ui.ts", "src/app/report-error.ts"]);
const BAD = [
  { re: /\blocalStorage\b/, why: "raw localStorage" },
  { re: /\bindexedDB\b|\bIDBDatabase\b/, why: "raw IndexedDB" },
  { re: /PublicClientApplication|msal-browser|loginRedirect|acquireToken/, why: "raw MSAL" },
  { re: /graph\.microsoft\.com|login\.microsoftonline\.com/, why: "raw Graph/AAD URL" },
  { re: /\bcaches\.(open|keys|delete)\b/, why: "Cache Storage outside SW/pwa-shell" },
];
// Cache Storage 的两个派生缓存：壳（pwa-shell）、音源库 pwa-sounds（src/gm/sound-cache.ts，user 2026-10-07「我觉得还是idb有缓存吧」批）
const ALLOW_CACHES = new Set(["src/app/pwa-shell.ts", "src/gm/sound-cache.ts"]);
// 黄线区（家规硬规则 #8 + 白名单制）：语音字节永不外发；任何非相对 URL 的网络访问只准在白名单文件里
//   （本仓黄线区见 CLAUDE.md：音源库 pwa-sounds、模型源 pwa-models——都是只读 GET + sha256 校验）。
const NET_BAD = [
  { re: /\bSpeechRecognition\b|webkitSpeechRecognition/, why: "system speech recognition (audio leaves device)" },
  { re: /api\.groq\.com|api\.openai\.com|speech\.googleapis|cognitiveservices|deepgram|assemblyai/, why: "cloud speech service" },
  { re: /new WebSocket\(|XMLHttpRequest|sendBeacon/, why: "network channel outside whitelist" },
];
function* walk(dir) { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) yield* walk(p); else if (/\.(ts|mjs)$/.test(f)) yield p; } }

describe("redline-guard", () => {
  it("src/ 里接缝之外零裸 localStorage / IDB / MSAL / Graph", () => {
    const hits = [];
    for (const p of walk("src")) {
      const rel = p.replace(/\\/g, "/");
      if (SEAM.has(rel)) continue;
      readFileSync(p, "utf8").split("\n").forEach((line, i) => {
        if (/^\s*\/\//.test(line)) return;   // 注释行豁免（说明性提及）
        for (const { re, why } of BAD) {
          if (why.startsWith("Cache Storage") && ALLOW_CACHES.has(rel)) continue;
          if (re.test(line)) hits.push(`${rel}:${i + 1} [${why}] ${line.trim().slice(0, 100)}`);
        }
      });
    }
    assert(hits.length === 0, "red-line guard hits:\n" + hits.join("\n"));
  });
  it("黄线区：src/ 里零系统 / 云语音识别、零白名单外的外发通道（硬规则 #8）", () => {
    const hits = [];
    for (const p of walk("src")) {
      const rel = p.replace(/\\/g, "/");
      readFileSync(p, "utf8").split("\n").forEach((line, i) => {
        if (/^\s*\/\//.test(line)) return;
        for (const { re, why } of NET_BAD) if (re.test(line)) hits.push(`${rel}:${i + 1} [${why}] ${line.trim().slice(0, 100)}`);
      });
    }
    assert(hits.length === 0, "yellow-line guard hits:\n" + hits.join("\n"));
  });
  it("@internal/store 值级 import 只在 src/app-store.ts（+ src/identifiers.ts 只准拿纯函数 createIdentifiers）；@internal/encryption 只在 src/encryption.ts；@internal/gallery 值级只在 GALLERY_OK 四个文件", () => {
    const hits = [];
    for (const p of walk("src")) {
      const rel = p.replace(/\\/g, "/");
      const src = readFileSync(p, "utf8");
      for (const m of src.matchAll(/^import\s+(type\s+)?[^;]*?from\s+["'](@internal\/(store|encryption|gallery))["']/gm)) {
        if (m[1]) continue;
        if (m[2] === "@internal/store" && rel === "src/identifiers.ts") {
          const names = m[0].replace(/^import\s*\{|\}[\s\S]*$/g, "").split(",").map((x) => x.trim()).filter((x) => x && !x.startsWith("type "));
          if (names.join(",") !== "createIdentifiers") hits.push(`${rel}: 只准 createIdentifiers，拿了 ${names.join(",")}`);
          continue;
        }
        if (m[2] === "@internal/store" && rel !== "src/app-store.ts") hits.push(`${rel}: ${m[0]}`);
        if (m[2] === "@internal/encryption" && rel !== "src/encryption.ts") hits.push(`${rel}: ${m[0]}`);
        if (m[2] === "@internal/gallery" && !GALLERY_OK.has(rel)) hits.push(`${rel}: ${m[0]}`);
      }
      // 深 import 进包内部 / 旧 ./store/ 路径 → 红
      for (const m of src.matchAll(/from\s+["'](@internal\/store\/(?!testing)|(\.{1,2}\/)+store\/)[^"']*["']/g)) hits.push(`${rel}: deep import ${m[0]}`);
    }
    assert(hits.length === 0, "seam violations:\n" + hits.join("\n"));
  });
  it("src/ 里没有 getRegistrations()；caches.delete 都带自己前缀的筛子", () => {
    const hits = [];
    for (const p of walk("src")) readFileSync(p, "utf8").split("\n").forEach((l, i) => {
      const code = l.replace(/\/\/.*$/, "");
      if (/getRegistrations\s*\(/.test(code)) hits.push(`${p}:${i + 1}: getRegistrations()`);
      if (/\bcaches\s*\.\s*delete\s*\(/.test(code) && !/startsWith\(/.test(code) && !/SOUND_CACHE|CACHE_NAME|PREFIX/.test(code)) hits.push(`${p}:${i + 1}: caches.delete without the own-prefix filter`);
    });
    assert(hits.length === 0, "reset scope violations:\n" + hits.join("\n"));
  });
});
