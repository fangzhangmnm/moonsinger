// 正式版 / 开发版的壳缓存互不相删（同一个网址；家族周账 F-145）。created 2026-11-03 by Claude Opus 5.5（家族工单 H；同小黑屋 test/sw-strategy.test.mjs 那组）
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, it, assert } from "./runner.mjs";

const SRC = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");
function load(scopePath, names) {
  const handlers = {}, deleted = [];
  const ctx = {
    self: { location: { pathname: scopePath, origin: "https://x.test" }, addEventListener: (t, f) => { handlers[t] = f; }, skipWaiting: async () => {}, clients: { matchAll: async () => [], claim: async () => {} }, registration: { scope: "https://x.test/" } },
    caches: { open: async () => ({ match: async () => null, put: async () => {} }), keys: async () => names, delete: async (k) => { deleted.push(k); return true; }, match: async () => null },
    fetch: async () => { throw new Error("offline"); }, Response: class {}, Headers, URL, AbortController, setTimeout, clearTimeout, console: { warn() {}, log() {}, error() {} },
  };
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  return { handlers, deleted };
}
const activate = async (sw) => { let p; sw.handlers.activate({ waitUntil: (x) => { p = x; } }); await p; };
const ALL = ["moonsinger-aaa111", "moonsinger-dev-bbb222", "moonsinger-boot", "pwa-models", "xiaoheiwu-ccc333"];

describe("service-worker · 正式版 / 开发版的壳缓存互不相删", () => {
  it("开发版 activate：只删开发版自己的", async () => {
    const sw = load("/dev/service-worker.js", ALL);
    await activate(sw);
    assert(!sw.deleted.includes("moonsinger-aaa111"), "不许删正式版的壳");
    assert(!sw.deleted.includes("pwa-models") && !sw.deleted.includes("xiaoheiwu-ccc333"), "不许删别人的");
    assert(sw.deleted.includes("moonsinger-dev-bbb222"), "自己的旧壳要删");
  });
  it("正式版 activate：只删正式版自己的", async () => {
    const sw = load("/service-worker.js", ALL);
    await activate(sw);
    assert(!sw.deleted.includes("moonsinger-dev-bbb222"), "不许删开发版的壳");
    assert(!sw.deleted.includes("pwa-models") && !sw.deleted.includes("xiaoheiwu-ccc333"), "不许删别人的");
    assert(sw.deleted.includes("moonsinger-aaa111"), "自己的旧壳要删");
  });
  it("重启后找回缓存名只认自己这一边；新壳的名字带范围", () => {
    assert(/\(await caches\.keys\(\)\)\.filter\(isOwnCache\)/.test(SRC));
    assert(/CACHE_NAME = `\$\{OWN_PREFIX\}\$\{bundleHash\}`/.test(SRC));
  });
});
