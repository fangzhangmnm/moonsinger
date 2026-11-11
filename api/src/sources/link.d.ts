/** 换好的下载计划。url = 真正去拿的地址；shown = 人给的原链接（问的时候给人看）；host = 给人看的网站名。 */
export interface LinkPlan {
    url: string;
    shown: string;
    host: string;
    via: "bare" | "dropbox" | "github" | "gist" | "onedrive";
    name: string | null;
}
export type LinkResult = LinkPlan | {
    error: string;
};
/** 一首歌文件最多多大（带着打包的音源和参考窗的也够；再大多半不是歌）。 */
export declare const LINK_MAX_BYTES: number;
/** 网址里的 `file=` 那一段（没有 = null）。两种写法都认：
 *  · 编码过的（`?file=https%3A%2F%2F…`）= 到下一个 & 为止、解码；
 *  · 没编码的（`?file=dropbox.com/scl/fi/…?rlkey=…&dl=0`）= `file=` 后面整段都算链接（它自己的 & 参数也在里面），所以 file= 要放最后。 */
export declare function linkParam(href: string): string | null;
/** 网址去掉 file= 那一段（打开过一次就从地址栏拿掉，刷新不再问）。file= 后面整段都算链接，所以连同后面的一起去掉。 */
export declare function withoutLinkParam(href: string): string;
/** 人给的链接 → 去哪拿。只认 https；http 只认本机（localhost / 127.0.0.1，开发和测试用——不看这一页自己的协议：那归 deployment.ts，test/deployment.test.mjs 守）。 */
export declare function planLink(raw: string): LinkResult;
/** 拿回来的字节像什么：zip（.mxl）/ xml（没压缩的 MusicXML）/ html（多半是网盘的网页，不是文件）/ other。 */
export declare function sniff(bytes: Uint8Array): "zip" | "xml" | "html" | "other";
/** 给读歌那一层的文件名：链接里看得出名字就用它，看不出 = 按内容给一个。 */
export declare const fileNameFor: (plan: LinkPlan, kind: "zip" | "xml") => string;
export interface FetchOpts {
    max?: number;
    onProgress?: (got: number, total: number | null) => void;
    signal?: AbortSignal;
    fetchImpl?: typeof fetch;
}
/** 下载。只读 GET、不带登录信息和来源页；超过上限就停（先看 Content-Length，没有就边读边数）。失败 = 抛错，话是给人看的。 */
export declare function fetchLink(plan: LinkPlan, o?: FetchOpts): Promise<Uint8Array>;
