import { type Deployment } from "./deployment.ts";
export interface DeploymentPolicy {
    /** 网盘（OneDrive 登录 / 同步）：false = 不 initAuth、不载 MSAL，歌库里的云入口画灰 + 「去官网」。 */
    readonly cloud: boolean;
    /** 离线壳（service worker）：false = 不注册。 */
    readonly serviceWorker: boolean;
    /** 「完整版在官网」那一句（开局一行 + 灰入口的副标题；网址 = config.ts SITE_URL）。 */
    readonly siteHint: boolean;
    /** 本地文件夹当歌库的家（规则书 §2：官网 ✓ / itch ✗ / 备用版 ✓；工单 H3）。还要浏览器给选夹框、没被套着（library-home.ts canPickFolder）。 */
    readonly folderGallery: boolean;
    /** 歌库。MoonSinger 自己的键（2026-11-03 Fable 裁定，家族工单 A2 ④，H3 改）：itch 里歌没有浏览器外的家（选不了夹、没有网盘；和所有游戏共用存储 + 试用版）→ 入口画灰 +「去官网」，
     *  存 = 下载 / 开 = 选文件照旧；备用版有文件夹这个家。别拿 cloud 兼任。 */
    readonly library: boolean;
}
/** §2 表的一列。 */
export declare function policy(d: Deployment): DeploymentPolicy;
/** 这一页的开关（= policy(deployment())）。 */
export declare function currentPolicy(): DeploymentPolicy;
