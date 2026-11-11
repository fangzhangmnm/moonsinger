export declare const SITE_HOST: string;
/** 文案表（人话；网址都从 SITE_URL / REPORT_URL 插）。 */
export declare const SITE_TEXT: {
    itchLine: string;
    localLine: string;
    untested: string;
    degraded: string;
    cloudOff: string;
    cloudOffTitle: string;
    libOffTitle: string;
    libSiteTitle: string;
    noShell: string;
    libNoFolderTitle: string;
    goSite: string;
    report: string;
};
/** 备用版设置页里画灰的那几行的说明（模型 / 音源就在文件夹里；后台线程存不住念缓存）。 */
export declare const FOLDER_TEXT: {
    models: string;
    sounds: string;
    speech: string;
};
/** 开局那一行（只在 siteHint 开着时；一页只说一次）。存储开局就不可用（Safari 双击）= 换成「没测过」那一句 + 报告入口。 */
export declare function showSiteHint(): void;
/** 半路写不进存储：说一次（任何部署方式都可能）。 */
export declare function watchStorageHealth(): void;
/** 点了灰着的歌库钮：说一句为什么 + 「去官网」（不弹窗，同开局那一行）。 */
export declare function showLibraryOff(): void;
/** 灰掉的网盘入口旁边的副标题（链接到官网）。 */
export declare function cloudOffHtml(): string;
