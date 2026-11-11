import { type GalleryView, type AsideKind, type AsideScope } from "@internal/gallery";
import "./library-home.ts";
import { type RenderCache } from "./app/render-cache.ts";
export interface GalleryHostDeps {
    activeIdentifier: () => string | null;
    /** 打开一个身份（歌库点卡片）。返回 true = 编辑器已切过去。 */
    openAny: (identifier: string) => Promise<boolean>;
    /** 打开中的那首被歌库挪了夹（字节已在新身份下）：编辑器放下旧身份、按新身份重开（绝不把旧名字写回去）。 */
    setIdentifier: (identifier: string) => void;
    /** 编辑器自己的改名 UI；返回新身份，没改 → null。 */
    renameActive: () => Promise<string | null>;
    pushNow: () => Promise<void>;
    flushLocal: () => Promise<void>;
    /** 「新建」：在歌库里新建一首（空谱）并打开。 */
    newSong: () => Promise<void>;
    openSettings: () => void;
    /** 「即兴」（原「乐器」，v0.9.41 user「gallery乐器改成即兴」）：歌库上面开乐器目录，只弹着玩、不写进哪首歌（user 2026-10-08「歌库应该有一个专门的乐器目录的入口」）。 */
    openInstruments: () => void;
    /** 云按钮：登录 / 退出 / 账号（宿主的 auth 菜单）。 */
    openCloudMenu: (anchor: HTMLElement) => void;
    /** 顶上挂什么（没有家的披露 / 文件夹权限掉了 / 还有旧歌没搬；一处判定，住 main.ts）。null = 不挂。 */
    homeBar: () => {
        text: string;
        buttons: {
            v: string;
            label: string;
        }[];
    } | null;
    /** 顶上那条的钮。**点击同步栈里调**（选文件夹 / 再授权要手势）。 */
    homeAction: (v: string) => void;
    /** 文件夹当家时的名字（不是 = null）：云按钮换成文件夹按钮。 */
    homeLabel: () => string | null;
    openHomeMenu: () => void;
    /** 这台设备上记着的渲好的声音（src/app/render-cache.ts）：封面上的 ▶ 认它的挂名，点了从它那里取字节。 */
    renders: Pick<RenderCache, "linkOf" | "take" | "onChange">;
    /** 卡片上点「渲染」（v0.16.101）：编辑器在后台打开这首、渲一遍记在设备上（歌库一屏一直盖着）。返回 true = 记下了、挂到这首上了。 */
    renderInLibrary: (identifier: string) => Promise<boolean>;
    onOpened?: () => void;
    onClosed?: () => void;
}
export declare function initGalleryHost(d: GalleryHostDeps): {
    open: () => Promise<void>;
    close: () => void;
    isOpen: () => boolean;
    renderCloud: () => void;
    openAttention: () => Promise<void>;
    /** 换了家（store 换了实例）：图库的订阅要重来（下次开 = 回根 + 重新列）。 */
    noteStoreChanged: () => void;
    setAttentionOnly: (on: boolean) => void | undefined;
    /** boot 用：上次是在歌库里离开的（刷新 / 关标签 / SW 更新重载）。 */
    wasInGallery: () => boolean;
    refresh: () => void | undefined;
    setView: (v: GalleryView) => void;
    getView: () => GalleryView;
    emptyAside: (kind: AsideKind, scope: AsideScope) => void;
    currentFolder: () => string;
    /** 封面变了（存了新封面）：丢掉这首歌的缩略图缓存，下次露面重取。 */
    invalidateThumb: (id: string) => void;
    /** 这首歌的事实重取（设备上记着的声音挂到它名下了 / 摘了：老缓存里的事实可能没有文件戳）。 */
    invalidateFacts: (id: string) => void;
    /** 修改锁（gallery 0.9.x 的动词，成没成它自己会说）：解锁 = **只许门的钮调**（src/app/edit-lock-door.ts；歌库卡片的菜单是图库库自己的入口）。 */
    unlockEdit: (id: string) => Promise<boolean>;
    saveVersionThenUnlock: (id: string) => Promise<boolean>;
    /** 「锁上」：调用方已经把改动存好了。 */
    lockEdit: (id: string) => Promise<void>;
    /** 封面上在放的那首 / 播放器状态（E2E 用）。 */
    playing: () => string | null;
    playerState: () => import("./app/song-player.ts").SongPlayerState;
};
export type GalleryHost = ReturnType<typeof initGalleryHost>;
