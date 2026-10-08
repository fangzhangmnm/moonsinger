// service-worker.js —— MoonSinger 的离线壳（家族 content-hash 形，抄 JustReadBooks service-worker.js）。created 2026-10-07 by Claude Opus 5.5
//   - install：取 index.html → 抠出当前主 bundle 文件名 → 预缓存入口 + 主 bundle + 静态件
//   - 缓存名 = "moonsinger-<主 bundle 哈希>"；新版本 = 新缓存名，activate 只清自己前缀的旧缓存（家规：同域名的兄弟 app 和共享模型缓存 pwa-models 不碰）
//   - prod（scope = /）：cache-first + 后台核对（变了通知页面「有新版本」）；dev（scope 含 /dev/）：network-first（改完即见，离线回退缓存）
//   - 不预缓存：两个 worker、WORLD、试听元音表（用到才取，取过就进缓存，之后离线也在）；模型包走 @internal/model-packs 的 `pwa-models`，本 SW 不经手
//     （同源自建的 `pwa-models/` 也放行不缓存，免得存两份）

const STATIC_PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./styles.css",
  "./vendor/fonts/bravura/Bravura.woff2",
  "./vendor/internal-css/workbench-elements.css",
  "./vendor/internal-css/gallery.css",
  "./vendor/msal/msal-browser.min.js",
];

let CACHE_NAME = "moonsinger-boot";
const SCOPE_IS_DEV = self.location.pathname.includes("/dev/");
const SCOPE_PATH = self.location.pathname.replace(/[^/]*$/, "");

// SW 空闲被杀重启后顶层重跑，CACHE_NAME 会回落 "moonsinger-boot" → 从 caches.keys() 找回唯一的 moonsinger-<hash>（家族级坑）。
let cacheNameResolved = null;
async function currentCacheName() {
  if (CACHE_NAME !== "moonsinger-boot") return CACHE_NAME;
  if (!cacheNameResolved) cacheNameResolved = (async () => {
    const keys = (await caches.keys()).filter((k) => k.startsWith("moonsinger-") && k !== "moonsinger-boot");
    if (keys.length) CACHE_NAME = keys[keys.length - 1];
    return CACHE_NAME;
  })().finally(() => { cacheNameResolved = null; });
  return cacheNameResolved;
}

async function getCurrentBundleUrl() {
  const res = await fetch("./index.html", { cache: "no-store" });
  if (!res.ok) throw new Error("install: index.html fetch failed " + res.status);
  const html = await res.text();
  const m = html.match(/src="(\.\/dist\/moonsinger-[a-z0-9]+\.mjs)"/i);
  if (!m) throw new Error("install: entry ./dist/moonsinger-*.mjs not found in index.html");
  return { html, bundleUrl: m[1] };
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const { bundleUrl } = await getCurrentBundleUrl();
    const bundleHash = bundleUrl.match(/moonsinger-([a-z0-9]+)\.mjs/i)?.[1] || "boot";
    CACHE_NAME = `moonsinger-${bundleHash}`;
    const cache = await caches.open(CACHE_NAME);
    const urls = [...STATIC_PRECACHE, bundleUrl];
    await Promise.all(urls.map((u) =>
      fetch(u, { cache: "no-store" })
        .then((r) => (r.ok ? cache.put(u, r) : null))
        .catch((err) => console.warn("[SW] precache miss", u, err.message)),
    ));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("moonsinger-") && k !== CACHE_NAME).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

let updateAnnounced = false;
async function notifyUpdate(url) {
  if (updateAnnounced) return;
  updateAnnounced = true;
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  for (const c of clients) c.postMessage({ type: "asset-updated", url });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(SCOPE_PATH)) return;
  if (!SCOPE_IS_DEV && url.pathname.includes("/dev/")) return;
  if (url.pathname.includes("/pwa-models/")) return;   // 模型包：字节层自己存 pwa-models，这里不再存一份
  const p = SCOPE_IS_DEV ? networkFirst(req) : cacheFirst(req);
  event.respondWith(req.mode === "navigate" ? withNoStore(p) : p);
});

// 导航响应加 Cache-Control: no-store → WebKit 不把本页放进 bfcache（登录 redirect 离场时旧页冻进 bfcache 会握死 IDB 锁；store 0.12.1 闸门是承重层，这是额外一层）。
async function withNoStore(p) {
  const r = await p;
  if (!(r instanceof Response)) return r;
  const h = new Headers();
  if (r.headers && typeof r.headers.forEach === "function") r.headers.forEach((v, k) => h.set(k, v));
  h.set("Cache-Control", "no-store");
  return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
}

async function cacheFirst(req) {
  const cache = await caches.open(await currentCacheName());
  const cached = await cache.match(req, { ignoreSearch: true });
  const networkPromise = fetch(req).then((resp) => {
    if (resp && resp.ok) {
      if (cached) {
        const cE = cached.headers.get("etag"), fE = resp.headers.get("etag");
        const cL = cached.headers.get("content-length"), fL = resp.headers.get("content-length");
        const changed = (cE && fE && cE !== fE) || (!cE && cL && fL && cL !== fL);
        if (changed) notifyUpdate(req.url).catch(() => {});
      }
      cache.put(req, resp.clone()).catch(() => {});
    }
    return resp;
  }).catch(() => null);
  if (cached) { networkPromise.catch(() => {}); return cached; }
  const resp = await networkPromise;
  if (resp) return resp;
  return navFallback(req, cache);
}

const NETWORK_FIRST_TIMEOUT_MS = self.__NETWORK_FIRST_TIMEOUT_MS ?? 60000;
async function networkFirst(req) {
  const cache = await caches.open(await currentCacheName());
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), NETWORK_FIRST_TIMEOUT_MS);
    let resp;
    try { resp = await fetch(req, { signal: ac.signal }); } finally { clearTimeout(timer); }
    if (resp && resp.ok) cache.put(req, resp.clone()).catch(() => {});
    return resp;
  } catch {
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;
    return navFallback(req, cache);
  }
}

async function navFallback(req, cache) {
  if (req.mode === "navigate") {
    const fallback = await cache.match("./index.html");
    if (fallback) return fallback;
  }
  return new Response("offline & not cached", { status: 503 });
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "skip-waiting") self.skipWaiting();
});
