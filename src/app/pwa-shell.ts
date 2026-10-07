// 页面侧 PWA shell：注册 service worker + 4 路更新检测 → onUpdateAvailable 回调（JRP 函数形 + WeebPaint 教训）。
// created 2026-09-03 by Claude Fable 5.1（WXHW）· 2026-09-19 拷入 JRB by Claude Fable 5.1 · 2026-10-07 拷入 MoonSinger by Claude Opus 5.5
//   路径 1 冷启动遇 registration.waiting · 2 updatefound→installed · 3 SW postMessage asset-updated · 4 回前台/焦点/10min poke
//   （4 = iPad/Quest 命门：standalone PWA 不会自己 updatefound）。
//   prod 与 dev(/dev/) 都注册（worker 按 scope 分 cache-first / network-first）；只跳 localhost（dev server 无 SW）。
//   onForeground **无条件挂**（不寄生在 SW 注册成功路径上——WeebPaint v409 坑）。
//   模块顶层调用（不进 window.load：type=module 时 load 可能早已过去——RealHome 坑 #0）。


const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", ""]);

/** 本 app 壳缓存的名字前缀（= service-worker.js 的 `moonsinger-<hash>` / `moonsinger-boot`）。清缓存只许动这个前缀。 */
const SHELL_CACHE_PREFIX = "moonsinger-";

export interface PwaShellOptions {
  onUpdateAvailable: () => void;
  onForeground?: () => void;
  onBeforeReload?: () => void | Promise<void>;
}
export interface PwaShell {
  readonly isDevRoute: boolean;
  /** 应用等待中的新 SW 并 reload（toast「刷新」按钮调）。 */
  reload: () => Promise<void>;
  /** 清缓存重启（PWA 卡旧版的逃生舱）：注销管着本页的 SW + 清自己前缀的壳缓存 + reload。模型包（`pwa-models`）不碰。 */
  forceReset: () => Promise<void>;
  /** 手动检查更新（设置里的按钮）：poke registration.update()，等新 SW 装完。
   *  "found" = 有新版待应用（调用方弹「有新版本」toast）；"latest" = 已是最新；"unavailable" = 没有 SW（localhost / 不支持）。 */
  checkForUpdate: () => Promise<"found" | "latest" | "unavailable">;
}

export function initPwaShell(opts: PwaShellOptions): PwaShell {
  const isDevRoute = location.pathname.includes("/dev/") || LOCAL_HOSTS.has(location.hostname);
  let registration: ServiceWorkerRegistration | null = null;

  async function reload(): Promise<void> {
    try { await opts.onBeforeReload?.(); } catch { /* 落盘失败也得让用户能刷 */ }
    const reg = registration ?? (await navigator.serviceWorker?.getRegistration()) ?? null;
    if (!reg || !reg.waiting) { location.reload(); return; }
    let done = false;
    const doReload = () => { if (done) return; done = true; location.reload(); };
    navigator.serviceWorker.addEventListener("controllerchange", doReload, { once: true });
    reg.waiting.postMessage({ type: "skip-waiting" });
    setTimeout(doReload, 5000);
  }

  // 加固（user 2026-09-04 Quest「点强制刷新没有自动重启」，原因不明且无法远程复现）：这条链不许无声——
  //   前置 flush 加超时（挂住也走）；导航用带时间戳的 replace（绕 HTTP 缓存；reload 被吞也能走）；2.5s 看门狗再踢一脚；
  //   重启后标题栏的版本号就是到了哪一版。
  async function forceReset(): Promise<void> {
    const settle = (p: void | Promise<void>, ms: number) => Promise.race([Promise.resolve(p).catch(() => undefined), new Promise<void>((r) => setTimeout(r, ms))]);
    await settle(opts.onBeforeReload?.(), 4000);
    try {
      // 只动自己的：家族的 app 几乎都挂在同一个域名下，缓存和 service worker 是按域名算的——
      //   「全部注销 / 全部删除」会把兄弟 app 的离线壳、家族共享的模型缓存 `pwa-models`（语音识别模型、朗读语音包）一起清掉。
      //   自己的 = 管着当前页面的那一个 service worker + 名字以 `moonsinger-` 开头的缓存（service-worker.js 的壳缓存前缀）。
      if (navigator.serviceWorker) { const r = await navigator.serviceWorker.getRegistration(); if (r) await r.unregister().catch(() => {}); }
      if (typeof caches !== "undefined") for (const k of await caches.keys()) { if (k.startsWith(SHELL_CACHE_PREFIX)) await caches.delete(k).catch(() => {}); }
    } catch { /* best-effort — reload anyway */ }
    const target = `${location.pathname}?reset=${Date.now()}`;
    setTimeout(() => location.replace(target), 150);
    setTimeout(() => { location.href = target; }, 2500);   // 看门狗：第一脚没走再踢一次
  }

  async function checkForUpdate(): Promise<"found" | "latest" | "unavailable"> {
    const reg = registration ?? (await navigator.serviceWorker?.getRegistration()) ?? null;
    if (!reg) return "unavailable";
    if (reg.waiting) return "found";
    try { await reg.update(); } catch { return "unavailable"; }
    if (reg.waiting) return "found";
    const sw = reg.installing;
    if (!sw) return "latest";
    // 新 SW 正在装：等它 installed（≤15s，慢网兜底）——装完 = 有新版
    return await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(reg.waiting ? "found" : "latest"), 15000);
      sw.addEventListener("statechange", () => {
        if (sw.state === "installed") { clearTimeout(timer); resolve("found"); }
        else if (sw.state === "redundant") { clearTimeout(timer); resolve("latest"); }
      });
    });
  }

  const onFg = () => {
    registration?.update().catch(() => {});
    opts.onForeground?.();
  };
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") onFg(); });
  window.addEventListener("focus", onFg);

  if ("serviceWorker" in navigator && !LOCAL_HOSTS.has(location.hostname)) {
    navigator.serviceWorker.addEventListener("message", (e: MessageEvent) => {
      if ((e.data as { type?: string } | null)?.type === "asset-updated") opts.onUpdateAvailable();
    });
    navigator.serviceWorker.register("./service-worker.js").then((reg) => {
      registration = reg;
      if (reg.waiting && navigator.serviceWorker.controller) opts.onUpdateAvailable();
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) opts.onUpdateAvailable();
        });
      });
      setInterval(() => { reg.update().catch(() => {}); }, 10 * 60 * 1000);
    }).catch((err: unknown) => { console.warn("[pwa] SW register failed", err); });
  }

  return { isDevRoute, reload, forceReset, checkForUpdate };
}
