/** 收藏夹的名字（库存成 `.moonsinger/synced-user-preference.json`；同画画软件那一份的叫法）。 */
export declare const ACCOUNT_SHELF = "synced-user-preference";
/** 跟着歌库走的键（= 设备键值里的名字 = 收藏夹里的项名）。 */
export declare const ACCOUNT_KEYS: readonly string[];
/** 收藏夹要用到的三个口（库的 Collection 结构上满足）。 */
export interface Shelf {
    getEntry(id: string): {
        value: unknown;
    } | undefined;
    setItem(id: string, value: unknown): void;
    onChange(cb: (changedIds: string[]) => void): () => void;
}
/** 设备键值（读 / 写；null = 删掉这一项）。 */
export interface DeviceSide {
    get(key: string): string | null;
    set(key: string, value: string | null): void;
}
/** 连上歌库那一下做了什么。pushed = 设备的存进了歌库；adopted = 照歌库改了设备；unreadable = 歌库里这一项读不懂（两边都没动）。 */
export interface ConnectReport {
    pushed: string[];
    adopted: string[];
    unreadable: string[];
}
export interface AccountPrefs {
    /** 改一项（人点的那一下）：设备上写，连着歌库就也写进歌库。null = 没选。 */
    write(key: string, value: string | null): void;
    /** 接上歌库的收藏夹（库建好、收藏夹装好本机那份之后）：从这一刻起写都进歌库，还不比较。 */
    bind(shelf: Shelf): void;
    /** 规则甲（问过一次云端之后）：cloudKnown = 这一次确实问到了歌库那头（没问到 = 只照歌库里已有的，不往里存，免得拿设备的盖掉还没拉下来的）。 */
    connect(cloudKnown: boolean): ConnectReport;
    /** 拆掉歌库（退出登录 / 换库 / 离开文件夹）：之后只写设备；设备上留着最后的值。 */
    unbind(): void;
    /** 连着歌库时，别处（另一台设备）改了某几项、拉下来了：设备副本已经改好，回调拿到改了的键。 */
    onRemote(cb: (keys: string[]) => void): void;
    /** 现在连着歌库吗。 */
    bound(): boolean;
}
export declare function createAccountPrefs(device: DeviceSide, keys?: readonly string[]): AccountPrefs;
