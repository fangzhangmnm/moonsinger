interface LocalEntry {
    sha256: string;
    bytes: number;
    parts: number;
}
interface LocalBundle {
    files: Record<string, LocalEntry>;
    threads: Record<string, string>;
}
/** 备用版打包时烤进 index.html 的清单（<script type="application/json" id="ms-local">）：文件的哈希 / 大小 / 几片 + 后台线程的代码。 */
export declare function localBundle(): LocalBundle | null;
/** 站点里的一个路径（index.html 永远在站点根：官网 / dev / itch 的 zip / 备用版文件夹）。 */
export declare function siteUrl(path: string): URL;
/** 资源是不是就在本地文件夹里（备用版）：家族共用的 Cache Storage（pwa-models / pwa-sounds）在 file: 里写不进，
 *  界面上「下载 / 导入模型包」「下载留着」这些动作在这里没有意义（设置页按它画灰）。 */
export declare function resourcesInFolder(): boolean;
export interface GetOpts {
    sha256?: string;
    onProgress?: (done: number, total: number) => void;
    /** 每次都向站点核一遍这个文件变了没有（HTTP 条件请求，没变 = 304 不重下）。给「名字不带哈希、内容却会随版本变」的 app 自带文件用：
     *  不然更新之后浏览器的 HTTP 缓存还能把旧的那份再交出来几分钟（GitHub Pages 给 10 分钟）。2026-11-08 Fable：合成器 wasm 打了补丁、文件名没变。 */
    revalidate?: boolean;
}
/** 站点里那一份字节（官网 / itch = fetch；备用版 = 老实脚本）。给了 sha256 / 备用版 = 核过才交出。 */
export declare function getBytes(path: string, opts?: GetOpts): Promise<Uint8Array>;
export declare function getText(path: string, opts?: GetOpts): Promise<string>;
export declare function getJson<T>(path: string, opts?: GetOpts): Promise<T>;
export {};
