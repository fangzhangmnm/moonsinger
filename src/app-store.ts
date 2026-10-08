// app-store.ts —— @internal/store 在本仓的**唯一值级 import 点**（接缝；test/redline-guard.test.mjs + scripts/build.sh 守着）。created 2026-10-08 by Claude Fable 5.1
//   照 WebXiaoHeiWu src/app-store.ts（0.16.1 形）。家规：OneDrive 只要 AppFolder、只认 personal 账号（../CLAUDE.md 硬规则 #6 / #7）；
//   身份 / 字节 / 云访问全走库，app 层不碰 localStorage / IDB / MSAL / Graph（device 层标量走 src/device-kv.ts）。
//   store **懒建**（attachStore）：没进过歌库的设备 = 无地模式（v0.3.0），不开 IDB、不载 MSAL（user 2026-10-01「用户有意图才弄」）；
//   进过一次（device-kv storeAttached）以后开局就建，且**先建 store 再 initAuth**（CatsUp 2026-09-22 教训：没建 store 时库的报错是 no-op，登录回跳失败人看不到）。
import { createStore, createOneDriveProvider, requestStoragePersistence, isCached, isDirty, withStemTail } from "@internal/store";
import type { Store, OneDriveAuth, CloudProvider } from "@internal/store";
import { APP_ID, CLIENT_ID, AUTHORITY, SCOPES, MSAL_URL } from "./config.ts";
import { DOC_KINDS } from "./identifiers.ts";
import { storeUI } from "./store-ui.ts";
import { appEncryption } from "./encryption.ts";
import { deviceKvGet, deviceKvSet } from "./device-kv.ts";

const od = createOneDriveProvider({ clientId: CLIENT_ID, scopes: SCOPES, authority: AUTHORITY, msalUrl: MSAL_URL });
/** OneDrive 登录态（initAuth / signIn / signOut / onAuthChanged）。MSAL 脚本在 initAuth 时才载。 */
export const auth: OneDriveAuth = od.auth;

let _activeIdentifier: string | null = null;
/** 当前打开的歌的身份（cloud-gone 去抖绝不动它）。 */
export function setActiveIdentifier(id: string | null): void { _activeIdentifier = id; }

const KV_ATTACHED = "storeAttached";
/** 这台设备进过歌库没有（进过 = 以后开局就建 store）。 */
export const storeWasAttached = (): boolean => deviceKvGet(KV_ATTACHED) === "1";

let _store: Store | null = null, _signedIn: () => boolean = () => od.auth.isSignedIn();
/** 登录着没有（= store 的 signedIn 表态；E2E 的 mock 云下 = 页面全局 `__moonsingerCloudSignedIn`，reload 后回到未登录、和真机 initAuth 之前一样）。app 层一律问这个，别直接问 auth。 */
export const isSignedIn = (): boolean => _signedIn();
/** 只给 E2E（test/e2e/sync.mjs）：页面开局前（addInitScript）塞一朵 mock 云——@internal/store/testing 的 provider 住 node 侧、经 RPC 桥进页面，
 *  reload / 两个浏览器 context（= 两台设备）共用同一朵云。**只在本机地址上认**（127.0.0.1 / localhost），线上页面这条路不存在。 */
function injectedCloud(): CloudProvider | null {
  const g = globalThis as { __moonsingerCloud?: CloudProvider; location?: { hostname: string } };
  return g.__moonsingerCloud && /^(127\.0\.0\.1|localhost)$/.test(g.location?.hostname ?? "") ? g.__moonsingerCloud : null;
}
/** 建 store（幂等）。第一次要在用户手势里调（attach 的时候顺便 requestStoragePersistence）。 */
export function attachStore(): Store {
  if (_store) return _store;
  const inj = injectedCloud();
  if (inj) _signedIn = () => (globalThis as { __moonsingerCloudSignedIn?: boolean }).__moonsingerCloudSignedIn === true;
  _store = createStore({
    provider: inj ?? od.provider,
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
    signedIn: () => _signedIn(),
    activeIdentifier: () => _activeIdentifier,
  });
  deviceKvSet(KV_ATTACHED, "1");
  return _store;
}
export const hasStore = (): boolean => _store != null;
/** 拿 store；没建就抛（调用方先 attachStore）。 */
export function requireStore(): Store {
  if (!_store) throw new Error("store not attached yet (call attachStore() first)");
  return _store;
}
export async function disposeStore(): Promise<void> { const s = _store; _store = null; if (s) await s.dispose(); }
/** 拆库（退出登录时，同 WeebPaint「主动断开 = 卸库 + 退出登录」）：放掉 store 对象 + 这台设备不再开局就建 store。**IDB 里的歌不删**——再进歌库 attachStore 就接上。 */
export async function detachStore(): Promise<void> { await disposeStore(); deviceKvSet(KV_ATTACHED, null); }

export { requestStoragePersistence, isCached, isDirty, withStemTail };
export type { Store, OneDriveAuth };
