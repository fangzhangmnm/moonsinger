// boot-guard.js —— 主程序加载前的兜底：任何脚本错误糊一张红条（iPad 无 devtools）。抄 CatsUp。
// 2026-11-10 by Claude Fable 5.2：从 index.html 的内联 <script> 搬成文件——页面安全策略（index.html 的 Content-Security-Policy，script-src 'self'）不放行内联脚本和内联事件处理器；
//   原来挂在主程序 <script> 上的 onerror="…" 也收到这里（捕获阶段听资源加载失败）。内容和原来一样，多了两样：主程序没加载下来的英文提示、被安全策略拦下的东西记进黑匣子。
//   这个文件要跟着进：service-worker.js 的预缓存、.github/workflows/deploy.yml 的清单、scripts/serve.sh、scripts/pack-site.mjs（test/csp-guard.test.mjs 守着）。
(function () {
  var zh = /^zh/i.test(navigator.language || "");   // bundle 还没来：只能看系统语言（设置里选的语言这时读不到）
  function early(text) { try { (window.__msEarlyErrors = window.__msEarlyErrors || []).push({ t: Date.now(), m: text }); } catch (e) {} }   // 进黑匣子（bundle 起来后 src/app/report-error.ts 收走）
  function show(text) {
    var bar = document.getElementById("errBanner");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "errBanner"; bar.className = "err-banner";
      bar.addEventListener("click", function () { bar.hidden = true; });
      (document.body || document.documentElement).appendChild(bar);
    }
    bar.hidden = false;
    bar.textContent = text + (zh ? "  (点击关闭)" : "  (tap to close)");
    early(text);
  }
  window.__msShowError = show;
  // 「ResizeObserver loop completed with undelivered notifications」= 浏览器按规范发的提示（一帧里有个看大小的回调又改了大小，剩下的通知推到下一帧），不是脚本出错、不丢东西：
  //   不弹红条（user 11-09「开的时候经常出这个error可以看一下」，v0.16.56）；黑匣子照记（src/app/report-error.ts 的 window error 那一路）
  window.addEventListener("error", function (e) { if (/^ResizeObserver loop/.test(String(e.message || ""))) return; if (e.target && e.target !== window) return; show((zh ? "脚本错误：" : "Script error: ") + (e.message || e.error || e)); });
  window.addEventListener("unhandledrejection", function (e) { show((zh ? "未处理的 Promise 错误：" : "Unhandled promise error: ") + (e.reason && (e.reason.message || e.reason))); });
  // 主程序没加载下来（刚发了新版本 / 网络不通）：页面不再是纯白（2026-10-08 iPad 清缓存撞上部署窗口）。资源加载失败不冒泡，只在捕获阶段听得到。
  window.addEventListener("error", function (e) {
    var t = e.target;
    if (t && t.tagName === "SCRIPT" && /\/dist\/moonsinger-/.test(String(t.src || ""))) show(zh ? "主程序没加载下来（刚发了新版本还没到、或网络不通）：等几秒再刷新一次" : "The app didn't load (a new version may still be deploying, or the network is down): wait a few seconds and refresh");
  }, true);
  // 被页面安全策略拦下的东西：不弹红条（浏览器插件往页面里塞脚本也会触发，那不是我们的错），只记进黑匣子——哪天某个功能突然不灵了，先看这里有没有 [csp] 行
  var n = 0;
  document.addEventListener("securitypolicyviolation", function (e) {
    if (++n > 20) return;
    early("[csp] blocked " + (e.violatedDirective || "?") + " " + (e.blockedURI || "inline") + (e.sourceFile ? " @" + String(e.sourceFile).split("/").pop() + ":" + (e.lineNumber || 0) : ""));
  });
})();
