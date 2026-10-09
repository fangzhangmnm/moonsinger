// 持久层显式白名单（家规；user 2026-09-03「touch idb or local storage 必须显式白名单」）：扫 src/ vendor/ service-worker.js 里所有碰
// IndexedDB / localStorage / sessionStorage / Cache Storage / navigator.storage 的文件，每个命中文件必须在 ALLOW 里且写明用途；
// 新文件一碰持久层就红——想加就来这里登记并同步 CLAUDE.md「持久层白名单」表。created 2026-10-08 by Claude Fable 5.1（抄 WebXiaoHeiWu）
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, assert } from "./runner.mjs";

const ALLOW = {
  "src/device-kv.ts": "localStorage：device 层标量唯一器官（storeAttached / gallery-folder / last-scene / diag-log）",
  "src/app/pwa-shell.ts": "Cache Storage：forceReset 只清自己前缀（moonsinger-）的壳缓存；兄弟 app 的缓存和 pwa-models / pwa-sounds 不碰",
  "src/gm/sound-cache.ts": "Cache Storage `pwa-sounds`（家族共享名）：音源整包按 sha256 留着离线能用（可再生派生缓存，user 2026-10-07 批）",
  "service-worker.js": "Cache Storage `moonsinger-<hash>`：app 壳预缓存 + 运行时缓存",
  "src/singer/speech-store.ts": "IDB `moonsinger-speech`：月读念缓存的全局池（可再生派生缓存，住在 worker；user 2026-10-10「建议一个全局池by key and model config hash」批）",
  "vendor/msal/msal-browser.min.js": "MSAL token 缓存（IDB / localStorage / sessionStorage）：由 @internal/store 的 auth 配置驱动，app 不直接调",
};
const TOKEN = /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|\bIDBFS\b|\bcaches\.(open|keys|delete|match)\b|navigator\.storage\b/;
const ROOTS = ["src", "vendor"];
const FILES = ["service-worker.js"];

function* walk(dir) { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) yield* walk(p); else if (/\.(ts|js|mjs)$/.test(f) && !f.endsWith(".d.ts")) yield p; } }
function hitsIn(p) {
  const out = [];
  readFileSync(p, "utf8").split("\n").forEach((line, i) => {
    if (/^\s*\/\//.test(line)) return;
    const code = line.replace(/\/\/(?![^"'`]*["'`]\s*[,;)]).*$/, "");
    if (TOKEN.test(code)) out.push(i + 1);
  });
  return out;
}

describe("storage-whitelist", () => {
  it("碰持久层的文件全在显式白名单里（src / vendor / service-worker.js）", () => {
    const bad = [];
    const files = [...FILES, ...ROOTS.flatMap((r) => [...walk(r)])].map((p) => p.replace(/\\/g, "/"));
    for (const p of files) {
      const h = hitsIn(p);
      if (h.length && !(p in ALLOW)) bad.push(`${p} (lines ${h.slice(0, 5).join(",")}${h.length > 5 ? "…" : ""})`);
    }
    assert(bad.length === 0, "files touching persistent storage without a whitelist entry:\n" + bad.join("\n"));
  });
  it("白名单里没有幽灵条目（文件存在且确实碰持久层）", () => {
    const ghosts = Object.keys(ALLOW).filter((p) => { try { return hitsIn(p).length === 0; } catch { return true; } });
    assert(ghosts.length === 0, "whitelist entries that no longer touch storage (prune): " + ghosts.join(", "));
  });
});
