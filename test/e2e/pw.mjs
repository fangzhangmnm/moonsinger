// test/e2e/pw.mjs —— 借 WeebPaint 的 playwright（家族里只装了那一份，本仓不另装）。created 2026-10-08 by Claude Fable 5.1
//   位置从 git 的 common dir 往上找：主目录里 `.git` 在仓根，worktree 里 common dir 指回主仓的 `.git`——两种 checkout 都能定位到家族目录
//   `<家族目录>/20260524 WeebPaint/node_modules/playwright/`（以前写死 `../../../…`，在 `.claude/worktrees/<名>/` 里深了三层就找不到）。
import { execSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
const common = path.resolve(execSync("git rev-parse --git-common-dir", { encoding: "utf8" }).trim());   // 主仓的 .git
const family = path.dirname(path.dirname(common));                                                       // 主仓 → 家族目录
const pw = process.env.PLAYWRIGHT_INDEX ?? path.join(family, "20260524 WeebPaint", "node_modules", "playwright", "index.mjs");
const mod = await import(pathToFileURL(pw).href);
// 测试看中文界面（v0.15.0 起界面跟系统语言；无头浏览器默认 en-US）。要测英文 = newContext({ locale: "en-US" }) 明写。edited by Claude Opus 5.5 2026-11-04
const ZH = { locale: "zh-CN" };
// 第一次打开问一次的那张卡（施工单第 18 条，这台设备的习惯）：现有的 E2E 都当成「这台设备问过了」——每一页载入前没有记号就写上（还原出厂清掉之后重新载入也一样）。
//   专门测卡的那份 = newContext({ firstOpen: true })：不写。edited by Claude Opus 5.5 2026-11-13
const ASKED = () => { try { const k = "moonsinger-5b1e7c0a92d34f6e:habits-asked"; if (localStorage.getItem(k) === null) localStorage.setItem(k, "1"); } catch { /* 没有 localStorage = 卡本来也不出 */ } };
const asked = async (ctx, firstOpen) => { if (!firstOpen) await ctx.addInitScript(ASKED); return ctx; };
const wrapBrowser = (b) => new Proxy(b, { get(t, k) {
  if (k === "newContext") return async ({ firstOpen, ...o } = {}) => asked(await t.newContext({ ...ZH, ...o }), firstOpen);
  if (k === "newPage") return async ({ firstOpen, ...o } = {}) => { const p = await t.newPage({ ...ZH, ...o }); await asked(p.context(), firstOpen); return p; };
  const v = t[k]; return typeof v === "function" ? v.bind(t) : v;
} });
const wrapType = (ty) => new Proxy(ty, { get(t, k) {
  if (k === "launch") return async (...a) => wrapBrowser(await t.launch(...a));
  if (k === "launchPersistentContext") return async (dir, { firstOpen, ...o } = {}) => asked(await t.launchPersistentContext(dir, { ...ZH, ...o }), firstOpen);
  const v = t[k]; return typeof v === "function" ? v.bind(t) : v;
} });
export const chromium = wrapType(mod.chromium), firefox = wrapType(mod.firefox), webkit = wrapType(mod.webkit);
