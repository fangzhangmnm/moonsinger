import { type GalleryEntry } from "@internal/gallery";
/** 这里能不能选文件夹当歌库的家。 */
export declare const canPickFolder: () => boolean;
/** 选夹（**必须在点击的同步栈里调**：FSA 要手势）。同一个夹二挂 = 复用名册条目（isSameEntry）。取消 = null。 */
export declare function pickFolderHome(): Promise<GalleryEntry | null>;
/** 权限：granted = true；request = 手势里可以问一次；否则 false（= 离线态：缓存照看，改动攒在本机）。 */
export declare function folderPermission(entry: GalleryEntry, o: {
    request: boolean;
}): Promise<boolean>;
/** 开机：上次挂着的文件夹（没有 = null）。 */
export declare function lastFolderHome(): Promise<GalleryEntry | null>;
/** 记下「现在的家是它」（簿记，不承重：失败只影响下次开机要不要自己挂）。 */
export declare const touchFolderHome: (id: string) => Promise<void>;
/** 离开文件夹当家：下次开机不自动挂（名册条目留着，再选同一个夹复用；夹里的文件一个不动）。 */
export declare const clearFolderHome: () => Promise<void>;
export type { GalleryEntry };
