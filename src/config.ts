// config.ts —— 常量 SSoT（人类拍过板的数字都在这里，别散在各处）。created 2026-10-08 by Claude Fable 5.1（抄 WebXiaoHeiWu src/config.ts 的形状）
//
// OneDrive：scope 永久 AppFolder（家规硬规则 #6）；authority /consumers = personal-account-only（硬规则 #7；Entra 注册「MoonSinger」= Personal Microsoft accounts only，
//   user 2026-10-08 注册并给了 client id）。翻注册 audience 与改 authority 必须成对做。
export const APP_ID = "moonsinger";   // 本 origin 内唯一命名空间：IDB `moonsinger.*` + localStorage 前缀。2026-10-11 起 origin = sing.weebpaint.com（自己独占）；之前是和 WXHW / JRB / CatsUp 等兄弟共用的 fangzhangmnm.github.io，旧箱子里的数据仍用这个前缀。有数据后永不改
export const CLIENT_ID = "ce612efe-ea39-4a52-872d-550cd9f7d71b";   // Entra「MoonSinger」（= OneDrive `Apps/MoonSinger` 文件夹名）
export const AUTHORITY = "https://login.microsoftonline.com/consumers";
export const SCOPES = ["Files.ReadWrite.AppFolder", "offline_access"];
export const MSAL_URL = "./vendor/msal/msal-browser.min.js";

/** 歌的文档种类（store 0.16 docKinds）：一首歌 = 一个 `.mxl`（MusicXML 压缩包，别的乐谱软件也能开；自家的东西在里面的 `.moonsinger/`）。 */
export const SONG_SUFFIX = ".mxl";
/** 本 app 私有库的 GUID 前缀（家族命名规矩「<app>-<guid>.<用途>」）：gallery-registry 等归这个前缀；device-kv 的键前缀是同一个 GUID（`moonsinger-5b1e7c0a92d34f6e:`）。
 *  还原出厂（src/app/factory-reset.ts）按它删自家的库。added 2026-10-21 by Claude Fable 5.1 */
export const APP_DB_PREFIX = "moonsinger-5b1e7c0a92d34f6e.";

// ── 节律（2026-10-08 晚起 = WeebPaint 的 consent 制：推云只在换歌 / 退出 / 按「存」/ 进歌库；平时只落本机。
//    user「用weebpaint方案，对付大歌，这不是txt」——歌是整个 .mxl（封面、以后还有音源），15 s 一推太勤。原来的 15 s 防抖 / 30 s 心跳（WXHW 制）撤了）──
/** 编辑 → 本地落盘（IDB）防抖：正文改了 2 s 后落本机（「•」= 还没落）。 */
export const LOCAL_SAVE_DEBOUNCE_MS = 2_000;
/** 挂机很久醒来先核云端、再放行输入（家族周账 F-67 / KudsRocket W-25；user 2026-10-15「就是防止一个挂机了一年的设备误覆盖新版本」）：
 *  离开前台超过这么久回来 = 同步闸先锁住输入、核完云端再放开。短暂切走不锁（每次切 tab 都弹太烦）。数是 AI 起的（10 分钟），user 可改。added 2026-10-21 by Claude Fable 5.1 */
export const WAKE_CHECK_AFTER_MS = 10 * 60_000;
/** 醒来那次核对最多让人等多久：超时闸先放开（核对在后台接着跑，真有新版本到了照样锁到重载完）。 */
export const WAKE_CHECK_TIMEOUT_MS = 20_000;
