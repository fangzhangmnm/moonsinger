// store 接线守卫（结构性）：冲突面 / 报错 / busy 三条线在建 store 时就接好，一条都不许空着（user 2026-10-08「冲突面照家规 必须做的非常严格…不要发生没有接线的情况」）。
// created 2026-10-08 by Claude Fable 5.1。不跑浏览器：读源码断言形状——改了接线形状就来这里同步，别把守卫改松。
import { readFileSync } from "node:fs";
import { describe, it, assert } from "./runner.mjs";

const read = (p) => readFileSync(p, "utf8");
const has = (src, re, why) => assert(re.test(src), why);

describe("store-wiring", () => {
  it("src/store-ui.ts：storeUIFor 接了 busy / showNotice / sheets(lockSyncGate + settleSyncGate) / reportError / stemOf", () => {
    const s = read("src/store-ui.ts");
    has(s, /storeUIFor\(\{/, "storeUI 必须由图库包的 storeUIFor 装配（冲突面 / 逃生闸 / 补推进度都在里面）");
    for (const k of ["busy", "showNotice", "reportError", "stemOf"]) has(s, new RegExp(`\\b${k}\\b`), `storeUIFor 缺 ${k}`);
    has(s, /sheets:\s*\{\s*lockSyncGate,\s*settleSyncGate\s*\}/, "sheets 必须是真的 gate sheet（lockSyncGate + settleSyncGate），不许 stub");
    has(s, /from "\.\/ui\/sheets\.ts"/, "lockSyncGate / settleSyncGate 必须来自 src/ui/sheets.ts（锁屏、不可 dismiss）");
    has(s, /from "\.\/app\/report-error\.ts"/, "reportError 必须是 app 唯一漏斗 src/app/report-error.ts");
    has(s, /onReplayStatus:\s*\(\{ phase, name, done, total \}\)/, "offlineUploadReplay:\"auto\" 要求 onReplayStatus（库 createStore 当场抛；补推进度 / 撞名要 surface）");
    has(s, /\.\.\.base,/, "storeUI 以 storeUIFor 的结果为底（busy 路由 / 冲突面 / 逃生闸都来自包）");
  });
  it("src/ui/sheets.ts：gate 不可 dismiss（没有背板点关 / Esc 关）、busy 可重入", () => {
    const s = read("src/ui/sheets.ts");
    const gate = s.slice(s.indexOf("export function lockSyncGate"), s.indexOf("export function unlockSyncGate"));
    assert(!/Escape|pointerdown|backdrop/.test(gate), "lockSyncGate 里不许有 Esc / 背板关闭（冲突面必须选一个）");
    has(s, /busyDepth\+\+/, "withBusy 要 ref-count（store 内部会嵌套 busy）");
  });
  it("src/app-store.ts：createStore 每个必填表态都在、validateAdopt 真查 zip 魔数、不是 placeholder", () => {
    const s = read("src/app-store.ts");
    for (const f of ["provider: od.provider", "ui: storeUI", "appId: APP_ID", 'persistence: "app-managed"', "encryption: appEncryption", 'reconcilePolicy: "app-driven"', "docKinds: DOC_KINDS", "signedIn:", "activeIdentifier:", 'offlineUploadReplay: "auto"']) has(s, new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `createStore 缺 ${f}`);
    has(s, /validateAdopt:[^\n]*0x50[^\n]*0x4b[^\n]*0x03[^\n]*0x04/, "validateAdopt 必须查 zip 魔数 PK\\x03\\x04（captive portal 的 200 HTML 不许盖掉本地唯一好副本）");
    assert(!/validateAdopt:\s*\(\)\s*=>\s*true/.test(s), "validateAdopt 不许 () => true");
    has(s, /authority: AUTHORITY/, "provider 必须带 authority（家规 #7 personal only）");
  });
  it("src/config.ts：scope 永远只有 AppFolder、authority = consumers（家规 #6 / #7）", () => {
    const s = read("src/config.ts");
    has(s, /SCOPES = \["Files\.ReadWrite\.AppFolder", "offline_access"\]/, "SCOPES 必须恰好是 AppFolder + offline_access");
    assert(!/Files\.ReadWrite"|Files\.Read"|Files\.ReadWrite\.All/.test(s), "不许申请全盘 scope");
    has(s, /AUTHORITY = "https:\/\/login\.microsoftonline\.com\/consumers"/, "authority 必须是 /consumers（/common 禁止）");
  });
  it("src/gallery-host.ts：缩略图派生缓存只叫 moonsinger-thumbs、只给 song 种类、fetch 走 store getPeek（source 透传）", () => {
    const s = read("src/gallery-host.ts");
    has(s, /THUMB_DB = "moonsinger-thumbs"/, "派生 IDB 名字必须是 moonsinger-thumbs（CLAUDE.md 持久层白名单登记的那个）");
    has(s, /thumbs:\s*\{\s*kinds:\s*\["song"\],\s*dbName:\s*THUMB_DB,\s*fetch:\s*\(id, source\) => zipFile\(id\)\.getPeek\(\{[^}]*source\s*\}\)/, "thumbs.fetch 必须把 source 原样递给 getPeek（cloud 绝不落回本地）");
    has(s, /reportError: \(e, level\) => reportError\(e, level \?\? "error"\)/, "图库的 reportError 必须进 app 漏斗");
  });
  it("src/app/main.ts：editor-session 接的是 store.zip、takeCloud 重载走同一条 adopt 管线、pushOn 含 exit", () => {
    const s = read("src/app/main.ts");
    has(s, /store: \{ file: \(name, o\) => requireStore\(\)\.zip\(name, \{ mode: o\.mode \}\) \}/, "editor-session 的 StoreLike 必须包 store.zip（0.16.1：zip 种类才有 getPeek / 尾读）");
    has(s, /pushOn: \["exit"/, "policy.pushOn 必须含 exit（退出 / 换歌时推云）");
    has(s, /adopt: async \(blob\) => \{ const id = pendingOpenId \?\? doc\.identifier/, "adapter.adopt 要能在 takeCloud 重载（没有 pendingOpenId）时用 doc.identifier");
    has(s, /files\.dirty\.pushAll\(\)/, "登录后必须 pushAll（0.15.1：at-rest 字节直推）");
    has(s, /drainOfflineQueue\(\)/, "登录后必须回放离线队列");
  });
});
