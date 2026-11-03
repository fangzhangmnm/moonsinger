// deployment.ts —— 「我装在哪」「我被套在别人页面里没有」只在这里认一次。created 2026-11-03 by Claude Opus 5.5
//   家族规则书 `../ai-docs/20261103-three-shapes-rulebook.md`（家族根）§1 第 9 条 / §3：叶子文件、零依赖、全家同名同形；
//   **别处不许再看 `location.protocol` / `window.top` / 烤进 index.html 的部署标记**（test/deployment.test.ts 守着）。
//   消费者只问「能不能」：开关 = deployment-policy.ts；深模块（threads.ts / resources.ts / persistence.ts）自己读 deployment() 挑做法。
//
//   三种部署方式（规则书 §0）：
//     site  = 官网（sing.weebpaint.com，/ 和 /dev/）
//     itch  = 整站 zip 交给 itch、被套在 itch 的页面里（scripts/push-itch.sh 往 zip 里的 index.html 烤 <meta name="deployment" content="itch">）
//     local = 备用版：下载的文件夹双击 index.html（file: 协议；scripts/pack-local.sh 另烤 <meta name="deployment" content="local">，
//             所以同一个文件夹被人用本机小服务器以 http 打开也照样按备用版走——那份 index.html 只认老实脚本、没有 dist/）
//   认法（规则书 §3）：file: 协议 → local（优先于标记：存储现实按协议走）；标记 itch → itch；标记 local → local；否则 site。
//   只在主线程认（后台线程 / 出声线程的起法由 threads.ts 按这里的结果挑，线程自己不认）。

export type Deployment = "site" | "itch" | "local";

/** 纯函数（单测钉死）：协议 + 烤进来的标记 → 部署方式。 */
export function detectDeployment(protocol: string | undefined, marker: string | null | undefined): Deployment {
  if (protocol === "file:") return "local";
  if (marker === "itch") return "itch";
  if (marker === "local") return "local";
  return "site";
}

let memo: Deployment | null = null;
/** 这一页的部署方式（第一次问时认，之后不变）。没有 document / location 的环境（node 测试）= site。 */
export function deployment(): Deployment {
  if (memo) return memo;
  const g = globalThis as { location?: { protocol?: string }; document?: { querySelector?: (s: string) => { getAttribute(n: string): string | null } | null } };
  memo = detectDeployment(g.location?.protocol, g.document?.querySelector?.('meta[name="deployment"]')?.getAttribute("content"));
  return memo;
}

/** 被套在别人页面里（itch 的框、任何 iframe）。跨域读 top 抛异常 = 当作被套着。 */
export function embedded(): boolean {
  try { return window.self !== window.top; } catch { return true; }
}
