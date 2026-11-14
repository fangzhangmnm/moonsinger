import { requestStoragePersistence, isCached, isDirty, withStemTail, wipeAppNamespace, scanAppNamespace, WipeConsentError } from "@internal/store";
import type { Store, OneDriveAuth, Collection } from "@internal/store";
import type { GalleryEntry } from "./library-home.ts";
/** 这个部署方式有没有网盘（家族规则书 §2：itch / 备用版没有）。开关的唯一来源 = deployment-policy；宿主的灰入口也读它。 */
export declare const cloudAvailable: () => boolean;
export declare const auth: OneDriveAuth;
/** 当前打开的歌的身份（cloud-gone 去抖绝不动它）。 */
export declare function setActiveIdentifier(id: string | null): void;
/** 这台设备进过歌库没有（进过 = 以后开局就建 store）。 */
export declare const storeWasAttached: () => boolean;
/** 这台设备不再把旧库当歌库开（选了文件夹当家：开机走文件夹；旧库里剩的歌走搬家）。 */
export declare function forgetLegacyAttach(): void;
/** 登录着没有（= store 的 signedIn 表态；E2E 的 mock 云下 = 页面全局 `__moonsingerCloudSignedIn`，reload 后回到未登录、和真机 initAuth 之前一样）。app 层一律问这个，别直接问 auth。 */
export declare const isSignedIn: () => boolean;
/** 歌库的家（家族规则书 §1 第 13 条）。没有家不建 store：只有用户选了家（或开机恢复上次的家）才走到 attachStore。 */
export type StoreHome = {
    kind: "cloud";
} | {
    kind: "folder";
    entry: GalleryEntry;
};
/** 现在挂的文件夹（没挂文件夹 = null）。 */
export declare const folderHome: () => GalleryEntry | null;
/** 文件夹的权限在不在（false = 离线态：本机缓存照看、改动攒着，等人点一下再授权；不算没有家）。 */
export declare const folderOnline: () => boolean;
export declare function setFolderOnline(v: boolean): void;
/** 这台设备的 MSAL 里有账号（登录探测的结果，main.ts 记；不新增存储）。 */
export declare function noteCloudAccount(known: boolean): void;
export declare const cloudAccountKnown: () => boolean;
/** 家在网盘上（闸门只管这个）。 */
export declare const hasCloudHome: () => boolean;
/** **有没有家：全 app 就这一处判**（规则书第 13 条；守卫：库入口不许各处自己看 signedIn）。 */
export declare const hasHome: () => boolean;
/** 歌库的另一头现在连得上吗（文件夹 = 权限在；网盘 = 闸门 / 网）。 */
export declare const homeOnline: () => boolean;
/** 建 store（幂等）。第一次要在用户手势里调（attach 的时候顺便 requestStoragePersistence）。 */
export declare function attachStore(home?: StoreHome): Store;
/** 库建好 / 要拆时通知（跟着歌库走的设置用：src/app/account-prefs.ts，main.ts 接；v0.17.46）。拆的通知在 dispose **之前**：之后再碰收藏夹库会抛。 */
export interface StoreLifecycle {
    attached(s: Store): void;
    disposing(): void;
}
/** 登记一个（登记时库已经建好 = 马上补一次 attached）。 */
export declare function onStoreLifecycle(h: StoreLifecycle): void;
/** 问云端一次（闸门「离线继续」期间静默再试用）：真走一趟网，名字不存在 = 云端答了 null，也算通；不通 = 抛。**不经 store**：选了离线时 store 不出网。同 WeebPaint。 */
export declare function cloudReachable(): Promise<void>;
/** 这台设备上有没有旧库的 IndexedDB（只看名字，不开库）。浏览器不给列举 = 看 storeAttached。 */
export declare function legacyLibraryExists(): Promise<boolean>;
/** 搬家 / 导出用：开一个只读本机的旧库实例（**永远离线**：一条网都不打，不会把删除排上云）。用完调用方 dispose。现在挂着旧库时先放下（同一个库不开两份）。 */
export declare function openLegacyLibrary(): Store;
/** 从文件夹**真的读**一个身份的字节（搬家核对用：不经 store 的本机缓存）。没有 = null。 */
export declare function readFromFolder(entry: GalleryEntry, identifier: string): Promise<Uint8Array | null>;
export declare const hasStore: () => boolean;
/** 拿 store；没建就抛（调用方先 attachStore）。 */
export declare function requireStore(): Store;
export declare function disposeStore(): Promise<void>;
/** 拆库（退出登录 / 离开文件夹，同 WeebPaint「主动断开 = 卸库 + 退出登录」）：放掉 store 对象 + 这台设备不再开局就建 store。**IDB 里的歌不删**——再连上同一个家就接上。 */
export declare function detachStore(): Promise<void>;
export { requestStoragePersistence, isCached, isDirty, withStemTail };
/** 还原出厂（src/app/factory-reset.ts）用的库口子：深清本 appId 的全部命名空间 / 无痕扫残留（同 WeebPaint：maintenance 面经接缝）。2026-10-21 */
export { wipeAppNamespace, scanAppNamespace, WipeConsentError };
export type { Store, OneDriveAuth, Collection };
