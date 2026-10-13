// 离线壳碰到跳转响应原样交回（W-21 / 家族周账 F-28）：导航请求的 fetch 拿到 301 / 302 时交回的是 type opaqueredirect、status 0 的 Response，
//   withNoStore 用它的 status 重建 Response 会抛 RangeError → 整次导航失败。这里把 service-worker.js 的源码在 node 里装上假的 self 跑起来，直接喂一个 status 0 的 Response。
//   反证：把 withNoStore 里那行「跳转响应原样交回」删掉 = 第一条红（RangeError）。同一写法还在 WXHW / JRB / WeebPaint 的 service-worker.js（搬子域名之前要先修）。
// created 2026-10-13 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL, enc: "utf8"): string };

function loadSw(): { withNoStore(p: Promise<unknown>): Promise<unknown> } {
  const src = fs.readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");
  const self = { addEventListener() {}, location: { pathname: "/", origin: "https://example.invalid" }, skipWaiting() {}, clients: { matchAll: async () => [] } };
  // 顶层只注册监听、算 SCOPE_PATH；把几个内部函数交出来
  const factory = new Function("self", `${src}\nreturn { withNoStore };`) as (s: unknown) => { withNoStore(p: Promise<unknown>): Promise<unknown> };
  return factory(self);
}
/** 浏览器里的「跳转响应」在 node 里造不出来（Response 构造器不收 status 0）——拿一个真 Response 把 status / type 盖成那样。 */
function opaqueRedirect(): Response {
  const r = new Response(null, { status: 204 });
  Object.defineProperty(r, "status", { value: 0 }); Object.defineProperty(r, "type", { value: "opaqueredirect" }); Object.defineProperty(r, "ok", { value: false });
  return r;
}

describe("离线壳：导航响应", () => {
  it("跳转响应（opaqueredirect / status 0）原样交回，不重建、不抛", async () => {
    const sw = loadSw(), r = opaqueRedirect();
    const out = await sw.withNoStore(Promise.resolve(r));
    assert(out === r, "应该是同一个 Response 对象（原样交回）");
  });
  it("普通 200 导航响应照旧加 Cache-Control: no-store（原有行为不变）", async () => {
    const sw = loadSw();
    const out = (await sw.withNoStore(Promise.resolve(new Response("<html>", { status: 200, headers: { "content-type": "text/html", etag: "x" } })))) as Response;
    eq(out.status, 200); eq(out.headers.get("cache-control"), "no-store"); eq(out.headers.get("etag"), "x"); eq(await out.text(), "<html>");
  });
  it("不是 Response 的东西原样交回", async () => {
    const sw = loadSw(), o = { not: "a response" };
    eq(await sw.withNoStore(Promise.resolve(o)), o);
  });
});
