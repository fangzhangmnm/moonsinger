// deployment-policy.ts —— 家族规则书 §2「部署方式 × 行为」那张表的机械版（纯函数；test/deployment.test.ts 逐格钉死）。created 2026-11-03 by Claude Opus 5.5
//   宿主按这里的开关接线（规则书 §1 第 11 条：开关传进 store / 图库的配置，store 不 import 这里）；消费者只问「能不能」，不问「是哪种」。
//   **每个开关都必须有真消费者**（规则书 §4 第 13 项；守卫 = test/deployment.test.ts「每个键在本文件以外至少被读到一次」）。
//
//   §2 表里本 app 用不上的一列不进来（进来就是没人读的假开关）：
//     · rememberPassword（记住口令）—— MoonSinger 不加密，没有口令。
//   以后哪天做了，再按 §2 加键 + 接消费者。
//   §2 里不是开关的行（作品的家、崩溃影子、重资源从哪来、读出来重核哈希、Safari 那句）归深模块自己按 deployment() 挑：
//   resources.ts / threads.ts / persistence.ts。
import { deployment, type Deployment } from "./deployment.ts";

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

const TABLE: Readonly<Record<Deployment, DeploymentPolicy>> = {
  site:  { cloud: true,  serviceWorker: true,  siteHint: false, folderGallery: true,  library: true },
  itch:  { cloud: false, serviceWorker: false, siteHint: true,  folderGallery: false, library: false },
  local: { cloud: false, serviceWorker: false, siteHint: true,  folderGallery: true,  library: true },
};

/** §2 表的一列。 */
export function policy(d: Deployment): DeploymentPolicy { return TABLE[d]; }
/** 这一页的开关（= policy(deployment())）。 */
export function currentPolicy(): DeploymentPolicy { return TABLE[deployment()]; }
