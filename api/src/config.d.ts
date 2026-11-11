export declare const APP_ID = "moonsinger";
export declare const CLIENT_ID = "ce612efe-ea39-4a52-872d-550cd9f7d71b";
export declare const AUTHORITY = "https://login.microsoftonline.com/consumers";
export declare const SCOPES: string[];
export declare const MSAL_URL = "./vendor/msal/msal-browser.min.js";
/** 官网网址（家族规则书 §1 第 6 条：一个 app 一处常量，「去官网」的文案都插这个，不许散在 UI 字符串里）。added 2026-11-03 by Claude Opus 5.5 */
export declare const SITE_URL = "https://sing.weebpaint.com";
/** 「没测过 + 报告入口」那一句的报告入口（规则书 §1 第 12 条；= 本仓公开的 GitHub issues）。added 2026-11-03 by Claude Opus 5.5 */
export declare const REPORT_URL = "https://github.com/fangzhangmnm/moonsinger/issues";
/** 歌的文档种类（store 0.16 docKinds）：一首歌 = 一个 `.mxl`（MusicXML 压缩包，别的乐谱软件也能开；自家的东西在里面的 `.moonsinger/`）。 */
export declare const SONG_SUFFIX = ".mxl";
/** 本 app 私有库的 GUID 前缀（家族命名规矩「<app>-<guid>.<用途>」）：gallery-registry 等归这个前缀；device-kv 的键前缀是同一个 GUID（`moonsinger-5b1e7c0a92d34f6e:`）。
 *  还原出厂（src/app/factory-reset.ts）按它删自家的库。added 2026-10-21 by Claude Fable 5.1 */
export declare const APP_NS = "moonsinger-5b1e7c0a92d34f6e";
export declare const APP_DB_PREFIX = "moonsinger-5b1e7c0a92d34f6e.";
/** 自家派生缓存库（全删可再生）。2026-11-03 起按家族规则书 §1 第 3 条的形状 `<app>-<guid>.<用途>`（Fable 裁定，家族工单 A2 ⑤）；建库处（gallery-host / singer worker）和还原出厂都读这一处。 */
export declare const CACHE_DBS: {
    readonly thumbs: "moonsinger-5b1e7c0a92d34f6e.thumbs";
    readonly facts: "moonsinger-5b1e7c0a92d34f6e.facts";
    readonly speech: "moonsinger-5b1e7c0a92d34f6e.speech";
    readonly renders: "moonsinger-5b1e7c0a92d34f6e.renders";
};
/** 改名前的老名字：不搬（都是可再生的派生物，搬 = 配额双倍压力），空闲片里探到就删（factory-reset.ts dropLegacyCacheDbs）。 */
export declare const LEGACY_CACHE_DBS: readonly ["moonsinger-thumbs", "moonsinger-facts", "moonsinger-speech"];
/** 编辑 → 本地落盘（IDB）防抖：正文改了 2 s 后落本机（「•」= 还没落）。 */
export declare const LOCAL_SAVE_DEBOUNCE_MS = 2000;
/** 挂机很久醒来先核云端、再放行输入（家族周账 F-67 / KudsRocket W-25；user 2026-10-15「就是防止一个挂机了一年的设备误覆盖新版本」）：
 *  离开前台超过这么久回来 = 同步闸先锁住输入、核完云端再放开。短暂切走不锁（每次切 tab 都弹太烦）。数是 AI 起的（10 分钟），user 可改。added 2026-10-21 by Claude Fable 5.1 */
export declare const WAKE_CHECK_AFTER_MS: number;
/** 闸门问云端的硬超时（家族设计稿 cloud-gate §4：≥ 8 s 没回 = 当没网进闸；数字可调，艺术类 app 不要更短）。 */
export declare const CLOUD_CHECK_TIMEOUT_MS = 8000;
/** 点「有新版本 · 刷新」：重载前先推这么久（家族周账 F-147 B）。推不完也照样重载：字节已经落本机，下次开再推。 */
export declare const RELOAD_PUSH_TIMEOUT_MS = 5000;
