// store 接线守卫（结构性）：冲突面 / 报错 / busy 三条线在建 store 时就接好，一条都不许空着（user 2026-10-08「冲突面照家规 必须做的非常严格…不要发生没有接线的情况」）。
// created 2026-10-08 by Claude Fable 5.1。不跑浏览器：读源码断言形状——改了接线形状就来这里同步，别把守卫改松。
import { readFileSync } from "node:fs";
import { describe, it, assert } from "./runner.mjs";

const read = (p) => readFileSync(p, "utf8");
const has = (src, re, why) => assert(re.test(src), why);
/** 去掉注释（行注释 + 块注释），只看代码。 */
const code = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

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
    for (const f of ["provider: inj ?? od.provider", "ui: storeUI", "appId: APP_ID", 'persistence: "app-managed"', "encryption: appEncryption", 'reconcilePolicy: "app-driven"', "docKinds: DOC_KINDS", "signedIn: () => _signedIn()", "activeIdentifier:", 'offlineUploadReplay: "auto"']) has(s, new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `createStore 缺 ${f}`);
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
  it("src/gallery-host.ts：缩略图派生缓存只叫 moonsinger-5b1e7c0a92d34f6e.thumbs、只给 song 种类、fetch 走 store getPeek（source 透传）", () => {
    const s = read("src/gallery-host.ts");
    // 2026-11-03 改名（家族工单 A2 ⑤，Fable 裁定：<app>-<guid>.<用途>）：名字住 config.ts CACHE_DBS，这里钉「引的是它」+「它就是登记的那个名字」，强度不变
    has(s, /THUMB_DB = CACHE_DBS\.thumbs;/, "派生 IDB 名字必须取 config.ts CACHE_DBS.thumbs（CLAUDE.md 持久层白名单登记的那个）");
    has(read("src/config.ts"), /APP_NS = "moonsinger-5b1e7c0a92d34f6e";[\s\S]*CACHE_DBS = \{ thumbs: `\$\{APP_NS\}\.thumbs`/, "CACHE_DBS.thumbs 必须是 moonsinger-5b1e7c0a92d34f6e.thumbs");
    has(s, /thumbs:\s*\{\s*kinds:\s*\["song"\],\s*dbName:\s*THUMB_DB,\s*galleryId:\s*storeKey,\s*fetch:\s*\(id, source\) => zipFile\(id\)\.getPeek\(\{[^}]*source\s*\}\)/, "thumbs.fetch 必须把 source 原样递给 getPeek（cloud 绝不落回本地）");
    has(s, /reportError: \(e, level\) => reportError\(e, level \?\? "error"\)/, "图库的 reportError 必须进 app 漏斗");
  });
  it("src/app/main.ts：editor-session 接的是 store.zip、takeCloud 重载走同一条 adopt 管线、pushOn 含 exit", () => {
    const s = read("src/app/main.ts");
    has(s, /store: \{ file: \(name, o\) => \{ const f = requireStore\(\)\.zip\(name, \{ mode: o\.mode \}\);/, "editor-session 的 StoreLike 必须包 store.zip（0.16.1：zip 种类才有 getPeek / 尾读）");
    has(s, /diagNote\("sync", `push \$\{name\}/, "每次推的结果（pushed / reason / resolution）要进黑匣子");
    has(s, /pushOn: \["exit"/, "policy.pushOn 必须含 exit（退出 / 换歌时推云）");
    // 2026-11-09（保存排队那一刀）：装进来的字节是谁的 = editor-session 给的名字；app 不再自己猜（以前读 pendingOpenId ?? H.identifier() 两个全局）
    has(s, /adopt: async \(blob, name\) => \{ adoptStoreBytes\(name, /, "adapter.adopt 必须用 editor-session 给的名字（第二个参数）");
    assert(!/pendingOpenId/.test(s), "pendingOpenId 已经退场：排队之后 open(B) 会等在 A 的保存后面，A 的「云端覆盖本地」重载不能读到 B");
    // 快照 = encode 的同步前缀；要等的东西放 prepare（editor-session 在记名字之前等）
    has(s, /prepare: \(\) => refHost\.settled\(\),/, "参考窗的卡还在编 = 在 prepare 里等");
    has(s, /encode: async \(\) => \{ encodedSnap = D\.savedMark\(\); const bytes = await encoder\.encode\(/, "encode 里 encoder.encode() 之前不许有 await（快照必须在同步前缀里取）");
    has(s, /onSaved: \(name\) => \{ const cur = H\.identifier\(\) === name; if \(cur && encodedSnap\) D\.adoptSaved\(encodedSnap\); encodedSnap = null;/, "「已存」的基线只记给还开着的那一首");
    // adapter 的回调里不许 await / 调 editor-session 自己的入口（队里的自己等队尾的自己 = 卡死）
    { const a = s.indexOf("const es = createEditorSession({"), b = s.indexOf("policy: { autosaveMs: LOCAL_SAVE_DEBOUNCE_MS", a); assert(a > 0 && b > a, "找到 es 的配置块"); assert(!/\bes\./.test(code(s.slice(a + 10, b))), "es 的 adapter 回调里出现了 es.xxx"); }
    has(s, /files\.dirty\.pushAll\(\)/, "登录后必须 pushAll（0.15.1：at-rest 字节直推）");
    has(s, /drainOfflineQueue\(\)/, "登录后必须回放离线队列");
  });
  it("保存排队的两个前提：传网盘带超时（不然挂住的那一个堵死整条队）；记名字到取快照之间没有 await", () => {
    const a = read("src/app-store.ts");
    has(a, /const GRAPH_TRANSPORT: GraphTransportOptions = \{ timeouts: DEFAULT_GRAPH_TIMEOUTS, chunkResume: true, verifyChunkedCommit: true \};/, "传输层：超时（库的推荐值）+ 一块没传成接着传 + 提交前再核一次（user 11-09「两个都开 好」；和 WeebPaint / KudsRocket 同一套）");
    has(a, /createOneDriveProvider\(\{[^}]*transport: GRAPH_TRANSPORT \}\)/, "OneDrive provider 必须带 transport（超时）");
    const e = read("src/editor-session/editor-session.ts");
    const i = e.indexOf("const name = _name, gen = _gen;"), j = e.indexOf("await editor.encode()", i);
    assert(i > 0 && j > i, "找到记名字和取快照的那两行");
    assert(!/\bawait\b/.test(code(e.slice(i, j))), "记下「存给谁」和调 encode() 取快照之间出现了 await：这段时间身份可以被换掉");
    assert(!/_saving\s*=/.test(e), "单飞锁（_saving）不许回来：有人在存 ≠ 我存完了");
  });
});
