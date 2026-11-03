// persistence.ts —— 持久化深模块的「健康」一半：这一页的存储靠不靠得住。created 2026-11-03 by Claude Opus 5.5
//   家族规则书 §1 第 10 条 / §3：持久化深模块（最底层，知道部署方式、报 availability、前缀在这一处执行）；调用者只读健康状态做提醒，不自己 try/catch 修。
//   键值那一半 = src/device-kv.ts（localStorage 唯一器官，前缀 `moonsinger-5b1e7c0a92d34f6e:`，写不进退内存）——本文件建在它上面，不另碰存储。
//   歌的本地副本 / 同步态归 @internal/store 自己管（规则书 §1 第 11 条：store 不建在这里）。
//
//   availability（本 app 报得出的三档；不去问 navigator.storage.persisted()——持久化申请归 store，宿主不重复问）：
//     best-effort  = 存得住，但浏览器有权整桶清掉；itch / 备用版还和别人共用同一个桶（规则书 §0「共用存储」）
//     session      = 开局还行、半路写不进了（配额 / 被清）：已经在的还读得到，新写的只在这次打开里
//     unavailable  = 开局就碰不了存储（Safari 双击打开、隐私设置禁了）：全程只在内存，关了就忘
//   health = 人话的理由（进黑匣子、给「没测过 + 报告入口」那一句和半路的提醒用）。
import { deployment } from "./deployment.ts";
import { deviceKvUsable, onDeviceKvFallback } from "./device-kv.ts";

export type Availability = "best-effort" | "session" | "unavailable";
export interface Health { level: "ok" | "degraded" | "unavailable"; reasons: string[] }

let avail: Availability | null = null;
const reasons: string[] = [];
const subs = new Set<(h: Health) => void>();

function init(): Availability {
  if (avail) return avail;
  if (!deviceKvUsable()) { avail = "unavailable"; reasons.push(deployment() === "local" ? "这个浏览器不让双击打开的网页用存储" : "这个浏览器现在不让这一页用存储"); }
  else {
    avail = "best-effort";
    if (deployment() !== "site") reasons.push(deployment() === "itch" ? "和 itch 上别的游戏共用一个存储桶" : "和这台电脑上别的双击打开的网页共用一个存储桶");
  }
  onDeviceKvFallback((why) => {
    if (avail !== "best-effort") return;   // 已经降过了：只说一次
    avail = "session"; reasons.push(`写不进存储了（${why}）：这次打开之后的设置只留在内存里`);
    const h = health(); for (const cb of subs) { try { cb(h); } catch { /* 一个听众出错不影响别的 */ } }
  });
  return avail;
}

/** 这一页的存储靠不靠得住（第一次问时探一次，之后只会往下降）。 */
export function availability(): Availability { return init(); }
/** 健康 + 人话理由。 */
export function health(): Health {
  const a = init();
  return { level: a === "unavailable" ? "unavailable" : a === "session" ? "degraded" : "ok", reasons: [...reasons] };
}
/** 半路降级时通知（开局就不可用的不通知——开局那一句由宿主读 availability() 说）。返回退订。 */
export function onHealth(cb: (h: Health) => void): () => void { init(); subs.add(cb); return () => subs.delete(cb); }
