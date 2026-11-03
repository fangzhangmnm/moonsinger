// dist 新鲜度守卫（家族工单 A2 ③，2026-11-03 Claude Opus 5.5）：提交了的 dist 必须是从提交了的源码打出来的。
//   起因 = v0.14.9–11 只提交了源码、dist 停在 v0.14.8 → 线上 /dev/ 一直是 v0.14.8（serve 不构建，E2E 也对着旧包跑）。
//   只看 HEAD：HEAD 的 dist/build-stamp.json 的源码指纹 = HEAD 树里那些输入的指纹；HEAD 的 index.html 指着的主 bundle 在 HEAD 里、版本号 = HEAD 的 src/version.ts。
//   红了 = npm run build，再把 dist/ + index.html 和源码一起提交。没有 git（拷出来的源码包）= 跳过。
import { execFileSync } from "node:child_process";
import { describe, it, assert, eq } from "./runner.mjs";
import { fingerprint, headEntries, ROOT } from "../scripts/source-stamp.mjs";

const show = (path) => { try { return execFileSync("git", ["show", `HEAD:${path}`], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] }); } catch { return null; } };
const hasGit = (() => { try { execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, stdio: "ignore" }); return true; } catch { return false; } })();

describe("dist 新鲜度：提交了的 dist = 提交了的源码打出来的", () => {
  if (!hasGit) { it("（没有 git：跳过）", () => {}); return; }
  const stamp = (() => { const t = show("dist/build-stamp.json"); try { return t ? JSON.parse(t) : null; } catch { return null; } })();
  it("HEAD 里有 dist/build-stamp.json", () => { assert(!!stamp, "HEAD 里没有 dist/build-stamp.json：npm run build 之后把 dist/ 一起提交"); });
  it("HEAD 的戳 = HEAD 的源码（源码提交了、dist 没重打 = 红）", () => {
    if (!stamp) return;
    eq(stamp.source, fingerprint(headEntries()), "源码指纹对不上：npm run build，再把 dist/ + index.html 和源码一起提交");
  });
  it("HEAD 的 index.html 指着的主 bundle 在 HEAD 里、版本号 = HEAD 的 src/version.ts", () => {
    const html = show("index.html") ?? "", main = /src="\.\/dist\/(moonsinger-[a-z0-9]+\.mjs)"/.exec(html)?.[1];
    assert(!!main, "HEAD 的 index.html 里找不到主 bundle");
    const bundle = show(`dist/${main}`); assert(bundle != null, `HEAD 里没有 dist/${main}`);
    const version = /APP_VERSION = "([^"]+)"/.exec(show("src/version.ts") ?? "")?.[1];
    assert(!!version && bundle.includes(`"${version}"`), `主 bundle 里的版本号不是 ${version}（dist 没重打？）`);
    if (stamp) eq(stamp.main, main, "戳里记的主 bundle = index.html 指着的");
  });
});
