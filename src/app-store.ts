// app-store.ts —— @internal/store 在本仓的**唯一值级 import 点**（接缝；test/redline-guard.test.mjs + scripts/build.sh 守着）。created 2026-10-08 by Claude Fable 5.1
//   照 WebXiaoHeiWu src/app-store.ts（0.16.1 形）。家规：OneDrive 只要 AppFolder、只认 personal 账号（../CLAUDE.md 硬规则 #6 / #7）；
//   身份 / 字节 / 云访问全走库，app 层不碰 localStorage / IDB / MSAL / Graph（device 层标量走 src/device-kv.ts）。
//   家（H3，规则书第 13 条）：网盘（OneDrive provider）或本地文件夹（folder provider，「folder 就是另一朵云」，照 WeebPaint）；hasHome() 全 app 一处判。
//   store **懒建**（attachStore）：没进过歌库的设备 = 无地模式（v0.3.0），不开 IDB、不载 MSAL（user 2026-10-01「用户有意图才弄」）；
//   进过一次（device-kv storeAttached）以后开局就建，且**先建 store 再 initAuth**（CatsUp 2026-09-22 教训：没建 store 时库的报错是 no-op，登录回跳失败人看不到）。
import { createStore, createOneDriveProvider, createFolderProvider, requestStoragePersistence, isCached, isDirty, withStemTail, wipeAppNamespace, scanAppNamespace, WipeConsentError, DEFAULT_GRAPH_TIMEOUTS } from "@internal/store";
import type { Store, OneDriveAuth, CloudProvider, GraphTransportOptions } from "@internal/store";
import { APP_ID, CLIENT_ID, AUTHORITY, SCOPES, MSAL_URL } from "./config.ts";
import { DOC_KINDS } from "./identifiers.ts";
import { storeUI } from "./store-ui.ts";
import { appEncryption } from "./encryption.ts";
import { deviceKvGet, deviceKvSet } from "./device-kv.ts";
import { currentPolicy } from "./deployment-policy.ts";
import { cloudOnline } from "./cloud-gate.ts";
import type { GalleryEntry } from "./library-home.ts";

/** 传网盘的每个请求带超时（user 2026-11-09「给传网盘的请求加超时 修」；库的推荐值，同 WeebPaint / KudsRocket：问一句 30 s / 传一块 2 min / 取一段 1 min / 整份 15 min）。
 *  以前没有超时：iPad 锁屏后还在路上的请求常常永远挂着，保存就停在那一下，之后的自动存全都悄悄不做，直到刷新页面。
 *  v0.16.51 起保存排队（src/editor-session），挂住的那一个会把换歌也堵住——所以超时是排队的前提，两样一起上。到点 = 这一次按没传成算，下次再传。
 *  v0.16.53 起另外两个开关也开了（user 11-09「两个都开 好」；画画 / 火箭同一套）：chunkResume = 分块上传一块没传成（含超时）问会话传到哪了、退避、接着传，不整份重来——
 *  歌带着音源子集和定稿的 mp3，几兆到几十兆，正是分块那一档；verifyChunkedCommit = 提交最后一块前再核一次云端版本（多一个 GET，只在分块上传时），
 *  防上传这几十秒里另一台设备改了云端那份、被这次上传盖掉（云端不丢歌那一级的护栏）。added by Claude Fable 5.1 2026-11-09 */
const GRAPH_TRANSPORT: GraphTransportOptions = { timeouts: DEFAULT_GRAPH_TIMEOUTS, chunkResume: true, verifyChunkedCommit: true };
const od = createOneDriveProvider({ clientId: CLIENT_ID, scopes: SCOPES, authority: AUTHORITY, msalUrl: MSAL_URL, transport: GRAPH_TRANSPORT });
/** 这个部署方式有没有网盘（家族规则书 §2：itch / 备用版没有）。开关的唯一来源 = deployment-policy；宿主的灰入口也读它。 */
export const cloudAvailable = (): boolean => currentPolicy().cloud;
/** OneDrive 登录态（initAuth / signIn / signOut / onAuthChanged）。MSAL 脚本在 initAuth 时才载（signIn / retrySilentSignIn 里面也走 initAuth）。
 *  **网盘关着（itch / 备用版）= 这三个口子不碰 MSAL**：不 initAuth、不载脚本、不跳微软（规则书 §4 第 5 项；itch 夹具看网络里没有 msal 请求）。
 *  包在这一处 = 以后谁在别处新加一个登录调用也载不进来。2026-11-03 */
/** 只给 E2E（test/e2e/gate.mjs）：页面开局前塞一个假登录（有账号 / 续签成败 / 挂起）。同 injectedCloud：只在本机地址上认，线上页面这条路不存在。 */
function injectedAuth(): OneDriveAuth | null {
  const g = globalThis as { __moonsingerAuth?: OneDriveAuth; location?: { hostname: string } };
  return g.__moonsingerAuth && /^(127\.0\.0\.1|localhost)$/.test(g.location?.hostname ?? "") ? g.__moonsingerAuth : null;
}
export const auth: OneDriveAuth = injectedAuth() ?? (cloudAvailable() ? od.auth : {
  ...od.auth,
  isAuthConfigured: () => false,
  initAuth: async () => ({ signedIn: false, account: null, notConfigured: true }),
  signIn: async () => { throw new Error("cloud sign-in is not available in this deployment (itch / offline copy)"); },
  retrySilentSignIn: async () => false,
} as OneDriveAuth);

