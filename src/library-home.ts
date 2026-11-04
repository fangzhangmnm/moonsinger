// library-home.ts —— 歌库的家：选文件夹 + 这台设备的名册（家族规则书 §1 第 13 条「库必须有家：网盘或本地文件夹」）。created 2026-11-03 by Claude Opus 5.5（家族工单 H3）
//   照 WeebPaint src/gallery-connect.ts + @internal/gallery 的 galleryRegistry（名册 = device-local，永不同步；句柄 structured clone 进自家前缀的小 IDB）。
//   MoonSinger 同一时刻只挂一个家，不做 WeebPaint 的多库切换（挂 / 卸在 main.ts ensureAttached / leaveHome）。
//   哪里能选夹：policy.folderGallery（官网 / 备用版 ✓、itch ✗）+ 没被套着（跨源 iframe 弹不出选夹框）+ 浏览器有 showDirectoryPicker（桌面 Chromium）。
//   开机只 query 权限、永不弹框；再授权必须在手势里（WeebPaint 同）。
import { configureGalleryRegistry, galleryRegistry, type GalleryEntry, type DirHandleLike } from "@internal/gallery";
import { APP_DB_PREFIX } from "./config.ts";
import { deviceKvGet, deviceKvSet } from "./device-kv.ts";
import { currentPolicy } from "./deployment-policy.ts";
import { embedded } from "./deployment.ts";

// 名册的库名归宿主（gallery 0.8.7）：自家 GUID 前缀（家族命名规矩；还原出厂按前缀删得到）。import 本身零 IDB 访问。
configureGalleryRegistry({ dbName: `${APP_DB_PREFIX}gallery-registry` });

/** 这台设备选过文件夹没有：没选过就不开名册的 IDB（没进过歌库的设备不碰存储，user 2026-10-01「用户有意图才弄」）。 */
const KV_FOLDER_USED = "folderHomeUsed";
type Picker = (o?: unknown) => Promise<unknown>;
const picker = (): Picker | undefined => (globalThis as { showDirectoryPicker?: Picker }).showDirectoryPicker;

/** 这里能不能选文件夹当歌库的家。 */
export const canPickFolder = (): boolean => currentPolicy().folderGallery && !embedded() && typeof picker() === "function";

/** 选夹（**必须在点击的同步栈里调**：FSA 要手势）。同一个夹二挂 = 复用名册条目（isSameEntry）。取消 = null。 */
export function pickFolderHome(): Promise<GalleryEntry | null> {
  const pick = picker();
  if (!pick) return Promise.reject(new Error("this browser cannot pick a folder (no File System Access)"));
  const asked = pick({ mode: "readwrite" });   // 同步起跳，别放到 await 后面
  return (async () => {
    let handle: unknown;
    try { handle = await asked; } catch { return null; }   // AbortError = 人取消了，不是错误
    const entry = await galleryRegistry.mintFolder(handle as DirHandleLike);
    deviceKvSet(KV_FOLDER_USED, "1");
    return entry;
  })();
}

type PermHandle = { queryPermission?: (o: { mode: string }) => Promise<string>; requestPermission?: (o: { mode: string }) => Promise<string> };
/** 权限：granted = true；request = 手势里可以问一次；否则 false（= 离线态：缓存照看，改动攒在本机）。 */
export async function folderPermission(entry: GalleryEntry, o: { request: boolean }): Promise<boolean> {
  const h = entry.handle as unknown as PermHandle | undefined;
  try {
    if (!h?.queryPermission) return true;   // 没有权限 API 的平台 / 假件 = 视为可用
    if ((await h.queryPermission({ mode: "readwrite" })) === "granted") return true;
    if (o.request && h.requestPermission) return (await h.requestPermission({ mode: "readwrite" })) === "granted";
    return false;
  } catch { return false; }
}

/** 开机：上次挂着的文件夹（没有 = null）。 */
export async function lastFolderHome(): Promise<GalleryEntry | null> {
  if (deviceKvGet(KV_FOLDER_USED) !== "1") return null;
  const e = await galleryRegistry.lastActive();
  return e?.kind === "folder" && e.handle ? e : null;
}
/** 记下「现在的家是它」（簿记，不承重：失败只影响下次开机要不要自己挂）。 */
export const touchFolderHome = (id: string): Promise<void> => galleryRegistry.touch(id);
/** 离开文件夹当家：下次开机不自动挂（名册条目留着，再选同一个夹复用；夹里的文件一个不动）。 */
export const clearFolderHome = (): Promise<void> => galleryRegistry.clearLastActive();
export type { GalleryEntry };
