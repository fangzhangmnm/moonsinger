import type { RenderCacheStore } from "./render-cache.ts";
/** 浏览器里的存储口。库懒开（第一次用才开；开过就留着这一个连接）。 */
export declare function idbRenderStore(): RenderCacheStore;