let _activeIdentifier: string | null = null;
/** 当前打开的歌的身份（cloud-gone 去抖绝不动它）。 */
export function setActiveIdentifier(id: string | null): void { _activeIdentifier = id; }

const KV_ATTACHED = "storeAttached";
/** 这台设备进过歌库没有（进过 = 以后开局就建 store）。 */
export const storeWasAttached = (): boolean => deviceKvGet(KV_ATTACHED) === "1";
/** 这台设备不再把旧库当歌库开（选了文件夹当家：开机走文件夹；旧库里剩的歌走搬家）。 */
export function forgetLegacyAttach(): void { deviceKvSet(KV_ATTACHED, null); }

let _store: Store | null = null, _signedIn: () => boolean = () => od.auth.isSignedIn();
/** 登录着没有（= store 的 signedIn 表态；E2E 的 mock 云下 = 页面全局 `__moonsingerCloudSignedIn`，reload 后回到未登录、和真机 initAuth 之前一样）。app 层一律问这个，别直接问 auth。 */
export const isSignedIn = (): boolean => _signedIn();
/** 只给 E2E（test/e2e/sync.mjs）：页面开局前（addInitScript）塞一朵 mock 云——@internal/store/testing 的 provider 住 node 侧、经 RPC 桥进页面，
 *  reload / 两个浏览器 context（= 两台设备）共用同一朵云。**只在本机地址上认**（127.0.0.1 / localhost），线上页面这条路不存在。 */
function injectedCloud(): CloudProvider | null {
  const g = globalThis as { __moonsingerCloud?: CloudProvider; location?: { hostname: string } };
  return g.__moonsingerCloud && /^(127\.0\.0\.1|localhost)$/.test(g.location?.hostname ?? "") ? g.__moonsingerCloud : null;
}
/** **`createStore` 只在这一处调**（家族 library-needs-a-home §5 守卫：test/library-home.test.mjs），provider 非空。 */
function buildStore(o: { provider: CloudProvider; signedIn: () => boolean; isOnline: () => boolean; databaseId?: string }): Store {
  return createStore({
    provider: o.provider,
    ...(o.databaseId ? { databaseId: o.databaseId } : {}),
    ui: storeUI,
    appId: APP_ID,
    persistence: "app-managed",          // app 在进歌库 / 首存的手势里调 requestStoragePersistence()
    encryption: appEncryption,           // 零 codec（不加密）；store 0.7.0 起必填表态
    reconcilePolicy: "app-driven",       // 图库包的轮询 / focus 对齐归 app
    // 采纳云端字节前的有效性闸：一首歌 = 一个 .mxl = zip（PK\x03\x04）。captive portal 的 200 HTML 永远不许盖掉本地唯一好副本。
    validateAdopt: async (plain) => { if (plain.size < 22) return false; const h = new Uint8Array(await plain.slice(0, 4).arrayBuffer()); return h[0] === 0x50 && h[1] === 0x4b && h[2] === 0x03 && h[3] === 0x04; },
    docKinds: DOC_KINDS,
    autoCacheOpenedFile: true,           // 编辑器：打开就留本地（离线能开）
    offlineUploadReplay: "auto",         // 离线新建的歌回线自动补推（ADR-0018；进度走 storeUI.onReplayStatus）
    signedIn: o.signedIn,
    isOnline: o.isOnline,
    activeIdentifier: () => _activeIdentifier,
    // store 2.3.x（v0.16.95，2026-11-10，Claude Fable 5.2；家族修改锁标准第七节）：星 / 收起的记号——库自己的一份同步文件 `.<appId>/store.file-marks.json`（持久层白名单表里归 store 那一行）。
    //   加了星的送不进回收站（file.trash 抛 StarredError，歌库的面自己说）。**`lockByDefault` 还没开**：修改锁五道接好、验过之后才开（设计稿第十节第 9 步）。
    fileMarks: true,
  });
}
/** 歌库的家（家族规则书 §1 第 13 条）。没有家不建 store：只有用户选了家（或开机恢复上次的家）才走到 attachStore。 */
export type StoreHome = { kind: "cloud" } | { kind: "folder"; entry: GalleryEntry };
let _home: StoreHome | null = null, _folderOnline = true, _cloudAccount = false;
/** 现在挂的文件夹（没挂文件夹 = null）。 */
export const folderHome = (): GalleryEntry | null => (_home?.kind === "folder" ? _home.entry : null);
/** 文件夹的权限在不在（false = 离线态：本机缓存照看、改动攒着，等人点一下再授权；不算没有家）。 */
export const folderOnline = (): boolean => _folderOnline;
export function setFolderOnline(v: boolean): void { _folderOnline = v; }
/** 这台设备的 MSAL 里有账号（登录探测的结果，main.ts 记；不新增存储）。 */
export function noteCloudAccount(known: boolean): void { _cloudAccount = known; }
export const cloudAccountKnown = (): boolean => _cloudAccount;
/** 家在网盘上（闸门只管这个）。 */
export const hasCloudHome = (): boolean => _home?.kind === "cloud" && (_cloudAccount || _signedIn());
/** **有没有家：全 app 就这一处判**（规则书第 13 条；守卫：库入口不许各处自己看 signedIn）。 */
export const hasHome = (): boolean => folderHome() != null || hasCloudHome();
/** 歌库的另一头现在连得上吗（文件夹 = 权限在；网盘 = 闸门 / 网）。 */
export const homeOnline = (): boolean => (folderHome() ? _folderOnline : cloudOnline());
/** 建 store（幂等）。第一次要在用户手势里调（attach 的时候顺便 requestStoragePersistence）。 */
export function attachStore(home: StoreHome = { kind: "cloud" }): Store {
  if (_store) return _store;
  _home = home;
  if (home.kind === "folder") {
    if (!home.entry.handle) throw new Error("folder home has no handle");
    _signedIn = () => true;   // 文件夹 = 本地即在线；权限掉了 = isOnline 假（WeebPaint 同）
    _store = buildStore({ provider: createFolderProvider(home.entry.handle as unknown as Parameters<typeof createFolderProvider>[0]) as unknown as CloudProvider, signedIn: () => true, isOnline: () => _folderOnline, databaseId: home.entry.dbId });
    return _store;
  }
  const inj = injectedCloud();
  _signedIn = inj ? () => (globalThis as { __moonsingerCloudSignedIn?: boolean }).__moonsingerCloudSignedIn === true : () => od.auth.isSignedIn();
  _store = buildStore({ provider: inj ?? od.provider, signedIn: () => _signedIn(), isOnline: cloudOnline });   // isOnline：2026-11-03 闸门：选了「离线继续」= 库一条网都不打（家族设计稿 cloud-gate §3；store 2.2.4 起 collection 也认）
  deviceKvSet(KV_ATTACHED, "1");
  return _store;
}
/** 问云端一次（闸门「离线继续」期间静默再试用）：真走一趟网，名字不存在 = 云端答了 null，也算通；不通 = 抛。**不经 store**：选了离线时 store 不出网。同 WeebPaint。 */
export async function cloudReachable(): Promise<void> { await (injectedCloud() ?? od.provider).getItemByPath(".reachable-probe"); }
/** 旧的「只在浏览器里」的歌库的库名（默认 databaseId：以前没登录也能建的就是它）。 */
const LEGACY_DB = `${APP_ID}.defaultStore`;
/** 这台设备上有没有旧库的 IndexedDB（只看名字，不开库）。浏览器不给列举 = 看 storeAttached。 */
export async function legacyLibraryExists(): Promise<boolean> {
  try { const r = await scanAppNamespace(APP_ID); return r.databasesSupported ? r.databases.includes(LEGACY_DB) : storeWasAttached(); }
  catch { return storeWasAttached(); }
}
/** 搬家 / 导出用：开一个只读本机的旧库实例（**永远离线**：一条网都不打，不会把删除排上云）。用完调用方 dispose。现在挂着旧库时先放下（同一个库不开两份）。 */
export function openLegacyLibrary(): Store {
  return buildStore({ provider: injectedCloud() ?? od.provider, signedIn: () => false, isOnline: () => false });
}
/** 从文件夹**真的读**一个身份的字节（搬家核对用：不经 store 的本机缓存）。没有 = null。 */
export async function readFromFolder(entry: GalleryEntry, identifier: string): Promise<Uint8Array | null> {
  const p = createFolderProvider(entry.handle as unknown as Parameters<typeof createFolderProvider>[0]);
  const it = await p.getItemByPath(identifier);
  if (!it) return null;
  return new Uint8Array(await (await p.download(it.ref)).arrayBuffer());
}
export const hasStore = (): boolean => _store != null;
/** 拿 store；没建就抛（调用方先 attachStore）。 */
export function requireStore(): Store {
  if (!_store) throw new Error("store not attached yet (call attachStore() first)");
  return _store;
}
export async function disposeStore(): Promise<void> { const s = _store; _store = null; _home = null; _folderOnline = true; if (s) await s.dispose(); }
/** 拆库（退出登录 / 离开文件夹，同 WeebPaint「主动断开 = 卸库 + 退出登录」）：放掉 store 对象 + 这台设备不再开局就建 store。**IDB 里的歌不删**——再连上同一个家就接上。 */
export async function detachStore(): Promise<void> { await disposeStore(); deviceKvSet(KV_ATTACHED, null); }

export { requestStoragePersistence, isCached, isDirty, withStemTail };
/** 还原出厂（src/app/factory-reset.ts）用的库口子：深清本 appId 的全部命名空间 / 无痕扫残留（同 WeebPaint：maintenance 面经接缝）。2026-10-21 */
export { wipeAppNamespace, scanAppNamespace, WipeConsentError };
export type { Store, OneDriveAuth };
